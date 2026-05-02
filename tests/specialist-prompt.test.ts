import { describe, it, expect } from "vitest";
import { buildSpecialistSystemPrompt, buildSpecialistTaskPrompt, type SpecialistPromptConfig } from "../extensions/shared/specialist-prompt.js";
import { createTaskPacket } from "../extensions/shared/packets.js";
import type { TaskPacket } from "../extensions/shared/types.js";

const TEST_CONFIG: SpecialistPromptConfig = {
  id: "specialist_test",
  canonicalName: "test",
  currentRuntimeId: "test",
  taxonomy: {
    baseClass: "Builder",
    variant: null,
    artifactResponsibility: ["test fixture output"],
  },
  aliases: [],
  migrationStatus: "active",
  roleName: "Test Specialist",
  roleDescription: "Execute test tasks within explicit scope.",
  workingStyle: {
    reasoning: "Analyze requirements carefully before acting.",
    communication: "Report findings with clear evidence.",
    risk: "Conservative under uncertainty; escalate when blocked.",
    defaultBias: "Prefer minimal changes that satisfy criteria.",
  },
  constraints: [
    "Only modify files in the allowed write set.",
    "Do not expand scope beyond the objective.",
  ],
  antiPatterns: [
    "claim results without evidence",
    "make architectural decisions",
  ],
};

describe("buildSpecialistSystemPrompt", () => {
  const prompt = buildSpecialistSystemPrompt(TEST_CONFIG);

  it("includes the specialist role name and ID", () => {
    expect(prompt).toContain("Test Specialist");
    expect(prompt).toContain("specialist_test");
  });

  it("includes the role description", () => {
    expect(prompt).toContain("Execute test tasks within explicit scope.");
  });

  it("includes working style directives", () => {
    expect(prompt).toContain("Analyze requirements carefully before acting.");
    expect(prompt).toContain("Report findings with clear evidence.");
    expect(prompt).toContain("Conservative under uncertainty");
    expect(prompt).toContain("Prefer minimal changes");
  });

  it("includes constraints", () => {
    expect(prompt).toContain("Only modify files in the allowed write set.");
    expect(prompt).toContain("Do not expand scope beyond the objective.");
  });

  it("includes anti-patterns with 'Do NOT' prefix", () => {
    expect(prompt).toContain("Do NOT claim results without evidence");
    expect(prompt).toContain("Do NOT make architectural decisions");
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

describe("buildSpecialistTaskPrompt", () => {
  const baseTask: TaskPacket = createTaskPacket({
    objective: "Add error handling to auth module",
    allowedReadSet: ["src/auth/index.ts", "src/auth/types.ts"],
    allowedWriteSet: ["src/auth/index.ts"],
    acceptanceCriteria: ["Handles network errors", "Returns typed errors"],
    targetAgent: "specialist_test",
    sourceAgent: "orchestrator",
  });

  it("includes all task packet fields", () => {
    const prompt = buildSpecialistTaskPrompt(baseTask);
    expect(prompt).toContain(baseTask.id);
    expect(prompt).toContain("Add error handling to auth module");
    expect(prompt).toContain("src/auth/index.ts");
    expect(prompt).toContain("src/auth/types.ts");
    expect(prompt).toContain("Handles network errors");
    expect(prompt).toContain("Returns typed errors");
  });

  it("includes read and write sets", () => {
    const prompt = buildSpecialistTaskPrompt(baseTask);
    expect(prompt).toContain("Allowed read set: src/auth/index.ts, src/auth/types.ts");
    expect(prompt).toContain("Allowed write set: src/auth/index.ts");
  });

  it("omits context when not provided", () => {
    const prompt = buildSpecialistTaskPrompt(baseTask);
    expect(prompt).not.toContain("Additional context");
  });

  it("includes context when provided", () => {
    const taskWithContext = createTaskPacket({
      objective: "Fix bug",
      allowedReadSet: ["src/app.ts"],
      allowedWriteSet: ["src/app.ts"],
      acceptanceCriteria: ["Bug is fixed"],
      context: { priority: "high", ticket: "BUG-123" },
      targetAgent: "specialist_test",
      sourceAgent: "orchestrator",
    });
    const prompt = buildSpecialistTaskPrompt(taskWithContext);
    expect(prompt).toContain("Additional context");
    expect(prompt).toContain("BUG-123");
  });

  it("includes execution instruction", () => {
    const prompt = buildSpecialistTaskPrompt(baseTask);
    expect(prompt).toContain("Execute this task within the stated scope");
  });
});
