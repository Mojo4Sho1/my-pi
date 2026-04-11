# Next Task

**Last updated:** 2026-04-11
**Owner:** Joe

## Task summary

T-24 — Structural scaffolding for policies, onboarding, and artifacts (Stage 3 of 5 in the layered context initialization side quest).

Create the initial repo structure for onboarding-aware config and runtime artifacts. This stage should add `specs/policies/`, `specs/onboarding/`, and `artifacts/` with routing files, initial YAML manifests, placeholder runtime directories, and the smallest supporting index updates.

## Why this task is next

- Stages 1 and 2 are now complete, so the onboarding model is both durable and discoverable
- Stage 3 gives the repo the concrete directory scaffolding that later onboarding metadata and validation work depend on
- T-25 assumes these directories and manifest files already exist
- T-10 (live build-team validation) is deferred and will resume after T-26 completes

## Scope (in)

- Create `specs/policies/` with:
  - `specs/policies/_POLICIES_INDEX.md`
  - `specs/policies/onboarding-policy.yaml`
- Create `specs/onboarding/` with:
  - `specs/onboarding/_ONBOARDING_INDEX.md`
  - `specs/onboarding/orchestrator.yaml`
  - `specs/onboarding/specialist-default.yaml`
- Update `specs/_SPECS_INDEX.md` to route to the new subdirectories
- Create `artifacts/` scaffolding with:
  - `artifacts/_ARTIFACTS_INDEX.md`
  - `artifacts/team-sessions/.gitkeep`
  - `artifacts/validation/.gitkeep`
- Update `INDEX.md` and `AGENTS.md` to reflect the new `artifacts/` root and the stable-config vs runtime-artifact distinction

## Scope (out)

- Adding onboarding metadata fields to specialist/team schemas or templates (Stage 4 / T-25)
- Validation against all six scenarios, archival of the design doc, or future-work cleanup (Stage 5 / T-26)
- Any runtime manifest loading or automated onboarding assembly

## Relevant files

- Staged implementation plan: `docs/design/ONBOARDING_IMPLEMENTATION_PLAN.md` (read Stage 3 section)
- Durable reference: `docs/LAYERED_ONBOARDING.md`
- `specs/_SPECS_INDEX.md`
- `specs/schemas/SPECIALIST_AND_TEAM_YAML_SPEC.md`
- `docs/REPO_CONVENTIONS.md`
- `AGENTS.md`, `INDEX.md`

## Recommended first reads

1. `docs/design/ONBOARDING_IMPLEMENTATION_PLAN.md` (Stage 3 section)
2. `docs/LAYERED_ONBOARDING.md`
3. `specs/_SPECS_INDEX.md`
4. `specs/schemas/SPECIALIST_AND_TEAM_YAML_SPEC.md`
5. `AGENTS.md` and `INDEX.md`

## Dependencies / prerequisites

- T-23 complete

## Acceptance criteria (definition of done)

- `specs/_SPECS_INDEX.md` routes to both `specs/policies/` and `specs/onboarding/`
- Policy and onboarding YAML files are well-formed and point to concrete repo paths
- `artifacts/_ARTIFACTS_INDEX.md` explains the runtime-artifact root and its distinction from `specs/` and `docs/`
- `INDEX.md` and `AGENTS.md` reflect the new `artifacts/` directory truthfully
- No file claims that YAML loading or runtime manifest loading is implemented already

## Verification checklist

- [ ] `specs/policies/` exists with `_POLICIES_INDEX.md` and `onboarding-policy.yaml`
- [ ] `specs/onboarding/` exists with `_ONBOARDING_INDEX.md`, `orchestrator.yaml`, and `specialist-default.yaml`
- [ ] `artifacts/` exists with `_ARTIFACTS_INDEX.md`, `team-sessions/.gitkeep`, and `validation/.gitkeep`
- [ ] `specs/_SPECS_INDEX.md`, `INDEX.md`, and `AGENTS.md` route to the new structure
- [ ] Truthfulness rule respected: current runtime authority still described as TypeScript
- [ ] Update `docs/handoff/CURRENT_STATUS.md`
- [ ] Update `docs/handoff/TASK_QUEUE.md` (mark T-24 done)
- [ ] Update `docs/handoff/NEXT_TASK.md` (point to T-25)

## Handoff protocol

After completing this task, follow the per-stage handoff protocol defined in `docs/design/ONBOARDING_IMPLEMENTATION_PLAN.md` (Handoff Integration section):
1. Update `CURRENT_STATUS.md` with what was completed
2. Mark T-24 as `done` in `TASK_QUEUE.md`
3. Update this file (`NEXT_TASK.md`) to point to T-25

## Risks / rollback notes

- The main risk is over-claiming runtime behavior. These new YAML files are scaffolding and durable config/docs, not active runtime inputs yet.
- Keep the structure minimal and reviewable. This stage should create the directories and initial manifests without jumping ahead into Stage 4 metadata fields.
- `artifacts/` should be clearly marked as a runtime/session area, not a new durable-spec root.
