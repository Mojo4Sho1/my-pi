/**
 * Builder Specialist Extension
 *
 * Registers a `delegate-to-builder` tool that:
 * - Accepts a TaskPacket (objective, allowed files, acceptance criteria)
 * - Launches an isolated Pi sub-agent process
 * - Injects the builder's working style from agents/specialists/builder.md
 * - Returns a structured ResultPacket
 *
 * Stage 2 deliverable — see docs/IMPLEMENTATION_PLAN.md
 */

import type { ExtensionAPI, ExtensionContext, AgentToolResult, AgentToolUpdateCallback } from "@mariozechner/pi-coding-agent";
import { Type, type Static } from "@sinclair/typebox";
import { createTaskPacket, createResultPacket, validateTaskPacket, validateResultPacket } from "../../shared/packets.js";
import { buildBuilderSystemPrompt, buildBuilderTaskPrompt } from "./prompt.js";
import { spawnBuilderAgent } from "./subprocess.js";
import { parseBuilderOutput } from "./result-parser.js";

const DelegateParams = Type.Object({
  objective: Type.String({ description: "What the builder should accomplish" }),
  allowedReadSet: Type.Array(Type.String(), { description: "Files the builder may read" }),
  allowedWriteSet: Type.Array(Type.String(), { description: "Files the builder may modify" }),
  acceptanceCriteria: Type.Array(Type.String(), { description: "Criteria for success" }),
  context: Type.Optional(Type.Record(Type.String(), Type.Unknown(), { description: "Additional context" })),
  sourceAgent: Type.Optional(Type.String({ description: "ID of the delegating agent", default: "orchestrator" })),
});

type DelegateParamsType = Static<typeof DelegateParams>;

export default function builderExtension(pi: ExtensionAPI) {
  pi.registerTool({
    name: "delegate-to-builder",
    label: "Delegate to Builder",
    description:
      "Delegate a bounded implementation task to the builder specialist. " +
      "The builder executes within explicit scope constraints and returns " +
      "a structured result packet.",
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
        targetAgent: "specialist_builder",
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
      const systemPrompt = buildBuilderSystemPrompt();
      const taskPrompt = buildBuilderTaskPrompt(taskPacket);

      // 3. Spawn the builder sub-agent
      let subAgentResult;
      try {
        subAgentResult = await spawnBuilderAgent(systemPrompt, taskPrompt, signal);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        const failurePacket = createResultPacket({
          taskId: taskPacket.id,
          status: "failure",
          summary: `Builder sub-agent failed to start: ${errorMsg}`,
          deliverables: [],
          modifiedFiles: [],
          sourceAgent: "specialist_builder",
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
          summary: `Builder process exited with code ${subAgentResult.exitCode}. ${subAgentResult.stderr || "No additional details."}`,
          deliverables: [],
          modifiedFiles: [],
          sourceAgent: "specialist_builder",
        });
        return {
          content: [{ type: "text", text: JSON.stringify(failurePacket) }],
          details: { resultPacket: failurePacket },
        };
      }

      // 5. Parse builder output into structured result
      const parsed = parseBuilderOutput(subAgentResult.finalText);

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
        // This shouldn't happen given our assembly logic, but be defensive
        const fallbackPacket = createResultPacket({
          taskId: taskPacket.id,
          status: "failure",
          summary: `Result packet validation failed: ${resultErrors.join("; ")}`,
          deliverables: [],
          modifiedFiles: [],
          sourceAgent: "specialist_builder",
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
}
