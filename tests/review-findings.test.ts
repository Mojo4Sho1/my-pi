import { describe, it, expect } from "vitest";
import { parseSpecialistOutput, parseReviewOutput } from "../extensions/shared/result-parser.js";
import { synthesizeResults } from "../extensions/orchestrator/synthesize.js";
import { createResultPacket } from "../extensions/shared/packets.js";
import type { StructuredReviewOutput, ResultPacket } from "../extensions/shared/types.js";

describe("parseReviewOutput", () => {
  const validRawJson: Record<string, unknown> = {
    status: "success",
    summary: "Review complete",
    verdict: "approve",
    findings: [],
    modifiedFiles: [],
  };

  const validParsedResult = {
    status: "success" as const,
    summary: "Review complete",
    deliverables: [],
    modifiedFiles: [],
    sourceAgent: "specialist_reviewer",
  };

  it("extracts valid structured output with all fields", () => {
    const rawJson: Record<string, unknown> = {
      ...validRawJson,
      verdict: "request_changes",
      findings: [
        {
          id: "F1",
          priority: "critical",
          category: "correctness",
          title: "Missing null check",
          explanation: "The function doesn't handle null input",
          evidence: "src/utils.ts:42",
          suggestedAction: "Add null guard",
          fileRefs: ["src/utils.ts"],
        },
      ],
    };
    const result = parseReviewOutput(validParsedResult, rawJson);
    expect(result).toBeDefined();
    expect(result!.verdict).toBe("request_changes");
    expect(result!.findings).toHaveLength(1);
    expect(result!.findings[0].id).toBe("F1");
    expect(result!.findings[0].priority).toBe("critical");
    expect(result!.findings[0].category).toBe("correctness");
    expect(result!.findings[0].title).toBe("Missing null check");
    expect(result!.findings[0].fileRefs).toEqual(["src/utils.ts"]);
    expect(result!.summary).toBe("Review complete");
  });

  it("extracts valid output with empty findings array (approve)", () => {
    const result = parseReviewOutput(validParsedResult, validRawJson);
    expect(result).toBeDefined();
    expect(result!.verdict).toBe("approve");
    expect(result!.findings).toEqual([]);
  });

  it("returns undefined when verdict is missing", () => {
    const rawJson = { ...validRawJson };
    delete rawJson.verdict;
    expect(parseReviewOutput(validParsedResult, rawJson)).toBeUndefined();
  });

  it("returns undefined when verdict is invalid string", () => {
    const rawJson = { ...validRawJson, verdict: "invalid_verdict" };
    expect(parseReviewOutput(validParsedResult, rawJson)).toBeUndefined();
  });

  it("returns undefined when findings is not an array", () => {
    const rawJson = { ...validRawJson, findings: "not an array" };
    expect(parseReviewOutput(validParsedResult, rawJson)).toBeUndefined();
  });

  it("filters out malformed findings, keeps valid ones", () => {
    const rawJson: Record<string, unknown> = {
      ...validRawJson,
      findings: [
        {
          id: "F1",
          priority: "major",
          category: "style",
          title: "Valid finding",
          explanation: "This is valid",
          evidence: "line 10",
          suggestedAction: "Fix it",
        },
        { id: "F2", priority: "minor" }, // missing required fields
        "not an object",
        null,
      ],
    };
    const result = parseReviewOutput(validParsedResult, rawJson);
    expect(result).toBeDefined();
    expect(result!.findings).toHaveLength(1);
    expect(result!.findings[0].id).toBe("F1");
  });

  it("defaults invalid priority to 'minor'", () => {
    const rawJson: Record<string, unknown> = {
      ...validRawJson,
      findings: [
        {
          id: "F1",
          priority: "super_critical",
          category: "scope",
          title: "Bad priority",
          explanation: "test",
          evidence: "test",
          suggestedAction: "test",
        },
      ],
    };
    const result = parseReviewOutput(validParsedResult, rawJson);
    expect(result).toBeDefined();
    expect(result!.findings[0].priority).toBe("minor");
  });

  it("preserves optional fileRefs when present", () => {
    const rawJson: Record<string, unknown> = {
      ...validRawJson,
      findings: [
        {
          id: "F1",
          priority: "nit",
          category: "style",
          title: "Nit",
          explanation: "test",
          evidence: "test",
          suggestedAction: "test",
          fileRefs: ["a.ts", "b.ts"],
        },
      ],
    };
    const result = parseReviewOutput(validParsedResult, rawJson);
    expect(result!.findings[0].fileRefs).toEqual(["a.ts", "b.ts"]);
  });

  it("omits fileRefs when not present", () => {
    const rawJson: Record<string, unknown> = {
      ...validRawJson,
      findings: [
        {
          id: "F1",
          priority: "nit",
          category: "style",
          title: "Nit",
          explanation: "test",
          evidence: "test",
          suggestedAction: "test",
        },
      ],
    };
    const result = parseReviewOutput(validParsedResult, rawJson);
    expect(result!.findings[0].fileRefs).toBeUndefined();
  });

  it("returns undefined when rawJson is undefined", () => {
    expect(parseReviewOutput(validParsedResult, undefined)).toBeUndefined();
  });
});

