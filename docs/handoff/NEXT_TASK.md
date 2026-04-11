# Next Task

**Last updated:** 2026-04-11
**Owner:** Joe

## Task summary

T-26 — Validation, archival, cleanup (Stage 5 of 5 in the layered context initialization side quest).

Validate the onboarding side-quest work against the design scenarios and acceptance criteria, archive the design doc now that durable references exist, and finish the truthfulness/cleanup pass that returns the repo to the main track.

## Why this task is next

- Stages 1 through 4 are complete, so the durable docs, routing changes, scaffolding, and onboarding-aware spec fields are all in place
- The remaining work is now verification and cleanup rather than new structure
- T-26 is the final side-quest stage before T-10 can resume
- The design doc should be archived only after the durable replacements and validation pass are complete

## Scope (in)

- Validate the onboarding work against the 6 scenarios in `docs/design/onboarding_layed_context.md`
- Validate the 9 acceptance criteria from the onboarding design
- Check cross-references among the new onboarding docs, indexes, and spec files
- Archive `docs/design/onboarding_layed_context.md` to `docs/archive/design/`
- Update `STATUS.md` to reflect the completed onboarding side quest
- Add the planned `DECISION_LOG.md` entry for the `specs/` extension decision
- Add the onboarding follow-on items to `docs/FUTURE_WORK.md`
- Update `docs/handoff/CURRENT_STATUS.md`, `docs/handoff/TASK_QUEUE.md`, and `docs/handoff/NEXT_TASK.md` to hand control back to T-10

## Scope (out)

- New runtime loading for onboarding manifests
- New orchestration features beyond the cleanup/future-work items already called out in the onboarding plan
- Resuming T-10 implementation work before T-26 is complete

## Relevant files

- Staged implementation plan: `docs/design/ONBOARDING_IMPLEMENTATION_PLAN.md` (read Stage 5 section)
- Source design doc to validate and then archive: `docs/design/onboarding_layed_context.md`
- Durable reference: `docs/LAYERED_ONBOARDING.md`
- Handoff docs: `docs/handoff/CURRENT_STATUS.md`, `docs/handoff/TASK_QUEUE.md`, `docs/handoff/NEXT_TASK.md`
- `STATUS.md`
- `DECISION_LOG.md`
- `docs/FUTURE_WORK.md`
- `specs/onboarding/orchestrator.yaml`
- `specs/onboarding/specialist-default.yaml`
- `specs/schemas/SPECIALIST_AND_TEAM_YAML_SPEC.md`
- `specs/teams/build-team.yaml`

## Recommended first reads

1. `docs/design/ONBOARDING_IMPLEMENTATION_PLAN.md` (Stage 5 section)
2. `docs/design/onboarding_layed_context.md`
3. `docs/LAYERED_ONBOARDING.md`
4. `docs/handoff/CURRENT_STATUS.md`
5. `STATUS.md`
6. `DECISION_LOG.md`

## Dependencies / prerequisites

- T-25 complete

## Acceptance criteria (definition of done)

- All 6 onboarding validation scenarios are checked and documented truthfully
- All 9 acceptance criteria from the design doc are checked and documented truthfully
- Cross-references among onboarding docs/specs/indexes are correct
- `docs/design/onboarding_layed_context.md` is archived rather than deleted
- `STATUS.md` reflects the onboarding side quest truthfully
- `DECISION_LOG.md` records the `specs/` extension decision with the future escalation trigger
- `docs/FUTURE_WORK.md` contains the planned onboarding follow-on items with revisit triggers
- Handoff docs point back to T-10 as the resumed active task

## Verification checklist

- [ ] Validate Scenario 1: specialist narrow onboarding
- [ ] Validate Scenario 2: orchestrator layered onboarding
- [ ] Validate Scenario 3: stable reference vs working artifact separation
- [ ] Validate Scenario 4: build-team state onboarding
- [ ] Validate Scenario 5: human edit + revalidation guidance
- [ ] Validate Scenario 6: seed compatibility
- [ ] Check the 9 acceptance criteria from the design doc
- [ ] Archive `docs/design/onboarding_layed_context.md` to `docs/archive/design/`
- [ ] Update `STATUS.md`
- [ ] Update `DECISION_LOG.md`
- [ ] Update `docs/FUTURE_WORK.md`
- [ ] Update handoff docs and restore T-10 as the next active target

## Handoff protocol

After completing this task, follow the final-stage protocol in `docs/design/ONBOARDING_IMPLEMENTATION_PLAN.md`:
1. Update `CURRENT_STATUS.md` to note the side quest is complete
2. Mark T-26 as `done` in `TASK_QUEUE.md`
3. Update this file (`NEXT_TASK.md`) to point back to T-10
4. Restore the main track as active in the handoff docs

## Risks / rollback notes

- The main risk is overstating what has been implemented. Keep the validation and cleanup pass explicit that onboarding manifests/spec metadata are still declarative scaffolding, not runtime-loaded inputs.
- Archive the design doc only after checking the durable replacements and cross-references.
- Do not resume T-10 early; the main track should come back only after the full T-26 pass is complete.
