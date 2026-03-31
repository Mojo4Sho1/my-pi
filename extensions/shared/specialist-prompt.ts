/**
 * Generic system and task prompt construction for specialist extensions.
 *
 * Pure functions with no Pi API dependencies — fully testable in isolation.
 * Each specialist provides a SpecialistPromptConfig; the shared functions
 * assemble the prompts in a consistent format.
 */

import type { TaskPacket, InputContract, OutputContract } from "./types.js";

export interface SpecialistPromptConfig {
  /** Specialist agent ID (e.g. "specialist_builder") */
  id: string;
  /** Human-readable role name (e.g. "Builder Specialist") */
  roleName: string;
  /** One-line description of what this specialist does */
  roleDescription: string;
  /** Working style directives */
  workingStyle: {
    reasoning: string;
    communication: string;
    risk: string;
    defaultBias: string;
  };
  /** Scope constraints the specialist must follow */
  constraints: string[];
  /** Behaviors the specialist must avoid */
  antiPatterns: string[];
  /** What this specialist requires in its TaskPacket.context (Stage 4a) */
  inputContract?: InputContract;
  /** What this specialist guarantees in its structured output (Stage 4a) */
  outputContract?: OutputContract;
  /** If set, replaces the auto-generated output format block in the system prompt */
  outputFormatOverride?: string;
  /** Specialist's default model preference (Stage 4e) */
  preferredModel?: string;
}

/**
 * Build the JSON output format block for the system prompt.
 * When an outputContract is declared, renders typed fields instead of generic deliverables.
 */
function buildOutputFormatBlock(config: SpecialistPromptConfig): string {
  if (config.outputContract && config.outputContract.fields.length > 0) {
    const typedFields: string[] = [];
    for (const field of config.outputContract.fields) {
      const example = getFieldExample(field.type);
      typedFields.push(`  "${field.name}": ${example}`);
    }

    return `\`\`\`json
{
  "status": "success | partial | failure | escalation",
  "summary": "Brief summary of what was done",
${typedFields.join(",\n")},
  "modifiedFiles": ["list", "of", "files", "actually", "modified"],
  "escalation": { "reason": "...", "suggestedAction": "..." }
}
\`\`\``;
  }

  return `\`\`\`json
{
  "status": "success | partial | failure | escalation",
  "summary": "Brief summary of what was done",
  "deliverables": ["list", "of", "deliverable", "descriptions"],
  "modifiedFiles": ["list", "of", "files", "actually", "modified"],
  "escalation": { "reason": "...", "suggestedAction": "..." }
}
\`\`\``;
}

function getFieldExample(type: string): string {
  switch (type) {
    case "string":
      return '"..."';
    case "string[]":
      return '["..."]';
    case "boolean":
      return "true | false";
    case "number":
      return "0";
    case "object":
      return "{ ... }";
    default:
      return '"..."';
  }
}

/**
 * Build the system prompt for a specialist sub-agent.
 * Encodes the specialist's role, working style, constraints, and required output format.
 */
export function buildSpecialistSystemPrompt(config: SpecialistPromptConfig): string {
  const constraintLines = config.constraints.map((c) => `- ${c}`).join("\n");
  const antiPatternLines = config.antiPatterns.map((a) => `- Do NOT ${a}`).join("\n");

  return `You are the ${config.roleName} (${config.id}).

## Role
${config.roleDescription}

## Working Style
- Reasoning: ${config.workingStyle.reasoning}
- Communication: ${config.workingStyle.communication}
- Risk: ${config.workingStyle.risk}
- Default bias: ${config.workingStyle.defaultBias}

## Constraints
${constraintLines}

## Anti-Patterns
${antiPatternLines}

## Output Format
When you have completed your work (or cannot proceed), end your final message with a JSON block in this exact format:

${config.outputFormatOverride || buildOutputFormatBlock(config)}

The "escalation" field is only required when status is "escalation". Always include this JSON block as the last thing in your response.`;
}

/**
 * Build the task prompt from a TaskPacket.
 * This becomes the positional argument passed to the pi sub-agent.
 */
export function buildSpecialistTaskPrompt(task: TaskPacket): string {
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
