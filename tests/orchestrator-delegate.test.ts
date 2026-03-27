import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTaskPacket } from "../extensions/shared/packets.js";
import type { TaskPacket } from "../extensions/shared/types.js";
import type { SpecialistPromptConfig } from "../extensions/shared/specialist-prompt.js";

describe("delegateToSpecialist", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  const TEST_PROMPT_CONFIG: SpecialistPromptConfig = {
    id: "specialist_builder",
    roleName: "Builder Specialist",
    roleDescription: "Execute bounded implementation tasks.",
    workingStyle: {
      reasoning: "Translate objective into edits.",
      communication: "Summarize results.",
      risk: "Conservative.",
      defaultBias: "Minimal changes.",
    },
    constraints: ["Only modify allowed files."],
    antiPatterns: ["expand scope"],
  };

  function makeTaskPacket(overrides?: Partial<Parameters<typeof createTaskPacket>[0]>): TaskPacket {
    return createTaskPacket({
      objective: "Implement the feature",
      allowedReadSet: ["src/index.ts"],
      allowedWriteSet: ["src/index.ts"],
      acceptanceCriteria: ["Feature works"],
      targetAgent: "specialist_builder",
      sourceAgent: "orchestrator",
      ...overrides,
    });
  }

  it("returns a successful result packet on good specialist output", async () => {
    const successOutput = '```json\n{"status":"success","summary":"Done","deliverables":["feature"],"modifiedFiles":["src/index.ts"]}\n```';

    vi.doMock("../extensions/shared/subprocess.js", () => ({
      spawnSpecialistAgent: vi.fn().mockResolvedValue({
        exitCode: 0,
        finalText: successOutput,
        stderr: "",
      }),
    }));

    const { delegateToSpecialist } = await import("../extensions/orchestrator/delegate.js");

    const result = await delegateToSpecialist({
      promptConfig: TEST_PROMPT_CONFIG,
      taskPacket: makeTaskPacket(),
    });

    expect(result.success).toBe(true);
    expect(result.resultPacket.status).toBe("success");
    expect(result.resultPacket.summary).toBe("Done");
    expect(result.resultPacket.sourceAgent).toBe("specialist_builder");
  });

  it("returns failure when subprocess throws", async () => {
    vi.doMock("../extensions/shared/subprocess.js", () => ({
      spawnSpecialistAgent: vi.fn().mockRejectedValue(new Error("spawn failed")),
    }));

    const { delegateToSpecialist } = await import("../extensions/orchestrator/delegate.js");

    const result = await delegateToSpecialist({
      promptConfig: TEST_PROMPT_CONFIG,
      taskPacket: makeTaskPacket(),
    });

    expect(result.success).toBe(false);
    expect(result.resultPacket.status).toBe("failure");
    expect(result.resultPacket.summary).toContain("failed to start");
    expect(result.resultPacket.summary).toContain("spawn failed");
  });

  it("returns failure when process exits with non-zero and no output", async () => {
    vi.doMock("../extensions/shared/subprocess.js", () => ({
      spawnSpecialistAgent: vi.fn().mockResolvedValue({
        exitCode: 1,
        finalText: "",
        stderr: "out of memory",
      }),
    }));

    const { delegateToSpecialist } = await import("../extensions/orchestrator/delegate.js");

    const result = await delegateToSpecialist({
      promptConfig: TEST_PROMPT_CONFIG,
      taskPacket: makeTaskPacket(),
    });

    expect(result.success).toBe(false);
    expect(result.resultPacket.status).toBe("failure");
    expect(result.resultPacket.summary).toContain("exited with code 1");
    expect(result.resultPacket.summary).toContain("out of memory");
  });

  it("returns partial when output has no structured JSON", async () => {
    vi.doMock("../extensions/shared/subprocess.js", () => ({
      spawnSpecialistAgent: vi.fn().mockResolvedValue({
        exitCode: 0,
        finalText: "I did some work but forgot the JSON block",
        stderr: "",
      }),
    }));

    const { delegateToSpecialist } = await import("../extensions/orchestrator/delegate.js");

    const result = await delegateToSpecialist({
      promptConfig: TEST_PROMPT_CONFIG,
      taskPacket: makeTaskPacket(),
    });

    expect(result.success).toBe(false);
    expect(result.resultPacket.status).toBe("partial");
  });

  it("passes abort signal through to subprocess", async () => {
    const mockSpawn = vi.fn().mockResolvedValue({
      exitCode: 0,
      finalText: '```json\n{"status":"success","summary":"Done","deliverables":[],"modifiedFiles":[]}\n```',
      stderr: "",
    });

    vi.doMock("../extensions/shared/subprocess.js", () => ({
      spawnSpecialistAgent: mockSpawn,
    }));

    const { delegateToSpecialist } = await import("../extensions/orchestrator/delegate.js");
    const controller = new AbortController();

    await delegateToSpecialist({
      promptConfig: TEST_PROMPT_CONFIG,
      taskPacket: makeTaskPacket(),
      signal: controller.signal,
    });

    expect(mockSpawn).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      controller.signal
    );
  });

  it("handles escalation status from specialist", async () => {
    const escalationOutput = '```json\n{"status":"escalation","summary":"Blocked","deliverables":[],"modifiedFiles":[],"escalation":{"reason":"scope exceeded","suggestedAction":"expand write set"}}\n```';

    vi.doMock("../extensions/shared/subprocess.js", () => ({
      spawnSpecialistAgent: vi.fn().mockResolvedValue({
        exitCode: 0,
        finalText: escalationOutput,
        stderr: "",
      }),
    }));

    const { delegateToSpecialist } = await import("../extensions/orchestrator/delegate.js");

    const result = await delegateToSpecialist({
      promptConfig: TEST_PROMPT_CONFIG,
      taskPacket: makeTaskPacket(),
    });

    expect(result.success).toBe(false);
    expect(result.resultPacket.status).toBe("escalation");
    expect(result.resultPacket.escalation?.reason).toBe("scope exceeded");
  });
});

describe("getPromptConfig", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("returns config for all four specialists", async () => {
    const { getPromptConfig } = await import("../extensions/orchestrator/delegate.js");

    expect(getPromptConfig("builder").id).toBe("specialist_builder");
    expect(getPromptConfig("planner").id).toBe("specialist_planner");
    expect(getPromptConfig("reviewer").id).toBe("specialist_reviewer");
    expect(getPromptConfig("tester").id).toBe("specialist_tester");
  });
});
