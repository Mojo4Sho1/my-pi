/**
 * State machine routing utilities for team execution.
 *
 * Provides functions to validate state machine definitions,
 * check transition legality, and advance state.
 */

import type {
  StateMachineDefinition,
  PacketStatus,
  ResultPacket,
} from "./types.js";

export interface MachineState {
  currentState: string;
  history: Array<{
    from: string;
    to: string;
    on: PacketStatus;
    timestamp: string;
  }>;
}

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

  // All transition targets must exist
  for (const [stateName, state] of Object.entries(definition.states)) {
    for (const transition of state.transitions) {
      if (!stateNames.includes(transition.to)) {
        errors.push(
          `State '${stateName}' has transition to unknown state '${transition.to}'`
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
  };
}

/**
 * Attempt to advance the state machine based on a result packet.
 * Returns the new state, or an error if the transition is invalid.
 */
export function advanceState(
  definition: StateMachineDefinition,
  state: MachineState,
  result: ResultPacket
): { newState: MachineState } | { error: string } {
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
