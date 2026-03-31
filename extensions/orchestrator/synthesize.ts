/**
 * Result synthesis for the orchestrator.
 *
 * Combines multiple ResultPackets from specialist delegations
 * into a single coherent summary with an overall status.
 */

import type { ResultPacket, PacketStatus, StructuredReviewOutput } from "../shared/types.js";
import type { WorklistSummary } from "../worklist/index.js";

export interface SynthesisInput {
  results: ResultPacket[];
  reviewOutputs?: Map<string, StructuredReviewOutput>;
  worklistSummary?: WorklistSummary;
}

export interface SynthesizedResult {
  /** Overall status derived from individual results */
  overallStatus: PacketStatus;
  /** Human-readable summary combining all specialist outputs */
  summary: string;
  /** IDs of specialists that were invoked */
  specialistsInvoked: string[];
  /** Individual result packets in execution order */
  results: ResultPacket[];
  /** Structured review findings from the first reviewer, if available */
  reviewFindings?: StructuredReviewOutput;
  /** Worklist summary, if a worklist was active during orchestration */
  worklistSummary?: WorklistSummary;
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
export function synthesizeResults(input: SynthesisInput): SynthesizedResult {
  const { results, reviewOutputs } = input;

  if (results.length === 0) {
    return {
      overallStatus: "failure",
      summary: "No specialists were invoked.",
      specialistsInvoked: [],
      results: [],
    };
  }

  const specialistsInvoked = results.map((r) => r.sourceAgent);

  // Determine overall status
  let overallStatus: PacketStatus;
  if (results.length === 1) {
    overallStatus = results[0].status;
  } else {
    const statuses = new Set(results.map((r) => r.status));
    if (statuses.has("escalation")) {
      overallStatus = "escalation";
    } else if (statuses.size === 1 && statuses.has("success")) {
      overallStatus = "success";
    } else if (statuses.size === 1 && statuses.has("failure")) {
      overallStatus = "failure";
    } else {
      overallStatus = "partial";
    }
  }

  // Build combined summary
  let summary: string;
  if (results.length === 1) {
    summary = results[0].summary;
  } else {
    summary = results.map((r) => `[${r.sourceAgent}] ${r.summary}`).join("\n\n");
  }

  // Check for review findings
  let reviewFindings: StructuredReviewOutput | undefined;
  if (reviewOutputs && reviewOutputs.size > 0) {
    reviewFindings = Array.from(reviewOutputs.values())[0];
  }

  // Surface critical/major findings in summary
  if (reviewFindings) {
    const criticalFindings = reviewFindings.findings.filter(f => f.priority === "critical");
    const majorFindings = reviewFindings.findings.filter(f => f.priority === "major");

    if (reviewFindings.verdict === "blocked") {
      for (const finding of criticalFindings) {
        summary += `\n\nBLOCKED: ${finding.title}`;
      }
    }

    if (criticalFindings.length > 0 || majorFindings.length > 0) {
      const titles = [...criticalFindings, ...majorFindings].map(f => f.title).join("; ");
      summary += `\n\nReview findings (${criticalFindings.length} critical, ${majorFindings.length} major): ${titles}`;
    }
  }

  // Surface blocked worklist items in summary
  if (input.worklistSummary) {
    if (input.worklistSummary.hasBlockers) {
      const blockerDescs = input.worklistSummary.blockedItems
        .map(b => `${b.description}: ${b.blockReason}`).join("; ");
      summary += `\n\nBlocked items: ${blockerDescs}`;
    }
  }

  return {
    overallStatus,
    summary,
    specialistsInvoked,
    results,
    reviewFindings,
    worklistSummary: input.worklistSummary,
  };
}
