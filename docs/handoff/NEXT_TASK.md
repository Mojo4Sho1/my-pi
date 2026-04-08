# Next Task

**Last updated:** 2026-04-08
**Owner:** Joe

## Task summary

Implement T-20 from Stage 5a.7 by adding YAML specialist/team templates plus a starter `build-team` spec that reflects the now-reconciled canonical flow. The outcome of this task should be a future source-of-truth authoring layer under `specs/` without yet changing runtime loading to consume those YAML files directly.

## Why this task is next

- T-19 is complete, so the runtime tester/build-team flow is now reconciled to Decision #40 and ready to be templated
- The design doc explicitly calls for YAML authoring specs after the contract/artifact routing substrate is in place
- T-21 depends on having concrete template/spec files to validate and audit

## Scope (in)

- Add a reusable specialist YAML template under `specs/specialists/`
- Add a reusable team YAML template under `specs/teams/`
- Add a starter `build-team` spec that reflects `planner -> builder -> tester -> builder -> reviewer -> done`
- Document only the minimum needed to keep touched files truthful about these YAML specs being future source-of-truth authoring inputs

## Scope (out)

- Runtime loading of YAML specs instead of TypeScript definitions
- Code generation or scaffolding from the YAML specs
- Broad contradiction audit beyond touched docs (that is T-21)
- New live Pi validation reruns and deferred `/dashboard` follow-on work (T-10 through T-14)

## Relevant files

- References: `docs/handoff/T20_YAML_SPEC_LAYER_IMPLEMENTATION_PLAN.md`
- References: `docs/design/CONTRACT-DRIVEN_SPECIALISTS_TEAM_ARTIFACTS_AND_PACKET_ROUTING_DESIGN.md` (YAML source-of-truth sections)
- References: `docs/IMPLEMENTATION_PLAN.md` (Stage 5a.7)
- References: `extensions/teams/definitions.ts`
- References: `extensions/specialists/tester/prompt.ts`
- References: `extensions/specialists/builder/prompt.ts`
- References: `extensions/specialists/reviewer/prompt.ts`
- References: `docs/handoff/CURRENT_STATUS.md`
- References: `docs/handoff/TASK_QUEUE.md`

## Recommended first reads

1. `docs/handoff/T20_YAML_SPEC_LAYER_IMPLEMENTATION_PLAN.md`
2. `docs/design/CONTRACT-DRIVEN_SPECIALISTS_TEAM_ARTIFACTS_AND_PACKET_ROUTING_DESIGN.md` (YAML Source-of-Truth Specs)
3. `docs/IMPLEMENTATION_PLAN.md` (Stage 5a.7 only)
4. `extensions/teams/definitions.ts`
5. `extensions/specialists/tester/prompt.ts`
6. `extensions/specialists/builder/prompt.ts`
7. `extensions/specialists/reviewer/prompt.ts`

## Likely implementation hotspots

- `docs/handoff/T20_YAML_SPEC_LAYER_IMPLEMENTATION_PLAN.md` is now the decision-complete execution brief for T-20 and should be followed directly
- `specs/specialists/` and `specs/teams/` do not exist yet, so the directory structure and file naming need to be established
- The starter `build-team` spec needs to reflect the canonical runtime order and artifact-driven handoffs without implying that YAML is already the runtime authority
- Touched handoff/status docs should stay explicit that these specs are future source-of-truth authoring inputs

## Dependencies / prerequisites

- T-19 complete
- Stage 4a through 4d substrate available as the runtime reference point
- T-21 remains downstream; keep this task bounded to template/spec creation rather than full validation audit

## Acceptance criteria (definition of done)

- `specs/specialists/` template exists
- `specs/teams/` template exists
- A starter `build-team` YAML spec reflects `planner -> builder -> tester -> builder -> reviewer -> done`
- Touched docs remain truthful about the relationship between YAML specs and the current TypeScript runtime
- Update `docs/handoff/CURRENT_STATUS.md`
- Update `docs/handoff/TASK_QUEUE.md`
- Update `docs/handoff/NEXT_TASK.md`

## Verification checklist

- [ ] Add specialist and team YAML template files under `specs/`
- [ ] Add starter `build-team` spec reflecting the canonical Stage 5a.7 flow
- [ ] Check that the spec language matches current runtime contracts/handoffs closely enough to serve as future source-of-truth authoring input
- [ ] Keep touched docs truthful about YAML being future authoring input, not current runtime execution authority
- [ ] Run `make typecheck` if code paths change
- [ ] Run `make test` if code paths or runtime-facing docs/tests change
- [ ] Update `CURRENT_STATUS.md`
- [ ] Update `TASK_QUEUE.md` and promote the next queued Stage 5a.7 task

## Risks / rollback notes

- Avoid drifting into runtime YAML loading or scaffolding generation; this task is template/spec creation only
- Keep the starter `build-team` spec aligned to the implemented canonical flow, not older review-before-test descriptions
- If the template design exposes larger schema/open-question issues, record them clearly but keep implementation bounded to the initial spec layer
