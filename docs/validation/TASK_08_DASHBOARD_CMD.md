# Task 08 — /dashboard Command Skeleton

**Tier:** 3 (high complexity)
**Stress-test focus:** Multi-file creation from existing spec, 5a.4 head start

## Objective

Create the `/dashboard` command skeleton with the overview panel, giving a head start on Stage 5a.4. The command should register via `pi.registerCommand()` and render a basic session overview.

## Task Specification

> Implement the `/dashboard` command skeleton as specified in Stage 5a.4 of `docs/IMPLEMENTATION_PLAN.md`. For this task, implement only the command registration and the Overview panel — the remaining 4 panels (Tokens, Execution Path, Worklist, Failures) are deferred.
>
> Create:
>
> 1. `extensions/dashboard/command.ts` — Register `/dashboard` via `pi.registerCommand()`. When invoked, reconstruct the current session snapshot (reuse `reconstructSnapshotFromBranch` from `extensions/dashboard/index.ts`) and render the overview panel.
>
> 2. `extensions/dashboard/panels/overview.ts` — Render the Overview panel: session status, active team/state/specialist, top-line work progress (from worklist), failure/escalation state, token total, terminal outcome when completed. Output as a formatted string array suitable for `ctx.ui.notify()` or similar display.
>
> 3. `tests/dashboard-command.test.ts` — Test command registration and overview rendering. Verify: command registers with correct name, overview renders with full data, overview handles missing optional data gracefully.
>
> Reuse existing projection functions from `extensions/dashboard/projections.ts` and types from `extensions/dashboard/types.ts`. Do not duplicate projection logic. Do not implement the other 4 panels yet.
>
> Reference: use `docs/_IMPLEMENTATION_PLAN_INDEX.md` to route to Stage 5a.4 in `docs/IMPLEMENTATION_PLAN.md`. Use `docs/PI_EXTENSION_API.md` for Pi command registration API.

## Expected Specialist Flow

Build-team state machine: planning → building → review → testing → done

1. **Planner** — reads the 5a.4 spec and designs the command structure, decides how to scope the overview-only subset
2. **Builder** — creates command.ts, panels/overview.ts, and the test file
3. **Reviewer** — validates the implementation against the plan and existing patterns
4. **Tester** — runs tests and validates

## Stress-Test Focus

- Does the build-team handle a task with an existing detailed spec?
- Can the planner correctly scope a subset of a larger stage?
- Does the builder reuse existing modules (projections, types) rather than duplicating?
- Can the builder create files in a new subdirectory (`panels/`)?
- Does the full state machine complete, including potential revision loops?
- How much token budget does a multi-file creation task consume?

## Layer 1 — Verification Checklist

| # | Assertion |
|---|-----------|
| T1 | `extensions/dashboard/command.ts` exists and registers `/dashboard` command |
| T2 | `extensions/dashboard/panels/overview.ts` exists with overview rendering function |
| T3 | Overview shows: session status, active path, worklist progress, blocker/escalation state, token total |
| T4 | Overview handles missing data gracefully (no worklist, no tokens, no active path) |
| T5 | Projection functions from `projections.ts` are reused (not duplicated) |
| T6 | `tests/dashboard-command.test.ts` exists with tests for registration and rendering |
| T7 | `make typecheck` passes |
| T8 | `make test` passes (all existing + new tests) |
| T9 | No other panels are implemented (only overview) |
| T10 | No existing dashboard files were modified (additive only) |

## Notes

- **Files touched:** Creates `extensions/dashboard/command.ts`, `extensions/dashboard/panels/overview.ts`, `tests/dashboard-command.test.ts`
- **Risk:** Medium — must integrate with existing dashboard module and Pi command API. But additive only (no existing file modifications).
- **Pi command API:** `pi.registerCommand({ name, description, handler })` — see `docs/PI_EXTENSION_API.md`
- **Reuse targets:** `projectWidgetState()` and `projectWorklistProgress()` from `extensions/dashboard/projections.ts`, `DashboardSessionSnapshot` and `WidgetState` from `extensions/dashboard/types.ts`, `reconstructSnapshotFromBranch()` from `extensions/dashboard/index.ts`
- **Why overview only:** Keeps the task bounded. The remaining panels can be added in a later validation task or in Stage 5a.4 proper.
