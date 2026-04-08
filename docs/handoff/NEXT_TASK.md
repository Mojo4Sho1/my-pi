# Next Task

**Last updated:** 2026-04-08
**Owner:** Joe

## Task summary

Implement T-21 from Stage 5a.7 by adding validation coverage and running a contradiction audit for the redesigned contract/artifact flow. The outcome of this task should be stronger regression protection around the redesigned routing model plus durable docs that no longer contradict the canonical tester/build-team semantics or the new `specs/` authoring layer.

## Why this task is next

- T-20 is complete, so the durable YAML authoring/spec layer now exists and can be audited instead of guessed at
- Stage 5a.7 still requires validation coverage and contradiction cleanup before the redesign can be considered fully landed
- T-10 through T-14 remain intentionally deferred until this redesign pass is internally consistent and validated

## Scope (in)

- Add or update regression coverage for the redesigned flow where it is still thin:
  - structured artifact preservation
  - ownership/edit-scope guardrails
  - explicit `partial` handling in team routing
  - canonical tester/build-team artifact handoffs
- Audit durable docs and routing docs for contradictions against the current Stage 5a.7 model
- Keep touched docs truthful about proposal docs vs durable specs vs current runtime authority

## Scope (out)

- Runtime loading of YAML specs instead of TypeScript definitions
- New YAML schema design work unless the audit exposes a real contradiction in the files just added
- New live Pi validation reruns and deferred `/dashboard` follow-on work (T-10 through T-14)
- Broad roadmap replanning beyond the contradictions discovered while landing T-21

## Relevant files

- References: `docs/handoff/T21_VALIDATION_AND_CONTRADICTION_AUDIT_IMPLEMENTATION_PLAN.md`
- References: `docs/design/CONTRACT-DRIVEN_SPECIALISTS_TEAM_ARTIFACTS_AND_PACKET_ROUTING_DESIGN.md`
- References: `docs/IMPLEMENTATION_PLAN.md` (Stage 5a.7)
- References: `specs/schemas/SPECIALIST_AND_TEAM_YAML_SPEC.md`
- References: `specs/teams/build-team.yaml`
- References: `extensions/teams/definitions.ts`
- References: `extensions/shared/contracts.ts`
- References: `extensions/teams/router.ts`
- References: `extensions/shared/result-parser.ts`
- References: `tests/team-router.test.ts`
- References: `tests/session-artifact.test.ts`
- References: `tests/contracts.test.ts`
- References: `tests/review-findings.test.ts`
- References: `extensions/specialists/tester/prompt.ts`
- References: `extensions/specialists/builder/prompt.ts`
- References: `extensions/specialists/reviewer/prompt.ts`
- References: `docs/handoff/CURRENT_STATUS.md`
- References: `docs/handoff/TASK_QUEUE.md`

## Recommended first reads

1. `docs/handoff/T21_VALIDATION_AND_CONTRADICTION_AUDIT_IMPLEMENTATION_PLAN.md`
2. `docs/design/CONTRACT-DRIVEN_SPECIALISTS_TEAM_ARTIFACTS_AND_PACKET_ROUTING_DESIGN.md`
3. `docs/IMPLEMENTATION_PLAN.md` (Stage 5a.7 only)
4. `specs/schemas/SPECIALIST_AND_TEAM_YAML_SPEC.md`
5. `specs/teams/build-team.yaml`
6. `extensions/teams/definitions.ts`
7. the closest regression tests covering contracts, artifacts, and team routing

## Likely implementation hotspots

- Contract and router regressions should confirm that Stage 5a.7 behavior remains artifact-driven and explicit on `partial`
- The new `specs/` files should be included in the contradiction audit because they are now part of the durable authoring surface
- Touched docs should stay explicit that YAML specs are future authoring inputs while TypeScript remains the active runtime layer

## Dependencies / prerequisites

- T-20 complete
- Stage 4a through 4d substrate available as the runtime reference point
- Stage 5a.7 remains the active priority over deferred T-10 through T-14 follow-on work

## Acceptance criteria (definition of done)

- Regression coverage proves the redesigned artifact preservation, ownership guardrails, and explicit `partial` semantics are still enforced
- The canonical `build-team` flow remains aligned across runtime code, tests, and durable docs/specs
- No touched durable doc contradicts the Stage 5a.7 tester/build-team and contract/artifact model
- Update `docs/handoff/CURRENT_STATUS.md`
- Update `docs/handoff/TASK_QUEUE.md`
- Update `docs/handoff/NEXT_TASK.md`

## Verification checklist

- [ ] Add or tighten regression coverage where Stage 5a.7 enforcement is still under-specified
- [ ] Audit touched durable docs and specs for contradictions against the canonical runtime flow
- [ ] Keep touched docs truthful about YAML being future authoring input, not current runtime execution authority
- [ ] Run `make typecheck`
- [ ] Run `make test`
- [ ] Update `CURRENT_STATUS.md`
- [ ] Update `TASK_QUEUE.md` and promote the next queued Stage 5a.7 task

## Risks / rollback notes

- Avoid drifting into new runtime design or YAML loading work; this task is validation plus contradiction cleanup only
- Keep the audit bounded to files touched while making T-21 land; broader cleanup should be recorded, not silently expanded
- If tests expose deeper behavioral drift, fix the smallest truthful slice needed to re-establish Stage 5a.7 consistency
