import { describe, it, expect } from "vitest";
import { parseSpecialistOutput } from "../extensions/shared/result-parser.js";

describe("parseSpecialistOutput", () => {
  const AGENT_ID = "specialist_test";

  it("extracts structured JSON from a code fence", () => {
    const text = `I've completed the changes.

\`\`\`json
{
  "status": "success",
  "summary": "Added error handling to auth module",
  "deliverables": ["Try-catch wrappers for API calls"],
  "modifiedFiles": ["src/auth/index.ts"]
}
\`\`\``;

    const { result } = parseSpecialistOutput(text, AGENT_ID);
    expect(result.status).toBe("success");
    expect(result.summary).toBe("Added error handling to auth module");
    expect(result.deliverables).toEqual(["Try-catch wrappers for API calls"]);
    expect(result.modifiedFiles).toEqual(["src/auth/index.ts"]);
    expect(result.sourceAgent).toBe(AGENT_ID);
  });

  it("extracts raw JSON block at end of text", () => {
    const text = `Done with implementation.

{"status": "success", "summary": "Fixed the bug", "deliverables": ["Bug fix"], "modifiedFiles": ["src/app.ts"]}`;

    const { result } = parseSpecialistOutput(text, AGENT_ID);
    expect(result.status).toBe("success");
    expect(result.summary).toBe("Fixed the bug");
  });

  it("falls back to partial on malformed JSON", () => {
    const text = "I made some changes but the JSON got corrupted: {invalid json here}";
    const { result } = parseSpecialistOutput(text, AGENT_ID);
    expect(result.status).toBe("partial");
    expect(result.summary).toContain("I made some changes");
  });

  it("falls back to partial on missing JSON", () => {
    const text = "I implemented the feature as requested. All tests pass.";
    const { result } = parseSpecialistOutput(text, AGENT_ID);
    expect(result.status).toBe("partial");
    expect(result.summary).toBe(text);
  });

  it("returns failure on empty input", () => {
    const { result } = parseSpecialistOutput("", AGENT_ID);
    expect(result.status).toBe("failure");
    expect(result.summary).toContain("no output");
  });

  it("returns failure on whitespace-only input", () => {
    const { result } = parseSpecialistOutput("   \n  ", AGENT_ID);
    expect(result.status).toBe("failure");
  });

  it("handles all four status values", () => {
    for (const status of ["success", "partial", "failure", "escalation"] as const) {
      const text = `\`\`\`json\n{"status": "${status}", "summary": "test", "deliverables": [], "modifiedFiles": []}\n\`\`\``;
      const { result } = parseSpecialistOutput(text, AGENT_ID);
      expect(result.status).toBe(status);
    }
  });

  it("includes escalation details when present", () => {
    const text = `\`\`\`json
{
  "status": "escalation",
  "summary": "Cannot proceed",
  "deliverables": [],
  "modifiedFiles": [],
  "escalation": {
    "reason": "Required changes exceed allowed write scope",
    "suggestedAction": "Expand allowedWriteSet to include src/config.ts"
  }
}
\`\`\``;

    const { result } = parseSpecialistOutput(text, AGENT_ID);
    expect(result.status).toBe("escalation");
    expect(result.escalation).toBeDefined();
    expect(result.escalation!.reason).toBe("Required changes exceed allowed write scope");
    expect(result.escalation!.suggestedAction).toContain("src/config.ts");
  });

  it("uses the provided sourceAgentId", () => {
    const text = `\`\`\`json\n{"status": "success", "summary": "done", "deliverables": [], "modifiedFiles": []}\n\`\`\``;
    expect(parseSpecialistOutput(text, "specialist_builder").result.sourceAgent).toBe("specialist_builder");
    expect(parseSpecialistOutput(text, "specialist_planner").result.sourceAgent).toBe("specialist_planner");
    expect(parseSpecialistOutput(text, "specialist_reviewer").result.sourceAgent).toBe("specialist_reviewer");

    // Also for fallback cases
    expect(parseSpecialistOutput("no json here", "specialist_tester").result.sourceAgent).toBe("specialist_tester");
    expect(parseSpecialistOutput("", "specialist_builder").result.sourceAgent).toBe("specialist_builder");
  });

  it("truncates long text in fallback summary", () => {
    const longText = "x".repeat(600);
    const { result } = parseSpecialistOutput(longText, AGENT_ID);
    expect(result.status).toBe("partial");
    expect(result.summary.length).toBeLessThanOrEqual(503); // 500 + "..."
    expect(result.summary).toContain("...");
  });

  it("rejects JSON with invalid status", () => {
    const text = `\`\`\`json\n{"status": "invalid", "summary": "test", "deliverables": [], "modifiedFiles": []}\n\`\`\``;
    const { result } = parseSpecialistOutput(text, AGENT_ID);
    // Should fall back since "invalid" is not a valid PacketStatus
    expect(result.status).toBe("partial");
  });

  it("handles missing deliverables and modifiedFiles in JSON", () => {
    const text = `\`\`\`json\n{"status": "success", "summary": "done"}\n\`\`\``;
    const { result } = parseSpecialistOutput(text, AGENT_ID);
    expect(result.status).toBe("success");
    expect(result.deliverables).toEqual([]);
    expect(result.modifiedFiles).toEqual([]);
  });

  it("returns rawJson when JSON is found", () => {
    const text = `\`\`\`json\n{"status": "success", "summary": "done", "verdict": "approve", "findings": []}\n\`\`\``;
    const { rawJson } = parseSpecialistOutput(text, AGENT_ID);
    expect(rawJson).toBeDefined();
    expect(rawJson!.status).toBe("success");
    expect(rawJson!.verdict).toBe("approve");
  });

  it("returns rawJson as undefined when no JSON found", () => {
    const text = "no json here at all";
    const { rawJson } = parseSpecialistOutput(text, AGENT_ID);
    expect(rawJson).toBeUndefined();
  });
});
