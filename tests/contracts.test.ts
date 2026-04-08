import { describe, it, expect } from "vitest";
import {
  validateOutputContract,
  validateInputContract,
  contractsCompatible,
  buildContextFromContract,
} from "../extensions/shared/contracts.js";
import { createResultPacket } from "../extensions/shared/packets.js";
import type { InputContract, OutputContract } from "../extensions/shared/types.js";

describe("validateOutputContract", () => {
  const contract: OutputContract = {
    fields: [
      { name: "steps", type: "string[]", required: true, description: "Steps" },
      { name: "risks", type: "string[]", required: true, description: "Risks" },
      { name: "notes", type: "string", required: false, description: "Notes" },
    ],
  };

  it("returns no errors when all required fields are present and typed correctly", () => {
    const deliverables = { steps: ["a", "b"], risks: ["r1"], notes: "ok" };
    expect(validateOutputContract(deliverables, contract)).toEqual([]);
  });

  it("returns error for missing required field", () => {
    const deliverables = { steps: ["a"] };
    const errors = validateOutputContract(deliverables, contract);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("risks");
  });

  it("returns error for wrong type", () => {
    const deliverables = { steps: "not-an-array", risks: ["ok"] };
    const errors = validateOutputContract(deliverables, contract);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("steps");
    expect(errors[0]).toContain("wrong type");
  });

  it("allows missing optional field", () => {
    const deliverables = { steps: ["a"], risks: ["r"] };
    expect(validateOutputContract(deliverables, contract)).toEqual([]);
  });

  it("validates boolean fields", () => {
    const boolContract: OutputContract = {
      fields: [{ name: "approved", type: "boolean", required: true, description: "Approved" }],
    };
    expect(validateOutputContract({ approved: true }, boolContract)).toEqual([]);
    expect(validateOutputContract({ approved: "yes" }, boolContract)).toHaveLength(1);
  });

  it("validates object fields", () => {
    const objContract: OutputContract = {
      fields: [{ name: "meta", type: "object", required: true, description: "Metadata" }],
    };
    expect(validateOutputContract({ meta: { a: 1 } }, objContract)).toEqual([]);
    expect(validateOutputContract({ meta: [1, 2] }, objContract)).toHaveLength(1);
  });

  it("treats missing structured output as missing required fields", () => {
    const errors = validateOutputContract(undefined, contract);
    expect(errors).toEqual([
      "Missing required output field 'steps'",
      "Missing required output field 'risks'",
    ]);
  });
});

describe("validateInputContract", () => {
  const contract: InputContract = {
    fields: [
      { name: "planSummary", type: "string", required: true, description: "Plan", sourceSpecialist: "planner" },
      { name: "extra", type: "string", required: false, description: "Extra" },
    ],
  };

  it("returns no errors when required fields present", () => {
    expect(validateInputContract({ planSummary: "do stuff" }, contract)).toEqual([]);
  });

  it("returns errors for undefined context with required fields", () => {
    const errors = validateInputContract(undefined, contract);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("planSummary");
  });

  it("returns no errors for undefined context with no required fields", () => {
    const optionalOnly: InputContract = {
      fields: [{ name: "x", type: "string", required: false, description: "X" }],
    };
    expect(validateInputContract(undefined, optionalOnly)).toEqual([]);
  });

  it("returns no errors for empty contract", () => {
    expect(validateInputContract(undefined, { fields: [] })).toEqual([]);
  });

  it("returns error for wrong type in context", () => {
    const errors = validateInputContract({ planSummary: 123 }, contract);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("wrong type");
  });
});

