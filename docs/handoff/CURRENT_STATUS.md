# Current Status

**Last updated:** 2026-05-02
**Owner:** Joe

## Current focus

**Specialist Taxonomy Migration Stage 4 is ready.** The active target is
**T-30 — Runtime/type metadata migration**.

T-29b, T-29c, T-29d, and T-29e are complete. T-29b assimilated
`docs/design/SCHEMA_HARDENING_AMENDMENT_PLAN.md` into the durable
campaign and handoff docs. T-29c hardened the schema/spec/template
surface to v2.1. T-29d added concrete specialist YAML for the runtime
metadata migration prerequisites before T-30. T-29e re-verified that
all hardened YAML and Markdown front matter parses cleanly and
reconciled the migration plan checkbox/dependency text with the
handoff docs that mark T-29c/T-29d complete and T-30 active.

T-10 (live build-team validation, Stage 5a.3b) remains parked while the
taxonomy migration phase runs.

**Branch guard:** Taxonomy migration work T-27 through T-34, including
inserted tasks T-29b/T-29c/T-29d, belongs on `taxonomy-migration`. A
fresh agent should run `git branch --show-current` before editing and
stop if the result is not `taxonomy-migration`.

## Stage 3.6 status note

Stage 3.5 was completed previously: the repository has YAML
schema/template checkpoint artifacts under `specs/`.

A later schema review found hardening issues that should be resolved
before runtime metadata migration. The review is recorded in
`docs/design/SCHEMA_HARDENING_AMENDMENT_PLAN.md`; that document is the
authoritative source for Stage 3.6.

Stage 3.6 has been inserted between T-29 and T-30:

```text
T-29  — done
T-29b — done
T-29c — done
T-29d — done
T-29e — done
T-30  — active
T-31  — blocked on T-30
T-32  — blocked on T-30/T-31
T-33  — blocked on T-32
T-34  — blocked on T-33
```

T-30 is unblocked because the Stage 3.6 schema/template hardening and
concrete specialist YAML prerequisites are complete.

No runtime changes were made as part of T-29b. No TypeScript, tests,
runtime extension files, or `specs/` implementation files were edited for
T-29b.

## Stale-state correction

Some pre-amendment handoff text in this repository treated T-30/T-31 as
complete and T-32 as active. For this campaign ordering, that state is
stale and superseded by
`docs/design/SCHEMA_HARDENING_AMENDMENT_PLAN.md`. The queue returned to
the inserted Stage 3.6 work first; with T-29d complete, T-30 is the
active runtime/type metadata migration target.

## Completed in current focus

- T-29e (Stage 3.6 YAML formatting and handoff consistency fix) completed:
  - Verified that every YAML file under `specs/specialists/`,
    `specs/context/`, `specs/teams/`, and `specs/examples/` parses
    cleanly with PyYAML 6.0.3.
  - Verified that the YAML front matter in every output template under
    `specs/templates/` parses cleanly (`_TEMPLATES_INDEX.md` is an
    index document with no front matter, which is expected).
  - Reconciled `agents/SPECIALIST_TAXONOMY_MIGRATION_PLAN.md` Stage 3.6
    section with the handoff docs: T-29d is now `[x]`, the dependency
    text now says T-30 is unblocked because T-29d/T-29e are complete,
    and an explicit T-29e entry was added to the Stage 3.6 task list.
  - Inserted because the migration plan still listed T-29d as `[ ]`
    and "T-30 blocked" while the queue, NEXT_TASK, CURRENT_STATUS, and
    STATUS already showed T-30 active. That contradiction had to be
    closed before T-30 began.
  - No runtime code, TypeScript, tests, extension files, or `specs/`
    schema files were changed.
- T-29d (Stage 3.6 concrete specialist YAML readiness) completed:
  - Concrete v2.1 specialist YAML now exists for `planner`, `builder`,
    `builder-test`, `reviewer`, and `scribe-spec`.
  - `builder-test` is represented as canonical; `tester` appears only as
    deprecated compatibility metadata for current runtime id/config/tool
    surfaces.
  - `scribe-spec` is included because active team specs directly target
    that canonical Scribe variant; this does not activate unrelated
    Scribe aliases.
  - `specs/_SPECS_INDEX.md` now records that remaining specialist YAML
    files may be added incrementally as later tasks need them.
  - No runtime code, TypeScript, tests, or extension files were changed.
