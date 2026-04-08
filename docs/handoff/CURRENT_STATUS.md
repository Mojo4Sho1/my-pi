# Current Status

**Last updated:** 2026-04-08
**Owner:** Joe

## Current focus

Stage 5a.3b live build-team validation follow-on — Stage 5a.7 is complete and T-10 is now the active target.

## Completed in current focus

- T-21 validation coverage and contradiction audit completed:
  - `tests/team-router.test.ts` now proves that partial tester artifacts preserve typed fields, keep declared edit scope, and still route explicitly into the post-tester builder pass
  - `tests/team-router.test.ts` now also proves router-owned fields are rejected even on partial outputs, while valid typed tester fields are still preserved in the rejected step artifact
  - `tests/validation-teams.test.ts` now checks that `specs/teams/build-team.yaml` stays aligned with `extensions/teams/definitions.ts` for canonical mapping and transition semantics
  - `tests/validation-teams.test.ts` now also guards the schema doc wording that keeps YAML authoring separate from current TypeScript runtime authority
  - stale durable wording was cleaned up where the audit found drift, including the old "during T-20" runtime-authority phrasing in `specs/schemas/SPECIALIST_AND_TEAM_YAML_SPEC.md`
  - root status, implementation-plan notes, and handoff docs now reflect that Stage 5a.7 is complete and the live validation follow-on can resume

## Passing checks

- Run timestamp: `2026-04-08`
- `make typecheck`: pass
- `make test`: pass

## Known gaps / blockers

- T-10 is next: live `build-team` validation has not resumed yet, so the canonical Stage 5a.7 flow is still only locally regression-tested, not re-verified in a real Pi session after the redesign landed.
- T-11 through T-14 remain follow-on work; do not pull them forward unless T-10 exposes a concrete reason.
- `/next` skill not loading in Pi remains a separate background issue.

## Decision notes for next session

- Treat Stage 5a.7 as the landed baseline. The canonical runtime flow is `planner -> builder -> tester -> builder -> reviewer -> done`.
- Keep the layer distinction explicit:
  - `docs/archive/design/` preserves the historical redesign rationale for completed proposal-driven work
  - `specs/` owns durable YAML authoring structure
  - TypeScript runtime files remain the current execution authority
- T-21 added direct parity protection between `specs/teams/build-team.yaml` and `extensions/teams/definitions.ts`; if either changes, update the other in the same pass.
- T-21 also strengthened the partial-output guardrail:
  - partial artifacts must preserve typed fields that are present
  - router-owned fields remain forbidden even on partial outputs
  - non-terminal routing still depends on explicit state-machine transitions

## Next task (single target)

T-10 — Resume live build-team state-machine validation (see `NEXT_TASK.md`)

## Definition of done for next task

- At least one live `teamHint: "build-team"` run completes cleanly or surfaces a concrete substrate blocker with exact reproduction details
- Validation results are recorded using the Stage 5a.3 methodology, including task-level and substrate-level checks
- Any issues found are either fixed in the smallest truthful slice or explicitly documented for follow-up
