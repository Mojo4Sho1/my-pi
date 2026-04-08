# Next Task

**Last updated:** 2026-04-08
**Owner:** Joe

## Task summary

Resume T-10 / Stage 5a.3b by running live build-team validation against the now-stabilized Stage 5a.7 runtime. The goal is to verify the canonical `planner -> builder -> tester -> builder -> reviewer -> done` flow in a real Pi session and capture truthful validation artifacts, not to redesign the substrate again from scratch.

## Why this task is next

- Stage 5a.7 is complete, so the redesign dependency that had paused live validation is now gone
- T-21 tightened regression coverage and contradiction-sensitive docs/specs, which means the next uncertainty is live runtime behavior rather than local contract drift
- T-11 through T-14 remain follow-on work and should stay behind this live validation pass unless T-10 exposes a concrete reason to reprioritize them

## Scope (in)

- Run at least one bounded live `teamHint: "build-team"` validation task
- Verify the canonical team-router ordering and session-artifact trace in a real Pi execution
- Apply the Stage 5a.3 methodology:
  - task-level verification for the chosen live task
  - substrate-level verification for widget, artifacts, hooks, tokens, sandbox, loops, and resilience
- Record findings in `docs/validation/results/`
- Fix the smallest truthful substrate issues encountered if they are local and clear enough to land within the task

## Scope (out)

- Broad contract/artifact redesign work unless a live run exposes a concrete bug that requires a small fix
- New YAML runtime loading or schema expansion work
- New `/dashboard` command design work
- Resuming T-11 through T-14 preemptively without evidence from the live validation pass

## Relevant files

- References: `docs/IMPLEMENTATION_PLAN.md` (Stage 5a.3b only)
- References: `docs/validation/METHODOLOGY.md`
- References: `docs/validation/_VALIDATION_INDEX.md`
- References: `extensions/teams/router.ts`
- References: `extensions/teams/definitions.ts`
- References: `extensions/orchestrator/index.ts`
- References: `extensions/dashboard/index.ts`
- References: `extensions/shared/hooks.ts`
- References: `extensions/shared/subprocess.ts`
- References: `docs/validation/results/`
- References: `docs/handoff/CURRENT_STATUS.md`
- References: `docs/handoff/TASK_QUEUE.md`

## Recommended first reads

1. `docs/IMPLEMENTATION_PLAN.md` (Stage 5a.3b only)
2. `docs/validation/METHODOLOGY.md`
3. `docs/validation/_VALIDATION_INDEX.md`
4. the smallest relevant existing validation result artifact in `docs/validation/results/`
5. `extensions/teams/router.ts` only if the live run exposes a substrate issue that needs a fix

## Likely implementation hotspots

- The first live run should validate the canonical build-team ordering and the session artifact trace rather than re-proving unit-test behavior already covered locally
- If issues appear, expect the most likely hotspots to be team routing, subprocess execution, dashboard/widget observation, and session-artifact completeness
- Keep result logging disciplined so the next fresh-context agent can distinguish substrate failure from task-level failure

## Dependencies / prerequisites

- Stage 5a.7 complete
- T-21 complete
- Stage 5a.3 methodology and result-writing rules available in `docs/validation/METHODOLOGY.md`

## Acceptance criteria (definition of done)

- At least one live `build-team` run completes cleanly or fails with a precise, reproducible substrate blocker
- The canonical Stage 5a.7 flow is either observed in the live trace or the exact divergence is documented
- A validation result artifact is written under `docs/validation/results/`
- Any landed fixes remain bounded and truthful
- Update `docs/handoff/CURRENT_STATUS.md`
- Update `docs/handoff/TASK_QUEUE.md`
- Update `docs/handoff/NEXT_TASK.md`

## Verification checklist

- [ ] Run a live `teamHint: "build-team"` task
- [ ] Evaluate task-level verification for the chosen live task
- [ ] Evaluate the Stage 5a.3 substrate checks (tokens, widget, session artifacts, hooks, sandbox, loops, resilience)
- [ ] Write a result artifact in `docs/validation/results/`
- [ ] Run `make typecheck` and `make test` if code changes land
- [ ] Update `CURRENT_STATUS.md`
- [ ] Update `TASK_QUEUE.md`
- [ ] Update `NEXT_TASK.md`

## Risks / rollback notes

- Live Pi behavior may expose environment-specific blockers; record exact behavior instead of smoothing it over with guesses
- Avoid turning this into a new redesign pass. If a live run finds deeper drift, fix the smallest truthful slice and log any remaining follow-on work
- Keep the result artifact clear about what was directly observed versus inferred from local regression coverage
