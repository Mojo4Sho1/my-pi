# _TEAMS_INDEX.md

## Purpose

Routing file for team definitions in `agents/teams/`.

This index exists to route readers to reusable collaboration bundles. It does not define team behavior in full, and it does not replace the underlying team definitions.

## Subtree role

This subtree contains reusable collaboration bundles of specialists for recurring classes of work.

It includes team definitions only. It does not include standalone specialist definitions, and it does not include sequence definitions.

Teams are also subject to the canonical specialist taxonomy in `agents/SPECIALIST_TAXONOMY_AND_CONTEXT_MODEL.md`, which establishes the default everyday team and the conditional design-to-build expansion.

## Canonical Default Teams

Per the taxonomy doc:

- The default everyday implementation team is `planner -> builder -> reviewer`.
- The full design-to-build team is `planner -> scribe -> builder -> reviewer`. Scribe is first-class but conditional; insert it only when non-runtime blueprint artifacts (specifications, contracts, schemas, routing designs, role definitions) are required before implementation.
- Test authoring is a Builder-variant responsibility (`builder-test`). Running tests alone is an action, not a specialist; a separate test-running specialist is not warranted. The exact runtime sequencing for test-authoring expansion remains deferred to the later team/state-machine migration.

These canonical flows describe the conceptual team shapes. Runtime team definitions in `extensions/teams/definitions.ts` continue to use current identifiers (for example, `tester` rather than `builder-test`) until the runtime migration stages complete; see `agents/SPECIALIST_TAXONOMY_MIGRATION_PLAN.md`.

## Flow Notation

Linear flows such as `planner -> builder -> reviewer` are human-readable shorthand for simple team shapes. Per D-O6 in `agents/SPECIALIST_TAXONOMY_DECISION_LOG.md`, runtime-capable team definitions should evolve toward state-machine definitions with explicit nodes, transitions, retry policies, completion states, and escalation states.

Conditional expansions should be encoded as transition logic or optional nodes in that future state-machine model, not as unrelated duplicate teams. For example, the design-to-build expansion inserts Scribe only when blueprint artifacts are needed; Scribe is not mandatory for every implementation team.

## Current teams

- `agents/teams/specialist-creator.md`

## Routing guidance

Read this subtree when the task involves:

- defining or revising reusable collaboration bundles
- deciding whether recurring multi-specialist work should become a named team
- understanding team membership, team deliverables, or bounded member context rules

Do not read this subtree for single-specialist work, and do not read it for staged sequence design unless a named team is already the unit under review.

Read only the smallest set of team definitions needed by the active task.

## Update rule

Update this index when team files are added, removed, renamed, or materially re-scoped.

Do not update this index for ordinary wording changes inside an existing team definition when routing remains the same.

## Summary

`agents/teams/_TEAMS_INDEX.md` routes work that belongs to reusable multi-specialist collaboration bundles.

It does not define specialist boundaries, and it does not define sequence ordering semantics.
