/**
 * Parent-owned run registry for nested execution lifecycle tracking (Stage 5a.6).
 *
 * Every tracked run is registered here with explicit parent/child ownership so
 * cancellation, teardown, and future observability can work from a single
 * runtime source of truth.
 */

export type RunKind = "orchestration" | "team_execution" | "delegation" | "subprocess";

export type RunState =
  | "starting"
  | "active"
  | "canceling"
  | "settled"
  | "failed"
  | "killed"
  | "canceled";

export interface RunTeardownHandlers {
  gracefulStop?: () => void | Promise<void>;
  forceStop?: () => void | Promise<void>;
}

export interface RunRecord {
  id: string;
  parentRunId?: string;
  kind: RunKind;
  owner: string;
  cwd?: string;
  label?: string;
  taskId?: string;
  startedAt: string;
  updatedAt: string;
  state: RunState;
  error?: string;
  handlers?: RunTeardownHandlers;
}

export interface RegisterRunInput {
  id?: string;
  parentRunId?: string;
  kind: RunKind;
  owner: string;
  cwd?: string;
  label?: string;
  taskId?: string;
  initialState?: RunState;
  handlers?: RunTeardownHandlers;
}

const TERMINAL_STATES = new Set<RunState>(["settled", "failed", "killed", "canceled"]);

function createRunId(kind: RunKind): string {
  return `run_${kind}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isTerminalRunState(state: RunState): boolean {
  return TERMINAL_STATES.has(state);
}

export function linkAbortSignal(
  parentSignal: AbortSignal | undefined,
  controller: AbortController
): () => void {
  if (!parentSignal) {
    return () => {};
  }

  if (parentSignal.aborted) {
    controller.abort(parentSignal.reason);
    return () => {};
  }

  const onAbort = () => {
    controller.abort(parentSignal.reason);
  };
  parentSignal.addEventListener("abort", onAbort, { once: true });
  return () => {
    parentSignal.removeEventListener("abort", onAbort);
  };
}

export class RunRegistry {
  private readonly runs = new Map<string, RunRecord>();
  private readonly children = new Map<string, Set<string>>();

  registerRun(input: RegisterRunInput): RunRecord {
    const now = new Date().toISOString();
    const record: RunRecord = {
      id: input.id ?? createRunId(input.kind),
      parentRunId: input.parentRunId,
      kind: input.kind,
      owner: input.owner,
      cwd: input.cwd,
      label: input.label,
      taskId: input.taskId,
      startedAt: now,
      updatedAt: now,
      state: input.initialState ?? "starting",
      handlers: input.handlers,
    };

    this.runs.set(record.id, record);
    if (record.parentRunId) {
      const childIds = this.children.get(record.parentRunId) ?? new Set<string>();
      childIds.add(record.id);
      this.children.set(record.parentRunId, childIds);
    }
    return { ...record };
  }

  getRun(runId: string): RunRecord | undefined {
    const record = this.runs.get(runId);
    return record ? { ...record } : undefined;
  }

  listRuns(): RunRecord[] {
    return [...this.runs.values()].map((record) => ({ ...record }));
  }

  listActiveRuns(): RunRecord[] {
    return this.listRuns().filter((run) => !isTerminalRunState(run.state));
  }

  listTopLevelActiveRuns(): RunRecord[] {
    const active = new Map(this.listActiveRuns().map((run) => [run.id, run]));
    return [...active.values()].filter((run) => {
      if (!run.parentRunId) {
        return true;
      }
      const parent = active.get(run.parentRunId);
      return !parent;
    });
  }

  getChildren(runId: string): RunRecord[] {
    const childIds = this.children.get(runId);
    if (!childIds) {
      return [];
    }
    return [...childIds]
      .map((childId) => this.getRun(childId))
      .filter((child): child is RunRecord => Boolean(child));
  }

  getDescendants(runId: string): RunRecord[] {
    const descendants: RunRecord[] = [];
    const queue = [...this.getChildren(runId)];

    while (queue.length > 0) {
      const current = queue.shift()!;
      descendants.push(current);
      queue.push(...this.getChildren(current.id));
    }

    return descendants;
  }

  getRunTree(runId: string): RunRecord[] {
    const root = this.getRun(runId);
    if (!root) {
      return [];
    }
    return [root, ...this.getDescendants(runId)];
  }

  updateHandlers(runId: string, handlers: RunTeardownHandlers | undefined): void {
    const record = this.runs.get(runId);
    if (!record || isTerminalRunState(record.state)) {
      return;
    }
    record.handlers = handlers;
    record.updatedAt = new Date().toISOString();
  }

  setState(runId: string, state: RunState, error?: string): void {
    const record = this.runs.get(runId);
    if (!record) {
      return;
    }

    if (isTerminalRunState(record.state)) {
      return;
    }

    record.state = state;
    record.updatedAt = new Date().toISOString();
    if (error !== undefined) {
      record.error = error;
    }
  }

  markStarting(runId: string): void {
    this.setState(runId, "starting");
  }

  markActive(runId: string): void {
    this.setState(runId, "active");
  }

  markCanceling(runId: string): void {
    this.setState(runId, "canceling");
  }

  markSettled(runId: string): void {
    this.setState(runId, "settled");
  }

  markFailed(runId: string, error?: string): void {
    this.setState(runId, "failed", error);
  }

  markKilled(runId: string): void {
    this.setState(runId, "killed");
  }

  markCanceled(runId: string): void {
    this.setState(runId, "canceled");
  }

  isSettled(runId: string): boolean {
    const record = this.runs.get(runId);
    return record ? isTerminalRunState(record.state) : true;
  }

  async waitForRunToSettle(
    runId: string,
    options?: { timeoutMs?: number; pollMs?: number }
  ): Promise<boolean> {
    const timeoutMs = options?.timeoutMs ?? 10_000;
    const pollMs = options?.pollMs ?? 20;
    const deadline = Date.now() + timeoutMs;

    while (Date.now() <= deadline) {
      if (this.isSettled(runId)) {
        return true;
      }
      await delay(pollMs);
    }

    return this.isSettled(runId);
  }

  async waitForDescendantsToSettle(
    runId: string,
    options?: { timeoutMs?: number; pollMs?: number }
  ): Promise<boolean> {
    const timeoutMs = options?.timeoutMs ?? 10_000;
    const pollMs = options?.pollMs ?? 20;
    const deadline = Date.now() + timeoutMs;

    while (Date.now() <= deadline) {
      const pending = this.getDescendants(runId).filter((run) => !isTerminalRunState(run.state));
      if (pending.length === 0) {
        return true;
      }
      await delay(pollMs);
    }

    return this.getDescendants(runId).every((run) => isTerminalRunState(run.state));
  }

  async waitForTreeToSettle(
    runId: string,
    options?: { timeoutMs?: number; pollMs?: number }
  ): Promise<boolean> {
    const timeoutMs = options?.timeoutMs ?? 10_000;
    const pollMs = options?.pollMs ?? 20;
    const deadline = Date.now() + timeoutMs;

    while (Date.now() <= deadline) {
      const pending = this.getRunTree(runId).filter((run) => !isTerminalRunState(run.state));
      if (pending.length === 0) {
        return true;
      }
      await delay(pollMs);
    }

    return this.getRunTree(runId).every((run) => isTerminalRunState(run.state));
  }

  reset(): void {
    this.runs.clear();
    this.children.clear();
  }
}

export const GLOBAL_RUN_REGISTRY = new RunRegistry();
