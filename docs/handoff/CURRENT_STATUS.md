# Current Status

**Last updated:** 2026-04-11
**Owner:** Joe

## Current focus

Main track resumed: T-10 live build-team validation (Stage 5a.3b). The layered context initialization side quest (T-22 through T-26) is complete.

**Implementation plan:** `docs/IMPLEMENTATION_PLAN.md` (Stage 5a.3b) plus `docs/validation/METHODOLOGY.md`

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
- Stage 5 (validation, archival, cleanup) completed:
  - All 6 validation scenarios from the source design doc passed, covering specialist narrow onboarding, orchestrator layered onboarding, stable-vs-working separation, build-team state onboarding, revalidation rules, and seed compatibility
  - All 9 acceptance criteria from the source design doc are now satisfied
  - `docs/LAYERED_ONBOARDING.md` truthfulness was corrected to reflect that onboarding manifests and policy scaffolding now exist as declarative files under `specs/`
  - The source design doc was archived to `docs/archive/design/onboarding_layed_context.md`
  - `DECISION_LOG.md` now includes Decision #45 for keeping onboarding/policy config under `specs/` with a future escalation trigger
  - `docs/FUTURE_WORK.md` now captures the deferred onboarding follow-ons with explicit revisit triggers

## Passing checks

- Run timestamp: `2026-04-11`
- `make typecheck`: pass
- `make test`: pass

## Known gaps / blockers

- T-10 is now the active target
- `/next` skill not loading in Pi remains a separate background issue

## Decision notes for next session

- **Decision #44 landed:** layered context initialization is now a first-class architectural rule, with `docs/LAYERED_ONBOARDING.md` as the durable reference and ADR 0002 as the companion record
- **Decision #45 landed:** policies and onboarding manifests stay under `specs/` rather than a new config root. If the policy/onboarding surface later overloads `specs/`, a dedicated config root is the documented future escalation path.
- **Access model:** orchestrator reads policies/manifests; specialists receive context only via packet. Directory structure is for organization, not enforcement.
- **Key decisions from the design discussion:**
  - Layered onboarding with 5 context layers (L0–L4) adopted as first-class architectural rule
  - Specialists narrow by default; orchestrator broader but bounded
  - Factory-vs-run distinction reinforced in repo structure
  - Machine-first artifacts (YAML/JSON) canonical for routing; Markdown for human reference
- Treat Stage 5a.7 as the landed baseline for runtime behavior. The canonical flow remains `planner -> builder -> tester -> builder -> reviewer -> done`.
- The onboarding source design doc is now archived. Use `docs/LAYERED_ONBOARDING.md`, ADR 0002, and the archived design doc only when historical rationale is needed.

## Next task (single target)

T-10 — Team state machine e2e validation (see `NEXT_TASK.md`)

## Definition of done for next task

- Build-team completes at least one real task end-to-end through `teamHint: "build-team"`
- Validation results are recorded truthfully with both task-level and substrate-level findings
- Any live routing or artifact bugs discovered are either fixed or documented clearly for follow-on work
