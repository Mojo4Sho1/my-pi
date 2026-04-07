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
        { on: "success", to: "building" },
        { on: "failure", to: "failed" },
      ],
    },
    building: {
      agent: "specialist_builder",
      transitions: [
        { on: "success", to: "review" },
        { on: "failure", to: "planning" },
        { on: "escalation", to: "failed" },
      ],
    },
    review: {
      agent: "specialist_reviewer",
      transitions: [
        { on: "success", to: "testing" },
        { on: "failure", to: "building" },
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
  it("starts at the defined start state with empty history and iteration counts", () => {
    const state = initMachineState(buildTeamMachine);
    expect(state.currentState).toBe("planning");
    expect(state.history).toEqual([]);
    expect(state.iterationCounts).toEqual({});
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
      expect(result.newState.currentState).toBe("building");
      expect(result.newState.history).toHaveLength(1);
      expect(result.newState.history[0].from).toBe("planning");
      expect(result.newState.history[0].to).toBe("building");
      expect(result.newState.history[0].on).toBe("success");
    }
  });

  it("rejects invalid transitions", () => {
    const state = initMachineState(buildTeamMachine);
    // "partial" has no transition from "planning"
    const result = advanceState(buildTeamMachine, state, makeResult("escalation"));

    // planning only has success→building and failure→failed, not escalation
    // Actually, let's check: planning has success→building and failure→failed
    // escalation is not defined for planning
    expect("error" in result).toBe(true);
  });

  it("rejects advancement from terminal state", () => {
    const state = { currentState: "done", history: [], iterationCounts: {} };
    const result = advanceState(buildTeamMachine, state, makeResult("success"));

    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toContain("terminal state");
    }
  });

  it("follows a full successful path", () => {
    let state = initMachineState(buildTeamMachine);

    // planning → building
    let result = advanceState(buildTeamMachine, state, makeResult("success"));
    expect("newState" in result).toBe(true);
    if ("newState" in result) state = result.newState;

    // building → review
    result = advanceState(buildTeamMachine, state, makeResult("success"));
    expect("newState" in result).toBe(true);
    if ("newState" in result) state = result.newState;

    // review → testing
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

    // planning → building (success)
    let result = advanceState(buildTeamMachine, state, makeResult("success"));
    if ("newState" in result) state = result.newState;

    // building → planning (failure sends back to planning)
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
      isTerminal(buildTeamMachine, { currentState: "done", history: [], iterationCounts: {} })
    ).toBe(true);
    expect(
      isTerminal(buildTeamMachine, { currentState: "failed", history: [], iterationCounts: {} })
    ).toBe(true);
  });

  it("returns false for non-terminal states", () => {
    expect(
      isTerminal(buildTeamMachine, { currentState: "planning", history: [], iterationCounts: {} })
    ).toBe(false);
    expect(
      isTerminal(buildTeamMachine, { currentState: "building", history: [], iterationCounts: {} })
    ).toBe(false);
  });
});

describe("getCurrentAgent", () => {
  it("returns the agent for the current state", () => {
    expect(
      getCurrentAgent(buildTeamMachine, { currentState: "planning", history: [], iterationCounts: {} })
    ).toBe("specialist_planner");
    expect(
      getCurrentAgent(buildTeamMachine, { currentState: "building", history: [], iterationCounts: {} })
    ).toBe("specialist_builder");
    expect(
      getCurrentAgent(buildTeamMachine, { currentState: "testing", history: [], iterationCounts: {} })
    ).toBe("specialist_tester");
  });

  it("returns undefined for unknown states", () => {
    expect(
      getCurrentAgent(buildTeamMachine, {
        currentState: "nonexistent",
        history: [],
        iterationCounts: {},
      })
    ).toBeUndefined();
  });
});

// --- Stage 4b: Extended routing tests ---

