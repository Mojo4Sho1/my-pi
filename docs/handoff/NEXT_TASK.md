# Next Task

**Last updated:** 2026-04-11
**Owner:** Joe

## Task summary

T-10 — Team state machine end-to-end validation (Stage 5a.3b follow-on).

Resume live build-team validation now that Stage 5a.7 and the onboarding side quest are both complete. This task should validate the actual `teamHint: "build-team"` router path on real implementation work, capture truthful result artifacts, and surface any remaining runtime gaps in the canonical team flow.

## Why this task is next

- The layered onboarding side quest (T-22 through T-26) is now complete, so the main track can resume
- Stage 5a.7 already reconciled contracts, artifacts, and the canonical build-team flow
- T-10 is the next blocked-on-nothing validation step for proving the live team router
- T-11 through T-14 remain intentionally behind T-10

## Scope (in)

- Run at least one real build-team validation task through the team router
- Use the two-layer validation method from `docs/validation/METHODOLOGY.md`
- Record result artifacts under `docs/validation/results/`
- Fix any concrete substrate bugs found when feasible inside the task
- Update handoff/state docs truthfully with findings and any follow-on issues

## Scope (out)

- Broad roadmap replanning beyond the validation findings
- Unrelated feature work not surfaced by the live validation pass
- Pulling T-11 through T-14 forward unless T-10 findings make that necessary

## Relevant files

- Staged implementation plan: `docs/IMPLEMENTATION_PLAN.md` (read Stage 5a.3b section)
- Validation methodology: `docs/validation/METHODOLOGY.md`
- Validation router: `docs/validation/_VALIDATION_INDEX.md`
- Handoff docs: `docs/handoff/CURRENT_STATUS.md`, `docs/handoff/TASK_QUEUE.md`, `docs/handoff/NEXT_TASK.md`
- `STATUS.md`
- `extensions/teams/definitions.ts`
- `extensions/teams/router.ts`
- `docs/validation/results/`

## Recommended first reads

1. `docs/IMPLEMENTATION_PLAN.md` (Stage 5a.3b section)
2. `docs/validation/METHODOLOGY.md`
3. `docs/validation/_VALIDATION_INDEX.md`
4. `docs/handoff/CURRENT_STATUS.md`
5. `STATUS.md`
6. the smallest relevant prior validation result artifact

## Dependencies / prerequisites

- T-26 complete

## Acceptance criteria (definition of done)

- Build-team completes a real task end-to-end via `teamHint: "build-team"`
- State trace in the session artifact matches the canonical Stage 5a.7 flow
- No missing-transition errors occur in the live team-router path
- Result artifacts record both task-level and substrate-level findings truthfully
- Any residual runtime bugs are either fixed or documented clearly for follow-on work

## Verification checklist

- [ ] Read the Stage 5a.3b section and validation methodology
- [ ] Choose the smallest appropriate live validation task to run next
- [ ] Execute build-team via the team router, not the sequential specialist chain
- [ ] Record a result artifact with Layer 1 and Layer 2 findings
- [ ] Fix or document any substrate issues surfaced by the run
- [ ] Update handoff docs with truthful outcomes

## Handoff protocol

After completing this task:
1. Update `CURRENT_STATUS.md` with what the live run proved and what it exposed
2. Update `TASK_QUEUE.md` if T-10 completes or if new follow-on work must be promoted
3. Update this file (`NEXT_TASK.md`) to the next concrete validation or bug-fix target

## Risks / rollback notes

- The main risk is slipping back into mocked or sequential-specialist validation instead of exercising the live team-router path.
- Keep result artifacts truthful about what was observed directly versus inferred.
- If a live run exposes a real substrate bug, fix the bug or document it clearly before moving on.
