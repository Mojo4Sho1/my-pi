# Next Task

**Last updated:** 2026-04-07
**Owner:** Joe

## Task summary

Build the `/dashboard` command skeleton with an Overview panel only. Reuse the existing dashboard projections and types; keep the implementation additive.

## Why this task is next

- Task 07 is complete, including verification and handoff updates
- Task 08 is the remaining Tier 3 validation task for Stage 5a.3
- It provides a bounded head start on Stage 5a.4 without requiring the full multi-panel inspector

## Scope (in)

- Create `extensions/dashboard/command.ts`
- Create `extensions/dashboard/panels/overview.ts`
- Create `tests/dashboard-command.test.ts`
- Register `/dashboard` via `pi.registerCommand()`
- Implement only the Overview panel
- Reuse existing dashboard projections/types instead of duplicating logic

## Scope (out)

- Do not implement the Tokens, Execution Path, Worklist, or Failures panels yet
- Do not modify existing dashboard files unless strictly required for additive command wiring
- Do not duplicate projection logic already available in `extensions/dashboard/projections.ts`

## Specialist flow

planner,builder,reviewer,tester

## Relevant files

- Reads from: `docs/IMPLEMENTATION_PLAN.md`, `docs/PI_EXTENSION_API.md`, `extensions/dashboard/index.ts`, `extensions/dashboard/projections.ts`, `extensions/dashboard/types.ts`, `tests/dashboard-widget.test.ts`, `docs/validation/TASK_08_DASHBOARD_CMD.md`
- Creates: `extensions/dashboard/command.ts`, `extensions/dashboard/panels/overview.ts`, `tests/dashboard-command.test.ts`

## Dependencies / prerequisites

- Existing dashboard projection layer is implemented under `extensions/dashboard/`
- Stage 5a.4 specification exists in `docs/IMPLEMENTATION_PLAN.md`
- Pi command API reference exists in `docs/PI_EXTENSION_API.md`

## Acceptance criteria (definition of done)

- `extensions/dashboard/command.ts` exists and registers `/dashboard`
- `extensions/dashboard/panels/overview.ts` exists and renders the Overview panel
- Overview output includes session status, active path, work progress, blocker/escalation state, and token total when available
- Overview handles missing optional data gracefully
- Existing projection functions/types are reused rather than duplicated
- `tests/dashboard-command.test.ts` exists with command-registration and overview-rendering coverage
- No other dashboard panels are implemented in this task
- `make typecheck` passes
- `make test` passes

## Verification checklist

- [ ] `extensions/dashboard/command.ts` exists and registers `/dashboard`
- [ ] `extensions/dashboard/panels/overview.ts` exists with overview rendering
- [ ] Overview includes required top-line session data
- [ ] Overview handles missing optional data gracefully
- [ ] Projection logic is reused, not duplicated
- [ ] `tests/dashboard-command.test.ts` exists with registration/rendering coverage
- [ ] No other panels were implemented
- [ ] `make typecheck` passes
- [ ] `make test` passes
- [ ] Update `docs/handoff/CURRENT_STATUS.md` with results
- [ ] Mark Task 08 as `done` in `docs/handoff/TASK_QUEUE.md`
- [ ] Update `docs/handoff/NEXT_TASK.md` with the next queued task or explicit backlog note

## Risks / rollback notes

- The command API details must match Pi’s current extension surface exactly
- The task should stay additive; avoid destabilizing existing dashboard widget behavior
- `TASK_QUEUE.md` currently references `TASK_08_DASHBOARD_COMMAND.md`, but the existing validation spec file is `docs/validation/TASK_08_DASHBOARD_CMD.md`; use the file that exists in the repo
