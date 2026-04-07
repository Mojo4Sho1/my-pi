# Stage 5a.1c — Deterministic Sandboxing and Path Protection: Execution Guide

Archived historical execution guide. This file is not part of the active handoff flow; active handoff docs live under `docs/handoff/`.

## Read First

- `STATUS.md` — current project state
- `DECISION_LOG.md` — Decision #38 (deterministic guardrails outrank learned permissioning)
- `docs/_IMPLEMENTATION_PLAN_INDEX.md` — route to the Stage 5a.1c section before opening the plan
- `docs/archive/HANDOFF_5A1B.md` — predecessor stage (hook substrate), to understand what was added

## What This Stage Does

Convert the existing architectural authority model into deterministic runtime enforcement. Today, read-only specialists receive `allowedWriteSet: []` in their packets, but nothing at runtime actually *prevents* a subprocess from writing outside its grant. This stage adds:

1. A **policy envelope** — a typed object attached to every delegation describing what the invocation may do
2. A **hardened launcher** — policy validation before subprocess spawn in `delegate.ts`
3. **Typed `PolicyViolation` records** — structured artifacts when boundaries are crossed
4. A **default authority model** — 7 read-only specialists, 2 narrow-write by explicit grant
5. **Integration with the hook substrate** — violations fire `onPolicyViolation` events

Status: implemented on 2026-04-02. Keep this file as historical execution context for the completed stage.

## Design Constraints

1. **Runtime authority is packet-derived, not specialist-self-declared** — the policy envelope comes from the delegation code, not the specialist
2. **Read-only specialists do not gain write access implicitly** — only builder and tester get write paths, only when the packet explicitly grants them
3. **Hidden file mutation is treated as a policy violation** — not silently tolerated
4. **Shell access is explicit and traceable** — the envelope declares whether shell is allowed
5. **Policy failures remain visible** — even if execution continues in degraded mode, the violation record exists
6. **Phase 1 focuses on the launcher level** — no OS-level process isolation. Enforcement is at the `delegate.ts` layer before spawn.

## Existing Patterns to Follow

- **Shared module pattern:** `extensions/shared/adequacy.ts` — JSDoc header with stage/decision reference, type imports from `./types.js`, exported interfaces and pure functions
- **Shared module pattern:** `extensions/shared/tokens.ts` (added in 5a.1) — utility functions with constants, type exports, pure logic
- **Test pattern:** `tests/tokens.test.ts` or `tests/hooks.test.ts` (added in 5a.1/5a.1b) — Vitest, JSDoc header, describe blocks

## Existing Code to Be Aware Of

**The read-only specialist set already exists in two places:**

1. `extensions/orchestrator/index.ts` line 29:
   ```typescript
   const READ_ONLY_SPECIALISTS = new Set([
     "planner", "reviewer",
     "spec-writer", "schema-designer", "routing-designer", "critic", "boundary-auditor",
   ]);
   ```

2. `extensions/teams/router.ts` line 284 — **incomplete**, only checks planner and reviewer:
   ```typescript
   allowedWriteSet: specialistId === "planner" || specialistId === "reviewer"
     ? []
     : taskPacket.allowedWriteSet,
   ```

This stage should consolidate the authority model into the sandbox module so both `index.ts` and `router.ts` use the same source of truth.

## Files to Create

### `extensions/shared/sandbox.ts`

New module. Core deliverable.

```typescript
/**
 * Deterministic sandboxing and path protection (Stage 5a.1c, Decision #38).
 *
 * Converts the architectural authority model (read-only specialists, bounded
 * write sets) into deterministic runtime enforcement. Every delegation carries
 * a PolicyEnvelope validated before subprocess spawn.
 */

import type {
  PolicyEnvelope,
  PolicyViolation,
  SpawnRecord,
} from "./types.js";
import type { SpecialistId } from "../orchestrator/select.js";
```

**Required exports:**

