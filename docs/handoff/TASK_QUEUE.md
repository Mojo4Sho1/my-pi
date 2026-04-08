# Task Queue

**Last updated:** 2026-04-08
**Owner:** Joe

## Purpose

Prioritized backlog of discrete, agent-executable tasks. After completing assigned tasks, agents must:
1. Mark completed tasks `done` below.
2. Update `CURRENT_STATUS.md` with what was accomplished.
3. Update `NEXT_TASK.md` to point at the next `queued` task(s).

For handoff routing, start with `docs/handoff/_HANDOFF_INDEX.md`. For validation task routing, use `docs/validation/_VALIDATION_INDEX.md` before opening individual task specs.

## Status key

- `done` — completed and verified
- `active` — currently being worked on (should match `NEXT_TASK.md`)
- `queued` — ready to start, dependencies met
- `blocked` — cannot start, dependency not met
- `deferred` — intentionally postponed while a higher-priority task or phase is active

---

## Phase: Stage 5a.3 Validation (COMPLETE)

### Tier 1 — Low Risk

| ID | Status | Task | Specs to Read | Acceptance Criteria |
|----|--------|------|---------------|---------------------|
| T-01 | done | Add JSDoc to shared types | `docs/validation/TASK_01_JSDOC.md` | JSDoc added to exported types in `extensions/shared/types.ts` |
| T-02 | done | Test organization README | `docs/validation/TASK_02_TEST_README.md` | `tests/README.md` exists documenting test organization |
| T-03 | done | Create format helpers | `docs/validation/TASK_03_FORMAT_HELPERS.md` | `extensions/shared/format.ts` + `tests/format.test.ts` exist; typecheck + tests pass |

### Tier 2 — Medium Complexity, Multi-Specialist

| ID | Status | Task | Specs to Read | Acceptance Criteria |
|----|--------|------|---------------|---------------------|
| T-04 | done | Contract validation tests | `docs/validation/TASK_04_CONTRACT_VALIDATION.md` | `tests/contract-completeness.test.ts` validates all 9 specialists; typecheck + tests pass |
| T-05 | done | Extract shared constants | `docs/validation/TASK_05_CONSTANTS.md` | `extensions/shared/constants.ts` exists; imports updated; typecheck + tests pass |
| T-06 | done | Widget rendering snapshots | `docs/validation/TASK_06_WIDGET_SNAPSHOTS.md` | 8-state snapshot tests with inline assertions; typecheck + tests pass |

### Tier 3 — High Complexity, Full Build-Team

| ID | Status | Task | Specs to Read | Acceptance Criteria |
|----|--------|------|---------------|---------------------|
| T-07 | done | Build a new specialist (doc-formatter) | `docs/validation/TASK_07_NEW_SPECIALIST.md` | Agent def + extension + prompt config + tests; read-only; typecheck + tests pass |
| T-08 | done | /dashboard command skeleton | `docs/validation/TASK_08_DASHBOARD_CMD.md` | Command registers, overview panel works, projections reused; typecheck + tests pass |

## Phase: Stage 5a.6 Panic and Teardown (COMPLETE)

| ID | Status | Task | Specs to Read | Acceptance Criteria |
|----|--------|------|---------------|---------------------|
| T-09 | done | Implement panic and teardown system | `docs/design/PANIC_AND_TEARDOWN_DESIGN.md` | Run registry, abort propagation, settled-state barrier, `/panic` command; no orphaned subprocesses; typecheck + tests pass |

## Phase: Stage 5a.7 Contract-and-Artifact Redesign (ACTIVE)

