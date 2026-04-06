/**
 * Pi sub-agent process management for specialist extensions.
 *
 * Spawns an isolated Pi process in JSON output mode, parses the
 * event stream, and returns the final assistant text.
 */

import { spawn, type ChildProcess } from "child_process";
import type { TokenUsage } from "./types.js";

export interface SubAgentResult {
  exitCode: number;
  finalText: string;
  stderr: string;
  /** Token usage extracted from subprocess JSON events (if available) */
  tokenUsage?: TokenUsage;
}

const DEFAULT_TIMEOUT_MS = 120_000; // 2 minutes

/**
 * Spawn a Pi sub-agent with the given system and task prompts.
 * Returns the final assistant text output from the sub-agent.
 *
 * @param systemPrompt - Injected as the sub-agent's system prompt (-s flag)
 * @param taskPrompt - The task to execute (-p flag)
 * @param signal - Optional AbortSignal for cancellation
 * @param timeoutMs - Timeout in milliseconds (default: 120s)
 * @param model - Optional model identifier to pass via --model flag
 */
export function spawnSpecialistAgent(
  systemPrompt: string,
  taskPrompt: string,
  signal?: AbortSignal,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
  model?: string
): Promise<SubAgentResult> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("Aborted before spawn"));
      return;
    }

    let child: ChildProcess;
    try {
      const args = ["--print", "-s", systemPrompt, "-p", taskPrompt];
      if (model) {
        args.push("--model", model);
      }
      child = spawn(
        "pi",
        args,
        {
          stdio: ["ignore", "pipe", "pipe"],
        }
      );
    } catch (err) {
      reject(new Error(`Failed to spawn pi process: ${err}`));
      return;
    }

    let stdoutBuffer = "";
    let stderrBuffer = "";
    let finalText = "";
    let tokenUsage: TokenUsage | undefined;
    let settled = false;

    const settle = (result: SubAgentResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };

    // Timeout handling: SIGTERM, then SIGKILL after 5s
    const timer = setTimeout(() => {
      if (settled) return;
      child.kill("SIGTERM");
      setTimeout(() => {
        if (!settled) {
          child.kill("SIGKILL");
        }
      }, 5000);
    }, timeoutMs);

    // Abort signal forwarding
    const onAbort = () => {
      if (!settled) {
        child.kill("SIGTERM");
        setTimeout(() => {
          if (!settled) child.kill("SIGKILL");
        }, 5000);
      }
    };
    signal?.addEventListener("abort", onAbort, { once: true });

    child.stdout!.on("data", (chunk: Buffer) => {
      stdoutBuffer += chunk.toString();
      // Process complete lines
      let newlineIdx: number;
      while ((newlineIdx = stdoutBuffer.indexOf("\n")) !== -1) {
        const line = stdoutBuffer.slice(0, newlineIdx).trim();
        stdoutBuffer = stdoutBuffer.slice(newlineIdx + 1);
        if (!line) continue;
        try {
          const event = JSON.parse(line);
          // Collect final text from message_end events with assistant role
          if (
            event.type === "message_end" &&
            event.message?.role === "assistant" &&
            Array.isArray(event.message.content)
          ) {
            for (const block of event.message.content) {
              if (block.type === "text" && typeof block.text === "string") {
                finalText = block.text; // Keep last assistant text
              }
            }
          }

          if (event.type === "message_end" && event.message?.usage) {
            // Assumes Pi forwards Anthropic-style usage fields on message_end.
            const usage = event.message.usage;
            if (
              typeof usage.input_tokens === "number" &&
              typeof usage.output_tokens === "number"
            ) {
              tokenUsage = {
                inputTokens: usage.input_tokens,
                outputTokens: usage.output_tokens,
                totalTokens: usage.input_tokens + usage.output_tokens,
              };
            }
          }
        } catch {
          // Non-JSON line — skip silently
        }
      }
    });

    child.stderr!.on("data", (chunk: Buffer) => {
      stderrBuffer += chunk.toString();
    });

    child.on("error", (err) => {
      settle({
        exitCode: -1,
        finalText: "",
        stderr: `Spawn error: ${err.message}`,
        tokenUsage,
      });
    });

    child.on("close", (code) => {
      signal?.removeEventListener("abort", onAbort);
      settle({
        exitCode: code ?? -1,
        finalText,
        stderr: stderrBuffer,
        tokenUsage,
      });
    });
  });
}
