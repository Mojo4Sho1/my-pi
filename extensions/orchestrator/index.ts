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
import { delegateToSpecialist, delegateToTeam, getPromptConfig, buildContextForSpecialist } from "./delegate.js";
import { synthesizeResults } from "./synthesize.js";
import { createPiLogger } from "../shared/logging.js";
import { createHookRegistry } from "../shared/hooks.js";
import { READ_ONLY_SPECIALISTS } from "../shared/sandbox.js";
import { createWorklist, appendItem, updateItemStatus, getWorklistSummary } from "../worklist/index.js";
import type { Worklist } from "../worklist/index.js";
import type { ResultPacket, StructuredReviewOutput } from "../shared/types.js";
import { aggregateTokenUsage } from "../shared/tokens.js";
import { GLOBAL_RUN_REGISTRY, linkAbortSignal } from "../shared/run-registry.js";

const OrchestrateParams = Type.Object({
  task: Type.String({ description: "What needs to be done" }),
  relevantFiles: Type.Array(Type.String(), { description: "Files related to the task" }),
  delegationHint: Type.Optional(
    Type.String({
      description:
        "Which specialist(s) to delegate to. For multiple specialists, use comma-separated IDs " +
        "(e.g. 'builder,tester'). They run sequentially, each receiving prior results as context.\n" +
        "Available specialists:\n" +
        "- planner: decompose tasks, map dependencies, identify risks\n" +
        "- builder: implement code, fix bugs, create files, refactor\n" +
        "- tester: write tests, define execution commands, frame pass conditions\n" +
        "- reviewer: review code for correctness, compliance, quality\n" +
        "- spec-writer: write prose specifications and agent definitions\n" +
        "- schema-designer: design TypeScript interfaces, packet shapes, I/O contracts\n" +
        "- routing-designer: design state machine routing and transitions\n" +
        "- critic: evaluate designs for redundancy, quality, reuse\n" +
        "- boundary-auditor: audit access control and narrow-by-default compliance\n" +
        "Always specify the specialist(s). Omitting defaults to builder.",
    })
  ),
  teamHint: Type.Optional(
    Type.String({
      description:
        "Team ID to delegate to (e.g. 'build-team', 'default-everyday-team', or 'design-to-build-team'). Overrides specialist selection. " +
        "Teams run multi-specialist state machine workflows. Use for tasks requiring " +
        "coordinated state-machine routing.",
    })
  ),
  modelOverride: Type.Optional(
    Type.String({ description: "Override model for all specialists in this delegation" })
  ),
});

type OrchestrateParamsType = Static<typeof OrchestrateParams>;

/**
 * Extract file paths from a text string.
 * Catches patterns like `extensions/shared/format.ts`, `tests/foo.test.ts`, etc.
 */
