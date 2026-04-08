# Next Task

**Last updated:** 2026-04-07
**Owner:** Joe

## Task summary

Enhance the existing persistent widget to show real-time orchestration progress. During `orchestrate` tool execution, the widget should display which specialist is currently active, position in the chain, cumulative token count, and elapsed time. This gives the user visibility into what was previously a black box, and enables informed use of `/panic` if something stalls.

## Why this task is next

- The orchestrator is currently a black box — no visibility into which specialist is running or whether progress is being made
- The user needs this before running further live validation (T-10) to know when to invoke `/panic`
- The widget infrastructure already exists (5a.2): `ctx.ui.setWidget()`, hook observers in `extensions/dashboard/index.ts`, projection layer in `extensions/dashboard/projections.ts`

## Scope (in)

- Update `extensions/dashboard/index.ts` hook observers to capture live orchestration events:
  - `beforeDelegation` / `afterDelegation` — which specialist, position in chain
  - `beforeSubprocessSpawn` / `afterSubprocessExit` — subprocess active indicator
  - `onSessionStart` / `onSessionEnd` — elapsed time tracking
- Update widget rendering in `extensions/dashboard/widget.ts` to show during orchestration:
  - Active specialist name (e.g., "builder")
  - Chain progress (e.g., "2/4" or "building → builder")
  - Cumulative token count
  - Elapsed time
- For team runs, show current state machine state and specialist
- Ensure widget clears or shows summary when orchestration completes
- Add/update tests

## Scope (out)

- Full `/dashboard` command panels — this is widget-only
- Historical telemetry or session logs
- New hook events — use existing event surface
- Run registry integration in the widget (that's T-14)

## Specialist flow

This task should NOT use the orchestrator — it modifies the dashboard extension that observes the orchestrator. Implement directly.

## Relevant files

- Modifies: `extensions/dashboard/index.ts`, `extensions/dashboard/widget.ts`, `extensions/dashboard/projections.ts`, `extensions/dashboard/types.ts`
- References: `extensions/shared/hooks.ts` (event types), `extensions/orchestrator/index.ts` (hook dispatch points), `extensions/orchestrator/delegate.ts` (delegation events)
- Tests: `tests/dashboard-widget.test.ts`, `tests/dashboard-projections.test.ts`, `tests/dashboard-widget-snapshots.test.ts`

## Dependencies / prerequisites

- Widget infrastructure exists (Stage 5a.2)
- Hook event surface exists (Stage 5a.1b) — `beforeDelegation`, `afterDelegation`, `beforeSubprocessSpawn`, `afterSubprocessExit` already defined
- Token tracking exists (Stage 5a.1)

## Acceptance criteria (definition of done)

- During orchestration, widget shows: active specialist, chain position, token count, elapsed time
- During team runs, widget shows: current state, active specialist
- Widget updates in real time as specialists are invoked
- Widget shows summary or clears when orchestration completes
- Existing widget behavior (idle, completed, failed states) is preserved
- `make typecheck` passes
- `make test` passes

## Verification checklist

- [ ] Widget shows active specialist name during orchestration
- [ ] Widget shows chain progress (e.g., "2/4")
- [ ] Widget shows cumulative token count
- [ ] Widget shows elapsed time
- [ ] Team runs show state machine state
- [ ] Widget updates between specialist invocations
- [ ] Widget shows summary on completion
- [ ] Existing widget states still work
- [ ] `make typecheck` passes
- [ ] `make test` passes
- [ ] Update `docs/handoff/CURRENT_STATUS.md`
- [ ] Update `docs/handoff/TASK_QUEUE.md`
- [ ] Update `docs/handoff/NEXT_TASK.md`

## Risks / rollback notes

- The widget observer runs in the same process as the orchestrator — must not slow down or interfere with delegation
- Hook observer errors are isolated (existing error isolation from 5a.1b), so widget bugs won't crash orchestration
- Snapshot tests in `tests/dashboard-widget-snapshots.test.ts` may need updating if widget line format changes
