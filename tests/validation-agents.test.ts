import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import {
  parseAgentDefinition,
  validateAgentDefinition,
} from "../extensions/shared/validation.js";

const SPECIALISTS_DIR = join(__dirname, "..", "agents", "specialists");

function loadSpecialist(name: string): string {
  return readFileSync(join(SPECIALISTS_DIR, `${name}.md`), "utf-8");
}

// --- parseAgentDefinition ---

describe("parseAgentDefinition", () => {
  it("extracts all top-level sections from a specialist definition", () => {
    const markdown = loadSpecialist("builder");
    const parsed = parseAgentDefinition(markdown);

    expect(parsed.sections["Definition"]).toBeDefined();
    expect(parsed.sections["Intent"]).toBeDefined();
    expect(parsed.sections["Working Style"]).toBeDefined();
    expect(parsed.sections["Routing and access"]).toBeDefined();
    expect(parsed.sections["Inputs and outputs"]).toBeDefined();
    expect(parsed.sections["Control and escalation"]).toBeDefined();
    expect(parsed.sections["Validation"]).toBeDefined();
    expect(parsed.sections["Relationships"]).toBeDefined();
    expect(parsed.sections["Authority flags"]).toBeDefined();
    expect(parsed.sections["Specialist-specific fields"]).toBeDefined();
  });

  it("extracts inline field values", () => {
    const markdown = loadSpecialist("builder");
    const parsed = parseAgentDefinition(markdown);

    expect(parsed.sections["Definition"].fields["id"]).toBe("specialist_builder");
    expect(parsed.sections["Definition"].fields["name"]).toBe("Specialist Builder");
    expect(parsed.sections["Definition"].fields["definition_type"]).toBe("specialist");
  });

  it("extracts list field values", () => {
    const markdown = loadSpecialist("builder");
    const parsed = parseAgentDefinition(markdown);

    const scope = parsed.sections["Intent"].fields["scope"];
    expect(Array.isArray(scope)).toBe(true);
    expect((scope as string[]).length).toBeGreaterThan(0);
  });

  it("extracts working_style sub-fields", () => {
    const markdown = loadSpecialist("builder");
    const parsed = parseAgentDefinition(markdown);

    const ws = parsed.sections["Working Style"];
    expect(ws.fields["reasoning_posture"]).toBeDefined();
    expect(ws.fields["communication_posture"]).toBeDefined();
    expect(ws.fields["risk_posture"]).toBeDefined();
    expect(ws.fields["default_bias"]).toBeDefined();
    expect(ws.fields["anti_patterns"]).toBeDefined();
  });

  it("extracts anti_patterns as a list", () => {
    const markdown = loadSpecialist("builder");
    const parsed = parseAgentDefinition(markdown);

    const antiPatterns = parsed.sections["Working Style"].fields["anti_patterns"];
    expect(Array.isArray(antiPatterns)).toBe(true);
    expect((antiPatterns as string[]).length).toBeGreaterThan(0);
  });

  it("preserves rawContent", () => {
    const markdown = loadSpecialist("builder");
    const parsed = parseAgentDefinition(markdown);
    expect(parsed.rawContent).toBe(markdown);
  });
});

// --- validateAgentDefinition: real specialist definitions ---

describe("validateAgentDefinition — real definitions", () => {
  const specialists = ["builder", "planner", "reviewer", "tester"];

  for (const name of specialists) {
    it(`validates ${name}.md without errors`, () => {
      const markdown = loadSpecialist(name);
      const parsed = parseAgentDefinition(markdown);
      const errors = validateAgentDefinition(parsed, "specialist");
      expect(errors).toEqual([]);
    });
  }
});

// --- validateAgentDefinition: synthetic bad definitions ---

