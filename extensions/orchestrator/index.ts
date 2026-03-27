/**
 * Orchestrator Extension
 *
 * Top-level control extension that:
 * - Selects appropriate specialist(s) for a task
 * - Packages task packets with narrowed context
 * - Delegates to specialist sub-agents
 * - Collects and synthesizes results
 *
 * Registers a single `orchestrate` tool that the LLM calls with a
 * high-level task description. The orchestrator handles specialist
 * selection, delegation, and result synthesis internally.
 *
 * Stage 3c deliverable — see docs/IMPLEMENTATION_PLAN.md
 */

import type { ExtensionAPI, ExtensionContext, AgentToolResult, AgentToolUpdateCallback } from "@mariozechner/pi-coding-agent";
import { Type, type Static } from "@sinclair/typebox";
import { createTaskPacket, validateTaskPacket } from "../shared/packets.js";
import { selectSpecialists, type DelegationHint } from "./select.js";
import { delegateToSpecialist, getPromptConfig, buildContextForSpecialist } from "./delegate.js";
import { synthesizeResults } from "./synthesize.js";
import type { ResultPacket } from "../shared/types.js";

/** Specialists that produce plans/reviews but don't modify files */
const READ_ONLY_SPECIALISTS = new Set(["planner", "reviewer"]);

const OrchestrateParams = Type.Object({
  task: Type.String({ description: "What needs to be done" }),
  relevantFiles: Type.Array(Type.String(), { description: "Files related to the task" }),
  delegationHint: Type.Optional(
    Type.Union([
      Type.Literal("planner"),
      Type.Literal("reviewer"),
      Type.Literal("builder"),
      Type.Literal("tester"),
      Type.Literal("auto"),
    ], { description: "Which specialist(s) to use. Defaults to auto-selection." })
  ),
});

type OrchestrateParamsType = Static<typeof OrchestrateParams>;

export default function orchestratorExtension(pi: ExtensionAPI) {
  pi.registerTool({
    name: "orchestrate",
    label: "Orchestrate Task",
    description:
      "Delegate a task to one or more specialist sub-agents. " +
      "Selects the appropriate specialist(s) based on the task description, " +
      "packages task packets with narrowed context, and synthesizes results.",
    parameters: OrchestrateParams,

    async execute(
      toolCallId: string,
      params: OrchestrateParamsType,
      signal: AbortSignal | undefined,
      onUpdate: AgentToolUpdateCallback | undefined,
      ctx: ExtensionContext
    ): Promise<AgentToolResult<unknown>> {
      const { task, relevantFiles, delegationHint } = params;

      // 1. Select specialist(s)
      const selection = selectSpecialists(task, delegationHint as DelegationHint | undefined);

      if (selection.specialists.length === 0) {
        return {
          content: [{ type: "text", text: "No specialists selected for this task." }],
          details: { error: "no_specialists", selection },
        };
      }

      // 2. Delegate to each specialist sequentially
      const collectedResults: ResultPacket[] = [];
      const priorResults: ResultPacket[] = [];

      for (const specialistId of selection.specialists) {
        const promptConfig = getPromptConfig(specialistId);

        // Context narrowing: read-only specialists get empty write set
        const allowedWriteSet = READ_ONLY_SPECIALISTS.has(specialistId)
          ? []
          : relevantFiles;

        // Build task packet with narrowed context
        const taskPacket = createTaskPacket({
          objective: task,
          allowedReadSet: relevantFiles,
          allowedWriteSet,
          acceptanceCriteria: [`Complete the ${specialistId} phase of this task`],
          context: buildContextForSpecialist(specialistId, priorResults),
          targetAgent: promptConfig.id,
          sourceAgent: "orchestrator",
        });

        const taskErrors = validateTaskPacket(taskPacket);
        if (taskErrors.length > 0) {
          return {
            content: [{ type: "text", text: `Task packet validation failed for ${specialistId}:\n${taskErrors.join("\n")}` }],
            details: { error: "validation_failed", specialist: specialistId, errors: taskErrors },
          };
        }

        // Delegate
        const { resultPacket, success } = await delegateToSpecialist({
          promptConfig,
          taskPacket,
          signal,
        });

        collectedResults.push(resultPacket);
        priorResults.push(resultPacket);

        // Stop chain on failure or escalation
        if (resultPacket.status === "failure" || resultPacket.status === "escalation") {
          break;
        }
      }

      // 3. Synthesize results
      const synthesized = synthesizeResults(collectedResults);

      return {
        content: [
          {
            type: "text",
            text: `## Orchestration Result\n\n**Status:** ${synthesized.overallStatus}\n**Specialists:** ${synthesized.specialistsInvoked.join(", ")}\n**Selection reason:** ${selection.reason}\n\n${synthesized.summary}`,
          },
        ],
        details: {
          overallStatus: synthesized.overallStatus,
          specialistsInvoked: synthesized.specialistsInvoked,
          selectionReason: selection.reason,
          results: synthesized.results,
        },
      };
    },
  });
}
