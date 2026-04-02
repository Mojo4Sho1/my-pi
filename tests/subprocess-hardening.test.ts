/**
 * Subprocess hardening tests (Stage 5a).
 *
 * Validates robustness of subprocess I/O handling and result parsing
 * against adversarial inputs. Uses the mock-subprocess fixture for
 * process-level tests and direct function calls for parsing tests.
 */

import { describe, it, expect } from "vitest";
import { parseSpecialistOutput } from "../extensions/shared/result-parser.js";

describe("subprocess hardening: malformed JSON recovery", () => {
  it("handles partial JSON fence gracefully", () => {
    const output = '```json\n{"status": "success", "summary": "partial\n```';
    const { result } = parseSpecialistOutput(output, "specialist_builder");
    // Should fall back to partial since JSON is malformed
    expect(result.status).toBe("partial");
    expect(result.sourceAgent).toBe("specialist_builder");
  });

  it("handles completely corrupted output", () => {
    const output = "not json at all\ngarbage data\n{broken";
    const { result } = parseSpecialistOutput(output, "specialist_builder");
    expect(result.status).toBe("partial");
    expect(result.summary).toContain("not json");
  });

  it("handles empty fence block", () => {
    const output = "```json\n\n```";
    const { result } = parseSpecialistOutput(output, "specialist_builder");
    expect(result.status).toBe("partial");
  });

  it("handles JSON with missing required fields", () => {
    const output = '```json\n{"status": "success"}\n```';
    const { result } = parseSpecialistOutput(output, "specialist_builder");
    // Missing summary — should not parse as valid
    expect(result.status).toBe("partial");
  });

  it("handles JSON with invalid status value", () => {
    const output = '```json\n{"status": "invalid_status", "summary": "test"}\n```';
    const { result } = parseSpecialistOutput(output, "specialist_builder");
    expect(result.status).toBe("partial");
  });
});

describe("subprocess hardening: empty output", () => {
  it("handles completely empty output", () => {
    const { result } = parseSpecialistOutput("", "specialist_builder");
    expect(result.status).toBe("failure");
    expect(result.summary).toContain("no output");
  });

  it("handles whitespace-only output", () => {
    const { result } = parseSpecialistOutput("   \n\n  ", "specialist_builder");
    expect(result.status).toBe("failure");
    expect(result.summary).toContain("no output");
  });
});

describe("subprocess hardening: large output", () => {
  it("handles oversized response without crash", () => {
    const largePayload = "x".repeat(100_000);
    const jsonStr = JSON.stringify({
      status: "success",
      summary: "Large output",
      deliverables: [largePayload],
      modifiedFiles: [],
    });
    const output = `\`\`\`json\n${jsonStr}\n\`\`\``;

    const { result } = parseSpecialistOutput(output, "specialist_builder");
    expect(result.status).toBe("success");
    expect(result.deliverables[0].length).toBe(100_000);
  });

  it("handles very long summary by truncating in fallback", () => {
    const longText = "a".repeat(1000);
    const { result } = parseSpecialistOutput(longText, "specialist_builder");
    expect(result.status).toBe("partial");
    expect(result.summary.length).toBeLessThanOrEqual(503); // 500 + "..."
  });
});

describe("subprocess hardening: sequential delegations (no state leakage)", () => {
  it("produces independent results for sequential calls", () => {
    const output1 = '```json\n{"status": "success", "summary": "First", "deliverables": ["d1"], "modifiedFiles": ["f1.ts"]}\n```';
    const output2 = '```json\n{"status": "failure", "summary": "Second", "deliverables": [], "modifiedFiles": []}\n```';

    const { result: r1 } = parseSpecialistOutput(output1, "specialist_builder");
    const { result: r2 } = parseSpecialistOutput(output2, "specialist_tester");

    expect(r1.status).toBe("success");
    expect(r1.summary).toBe("First");
    expect(r1.sourceAgent).toBe("specialist_builder");

    expect(r2.status).toBe("failure");
    expect(r2.summary).toBe("Second");
    expect(r2.sourceAgent).toBe("specialist_tester");
  });
});

describe("subprocess hardening: mixed content before JSON", () => {
  it("extracts JSON from end of mixed content", () => {
    const output = `Here is some preamble text.

I performed the following actions:
1. Read the files
2. Made changes

\`\`\`json
{"status": "success", "summary": "Done", "deliverables": ["change"], "modifiedFiles": ["a.ts"]}
\`\`\``;

    const { result } = parseSpecialistOutput(output, "specialist_builder");
    expect(result.status).toBe("success");
    expect(result.summary).toBe("Done");
    expect(result.modifiedFiles).toEqual(["a.ts"]);
  });

  it("extracts raw JSON object from end of text", () => {
    const output = `Some analysis text here.

{"status": "success", "summary": "Analyzed", "deliverables": ["finding"], "modifiedFiles": []}`;

    const { result } = parseSpecialistOutput(output, "specialist_reviewer");
    expect(result.status).toBe("success");
    expect(result.summary).toBe("Analyzed");
  });
});

describe("subprocess hardening: escalation handling", () => {
  it("correctly extracts escalation fields", () => {
    const output = `\`\`\`json
{
  "status": "escalation",
  "summary": "Cannot proceed",
  "deliverables": [],
  "modifiedFiles": [],
  "escalation": {
    "reason": "Scope exceeded",
    "suggestedAction": "Request broader context"
  }
}
\`\`\``;

    const { result } = parseSpecialistOutput(output, "specialist_builder");
    expect(result.status).toBe("escalation");
    expect(result.escalation).toBeDefined();
    expect(result.escalation!.reason).toBe("Scope exceeded");
    expect(result.escalation!.suggestedAction).toBe("Request broader context");
  });
});
