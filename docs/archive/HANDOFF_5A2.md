# Stage 5a.2 - Dashboard Substrate + Persistent Widget: Execution Guide

Archived historical execution guide. This file is not part of the active handoff flow; active handoff docs live under `docs/handoff/`.

## Read First

- `STATUS.md` - current project state (`5a.2` complete, `5a.3` next)
- `DECISION_LOG.md` - Decision #36 (dashboard design: artifact-backed observability with staged delivery)
- `docs/_IMPLEMENTATION_PLAN_INDEX.md` - route to the Stage `5a.2` section before opening the plan
- `docs/archive/HANDOFF_5A1C.md` - predecessor stage (deterministic sandboxing), to understand the current hook and artifact surfaces
- `docs/archive/design/dashboard.md` - source design document for the staged dashboard rollout

## What This Stage Does

Build the dashboard substrate and ship the first visible observability surface: a persistent widget that shows current-session execution health at a glance.

This stage adds:

1. **Dashboard-local view-model types** - compact types for widget-ready state, active path, and worklist progress
2. **A pure projection layer** - derive widget state from structured artifacts and live hook events rather than transcript scraping
3. **A standalone dashboard extension** - owns widget state, reconstructs from session entries, and updates the widget during live runs
4. **A shared hook-installer seam** - allows the dashboard extension to observe every newly created `HookRegistry` without the orchestrator importing dashboard code
5. **Standardized live artifact payloads** - `onArtifactWritten` events for `team_session` and `worklist_session` now carry the actual artifact object in `payload.artifact`

This is a **read-only, artifact-backed, single-session, widget-first** stage. The detailed `/dashboard` inspector is deferred to Stage `5a.4`.

Status: implemented on 2026-04-03. Keep this file as historical execution context for the completed stage.

## Design Constraints

1. **Artifact-backed, not transcript-backed** - the widget derives from `TeamSessionArtifact`, `WorklistSummary`, delegation logs, hook payloads, and token data only
2. **Read-only dashboard** - the dashboard extension never mutates orchestration state, reroutes work, or injects new tasks
3. **Single-session and current-branch only** - reconstruction uses `ctx.sessionManager.getBranch()` and shows only the active branch's current session state
4. **Projection layer stays pure** - projection code takes structured inputs and returns structured view models; no Pi APIs inside projection functions
5. **No orchestrator-dashboard coupling** - the orchestrator keeps creating hook registries locally; the dashboard attaches through a shared installer seam
6. **Widget-first UI discipline** - use the line-array form of `ctx.ui.setWidget()` above the editor; no custom TUI components, no below-editor placement, no layout experiments yet
7. **Graceful degradation is required** - partial data, missing worklist state, or sessions from older code should still produce a stable widget or clear it safely
8. **Compact widget, coarse terminal states** - map fine-grained runtime details into a small status surface now; richer failure/token breakdowns belong to `/dashboard` in `5a.4`

## Existing Patterns to Follow

- **Pure utility module pattern:** `extensions/shared/tokens.ts` - typed inputs/outputs, pure functions, no runtime coupling
- **Hook registry pattern:** `extensions/shared/hooks.ts` - synchronous registration and dispatch, optional runtime wiring, no external transport
- **Artifact/session pattern:** `tests/session-artifact.test.ts` - build synthetic structured artifacts and assert on typed fields instead of prose
- **Extension state reconstruction pattern:** `node_modules/@mariozechner/pi-coding-agent/examples/extensions/todo.ts` - rebuild extension-local state from `ctx.sessionManager.getBranch()`
- **Widget API usage pattern:** `node_modules/@mariozechner/pi-coding-agent/examples/extensions/plan-mode/index.ts` - `ctx.ui.setWidget("key", lines)` to render a compact persistent widget

## Existing Code to Be Aware Of

### `extensions/orchestrator/index.ts`

The orchestrator currently owns hook-registry creation inside the `orchestrate` tool execution path:

