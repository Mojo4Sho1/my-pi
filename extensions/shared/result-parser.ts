/**
 * Result extraction from specialist sub-agent output.
 *
 * Parses the sub-agent's final text to extract a structured result
 * that maps to ResultPacket fields. Pure functions, no Pi API dependencies.
 */

import type { PacketStatus, StructuredReviewOutput, ReviewFinding, ReviewVerdict, FindingPriority } from "./types.js";

export interface ParsedSpecialistResult {
  status: PacketStatus;
  summary: string;
  deliverables: string[];
  modifiedFiles: string[];
  escalation?: { reason: string; suggestedAction: string };
  sourceAgent: string;
}

export interface ParseResult {
  result: ParsedSpecialistResult;
  rawJson?: Record<string, unknown>;
}

const VALID_STATUSES: ReadonlySet<string> = new Set([
  "success",
  "partial",
  "failure",
  "escalation",
]);

const VALID_VERDICTS: readonly ReviewVerdict[] = ["approve", "request_changes", "comment", "blocked"];
const VALID_PRIORITIES: readonly FindingPriority[] = ["critical", "major", "minor", "nit"];

/**
 * Extract a structured result from a specialist sub-agent's final text output.
 *
 * Looks for a JSON code fence or raw JSON object at the end of the text.
 * Falls back to a "partial" result with the raw text as summary if no
 * structured output is found.
 *
 * @param finalText - The sub-agent's final text output
 * @param sourceAgentId - The ID of the specialist that produced this output
 */
export function parseSpecialistOutput(finalText: string, sourceAgentId: string): ParseResult {
  if (!finalText || !finalText.trim()) {
    return {
      result: {
        status: "failure",
        summary: "Specialist produced no output",
        deliverables: [],
        modifiedFiles: [],
        sourceAgent: sourceAgentId,
      },
    };
  }

  // Try to extract JSON from a code fence first
  const fenceMatch = finalText.match(/```json\s*\n([\s\S]*?)\n\s*```/);
  if (fenceMatch) {
    const parsed = tryParseResult(fenceMatch[1], sourceAgentId);
    if (parsed) return parsed;
  }

  // Try to find a raw JSON object at the end of the text
  const lastBrace = finalText.lastIndexOf("}");
  if (lastBrace !== -1) {
    // Walk backwards to find the matching opening brace
    let depth = 0;
    let start = -1;
    for (let i = lastBrace; i >= 0; i--) {
      if (finalText[i] === "}") depth++;
      if (finalText[i] === "{") depth--;
      if (depth === 0) {
        start = i;
        break;
      }
    }
    if (start !== -1) {
      const parsed = tryParseResult(finalText.slice(start, lastBrace + 1), sourceAgentId);
      if (parsed) return parsed;
    }
  }

  // Fallback: no structured output found
  return {
    result: {
      status: "partial",
      summary: finalText.length > 500 ? finalText.slice(0, 500) + "..." : finalText,
      deliverables: [],
      modifiedFiles: [],
      sourceAgent: sourceAgentId,
    },
  };
}

function tryParseResult(jsonStr: string, sourceAgentId: string): ParseResult | null {
  try {
    const obj = JSON.parse(jsonStr);
    if (!obj || typeof obj !== "object") return null;
    if (!VALID_STATUSES.has(obj.status)) return null;
    if (typeof obj.summary !== "string") return null;

    return {
      result: {
        status: obj.status as PacketStatus,
        summary: obj.summary,
        deliverables: Array.isArray(obj.deliverables) ? obj.deliverables : [],
        modifiedFiles: Array.isArray(obj.modifiedFiles) ? obj.modifiedFiles : [],
        escalation: obj.escalation && typeof obj.escalation === "object"
          ? {
              reason: String(obj.escalation.reason || ""),
              suggestedAction: String(obj.escalation.suggestedAction || ""),
            }
          : undefined,
        sourceAgent: sourceAgentId,
      },
      rawJson: obj,
    };
  } catch {
    return null;
  }
}

/**
 * Extract structured review output from a parsed specialist result.
 * Called after parseSpecialistOutput() for reviewer results only.
 *
 * @param parsedResult - The generic ParsedSpecialistResult from parseSpecialistOutput()
 * @param rawJson - The raw JSON object extracted during initial parsing (if available)
 * @returns StructuredReviewOutput if valid structured data found, undefined otherwise
 */
export function parseReviewOutput(
  parsedResult: ParsedSpecialistResult,
  rawJson?: Record<string, unknown>
): StructuredReviewOutput | undefined {
  if (!rawJson || !("verdict" in rawJson) || !("findings" in rawJson)) {
    return undefined;
  }

  // Validate verdict
  if (!VALID_VERDICTS.includes(rawJson.verdict as ReviewVerdict)) {
    return undefined;
  }

  // Validate findings is array
  if (!Array.isArray(rawJson.findings)) {
    return undefined;
  }

  // Validate and filter findings
  const validFindings: ReviewFinding[] = [];
  for (const finding of rawJson.findings) {
    if (
      typeof finding === "object" &&
      finding !== null &&
      "id" in finding &&
      "priority" in finding &&
      "category" in finding &&
      "title" in finding &&
      "explanation" in finding &&
      "evidence" in finding &&
      "suggestedAction" in finding
    ) {
      const priority = VALID_PRIORITIES.includes(finding.priority as FindingPriority)
        ? (finding.priority as FindingPriority)
        : "minor";

      validFindings.push({
        id: String(finding.id),
        priority,
        category: String(finding.category),
        title: String(finding.title),
        explanation: String(finding.explanation),
        evidence: String(finding.evidence),
        suggestedAction: String(finding.suggestedAction),
        fileRefs: Array.isArray(finding.fileRefs) ? finding.fileRefs.map(String) : undefined,
      });
    }
  }

  return {
    verdict: rawJson.verdict as ReviewVerdict,
    findings: validFindings,
    summary: parsedResult.summary,
  };
}
