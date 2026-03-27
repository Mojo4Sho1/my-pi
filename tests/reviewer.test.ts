import { describe, it, expect } from "vitest";
import { buildReviewerSystemPrompt, buildReviewerTaskPrompt, REVIEWER_PROMPT_CONFIG } from "../extensions/specialists/reviewer/prompt.js";
import { createTaskPacket } from "../extensions/shared/packets.js";
import type { TaskPacket } from "../extensions/shared/types.js";

// --- Reviewer Prompt Config Tests ---

describe("REVIEWER_PROMPT_CONFIG", () => {
  it("has the correct specialist ID", () => {
    expect(REVIEWER_PROMPT_CONFIG.id).toBe("specialist_reviewer");
  });

  it("has the correct role name", () => {
    expect(REVIEWER_PROMPT_CONFIG.roleName).toBe("Reviewer Specialist");
  });

  it("includes working style directives", () => {
    expect(REVIEWER_PROMPT_CONFIG.workingStyle.reasoning).toContain("Evaluate artifacts against explicit criteria");
    expect(REVIEWER_PROMPT_CONFIG.workingStyle.risk).toContain("High caution around false positives");
    expect(REVIEWER_PROMPT_CONFIG.workingStyle.defaultBias).toContain("bounded, actionable feedback");
  });
});

describe("buildReviewerSystemPrompt", () => {
  const prompt = buildReviewerSystemPrompt();

  it("includes the reviewer role", () => {
    expect(prompt).toContain("Reviewer Specialist");
    expect(prompt).toContain("specialist_reviewer");
  });

  it("includes working style directives", () => {
    expect(prompt).toContain("Evaluate artifacts against explicit criteria");
    expect(prompt).toContain("High caution around false positives");
    expect(prompt).toContain("bounded, actionable feedback");
  });

  it("includes scope constraints", () => {
    expect(prompt).toContain("ONLY review artifacts");
    expect(prompt).toContain("do NOT rewrite them");
    expect(prompt).toContain("Do NOT make policy decisions");
  });

  it("includes anti-patterns", () => {
    expect(prompt).toContain("rewrite artifacts instead of reviewing them");
    expect(prompt).toContain("flag subjective preferences as hard failures");
  });

  it("includes required JSON output format", () => {
    expect(prompt).toContain("```json");
    expect(prompt).toContain('"status"');
    expect(prompt).toContain('"summary"');
    expect(prompt).toContain('"findings"');
    expect(prompt).toContain('"approved"');
    expect(prompt).toContain('"blockers"');
    expect(prompt).toContain('"modifiedFiles"');
    expect(prompt).toContain('"escalation"');
  });
});

describe("buildReviewerTaskPrompt", () => {
  const baseTask: TaskPacket = createTaskPacket({
    objective: "Review the auth module implementation for constraint alignment",
    allowedReadSet: ["src/auth/index.ts", "src/auth/types.ts"],
    allowedWriteSet: [],
    acceptanceCriteria: ["All constraints verified", "Findings prioritized by severity"],
    targetAgent: "specialist_reviewer",
    sourceAgent: "orchestrator",
  });

  it("includes all task packet fields", () => {
    const prompt = buildReviewerTaskPrompt(baseTask);
    expect(prompt).toContain(baseTask.id);
    expect(prompt).toContain("Review the auth module implementation");
    expect(prompt).toContain("src/auth/index.ts");
    expect(prompt).toContain("All constraints verified");
    expect(prompt).toContain("Findings prioritized by severity");
  });

  it("includes read set", () => {
    const prompt = buildReviewerTaskPrompt(baseTask);
    expect(prompt).toContain("Allowed read set: src/auth/index.ts, src/auth/types.ts");
  });

  it("omits context when not provided", () => {
    const prompt = buildReviewerTaskPrompt(baseTask);
    expect(prompt).not.toContain("Additional context");
  });

  it("includes context when provided", () => {
    const taskWithContext = createTaskPacket({
      objective: "Review API changes",
      allowedReadSet: ["src/api/routes.ts"],
      allowedWriteSet: [],
      acceptanceCriteria: ["No breaking changes"],
      context: { prNumber: 42, baseCommit: "abc123" },
      targetAgent: "specialist_reviewer",
      sourceAgent: "orchestrator",
    });
    const prompt = buildReviewerTaskPrompt(taskWithContext);
    expect(prompt).toContain("Additional context");
    expect(prompt).toContain("abc123");
  });

  it("includes execution instruction", () => {
    const prompt = buildReviewerTaskPrompt(baseTask);
    expect(prompt).toContain("Execute this task within the stated scope");
  });
});
