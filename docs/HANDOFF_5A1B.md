# Stage 5a.1b — Hook Substrate: Execution Guide

## Read First

- `STATUS.md` — current project state
- `DECISION_LOG.md` — Decision #38 (deterministic guardrails outrank learned permissioning)
- `docs/IMPLEMENTATION_PLAN.md` — Stage 5a.1b section
- Predecessor context: Stage 5a.1 token tracking is now part of the live codebase and reflected in `STATUS.md`

## What This Stage Does

Add a lifecycle hook system that provides clean extension points for policy enforcement and observation at runtime execution points. After this stage, the delegation pipeline, subprocess launcher, team router, and adequacy system all emit typed hook events that policy hooks can gate and observer hooks can log.

This replaces scattered ad-hoc instrumentation concerns with a uniform event model. The dashboard/widget (5a.2) will consume these events rather than directly polling artifacts.

## Design Constraints

1. **Hooks do not silently reroute execution** — only the orchestrator routes
2. **Hooks do not gain broad context** — they receive minimum event-local data
3. **Policy hooks are deterministic** — no model calls, no randomness
4. **Observer hooks are side-effect-limited** — logging, metrics, projections only
5. **Hook failures are isolated** — a broken hook does not crash execution
6. **Phase 1 only:** policy hooks + observer hooks. Review hooks (which can trigger specialist activity) are deferred to Phase 2.

## Existing Patterns to Follow

- **Shared module pattern:** `extensions/shared/adequacy.ts` — JSDoc header with stage/decision reference, type imports from `./types.js`, exported interfaces and pure functions
- **Logging module pattern:** `extensions/shared/logging.ts` — injectable interface, NULL object for tests, factory function for Pi runtime
- **Test pattern:** `tests/subprocess-hardening.test.ts` — Vitest (`describe`, `it`, `expect`), JSDoc header, relative imports with `.js` extensions

## Files to Create

### `extensions/shared/hooks.ts`

New module. This is the core deliverable.

```typescript
/**
 * Hook substrate for lifecycle events (Stage 5a.1b, Decision #38).
 *
 * Three hook classes (Phase 1 implements policy and observer):
 * - Policy hooks: authoritative gates (allow/deny with structured reasons)
 * - Observer hooks: non-authoritative listeners (logging, metrics, projections)
 * - Review hooks: deferred to Phase 2
 *
 * Governance: hooks do not reroute, do not gain broad context, and failures
 * are isolated — a broken hook never crashes execution.
 */

import type {
  HookEvent,
  HookFailure,
  PolicyResult,
  HookEventName,
  // ... payload types defined below
} from "./types.js";
```

**Required exports:**

| Export | Type | Purpose |
|--------|------|---------|
| `HookRegistry` | class | Central registry for hook registration and dispatch |
| `createHookRegistry()` | function → `HookRegistry` | Factory (preferred over `new` for testability) |
| `NULL_REGISTRY` | const `HookRegistry` | No-op registry for tests (like `NULL_LOGGER` in `logging.ts`) |

**`HookRegistry` interface:**

```typescript
interface HookRegistry {
  /** Register a policy hook for an event. Returns unregister function. */
  registerPolicy(eventName: HookEventName, hook: PolicyHook): () => void;

  /** Register an observer hook for an event. Returns unregister function. */
  registerObserver(eventName: HookEventName, hook: ObserverHook): () => void;

  /**
   * Dispatch a policy event. Runs all registered policy hooks.
   * Returns { allowed: true } if all hooks allow, or the first denial.
   * Hook failures are captured as HookFailure records, not thrown.
   */
  dispatchPolicy<T>(eventName: HookEventName, payload: T): PolicyDispatchResult;

  /**
   * Dispatch an observer event. Runs all registered observer hooks.
   * Hook failures are captured as HookFailure records, not thrown.
   */
  dispatchObserver<T>(eventName: HookEventName, payload: T): ObserverDispatchResult;

  /** Get all hook failures recorded since last clear */
  getFailures(): HookFailure[];

  /** Clear recorded failures */
  clearFailures(): void;
}

type PolicyHook = <T>(event: HookEvent<T>) => PolicyResult;
type ObserverHook = <T>(event: HookEvent<T>) => void;

interface PolicyDispatchResult {
  allowed: boolean;
  reason?: string;
  annotations?: Record<string, unknown>;
  failures: HookFailure[];
}

interface ObserverDispatchResult {
  failures: HookFailure[];
}
```

