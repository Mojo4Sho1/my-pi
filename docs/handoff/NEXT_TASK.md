# Next Task

**Last updated:** 2026-04-07
**Owner:** Joe

## Task summary

Re-run Stage 5a.3b live team validation now that teardown safety is in place. The immediate target is a clean `build-team` execution through `teamHint` with a fresh Pi restart so the runtime is using the new panic/teardown code.

## Why this task is next

- Stage 5a.6 is complete and no longer blocks orchestration work.
- The last live build-team attempt was inconclusive because the session was using stale extension code.
- We need one trustworthy live team run before moving on to more orchestration changes.

## Scope (in)

- Restart Pi so the loaded extensions include the Stage 5a.6 teardown changes.
- Re-run the live build-team validation scenario that previously exposed the stale-code/routing confusion.
- Capture whether the team run now completes cleanly through `teamHint`.
- If the live run exposes new runtime defects, fix them if they are small and local; otherwise document them precisely and queue them.
- Update the relevant validation result artifact and handoff docs with the outcome.

## Scope (out)

- New dashboard features
- Additional specialist redesign work beyond what is required to get a clean live validation run
- Broad architecture replanning

## Specialist flow

Use the actual team/orchestrator path being validated. This task is about proving the live runtime behavior, not only local unit coverage.

## Relevant files

- `docs/IMPLEMENTATION_PLAN.md` (Stage 5a.3b)
- `docs/validation/results/RESULT_08_DASHBOARD_CMD.md`
- `extensions/teams/router.ts`
- `extensions/orchestrator/index.ts`
- `extensions/shared/run-registry.ts`
- `extensions/shared/teardown.ts`

## Dependencies / prerequisites

- Stage 5a.6 complete
- Pi session restarted before live validation

## Acceptance criteria (definition of done)

- Live build-team run completes with no stale-code confusion and no routing errors
- The run does not leave orphaned subprocesses behind
- Outcome is documented in the validation results and handoff files
- `make typecheck` passes
- `make test` passes

## Verification checklist

- [ ] Restart Pi before running live validation
- [ ] Clean build-team run via `teamHint`
- [ ] No orphaned descendants after completion/cancel
- [ ] Validation result artifact updated
- [ ] `make typecheck` passes
- [ ] `make test` passes
- [ ] Update `docs/handoff/CURRENT_STATUS.md`
- [ ] Update `docs/handoff/TASK_QUEUE.md`
- [ ] Update `docs/handoff/NEXT_TASK.md`

## Risks / rollback notes

- Live Pi sessions can still mislead if the extension host was not restarted.
- If the run fails, preserve exact symptoms; the next fix should target the runtime defect rather than re-opening teardown work blindly.
