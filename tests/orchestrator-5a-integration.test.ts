/**
 * Stage 5a integration tests.
 *
 * Validates that all 9 specialists are properly registered in
 * the orchestrator: config lookup, explicit hint selection, and
 * context forwarding for the 5 new specialists.
 */

import { describe, it, expect } from "vitest";
import { getPromptConfig, buildContextForSpecialist } from "../extensions/orchestrator/delegate.js";
import { selectSpecialists, type SpecialistId } from "../extensions/orchestrator/select.js";
import { createResultPacket } from "../extensions/shared/packets.js";
import { SPECIALIST_REGISTRY_ENTRIES } from "../extensions/shared/registry-entries.js";

const NEW_SPECIALISTS: SpecialistId[] = [
  "spec-writer",
  "schema-designer",
  "routing-designer",
  "critic",
  "boundary-auditor",
];

describe("getPromptConfig for new specialists", () => {
  for (const id of NEW_SPECIALISTS) {
    it(`returns valid config for ${id}`, () => {
      const config = getPromptConfig(id);
      expect(config).toBeDefined();
      expect(config.id).toBe(`specialist_${id}`);
      expect(config.roleName).toBeTruthy();
      expect(config.workingStyle.reasoning).toBeTruthy();
    });
  }
});

describe("selectSpecialists explicit hints for new specialists", () => {
  for (const id of NEW_SPECIALISTS) {
    it(`selects ${id} when hint is '${id}'`, () => {
      const result = selectSpecialists("any task", id);
      expect(result.specialists).toEqual([id]);
    });
  }
});

describe("buildContextForSpecialist for new specialists", () => {
  const specWriterResult = createResultPacket({
    taskId: "t1",
    status: "success",
    summary: "Spec written",
    deliverables: ["agent definition spec"],
    modifiedFiles: [],
    sourceAgent: "specialist_spec-writer",
  });

  const schemaResult = createResultPacket({
    taskId: "t2",
    status: "success",
    summary: "Schema designed",
    deliverables: ["type definitions"],
    modifiedFiles: [],
    sourceAgent: "specialist_schema-designer",
  });

  it("spec-writer gets no context (first in chain)", () => {
    const ctx = buildContextForSpecialist("spec-writer", []);
    expect(ctx).toBeUndefined();
  });

  it("schema-designer gets spec-writer summary and deliverables", () => {
    const ctx = buildContextForSpecialist("schema-designer", [specWriterResult]);
    expect(ctx).toBeDefined();
    expect(ctx!.specSummary).toBe("Spec written");
    expect(ctx!.specDeliverables).toEqual(["agent definition spec"]);
  });

  it("schema-designer gets undefined when no spec-writer result", () => {
    const ctx = buildContextForSpecialist("schema-designer", []);
    expect(ctx).toBeUndefined();
  });

  it("routing-designer gets schema-designer summary and deliverables", () => {
    const ctx = buildContextForSpecialist("routing-designer", [specWriterResult, schemaResult]);
    expect(ctx).toBeDefined();
    expect(ctx!.schemaSummary).toBe("Schema designed");
    expect(ctx!.schemaDeliverables).toEqual(["type definitions"]);
  });

  it("routing-designer gets undefined when no schema-designer result", () => {
    const ctx = buildContextForSpecialist("routing-designer", [specWriterResult]);
    expect(ctx).toBeUndefined();
  });

  it("critic gets all prior summaries and deliverables", () => {
    const ctx = buildContextForSpecialist("critic", [specWriterResult, schemaResult]);
    expect(ctx).toBeDefined();
    expect(ctx!.priorSummaries).toHaveLength(2);
    expect((ctx!.priorSummaries as string[])[0]).toContain("specialist_spec-writer");
    expect(ctx!.priorDeliverables).toEqual(["agent definition spec", "type definitions"]);
  });

  it("critic gets undefined with empty prior results", () => {
    const ctx = buildContextForSpecialist("critic", []);
    expect(ctx).toBeUndefined();
  });

  it("boundary-auditor gets all prior summaries and deliverables", () => {
    const ctx = buildContextForSpecialist("boundary-auditor", [specWriterResult, schemaResult]);
    expect(ctx).toBeDefined();
    expect(ctx!.priorSummaries).toHaveLength(2);
    expect(ctx!.priorDeliverables).toHaveLength(2);
  });

  it("boundary-auditor gets undefined with empty prior results", () => {
    const ctx = buildContextForSpecialist("boundary-auditor", []);
    expect(ctx).toBeUndefined();
  });
});

describe("PrimitiveRegistryEntry data", () => {
  it("has entries for all 9 specialists", () => {
    expect(SPECIALIST_REGISTRY_ENTRIES).toHaveLength(9);
  });

  it("all entries have required fields", () => {
    for (const entry of SPECIALIST_REGISTRY_ENTRIES) {
      expect(entry.id).toBeTruthy();
      expect(entry.version).toBeTruthy();
      expect(entry.kind).toBe("specialist");
      expect(entry.purpose).toBeTruthy();
      expect(entry.selectionHints.length).toBeGreaterThan(0);
      expect(entry.status).toBe("active");
    }
  });

  it("all new specialists have registry entries", () => {
    const entryIds = SPECIALIST_REGISTRY_ENTRIES.map(e => e.id);
    for (const id of NEW_SPECIALISTS) {
      expect(entryIds).toContain(`specialist_${id}`);
    }
  });
});
