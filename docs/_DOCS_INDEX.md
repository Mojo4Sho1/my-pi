# _DOCS_INDEX.md

## Purpose

Routing file for the active `docs/` tree.

Use this file to decide which documentation area is authoritative for the current question without browsing the whole docs set.

## Start Here

- Do not read all of `docs/` by default.
- Do not read `docs/IMPLEMENTATION_PLAN.md` end-to-end for routine work.
- Route to the smallest relevant area first.

## Common Routes

| If you need... | Read next | Why |
|---|---|---|
| repo navigation rules | `docs/REPO_CONVENTIONS.md` | Naming, index-first behavior, truthfulness rules |
| implementation stage routing | `docs/_IMPLEMENTATION_PLAN_INDEX.md` | Smallest path into the implementation plan |
| stable architecture | `docs/PROJECT_FOUNDATION.md` | Durable scope, principles, platform posture |
| system vocabulary/hierarchy | `docs/ORCHESTRATION_MODEL.md` | Definitions for orchestrator, specialists, teams, sequences, artifacts |
| current validation work | `docs/validation/_VALIDATION_INDEX.md` | Methodology, task specs, result artifacts |
| current handoff flow | `docs/handoff/_HANDOFF_INDEX.md` | Start-of-session and backlog routing |
| Pi extension mechanics | `docs/PI_EXTENSION_API.md` | Extension and command API details |
| upstream Pi compatibility policy | `docs/UPSTREAM_PI_POLICY.md` | Versioning and compatibility-sensitive changes |
| current design proposals | `docs/design/INDEXING_AND_CONTEXT_ROUTING_DESIGN.md` | Working design docs, not durable decisions |

## Directory Guide

### Top-level docs

| File | Authority | Read when | Skip when |
|---|---|---|---|
| `docs/PROJECT_FOUNDATION.md` | Stable architecture | clarifying scope, doctrine, platform posture | you only need current stage/task details |
| `docs/ORCHESTRATION_MODEL.md` | Vocabulary and hierarchy | clarifying object types or control model | the task is local and already uses familiar terms |
| `docs/IMPLEMENTATION_PLAN.md` | Detailed staged build spec | after routing through `docs/_IMPLEMENTATION_PLAN_INDEX.md` to a specific section | routine work that only needs one stage or task |
| `docs/PI_EXTENSION_API.md` | Pi extension reference | touching extension registration, lifecycle, or commands | pure documentation/routing work |
| `docs/UPSTREAM_PI_POLICY.md` | Compatibility policy | touching Pi versions, package loading, or spawned `pi` behavior | task is not compatibility-sensitive |
| `docs/FUTURE_WORK.md` | Deferred ideas | checking explicitly deferred follow-ons | completing current scoped work |

### Subdirectories

| Directory | Read first | Use for | Skip when |
|---|---|---|---|
| `docs/validation/` | `docs/validation/_VALIDATION_INDEX.md` | Stage 5a.3 methodology, tasks, and result artifacts | not doing validation work |
| `docs/handoff/` | `docs/handoff/_HANDOFF_INDEX.md` | queued work, current focus, decisions-needed flow | not using the handoff system |
| `docs/design/` | target design doc only | active proposals driving a change | you only need accepted durable decisions |
| `docs/archive/` | nothing by default | historical background only when a live doc points there | routine work |
| `docs/adr/` | target ADR only | durable architectural decision records | the decision log already answers the question |

## Historical Execution Guides

Completed-stage execution guides have been archived:

- `docs/archive/HANDOFF_5A1B.md`
- `docs/archive/HANDOFF_5A1C.md`
- `docs/archive/HANDOFF_5A2.md`

Read them only when you specifically need historical execution guidance for those completed stages. They are not part of the active handoff path for new work.

## Skip By Default

- `docs/archive/`
- unrelated validation task specs
- unrelated handoff files
- full-plan reads when a stage index would do
