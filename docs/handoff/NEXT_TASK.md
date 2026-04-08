# Next Task

**Last updated:** 2026-04-08
**Owner:** Joe

## Task summary

Implement T-19 from Stage 5a.7 by reconciling the tester specialist and `build-team` runtime flow to Decision #40. The outcome of this task should be a code-and-doc path where the tester is consistently modeled as a test author, the team state machine follows `planner -> builder -> tester -> builder -> reviewer -> done`, and the repo no longer presents conflicting explanations of that handoff in touched durable docs.

## Why this task is next

- T-18 is complete, so ownership/edit-scope guardrails and explicit `partial` routing semantics are now enforced in the team router
- The main remaining Stage 5a.7 mismatch is the tester/build-team flow: durable docs already point at the canonical order, but the runtime team definition and tester prompt/config still reflect the older validation-runner posture
- T-20 and T-21 depend on having one reconciled canonical flow to template and audit

## Scope (in)

- Update tester-facing code/config so the tester is a test author rather than a generic validation runner
- Reconcile the runtime `build-team` state machine to `planner -> builder -> tester -> builder -> reviewer -> done`
- Adjust builder/tester/reviewer handoff contracts only as needed to support the reconciled flow
- Add or update regression tests covering the tester-authorship handoff and builder repair loop
- Update durable docs only where needed to keep touched explanations truthful about the implemented flow

## Scope (out)

- YAML specialist/team template creation (that is T-20)
- Broad contradiction audit beyond touched docs (that is T-21)
- New live Pi validation reruns and deferred `/dashboard` follow-on work (T-10 through T-14)
- Broader invocation-pattern redesign beyond the canonical tester/build-team flow

## Relevant files

- References: `docs/design/CONTRACT-DRIVEN_SPECIALISTS_TEAM_ARTIFACTS_AND_PACKET_ROUTING_DESIGN.md`
- References: `docs/IMPLEMENTATION_PLAN.md` (Stage 5a.7 and 5a.3c notes)
- References: `DECISION_LOG.md` (Decision #40)
- References: `agents/specialists/tester.md`
- References: `extensions/specialists/tester/prompt.ts`
- References: `extensions/specialists/builder/prompt.ts`
- References: `extensions/specialists/reviewer/prompt.ts`
- References: `extensions/teams/definitions.ts`
- References: `tests/tester.test.ts`
- References: `tests/team-router.test.ts`
- References: `tests/session-artifact.test.ts`

## Recommended first reads

1. `DECISION_LOG.md` (Decision #40 only)
2. `docs/design/CONTRACT-DRIVEN_SPECIALISTS_TEAM_ARTIFACTS_AND_PACKET_ROUTING_DESIGN.md`
3. `docs/IMPLEMENTATION_PLAN.md` (Stage 5a.7 and 5a.3c only)
4. `agents/specialists/tester.md`
5. `extensions/specialists/tester/prompt.ts`
6. `extensions/teams/definitions.ts`
7. `tests/tester.test.ts`
8. `tests/team-router.test.ts`

## Likely implementation hotspots

- `extensions/specialists/tester/prompt.ts` still frames the tester around validation execution rather than test authorship
- `extensions/teams/definitions.ts` still encodes the older exemplar ordering, so the state graph and transition expectations need reconciliation
- `extensions/specialists/builder/prompt.ts` and `extensions/specialists/reviewer/prompt.ts` may need contract/handoff tweaks once tester outputs become author-owned test artifacts
- `tests/team-router.test.ts` and `tests/session-artifact.test.ts` are the most likely places where the current order assumptions will need to change

## Dependencies / prerequisites

- T-18 ownership enforcement and explicit `partial` routing semantics complete
- Stage 4a through 4d substrate available as the starting point
- T-20 and T-21 remain downstream; keep this task bounded to the canonical tester/build-team reconciliation work

## Acceptance criteria (definition of done)

- Tester prompt/config and touched docs consistently describe the tester as a test author
- `build-team` runtime flow is `planner -> builder -> tester -> builder -> reviewer -> done`
- Builder receives tester-authored outputs through validated artifact-driven routing
- Regression tests cover at least one tester-author handoff and one builder rework loop after tester output
- Docs touched by the implementation remain truthful about the current Stage 5a.7 behavior
- Update `docs/handoff/CURRENT_STATUS.md`
- Update `docs/handoff/TASK_QUEUE.md`
- Update `docs/handoff/NEXT_TASK.md`

## Verification checklist

- [ ] Audit tester/build-team flow mismatches across prompt config, runtime definitions, and touched durable docs
- [ ] Update tester-facing contracts/prompts to match Decision #40
- [ ] Reconcile the `build-team` state machine to the canonical order
- [ ] Ensure downstream builder/reviewer handoffs still use validated artifact fields only
- [ ] Add regression tests for tester-authored output and builder repair routing
- [ ] `make typecheck` passes after code changes
- [ ] `make test` passes after code changes
- [ ] Update `CURRENT_STATUS.md` with results
- [ ] Update `TASK_QUEUE.md` and promote the next queued Stage 5a.7 task

## Risks / rollback notes

- Avoid silently broadening T-19 into the full contradiction audit; that belongs to T-21
- Keep the reconciliation grounded in Decision #40 rather than inventing a third tester posture
- If the runtime flow change exposes additional downstream contract drift, record it clearly but keep the implementation bounded to the canonical tester/build-team path
