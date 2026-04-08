# Current Status

**Last updated:** 2026-04-07
**Owner:** Joe

## Current focus

Stage 5a.7 contract-and-artifact redesign implementation — T-17 is complete and T-18 is now the active target.

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
- T-17 router-owned artifact routing completed:
  - the team router now records canonical per-step machine artifacts (`stepArtifacts`) plus linked `artifactRefs` and full `taskPacketLineage` inside the router-owned `TeamSessionArtifact`
  - downstream team `TaskPacket.context` is now rebuilt from validated step-artifact fields via `buildContextFromArtifacts()` instead of from loose prior-result summaries
  - per-step artifacts preserve validated output fields, logical artifact paths, ownership metadata placeholders (`editableFields` / `readOnlyFields`), and linkage back to the input task packet
  - regression coverage now asserts artifact persistence/linkage and artifact-driven downstream packet construction across contracts, team-router, session-artifact, and dashboard fixture coverage
- Tester specialist documentation now reflects the intended test-author role instead of a primary test-runner role
- The canonical build-team target flow is now documented as `planner -> builder -> tester -> builder -> reviewer -> done`

## Passing checks

- Run timestamp: `2026-04-07`
- `make typecheck`: PASS
- `make test`: PASS

## Known gaps / blockers

- Ownership/edit-scope enforcement is still metadata-only: step artifacts now record editable/read-only fields, but the runtime does not yet reject unauthorized specialist field writes; that is T-18.
- Team-state `partial` handling is still not explicit and deterministic per state; that is also T-18.
- Tester/build-team flow reconciliation across code-facing prompts, team definitions, and durable docs remains queued behind T-18 as T-19.
- T-10 through T-14 are intentionally deferred until the Stage 5a.7 redesign lands.
- `/next` skill not loading in Pi remains a separate background issue.

## Decision notes for next session

- Stage 5a.7 now supersedes the earlier post-teardown queue; do not resume T-10 through T-14 unless the queue explicitly promotes them again.
- Treat `docs/design/CONTRACT-DRIVEN_SPECIALISTS_TEAM_ARTIFACTS_AND_PACKET_ROUTING_DESIGN.md` as the source of truth for the redesign pass.
- T-17 established the current runtime artifact surface:
  - `TeamSessionArtifact.stepArtifacts`
  - `TeamSessionArtifact.artifactRefs`
  - `TeamSessionArtifact.taskPacketLineage`
  - logical artifact paths under `artifacts/team-sessions/<team-session-id>/...`
- The documented future source-of-truth paths are still intended interfaces only at this point:
  - `specs/specialists/<specialist-id>.yaml`
  - `specs/teams/<team-id>.yaml`
- For T-18 specifically, the most likely code hotspots are:
  - `extensions/teams/router.ts`
  - `extensions/shared/types.ts`
  - `extensions/shared/contracts.ts`
  - `extensions/teams/definitions.ts`
  - specialist prompt configs whose contracts will need ownership semantics
- For T-18 specifically, the fastest regression-reading path is:
  - `tests/team-router.test.ts`
  - `tests/session-artifact.test.ts`
  - `tests/contracts.test.ts`
  - `tests/orchestrator-team-e2e.test.ts`

## Next task (single target)

T-18 — Enforce ownership/edit scope and explicit `partial` routing semantics (see `NEXT_TASK.md`)

## Definition of done for next task

- Unauthorized specialist field writes are rejected against explicit ownership/edit-scope rules
- Team routing handles `partial` explicitly and deterministically per state
- Regression coverage proves ownership guardrails and `partial` transitions work as designed