| ID | Status | Task | Specs to Read | Acceptance Criteria |
|----|--------|------|---------------|---------------------|
| T-09b | done | Live orchestration widget | See NEXT_TASK.md | Widget shows active specialist, chain progress, token count, elapsed time during orchestration; uses existing setWidget() + hook observers |
| T-15 | done | Documentation and roadmap realignment for the contract/artifact redesign | `docs/design/CONTRACT-DRIVEN_SPECIALISTS_TEAM_ARTIFACTS_AND_PACKET_ROUTING_DESIGN.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/handoff/` | Handoff docs, status, implementation plan, indexes, and tester definition all point to Stage 5a.7 and no longer route agents into the old priority order |
| T-16 | done | Preserve structured specialist outputs end-to-end and validate named output fields directly | `docs/design/CONTRACT-DRIVEN_SPECIALISTS_TEAM_ARTIFACTS_AND_PACKET_ROUTING_DESIGN.md`, `docs/IMPLEMENTATION_PLAN.md` (Stage 5a.7) | Parsed specialist outputs preserve named structured payloads end-to-end and output contracts validate real payload fields with regression coverage |
| T-17 | done | Add router-owned team session artifacts and downstream packet construction from validated artifacts only | `docs/design/CONTRACT-DRIVEN_SPECIALISTS_TEAM_ARTIFACTS_AND_PACKET_ROUTING_DESIGN.md`, `docs/IMPLEMENTATION_PLAN.md` (Stage 5a.7) | Router persists canonical team/specialist artifacts and builds downstream TaskPackets from validated artifact fields only |
| T-18 | done | Enforce ownership/edit scope and explicit `partial` routing semantics | `docs/design/CONTRACT-DRIVEN_SPECIALISTS_TEAM_ARTIFACTS_AND_PACKET_ROUTING_DESIGN.md`, `docs/IMPLEMENTATION_PLAN.md` (Stage 5a.7) | Unauthorized field writes are rejected, `partial` handling is explicit per state, and routing stays deterministic |
| T-19 | done | Reconcile tester/build-team behavior across prompts, team definitions, and durable docs | `docs/design/CONTRACT-DRIVEN_SPECIALISTS_TEAM_ARTIFACTS_AND_PACKET_ROUTING_DESIGN.md`, Decision #40 | Canonical build-team flow is `planner -> builder -> tester -> builder -> reviewer -> done` across code-facing and durable docs |
| T-20 | done | Add YAML specialist/team templates and a `build-team` starter spec | `docs/design/CONTRACT-DRIVEN_SPECIALISTS_TEAM_ARTIFACTS_AND_PACKET_ROUTING_DESIGN.md`, `docs/IMPLEMENTATION_PLAN.md` (Stage 5a.7) | `specs/specialists/` and `specs/teams/` templates exist and a `build-team` starter spec reflects the canonical flow |
| T-21 | active | Add validation coverage and run a contradiction audit for the redesigned flow | `docs/design/CONTRACT-DRIVEN_SPECIALISTS_TEAM_ARTIFACTS_AND_PACKET_ROUTING_DESIGN.md`, `docs/IMPLEMENTATION_PLAN.md` (Stage 5a.7) | Validation covers artifact preservation, ownership guardrails, partial handling, and no durable docs contradict the redesigned flow |

## Phase: Deferred Follow-On Work After Stage 5a.7

| ID | Status | Task | Specs to Read | Acceptance Criteria |
|----|--------|------|---------------|---------------------|
| T-10 | deferred | Team state machine e2e validation (5a.3b) | `docs/IMPLEMENTATION_PLAN.md` (5a.3b) | Resume only after Stage 5a.7 lands and validate the canonical build-team flow in a live Pi session |
| T-11 | deferred | Tester specialist role redesign (5a.3c) | `docs/IMPLEMENTATION_PLAN.md` (5a.3c), Decision #40 | Any residual tester-role cleanup happens after the broader Stage 5a.7 reconciliation |
| T-12 | deferred | Specialist invocation patterns (5a.3d) | `docs/IMPLEMENTATION_PLAN.md` (5a.3d), Decision #41 | Revisit after the contract/artifact routing model stabilizes under Stage 5a.7 |
| T-13 | deferred | Token logging and observability (5a.3e) | `docs/IMPLEMENTATION_PLAN.md` (5a.3e) | Revisit after Stage 5a.7 so surfaced token data matches the redesigned artifact flow |
| T-14 | deferred | Dashboard real-time monitoring (5a.4) | `docs/IMPLEMENTATION_PLAN.md` (5a.4) | Revisit after Stage 5a.7 so `/dashboard` consumes the redesigned artifact and routing substrate |

---

## Notes

- Stage 5a.3 validation is complete. All 8 tasks done.
- T-15 completed the documentation-only realignment pass that promotes Stage 5a.7 to the top of the queue.
- T-16 completed the structured-output preservation pass with green typecheck/test coverage.
- T-17 completed the router-owned artifact pass: team sessions now carry canonical step artifacts, artifact refs, and packet lineage, and downstream routing reads validated artifact fields only.
- T-18 completed the ownership/edit-scope guardrail pass: router-owned artifact fields are now protected, unauthorized structured-output fields are rejected, and non-terminal team states must define explicit `partial` handling.
- T-19 completed the tester/build-team reconciliation pass: tester is now modeled as a test author in runtime code, `build-team` runs `planner -> builder -> tester -> builder -> reviewer`, and regression coverage proves tester-authored artifact routing plus the post-tester builder repair loop.
- T-20 completed the durable specs-layer pass: `specs/` now contains the schema/reference doc, reusable templates, and a starter `build-team` spec aligned to the canonical flow.
- T-21 is now the single active target.
- T-10 through T-14 remain visible but are intentionally deferred until the Stage 5a.7 redesign lands.
