/**
 * Stage 3d — Integration and end-to-end tests for the orchestrator.
 *
 * These tests exercise the orchestrator's execute() function end-to-end
 * with mocked subprocesses (spawnSpecialistAgent). Everything above the
 * subprocess layer — selection, delegation, context forwarding, synthesis —
 * runs for real.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface OutputOverrides {
  status?: string;
  summary?: string;
  deliverables?: string[];
  modifiedFiles?: string[];
  escalation?: { reason: string; suggestedAction: string };
}

/** Build a SubAgentResult that spawnSpecialistAgent would resolve with. */
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

/**
 * Mock spawnSpecialistAgent, dynamically import the orchestrator extension,
 * and capture the execute() function from pi.registerTool().
 */
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
  };
  mod.default(mockPi as any);
  return execute as (
    toolCallId: string,
    params: any,
    signal: AbortSignal | undefined,
    onUpdate: any,
    ctx: any,
  ) => Promise<any>;
}

/** Call the orchestrate execute function with sensible defaults. */
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

describe("orchestrator e2e", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  // =========================================================================
  // Full workflow integration
  // =========================================================================

  describe("full workflow integration", () => {
    it("planner + builder both succeed", async () => {
      const mockSpawn = vi.fn()
        .mockResolvedValueOnce(makeOutput({ summary: "Planned in 3 steps", deliverables: ["step1", "step2", "step3"] }))
        .mockResolvedValueOnce(makeOutput({ summary: "Built the feature", modifiedFiles: ["src/index.ts"] }));

      const execute = await setupOrchestrator(mockSpawn);
      const result = await callOrchestrate(execute);

      expect(mockSpawn).toHaveBeenCalledTimes(2);
      expect(result.details.overallStatus).toBe("success");
      expect(result.details.specialistsInvoked).toEqual(["specialist_planner", "specialist_builder"]);
      expect(result.details.results).toHaveLength(2);
      expect(result.content[0].text).toContain("Planned in 3 steps");
      expect(result.content[0].text).toContain("Built the feature");
    });

    it("planner -> builder -> tester all succeed", async () => {
      const mockSpawn = vi.fn()
        .mockResolvedValueOnce(makeOutput({ summary: "Plan ready" }))
        .mockResolvedValueOnce(makeOutput({ summary: "Code written", modifiedFiles: ["src/a.ts"] }))
        .mockResolvedValueOnce(makeOutput({ summary: "Tests pass" }));

      const execute = await setupOrchestrator(mockSpawn);
      const result = await callOrchestrate(execute, {
        task: "plan, implement, and test the feature",
      });

      expect(mockSpawn).toHaveBeenCalledTimes(3);
      expect(result.details.overallStatus).toBe("success");
      expect(result.details.specialistsInvoked).toHaveLength(3);
      expect(result.details.specialistsInvoked).toEqual([
        "specialist_planner",
        "specialist_builder",
        "specialist_tester",
      ]);
    });

    it("mid-chain failure: planner succeeds, builder fails, tester never invoked", async () => {
      const mockSpawn = vi.fn()
        .mockResolvedValueOnce(makeOutput({ summary: "Plan ready" }))
        .mockResolvedValueOnce(makeOutput({ status: "failure", summary: "Could not build" }));

      const execute = await setupOrchestrator(mockSpawn);
      const result = await callOrchestrate(execute, {
        task: "plan, implement, and test the feature",
      });

      expect(mockSpawn).toHaveBeenCalledTimes(2);
      expect(result.details.overallStatus).toBe("partial");
      expect(result.details.results).toHaveLength(2);
      expect(result.details.results[0].status).toBe("success");
      expect(result.details.results[1].status).toBe("failure");
    });

    it("escalation stops chain: planner returns escalation", async () => {
      const mockSpawn = vi.fn()
        .mockResolvedValueOnce(makeOutput({
          status: "escalation",
          summary: "Scope too broad",
          escalation: { reason: "scope exceeded", suggestedAction: "narrow scope" },
        }));

      const execute = await setupOrchestrator(mockSpawn);
      const result = await callOrchestrate(execute);

      expect(mockSpawn).toHaveBeenCalledTimes(1);
      expect(result.details.overallStatus).toBe("escalation");
      expect(result.details.results[0].escalation?.reason).toBe("scope exceeded");
    });

    it("reviewer rejection: planner succeeds, reviewer fails", async () => {
      const mockSpawn = vi.fn()
        .mockResolvedValueOnce(makeOutput({ summary: "Plan ready" }))
        .mockResolvedValueOnce(makeOutput({ status: "failure", summary: "Code quality issues" }));

      const execute = await setupOrchestrator(mockSpawn);
      const result = await callOrchestrate(execute, {
        task: "plan and review the architecture",
      });

      expect(mockSpawn).toHaveBeenCalledTimes(2);
      expect(result.details.overallStatus).toBe("partial");
    });
  });

  // =========================================================================
  // Context forwarding
  // =========================================================================

  describe("context forwarding", () => {
    it("builder receives planner plan in context field", async () => {
      const mockSpawn = vi.fn()
        .mockResolvedValueOnce(makeOutput({
          summary: "3-step plan",
          deliverables: ["step-1: scaffold", "step-2: implement", "step-3: wire up"],
        }))
        .mockResolvedValueOnce(makeOutput({ summary: "Built it" }));

      const execute = await setupOrchestrator(mockSpawn);
      await callOrchestrate(execute);

      // Second call is builder — inspect its task prompt (arg index 1)
      const builderTaskPrompt: string = mockSpawn.mock.calls[1][1];
      expect(builderTaskPrompt).toContain("Additional context:");
      expect(builderTaskPrompt).toContain("planSummary");
      expect(builderTaskPrompt).toContain("3-step plan");
      expect(builderTaskPrompt).toContain("planDeliverables");
      expect(builderTaskPrompt).toContain("step-1: scaffold");
    });

    it("tester receives builder modifiedFiles and summary in context", async () => {
      const mockSpawn = vi.fn()
        .mockResolvedValueOnce(makeOutput({ summary: "Plan ready" }))
        .mockResolvedValueOnce(makeOutput({
          summary: "Built the auth module",
          modifiedFiles: ["src/auth.ts", "src/login.ts"],
        }))
        .mockResolvedValueOnce(makeOutput({ summary: "Tests pass" }));

      const execute = await setupOrchestrator(mockSpawn);
      await callOrchestrate(execute, {
        task: "plan, implement, and test the feature",
      });

      // Third call is tester
      const testerTaskPrompt: string = mockSpawn.mock.calls[2][1];
      expect(testerTaskPrompt).toContain("Additional context:");
      expect(testerTaskPrompt).toContain("modifiedFiles");
      expect(testerTaskPrompt).toContain("src/auth.ts");
      expect(testerTaskPrompt).toContain("implementationSummary");
      expect(testerTaskPrompt).toContain("Built the auth module");
    });

    it("first specialist (planner) receives no context", async () => {
      const mockSpawn = vi.fn()
        .mockResolvedValueOnce(makeOutput({ summary: "Plan ready" }))
        .mockResolvedValueOnce(makeOutput({ summary: "Built it" }));

      const execute = await setupOrchestrator(mockSpawn);
      await callOrchestrate(execute);

      // First call is planner
      const plannerTaskPrompt: string = mockSpawn.mock.calls[0][1];
      expect(plannerTaskPrompt).not.toContain("Additional context:");
    });
  });

  // =========================================================================
  // Boundary enforcement
  // =========================================================================

  describe("boundary enforcement", () => {
    it("read-only specialists (planner, reviewer) receive empty allowedWriteSet", async () => {
      const mockSpawn = vi.fn()
        .mockResolvedValueOnce(makeOutput({ summary: "Plan ready" }))
        .mockResolvedValueOnce(makeOutput({ summary: "Review done" }));

      const execute = await setupOrchestrator(mockSpawn);
      await callOrchestrate(execute, {
        task: "plan and review the architecture",
        relevantFiles: ["src/index.ts", "src/utils.ts"],
      });

      // Both planner and reviewer are read-only
      const plannerTaskPrompt: string = mockSpawn.mock.calls[0][1];
      const reviewerTaskPrompt: string = mockSpawn.mock.calls[1][1];

      // The write set line should be empty (no files listed after the label)
      expect(plannerTaskPrompt).toContain("Allowed write set: \n");
      expect(reviewerTaskPrompt).toContain("Allowed write set: \n");
    });

    it("builder and tester receive allowedWriteSet matching relevantFiles", async () => {
      const mockSpawn = vi.fn()
        .mockResolvedValueOnce(makeOutput({ summary: "Plan ready" }))
        .mockResolvedValueOnce(makeOutput({ summary: "Built it", modifiedFiles: ["src/a.ts"] }))
        .mockResolvedValueOnce(makeOutput({ summary: "Tests pass" }));

      const execute = await setupOrchestrator(mockSpawn);
      await callOrchestrate(execute, {
        task: "plan, implement, and test the feature",
        relevantFiles: ["src/a.ts", "src/b.ts"],
      });

      // Planner (read-only) should NOT have files in write set
      const plannerTaskPrompt: string = mockSpawn.mock.calls[0][1];
      expect(plannerTaskPrompt).toContain("Allowed write set: \n");

      // Builder should have files in write set
      const builderTaskPrompt: string = mockSpawn.mock.calls[1][1];
      expect(builderTaskPrompt).toContain("Allowed write set: src/a.ts, src/b.ts");

      // Tester should have files in write set
      const testerTaskPrompt: string = mockSpawn.mock.calls[2][1];
      expect(testerTaskPrompt).toContain("Allowed write set: src/a.ts, src/b.ts");
    });

    it("each specialist task packet has correct targetAgent", async () => {
      const mockSpawn = vi.fn()
        .mockResolvedValueOnce(makeOutput({ summary: "Plan ready" }))
        .mockResolvedValueOnce(makeOutput({ summary: "Built it" }));

      const execute = await setupOrchestrator(mockSpawn);
      await callOrchestrate(execute);

      // System prompt (arg 0) contains the specialist ID
      const plannerSystemPrompt: string = mockSpawn.mock.calls[0][0];
      const builderSystemPrompt: string = mockSpawn.mock.calls[1][0];

      expect(plannerSystemPrompt).toContain("specialist_planner");
      expect(builderSystemPrompt).toContain("specialist_builder");
    });
  });

  // =========================================================================
  // Error handling
  // =========================================================================

  describe("error handling", () => {
    it("subprocess spawn throws -> orchestrator returns failure", async () => {
      const mockSpawn = vi.fn()
        .mockRejectedValueOnce(new Error("ENOENT: pi not found"));

      const execute = await setupOrchestrator(mockSpawn);
      const result = await callOrchestrate(execute, {
        delegationHint: "builder",
      });

      expect(mockSpawn).toHaveBeenCalledTimes(1);
      expect(result.details.overallStatus).toBe("failure");
      expect(result.details.results[0].summary).toContain("failed to start");
      expect(result.details.results[0].summary).toContain("ENOENT");
    });

    it("subprocess exits non-zero with no output -> failure with stderr", async () => {
      const mockSpawn = vi.fn()
        .mockResolvedValueOnce({ exitCode: 1, finalText: "", stderr: "Segmentation fault" });

      const execute = await setupOrchestrator(mockSpawn);
      const result = await callOrchestrate(execute, {
        delegationHint: "builder",
      });

      expect(result.details.overallStatus).toBe("failure");
      expect(result.details.results[0].summary).toContain("exited with code 1");
      expect(result.details.results[0].summary).toContain("Segmentation fault");
    });

    it("malformed specialist output (no JSON) -> status partial", async () => {
      const mockSpawn = vi.fn()
        .mockResolvedValueOnce({
          exitCode: 0,
          finalText: "I did some work but forgot the JSON block",
          stderr: "",
        });

      const execute = await setupOrchestrator(mockSpawn);
      const result = await callOrchestrate(execute, {
        delegationHint: "builder",
      });

      expect(result.details.overallStatus).toBe("partial");
    });

    it("malformed output (partial) does not stop the chain", async () => {
      // Planner returns no JSON → parsed as "partial"
      // "partial" is NOT failure/escalation, so chain continues to builder
      const mockSpawn = vi.fn()
        .mockResolvedValueOnce({
          exitCode: 0,
          finalText: "Here is my plan but I forgot JSON",
          stderr: "",
        })
        .mockResolvedValueOnce(makeOutput({ summary: "Built it" }));

      const execute = await setupOrchestrator(mockSpawn);
      const result = await callOrchestrate(execute);

      expect(mockSpawn).toHaveBeenCalledTimes(2);
      expect(result.details.overallStatus).toBe("partial");
      expect(result.details.results).toHaveLength(2);
      expect(result.details.results[0].status).toBe("partial");
      expect(result.details.results[1].status).toBe("success");
    });
  });
});
