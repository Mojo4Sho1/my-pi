import { describe, it, expect } from "vitest";
import { buildCriticSystemPrompt, buildCriticTaskPrompt, CRITIC_PROMPT_CONFIG } from "../extensions/specialists/critic/prompt.js";
import { createTaskPacket } from "../extensions/shared/packets.js";

describe("CRITIC_PROMPT_CONFIG", () => {
  it("has the correct specialist ID", () => {
    expect(CRITIC_PROMPT_CONFIG.id).toBe("specialist_critic");
  });
  it("has the correct role name", () => {
    expect(CRITIC_PROMPT_CONFIG.roleName).toBe("Critic Specialist");
  });
  it("includes all working style fields", () => {
    expect(CRITIC_PROMPT_CONFIG.workingStyle.reasoning).toBeTruthy();
    expect(CRITIC_PROMPT_CONFIG.workingStyle.communication).toBeTruthy();
    expect(CRITIC_PROMPT_CONFIG.workingStyle.risk).toBeTruthy();
    expect(CRITIC_PROMPT_CONFIG.workingStyle.defaultBias).toBeTruthy();
  });
  it("has constraints", () => {
    expect(CRITIC_PROMPT_CONFIG.constraints.length).toBeGreaterThan(0);
  });
  it("has anti-patterns", () => {
    expect(CRITIC_PROMPT_CONFIG.antiPatterns.length).toBeGreaterThan(0);
  });
  it("has output contract", () => {
    expect(CRITIC_PROMPT_CONFIG.outputContract).toBeDefined();
    expect(CRITIC_PROMPT_CONFIG.outputContract!.fields.length).toBeGreaterThan(0);
  });
});

describe("buildCriticSystemPrompt", () => {
  const prompt = buildCriticSystemPrompt();
  it("includes the role name and ID", () => {
    expect(prompt).toContain("Critic Specialist");
    expect(prompt).toContain("specialist_critic");
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
  it("includes JSON output format with classifiedAs", () => {
    expect(prompt).toContain("```json");
    expect(prompt).toContain('"status"');
    expect(prompt).toContain('"classifiedAs"');
  });
});

describe("buildCriticTaskPrompt", () => {
  const task = createTaskPacket({
    objective: "Test objective",
    allowedReadSet: ["file.ts"],
    allowedWriteSet: [],
    acceptanceCriteria: ["Criteria"],
    targetAgent: "specialist_critic",
    sourceAgent: "orchestrator",
  });
  it("includes task fields", () => {
    const prompt = buildCriticTaskPrompt(task);
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
      targetAgent: "specialist_critic",
      sourceAgent: "orchestrator",
    });
    expect(buildCriticTaskPrompt(taskWithCtx)).toContain("Additional context");
  });
});
