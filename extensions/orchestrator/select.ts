/**
 * Specialist selection logic for the orchestrator.
 *
 * The LLM calling the orchestrate tool is responsible for choosing the
 * right primitive(s) via delegationHint. This module validates the hint
 * and provides a safe fallback.
 */

import {
  ALL_SPECIALIST_IDS,
  SPECIALIST_IDS,
  resolveSpecialistId,
  type CanonicalSpecialistId,
  type SpecialistInputId,
} from "../shared/constants.js";

export type SpecialistId = CanonicalSpecialistId;
export type TeamId = "build-team" | "default-everyday-team" | "design-to-build-team";
export type DelegationHint = SpecialistInputId | SpecialistInputId[] | "auto";

export interface SelectionResult {
  /** Ordered list of specialists to invoke */
  specialists: SpecialistId[];
  /** Human-readable explanation of why these specialists were selected */
  reason: string;
}

const VALID_SPECIALISTS = new Set<string>(ALL_SPECIALIST_IDS);

function resolveSpecialistHint(id: string): SpecialistId | undefined {
  return resolveSpecialistId(id);
}

/**
 * Select which specialist(s) should handle a task.
 *
 * Primary path: the caller provides an explicit delegationHint —
 * either a single specialist ID or an ordered array of IDs.
 * The LLM has full task context and chooses the right primitive(s).
 *
 * Fallback: if hint is "auto", omitted, or invalid, defaults to builder.
 */
export function selectSpecialists(_task: string, hint?: DelegationHint): SelectionResult {
  // Array of specialist IDs
  if (Array.isArray(hint)) {
    const valid = hint
      .map((id) => resolveSpecialistHint(id))
      .filter((id): id is SpecialistId => id !== undefined && VALID_SPECIALISTS.has(id));
    if (valid.length > 0) {
      return {
        specialists: valid,
        reason: valid.length === 1
          ? `Delegated to ${valid[0]}`
          : `Delegated to ${valid.join(" → ")}`,
      };
    }
  }

  // Single specialist ID
  if (typeof hint === "string" && hint !== "auto") {
    const resolved = resolveSpecialistHint(hint);
    if (resolved && VALID_SPECIALISTS.has(resolved)) {
      return {
        specialists: [resolved],
        reason: resolved === hint
          ? `Delegated to ${resolved}`
          : `Delegated to ${resolved} via deprecated alias ${hint}`,
      };
    }
  }

  // No hint or "auto" — default to builder
  return {
    specialists: [SPECIALIST_IDS.BUILDER],
    reason: "No specialist specified; defaulting to builder",
  };
}
