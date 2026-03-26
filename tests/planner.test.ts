import { describe, it, expect } from "vitest";
import { buildPlannerSystemPrompt, buildPlannerTaskPrompt, PLANNER_PROMPT_CONFIG } from "../extensions/specialists/planner/prompt.js";
import { createTaskPacket } from "../extensions/shared/packets.js";
import type { TaskPacket } from "../extensions/shared/types.js";

// --- Planner Prompt Config Tests ---

describe("PLANNER_PROMPT_CONFIG", () => {
  it("has the correct specialist ID", () => {
    expect(PLANNER_PROMPT_CONFIG.id).toBe("specialist_planner");
  });

  it("has the correct role name", () => {
    expect(PLANNER_PROMPT_CONFIG.roleName).toBe("Planner Specialist");
  });

  it("includes working style directives", () => {
    expect(PLANNER_PROMPT_CONFIG.workingStyle.reasoning).toContain("execution-ready plan");
    expect(PLANNER_PROMPT_CONFIG.workingStyle.risk).toContain("Conservative under ambiguity");
    expect(PLANNER_PROMPT_CONFIG.workingStyle.defaultBias).toContain("smallest-sufficient decomposition");
  });
});

describe("buildPlannerSystemPrompt", () => {
  const prompt = buildPlannerSystemPrompt();

  it("includes the planner role", () => {
    expect(prompt).toContain("Planner Specialist");
    expect(prompt).toContain("specialist_planner");
  });

  it("includes working style directives", () => {
    expect(prompt).toContain("execution-ready plan from explicit constraints");
    expect(prompt).toContain("Conservative under ambiguity");
    expect(prompt).toContain("smallest-sufficient decomposition");
  });

  it("includes scope constraints", () => {
    expect(prompt).toContain("ONLY produce plans");
    expect(prompt).toContain("do NOT implement code changes");
    expect(prompt).toContain("Do NOT introduce architecture changes");
  });

  it("includes anti-patterns", () => {
    expect(prompt).toContain("turn planning output into implementation work");
    expect(prompt).toContain("hide unresolved assumptions");
  });

  it("includes required JSON output format", () => {
    expect(prompt).toContain("```json");
    expect(prompt).toContain('"status"');
    expect(prompt).toContain('"summary"');
    expect(prompt).toContain('"deliverables"');
    expect(prompt).toContain('"modifiedFiles"');
    expect(prompt).toContain('"escalation"');
  });
});

describe("buildPlannerTaskPrompt", () => {
  const baseTask: TaskPacket = createTaskPacket({
    objective: "Decompose auth module refactoring into implementation steps",
    allowedReadSet: ["src/auth/index.ts", "src/auth/types.ts"],
    allowedWriteSet: [],
    acceptanceCriteria: ["Plan covers all auth endpoints", "Dependencies identified"],
    targetAgent: "specialist_planner",
    sourceAgent: "orchestrator",
  });

  it("includes all task packet fields", () => {
    const prompt = buildPlannerTaskPrompt(baseTask);
    expect(prompt).toContain(baseTask.id);
    expect(prompt).toContain("Decompose auth module refactoring");
    expect(prompt).toContain("src/auth/index.ts");
    expect(prompt).toContain("Plan covers all auth endpoints");
    expect(prompt).toContain("Dependencies identified");
  });

  it("includes read set", () => {
    const prompt = buildPlannerTaskPrompt(baseTask);
    expect(prompt).toContain("Allowed read set: src/auth/index.ts, src/auth/types.ts");
  });

  it("omits context when not provided", () => {
    const prompt = buildPlannerTaskPrompt(baseTask);
    expect(prompt).not.toContain("Additional context");
  });

  it("includes context when provided", () => {
    const taskWithContext = createTaskPacket({
      objective: "Plan migration strategy",
      allowedReadSet: ["src/db/schema.ts"],
      allowedWriteSet: [],
      acceptanceCriteria: ["Migration steps defined"],
      context: { deadline: "Q2", complexity: "medium" },
      targetAgent: "specialist_planner",
      sourceAgent: "orchestrator",
    });
    const prompt = buildPlannerTaskPrompt(taskWithContext);
    expect(prompt).toContain("Additional context");
    expect(prompt).toContain("Q2");
  });

  it("includes execution instruction", () => {
    const prompt = buildPlannerTaskPrompt(baseTask);
    expect(prompt).toContain("Execute this task within the stated scope");
  });
});
