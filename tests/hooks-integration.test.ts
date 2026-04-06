/**
 * Hook integration tests (Stage 5a.1b).
 *
 * Verifies that the orchestrator creates a registry and emits
 * session, command, and artifact hook events during execution.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHookRegistry } from "../extensions/shared/hooks.js";

interface OutputOverrides {
  status?: string;
  summary?: string;
  deliverables?: string[];
  modifiedFiles?: string[];
  tokenUsage?: { inputTokens: number; outputTokens: number; totalTokens: number };
}

function makeOutput(overrides: OutputOverrides = {}) {
  const json = JSON.stringify({
    status: overrides.status ?? "success",
    summary: overrides.summary ?? "Done",
    deliverables: overrides.deliverables ?? [],
    modifiedFiles: overrides.modifiedFiles ?? [],
  });
  return {
    exitCode: 0,
    finalText: `\`\`\`json\n${json}\n\`\`\``,
    stderr: "",
    tokenUsage: overrides.tokenUsage,
  };
}

async function setupOrchestrator(mockSpawn: ReturnType<typeof vi.fn>, registry = createHookRegistry()) {
  vi.doMock("../extensions/shared/subprocess.js", () => ({
    spawnSpecialistAgent: mockSpawn,
  }));
  vi.doMock("../extensions/shared/hooks.js", async () => {
    const actual = await vi.importActual("../extensions/shared/hooks.js");
    return {
      ...actual,
      createHookRegistry: vi.fn(() => registry),
    };
  });

  const mod = await import("../extensions/orchestrator/index.js");
  let execute: any;
  const mockPi = {
    registerTool: vi.fn((def: any) => {
      execute = def.execute;
    }),
    appendEntry: vi.fn(),
  };
  mod.default(mockPi as any);
  return { execute: execute as Function, mockPi, registry };
}

describe("hook integration", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("emits command, session, and artifact events for orchestrator execution", async () => {
    const registry = createHookRegistry();
    const events: string[] = [];
    const artifactTypes: string[] = [];
    const artifactPayloads = new Map<string, unknown[]>();

    registry.registerObserver("onCommandInvoked", () => {
      events.push("onCommandInvoked");
    });
    registry.registerObserver("onSessionStart", () => {
      events.push("onSessionStart");
    });
    registry.registerObserver("onArtifactWritten", (event) => {
      events.push("onArtifactWritten");
      const payload = event.payload as { artifactType: string; artifact?: unknown };
      artifactTypes.push(payload.artifactType);
      const existing = artifactPayloads.get(payload.artifactType) ?? [];
      existing.push(payload.artifact);
      artifactPayloads.set(payload.artifactType, existing);
    });
    registry.registerObserver("onSessionEnd", (event) => {
      events.push("onSessionEnd");
      const payload = event.payload as {
        totalTokenUsage?: { inputTokens: number; outputTokens: number; totalTokens: number };
      };
      expect(payload.totalTokenUsage).toEqual({
        inputTokens: 120,
        outputTokens: 40,
        totalTokens: 160,
      });
    });

    const mockSpawn = vi.fn()
      .mockResolvedValueOnce(makeOutput({
        summary: "Plan ready",
        tokenUsage: { inputTokens: 40, outputTokens: 10, totalTokens: 50 },
      }))
      .mockResolvedValueOnce(makeOutput({
        summary: "Built it",
        modifiedFiles: ["src/index.ts"],
        tokenUsage: { inputTokens: 80, outputTokens: 30, totalTokens: 110 },
      }));

    const { execute } = await setupOrchestrator(mockSpawn, registry);
    const result = await execute(
      "call-1",
      {
        task: "plan and implement the feature",
        relevantFiles: ["src/index.ts"],
      },
      undefined,
      undefined,
      {} as any,
    );

    expect(result.details.overallStatus).toBe("success");
    expect(events[0]).toBe("onCommandInvoked");
    expect(events[1]).toBe("onSessionStart");
    expect(events.at(-1)).toBe("onSessionEnd");
    expect(events.filter((event) => event === "onArtifactWritten").length).toBeGreaterThanOrEqual(3);
    expect(artifactTypes.filter((type) => type === "spawn_record")).toHaveLength(2);
    expect(artifactTypes).toContain("worklist_session");
    expect(artifactPayloads.get("worklist_session")?.[0]).toEqual({
      worklist: expect.any(Object),
      summary: expect.any(Object),
    });
  });

  it("includes the team session artifact in live artifact hook payloads for team runs", async () => {
    const registry = createHookRegistry();
    const artifactPayloads = new Map<string, unknown[]>();

    registry.registerObserver("onArtifactWritten", (event) => {
      const payload = event.payload as { artifactType: string; artifact?: unknown };
      const existing = artifactPayloads.get(payload.artifactType) ?? [];
      existing.push(payload.artifact);
      artifactPayloads.set(payload.artifactType, existing);
    });

    const mockSpawn = vi.fn()
      .mockResolvedValueOnce(makeOutput({
        summary: "Plan ready",
      }))
      .mockResolvedValueOnce(makeOutput({
        summary: "Review passed",
      }))
      .mockResolvedValueOnce(makeOutput({
        summary: "Built it",
        modifiedFiles: ["src/index.ts"],
      }))
      .mockResolvedValueOnce(makeOutput({
        summary: "Tests passed",
      }));

    const { execute } = await setupOrchestrator(mockSpawn, registry);
    const result = await execute(
      "call-2",
      {
        task: "build the feature via team",
        relevantFiles: ["src/index.ts"],
        teamHint: "build-team",
      },
      undefined,
      undefined,
      {} as any,
    );

    expect(result.details.overallStatus).toBe("success");
    expect(artifactPayloads.get("team_session")?.[0]).toEqual(expect.objectContaining({
      teamId: "build-team",
      outcome: expect.objectContaining({ status: "success" }),
    }));
  });
});
