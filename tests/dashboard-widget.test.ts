/**
 * Dashboard widget tests (Stage 5a.2).
 *
 * Covers compact widget rendering, branch reconstruction, and live updates
 * driven by hook observers installed by the dashboard extension.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { applyWidget, renderWidgetLines, WIDGET_KEY } from "../extensions/dashboard/widget.js";
import {
  applyDashboardObserverEvent,
  reconstructSnapshotFromBranch,
} from "../extensions/dashboard/index.js";
import type { WidgetState } from "../extensions/dashboard/types.js";

function makeWidgetState(overrides: Partial<WidgetState> = {}): WidgetState {
  return {
    sessionStatus: "running",
    activePath: {
      team: "build-team",
      state: "review",
      agent: "reviewer",
    },
    worklistProgress: {
      total: 4,
      completed: 2,
      remaining: 2,
      blocked: 0,
    },
    hasBlockers: false,
    hasEscalation: false,
    elapsedMs: 65000,
    totalTokens: 1234,
    ...overrides,
  };
}

describe("dashboard widget rendering", () => {
  it("clears the widget when idle", () => {
    const ctx = {
      hasUI: true,
      ui: {
        setWidget: vi.fn(),
      },
    };

    applyWidget(ctx as any, makeWidgetState({ sessionStatus: "idle", activePath: null, worklistProgress: null }));
    expect(ctx.ui.setWidget).toHaveBeenCalledWith(WIDGET_KEY, undefined);
  });

  it("renders a compact running widget with stacked path and counters", () => {
    expect(renderWidgetLines(makeWidgetState())).toEqual([
      "Status: running",
      "Team: build-team",
      "State: review",
      "Agent: reviewer",
      "Work: 4 total | 2 done | 2 remaining",
      "Time: 1m 5s | Tokens: 1,234",
    ]);
  });

  it("shows blocker and escalation indicators inline", () => {
    expect(renderWidgetLines(makeWidgetState({
      sessionStatus: "escalated",
      hasBlockers: true,
      hasEscalation: true,
    }))[0]).toBe("Status: escalated [blockers] [escalation]");
  });

  it("includes blocked worklist count only when nonzero", () => {
    expect(renderWidgetLines(makeWidgetState({
      worklistProgress: {
        total: 4,
        completed: 1,
        remaining: 3,
        blocked: 2,
      },
    }))[4]).toBe("Work: 4 total | 1 done | 3 remaining | 2 blocked");
  });

  it("degrades gracefully when path and worklist sections are missing", () => {
    expect(renderWidgetLines(makeWidgetState({
      activePath: null,
      worklistProgress: null,
      elapsedMs: 0,
      totalTokens: 0,
    }))).toEqual([
      "Status: running",
      "Time: 0s | Tokens: 0",
    ]);
  });
});

describe("dashboard reconstruction and live updates", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("reconstructs snapshot state from branch custom entries", () => {
    const snapshot = reconstructSnapshotFromBranch([
      {
        type: "custom",
        customType: "delegation_log",
        data: {
          timestamp: "2026-04-03T12:00:30.000Z",
          level: "info",
          event: "delegation_start",
          sourceAgent: "orchestrator",
          targetAgent: "specialist_planner",
          taskId: "task-1",
          summary: "Started planning",
        },
      },
      {
        type: "custom",
        customType: "worklist_session",
        data: {
          summary: {
            totalItems: 2,
            statusCounts: {
              pending: 0,
              in_progress: 1,
              completed: 1,
              blocked: 0,
              abandoned: 0,
            },
            blockedItems: [],
            isComplete: false,
            hasBlockers: false,
          },
        },
      },
      {
        type: "custom",
        customType: "team_session",
        data: {
          sessionId: "session_1",
          startedAt: "2026-04-03T12:00:00.000Z",
          completedAt: "2026-04-03T12:02:00.000Z",
          teamId: "build-team",
          teamName: "Build Team",
          teamVersion: "v0-123",
          startState: "planning",
          endState: "done",
          terminationReason: "success",
          stateTrace: [],
          specialistSummaries: [],
          outcome: {
            status: "success",
          },
          metrics: {
            totalTransitions: 0,
            loopCount: 0,
            retryCount: 0,
            totalDurationMs: 120000,
            revisionCount: 0,
            totalTokenUsage: {
              inputTokens: 10,
              outputTokens: 5,
              totalTokens: 15,
            },
          },
        },
      },
    ]);

    expect(snapshot.delegationLogs).toHaveLength(1);
    expect(snapshot.worklistSummary?.totalItems).toBe(2);
    expect(snapshot.sessionId).toBe("session_1");
    expect(snapshot.sessionStatusHint).toBe("completed");
    expect(snapshot.totalTokenUsage?.totalTokens).toBe(15);
  });

  it("updates state from hook observer payloads", () => {
    let snapshot = reconstructSnapshotFromBranch([]);

    snapshot = applyDashboardObserverEvent(
      snapshot,
      "onSessionStart",
      { sessionId: "hook_session_1" },
      "2026-04-03T12:00:00.000Z",
    );
    snapshot = applyDashboardObserverEvent(
      snapshot,
      "onTeamStart",
      { teamId: "build-team", teamVersion: "v0-123", taskId: "task-1" },
      "2026-04-03T12:00:01.000Z",
    );
    snapshot = applyDashboardObserverEvent(
      snapshot,
      "afterDelegation",
      {
        specialistId: "planner",
        taskId: "task-1",
        sourceAgent: "orchestrator",
        resultStatus: "success",
        tokenUsage: {
          inputTokens: 40,
          outputTokens: 10,
          totalTokens: 50,
        },
      },
      "2026-04-03T12:00:10.000Z",
    );

    expect(snapshot.sessionId).toBe("hook_session_1");
    expect(snapshot.activePathHint).toEqual({
      team: "build-team",
    });
    expect(snapshot.totalTokenUsage?.totalTokens).toBe(50);
    expect(snapshot.sessionStatusHint).toBe("completed");
  });

  it("replaces state on session-switch reconstruction rather than merging stale data", async () => {
    const mod = await import("../extensions/dashboard/index.js");
    const hooks = await import("../extensions/shared/hooks.js");

    const handlers = new Map<string, Function>();
    const mockPi = {
      on: vi.fn((eventName: string, handler: Function) => {
        handlers.set(eventName, handler);
      }),
    };

    mod.default(mockPi as any);

    const firstCtx = {
      hasUI: true,
      ui: { setWidget: vi.fn() },
      sessionManager: {
        getBranch: () => [
          {
            type: "custom",
            customType: "team_session",
            data: {
              sessionId: "session_old",
              startedAt: "2026-04-03T12:00:00.000Z",
              completedAt: "2026-04-03T12:01:00.000Z",
              teamId: "build-team",
              teamName: "Build Team",
              teamVersion: "v0-1",
              startState: "planning",
              endState: "done",
              terminationReason: "success",
              stateTrace: [],
              specialistSummaries: [],
              outcome: { status: "success" },
              metrics: {
                totalTransitions: 0,
                loopCount: 0,
                retryCount: 0,
                totalDurationMs: 60000,
                revisionCount: 0,
              },
            },
          },
        ],
      },
    };

    const secondCtx = {
      hasUI: true,
      ui: { setWidget: vi.fn() },
      sessionManager: {
        getBranch: () => [],
      },
    };

    await handlers.get("session_start")?.({}, firstCtx as any);
    await handlers.get("session_switch")?.({}, secondCtx as any);

    expect(secondCtx.ui.setWidget).toHaveBeenLastCalledWith(WIDGET_KEY, undefined);

    const registry = hooks.createHookRegistry();
    registry.dispatchObserver("onSessionStart", { sessionId: "hook_session_2" });
    expect(secondCtx.ui.setWidget).toHaveBeenLastCalledWith(
      WIDGET_KEY,
      expect.arrayContaining(["Status: running", "Time: 0s | Tokens: 0"]),
    );
  });
});
