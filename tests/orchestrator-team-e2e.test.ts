import { describe, it, expect, vi, beforeEach } from "vitest";

describe("orchestrator team delegation", () => {
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

  async function setupOrchestrator(mockSpawn: ReturnType<typeof vi.fn>) {
    vi.doMock("../extensions/shared/subprocess.js", () => ({
      spawnSpecialistAgent: mockSpawn,
    }));

    const { default: orchestratorExtension } = await import(
      "../extensions/orchestrator/index.js"
    );

    let capturedTool: any;
    const mockPi = {
      registerTool: (config: any) => {
        capturedTool = config;
      },
      appendEntry: vi.fn(),
    };
    orchestratorExtension(mockPi as any);
    return capturedTool;
  }

  it("delegates to build-team when teamHint is provided", async () => {
    const mockSpawn = vi.fn()
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Planned", deliverables: ["s1"], modifiedFiles: [] }))
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Built", deliverables: ["done"], modifiedFiles: ["a.ts"] }))
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Reviewed", deliverables: ["ok"], modifiedFiles: [] }))
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Tested", deliverables: ["pass"], modifiedFiles: [] }));

    const tool = await setupOrchestrator(mockSpawn);
    const result = await tool.execute(
      "call-1",
      {
        task: "build a feature",
        relevantFiles: ["src/index.ts"],
        teamHint: "build-team",
      },
      undefined,
      undefined,
      {} as any,
    );

    expect(result.details.overallStatus).toBe("success");
    expect(result.details.teamId).toBe("build-team");
    expect(mockSpawn).toHaveBeenCalledTimes(4);
  });

  it("returns failure for unknown team ID", async () => {
    const mockSpawn = vi.fn();
    const tool = await setupOrchestrator(mockSpawn);
    const result = await tool.execute(
      "call-2",
      {
        task: "do something",
        relevantFiles: [],
        teamHint: "nonexistent-team",
      },
      undefined,
      undefined,
      {} as any,
    );

    expect(result.details.overallStatus).toBe("failure");
    expect(result.details.result.summary).toContain("Unknown team");
    expect(mockSpawn).not.toHaveBeenCalled();
  });

  it("teamHint bypasses specialist selection entirely", async () => {
    const mockSpawn = vi.fn()
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Planned", deliverables: ["s1"], modifiedFiles: [] }))
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Built", deliverables: ["done"], modifiedFiles: ["a.ts"] }))
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Reviewed", deliverables: ["ok"], modifiedFiles: [] }))
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Tested", deliverables: ["pass"], modifiedFiles: [] }));

    const tool = await setupOrchestrator(mockSpawn);
    const result = await tool.execute(
      "call-3",
      {
        task: "plan something",  // would normally select planner only
        relevantFiles: ["src/index.ts"],
        teamHint: "build-team",  // but teamHint overrides
      },
      undefined,
      undefined,
      {} as any,
    );

    // All 4 specialists invoked via team, not just planner
    expect(mockSpawn).toHaveBeenCalledTimes(4);
    expect(result.details.teamId).toBe("build-team");
  });

  it("team failure propagates through orchestrator", async () => {
    const mockSpawn = vi.fn()
      .mockResolvedValueOnce(makeOutput({
        status: "escalation",
        summary: "Cannot plan this",
        deliverables: [],
        modifiedFiles: [],
        escalation: { reason: "Too ambiguous", suggestedAction: "Clarify" },
      }));

    const tool = await setupOrchestrator(mockSpawn);
    const result = await tool.execute(
      "call-4",
      {
        task: "build something",
        relevantFiles: [],
        teamHint: "build-team",
      },
      undefined,
      undefined,
      {} as any,
    );

    expect(result.details.overallStatus).toBe("escalation");
  });

  it("without teamHint, uses normal specialist selection", async () => {
    const mockSpawn = vi.fn()
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Built", deliverables: ["done"], modifiedFiles: ["a.ts"] }));

    const tool = await setupOrchestrator(mockSpawn);
    const result = await tool.execute(
      "call-5",
      {
        task: "implement the handler",
        relevantFiles: ["src/index.ts"],
        // no teamHint — normal specialist path
      },
      undefined,
      undefined,
      {} as any,
    );

    // Should use specialist selection, not team
    expect(result.details.overallStatus).toBe("success");
    expect(result.details.teamId).toBeUndefined();
    expect(result.details.specialistsInvoked).toBeDefined();
  });
});
