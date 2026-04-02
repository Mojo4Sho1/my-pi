/**
 * Specialist selection logic for the orchestrator.
 *
 * Pure function — no Pi API or I/O dependencies.
 * Uses keyword heuristics to select which specialist(s) should handle a task.
 */

export type SpecialistId =
  | "planner" | "reviewer" | "builder" | "tester"
  | "spec-writer" | "schema-designer" | "routing-designer" | "critic" | "boundary-auditor";
export type TeamId = "build-team";
export type DelegationHint = SpecialistId | "auto";

export interface SelectionResult {
  /** Ordered list of specialists to invoke */
  specialists: SpecialistId[];
  /** Human-readable explanation of why these specialists were selected */
  reason: string;
}

/** Workflow order for multi-specialist delegation */
const WORKFLOW_ORDER: SpecialistId[] = [
  "planner",
  "spec-writer",
  "schema-designer",
  "routing-designer",
  "critic",
  "boundary-auditor",
  "reviewer",
  "builder",
  "tester",
];

const SPECIALIST_KEYWORDS: Record<SpecialistId, RegExp> = {
  planner: /\b(plan|design|strateg\w*|breakdown|decompos\w*|architect\w*)\b/i,
  reviewer: /\b(review\w*|check|evaluat\w*|audit\w*|inspect\w*|assess\w*)\b/i,
  builder: /\b(implement\w*|build|fix|creat\w*|add|updat\w*|refactor\w*|code|write|develop\w*|chang\w*|modif\w*)\b/i,
  tester: /\b(test\w*|validat\w*|verif\w*|assert\w*|confirm\w*|ensure)\b/i,
  "spec-writer": /\b(spec\w*|defin\w*|boundar\w*|scope\s+doc|agent\s+def|working\s+style|non.?goal)\b/i,
  "schema-designer": /\b(schema|type\s+def|contract|packet\s+shape|i.?o\s+contract|typebox|interface\s+design|validation\s+constraint)\b/i,
  "routing-designer": /\b(state\s+machine|routing|transition|escalation\s+path|unreachable|team\s+definition|workflow\s+design)\b/i,
  "critic": /\b(critic\w*|evaluat\w*\s+design|redundan\w*|simplif\w*|over.?engineer|reuse|unnecessary|proportional)\b/i,
  "boundary-auditor": /\b(boundary|access\s+control|permission|minimal.?context|narrow.?by.?default|excess\s+context|control\s+philosophy)\b/i,
};

const VALID_SPECIALISTS = new Set<string>(WORKFLOW_ORDER);

/**
 * Select which specialist(s) should handle a task.
 *
 * @param task - High-level task description
 * @param hint - Optional hint: a specific specialist ID or "auto"
 * @returns Ordered list of specialists and a reason string
 */
export function selectSpecialists(task: string, hint?: DelegationHint): SelectionResult {
  // Explicit specialist hint
  if (hint && hint !== "auto" && VALID_SPECIALISTS.has(hint)) {
    return {
      specialists: [hint as SpecialistId],
      reason: `Explicitly delegated to ${hint}`,
    };
  }

  // Auto-select via keyword matching
  const matched = new Set<SpecialistId>();
  for (const [specialist, pattern] of Object.entries(SPECIALIST_KEYWORDS)) {
    if (pattern.test(task)) {
      matched.add(specialist as SpecialistId);
    }
  }

  if (matched.size === 0) {
    return {
      specialists: ["builder"],
      reason: "No specialist keywords matched; defaulting to builder",
    };
  }

  // Sort matched specialists into workflow order
  const ordered = WORKFLOW_ORDER.filter((s) => matched.has(s));

  if (ordered.length === 1) {
    return {
      specialists: ordered,
      reason: `Task keywords matched ${ordered[0]}`,
    };
  }

  return {
    specialists: ordered,
    reason: `Task keywords matched multiple specialists: ${ordered.join(", ")}`,
  };
}