```typescript
const hookRegistry = createHookRegistry();
hookRegistry.dispatchObserver("onSessionStart", {
  sessionId: hookRegistry.getSessionId(),
});
```

This means there is **no current way** for another extension to subscribe to every new registry unless `extensions/shared/hooks.ts` grows a module-level installer seam. Stage `5a.2` should add that seam rather than moving registry ownership elsewhere.

The same file also appends session artifacts and then emits `onArtifactWritten`, but the current payloads for `team_session` and `worklist_session` omit `artifact`:

```typescript
pi.appendEntry("team_session", sessionArtifact);
hookRegistry.dispatchObserver("onArtifactWritten", {
  artifactType: "team_session",
  taskId: teamTaskPacket.id,
});
```

By contrast, `extensions/orchestrator/delegate.ts` already includes the artifact payload for `spawn_record`. Stage `5a.2` should standardize the `team_session` and `worklist_session` paths to match that live-artifact pattern.

### `extensions/shared/hooks.ts`

Today the factory simply returns a fresh registry:

```typescript
export function createHookRegistry(): HookRegistry {
  return new HookRegistry();
}
```

Stage `5a.2` should keep `createHookRegistry()` as the orchestrator entrypoint, but change it so every new registry automatically applies any registered global hook installers.

### `extensions/shared/types.ts`

The shared hook payload already supports an optional artifact payload:

```typescript
export interface ArtifactHookPayload {
  artifactType: string;
  taskId?: string;
  artifact?: unknown;
}
```

Do **not** change this interface in `5a.2`. Use the existing `artifact?: unknown` field consistently instead.

The structured inputs the dashboard needs already exist:

- `TeamSessionArtifact`
- `StateTraceEntry`
- `SpecialistInvocationSummary`
- `TokenUsage`

### `extensions/worklist/types.ts`

`WorklistSummary` already exists and is the authoritative source for worklist progress:

```typescript
export interface WorklistSummary {
  totalItems: number;
  statusCounts: Record<WorklistItemStatus, number>;
  blockedItems: Array<{ id: string; description: string; blockReason: string }>;
  isComplete: boolean;
  hasBlockers: boolean;
}
```

Do not create a second shared worklist summary type. The dashboard should project from this type into a widget-local `WorklistProgressView`.

### Pi session reconstruction

Pi custom entries are available through `ctx.sessionManager.getBranch()`:

```typescript
for (const entry of ctx.sessionManager.getBranch()) {
  if (entry.type === "custom" && entry.customType === "my-state") {
    // reconstruct from entry.data
  }
}
```

That is the correct reconstruction path for the dashboard extension. Use branch entries, not transcript text and not `getEntries()` for whole-session aggregation.

## Files to Create

### `extensions/dashboard/types.ts`

New module. Dashboard-local types only; do not add these to `extensions/shared/types.ts`.

```typescript
/**
 * Dashboard-local view models (Stage 5a.2, Decision #36).
 *
 * These types are presentation-facing projections built from authoritative
 * execution artifacts. Shared execution contracts stay in extensions/shared/.
 */

import type {
  PacketStatus,
  TeamSessionArtifact,
  TokenUsage,
} from "../shared/types.js";
import type { DelegationLogEntry } from "../shared/logging.js";
import type { WorklistSummary } from "../worklist/types.js";
```

**Required exports:**

| Export | Type | Purpose |
|--------|------|---------|
| `WidgetState` | interface | Compact widget-ready state |
| `ActivePrimitivePath` | interface | Stacked team/state/agent path shown in the widget |
| `WorklistProgressView` | interface | Compact progress-oriented worklist summary |
| `DashboardSessionSnapshot` | interface | Dashboard-owned internal source snapshot built from hooks and session entries |

**Required types:**

