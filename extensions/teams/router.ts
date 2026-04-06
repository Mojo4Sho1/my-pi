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
import { buildContextFromContract, validateOutputContract } from "../shared/contracts.js";
import { computeTeamVersion } from "../shared/logging.js";
import { aggregateTokenUsage } from "../shared/tokens.js";
import { READ_ONLY_SPECIALISTS } from "../shared/sandbox.js";
import type { HookRegistry } from "../shared/hooks.js";
import type { DelegationLogger } from "../shared/logging.js";
import type { SpecialistId } from "../orchestrator/select.js";

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

/**
 * Build the session artifact from collected execution data.
 */
function buildSessionArtifact(params: {
  sessionId: string;
  startedAt: string;
  team: TeamDefinition;
  teamVersion: string;
  stateTrace: StateTraceEntry[];
  specialistSummaries: SpecialistInvocationSummary[];
  endState: string;
  terminationReason: FailureReason | "success";
  finalStatus: ResultPacket["status"];
  failureReason?: FailureReason;
}): TeamSessionArtifact {
  const completedAt = new Date().toISOString();
  const startTime = new Date(params.startedAt).getTime();
  const endTime = new Date(completedAt).getTime();

  // Count loops (states visited more than once) and revisions
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
    sessionId: params.sessionId,
    startedAt: params.startedAt,
    completedAt,
    teamId: params.team.id,
    teamName: params.team.name,
    teamVersion: params.teamVersion,
    startState: params.team.states.startState,
    endState: params.endState,
    terminationReason: params.terminationReason,
    stateTrace: params.stateTrace,
    specialistSummaries: params.specialistSummaries,
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
 * based on results, and handles loop exhaustion as escalation.
 * Returns a single team-level ResultPacket with a session artifact.
 */
export async function executeTeam(
  team: TeamDefinition,
  taskPacket: TaskPacket,
  signal?: AbortSignal,
  logger?: DelegationLogger,
  hookRegistry?: HookRegistry,
): Promise<TeamExecutionResult> {
  const sessionId = generateSessionId();
  const startedAt = new Date().toISOString();
  const teamVersion = computeTeamVersion(team);
  const stateTrace: StateTraceEntry[] = [];
  const specialistSummaries: SpecialistInvocationSummary[] = [];
  let invocationOrder = 0;

  // Log team start
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

  // Helper to build result with artifact
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
      startedAt,
      team,
      teamVersion,
      stateTrace,
      specialistSummaries,
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

  // Validate the team's state machine
  const validationErrors = validateStateMachine(team.states);
  if (validationErrors.length > 0) {
    const failurePacket = createResultPacket({
      taskId: taskPacket.id,
      status: "failure",
      summary: `Team '${team.id}' has invalid state machine: ${validationErrors.join("; ")}`,
      deliverables: [],
      modifiedFiles: [],
      sourceAgent: `team_${team.id}`,
    });
    return buildResult(failurePacket, false, [], {}, "invalid", "validation_failure", "validation_failure");
  }

  let machineState: MachineState = initMachineState(team.states);
  const statesVisited: string[] = [machineState.currentState];
  const collectedResults: ResultPacket[] = [];
  let lastResult: ResultPacket | undefined;

  // Execute the state machine
  while (!isTerminal(team.states, machineState)) {
    // Check abort signal
    if (signal?.aborted) {
      const abortPacket = createResultPacket({
        taskId: taskPacket.id,
        status: "failure",
        summary: `Team '${team.id}' execution aborted`,
        deliverables: [],
        modifiedFiles: [],
        sourceAgent: `team_${team.id}`,
      });
      return buildResult(
        abortPacket, false, statesVisited, machineState.iterationCounts,
        machineState.currentState, "abort", "abort",
      );
    }

    const currentStateName = machineState.currentState;
    const stateEnteredAt = new Date().toISOString();

    const agentId = getCurrentAgent(team.states, machineState);
    if (!agentId) {
      const errorPacket = createResultPacket({
        taskId: taskPacket.id,
        status: "failure",
        summary: `No agent assigned to state '${machineState.currentState}'`,
        deliverables: [],
        modifiedFiles: [],
        sourceAgent: `team_${team.id}`,
      });
      return buildResult(
        errorPacket, false, statesVisited, machineState.iterationCounts,
        machineState.currentState, "validation_failure", "validation_failure",
      );
    }

    const specialistId = agentToSpecialistId(agentId);
    if (!specialistId) {
      const errorPacket = createResultPacket({
        taskId: taskPacket.id,
        status: "failure",
        summary: `Cannot map agent '${agentId}' to a specialist ID`,
        deliverables: [],
        modifiedFiles: [],
        sourceAgent: `team_${team.id}`,
      });
      return buildResult(
        errorPacket, false, statesVisited, machineState.iterationCounts,
        machineState.currentState, "validation_failure", "validation_failure",
      );
    }

    // Get prompt config and build context from I/O contracts
    const promptConfig = getPromptConfig(specialistId);
    const context = promptConfig.inputContract
      ? buildContextFromContract(promptConfig.inputContract, collectedResults)
      : undefined;

    // Create specialist-level task packet
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

    // Delegate to the specialist (pass logger through)
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
      signal,
      logger,
      hookRegistry,
    });
    const delegationDurationMs = Date.now() - delegationStartMs;

    collectedResults.push(resultPacket);
    lastResult = resultPacket;
    invocationOrder++;

    // Check output contract satisfaction (informational only)
    let contractSatisfied = true;
    if (promptConfig.outputContract) {
      try {
        const deliverableObj: Record<string, unknown> = {};
        for (const d of resultPacket.deliverables) {
          deliverableObj[`deliverable_${resultPacket.deliverables.indexOf(d)}`] = d;
        }
        const errors = validateOutputContract(deliverableObj, promptConfig.outputContract);
        contractSatisfied = errors.length === 0;
      } catch {
        contractSatisfied = false;
      }
    }

    // Record specialist invocation summary
    specialistSummaries.push({
      agentId,
      order: invocationOrder,
      outputSummary: resultPacket.summary.slice(0, 500),
      status: resultPacket.status,
      contractSatisfied,
      durationMs: delegationDurationMs,
      tokenUsage,
    });

    // Advance the state machine
    const advanceResult = advanceState(team.states, machineState, resultPacket);

    if ("exhausted" in advanceResult) {
      // Record the trace entry for this state
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

      // Loop iterations exhausted — escalate
      const escalationPacket = createResultPacket({
        taskId: taskPacket.id,
        status: "escalation",
        summary: `Team '${team.id}' revision loop exhausted on edge '${advanceResult.edge}' after ${advanceResult.iterations} iterations`,
        deliverables: collectedResults.map((r) => `[${r.sourceAgent}] ${r.summary}`),
        modifiedFiles: collectedResults.flatMap((r) => r.modifiedFiles),
        escalation: {
          reason: `Revision loop exhausted: ${advanceResult.edge}`,
          suggestedAction: "Review the feedback cycle and adjust scope or requirements",
        },
        sourceAgent: `team_${team.id}`,
      });
      return buildResult(
        escalationPacket, false, statesVisited, machineState.iterationCounts,
        machineState.currentState, "retry_exhaustion", "retry_exhaustion",
      );
    }

    if ("error" in advanceResult) {
      // Record the trace entry for this state
      stateTrace.push({
        state: currentStateName,
        agent: agentId,
        resultStatus: resultPacket.status,
        transitionTo: "error",
        enteredAt: stateEnteredAt,
        completedAt: new Date().toISOString(),
      });

      // State machine error
      const errorPacket = createResultPacket({
        taskId: taskPacket.id,
        status: "failure",
        summary: `Team '${team.id}' state machine error: ${advanceResult.error}`,
        deliverables: [],
        modifiedFiles: [],
        sourceAgent: `team_${team.id}`,
      });
      hookRegistry?.dispatchObserver("afterStateTransition", {
        teamId: team.id,
        fromState: currentStateName,
        toState: "error",
        agentId,
        taskId: taskPacket.id,
        resultStatus: resultPacket.status,
      });
      return buildResult(
        errorPacket, false, statesVisited, machineState.iterationCounts,
        machineState.currentState, "validation_failure", "validation_failure",
      );
    }

    // Record the trace entry for this state
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

    // Log state transition
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

  // Build team-level result from collected results
  const allModifiedFiles = [...new Set(collectedResults.flatMap((r) => r.modifiedFiles))];
  const isSuccess = machineState.currentState !== "failed" && lastResult?.status === "success";

  // Determine failure reason if not successful
  let failureReason: FailureReason | undefined;
  if (!isSuccess && lastResult) {
    if (lastResult.status === "escalation") {
      failureReason = "escalation";
    } else if (lastResult.status === "failure") {
      failureReason = "task_failure";
    }
  }

  const teamResult = createResultPacket({
    taskId: taskPacket.id,
    status: isSuccess ? "success" : (lastResult?.status || "failure"),
    summary: isSuccess
      ? `Team '${team.id}' completed successfully. ${collectedResults.map((r) => `[${r.sourceAgent}] ${r.summary}`).join("; ")}`
      : `Team '${team.id}' ended in state '${machineState.currentState}'. ${lastResult?.summary || "No results."}`,
    deliverables: collectedResults.map((r) => `[${r.sourceAgent}] ${r.summary}`),
    modifiedFiles: allModifiedFiles,
    escalation: lastResult?.escalation,
    sourceAgent: `team_${team.id}`,
  });

  return buildResult(
    teamResult, isSuccess, statesVisited, machineState.iterationCounts,
    machineState.currentState, isSuccess ? "success" : (failureReason || "task_failure"), failureReason,
  );
}
