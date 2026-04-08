/**
 * Dashboard projection tests (Stage 5a.2).
 *
 * Validates compact widget projections from structured artifacts and
 * dashboard-local runtime snapshots.
 */

import { describe, expect, it } from "vitest";
import type { DashboardSessionSnapshot } from "../extensions/dashboard/types.js";
import {
  deriveActivePrimitivePath,
  projectWidgetState,
  projectWorklistProgress,
} from "../extensions/dashboard/projections.js";

function makeSnapshot(overrides: Partial<DashboardSessionSnapshot> = {}): DashboardSessionSnapshot {
  return {
    activePathHint: null,
    delegationLogs: [],
    ...overrides,
  };
}

describe("dashboard projections", () => {
  it("projects a full team session artifact into terminal widget state", () => {
    const state = projectWidgetState(makeSnapshot({
      teamSession: {
        sessionId: "session_1",
        startedAt: "2026-04-03T12:00:00.000Z",
        completedAt: "2026-04-03T12:05:00.000Z",
        teamId: "build-team",
        teamName: "Build Team",
        teamVersion: "v0-123",
        startState: "planning",
        endState: "done",
        terminationReason: "success",
        stateTrace: [
          {
            state: "planning",
            agent: "specialist_planner",
            resultStatus: "success",
            transitionTo: "review",
            enteredAt: "2026-04-03T12:00:00.000Z",
            completedAt: "2026-04-03T12:01:00.000Z",
          },
          {
            state: "testing",
            agent: "specialist_tester",
            resultStatus: "success",
            transitionTo: "done",
            enteredAt: "2026-04-03T12:04:00.000Z",
            completedAt: "2026-04-03T12:05:00.000Z",
          },
        ],
        specialistSummaries: [],
        outcome: {
          status: "success",
        },
        metrics: {
          totalTransitions: 2,
          loopCount: 0,
          retryCount: 0,
          totalDurationMs: 300000,
          revisionCount: 0,
          totalTokenUsage: {
            inputTokens: 100,
            outputTokens: 50,
            totalTokens: 150,
          },
        },
      },
      worklistSummary: {
        totalItems: 4,
        statusCounts: {
          pending: 0,
          in_progress: 0,
          completed: 4,
          blocked: 0,
          abandoned: 0,
        },
        blockedItems: [],
        isComplete: true,
        hasBlockers: false,
      },
    }));

    expect(state.sessionStatus).toBe("completed");
    expect(state.activePath).toEqual({
      team: "build-team",
      state: "testing",
      agent: "tester",
    });
    expect(state.progressLabel).toBe("testing -> tester");
    expect(state.worklistProgress).toEqual({
      total: 4,
      completed: 4,
      remaining: 0,
      blocked: 0,
    });
    expect(state.elapsedMs).toBe(300000);
    expect(state.totalTokens).toBe(150);
  });

  it("projects a live-only snapshot as running", () => {
    const state = projectWidgetState(makeSnapshot({
      startedAt: "2026-04-03T12:00:00.000Z",
      activePathHint: {
        team: "build-team",
        state: "review",
        agent: "specialist_reviewer",
      },
    }), Date.parse("2026-04-03T12:02:00.000Z"));

    expect(state.sessionStatus).toBe("running");
    expect(state.activePath).toEqual({
      team: "build-team",
      state: "review",
      agent: "reviewer",
    });
    expect(state.progressLabel).toBe("review -> reviewer");
    expect(state.elapsedMs).toBe(120000);
  });

  it("projects live specialist-chain progress from planned delegation state", () => {
    const state = projectWidgetState(makeSnapshot({
      startedAt: "2026-04-03T12:00:00.000Z",
      activePathHint: {
        agent: "specialist_builder",
      },
      plannedSpecialists: ["planner", "builder", "tester"],
      currentDelegationIndex: 2,
      completedDelegations: 1,
      subprocessActive: true,
    }), Date.parse("2026-04-03T12:02:00.000Z"));

    expect(state.sessionStatus).toBe("running");
    expect(state.activePath).toEqual({
      agent: "builder",
    });
    expect(state.progressLabel).toBe("2/3");
    expect(state.subprocessActive).toBe(true);
  });

  it("returns null worklist progress and false blockers when summary is missing", () => {
    const state = projectWidgetState(makeSnapshot({
      startedAt: "2026-04-03T12:00:00.000Z",
    }));

    expect(state.worklistProgress).toBeNull();
    expect(state.hasBlockers).toBe(false);
    expect(state.progressLabel).toBeNull();
  });

  it("uses zero tokens when no token data is available", () => {
    const state = projectWidgetState(makeSnapshot({
      startedAt: "2026-04-03T12:00:00.000Z",
    }));

    expect(state.totalTokens).toBe(0);
  });

  it("maps escalation artifacts to escalated widget status", () => {
    const state = projectWidgetState(makeSnapshot({
      teamSession: {
        sessionId: "session_1",
        startedAt: "2026-04-03T12:00:00.000Z",
        completedAt: "2026-04-03T12:01:00.000Z",
        teamId: "build-team",
        teamName: "Build Team",
        teamVersion: "v0-123",
        startState: "planning",
        endState: "review",
        terminationReason: "retry_exhaustion",
        stateTrace: [],
        specialistSummaries: [],
        outcome: {
          status: "escalation",
          failureReason: "retry_exhaustion",
        },
        metrics: {
          totalTransitions: 0,
          loopCount: 0,
          retryCount: 0,
          totalDurationMs: 60000,
          revisionCount: 0,
        },
      },
    }));

    expect(state.sessionStatus).toBe("escalated");
    expect(state.hasEscalation).toBe(true);
  });

  it("maps failures to failed widget status", () => {
    const state = projectWidgetState(makeSnapshot({
      latestResultStatus: "failure",
    }));

    expect(state.sessionStatus).toBe("failed");
  });

  it("maps partial results to completed widget status", () => {
    const state = projectWidgetState(makeSnapshot({
      latestResultStatus: "partial",
    }));

    expect(state.sessionStatus).toBe("completed");
  });

  it("computes worklist progress math from summary counts", () => {
    expect(projectWorklistProgress({
      totalItems: 9,
      statusCounts: {
        pending: 2,
        in_progress: 1,
        completed: 3,
        blocked: 2,
        abandoned: 1,
      },
      blockedItems: [],
      isComplete: false,
      hasBlockers: true,
    })).toEqual({
      total: 9,
      completed: 3,
      remaining: 5,
      blocked: 2,
    });
  });

  it("uses completed duration when both timestamps exist", () => {
    const state = projectWidgetState(makeSnapshot({
      startedAt: "2026-04-03T12:00:00.000Z",
      completedAt: "2026-04-03T12:03:30.000Z",
      latestResultStatus: "success",
    }), Date.parse("2026-04-03T12:10:00.000Z"));

    expect(state.elapsedMs).toBe(210000);
  });

  it("uses now minus startedAt while a run is still active", () => {
    const state = projectWidgetState(makeSnapshot({
      startedAt: "2026-04-03T12:00:00.000Z",
      sessionStatusHint: "running",
    }), Date.parse("2026-04-03T12:01:30.000Z"));

    expect(state.elapsedMs).toBe(90000);
  });

  it("prefers the live active path hint over the artifact fallback", () => {
    const path = deriveActivePrimitivePath(makeSnapshot({
      activePathHint: {
        team: "build-team",
        state: "review",
        agent: "reviewer",
      },
      teamSession: {
        sessionId: "session_1",
        startedAt: "2026-04-03T12:00:00.000Z",
        completedAt: "2026-04-03T12:05:00.000Z",
        teamId: "build-team",
        teamName: "Build Team",
        teamVersion: "v0-123",
        startState: "planning",
        endState: "done",
        terminationReason: "success",
        stateTrace: [
          {
            state: "testing",
            agent: "specialist_tester",
            resultStatus: "success",
            transitionTo: "done",
            enteredAt: "2026-04-03T12:04:00.000Z",
            completedAt: "2026-04-03T12:05:00.000Z",
          },
        ],
        specialistSummaries: [],
        outcome: {
          status: "success",
        },
        metrics: {
          totalTransitions: 1,
          loopCount: 0,
          retryCount: 0,
          totalDurationMs: 300000,
          revisionCount: 0,
        },
      },
    }));

    expect(path).toEqual({
      team: "build-team",
      state: "review",
      agent: "reviewer",
    });
  });
});
