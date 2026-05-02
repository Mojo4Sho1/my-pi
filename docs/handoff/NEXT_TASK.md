# Next Task

**Last updated:** 2026-05-02
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

**T-32 — Specialist Taxonomy Migration, Stage 6 (Layered taxonomy validation).**

This is the validation pass after T-31 router/team definition migration. Add staged validation for taxonomy metadata, alias lifecycle metadata, team state-machine references, and runtime/docs alignment where the current TypeScript architecture naturally supports it.

Do only T-32 in this pass. Do not pull T-33 alias lifecycle advancement/cleanup, T-34 merge work, or T-35 post-merge alias removal forward.

## Why this task is next

- T-27 is complete: specialist specs declare base class, variant, migration notes, alias lifecycle status, and context-order notes.
- T-28 is complete: team docs reflect the default everyday team, conditional Scribe insertion, linear flow shorthand, and D-O6 state-machine direction.
- T-29 is complete: V2 YAML schema/template/checkpoint artifacts exist under `specs/`.
- T-30 is complete: runtime specialist configs carry grouped taxonomy metadata; `builder-test` is canonical and runtime-resolvable; `tester` remains a deprecated compatibility alias.
- T-31 is complete: runtime teams now include `default-everyday-team`, `design-to-build-team`, and canonical `build-team` routing through `specialist_builder-test`; legacy `tester` references still resolve through the alias path.
- Layered validation is now unblocked.
- T-10 remains parked while the taxonomy migration phase is active.

## Authoritative inputs

Read these lazily and only as needed for T-32:

1. `agents/SPECIALIST_TAXONOMY_MIGRATION_PLAN.md` (Stage 6 section only)
2. `agents/SPECIALIST_TAXONOMY_AND_CONTEXT_MODEL.md` (taxonomy rules, variant model, team patterns, context-order model)
3. `agents/SPECIALIST_TAXONOMY_DECISION_LOG.md` entries D-A2, D-D1, D-O3, D-O6, and D-O7
4. `specs/schemas/SPECIALIST_AND_TEAM_YAML_SPEC.md`
5. Current runtime validation seams:
   - `extensions/shared/validation.ts`
   - `extensions/shared/constants.ts`
   - `extensions/shared/specialist-prompt.ts`
   - `extensions/teams/definitions.ts`

## Concrete edits required by T-32

- Add focused layered taxonomy validation in TypeScript. Prefer extending existing validation utilities/tests over creating a broad new subsystem unless the code clearly calls for it.
- Validate runtime specialist taxonomy metadata:
  - Every registered runtime specialist declares `taxonomy.baseClass`.
  - Variants, when present, use the correct base-class prefix.
  - Artifact responsibility is present.
  - `canonicalName`, `currentRuntimeId`, `aliases`, and `migrationStatus` are coherent.
- Validate alias lifecycle metadata for deprecated aliases:
  - Alias records declare canonical target, reason, lifecycle state, and cleanup condition.
  - `tester` remains resolvable as a deprecated alias for `builder-test`.
  - Do not block or remove `tester`; cleanup preparation is T-33 and removal is T-35.
- Validate team state-machine references:
  - Team members and state agents resolve through canonical IDs or the T-30 alias path.
  - Bounded retries remain explicit.
  - Completion and escalation/failed states remain reachable and explicit.
  - `build-team` uses canonical `builder-test` for test authoring while compatibility tests still cover `tester`.
- Add runtime/docs-alignment checks only where stable, local, and non-brittle. Prefer checking the committed YAML/spec fields that already have focused parser helpers over broad markdown audits.
- Keep validation staged and migration-friendly. T-32 may warn or assert metadata shape; it must not advance lifecycle states or delete compatibility paths.

If a required condition is already satisfied, record it as satisfied in the handoff update instead of rewriting text for cosmetic reasons.

## Implementation clarifications

- T-32 should not introduce runtime YAML loading.
- T-32 should not activate proposed Scribe/Reviewer aliases such as `scribe-spec`, `scribe-schema`, `scribe-routing`, `reviewer-critic`, or `reviewer-boundary-auditor`.
- T-32 should not resolve D-O1 filename rename strategy.
- T-32 should not rename files or specialist folders.
- Validation should use the generic alias-resolution helpers added in T-30/T-31.
- Keep tests focused. Good candidate files include:
  - `tests/taxonomy-metadata.test.ts`
  - `tests/validation-teams.test.ts`
  - a new focused validation test only if existing tests become too crowded

## Out of scope

- Alias lifecycle advancement, cleanup preparation, or deprecation-state changes for T-33.
- Merge work for T-34.
- Systematic compatibility-alias removal for T-35.
- Runtime YAML loading.
- File/folder renames.
- Activating proposed Scribe/Reviewer variant aliases.
- Re-deciding any item marked `Open`, `Proposed`, or `Deferred`.

## Acceptance criteria

- Runtime specialist taxonomy metadata is validated with focused tests.
- Deprecated alias lifecycle metadata is validated without breaking `tester` compatibility.
- Runtime team definitions validate canonical and compatibility specialist references.
- Bounded retries, completion states, and failed/escalation paths are covered by validation.
- No runtime YAML loading is introduced.
- Required TypeScript checks pass.
- Existing tests pass, plus focused tests added or updated for T-32 behavior.

## Verification checklist

- [ ] Read `INDEX.md`, `AGENTS.md`, `docs/handoff/CURRENT_STATUS.md`, this file.
- [ ] Confirm the current branch is `taxonomy-migration`.
- [ ] Read the Stage 6 section of `agents/SPECIALIST_TAXONOMY_MIGRATION_PLAN.md` and decision entries D-A2, D-D1, D-O3, D-O6, D-O7.
- [ ] Update only layered validation behavior and focused tests needed for T-32.
- [ ] Confirm no T-33 alias lifecycle advancement/cleanup or T-34 merge work was pulled forward.
- [ ] Run `make typecheck`.
- [ ] Run `make test`.
- [ ] Run `git status` and confirm changed files are relevant to T-32.

## Handoff protocol after completing T-32

1. Update `docs/handoff/CURRENT_STATUS.md` to record T-32 complete and what validation was added.
2. In `docs/handoff/TASK_QUEUE.md`:
   - Mark T-32 `done`.
   - Mark T-33 (Stage 7 — Cleanup preparation, alias lifecycle advancement, and deprecation) `active`.
   - If T-33 remains blocked for a newly discovered reason, record that explicitly rather than silently advancing it.
3. Update this file (`NEXT_TASK.md`) so it points at T-33 with the same cold-start orientation structure used here.
4. Do not touch `DECISIONS_NEEDED.md` unless you discovered a genuine new authority gap.

## Risks / gotchas

- Do not remove the `tester` compatibility path.
- Do not rename specialist files.
- Do not rename generic `builder` to `builder-code`.
- Do not activate proposed Scribe/Reviewer aliases.
- Keep YAML/runtime authority truthful: TypeScript remains the active runtime; YAML loading is later work.
- Keep validation focused and staged. T-32 proves metadata and routing consistency; T-33 handles lifecycle advancement.
