/**
 * Dashboard command tests (Stage 5a.3 validation / 5a.4 head start).
 */

import { describe, expect, it, vi } from "vitest";
import dashboardExtension from "../extensions/dashboard/index.js";
import { runDashboardCommand } from "../extensions/dashboard/command.js";
import { renderOverviewPanel } from "../extensions/dashboard/panels/overview.js";
import type { DashboardSessionSnapshot } from "../extensions/dashboard/types.js";

function makeSnapshot(overrides: Partial<DashboardSessionSnapshot> = {}): DashboardSessionSnapshot {
  return {
    activePathHint: null,
    delegationLogs: [],
    ...overrides,
  };
}

describe("dashboard overview panel", () => {
  it("renders full overview data from existing projections", () => {
    expect(renderOverviewPanel(makeSnapshot({
      activePathHint: {
        team: "build-team",
        state: "testing",
        agent: "specialist_tester",
      },
      latestResultStatus: "success",
      totalTokenUsage: {
        inputTokens: 100,
        outputTokens: 23,
        totalTokens: 123,
      },
      worklistSummary: {
        totalItems: 5,
        statusCounts: {
          pending: 0,
          in_progress: 1,
          completed: 3,
          blocked: 1,
          abandoned: 0,
        },
        blockedItems: [
          {
            id: "blocked-task",
            description: "Blocked task",
            blockReason: "Waiting on reviewer",
          },
        ],
        isComplete: false,
        hasBlockers: true,
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
        stateTrace: [],
        specialistSummaries: [],
        outcome: {
          status: "success",
        },
        metrics: {
          totalTransitions: 4,
          loopCount: 0,
          retryCount: 0,
          totalDurationMs: 300000,
          revisionCount: 0,
          totalTokenUsage: {
            inputTokens: 100,
            outputTokens: 23,
            totalTokens: 123,
          },
        },
      },
    }))).toEqual([
      "Dashboard Overview",
      "Status: completed",
      "Active Path: build-team > testing > tester",
      "Work Progress: 5 total | 3 done | 2 remaining | 1 blocked",
      "Signals: blockers=yes | escalation=no",
      "Tokens: 123",
      "Outcome: success",
    ]);
  });

  it("handles missing optional data gracefully", () => {
    expect(renderOverviewPanel(makeSnapshot({
      startedAt: "2026-04-03T12:00:00.000Z",
    }))).toEqual([
      "Dashboard Overview",
      "Status: running",
      "Active Path: unavailable",
      "Work Progress: unavailable",
      "Signals: blockers=no | escalation=no",
      "Tokens: 0",
      "Outcome: pending",
    ]);
  });
});

describe("dashboard command", () => {
  it("registers the dashboard command with the expected name", () => {
    const registerCommand = vi.fn();

    dashboardExtension({
      registerCommand,
      on: vi.fn(),
    } as any);

    expect(registerCommand).toHaveBeenCalledWith(
      "dashboard",
      expect.objectContaining({
        description: expect.stringContaining("dashboard inspector overview"),
        handler: expect.any(Function),
      })
    );
  });

  it("reconstructs the current snapshot and notifies the overview", async () => {
    const notify = vi.fn();

    await runDashboardCommand("", {
      ui: { notify },
      sessionManager: {
        getBranch: () => [
          {
            type: "custom",
            customType: "worklist_session",
            data: {
              summary: {
                totalItems: 2,
                statusCounts: {
                  pending: 0,
                  in_progress: 0,
                  completed: 2,
                  blocked: 0,
                  abandoned: 0,
                },
                blockedItems: [],
                isComplete: true,
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
              stateTrace: [
                {
                  state: "testing",
                  agent: "specialist_tester",
                  resultStatus: "success",
                  transitionTo: "done",
                  enteredAt: "2026-04-03T12:01:00.000Z",
                  completedAt: "2026-04-03T12:02:00.000Z",
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
                totalDurationMs: 120000,
                revisionCount: 0,
                totalTokenUsage: {
                  inputTokens: 20,
                  outputTokens: 5,
                  totalTokens: 25,
                },
              },
            },
          },
        ],
      },
    } as any);

    expect(notify).toHaveBeenCalledWith(
      [
        "Dashboard Overview",
        "Status: completed",
        "Active Path: build-team > testing > tester",
        "Work Progress: 2 total | 2 done | 0 remaining",
        "Signals: blockers=no | escalation=no",
        "Tokens: 25",
        "Outcome: success",
      ].join("\n"),
      "info"
    );
  });
});
