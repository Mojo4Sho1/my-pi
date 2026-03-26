import { describe, it, expect } from "vitest";
import { buildBuilderSystemPrompt, buildBuilderTaskPrompt, BUILDER_PROMPT_CONFIG } from "../extensions/specialists/builder/prompt.js";
import { createTaskPacket } from "../extensions/shared/packets.js";
import type { TaskPacket } from "../extensions/shared/types.js";

// --- Builder Prompt Config Tests ---

describe("BUILDER_PROMPT_CONFIG", () => {
  it("has the correct specialist ID", () => {
    expect(BUILDER_PROMPT_CONFIG.id).toBe("specialist_builder");
  });

  it("has the correct role name", () => {
    expect(BUILDER_PROMPT_CONFIG.roleName).toBe("Builder Specialist");
  });

  it("includes working style directives", () => {
    expect(BUILDER_PROMPT_CONFIG.workingStyle.reasoning).toContain("minimal concrete edits");
    expect(BUILDER_PROMPT_CONFIG.workingStyle.risk).toContain("Conservative with boundary crossings");
    expect(BUILDER_PROMPT_CONFIG.workingStyle.defaultBias).toContain("small, composable implementations");
  });
});

describe("buildBuilderSystemPrompt", () => {
  const prompt = buildBuilderSystemPrompt();

  it("includes the builder role", () => {
    expect(prompt).toContain("Builder Specialist");
    expect(prompt).toContain("specialist_builder");
  });

  it("includes working style directives", () => {
    expect(prompt).toContain("Translate packet objective into minimal concrete edits");
    expect(prompt).toContain("Conservative with boundary crossings");
    expect(prompt).toContain("small, composable implementations");
  });

  it("includes scope constraints", () => {
    expect(prompt).toContain("ONLY modify files listed in the allowed write set");
    expect(prompt).toContain("Do NOT perform broad cleanup");
    expect(prompt).toContain("Do NOT silently expand scope");
  });

  it("includes anti-patterns", () => {
    expect(prompt).toContain("claim validation beyond what was actually run");
    expect(prompt).toContain("embed orchestration decisions");
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

describe("buildBuilderTaskPrompt", () => {
  const baseTask: TaskPacket = createTaskPacket({
    objective: "Add error handling to auth module",
    allowedReadSet: ["src/auth/index.ts", "src/auth/types.ts"],
    allowedWriteSet: ["src/auth/index.ts"],
    acceptanceCriteria: ["Handles network errors", "Returns typed errors"],
    targetAgent: "specialist_builder",
    sourceAgent: "orchestrator",
  });

  it("includes all task packet fields", () => {
    const prompt = buildBuilderTaskPrompt(baseTask);
    expect(prompt).toContain(baseTask.id);
    expect(prompt).toContain("Add error handling to auth module");
    expect(prompt).toContain("src/auth/index.ts");
    expect(prompt).toContain("src/auth/types.ts");
    expect(prompt).toContain("Handles network errors");
    expect(prompt).toContain("Returns typed errors");
  });

  it("includes read and write sets", () => {
    const prompt = buildBuilderTaskPrompt(baseTask);
    expect(prompt).toContain("Allowed read set: src/auth/index.ts, src/auth/types.ts");
    expect(prompt).toContain("Allowed write set: src/auth/index.ts");
  });

  it("omits context when not provided", () => {
    const prompt = buildBuilderTaskPrompt(baseTask);
    expect(prompt).not.toContain("Additional context");
  });

  it("includes context when provided", () => {
    const taskWithContext = createTaskPacket({
      objective: "Fix bug",
      allowedReadSet: ["src/app.ts"],
      allowedWriteSet: ["src/app.ts"],
      acceptanceCriteria: ["Bug is fixed"],
      context: { priority: "high", ticket: "BUG-123" },
      targetAgent: "specialist_builder",
      sourceAgent: "orchestrator",
    });
    const prompt = buildBuilderTaskPrompt(taskWithContext);
    expect(prompt).toContain("Additional context");
    expect(prompt).toContain("BUG-123");
  });

  it("includes execution instruction", () => {
    const prompt = buildBuilderTaskPrompt(baseTask);
    expect(prompt).toContain("Execute this task within the stated scope");
  });
});
