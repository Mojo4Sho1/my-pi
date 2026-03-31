/**
 * Stage 4e.2 — Worklist/orchestrator integration tests.
 *
 * Verify that the orchestrator creates and updates worklist items
 * during multi-specialist delegations, and that the worklist summary
 * is logged via appendEntry and surfaced in synthesis.
 *
 * Mock pattern: same as tests/orchestrator-e2e.test.ts (mock spawnSpecialistAgent).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Helpers (copied from orchestrator-e2e.test.ts)
// ---------------------------------------------------------------------------

interface OutputOverrides {
  status?: string;
  summary?: string;
  deliverables?: string[];
  modifiedFiles?: string[];
  escalation?: { reason: string; suggestedAction: string };
}

function makeOutput(overrides: OutputOverrides = {}) {
  const json = JSON.stringify({
    status: overrides.status ?? "success",
    summary: overrides.summary ?? "Done",
    deliverables: overrides.deliverables ?? [],
    modifiedFiles: overrides.modifiedFiles ?? [],
    ...(overrides.escalation ? { escalation: overrides.escalation } : {}),
  });
  return {
    exitCode: 0,
    finalText: `\`\`\`json\n${json}\n\`\`\``,
    stderr: "",
  };
}

async function setupOrchestrator(mockSpawn: ReturnType<typeof vi.fn>) {
  vi.doMock("../extensions/shared/subprocess.js", () => ({
    spawnSpecialistAgent: mockSpawn,
  }));

  const mod = await import("../extensions/orchestrator/index.js");
  let execute: any;
  const mockPi = {
    registerTool: vi.fn((def: any) => {
      execute = def.execute;
    }),
    appendEntry: vi.fn(),
  };
  mod.default(mockPi as any);
  return { execute: execute as Function, mockPi };
}

function callOrchestrate(
  execute: Function,
  overrides: {
    task?: string;
    relevantFiles?: string[];
    delegationHint?: string;
  } = {},
) {
  return execute(
    "test-call-id",
    {
      task: overrides.task ?? "plan and implement the feature",
      relevantFiles: overrides.relevantFiles ?? ["src/index.ts"],
      delegationHint: overrides.delegationHint,
    },
    undefined,
    undefined,
    {},
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("orchestrator worklist integration", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("creates worklist items for each specialist", async () => {
    const mockSpawn = vi.fn()
      .mockResolvedValueOnce(makeOutput({ summary: "Plan ready" }))
      .mockResolvedValueOnce(makeOutput({ summary: "Built it" }));

    const { execute, mockPi } = await setupOrchestrator(mockSpawn);
    await callOrchestrate(execute);

    // worklist_session should have been logged
    const worklistCalls = mockPi.appendEntry.mock.calls.filter(
      (c: any[]) => c[0] === "worklist_session",
    );
    expect(worklistCalls).toHaveLength(1);

    const { worklist, summary } = worklistCalls[0][1];
    expect(worklist.items).toHaveLength(2);
    expect(worklist.items[0].description).toContain("planner");
    expect(worklist.items[1].description).toContain("builder");
    expect(summary.totalItems).toBe(2);
  });

  it("successful specialist → item status completed", async () => {
    const mockSpawn = vi.fn()
      .mockResolvedValueOnce(makeOutput({ summary: "Plan ready" }))
      .mockResolvedValueOnce(makeOutput({ summary: "Built it" }));

    const { execute, mockPi } = await setupOrchestrator(mockSpawn);
    await callOrchestrate(execute);

    const { worklist } = mockPi.appendEntry.mock.calls.find(
      (c: any[]) => c[0] === "worklist_session",
    )![1];

    expect(worklist.items[0].status).toBe("completed");
    expect(worklist.items[1].status).toBe("completed");
  });

  it("failed specialist → item status blocked with reason", async () => {
    const mockSpawn = vi.fn()
      .mockResolvedValueOnce(makeOutput({ summary: "Plan ready" }))
      .mockResolvedValueOnce(makeOutput({ status: "failure", summary: "Could not build" }));

    const { execute, mockPi } = await setupOrchestrator(mockSpawn);
    await callOrchestrate(execute, {
      task: "plan and implement the feature",
    });

    const { worklist } = mockPi.appendEntry.mock.calls.find(
      (c: any[]) => c[0] === "worklist_session",
    )![1];

    // Planner succeeded, builder failed
    expect(worklist.items[0].status).toBe("completed");
    expect(worklist.items[1].status).toBe("blocked");
    expect(worklist.items[1].blockReason).toContain("Could not build");
  });

  it("worklist summary logged via appendEntry after orchestration", async () => {
    const mockSpawn = vi.fn()
      .mockResolvedValueOnce(makeOutput({ summary: "Plan ready" }))
      .mockResolvedValueOnce(makeOutput({ summary: "Built it" }));

    const { execute, mockPi } = await setupOrchestrator(mockSpawn);
    await callOrchestrate(execute);

    const worklistCall = mockPi.appendEntry.mock.calls.find(
      (c: any[]) => c[0] === "worklist_session",
    );
    expect(worklistCall).toBeDefined();

    const { summary } = worklistCall![1];
    expect(summary.totalItems).toBe(2);
    expect(summary.isComplete).toBe(true);
    expect(summary.hasBlockers).toBe(false);
  });

  it("blocked items surfaced in synthesized summary", async () => {
    const mockSpawn = vi.fn()
      .mockResolvedValueOnce(makeOutput({ summary: "Plan ready" }))
      .mockResolvedValueOnce(makeOutput({ status: "failure", summary: "Build broke" }));

    const { execute } = await setupOrchestrator(mockSpawn);
    const result = await callOrchestrate(execute, {
      task: "plan and implement the feature",
    });

    // The synthesized text should contain blocked item info
    expect(result.content[0].text).toContain("Blocked items");
    expect(result.content[0].text).toContain("Build broke");
  });

  it("worklist does not affect specialist selection", async () => {
    // Same task, same delegation — selection should be identical
    const mockSpawn1 = vi.fn()
      .mockResolvedValueOnce(makeOutput({ summary: "Plan ready" }))
      .mockResolvedValueOnce(makeOutput({ summary: "Built it" }));

    const { execute: execute1 } = await setupOrchestrator(mockSpawn1);
    const result1 = await callOrchestrate(execute1);

    vi.restoreAllMocks();
    vi.resetModules();

    const mockSpawn2 = vi.fn()
      .mockResolvedValueOnce(makeOutput({ summary: "Plan ready" }))
      .mockResolvedValueOnce(makeOutput({ summary: "Built it" }));

    const { execute: execute2 } = await setupOrchestrator(mockSpawn2);
    const result2 = await callOrchestrate(execute2);

    expect(result1.details.specialistsInvoked).toEqual(result2.details.specialistsInvoked);
  });
});
