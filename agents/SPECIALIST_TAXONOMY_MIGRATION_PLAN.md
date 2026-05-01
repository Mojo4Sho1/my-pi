# Specialist Taxonomy Migration Plan

## Status

Working migration plan for the specialist taxonomy defined in
`agents/SPECIALIST_TAXONOMY_AND_CONTEXT_MODEL.md`.

This document tracks staged migration of the repository to the new
base-class-plus-variant specialist model. Items are checked only when the
work has actually been completed in the repository. Documentation work and
runtime work are tracked separately so that documentation changes are not
mistaken for runtime migration.

Open or contested implementation choices are recorded in
`agents/SPECIALIST_TAXONOMY_DECISION_LOG.md` and must not be silently
resolved while executing this plan.

---

## Distinction Between Stages

- Stage 1 — Documentation assimilation: purely textual changes to
  `agents/` and related `.md` files; no behavior change.
- Stage 2 — Specialist spec migration: markdown specialist definitions
  reflect base class, variant, and artifact responsibility.
- Stage 3 — Team documentation migration: team docs reflect the
  default everyday team and the conditional Scribe insertion, and
  point toward a future state-machine model.
- Stage 3.5 — YAML schema and template design: define the v1 YAML
  artifacts (specialist, team, context bundle, contract layers,
  invocation addendum, output template, effective-contract assembly)
  before any runtime/type metadata work begins.
- Stage 4 — Runtime/type metadata migration: TypeScript types and
  definitions begin to carry the grouped `taxonomy` metadata, and
  `tester` enters its alias-first migration toward `builder-test`.
- Stage 5 — Router and team definition migration: runtime team
  definitions evolve toward the state-machine model.
- Stage 6 — Validation: layered validation for taxonomy compliance is
  introduced in staged enforcement modes.
- Stage 7 — Cleanup and deprecation: alias lifecycle advancement,
  removal of transitional shims, and final-state taxonomy cleanup.

Documentation-only stages may complete without runtime changes. Runtime
stages must not be marked complete just because documentation has been
updated.

---

## Stage 1 — Documentation Assimilation

Goal: introduce the taxonomy vocabulary into the repository documentation
without changing any specialist behavior, runtime code, or tests.

- [x] Canonical taxonomy document added at
      `agents/SPECIALIST_TAXONOMY_AND_CONTEXT_MODEL.md`.
- [x] Migration plan created at
      `agents/SPECIALIST_TAXONOMY_MIGRATION_PLAN.md` (this document).
- [x] Decision log created at
      `agents/SPECIALIST_TAXONOMY_DECISION_LOG.md`.
- [x] `agents/_AGENTS_INDEX.md` references the taxonomy document and
      flags the future variant names for the current specialist roster.
- [x] `agents/AGENT_DEFINITION_CONTRACT.md` documents `base_class`,
      `variant`, `artifact_responsibility`, context presentation order,
      and context authority order as recognized concepts.
- [x] `agents/specialists/_SPECIALISTS_INDEX.md` lists each current
      specialist alongside its base class and intended variant name.
- [x] Each existing specialist `.md` carries a Taxonomy section with
      base class, current name, intended future variant name, artifact
      responsibility, and a migration note.
- [x] `agents/teams/_TEAMS_INDEX.md` references the canonical default
      everyday team and the conditional design-to-build team.
- [x] `STATUS.md` references the taxonomy assimilation pass without
      claiming runtime migration work has begun.

Acceptance criteria:

- The taxonomy document is reachable from the agents subtree index.
- No runtime code, TypeScript file, router file, package file, or test
  has been changed in this stage.
- Every specialist `.md` declares a base class.
- The `tester` doc preserves test-authoring responsibility but no
  longer implies that test execution alone justifies a specialist.
- Open implementation questions are captured in the decision log
  rather than being resolved silently.

---

## Stage 2 — Specialist Spec Migration

Goal: bring specialist documentation fully in line with the taxonomy,
including consistent base-class and variant annotations, explicit
artifact ownership, and migration notes for legacy names.

This stage may overlap with Stage 1, but is tracked separately because
deeper specification rewrites should be reviewed independently of the
initial assimilation pass.

- [x] Each specialist spec uses the canonical four base class
      vocabulary (`Planner`, `Scribe`, `Builder`, `Reviewer`) when
      describing its role.
- [x] Each specialist spec carries explicit canonical base-class and
      variant annotations (e.g. `base_class: Builder`,
      `variant: builder-test`).
- [x] `tester.md` is updated to clearly mark its responsibility as a
      Builder variant for test artifact authoring, with a migration
      note that points to `builder-test` as the canonical name and to
      D-O4 for runtime mechanics.