| Export | Type | Purpose |
|--------|------|---------|
| `READ_ONLY_SPECIALISTS` | `ReadonlySet<string>` | Canonical set of 7 read-only specialist IDs. Replaces the duplicate sets in `index.ts` and `router.ts`. |
| `WRITE_SPECIALISTS` | `ReadonlySet<string>` | Canonical set of 2 narrow-write specialist IDs (builder, tester). |
| `buildDefaultEnvelope(specialistId, taskPacket)` | function → `PolicyEnvelope` | Build a policy envelope for a specialist based on its authority class and the task packet's allowed paths. |
| `validateEnvelope(envelope)` | function → `string[]` | Validate that a policy envelope is structurally sound (no empty deny with write paths, etc.). Returns error messages or empty array. |
| `checkPathAccess(path, envelope, action)` | function → `PolicyViolation \| null` | Check whether a specific path access is allowed by the envelope. Returns a violation record or null. |
| `checkWritePaths(writePaths, envelope)` | function → `PolicyViolation[]` | Validate a set of write paths against the envelope. Returns all violations. |
| `createSpawnRecord(specialistId, envelope, outcome, reason?)` | function → `SpawnRecord` | Create a SpawnRecord artifact for traceability. |

**`buildDefaultEnvelope` logic:**

```typescript
export function buildDefaultEnvelope(
  specialistId: string,
  taskPacket: { allowedReadSet: string[]; allowedWriteSet: string[] }
): PolicyEnvelope {
  const isReadOnly = READ_ONLY_SPECIALISTS.has(specialistId);

  return {
    allowedWritePaths: isReadOnly ? [] : taskPacket.allowedWriteSet,
    allowedReadRoots: taskPacket.allowedReadSet,
    allowShell: !isReadOnly,       // read-only specialists don't need shell
    allowNetwork: false,            // default deny, can be overridden per-task
    allowProcessSpawn: !isReadOnly, // only write specialists may spawn subprocesses
    allowedCommands: undefined,     // no command allowlist by default
    forbiddenGlobs: [
      "**/.env",
      "**/.env.*",
      "**/credentials*",
      "**/secrets*",
      "**/*.pem",
      "**/*.key",
    ],
  };
}
```

**`checkPathAccess` logic:**

```typescript
export function checkPathAccess(
  path: string,
  envelope: PolicyEnvelope,
  action: "read" | "write"
): PolicyViolation | null {
  if (action === "write") {
    // Check against allowedWritePaths
    if (envelope.allowedWritePaths.length === 0) {
      return createViolation(path, envelope, "write_denied", ...);
    }
    // Check path is within allowedWritePaths
    const allowed = envelope.allowedWritePaths.some(wp => pathIsWithin(path, wp));
    if (!allowed) {
      return createViolation(path, envelope, "write_denied", ...);
    }
    // Check against forbiddenGlobs
    if (matchesForbiddenGlob(path, envelope.forbiddenGlobs)) {
      return createViolation(path, envelope, "glob_forbidden", ...);
    }
  }
  if (action === "read") {
    // Check path is within allowedReadRoots
    const allowed = envelope.allowedReadRoots.some(rr => pathIsWithin(path, rr));
    if (!allowed) {
      return createViolation(path, envelope, "read_denied", ...);
    }
  }
  return null;
}
```

**Path matching helpers** (private to the module):

- `pathIsWithin(target, root)` — check if target path is equal to or a child of root. Use simple string prefix matching with path separator awareness. Do NOT use `fs` or `path.resolve` — keep it pure and testable.
- `matchesForbiddenGlob(path, globs)` — check if path matches any forbidden glob pattern. Use a simple glob matcher (minimatch-style) or implement basic `**` and `*` matching. If a dependency is needed, note it — but prefer a minimal inline implementation for the initial version.

### `tests/sandbox.test.ts`

New test file.

**Test cases needed:**

1. **Authority model:**
   - `READ_ONLY_SPECIALISTS` contains all 7: planner, reviewer, critic, spec-writer, schema-designer, routing-designer, boundary-auditor
   - `WRITE_SPECIALISTS` contains exactly: builder, tester
   - Sets are disjoint (no specialist in both)
   - All 9 known specialists are covered by exactly one set

2. **`buildDefaultEnvelope`:**
   - Read-only specialist → `allowedWritePaths: []`, `allowShell: false`, `allowProcessSpawn: false`
   - Write specialist → `allowedWritePaths` matches task packet's `allowedWriteSet`, `allowShell: true`
   - `allowNetwork` defaults to `false` for all
   - `forbiddenGlobs` includes `.env` patterns
   - `allowedReadRoots` comes from task packet's `allowedReadSet`

3. **`validateEnvelope`:**
   - Valid envelope → no errors
   - Structurally invalid (e.g., negative values, missing required fields) → errors

