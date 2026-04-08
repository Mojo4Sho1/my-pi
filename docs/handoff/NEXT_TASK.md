# Next Task

**Last updated:** 2026-04-07
**Owner:** Joe

## Task summary

Implement T-16 from Stage 5a.7 by preserving structured specialist outputs end-to-end and validating named output fields directly. The outcome of this task should be a code path where parsed specialist payloads remain canonical machine-readable artifacts for routing and contract checks, instead of being collapsed to generic summaries or placeholder deliverables.

## Why this task is next

- T-15 completed the documentation and roadmap realignment, so fresh-context agents now route into Stage 5a.7 instead of the older live-validation queue
- T-16 is the first implementation task in the redesign sequence and unblocks router-owned artifacts, ownership guardrails, and tester/build-team reconciliation
- The design document explicitly calls for preserving named structured outputs before the router can safely construct downstream packets from validated artifact fields

## Scope (in)

- Audit the existing result-parsing, packet, and contract-validation path for places where named structured fields are dropped or replaced with generic summaries
- Update shared types and parsing so structured specialist payloads remain available end-to-end as the canonical machine-readable routing substrate
- Replace placeholder-style output validation with validation against the actual named payload fields specialists produce
- Add or update regression tests covering planner-to-builder and builder-to-tester style payload preservation at the structured-field level
- Update durable docs only where needed to reflect the implemented structured-output behavior truthfully

## Scope (out)

- Router-owned team session artifact persistence and downstream packet rebuilding from validated artifacts only (that is T-17)
- Ownership/edit-scope enforcement and explicit per-state `partial` handling (that is T-18)
- Full tester/build-team reconciliation across prompts and team definitions (that is T-19)
- YAML specialist/team template creation (that is T-20)
- Live Pi validation reruns and `/dashboard` follow-on work (deferred tasks T-10 through T-14)

## Relevant files

- References: `docs/design/CONTRACT-DRIVEN_SPECIALISTS_TEAM_ARTIFACTS_AND_PACKET_ROUTING_DESIGN.md`
- References: `docs/IMPLEMENTATION_PLAN.md` (Stage 5a.7)
- References: `extensions/shared/result-parser.ts`
- References: `extensions/shared/types.ts`
- References: `extensions/shared/contracts.ts`
- References: `extensions/shared/specialist-extension.ts`
- References: `extensions/orchestrator/delegate.ts`
- References: `extensions/teams/router.ts`
- References: `tests/result-parser.test.ts`
- References: `tests/contracts.test.ts`
- References: `tests/orchestrator-context.test.ts`
- References: `tests/orchestrator-delegate.test.ts`
- References: `tests/team-router.test.ts`

## Recommended first reads

1. `docs/design/CONTRACT-DRIVEN_SPECIALISTS_TEAM_ARTIFACTS_AND_PACKET_ROUTING_DESIGN.md`
2. `docs/IMPLEMENTATION_PLAN.md` (Stage 5a.7 only)
3. `extensions/shared/result-parser.ts`
4. `extensions/shared/contracts.ts`
5. `extensions/orchestrator/delegate.ts`
6. `extensions/teams/router.ts`
7. `tests/result-parser.test.ts` and `tests/contracts.test.ts`

## Likely implementation hotspots

- `extensions/shared/result-parser.ts` still treats generic `deliverables` as the primary parsed structured substrate for most specialists
- `extensions/shared/contracts.ts` still validates output through deliverables-shaped objects and generic field extraction helpers
- `extensions/orchestrator/delegate.ts` still forwards context through summary-and-deliverables mappings for several specialist paths
- `extensions/teams/router.ts` still converts deliverables into `deliverable_<n>` style fields when building downstream context
- `extensions/shared/specialist-extension.ts` is in the direct specialist execution path and may need to preserve any richer parsed payload data

## Dependencies / prerequisites

- T-15 documentation realignment complete
- Stage 4a through 4d substrate available as the starting point
- Decision #40 remains the durable tester-role direction, but full reconciliation is deferred to T-19

## Acceptance criteria (definition of done)

- Named structured payload fields from specialist outputs are preserved end-to-end in the runtime path instead of being reduced to summary-only routing inputs
- Output contract validation checks the actual named payload fields the specialist produced
- Regression tests cover at least one success path where downstream context is built from preserved structured payload data
- Docs touched by the implementation remain truthful about the current Stage 5a.7 behavior
- Update `docs/handoff/CURRENT_STATUS.md`
- Update `docs/handoff/TASK_QUEUE.md`
- Update `docs/handoff/NEXT_TASK.md`

## Verification checklist

- [ ] Audit where structured output is currently parsed, stored, validated, and forwarded
- [ ] Decide what the canonical runtime carrier for preserved structured payloads is before changing downstream call sites
- [ ] Preserve named payload fields in the canonical runtime data path
- [ ] Replace placeholder-style output validation with named-field validation
- [ ] Add regression tests for structured payload preservation and validation
- [ ] Verify the tested forwarding path no longer depends on synthetic `deliverable_<n>` mapping
- [ ] `make typecheck` passes after code changes
- [ ] `make test` passes after code changes
- [ ] Update `CURRENT_STATUS.md` with results
- [ ] Update `TASK_QUEUE.md` and promote the next queued Stage 5a.7 task

## Risks / rollback notes

- The current runtime may depend on summary/deliverable fallback behavior in more places than expected, so changes here can ripple into synthesis or team routing
- Avoid quietly introducing router-owned artifact persistence or ownership enforcement in this task; those belong to T-17 and T-18
- If structured output preservation exposes contradictions in current prompts or contracts, record them explicitly but keep the implementation bounded to T-16
