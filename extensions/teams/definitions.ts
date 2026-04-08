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
 * Executes the canonical plan → build → test-author → builder verification → review workflow.
 * Planning/build failures loop back upstream, tester outputs feed a second builder pass,
 * and reviewer follow-up loops back to the post-tester builder state.
 */
export const BUILD_TEAM: TeamDefinition = {
  id: "build-team",
  name: "Build Team",
  purpose: "Plan, build, author tests, verify against those tests, and review a feature end-to-end",
  members: [
    "specialist_planner",
    "specialist_builder",
    "specialist_reviewer",
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
          { on: "success", to: "building" },
          { on: "partial", to: "failed" },
          { on: "failure", to: "failed" },
          { on: "escalation", to: "failed" },
        ],
      },
      building: {
        agent: "specialist_builder",
        transitions: [
          { on: "success", to: "testing" },
          { on: "partial", to: "planning", maxIterations: 2 },
          { on: "failure", to: "planning", maxIterations: 2 },
          { on: "escalation", to: "failed" },
        ],
      },
      testing: {
        agent: "specialist_tester",
        transitions: [
          { on: "success", to: "rebuilding" },
          { on: "partial", to: "rebuilding", maxIterations: 2 },
          { on: "failure", to: "rebuilding", maxIterations: 2 },
          { on: "escalation", to: "failed" },
        ],
      },
      rebuilding: {
        agent: "specialist_builder",
        transitions: [
          { on: "success", to: "review" },
          { on: "partial", to: "rebuilding", maxIterations: 2 },
          { on: "failure", to: "rebuilding", maxIterations: 2 },
          { on: "escalation", to: "failed" },
        ],
      },
      review: {
        agent: "specialist_reviewer",
        transitions: [
          { on: "success", to: "done" },
          { on: "partial", to: "rebuilding", maxIterations: 2 },
          { on: "failure", to: "rebuilding", maxIterations: 2 },
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