```typescript
export interface WidgetState {
  sessionStatus: "idle" | "running" | "completed" | "failed" | "escalated";
  activePath: ActivePrimitivePath | null;
  worklistProgress: WorklistProgressView | null;
  hasBlockers: boolean;
  hasEscalation: boolean;
  elapsedMs: number;
  totalTokens: number;
}

export interface ActivePrimitivePath {
  team?: string;
  state?: string;
  agent?: string;
}

export interface WorklistProgressView {
  total: number;
  completed: number;
  remaining: number;
  blocked: number;
}

export interface DashboardSessionSnapshot {
  sessionId?: string;
  startedAt?: string;
  completedAt?: string;
  sessionStatusHint?: WidgetState["sessionStatus"];
  latestResultStatus?: PacketStatus;
  activePathHint?: ActivePrimitivePath | null;
  teamSession?: TeamSessionArtifact;
  worklistSummary?: WorklistSummary;
  delegationLogs: DelegationLogEntry[];
  totalTokenUsage?: TokenUsage;
}
```

**Important design notes:**

- `DashboardSessionSnapshot` is dashboard-owned state, not a shared runtime contract
- `delegationLogs` should be stored in the snapshot now even though the compact widget uses them only as a coarse fallback; `/dashboard` in `5a.4` will need them
- `sessionStatusHint` exists so live hook events can drive the widget before a full `TeamSessionArtifact` exists

### `extensions/dashboard/projections.ts`

New pure module. No Pi imports, no widget API calls, no session manager access.

**Required exports:**

| Export | Type | Purpose |
|--------|------|---------|
| `deriveActivePrimitivePath()` | function | Convert snapshot/artifacts into stacked team/state/agent labels |
| `projectWorklistProgress()` | function | Convert `WorklistSummary` into `WorklistProgressView` |
| `projectWidgetState()` | function | Build full `WidgetState` from a `DashboardSessionSnapshot` |

**Required function shapes:**

```typescript
import type { PacketStatus } from "../shared/types.js";
import type {
  ActivePrimitivePath,
  DashboardSessionSnapshot,
  WidgetState,
  WorklistProgressView,
} from "./types.js";
import type { WorklistSummary } from "../worklist/types.js";

export function deriveActivePrimitivePath(
  snapshot: DashboardSessionSnapshot
): ActivePrimitivePath | null;

export function projectWorklistProgress(
  summary?: WorklistSummary
): WorklistProgressView | null;

export function projectWidgetState(
  snapshot: DashboardSessionSnapshot,
  now = Date.now()
): WidgetState;
```

**Projection rules to lock:**

1. **Session status mapping**
   - No `startedAt`, no `teamSession`, and no `sessionStatusHint` -> `"idle"`
   - Live session with `startedAt` and no terminal status -> `"running"`
   - `PacketStatus: "success"` or `"partial"` -> `"completed"` for widget purposes
   - `PacketStatus: "failure"` -> `"failed"`
   - `PacketStatus: "escalation"` -> `"escalated"`

2. **Active path precedence**
   - First: `snapshot.activePathHint` from live hook events
   - Second: derive from the latest `teamSession.stateTrace` entry
   - Third: `null`

3. **Worklist progress projection**
   - `total = summary.totalItems`
   - `completed = summary.statusCounts.completed`
   - `remaining = summary.statusCounts.pending + summary.statusCounts.in_progress + summary.statusCounts.blocked`
   - `blocked = summary.statusCounts.blocked`

   `abandoned` is intentionally omitted from the compact widget view. It is terminal and should be shown in the full inspector later (`5a.4`), not packed into the widget.

4. **Elapsed time**
   - If both `startedAt` and `completedAt` exist, use that fixed duration
   - If only `startedAt` exists, use `now - startedAt`
   - Otherwise `0`

5. **Total tokens**
   - Prefer `snapshot.totalTokenUsage?.totalTokens`
   - Fallback to `snapshot.teamSession?.metrics.totalTokenUsage?.totalTokens`
   - Else `0`

6. **Blocker/escalation flags**
   - `hasBlockers = snapshot.worklistSummary?.hasBlockers ?? false`
   - `hasEscalation = projected status === "escalated"`

