# T21_VALIDATION_AND_CONTRADICTION_AUDIT_IMPLEMENTATION_PLAN.md

## Purpose

Decision-complete execution brief for T-21.

The next fresh-context agent should use this file as the execution contract for T-21 and should keep the task bounded to validation coverage plus contradiction cleanup for the Stage 5a.7 redesign.

## Decisions Already Locked

- T-21 follows T-20 and assumes the `specs/` authoring layer now exists
- current runtime authority remains in TypeScript
- YAML files under `specs/` are durable authoring inputs, not runtime-loaded definitions
- T-21 should strengthen regression protection around the redesigned contract/artifact flow
- T-21 should audit durable docs and routing docs for contradictions against the canonical Stage 5a.7 model
- T-21 should not drift into runtime YAML loading, scaffolding generation, or broader roadmap replanning
- T-10 through T-14 remain deferred and should not be revived during T-21

## Outcome Required

T-21 is successful when:

- regression coverage is strong enough that the Stage 5a.7 artifact-routing model is defended by tests rather than doc claims alone
- durable docs do not contradict the canonical tester/build-team semantics
- the new `specs/` layer is included in the contradiction audit
- handoff docs are updated truthfully after the work lands

## Runtime Truth To Preserve

The current canonical build-team/runtime model is:

1. `planning`
2. `building`
3. `testing`
4. `rebuilding`
5. `review`
6. `done`

With these meanings:

- `testing` is tester-authorship, not generic validation-running
- `rebuilding` is the second builder verification/fix pass
- downstream team packets are built from validated artifact fields
- router-owned fields remain protected from specialist writes
- `partial` handling is explicit per non-terminal team state

## Files To Read First

Read in this order:

1. `docs/handoff/NEXT_TASK.md`
2. this file
3. `docs/design/CONTRACT-DRIVEN_SPECIALISTS_TEAM_ARTIFACTS_AND_PACKET_ROUTING_DESIGN.md`
4. Stage 5a.7 in `docs/IMPLEMENTATION_PLAN.md`
5. `specs/schemas/SPECIALIST_AND_TEAM_YAML_SPEC.md`
6. `specs/teams/build-team.yaml`
7. `extensions/teams/definitions.ts`
8. the targeted tests listed below

## Targeted Test Surface

The most relevant existing tests for T-21 are:

- `tests/contracts.test.ts`
  - artifact-field validation
  - ownership/edit-scope validation
  - partial-output follow-up semantics
  - artifact-driven downstream context building
- `tests/team-router.test.ts`
  - state-machine transitions
  - explicit `partial` routing behavior
  - canonical build-team flow expectations
- `tests/session-artifact.test.ts`
  - step artifact persistence
  - artifact refs and lineage
  - tester/build/rebuild/review ordering
  - contract-violation handling
- `tests/orchestrator-team-e2e.test.ts`
  - team delegation integration path
- `tests/validation-teams.test.ts`
  - team-definition compatibility and structural validity
- `tests/review-findings.test.ts`
  - reviewer structured payload expectations if contradiction cleanup touches reviewer semantics

Start by reading those tests before inventing new coverage. Prefer tightening the smallest existing test file that already owns the behavior.

## Likely Coverage Gaps To Check

The next agent should specifically verify whether coverage already proves all of the following:

- the canonical build-team order is reflected in session artifacts and router transitions
- tester-authored fields are the ones consumed by rebuilding and review
- `specs/teams/build-team.yaml` does not drift from `extensions/teams/definitions.ts`
- router-owned artifact fields cannot be written even in partial outputs
- partial outputs preserve typed fields and route according to explicit team rules
- contradiction-sensitive docs no longer describe the tester as a generic runner

If one of those is only implied by docs or implementation and not directly tested, add the smallest focused regression that proves it.

## Contradiction Audit Scope

Audit the smallest durable surface that could still contradict Stage 5a.7:

- `docs/handoff/`
- `STATUS.md`
- `AGENTS.md`
- `INDEX.md`
- `docs/_DOCS_INDEX.md`
- `docs/REPO_CONVENTIONS.md`
- `docs/IMPLEMENTATION_PLAN.md` only for the Stage 5a.7-related passages touched by this task
- `docs/design/CONTRACT-DRIVEN_SPECIALISTS_TEAM_ARTIFACTS_AND_PACKET_ROUTING_DESIGN.md` only if a touched statement is now stale
- `specs/schemas/SPECIALIST_AND_TEAM_YAML_SPEC.md`
- `specs/teams/build-team.yaml`

The audit goal is not "read the whole repo." The audit goal is "remove contradictions from the durable surfaces a fresh agent is likely to trust."

## Documentation Truthfulness Rules

Keep these distinctions explicit:

- `docs/design/` explains architecture and redesign intent
- `specs/` owns concrete YAML authoring structure decisions
- TypeScript runtime files still govern actual execution today

Do not describe runtime YAML loading as implemented.

## Files Most Likely To Need Updates

Expect most T-21 changes to land in:

- `tests/contracts.test.ts`
- `tests/team-router.test.ts`
- `tests/session-artifact.test.ts`
- `tests/validation-teams.test.ts`
- handoff/status docs if the audit finds contradictions

Do not create broad new testing infrastructure unless the existing test layout is clearly insufficient.

## Verification Requirements

Because T-21 is expected to touch code-facing tests and possibly runtime-facing docs:

- run `make typecheck`
- run `make test`

If a contradiction is found but deferred rather than fixed, record it explicitly in handoff docs rather than leaving the repo silently inconsistent.

## Done Criteria

T-21 is done only when all of the following are true:

- regression coverage proves the Stage 5a.7 artifact-routing model at the most contradiction-prone seams
- no touched durable doc contradicts the canonical tester/build-team flow
- the `specs/` layer is included in the contradiction audit
- `make typecheck` passes
- `make test` passes
- `CURRENT_STATUS.md`, `TASK_QUEUE.md`, and `NEXT_TASK.md` are updated truthfully