4. **`checkPathAccess`:**
   - Write to allowed path → null (no violation)
   - Write to disallowed path → `PolicyViolation` with `violationType: "write_denied"`
   - Write to forbidden glob (`.env`) → `PolicyViolation` with `violationType: "glob_forbidden"`
   - Read from allowed root → null
   - Read from outside roots → `PolicyViolation` with `violationType: "read_denied"`
   - Write to empty `allowedWritePaths` (read-only envelope) → violation

5. **`checkWritePaths`:**
   - All paths allowed → empty array
   - Some paths disallowed → array of violations for those paths
   - Mix of allowed, denied, and forbidden → correct violations for each

6. **`createSpawnRecord`:**
   - Spawned record has correct fields
   - Blocked record includes reason

7. **Path matching edge cases:**
   - Exact path match
   - Subdirectory match (path is child of allowed root)
   - Partial prefix mismatch (e.g., `/src/foo` should not match `/src/foobar`)
   - Path separator handling

## Files to Modify

### `extensions/shared/types.ts`

**Add after the hook substrate types (added in 5a.1b):**

```typescript
// --- Sandboxing and Path Protection (Stage 5a.1c) ---

export interface PolicyEnvelope {
  /** Paths the invocation may write to */
  allowedWritePaths: string[];
  /** Root paths the invocation may read from */
  allowedReadRoots: string[];
  /** Whether shell execution is permitted */
  allowShell: boolean;
  /** Whether network access is permitted */
  allowNetwork: boolean;
  /** Whether process spawning is permitted */
  allowProcessSpawn: boolean;
  /** Specific commands allowed (if undefined, all non-forbidden commands ok when shell is allowed) */
  allowedCommands?: string[];
  /** Glob patterns that are always forbidden for writes */
  forbiddenGlobs?: string[];
}

export type PolicyViolationType =
  | "write_denied"
  | "read_denied"
  | "shell_denied"
  | "network_denied"
  | "spawn_denied"
  | "command_denied"
  | "glob_forbidden";

export interface PolicyViolation {
  timestamp: string;
  sessionId: string;
  invocationId: string;
  attemptedAction: string;
  targetPath?: string;
  targetCommand?: string;
  expectedPolicy: Partial<PolicyEnvelope>;
  violationType: PolicyViolationType;
  enforcementResult: "blocked" | "logged";
}

export interface SpawnRecord {
  timestamp: string;
  sessionId: string;
  specialistId: string;
  policyEnvelope: PolicyEnvelope;
  outcome: "spawned" | "blocked";
  blockReason?: string;
}
```

### `extensions/orchestrator/delegate.ts`

**Add import at top:**

```typescript
import {
  buildDefaultEnvelope,
  checkWritePaths,
  createSpawnRecord,
} from "../shared/sandbox.js";
```

**Build policy envelope and validate before spawn (~line 142, replacing the `TODO(5a.1)` comment):**

```typescript
// 2.7 Build and validate policy envelope (5a.1c)
const policyEnvelope = buildDefaultEnvelope(agentId, taskPacket);

// Check task packet's allowedWriteSet against the policy envelope
const writeViolations = checkWritePaths(taskPacket.allowedWriteSet, policyEnvelope);
if (writeViolations.length > 0) {
  // Fire policy violation hook events
  for (const violation of writeViolations) {
    input.hookRegistry?.dispatchObserver("onPolicyViolation", violation);
  }

  // Log spawn record as blocked
  const spawnRecord = createSpawnRecord(agentId, policyEnvelope, "blocked",
    `Policy violations: ${writeViolations.map(v => v.violationType).join(", ")}`);
  input.hookRegistry?.dispatchObserver("onArtifactWritten", { artifact: spawnRecord });

  const deniedPacket = createResultPacket({
    taskId: taskPacket.id,
    status: "failure",
    summary: `Delegation blocked by sandbox policy: ${writeViolations.length} violation(s) — ${writeViolations.map(v => `${v.violationType}: ${v.targetPath}`).join("; ")}`,
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
    summary: deniedPacket.summary,
    failureReason: "validation_failure",
  });
  return { resultPacket: deniedPacket, success: false };
}

// Record successful spawn
const spawnRecord = createSpawnRecord(agentId, policyEnvelope, "spawned");
input.hookRegistry?.dispatchObserver("onArtifactWritten", { artifact: spawnRecord });
```

