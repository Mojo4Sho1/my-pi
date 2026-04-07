import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTaskPacket } from "../extensions/shared/packets.js";
import {
  GLOBAL_RUN_REGISTRY,
  type RunRecord,
} from "../extensions/shared/run-registry.js";
import { teardownRuns } from "../extensions/shared/teardown.js";
import type { SpecialistPromptConfig } from "../extensions/shared/specialist-prompt.js";

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

function makeTaskPacket() {
  return createTaskPacket({
    objective: "Implement the feature",
    allowedReadSet: ["src/index.ts"],
    allowedWriteSet: ["src/index.ts"],
    acceptanceCriteria: ["Feature works"],
    targetAgent: "specialist_builder",
    sourceAgent: "orchestrator",
  });
}

describe("teardownRuns", () => {
  beforeEach(() => {
    GLOBAL_RUN_REGISTRY.reset();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("escalates from graceful stop to force kill when a run ignores graceful stop", async () => {
    const run = GLOBAL_RUN_REGISTRY.registerRun({
      kind: "subprocess",
      owner: "pi",
      initialState: "active",
    });
    GLOBAL_RUN_REGISTRY.updateHandlers(run.id, {
      gracefulStop: () => {
        GLOBAL_RUN_REGISTRY.markCanceling(run.id);
      },
      forceStop: () => {
        GLOBAL_RUN_REGISTRY.markKilled(run.id);
      },
    });

    const summary = await teardownRuns([run.id], {
      gracePeriodMs: 0,
      settleTimeoutMs: 200,
    });

    expect(summary.forceKilled).toBe(1);
    expect(summary.gracefulCanceled).toBe(0);
    expect(summary.settled).toBe(true);
    expect(GLOBAL_RUN_REGISTRY.getRun(run.id)?.state).toBe("killed");
  });

  it("propagates abort through a tracked delegation run", async () => {
    const mockSpawn = vi.fn().mockImplementation(
      (_systemPrompt: string, _taskPrompt: string, signal?: AbortSignal) =>
        new Promise((resolve) => {
          signal?.addEventListener("abort", () => {
            resolve({
              exitCode: 1,
              finalText: "",
              stderr: "aborted",
            });
          }, { once: true });
        })
    );

    vi.doMock("../extensions/shared/subprocess.js", () => ({
      spawnSpecialistAgent: mockSpawn,
    }));

    const { delegateToSpecialist } = await import("../extensions/orchestrator/delegate.js");
    const { GLOBAL_RUN_REGISTRY: freshRegistry } = await import("../extensions/shared/run-registry.js");
    const { teardownRuns: freshTeardownRuns } = await import("../extensions/shared/teardown.js");

    const delegationPromise = delegateToSpecialist({
      promptConfig: TEST_PROMPT_CONFIG,
      taskPacket: makeTaskPacket(),
    });
    await new Promise((resolve) => setTimeout(resolve, 0));

    const delegationRun = freshRegistry.listActiveRuns().find(
      (run: RunRecord) => run.kind === "delegation"
    );
    expect(delegationRun).toBeDefined();

    const summary = await freshTeardownRuns([delegationRun!.id], {
      gracePeriodMs: 0,
      settleTimeoutMs: 200,
    });
    const result = await delegationPromise;

    expect(summary.settled).toBe(true);
    expect(mockSpawn).toHaveBeenCalled();
    expect(result.resultPacket.summary).toContain("exited with code 1");
    expect(freshRegistry.getRun(delegationRun!.id)?.state).toBe("canceled");
  });
});
