import { describe, expect, it } from "vitest";
import { renderWidgetLines } from "../extensions/dashboard/widget.js";
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

describe("dashboard widget snapshot rendering", () => {
  it("renders idle state", () => {
    expect(renderWidgetLines(makeWidgetState({
      sessionStatus: "idle",
      activePath: null,
      worklistProgress: null,
      elapsedMs: 0,
      totalTokens: 0,
    }))).toEqual([
      "Status: idle",
      "Time: 0s | Tokens: 0",
    ]);
  });

  it("renders running early state", () => {
    expect(renderWidgetLines(makeWidgetState({
      activePath: {
        team: "build-team",
      },
      worklistProgress: null,
      elapsedMs: 4000,
      totalTokens: 0,
    }))).toEqual([
      "Status: running",
      "Team: build-team",
      "Time: 4s | Tokens: 0",
    ]);
  });

  it("renders running mid-flight state", () => {
    expect(renderWidgetLines(makeWidgetState())).toEqual([
      "Status: running",
      "Team: build-team",
      "State: review",
      "Agent: reviewer",
      "Work: 4 total | 2 done | 2 remaining",
      "Time: 1m 5s | Tokens: 1,234",
    ]);
  });

  it("renders running state with blockers", () => {
    expect(renderWidgetLines(makeWidgetState({
      hasBlockers: true,
      worklistProgress: {
        total: 5,
        completed: 2,
        remaining: 3,
        blocked: 2,
      },
      elapsedMs: 125000,
      totalTokens: 3200,
    }))).toEqual([
      "Status: running [blockers]",
      "Team: build-team",
      "State: review",
      "Agent: reviewer",
      "Work: 5 total | 2 done | 3 remaining | 2 blocked",
      "Time: 2m 5s | Tokens: 3,200",
    ]);
  });

  it("renders running state with escalation", () => {
    expect(renderWidgetLines(makeWidgetState({
      hasEscalation: true,
      elapsedMs: 130000,
      totalTokens: 1500,
    }))).toEqual([
      "Status: running [escalation]",
      "Team: build-team",
      "State: review",
      "Agent: reviewer",
      "Work: 4 total | 2 done | 2 remaining",
      "Time: 2m 10s | Tokens: 1,500",
    ]);
  });

  it("renders completed successfully state", () => {
    expect(renderWidgetLines(makeWidgetState({
      sessionStatus: "completed",
      activePath: {
        team: "build-team",
        state: "done",
        agent: "tester",
      },
      worklistProgress: {
        total: 4,
        completed: 4,
        remaining: 0,
        blocked: 0,
      },
      elapsedMs: 300000,
      totalTokens: 4500,
    }))).toEqual([
      "Status: completed",
      "Team: build-team",
      "State: done",
      "Agent: tester",
      "Work: 4 total | 4 done | 0 remaining",
      "Time: 5m 0s | Tokens: 4,500",
    ]);
  });

  it("renders failed state", () => {
    expect(renderWidgetLines(makeWidgetState({
      sessionStatus: "failed",
      activePath: {
        team: "build-team",
        state: "testing",
        agent: "tester",
      },
      worklistProgress: {
        total: 4,
        completed: 3,
        remaining: 1,
        blocked: 0,
      },
      elapsedMs: 210000,
      totalTokens: 2750,
    }))).toEqual([
      "Status: failed",
      "Team: build-team",
      "State: testing",
      "Agent: tester",
      "Work: 4 total | 3 done | 1 remaining",
      "Time: 3m 30s | Tokens: 2,750",
    ]);
  });

  it("renders escalated state", () => {
    expect(renderWidgetLines(makeWidgetState({
      sessionStatus: "escalated",
      hasBlockers: true,
      hasEscalation: true,
      activePath: {
        team: "build-team",
        state: "review",
        agent: "reviewer",
      },
      worklistProgress: {
        total: 4,
        completed: 2,
        remaining: 2,
        blocked: 1,
      },
      elapsedMs: 240000,
      totalTokens: 3900,
    }))).toEqual([
      "Status: escalated [blockers] [escalation]",
      "Team: build-team",
      "State: review",
      "Agent: reviewer",
      "Work: 4 total | 2 done | 2 remaining | 1 blocked",
      "Time: 4m 0s | Tokens: 3,900",
    ]);
  });
});
