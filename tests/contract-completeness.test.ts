import { describe, it, expect } from "vitest";
import {
  validateInputContract,
  validateOutputContract,
  contractsCompatible,
} from "../extensions/shared/contracts.js";
import type {
  ContractField,
  ContractFieldType,
  InputContract,
  OutputContract,
} from "../extensions/shared/types.js";
import { PLANNER_PROMPT_CONFIG } from "../extensions/specialists/planner/prompt.js";
import { BUILDER_PROMPT_CONFIG } from "../extensions/specialists/builder/prompt.js";
import { REVIEWER_PROMPT_CONFIG } from "../extensions/specialists/reviewer/prompt.js";
import { TESTER_PROMPT_CONFIG } from "../extensions/specialists/tester/prompt.js";
import { SPEC_WRITER_PROMPT_CONFIG } from "../extensions/specialists/spec-writer/prompt.js";
import { SCHEMA_DESIGNER_PROMPT_CONFIG } from "../extensions/specialists/schema-designer/prompt.js";
import { ROUTING_DESIGNER_PROMPT_CONFIG } from "../extensions/specialists/routing-designer/prompt.js";
import { CRITIC_PROMPT_CONFIG } from "../extensions/specialists/critic/prompt.js";
import { BOUNDARY_AUDITOR_PROMPT_CONFIG } from "../extensions/specialists/boundary-auditor/prompt.js";

const SPECIALISTS = [
  { name: "planner", config: PLANNER_PROMPT_CONFIG },
  { name: "builder", config: BUILDER_PROMPT_CONFIG },
  { name: "reviewer", config: REVIEWER_PROMPT_CONFIG },
  { name: "tester", config: TESTER_PROMPT_CONFIG },
  { name: "spec-writer", config: SPEC_WRITER_PROMPT_CONFIG },
  { name: "schema-designer", config: SCHEMA_DESIGNER_PROMPT_CONFIG },
  { name: "routing-designer", config: ROUTING_DESIGNER_PROMPT_CONFIG },
  { name: "critic", config: CRITIC_PROMPT_CONFIG },
  { name: "boundary-auditor", config: BOUNDARY_AUDITOR_PROMPT_CONFIG },
] as const;

const SPECIALIST_NAMES = new Set(SPECIALISTS.map((specialist) => specialist.name));

function sampleValueForType(type: ContractFieldType): unknown {
  switch (type) {
    case "string":
      return "sample";
    case "string[]":
      return ["sample"];
    case "boolean":
      return true;
    case "number":
      return 1;
    case "object":
      return { sample: true };
    case "object[]":
      return [{ sample: true }];
  }
}

function buildValidInputContext(contract: InputContract): Record<string, unknown> | undefined {
  const requiredFields = contract.fields.filter((field) => field.required);
  if (requiredFields.length === 0) {
    return undefined;
  }

  return Object.fromEntries(
    requiredFields.map((field) => [field.name, sampleValueForType(field.type)])
  );
}

function buildValidOutputDeliverables(contract: OutputContract): Record<string, unknown> {
  return Object.fromEntries(
    contract.fields
      .filter((field) => field.required)
      .map((field) => [field.name, sampleValueForType(field.type)])
  );
}

function findDuplicateFieldNames(fields: ContractField[]): string[] {
  const counts = new Map<string, number>();

  for (const field of fields) {
    counts.set(field.name, (counts.get(field.name) ?? 0) + 1);
  }

  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([name]) => name);
}

describe("specialist contract completeness", () => {
  it("covers all 9 specialists", () => {
    expect(SPECIALISTS.map((specialist) => specialist.name)).toEqual([
      "planner",
      "builder",
      "reviewer",
      "tester",
      "spec-writer",
      "schema-designer",
      "routing-designer",
      "critic",
      "boundary-auditor",
    ]);
  });

  for (const specialist of SPECIALISTS) {
    describe(specialist.name, () => {
      it("has a valid input contract shape", () => {
        const input = specialist.config.inputContract;
        expect(input).toBeDefined();
        if (!input) return;

        expect(Array.isArray(input.fields)).toBe(true);

        const errors = validateInputContract(
          buildValidInputContext(input),
          input
        );

        expect(errors).toEqual([]);
      });

      it("has a valid output contract shape with at least one guaranteed field", () => {
        const output = specialist.config.outputContract;
        expect(output).toBeDefined();
        if (!output) return;

        expect(Array.isArray(output.fields)).toBe(true);
        expect(
          output.fields.some((field) => field.required)
        ).toBe(true);

        const errors = validateOutputContract(
          buildValidOutputDeliverables(output),
          output
        );

        expect(errors).toEqual([]);
      });

      it("uses unique field names and valid source specialist references", () => {
        const input = specialist.config.inputContract;
        const output = specialist.config.outputContract;
        if (!input || !output) return;

        expect(findDuplicateFieldNames(input.fields)).toEqual([]);
        expect(findDuplicateFieldNames(output.fields)).toEqual([]);

        for (const field of input.fields) {
          if (field.sourceSpecialist) {
            expect(SPECIALIST_NAMES.has(field.sourceSpecialist as typeof SPECIALISTS[number]["name"])).toBe(true);
          }
        }
      });

      it("does not overlap input and output field names", () => {
        const input = specialist.config.inputContract;
        const output = specialist.config.outputContract;
        if (!input || !output) return;

        const inputFieldNames = new Set(
          input.fields.map((field) => field.name)
        );
        const overlappingNames = output.fields
          .map((field) => field.name)
          .filter((fieldName) => inputFieldNames.has(fieldName));

        expect(overlappingNames).toEqual([]);
      });
    });
  }
});

describe("specialist chain cross-validation", () => {
  const commonChains = [
    {
      name: "planner -> builder",
      upstreamName: "planner",
      upstream: PLANNER_PROMPT_CONFIG,
      downstream: BUILDER_PROMPT_CONFIG,
    },
    {
      name: "builder -> tester",
      upstreamName: "builder",
      upstream: BUILDER_PROMPT_CONFIG,
      downstream: TESTER_PROMPT_CONFIG,
    },
    {
      name: "builder -> reviewer",
      upstreamName: "builder",
      upstream: BUILDER_PROMPT_CONFIG,
      downstream: REVIEWER_PROMPT_CONFIG,
    },
    {
      name: "spec-writer -> schema-designer",
      upstreamName: "spec-writer",
      upstream: SPEC_WRITER_PROMPT_CONFIG,
      downstream: SCHEMA_DESIGNER_PROMPT_CONFIG,
    },
    {
      name: "schema-designer -> routing-designer",
      upstreamName: "schema-designer",
      upstream: SCHEMA_DESIGNER_PROMPT_CONFIG,
      downstream: ROUTING_DESIGNER_PROMPT_CONFIG,
    },
  ] as const;

  for (const chain of commonChains) {
    it(`evaluates ${chain.name} with contractsCompatible()`, () => {
      const downInput = chain.downstream.inputContract;
      const upOutput = chain.upstream.outputContract;
      expect(downInput).toBeDefined();
      expect(upOutput).toBeDefined();
      if (!downInput || !upOutput) return;

      expect(
        downInput.fields.some(
          (field) => field.sourceSpecialist === chain.upstreamName
        )
      ).toBe(true);

      const result = contractsCompatible(upOutput, downInput);

      expect(result.compatible).toBe(true);
      expect(result.missingFields).toEqual([]);
    });
  }
});