### `extensions/dashboard/widget.ts`

New widget rendering module. This file owns line formatting and the `ctx.ui.setWidget()` integration, but not snapshot reconstruction and not projections.

**Required exports:**

| Export | Type | Purpose |
|--------|------|---------|
| `WIDGET_KEY` | const string | Stable widget key for set/clear calls |
| `renderWidgetLines()` | function | Convert `WidgetState` into display lines |
| `applyWidget()` | function | Set or clear the persistent widget on the current context |

**Required implementation shape:**

```typescript
import type { ExtensionContext } from "@mariozechner/pi-coding-agent";
import type { WidgetState } from "./types.js";

export const WIDGET_KEY = "my-pi-dashboard";

export function renderWidgetLines(state: WidgetState): string[] {
  // returns compact line-array presentation
}

export function applyWidget(ctx: ExtensionContext, state: WidgetState): void {
  if (!ctx.hasUI) return;

  if (state.sessionStatus === "idle") {
    ctx.ui.setWidget(WIDGET_KEY, undefined);
    return;
  }

  ctx.ui.setWidget(WIDGET_KEY, renderWidgetLines(state));
}
```

**Use this widget API shape directly in the doc and the code:**

```typescript
ctx.ui.setWidget("my-pi-dashboard", ["Status: running", "Team: build-team"]);
ctx.ui.setWidget("my-pi-dashboard", undefined); // clear
```

Default placement is above the editor. Do **not** pass `{ placement: "belowEditor" }` in this stage.

**Rendering rules to lock:**

- Line 1: coarse status, with inline blocker/escalation tags when present
- Path lines: stacked `Team`, `State`, `Agent` labels, only for defined fields
- Worklist line: `Work: <total> total | <completed> done | <remaining> remaining` and append `| <blocked> blocked` only when `blocked > 0`
- Final line: `Time: <formatted duration> | Tokens: <formatted total>`
- Keep the output ASCII-only and stable across runs

### `extensions/dashboard/index.ts`

New extension entry point. This stage does **not** register a tool or a command. It registers lifecycle listeners and one global hook installer.

**Required responsibilities:**

1. Maintain dashboard-owned in-memory state:
   - `let currentCtx: ExtensionContext | undefined`
   - `let snapshot: DashboardSessionSnapshot`

2. Register a global hook installer once in the extension factory:

```typescript
import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { registerHookInstaller } from "../shared/hooks.js";
import { projectWidgetState } from "./projections.js";
import { applyWidget } from "./widget.js";
```

3. Attach observers from the installer to every new `HookRegistry`:
   - `onSessionStart`
   - `onTeamStart`
   - `beforeStateTransition`
   - `afterStateTransition`
   - `beforeDelegation`
   - `afterDelegation`
   - `onArtifactWritten`
   - `onSessionEnd`

4. Reconstruct from branch entries on:
   - `session_start`
   - `session_switch`
   - `session_fork`
   - `session_tree`

5. Re-render the widget after every live update and every reconstruction pass

**Snapshot update rules to lock:**

- `onSessionStart`: reset live-only fields, set `sessionId`, `startedAt`, `completedAt = undefined`, `sessionStatusHint = "running"`
- `onTeamStart`: set `activePathHint = { team: payload.teamId }`
- `beforeStateTransition`: set `activePathHint = { team: payload.teamId, state: payload.fromState, agent: payload.agentId }`
- `afterStateTransition`: set `activePathHint = { team: payload.teamId, state: payload.toState, agent: payload.agentId }`; also store `latestResultStatus`
- `beforeDelegation`: if no team path exists yet, set `activePathHint = { agent: payload.specialistId }`
- `afterDelegation`: store `latestResultStatus`; if `tokenUsage` exists, roll it into `snapshot.totalTokenUsage`
- `onArtifactWritten`:
  - `artifactType === "team_session"` -> set `snapshot.teamSession = artifact as TeamSessionArtifact`
  - `artifactType === "worklist_session"` -> set `snapshot.worklistSummary = (artifact as { summary: WorklistSummary }).summary`
  - `artifactType === "delegation_log"` is not expected from `onArtifactWritten`; reconstruction handles persisted logs through session entries
