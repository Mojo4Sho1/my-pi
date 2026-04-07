import { beforeEach, describe, expect, it } from "vitest";
import {
  GLOBAL_RUN_REGISTRY,
} from "../extensions/shared/run-registry.js";

describe("run registry", () => {
  beforeEach(() => {
    GLOBAL_RUN_REGISTRY.reset();
  });

  it("tracks explicit parent-child ownership and descendant traversal", () => {
    const parent = GLOBAL_RUN_REGISTRY.registerRun({
      kind: "orchestration",
      owner: "orchestrator",
      initialState: "active",
    });
    const child = GLOBAL_RUN_REGISTRY.registerRun({
      parentRunId: parent.id,
      kind: "delegation",
      owner: "specialist_builder",
      initialState: "active",
    });
    const grandchild = GLOBAL_RUN_REGISTRY.registerRun({
      parentRunId: child.id,
      kind: "subprocess",
      owner: "pi",
      initialState: "active",
    });

    expect(GLOBAL_RUN_REGISTRY.getDescendants(parent.id).map((run) => run.id)).toEqual([
      child.id,
      grandchild.id,
    ]);
    expect(GLOBAL_RUN_REGISTRY.getRunTree(child.id).map((run) => run.id)).toEqual([
      child.id,
      grandchild.id,
    ]);
  });

  it("waits for descendants to reach terminal state before reporting settled", async () => {
    const parent = GLOBAL_RUN_REGISTRY.registerRun({
      kind: "team_execution",
      owner: "team_build-team",
      initialState: "active",
    });
    const child = GLOBAL_RUN_REGISTRY.registerRun({
      parentRunId: parent.id,
      kind: "delegation",
      owner: "specialist_tester",
      initialState: "active",
    });

    setTimeout(() => {
      GLOBAL_RUN_REGISTRY.markSettled(child.id);
    }, 20);

    await expect(
      GLOBAL_RUN_REGISTRY.waitForDescendantsToSettle(parent.id, {
        timeoutMs: 200,
        pollMs: 5,
      })
    ).resolves.toBe(true);
  });

  it("identifies top-level active runs without duplicating active descendants", () => {
    const root = GLOBAL_RUN_REGISTRY.registerRun({
      kind: "orchestration",
      owner: "orchestrator",
      initialState: "active",
    });
    const child = GLOBAL_RUN_REGISTRY.registerRun({
      parentRunId: root.id,
      kind: "delegation",
      owner: "specialist_planner",
      initialState: "active",
    });
    const standalone = GLOBAL_RUN_REGISTRY.registerRun({
      kind: "subprocess",
      owner: "pi",
      initialState: "active",
    });

    expect(GLOBAL_RUN_REGISTRY.listTopLevelActiveRuns().map((run) => run.id)).toEqual([
      root.id,
      standalone.id,
    ]);

    GLOBAL_RUN_REGISTRY.markSettled(root.id);
    expect(GLOBAL_RUN_REGISTRY.listTopLevelActiveRuns().map((run) => run.id)).toEqual([
      child.id,
      standalone.id,
    ]);
  });
});
