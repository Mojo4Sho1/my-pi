import { describe, it, expect } from "vitest";
import { buildBoundaryAuditorSystemPrompt, buildBoundaryAuditorTaskPrompt, BOUNDARY_AUDITOR_PROMPT_CONFIG } from "../extensions/specialists/boundary-auditor/prompt.js";
import { createTaskPacket } from "../extensions/shared/packets.js";

describe("BOUNDARY_AUDITOR_PROMPT_CONFIG", () => {
  it("has the correct specialist ID", () => {
    expect(BOUNDARY_AUDITOR_PROMPT_CONFIG.id).toBe("specialist_boundary-auditor");
  });
  it("has the correct role name", () => {
    expect(BOUNDARY_AUDITOR_PROMPT_CONFIG.roleName).toBe("Boundary-Auditor Specialist");
  });
  it("includes all working style fields", () => {
    expect(BOUNDARY_AUDITOR_PROMPT_CONFIG.workingStyle.reasoning).toBeTruthy();
    expect(BOUNDARY_AUDITOR_PROMPT_CONFIG.workingStyle.communication).toBeTruthy();
    expect(BOUNDARY_AUDITOR_PROMPT_CONFIG.workingStyle.risk).toBeTruthy();
    expect(BOUNDARY_AUDITOR_PROMPT_CONFIG.workingStyle.defaultBias).toBeTruthy();
  });
  it("has constraints", () => {
    expect(BOUNDARY_AUDITOR_PROMPT_CONFIG.constraints.length).toBeGreaterThan(0);
  });
  it("has anti-patterns", () => {
    expect(BOUNDARY_AUDITOR_PROMPT_CONFIG.antiPatterns.length).toBeGreaterThan(0);
  });
  it("has output contract", () => {
    expect(BOUNDARY_AUDITOR_PROMPT_CONFIG.outputContract).toBeDefined();
    expect(BOUNDARY_AUDITOR_PROMPT_CONFIG.outputContract!.fields.length).toBeGreaterThan(0);
  });
});

describe("buildBoundaryAuditorSystemPrompt", () => {
  const prompt = buildBoundaryAuditorSystemPrompt();
  it("includes the role name and ID", () => {
    expect(prompt).toContain("Boundary-Auditor Specialist");
    expect(prompt).toContain("specialist_boundary-auditor");
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

describe("buildBoundaryAuditorTaskPrompt", () => {
  const task = createTaskPacket({
    objective: "Test objective",
    allowedReadSet: ["file.ts"],
    allowedWriteSet: [],
    acceptanceCriteria: ["Criteria"],
    targetAgent: "specialist_boundary-auditor",
    sourceAgent: "orchestrator",
  });
  it("includes task fields", () => {
    const prompt = buildBoundaryAuditorTaskPrompt(task);
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
      targetAgent: "specialist_boundary-auditor",
      sourceAgent: "orchestrator",
    });
    expect(buildBoundaryAuditorTaskPrompt(taskWithCtx)).toContain("Additional context");
  });
});
