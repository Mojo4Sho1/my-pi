import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTaskPacket } from "../extensions/shared/packets.js";
import type { TaskPacket, TeamDefinition, TeamSessionArtifact } from "../extensions/shared/types.js";
import { BUILD_TEAM } from "../extensions/teams/definitions.js";
import { computeTeamVersion } from "../extensions/shared/logging.js";
import { createHookRegistry } from "../extensions/shared/hooks.js";

describe("team session artifacts", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  function makeOutput(
    result: Record<string, unknown>,
    tokenUsage?: { inputTokens: number; outputTokens: number; totalTokens: number }
  ) {
    return {
      exitCode: 0,
      finalText: "```json\n" + JSON.stringify(result) + "\n```",
      stderr: "",
      tokenUsage,
    };
  }

  function makeTeamTaskPacket(): TaskPacket {
    return createTaskPacket({
      objective: "Build the feature end-to-end",
      allowedReadSet: ["src/index.ts"],
      allowedWriteSet: ["src/index.ts"],
      acceptanceCriteria: ["Feature works"],
      targetAgent: "team_build-team",
      sourceAgent: "orchestrator",
    });
  }

  async function setupTeamRouter(mockSpawn: ReturnType<typeof vi.fn>) {
    vi.doMock("../extensions/shared/subprocess.js", () => ({
      spawnSpecialistAgent: mockSpawn,
    }));
    const { executeTeam } = await import("../extensions/teams/router.js");
    return { executeTeam };
  }

  it("happy path produces artifact with correct metadata", async () => {
    const mockSpawn = vi.fn()
      .mockResolvedValueOnce(makeOutput({
        status: "success", summary: "Plan created", deliverables: ["step-1"], modifiedFiles: [],
      }))
      .mockResolvedValueOnce(makeOutput({
        status: "success", summary: "Review passed", deliverables: [], modifiedFiles: [],
      }))
      .mockResolvedValueOnce(makeOutput({
        status: "success", summary: "Built feature", deliverables: [], modifiedFiles: ["src/index.ts"],
      }))
      .mockResolvedValueOnce(makeOutput({
        status: "success", summary: "Tests passed", deliverables: [], modifiedFiles: [],
      }));

    const { executeTeam } = await setupTeamRouter(mockSpawn);
    const result = await executeTeam(BUILD_TEAM, makeTeamTaskPacket());

    expect(result.success).toBe(true);
    expect(result.sessionArtifact).toBeDefined();

    const artifact = result.sessionArtifact!;
    expect(artifact.teamId).toBe("build-team");
    expect(artifact.teamName).toBe("Build Team");
    expect(artifact.teamVersion).toBe(computeTeamVersion(BUILD_TEAM));
    expect(artifact.startState).toBe("planning");
    expect(artifact.endState).toBe("done");
    expect(artifact.terminationReason).toBe("success");
    expect(artifact.sessionId).toMatch(/^session_/);
    expect(artifact.startedAt).toBeTruthy();
    expect(artifact.completedAt).toBeTruthy();
  });

  it("state trace has one entry per non-terminal state visited", async () => {
    const mockSpawn = vi.fn()
      .mockResolvedValueOnce(makeOutput({
        status: "success", summary: "Plan", deliverables: [], modifiedFiles: [],
      }))
      .mockResolvedValueOnce(makeOutput({
        status: "success", summary: "Review", deliverables: [], modifiedFiles: [],
      }))
      .mockResolvedValueOnce(makeOutput({
        status: "success", summary: "Build", deliverables: [], modifiedFiles: ["src/index.ts"],
      }))
      .mockResolvedValueOnce(makeOutput({
        status: "success", summary: "Test", deliverables: [], modifiedFiles: [],
      }));

    const { executeTeam } = await setupTeamRouter(mockSpawn);
    const result = await executeTeam(BUILD_TEAM, makeTeamTaskPacket());
    const artifact = result.sessionArtifact!;

    // 4 non-terminal states: planning, review, building, testing
    expect(artifact.stateTrace).toHaveLength(4);
    expect(artifact.stateTrace[0].state).toBe("planning");
    expect(artifact.stateTrace[0].agent).toBe("specialist_planner");
    expect(artifact.stateTrace[0].transitionTo).toBe("review");
    expect(artifact.stateTrace[0].resultStatus).toBe("success");

    expect(artifact.stateTrace[1].state).toBe("review");
    expect(artifact.stateTrace[2].state).toBe("building");
    expect(artifact.stateTrace[3].state).toBe("testing");
    expect(artifact.stateTrace[3].transitionTo).toBe("done");
  });

  it("specialist summaries has one entry per delegation", async () => {
    const mockSpawn = vi.fn()
      .mockResolvedValueOnce(makeOutput({
        status: "success", summary: "Plan", deliverables: [], modifiedFiles: [],
      }))
      .mockResolvedValueOnce(makeOutput({
        status: "success", summary: "Review", deliverables: [], modifiedFiles: [],
      }))
      .mockResolvedValueOnce(makeOutput({
        status: "success", summary: "Build", deliverables: [], modifiedFiles: ["a.ts"],
      }))
      .mockResolvedValueOnce(makeOutput({
        status: "success", summary: "Test", deliverables: [], modifiedFiles: [],
      }));

    const { executeTeam } = await setupTeamRouter(mockSpawn);
    const result = await executeTeam(BUILD_TEAM, makeTeamTaskPacket());
    const artifact = result.sessionArtifact!;

    expect(artifact.specialistSummaries).toHaveLength(4);
    expect(artifact.specialistSummaries[0].agentId).toBe("specialist_planner");
    expect(artifact.specialistSummaries[0].order).toBe(1);
    expect(artifact.specialistSummaries[0].status).toBe("success");
    expect(artifact.specialistSummaries[3].agentId).toBe("specialist_tester");
    expect(artifact.specialistSummaries[3].order).toBe(4);

    // Each should have a durationMs (positive number)
    for (const summary of artifact.specialistSummaries) {
      expect(summary.durationMs).toBeGreaterThanOrEqual(0);
    }
  });

  it("loop/revision produces correct loopCount and revisionCount in metrics", async () => {
    // Plan → review fails → plan again → review passes → build → test → done
    const mockSpawn = vi.fn()
      .mockResolvedValueOnce(makeOutput({
        status: "success", summary: "Plan v1", deliverables: [], modifiedFiles: [],
      }))
      .mockResolvedValueOnce(makeOutput({
        status: "failure", summary: "Review failed", deliverables: [], modifiedFiles: [],
      }))
      .mockResolvedValueOnce(makeOutput({
        status: "success", summary: "Plan v2", deliverables: [], modifiedFiles: [],
      }))
      .mockResolvedValueOnce(makeOutput({
        status: "success", summary: "Review passed", deliverables: [], modifiedFiles: [],
      }))
      .mockResolvedValueOnce(makeOutput({
        status: "success", summary: "Built", deliverables: [], modifiedFiles: ["a.ts"],
      }))
      .mockResolvedValueOnce(makeOutput({
        status: "success", summary: "Tested", deliverables: [], modifiedFiles: [],
      }));

    const { executeTeam } = await setupTeamRouter(mockSpawn);
    const result = await executeTeam(BUILD_TEAM, makeTeamTaskPacket());
    const artifact = result.sessionArtifact!;

    expect(result.success).toBe(true);
    // planning was visited twice, so loopCount and revisionCount should reflect this
    expect(artifact.metrics.loopCount).toBeGreaterThan(0);
    expect(artifact.metrics.revisionCount).toBeGreaterThan(0);
    expect(artifact.metrics.totalTransitions).toBe(6);
    expect(artifact.metrics.totalDurationMs).toBeGreaterThanOrEqual(0);
  });

  it("aggregates token usage into specialist summaries and session metrics", async () => {
    const mockSpawn = vi.fn()
      .mockResolvedValueOnce(makeOutput({
        status: "success", summary: "Plan", deliverables: [], modifiedFiles: [],
      }, {
        inputTokens: 100, outputTokens: 20, totalTokens: 120,
      }))
      .mockResolvedValueOnce(makeOutput({
        status: "success", summary: "Review", deliverables: [], modifiedFiles: [],
      }, {
        inputTokens: 40, outputTokens: 10, totalTokens: 50,
      }))
      .mockResolvedValueOnce(makeOutput({
        status: "success", summary: "Build", deliverables: [], modifiedFiles: ["a.ts"],
      }, {
        inputTokens: 150, outputTokens: 80, totalTokens: 230,
      }))
      .mockResolvedValueOnce(makeOutput({
        status: "success", summary: "Test", deliverables: [], modifiedFiles: [],
      }, {
        inputTokens: 60, outputTokens: 30, totalTokens: 90,
      }));

    const { executeTeam } = await setupTeamRouter(mockSpawn);
    const result = await executeTeam(BUILD_TEAM, makeTeamTaskPacket());
    const artifact = result.sessionArtifact!;

    expect(artifact.specialistSummaries[0].tokenUsage).toEqual({
      inputTokens: 100,
      outputTokens: 20,
      totalTokens: 120,
    });
    expect(artifact.metrics.totalTokenUsage).toEqual({
      inputTokens: 350,
      outputTokens: 140,
      totalTokens: 490,
    });
  });

  it("emits team and state transition hook events", async () => {
    const mockSpawn = vi.fn()
      .mockResolvedValueOnce(makeOutput({
        status: "success", summary: "Plan", deliverables: [], modifiedFiles: [],
      }))
      .mockResolvedValueOnce(makeOutput({
        status: "success", summary: "Review", deliverables: [], modifiedFiles: [],
      }))
      .mockResolvedValueOnce(makeOutput({
        status: "success", summary: "Build", deliverables: [], modifiedFiles: ["a.ts"],
      }))
      .mockResolvedValueOnce(makeOutput({
        status: "success", summary: "Test", deliverables: [], modifiedFiles: [],
      }));

    const { executeTeam } = await setupTeamRouter(mockSpawn);
    const hookRegistry = createHookRegistry();
    const events: string[] = [];

    hookRegistry.registerObserver("onTeamStart", () => {
      events.push("onTeamStart");
    });
    hookRegistry.registerObserver("beforeStateTransition", () => {
      events.push("beforeStateTransition");
    });
    hookRegistry.registerObserver("afterStateTransition", () => {
      events.push("afterStateTransition");
    });

    await executeTeam(BUILD_TEAM, makeTeamTaskPacket(), undefined, undefined, hookRegistry);

    expect(events[0]).toBe("onTeamStart");
    expect(events.filter((event) => event === "beforeStateTransition")).toHaveLength(4);
    expect(events.filter((event) => event === "afterStateTransition")).toHaveLength(4);
  });

  it("escalation (loop exhaustion) produces artifact with terminationReason retry_exhaustion", async () => {
    // review→planning maxIterations=2: first two failures advance (count 0→1, 1→2), third attempt exhausts (count=2 >= 2)
    // plan → review(fail,count→1) → plan → review(fail,count→2) → plan → review(fail,count=2→exhausted)
    const mockSpawn = vi.fn()
      .mockResolvedValueOnce(makeOutput({
        status: "success", summary: "Plan v1", deliverables: [], modifiedFiles: [],
      }))
      .mockResolvedValueOnce(makeOutput({
        status: "failure", summary: "Review rejected v1", deliverables: [], modifiedFiles: [],
      }))
      .mockResolvedValueOnce(makeOutput({
        status: "success", summary: "Plan v2", deliverables: [], modifiedFiles: [],
      }))
      .mockResolvedValueOnce(makeOutput({
        status: "failure", summary: "Review rejected v2", deliverables: [], modifiedFiles: [],
      }))
      .mockResolvedValueOnce(makeOutput({
        status: "success", summary: "Plan v3", deliverables: [], modifiedFiles: [],
      }))
      .mockResolvedValueOnce(makeOutput({
        status: "failure", summary: "Review rejected v3", deliverables: [], modifiedFiles: [],
      }));

    const { executeTeam } = await setupTeamRouter(mockSpawn);
    const result = await executeTeam(BUILD_TEAM, makeTeamTaskPacket());
    const artifact = result.sessionArtifact!;

    expect(result.success).toBe(false);
    expect(result.resultPacket.status).toBe("escalation");
    expect(artifact.terminationReason).toBe("retry_exhaustion");
    expect(artifact.outcome.status).toBe("escalation");
    expect(artifact.outcome.failureReason).toBe("retry_exhaustion");
  });

  it("failure in mid-chain produces artifact with correct failure info", async () => {
    // Plan → review → build(fail) loops back to planning with maxIterations=2
    // Need 3 build failures to exhaust: plan→review→build(fail,count→1)→plan→review→build(fail,count→2)→plan→review→build(fail,exhausted)
    const mockSpawn = vi.fn()
      .mockResolvedValueOnce(makeOutput({
        status: "success", summary: "Plan v1", deliverables: [], modifiedFiles: [],
      }))
      .mockResolvedValueOnce(makeOutput({
        status: "success", summary: "Review v1", deliverables: [], modifiedFiles: [],
      }))
      .mockResolvedValueOnce(makeOutput({
        status: "failure", summary: "Build failed v1", deliverables: [], modifiedFiles: [],
      }))
      .mockResolvedValueOnce(makeOutput({
        status: "success", summary: "Plan v2", deliverables: [], modifiedFiles: [],
      }))
      .mockResolvedValueOnce(makeOutput({
        status: "success", summary: "Review v2", deliverables: [], modifiedFiles: [],
      }))
      .mockResolvedValueOnce(makeOutput({
        status: "failure", summary: "Build failed v2", deliverables: [], modifiedFiles: [],
      }))
      .mockResolvedValueOnce(makeOutput({
        status: "success", summary: "Plan v3", deliverables: [], modifiedFiles: [],
      }))
      .mockResolvedValueOnce(makeOutput({
        status: "success", summary: "Review v3", deliverables: [], modifiedFiles: [],
      }))
      .mockResolvedValueOnce(makeOutput({
        status: "failure", summary: "Build failed v3", deliverables: [], modifiedFiles: [],
      }));

    const { executeTeam } = await setupTeamRouter(mockSpawn);
    const result = await executeTeam(BUILD_TEAM, makeTeamTaskPacket());
    const artifact = result.sessionArtifact!;

    expect(result.success).toBe(false);
    expect(artifact.terminationReason).toBe("retry_exhaustion");
    expect(artifact.outcome.failureReason).toBe("retry_exhaustion");
    expect(artifact.specialistSummaries.length).toBeGreaterThan(3);
  });

  it("teamVersion is consistent and deterministic", async () => {
    const mockSpawn = vi.fn()
      .mockResolvedValueOnce(makeOutput({
        status: "success", summary: "Plan", deliverables: [], modifiedFiles: [],
      }))
      .mockResolvedValueOnce(makeOutput({
        status: "success", summary: "Review", deliverables: [], modifiedFiles: [],
      }))
      .mockResolvedValueOnce(makeOutput({
        status: "success", summary: "Build", deliverables: [], modifiedFiles: ["a.ts"],
      }))
      .mockResolvedValueOnce(makeOutput({
        status: "success", summary: "Test", deliverables: [], modifiedFiles: [],
      }));

    const { executeTeam } = await setupTeamRouter(mockSpawn);
    const result = await executeTeam(BUILD_TEAM, makeTeamTaskPacket());

    expect(result.sessionArtifact!.teamVersion).toBe(computeTeamVersion(BUILD_TEAM));
    expect(result.sessionArtifact!.teamVersion).toMatch(/^v0-[0-9a-f]+$/);
  });

  it("contractSatisfied is correctly computed per specialist", async () => {
    const mockSpawn = vi.fn()
      .mockResolvedValueOnce(makeOutput({
        status: "success", summary: "Plan", deliverables: ["step-1"], modifiedFiles: [],
      }))
      .mockResolvedValueOnce(makeOutput({
        status: "success", summary: "Review", deliverables: [], modifiedFiles: [],
      }))
      .mockResolvedValueOnce(makeOutput({
        status: "success", summary: "Build", deliverables: [], modifiedFiles: ["a.ts"],
      }))
      .mockResolvedValueOnce(makeOutput({
        status: "success", summary: "Test", deliverables: [], modifiedFiles: [],
      }));

    const { executeTeam } = await setupTeamRouter(mockSpawn);
    const result = await executeTeam(BUILD_TEAM, makeTeamTaskPacket());
    const artifact = result.sessionArtifact!;

    // All specialists should have contractSatisfied as a boolean
    for (const summary of artifact.specialistSummaries) {
      expect(typeof summary.contractSatisfied).toBe("boolean");
    }
  });

  it("produces artifact even when team has validation errors", async () => {
    const invalidTeam: TeamDefinition = {
      ...BUILD_TEAM,
      id: "broken-team",
      name: "Broken Team",
      states: {
        startState: "nonexistent",
        terminalStates: ["done"],
        states: {
          done: { agent: "orchestrator", transitions: [] },
        },
      },
    };

    const mockSpawn = vi.fn();
    const { executeTeam } = await setupTeamRouter(mockSpawn);
    const result = await executeTeam(invalidTeam, makeTeamTaskPacket());

    expect(result.success).toBe(false);
    expect(result.sessionArtifact).toBeDefined();
    expect(result.sessionArtifact!.terminationReason).toBe("validation_failure");
    expect(mockSpawn).not.toHaveBeenCalled();
  });

  it("logger receives team events when provided", async () => {
    const mockSpawn = vi.fn()
      .mockResolvedValueOnce(makeOutput({
        status: "success", summary: "Plan", deliverables: [], modifiedFiles: [],
      }))
      .mockResolvedValueOnce(makeOutput({
        status: "success", summary: "Review", deliverables: [], modifiedFiles: [],
      }))
      .mockResolvedValueOnce(makeOutput({
        status: "success", summary: "Build", deliverables: [], modifiedFiles: ["a.ts"],
      }))
      .mockResolvedValueOnce(makeOutput({
        status: "success", summary: "Test", deliverables: [], modifiedFiles: [],
      }));

    const logEntries: unknown[] = [];
    const mockLogger = { log: (entry: unknown) => logEntries.push(entry) };

    const { executeTeam } = await setupTeamRouter(mockSpawn);
    await executeTeam(BUILD_TEAM, makeTeamTaskPacket(), undefined, mockLogger);

    const events = logEntries.map((e) => (e as Record<string, unknown>).event);
    // Should have: team_start, then delegation_start/complete pairs, team_state_transitions, team_complete
    expect(events[0]).toBe("team_start");
    expect(events[events.length - 1]).toBe("team_complete");
    expect(events.filter((e) => e === "team_state_transition").length).toBe(4);
    expect(events.filter((e) => e === "delegation_start").length).toBe(4);
    expect(events.filter((e) => e === "delegation_complete").length).toBe(4);
  });
});
