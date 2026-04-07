import { beforeEach, describe, expect, it, vi } from "vitest";
import panicExtension, { runPanicCommand } from "../extensions/panic/index.js";
import { GLOBAL_RUN_REGISTRY } from "../extensions/shared/run-registry.js";

describe("panic command", () => {
  beforeEach(() => {
    GLOBAL_RUN_REGISTRY.reset();
  });

  it("registers the panic command", () => {
    const registerCommand = vi.fn();

    panicExtension({
      registerCommand,
    } as any);

    expect(registerCommand).toHaveBeenCalledWith(
      "panic",
      expect.objectContaining({
        description: expect.stringContaining("Emergency stop"),
        handler: expect.any(Function),
      })
    );
  });

  it("reports a settled no-op when there are no active runs", async () => {
    const notify = vi.fn();

    await runPanicCommand("", {
      ui: { notify },
    } as any);

    expect(notify).toHaveBeenCalledWith(
      "Panic Teardown\nRuns found: 0\nSettled: yes",
      "info"
    );
  });

  it("tears down active tracked runs and reports the result", async () => {
    const root = GLOBAL_RUN_REGISTRY.registerRun({
      kind: "orchestration",
      owner: "orchestrator",
      initialState: "active",
    });
    const child = GLOBAL_RUN_REGISTRY.registerRun({
      parentRunId: root.id,
      kind: "subprocess",
      owner: "pi",
      initialState: "active",
    });

    GLOBAL_RUN_REGISTRY.updateHandlers(root.id, {
      gracefulStop: () => {
        GLOBAL_RUN_REGISTRY.markCanceled(root.id);
      },
    });
    GLOBAL_RUN_REGISTRY.updateHandlers(child.id, {
      gracefulStop: () => {
        GLOBAL_RUN_REGISTRY.markCanceled(child.id);
      },
    });

    const notify = vi.fn();
    await runPanicCommand("", {
      ui: { notify },
    } as any);

    expect(notify).toHaveBeenCalledWith(
      [
        "Panic Teardown",
        "Runs found: 2",
        "Gracefully canceled: 2",
        "Force killed: 0",
        "Already terminal: 0",
        "Unconfirmed remaining: 0",
        "Settled: yes",
      ].join("\n"),
      "info"
    );
  });
});
