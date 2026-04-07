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

const DEFAULT_TIMEOUT_MS = 600_000; // 10 minutes — specialists run tools, edit files, and invoke builds

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
      // --mode json: emit JSONL events on stdout (required for parsing)
      // --print: run once and exit (non-interactive)
      // --system-prompt: inject specialist system prompt
      // positional arg: the task prompt
      const args = ["--mode", "json", "--print", "--system-prompt", systemPrompt];
      if (model) {
        args.push("--model", model);
      }
      args.push(taskPrompt);
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
          // Collect final text from assistant messages across multiple event types.
          // Pi emits: message_end (per-message), turn_end (per-turn), agent_end (session summary).
          // A multi-turn specialist (tool calls + final answer) may only have the final text
          // in the last message_end, turn_end, or agent_end event.
          const extractText = (msg: Record<string, unknown>): string | undefined => {
            if (msg?.role !== "assistant" || !Array.isArray(msg.content)) return undefined;
            for (const block of msg.content) {
              if (block.type === "text" && typeof block.text === "string" && block.text.trim()) {
                return block.text;
              }
            }
            return undefined;
          };

          if (event.type === "message_end" && event.message) {
            const text = extractText(event.message);
            if (text) finalText = text;
          }

          // turn_end carries the last assistant message for that turn
          if (event.type === "turn_end" && event.message) {
            const text = extractText(event.message);
            if (text) finalText = text;
          }

          // agent_end carries all messages — use the last assistant message
          if (event.type === "agent_end" && Array.isArray(event.messages)) {
            for (const msg of event.messages) {
              const text = extractText(msg as Record<string, unknown>);
              if (text) finalText = text;
            }
          }

          if (event.type === "message_end" && event.message?.usage) {
            // Pi uses { input, output, totalTokens } — not Anthropic-style { input_tokens, output_tokens }
            const usage = event.message.usage;
            const inputCount = typeof usage.input === "number" ? usage.input
              : typeof usage.input_tokens === "number" ? usage.input_tokens : undefined;
            const outputCount = typeof usage.output === "number" ? usage.output
              : typeof usage.output_tokens === "number" ? usage.output_tokens : undefined;
            if (inputCount !== undefined && outputCount !== undefined) {
              tokenUsage = {
                inputTokens: inputCount,
                outputTokens: outputCount,
                totalTokens: inputCount + outputCount,
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
