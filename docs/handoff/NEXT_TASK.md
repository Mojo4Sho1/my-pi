# Next Task

**Last updated:** 2026-04-07
**Owner:** Joe

## Task summary

Run a real end-to-end `build-team` orchestration through `teamHint: "build-team"` and validate that the team router, state transitions, session artifact, and live widget all behave correctly in a live Pi session.

## Why this task is next

- T-09b is complete, so the user now has live visibility into orchestration progress and can monitor or panic a stalled run
- Stage 5a.3b is the next dependency gate before redesigning the tester role in 5a.3c
- The team router and artifacts are well covered by mocked tests, but they still need one real subprocess validation pass

## Scope (in)

- Restart Pi so the updated dashboard extension and teardown code are loaded
- Execute at least one real task via `orchestrate` with `teamHint: "build-team"`
- Verify the live widget during the run:
  - current team state
  - active specialist
  - elapsed time
  - cumulative token count
- Verify the build-team state trace follows the expected sequence:
  - planning -> building -> review -> testing -> done
- Inspect the produced team session artifact for:
  - complete state trace
  - coherent final outcome
  - token totals if present
- Document any live-only bugs or substrate issues discovered

## Scope (out)

- Redesigning the tester specialist role (that is T-11 / Stage 5a.3c)
- New dashboard panels or run registry views
- New routing features beyond fixing blockers discovered during live validation

## Specialist flow

This task should use the live system directly. Do not modify the dashboard first unless live validation exposes a concrete bug that blocks completion.

## Relevant files

- References: `docs/IMPLEMENTATION_PLAN.md` (Stage 5a.3b)
- References: `extensions/teams/router.ts`
- References: `extensions/teams/definitions.ts`
- References: `extensions/dashboard/index.ts`
- References: `extensions/dashboard/widget.ts`
- References: `extensions/orchestrator/index.ts`

## Dependencies / prerequisites

- T-09b live widget complete
- Pi must be restarted before validation so the current extensions are loaded
- `/panic` is available if a live run stalls

## Acceptance criteria (definition of done)

- At least one clean real `build-team` run completes via `teamHint: "build-team"` with no errors
- Widget visibly updates during the live run and shows state/specialist progress
- Team session artifact contains the expected state trace and final outcome
- No missing-transition or routing errors occur
- Any live-only defects found are documented and queued
- Update `docs/handoff/CURRENT_STATUS.md`
- Update `docs/handoff/TASK_QUEUE.md`
- Update `docs/handoff/NEXT_TASK.md`

## Verification checklist

- [ ] Restart Pi before validation
- [ ] Run a real `build-team` task through `teamHint`
- [ ] Observe widget updates during the run
- [ ] Confirm expected state transition order
- [ ] Inspect resulting team session artifact
- [ ] Record any live-only bugs with reproduction notes
- [ ] `make typecheck` passes after any fixes
- [ ] `make test` passes after any fixes

## Risks / rollback notes

- Live subprocess validation can surface issues not present in mocked tests: Pi CLI behavior, session lifecycle ordering, or specialist prompt/output drift
- If the run stalls, use `/panic` and check whether teardown fully settles descendants before retrying
- Avoid widening orchestration depth while validating; keep the task focused on the existing build-team path
