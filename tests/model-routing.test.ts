import { describe, it, expect } from "vitest";
import { resolveModel } from "../extensions/shared/config.js";

describe("resolveModel", () => {
  it("returns runtimeOverride when all levels provided", () => {
    expect(resolveModel({
      runtimeOverride: "runtime-model",
      projectConfig: "project-model",
      specialistDefault: "specialist-model",
    })).toBe("runtime-model");
  });

  it("returns projectConfig when no runtimeOverride", () => {
    expect(resolveModel({
      projectConfig: "project-model",
      specialistDefault: "specialist-model",
    })).toBe("project-model");
  });

  it("returns specialistDefault when no runtimeOverride or projectConfig", () => {
    expect(resolveModel({
      specialistDefault: "specialist-model",
    })).toBe("specialist-model");
  });

  it("returns undefined when no levels provided (use host default)", () => {
    expect(resolveModel({})).toBeUndefined();
  });

  it("skips undefined levels in precedence chain", () => {
    expect(resolveModel({
      runtimeOverride: undefined,
      projectConfig: undefined,
      specialistDefault: "fallback",
    })).toBe("fallback");
  });

  it("different specialists can resolve different models", () => {
    const context1 = { specialistDefault: "claude-3-opus" };
    const context2 = { specialistDefault: "claude-3-haiku" };
    expect(resolveModel(context1)).toBe("claude-3-opus");
    expect(resolveModel(context2)).toBe("claude-3-haiku");
  });
});
