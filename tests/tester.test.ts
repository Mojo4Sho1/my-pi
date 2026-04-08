import { describe, it, expect } from "vitest";
import { buildTesterSystemPrompt, buildTesterTaskPrompt, TESTER_PROMPT_CONFIG } from "../extensions/specialists/tester/prompt.js";
import { createTaskPacket } from "../extensions/shared/packets.js";
import type { TaskPacket } from "../extensions/shared/types.js";

// --- Tester Prompt Config Tests ---

describe("TESTER_PROMPT_CONFIG", () => {
  it("has the correct specialist ID", () => {
    expect(TESTER_PROMPT_CONFIG.id).toBe("specialist_tester");
  });

  it("has the correct role name", () => {
    expect(TESTER_PROMPT_CONFIG.roleName).toBe("Tester Specialist");
  });

  it("includes working style directives", () => {
    expect(TESTER_PROMPT_CONFIG.workingStyle.reasoning).toContain("smallest authored test set");
    expect(TESTER_PROMPT_CONFIG.workingStyle.risk).toContain("Conservative about untested behavior");
    expect(TESTER_PROMPT_CONFIG.workingStyle.defaultBias).toContain("focused, high-signal tests");
  });
});

describe("buildTesterSystemPrompt", () => {
  const prompt = buildTesterSystemPrompt();

  it("includes the tester role", () => {
    expect(prompt).toContain("Tester Specialist");
    expect(prompt).toContain("specialist_tester");
  });

  it("includes working style directives", () => {
    expect(prompt).toContain("smallest authored test set that proves the required behavior");
    expect(prompt).toContain("Conservative about untested behavior");
    expect(prompt).toContain("focused, high-signal tests");
  });

  it("includes scope constraints", () => {
    expect(prompt).toContain("ONLY author tests and execution expectations");
    expect(prompt).toContain("do NOT implement product code or redesign");
    expect(prompt).toContain("execution commands and expected pass conditions");
  });

  it("includes anti-patterns", () => {
    expect(prompt).toContain("generic test runner instead of a test author");
    expect(prompt).toContain("omit execution commands or expected pass conditions");
  });

  it("includes required JSON output format", () => {
    expect(prompt).toContain("```json");
    expect(prompt).toContain('"status"');
    expect(prompt).toContain('"summary"');
    expect(prompt).toContain('"testStrategy"');
    expect(prompt).toContain('"testCasesAuthored"');
    expect(prompt).toContain('"executionCommands"');
    expect(prompt).toContain('"expectedPassConditions"');
    expect(prompt).toContain('"coverageNotes"');
    expect(prompt).toContain('"modifiedFiles"');
    expect(prompt).toContain('"escalation"');
  });
});

describe("buildTesterTaskPrompt", () => {
  const baseTask: TaskPacket = createTaskPacket({
    objective: "Author tests for error handling in auth module",
    allowedReadSet: ["src/auth/index.ts", "tests/auth.test.ts"],
    allowedWriteSet: ["tests/auth.test.ts"],
    acceptanceCriteria: ["Network errors handled", "Typed errors returned", "Execution commands are explicit"],
    targetAgent: "specialist_tester",
    sourceAgent: "orchestrator",
  });

  it("includes all task packet fields", () => {
    const prompt = buildTesterTaskPrompt(baseTask);
    expect(prompt).toContain(baseTask.id);
    expect(prompt).toContain("Author tests for error handling in auth module");
    expect(prompt).toContain("src/auth/index.ts");
    expect(prompt).toContain("Network errors handled");
    expect(prompt).toContain("Typed errors returned");
  });

  it("includes read and write sets", () => {
    const prompt = buildTesterTaskPrompt(baseTask);
    expect(prompt).toContain("Allowed read set: src/auth/index.ts, tests/auth.test.ts");
    expect(prompt).toContain("Allowed write set: tests/auth.test.ts");
  });

  it("omits context when not provided", () => {
    const prompt = buildTesterTaskPrompt(baseTask);
    expect(prompt).not.toContain("Additional context");
  });

  it("includes context when provided", () => {
    const taskWithContext = createTaskPacket({
      objective: "Validate deploy script",
      allowedReadSet: ["scripts/deploy.sh"],
      allowedWriteSet: [],
      acceptanceCriteria: ["Script exits 0 on success"],
      context: { environment: "staging", dryRun: true },
      targetAgent: "specialist_tester",
      sourceAgent: "orchestrator",
    });
    const prompt = buildTesterTaskPrompt(taskWithContext);
    expect(prompt).toContain("Additional context");
    expect(prompt).toContain("staging");
  });

  it("includes execution instruction", () => {
    const prompt = buildTesterTaskPrompt(baseTask);
    expect(prompt).toContain("Execute this task within the stated scope");
  });
});
