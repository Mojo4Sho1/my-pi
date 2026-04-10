# Next Task

**Last updated:** 2026-04-10
**Owner:** Joe

## Task summary

T-22 — Implement durable onboarding documentation (Stage 1 of 5 in the layered context initialization side quest).

Create the core reference doc (`docs/LAYERED_ONBOARDING.md`), an ADR (`docs/adr/0002_LAYERED_CONTEXT_INITIALIZATION.md`), and a decision log entry that together define the layered onboarding model for fresh agents.

## Why this task is next

- The onboarding side quest (T-22 through T-26) was prioritized to establish the onboarding architecture before resuming live validation (T-10)
- Stage 1 creates the foundational documentation that all subsequent stages reference
- T-10 (live build-team validation) is deferred and will resume after T-26 completes

## Scope (in)

- Create `docs/LAYERED_ONBOARDING.md` — the full layered onboarding model (5 layers: L0–L4), onboarding profiles (orchestrator, specialist, team-state), stable-ref vs working-artifact distinction, factory-vs-run distinction, access model, relationship to contract-driven routing and index-first routing
- Create `docs/adr/0002_LAYERED_CONTEXT_INITIALIZATION.md` — ADR recording the decision
- Add entry to `DECISION_LOG.md` — reference the ADR

## Scope (out)

- Updating routing docs, conventions, indexes (that's Stage 2 / T-23)
- Creating directory scaffolding or YAML manifests (Stages 3–4 / T-24, T-25)
- Validation or archival of the design doc (Stage 5 / T-26)

## Relevant files

- Design doc: `docs/design/onboarding_layed_context.md`
- Staged implementation plan: `docs/design/ONBOARDING_IMPLEMENTATION_PLAN.md` (read Stage 1 section)
- Existing ADR for reference format: `docs/adr/0001_INDEX_FIRST_CONTEXT_ROUTING.md`
- Repo conventions: `docs/REPO_CONVENTIONS.md`
- Root bootstrap: `AGENTS.md`, `INDEX.md`
- Decision log: `DECISION_LOG.md`

## Recommended first reads

1. `docs/design/ONBOARDING_IMPLEMENTATION_PLAN.md` (Stage 1 section)
2. `docs/design/onboarding_layed_context.md` (full design doc — source of truth for the model)
3. `docs/adr/0001_INDEX_FIRST_CONTEXT_ROUTING.md` (ADR format reference)
4. `AGENTS.md` and `INDEX.md` (understand current bootstrap path)
5. `docs/REPO_CONVENTIONS.md` (truthfulness rule)

## Dependencies / prerequisites

- None — this is the first stage of the side quest

## Acceptance criteria (definition of done)

- `docs/LAYERED_ONBOARDING.md` exists and covers all 5 context layers (L0–L4) with purpose, examples, and "this layer answers" for each
- `docs/LAYERED_ONBOARDING.md` covers orchestrator, specialist, and team-state onboarding profiles
- `docs/LAYERED_ONBOARDING.md` clearly labels what is implemented now (conventions, structure, docs) vs what is planned (automated bundle assembly, runtime manifest loading)
- `docs/adr/0002_LAYERED_CONTEXT_INITIALIZATION.md` exists and follows the format of ADR 0001
- `DECISION_LOG.md` has a new entry referencing the ADR
- All three files cross-reference each other

## Verification checklist

- [ ] `docs/LAYERED_ONBOARDING.md` covers all 5 layers with concrete examples from this repo
- [ ] ADR follows the format of `docs/adr/0001_INDEX_FIRST_CONTEXT_ROUTING.md`
- [ ] Truthfulness rule respected: no claims of automated onboarding
- [ ] Decision log entry added with correct decision number
- [ ] Update `docs/handoff/CURRENT_STATUS.md`
- [ ] Update `docs/handoff/TASK_QUEUE.md` (mark T-22 done)
- [ ] Update `docs/handoff/NEXT_TASK.md` (point to T-23)

## Handoff protocol

After completing this task, follow the per-stage handoff protocol defined in `docs/design/ONBOARDING_IMPLEMENTATION_PLAN.md` (Handoff Integration section):
1. Update `CURRENT_STATUS.md` with what was completed
2. Mark T-22 as `done` in `TASK_QUEUE.md`
3. Update this file (`NEXT_TASK.md`) to point to T-23

## Risks / rollback notes

- The main risk is over-documenting or under-documenting. The LAYERED_ONBOARDING.md should be comprehensive but scannable — not a wall of text
- Do not claim automated onboarding bundle assembly or runtime manifest loading as implemented — those are future work
- Keep the doc aligned with the design doc's model but grounded in what this repo actually has today