describe("contractsCompatible", () => {
  it("returns compatible when output satisfies input", () => {
    const output: OutputContract = {
      fields: [
        { name: "modifiedFiles", type: "string[]", required: true, description: "Files" },
        { name: "changeDescription", type: "string", required: true, description: "Desc" },
      ],
    };
    const input: InputContract = {
      fields: [
        { name: "modifiedFiles", type: "string[]", required: true, description: "Files", sourceSpecialist: "builder" },
      ],
    };
    const result = contractsCompatible(output, input);
    expect(result.compatible).toBe(true);
    expect(result.missingFields).toEqual([]);
  });

  it("returns incompatible when required input field missing from output", () => {
    const output: OutputContract = {
      fields: [{ name: "steps", type: "string[]", required: true, description: "Steps" }],
    };
    const input: InputContract = {
      fields: [{ name: "customField", type: "string[]", required: true, description: "Files" }],
    };
    const result = contractsCompatible(output, input);
    expect(result.compatible).toBe(false);
    expect(result.missingFields).toContain("customField");
  });

  it("returns incompatible on type mismatch", () => {
    const output: OutputContract = {
      fields: [{ name: "approved", type: "string", required: true, description: "Approved" }],
    };
    const input: InputContract = {
      fields: [{ name: "approved", type: "boolean", required: true, description: "Approved" }],
    };
    const result = contractsCompatible(output, input);
    expect(result.compatible).toBe(false);
    expect(result.missingFields[0]).toContain("type mismatch");
  });

  it("ignores optional input fields when checking compatibility", () => {
    const output: OutputContract = { fields: [] };
    const input: InputContract = {
      fields: [{ name: "extra", type: "string", required: false, description: "Extra" }],
    };
    expect(contractsCompatible(output, input).compatible).toBe(true);
  });
});

describe("buildContextFromContract", () => {
  const plannerResult = createResultPacket({
    taskId: "t1",
    status: "success",
    summary: "Plan: add tests",
    deliverables: ["step-1: write tests", "step-2: run tests"],
    modifiedFiles: [],
    structuredOutput: {
      status: "success",
      summary: "Plan: add tests",
      steps: ["step-1: write tests", "step-2: run tests"],
      dependencies: ["step-2 depends on step-1"],
      risks: ["tests may need fixtures"],
      modifiedFiles: [],
    },
    sourceAgent: "specialist_planner",
  });

  const builderResult = createResultPacket({
    taskId: "t2",
    status: "success",
    summary: "Implemented handler",
    deliverables: ["Added handler module"],
    modifiedFiles: ["src/handler.ts"],
    structuredOutput: {
      status: "success",
      summary: "Implemented handler",
      modifiedFiles: ["src/handler.ts"],
      changeDescription: "Added handler module with request validation",
    },
    sourceAgent: "specialist_builder",
  });

  it("extracts fields from matching prior results", () => {
    const input: InputContract = {
      fields: [
        { name: "planSummary", type: "string", required: false, description: "Plan", sourceSpecialist: "planner" },
        { name: "planSteps", type: "string[]", required: false, description: "Steps", sourceSpecialist: "planner" },
      ],
    };
    const context = buildContextFromContract(input, [plannerResult]);
    expect(context).toEqual({
      planSummary: "Plan: add tests",
      planSteps: ["step-1: write tests", "step-2: run tests"],
    });
  });

  it("returns undefined when no matching results exist", () => {
    const input: InputContract = {
      fields: [
        { name: "modifiedFiles", type: "string[]", required: false, description: "Files", sourceSpecialist: "builder" },
      ],
    };
    expect(buildContextFromContract(input, [plannerResult])).toBeUndefined();
  });

  it("returns undefined for empty input contract", () => {
    expect(buildContextFromContract({ fields: [] }, [plannerResult])).toBeUndefined();
  });

  it("extracts modifiedFiles and implementationSummary from builder", () => {
    const input: InputContract = {
      fields: [
        { name: "modifiedFiles", type: "string[]", required: false, description: "Files", sourceSpecialist: "builder" },
        { name: "implementationSummary", type: "string", required: false, description: "Summary", sourceSpecialist: "builder" },
      ],
    };
    const context = buildContextFromContract(input, [plannerResult, builderResult]);
    expect(context).toEqual({
      modifiedFiles: ["src/handler.ts"],
      implementationSummary: "Added handler module with request validation",
    });
  });

  it("skips fields without sourceSpecialist", () => {
    const input: InputContract = {
      fields: [
        { name: "custom", type: "string", required: false, description: "Custom" },
      ],
    };
    expect(buildContextFromContract(input, [plannerResult])).toBeUndefined();
  });
});
