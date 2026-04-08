# Next Task

**Last updated:** 2026-04-07
**Owner:** Joe

## Task summary

Implement T-18 from Stage 5a.7 by enforcing ownership/edit-scope guardrails on canonical team step artifacts and making `partial` routing semantics explicit per state. The outcome of this task should be a team-routing path where the router rejects unauthorized specialist field writes and handles `partial` results deterministically instead of treating them as loosely equivalent to success/failure side paths.

## Why this task is next

- T-17 is complete, so the router now owns canonical per-step artifacts, artifact refs, and packet lineage
- Ownership metadata is now present in the runtime artifacts (`editableFields`, `readOnlyFields`) but is not yet enforced
- Explicit `partial` semantics are the next routing guardrail needed before broader tester/build-team reconciliation (T-19)

## Scope (in)

- Enforce ownership/edit-scope rules for specialist-produced canonical step artifacts
- Reject or fail routing when a specialist writes unauthorized or router-owned fields
- Make `partial` handling explicit and deterministic in the team routing path
- Add or update regression tests covering ownership violations and `partial` state transitions
- Update durable docs only where needed to reflect the implemented enforcement behavior truthfully

## Scope (out)

- Full tester/build-team reconciliation across prompts, team definitions, and durable docs (that is T-19)
- YAML specialist/team template creation (that is T-20)
- Broad contradiction audit beyond touched docs (that is T-21)
- Live Pi validation reruns and `/dashboard` follow-on work (deferred tasks T-10 through T-14)

## Relevant files

- References: `docs/design/CONTRACT-DRIVEN_SPECIALISTS_TEAM_ARTIFACTS_AND_PACKET_ROUTING_DESIGN.md`
- References: `docs/IMPLEMENTATION_PLAN.md` (Stage 5a.7)
- References: `extensions/shared/types.ts`
- References: `extensions/shared/contracts.ts`
- References: `extensions/teams/router.ts`
- References: `extensions/teams/definitions.ts`
- References: `extensions/specialists/*/prompt.ts`
- References: `tests/session-artifact.test.ts`
- References: `tests/team-router.test.ts`
- References: `tests/contracts.test.ts`
- References: `tests/orchestrator-team-e2e.test.ts`

## Recommended first reads

1. `docs/design/CONTRACT-DRIVEN_SPECIALISTS_TEAM_ARTIFACTS_AND_PACKET_ROUTING_DESIGN.md`
2. `docs/IMPLEMENTATION_PLAN.md` (Stage 5a.7 only)
3. `extensions/teams/router.ts`
4. `extensions/shared/types.ts`
5. `extensions/shared/contracts.ts`
6. `extensions/teams/definitions.ts`
7. `tests/team-router.test.ts`
8. `tests/session-artifact.test.ts`

## Likely implementation hotspots

- `extensions/teams/router.ts` now records ownership metadata but does not enforce it
- `extensions/shared/types.ts` may need stronger ownership metadata shapes for contract fields or artifacts
- `extensions/shared/contracts.ts` is the likely place to centralize allowed-field and read-only-field validation
- `extensions/teams/definitions.ts` may need explicit `partial` routing review so every state is deterministic

## Dependencies / prerequisites

- T-17 router-owned artifacts and artifact-driven packet construction complete
- Stage 4a through 4d substrate available as the starting point
- Tester/build-team reconciliation remains deferred to T-19; keep this task bounded to enforcement and routing semantics

## Acceptance criteria (definition of done)

- Unauthorized specialist field writes are rejected against explicit ownership/edit-scope rules
- Router-owned and derived fields cannot be silently overwritten by specialists
- `partial` handling is explicit and deterministic in the team routing path
- Regression tests cover at least one ownership violation and one `partial` routing path
- Docs touched by the implementation remain truthful about the current Stage 5a.7 behavior
- Update `docs/handoff/CURRENT_STATUS.md`
- Update `docs/handoff/TASK_QUEUE.md`
- Update `docs/handoff/NEXT_TASK.md`

## Verification checklist

- [ ] Audit current artifact metadata and decide where ownership validation should run
- [ ] Define the enforcement rule for unauthorized structured output fields vs router-owned fields
- [ ] Implement ownership/edit-scope validation in the team routing path
- [ ] Make `partial` transitions explicit and deterministic
- [ ] Add regression tests for ownership violations and `partial` routing
- [ ] `make typecheck` passes after code changes
- [ ] `make test` passes after code changes
- [ ] Update `CURRENT_STATUS.md` with results
- [ ] Update `TASK_QUEUE.md` and promote the next queued Stage 5a.7 task

## Risks / rollback notes

- The current artifact model records ownership metadata but does not yet distinguish between unknown extra fields and intentionally router-owned fields; make the enforcement rule explicit
- Avoid quietly reconciling the tester/build-team flow in this task; that belongs to T-19
- If explicit `partial` handling exposes contradictions in current team definitions, record them clearly but keep the implementation bounded to T-18
