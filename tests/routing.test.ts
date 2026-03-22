import { describe, it, expect } from "vitest";
import {
  validateStateMachine,
  initMachineState,
  advanceState,
  isTerminal,
  getCurrentAgent,
} from "../extensions/shared/routing.js";
import { createResultPacket } from "../extensions/shared/packets.js";
import type { StateMachineDefinition } from "../extensions/shared/types.js";

/** A valid build-team state machine for testing. */
const buildTeamMachine: StateMachineDefinition = {
  startState: "planning",
  terminalStates: ["done", "failed"],
  states: {
    planning: {
      agent: "specialist_planner",
      transitions: [
        { on: "success", to: "review" },
        { on: "failure", to: "failed" },
      ],
    },
    review: {
      agent: "specialist_reviewer",
      transitions: [
        { on: "success", to: "building" },
        { on: "failure", to: "planning" },
        { on: "escalation", to: "failed" },
      ],
    },
    building: {
      agent: "specialist_builder",
      transitions: [
        { on: "success", to: "testing" },
        { on: "failure", to: "planning" },
        { on: "escalation", to: "failed" },
      ],
    },
    testing: {
      agent: "specialist_tester",
      transitions: [
        { on: "success", to: "done" },
        { on: "failure", to: "building" },
        { on: "escalation", to: "failed" },
      ],
    },
    done: {
      agent: "orchestrator",
      transitions: [],
    },
    failed: {
      agent: "orchestrator",
      transitions: [],
    },
  },
};

describe("validateStateMachine", () => {
  it("returns no errors for a valid machine", () => {
    expect(validateStateMachine(buildTeamMachine)).toEqual([]);
  });

  it("catches missing start state", () => {
    const machine: StateMachineDefinition = {
      startState: "nonexistent",
      terminalStates: ["done"],
      states: {
        done: { agent: "x", transitions: [] },
      },
    };
    const errors = validateStateMachine(machine);
    expect(errors).toContain(
      "Start state 'nonexistent' is not in the state list"
    );
  });

  it("catches missing terminal state", () => {
    const machine: StateMachineDefinition = {
      startState: "a",
      terminalStates: ["nonexistent"],
      states: {
        a: {
          agent: "x",
          transitions: [{ on: "success", to: "a" }],
        },
      },
    };
    const errors = validateStateMachine(machine);
    expect(errors).toContain(
      "Terminal state 'nonexistent' is not in the state list"
    );
  });

  it("catches transitions to unknown states", () => {
    const machine: StateMachineDefinition = {
      startState: "a",
      terminalStates: ["a"],
      states: {
        a: {
          agent: "x",
          transitions: [{ on: "success", to: "nowhere" }],
        },
      },
    };
    const errors = validateStateMachine(machine);
    expect(errors).toContain(
      "State 'a' has transition to unknown state 'nowhere'"
    );
  });

  it("catches terminal states with transitions", () => {
    const machine: StateMachineDefinition = {
      startState: "a",
      terminalStates: ["a"],
      states: {
        a: {
          agent: "x",
          transitions: [{ on: "success", to: "a" }],
        },
      },
    };
    const errors = validateStateMachine(machine);
    expect(errors).toContain(
      "Terminal state 'a' should not have transitions"
    );
  });

  it("catches dead-end non-terminal states", () => {
    const machine: StateMachineDefinition = {
      startState: "a",
      terminalStates: ["b"],
      states: {
        a: {
          agent: "x",
          transitions: [],
        },
        b: {
          agent: "y",
          transitions: [],
        },
      },
    };
    const errors = validateStateMachine(machine);
    expect(errors).toContain(
      "Non-terminal state 'a' has no transitions (would be a dead end)"
    );
  });
});

describe("initMachineState", () => {
  it("starts at the defined start state with empty history", () => {
    const state = initMachineState(buildTeamMachine);
    expect(state.currentState).toBe("planning");
    expect(state.history).toEqual([]);
  });
});