describe("parseSpecialistOutput return type", () => {
  it("returns { result, rawJson } when JSON is found", () => {
    const text = `\`\`\`json
{"status": "success", "summary": "done", "verdict": "approve", "findings": []}
\`\`\``;
    const { result, rawJson } = parseSpecialistOutput(text, "specialist_reviewer");
    expect(result.status).toBe("success");
    expect(rawJson).toBeDefined();
    expect(rawJson!.verdict).toBe("approve");
  });

  it("returns { result, rawJson: undefined } when no JSON found", () => {
    const { result, rawJson } = parseSpecialistOutput("no json here", "specialist_reviewer");
    expect(result.status).toBe("partial");
    expect(rawJson).toBeUndefined();
  });
});

describe("synthesizeResults with review findings", () => {
  function makeResult(overrides: Partial<ResultPacket> & { status: ResultPacket["status"]; sourceAgent: string }): ResultPacket {
    return createResultPacket({
      taskId: "task_test_123",
      summary: `Result from ${overrides.sourceAgent}`,
      deliverables: [],
      modifiedFiles: [],
      ...overrides,
    });
  }

  it("surfaces critical findings in summary", () => {
    const reviewOutput: StructuredReviewOutput = {
      verdict: "request_changes",
      findings: [
        {
          id: "F1",
          priority: "critical",
          category: "correctness",
          title: "Null pointer risk",
          explanation: "test",
          evidence: "test",
          suggestedAction: "test",
        },
      ],
      summary: "Issues found",
    };

    const results = [
      makeResult({ status: "success", sourceAgent: "specialist_builder" }),
      makeResult({ status: "partial", sourceAgent: "specialist_reviewer" }),
    ];

    const reviewOutputs = new Map([["specialist_reviewer", reviewOutput]]);
    const synthesized = synthesizeResults({ results, reviewOutputs });

    expect(synthesized.summary).toContain("Null pointer risk");
    expect(synthesized.summary).toContain("1 critical");
  });

  it("appends BLOCKED warning for blocked verdict", () => {
    const reviewOutput: StructuredReviewOutput = {
      verdict: "blocked",
      findings: [
        {
          id: "F1",
          priority: "critical",
          category: "security",
          title: "SQL injection vulnerability",
          explanation: "test",
          evidence: "test",
          suggestedAction: "test",
        },
      ],
      summary: "Blocked",
    };

    const results = [
      makeResult({ status: "failure", sourceAgent: "specialist_reviewer" }),
    ];

    const reviewOutputs = new Map([["specialist_reviewer", reviewOutput]]);
    const synthesized = synthesizeResults({ results, reviewOutputs });

    expect(synthesized.summary).toContain("BLOCKED: SQL injection vulnerability");
  });

  it("does not modify summary when only nit findings", () => {
    const reviewOutput: StructuredReviewOutput = {
      verdict: "comment",
      findings: [
        {
          id: "F1",
          priority: "nit",
          category: "style",
          title: "Trailing whitespace",
          explanation: "test",
          evidence: "test",
          suggestedAction: "test",
        },
      ],
      summary: "Minor nits only",
    };

    const results = [
      makeResult({ status: "success", sourceAgent: "specialist_reviewer", summary: "All good" }),
    ];

    const reviewOutputs = new Map([["specialist_reviewer", reviewOutput]]);
    const synthesized = synthesizeResults({ results, reviewOutputs });

    // Summary should NOT contain "Review findings" since only nits
    expect(synthesized.summary).not.toContain("Review findings");
  });

  it("populates reviewFindings on SynthesizedResult", () => {
    const reviewOutput: StructuredReviewOutput = {
      verdict: "approve",
      findings: [],
      summary: "Approved",
    };

    const results = [
      makeResult({ status: "success", sourceAgent: "specialist_reviewer" }),
    ];

    const reviewOutputs = new Map([["specialist_reviewer", reviewOutput]]);
    const synthesized = synthesizeResults({ results, reviewOutputs });

    expect(synthesized.reviewFindings).toBeDefined();
    expect(synthesized.reviewFindings!.verdict).toBe("approve");
  });

  it("works normally when no reviewOutputs provided (backward compat)", () => {
    const results = [
      makeResult({ status: "success", sourceAgent: "specialist_builder" }),
    ];

    const synthesized = synthesizeResults({ results });
    expect(synthesized.overallStatus).toBe("success");
    expect(synthesized.reviewFindings).toBeUndefined();
  });
});
