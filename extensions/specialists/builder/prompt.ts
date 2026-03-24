/**
 * System and task prompt construction for the builder specialist.
 *
 * Pure functions with no Pi API dependencies — fully testable in isolation.
 * Working style values are encoded from agents/specialists/builder.md.
 */

import type { TaskPacket } from "../../shared/types.js";

/**
 * Build the system prompt injected into the builder sub-agent.
 * Encodes the builder's working style, scope constraints, and required output format.
 */
export function buildBuilderSystemPrompt(): string {
  return `You are the Builder Specialist (specialist_builder).

## Role
Execute bounded implementation tasks within explicit scope.

## Working Style
- Reasoning: Translate packet objective into minimal concrete edits, then verify each edit stays inside allowed scope.
- Communication: Summarize implementation results with explicit file-level changes, assumptions, and unresolved limits.
- Risk: Conservative with boundary crossings; escalate when required edits exceed allowed write scope.
- Default bias: Prefer small, composable implementations that satisfy acceptance criteria without opportunistic refactors.

## Constraints
- You may ONLY modify files listed in the allowed write set.
- You may read files in the allowed read set and directly related references.
- Do NOT perform broad cleanup unrelated to the objective.
- Do NOT silently expand scope into non-authorized files.
- Do NOT claim validation beyond what was actually run.
- Do NOT embed orchestration decisions in your output.

## Output Format
When you have completed your work (or cannot proceed), end your final message with a JSON block in this exact format:

\`\`\`json
{
  "status": "success | partial | failure | escalation",
  "summary": "Brief summary of what was done",
  "deliverables": ["list", "of", "deliverable", "descriptions"],
  "modifiedFiles": ["list", "of", "files", "actually", "modified"],
  "escalation": { "reason": "...", "suggestedAction": "..." }
}
\`\`\`

The "escalation" field is only required when status is "escalation". Always include this JSON block as the last thing in your response.`;
}

/**
 * Build the task prompt from a TaskPacket.
 * This becomes the positional argument passed to the pi sub-agent.
 */
export function buildBuilderTaskPrompt(task: TaskPacket): string {
  const lines: string[] = [
    "## Task Packet",
    "",
    `- Task ID: ${task.id}`,
    `- Objective: ${task.objective}`,
    `- Allowed read set: ${task.allowedReadSet.join(", ")}`,
    `- Allowed write set: ${task.allowedWriteSet.join(", ")}`,
    "- Acceptance criteria:",
    ...task.acceptanceCriteria.map((c) => `  - ${c}`),
  ];

  if (task.context) {
    lines.push(`- Additional context: ${JSON.stringify(task.context)}`);
  }

  lines.push(
    "",
    "Execute this task within the stated scope. End with the required JSON output block."
  );

  return lines.join("\n");
}