describe("validateAgentDefinition — synthetic bad definitions", () => {
  function makeMinimalSpecialist(): string {
    return `# test.md

## Definition

- \`id\`: specialist_test
- \`name\`: Test Specialist
- \`definition_type\`: specialist

## Intent

- \`purpose\`: Do testing.
- \`scope\`:
  - test things
- \`non_goals\`:
  - not test things

## Working Style

- \`working_style\`:
  - \`reasoning_posture\`: Think carefully.
  - \`communication_posture\`: Be clear.
  - \`risk_posture\`: Be cautious.
  - \`default_bias\`: Prefer simplicity.
  - \`anti_patterns\`:
    - over-engineering

## Routing and access

- \`routing_class\`: downstream
- \`context_scope\`: narrow
- \`default_read_set\`:
  - task packet
- \`forbidden_by_default\`:
  - nothing

## Inputs and outputs

- \`required_inputs\`:
  - task
- \`expected_outputs\`:
  - result
- \`handback_format\`:
  - summary

## Control and escalation

- \`activation_conditions\`:
  - task ready
- \`escalation_conditions\`:
  - task unclear

## Validation

- \`validation_expectations\`:
  - check output

## Relationships

- \`related_docs\`:
  - none
- \`related_definitions\`:
  - none

## Authority flags

- \`can_delegate\`: false
- \`can_synthesize\`: false
- \`can_update_handoff\`: false
- \`can_update_workflow_docs\`: false
- \`can_request_broader_context\`: true

## Specialist-specific fields

- \`specialization\`: Testing things.
- \`task_boundary\`: Test tasks.
- \`deliverable_boundary\`: Test results.
- \`failure_boundary\`: Stop when tests fail.

## Summary

A test specialist.`;
  }

  it("passes validation for a minimal well-formed specialist", () => {
    const parsed = parseAgentDefinition(makeMinimalSpecialist());
    const errors = validateAgentDefinition(parsed, "specialist");
    expect(errors).toEqual([]);
  });

  it("reports missing Working Style section", () => {
    const markdown = makeMinimalSpecialist().replace(
      /## Working Style[\s\S]*?(?=## Routing)/,
      ""
    );
    const parsed = parseAgentDefinition(markdown);
    const errors = validateAgentDefinition(parsed, "specialist");
    expect(errors.some((e) => e.includes("Working Style"))).toBe(true);
  });

  it("reports missing purpose field in Intent", () => {
    const markdown = makeMinimalSpecialist().replace(
      "- `purpose`: Do testing.",
      ""
    );
    const parsed = parseAgentDefinition(markdown);
    const errors = validateAgentDefinition(parsed, "specialist");
    expect(errors.some((e) => e.includes("purpose"))).toBe(true);
  });

  it("reports empty specialization field", () => {
    const markdown = makeMinimalSpecialist().replace(
      "- `specialization`: Testing things.",
      "- `specialization`: "
    );
    const parsed = parseAgentDefinition(markdown);
    const errors = validateAgentDefinition(parsed, "specialist");
    expect(errors.some((e) => e.includes("specialization") && e.includes("empty"))).toBe(true);
  });

  it("reports wrong routing_class for specialist", () => {
    const markdown = makeMinimalSpecialist().replace(
      "- `routing_class`: downstream",
      "- `routing_class`: orchestrator"
    );
    const parsed = parseAgentDefinition(markdown);
    const errors = validateAgentDefinition(parsed, "specialist");
    expect(errors.some((e) => e.includes("routing_class") && e.includes("downstream"))).toBe(true);
  });

  it("reports wrong definition_type", () => {
    const markdown = makeMinimalSpecialist().replace(
      "- `definition_type`: specialist",
      "- `definition_type`: orchestrator"
    );
    const parsed = parseAgentDefinition(markdown);
    const errors = validateAgentDefinition(parsed, "specialist");
    expect(errors.some((e) => e.includes("definition_type"))).toBe(true);
  });

  it("reports missing anti_patterns in working_style", () => {
    const markdown = makeMinimalSpecialist().replace(
      /  - `anti_patterns`:[\s\S]*?(?=\n## )/,
      ""
    );
    const parsed = parseAgentDefinition(markdown);
    const errors = validateAgentDefinition(parsed, "specialist");
    expect(errors.some((e) => e.includes("anti_patterns"))).toBe(true);
  });

  it("reports wrong can_delegate value for specialist", () => {
    const markdown = makeMinimalSpecialist().replace(
      "- `can_delegate`: false",
      "- `can_delegate`: true"
    );
    const parsed = parseAgentDefinition(markdown);
    const errors = validateAgentDefinition(parsed, "specialist");
    expect(errors.some((e) => e.includes("can_delegate"))).toBe(true);
  });

  it("reports multiple errors for a definition with many problems", () => {
    const markdown = `# bad.md

## Definition

- \`id\`: specialist_bad
- \`name\`: Bad Specialist

## Intent

- \`scope\`:
  - something

## Summary

Incomplete definition.`;
    const parsed = parseAgentDefinition(markdown);
    const errors = validateAgentDefinition(parsed, "specialist");
    // Should report missing sections, missing fields, etc.
    expect(errors.length).toBeGreaterThan(3);
  });
});
