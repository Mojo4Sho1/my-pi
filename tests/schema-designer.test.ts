import { describe, it, expect } from "vitest";
import { buildSchemaDesignerSystemPrompt, buildSchemaDesignerTaskPrompt, SCHEMA_DESIGNER_PROMPT_CONFIG } from "../extensions/specialists/schema-designer/prompt.js";
import { createTaskPacket } from "../extensions/shared/packets.js";

describe("SCHEMA_DESIGNER_PROMPT_CONFIG", () => {
  it("has the correct specialist ID", () => {
    expect(SCHEMA_DESIGNER_PROMPT_CONFIG.id).toBe("specialist_schema-designer");
  });
  it("has the correct role name", () => {
    expect(SCHEMA_DESIGNER_PROMPT_CONFIG.roleName).toBe("Schema-Designer Specialist");
  });
  it("includes all working style fields", () => {
    expect(SCHEMA_DESIGNER_PROMPT_CONFIG.workingStyle.reasoning).toBeTruthy();
    expect(SCHEMA_DESIGNER_PROMPT_CONFIG.workingStyle.communication).toBeTruthy();
    expect(SCHEMA_DESIGNER_PROMPT_CONFIG.workingStyle.risk).toBeTruthy();
    expect(SCHEMA_DESIGNER_PROMPT_CONFIG.workingStyle.defaultBias).toBeTruthy();
  });
  it("has constraints", () => {
    expect(SCHEMA_DESIGNER_PROMPT_CONFIG.constraints.length).toBeGreaterThan(0);
  });
  it("has anti-patterns", () => {
    expect(SCHEMA_DESIGNER_PROMPT_CONFIG.antiPatterns.length).toBeGreaterThan(0);
  });
  it("has output contract", () => {
    expect(SCHEMA_DESIGNER_PROMPT_CONFIG.outputContract).toBeDefined();
    expect(SCHEMA_DESIGNER_PROMPT_CONFIG.outputContract!.fields.length).toBeGreaterThan(0);
  });
});

describe("buildSchemaDesignerSystemPrompt", () => {
  const prompt = buildSchemaDesignerSystemPrompt();
  it("includes the role name and ID", () => {
    expect(prompt).toContain("Schema-Designer Specialist");
    expect(prompt).toContain("specialist_schema-designer");
  });
  it("includes working style", () => {
    expect(prompt).toContain("Working Style");
  });
  it("includes constraints", () => {
    expect(prompt).toContain("Constraints");
  });
  it("includes anti-patterns", () => {
    expect(prompt).toContain("Anti-Patterns");
  });
  it("includes JSON output format", () => {
    expect(prompt).toContain("```json");
    expect(prompt).toContain('"status"');
  });
});

describe("buildSchemaDesignerTaskPrompt", () => {
  const task = createTaskPacket({
    objective: "Test objective",
    allowedReadSet: ["file.ts"],
    allowedWriteSet: [],
    acceptanceCriteria: ["Criteria"],
    targetAgent: "specialist_schema-designer",
    sourceAgent: "orchestrator",
  });
  it("includes task fields", () => {
    const prompt = buildSchemaDesignerTaskPrompt(task);
    expect(prompt).toContain("Test objective");
    expect(prompt).toContain("file.ts");
  });
  it("includes context when provided", () => {
    const taskWithCtx = createTaskPacket({
      objective: "Test",
      allowedReadSet: [],
      allowedWriteSet: [],
      acceptanceCriteria: [],
      context: { key: "value" },
      targetAgent: "specialist_schema-designer",
      sourceAgent: "orchestrator",
    });
    expect(buildSchemaDesignerTaskPrompt(taskWithCtx)).toContain("Additional context");
  });
});
