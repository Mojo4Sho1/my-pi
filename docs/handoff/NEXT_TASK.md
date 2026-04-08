# Next Task

**Last updated:** 2026-04-07
**Owner:** Joe

## Task summary

Implement T-17 from Stage 5a.7 by introducing router-owned canonical team/specialist artifacts and using validated artifact fields as the only source for downstream packet construction. The outcome of this task should be a team-routing path where the router owns persisted machine-first artifacts for each step and derives the next `TaskPacket` from validated artifact data instead of from loose prior-result summaries.

## Why this task is next

- T-16 is complete, so the runtime now preserves canonical structured specialist payloads and validates them directly
- T-17 is the next redesign dependency because router-owned artifacts and artifact-driven packet construction are the bridge between preserved structured outputs and stronger ownership/routing guardrails
- The design document explicitly calls for router-built downstream packets from validated artifacts before ownership enforcement (T-18) and broader flow reconciliation (T-19)

## Scope (in)

- Introduce router-owned machine-first artifact structures for team sessions and per-specialist team steps
- Persist/link those artifacts from the team router after validation, without letting specialists directly own team-session state
- Rebuild downstream `TaskPacket.context` from validated artifact fields only, using the preserved structured payloads as the canonical source
- Add or update regression tests covering artifact persistence/linkage and artifact-driven downstream packet construction
- Update durable docs only where needed to reflect the implemented artifact-routing behavior truthfully

## Scope (out)

- Ownership/edit-scope enforcement and explicit per-state `partial` handling (that is T-18)
- Full tester/build-team reconciliation across prompts and team definitions (that is T-19)
- YAML specialist/team template creation (that is T-20)
- Live Pi validation reruns and `/dashboard` follow-on work (deferred tasks T-10 through T-14)

## Relevant files

- References: `docs/design/CONTRACT-DRIVEN_SPECIALISTS_TEAM_ARTIFACTS_AND_PACKET_ROUTING_DESIGN.md`
- References: `docs/IMPLEMENTATION_PLAN.md` (Stage 5a.7)
- References: `extensions/shared/types.ts`
- References: `extensions/shared/packets.ts`
- References: `extensions/shared/contracts.ts`
- References: `extensions/orchestrator/delegate.ts`
- References: `extensions/teams/router.ts`
- References: `tests/session-artifact.test.ts`
- References: `tests/contracts.test.ts`
- References: `tests/team-router.test.ts`
- References: `tests/orchestrator-team-e2e.test.ts`

## Recommended first reads

1. `docs/design/CONTRACT-DRIVEN_SPECIALISTS_TEAM_ARTIFACTS_AND_PACKET_ROUTING_DESIGN.md`
2. `docs/IMPLEMENTATION_PLAN.md` (Stage 5a.7 only)
3. `extensions/teams/router.ts`
4. `extensions/shared/types.ts`
5. `extensions/shared/contracts.ts`
6. `tests/team-router.test.ts`
7. `tests/session-artifact.test.ts`

## Likely implementation hotspots

- `extensions/teams/router.ts` currently executes transitions in-memory without router-owned canonical per-step artifacts
- `extensions/shared/types.ts` will likely need explicit artifact types and refs for team-session and specialist-step records
- `extensions/shared/contracts.ts` is the most likely place to centralize artifact-to-context field extraction once packet construction stops reading loose prior results
- `extensions/orchestrator/delegate.ts` may need minor interface adjustments if team routing starts carrying artifact-backed result metadata through delegation boundaries

## Dependencies / prerequisites

- T-16 structured-output preservation complete
- Stage 4a through 4d substrate available as the starting point
- Decision #40 remains the durable tester-role direction, but full reconciliation is deferred to T-19

## Acceptance criteria (definition of done)

- Router-owned team/specialist artifacts exist in the runtime path and are treated as the canonical machine-first records for team execution
- Downstream `TaskPacket` construction uses validated artifact fields only rather than ad hoc prior-result summaries
- Regression tests cover at least one success path where downstream context is rebuilt from validated artifacts
- Docs touched by the implementation remain truthful about the current Stage 5a.7 behavior
- Update `docs/handoff/CURRENT_STATUS.md`
- Update `docs/handoff/TASK_QUEUE.md`
- Update `docs/handoff/NEXT_TASK.md`

## Verification checklist

- [ ] Audit the current team-router/session-artifact path for where router-owned canonical artifacts should be introduced
- [ ] Decide the runtime artifact shapes and references before changing downstream packet construction
- [ ] Persist/link canonical team-session and specialist-step artifacts from the router
- [ ] Rebuild downstream context from validated artifact fields only
- [ ] Add regression tests for artifact persistence/linkage and artifact-driven packet construction
- [ ] Verify the tested forwarding path no longer depends on loose prior-result summary mapping where validated artifacts are available
- [ ] `make typecheck` passes after code changes
- [ ] `make test` passes after code changes
- [ ] Update `CURRENT_STATUS.md` with results
- [ ] Update `TASK_QUEUE.md` and promote the next queued Stage 5a.7 task

## Risks / rollback notes

- The current team router assumes in-memory `ResultPacket` accumulation, so artifact ownership and refs can ripple into session-artifact, logging, and test expectations
- Avoid quietly introducing ownership enforcement or `partial` routing policy in this task; those belong to T-18
- If artifact-backed packet rebuilding exposes contradictions in current prompt contracts or team definitions, record them explicitly but keep the implementation bounded to T-17
