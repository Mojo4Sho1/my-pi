# Next Task

**Last updated:** 2026-05-02
**Owner:** Joe

## Cold-start orientation

Read these four files in order before doing anything else. Do not read more by default.

1. `INDEX.md` — bootstrap router for the repo
2. `AGENTS.md` — agent-agnostic working rules and conventions
3. `docs/handoff/CURRENT_STATUS.md` — what just happened and the current focus
4. This file (you are here) — the single active target

After those reads, read `agents/SPECIALIST_TAXONOMY_MIGRATION_PLAN.md`
Stage 4 and `agents/SPECIALIST_TAXONOMY_DECISION_LOG.md` decisions
D-O3, D-O4, D-O5, D-D1, and D-H1 through D-H15 before editing for
T-30. Stage 3.6 prerequisites (T-29b/T-29c/T-29d) and the Stage 3.6
formatting/consistency repair (T-29e) are complete.

## Branch guard

Expected branch: `taxonomy-migration`.

Before editing, run `git branch --show-current`. If the result is not
`taxonomy-migration`, stop and report the mismatch. The taxonomy
migration phase (T-27 through T-34, including inserted T-29b/T-29c/T-29d)
is intentionally isolated from `main` until the final merge checkpoint.

## Single active target

**T-30 — Specialist Taxonomy Migration, Stage 4 (Runtime/type metadata migration).**

T-29b, T-29c, T-29d, and T-29e are complete. T-30 is now active. Do
only T-30 in this pass. Do not resume T-31, T-32, T-33, or T-34 until
their dependencies are complete.

## Why this task is next

- T-29c is complete: schema/spec/template files are hardened to v2.1.
- T-29d is complete: concrete specialist YAML exists for `planner`,
  `builder`, `builder-test`, `reviewer`, and `scribe-spec`.
- T-29e is complete: every relevant `specs/` YAML and every
  `specs/templates/*.md` front matter parses cleanly, and the
  migration plan checkbox/dependency text agrees with the handoff
  docs.
- T-30 can now mirror the hardened v2.1 YAML projection into runtime
  TypeScript metadata without treating examples as concrete sources.

## Authoritative inputs

Read these before making T-30 edits:

1. `agents/SPECIALIST_TAXONOMY_MIGRATION_PLAN.md` (Stage 4 and Stage 3.6)
2. `agents/SPECIALIST_TAXONOMY_DECISION_LOG.md` (D-O3, D-O4, D-O5, D-D1, D-H1..D-H15)
3. `specs/schemas/SPECIALIST_AND_TEAM_YAML_SPEC.md`
4. Concrete specialist YAML under `specs/specialists/`
5. `docs/handoff/TASK_QUEUE.md`
6. `docs/handoff/CURRENT_STATUS.md`

## Concrete edits required by T-30

Mirror the hardened v2.1 taxonomy metadata into runtime TypeScript
metadata without implementing runtime YAML loading.

At minimum:

- Add or update grouped runtime taxonomy metadata:

  ```ts
  taxonomy: {
    baseClass: "Planner" | "Scribe" | "Builder" | "Reviewer";
    variant: string | null;
    artifactResponsibility: string[];
  }
  ```

- Preserve the documented YAML-to-TypeScript projection:

  ```text
  taxonomy.baseClass = yaml.taxonomy.base_class
  taxonomy.variant = yaml.taxonomy.variant
  taxonomy.artifactResponsibility = yaml.taxonomy.artifact_responsibility
  ```

- Keep `builder` as the generic Builder specialist.
- Make `builder-test` the canonical test-authoring specialist name while
  preserving `tester` as a deprecated compatibility alias/runtime
  surface.
- Do not activate proposed Scribe/Reviewer aliases beyond future-facing
  metadata needed for type shape compatibility.

## Out of scope

- Runtime YAML loading.
- Router or team runtime migration.
- Validation enforcement.
- Generated effective contracts.
- Alias cleanup/removal.
- Activating proposed Scribe/Reviewer aliases.
- Promoting `reviewer-validation`.
- Promoting `doc-formatter` into the canonical taxonomy.
- Broad unrelated cleanup.

## Acceptance criteria

- Specialist runtime configurations declare the grouped `taxonomy`
  object.
- Runtime metadata mirrors the hardened v2.1 YAML projection rather than
  redefining incompatible shapes.
- `builder` remains the generic Builder specialist.
- `builder-test` resolves as the canonical name for the current
  test-authoring specialist.
- Existing `tester` references continue to resolve as a deprecated
  compatibility alias during the transition.
- Proposed Scribe/Reviewer aliases remain inactive.
- Typecheck and tests pass.

## Verification checklist

- [ ] Confirm the current branch is `taxonomy-migration`.
- [ ] Read Stage 4 migration docs, D-H decisions, and concrete v2.1
  specialist YAML.
- [ ] Add or update runtime/type metadata only for T-30 scope.
- [ ] Preserve current behavior while adding canonical `builder-test`
  metadata and `tester` compatibility.
- [ ] Do not migrate router/team state-machine behavior.
- [ ] Run `make typecheck`.
- [ ] Run `make test`.
- [ ] Run `git diff --check`.
- [ ] Search for stale immediate-next-task references to T-31/T-32.
- [ ] Run `git status` and confirm changed files are relevant to T-30.

## Handoff protocol after completing T-30

1. Update `docs/handoff/CURRENT_STATUS.md` to record T-30 complete and
   summarize runtime/type metadata migration.
2. In `docs/handoff/TASK_QUEUE.md`:
   - Mark T-30 `done`.
   - Mark T-31 `active`.
   - Keep T-32/T-33/T-34 blocked behind the normal dependency chain.
3. Update this file so it points at T-31.
4. Do not pull T-31 router/team migration beyond its documented scope.

## Risks / gotchas

- T-30 mirrors metadata; it must not implement runtime YAML loading.
- Keep `tester` compatibility working while making `builder-test`
  canonical.
- Do not activate proposed Scribe/Reviewer aliases during T-30.
- Do not pull team/router migration forward from T-31.