**Key implementation notes:**

- Policy hooks run synchronously (deterministic, no async)
- Observer hooks run synchronously (Phase 1 — async observers can be added in Phase 2)
- Each hook call is wrapped in try/catch — failures produce `HookFailure` records, never propagate
- `NULL_REGISTRY` mirrors the `NULL_LOGGER` pattern: all methods are no-ops, `dispatchPolicy` always returns `{ allowed: true, failures: [] }`

### `tests/hooks.test.ts`

New test file.

**Test cases needed:**

1. **Registration:**
   - Register a policy hook, verify it fires on dispatch
   - Register an observer hook, verify it fires on dispatch
   - Unregister returns a function; calling it removes the hook
   - Multiple hooks on same event all fire

2. **Policy dispatch:**
   - No hooks registered → `{ allowed: true }`
   - Single hook allows → `{ allowed: true }`
   - Single hook denies → `{ allowed: false, reason: "..." }`
   - Multiple hooks, all allow → allowed
   - Multiple hooks, one denies → denied (first denial wins)
   - Denial includes reason and optional annotations

3. **Observer dispatch:**
   - Observer receives correct event payload
   - Multiple observers all fire
   - Observer side effects observable (e.g., push to an array)

4. **Error isolation:**
   - Policy hook throws → caught, `HookFailure` recorded, other hooks still run, result is allowed (failing open, not closed — the hook couldn't make a decision)
   - Observer hook throws → caught, `HookFailure` recorded, other observers still run
   - `getFailures()` returns accumulated failures
   - `clearFailures()` resets the list

5. **NULL_REGISTRY:**
   - `dispatchPolicy` returns `{ allowed: true, failures: [] }`
   - `dispatchObserver` returns `{ failures: [] }`
   - `getFailures()` returns `[]`

## Files to Modify

### `extensions/shared/types.ts`

**Add after the token tracking types (added in 5a.1):**

```typescript
// --- Hook Substrate (Stage 5a.1b) ---

/** All hook event names in the system */
export type HookEventName =
  | "onSessionStart"
  | "onSessionEnd"
  | "onTeamStart"
  | "beforeStateTransition"
  | "afterStateTransition"
  | "beforeDelegation"
  | "afterDelegation"
  | "beforeSubprocessSpawn"
  | "afterSubprocessExit"
  | "onAdequacyFailure"
  | "onPolicyViolation"
  | "onArtifactWritten"
  | "onCommandInvoked";

export interface HookEvent<T = unknown> {
  eventName: HookEventName;
  timestamp: string;
  sessionId: string;
  payload: T;
}

export interface HookFailure {
  hookId: string;
  eventName: HookEventName;
  error: string;
  timestamp: string;
}

export type PolicyResult =
  | { allowed: true }
  | { allowed: false; reason: string; annotations?: Record<string, unknown> };
```

**Typed payload interfaces (add in same section):**

```typescript
/** Payload for beforeDelegation / afterDelegation */
export interface DelegationHookPayload {
  specialistId: string;
  taskId: string;
  sourceAgent: string;
  /** Only on afterDelegation */
  resultStatus?: import("./types.js").PacketStatus;
  /** Only on afterDelegation */
  tokenUsage?: TokenUsage;
}

/** Payload for beforeSubprocessSpawn / afterSubprocessExit */
export interface SubprocessHookPayload {
  specialistId: string;
  taskId: string;
  /** Only on afterSubprocessExit */
  exitCode?: number;
  /** Only on afterSubprocessExit */
  tokenUsage?: TokenUsage;
}

/** Payload for beforeStateTransition / afterStateTransition */
export interface StateTransitionHookPayload {
  teamId: string;
  fromState: string;
  toState: string;
  agentId: string;
  taskId: string;
  /** Only on afterStateTransition */
  resultStatus?: import("./types.js").PacketStatus;
}

/** Payload for onTeamStart */
export interface TeamStartHookPayload {
  teamId: string;
  teamVersion: string;
  taskId: string;
}

/** Payload for onAdequacyFailure */
export interface AdequacyFailureHookPayload {
  specialistId: string;
  taskId: string;
  failures: string[];
}

/** Payload for onSessionStart / onSessionEnd */
export interface SessionHookPayload {
  sessionId: string;
  /** Only on onSessionEnd */
  totalTokenUsage?: TokenUsage;
}
```

### `extensions/orchestrator/delegate.ts`

**Add import at top:**

```typescript
import type { HookRegistry } from "../shared/hooks.js";
```

**Extend `DelegationInput` (line 30):**

Add one optional field:

```typescript
  /** Hook registry for lifecycle events */
  hookRegistry?: HookRegistry;
```

**Emit `beforeDelegation` before subprocess spawn (~line 140):**

```typescript
// Before spawn (after prompt building, before spawnSpecialistAgent call)
if (input.hookRegistry) {
  const policyResult = input.hookRegistry.dispatchPolicy("beforeDelegation", {
    specialistId: agentId,
    taskId: taskPacket.id,
    sourceAgent: taskPacket.sourceAgent,
  });
  if (!policyResult.allowed) {
    // Policy hook denied delegation
    const deniedPacket = createResultPacket({
      taskId: taskPacket.id,
      status: "failure",
      summary: `Delegation denied by policy: ${policyResult.reason}`,
      deliverables: [],
      modifiedFiles: [],
      sourceAgent: agentId,
    });
    logger?.log({
      timestamp: new Date().toISOString(),
      level: "warn",
      event: "delegation_error",
      sourceAgent: taskPacket.sourceAgent,
      targetAgent: agentId,
      taskId: taskPacket.id,
      status: "failure",
      summary: `Policy denied: ${policyResult.reason}`,
      failureReason: "validation_failure",
    });
    return { resultPacket: deniedPacket, success: false };
  }
}
```

**Emit `afterDelegation` after result is built (~line 275, before final return):**

```typescript
input.hookRegistry?.dispatchObserver("afterDelegation", {
  specialistId: agentId,
  taskId: taskPacket.id,
  sourceAgent: taskPacket.sourceAgent,
  resultStatus: resultPacket.status,
  tokenUsage: subAgentResult.tokenUsage,  // from 5a.1
});
```

**Emit `onAdequacyFailure` when adequacy check fails (~line 207, inside the `if (!adequacyResult.adequate)` block):**

```typescript
input.hookRegistry?.dispatchObserver("onAdequacyFailure", {
  specialistId: agentId,
  taskId: taskPacket.id,
  failures: adequacyResult.failures,
});
```

### `extensions/shared/subprocess.ts`

**Emit `beforeSubprocessSpawn` and `afterSubprocessExit`:**

The subprocess module is a low-level utility called from `delegateToSpecialist`. Rather than threading the hook registry through the spawn function signature, the hook events for subprocess spawn/exit should be emitted from `delegateToSpecialist` in `delegate.ts`, wrapping the `spawnSpecialistAgent` call:

```typescript
// In delegateToSpecialist, around line 140-143:

input.hookRegistry?.dispatchObserver("beforeSubprocessSpawn", {
  specialistId: agentId,
  taskId: taskPacket.id,
});

subAgentResult = await spawnSpecialistAgent(systemPrompt, taskPrompt, signal, undefined, resolvedModel);

input.hookRegistry?.dispatchObserver("afterSubprocessExit", {
  specialistId: agentId,
  taskId: taskPacket.id,
  exitCode: subAgentResult.exitCode,
  tokenUsage: subAgentResult.tokenUsage,
});
```

**Do NOT modify `subprocess.ts` itself** — keep it as a pure subprocess utility. All hook dispatching happens at the delegation level.

### `extensions/teams/router.ts`

**Add import at top:**

```typescript
import type { HookRegistry } from "../shared/hooks.js";
```

**Extend `executeTeam` signature (line 129):**

```typescript
export async function executeTeam(
  team: TeamDefinition,
  taskPacket: TaskPacket,
  signal?: AbortSignal,
  logger?: DelegationLogger,
  hookRegistry?: HookRegistry,  // NEW
): Promise<TeamExecutionResult> {
```

**Emit `onTeamStart` after session setup (~line 142, after the `logger?.log` team_start):**

```typescript
hookRegistry?.dispatchObserver("onTeamStart", {
  teamId: team.id,
  teamVersion,
  taskId: taskPacket.id,
});
```

**Emit `beforeStateTransition` before delegation (~line 288, before `delegateToSpecialist`):**

```typescript
hookRegistry?.dispatchObserver("beforeStateTransition", {
  teamId: team.id,
  fromState: currentStateName,
  toState: "pending",  // actual target not yet known
  agentId,
  taskId: taskPacket.id,
});
```

**Emit `afterStateTransition` after state machine advance (~line 409, after `logger?.log` state_transition):**

```typescript
hookRegistry?.dispatchObserver("afterStateTransition", {
  teamId: team.id,
  fromState: currentStateName,
  toState: targetState,
  agentId,
  taskId: taskPacket.id,
  resultStatus: resultPacket.status,
});
```

**Pass `hookRegistry` through to `delegateToSpecialist` (~line 289):**

```typescript
const { resultPacket } = await delegateToSpecialist({
  promptConfig,
  taskPacket: specialistTaskPacket,
  signal,
  logger,
  hookRegistry,  // NEW — pass through
});
```

### `extensions/orchestrator/index.ts`

**Thread `hookRegistry` through the orchestrator:**

The orchestrator is the natural owner of the hook registry. In the production path, create a registry in `execute()` and pass it through all delegation calls.

**Add imports:**

```typescript
import { createHookRegistry } from "../shared/hooks.js";
import type { HookRegistry } from "../shared/hooks.js";
```

**Create registry in `execute()` (line 73, after `const logger = ...`):**

```typescript
const hookRegistry = createHookRegistry();
// TODO: Register policy/observer hooks here (5a.1c will add sandbox policy hooks)
```

**Pass to `delegateToTeam` (line 87):**

```typescript
const { resultPacket, success, sessionArtifact } = await delegateToTeam({
  teamId: teamHint,
  taskPacket: teamTaskPacket,
  signal,
  logger,
  hookRegistry,  // NEW
});
```

**Pass to `delegateToSpecialist` (line 191):**

```typescript
const delegationOutput = await delegateToSpecialist({
  promptConfig,
  taskPacket,
  signal,
  logger,
  modelOverride,
  hookRegistry,  // NEW
});
```

**Extend `delegateToTeam` in delegate.ts (line 361):**

Add `hookRegistry?` to the input parameter and pass it through to `executeTeam`:

```typescript
export async function delegateToTeam(input: {
  teamId: string;
  taskPacket: TaskPacket;
  signal?: AbortSignal;
  logger?: DelegationLogger;
  hookRegistry?: HookRegistry;  // NEW
}): Promise<DelegationOutput> {
  // ...
  const teamResult = await executeTeam(team, input.taskPacket, input.signal, input.logger, input.hookRegistry);
  // ...
}
```

## What This Stage Does NOT Do

- **No review hooks** — Phase 2. Review hooks can trigger specialist activity and need the event model to be proven stable first.
- **No HTTP or external hooks** — local in-process only
- **No async hooks** — all synchronous in Phase 1
- **No policy hooks registered yet** — the registry is created empty. Stage 5a.1c (sandboxing) will register the first policy hooks. This stage provides the infrastructure.
- **No dashboard/widget integration** — 5a.2 will register observer hooks for widget projection
- **Do not modify `subprocess.ts`** — hook events for spawn/exit are emitted from `delegate.ts`

## Exit Criteria

- [ ] `HookEvent`, `HookFailure`, `PolicyResult`, `HookEventName`, and payload types in `types.ts`
- [ ] `HookRegistry` class with `registerPolicy`, `registerObserver`, `dispatchPolicy`, `dispatchObserver`, `getFailures`, `clearFailures`
- [ ] `createHookRegistry()` factory and `NULL_REGISTRY` constant
- [ ] Policy dispatch: runs all hooks, returns first denial, isolates errors
- [ ] Observer dispatch: runs all hooks, isolates errors
- [ ] `delegate.ts` emits `beforeDelegation`, `afterDelegation`, `onAdequacyFailure`, `beforeSubprocessSpawn`, `afterSubprocessExit`
- [ ] `router.ts` emits `onTeamStart`, `beforeStateTransition`, `afterStateTransition`
- [ ] `router.ts` and `delegate.ts` accept and propagate `hookRegistry`
- [ ] `index.ts` creates and threads the hook registry
- [ ] All existing tests still pass (ensure `hookRegistry` is optional everywhere)
- [ ] New tests cover: registration, dispatch, denial, error isolation, NULL_REGISTRY
- [ ] `make typecheck` passes
- [ ] `make test` passes

## Verification

```bash
make typecheck  # Must pass clean
make test       # Must pass (all existing + new hook tests)
```
