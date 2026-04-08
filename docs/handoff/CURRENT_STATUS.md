# Current Status

**Last updated:** 2026-04-08
**Owner:** Joe

## Current focus

Stage 5a.7 contract-and-artifact redesign implementation — T-20 is complete and T-21 is now the active target.

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
- T-19 tester/build-team reconciliation completed:
  - `extensions/specialists/tester/prompt.ts`, `extensions/specialists/tester/index.ts`, `extensions/shared/registry-entries.ts`, and the orchestrator specialist descriptions now consistently frame tester as a test author
  - builder and reviewer now consume tester-authored artifact fields through contract-driven context only: test strategy, authored cases, test files, execution commands, pass conditions, coverage notes, and builder-reported test execution results
  - `extensions/teams/definitions.ts` now encodes the canonical runtime order `planner -> builder -> tester -> builder -> reviewer -> done` with an explicit post-tester builder pass (`rebuilding`)
  - regression coverage now proves the tester-author handoff, the builder repair loop after tester output, and the updated team/session artifact ordering
- T-20 YAML authoring/spec layer completed:
  - `specs/_SPECS_INDEX.md` now routes the durable `specs/` tree
  - `specs/schemas/SPECIALIST_AND_TEAM_YAML_SPEC.md` now owns the concrete YAML structure decisions for specialist/team authoring
  - reusable YAML templates now exist at `specs/specialists/SPECIALIST_TEMPLATE.yaml` and `specs/teams/TEAM_TEMPLATE.yaml`
  - `specs/teams/build-team.yaml` now captures the canonical future authoring spec for `planner -> builder -> tester -> builder -> reviewer -> done`
  - touched routing docs now distinguish proposal docs (`docs/design/`), durable specs (`specs/`), and current runtime authority (TypeScript)

## Passing checks

- Run timestamp: `2026-04-08`
- T-20 verification scope: doc/YAML-only
- `make typecheck`: not rerun
- `make test`: not rerun

## Known gaps / blockers

- T-21 is now the next Stage 5a.7 deliverable and should stay bounded to validation coverage plus contradiction audit for the redesigned flow.
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
- T-19 established the canonical tester/build-team runtime mapping:
  - `testing` is the tester-authorship state
  - `rebuilding` is the second builder verification/fix state
  - builder/reviewer handoffs now read tester-authored fields through validated artifacts only
- The documented future source-of-truth paths are still intended interfaces only at this point:
  - `specs/specialists/<specialist-id>.yaml`
  - `specs/teams/<team-id>.yaml`
  - `specs/schemas/SPECIALIST_AND_TEAM_YAML_SPEC.md` is the durable schema/reference, but runtime execution still reads TypeScript today

## Next task (single target)

T-21 — Add validation coverage and run a contradiction audit for the redesigned flow (see `NEXT_TASK.md`)

## Definition of done for next task

- Validation covers artifact preservation, ownership guardrails, and explicit `partial` routing semantics for the redesigned flow
- Durable docs remain free of contradictions about tester/build-team behavior and the contract/artifact routing model
- Any contradictions found during the audit are resolved in the touched files
