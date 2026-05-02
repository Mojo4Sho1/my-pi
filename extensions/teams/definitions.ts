/**
 * Team definitions and registry (Stage 4b).
 *
 * Contains concrete team definitions and a registry for lookup.
 * The build-team is the exemplar proving the team router pattern.
 */

import type { TeamDefinition } from "../shared/types.js";

/**
 * Default Everyday Team — the minimal everyday coding workflow.
 *
 * Executes planner → builder → reviewer with bounded loops and explicit terminal states.
 */
export const DEFAULT_EVERYDAY_TEAM: TeamDefinition = {
  id: "default-everyday-team",
  name: "Default Everyday Team",
  purpose: "Plan, implement, and review a bounded everyday coding task",
  members: [
    "specialist_planner",
    "specialist_builder",
    "specialist_reviewer",
  ],
  entryContract: { fields: [] },
  exitContract: {
    fields: [
      { name: "passed", type: "boolean", required: true, description: "Whether the team completed successfully" },
      { name: "modifiedFiles", type: "string[]", required: true, description: "Files changed by the builder" },
    ],
  },
  entryPacketTypes: ["task"],
  exitPacketTypes: ["result"],
  activationConditions: ["Task requires planning, implementation, and review without additional design or test-authoring phases"],
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
          { on: "success", to: "review" },
          { on: "partial", to: "planning", maxIterations: 1 },
          { on: "failure", to: "planning", maxIterations: 1 },
          { on: "escalation", to: "failed" },
        ],
      },
      review: {
        agent: "specialist_reviewer",
        transitions: [
          { on: "success", to: "done" },
          { on: "partial", to: "building", maxIterations: 1 },
          { on: "failure", to: "building", maxIterations: 1 },
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

/**
 * Design To Build Team — conditional design pass before implementation.
 *
 * The current runtime uses the concrete spec-writer specialist for the scribing state.
 * Proposed Scribe aliases remain metadata-only until a later alias activation stage.
 */
export const DESIGN_TO_BUILD_TEAM: TeamDefinition = {
  id: "design-to-build-team",
  name: "Design To Build Team",
  purpose: "Add a specification pass before bounded implementation and review",
  members: [
    "specialist_planner",
    "specialist_spec-writer",
    "specialist_builder",
    "specialist_reviewer",
  ],
  entryContract: { fields: [] },
  exitContract: {
    fields: [
      { name: "passed", type: "boolean", required: true, description: "Whether the team completed successfully" },
      { name: "modifiedFiles", type: "string[]", required: true, description: "Files changed by the builder" },
    ],
  },
  entryPacketTypes: ["task"],
  exitPacketTypes: ["result"],
  activationConditions: ["Task requires specification or boundary design before implementation"],
  escalationConditions: ["Any specialist escalates", "Revision loop exhausted"],
  states: {
    startState: "planning",
    terminalStates: ["done", "failed"],
    states: {
      planning: {
        agent: "specialist_planner",
        transitions: [
          { on: "success", to: "scribing" },
          { on: "partial", to: "failed" },
          { on: "failure", to: "failed" },
          { on: "escalation", to: "failed" },
        ],
      },
      scribing: {
        agent: "specialist_spec-writer",
        transitions: [
          { on: "success", to: "building" },
          { on: "partial", to: "planning", maxIterations: 1 },
          { on: "failure", to: "planning", maxIterations: 1 },
          { on: "escalation", to: "failed" },
        ],
      },
      building: {
        agent: "specialist_builder",
        transitions: [
          { on: "success", to: "review" },
          { on: "partial", to: "scribing", maxIterations: 1 },
          { on: "failure", to: "scribing", maxIterations: 1 },
          { on: "escalation", to: "failed" },
        ],
      },
      review: {
        agent: "specialist_reviewer",
        transitions: [
          { on: "success", to: "done" },
          { on: "partial", to: "building", maxIterations: 1 },
          { on: "failure", to: "building", maxIterations: 1 },
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
    "specialist_builder-test",
    "specialist_reviewer",
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
        agent: "specialist_builder-test",
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
  "default-everyday-team": DEFAULT_EVERYDAY_TEAM,
  "design-to-build-team": DESIGN_TO_BUILD_TEAM,
  "build-team": BUILD_TEAM,
};
