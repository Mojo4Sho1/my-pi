import { readFileSync } from "node:fs";
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

function extractYamlBlock(source: string, key: string, indent: number): string {
  const lines = source.split("\n");
  const target = `${" ".repeat(indent)}${key}:`;
  const startIndex = lines.findIndex((line) => line === target);

  if (startIndex === -1) {
    throw new Error(`Missing YAML block '${target}'`);
  }

  const blockLines: string[] = [];
  for (let index = startIndex + 1; index < lines.length; index++) {
    const line = lines[index];
    const trimmed = line.trim();
    const currentIndent = line.match(/^ */)?.[0].length ?? 0;

    if (trimmed !== "" && currentIndent <= indent) {
      break;
    }

    blockLines.push(line);
  }

  return blockLines.join("\n");
}

function parseYamlMappingBlock(block: string, indent: number): Record<string, string> {
  const mapping: Record<string, string> = {};
  const linePattern = new RegExp(`^\\s{${indent}}([a-zA-Z0-9_-]+):\\s+(.+)$`);

  for (const line of block.split("\n")) {
    const match = line.match(linePattern);
    if (match) {
      mapping[match[1]] = match[2].trim();
    }
  }

  return mapping;
}

function parseYamlTransitions(statesBlock: string, state: string): Array<{
  on: string;
  to: string;
  maxIterations?: number;
}> {
  const stateBlock = extractYamlBlock(statesBlock, state, 4);
  const transitionsBlock = extractYamlBlock(stateBlock, "transitions", 6);
  const transitions: Array<{ on: string; to: string; maxIterations?: number }> = [];
  let currentTransition: { on: string; to: string; maxIterations?: number } | undefined;

  for (const line of transitionsBlock.split("\n")) {
    const onMatch = line.match(/^\s{8}- on: ([a-z_]+)$/);
    if (onMatch) {
      currentTransition = { on: onMatch[1], to: "" };
      transitions.push(currentTransition);
      continue;
    }

    const toMatch = line.match(/^\s{10}to: ([a-z_]+)$/);
    if (toMatch && currentTransition) {
      currentTransition.to = toMatch[1];
      continue;
    }

    const maxIterationsMatch = line.match(/^\s{10}max_iterations: (\d+)$/);
    if (maxIterationsMatch && currentTransition) {
      currentTransition.maxIterations = Number(maxIterationsMatch[1]);
    }
  }

  return transitions;
}

// --- Real team definitions ---

describe("validateTeamDefinition — real definitions", () => {
  it("validates BUILD_TEAM without errors", () => {
    const errors = validateTeamDefinition(BUILD_TEAM, REAL_CONTEXT);
    expect(errors).toEqual([]);
  });

  it("keeps the build-team YAML starter spec aligned with the runtime mapping", () => {
    const teamSpec = readFileSync(
      new URL("../specs/teams/build-team.yaml", import.meta.url),
      "utf8"
    );

    const expectedMapping = {
      planning: "specialist_planner",
      building: "specialist_builder",
      testing: "specialist_tester",
      rebuilding: "specialist_builder",
      review: "specialist_reviewer",
      done: "orchestrator",
      failed: "orchestrator",
    };
    const expectedTransitions = {
      planning: [
        { on: "success", to: "building" },
        { on: "partial", to: "failed" },
        { on: "failure", to: "failed" },
        { on: "escalation", to: "failed" },
      ],
      building: [
        { on: "success", to: "testing" },
        { on: "partial", to: "planning", maxIterations: 2 },
        { on: "failure", to: "planning", maxIterations: 2 },
        { on: "escalation", to: "failed" },
      ],
      testing: [
        { on: "success", to: "rebuilding" },
        { on: "partial", to: "rebuilding", maxIterations: 2 },
        { on: "failure", to: "rebuilding", maxIterations: 2 },
        { on: "escalation", to: "failed" },
      ],
      rebuilding: [
        { on: "success", to: "review" },
        { on: "partial", to: "rebuilding", maxIterations: 2 },
        { on: "failure", to: "rebuilding", maxIterations: 2 },
        { on: "escalation", to: "failed" },
      ],
      review: [
        { on: "success", to: "done" },
        { on: "partial", to: "rebuilding", maxIterations: 2 },
        { on: "failure", to: "rebuilding", maxIterations: 2 },
        { on: "escalation", to: "failed" },
      ],
    };

    expect(BUILD_TEAM.states.startState).toBe("planning");
    expect(BUILD_TEAM.states.terminalStates).toEqual(["done", "failed"]);
    expect(
      Object.fromEntries(
        Object.entries(BUILD_TEAM.states.states).map(([state, config]) => [state, config.agent])
      )
    ).toEqual(expectedMapping);

    const mappingBlock = extractYamlBlock(teamSpec, "state_to_specialist_mapping", 0);
    expect(parseYamlMappingBlock(mappingBlock, 2)).toEqual(expectedMapping);

    const stateMachineBlock = extractYamlBlock(teamSpec, "state_machine", 0);
    expect(stateMachineBlock).toContain("start_state: planning");
    expect(stateMachineBlock).toContain("- done");
    expect(stateMachineBlock).toContain("- failed");

    const statesBlock = extractYamlBlock(stateMachineBlock, "states", 2);
    for (const [state, transitions] of Object.entries(expectedTransitions)) {
      const runtimeTransitions = BUILD_TEAM.states.states[state].transitions.map((transition) => ({
        on: transition.on,
        to: transition.to,
        ...(transition.maxIterations !== undefined
          ? { maxIterations: transition.maxIterations }
          : {}),
      }));

      expect(runtimeTransitions).toEqual(transitions);
      expect(parseYamlTransitions(statesBlock, state)).toEqual(transitions);
    }

    expect(teamSpec).toContain(
      "This is a future source-of-truth authoring input, not current runtime authority."
    );
    expect(teamSpec).toContain(
      "testing is tester-authorship, not generic validation-running."
    );
    expect(teamSpec).toContain(
      "Move to review after the second builder verification/fix pass."
    );
  });

  it("keeps the schema doc explicit about YAML authoring versus TypeScript runtime authority", () => {
    const schemaDoc = readFileSync(
      new URL("../specs/schemas/SPECIALIST_AND_TEAM_YAML_SPEC.md", import.meta.url),
      "utf8"
    );

    expect(schemaDoc).toContain("YAML is not yet runtime authority.");
    expect(schemaDoc).toContain("Current runtime authority remains in TypeScript");
    expect(schemaDoc).toContain(
      "the canonical team flow is `planner -> builder -> tester -> builder -> reviewer -> done`"
    );
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
            transitions: [
              { on: "success", to: "build" },
              { on: "partial", to: "done" },
              { on: "failure", to: "done" },
              { on: "escalation", to: "done" },
            ],
          },
          build: {
            agent: "specialist_builder",
            transitions: [
              { on: "success", to: "done" },
              { on: "partial", to: "done" },
              { on: "failure", to: "done" },
              { on: "escalation", to: "done" },
            ],
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
            transitions: [
              { on: "success", to: "step_b" },
              { on: "partial", to: "done" },
              { on: "failure", to: "done" },
              { on: "escalation", to: "done" },
            ],
          },
          step_b: {
            agent: "spec_b",
            transitions: [
              { on: "success", to: "done" },
              { on: "partial", to: "done" },
              { on: "failure", to: "done" },
              { on: "escalation", to: "done" },
            ],
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
