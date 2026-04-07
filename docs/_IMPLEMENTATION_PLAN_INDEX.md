# _IMPLEMENTATION_PLAN_INDEX.md

## Purpose

Companion router for `docs/IMPLEMENTATION_PLAN.md`.

Use this file to find the smallest relevant stage or section first. Do not read the full implementation plan for routine task execution.

## Full-Plan Read Rule

Read `docs/IMPLEMENTATION_PLAN.md` end-to-end only when:

- doing architecture-wide replanning
- maintaining or restructuring the plan itself
- making a cross-stage design decision
- explicitly asked for a full-plan review

For ordinary work, route to the smallest relevant section below and read only that section.

## Stage and Section Routing

| Stage / section | Purpose | Read when | Skip when | Related files |
|---|---|---|---|---|
| Purpose / Planning doctrine / Stage overview | Explains how the staged roadmap is organized | orienting to the plan structure itself | you already know the relevant stage | `STATUS.md`, `DECISION_LOG.md` |
| Stage 1 — Foundation and shared types | Establishes core packet/routing primitives | working on shared packet/routing foundations | touching later-stage dashboard, team, or meta-team work only | `extensions/shared/`, `tests/packets.test.ts`, `tests/routing.test.ts` |
| Stage 2 — First specialist extension | Proves the initial builder pattern | revisiting specialist extension scaffolding | working on mature orchestrator/team/dashboard layers | `extensions/specialists/builder/`, `tests/builder.test.ts` |
| Stage 3a — Shared specialist infrastructure | Extracts common prompt/result/subprocess infrastructure | touching specialist factory/shared invocation substrate | task is only about teams, dashboard, or docs | `extensions/shared/specialist-prompt.ts`, `extensions/shared/result-parser.ts`, `extensions/shared/subprocess.ts` |
| Stage 3b — Remaining specialists | Adds planner/reviewer/tester | changing those specialist roles or their shared flow | task is unrelated to the initial specialist layer | `extensions/specialists/`, `tests/planner.test.ts`, `tests/reviewer.test.ts`, `tests/tester.test.ts` |
| Stage 3c — Orchestrator extension | Adds orchestration selection/delegation/synthesis | touching `orchestrate`, delegation, or synthesis | task is only about lower-level specialists or docs | `extensions/orchestrator/`, `tests/orchestrator-*.test.ts` |
| Stage 3c.1 — Selective context forwarding | Narrows context passed between specialists | changing context mapping or downstream packet contents | task does not affect context forwarding | `extensions/orchestrator/delegate.ts`, `DECISION_LOG.md` |
| Stage 3d — Integration and end-to-end validation | Defines orchestrator integration tests | adding regression coverage for orchestration flow | task is doc-only or purely local implementation | `tests/orchestrator-e2e.test.ts` |
| Stage 4a — I/O contracts and typed deliverables | Formalizes specialist input/output contracts | touching contract validation or deliverable schema rules | task does not affect cross-specialist compatibility | `extensions/shared/contracts.ts`, `extensions/shared/types.ts` |
| Stage 4b — Team definition format and router | Defines team state-machine execution | changing team routing, revision loops, or team definitions | task is only about direct specialist execution | `extensions/teams/router.ts`, `extensions/teams/definitions.ts` |
| Stage 4c — Schema validation | Adds schema-level validation around team definitions | touching router validation or schema enforcement | task does not involve definition validation | team validation tests and shared schema logic |
| Stage 4d — Observability | Adds logs, preflight checks, and session artifacts | touching execution artifacts or observability substrate | task is unrelated to logs/artifacts | `extensions/shared/logging.ts`, session-artifact tests |
| Stage 4e.1 — Tighten existing primitives | Hardens review findings and model routing | touching reviewer structure or per-specialist model selection | task is elsewhere in the stack | `extensions/shared/config.ts`, review/model-routing tests |
| Stage 4e.2 — Execution-state artifact | Adds typed worklist substrate | touching worklist state or orchestrator/worklist interop | task is unrelated to execution-state tracking | `extensions/worklist/`, `tests/worklist*.test.ts` |
| Stage 5a — Bootstrap specialists | Adds the extended specialist roster and adequacy layer | touching spec-writer/schema-designer/routing-designer/critic/boundary-auditor or adequacy checks | task is unrelated to Stage 5 primitives | `agents/specialists/`, `extensions/specialists/`, adequacy tests |
| Stage 5a.1 — Token tracking substrate | Adds token accounting and thresholds | touching token capture, rollups, or thresholds | task is not about token data | `extensions/shared/tokens.ts`, token tests |
| Stage 5a.1b — Hook substrate | Adds runtime hook infrastructure | touching hook registration/dispatch or observer/policy surfaces | task does not affect runtime hooks | `extensions/shared/hooks.ts`, `docs/archive/HANDOFF_5A1B.md` |
| Stage 5a.1c — Deterministic sandboxing and path protection | Adds policy envelopes and path checks | touching authority enforcement or sandbox policy | task is unrelated to delegation policy | `extensions/shared/sandbox.ts`, `docs/archive/HANDOFF_5A1C.md` |
| Stage 5a.2 — Dashboard substrate and persistent widget | Adds projection layer and widget | touching dashboard types, projections, or widget lifecycle | task is unrelated to dashboard observability | `extensions/dashboard/`, `docs/archive/HANDOFF_5A2.md` |
| Stage 5a.3 — Build-team validation on real tasks | Defines the live validation pass | working on validation methodology, tasks, or bugs found during validation | task is not part of validation work | `docs/validation/_VALIDATION_INDEX.md`, `STATUS.md` |
| Stage 5a.4 — `/dashboard` command | Defines the detailed inspector command | touching `/dashboard` command behavior or panels | task is only about the widget or non-dashboard code | `extensions/dashboard/`, `docs/PI_EXTENSION_API.md` |
| Stage 5a.5 — Convention-aware orchestrator | Adds project-convention scanning/injection | touching convention scanning or prompt injection rules | task is unrelated to repo convention forwarding | `AGENTS.md`, `package.json`, `Makefile`, shared prompt/orchestrator files |
| Stage 5b — Specialist-creator team | First meta-team for creating specialists | working on creator-team outputs or proposal governance | task is not about meta-teams | creator-team specs, typed deliverables work |
| Stage 5c — Team-creator team | Meta-team for building teams | working on governed team creation | task is not about creator teams | team definitions and creator-team docs |
| Stage 5d — Sequence definition and execution | Introduces sequence runtime | touching sequence execution model | current task stays at specialist/team/dashboard layer | `docs/ORCHESTRATION_MODEL.md` |
| Stage 5e — Sequence-creator team | Meta-team for sequences | working on sequence creation flow | task does not concern sequences | sequence/creator-team docs |
| Stage 5f — Seed-creator team | Meta-team for repo/domain seeds | working on seed creation workflow | task is unrelated to seeds | `README.md`, seed docs |
| Stage 5g — Dynamic selection and discovery | Future dynamic primitive selection | designing runtime primitive discovery | current task uses explicit routing or existing selection | orchestrator selection docs |
| Stage 5h — Escalation and retry | Future higher-level recovery flow | designing retry/escalation behavior | current task is local and non-retry-related | orchestration and artifact docs |
| Stage 5i — Task relay and handoff system | Future structured relay/handoff substrate | working on fresh-context handoff design | task does not affect handoff artifacts | `docs/handoff/`, Decision #25 |
| Stage 5j — Context-aware self-respawn | Future self-respawn pattern | designing fresh-context continuation behavior | task does not concern respawn/continuation | handoff docs and future work |
| Stage 6a-6d — Reflective expertise layer | Governed specialist-improvement system | working on expertise overlays or their governance | task is not about reflective improvement | Decision #35, expertise-layer design |
| Stage 7 — Command surface | Long-term command-surface doctrine | working on command-surface policy or new commands | task is not command-surface-related | Decision #17, dashboard stages |
| Notes / Explicitly deferred work / Dependency chain | Cross-stage caveats and sequencing | checking deferrals or broad dependencies | a single stage section already answers the question | `STATUS.md`, `DECISION_LOG.md` |

## Current Working Bias

The repo is currently operating in Stage 5a.x work. For most current tasks, start with:

1. `STATUS.md`
2. `DECISION_LOG.md`
3. this index
4. the smallest relevant `docs/IMPLEMENTATION_PLAN.md` section
5. task-local docs such as `docs/validation/` or `docs/handoff/`
