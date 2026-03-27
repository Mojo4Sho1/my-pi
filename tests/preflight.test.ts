import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTaskPacket } from "../extensions/shared/packets.js";
import type { InputContract } from "../extensions/shared/types.js";
import type { SpecialistPromptConfig } from "../extensions/shared/specialist-prompt.js";

describe("pre-flight contract validation in delegateToSpecialist", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  function makeOutput(result: Record<string, unknown>) {
    return {
      exitCode: 0,
      finalText: "```json\n" + JSON.stringify(result) + "\n```",
      stderr: "",
    };
  }

  function makePromptConfig(overrides?: {
    inputContract?: InputContract;
  }): SpecialistPromptConfig {
    return {
      id: "specialist_builder",
      roleName: "Builder Specialist",
      roleDescription: "Builds things",
      workingStyle: {
        reasoning: "step-by-step",
        communication: "terse",
        risk: "cautious",
        defaultBias: "action",
      },
      constraints: [],
      antiPatterns: [],
      ...overrides,
    };
  }

  async function setupDelegate(mockSpawn: ReturnType<typeof vi.fn>) {
    vi.doMock("../extensions/shared/subprocess.js", () => ({
      spawnSpecialistAgent: mockSpawn,
    }));
    const { delegateToSpecialist } = await import("../extensions/orchestrator/delegate.js");
    return { delegateToSpecialist };
  }

  it("proceeds normally when specialist has no input contract", async () => {
    const mockSpawn = vi.fn().mockResolvedValue(
      makeOutput({ status: "success", summary: "Done", deliverables: [], modifiedFiles: [] })
    );
    const { delegateToSpecialist } = await setupDelegate(mockSpawn);

    const config = makePromptConfig(); // no inputContract
    const taskPacket = createTaskPacket({
      objective: "Build it",
      allowedReadSet: [],
      allowedWriteSet: [],
      acceptanceCriteria: [],
      targetAgent: "specialist_builder",
      sourceAgent: "orchestrator",
    });

    const result = await delegateToSpecialist({ promptConfig: config, taskPacket });
    expect(result.success).toBe(true);
    expect(mockSpawn).toHaveBeenCalledOnce();
  });

  it("proceeds normally when input contract has only optional fields", async () => {
    const mockSpawn = vi.fn().mockResolvedValue(
      makeOutput({ status: "success", summary: "Done", deliverables: [], modifiedFiles: [] })
    );
    const { delegateToSpecialist } = await setupDelegate(mockSpawn);

    const config = makePromptConfig({
      inputContract: {
        fields: [
          { name: "planSummary", type: "string", required: false, description: "Optional plan" },
        ],
      },
    });
    const taskPacket = createTaskPacket({
      objective: "Build it",
      allowedReadSet: [],
      allowedWriteSet: [],
      acceptanceCriteria: [],
      targetAgent: "specialist_builder",
      sourceAgent: "orchestrator",
    });

    const result = await delegateToSpecialist({ promptConfig: config, taskPacket });
    expect(result.success).toBe(true);
    expect(mockSpawn).toHaveBeenCalledOnce();
  });

  it("returns failure without spawning when required input field is missing", async () => {
    const mockSpawn = vi.fn();
    const { delegateToSpecialist } = await setupDelegate(mockSpawn);

    const config = makePromptConfig({
      inputContract: {
        fields: [
          { name: "planSummary", type: "string", required: true, description: "Required plan" },
        ],
      },
    });
    const taskPacket = createTaskPacket({
      objective: "Build it",
      allowedReadSet: [],
      allowedWriteSet: [],
      acceptanceCriteria: [],
      targetAgent: "specialist_builder",
      sourceAgent: "orchestrator",
      // no context — required field missing
    });

    const result = await delegateToSpecialist({ promptConfig: config, taskPacket });
    expect(result.success).toBe(false);
    expect(result.resultPacket.status).toBe("failure");
    expect(result.resultPacket.summary).toContain("Pre-flight validation failed");
    expect(result.resultPacket.summary).toContain("planSummary");
    expect(mockSpawn).not.toHaveBeenCalled();
  });

  it("logs preflight_fail event when logger is present", async () => {
    const mockSpawn = vi.fn();
    const { delegateToSpecialist } = await setupDelegate(mockSpawn);

    const logEntries: unknown[] = [];
    const mockLogger = {
      log: (entry: unknown) => logEntries.push(entry),
    };

    const config = makePromptConfig({
      inputContract: {
        fields: [
          { name: "planSummary", type: "string", required: true, description: "Required plan" },
        ],
      },
    });
    const taskPacket = createTaskPacket({
      objective: "Build it",
      allowedReadSet: [],
      allowedWriteSet: [],
      acceptanceCriteria: [],
      targetAgent: "specialist_builder",
      sourceAgent: "orchestrator",
    });

    await delegateToSpecialist({
      promptConfig: config,
      taskPacket,
      logger: mockLogger,
    });

    expect(logEntries).toHaveLength(1);
    const entry = logEntries[0] as Record<string, unknown>;
    expect(entry.event).toBe("preflight_fail");
    expect(entry.level).toBe("error");
    expect(entry.failureReason).toBe("contract_violation");
    expect(entry.targetAgent).toBe("specialist_builder");
  });

  it("passes pre-flight when required field is present in context", async () => {
    const mockSpawn = vi.fn().mockResolvedValue(
      makeOutput({ status: "success", summary: "Done", deliverables: [], modifiedFiles: [] })
    );
    const { delegateToSpecialist } = await setupDelegate(mockSpawn);

    const config = makePromptConfig({
      inputContract: {
        fields: [
          { name: "planSummary", type: "string", required: true, description: "Required plan" },
        ],
      },
    });
    const taskPacket = createTaskPacket({
      objective: "Build it",
      allowedReadSet: [],
      allowedWriteSet: [],
      acceptanceCriteria: [],
      context: { planSummary: "Here is the plan" },
      targetAgent: "specialist_builder",
      sourceAgent: "orchestrator",
    });

    const result = await delegateToSpecialist({ promptConfig: config, taskPacket });
    expect(result.success).toBe(true);
    expect(mockSpawn).toHaveBeenCalledOnce();
  });
});
