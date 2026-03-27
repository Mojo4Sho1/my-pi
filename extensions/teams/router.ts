/**
 * Team router — executes a team's state machine to completion (Stage 4b).
 *
 * Routes task packets between specialists within a team,
 * validates I/O contracts at transitions, handles revision loops,
 * and returns a single team-level result packet.
 *
 * Teams are opaque to the orchestrator (Decision #14).
 */

import type { TeamDefinition, TaskPacket, ResultPacket } from "../shared/types.js";
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
import { buildContextFromContract } from "../shared/contracts.js";
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

/**
 * Execute a team's state machine to completion.
 *
 * Delegates to specialists at each state, advances the state machine
 * based on results, and handles loop exhaustion as escalation.
 * Returns a single team-level ResultPacket.
 */
export async function executeTeam(
  team: TeamDefinition,
  taskPacket: TaskPacket,
  signal?: AbortSignal,
): Promise<TeamExecutionResult> {
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
    return {
      resultPacket: failurePacket,
      success: false,
      statesVisited: [],
      iterationsUsed: {},
    };
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
      return {
        resultPacket: abortPacket,
        success: false,
        statesVisited,
        iterationsUsed: machineState.iterationCounts,
      };
    }

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
      return {
        resultPacket: errorPacket,
        success: false,
        statesVisited,
        iterationsUsed: machineState.iterationCounts,
      };
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
      return {
        resultPacket: errorPacket,
        success: false,
        statesVisited,
        iterationsUsed: machineState.iterationCounts,
      };
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
      allowedWriteSet: specialistId === "planner" || specialistId === "reviewer"
        ? []
        : taskPacket.allowedWriteSet,
      acceptanceCriteria: [`Complete the ${specialistId} phase for team '${team.id}'`],
      context,
      targetAgent: agentId,
      sourceAgent: `team_${team.id}`,
    });

    // Delegate to the specialist
    const { resultPacket } = await delegateToSpecialist({
      promptConfig,
      taskPacket: specialistTaskPacket,
      signal,
    });

    collectedResults.push(resultPacket);
    lastResult = resultPacket;

    // Advance the state machine
    const advanceResult = advanceState(team.states, machineState, resultPacket);

    if ("exhausted" in advanceResult) {
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
      return {
        resultPacket: escalationPacket,
        success: false,
        statesVisited,
        iterationsUsed: machineState.iterationCounts,
      };
    }

    if ("error" in advanceResult) {
      // State machine error
      const errorPacket = createResultPacket({
        taskId: taskPacket.id,
        status: "failure",
        summary: `Team '${team.id}' state machine error: ${advanceResult.error}`,
        deliverables: [],
        modifiedFiles: [],
        sourceAgent: `team_${team.id}`,
      });
      return {
        resultPacket: errorPacket,
        success: false,
        statesVisited,
        iterationsUsed: machineState.iterationCounts,
      };
    }

    machineState = advanceResult.newState;
    statesVisited.push(machineState.currentState);
  }

  // Build team-level result from collected results
  const allModifiedFiles = [...new Set(collectedResults.flatMap((r) => r.modifiedFiles))];
  const isSuccess = machineState.currentState !== "failed" && lastResult?.status === "success";

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

  return {
    resultPacket: teamResult,
    success: isSuccess,
    statesVisited,
    iterationsUsed: machineState.iterationCounts,
  };
}
