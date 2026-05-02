# Current Status

**Last updated:** 2026-05-02
**Owner:** Joe

## Current focus

**Specialist Taxonomy Migration phase is now active.** The active target is **T-32 — Stage 6 (Layered taxonomy validation)**.

T-10 (live build-team validation, Stage 5a.3b) is parked while the taxonomy migration phase runs. The layered onboarding side quest (T-22–T-26) and the 2026-04-30 taxonomy decision pass are both complete.

**Branch guard:** Taxonomy migration work T-27 through T-34 belongs on `taxonomy-migration`. A fresh agent should run `git branch --show-current` before editing and stop if the result is not `taxonomy-migration`.

**Authoritative inputs for the active task:**
- `agents/SPECIALIST_TAXONOMY_MIGRATION_PLAN.md` (Stage 6)
- `agents/SPECIALIST_TAXONOMY_AND_CONTEXT_MODEL.md` (team patterns, canonical names, and variant model)
- `agents/SPECIALIST_TAXONOMY_DECISION_LOG.md` (D-A2, D-D1, D-O3, D-O6, D-O7)
- `specs/schemas/SPECIALIST_AND_TEAM_YAML_SPEC.md`
- `docs/handoff/NEXT_TASK.md` (cold-start orientation and concrete edit list)

## Completed in current focus

- T-31 (Specialist Taxonomy Migration, Stage 5) completed:
  - Runtime team definitions now include `default-everyday-team`, `design-to-build-team`, and the existing `build-team` as explicit TypeScript state machines with bounded retries and explicit `done`/`failed` terminal states.
  - `build-team` now uses canonical `specialist_builder-test` for the test-authoring state while preserving the existing flow `planner -> builder -> builder-test -> builder -> reviewer -> done`.
  - Router agent resolution now accepts canonical and compatibility inputs for both short and full agent IDs: `builder-test`, `tester`, `specialist_builder-test`, and `specialist_tester`.
  - Team validation and contract/artifact context assembly use the shared T-30 alias resolver so legacy tester references continue to work through the deprecated alias path.
  - `design-to-build-team` uses current `specialist_spec-writer` rather than activating proposed Scribe aliases; proposed Scribe/Reviewer variant aliases remain metadata only.
  - No runtime YAML loading, T-32 layered enforcement, or T-33 alias cleanup was introduced.
- T-30 (Specialist Taxonomy Migration, Stage 4) completed:
  - `SpecialistPromptConfig` now carries grouped runtime taxonomy metadata: `canonicalName`, `currentRuntimeId`, `taxonomy`, `aliases`, and `migrationStatus`.
  - All current specialist prompt configs declare `taxonomy.baseClass`, `taxonomy.variant`, and `taxonomy.artifactResponsibility`; `doc-formatter` is explicitly marked out-of-taxonomy.
  - Generic `builder` remains the canonical generic Builder with `variant: null`; no `builder-code` rename was introduced.
  - `tester` is modeled as transitional metadata toward canonical `builder-test`, with a deprecated alias lifecycle entry.
  - `builder-test` is now the canonical runtime-resolvable selection/config identifier for test authoring; `tester` still resolves through the deprecated alias path to the same prompt config.
  - Only the D-O4 alias is behaviorally active. Proposed Scribe/Reviewer variant aliases remain metadata only and were not activated.
  - Focused tests now cover taxonomy metadata shape, variant prefix rules, builder generic status, tester alias lifecycle metadata, and `builder-test`/`tester` resolution.
  - Existing team runtime definitions were intentionally left for T-31.
- T-29 (Specialist Taxonomy Migration, Stage 3.5) completed:
  - `specs/schemas/SPECIALIST_AND_TEAM_YAML_SPEC.md` now defines the V2 schema surface for specialist definitions, team definitions, context bundles, contract layers, invocation addenda, output template references, and effective-contract assembly.
  - The schema doc includes a field glossary, required/optional rules, D-D1 alias/deprecation lifecycle fields, migration-status fields, validation expectations, and schema V2 open questions.
  - `specs/specialists/SPECIALIST_TEMPLATE.yaml`, `specs/teams/TEAM_TEMPLATE.yaml`, and `specs/teams/build-team.yaml` now carry V2 taxonomy/state-machine-ready fields while staying explicit that YAML is not runtime-loaded yet.
  - `specs/contracts/universal.md` and `specs/contracts/repository.md` define the committed universal and repository contract layers.
  - `specs/context/CONTEXT_BUNDLE_TEMPLATE.yaml` defines context bundles with `presentation_order` and `authority_order` per D-O7.
  - `specs/templates/` now contains stable output template references for plan, implementation, test, review, specification, schema, routing-design, critique, boundary-audit, and example artifacts.
  - `specs/examples/` includes clearly marked example specialist, team, and effective-contract artifacts. The effective-contract example is explicitly marked example-only; generated effective contracts are still not committed by default.
  - `specs/teams/default-everyday-team.yaml` and `specs/teams/design-to-build-team.yaml` provide state-machine-ready YAML for the settled default and conditional team shapes.
  - No runtime code, TypeScript files, router files, package files, or tests were changed for T-29.
