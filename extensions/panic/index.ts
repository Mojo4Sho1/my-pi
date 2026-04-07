/**
 * Panic extension command (Stage 5a.6).
 *
 * Provides deterministic emergency teardown of all active tracked run trees.
 */

import type {
  ExtensionAPI,
  ExtensionCommandContext,
} from "@mariozechner/pi-coding-agent";
import { GLOBAL_RUN_REGISTRY } from "../shared/run-registry.js";
import { teardownRuns } from "../shared/teardown.js";

function renderSummary(summary: Awaited<ReturnType<typeof teardownRuns>>): string {
  return [
    "Panic Teardown",
    `Runs found: ${summary.runsFound}`,
    `Gracefully canceled: ${summary.gracefulCanceled}`,
    `Force killed: ${summary.forceKilled}`,
    `Already terminal: ${summary.alreadyTerminal}`,
    `Unconfirmed remaining: ${summary.notConfirmedStopped}`,
    `Settled: ${summary.settled ? "yes" : "no"}`,
  ].join("\n");
}

export async function runPanicCommand(
  _args: string,
  ctx: ExtensionCommandContext
): Promise<void> {
  const targets = GLOBAL_RUN_REGISTRY.listTopLevelActiveRuns().map((run) => run.id);
  if (targets.length === 0) {
    ctx.ui.notify("Panic Teardown\nRuns found: 0\nSettled: yes", "info");
    return;
  }

  const summary = await teardownRuns(targets);
  ctx.ui.notify(renderSummary(summary), summary.settled ? "info" : "warning");
}

export default function panicExtension(pi: ExtensionAPI): void {
  if (typeof (pi as Partial<ExtensionAPI>).registerCommand !== "function") {
    return;
  }

  pi.registerCommand("panic", {
    description: "Emergency stop for all active tracked run trees",
    handler: runPanicCommand,
  });
}
