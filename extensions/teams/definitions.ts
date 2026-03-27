/**
 * Team definitions and registry (Stage 4b).
 *
 * Contains concrete team definitions and a registry for lookup.
 * The build-team is the exemplar proving the team router pattern.
 */

import type { TeamDefinition } from "../shared/types.js";

/**
 * Build Team — the exemplar team for Stage 4b.
 *
 * Executes a full plan → review → build → test workflow.
 * Review and build failures loop back for revision with maxIterations guards.
 */
export const BUILD_TEAM: TeamDefinition = {
  id: "build-team",
  name: "Build Team",
  purpose: "Plan, review, build, and test a feature end-to-end",
  members: [
    "specialist_planner",
    "specialist_reviewer",
    "specialist_builder",
    "specialist_tester",
  ],
  entryContract: { fields: [] },
  exitContract: {
    fields: [
      { name: "passed", type: "boolean", required: true, description: "Whether the build succeeded" },
      { name: "modifiedFiles", type: "string[]", required: true, description: "Files changed" },
    ],
  },
  entryPacketTypes: ["task"],
  exitPacketTypes: ["result"],
  activationConditions: ["Task requires multi-step implementation"],
  escalationConditions: ["Any specialist escalates", "Revision loop exhausted"],
  states: {
    startState: "planning",
    terminalStates: ["done", "failed"],
    states: {
      planning: {
        agent: "specialist_planner",
        transitions: [
          { on: "success", to: "review" },
          { on: "failure", to: "failed" },
          { on: "escalation", to: "failed" },
        ],
      },
      review: {
        agent: "specialist_reviewer",
        transitions: [
          { on: "success", to: "building" },
          { on: "failure", to: "planning", maxIterations: 2 },
          { on: "escalation", to: "failed" },
        ],
      },
      building: {
        agent: "specialist_builder",
        transitions: [
          { on: "success", to: "testing" },
          { on: "failure", to: "planning", maxIterations: 2 },
          { on: "escalation", to: "failed" },
        ],
      },
      testing: {
        agent: "specialist_tester",
        transitions: [
          { on: "success", to: "done" },
          { on: "failure", to: "building", maxIterations: 2 },
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
  },
};

/** Registry of available teams, keyed by team ID */
export const TEAM_REGISTRY: Record<string, TeamDefinition> = {
  "build-team": BUILD_TEAM,
};
