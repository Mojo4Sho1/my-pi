# Next Task

**Last updated:** 2026-04-11
**Owner:** Joe

## Task summary

T-25 — Onboarding-aware spec fields (Stage 4 of 5 in the layered context initialization side quest).

Extend the durable YAML schema and starter templates so specialist and team specs can declare onboarding metadata. This stage should add optional onboarding fields to the schema doc, update both templates, and add realistic onboarding metadata to `specs/teams/build-team.yaml`.

## Why this task is next

- Stages 1 through 3 are now complete, so the repo has the durable docs, routing path, and directory scaffolding needed for declarative onboarding metadata
- Stage 4 makes onboarding needs expressible inside the durable spec layer without claiming runtime loading exists yet
- T-26 depends on these schema and template updates for the final validation pass
- T-10 (live build-team validation) remains deferred until T-26 completes

## Scope (in)

- Update `specs/schemas/SPECIALIST_AND_TEAM_YAML_SPEC.md` with optional onboarding metadata fields for specialists and teams
- Update `specs/specialists/SPECIALIST_TEMPLATE.yaml` with an illustrative `onboarding:` section
- Update `specs/teams/TEAM_TEMPLATE.yaml` with an illustrative `onboarding:` section
- Update `specs/teams/build-team.yaml` with realistic onboarding metadata aligned to the canonical build-team flow

## Scope (out)

- Runtime loading of onboarding manifests from YAML
- Automated onboarding bundle assembly or prompt construction from the new metadata
- Stage 5 cleanup, design-doc archival, future-work additions, or repo-wide validation scenarios

## Relevant files

- Staged implementation plan: `docs/design/ONBOARDING_IMPLEMENTATION_PLAN.md` (read Stage 4 section)
- Durable reference: `docs/LAYERED_ONBOARDING.md`
- `specs/schemas/SPECIALIST_AND_TEAM_YAML_SPEC.md`
- `specs/specialists/SPECIALIST_TEMPLATE.yaml`
- `specs/teams/TEAM_TEMPLATE.yaml`
- `specs/teams/build-team.yaml`
- `specs/onboarding/specialist-default.yaml`

## Recommended first reads

1. `docs/design/ONBOARDING_IMPLEMENTATION_PLAN.md` (Stage 4 section)
2. `specs/schemas/SPECIALIST_AND_TEAM_YAML_SPEC.md`
3. `specs/specialists/SPECIALIST_TEMPLATE.yaml`
4. `specs/teams/TEAM_TEMPLATE.yaml`
5. `specs/teams/build-team.yaml`
6. `docs/LAYERED_ONBOARDING.md`

## Dependencies / prerequisites

- T-24 complete

## Acceptance criteria (definition of done)

- `specs/schemas/SPECIALIST_AND_TEAM_YAML_SPEC.md` defines the optional onboarding fields for both specialists and teams
- Both YAML templates show truthful onboarding examples and mark the new section as declarative metadata
- `specs/teams/build-team.yaml` includes realistic onboarding metadata for the build-team flow
- Existing specs remain valid without the new fields
- No file claims that onboarding metadata is auto-loaded at runtime already

## Verification checklist

- [ ] Schema doc has a new onboarding metadata section for specialists and teams
- [ ] `specs/specialists/SPECIALIST_TEMPLATE.yaml` includes an example `onboarding:` block
- [ ] `specs/teams/TEAM_TEMPLATE.yaml` includes an example `onboarding:` block
- [ ] `specs/teams/build-team.yaml` includes realistic onboarding metadata
- [ ] Truthfulness rule respected: onboarding metadata described as declarative, not runtime-loaded
- [ ] Update `docs/handoff/CURRENT_STATUS.md`
- [ ] Update `docs/handoff/TASK_QUEUE.md` (mark T-25 done)
- [ ] Update `docs/handoff/NEXT_TASK.md` (point to T-26)

## Handoff protocol

After completing this task, follow the per-stage handoff protocol defined in `docs/design/ONBOARDING_IMPLEMENTATION_PLAN.md` (Handoff Integration section):
1. Update `CURRENT_STATUS.md` with what was completed
2. Mark T-25 as `done` in `TASK_QUEUE.md`
3. Update this file (`NEXT_TASK.md`) to point to T-26

## Risks / rollback notes

- The main risk is over-claiming runtime behavior. These fields are declarative metadata and examples, not active runtime inputs yet.
- Keep the changes minimal and schema-focused. Do not jump ahead into runtime loading or broad cleanup work from Stage 5.
- Build-team onboarding metadata should reflect the canonical flow without inventing unsupported enforcement semantics.
