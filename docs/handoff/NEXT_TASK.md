# Next Task

**Last updated:** 2026-04-10
**Owner:** Joe

## Task summary

T-23 — Update conventions and routing docs (Stage 2 of 5 in the layered context initialization side quest).

Update the bootstrap path so fresh agents can discover the new onboarding model through normal repo routing. This stage should add a concise onboarding section to `docs/REPO_CONVENTIONS.md` and update `INDEX.md`, `docs/_DOCS_INDEX.md`, and `AGENTS.md` to point to `docs/LAYERED_ONBOARDING.md`.

## Why this task is next

- Stage 1 is now complete, so the onboarding model exists durably but is not yet on the normal bootstrap path
- Stage 2 makes the onboarding model discoverable through the same routing flow fresh agents already use
- T-24 and later stages depend on those routing and conventions updates
- T-10 (live build-team validation) is deferred and will resume after T-26 completes

## Scope (in)

- Update `docs/REPO_CONVENTIONS.md` with a concise onboarding section covering:
  - stable reference material vs working artifacts
  - narrow-by-default specialists
  - broader-but-bounded orchestrator onboarding
  - machine-first artifacts as canonical runtime inputs
  - factory-vs-run distinction
  - pointer to `docs/LAYERED_ONBOARDING.md`
- Update `INDEX.md` to route to `docs/LAYERED_ONBOARDING.md`
- Update `docs/_DOCS_INDEX.md` to route to `docs/LAYERED_ONBOARDING.md` and `docs/adr/0002_LAYERED_CONTEXT_INITIALIZATION.md`
- Update `AGENTS.md` Key Documents table to include `docs/LAYERED_ONBOARDING.md`

## Scope (out)

- Creating `specs/policies/`, `specs/onboarding/`, or `artifacts/` scaffolding (Stage 3 / T-24)
- Adding onboarding metadata to YAML schemas or templates (Stage 4 / T-25)
- Validation, archival, or future-work cleanup for the design doc (Stage 5 / T-26)

## Relevant files

- Durable reference: `docs/LAYERED_ONBOARDING.md`
- Staged implementation plan: `docs/design/ONBOARDING_IMPLEMENTATION_PLAN.md` (read Stage 2 section)
- Design doc: `docs/design/onboarding_layed_context.md`
- Repo conventions: `docs/REPO_CONVENTIONS.md`
- Root bootstrap: `AGENTS.md`, `INDEX.md`
- Docs router: `docs/_DOCS_INDEX.md`
- Decision log: `DECISION_LOG.md`

## Recommended first reads

1. `docs/design/ONBOARDING_IMPLEMENTATION_PLAN.md` (Stage 2 section)
2. `docs/LAYERED_ONBOARDING.md`
3. `docs/design/onboarding_layed_context.md` (Layer 1 / conventions / structure sections)
4. `AGENTS.md`, `INDEX.md`, and `docs/_DOCS_INDEX.md`
5. `docs/REPO_CONVENTIONS.md`

## Dependencies / prerequisites

- T-22 complete

## Acceptance criteria (definition of done)

- `docs/REPO_CONVENTIONS.md` has a concise onboarding section that reflects the layered model without duplicating the full doc
- `INDEX.md` routes to `docs/LAYERED_ONBOARDING.md`
- `docs/_DOCS_INDEX.md` routes to both `docs/LAYERED_ONBOARDING.md` and `docs/adr/0002_LAYERED_CONTEXT_INITIALIZATION.md`
- `AGENTS.md` Key Documents table includes `docs/LAYERED_ONBOARDING.md`
- The bootstrap path `AGENTS.md` -> `INDEX.md` -> `docs/_DOCS_INDEX.md` can discover the onboarding model cleanly

## Verification checklist

- [ ] `docs/REPO_CONVENTIONS.md` new section is concise and points to `docs/LAYERED_ONBOARDING.md`
- [ ] `INDEX.md` includes a route to `docs/LAYERED_ONBOARDING.md`
- [ ] `docs/_DOCS_INDEX.md` includes the onboarding doc and ADR 0002
- [ ] `AGENTS.md` includes the onboarding doc in Key Documents
- [ ] No new contradictions or duplicate routing guidance introduced
- [ ] Update `docs/handoff/CURRENT_STATUS.md`
- [ ] Update `docs/handoff/TASK_QUEUE.md` (mark T-23 done)
- [ ] Update `docs/handoff/NEXT_TASK.md` (point to T-24)

## Handoff protocol

After completing this task, follow the per-stage handoff protocol defined in `docs/design/ONBOARDING_IMPLEMENTATION_PLAN.md` (Handoff Integration section):
1. Update `CURRENT_STATUS.md` with what was completed
2. Mark T-23 as `done` in `TASK_QUEUE.md`
3. Update this file (`NEXT_TASK.md`) to point to T-24

## Risks / rollback notes

- The main risk is duplicating the full onboarding doc across multiple routing files. Keep the new section in `docs/REPO_CONVENTIONS.md` concise and reference the durable doc for depth.
- Keep the bootstrap path clean. The goal is discoverability, not a larger default read set.
- Do not claim policy files, onboarding manifests, or runtime loading as implemented in this stage.
