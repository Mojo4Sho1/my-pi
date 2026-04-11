# Task Queue

**Last updated:** 2026-04-11
**Owner:** Joe

## Purpose

Prioritized backlog of discrete, agent-executable tasks. After completing assigned tasks, agents must:
1. Mark completed tasks `done` below.
2. Update `CURRENT_STATUS.md` with what was accomplished.
3. Update `NEXT_TASK.md` to point at the next `queued` or `active` task.

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
| T-09 | done | Implement panic and teardown system | `docs/archive/design/PANIC_AND_TEARDOWN_DESIGN.md` | Run registry, abort propagation, settled-state barrier, `/panic` command; no orphaned subprocesses; typecheck + tests pass |

## Phase: Stage 5a.7 Contract-and-Artifact Redesign (COMPLETE)

| ID | Status | Task | Specs to Read | Acceptance Criteria |
|----|--------|------|---------------|---------------------|
| T-09b | done | Live orchestration widget | See NEXT_TASK.md | Widget shows active specialist, chain progress, token count, elapsed time during orchestration; uses existing setWidget() + hook observers |
| T-15 | done | Documentation and roadmap realignment for the contract/artifact redesign | `docs/archive/design/CONTRACT-DRIVEN_SPECIALISTS_TEAM_ARTIFACTS_AND_PACKET_ROUTING_DESIGN.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/handoff/` | Handoff docs, status, implementation plan, indexes, and tester definition all point to Stage 5a.7 and no longer route agents into the old priority order |
| T-16 | done | Preserve structured specialist outputs end-to-end and validate named output fields directly | `docs/archive/design/CONTRACT-DRIVEN_SPECIALISTS_TEAM_ARTIFACTS_AND_PACKET_ROUTING_DESIGN.md`, `docs/IMPLEMENTATION_PLAN.md` (Stage 5a.7) | Parsed specialist outputs preserve named structured payloads end-to-end and output contracts validate real payload fields with regression coverage |
| T-17 | done | Add router-owned team session artifacts and downstream packet construction from validated artifacts only | `docs/archive/design/CONTRACT-DRIVEN_SPECIALISTS_TEAM_ARTIFACTS_AND_PACKET_ROUTING_DESIGN.md`, `docs/IMPLEMENTATION_PLAN.md` (Stage 5a.7) | Router persists canonical team/specialist artifacts and builds downstream TaskPackets from validated artifact fields only |
| T-18 | done | Enforce ownership/edit scope and explicit `partial` routing semantics | `docs/archive/design/CONTRACT-DRIVEN_SPECIALISTS_TEAM_ARTIFACTS_AND_PACKET_ROUTING_DESIGN.md`, `docs/IMPLEMENTATION_PLAN.md` (Stage 5a.7) | Unauthorized field writes are rejected, `partial` handling is explicit per state, and routing stays deterministic |
| T-19 | done | Reconcile tester/build-team behavior across prompts, team definitions, and durable docs | `docs/archive/design/CONTRACT-DRIVEN_SPECIALISTS_TEAM_ARTIFACTS_AND_PACKET_ROUTING_DESIGN.md`, Decision #40 | Canonical build-team flow is `planner -> builder -> tester -> builder -> reviewer -> done` across code-facing and durable docs |
| T-20 | done | Add YAML specialist/team templates and a `build-team` starter spec | `docs/archive/design/CONTRACT-DRIVEN_SPECIALISTS_TEAM_ARTIFACTS_AND_PACKET_ROUTING_DESIGN.md`, `docs/IMPLEMENTATION_PLAN.md` (Stage 5a.7) | `specs/specialists/` and `specs/teams/` templates exist and a `build-team` starter spec reflects the canonical flow |
| T-21 | done | Add validation coverage and run a contradiction audit for the redesigned flow | `docs/archive/design/CONTRACT-DRIVEN_SPECIALISTS_TEAM_ARTIFACTS_AND_PACKET_ROUTING_DESIGN.md`, `docs/IMPLEMENTATION_PLAN.md` (Stage 5a.7) | Validation covers artifact preservation, ownership guardrails, partial handling, spec/runtime parity, and no durable docs contradict the redesigned flow |

## Phase: Layered Context Initialization (Side Quest — ACTIVE)

