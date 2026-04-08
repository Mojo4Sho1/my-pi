# Current Status

**Last updated:** 2026-04-08
**Owner:** Joe

## Current focus

Stage 5a.7 contract-and-artifact redesign implementation — T-18 is complete and T-19 is now the active target.

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
- T-18 ownership/edit-scope enforcement and explicit `partial` semantics completed:
  - `validateStructuredOutputOwnership()` now distinguishes declared specialist fields from router-owned artifact fields and rejects unauthorized structured-output writes before team routing can continue
  - team step artifacts now record declared editable payload fields from the specialist contract rather than inferring edit scope from whatever validated fields happened to be present at runtime
  - the router now terminates with `contract_violation` when a specialist attempts to write router-owned fields such as `artifactId` or `teamSessionId`
  - output-contract validation now treats `partial` artifacts as "validate what is present, keep typed fields, note omitted required fields" instead of collapsing them into generic contract failure semantics
  - state-machine validation now requires every non-terminal state to define explicit `success` / `partial` / `failure` / `escalation` transitions and rejects duplicate status edges
  - tester advisory payloads such as `testResults` are allowed explicitly without weakening the ownership guardrail for undeclared fields
- The canonical build-team target flow remains documented as `planner -> builder -> tester -> builder -> reviewer -> done`, but code-facing runtime definitions are not yet reconciled to that order; that is the T-19 gap.

## Passing checks

- Run timestamp: `2026-04-08`
- `make typecheck`: PASS
- `make test`: PASS

## Known gaps / blockers

- Tester/build-team reconciliation is now the main remaining Stage 5a.7 gap:
  - `extensions/specialists/tester/prompt.ts` is still validation-runner oriented instead of fully test-author oriented per Decision #40
  - `extensions/teams/definitions.ts` still encodes the older `planner -> builder -> review -> testing -> done` exemplar instead of the canonical `planner -> builder -> tester -> builder -> reviewer -> done` flow
  - any durable docs touched while reconciling that flow will need to stay aligned with the runtime truth
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
- For T-19 specifically, the most likely code hotspots are:
  - `agents/specialists/tester.md`
  - `extensions/specialists/tester/prompt.ts`
  - `extensions/specialists/builder/prompt.ts`
  - `extensions/specialists/reviewer/prompt.ts`
  - `extensions/teams/definitions.ts`
  - `tests/tester.test.ts`
  - `tests/team-router.test.ts`
  - `tests/session-artifact.test.ts`

## Next task (single target)

T-19 — Reconcile tester/build-team behavior across prompts, team definitions, and durable docs (see `NEXT_TASK.md`)

## Definition of done for next task

- Tester is modeled consistently as a test author in prompt/config/docs
- Build-team runtime order matches `planner -> builder -> tester -> builder -> reviewer -> done`
- Regression coverage proves the tester-author handoff and builder repair loop work as designed
