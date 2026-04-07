# Task Queue

**Last updated:** 2026-04-07
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

---

## Phase: Stage 5a.3 Validation

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
| T-08 | active | /dashboard command skeleton | `docs/validation/TASK_08_DASHBOARD_CMD.md` | Command registers, overview panel works, projections reused; typecheck + tests pass |

---

## Notes

- Tasks 01 and 02 were completed outside the orchestrator (low-risk, manual). Tasks 03-08 run through the Pi orchestrator.
- Each task includes a detailed spec in `docs/validation/` with full acceptance criteria and stress-test focus.
- Tier 3 tasks use the full build-team state machine (planner → reviewer → builder → tester).
