import { describe, it, expect } from "vitest";
import { buildContextForSpecialist } from "../extensions/orchestrator/delegate.js";
import { createResultPacket } from "../extensions/shared/packets.js";
import type { ResultPacket } from "../extensions/shared/types.js";

function makePlannerResult(overrides?: Partial<Parameters<typeof createResultPacket>[0]>): ResultPacket {
  return createResultPacket({
    taskId: "task_1",
    status: "success",
    summary: "Planned the feature in 3 steps",
    deliverables: ["step-1: scaffold", "step-2: implement", "step-3: test"],
    modifiedFiles: [],
    structuredOutput: {
      status: "success",
      summary: "Planned the feature in 3 steps",
      steps: ["step-1: scaffold", "step-2: implement", "step-3: test"],
      dependencies: ["step-2 depends on step-1", "step-3 depends on step-2"],
      risks: ["integration drift"],
      modifiedFiles: [],
    },
    sourceAgent: "specialist_planner",
    ...overrides,
  });
}

function makeBuilderResult(overrides?: Partial<Parameters<typeof createResultPacket>[0]>): ResultPacket {
  return createResultPacket({
    taskId: "task_2",
    status: "success",
    summary: "Implemented the feature with 2 file changes",
    deliverables: ["Added handler", "Updated config"],
    modifiedFiles: ["src/handler.ts", "src/config.ts"],
    structuredOutput: {
      status: "success",
      summary: "Implemented the feature with 2 file changes",
      modifiedFiles: ["src/handler.ts", "src/config.ts"],
      changeDescription: "Added handler and updated config wiring",
    },
    sourceAgent: "specialist_builder",
    ...overrides,
  });
}

describe("buildContextForSpecialist", () => {
  describe("planner", () => {
    it("returns undefined with no prior results", () => {
      expect(buildContextForSpecialist("planner", [])).toBeUndefined();
    });

    it("returns undefined even with prior results", () => {
      const results = [makePlannerResult(), makeBuilderResult()];
      expect(buildContextForSpecialist("planner", results)).toBeUndefined();
    });
  });

  describe("builder", () => {
    it("returns planSummary and planSteps when planner result exists", () => {
      const plannerResult = makePlannerResult();
      const context = buildContextForSpecialist("builder", [plannerResult]);

      expect(context).toEqual({
        planSummary: "Planned the feature in 3 steps",
        planSteps: ["step-1: scaffold", "step-2: implement", "step-3: test"],
      });
    });

    it("returns undefined when no planner result exists", () => {
      expect(buildContextForSpecialist("builder", [])).toBeUndefined();
    });

    it("returns undefined when only non-planner results exist", () => {
      const context = buildContextForSpecialist("builder", [makeBuilderResult()]);
      expect(context).toBeUndefined();
    });
  });

  describe("reviewer", () => {
    it("returns modifiedFiles and implementationSummary when builder result exists", () => {
      const builderResult = makeBuilderResult();
      const context = buildContextForSpecialist("reviewer", [builderResult]);

      expect(context).toEqual({
        modifiedFiles: ["src/handler.ts", "src/config.ts"],
        implementationSummary: "Added handler and updated config wiring",
      });
    });

    it("returns undefined when no builder result exists", () => {
      expect(buildContextForSpecialist("reviewer", [])).toBeUndefined();
    });

    it("returns undefined when only planner results exist", () => {
      const context = buildContextForSpecialist("reviewer", [makePlannerResult()]);
      expect(context).toBeUndefined();
    });
  });

  describe("builder-test", () => {
    it("returns modifiedFiles and implementationSummary when builder result exists", () => {
      const builderResult = makeBuilderResult();
      const context = buildContextForSpecialist("builder-test", [builderResult]);

      expect(context).toEqual({
        modifiedFiles: ["src/handler.ts", "src/config.ts"],
        implementationSummary: "Added handler and updated config wiring",
      });
    });

    it("returns undefined when no builder result exists", () => {
      expect(buildContextForSpecialist("builder-test", [])).toBeUndefined();
    });

    it("returns undefined when only planner results exist", () => {
      const context = buildContextForSpecialist("builder-test", [makePlannerResult()]);
      expect(context).toBeUndefined();
    });
  });

  describe("no full ResultPacket leakage", () => {
    it("builder context contains only planSummary and planSteps", () => {
      const context = buildContextForSpecialist("builder", [makePlannerResult()]);
      expect(context).toBeDefined();
      const keys = Object.keys(context!);
      expect(keys).toEqual(["planSummary", "planSteps"]);
    });

    it("reviewer context contains only modifiedFiles and implementationSummary", () => {
      const context = buildContextForSpecialist("reviewer", [makeBuilderResult()]);
      expect(context).toBeDefined();
      const keys = Object.keys(context!);
      expect(keys).toEqual(["modifiedFiles", "implementationSummary"]);
    });

    it("builder-test context contains only modifiedFiles and implementationSummary", () => {
      const context = buildContextForSpecialist("builder-test", [makeBuilderResult()]);
      expect(context).toBeDefined();
      const keys = Object.keys(context!);
      expect(keys).toEqual(["modifiedFiles", "implementationSummary"]);
    });
  });
});
