# Current Status

**Last updated:** 2026-04-11
**Owner:** Joe

## Current focus

Layered context initialization side quest (T-26). Stages 1 through 4 are now complete; the remaining work is the final validation, archival, and cleanup pass.

**Implementation plan:** `docs/design/ONBOARDING_IMPLEMENTATION_PLAN.md`

T-10 (live build-team validation) is deferred and will resume after T-26 completes.

## Completed in current focus

- Stage 0 (queue setup): task queue updated with T-22–T-26, T-10 deferred, handoff docs point to T-22
- Implementation plan saved to repo at `docs/design/ONBOARDING_IMPLEMENTATION_PLAN.md`
- Stage 1 (durable onboarding documentation) completed:
  - `docs/LAYERED_ONBOARDING.md` now defines the 5-layer model, onboarding profiles, stable-vs-working artifact distinction, factory-vs-run distinction, access model, and truthful implementation status
  - `docs/adr/0002_LAYERED_CONTEXT_INITIALIZATION.md` records the architectural decision in ADR form
  - `DECISION_LOG.md` now includes Decision #44 for layered context initialization
- Stage 2 (conventions and routing docs) completed:
  - `docs/REPO_CONVENTIONS.md` now has a concise layered-onboarding section that points to `docs/LAYERED_ONBOARDING.md`
  - `INDEX.md` and `docs/_DOCS_INDEX.md` now route fresh agents to the onboarding reference and ADR 0002
  - `AGENTS.md` now lists `docs/LAYERED_ONBOARDING.md` in Key Documents and no longer describes Stage 5a.7 as active
- Stage 3 (structural scaffolding) completed:
  - `specs/policies/` now exists with `_POLICIES_INDEX.md` and `onboarding-policy.yaml`
  - `specs/onboarding/` now exists with `_ONBOARDING_INDEX.md`, `orchestrator.yaml`, and `specialist-default.yaml`
  - `artifacts/` now exists with `_ARTIFACTS_INDEX.md` plus placeholder `team-sessions/` and `validation/` directories
  - `specs/_SPECS_INDEX.md`, `INDEX.md`, and `AGENTS.md` now route to the new structure while staying explicit that TypeScript remains the runtime authority
- Stage 4 (onboarding-aware spec fields) completed:
  - `specs/schemas/SPECIALIST_AND_TEAM_YAML_SPEC.md` now defines optional V1.1 onboarding metadata for specialist and team specs
  - `specs/specialists/SPECIALIST_TEMPLATE.yaml` and `specs/teams/TEAM_TEMPLATE.yaml` now include truthful declarative `onboarding:` examples
  - `specs/teams/build-team.yaml` now carries realistic onboarding metadata aligned to the canonical build-team flow
  - The spec layer remains explicit that onboarding metadata is declarative and not auto-loaded by the runtime yet

## Passing checks

- Run timestamp: `2026-04-11`
- `make typecheck`: pass
- `make test`: pass

## Known gaps / blockers

- T-26 is now the active target
- T-10 is deferred — do not resume until T-26 is complete
- `/next` skill not loading in Pi remains a separate background issue

## Decision notes for next session

- **Decision #44 landed:** layered context initialization is now a first-class architectural rule, with `docs/LAYERED_ONBOARDING.md` as the durable reference and ADR 0002 as the companion record
- **Config root decision:** policies and onboarding manifests go under `specs/` (not a new `.pi/` directory). If `specs/` becomes overloaded, a dedicated root is a future escalation path — documented in the implementation plan's Future Work section and will be added to `docs/FUTURE_WORK.md` in T-26.
- **Access model:** orchestrator reads policies/manifests; specialists receive context only via packet. Directory structure is for organization, not enforcement.
- **Key decisions from the design discussion:**
  - Layered onboarding with 5 context layers (L0–L4) adopted as first-class architectural rule
  - Specialists narrow by default; orchestrator broader but bounded
  - Factory-vs-run distinction reinforced in repo structure
  - Machine-first artifacts (YAML/JSON) canonical for routing; Markdown for human reference
- Treat Stage 5a.7 as the landed baseline for runtime behavior. The canonical flow remains `planner -> builder -> tester -> builder -> reviewer -> done`.

## Next task (single target)

T-26 — Onboarding Stage 5: Validation, archival, cleanup (see `NEXT_TASK.md`)

## Definition of done for next task

- Validate the onboarding work against the 6 scenarios and 9 acceptance criteria from `docs/design/onboarding_layed_context.md`
- Archive `docs/design/onboarding_layed_context.md` under `docs/archive/design/`
- Update `STATUS.md`, `DECISION_LOG.md`, and `docs/FUTURE_WORK.md` truthfully for the completed side quest
