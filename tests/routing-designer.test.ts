import { describe, it, expect } from "vitest";
import { buildRoutingDesignerSystemPrompt, buildRoutingDesignerTaskPrompt, ROUTING_DESIGNER_PROMPT_CONFIG } from "../extensions/specialists/routing-designer/prompt.js";
import { createTaskPacket } from "../extensions/shared/packets.js";

describe("ROUTING_DESIGNER_PROMPT_CONFIG", () => {
  it("has the correct specialist ID", () => {
    expect(ROUTING_DESIGNER_PROMPT_CONFIG.id).toBe("specialist_routing-designer");
  });
  it("has the correct role name", () => {
    expect(ROUTING_DESIGNER_PROMPT_CONFIG.roleName).toBe("Routing-Designer Specialist");
  });
  it("includes all working style fields", () => {
    expect(ROUTING_DESIGNER_PROMPT_CONFIG.workingStyle.reasoning).toBeTruthy();
    expect(ROUTING_DESIGNER_PROMPT_CONFIG.workingStyle.communication).toBeTruthy();
    expect(ROUTING_DESIGNER_PROMPT_CONFIG.workingStyle.risk).toBeTruthy();
    expect(ROUTING_DESIGNER_PROMPT_CONFIG.workingStyle.defaultBias).toBeTruthy();
  });
  it("has constraints", () => {
    expect(ROUTING_DESIGNER_PROMPT_CONFIG.constraints.length).toBeGreaterThan(0);
  });
  it("has anti-patterns", () => {
    expect(ROUTING_DESIGNER_PROMPT_CONFIG.antiPatterns.length).toBeGreaterThan(0);
  });
  it("has output contract", () => {
    expect(ROUTING_DESIGNER_PROMPT_CONFIG.outputContract).toBeDefined();
    expect(ROUTING_DESIGNER_PROMPT_CONFIG.outputContract!.fields.length).toBeGreaterThan(0);
  });
});

describe("buildRoutingDesignerSystemPrompt", () => {
  const prompt = buildRoutingDesignerSystemPrompt();
  it("includes the role name and ID", () => {
    expect(prompt).toContain("Routing-Designer Specialist");
    expect(prompt).toContain("specialist_routing-designer");
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

describe("buildRoutingDesignerTaskPrompt", () => {
  const task = createTaskPacket({
    objective: "Test objective",
    allowedReadSet: ["file.ts"],
    allowedWriteSet: [],
    acceptanceCriteria: ["Criteria"],
    targetAgent: "specialist_routing-designer",
    sourceAgent: "orchestrator",
  });
  it("includes task fields", () => {
    const prompt = buildRoutingDesignerTaskPrompt(task);
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
      targetAgent: "specialist_routing-designer",
      sourceAgent: "orchestrator",
    });
    expect(buildRoutingDesignerTaskPrompt(taskWithCtx)).toContain("Additional context");
  });
});