**Important:** The `hookRegistry` parameter was added by 5a.1b. If 5a.1b is not yet complete when 5a.1c starts, use optional chaining (`input.hookRegistry?.`) to keep it non-breaking.

### `extensions/orchestrator/index.ts`

**Replace the local `READ_ONLY_SPECIALISTS` set (line 29) with import from sandbox module:**

```typescript
// Remove:
// const READ_ONLY_SPECIALISTS = new Set([...]);

// Add import:
import { READ_ONLY_SPECIALISTS } from "../shared/sandbox.js";
```

The rest of `index.ts` uses `READ_ONLY_SPECIALISTS.has(specialistId)` which continues to work unchanged.

### `extensions/teams/router.ts`

**Replace the inline read-only check (line 284) with the canonical authority model:**

```typescript
// Add import:
import { READ_ONLY_SPECIALISTS } from "../shared/sandbox.js";

// Replace the hardcoded planner/reviewer check:
// Before:
//   allowedWriteSet: specialistId === "planner" || specialistId === "reviewer"
//     ? []
//     : taskPacket.allowedWriteSet,

// After:
allowedWriteSet: READ_ONLY_SPECIALISTS.has(specialistId)
  ? []
  : taskPacket.allowedWriteSet,
```

This fixes the existing bug where the 5 new read-only specialists (spec-writer, schema-designer, routing-designer, critic, boundary-auditor) were not being given empty write sets in team routing.

### `extensions/orchestrator/delegate.ts` — `DelegationOutput`

**Add policy envelope to `DelegationOutput`:**

```typescript
export interface DelegationOutput {
  resultPacket: ResultPacket;
  success: boolean;
  sessionArtifact?: import("../shared/types.js").TeamSessionArtifact;
  reviewOutput?: StructuredReviewOutput;
  tokenUsage?: import("../shared/types.js").TokenUsage;
  /** Policy envelope used for this delegation */
  policyEnvelope?: import("../shared/types.js").PolicyEnvelope;
}
```

Include `policyEnvelope` in all return paths within `delegateToSpecialist`.

## What This Stage Does NOT Do

- **No OS-level sandboxing** — enforcement is at the launcher level in `delegate.ts`, not via process isolation
- **No dynamic user approval flows** — the system blocks or allows deterministically
- **No learned permission classification** — policies are explicit and inspectable (Decision #38)
- **No runtime enforcement of shell/network/spawn within the subprocess itself** — the subprocess is a Pi process; these constraints are declared in the envelope and enforced pre-spawn. Runtime enforcement of what happens *inside* the subprocess is deferred to "Isolated Execution Environments" in `FUTURE_WORK.md`.
- **No dashboard/widget integration** — 5a.2 will surface policy violations in the widget
- **Do not modify `subprocess.ts`** — policy checking happens in `delegate.ts` before calling `spawnSpecialistAgent`

## Exit Criteria

- [ ] `PolicyEnvelope`, `PolicyViolation`, `SpawnRecord`, `PolicyViolationType` types in `types.ts`
- [ ] `sandbox.ts` exports `READ_ONLY_SPECIALISTS`, `WRITE_SPECIALISTS`, `buildDefaultEnvelope`, `validateEnvelope`, `checkPathAccess`, `checkWritePaths`, `createSpawnRecord`
- [ ] `READ_ONLY_SPECIALISTS` contains all 7 read-only specialists
- [ ] `WRITE_SPECIALISTS` contains builder and tester
- [ ] `buildDefaultEnvelope` produces correct envelopes per authority class
- [ ] `checkPathAccess` and `checkWritePaths` correctly detect violations
- [ ] `delegate.ts` builds a policy envelope and validates before every spawn
- [ ] Policy violations fire `onPolicyViolation` hook events (if hook registry available)
- [ ] `SpawnRecord` artifacts emitted for every spawn (blocked or successful)
- [ ] `index.ts` imports `READ_ONLY_SPECIALISTS` from sandbox module (removes duplicate)
- [ ] `router.ts` uses `READ_ONLY_SPECIALISTS` from sandbox module (fixes the 5-specialist gap)
- [ ] `DelegationOutput` carries the `policyEnvelope`
- [ ] All existing tests still pass
- [ ] New tests cover: authority model, envelope building, path access checking, violation generation, spawn records, edge cases
- [ ] `make typecheck` passes
- [ ] `make test` passes

## Verification

```bash
make typecheck  # Must pass clean
make test       # Must pass (all existing + new sandbox tests)
```
