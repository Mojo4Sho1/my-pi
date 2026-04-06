import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTaskPacket } from "../extensions/shared/packets.js";
import type { TaskPacket } from "../extensions/shared/types.js";
import type { SpecialistPromptConfig } from "../extensions/shared/specialist-prompt.js";
import { createHookRegistry } from "../extensions/shared/hooks.js";

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
        tokenUsage: {
          inputTokens: 150,
          outputTokens: 50,
          totalTokens: 200,
        },
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
    expect(result.tokenUsage).toEqual({
      inputTokens: 150,
      outputTokens: 50,
      totalTokens: 200,
    });
    expect(result.policyEnvelope).toBeDefined();
    expect(result.policyEnvelope?.allowedWritePaths).toEqual(["src/index.ts"]);
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
      controller.signal,
      undefined,
      undefined
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

  it("allows policy hooks to deny delegation before spawn", async () => {
    const mockSpawn = vi.fn();

    vi.doMock("../extensions/shared/subprocess.js", () => ({
      spawnSpecialistAgent: mockSpawn,
    }));

    const { delegateToSpecialist } = await import("../extensions/orchestrator/delegate.js");
    const hookRegistry = createHookRegistry();
    hookRegistry.registerPolicy("beforeDelegation", () => ({
      allowed: false,
      reason: "sandbox blocked",
    }));

    const result = await delegateToSpecialist({
      promptConfig: TEST_PROMPT_CONFIG,
      taskPacket: makeTaskPacket(),
      hookRegistry,
    });

    expect(result.success).toBe(false);
    expect(result.resultPacket.summary).toContain("Delegation denied by policy");
    expect(mockSpawn).not.toHaveBeenCalled();
  });

  it("blocks sandbox violations before spawn and emits policy artifacts", async () => {
    const mockSpawn = vi.fn();

    vi.doMock("../extensions/shared/subprocess.js", () => ({
      spawnSpecialistAgent: mockSpawn,
    }));

    const { delegateToSpecialist } = await import("../extensions/orchestrator/delegate.js");
    const hookRegistry = createHookRegistry();
    const violations: any[] = [];
    const artifacts: any[] = [];

    hookRegistry.registerObserver("onPolicyViolation", (event) => {
      violations.push(event.payload);
    });
    hookRegistry.registerObserver("onArtifactWritten", (event) => {
      artifacts.push(event.payload);
    });

    const result = await delegateToSpecialist({
      promptConfig: {
        ...TEST_PROMPT_CONFIG,
        id: "specialist_planner",
        roleName: "Planner Specialist",
      },
      taskPacket: makeTaskPacket({
        targetAgent: "specialist_planner",
        allowedWriteSet: ["src/index.ts"],
      }),
      hookRegistry,
    });

    expect(result.success).toBe(false);
    expect(result.resultPacket.summary).toContain("Delegation blocked by sandbox policy");
    expect(result.policyEnvelope?.allowedWritePaths).toEqual([]);
    expect(violations).toHaveLength(1);
    expect(violations[0].violationType).toBe("write_denied");
    expect(violations[0].targetPath).toBe("src/index.ts");
    expect(artifacts).toHaveLength(1);
    expect(artifacts[0].artifactType).toBe("spawn_record");
    expect(artifacts[0].artifact.outcome).toBe("blocked");
    expect(mockSpawn).not.toHaveBeenCalled();
  });

  it("emits delegation and subprocess observer events", async () => {
    vi.doMock("../extensions/shared/subprocess.js", () => ({
      spawnSpecialistAgent: vi.fn().mockResolvedValue({
        exitCode: 0,
        finalText: '```json\n{"status":"success","summary":"Done","deliverables":[],"modifiedFiles":[]}\n```',
        stderr: "",
        tokenUsage: {
          inputTokens: 90,
          outputTokens: 10,
          totalTokens: 100,
        },
      }),
    }));

    const { delegateToSpecialist } = await import("../extensions/orchestrator/delegate.js");
    const hookRegistry = createHookRegistry();
    const events: string[] = [];

    hookRegistry.registerObserver("beforeDelegation", () => {
      events.push("beforeDelegation");
    });
    hookRegistry.registerObserver("beforeSubprocessSpawn", () => {
      events.push("beforeSubprocessSpawn");
    });
    hookRegistry.registerObserver("afterSubprocessExit", () => {
      events.push("afterSubprocessExit");
    });
    hookRegistry.registerObserver("afterDelegation", (event) => {
      events.push("afterDelegation");
      expect(event.payload).toMatchObject({
        resultStatus: "success",
        tokenUsage: {
          inputTokens: 90,
          outputTokens: 10,
          totalTokens: 100,
        },
      });
    });

    const result = await delegateToSpecialist({
      promptConfig: TEST_PROMPT_CONFIG,
      taskPacket: makeTaskPacket(),
      hookRegistry,
    });

    expect(result.success).toBe(true);
    expect(events).toEqual([
      "beforeDelegation",
      "beforeSubprocessSpawn",
      "afterSubprocessExit",
      "afterDelegation",
    ]);
  });

  it("emits adequacy failure events when semantic checks fail", async () => {
    vi.doMock("../extensions/shared/subprocess.js", () => ({
      spawnSpecialistAgent: vi.fn().mockResolvedValue({
        exitCode: 0,
        finalText: '```json\n{"status":"success","summary":"Too thin","deliverables":[],"modifiedFiles":[]}\n```',
        stderr: "",
      }),
    }));

    const { delegateToSpecialist } = await import("../extensions/orchestrator/delegate.js");
    const hookRegistry = createHookRegistry();
    const failures: string[][] = [];

    hookRegistry.registerObserver("onAdequacyFailure", (event) => {
      const payload = event.payload as { failures: string[] };
      failures.push(payload.failures);
    });

    const result = await delegateToSpecialist({
      promptConfig: {
        ...TEST_PROMPT_CONFIG,
        adequacyChecks: [
          {
            name: "force-fail",
            predicate: () => false,
            failureMessage: "Need a real deliverable",
          },
        ],
      },
      taskPacket: makeTaskPacket(),
      hookRegistry,
    });

    expect(result.success).toBe(false);
    expect(result.resultPacket.status).toBe("failure");
    expect(failures).toEqual([["Need a real deliverable"]]);
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