- [x] `doc-formatter.md` is updated to reflect that `doc-formatter`
      is **not** promoted to the canonical taxonomy (per D-D3). It is
      preserved only as a transitional utility, not a core specialist
      variant.
- [x] Specialist specs include migration notes for old names (current
      filename, canonical name, deprecated aliases, and migration
      status), aligned with D-D1.
- [x] Specialist specs include a context presentation order note where
      relevant (per D-O7 documentation stage).
- [x] Specialist specs include a context authority order note where
      relevant (per D-O7 documentation stage).
- [x] No file renames performed in this stage unless explicitly
      authorized.

Acceptance criteria:

- A reader can determine the base class and variant for every
  specialist by reading only the specialist file.
- No specialist behavior change is introduced beyond clarifying its
  documented role and boundaries.
- File renames are deferred to a later stage with their own decision
  entry (see D-O1).
- `doc-formatter` is documented as out-of-taxonomy per D-D3.

Likely affected files:

```text
agents/specialists/_SPECIALISTS_INDEX.md
agents/specialists/planner.md
agents/specialists/builder.md
agents/specialists/tester.md
agents/specialists/reviewer.md
agents/specialists/spec-writer.md
agents/specialists/schema-designer.md
agents/specialists/routing-designer.md
agents/specialists/critic.md
agents/specialists/boundary-auditor.md
agents/specialists/doc-formatter.md
```

---

## Stage 3 — Team Documentation Migration

Goal: align team documentation with the canonical default everyday
team, the conditional design-to-build team, and the eventual evolution
toward a state-machine team model.

- [ ] `agents/teams/_TEAMS_INDEX.md` documents the default everyday
      team `planner -> builder -> reviewer` (per D-T8 / D-O5).
- [ ] `agents/teams/_TEAMS_INDEX.md` documents the conditional
      design-to-build team `planner -> scribe -> builder -> reviewer`
      (per D-T9).
- [ ] `agents/teams/_TEAMS_INDEX.md` documents simple linear flows as
      human-readable shorthand only, and notes that future runtime
      team definitions will compile to or be expressed as state
      machines (per D-O6).
- [ ] Team docs note that conditional expansions should be encoded as
      transition logic or optional nodes once the state-machine model
      lands, not as unrelated duplicate teams.
- [ ] Team docs do not commit to a specific test-authoring expansion
      flow; D-O5 explicitly leaves that to the team / state-machine
      decisions.
- [ ] Existing team specs reference the taxonomy doc and note any
      planned migration of member identifiers.
- [ ] `agents/teams/specialist-creator.md` notes future
      reclassification of its members under the new variant names
      without changing runtime member identifiers in this stage.

Acceptance criteria:

- Team documentation does not imply that Scribe is mandatory for every
  implementation team.
- Team documentation does not imply that running tests alone requires
  a separate specialist.
- Team documentation makes clear that linear flows are shorthand and
  the canonical direction is a state-machine model (D-O6).
- No runtime team definition has been changed in this stage.

Likely affected files:

```text
agents/teams/_TEAMS_INDEX.md
agents/teams/specialist-creator.md
```

---

## Stage 3.5 — YAML Schema and Template Design

Goal: define the v1 YAML schemas, templates, and contract-layer
structure that will back later runtime/type metadata work. This stage
is a required checkpoint per D-A1 and D-O2; runtime metadata
migration (Stage 4) must not begin until this stage is complete,
unless the relevant decisions are explicitly superseded.

- [ ] Specialist definition YAML template defined.
- [ ] Team definition YAML template defined (state-machine ready,
      per D-O6).
- [ ] Context bundle YAML template defined, including
      `presentation_order` and `authority_order` (per D-O7 schema
      checkpoint).
- [ ] Modular contract layer template defined (universal, repository,
      base-class, variant, team/node, invocation addendum, output
      template reference).
- [ ] Invocation addendum template defined.
- [ ] Output template reference format defined.
- [ ] Effective-contract assembly model defined (how the layers
      compose into a single per-task effective contract for agent
      consumption).
- [ ] Field glossary written for the YAML artifacts.
- [ ] Required vs optional field rules documented.
- [ ] Alias and deprecation lifecycle fields included (per D-D1
      lifecycle states).
- [ ] Migration status fields included.
- [ ] At least one example specialist artifact committed.
- [ ] At least one example team artifact committed.
- [ ] At least one example contract / effective-contract artifact
      committed (clearly marked as an example).
- [ ] Validation expectations documented for each artifact type.
- [ ] Open questions for schema v2 logged.

Acceptance criteria:

- Templates and schemas exist before any runtime taxonomy metadata is
  added.
- Generated effective contracts are not committed by default. If
  example effective contracts are committed, they are clearly marked
  as examples.
