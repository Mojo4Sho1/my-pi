import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTaskPacket } from "../extensions/shared/packets.js";
import type { TaskPacket } from "../extensions/shared/types.js";
import { BUILD_TEAM } from "../extensions/teams/definitions.js";

describe("executeTeam", () => {
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

  async function setupTeamRouter(
    mockSpawn: ReturnType<typeof vi.fn>,
  ) {
    vi.doMock("../extensions/shared/subprocess.js", () => ({
      spawnSpecialistAgent: mockSpawn,
    }));

    const { executeTeam } = await import("../extensions/teams/router.js");
    return { executeTeam };
  }

  it("executes full happy path: planning → building → review → testing → done", async () => {
    const mockSpawn = vi.fn()
      .mockResolvedValueOnce(makeOutput({
        status: "success",
        summary: "Plan created",
        deliverables: ["step-1", "step-2"],
        steps: ["step-1", "step-2"],
        dependencies: ["step-2 depends on step-1"],
        risks: ["integration mismatch"],
        modifiedFiles: [],
      }))
      .mockResolvedValueOnce(makeOutput({
        status: "success",
        summary: "Built feature",
        deliverables: ["Added handler"],
        modifiedFiles: ["src/index.ts"],
        changeDescription: "Built feature with handler wiring",
      }))
      .mockResolvedValueOnce(makeOutput({
        status: "success",
        summary: "Review passed",
        deliverables: ["No issues found"],
        modifiedFiles: [],
        verdict: "approve",
        findings: [],
      }))
      .mockResolvedValueOnce(makeOutput({
        status: "success",
        summary: "Tests pass",
        deliverables: ["All checks pass"],
        modifiedFiles: [],
        passed: true,
        evidence: ["targeted tests green"],
        failures: [],
      }));

    const { executeTeam } = await setupTeamRouter(mockSpawn);
    const result = await executeTeam(BUILD_TEAM, makeTeamTaskPacket());

    expect(result.success).toBe(true);
    expect(result.resultPacket.status).toBe("success");
    expect(result.resultPacket.sourceAgent).toBe("team_build-team");
    expect(result.statesVisited).toEqual(["planning", "building", "review", "testing", "done"]);
    expect(mockSpawn).toHaveBeenCalledTimes(4);
    expect(result.sessionArtifact?.specialistSummaries.every((summary) => summary.contractSatisfied)).toBe(true);
  });

  it("builds downstream team context from preserved structured payload fields", async () => {
    const mockSpawn = vi.fn()
      .mockResolvedValueOnce(makeOutput({
        status: "success",
        summary: "Plan created",
        deliverables: ["fallback step"],
        steps: ["step-1: scaffold", "step-2: implement"],
        dependencies: ["step-2 depends on step-1"],
        risks: ["watch migrations"],
        modifiedFiles: [],
      }))
      .mockResolvedValueOnce(makeOutput({
        status: "success",
        summary: "Built feature",
        deliverables: ["fallback build summary"],
        modifiedFiles: ["src/index.ts"],
        changeDescription: "Implemented the feature with scoped edits",
      }))
      .mockResolvedValueOnce(makeOutput({
        status: "success",
        summary: "Review passed",
        deliverables: [],
        modifiedFiles: [],
        verdict: "approve",
        findings: [],
      }))
      .mockResolvedValueOnce(makeOutput({
        status: "success",
        summary: "Tests pass",
        deliverables: [],
        modifiedFiles: [],
        passed: true,
        evidence: ["targeted checks pass"],
        failures: [],
      }));

    const { executeTeam } = await setupTeamRouter(mockSpawn);
    const result = await executeTeam(BUILD_TEAM, makeTeamTaskPacket());

    const builderTaskPrompt: string = mockSpawn.mock.calls[1][1];
    expect(builderTaskPrompt).toContain("planSteps");
    expect(builderTaskPrompt).toContain("step-1: scaffold");
    expect(builderTaskPrompt).not.toContain("fallback step");

    const reviewTaskPrompt: string = mockSpawn.mock.calls[2][1];
    expect(reviewTaskPrompt).toContain("implementationSummary");
    expect(reviewTaskPrompt).toContain("Implemented the feature with scoped edits");

    const testerTaskPrompt: string = mockSpawn.mock.calls[3][1];
    expect(testerTaskPrompt).toContain("implementationSummary");
    expect(testerTaskPrompt).toContain("Implemented the feature with scoped edits");
    expect(result.sessionArtifact?.stepArtifacts[0].validatedOutput.steps).toEqual([
      "step-1: scaffold",
      "step-2: implement",
    ]);
    expect(result.sessionArtifact?.taskPacketLineage).toHaveLength(5);
  });

  it("rejects unauthorized specialist field writes before routing can continue", async () => {
    const mockSpawn = vi.fn()
      .mockResolvedValueOnce(makeOutput({
        status: "success",
        summary: "Plan created",
        deliverables: ["step-1"],
        steps: ["step-1"],
        dependencies: [],
        risks: [],
        artifactId: "attempted-overwrite",
        modifiedFiles: [],
      }));

    const { executeTeam } = await setupTeamRouter(mockSpawn);
    const result = await executeTeam(BUILD_TEAM, makeTeamTaskPacket());

    expect(result.success).toBe(false);
    expect(result.resultPacket.status).toBe("failure");
    expect(result.resultPacket.summary).toContain("ownership/edit-scope violations");
    expect(result.resultPacket.summary).toContain("artifactId");
    expect(result.statesVisited).toEqual(["planning"]);
    expect(result.sessionArtifact?.terminationReason).toBe("contract_violation");
    expect(result.sessionArtifact?.stepArtifacts[0].contractErrors).toContain(
      "Structured output field 'artifactId' is router-owned and cannot be written by the specialist"
    );
  });

  it("handles building failure with loop back to planning then eventual success", async () => {
    const mockSpawn = vi.fn()
      // Plan 1
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Plan 1", deliverables: ["s1"], modifiedFiles: [] }))
      // Build fails → loops to planning
      .mockResolvedValueOnce(makeOutput({ status: "failure", summary: "Build failed", deliverables: [], modifiedFiles: [] }))
      // Re-plan
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Plan 2", deliverables: ["s2"], modifiedFiles: [] }))
      // Build succeeds
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Built", deliverables: ["done"], modifiedFiles: ["x.ts"] }))
      // Review passes
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Review ok", deliverables: ["ok"], modifiedFiles: [] }))
      // Test passes
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Tests pass", deliverables: ["pass"], modifiedFiles: [] }));

    const { executeTeam } = await setupTeamRouter(mockSpawn);
    const result = await executeTeam(BUILD_TEAM, makeTeamTaskPacket());

    expect(result.success).toBe(true);
    expect(result.statesVisited).toContain("planning");
    expect(result.iterationsUsed["building->planning"]).toBe(1);
    expect(mockSpawn).toHaveBeenCalledTimes(6);
  });

  it("stops on escalation from any specialist", async () => {
    const mockSpawn = vi.fn()
      .mockResolvedValueOnce(makeOutput({
        status: "escalation",
        summary: "Scope too ambiguous",
        deliverables: [],
        modifiedFiles: [],
        escalation: { reason: "Scope ambiguous", suggestedAction: "Clarify requirements" },
      }));

    const { executeTeam } = await setupTeamRouter(mockSpawn);
    const result = await executeTeam(BUILD_TEAM, makeTeamTaskPacket());

    expect(result.success).toBe(false);
    expect(result.resultPacket.status).toBe("escalation");
    expect(result.statesVisited).toContain("planning");
    expect(result.statesVisited).toContain("failed");
    expect(mockSpawn).toHaveBeenCalledTimes(1);
  });

  it("handles planning failure going to terminal failed state", async () => {
    const mockSpawn = vi.fn()
      .mockResolvedValueOnce(makeOutput({
        status: "failure",
        summary: "Cannot plan this task",
        deliverables: [],
        modifiedFiles: [],
      }));

    const { executeTeam } = await setupTeamRouter(mockSpawn);
    const result = await executeTeam(BUILD_TEAM, makeTeamTaskPacket());

    expect(result.success).toBe(false);
    expect(result.resultPacket.status).toBe("failure");
    expect(result.statesVisited).toEqual(["planning", "failed"]);
    expect(mockSpawn).toHaveBeenCalledTimes(1);
  });

  it("executes revision loop: review fails → rebuild → review succeeds", async () => {
    const mockSpawn = vi.fn()
      // Plan
      .mockResolvedValueOnce(makeOutput({
        status: "success",
        summary: "Initial plan",
        deliverables: ["step-1"],
        modifiedFiles: [],
      }))
      // First build
      .mockResolvedValueOnce(makeOutput({
        status: "success",
        summary: "Built feature v1",
        deliverables: ["Added handler"],
        modifiedFiles: ["src/index.ts"],
      }))
      // First review — fails, loops back to building
      .mockResolvedValueOnce(makeOutput({
        status: "failure",
        summary: "Build has gaps",
        deliverables: ["Missing error handling"],
        modifiedFiles: [],
      }))
      // Rebuild after review failure
      .mockResolvedValueOnce(makeOutput({
        status: "success",
        summary: "Built feature v2",
        deliverables: ["Added handler", "Added error handling"],
        modifiedFiles: ["src/index.ts"],
      }))
      // Second review — passes
      .mockResolvedValueOnce(makeOutput({
        status: "success",
        summary: "Review passed",
        deliverables: ["Looks good"],
        modifiedFiles: [],
      }))
      // Test
      .mockResolvedValueOnce(makeOutput({
        status: "success",
        summary: "Tests pass",
        deliverables: ["All checks pass"],
        modifiedFiles: [],
      }));

    const { executeTeam } = await setupTeamRouter(mockSpawn);
    const result = await executeTeam(BUILD_TEAM, makeTeamTaskPacket());

    expect(result.success).toBe(true);
    expect(result.resultPacket.status).toBe("success");
    expect(result.statesVisited).toEqual([
      "planning", "building", "review", // first attempt
      "building", "review",             // revision loop
      "testing", "done",
    ]);
    expect(mockSpawn).toHaveBeenCalledTimes(6);
  });

  it("escalates when revision loop is exhausted", async () => {
    const mockSpawn = vi.fn()
      // Plan 1
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Plan 1", deliverables: ["s1"], modifiedFiles: [] }))
      // Build 1
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Build 1", deliverables: ["done"], modifiedFiles: ["x.ts"] }))
      // Review 1 — fail (loop iteration 1)
      .mockResolvedValueOnce(makeOutput({ status: "failure", summary: "Reject 1", deliverables: [], modifiedFiles: [] }))
      // Build 2
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Build 2", deliverables: ["done"], modifiedFiles: ["x.ts"] }))
      // Review 2 — fail (loop iteration 2 = maxIterations)
      .mockResolvedValueOnce(makeOutput({ status: "failure", summary: "Reject 2", deliverables: [], modifiedFiles: [] }))
      // Build 3
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Build 3", deliverables: ["done"], modifiedFiles: ["x.ts"] }))
      // Review 3 — fail (should trigger exhaustion)
      .mockResolvedValueOnce(makeOutput({ status: "failure", summary: "Reject 3", deliverables: [], modifiedFiles: [] }));

    const { executeTeam } = await setupTeamRouter(mockSpawn);
    const result = await executeTeam(BUILD_TEAM, makeTeamTaskPacket());

    expect(result.success).toBe(false);
    expect(result.resultPacket.status).toBe("escalation");
    expect(result.resultPacket.summary).toContain("exhausted");
    expect(result.resultPacket.escalation).toBeDefined();
  });

  it("returns team-level result with combined modified files", async () => {
    const mockSpawn = vi.fn()
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Planned", deliverables: ["s1"], modifiedFiles: [] }))
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Built", deliverables: ["done"], modifiedFiles: ["a.ts", "b.ts"] }))
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Reviewed", deliverables: ["ok"], modifiedFiles: [] }))
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Tested", deliverables: ["pass"], modifiedFiles: ["b.ts", "c.ts"] }));

    const { executeTeam } = await setupTeamRouter(mockSpawn);
    const result = await executeTeam(BUILD_TEAM, makeTeamTaskPacket());

    expect(result.resultPacket.modifiedFiles).toEqual(expect.arrayContaining(["a.ts", "b.ts", "c.ts"]));
    expect(result.resultPacket.modifiedFiles).toHaveLength(3); // deduplicated
  });

  it("tracks iteration counts in result", async () => {
    const mockSpawn = vi.fn()
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Plan", deliverables: ["s1"], modifiedFiles: [] }))
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Built", deliverables: ["done"], modifiedFiles: ["x.ts"] }))
      .mockResolvedValueOnce(makeOutput({ status: "failure", summary: "Reject", deliverables: [], modifiedFiles: [] }))
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Built 2", deliverables: ["done"], modifiedFiles: ["x.ts"] }))
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Pass", deliverables: ["ok"], modifiedFiles: [] }))
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Tested", deliverables: ["pass"], modifiedFiles: [] }));

    const { executeTeam } = await setupTeamRouter(mockSpawn);
    const result = await executeTeam(BUILD_TEAM, makeTeamTaskPacket());

    expect(result.iterationsUsed["review->building"]).toBe(1);
  });

  it("handles tester partial results by looping back to building", async () => {
    const mockSpawn = vi.fn()
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Plan", deliverables: ["s1"], modifiedFiles: [] }))
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Built", deliverables: ["done"], modifiedFiles: ["x.ts"] }))
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Reviewed", deliverables: ["ok"], modifiedFiles: [] }))
      .mockResolvedValueOnce(makeOutput({ status: "partial", summary: "Some checks still pending", deliverables: ["rerun targeted tests"], modifiedFiles: [] }))
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Built 2", deliverables: ["done"], modifiedFiles: ["x.ts"] }))
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Reviewed 2", deliverables: ["ok"], modifiedFiles: [] }))
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Tested", deliverables: ["pass"], modifiedFiles: [] }));

    const { executeTeam } = await setupTeamRouter(mockSpawn);
    const result = await executeTeam(BUILD_TEAM, makeTeamTaskPacket());

    expect(result.success).toBe(true);
    expect(result.statesVisited).toEqual([
      "planning",
      "building",
      "review",
      "testing",
      "building",
      "review",
      "testing",
      "done",
    ]);
    expect(result.iterationsUsed["testing->building"]).toBe(1);
  });

  it("handles subprocess spawn failure", async () => {
    const mockSpawn = vi.fn().mockRejectedValueOnce(new Error("ENOENT"));

    const { executeTeam } = await setupTeamRouter(mockSpawn);
    const result = await executeTeam(BUILD_TEAM, makeTeamTaskPacket());

    // The subprocess error is caught by delegateToSpecialist which returns a failure packet
    // That failure from planning → goes to "failed" terminal state
    expect(result.success).toBe(false);
    expect(result.resultPacket.status).toBe("failure");
  });

  it("rejects invalid team state machine", async () => {
    const mockSpawn = vi.fn();
    const { executeTeam } = await setupTeamRouter(mockSpawn);

    const invalidTeam = {
      ...BUILD_TEAM,
      states: {
        ...BUILD_TEAM.states,
        startState: "nonexistent",
      },
    };

    const result = await executeTeam(invalidTeam, makeTeamTaskPacket());
    expect(result.success).toBe(false);
    expect(result.resultPacket.status).toBe("failure");
    expect(result.resultPacket.summary).toContain("invalid state machine");
    expect(mockSpawn).not.toHaveBeenCalled();
  });
});
