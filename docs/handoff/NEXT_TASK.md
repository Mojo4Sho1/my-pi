# Next Task

**Last updated:** 2026-05-01
**Owner:** Joe

## Cold-start orientation

Read these four files in order before doing anything else. Do not read more by default.

1. `INDEX.md` — bootstrap router for the repo
2. `AGENTS.md` — agent-agnostic working rules and conventions
3. `docs/handoff/CURRENT_STATUS.md` — what just happened and the current focus
4. This file (you are here) — the single active target

If you finish those four reads and still feel underspecified for the active target below, the task is genuinely under-specified — record that in the verification checklist rather than expanding scope on your own.

## Branch guard

Expected branch: `taxonomy-migration`.

Before editing, run `git branch --show-current`. If the result is not `taxonomy-migration`, stop and report the mismatch. The taxonomy migration phase (T-27 through T-34) is intentionally isolated from `main` until the final merge checkpoint.

## Single active target

**T-30 — Specialist Taxonomy Migration, Stage 4 (Runtime/type metadata migration).**

This is the first runtime/type migration after the YAML schema checkpoint. It may touch TypeScript runtime metadata and tests as needed, but it must preserve current behavior while introducing grouped taxonomy metadata and alias-first migration support.

Do only T-30 in this pass. Do not pull T-31 router/team migration, T-32 validation enforcement, or T-33 cleanup forward.

## Why this task is next

- T-27 is complete: specialist specs declare base class, variant, migration notes, D-D1 alias lifecycle status where relevant, and D-O7 context-order notes.
- T-28 is complete: team docs reflect the default everyday team, conditional Scribe insertion, linear flow shorthand, and D-O6 state-machine direction.
- T-29 is complete: V2 YAML schema/template/checkpoint artifacts now exist under `specs/`, including contract layers, context bundle template, output templates, examples, and state-machine-ready team specs.
- Runtime/type metadata migration was blocked on T-29 and is now unblocked.
- T-10 remains parked while the taxonomy migration phase is active.

## Authoritative inputs

Read these lazily and only as needed for T-30:

1. `agents/SPECIALIST_TAXONOMY_MIGRATION_PLAN.md` (Stage 4 section only)
2. `agents/SPECIALIST_TAXONOMY_AND_CONTEXT_MODEL.md` (base classes, variants, and artifact responsibility model)
3. `agents/SPECIALIST_TAXONOMY_DECISION_LOG.md` entries D-O3, D-O4, D-O5, D-D1, and D-A4
4. `specs/schemas/SPECIALIST_AND_TEAM_YAML_SPEC.md` (V2 taxonomy fields and alias lifecycle fields)
5. `specs/examples/builder-test.specialist.example.yaml` (example of `tester` -> `builder-test` alias-first metadata)

## Concrete edits required by T-30

- Add grouped runtime taxonomy metadata for specialists:
  - `baseClass`
  - `variant`
  - `artifactResponsibility`
- Preserve generic `builder` as the canonical generic Builder; do not rename it to `builder-code`.
- Model `tester` as transitional metadata toward canonical `builder-test`:
  - canonical name: `builder-test`
  - current runtime id: `tester`
  - base class: `Builder`
  - variant: `builder-test`
  - deprecated alias: `tester`
  - migration status: `transitional`
  - alias lifecycle state: `deprecated`
- Add or update runtime alias resolution so current `tester` references continue to work during the transition.
- Ensure runtime metadata mirrors the V2 YAML/schema checkpoint rather than redefining incompatible shapes.
- Add focused tests for taxonomy metadata shape and alias resolution if existing tests do not cover the new behavior.

If a required condition is already satisfied, record it as satisfied in the handoff update instead of rewriting text for cosmetic reasons.

## Out of scope

- Router/team definition migration for T-31.
- Layered validation enforcement for T-32, beyond focused tests needed to protect T-30 behavior.
- Alias cleanup or removal for T-33.
- Specialist filename rename strategy D-O1.
- Re-deciding any item marked `Open`, `Proposed`, or `Deferred`.
- Broad refactors unrelated to taxonomy metadata.

## Acceptance criteria

- Specialist runtime configurations declare grouped taxonomy metadata.
- Identifier transitions preserve current behavior.
- `tester` references continue to resolve through the deprecated alias path.
- `builder` remains the generic Builder.
- Runtime metadata is compatible with the V2 YAML/schema checkpoint.
- Required TypeScript checks pass.
- Existing tests pass, plus any focused tests added for T-30.

## Verification checklist

- [ ] Read `INDEX.md`, `AGENTS.md`, `docs/handoff/CURRENT_STATUS.md`, this file.
- [ ] Confirm the current branch is `taxonomy-migration`.
- [ ] Read the Stage 4 section of `agents/SPECIALIST_TAXONOMY_MIGRATION_PLAN.md` and decision entries D-O3, D-O4, D-O5, D-D1, D-A4.
- [ ] Update only runtime/type metadata, alias-resolution behavior, and focused tests needed for T-30.
- [ ] Confirm no router/team migration or alias cleanup work from T-31/T-33 was pulled forward.
- [ ] Run `make typecheck`.
- [ ] Run `make test`.
- [ ] Run `git status` and confirm changed files are relevant to T-30.

## Handoff protocol after completing T-30

1. Update `docs/handoff/CURRENT_STATUS.md` to record T-30 complete and what concretely changed in runtime/type taxonomy metadata.
2. In `docs/handoff/TASK_QUEUE.md`:
   - Mark T-30 `done`.
   - Mark T-31 (Stage 5 — Router and team definition migration) `active`.
   - If T-31 remains blocked for a newly discovered reason, record that explicitly rather than silently advancing it.
3. Update this file (`NEXT_TASK.md`) so it points at T-31 with the same cold-start orientation structure used here.
4. Do not touch `DECISIONS_NEEDED.md` unless you discovered a genuine new authority gap.

## Risks / gotchas

- Do not rename specialist files.
- Do not remove the `tester` compatibility path.
- Do not rename generic `builder` to `builder-code`.
- Do not start T-31 state-machine router migration in the same pass.
- Keep YAML/runtime authority truthful: TypeScript remains the active runtime, but it should mirror the V2 YAML metadata.
