/**
 * Pi sub-agent process management for specialist extensions.
 *
 * Spawns an isolated Pi process in JSON output mode, parses the
 * event stream, and returns the final assistant text.
 */

import { spawn, type ChildProcess } from "child_process";
import type { TokenUsage } from "./types.js";
import { GLOBAL_RUN_REGISTRY } from "./run-registry.js";

export interface SubAgentResult {
  exitCode: number;
  finalText: string;
  stderr: string;
  /** Token usage extracted from subprocess JSON events (if available) */
  tokenUsage?: TokenUsage;
}

const DEFAULT_TIMEOUT_MS = 600_000; // 10 minutes — specialists run tools, edit files, and invoke builds

export interface SpawnSpecialistAgentOptions {
  parentRunId?: string;
  cwd?: string;
  label?: string;
  taskId?: string;
}

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
  model?: string,
  options?: SpawnSpecialistAgentOptions,
): Promise<SubAgentResult> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("Aborted before spawn"));
      return;
    }

    let child: ChildProcess;
    let runId: string | undefined;
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
    let currentMessageText = "";
    let tokenUsage: TokenUsage | undefined;
    let settled = false;
    let gracefulStopRequested = false;
    let forceStopRequested = false;

    const requestGracefulStop = () => {
      if (settled || gracefulStopRequested) return;
      gracefulStopRequested = true;
      if (runId) {
        GLOBAL_RUN_REGISTRY.markCanceling(runId);
      }
      child.kill("SIGTERM");
    };

    const requestForceStop = () => {
      if (settled || forceStopRequested) return;
      forceStopRequested = true;
      if (runId) {
        GLOBAL_RUN_REGISTRY.markCanceling(runId);
      }
      child.kill("SIGKILL");
    };

    const settle = (result: SubAgentResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };

    runId = GLOBAL_RUN_REGISTRY.registerRun({
      parentRunId: options?.parentRunId,
      kind: "subprocess",
      owner: "pi",
      cwd: options?.cwd,
      label: options?.label ?? "pi specialist subprocess",
      taskId: options?.taskId,
      initialState: "starting",
      handlers: {
        gracefulStop: () => {
          requestGracefulStop();
        },
        forceStop: () => {
          requestForceStop();
        },
      },
    }).id;
    GLOBAL_RUN_REGISTRY.markActive(runId);

    // Timeout handling: SIGTERM, then SIGKILL after 5s
    const timer = setTimeout(() => {
      if (settled) return;
      requestGracefulStop();
      setTimeout(() => {
        if (!settled) {
          requestForceStop();
        }
      }, 5000);
    }, timeoutMs);

    // Abort signal forwarding
    const onAbort = () => {
      if (!settled) {
        requestGracefulStop();
        setTimeout(() => {
          if (!settled) requestForceStop();
        }, 5000);
      }
    };
    signal?.addEventListener("abort", onAbort, { once: true });

    const extractText = (msg: Record<string, unknown>): string | undefined => {
      if (msg?.role !== "assistant" || !Array.isArray(msg.content)) return undefined;
      for (const block of msg.content) {
        if (block.type === "text" && typeof block.text === "string" && block.text.trim()) {
          return block.text;
        }
      }
      return undefined;
    };

    const processEvent = (event: Record<string, unknown>) => {
      // Reset accumulator at message boundaries
      if (event.type === "message_start") {
        currentMessageText = "";
      }

      // Accumulate text from streaming updates — Pi delivers content
      // incrementally via message_update, not in message_end
      if (event.type === "message_update") {
        const blocks = Array.isArray(event.content) ? event.content : [];
        for (const block of blocks) {
          if (
            (block as Record<string, unknown>).type === "text" &&
            typeof (block as Record<string, unknown>).text === "string"
          ) {
            currentMessageText += (block as Record<string, unknown>).text;
          }
        }
      }

      if (event.type === "message_end" && event.message) {
        // Prefer content from the message_end event itself; fall back to
        // text accumulated from message_update events
        const text =
          extractText(event.message as Record<string, unknown>) ||
          (currentMessageText.trim() ? currentMessageText : undefined);
        if (text) finalText = text;
        currentMessageText = "";
      }

      // turn_end carries the last assistant message for that turn
      if (event.type === "turn_end" && event.message) {
        const text = extractText(event.message as Record<string, unknown>);
        if (text) finalText = text;
      }

      // agent_end carries all messages — use the last assistant message
      if (event.type === "agent_end" && Array.isArray(event.messages)) {
        for (const msg of event.messages as Record<string, unknown>[]) {
          const text = extractText(msg);
          if (text) finalText = text;
        }
      }

      if (event.type === "message_end" && (event.message as Record<string, unknown>)?.usage) {
        // Pi uses { input, output, totalTokens } — not Anthropic-style { input_tokens, output_tokens }
        const usage = (event.message as Record<string, unknown>).usage as Record<string, unknown>;
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
    };

    child.stdout!.on("data", (chunk: Buffer) => {
      stdoutBuffer += chunk.toString();
      // Process complete lines
      let newlineIdx: number;
      while ((newlineIdx = stdoutBuffer.indexOf("\n")) !== -1) {
        const line = stdoutBuffer.slice(0, newlineIdx).trim();
        stdoutBuffer = stdoutBuffer.slice(newlineIdx + 1);
        if (!line) continue;
        try {
          processEvent(JSON.parse(line));
        } catch {
          // Non-JSON line — skip silently
        }
      }
    });

    child.stderr!.on("data", (chunk: Buffer) => {
      stderrBuffer += chunk.toString();
    });

    child.on("error", (err) => {
      if (runId) {
        GLOBAL_RUN_REGISTRY.markFailed(runId, err.message);
      }
      settle({
        exitCode: -1,
        finalText: "",
        stderr: `Spawn error: ${err.message}`,
        tokenUsage,
      });
    });

    child.on("close", (code) => {
      signal?.removeEventListener("abort", onAbort);
      // Flush any remaining buffered data — the last JSONL line (often
      // agent_end) may lack a trailing newline
      const remaining = stdoutBuffer.trim();
      if (remaining) {
        try {
          processEvent(JSON.parse(remaining));
        } catch {
          // Non-JSON remnant — skip
        }
      }
      if (runId) {
        if (forceStopRequested) {
          GLOBAL_RUN_REGISTRY.markKilled(runId);
        } else if (gracefulStopRequested) {
          GLOBAL_RUN_REGISTRY.markCanceled(runId);
        } else if ((code ?? -1) === 0) {
          GLOBAL_RUN_REGISTRY.markSettled(runId);
        } else {
          GLOBAL_RUN_REGISTRY.markFailed(runId, stderrBuffer || `exit code ${code ?? -1}`);
        }
      }
      settle({
        exitCode: code ?? -1,
        finalText,
        stderr: stderrBuffer,
        tokenUsage,
      });
    });
  });
}
