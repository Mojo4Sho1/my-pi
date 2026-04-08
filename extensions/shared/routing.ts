/**
 * State machine routing utilities for team execution.
 *
 * Provides functions to validate state machine definitions,
 * check transition legality, and advance state.
 *
 * Extended in Stage 4b with iteration tracking for loop edges
 * and maxIterations guards.
 */

import type {
  StateMachineDefinition,
  PacketStatus,
  ResultPacket,
} from "./types.js";

const EXPLICIT_NON_TERMINAL_STATUSES: readonly PacketStatus[] = [
  "success",
  "partial",
  "failure",
  "escalation",
];

export interface MachineState {
  currentState: string;
  history: Array<{
    from: string;
    to: string;
    on: PacketStatus;
    timestamp: string;
  }>;
  /** Tracks iteration counts for loop edges: "fromState->toState" -> count */
  iterationCounts: Record<string, number>;
}

/** Returned by advanceState when a loop edge exceeds its maxIterations guard */
export interface ExhaustedResult {
  exhausted: true;
  edge: string;
  iterations: number;
}

export type AdvanceResult =
  | { newState: MachineState }
  | { error: string }
  | ExhaustedResult;

/**
 * Validate a state machine definition for structural correctness.
 * Returns an array of validation errors (empty if valid).
 */
export function validateStateMachine(
  definition: StateMachineDefinition
): string[] {
  const errors: string[] = [];
  const stateNames = Object.keys(definition.states);

  // Start state must exist
  if (!stateNames.includes(definition.startState)) {
    errors.push(
      `Start state '${definition.startState}' is not in the state list`
    );
  }

  // Terminal states must exist
  for (const terminal of definition.terminalStates) {
    if (!stateNames.includes(terminal)) {
      errors.push(`Terminal state '${terminal}' is not in the state list`);
    }
  }

  // All transition targets must exist, and validate maxIterations
  for (const [stateName, state] of Object.entries(definition.states)) {
    const seenStatuses = new Set<PacketStatus>();

    for (const transition of state.transitions) {
      if (seenStatuses.has(transition.on)) {
        errors.push(
          `State '${stateName}' has multiple transitions for status '${transition.on}'`
        );
      }
      seenStatuses.add(transition.on);

      if (!stateNames.includes(transition.to)) {
        errors.push(
          `State '${stateName}' has transition to unknown state '${transition.to}'`
        );
      }
      if (
        transition.maxIterations !== undefined &&
        (typeof transition.maxIterations !== "number" ||
          !Number.isInteger(transition.maxIterations) ||
          transition.maxIterations < 1)
      ) {
        errors.push(
          `State '${stateName}' transition to '${transition.to}' has invalid maxIterations: ${transition.maxIterations} (must be a positive integer)`
        );
      }
    }
  }

  // Terminal states should not have transitions
  for (const terminal of definition.terminalStates) {
    const state = definition.states[terminal];
    if (state && state.transitions.length > 0) {
      errors.push(`Terminal state '${terminal}' should not have transitions`);
    }
  }

  // All non-terminal states should have at least one transition
  for (const [stateName, state] of Object.entries(definition.states)) {
    if (
      !definition.terminalStates.includes(stateName) &&
      state.transitions.length === 0
    ) {
      errors.push(
        `Non-terminal state '${stateName}' has no transitions (would be a dead end)`
      );
    }
  }

  for (const [stateName, state] of Object.entries(definition.states)) {
    if (definition.terminalStates.includes(stateName)) {
      continue;
    }

    const statusSet = new Set(state.transitions.map((transition) => transition.on));
    for (const status of EXPLICIT_NON_TERMINAL_STATUSES) {
      if (!statusSet.has(status)) {
        errors.push(
          `Non-terminal state '${stateName}' must define an explicit '${status}' transition`
        );
      }
    }
  }

  return errors;
}

/**
 * Initialize a new machine state at the start state.
 */
export function initMachineState(
  definition: StateMachineDefinition
): MachineState {
  return {
    currentState: definition.startState,
    history: [],
    iterationCounts: {},
  };
}

/**
 * Attempt to advance the state machine based on a result packet.
 * Returns the new state, an error, or an exhaustion indicator.
 *
 * When a transition has maxIterations and the loop count has been
 * reached, returns { exhausted: true } instead of advancing.
 */
export function advanceState(
  definition: StateMachineDefinition,
  state: MachineState,
  result: ResultPacket
): AdvanceResult {
  const currentStateDef = definition.states[state.currentState];

  if (!currentStateDef) {
    return { error: `Current state '${state.currentState}' not found` };
  }

  if (definition.terminalStates.includes(state.currentState)) {
    return {
      error: `Cannot advance from terminal state '${state.currentState}'`,
    };
  }

  // Find matching transition
  const transition = currentStateDef.transitions.find(
    (t) => t.on === result.status
  );

  if (!transition) {
    return {
      error: `No transition from '${state.currentState}' on status '${result.status}'`,
    };
  }

  // Check maxIterations guard for loop edges
  const edgeKey = `${state.currentState}->${transition.to}`;
  const currentCount = state.iterationCounts[edgeKey] || 0;

  if (
    transition.maxIterations !== undefined &&
    currentCount >= transition.maxIterations
  ) {
    return {
      exhausted: true,
      edge: edgeKey,
      iterations: currentCount,
    };
  }

  // Update iteration count for this edge
  const newIterationCounts = { ...state.iterationCounts };
  if (transition.maxIterations !== undefined) {
    newIterationCounts[edgeKey] = currentCount + 1;
  }

  return {
    newState: {
      currentState: transition.to,
      history: [
        ...state.history,
        {
          from: state.currentState,
          to: transition.to,
          on: result.status,
          timestamp: new Date().toISOString(),
        },
      ],
      iterationCounts: newIterationCounts,
    },
  };
}

/**
 * Check if the state machine is in a terminal state.
 */
export function isTerminal(
  definition: StateMachineDefinition,
  state: MachineState
): boolean {
  return definition.terminalStates.includes(state.currentState);
}

/**
 * Get the agent ID assigned to the current state.
 */
export function getCurrentAgent(
  definition: StateMachineDefinition,
  state: MachineState
): string | undefined {
  return definition.states[state.currentState]?.agent;
}
