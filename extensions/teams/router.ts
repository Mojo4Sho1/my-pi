/**
 * Team router — executes a team's state machine to completion (Stage 4b+4d).
 *
 * Routes task packets between specialists within a team,
 * validates I/O contracts at transitions, handles revision loops,
 * and returns a single team-level result packet with a session artifact.
 *
 * Teams are opaque to the orchestrator (Decision #14).
 */

import type {
  TeamDefinition,
  TaskPacket,
  ResultPacket,
  FailureReason,
  StateTraceEntry,
  SpecialistInvocationSummary,
  TeamSessionArtifact,
  TeamStepArtifact,
  ArtifactRef,
} from "../shared/types.js";
import type { MachineState } from "../shared/routing.js";
import {
  validateStateMachine,
  initMachineState,
  advanceState,
  isTerminal,
  getCurrentAgent,
} from "../shared/routing.js";
import { createTaskPacket, createResultPacket } from "../shared/packets.js";
import { delegateToSpecialist, getPromptConfig } from "../orchestrator/delegate.js";
import {
  buildContextFromArtifacts,
  collectValidatedOutputFields,
  validateOutputContract,
} from "../shared/contracts.js";
import { computeTeamVersion } from "../shared/logging.js";
import { aggregateTokenUsage } from "../shared/tokens.js";
import { READ_ONLY_SPECIALISTS } from "../shared/sandbox.js";
import type { HookRegistry } from "../shared/hooks.js";
import type { DelegationLogger } from "../shared/logging.js";
import type { SpecialistId } from "../orchestrator/select.js";
import { GLOBAL_RUN_REGISTRY, linkAbortSignal } from "../shared/run-registry.js";

export interface TeamExecutionResult {
  /** The team-level result packet */
  resultPacket: ResultPacket;
  /** Whether the team execution completed successfully */
  success: boolean;
  /** States visited during execution (in order) */
  statesVisited: string[];
  /** Iteration counts for loop edges */
  iterationsUsed: Record<string, number>;
  /** Structured session artifact (Stage 4d) */
  sessionArtifact?: TeamSessionArtifact;
}

const TEAM_ARTIFACT_SCHEMA_VERSION = "team-artifact.v1";

/**
 * Map an agent ID (e.g. "specialist_planner") to a SpecialistId ("planner").
 */
function agentToSpecialistId(agentId: string): SpecialistId | undefined {
  const prefix = "specialist_";
  if (agentId.startsWith(prefix)) {
    return agentId.slice(prefix.length) as SpecialistId;
  }
  return undefined;
}

/** Generate a simple session ID */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function generateArtifactId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function buildTeamArtifactBasePath(sessionId: string): string {
  return `artifacts/team-sessions/${sessionId}`;
}

function buildStepArtifactPath(sessionId: string, stepOrder: number, specialistId: string): string {
  const roleStem = specialistId
    .replace(/^specialist_/, "")
    .replaceAll("-", "_")
    .toUpperCase();
  return `${buildTeamArtifactBasePath(sessionId)}/${String(stepOrder).padStart(3, "0")}_${roleStem}_OUTPUT.json`;
}

function buildArtifactRef(stepArtifact: TeamStepArtifact): ArtifactRef {
  return {
    artifactId: stepArtifact.artifactId,
    artifactType: stepArtifact.artifactType,
    logicalPath: stepArtifact.logicalPath,
    ownerAgent: stepArtifact.ownerRole,
    createdAt: stepArtifact.producedAt,
    stepOrder: stepArtifact.stepOrder,
    state: stepArtifact.state,
  };
}

