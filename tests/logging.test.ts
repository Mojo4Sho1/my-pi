import { describe, it, expect, vi } from "vitest";
import { NULL_LOGGER, createPiLogger, computeTeamVersion } from "../extensions/shared/logging.js";
import type { DelegationLogEntry } from "../extensions/shared/logging.js";
import type { TeamDefinition } from "../extensions/shared/types.js";

describe("NULL_LOGGER", () => {
  it("log() does not throw", () => {
    expect(() => {
      NULL_LOGGER.log({
        timestamp: new Date().toISOString(),
        level: "info",
        event: "delegation_start",
        sourceAgent: "orchestrator",
        targetAgent: "specialist_builder",
        taskId: "task_1",
      });
    }).not.toThrow();
  });
});

describe("createPiLogger", () => {
  it("calls pi.appendEntry() with correct type and data", () => {
    const mockAppendEntry = vi.fn();
    const logger = createPiLogger({ appendEntry: mockAppendEntry });

    const entry: DelegationLogEntry = {
      timestamp: "2026-03-27T00:00:00.000Z",
      level: "info",
      event: "delegation_start",
      sourceAgent: "orchestrator",
      targetAgent: "specialist_builder",
      taskId: "task_1",
      summary: "Build the feature",
    };

    logger.log(entry);

    expect(mockAppendEntry).toHaveBeenCalledOnce();
    expect(mockAppendEntry).toHaveBeenCalledWith("delegation_log", entry);
  });

  it("passes through failure entries with all fields", () => {
    const mockAppendEntry = vi.fn();
    const logger = createPiLogger({ appendEntry: mockAppendEntry });

    const entry: DelegationLogEntry = {
      timestamp: "2026-03-27T00:00:00.000Z",
      level: "error",
      event: "delegation_error",
      sourceAgent: "orchestrator",
      targetAgent: "specialist_builder",
      taskId: "task_1",
      status: "failure",
      summary: "Process crashed",
      failureReason: "task_failure",
    };

    logger.log(entry);

    expect(mockAppendEntry).toHaveBeenCalledWith("delegation_log", entry);
    expect(mockAppendEntry.mock.calls[0][1].failureReason).toBe("task_failure");
  });
});

describe("computeTeamVersion", () => {
  const baseTeam: TeamDefinition = {
    id: "test-team",
    name: "Test Team",
    purpose: "Testing",
    members: ["specialist_planner", "specialist_builder"],
    entryContract: { fields: [] },
    exitContract: { fields: [] },
    entryPacketTypes: ["task"],
    exitPacketTypes: ["result"],
    activationConditions: [],
    escalationConditions: [],
    states: {
      startState: "plan",
      terminalStates: ["done"],
      states: {
        plan: {
          agent: "specialist_planner",
          transitions: [{ on: "success" as const, to: "done" }],
        },
        done: {
          agent: "orchestrator",
          transitions: [],
        },
      },
    },
  };

  it("returns deterministic hash for same definition", () => {
    const v1 = computeTeamVersion(baseTeam);
    const v2 = computeTeamVersion(baseTeam);
    expect(v1).toBe(v2);
  });

  it("returns version string with v0- prefix", () => {
    const version = computeTeamVersion(baseTeam);
    expect(version).toMatch(/^v0-[0-9a-f]+$/);
  });

  it("returns different hash when members change", () => {
    const modifiedTeam: TeamDefinition = {
      ...baseTeam,
      members: ["specialist_planner", "specialist_builder", "specialist_tester"],
    };
    expect(computeTeamVersion(baseTeam)).not.toBe(computeTeamVersion(modifiedTeam));
  });

  it("returns different hash when states change", () => {
    const modifiedTeam: TeamDefinition = {
      ...baseTeam,
      states: {
        ...baseTeam.states,
        terminalStates: ["done", "failed"],
      },
    };
    expect(computeTeamVersion(baseTeam)).not.toBe(computeTeamVersion(modifiedTeam));
  });

  it("is not affected by non-structural fields like purpose", () => {
    const modifiedTeam: TeamDefinition = {
      ...baseTeam,
      purpose: "A completely different purpose",
    };
    // purpose is not hashed, only id/members/states/contracts
    expect(computeTeamVersion(baseTeam)).toBe(computeTeamVersion(modifiedTeam));
  });
});