- Suggested locations are populated as needed:
  ```text
  agents/schemas/
  agents/templates/
  agents/contracts/
  agents/examples/
  ```
- The schema explicitly supports the grouped `taxonomy` runtime
  shape from D-O3 so that Stage 4 can mirror or consume YAML metadata
  rather than independently redefining it.

This stage is intentionally documentation- and schema-only. It does
not change runtime code or tests. The `agents/schemas/`,
`agents/templates/`, `agents/contracts/`, and `agents/examples/`
directories should be created only when this stage is actually
started; the current taxonomy-decision pass should not pre-create
them.

---

## Stage 4 — Runtime and Type Metadata Migration

Goal: extend runtime metadata so specialists carry explicit base class
and variant fields using the grouped `taxonomy` object from D-O3.
This stage must not begin until Stage 3.5 is complete, unless D-O2
or D-A1 are explicitly superseded.

Likely future work:

- [ ] Add a grouped `taxonomy` field to the specialist configuration
      type in `extensions/shared/types.ts`:
      ```ts
      taxonomy: {
        baseClass: "Planner" | "Scribe" | "Builder" | "Reviewer",
        variant: string | null,
        artifactResponsibility: string[]
      }
      ```
- [ ] Runtime metadata mirrors or consumes the YAML/documentation
      metadata defined in Stage 3.5 rather than independently
      redefining it.
- [ ] Populate runtime specialist registrations with canonical base
      class and variant values consistent with the taxonomy.
- [ ] Generic Builder remains registered as `builder` (per D-O5). No
      `builder` -> `builder-code` rename is required at this stage.
- [ ] `tester` enters its staged alias-first migration toward
      `builder-test` (per D-O4):
      - canonicalName: builder-test
      - currentRuntimeId: tester
      - baseClass: Builder
      - variant: builder-test
      - deprecatedAliases: [tester]
      - migrationStatus: transitional
- [ ] Add `builder-test` as the canonical runtime identifier.
      `tester` resolves as a deprecated alias during the transition,
      with the lifecycle state set to `deprecated` (per D-D1).
- [ ] Runtime validation ensures each variant prefix matches its
      base class.

Acceptance criteria for this stage (when it is started):

- Specialist runtime configurations declare the grouped `taxonomy`
  object.
- Identifier transitions preserve current behavior until the cleanup
  stage.
- `tester` references continue to resolve via the deprecated alias.
- The default everyday team continues to use `builder` as the
  generic Builder.
- Tests still pass without taxonomy-driven assertions yet (those
  arrive in Stage 6).

Likely future-affected files (do not edit before this stage starts):

```text
extensions/shared/types.ts
extensions/shared/constants.ts
extensions/specialists/*/index.ts
extensions/specialists/*/prompt.ts
```

---

## Stage 5 — Router and Team Definition Migration

Goal: align runtime team definitions and routing with the canonical
default everyday team, the conditional design-to-build team, and the
state-machine model from D-O6. Simple flows compile to state machines
or are represented as shorthand; conditional expansions are encoded
as transition logic, not duplicate teams.

Likely future work:

- [ ] Update `extensions/teams/definitions.ts` to express the default
      everyday team (`planner -> builder -> reviewer`) in the
      state-machine target model.
- [ ] Express the conditional design-to-build team
      (`planner -> scribe -> builder -> reviewer`) as a state-machine
      variant or transition path, not a separate duplicate team.
- [ ] Each node declares a specialist or team target, input contract,
      output contract, retry policy, and allowed transitions.
- [ ] Retry loops are bounded.
- [ ] Completion and escalation states are explicit.
- [ ] Update `extensions/teams/router.ts` so transitions can use base
      class and variant identifiers without breaking existing teams.
- [ ] Conditional expansions (e.g. test-authoring) are encoded as
      transition logic or optional nodes.
- [ ] Eventual support for conditional transitions is preserved in
      the data model even where current routing is linear.
- [ ] Fan-out/fan-in and nested subteams are deferred unless a
      concrete team requires them. The model must not preclude them.

Acceptance criteria for this stage (when it is started):

- Existing teams continue to function using current identifiers until
  rename strategy is finalized.
- New team definitions use the canonical taxonomy names where the
  identifiers have been migrated.
- Routing logic does not silently broaden specialist scope.
- Retry, completion, and escalation states are explicit.

Likely future-affected files (do not edit before this stage starts):

```text
extensions/teams/definitions.ts
extensions/teams/router.ts
extensions/shared/types.ts
```

---

## Stage 6 — Validation

Goal: introduce layered validation for taxonomy compliance, in staged
enforcement modes, after the YAML schema/template work in Stage 3.5
is complete (per D-A2).