/** Machine with loop transitions and maxIterations guards */
const loopMachine: StateMachineDefinition = {
  startState: "write",
  terminalStates: ["done", "failed"],
  states: {
    write: {
      agent: "specialist_builder",
      transitions: [
        { on: "success", to: "critique" },
        { on: "failure", to: "failed" },
      ],
    },
    critique: {
      agent: "specialist_reviewer",
      transitions: [
        { on: "success", to: "done" },
        { on: "failure", to: "write", maxIterations: 2 },
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

describe("validateStateMachine (extended)", () => {
  it("accepts valid maxIterations", () => {
    expect(validateStateMachine(loopMachine)).toEqual([]);
  });

  it("rejects maxIterations of 0", () => {
    const machine: StateMachineDefinition = {
      startState: "a",
      terminalStates: ["b"],
      states: {
        a: {
          agent: "x",
          transitions: [{ on: "success", to: "a", maxIterations: 0 }],
        },
        b: { agent: "y", transitions: [] },
      },
    };
    const errors = validateStateMachine(machine);
    expect(errors.some((e) => e.includes("invalid maxIterations"))).toBe(true);
  });

  it("rejects negative maxIterations", () => {
    const machine: StateMachineDefinition = {
      startState: "a",
      terminalStates: ["b"],
      states: {
        a: {
          agent: "x",
          transitions: [{ on: "success", to: "a", maxIterations: -1 }],
        },
        b: { agent: "y", transitions: [] },
      },
    };
    const errors = validateStateMachine(machine);
    expect(errors.some((e) => e.includes("invalid maxIterations"))).toBe(true);
  });
});

describe("advanceState (loop iterations)", () => {
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

  it("allows loop transition within maxIterations", () => {
    let state = initMachineState(loopMachine);

    // write → critique (success)
    let result = advanceState(loopMachine, state, makeResult("success"));
    expect("newState" in result).toBe(true);
    if ("newState" in result) state = result.newState;

    // critique → write (failure, iteration 1 of 2)
    result = advanceState(loopMachine, state, makeResult("failure"));
    expect("newState" in result).toBe(true);
    if ("newState" in result) {
      expect(result.newState.currentState).toBe("write");
      expect(result.newState.iterationCounts["critique->write"]).toBe(1);
      state = result.newState;
    }
  });

  it("returns exhausted when maxIterations is reached", () => {
    let state = initMachineState(loopMachine);

    // write → critique
    let result = advanceState(loopMachine, state, makeResult("success"));
    if ("newState" in result) state = result.newState;

    // critique → write (iteration 1)
    result = advanceState(loopMachine, state, makeResult("failure"));
    if ("newState" in result) state = result.newState;

    // write → critique
    result = advanceState(loopMachine, state, makeResult("success"));
    if ("newState" in result) state = result.newState;

    // critique → write (iteration 2)
    result = advanceState(loopMachine, state, makeResult("failure"));
    if ("newState" in result) state = result.newState;

    // write → critique
    result = advanceState(loopMachine, state, makeResult("success"));
    if ("newState" in result) state = result.newState;

    // critique → write (iteration 3 — should be exhausted, maxIterations=2)
    result = advanceState(loopMachine, state, makeResult("failure"));
    expect("exhausted" in result).toBe(true);
    if ("exhausted" in result) {
      expect(result.edge).toBe("critique->write");
      expect(result.iterations).toBe(2);
    }
  });

  it("does not track iterations for non-guarded transitions", () => {
    let state = initMachineState(loopMachine);

    // write → critique (success — no maxIterations)
    const result = advanceState(loopMachine, state, makeResult("success"));
    expect("newState" in result).toBe(true);
    if ("newState" in result) {
      // No iteration count recorded for non-guarded edge
      expect(result.newState.iterationCounts).toEqual({});
    }
  });

  it("tracks independent loop edges separately", () => {
    const multiLoopMachine: StateMachineDefinition = {
      startState: "a",
      terminalStates: ["done"],
      states: {
        a: {
          agent: "x",
          transitions: [
            { on: "success", to: "b" },
            { on: "failure", to: "a", maxIterations: 3 },
          ],
        },
        b: {
          agent: "y",
          transitions: [
            { on: "success", to: "done" },
            { on: "failure", to: "a", maxIterations: 2 },
          ],
        },
        done: { agent: "z", transitions: [] },
      },
    };

    let state = initMachineState(multiLoopMachine);

    // a → a (self-loop, iteration 1)
    let result = advanceState(multiLoopMachine, state, makeResult("failure"));
    if ("newState" in result) state = result.newState;
    expect(state.iterationCounts["a->a"]).toBe(1);

    // a → b
    result = advanceState(multiLoopMachine, state, makeResult("success"));
    if ("newState" in result) state = result.newState;

    // b → a (different edge, iteration 1)
    result = advanceState(multiLoopMachine, state, makeResult("failure"));
    if ("newState" in result) state = result.newState;
    expect(state.iterationCounts["b->a"]).toBe(1);
    expect(state.iterationCounts["a->a"]).toBe(1); // still 1 from before
  });
});
