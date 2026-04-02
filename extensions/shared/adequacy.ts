/**
 * Semantic adequacy validation (Stage 5a, Decision #31).
 *
 * Lightweight structural predicates that validate specialist outputs
 * beyond type correctness. Catches "well-typed but useless" results.
 */

import type { ResultPacket } from "./types.js";
import type { AdequacyCheck } from "./specialist-prompt.js";

export interface AdequacyResult {
  adequate: boolean;
  failures: string[];
}

/**
 * Run adequacy checks against a result packet.
 * Returns adequate: true if all checks pass, or a list of failure messages.
 */
export function validateAdequacy(
  checks: AdequacyCheck[],
  result: ResultPacket
): AdequacyResult {
  const failures: string[] = [];

  for (const check of checks) {
    if (!check.predicate(result)) {
      failures.push(check.failureMessage);
    }
  }

  return {
    adequate: failures.length === 0,
    failures,
  };
}