Validation categories (all required, staged):

1. **Specialist taxonomy validation**
   - [ ] Each registered specialist declares a valid base class.
   - [ ] Each variant prefix matches its base class.
   - [ ] Artifact responsibility is declared.
2. **Alias lifecycle validation**
   - [ ] Deprecated aliases declare a canonical target, reason,
         lifecycle state, and cleanup condition.
   - [ ] Validation warns or fails when deprecated aliases appear in
         new definitions, according to lifecycle state (per D-D1).
3. **Team definition and state-machine validation**
   - [ ] Team flows resolve to known specialists or aliases.
   - [ ] State-machine nodes declare input/output contracts, retry
         policies, and allowed transitions (per D-O6).
   - [ ] Bounded retries are enforced.
   - [ ] Completion and escalation states are reachable.
4. **Context bundle and contract-layer validation**
   - [ ] Context bundles include `presentation_order` and
         `authority_order` (per D-O7).
   - [ ] Contract layer composition rules are respected (lower
         layers may narrow, must not contradict).
5. **Runtime/docs alignment validation**
   - [ ] TypeScript taxonomy metadata mirrors or consumes the YAML
         metadata; drift is detected.

Enforcement staging:

- [ ] Manual checklist validation during documentation
      assimilation (already in use).
- [ ] Schema-based validation enabled in warning mode after Stage 3.5.
- [ ] Schema-based validation moved to failure mode once existing
      definitions comply.
- [ ] Runtime alignment validation enabled after Stage 4.
- [ ] Team state-machine validation enabled after Stage 5.

Acceptance criteria for this stage (when it is started):

- All current tests still pass during the transition.
- New validation tests assert taxonomy invariants without coupling to
  unstable internal naming choices.
- Exact test files, validation script names, and CI integration are
  decided in this stage (D-A2 explicitly defers them until now).

Likely future-affected files (do not edit before this stage starts):

```text
tests/orchestrator-select.test.ts
tests/orchestrator-delegate.test.ts
tests/orchestrator-team-e2e.test.ts
tests/team-router.test.ts
tests/validation-agents.test.ts
tests/validation-teams.test.ts
tests/tester.test.ts
```

---

## Stage 7 — Cleanup and Deprecation

Goal: finalize naming, advance deprecated aliases through the D-D1
lifecycle, and remove compatibility shims.

Alias lifecycle advancement (per D-D1):

```text
active -> deprecated -> blocked-for-new-use -> removal-candidate -> removed
```

Each migration stage that leaves a deprecated alias in place must
state the next condition required to advance that alias to the next
lifecycle state. The plan tracks this advancement explicitly:

- [ ] `tester` alias starts at `deprecated` once Stage 4 lands the
      alias.
- [ ] `tester` alias advances to `blocked-for-new-use` once
      validation (Stage 6) can fail on new uses.
- [ ] `tester` alias advances to `removal-candidate` once all known
      references have been migrated and tests confirm canonical
      names work.
- [ ] `tester` alias advances to `removed` only after an explicit
      decision-log update or migration-plan checkpoint is recorded.

General cleanup work:

- [ ] Decide on file rename strategy for specialist `.md` files
      (per D-O1).
- [ ] Apply file renames once D-O1 is settled.
- [ ] Remove transitional aliases once dependent code, tests, and
      documentation no longer reference the older names, and
      validation passes.
- [ ] Remove migration notes from specialist docs once the migration
      is complete.
- [ ] Clean up transitional docs once migration completes.

Acceptance criteria for this stage (when it is started):

- No remaining references to the retired `tester` specialist as an
  independent base-style specialist.
- All specialist files use base-class-prefixed names where applicable
  (subject to D-O1).
- The taxonomy document continues to be the single source of truth.
- Alias removal is gated on validation passing and on an explicit
  approval log entry, never on implicit cleanup.

---

## Migration Risk Notes

- Premature renames break existing routing keys, prompt templates,
  and tests; cleanup is intentionally deferred to its own stage.
- The Scribe/Builder boundary is conceptually load-bearing; rushing
  the test-authoring expansion ahead of Builder variant identifiers
  risks blurring that boundary.
- Compatibility aliases reduce churn but can hide incomplete
  migrations; they should always be paired with a removal entry in
  this plan and an explicit lifecycle state per D-D1.
- Decisions deferred to the decision log must not be re-decided
  silently inside an implementation patch.
- Skipping Stage 3.5 and adding runtime taxonomy metadata directly
  is explicitly out of scope per D-O2 and D-A1, unless those
  decisions are first superseded.
- Generated effective contracts must not be committed by default
  (D-A1). Committed examples must be clearly marked as examples.