| ID | Status | Task | Specs to Read | Acceptance Criteria |
|----|--------|------|---------------|---------------------|
| T-22 | done | Onboarding Stage 1: Durable onboarding documentation | `docs/design/onboarding_layed_context.md`, `docs/design/ONBOARDING_IMPLEMENTATION_PLAN.md` (Stage 1) | `docs/LAYERED_ONBOARDING.md` exists with all 5 layers; ADR 0002 exists; decision log entry added |
| T-23 | done | Onboarding Stage 2: Update conventions and routing docs | `docs/design/ONBOARDING_IMPLEMENTATION_PLAN.md` (Stage 2), `docs/REPO_CONVENTIONS.md` | REPO_CONVENTIONS has onboarding section; INDEX.md, _DOCS_INDEX.md, AGENTS.md updated with new routes |
| T-24 | done | Onboarding Stage 3: Structural scaffolding (policies, onboarding, artifacts) | `docs/design/ONBOARDING_IMPLEMENTATION_PLAN.md` (Stage 3), `specs/_SPECS_INDEX.md` | `specs/policies/`, `specs/onboarding/`, `artifacts/` exist with indexes and initial YAML content |
| T-25 | active | Onboarding Stage 4: Onboarding-aware spec fields | `docs/design/ONBOARDING_IMPLEMENTATION_PLAN.md` (Stage 4), `specs/schemas/SPECIALIST_AND_TEAM_YAML_SPEC.md` | Schema doc has V1.1 onboarding fields; templates and build-team.yaml updated |
| T-26 | queued | Onboarding Stage 5: Validation, archival, cleanup | `docs/design/ONBOARDING_IMPLEMENTATION_PLAN.md` (Stage 5), `docs/design/onboarding_layed_context.md` | All 6 scenarios validated; design doc archived; future work items in FUTURE_WORK.md |

## Phase: Post-Stage 5a.7 Follow-On Work (DEFERRED — resumes after T-26)

| ID | Status | Task | Specs to Read | Acceptance Criteria |
|----|--------|------|---------------|---------------------|
| T-10 | deferred | Team state machine e2e validation (5a.3b) | `docs/IMPLEMENTATION_PLAN.md` (5a.3b), `docs/validation/METHODOLOGY.md` | Resume live build-team validation now that Stage 5a.7 is complete; record task-level and substrate-level findings truthfully |
| T-11 | deferred | Tester specialist role redesign (5a.3c) | `docs/IMPLEMENTATION_PLAN.md` (5a.3c), Decision #40 | Only revisit if live validation exposes residual tester-role drift after the completed 5a.7 reconciliation |
| T-12 | deferred | Specialist invocation patterns (5a.3d) | `docs/IMPLEMENTATION_PLAN.md` (5a.3d), Decision #41 | Revisit after T-10 once live validation confirms the redesigned routing model in practice |
| T-13 | deferred | Token logging and observability (5a.3e) | `docs/IMPLEMENTATION_PLAN.md` (5a.3e) | Revisit after T-10 so surfaced token data matches the observed live validation flow |
| T-14 | deferred | Dashboard real-time monitoring (5a.4) | `docs/IMPLEMENTATION_PLAN.md` (5a.4) | Revisit after T-10 so `/dashboard` work is informed by live validation findings |

---

## Notes

- Stage 5a.3 validation methodology and task catalog remain complete. T-10 is the resumed live follow-on for the team router itself.
- T-15 completed the documentation-only realignment pass that promoted Stage 5a.7 to the top of the queue.
- T-16 completed the structured-output preservation pass with green typecheck/test coverage.
- T-17 completed the router-owned artifact pass: team sessions now carry canonical step artifacts, artifact refs, and packet lineage, and downstream routing reads validated artifact fields only.
- T-18 completed the ownership/edit-scope guardrail pass: router-owned artifact fields are now protected, unauthorized structured-output fields are rejected, and non-terminal team states must define explicit `partial` handling.
- T-19 completed the tester/build-team reconciliation pass: tester is now modeled as a test author in runtime code, `build-team` runs `planner -> builder -> tester -> builder -> reviewer`, and regression coverage proves tester-authored artifact routing plus the post-tester builder repair loop.
- T-20 completed the durable specs-layer pass: `specs/` now contains the schema/reference doc, reusable templates, and a starter `build-team` spec aligned to the canonical flow.
- T-21 completed the validation/audit pass: regression coverage now protects the most contradiction-prone Stage 5a.7 seams, and the durable docs/specs touched by the redesign remain explicit about YAML authoring versus TypeScript runtime authority.
- T-10 is deferred while the layered context initialization side quest (T-22 through T-26) runs. It will resume as the active target after T-26 completes.
- T-22 through T-26 implement the onboarding design from `docs/design/onboarding_layed_context.md`. The staged implementation plan is at `docs/design/ONBOARDING_IMPLEMENTATION_PLAN.md`.
- T-22 is complete: the durable onboarding reference, ADR 0002, and Decision #44 are now in the repo.
- T-23 is complete: the onboarding model is now on the normal bootstrap path through `AGENTS.md`, `INDEX.md`, and `docs/_DOCS_INDEX.md`.
- T-24 is complete: the repo now has durable policy/onboarding scaffolding under `specs/` plus a distinct `artifacts/` runtime root.
- T-25 is now the single active target.
