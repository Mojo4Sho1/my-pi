/**
 * Result synthesis for the orchestrator.
 *
 * Combines multiple ResultPackets from specialist delegations
 * into a single coherent summary with an overall status.
 */

import type { ResultPacket, PacketStatus } from "../shared/types.js";

export interface SynthesizedResult {
  /** Overall status derived from individual results */
  overallStatus: PacketStatus;
  /** Human-readable summary combining all specialist outputs */
  summary: string;
  /** IDs of specialists that were invoked */
  specialistsInvoked: string[];
  /** Individual result packets in execution order */
  results: ResultPacket[];
}

/**
 * Synthesize multiple specialist ResultPackets into a single result.
 *
 * Status logic:
 * - Any escalation → "escalation"
 * - All success → "success"
 * - All failure → "failure"
 * - Mix → "partial"
 */
export function synthesizeResults(results: ResultPacket[]): SynthesizedResult {
  if (results.length === 0) {
    return {
      overallStatus: "failure",
      summary: "No specialists were invoked.",
      specialistsInvoked: [],
      results: [],
    };
  }

  const specialistsInvoked = results.map((r) => r.sourceAgent);

  // Single result: pass through
  if (results.length === 1) {
    return {
      overallStatus: results[0].status,
      summary: results[0].summary,
      specialistsInvoked,
      results,
    };
  }

  // Determine overall status
  const statuses = new Set(results.map((r) => r.status));
  let overallStatus: PacketStatus;

  if (statuses.has("escalation")) {
    overallStatus = "escalation";
  } else if (statuses.size === 1 && statuses.has("success")) {
    overallStatus = "success";
  } else if (statuses.size === 1 && statuses.has("failure")) {
    overallStatus = "failure";
  } else {
    overallStatus = "partial";
  }

  // Build combined summary
  const summaryParts = results.map(
    (r) => `[${r.sourceAgent}] ${r.summary}`
  );
  const summary = summaryParts.join("\n\n");

  return {
    overallStatus,
    summary,
    specialistsInvoked,
    results,
  };
}
