# Next Task

**Last updated:** 2026-04-07
**Owner:** Joe

## Task summary

Add snapshot/regression tests for the dashboard widget's line rendering across 8 major states. Create a new test file `tests/dashboard-widget-snapshots.test.ts` with inline string assertions comparing rendered line arrays against expected output.

## Why this task is next

- Tasks 03-05 (Tier 1-2) validated basic specialist delegation and multi-specialist chains
- Task 06 is the final Tier 2 task before moving to the more complex Tier 3 tasks (new specialist, command skeleton)
- Tests builder's ability to follow existing test patterns and produce conforming code

## Scope (in)

- Create `tests/dashboard-widget-snapshots.test.ts`
- Cover all 8 widget states: idle, running-early, running-mid-flight, with-blockers, with-escalation, completed-successfully, failed, escalated
- Use inline string assertions (compare rendered line arrays against expected strings)
- Follow existing test patterns from `tests/dashboard-widget.test.ts` and `tests/dashboard-projections.test.ts`

## Scope (out)

- Do not modify existing test files
- Do not use vitest file snapshots (`.snap` files)
- Do not change widget rendering logic

## Specialist flow

builder,tester

## Relevant files

- Reads from: `extensions/dashboard/widget.ts`, `extensions/dashboard/types.ts`, `extensions/dashboard/projections.ts`, `tests/dashboard-widget.test.ts`, `tests/dashboard-projections.test.ts`
- Creates: `tests/dashboard-widget-snapshots.test.ts`

## Dependencies / prerequisites

- Widget rendering functions exist in `extensions/dashboard/widget.ts`
- View model types defined in `extensions/dashboard/types.ts`

## Acceptance criteria (definition of done)

- Snapshot tests exist for all 8 widget states
- Each test asserts exact string array from `renderWidgetLines()`
- Tests use inline assertions (not vitest file snapshots)
- `make typecheck` passes
- `make test` passes (all tests including new ones)
- No existing test assertions modified (additive only)

## Verification checklist

- [ ] `tests/dashboard-widget-snapshots.test.ts` exists with tests for all 8 states
- [ ] Each state test uses inline string array comparison
- [ ] `make typecheck` passes
- [ ] `make test` passes
- [ ] No existing test files were modified
- [ ] Update `docs/handoff/CURRENT_STATUS.md` with results
- [ ] Mark Task 06 as `done` in `docs/handoff/TASK_QUEUE.md`
- [ ] Update `docs/handoff/NEXT_TASK.md` with Task 07

## Risks / rollback notes

- Widget line output format may change — snapshot tests will need updating if rendering logic changes
- If `renderWidgetLines()` is not exported or has a different signature, check `tests/dashboard-widget.test.ts` for the correct import pattern
