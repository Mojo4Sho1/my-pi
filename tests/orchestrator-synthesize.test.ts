import { describe, it, expect } from "vitest";
import { synthesizeResults } from "../extensions/orchestrator/synthesize.js";
import { createResultPacket } from "../extensions/shared/packets.js";
import type { ResultPacket } from "../extensions/shared/types.js";

function makeResult(overrides: Partial<ResultPacket> & { status: ResultPacket["status"]; sourceAgent: string }): ResultPacket {
  return createResultPacket({
    taskId: "task_test_123",
    summary: `Result from ${overrides.sourceAgent}`,
    deliverables: [],
    modifiedFiles: [],
    ...overrides,
  });
}

describe("synthesizeResults", () => {
  describe("empty results", () => {
    it("returns failure for empty input", () => {
      const result = synthesizeResults([]);
      expect(result.overallStatus).toBe("failure");
      expect(result.specialistsInvoked).toEqual([]);
      expect(result.results).toEqual([]);
    });
  });

  describe("single result", () => {
    it("passes through success status", () => {
      const packet = makeResult({ status: "success", sourceAgent: "specialist_builder" });
      const result = synthesizeResults([packet]);
      expect(result.overallStatus).toBe("success");
      expect(result.summary).toBe(packet.summary);
    });

    it("passes through failure status", () => {
      const packet = makeResult({ status: "failure", sourceAgent: "specialist_builder" });
      const result = synthesizeResults([packet]);
      expect(result.overallStatus).toBe("failure");
    });

    it("passes through escalation status", () => {
      const packet = makeResult({
        status: "escalation",
        sourceAgent: "specialist_builder",
        escalation: { reason: "out of scope", suggestedAction: "escalate to human" },
      });
      const result = synthesizeResults([packet]);
      expect(result.overallStatus).toBe("escalation");
    });

    it("passes through partial status", () => {
      const packet = makeResult({ status: "partial", sourceAgent: "specialist_builder" });
      const result = synthesizeResults([packet]);
      expect(result.overallStatus).toBe("partial");
    });
  });

  describe("multiple results — status logic", () => {
    it("returns success when all succeed", () => {
      const results = [
        makeResult({ status: "success", sourceAgent: "specialist_planner" }),
        makeResult({ status: "success", sourceAgent: "specialist_builder" }),
      ];
      const result = synthesizeResults(results);
      expect(result.overallStatus).toBe("success");
    });

    it("returns failure when all fail", () => {
      const results = [
        makeResult({ status: "failure", sourceAgent: "specialist_planner" }),
        makeResult({ status: "failure", sourceAgent: "specialist_builder" }),
      ];
      const result = synthesizeResults(results);
      expect(result.overallStatus).toBe("failure");
    });

    it("returns partial for mixed success/failure", () => {
      const results = [
        makeResult({ status: "success", sourceAgent: "specialist_planner" }),
        makeResult({ status: "failure", sourceAgent: "specialist_builder" }),
      ];
      const result = synthesizeResults(results);
      expect(result.overallStatus).toBe("partial");
    });

    it("returns escalation when any result escalates", () => {
      const results = [
        makeResult({ status: "success", sourceAgent: "specialist_planner" }),
        makeResult({
          status: "escalation",
          sourceAgent: "specialist_builder",
          escalation: { reason: "blocked", suggestedAction: "ask human" },
        }),
      ];
      const result = synthesizeResults(results);
      expect(result.overallStatus).toBe("escalation");
    });

    it("returns partial for mixed success/partial", () => {
      const results = [
        makeResult({ status: "success", sourceAgent: "specialist_planner" }),
        makeResult({ status: "partial", sourceAgent: "specialist_builder" }),
      ];
      const result = synthesizeResults(results);
      expect(result.overallStatus).toBe("partial");
    });
  });

  describe("specialists invoked", () => {
    it("lists all source agents", () => {
      const results = [
        makeResult({ status: "success", sourceAgent: "specialist_planner" }),
        makeResult({ status: "success", sourceAgent: "specialist_builder" }),
        makeResult({ status: "success", sourceAgent: "specialist_tester" }),
      ];
      const result = synthesizeResults(results);
      expect(result.specialistsInvoked).toEqual([
        "specialist_planner",
        "specialist_builder",
        "specialist_tester",
      ]);
    });
  });

  describe("summary", () => {
    it("includes all specialist summaries in multi-result", () => {
      const results = [
        makeResult({ status: "success", sourceAgent: "specialist_planner", summary: "Plan created" }),
        makeResult({ status: "success", sourceAgent: "specialist_builder", summary: "Code written" }),
      ];
      const result = synthesizeResults(results);
      expect(result.summary).toContain("Plan created");
      expect(result.summary).toContain("Code written");
      expect(result.summary).toContain("[specialist_planner]");
      expect(result.summary).toContain("[specialist_builder]");
    });
  });

  describe("results array", () => {
    it("preserves all result packets in order", () => {
      const results = [
        makeResult({ status: "success", sourceAgent: "specialist_planner" }),
        makeResult({ status: "success", sourceAgent: "specialist_builder" }),
      ];
      const synthesized = synthesizeResults(results);
      expect(synthesized.results).toHaveLength(2);
      expect(synthesized.results[0].sourceAgent).toBe("specialist_planner");
      expect(synthesized.results[1].sourceAgent).toBe("specialist_builder");
    });
  });
});