describe("advanceState", () => {
  function makeResult(status: "success" | "failure" | "escalation") {
    return createResultPacket({
      taskId: "task_001",
      status,
      summary: "test",
      deliverables: [],
      modifiedFiles: [],
      sourceAgent: "test",
    });
  }

  it("advances on a valid transition", () => {
    const state = initMachineState(buildTeamMachine);
    const result = advanceState(buildTeamMachine, state, makeResult("success"));

    expect("newState" in result).toBe(true);
    if ("newState" in result) {
      expect(result.newState.currentState).toBe("review");
      expect(result.newState.history).toHaveLength(1);
      expect(result.newState.history[0].from).toBe("planning");
      expect(result.newState.history[0].to).toBe("review");
      expect(result.newState.history[0].on).toBe("success");
    }
  });

  it("rejects invalid transitions", () => {
    const state = initMachineState(buildTeamMachine);
    // "partial" has no transition from "planning"
    const result = advanceState(buildTeamMachine, state, makeResult("escalation"));

    // planning only has success→review and failure→failed, not escalation
    // Actually, let's check: planning has success→review and failure→failed
    // escalation is not defined for planning
    expect("error" in result).toBe(true);
  });

  it("rejects advancement from terminal state", () => {
    const state = { currentState: "done", history: [] };
    const result = advanceState(buildTeamMachine, state, makeResult("success"));

    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toContain("terminal state");
    }
  });

  it("follows a full successful path", () => {
    let state = initMachineState(buildTeamMachine);

    // planning → review
    let result = advanceState(buildTeamMachine, state, makeResult("success"));
    expect("newState" in result).toBe(true);
    if ("newState" in result) state = result.newState;

    // review → building
    result = advanceState(buildTeamMachine, state, makeResult("success"));
    expect("newState" in result).toBe(true);
    if ("newState" in result) state = result.newState;

    // building → testing
    result = advanceState(buildTeamMachine, state, makeResult("success"));
    expect("newState" in result).toBe(true);
    if ("newState" in result) state = result.newState;

    // testing → done
    result = advanceState(buildTeamMachine, state, makeResult("success"));
    expect("newState" in result).toBe(true);
    if ("newState" in result) state = result.newState;

    expect(state.currentState).toBe("done");
    expect(state.history).toHaveLength(4);
  });

  it("follows a failure-and-retry path", () => {
    let state = initMachineState(buildTeamMachine);

    // planning → review (success)
    let result = advanceState(buildTeamMachine, state, makeResult("success"));
    if ("newState" in result) state = result.newState;

    // review → planning (failure sends back to planning)
    result = advanceState(buildTeamMachine, state, makeResult("failure"));
    expect("newState" in result).toBe(true);
    if ("newState" in result) {
      expect(result.newState.currentState).toBe("planning");
      state = result.newState;
    }

    expect(state.history).toHaveLength(2);
  });
});

describe("isTerminal", () => {
  it("returns true for terminal states", () => {
    expect(
      isTerminal(buildTeamMachine, { currentState: "done", history: [] })
    ).toBe(true);
    expect(
      isTerminal(buildTeamMachine, { currentState: "failed", history: [] })
    ).toBe(true);
  });

  it("returns false for non-terminal states", () => {
    expect(
      isTerminal(buildTeamMachine, { currentState: "planning", history: [] })
    ).toBe(false);
    expect(
      isTerminal(buildTeamMachine, { currentState: "building", history: [] })
    ).toBe(false);
  });
});

describe("getCurrentAgent", () => {
  it("returns the agent for the current state", () => {
    expect(
      getCurrentAgent(buildTeamMachine, { currentState: "planning", history: [] })
    ).toBe("specialist_planner");
    expect(
      getCurrentAgent(buildTeamMachine, { currentState: "building", history: [] })
    ).toBe("specialist_builder");
    expect(
      getCurrentAgent(buildTeamMachine, { currentState: "testing", history: [] })
    ).toBe("specialist_tester");
  });

  it("returns undefined for unknown states", () => {
    expect(
      getCurrentAgent(buildTeamMachine, {
        currentState: "nonexistent",
        history: [],
      })
    ).toBeUndefined();
  });
});
