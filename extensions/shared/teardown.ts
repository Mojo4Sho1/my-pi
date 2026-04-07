/**
 * Graceful-then-forced teardown for tracked runs (Stage 5a.6).
 */

import {
  GLOBAL_RUN_REGISTRY,
  isTerminalRunState,
  type RunRecord,
  type RunRegistry,
} from "./run-registry.js";

export interface TeardownOptions {
  gracePeriodMs?: number;
  settleTimeoutMs?: number;
}

export interface TeardownSummary {
  targetRunIds: string[];
  runsFound: number;
  gracefulCanceled: number;
  forceKilled: number;
  alreadyTerminal: number;
  notConfirmedStopped: number;
  settled: boolean;
  remainingRunIds: string[];
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function uniqueRuns(runs: RunRecord[]): RunRecord[] {
  const seen = new Set<string>();
  const unique: RunRecord[] = [];
  for (const run of runs) {
    if (seen.has(run.id)) {
      continue;
    }
    seen.add(run.id);
    unique.push(run);
  }
  return unique;
}

async function runHandlers(
  runs: RunRecord[],
  handler: "gracefulStop" | "forceStop",
): Promise<void> {
  await Promise.allSettled(
    runs.map((run) => run.handlers?.[handler]?.())
  );
}

export async function teardownRuns(
  targetRunIds: string[],
  options?: TeardownOptions,
  registry: RunRegistry = GLOBAL_RUN_REGISTRY,
): Promise<TeardownSummary> {
  const gracePeriodMs = options?.gracePeriodMs ?? 100;
  const settleTimeoutMs = options?.settleTimeoutMs ?? 5_000;
  const roots = [...new Set(targetRunIds)];
  const allRuns = uniqueRuns(
    roots.flatMap((runId) => registry.getRunTree(runId))
  );

  let alreadyTerminal = 0;
  const activeRuns: RunRecord[] = [];
  for (const run of allRuns) {
    if (isTerminalRunState(run.state)) {
      alreadyTerminal++;
      continue;
    }
    registry.markCanceling(run.id);
    activeRuns.push(run);
  }

  await runHandlers(activeRuns, "gracefulStop");
  if (gracePeriodMs > 0) {
    await delay(gracePeriodMs);
  }

  const afterGrace = uniqueRuns(
    roots.flatMap((runId) => registry.getRunTree(runId))
  );
  const needsForce = afterGrace.filter((run) => !isTerminalRunState(run.state));
  const gracefulCanceled = activeRuns.length - needsForce.length;

  await runHandlers(needsForce, "forceStop");

  const settleResults = await Promise.all(
    roots.map((runId) =>
      registry.waitForTreeToSettle(runId, { timeoutMs: settleTimeoutMs })
    )
  );

  const finalRuns = uniqueRuns(
    roots.flatMap((runId) => registry.getRunTree(runId))
  );
  const remaining = finalRuns.filter((run) => !isTerminalRunState(run.state));

  return {
    targetRunIds: roots,
    runsFound: allRuns.length,
    gracefulCanceled,
    forceKilled: needsForce.length,
    alreadyTerminal,
    notConfirmedStopped: remaining.length,
    settled: settleResults.every(Boolean) && remaining.length === 0,
    remainingRunIds: remaining.map((run) => run.id),
  };
}