function extractPathsFromText(text: string): string[] {
  const paths: string[] = [];

  // Extract explicit file paths (e.g., extensions/shared/format.ts)
  const pathPattern = /(?:^|[\s`"'(])((extensions|tests|agents|lib|src|docs)\/[\w./-]+\.\w+)/g;
  let match;
  while ((match = pathPattern.exec(text)) !== null) {
    paths.push(match[1]);
  }

  // Extract backtick-quoted paths that look like files
  const backtickPattern = /`([^`]+\.\w{1,4})`/g;
  while ((match = backtickPattern.exec(text)) !== null) {
    const candidate = match[1];
    if (candidate.includes("/")) {
      paths.push(candidate);
    }
  }

  return paths;
}

const MAX_DOC_SIZE = 50_000; // 50KB — skip oversized files

/**
 * Extract file paths from task text, explicit list, and referenced .md docs.
 * Reads any .md files in the explicit list and extracts paths from their content,
 * so specialists get a complete write set without manual enumeration.
 */
async function inferFilePaths(task: string, explicit: string[]): Promise<string[]> {
  const inferred = new Set(explicit);

  // Extract paths from task text
  for (const p of extractPathsFromText(task)) {
    inferred.add(p);
  }

  // Read .md files from the explicit list and extract paths from their content
  const { readFile, stat } = await import("fs/promises");
  const mdFiles = explicit.filter((f) => f.endsWith(".md"));

  for (const mdFile of mdFiles) {
    try {
      const info = await stat(mdFile);
      if (info.size > MAX_DOC_SIZE) continue;
      const content = await readFile(mdFile, "utf-8");
      for (const p of extractPathsFromText(content)) {
        inferred.add(p);
      }
    } catch {
      // File doesn't exist or can't be read — skip silently
    }
  }

  return [...inferred];
}

export default function orchestratorExtension(pi: ExtensionAPI) {
  pi.registerTool({
    name: "orchestrate",
    label: "Orchestrate Task",
    description:
      "Delegate a task to a specialist sub-agent or team. " +
      "You MUST specify delegationHint or teamHint to choose the right primitive. " +
      "The orchestrator packages task packets with narrowed context, " +
      "delegates to the specialist, and returns the result.",
    parameters: OrchestrateParams,

    async execute(
      toolCallId: string,
      params: OrchestrateParamsType,
      signal: AbortSignal | undefined,
      onUpdate: AgentToolUpdateCallback | undefined,
      ctx: ExtensionContext
    ): Promise<AgentToolResult<unknown>> {
      const { task, relevantFiles: explicitFiles, delegationHint, teamHint, modelOverride } = params;
      const relevantFiles = await inferFilePaths(task, explicitFiles);
      const logger = createPiLogger(pi);
      const hookRegistry = createHookRegistry();
      const runController = new AbortController();
      const unlinkAbort = linkAbortSignal(signal, runController);
      const orchestrationRunId = GLOBAL_RUN_REGISTRY.registerRun({
        kind: "orchestration",
        owner: "orchestrator",
        cwd: ctx.cwd,
        label: task.slice(0, 120),
        initialState: "starting",
        handlers: {
          gracefulStop: () => {
            GLOBAL_RUN_REGISTRY.markCanceling(orchestrationRunId);
            runController.abort("orchestration_teardown");
          },
          forceStop: () => {
            GLOBAL_RUN_REGISTRY.markCanceling(orchestrationRunId);
            runController.abort("orchestration_force_teardown");
          },
        },
      }).id;
      GLOBAL_RUN_REGISTRY.markActive(orchestrationRunId);
      let sessionTokenUsage: import("../shared/types.js").TokenUsage | undefined;
      let finalState: "settled" | "failed" | "canceled" = "settled";

      hookRegistry.dispatchObserver("onCommandInvoked", {
        commandName: "orchestrate",
        toolCallId,
        task,
        delegationHint: delegationHint ?? "auto",
        teamHint,
      });
      hookRegistry.dispatchObserver("onSessionStart", {
        sessionId: hookRegistry.getSessionId(),
      });

      try {

        // 0. Team delegation — bypasses specialist selection entirely
        if (teamHint) {
          const teamTaskPacket = createTaskPacket({
            objective: task,
            allowedReadSet: relevantFiles,
            allowedWriteSet: relevantFiles,
            acceptanceCriteria: [`Complete the task via team '${teamHint}'`],
            targetAgent: `team_${teamHint}`,
            sourceAgent: "orchestrator",
          });

          const { resultPacket, success, sessionArtifact } = await delegateToTeam({
            teamId: teamHint,
            taskPacket: teamTaskPacket,
            signal: runController.signal,
            logger,
            hookRegistry,
            parentRunId: orchestrationRunId,
          });

          // Log team session artifact
          if (sessionArtifact) {
            pi.appendEntry("team_session", sessionArtifact);
            hookRegistry.dispatchObserver("onArtifactWritten", {
              artifactType: "team_session",
              taskId: teamTaskPacket.id,
              artifact: sessionArtifact,
            });
            sessionTokenUsage = sessionArtifact.metrics.totalTokenUsage;
          }

          return {
            content: [
              {
                type: "text",
                text: `## Team Orchestration Result\n\n**Team:** ${teamHint}\n**Status:** ${resultPacket.status}\n\n${resultPacket.summary}`,
              },
            ],
            details: {
              overallStatus: resultPacket.status,
              teamId: teamHint,
              result: resultPacket,
              sessionArtifact,
            },
          };
        }

        // 1. Select specialist(s)
        // Parse comma-separated delegationHint into array form
        let parsedHint: DelegationHint | undefined;
        if (typeof delegationHint === "string" && delegationHint.includes(",")) {
          parsedHint = delegationHint.split(",").map((s) => s.trim()) as DelegationHint;
        } else {
          parsedHint = delegationHint as DelegationHint | undefined;
        }
        const selection = selectSpecialists(task, parsedHint);

        if (selection.specialists.length === 0) {
          return {
            content: [{ type: "text", text: "No specialists selected for this task." }],
            details: { error: "no_specialists", selection },
          };
        }

        // 2. Create worklist for execution-state tracking
        const firstTaskPacket = createTaskPacket({
          objective: task,
          allowedReadSet: relevantFiles,
          allowedWriteSet: relevantFiles,
          acceptanceCriteria: [],
          targetAgent: "orchestrator",
          sourceAgent: "orchestrator",
        });
        let worklist = createWorklist(firstTaskPacket.id, task);

        // Pre-populate worklist items for each specialist
        const itemIds = new Map<string, string>();
        for (const specialistId of selection.specialists) {
          const itemId = `wl_${specialistId}_${Date.now()}`;
          const kind = specialistId === "planner" ? "planning" as const
            : specialistId === "reviewer" ? "review_gate" as const
            : specialistId === "builder-test" ? "validation" as const
            : "implementation" as const;
          const result = appendItem(worklist, {
            id: itemId,
            kind,
            description: `${specialistId} phase`,
          });
          if ("worklist" in result) worklist = result.worklist;
          itemIds.set(specialistId, itemId);
        }

        // 3. Delegate to each specialist sequentially
        const collectedResults: ResultPacket[] = [];
        const priorResults: ResultPacket[] = [];
        const reviewOutputs = new Map<string, StructuredReviewOutput>();
        const tokenUsages: import("../shared/types.js").TokenUsage[] = [];

        for (const specialistId of selection.specialists) {
          const promptConfig = getPromptConfig(specialistId);
          const itemId = itemIds.get(specialistId)!;

          // Mark worklist item as in_progress
          const startResult = updateItemStatus(worklist, itemId, "in_progress");
          if ("worklist" in startResult) worklist = startResult.worklist;

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
          const delegationOutput = await delegateToSpecialist({
            promptConfig,
            taskPacket,
            signal: runController.signal,
            logger,
            modelOverride,
            hookRegistry,
            parentRunId: orchestrationRunId,
          });

          collectedResults.push(delegationOutput.resultPacket);
          priorResults.push(delegationOutput.resultPacket);
          if (delegationOutput.tokenUsage) {
            tokenUsages.push(delegationOutput.tokenUsage);
          }

          // Update worklist item status based on delegation outcome
          const doneStatus = delegationOutput.resultPacket.status === "success" ? "completed" as const
            : delegationOutput.resultPacket.status === "failure" ? "blocked" as const
            : delegationOutput.resultPacket.status === "escalation" ? "blocked" as const
            : "completed" as const;
          const doneResult = updateItemStatus(worklist, itemId, doneStatus,
            doneStatus === "blocked" ? delegationOutput.resultPacket.summary : undefined);
          if ("worklist" in doneResult) worklist = doneResult.worklist;

          // Collect review outputs
          if (delegationOutput.reviewOutput) {
            reviewOutputs.set(delegationOutput.resultPacket.sourceAgent, delegationOutput.reviewOutput);
          }

          // Stop chain on failure or escalation
          if (delegationOutput.resultPacket.status === "failure" || delegationOutput.resultPacket.status === "escalation") {
            break;
          }
        }

        // 4. Log worklist session artifact
        const worklistSummary = getWorklistSummary(worklist);
        const worklistArtifact = { worklist, summary: worklistSummary };
        pi.appendEntry("worklist_session", worklistArtifact);
        hookRegistry.dispatchObserver("onArtifactWritten", {
          artifactType: "worklist_session",
          taskId: firstTaskPacket.id,
          artifact: worklistArtifact,
        });

        const totalTokenUsage = aggregateTokenUsage(tokenUsages);
        sessionTokenUsage = totalTokenUsage.totalTokens > 0 ? totalTokenUsage : undefined;

        // 5. Synthesize results
        const synthesized = synthesizeResults({
          results: collectedResults,
          reviewOutputs: reviewOutputs.size > 0 ? reviewOutputs : undefined,
          worklistSummary,
        });

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
            worklistSummary: synthesized.worklistSummary,
          },
        };
      } catch (error) {
        finalState = runController.signal.aborted ? "canceled" : "failed";
        throw error;
      } finally {
        unlinkAbort();
        if (runController.signal.aborted) {
          GLOBAL_RUN_REGISTRY.markCanceling(orchestrationRunId);
          await GLOBAL_RUN_REGISTRY.waitForDescendantsToSettle(orchestrationRunId);
          GLOBAL_RUN_REGISTRY.markCanceled(orchestrationRunId);
        } else if (finalState === "failed") {
          GLOBAL_RUN_REGISTRY.markFailed(orchestrationRunId);
        } else {
          GLOBAL_RUN_REGISTRY.markSettled(orchestrationRunId);
        }
        hookRegistry.dispatchObserver("onSessionEnd", {
          sessionId: hookRegistry.getSessionId(),
          totalTokenUsage: sessionTokenUsage,
        });
      }
    },
  });
}