function buildTeamStepArtifact(params: {
  sessionId: string;
  team: TeamDefinition;
  rootTaskId: string;
  state: string;
  stepOrder: number;
  specialistId: string;
  taskPacket: TaskPacket;
  resultPacket: ResultPacket;
  validatedOutput: Record<string, unknown>;
  contractSatisfied: boolean;
  contractErrors: string[];
  derivedFrom: string[];
}): TeamStepArtifact {
  const producedAt = new Date().toISOString();
  const artifactId = generateArtifactId("team_step");

  return {
    schemaVersion: TEAM_ARTIFACT_SCHEMA_VERSION,
    artifactId,
    artifactType: "team_step_output",
    logicalPath: buildStepArtifactPath(params.sessionId, params.stepOrder, params.specialistId),
    teamId: params.team.id,
    teamSessionId: params.sessionId,
    taskId: params.rootTaskId,
    state: params.state,
    stepOrder: params.stepOrder,
    specialistId: params.specialistId,
    ownerRole: params.specialistId,
    inputTaskPacketId: params.taskPacket.id,
    status: params.resultPacket.status,
    summary: params.resultPacket.summary,
    deliverables: params.resultPacket.deliverables,
    modifiedFiles: params.resultPacket.modifiedFiles,
    editableFields: Object.keys(params.validatedOutput),
    readOnlyFields: [
      "artifactId",
      "artifactType",
      "logicalPath",
      "teamId",
      "teamSessionId",
      "taskId",
      "state",
      "stepOrder",
      "specialistId",
      "ownerRole",
      "inputTaskPacketId",
      "status",
      "summary",
      "deliverables",
      "modifiedFiles",
      "derivedFrom",
      "producedAt",
    ],
    derivedFrom: params.derivedFrom,
    producedAt,
    structuredOutput: params.resultPacket.structuredOutput,
    validatedOutput: params.validatedOutput,
    contractSatisfied: params.contractSatisfied,
    contractErrors: params.contractErrors.length > 0 ? params.contractErrors : undefined,
  };
}

/**
 * Build the session artifact from collected execution data.
 */
function buildSessionArtifact(params: {
  sessionId: string;
  taskPacket: TaskPacket;
  startedAt: string;
  team: TeamDefinition;
  teamVersion: string;
  currentOwnerRole: string;
  stateTrace: StateTraceEntry[];
  specialistSummaries: SpecialistInvocationSummary[];
  stepArtifacts: TeamStepArtifact[];
  artifactRefs: ArtifactRef[];
  finalResultRef?: ArtifactRef;
  endState: string;
  terminationReason: FailureReason | "success";
  finalStatus: ResultPacket["status"];
  failureReason?: FailureReason;
}): TeamSessionArtifact {
  const completedAt = new Date().toISOString();
  const startTime = new Date(params.startedAt).getTime();
  const endTime = new Date(completedAt).getTime();

  const stateCounts = new Map<string, number>();
  let loopCount = 0;
  let revisionCount = 0;
  for (const entry of params.stateTrace) {
    const count = (stateCounts.get(entry.state) || 0) + 1;
    stateCounts.set(entry.state, count);
    if (count > 1) {
      loopCount++;
      revisionCount++;
    }
  }

  const totalTokenUsage = aggregateTokenUsage(
    params.specialistSummaries.map((summary) => summary.tokenUsage)
  );

  return {
    schemaVersion: TEAM_ARTIFACT_SCHEMA_VERSION,
    sessionId: params.sessionId,
    taskId: params.taskPacket.id,
    objective: params.taskPacket.objective,
    startedAt: params.startedAt,
    completedAt,
    teamId: params.team.id,
    teamName: params.team.name,
    teamVersion: params.teamVersion,
    status: params.finalStatus,
    currentState: params.endState,
    currentOwnerRole: params.currentOwnerRole,
    startState: params.team.states.startState,
    endState: params.endState,
    terminationReason: params.terminationReason,
    taskPacketLineage: [
      params.taskPacket.id,
      ...params.stepArtifacts.map((artifact) => artifact.inputTaskPacketId),
    ],
    artifactRefs: params.artifactRefs,
    stateTrace: params.stateTrace,
    specialistSummaries: params.specialistSummaries,
    stepArtifacts: params.stepArtifacts,
    finalResultRef: params.finalResultRef,
    outcome: {
      status: params.finalStatus,
      failureReason: params.failureReason,
    },
    metrics: {
      totalTransitions: params.stateTrace.length,
      loopCount,
      retryCount: loopCount,
      totalDurationMs: endTime - startTime,
      revisionCount,
      totalTokenUsage: totalTokenUsage.totalTokens > 0 ? totalTokenUsage : undefined,
    },
  };
}