- T-28 (Specialist Taxonomy Migration, Stage 3) completed:
  - `agents/teams/_TEAMS_INDEX.md` documents the default everyday team `planner -> builder -> reviewer`.
  - `agents/teams/_TEAMS_INDEX.md` documents the conditional design-to-build team `planner -> scribe -> builder -> reviewer` and states that Scribe is conditional, not mandatory.
  - `agents/teams/_TEAMS_INDEX.md` now calls linear flows human-readable shorthand and points to the D-O6 state-machine direction for runtime-capable team definitions.
  - Team docs avoid committing to a specific test-authoring expansion flow beyond the settled taxonomy rule that `builder-test` is a Builder variant.
  - `agents/teams/specialist-creator.md` references the taxonomy and migration plan, and notes planned member reclassification under new variant names without changing runtime member identifiers.
- T-27 (Specialist Taxonomy Migration, Stage 2) completed:
  - Every specialist definition now carries explicit `base_class`, `variant`, `canonical_name`, alias, migration-status, and artifact-responsibility metadata.
  - `tester.md` points at canonical `builder-test`, marks `tester` as a deprecated alias per D-O4/D-D1, and frames test work as Builder-variant test artifact authoring.
  - `builder.md` reflects D-O5 as canonical: `builder` remains the generic Builder; no `builder` -> `builder-code` rename is required.
  - `doc-formatter.md` reflects D-D3: it is not promoted into the canonical taxonomy and remains only a transitional utility / validation artifact.
  - The five proposed reclassifications (`scribe-spec`, `scribe-schema`, `scribe-routing`, `reviewer-critic`, `reviewer-boundary-auditor`) keep their proposed canonical variant names and include D-D1 lifecycle notes.
  - `agents/specialists/_SPECIALISTS_INDEX.md` now summarizes base class, canonical variant, alias, and migration status for each specialist.
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

- Run timestamp: `2026-05-02`
- `make typecheck`: pass
- `make test`: pass (658 tests)

## Known gaps / blockers

- None blocking T-32. T-31 router/team definition migration is complete.
- T-32 must stay limited to layered taxonomy validation. It should not perform T-33 alias lifecycle advancement or cleanup.
- Systematic alias removal is now tracked as T-35 after T-34 merge, on a dedicated post-migration branch. Aliases should remain compatibility scaffolding until that isolated cleanup pass.
- T-10 is parked behind the active taxonomy migration phase, not blocked. A future agent will return to it after T-34 lands the taxonomy migration on `main`; it does not need to wait for the separate T-35 alias-removal branch.
- D-O1 (specialist filename rename strategy) remains `Open` and is intentionally not resolved by T-27. It is the only decision-log Open item left in the taxonomy track.
- `/next` skill not loading in Pi remains a separate background issue.

## Decision notes for next session

- **Specialist taxonomy decisions assimilated (doc-only pass):** `agents/SPECIALIST_TAXONOMY_DECISION_LOG.md` and `agents/SPECIALIST_TAXONOMY_MIGRATION_PLAN.md` have been updated. Previously Open/Deferred/Agreed-needs-detail entries D-O2, D-O3, D-O4, D-O5, D-O6, D-O7, D-A1, D-A2, D-D1, and D-D3 are now `Canonical` (or `Canonical decision; implementation pending` / `Canonical direction; implementation deferred`). D-D2 remains `Deferred` with an explicit activation condition. D-O1 (specialist filename rename strategy) is the only Open item remaining for the taxonomy track. Stage 3.5 (YAML schema and template design) was added as a required checkpoint before any runtime/type metadata migration. Future agents must execute T-27 through T-33 in order and must not silently re-decide entries marked `Open`, `Proposed`, or `Deferred`.
- **Decision #44 landed:** layered context initialization is now a first-class architectural rule, with `docs/LAYERED_ONBOARDING.md` as the durable reference and ADR 0002 as the companion record
- **Decision #45 landed:** policies and onboarding manifests stay under `specs/` rather than a new config root. If the policy/onboarding surface later overloads `specs/`, a dedicated config root is the documented future escalation path.
- **Access model:** orchestrator reads policies/manifests; specialists receive context only via packet. Directory structure is for organization, not enforcement.
- **Key decisions from the design discussion:**
  - Layered onboarding with 5 context layers (L0–L4) adopted as first-class architectural rule
  - Specialists narrow by default; orchestrator broader but bounded
  - Factory-vs-run distinction reinforced in repo structure
  - Machine-first artifacts (YAML/JSON) canonical for routing; Markdown for human reference
- Treat Stage 5a.7 plus T-31 as the landed baseline for runtime behavior. The canonical build-team flow now uses `planner -> builder -> builder-test -> builder -> reviewer -> done`; `tester` remains a deprecated compatibility alias.
- The onboarding source design doc is now archived. Use `docs/LAYERED_ONBOARDING.md`, ADR 0002, and the archived design doc only when historical rationale is needed.

## Next task (single target)

T-32 — Specialist Taxonomy Migration, Stage 6 (Layered taxonomy validation). See `NEXT_TASK.md` for the cold-start orientation, concrete edit list, and verification checklist.

## Definition of done for next task

- Layered taxonomy validation covers specialist taxonomy metadata, alias lifecycle metadata, team state-machine references, and runtime/docs alignment in staged enforcement mode.
- Deprecated aliases remain resolvable during T-32; validation may warn or assert metadata shape but must not remove compatibility paths.
- T-33 alias lifecycle advancement and cleanup remain out of scope.
- Typecheck and tests pass.
