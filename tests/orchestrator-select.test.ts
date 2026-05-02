import { describe, it, expect } from "vitest";
import { selectSpecialists } from "../extensions/orchestrator/select.js";

describe("selectSpecialists", () => {
  describe("single specialist hint", () => {
    it("returns planner when hint is 'planner'", () => {
      const result = selectSpecialists("do something", "planner");
      expect(result.specialists).toEqual(["planner"]);
      expect(result.reason).toContain("planner");
    });

    it("returns builder when hint is 'builder'", () => {
      const result = selectSpecialists("do something", "builder");
      expect(result.specialists).toEqual(["builder"]);
    });

    it("returns reviewer when hint is 'reviewer'", () => {
      const result = selectSpecialists("do something", "reviewer");
      expect(result.specialists).toEqual(["reviewer"]);
    });

    it("resolves deprecated tester alias to builder-test", () => {
      const result = selectSpecialists("do something", "tester");
      expect(result.specialists).toEqual(["builder-test"]);
      expect(result.reason).toContain("deprecated alias tester");
    });

    it("returns builder-test when hint is 'builder-test'", () => {
      const result = selectSpecialists("do something", "builder-test");
      expect(result.specialists).toEqual(["builder-test"]);
    });

    it("returns spec-writer when hint is 'spec-writer'", () => {
      const result = selectSpecialists("do something", "spec-writer");
      expect(result.specialists).toEqual(["spec-writer"]);
    });

    it("returns schema-designer when hint is 'schema-designer'", () => {
      const result = selectSpecialists("do something", "schema-designer");
      expect(result.specialists).toEqual(["schema-designer"]);
    });

    it("returns routing-designer when hint is 'routing-designer'", () => {
      const result = selectSpecialists("do something", "routing-designer");
      expect(result.specialists).toEqual(["routing-designer"]);
    });

    it("returns critic when hint is 'critic'", () => {
      const result = selectSpecialists("do something", "critic");
      expect(result.specialists).toEqual(["critic"]);
    });

    it("returns boundary-auditor when hint is 'boundary-auditor'", () => {
      const result = selectSpecialists("do something", "boundary-auditor");
      expect(result.specialists).toEqual(["boundary-auditor"]);
    });
  });

  describe("array hint (multi-specialist chain)", () => {
    it("returns ordered specialists from array hint", () => {
      const result = selectSpecialists("do something", ["planner", "builder"]);
      expect(result.specialists).toEqual(["planner", "builder"]);
      expect(result.reason).toContain("planner");
      expect(result.reason).toContain("builder");
    });

    it("preserves caller-specified order", () => {
      const result = selectSpecialists("do something", ["builder", "reviewer"]);
      expect(result.specialists).toEqual(["builder", "reviewer"]);
    });

    it("filters out invalid specialist IDs", () => {
      const result = selectSpecialists("do something", ["builder", "nonexistent" as any, "tester"]);
      expect(result.specialists).toEqual(["builder", "builder-test"]);
    });

    it("falls back to builder if all array entries are invalid", () => {
      const result = selectSpecialists("do something", ["invalid1", "invalid2"] as any);
      expect(result.specialists).toEqual(["builder"]);
      expect(result.reason).toContain("defaulting to builder");
    });

    it("handles single-element array", () => {
      const result = selectSpecialists("do something", ["critic"]);
      expect(result.specialists).toEqual(["critic"]);
    });
  });


  describe("fallback behavior", () => {
    it("defaults to builder when hint is 'auto'", () => {
      const result = selectSpecialists("implement the feature", "auto");
      expect(result.specialists).toEqual(["builder"]);
      expect(result.reason).toContain("defaulting to builder");
    });

    it("defaults to builder when no hint is provided", () => {
      const result = selectSpecialists("do something with the codebase");
      expect(result.specialists).toEqual(["builder"]);
      expect(result.reason).toContain("defaulting to builder");
    });

    it("defaults to builder for empty task", () => {
      const result = selectSpecialists("");
      expect(result.specialists).toEqual(["builder"]);
    });

    it("ignores invalid string hint and defaults to builder", () => {
      const result = selectSpecialists("do something", "nonexistent" as any);
      expect(result.specialists).toEqual(["builder"]);
    });
  });

  describe("reason string", () => {
    it("is always populated", () => {
      expect(selectSpecialists("anything").reason).toBeTruthy();
      expect(selectSpecialists("plan it", "planner").reason).toBeTruthy();
      expect(selectSpecialists("").reason).toBeTruthy();
    });

    it("names the specialist in explicit delegation", () => {
      const result = selectSpecialists("anything", "critic");
      expect(result.reason).toContain("critic");
    });

    it("uses arrow notation for multi-specialist chains", () => {
      const result = selectSpecialists("anything", ["planner", "builder", "tester"] as any);
      expect(result.reason).toContain("planner → builder → builder-test");
    });
  });
});
