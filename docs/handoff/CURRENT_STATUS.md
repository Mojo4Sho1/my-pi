# Current Status

**Last updated:** 2026-04-07
**Owner:** Joe

## Current focus

Stage 5a.7 contract-and-artifact redesign implementation — T-16 is complete and T-17 is now the active target.

## Completed in current focus

- T-15 documentation and roadmap realignment completed:
  - handoff docs now route agents into Stage 5a.7 work instead of the older T-10 live-validation thread
  - `STATUS.md`, the implementation plan, and routing indexes now treat the contract/artifact redesign as the top-priority initiative
  - T-10 through T-14 remain visible but are explicitly marked `deferred`
- T-16 structured-output preservation completed:
  - `ResultPacket` now preserves a canonical `structuredOutput` payload end-to-end instead of dropping named specialist fields after parsing
  - output contracts now validate the actual structured payload fields specialists produced, not synthetic `deliverable_<n>` placeholders
  - planner-to-builder and builder-to-reviewer/tester routing now reuse preserved structured fields (`steps`, `changeDescription`) in downstream context
  - reviewer findings contracts now use `object[]`, matching the machine payload shape actually produced at runtime
  - targeted regressions were added/updated across parser, contract, orchestrator, packet, and team-router coverage
- Tester specialist documentation now reflects the intended test-author role instead of a primary test-runner role
- The canonical build-team target flow is now documented as `planner -> builder -> tester -> builder -> reviewer -> done`

## Passing checks

- Run timestamp: `2026-04-07`
- `make typecheck`: PASS
- `make test`: PASS

## Known gaps / blockers

- Router-owned canonical team/specialist artifacts and downstream packet rebuilding from validated artifacts are not implemented yet; that is T-17.
- Ownership/edit-scope enforcement and explicit per-state `partial` handling remain queued behind T-17 as T-18.
- T-10 through T-14 are intentionally deferred until the Stage 5a.7 redesign lands.
- `/next` skill not loading in Pi remains a separate background issue.

## Decision notes for next session

- Stage 5a.7 now supersedes the earlier post-teardown queue; do not resume T-10 through T-14 unless the queue explicitly promotes them again.
- Treat `docs/design/CONTRACT-DRIVEN_SPECIALISTS_TEAM_ARTIFACTS_AND_PACKET_ROUTING_DESIGN.md` as the source of truth for the redesign pass.
- The documented future source-of-truth paths are intended interfaces only at this point:
  - `specs/specialists/<specialist-id>.yaml`
  - `specs/teams/<team-id>.yaml`
  - `artifacts/team-sessions/<team-session-id>/...`
- For T-17 specifically, the most likely code hotspots are:
  - `extensions/teams/router.ts`
  - `extensions/shared/types.ts`
  - `extensions/shared/packets.ts`
  - `extensions/shared/contracts.ts`
  - `extensions/orchestrator/delegate.ts`
- For T-17 specifically, the fastest regression-reading path is:
  - `tests/team-router.test.ts`
  - `tests/session-artifact.test.ts`
  - `tests/orchestrator-team-e2e.test.ts`
  - `tests/contracts.test.ts`

## Next task (single target)

T-17 — Add router-owned team session artifacts and downstream packet construction from validated artifacts only (see `NEXT_TASK.md`)

## Definition of done for next task

- Router persists canonical machine-first team/specialist artifacts for each team step
- Downstream packets are constructed from validated artifact fields only
- Regression coverage proves routing uses validated artifacts rather than ad hoc prior-result summaries