- T-29c (Stage 3.6 schema/template hardening) completed:
  - `specs/schemas/SPECIALIST_AND_TEAM_YAML_SPEC.md` now documents the
    v2.1 schema surface.
  - Specialist specs now use explicit `identifiers`, first-class
    `taxonomy`, `artifact_boundaries`, split definition/taxonomy/runtime
    status fields, and alias advancement metadata.
  - Context bundles now separate `presentation_order` from
    `authority_model`, with repository/universal constraints documented
    as non-overridable.
  - Team specs and examples now use object-shaped state targets; their
    `state_to_specialist_mapping` blocks are compatibility-only views.
  - Output templates now have parseable YAML front matter.
  - Effective-contract examples are labeled as examples and no longer
    claim `generated: true`.
  - Pi platform projection boundaries are documented in the specs index
    and schema reference.
  - No runtime code, TypeScript, tests, or extension files were changed.
- T-29b (Stage 3.6 plan assimilation) completed:
  - `docs/handoff/TASK_QUEUE.md` now includes T-29b, T-29c, and T-29d.
  - `docs/handoff/NEXT_TASK.md` initially pointed to T-29c after T-29b;
    after T-29d completion it now points to T-30.
  - `agents/SPECIALIST_TAXONOMY_MIGRATION_PLAN.md` now has a Stage 3.6
    section.
  - `agents/SPECIALIST_TAXONOMY_DECISION_LOG.md` records D-H1 through
    D-H15.
  - No runtime/code/spec implementation changes were made.
- T-29 (Specialist Taxonomy Migration, Stage 3.5) completed previously:
  - V2 YAML schema/template checkpoint artifacts exist under `specs/`.
  - Generated effective contracts are not committed by default.
  - Runtime metadata migration resumes in T-30 after Stage 3.6 hardening.
- T-28 (Specialist Taxonomy Migration, Stage 3) completed previously:
  team docs reflect the default everyday team, conditional
  design-to-build team, linear flow shorthand, and state-machine
  direction.
- T-27 (Specialist Taxonomy Migration, Stage 2) completed previously:
  specialist specs carry explicit base-class/variant annotations,
  migration notes, and context-order notes.
- The layered onboarding side quest (T-22 through T-26) remains complete.

## Passing checks

- Last full runtime check before the Stage 3.6 amendment: `make
  typecheck` pass and `make test` pass were recorded in the prior
  handoff state.
- T-29b is documentation-only; verification for this pass used
  lightweight documentation checks.

## Known gaps / blockers

- T-30 is active and covers runtime/type metadata migration.
- T-31 is blocked on T-30.
- T-32 is blocked on T-30/T-31.
- T-33 is blocked on T-32.
- T-34 is blocked on T-33.
- D-O1 (specialist filename rename strategy) remains `Open`.
- Systematic alias removal remains tracked as T-35 after T-34 merge, on
  a dedicated post-migration branch.
- `/next` skill not loading in Pi remains a separate background issue.

## Decision notes for next session

- **Schema hardening decisions assimilated:** D-H1 through D-H15 are now
  recorded in `agents/SPECIALIST_TAXONOMY_DECISION_LOG.md`.
- **T-30 source of truth:** `agents/SPECIALIST_TAXONOMY_MIGRATION_PLAN.md`
  Stage 4, the D-H decisions, and the concrete v2.1 specialist YAML under
  `specs/specialists/`.
- **T-30 non-goals remain binding:** no runtime YAML loading, no
  router/team runtime migration, no validation enforcement, no generated
  effective contracts, no alias cleanup/removal, no activation of
  proposed Scribe/Reviewer aliases, no `reviewer-validation` promotion,
  and no `doc-formatter` promotion.
- **Project-native schema boundary:** schema artifacts stay under
  `specs/`; Pi platform resources remain distinct from project-native
  metadata.

## Next task (single target)

T-30 — Specialist Taxonomy Migration, Stage 4
(Runtime/type metadata migration). See `NEXT_TASK.md` for the cold-start
orientation, concrete edit list, and verification checklist.

## Definition of done for next task

- Runtime specialist metadata declares grouped `taxonomy` objects that
  mirror the hardened v2.1 YAML projection.
- `builder` remains the generic Builder specialist.
- `builder-test` resolves canonically while `tester` remains a deprecated
  compatibility alias.
- Proposed Scribe/Reviewer aliases are not activated during T-30.
