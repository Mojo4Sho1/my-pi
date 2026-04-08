# Current Status

**Last updated:** 2026-04-07
**Owner:** Joe

## Current focus

Stage 5a.7 contract-and-artifact redesign kickoff — documentation realignment is complete and T-16 is now the active implementation target.

## Completed in current focus

- T-15 documentation and roadmap realignment completed:
  - handoff docs now route agents into Stage 5a.7 work instead of the older T-10 live-validation thread
  - `STATUS.md`, the implementation plan, and routing indexes now treat the contract/artifact redesign as the top-priority initiative
  - T-10 through T-14 remain visible but are explicitly marked `deferred`
- Tester specialist documentation now reflects the intended test-author role instead of a primary test-runner role
- The canonical build-team target flow is now documented as `planner -> builder -> tester -> builder -> reviewer -> done`

## Passing checks

- Run timestamp: `2026-04-07`
- `rg -n "Stage 5a\\.7|T-16|deferred|planner -> builder -> tester -> builder -> reviewer -> done"`: PASS
  - Updated handoff, status, and plan docs now route to Stage 5a.7 and preserve deferred follow-on work visibly
- Legacy active-path search over updated handoff/status docs: PASS
  - No updated handoff/status doc still points at the old active validation path

## Known gaps / blockers

- Runtime code has not yet been realigned to the Stage 5a.7 contract/artifact architecture; T-16 is the first implementation task in that sequence.
- T-10 through T-14 are intentionally deferred until the Stage 5a.7 redesign lands.
- `/next` skill not loading in Pi remains a separate background issue.

## Decision notes for next session

- Stage 5a.7 now supersedes the earlier post-teardown queue; do not resume T-10 through T-14 unless the queue explicitly promotes them again.
- Treat `docs/design/CONTRACT-DRIVEN_SPECIALISTS_TEAM_ARTIFACTS_AND_PACKET_ROUTING_DESIGN.md` as the source of truth for the redesign pass.
- The documented future source-of-truth paths are intended interfaces only at this point:
  - `specs/specialists/<specialist-id>.yaml`
  - `specs/teams/<team-id>.yaml`
  - `artifacts/team-sessions/<team-session-id>/...`
- For T-16 specifically, the most likely code hotspots are:
  - `extensions/shared/result-parser.ts`
  - `extensions/shared/contracts.ts`
  - `extensions/shared/specialist-extension.ts`
  - `extensions/orchestrator/delegate.ts`
  - `extensions/teams/router.ts`
- For T-16 specifically, the fastest regression-reading path is:
  - `tests/result-parser.test.ts`
  - `tests/contracts.test.ts`
  - `tests/orchestrator-context.test.ts`
  - `tests/orchestrator-delegate.test.ts`
  - `tests/team-router.test.ts`

## Next task (single target)

T-16 — Preserve structured specialist outputs end-to-end and validate named output fields directly (see `NEXT_TASK.md`)

## Definition of done for next task

- Named structured payload fields survive the runtime path end-to-end
- Output contracts validate actual named payload fields
- Regression coverage proves the preserved structured payloads feed downstream behavior correctly