/**
 * Execute a team's state machine to completion.
 *
 * Delegates to specialists at each state, advances the state machine
 * based on results, and handles revision loops as escalation.
 * Returns a single team-level ResultPacket with a session artifact.
 */
export async function executeTeam(
  team: TeamDefinition,
  taskPacket: TaskPacket,
  signal?: AbortSignal,
  logger?: DelegationLogger,
  hookRegistry?: HookRegistry,
  parentRunId?: string,
): Promise<TeamExecutionResult> {
  const runController = new AbortController();
  const unlinkAbort = linkAbortSignal(signal, runController);
  const teamRunId = GLOBAL_RUN_REGISTRY.registerRun({
    parentRunId,
    kind: "team_execution",
    owner: `team_${team.id}`,
    cwd: process.cwd(),
    label: `${team.id} execution`,
    taskId: taskPacket.id,
    initialState: "starting",
    handlers: {
      gracefulStop: () => {
        GLOBAL_RUN_REGISTRY.markCanceling(teamRunId);
        runController.abort("team_teardown");
      },
      forceStop: () => {
        GLOBAL_RUN_REGISTRY.markCanceling(teamRunId);
        runController.abort("team_force_teardown");
      },
    },
  }).id;
  GLOBAL_RUN_REGISTRY.markActive(teamRunId);

  const sessionId = generateSessionId();
  const startedAt = new Date().toISOString();
  const teamVersion = computeTeamVersion(team);
  const stateTrace: StateTraceEntry[] = [];
  const specialistSummaries: SpecialistInvocationSummary[] = [];
  const stepArtifacts: TeamStepArtifact[] = [];
  const artifactRefs: ArtifactRef[] = [];
  let invocationOrder = 0;
  let finalState: "settled" | "failed" | "canceled" = "settled";
  let currentOwnerRole = `team_${team.id}`;
  let finalResultRef: ArtifactRef | undefined;

  try {
    logger?.log({
      timestamp: startedAt,
      level: "info",
      event: "team_start",
      sourceAgent: taskPacket.sourceAgent,
      targetAgent: `team_${team.id}`,
      taskId: taskPacket.id,
      summary: `Starting team '${team.id}' (version ${teamVersion})`,
    });
    hookRegistry?.dispatchObserver("onTeamStart", {
      teamId: team.id,
      teamVersion,
      taskId: taskPacket.id,
    });

    function buildResult(
      resultPacket: ResultPacket,
      success: boolean,
      statesVisited: string[],
      iterationsUsed: Record<string, number>,
      endState: string,
      terminationReason: FailureReason | "success",
      failureReason?: FailureReason,
    ): TeamExecutionResult {
      const artifact = buildSessionArtifact({
        sessionId,
        taskPacket,
        startedAt,
        team,
        teamVersion,
        currentOwnerRole,
        stateTrace,
        specialistSummaries,
        stepArtifacts,
        artifactRefs,
        finalResultRef,
        endState,
        terminationReason,
        finalStatus: resultPacket.status,
        failureReason,
      });

      logger?.log({
        timestamp: new Date().toISOString(),
        level: success ? "info" : "warn",
        event: "team_complete",
        sourceAgent: taskPacket.sourceAgent,
        targetAgent: `team_${team.id}`,
        taskId: taskPacket.id,
        status: resultPacket.status,
        summary: resultPacket.summary,
      });

      return {
        resultPacket,
        success,
        statesVisited,
        iterationsUsed,
        sessionArtifact: artifact,
      };
    }

    const validationErrors = validateStateMachine(team.states);
    if (validationErrors.length > 0) {
      finalState = "failed";
      return buildResult(
        createResultPacket({
          taskId: taskPacket.id,
          status: "failure",
          summary: `Team '${team.id}' has invalid state machine: ${validationErrors.join("; ")}`,
          deliverables: [],
          modifiedFiles: [],
          sourceAgent: `team_${team.id}`,
        }),
        false,
        [],
        {},
        "invalid",
        "validation_failure",
        "validation_failure",
      );
    }

    let machineState: MachineState = initMachineState(team.states);
    const statesVisited: string[] = [machineState.currentState];
    let lastResult: ResultPacket | undefined;

    while (!isTerminal(team.states, machineState)) {
      if (runController.signal.aborted) {
        finalState = "canceled";
        return buildResult(
          createResultPacket({
            taskId: taskPacket.id,
            status: "failure",
            summary: `Team '${team.id}' execution aborted`,
            deliverables: [],
            modifiedFiles: [],
            sourceAgent: `team_${team.id}`,
          }),
          false,
          statesVisited,
          machineState.iterationCounts,
          machineState.currentState,
          "abort",
          "abort",
        );
      }

      const currentStateName = machineState.currentState;
      const stateEnteredAt = new Date().toISOString();
      const agentId = getCurrentAgent(team.states, machineState);

      if (!agentId) {
        finalState = "failed";
        return buildResult(
          createResultPacket({
            taskId: taskPacket.id,
            status: "failure",
            summary: `No agent assigned to state '${machineState.currentState}'`,
            deliverables: [],
            modifiedFiles: [],
            sourceAgent: `team_${team.id}`,
          }),
          false,
          statesVisited,
          machineState.iterationCounts,
          machineState.currentState,
          "validation_failure",
          "validation_failure",
        );
      }

      const specialistId = agentToSpecialistId(agentId);
      if (!specialistId) {
        finalState = "failed";
        return buildResult(
          createResultPacket({
            taskId: taskPacket.id,
            status: "failure",
            summary: `Cannot map agent '${agentId}' to a specialist ID`,
            deliverables: [],
            modifiedFiles: [],
            sourceAgent: `team_${team.id}`,
          }),
          false,
          statesVisited,
          machineState.iterationCounts,
          machineState.currentState,
          "validation_failure",
          "validation_failure",
        );
      }

      const promptConfig = getPromptConfig(specialistId);
      const context = promptConfig.inputContract
        ? buildContextFromArtifacts(promptConfig.inputContract, stepArtifacts)
        : undefined;

      const specialistTaskPacket = createTaskPacket({
        objective: taskPacket.objective,
        allowedReadSet: taskPacket.allowedReadSet,
        allowedWriteSet: READ_ONLY_SPECIALISTS.has(specialistId)
          ? []
          : taskPacket.allowedWriteSet,
        acceptanceCriteria: [`Complete the ${specialistId} phase for team '${team.id}'`],
        context,
        targetAgent: agentId,
        sourceAgent: `team_${team.id}`,
      });
      currentOwnerRole = agentId;

      hookRegistry?.dispatchObserver("beforeStateTransition", {
        teamId: team.id,
        fromState: currentStateName,
        toState: "pending",
        agentId,
        taskId: taskPacket.id,
      });

      const delegationStartMs = Date.now();
      const { resultPacket, tokenUsage } = await delegateToSpecialist({
        promptConfig,
        taskPacket: specialistTaskPacket,
        signal: runController.signal,
        logger,
        hookRegistry,
        parentRunId: teamRunId,
      });
      const delegationDurationMs = Date.now() - delegationStartMs;

      lastResult = resultPacket;
      invocationOrder++;

      let contractSatisfied = true;
      let contractErrors: string[] = [];
      let validatedOutput: Record<string, unknown> = resultPacket.structuredOutput
        ? { ...resultPacket.structuredOutput }
        : {};
      if (promptConfig.outputContract) {
        try {
          contractErrors = validateOutputContract(
            resultPacket.structuredOutput,
            promptConfig.outputContract
          );
          validatedOutput = collectValidatedOutputFields(
            resultPacket.structuredOutput,
            promptConfig.outputContract
          );
          contractSatisfied = contractErrors.length === 0;
        } catch {
          contractSatisfied = false;
          contractErrors = ["Output contract validation threw unexpectedly"];
          validatedOutput = {};
        }
      }

      const stepArtifact = buildTeamStepArtifact({
        sessionId,
        team,
        rootTaskId: taskPacket.id,
        state: currentStateName,
        stepOrder: invocationOrder,
        specialistId: agentId,
        taskPacket: specialistTaskPacket,
        resultPacket,
        validatedOutput,
        contractSatisfied,
        contractErrors,
        derivedFrom: stepArtifacts.map((artifact) => artifact.artifactId),
      });
      const artifactRef = buildArtifactRef(stepArtifact);
      stepArtifacts.push(stepArtifact);
      artifactRefs.push(artifactRef);
      finalResultRef = artifactRef;
      hookRegistry?.dispatchObserver("onArtifactWritten", {
        artifactType: "team_step_output",
        taskId: taskPacket.id,
        artifact: stepArtifact,
      });

      specialistSummaries.push({
        agentId,
        order: invocationOrder,
        outputSummary: resultPacket.summary.slice(0, 500),
        status: resultPacket.status,
        contractSatisfied,
        durationMs: delegationDurationMs,
        tokenUsage,
      });

      const advanceResult = advanceState(team.states, machineState, resultPacket);

      if ("exhausted" in advanceResult) {
        stateTrace.push({
          state: currentStateName,
          agent: agentId,
          resultStatus: resultPacket.status,
          transitionTo: advanceResult.edge.split("→").pop()?.trim() || currentStateName,
          enteredAt: stateEnteredAt,
          completedAt: new Date().toISOString(),
          iterationCount: advanceResult.iterations,
        });

        logger?.log({
          timestamp: new Date().toISOString(),
          level: "warn",
          event: "team_loop_exhausted",
          sourceAgent: `team_${team.id}`,
          targetAgent: agentId,
          taskId: taskPacket.id,
          summary: `Revision loop exhausted on edge '${advanceResult.edge}' after ${advanceResult.iterations} iterations`,
          failureReason: "retry_exhaustion",
        });
        hookRegistry?.dispatchObserver("afterStateTransition", {
          teamId: team.id,
          fromState: currentStateName,
          toState: advanceResult.edge.split("→").pop()?.trim() || currentStateName,
          agentId,
          taskId: taskPacket.id,
          resultStatus: resultPacket.status,
        });

        finalState = "failed";
        return buildResult(
          createResultPacket({
            taskId: taskPacket.id,
            status: "escalation",
            summary: `Team '${team.id}' revision loop exhausted on edge '${advanceResult.edge}' after ${advanceResult.iterations} iterations`,
            deliverables: stepArtifacts.map((artifact) => `[${artifact.specialistId}] ${artifact.summary}`),
            modifiedFiles: stepArtifacts.flatMap((artifact) => artifact.modifiedFiles),
            escalation: {
              reason: `Revision loop exhausted: ${advanceResult.edge}`,
              suggestedAction: "Review the feedback cycle and adjust scope or requirements",
            },
            sourceAgent: `team_${team.id}`,
          }),
          false,
          statesVisited,
          machineState.iterationCounts,
          machineState.currentState,
          "retry_exhaustion",
          "retry_exhaustion",
        );
      }

      if ("error" in advanceResult) {
        stateTrace.push({
          state: currentStateName,
          agent: agentId,
          resultStatus: resultPacket.status,
          transitionTo: "error",
          enteredAt: stateEnteredAt,
          completedAt: new Date().toISOString(),
        });

        hookRegistry?.dispatchObserver("afterStateTransition", {
          teamId: team.id,
          fromState: currentStateName,
          toState: "error",
          agentId,
          taskId: taskPacket.id,
          resultStatus: resultPacket.status,
        });

        finalState = "failed";
        return buildResult(
          createResultPacket({
            taskId: taskPacket.id,
            status: "failure",
            summary: `Team '${team.id}' state machine error: ${advanceResult.error}`,
            deliverables: [],
            modifiedFiles: [],
            sourceAgent: `team_${team.id}`,
          }),
          false,
          statesVisited,
          machineState.iterationCounts,
          machineState.currentState,
          "validation_failure",
          "validation_failure",
        );
      }

      const targetState = advanceResult.newState.currentState;
      stateTrace.push({
        state: currentStateName,
        agent: agentId,
        resultStatus: resultPacket.status,
        transitionTo: targetState,
        enteredAt: stateEnteredAt,
        completedAt: new Date().toISOString(),
        iterationCount: advanceResult.newState.iterationCounts[`${currentStateName}→${targetState}`],
      });

      logger?.log({
        timestamp: new Date().toISOString(),
        level: "info",
        event: "team_state_transition",
        sourceAgent: `team_${team.id}`,
        targetAgent: agentId,
        taskId: taskPacket.id,
        status: resultPacket.status,
        summary: `${currentStateName} → ${targetState}`,
      });
      hookRegistry?.dispatchObserver("afterStateTransition", {
        teamId: team.id,
        fromState: currentStateName,
        toState: targetState,
        agentId,
        taskId: taskPacket.id,
        resultStatus: resultPacket.status,
      });

      machineState = advanceResult.newState;
      statesVisited.push(machineState.currentState);
    }

    const allModifiedFiles = [...new Set(stepArtifacts.flatMap((artifact) => artifact.modifiedFiles))];
    const isSuccess = machineState.currentState !== "failed" && lastResult?.status === "success";
    currentOwnerRole = team.states.states[machineState.currentState]?.agent ?? currentOwnerRole;

    let failureReason: FailureReason | undefined;
    if (!isSuccess && lastResult) {
      if (lastResult.status === "escalation") {
        failureReason = "escalation";
      } else if (lastResult.status === "failure") {
        failureReason = "task_failure";
      }
    }

    finalState = isSuccess ? "settled" : "failed";
    return buildResult(
      createResultPacket({
        taskId: taskPacket.id,
        status: isSuccess ? "success" : (lastResult?.status || "failure"),
        summary: isSuccess
          ? `Team '${team.id}' completed successfully. ${stepArtifacts.map((artifact) => `[${artifact.specialistId}] ${artifact.summary}`).join("; ")}`
          : `Team '${team.id}' ended in state '${machineState.currentState}'. ${lastResult?.summary || "No results."}`,
        deliverables: stepArtifacts.map((artifact) => `[${artifact.specialistId}] ${artifact.summary}`),
        modifiedFiles: allModifiedFiles,
        escalation: lastResult?.escalation,
        sourceAgent: `team_${team.id}`,
      }),
      isSuccess,
      statesVisited,
      machineState.iterationCounts,
      machineState.currentState,
      isSuccess ? "success" : (failureReason || "task_failure"),
      failureReason,
    );
  } finally {
    unlinkAbort();
    if (runController.signal.aborted) {
      GLOBAL_RUN_REGISTRY.markCanceling(teamRunId);
      await GLOBAL_RUN_REGISTRY.waitForDescendantsToSettle(teamRunId);
      GLOBAL_RUN_REGISTRY.markCanceled(teamRunId);
    } else if (finalState === "failed") {
      GLOBAL_RUN_REGISTRY.markFailed(teamRunId);
    } else {
      GLOBAL_RUN_REGISTRY.markSettled(teamRunId);
    }
  }
}
