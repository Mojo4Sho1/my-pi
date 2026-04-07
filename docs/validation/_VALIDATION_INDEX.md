# _VALIDATION_INDEX.md

## Purpose

Routing file for `docs/validation/`.

Use this directory when working on Stage 5a.3 validation methodology, task specs, or recorded result artifacts.

## Start Here

- Read `docs/validation/METHODOLOGY.md` for the shared validation rules.
- Then read only the specific task spec you are executing.
- Read result files in `docs/validation/results/` only when reviewing prior runs or continuing a task.

Do not read every validation task spec by default.

## Authoritative Files

| Question | Read | Notes |
|---|---|---|
| What is Stage 5a.3 validating? | `docs/validation/METHODOLOGY.md` | Shared two-layer validation doctrine |
| Which validation task should I run? | `docs/handoff/TASK_QUEUE.md` and `docs/handoff/NEXT_TASK.md` | Handoff docs choose the active task |
| What does task N require? | `docs/validation/TASK_0N_*.md` | Read one task spec at a time |
| What happened on a previous run? | `docs/validation/results/RESULT_*.md` | Background/continuation context only |

## Task Specs

| File | Use for | Skip when |
|---|---|---|
| `TASK_01_JSDOC.md` | shared-types JSDoc validation | not running Task 01 |
| `TASK_02_TEST_README.md` | test-organization README validation | not running Task 02 |
| `TASK_03_FORMAT_HELPERS.md` | shared formatting helper task | not running Task 03 |
| `TASK_04_CONTRACT_VALIDATION.md` | contract completeness validation | not running Task 04 |
| `TASK_05_CONSTANTS.md` | shared constants extraction | not running Task 05 |
| `TASK_06_WIDGET_SNAPSHOTS.md` | widget snapshot validation | not running Task 06 |
| `TASK_07_NEW_SPECIALIST.md` | new specialist validation task | not running Task 07 |
| `TASK_08_DASHBOARD_CMD.md` | `/dashboard` command skeleton task | not running Task 08 |

## Common Access Patterns

### Starting the current validation task

1. `docs/handoff/_HANDOFF_INDEX.md`
2. `docs/handoff/NEXT_TASK.md`
3. `docs/validation/METHODOLOGY.md`
4. the specific `TASK_0N_*.md`
5. the smallest relevant implementation-plan section via `docs/_IMPLEMENTATION_PLAN_INDEX.md`

### Reviewing a completed validation task

1. matching `RESULT_*.md`
2. the matching `TASK_0N_*.md` if you need acceptance criteria
3. `docs/validation/METHODOLOGY.md` only if the shared evaluation rules matter

## Skip By Default

- unrelated task specs
- the entire results directory
- the full implementation plan without routing through `docs/_IMPLEMENTATION_PLAN_INDEX.md`
