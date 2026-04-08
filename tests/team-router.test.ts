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

  it("executes full happy path: planning → building → testing → rebuilding → review → done", async () => {
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
        summary: "Authored focused tests",
        deliverables: ["Added auth error-path assertions"],
        modifiedFiles: ["tests/index.test.ts"],
        testStrategy: "Cover the error-path before broad regression",
        testCasesAuthored: ["returns typed auth error"],
        executionCommands: ["make test -- tests/index.test.ts"],
        expectedPassConditions: ["auth error-path test passes"],
        coverageNotes: ["success-path smoke coverage remains unchanged"],
      }))
      .mockResolvedValueOnce(makeOutput({
        status: "success",
        summary: "Ran tester-authored checks and fixed edge handling",
        deliverables: ["Implemented final fix pass"],
        modifiedFiles: ["src/index.ts"],
        changeDescription: "Ran tester-authored checks and fixed edge handling",
        testExecutionResults: ["make test -- tests/index.test.ts -> pass"],
      }))
      .mockResolvedValueOnce(makeOutput({
        status: "success",
        summary: "Review passed",
        deliverables: ["No issues found"],
        modifiedFiles: [],
        verdict: "approve",
        findings: [],
      }));

    const { executeTeam } = await setupTeamRouter(mockSpawn);
    const result = await executeTeam(BUILD_TEAM, makeTeamTaskPacket());

    expect(result.success).toBe(true);
    expect(result.resultPacket.status).toBe("success");
    expect(result.resultPacket.sourceAgent).toBe("team_build-team");
    expect(result.statesVisited).toEqual(["planning", "building", "testing", "rebuilding", "review", "done"]);
    expect(mockSpawn).toHaveBeenCalledTimes(5);
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
        summary: "Authored focused tests",
        deliverables: ["fallback tester summary"],
        modifiedFiles: ["tests/index.test.ts"],
        testStrategy: "Exercise the scoped feature path first",
        testCasesAuthored: ["feature path returns scoped result"],
        executionCommands: ["make test -- tests/index.test.ts"],
        expectedPassConditions: ["feature test passes"],
        coverageNotes: ["integration path still manual"],
      }))
      .mockResolvedValueOnce(makeOutput({
        status: "success",
        summary: "Ran tester-authored checks and finalized the implementation",
        deliverables: ["fallback rebuild summary"],
        modifiedFiles: ["src/index.ts"],
        changeDescription: "Ran tester-authored checks and finalized the implementation",
        testExecutionResults: ["make test -- tests/index.test.ts -> pass"],
      }))
      .mockResolvedValueOnce(makeOutput({
        status: "success",
        summary: "Review passed",
        deliverables: [],
        modifiedFiles: [],
        verdict: "approve",
        findings: [],
      }));

    const { executeTeam } = await setupTeamRouter(mockSpawn);
    const result = await executeTeam(BUILD_TEAM, makeTeamTaskPacket());

    const builderTaskPrompt: string = mockSpawn.mock.calls[1][1];
    expect(builderTaskPrompt).toContain("planSteps");
    expect(builderTaskPrompt).toContain("step-1: scaffold");
    expect(builderTaskPrompt).not.toContain("fallback step");

    const testerTaskPrompt: string = mockSpawn.mock.calls[2][1];
    expect(testerTaskPrompt).toContain("implementationSummary");
    expect(testerTaskPrompt).toContain("Implemented the feature with scoped edits");

    const rebuildingTaskPrompt: string = mockSpawn.mock.calls[3][1];
    expect(rebuildingTaskPrompt).toContain("testStrategy");
    expect(rebuildingTaskPrompt).toContain("Exercise the scoped feature path first");
    expect(rebuildingTaskPrompt).toContain("executionCommands");
    expect(rebuildingTaskPrompt).toContain("make test -- tests/index.test.ts");
    expect(rebuildingTaskPrompt).toContain("testFiles");
    expect(rebuildingTaskPrompt).toContain("tests/index.test.ts");

    const reviewTaskPrompt: string = mockSpawn.mock.calls[4][1];
    expect(reviewTaskPrompt).toContain("implementationSummary");
    expect(reviewTaskPrompt).toContain("Ran tester-authored checks and finalized the implementation");
    expect(reviewTaskPrompt).toContain("testExecutionResults");
    expect(reviewTaskPrompt).toContain("make test -- tests/index.test.ts -> pass");
    expect(reviewTaskPrompt).toContain("executionCommands");

    expect(result.sessionArtifact?.stepArtifacts[0].validatedOutput.steps).toEqual([
      "step-1: scaffold",
      "step-2: implement",
    ]);
    expect(result.sessionArtifact?.stepArtifacts[2].validatedOutput).toEqual({
      testStrategy: "Exercise the scoped feature path first",
      testCasesAuthored: ["feature path returns scoped result"],
      executionCommands: ["make test -- tests/index.test.ts"],
      expectedPassConditions: ["feature test passes"],
      coverageNotes: ["integration path still manual"],
    });
    expect(result.sessionArtifact?.taskPacketLineage).toHaveLength(6);
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
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Built", deliverables: ["done"], modifiedFiles: ["x.ts"], changeDescription: "Implemented the requested fix" }))
      // Tester authors tests
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Authored tests", deliverables: ["pass"], modifiedFiles: ["tests/x.test.ts"], testStrategy: "Target the regression path", testCasesAuthored: ["regression stays fixed"], executionCommands: ["make test -- tests/x.test.ts"], expectedPassConditions: ["regression test passes"], coverageNotes: ["full suite not rerun"] }))
      // Builder verification pass
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Verified build", deliverables: ["pass"], modifiedFiles: ["x.ts"], changeDescription: "Ran the authored regression and verified the fix", testExecutionResults: ["make test -- tests/x.test.ts -> pass"] }))
      // Review passes
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Review ok", deliverables: ["ok"], modifiedFiles: [], verdict: "approve", findings: [] }));

    const { executeTeam } = await setupTeamRouter(mockSpawn);
    const result = await executeTeam(BUILD_TEAM, makeTeamTaskPacket());

    expect(result.success).toBe(true);
    expect(result.statesVisited).toContain("planning");
    expect(result.iterationsUsed["building->planning"]).toBe(1);
    expect(mockSpawn).toHaveBeenCalledTimes(7);
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

  it("executes revision loop: review fails after tester handoff → rebuild → review succeeds", async () => {
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
        changeDescription: "Built feature v1",
      }))
      // Tester authors tests
      .mockResolvedValueOnce(makeOutput({
        status: "success",
        summary: "Authored tests",
        deliverables: ["Added regression assertions"],
        modifiedFiles: ["tests/index.test.ts"],
        testStrategy: "Cover the missing error path",
        testCasesAuthored: ["returns typed error on failure"],
        executionCommands: ["make test -- tests/index.test.ts"],
        expectedPassConditions: ["error-path regression passes"],
        coverageNotes: ["success path not expanded"],
      }))
      // First builder verification pass
      .mockResolvedValueOnce(makeOutput({
        status: "success",
        summary: "Verified build v1",
        deliverables: ["Added handler", "Added error handling"],
        modifiedFiles: ["src/index.ts"],
        changeDescription: "Ran authored tests and added error handling",
        testExecutionResults: ["make test -- tests/index.test.ts -> fail, then pass"],
      }))
      // First review — fails, loops back to rebuilding
      .mockResolvedValueOnce(makeOutput({
        status: "failure",
        summary: "Build has gaps",
        deliverables: ["Missing error handling"],
        modifiedFiles: [],
        verdict: "request_changes",
        findings: [
          {
            id: "F1",
            priority: "major",
            category: "correctness",
            title: "Missing error handling",
            explanation: "The unhappy path still needs explicit handling.",
            evidence: "Error branch returns a generic failure.",
            suggestedAction: "Handle the error path explicitly.",
          },
        ],
      }))
      // Rebuild after review failure
      .mockResolvedValueOnce(makeOutput({
        status: "success",
        summary: "Verified build v2",
        deliverables: ["All checks pass"],
        modifiedFiles: ["src/index.ts"],
        changeDescription: "Applied review feedback and reran the authored tests",
        testExecutionResults: ["make test -- tests/index.test.ts -> pass"],
      }))
      // Second review — passes
      .mockResolvedValueOnce(makeOutput({
        status: "success",
        summary: "Review passed",
        deliverables: ["Looks good"],
        modifiedFiles: [],
        verdict: "approve",
        findings: [],
      }));

    const { executeTeam } = await setupTeamRouter(mockSpawn);
    const result = await executeTeam(BUILD_TEAM, makeTeamTaskPacket());

    expect(result.success).toBe(true);
    expect(result.resultPacket.status).toBe("success");
    expect(result.statesVisited).toEqual([
      "planning",
      "building",
      "testing",
      "rebuilding",
      "review",
      "rebuilding",
      "review",
      "done",
    ]);
    expect(mockSpawn).toHaveBeenCalledTimes(7);
  });

  it("escalates when revision loop is exhausted", async () => {
    const mockSpawn = vi.fn()
      // Plan 1
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Plan 1", deliverables: ["s1"], modifiedFiles: [] }))
      // Build 1
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Build 1", deliverables: ["done"], modifiedFiles: ["x.ts"], changeDescription: "Build 1" }))
      // Tester
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Authored tests", deliverables: ["pass"], modifiedFiles: ["tests/x.test.ts"], testStrategy: "Regression first", testCasesAuthored: ["behavior stays fixed"], executionCommands: ["make test -- tests/x.test.ts"], expectedPassConditions: ["regression passes"], coverageNotes: ["broader integration omitted"] }))
      // Rebuild 1
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Rebuild 1", deliverables: ["done"], modifiedFiles: ["x.ts"], changeDescription: "Rebuild 1", testExecutionResults: ["make test -- tests/x.test.ts -> pass"] }))
      // Review 1 — fail (loop iteration 1)
      .mockResolvedValueOnce(makeOutput({ status: "failure", summary: "Reject 1", deliverables: [], modifiedFiles: [], verdict: "request_changes", findings: [] }))
      // Rebuild 2
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Rebuild 2", deliverables: ["done"], modifiedFiles: ["x.ts"], changeDescription: "Rebuild 2", testExecutionResults: ["make test -- tests/x.test.ts -> pass"] }))
      // Review 2 — fail (loop iteration 2 = maxIterations)
      .mockResolvedValueOnce(makeOutput({ status: "failure", summary: "Reject 2", deliverables: [], modifiedFiles: [], verdict: "request_changes", findings: [] }))
      // Rebuild 3
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Rebuild 3", deliverables: ["done"], modifiedFiles: ["x.ts"], changeDescription: "Rebuild 3", testExecutionResults: ["make test -- tests/x.test.ts -> pass"] }))
      // Review 3 — fail (should trigger exhaustion)
      .mockResolvedValueOnce(makeOutput({ status: "failure", summary: "Reject 3", deliverables: [], modifiedFiles: [], verdict: "request_changes", findings: [] }));

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
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Built", deliverables: ["done"], modifiedFiles: ["a.ts"], changeDescription: "Built feature" }))
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Authored tests", deliverables: ["pass"], modifiedFiles: ["tests/a.test.ts"], testStrategy: "Regression first", testCasesAuthored: ["covers behavior"], executionCommands: ["make test -- tests/a.test.ts"], expectedPassConditions: ["test passes"], coverageNotes: ["integration omitted"] }))
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Verified", deliverables: ["pass"], modifiedFiles: ["b.ts"], changeDescription: "Verified build", testExecutionResults: ["make test -- tests/a.test.ts -> pass"] }))
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Reviewed", deliverables: ["ok"], modifiedFiles: [], verdict: "approve", findings: [] }));

    const { executeTeam } = await setupTeamRouter(mockSpawn);
    const result = await executeTeam(BUILD_TEAM, makeTeamTaskPacket());

    expect(result.resultPacket.modifiedFiles).toEqual(expect.arrayContaining(["a.ts", "b.ts", "tests/a.test.ts"]));
    expect(result.resultPacket.modifiedFiles).toHaveLength(3);
  });

  it("tracks iteration counts in result", async () => {
    const mockSpawn = vi.fn()
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Plan", deliverables: ["s1"], modifiedFiles: [] }))
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Built", deliverables: ["done"], modifiedFiles: ["x.ts"], changeDescription: "Built v1" }))
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Authored tests", deliverables: ["pass"], modifiedFiles: ["tests/x.test.ts"], testStrategy: "Regression first", testCasesAuthored: ["covers behavior"], executionCommands: ["make test -- tests/x.test.ts"], expectedPassConditions: ["test passes"], coverageNotes: ["integration omitted"] }))
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Verified", deliverables: ["done"], modifiedFiles: ["x.ts"], changeDescription: "Verified v1", testExecutionResults: ["make test -- tests/x.test.ts -> pass"] }))
      .mockResolvedValueOnce(makeOutput({ status: "failure", summary: "Reject", deliverables: [], modifiedFiles: [], verdict: "request_changes", findings: [] }))
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Verified 2", deliverables: ["done"], modifiedFiles: ["x.ts"], changeDescription: "Verified v2", testExecutionResults: ["make test -- tests/x.test.ts -> pass"] }))
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Pass", deliverables: ["ok"], modifiedFiles: [], verdict: "approve", findings: [] }));

    const { executeTeam } = await setupTeamRouter(mockSpawn);
    const result = await executeTeam(BUILD_TEAM, makeTeamTaskPacket());

    expect(result.iterationsUsed["review->rebuilding"]).toBe(1);
  });

  it("handles tester partial results by looping into the post-tester builder pass", async () => {
    const mockSpawn = vi.fn()
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Plan", deliverables: ["s1"], modifiedFiles: [] }))
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Built", deliverables: ["done"], modifiedFiles: ["x.ts"], changeDescription: "Built v1" }))
      .mockResolvedValueOnce(makeOutput({ status: "partial", summary: "Some authored tests still depend on a missing seam", deliverables: ["add seam, then run focused tests"], modifiedFiles: ["tests/x.test.ts"], testStrategy: "Start with the blocked regression path", testCasesAuthored: ["blocked regression"], executionCommands: ["make test -- tests/x.test.ts"], coverageNotes: ["missing seam currently blocks full coverage"] }))
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Built 2", deliverables: ["done"], modifiedFiles: ["x.ts"], changeDescription: "Added seam and ran the authored test", testExecutionResults: ["make test -- tests/x.test.ts -> pass"] }))
      .mockResolvedValueOnce(makeOutput({ status: "success", summary: "Reviewed 2", deliverables: ["ok"], modifiedFiles: [], verdict: "approve", findings: [] }));

    const { executeTeam } = await setupTeamRouter(mockSpawn);
    const result = await executeTeam(BUILD_TEAM, makeTeamTaskPacket());
    const testerArtifact = result.sessionArtifact?.stepArtifacts[2];

    expect(result.success).toBe(true);
    expect(result.statesVisited).toEqual([
      "planning",
      "building",
      "testing",
      "rebuilding",
      "review",
      "done",
    ]);
    expect(result.iterationsUsed["testing->rebuilding"]).toBe(1);
    expect(testerArtifact?.status).toBe("partial");
    expect(testerArtifact?.editableFields).toEqual([
      "coverageNotes",
      "executionCommands",
      "expectedPassConditions",
      "testCasesAuthored",
      "testResults",
      "testStrategy",
    ]);
    expect(testerArtifact?.validatedOutput).toEqual({
      testStrategy: "Start with the blocked regression path",
      testCasesAuthored: ["blocked regression"],
      executionCommands: ["make test -- tests/x.test.ts"],
      coverageNotes: ["missing seam currently blocks full coverage"],
    });
    expect(testerArtifact?.contractErrors).toContain(
      "Partial output omitted required field 'expectedPassConditions'"
    );
  });

  it("rejects router-owned artifact fields even when a partial tester artifact preserves valid typed fields", async () => {
    const mockSpawn = vi.fn()
      .mockResolvedValueOnce(makeOutput({
        status: "success",
        summary: "Plan",
        deliverables: ["s1"],
        steps: ["step-1"],
        dependencies: [],
        risks: [],
        modifiedFiles: [],
      }))
      .mockResolvedValueOnce(makeOutput({
        status: "success",
        summary: "Built",
        deliverables: ["done"],
        modifiedFiles: ["x.ts"],
        changeDescription: "Built v1",
      }))
      .mockResolvedValueOnce(makeOutput({
        status: "partial",
        summary: "Authored tests but attempted to write a router-owned field",
        deliverables: ["add seam, then run focused tests"],
        modifiedFiles: ["tests/x.test.ts"],
        testStrategy: "Start with the blocked regression path",
        testCasesAuthored: ["blocked regression"],
        executionCommands: ["make test -- tests/x.test.ts"],
        coverageNotes: ["missing seam currently blocks full coverage"],
        artifactId: "attempted-overwrite",
      }));

    const { executeTeam } = await setupTeamRouter(mockSpawn);
    const result = await executeTeam(BUILD_TEAM, makeTeamTaskPacket());
    const testerArtifact = result.sessionArtifact?.stepArtifacts[2];

    expect(result.success).toBe(false);
    expect(result.resultPacket.status).toBe("failure");
    expect(result.resultPacket.summary).toContain("ownership/edit-scope violations");
    expect(result.resultPacket.summary).toContain("artifactId");
    expect(result.statesVisited).toEqual(["planning", "building", "testing"]);
    expect(result.sessionArtifact?.terminationReason).toBe("contract_violation");
    expect(testerArtifact?.status).toBe("partial");
    expect(testerArtifact?.validatedOutput).toEqual({
      testStrategy: "Start with the blocked regression path",
      testCasesAuthored: ["blocked regression"],
      executionCommands: ["make test -- tests/x.test.ts"],
      coverageNotes: ["missing seam currently blocks full coverage"],
    });
    expect(testerArtifact?.contractErrors).toContain(
      "Structured output field 'artifactId' is router-owned and cannot be written by the specialist"
    );
    expect(testerArtifact?.contractErrors).toContain(
      "Partial output omitted required field 'expectedPassConditions'"
    );
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
