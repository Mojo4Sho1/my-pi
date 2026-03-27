import { describe, it, expect } from "vitest";
import {
  validateTeamDefinition,
  type TeamValidationContext,
} from "../extensions/shared/validation.js";
import { BUILD_TEAM } from "../extensions/teams/definitions.js";
import { PLANNER_PROMPT_CONFIG } from "../extensions/specialists/planner/prompt.js";
import { BUILDER_PROMPT_CONFIG } from "../extensions/specialists/builder/prompt.js";
import { REVIEWER_PROMPT_CONFIG } from "../extensions/specialists/reviewer/prompt.js";
import { TESTER_PROMPT_CONFIG } from "../extensions/specialists/tester/prompt.js";
import type { TeamDefinition, InputContract, OutputContract } from "../extensions/shared/types.js";

// Build the validation context from real specialist prompt configs
const KNOWN_SPECIALIST_IDS = [
  "specialist_planner",
  "specialist_builder",
  "specialist_reviewer",
  "specialist_tester",
];

const SPECIALIST_CONTRACTS: Record<string, { input: InputContract; output: OutputContract }> = {
  specialist_planner: {
    input: PLANNER_PROMPT_CONFIG.inputContract!,
    output: PLANNER_PROMPT_CONFIG.outputContract!,
  },
  specialist_builder: {
    input: BUILDER_PROMPT_CONFIG.inputContract!,
    output: BUILDER_PROMPT_CONFIG.outputContract!,
  },
  specialist_reviewer: {
    input: REVIEWER_PROMPT_CONFIG.inputContract!,
    output: REVIEWER_PROMPT_CONFIG.outputContract!,
  },
  specialist_tester: {
    input: TESTER_PROMPT_CONFIG.inputContract!,
    output: TESTER_PROMPT_CONFIG.outputContract!,
  },
};

const REAL_CONTEXT: TeamValidationContext = {
  knownSpecialistIds: KNOWN_SPECIALIST_IDS,
  specialistContracts: SPECIALIST_CONTRACTS,
};

// --- Real team definitions ---

describe("validateTeamDefinition — real definitions", () => {
  it("validates BUILD_TEAM without errors", () => {
    const errors = validateTeamDefinition(BUILD_TEAM, REAL_CONTEXT);
    expect(errors).toEqual([]);
  });
});

// --- Synthetic bad team definitions ---

describe("validateTeamDefinition — synthetic bad definitions", () => {
  function makeMinimalTeam(overrides?: Partial<TeamDefinition>): TeamDefinition {
    return {
      id: "test-team",
      name: "Test Team",
      purpose: "Testing",
      members: ["specialist_planner", "specialist_builder"],
      entryContract: { fields: [] },
      exitContract: { fields: [] },
      entryPacketTypes: ["task"],
      exitPacketTypes: ["result"],
      activationConditions: [],
      escalationConditions: [],
      states: {
        startState: "plan",
        terminalStates: ["done"],
        states: {
          plan: {
            agent: "specialist_planner",
            transitions: [{ on: "success", to: "build" }],
          },
          build: {
            agent: "specialist_builder",
            transitions: [{ on: "success", to: "done" }],
          },
          done: {
            agent: "orchestrator",
            transitions: [],
          },
        },
      },
      ...overrides,
    };
  }

  it("reports unknown specialist in members", () => {
    const team = makeMinimalTeam({
      members: ["specialist_planner", "specialist_unknown"],
    });
    // Also update the state machine to reference the unknown agent
    team.states.states["build"] = {
      agent: "specialist_unknown",
      transitions: [{ on: "success", to: "done" }],
    };
    const errors = validateTeamDefinition(team, REAL_CONTEXT);
    expect(errors.some((e) => e.includes("specialist_unknown") && e.includes("Unknown specialist"))).toBe(true);
  });

  it("reports state machine agent not in members", () => {
    const team = makeMinimalTeam();
    // Reference an agent that's in knownSpecialistIds but not in this team's members
    team.states.states["build"] = {
      agent: "specialist_reviewer",
      transitions: [{ on: "success", to: "done" }],
    };
    const errors = validateTeamDefinition(team, REAL_CONTEXT);
    expect(errors.some((e) => e.includes("specialist_reviewer") && e.includes("not a team member"))).toBe(true);
  });

  it("reports incompatible contracts at transition", () => {
    // Create a team where specialist A's output can't satisfy specialist B's input
    const context: TeamValidationContext = {
      knownSpecialistIds: ["spec_a", "spec_b"],
      specialistContracts: {
        spec_a: {
          input: { fields: [] },
          output: {
            fields: [
              { name: "foo", type: "string", required: true, description: "A foo" },
            ],
          },
        },
        spec_b: {
          input: {
            fields: [
              { name: "bar", type: "number", required: true, description: "Needs bar" },
            ],
          },
          output: { fields: [] },
        },
      },
    };

    const team: TeamDefinition = {
      id: "bad-contracts-team",
      name: "Bad Contracts Team",
      purpose: "Test contract mismatch",
      members: ["spec_a", "spec_b"],
      entryContract: { fields: [] },
      exitContract: { fields: [] },
      entryPacketTypes: ["task"],
      exitPacketTypes: ["result"],
      activationConditions: [],
      escalationConditions: [],
      states: {
        startState: "step_a",
        terminalStates: ["done"],
        states: {
          step_a: {
            agent: "spec_a",
            transitions: [{ on: "success", to: "step_b" }],
          },
          step_b: {
            agent: "spec_b",
            transitions: [{ on: "success", to: "done" }],
          },
          done: {
            agent: "orchestrator",
            transitions: [],
          },
        },
      },
    };

    const errors = validateTeamDefinition(team, context);
    expect(errors.some((e) => e.includes("Incompatible contracts"))).toBe(true);
    expect(errors.some((e) => e.includes("bar"))).toBe(true);
  });

  it("reports state machine structural errors (reuses validateStateMachine)", () => {
    const team = makeMinimalTeam();
    // Point start state to a non-existent state
    team.states.startState = "nonexistent";
    const errors = validateTeamDefinition(team, REAL_CONTEXT);
    expect(errors.some((e) => e.includes("nonexistent"))).toBe(true);
  });

  it("reports transition target that references unknown agent and is not orchestrator", () => {
    const team = makeMinimalTeam({
      members: ["specialist_planner", "specialist_builder"],
    });
    // Add a state with an agent that is neither a member nor orchestrator
    team.states.states["rogue"] = {
      agent: "specialist_rogue",
      transitions: [{ on: "success", to: "done" }],
    };
    team.states.states["build"].transitions = [{ on: "success", to: "rogue" }];

    const errors = validateTeamDefinition(team, REAL_CONTEXT);
    expect(errors.some((e) => e.includes("specialist_rogue") && e.includes("not a team member"))).toBe(true);
  });

  it("returns no errors for a well-formed minimal team", () => {
    const team = makeMinimalTeam();
    const errors = validateTeamDefinition(team, REAL_CONTEXT);
    expect(errors).toEqual([]);
  });

  it("allows orchestrator as agent in terminal states", () => {
    const team = makeMinimalTeam();
    // Ensure orchestrator in terminal state doesn't trigger errors
    expect(team.states.states["done"].agent).toBe("orchestrator");
    const errors = validateTeamDefinition(team, REAL_CONTEXT);
    expect(errors).toEqual([]);
  });
});
