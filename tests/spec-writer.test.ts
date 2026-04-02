import { describe, it, expect } from "vitest";
import { buildSpecWriterSystemPrompt, buildSpecWriterTaskPrompt, SPEC_WRITER_PROMPT_CONFIG } from "../extensions/specialists/spec-writer/prompt.js";
import { createTaskPacket } from "../extensions/shared/packets.js";

describe("SPEC_WRITER_PROMPT_CONFIG", () => {
  it("has the correct specialist ID", () => {
    expect(SPEC_WRITER_PROMPT_CONFIG.id).toBe("specialist_spec-writer");
  });
  it("has the correct role name", () => {
    expect(SPEC_WRITER_PROMPT_CONFIG.roleName).toBe("Spec-Writer Specialist");
  });
  it("includes all working style fields", () => {
    expect(SPEC_WRITER_PROMPT_CONFIG.workingStyle.reasoning).toBeTruthy();
    expect(SPEC_WRITER_PROMPT_CONFIG.workingStyle.communication).toBeTruthy();
    expect(SPEC_WRITER_PROMPT_CONFIG.workingStyle.risk).toBeTruthy();
    expect(SPEC_WRITER_PROMPT_CONFIG.workingStyle.defaultBias).toBeTruthy();
  });
  it("has constraints", () => {
    expect(SPEC_WRITER_PROMPT_CONFIG.constraints.length).toBeGreaterThan(0);
  });
  it("has anti-patterns", () => {
    expect(SPEC_WRITER_PROMPT_CONFIG.antiPatterns.length).toBeGreaterThan(0);
  });
  it("has output contract", () => {
    expect(SPEC_WRITER_PROMPT_CONFIG.outputContract).toBeDefined();
    expect(SPEC_WRITER_PROMPT_CONFIG.outputContract!.fields.length).toBeGreaterThan(0);
  });
});

describe("buildSpecWriterSystemPrompt", () => {
  const prompt = buildSpecWriterSystemPrompt();
  it("includes the role name and ID", () => {
    expect(prompt).toContain("Spec-Writer Specialist");
    expect(prompt).toContain("specialist_spec-writer");
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

describe("buildSpecWriterTaskPrompt", () => {
  const task = createTaskPacket({
    objective: "Test objective",
    allowedReadSet: ["file.ts"],
    allowedWriteSet: [],
    acceptanceCriteria: ["Criteria"],
    targetAgent: "specialist_spec-writer",
    sourceAgent: "orchestrator",
  });
  it("includes task fields", () => {
    const prompt = buildSpecWriterTaskPrompt(task);
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
      targetAgent: "specialist_spec-writer",
      sourceAgent: "orchestrator",
    });
    expect(buildSpecWriterTaskPrompt(taskWithCtx)).toContain("Additional context");
  });
});
