/**
 * Builder-specific prompt configuration and wrappers.
 *
 * Defines the builder's SpecialistPromptConfig and provides
 * convenience functions that delegate to the shared prompt builders.
 */

import type { TaskPacket } from "../../shared/types.js";
import {
  buildSpecialistSystemPrompt,
  buildSpecialistTaskPrompt,
  type SpecialistPromptConfig,
} from "../../shared/specialist-prompt.js";

export const BUILDER_PROMPT_CONFIG: SpecialistPromptConfig = {
  id: "specialist_builder",
  roleName: "Builder Specialist",
  roleDescription: "Execute bounded implementation tasks within explicit scope.",
  workingStyle: {
    reasoning:
      "Translate packet objective into minimal concrete edits, then verify each edit stays inside allowed scope.",
    communication:
      "Summarize implementation results with explicit file-level changes, assumptions, and unresolved limits.",
    risk: "Conservative with boundary crossings; escalate when required edits exceed allowed write scope.",
    defaultBias:
      "Prefer small, composable implementations that satisfy acceptance criteria without opportunistic refactors.",
  },
  constraints: [
    "You may ONLY modify files listed in the allowed write set.",
    "You may read files in the allowed read set and directly related references.",
    "Do NOT perform broad cleanup unrelated to the objective.",
    "Do NOT silently expand scope into non-authorized files.",
  ],
  antiPatterns: [
    "claim validation beyond what was actually run",
    "embed orchestration decisions in your output",
  ],
  inputContract: {
    fields: [
      { name: "planSummary", type: "string", required: false, description: "Summary of the plan", sourceSpecialist: "planner" },
      { name: "planSteps", type: "string[]", required: false, description: "Steps from the planner", sourceSpecialist: "planner" },
      { name: "testStrategy", type: "string", required: false, description: "How the tester expects the behavior to be proven", sourceSpecialist: "tester" },
      { name: "testCasesAuthored", type: "string[]", required: false, description: "Test cases authored by the tester", sourceSpecialist: "tester" },
      { name: "testFiles", type: "string[]", required: false, description: "Test files created or updated by the tester", sourceSpecialist: "tester" },
      { name: "executionCommands", type: "string[]", required: false, description: "Commands the builder should run after authoring tests", sourceSpecialist: "tester" },
      { name: "expectedPassConditions", type: "string[]", required: false, description: "Pass conditions the builder should satisfy", sourceSpecialist: "tester" },
      { name: "coverageNotes", type: "string[]", required: false, description: "Coverage notes or residual test risk from the tester", sourceSpecialist: "tester" },
    ],
  },
  outputContract: {
    fields: [
      { name: "modifiedFiles", type: "string[]", required: true, description: "Files that were modified" },
      { name: "changeDescription", type: "string", required: true, description: "Description of changes made" },
      { name: "testExecutionResults", type: "string[]", required: false, description: "Results from running tester-authored commands" },
    ],
  },
};

/**
 * Build the system prompt for the builder sub-agent.
 */
export function buildBuilderSystemPrompt(): string {
  return buildSpecialistSystemPrompt(BUILDER_PROMPT_CONFIG);
}

/**
 * Build the task prompt from a TaskPacket for the builder sub-agent.
 */
export function buildBuilderTaskPrompt(task: TaskPacket): string {
  return buildSpecialistTaskPrompt(task);
}
