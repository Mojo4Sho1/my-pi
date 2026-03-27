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
    expect(TESTER_PROMPT_CONFIG.workingStyle.reasoning).toContain("smallest validation set");
    expect(TESTER_PROMPT_CONFIG.workingStyle.risk).toContain("Conservative about unverified behavior");
    expect(TESTER_PROMPT_CONFIG.workingStyle.defaultBias).toContain("focused checks with high signal-to-noise");
  });
});

describe("buildTesterSystemPrompt", () => {
  const prompt = buildTesterSystemPrompt();

  it("includes the tester role", () => {
    expect(prompt).toContain("Tester Specialist");
    expect(prompt).toContain("specialist_tester");
  });

  it("includes working style directives", () => {
    expect(prompt).toContain("smallest validation set that can prove or disprove");
    expect(prompt).toContain("Conservative about unverified behavior");
    expect(prompt).toContain("focused checks with high signal-to-noise");
  });

  it("includes scope constraints", () => {
    expect(prompt).toContain("ONLY validate");
    expect(prompt).toContain("do NOT implement changes or redesign");
    expect(prompt).toContain("report exact checks performed");
  });

  it("includes anti-patterns", () => {
    expect(prompt).toContain("run broad test suites without scoped justification");
    expect(prompt).toContain("report pass/fail without evidence");
  });

  it("includes required JSON output format", () => {
    expect(prompt).toContain("```json");
    expect(prompt).toContain('"status"');
    expect(prompt).toContain('"summary"');
    expect(prompt).toContain('"passed"');
    expect(prompt).toContain('"evidence"');
    expect(prompt).toContain('"failures"');
    expect(prompt).toContain('"modifiedFiles"');
    expect(prompt).toContain('"escalation"');
  });
});

describe("buildTesterTaskPrompt", () => {
  const baseTask: TaskPacket = createTaskPacket({
    objective: "Validate error handling in auth module",
    allowedReadSet: ["src/auth/index.ts", "tests/auth.test.ts"],
    allowedWriteSet: [],
    acceptanceCriteria: ["Network errors handled", "Typed errors returned"],
    targetAgent: "specialist_tester",
    sourceAgent: "orchestrator",
  });

  it("includes all task packet fields", () => {
    const prompt = buildTesterTaskPrompt(baseTask);
    expect(prompt).toContain(baseTask.id);
    expect(prompt).toContain("Validate error handling in auth module");
    expect(prompt).toContain("src/auth/index.ts");
    expect(prompt).toContain("Network errors handled");
    expect(prompt).toContain("Typed errors returned");
  });

  it("includes read set", () => {
    const prompt = buildTesterTaskPrompt(baseTask);
    expect(prompt).toContain("Allowed read set: src/auth/index.ts, tests/auth.test.ts");
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
