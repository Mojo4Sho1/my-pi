# Next Task

**Last updated:** 2026-04-30
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

**T-28 — Specialist Taxonomy Migration, Stage 3 (team documentation migration).**

This task is documentation-only. No runtime code, TypeScript, router files, package files, tests, or files under `extensions/` or `tests/` are to be changed in this task.

The work is bounded to team documentation under `agents/teams/` plus related routing/handoff references. A successful run of T-28 will align team docs with the canonical taxonomy without changing runtime team definitions.

## Why this task is next

- T-27 is complete: specialist specs now declare base class, variant, migration notes, D-D1 alias lifecycle status where relevant, and D-O7 context-order notes.
- The next smallest migration step is Stage 3: team documentation should reflect the default everyday team, conditional Scribe insertion, and the future state-machine direction.
- T-10 remains parked while the taxonomy migration phase is active. A future agent will return to it after the taxonomy documentation and schema checkpoints land.

## Authoritative inputs

Read these lazily and only as needed for T-28:

1. `agents/SPECIALIST_TAXONOMY_MIGRATION_PLAN.md` (Stage 3 section only)
2. `agents/SPECIALIST_TAXONOMY_AND_CONTEXT_MODEL.md` (team sections and current specialist reclassification)
3. `agents/SPECIALIST_TAXONOMY_DECISION_LOG.md` entries D-O5, D-O6, D-T8, and D-T9
4. `agents/teams/_TEAMS_INDEX.md`
5. `agents/teams/specialist-creator.md`

## Concrete edits required by T-28

- `agents/teams/_TEAMS_INDEX.md` should document the default everyday team `planner -> builder -> reviewer`.
- It should document the conditional design-to-build team `planner -> scribe -> builder -> reviewer`.
- It should describe simple linear flows as human-readable shorthand only and point toward future state-machine team definitions per D-O6.
- It should avoid committing to a specific test-authoring expansion flow beyond the settled taxonomy rule that `builder-test` is a Builder variant.
- Existing team specs should reference the taxonomy doc and note planned member identifier migration without changing runtime identifiers.
- `agents/teams/specialist-creator.md` should note future reclassification of its members under the new variant names without changing runtime member identifiers.

## Out of scope

- Runtime team definition changes under `extensions/teams/`.
- Any changes under `extensions/`, `tests/`, `package.json`, or `tsconfig.json`.
- Specialist file renames or runtime identifier renames.
- YAML schema/template work for T-29.
- Re-deciding any item marked `Open`, `Proposed`, or `Deferred`.

## Acceptance criteria

- Team documentation does not imply that Scribe is mandatory for every implementation team.
- Team documentation does not imply that running tests alone requires a separate specialist.
- Team documentation makes clear that linear flows are shorthand and the canonical direction is a state-machine model (D-O6).
- Existing team specs reference the taxonomy and planned member identifier migration.
- No runtime team definition has been changed.

## Verification checklist

- [ ] Read `INDEX.md`, `AGENTS.md`, `docs/handoff/CURRENT_STATUS.md`, this file.
- [ ] Confirm the current branch is `taxonomy-migration`.
- [ ] Read the Stage 3 section of `agents/SPECIALIST_TAXONOMY_MIGRATION_PLAN.md` and decision entries D-O5, D-O6, D-T8, D-T9.
- [ ] Update `agents/teams/_TEAMS_INDEX.md` and `agents/teams/specialist-creator.md` only as needed.
- [ ] Confirm no file under `extensions/`, `tests/`, `package.json`, `tsconfig.json`, or any runtime/router file was modified.
- [ ] Run `git status` and confirm only documentation files relevant to T-28 changed.

## Handoff protocol after completing T-28

1. Update `docs/handoff/CURRENT_STATUS.md` to record T-28 complete and what concretely changed in team docs.
2. In `docs/handoff/TASK_QUEUE.md`:
   - Mark T-28 `done`.
   - Mark T-29 (Stage 3.5 — YAML schema and template design) `active`.
3. Update this file (`NEXT_TASK.md`) so it points at T-29 with the same cold-start orientation structure used here.
4. Do not touch `DECISIONS_NEEDED.md` unless you discovered a genuine new authority gap.

## Risks / gotchas

- Do not change runtime team definitions while aligning team docs.
- Do not imply `builder-code` is required; D-O5 keeps `builder` as the generic Builder.
- Do not resolve D-O1 filename strategy.
- Do not start T-29 schema/template directories during T-28.
