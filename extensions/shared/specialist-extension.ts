/**
 * Shared factory for creating specialist extensions.
 *
 * Each specialist only needs to provide a SpecialistExtensionConfig
 * (prompt config + tool metadata). The factory handles the full
 * delegation lifecycle: packet creation, validation, subprocess
 * spawning, output parsing, and result assembly.
 */

import type { ExtensionAPI, ExtensionContext, AgentToolResult, AgentToolUpdateCallback } from "@mariozechner/pi-coding-agent";
import { Type, type Static } from "@sinclair/typebox";
import { createTaskPacket, createResultPacket, validateTaskPacket, validateResultPacket } from "./packets.js";
import { spawnSpecialistAgent } from "./subprocess.js";
import { parseSpecialistOutput } from "./result-parser.js";
import { buildSpecialistSystemPrompt, buildSpecialistTaskPrompt, type SpecialistPromptConfig } from "./specialist-prompt.js";

export interface SpecialistExtensionConfig {
  /** Prompt configuration (role, working style, constraints, anti-patterns) */
  promptConfig: SpecialistPromptConfig;
  /** Tool name registered with Pi (e.g. "delegate-to-builder") */
  toolName: string;
  /** Human-readable tool label (e.g. "Delegate to Builder") */
  toolLabel: string;
  /** Tool description shown to the orchestrator LLM */
  toolDescription: string;
}

const DelegateParams = Type.Object({
  objective: Type.String({ description: "What the specialist should accomplish" }),
  allowedReadSet: Type.Array(Type.String(), { description: "Files the specialist may read" }),
  allowedWriteSet: Type.Array(Type.String(), { description: "Files the specialist may modify" }),
  acceptanceCriteria: Type.Array(Type.String(), { description: "Criteria for success" }),
  context: Type.Optional(Type.Record(Type.String(), Type.Unknown(), { description: "Additional context" })),
  sourceAgent: Type.Optional(Type.String({ description: "ID of the delegating agent", default: "orchestrator" })),
});

type DelegateParamsType = Static<typeof DelegateParams>;

/**
 * Create a Pi extension function for a specialist.
 *
 * Returns a function suitable for use as a Pi extension's default export.
 * The extension registers a single delegation tool that handles the full
 * packet lifecycle.
 *
 * @example
 * ```ts
 * import { createSpecialistExtension } from "../../shared/specialist-extension.js";
 * import { BUILDER_CONFIG } from "./config.js";
 *
 * export default createSpecialistExtension(BUILDER_CONFIG);
 * ```
 */
export function createSpecialistExtension(config: SpecialistExtensionConfig) {
  const { promptConfig, toolName, toolLabel, toolDescription } = config;
  const agentId = promptConfig.id;

  return function specialistExtension(pi: ExtensionAPI) {
    pi.registerTool({
      name: toolName,
      label: toolLabel,
      description: toolDescription,
      parameters: DelegateParams,

      async execute(
        toolCallId: string,
        params: DelegateParamsType,
        signal: AbortSignal | undefined,
        onUpdate: AgentToolUpdateCallback | undefined,
        ctx: ExtensionContext
      ): Promise<AgentToolResult<unknown>> {
        // 1. Create and validate the task packet
        const taskPacket = createTaskPacket({
          objective: params.objective,
          allowedReadSet: params.allowedReadSet,
          allowedWriteSet: params.allowedWriteSet,
          acceptanceCriteria: params.acceptanceCriteria,
          context: params.context,
          targetAgent: agentId,
          sourceAgent: params.sourceAgent || "orchestrator",
        });

        const taskErrors = validateTaskPacket(taskPacket);
        if (taskErrors.length > 0) {
          return {
            content: [{ type: "text", text: `Task packet validation failed:\n${taskErrors.join("\n")}` }],
            details: { error: "validation_failed", errors: taskErrors },
          };
        }

        // 2. Build prompts
        const systemPrompt = buildSpecialistSystemPrompt(promptConfig);
        const taskPrompt = buildSpecialistTaskPrompt(taskPacket);

        // 3. Spawn the specialist sub-agent
        let subAgentResult;
        try {
          subAgentResult = await spawnSpecialistAgent(systemPrompt, taskPrompt, signal);
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          const failurePacket = createResultPacket({
            taskId: taskPacket.id,
            status: "failure",
            summary: `${promptConfig.roleName} sub-agent failed to start: ${errorMsg}`,
            deliverables: [],
            modifiedFiles: [],
            sourceAgent: agentId,
          });
          return {
            content: [{ type: "text", text: JSON.stringify(failurePacket) }],
            details: { resultPacket: failurePacket },
          };
        }

        // 4. Handle process-level failures
        if (subAgentResult.exitCode !== 0 && !subAgentResult.finalText) {
          const failurePacket = createResultPacket({
            taskId: taskPacket.id,
            status: "failure",
            summary: `${promptConfig.roleName} process exited with code ${subAgentResult.exitCode}. ${subAgentResult.stderr || "No additional details."}`,
            deliverables: [],
            modifiedFiles: [],
            sourceAgent: agentId,
          });
          return {
            content: [{ type: "text", text: JSON.stringify(failurePacket) }],
            details: { resultPacket: failurePacket },
          };
        }

        // 5. Parse specialist output into structured result
        const { result: parsed } = parseSpecialistOutput(subAgentResult.finalText, agentId);

        // 6. Create and validate the result packet
        const resultPacket = createResultPacket({
          taskId: taskPacket.id,
          status: parsed.status,
          summary: parsed.summary,
          deliverables: parsed.deliverables,
          modifiedFiles: parsed.modifiedFiles,
          escalation: parsed.escalation,
          sourceAgent: parsed.sourceAgent,
        });

        const resultErrors = validateResultPacket(resultPacket);
        if (resultErrors.length > 0) {
          const fallbackPacket = createResultPacket({
            taskId: taskPacket.id,
            status: "failure",
            summary: `Result packet validation failed: ${resultErrors.join("; ")}`,
            deliverables: [],
            modifiedFiles: [],
            sourceAgent: agentId,
          });
          return {
            content: [{ type: "text", text: JSON.stringify(fallbackPacket) }],
            details: { resultPacket: fallbackPacket, validationErrors: resultErrors },
          };
        }

        return {
          content: [{ type: "text", text: JSON.stringify(resultPacket) }],
          details: { resultPacket },
        };
      },
    });
  };
}
