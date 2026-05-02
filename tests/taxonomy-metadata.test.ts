import { describe, expect, it } from "vitest";
import type { SpecialistPromptConfig } from "../extensions/shared/specialist-prompt.js";
import {
  ALL_SPECIALIST_IDS,
  getSpecialistAliasMetadata,
  resolveSpecialistId,
} from "../extensions/shared/constants.js";
import { getPromptConfig } from "../extensions/orchestrator/delegate.js";
import { PLANNER_PROMPT_CONFIG } from "../extensions/specialists/planner/prompt.js";
import { BUILDER_PROMPT_CONFIG } from "../extensions/specialists/builder/prompt.js";
import { REVIEWER_PROMPT_CONFIG } from "../extensions/specialists/reviewer/prompt.js";
import { TESTER_PROMPT_CONFIG } from "../extensions/specialists/tester/prompt.js";
import { SPEC_WRITER_PROMPT_CONFIG } from "../extensions/specialists/spec-writer/prompt.js";
import { SCHEMA_DESIGNER_PROMPT_CONFIG } from "../extensions/specialists/schema-designer/prompt.js";
import { ROUTING_DESIGNER_PROMPT_CONFIG } from "../extensions/specialists/routing-designer/prompt.js";
import { CRITIC_PROMPT_CONFIG } from "../extensions/specialists/critic/prompt.js";
import { BOUNDARY_AUDITOR_PROMPT_CONFIG } from "../extensions/specialists/boundary-auditor/prompt.js";

const RUNTIME_SPECIALISTS: SpecialistPromptConfig[] = [
  PLANNER_PROMPT_CONFIG,
  BUILDER_PROMPT_CONFIG,
  REVIEWER_PROMPT_CONFIG,
  TESTER_PROMPT_CONFIG,
  SPEC_WRITER_PROMPT_CONFIG,
  SCHEMA_DESIGNER_PROMPT_CONFIG,
  ROUTING_DESIGNER_PROMPT_CONFIG,
  CRITIC_PROMPT_CONFIG,
  BOUNDARY_AUDITOR_PROMPT_CONFIG,
];

const BASE_PREFIX = {
  Planner: "planner",
  Scribe: "scribe",
  Builder: "builder",
  Reviewer: "reviewer",
} as const;

describe("runtime specialist taxonomy metadata", () => {
  it("declares grouped taxonomy metadata on every runtime specialist config", () => {
    for (const config of RUNTIME_SPECIALISTS) {
      expect(config.taxonomy).toBeDefined();
      expect(config.taxonomy.baseClass).toBeTruthy();
      expect("variant" in config.taxonomy).toBe(true);
      expect(config.taxonomy.artifactResponsibility.length).toBeGreaterThan(0);
      expect(config.canonicalName).toBeTruthy();
      expect(config.currentRuntimeId).toBeTruthy();
      expect(Array.isArray(config.aliases)).toBe(true);
      expect(config.migrationStatus).toBeTruthy();
    }
  });

  it("uses base-class-prefixed variant names", () => {
    for (const config of RUNTIME_SPECIALISTS) {
      const { baseClass, variant } = config.taxonomy;
      if (!variant || !baseClass) continue;

      expect(variant.startsWith(`${BASE_PREFIX[baseClass]}-`)).toBe(true);
    }
  });

  it("keeps builder as the generic Builder specialist", () => {
    expect(BUILDER_PROMPT_CONFIG.canonicalName).toBe("builder");
    expect(BUILDER_PROMPT_CONFIG.currentRuntimeId).toBe("builder");
    expect(BUILDER_PROMPT_CONFIG.taxonomy).toMatchObject({
      baseClass: "Builder",
      variant: null,
    });
  });

  it("models tester as transitional metadata toward builder-test", () => {
    expect(TESTER_PROMPT_CONFIG.canonicalName).toBe("builder-test");
    expect(TESTER_PROMPT_CONFIG.currentRuntimeId).toBe("tester");
    expect(TESTER_PROMPT_CONFIG.migrationStatus).toBe("transitional");
    expect(TESTER_PROMPT_CONFIG.taxonomy).toMatchObject({
      baseClass: "Builder",
      variant: "builder-test",
    });
    expect(TESTER_PROMPT_CONFIG.aliases).toEqual([
      expect.objectContaining({
        name: "tester",
        canonicalTarget: "builder-test",
        lifecycleState: "deprecated",
      }),
    ]);
  });

  it("resolves builder-test canonically and tester through the deprecated alias", () => {
    expect(ALL_SPECIALIST_IDS).toContain("builder-test");
    expect(resolveSpecialistId("builder-test")).toBe("builder-test");
    expect(resolveSpecialistId("tester")).toBe("builder-test");
    expect(getSpecialistAliasMetadata("tester")).toMatchObject({
      canonicalTarget: "builder-test",
      lifecycleState: "deprecated",
    });
    expect(getPromptConfig("builder-test")).toBe(TESTER_PROMPT_CONFIG);
    expect(getPromptConfig("tester")).toBe(TESTER_PROMPT_CONFIG);
  });
});