- `onSessionEnd`: set `completedAt` to the observer-receipt time and set `sessionStatusHint` from `latestResultStatus` if no `teamSession` terminal state is available

**Reconstruction rules to lock:**

When rebuilding from `ctx.sessionManager.getBranch()`:

- Start from an empty `DashboardSessionSnapshot`
- Iterate branch entries in order
- For each `entry.type === "custom"`:
  - `entry.customType === "delegation_log"` -> push `entry.data as DelegationLogEntry`
  - `entry.customType === "team_session"` -> set `snapshot.teamSession`
  - `entry.customType === "worklist_session"` -> set `snapshot.worklistSummary = (entry.data as { summary: WorklistSummary }).summary`
- After reconstruction:
  - if a `teamSession` exists, derive `sessionId`, `startedAt`, `completedAt`, `totalTokenUsage`, and terminal status from it
  - else leave the widget idle unless live hooks repopulate the snapshot

This keeps reconstruction **current-branch only** and avoids trying to recover in-flight state from transcripts.

### `tests/dashboard-projections.test.ts`

New test file for projection correctness.

**Test cases required:**

1. Full `TeamSessionArtifact` projects to terminal widget state with team/state/agent path
2. Live-only snapshot (`startedAt` + `activePathHint`, no team artifact) projects to `"running"`
3. Missing worklist summary -> `worklistProgress: null`, `hasBlockers: false`
4. No token data -> `totalTokens = 0`
5. Escalation artifact maps to `sessionStatus: "escalated"`
6. Failure artifact maps to `sessionStatus: "failed"`
7. `partial` result maps to `sessionStatus: "completed"`
8. Worklist math:
   - `completed = statusCounts.completed`
   - `remaining = pending + in_progress + blocked`
   - `blocked = statusCounts.blocked`
9. Elapsed time uses completed duration when both timestamps exist
10. Elapsed time uses `now - startedAt` when still running
11. Active path precedence favors live `activePathHint` over artifact-derived fallback

### `tests/dashboard-widget.test.ts`

New test file for widget formatting and dashboard extension behavior.

**Test cases required:**

1. Idle widget clears via `ctx.ui.setWidget(WIDGET_KEY, undefined)`
2. Running widget renders status line, stacked path, worklist line, and time/token line
3. Blocker indicator appears when `hasBlockers = true`
4. Escalation indicator appears when `hasEscalation = true`
5. Worklist line omits blocked suffix when `blocked = 0`
6. Missing path/worklist sections degrade gracefully without blank filler lines
7. Reconstruction from branch custom entries builds the expected snapshot
8. Session-switch reconstruction replaces prior state instead of merging stale data

## Files to Modify

### `extensions/shared/hooks.ts`

Add the global hook-installer seam here. This is the architectural wrinkle that Stage `5a.2` must resolve.

**Add these exports:**

```typescript
export type HookInstaller = (registry: HookRegistry) => void;

export function registerHookInstaller(installer: HookInstaller): () => void;
```

**Required implementation shape:**

```typescript
const GLOBAL_HOOK_INSTALLERS = new Set<HookInstaller>();

export function registerHookInstaller(installer: HookInstaller): () => void {
  GLOBAL_HOOK_INSTALLERS.add(installer);
  return () => {
    GLOBAL_HOOK_INSTALLERS.delete(installer);
  };
}

export function createHookRegistry(): HookRegistry {
  const registry = new HookRegistry();
  for (const installer of GLOBAL_HOOK_INSTALLERS) {
    installer(registry);
  }
  return registry;
}
```

**Important constraints:**

