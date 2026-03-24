/**
 * Result extraction from builder sub-agent output.
 *
 * Parses the sub-agent's final text to extract a structured result
 * that maps to ResultPacket fields. Pure functions, no Pi API dependencies.
 */

import type { PacketStatus } from "../../shared/types.js";

export interface ParsedBuilderResult {
  status: PacketStatus;
  summary: string;
  deliverables: string[];
  modifiedFiles: string[];
  escalation?: { reason: string; suggestedAction: string };
  sourceAgent: string;
}

const VALID_STATUSES: ReadonlySet<string> = new Set([
  "success",
  "partial",
  "failure",
  "escalation",
]);

/**
 * Extract a structured result from the builder sub-agent's final text output.
 *
 * Looks for a JSON code fence or raw JSON object at the end of the text.
 * Falls back to a "partial" result with the raw text as summary if no
 * structured output is found.
 */
export function parseBuilderOutput(finalText: string): ParsedBuilderResult {
  if (!finalText || !finalText.trim()) {
    return {
      status: "failure",
      summary: "Builder produced no output",
      deliverables: [],
      modifiedFiles: [],
      sourceAgent: "specialist_builder",
    };
  }

  // Try to extract JSON from a code fence first
  const fenceMatch = finalText.match(/```json\s*\n([\s\S]*?)\n\s*```/);
  if (fenceMatch) {
    const parsed = tryParseResult(fenceMatch[1]);
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
      const parsed = tryParseResult(finalText.slice(start, lastBrace + 1));
      if (parsed) return parsed;
    }
  }

  // Fallback: no structured output found
  return {
    status: "partial",
    summary: finalText.length > 500 ? finalText.slice(0, 500) + "..." : finalText,
    deliverables: [],
    modifiedFiles: [],
    sourceAgent: "specialist_builder",
  };
}

function tryParseResult(jsonStr: string): ParsedBuilderResult | null {
  try {
    const obj = JSON.parse(jsonStr);
    if (!obj || typeof obj !== "object") return null;
    if (!VALID_STATUSES.has(obj.status)) return null;
    if (typeof obj.summary !== "string") return null;

    return {
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
      sourceAgent: "specialist_builder",
    };
  } catch {
    return null;
  }
}
