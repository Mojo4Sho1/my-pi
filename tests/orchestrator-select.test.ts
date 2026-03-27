import { describe, it, expect } from "vitest";
import { selectSpecialists } from "../extensions/orchestrator/select.js";

describe("selectSpecialists", () => {
  describe("explicit hint", () => {
    it("returns planner when hint is 'planner'", () => {
      const result = selectSpecialists("do something", "planner");
      expect(result.specialists).toEqual(["planner"]);
      expect(result.reason).toContain("Explicitly delegated");
    });

    it("returns builder when hint is 'builder'", () => {
      const result = selectSpecialists("do something", "builder");
      expect(result.specialists).toEqual(["builder"]);
    });

    it("returns reviewer when hint is 'reviewer'", () => {
      const result = selectSpecialists("do something", "reviewer");
      expect(result.specialists).toEqual(["reviewer"]);
    });

    it("returns tester when hint is 'tester'", () => {
      const result = selectSpecialists("do something", "tester");
      expect(result.specialists).toEqual(["tester"]);
    });
  });

  describe("auto-selection with single keyword match", () => {
    it("selects planner for planning tasks", () => {
      const result = selectSpecialists("plan the migration strategy");
      expect(result.specialists).toEqual(["planner"]);
      expect(result.reason).toContain("planner");
    });

    it("selects planner for design tasks", () => {
      const result = selectSpecialists("design the new API");
      expect(result.specialists).toEqual(["planner"]);
    });

    it("selects reviewer for review tasks", () => {
      const result = selectSpecialists("review the pull request");
      expect(result.specialists).toEqual(["reviewer"]);
    });

    it("selects reviewer for audit tasks", () => {
      const result = selectSpecialists("audit the security configuration");
      expect(result.specialists).toEqual(["reviewer"]);
    });

    it("selects builder for implementation tasks", () => {
      const result = selectSpecialists("implement the login form");
      expect(result.specialists).toEqual(["builder"]);
    });

    it("selects builder for fix tasks", () => {
      const result = selectSpecialists("fix the broken login form");
      expect(result.specialists).toEqual(["builder"]);
    });

    it("selects builder for refactor tasks", () => {
      const result = selectSpecialists("refactor the auth module");
      expect(result.specialists).toEqual(["builder"]);
    });

    it("selects tester for testing tasks", () => {
      const result = selectSpecialists("test the new endpoint");
      expect(result.specialists).toEqual(["tester"]);
    });

    it("selects tester for validation tasks", () => {
      const result = selectSpecialists("validate the migration output");
      expect(result.specialists).toEqual(["tester"]);
    });

    it("selects tester for verification tasks", () => {
      const result = selectSpecialists("verify the deployment succeeded");
      expect(result.specialists).toEqual(["tester"]);
    });
  });

  describe("auto-selection defaults", () => {
    it("defaults to builder when no keywords match", () => {
      const result = selectSpecialists("do something with the codebase");
      expect(result.specialists).toEqual(["builder"]);
      expect(result.reason).toContain("defaulting to builder");
    });

    it("defaults to builder for empty task", () => {
      const result = selectSpecialists("");
      expect(result.specialists).toEqual(["builder"]);
    });
  });

  describe("auto hint behaves like omitted hint", () => {
    it("auto-selects when hint is 'auto'", () => {
      const result = selectSpecialists("implement the feature", "auto");
      expect(result.specialists).toEqual(["builder"]);
    });
  });

  describe("multi-specialist selection", () => {
    it("selects multiple specialists in workflow order", () => {
      const result = selectSpecialists("plan and implement the feature");
      expect(result.specialists).toEqual(["planner", "builder"]);
      expect(result.reason).toContain("multiple specialists");
    });

    it("maintains workflow order regardless of keyword order in task", () => {
      const result = selectSpecialists("implement first, then review the changes");
      expect(result.specialists).toEqual(["reviewer", "builder"]);
    });

    it("selects all four specialists when all keywords present", () => {
      const result = selectSpecialists("plan, review, build, and test the module");
      expect(result.specialists).toEqual(["planner", "reviewer", "builder", "tester"]);
    });
  });

  describe("reason string", () => {
    it("is always populated", () => {
      expect(selectSpecialists("anything").reason).toBeTruthy();
      expect(selectSpecialists("plan it", "planner").reason).toBeTruthy();
      expect(selectSpecialists("").reason).toBeTruthy();
    });
  });
});
