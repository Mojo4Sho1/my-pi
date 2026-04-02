import { describe, it, expect } from "vitest";
import { parseTestOutput, parseSpecialistOutput } from "../extensions/shared/result-parser.js";

describe("parseTestOutput", () => {
  it("extracts valid test results from raw JSON", () => {
    const rawJson = {
      status: "success",
      summary: "All tests passed",
      testResults: [
        {
          id: "T1",
          subject: "Auth module",
          method: "automated",
          expectedCondition: "Returns 200 on valid token",
          actualResult: "Returned 200",
          passed: true,
        },
        {
          id: "T2",
          subject: "Error handling",
          method: "manual",
          expectedCondition: "Returns 401 on invalid token",
          actualResult: "Returned 401",
          passed: true,
        },
      ],
    };

    const result = parseTestOutput(
      { status: "success", summary: "All tests passed", deliverables: [], modifiedFiles: [], sourceAgent: "specialist_tester" },
      rawJson
    );

    expect(result).toBeDefined();
    expect(result!.testResults).toHaveLength(2);
    expect(result!.testResults[0].id).toBe("T1");
    expect(result!.testResults[0].method).toBe("automated");
    expect(result!.testResults[0].passed).toBe(true);
    expect(result!.testResults[1].id).toBe("T2");
  });

  it("returns undefined when no testResults in raw JSON", () => {
    const result = parseTestOutput(
      { status: "success", summary: "Done", deliverables: [], modifiedFiles: [], sourceAgent: "specialist_tester" },
      { status: "success", summary: "Done" }
    );
    expect(result).toBeUndefined();
  });

  it("returns undefined when rawJson is undefined", () => {
    const result = parseTestOutput(
      { status: "success", summary: "Done", deliverables: [], modifiedFiles: [], sourceAgent: "specialist_tester" },
      undefined
    );
    expect(result).toBeUndefined();
  });

  it("returns undefined when testResults is not an array", () => {
    const result = parseTestOutput(
      { status: "success", summary: "Done", deliverables: [], modifiedFiles: [], sourceAgent: "specialist_tester" },
      { testResults: "not an array" } as Record<string, unknown>
    );
    expect(result).toBeUndefined();
  });

  it("skips malformed test results", () => {
    const rawJson = {
      testResults: [
        { id: "T1", subject: "Valid", method: "automated", expectedCondition: "x", actualResult: "x", passed: true },
        { id: "T2" }, // missing required fields
        "not an object",
      ],
    };

    const result = parseTestOutput(
      { status: "success", summary: "Mixed", deliverables: [], modifiedFiles: [], sourceAgent: "specialist_tester" },
      rawJson as Record<string, unknown>
    );

    expect(result).toBeDefined();
    expect(result!.testResults).toHaveLength(1);
    expect(result!.testResults[0].id).toBe("T1");
  });

  it("defaults invalid method to 'manual'", () => {
    const rawJson = {
      testResults: [
        { id: "T1", subject: "Test", method: "invalid_method", expectedCondition: "x", actualResult: "x", passed: true },
      ],
    };

    const result = parseTestOutput(
      { status: "success", summary: "Done", deliverables: [], modifiedFiles: [], sourceAgent: "specialist_tester" },
      rawJson as Record<string, unknown>
    );

    expect(result!.testResults[0].method).toBe("manual");
  });

  it("preserves summary from parsed result", () => {
    const rawJson = {
      testResults: [
        { id: "T1", subject: "Test", method: "automated", expectedCondition: "x", actualResult: "x", passed: false },
      ],
    };

    const result = parseTestOutput(
      { status: "failure", summary: "Tests failed", deliverables: [], modifiedFiles: [], sourceAgent: "specialist_tester" },
      rawJson as Record<string, unknown>
    );

    expect(result!.summary).toBe("Tests failed");
  });
});

describe("parseTestOutput integration with parseSpecialistOutput", () => {
  it("works end-to-end with JSON fence output", () => {
    const fencedOutput = `Here are the test results:

\`\`\`json
{
  "status": "success",
  "summary": "All 3 checks passed",
  "passed": true,
  "evidence": ["type check passed", "unit tests passed"],
  "failures": [],
  "testResults": [
    {
      "id": "T1",
      "subject": "Type checking",
      "method": "automated",
      "expectedCondition": "No type errors",
      "actualResult": "0 errors",
      "passed": true
    }
  ],
  "modifiedFiles": []
}
\`\`\``;

    const { result, rawJson } = parseSpecialistOutput(fencedOutput, "specialist_tester");
    expect(result.status).toBe("success");

    const testOutput = parseTestOutput(result, rawJson);
    expect(testOutput).toBeDefined();
    expect(testOutput!.testResults).toHaveLength(1);
    expect(testOutput!.testResults[0].subject).toBe("Type checking");
  });
});