- Keep `createHookRegistry()` as the public factory used by the orchestrator
- Do not import dashboard code here
- Installers should only attach hooks; they should not dispatch events or perform UI work during registration
- `NULL_REGISTRY` remains unchanged

### `extensions/orchestrator/index.ts`

Standardize live artifact hook payloads so the dashboard can update from hook events without waiting for session reconstruction.

**Change the `team_session` path:**

```typescript
pi.appendEntry("team_session", sessionArtifact);
hookRegistry.dispatchObserver("onArtifactWritten", {
  artifactType: "team_session",
  taskId: teamTaskPacket.id,
  artifact: sessionArtifact,
});
```

**Change the `worklist_session` path:**

```typescript
const worklistArtifact = { worklist, summary: worklistSummary };
pi.appendEntry("worklist_session", worklistArtifact);
hookRegistry.dispatchObserver("onArtifactWritten", {
  artifactType: "worklist_session",
  taskId: firstTaskPacket.id,
  artifact: worklistArtifact,
});
```

**Do not add any dashboard import here.** The only shared integration point is `createHookRegistry()`, which now applies registered installers automatically.

### `tests/hooks.test.ts`

Extend the existing hook-substrate tests with installer coverage.

**Add test cases:**

1. Register installer -> newly created registry has the installer-applied observer
2. Unregister installer -> subsequent registries no longer receive it
3. Multiple installers apply in registration order

### `tests/hooks-integration.test.ts`

Extend integration coverage to verify the live artifact payload standardization.

**Add assertions that:**

- `onArtifactWritten` for `team_session` includes `payload.artifact`
- `onArtifactWritten` for `worklist_session` includes `payload.artifact`
- the dashboard-related live payloads remain compatible with a standalone observer extension

## What This Stage Does NOT Do

- **No `/dashboard` command** - that is Stage `5a.4`
- **No panel modules** - overview/tokens/execution-path/worklist/failures panels are deferred to `5a.4`
- **No multi-session navigation or tabs** - current branch/session only
- **No transcript scraping** - reconstruction is from custom entries and live hook events only
- **No custom TUI components** - line-array widget only
- **No below-editor placement** - use default above-editor widget placement
- **No change to `ArtifactHookPayload`** - the type already has `artifact?: unknown`
- **No orchestrator import of dashboard code** - the shared hook-installer seam is the only coupling point
- **No attempt to render full token trees, failure chains, or by-status worklist accounting** - that belongs to the detailed inspector

## Exit Criteria

- [ ] `docs/archive/HANDOFF_5A2.md` exists and is implementation-ready, matching the Stage `5a.1b` / `5a.1c` execution-guide style
- [ ] `extensions/dashboard/types.ts` defines `WidgetState`, `ActivePrimitivePath`, `WorklistProgressView`, and `DashboardSessionSnapshot`
- [ ] `extensions/dashboard/projections.ts` provides pure widget projections from structured inputs
- [ ] `extensions/dashboard/widget.ts` renders the persistent widget using `ctx.ui.setWidget()` with line arrays
- [ ] `extensions/dashboard/index.ts` reconstructs from `ctx.sessionManager.getBranch()` and updates live from hook observers
- [ ] `extensions/shared/hooks.ts` exports `HookInstaller` and `registerHookInstaller()` and applies installers from `createHookRegistry()`
- [ ] `extensions/orchestrator/index.ts` includes `artifact` in `onArtifactWritten` payloads for `team_session` and `worklist_session`
- [ ] `tests/dashboard-projections.test.ts` covers projection correctness and edge cases
- [ ] `tests/dashboard-widget.test.ts` covers widget rendering and reconstruction behavior
- [ ] `tests/hooks.test.ts` covers installer registration/unregistration
- [ ] `tests/hooks-integration.test.ts` covers live artifact payloads
- [ ] `make typecheck` passes
- [ ] `make test` passes

## Verification

```bash
make typecheck  # Must pass clean
make test       # Must pass (all existing + new dashboard/hook tests)
```
