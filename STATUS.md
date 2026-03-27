# STATUS.md

Last updated: 2026-03-28

## Progress Checklist

### Stage 1 — Foundation and Shared Types [COMPLETE]

- [x] `tsconfig.json` configured for Pi extension development
- [x] `extensions/shared/types.ts` — TaskPacket, ResultPacket, AgentDefinition, SpecialistConfig, TeamDefinition
- [x] `extensions/shared/packets.ts` — createTaskPacket, createResultPacket, validateTaskPacket, validateResultPacket
- [x] `extensions/shared/routing.ts` — State machine definition, validation, advancement
- [x] `tests/packets.test.ts` — 23 tests
- [x] `tests/routing.test.ts` — 16 tests
- [x] TypeScript compiles cleanly, all tests pass

### Stage 2 — First Specialist Extension (Builder) [COMPLETE]

- [x] `extensions/specialists/builder/prompt.ts` — System/task prompt construction
- [x] `extensions/specialists/builder/result-parser.ts` — Structured output extraction from sub-agent
- [x] `extensions/specialists/builder/subprocess.ts` — Pi sub-agent spawn and JSON event parsing
- [x] `extensions/specialists/builder/index.ts` — Pi extension registering `delegate-to-builder` tool
- [x] `tests/builder.test.ts` — 26 tests (prompt, result parsing, subprocess mocking)
- [x] Dependencies added: `@sinclair/typebox`, `@mariozechner/pi-coding-agent`
- [x] 4-module pattern proven (prompt, result-parser, subprocess, index)

### Stage 3a — Extract Shared Specialist Infrastructure [COMPLETE]

- [x] Extract `subprocess.ts` to `extensions/shared/subprocess.ts` (specialist-agnostic)
- [x] Extract `result-parser.ts` to `extensions/shared/result-parser.ts` (generic JSON extraction)
- [x] Create `extensions/shared/specialist-prompt.ts` — generic `buildSpecialistSystemPrompt(config)` and `buildSpecialistTaskPrompt(task)` that accept working style config
- [x] Refactor builder to use shared infrastructure (verify no regressions)
- [x] Tests for shared modules

### Stage 3b — Remaining Specialists (Planner, Reviewer, Tester) [COMPLETE]

- [x] `extensions/specialists/planner/index.ts` — `delegate-to-planner` tool (planning-only, returns structured plan)
- [x] `extensions/specialists/planner/prompt.ts` — Planner-specific prompt config (working style, constraints, anti-patterns)
- [x] `tests/planner.test.ts` — 13 tests
- [x] `extensions/specialists/reviewer/index.ts` — `delegate-to-reviewer` tool (review-only, returns findings)
- [x] `extensions/specialists/reviewer/prompt.ts` — Reviewer-specific prompt config
- [x] `tests/reviewer.test.ts` — 13 tests
- [x] `extensions/specialists/tester/index.ts` — `delegate-to-tester` tool (validation-only, returns pass/fail)
- [x] `extensions/specialists/tester/prompt.ts` — Tester-specific prompt config
- [x] `tests/tester.test.ts` — 13 tests
- [x] All specialists use shared factory (`createSpecialistExtension`), 118 total tests pass

### Stage 3c — Orchestrator Extension [COMPLETE]

- [x] `extensions/orchestrator/select.ts` — Specialist selection (keyword heuristics, explicit hints, multi-specialist workflow ordering)
- [x] `extensions/orchestrator/delegate.ts` — Delegation lifecycle (prompt building, subprocess spawning, result parsing, error handling)
- [x] `extensions/orchestrator/synthesize.ts` — Result synthesis (status aggregation, summary composition)
- [x] `extensions/orchestrator/index.ts` — Orchestrator extension registering `orchestrate` tool:
  - [x] Selects appropriate specialist(s) for a task
  - [x] Packages task packets with narrowed context (read-only specialists get empty write set)
  - [x] Collects and synthesizes results
  - [x] Stops chain on failure/escalation, forwards prior results to subsequent specialists
- [x] Delegation modes: direct specialist (via hint), multi-specialist (via auto-selection)
- [x] `tests/orchestrator-select.test.ts` — 21 tests (hints, keyword matching, multi-specialist, defaults)
- [x] `tests/orchestrator-delegate.test.ts` — 7 tests (success, failure, escalation, abort signal, config lookup)
- [x] `tests/orchestrator-synthesize.test.ts` — 13 tests (status logic, summary composition, edge cases)
- [x] All 159 tests pass, TypeScript compiles cleanly

### Stage 3c.1 — Selective Context Forwarding [COMPLETE]

- [x] Add `buildContextForSpecialist(specialistId, priorResults)` to `extensions/orchestrator/delegate.ts`
  - Planner: returns `undefined` (always first, no prior context)
  - Builder: returns `{ planSummary, planDeliverables }` from planner result (if present), else `undefined`
  - Reviewer: returns `{ modifiedFiles, implementationSummary }` from builder result (if present), else `undefined`
  - Tester: returns `{ modifiedFiles, implementationSummary }` from builder result (if present), else `undefined`
  - Find prior results via `sourceAgent` field (e.g., `"specialist_planner"`)
- [x] Update `extensions/orchestrator/index.ts`: replace `{ priorResults }` with `buildContextForSpecialist(specialistId, priorResults)`
- [x] `tests/orchestrator-context.test.ts` — 14 tests (pure function, no mocking)
- [x] All 173 tests pass (159 existing + 14 new), TypeScript compiles cleanly

### Stage 3d — Integration and End-to-End Validation [COMPLETE]

All 3d tests are **integration tests with mocked subprocesses** (not live sub-agent runs). They test the orchestrator's `execute()` function in `extensions/orchestrator/index.ts` end-to-end.

**Full workflow integration tests** (`tests/orchestrator-e2e.test.ts`):
- [x] **Success path:** Mock `spawnSpecialistAgent` for planner and builder. Call `orchestrate` with task "plan and implement the feature". Verify: planner invoked first, builder invoked second with planner's context forwarded, synthesized result is `status: "success"`, both specialist summaries present.
- [x] **3-specialist success:** Planner → builder → tester all succeed. Verify full chain and synthesis.
- [x] **Mid-chain failure:** Planner succeeds, builder returns `status: "failure"`. Verify: chain stops, tester never invoked, synthesized status is `"partial"`, planner result preserved.
- [x] **Escalation stops chain:** Planner returns `status: "escalation"` with reason. Verify: no subsequent specialists invoked, synthesized status is `"escalation"`, escalation reason preserved.
- [x] **Reviewer rejection:** Planner → reviewer where reviewer returns `status: "failure"`. Verify chain stops with `"partial"`.

**Context forwarding tests:**
- [x] Builder's task packet contains planner's plan in `context` field (after 3c.1: only relevant fields, not full ResultPacket)
- [x] Tester's task packet contains builder's `modifiedFiles` and `summary` in `context`
- [x] First specialist (planner) receives no `context` field

**Boundary enforcement tests** (verify packet structure, not LLM behavior):
- [x] Read-only specialists (planner, reviewer) receive `allowedWriteSet: []`
- [x] Builder/tester receive `allowedWriteSet` matching `relevantFiles`
- [x] Each specialist's task packet has correct `targetAgent` matching the specialist's ID

**Error handling tests:**
- [x] Subprocess spawn throws → orchestrator returns failure, chain stops
- [x] Subprocess exits non-zero with no output → failure packet with stderr
- [x] Malformed specialist output (no JSON) → `status: "partial"`, chain continues if not terminal

**Testing approach:** Mock at `spawnSpecialistAgent` level (same pattern as `tests/orchestrator-delegate.test.ts`). Use `vi.doMock()` with `.mockResolvedValueOnce()` chaining per specialist to simulate the full chain. All 188 tests pass (173 existing + 15 new).

### Stage 4 — Team Routing and Validation [COMPLETE]

**Note:** 4a + 4b are implemented together (Decision #24). 4c + 4d follow as a separate pass.

#### 4a — I/O Contracts and Typed Deliverables [COMPLETE]
- [x] Define `InputContract` and `OutputContract` types in `extensions/shared/types.ts`
- [x] Each specialist declares its input requirements and output schema (what its `deliverables` field contains)
- [x] Contract validation at delegation boundaries: "does specialist A's output satisfy specialist B's input?" — `extensions/shared/contracts.ts`
- [x] Output templates: each specialist knows the exact schema required of its result — typed output format in system prompt
- [x] `tests/contracts.test.ts` — 20 tests (validation, compatibility, context building)

#### 4b — Team Definition Format and Router [COMPLETE]
- [x] Extended state machine: loop transitions with `maxIterations` guard (Decision #21) — `MachineState.iterationCounts`, `advanceState()` returns `{ exhausted }` when limit reached
- [x] Extended state machine: fan-out state type for parallel dispatch (Decision #21) — type stubs only (`agents?`, `fanOutJoin?`), implementation deferred
- [x] Team definition format (TypeScript interface): members, state transitions, entry/exit contracts — `TeamDefinition` extended with `entryContract`/`exitContract`
- [x] Team router: reads team definition, executes extended state machine, routes packets between specialists — `extensions/teams/router.ts`
- [x] Intra-team revision loops: critique sent back to original author, max-iteration guard, escalation on exhaust (Decision #23)
- [x] Critic receives relevant upstream context per review (e.g., plan summary when reviewing a spec) via input contract (Decision #22) — `buildContextFromContract()` in contracts.ts
- [x] Teams are **opaque to orchestrator**: orchestrator sends team-level TaskPacket, receives team-level ResultPacket
- [x] Intra-team context passing governed by I/O contracts (not raw result forwarding)
- [x] Exemplar team: `build-team` (planner → reviewer → builder → tester) — `extensions/teams/definitions.ts`
- [x] Orchestrator can delegate to a named team — `teamHint` parameter on `orchestrate` tool
- [x] `tests/team-router.test.ts` — 10 tests (happy path, loops, exhaustion, escalation, errors)
- [x] `tests/orchestrator-team-e2e.test.ts` — 5 tests (team delegation through orchestrate tool)
- [x] All 230 tests pass (188 existing + 42 new), TypeScript compiles cleanly

#### 4c — Schema Validation [COMPLETE]
- [x] `extensions/shared/validation.ts` — `parseAgentDefinition()`, `validateAgentDefinition()`, `validateTeamDefinition()`
- [x] Agent definition validator: parse `.md` specs, validate sections/fields/values against `AGENT_DEFINITION_CONTRACT.md`
- [x] Team definition validator: member existence, state agent references, contract compatibility at transitions (reuses `validateStateMachine()` and `contractsCompatible()`)
- [x] `tests/validation-agents.test.ts` — 19 tests (parser, 4 real specialist defs, 9 synthetic bad definitions)
- [x] `tests/validation-teams.test.ts` — 8 tests (BUILD_TEAM, unknown member, unknown agent, incompatible contracts, structural errors)
- [x] All 257 tests pass (230 existing + 27 new), TypeScript compiles cleanly

#### 4d — Observability [COMPLETE]
- [x] `extensions/shared/logging.ts` — `DelegationLogger`, `DelegationLogEntry`, `NULL_LOGGER`, `createPiLogger()`, `computeTeamVersion()`
- [x] Execution logging: injectable `DelegationLogger` passed through `delegateToSpecialist()`, `executeTeam()`, and orchestrator
- [x] Pre-flight validation: check task packet context against specialist's `inputContract` before subprocess spawn
- [x] `FailureReason` taxonomy, `StateTraceEntry`, `SpecialistInvocationSummary`, `TeamSessionArtifact` types in `types.ts`
- [x] Team session artifacts: `executeTeam()` builds structured `TeamSessionArtifact` with state trace, metrics, and outcome
- [x] `tests/logging.test.ts` — 8 tests (NULL_LOGGER, createPiLogger, computeTeamVersion determinism/structural changes)
- [x] `tests/preflight.test.ts` — 5 tests (no contract, optional-only, required missing, preflight_fail logged, required present)
- [x] `tests/session-artifact.test.ts` — 10 tests (happy path, state trace, specialist summaries, loops, escalation, failure, version, contracts, validation errors, logger events)
- [x] All 280 tests pass (257 existing + 23 new), TypeScript compiles cleanly

### Stage 5 — Meta-Teams and Self-Expansion [NOT STARTED]

#### 5a — Bootstrap Specialists
Five new specialists must be manually built before the specialist-creator team can function. See Decision #20.

Each follows the existing factory pattern (`createSpecialistExtension`): agent definition markdown, TypeScript extension, prompt config, tests.

- [ ] **Spec-writer** — prose definitions, agent boundaries, working style design, "what this does NOT do"
- [ ] **Schema-designer** — TypeScript types, packet shapes, I/O contracts, invariants, failure modes, output templates, validation constraints
- [ ] **Routing-designer** — state machines, transition completeness, escalation paths, unreachable state detection
- [ ] **Critic** — scope evaluation, redundancy detection, reuse search, "should this exist?"
- [ ] **Boundary-auditor** — access control, minimal-context enforcement, permission review, control philosophy compliance
- [ ] Register all five in orchestrator's selection and delegation infrastructure
- [ ] Update `select.ts` keyword matching and `delegate.ts` config map
- [ ] Update `buildContextForSpecialist()` if any new specialist needs specific prior-result fields

#### 5b — Specialist-Creator Team
The first meta-team. Its output is a fully working new specialist: agent definition markdown, TypeScript extension, prompt config, and tests. See Decision #16.

Full 9-specialist roster available. Typical creation workflow uses a subset:

- [ ] Define specialist-creator team state machine. Typical flow: plan (planner) → write spec (spec-writer) → design schemas (schema-designer) → evaluate need/overlap (critic) → audit boundaries (boundary-auditor) → implement (builder) → review (reviewer) → test (tester)
- [ ] Governed creation workflow: candidate proposed → critic + boundary-auditor evaluate → spec-writer + schema-designer produce artifacts → builder implements → validated against schema (4c) → activated
- [ ] Prove with at least one specialist successfully created by the team

#### 5c — Team-Creator Team
Uses the same pattern as 5b but creates teams instead of specialists.

- [ ] Team-creator team: define team purpose → select members → define state machine → validate contracts → test
- [ ] Ensure team-creator can compose any existing specialists (including those created by 5b)
- [ ] Governed creation: new teams validated against I/O contracts before activation

#### 5d — Sequence Definition and Execution
- [ ] Sequence definition format: ordered stages, parallel branches, merge/synthesis points, stop conditions
- [ ] Sequence engine: compose teams and specialists using I/O contract model
- [ ] Each stage's output contract must satisfy next stage's input contract

#### 5e — Sequence-Creator Team
- [ ] Meta-team whose output is a new sequence definition
- [ ] Composes teams and specialists into multi-stage workflows
- [ ] Governed creation with validation at each stage boundary

#### 5f — Seed-Creator Team
Meta-team that creates seeds (reusable bootstrap context packs for project repos). See Decision #19.

Seeds include `SEED.md` instructions and template files. Can target fresh repos or forked repos.

- [ ] Seed-creator team: design seed scope (planner) → write SEED.md spec (spec-writer) → create templates (builder) → evaluate scope/overlap (critic) → review (reviewer) → validate (tester)
- [ ] Likely same roster as specialist-creator team
- [ ] Prove with at least one seed successfully created by the team

#### 5g — Dynamic Selection and Discovery
- [ ] Specialist/team/sequence discovery service: index available primitives at load time
- [ ] LLM-based specialist selection (replace keyword heuristics in `select.ts`)
- [ ] Runtime tool management: `getActiveTools()`/`setActiveTools()` to scope available tools per task context

#### 5h — Escalation and Retry
- [ ] Escalation re-try handler: when specialist escalates requesting broader context, orchestrator expands scope and re-invokes
- [ ] Session persistence: carry orchestration state across sessions via `appendEntry()`

### Stage 6 — Slash Commands and Interactive Workflows [NOT STARTED]

See Decision #17.

#### 6a — `/plan` Command
Interactive planning session. User describes goals, agent helps refine them, then orchestrator executes using available primitives.

- [ ] Register `/plan` via `pi.registerCommand()`
- [ ] Interactive planning flow: gather requirements → select primitives → build execution plan → confirm with user → orchestrate
- [ ] Plan output stored in repo (e.g., `plans/` directory or structured format) for resumability

#### 6b — `/next` Command
Resume an existing plan. Orchestrator reads the current plan state from the repo and executes the next set of tasks.

- [ ] Register `/next` via `pi.registerCommand()`
- [ ] Plan discovery: find active plan in repo, determine what's been completed, identify next steps
- [ ] Orchestrate next steps using available primitives
- [ ] Update plan state after execution (mark completed, note failures/escalations)

#### 6c — `/specialist` Command
Interactive session to discuss adding a new specialist. Evaluates need, checks for redundancy, then delegates to the specialist-creator team (5a) if approved.

- [ ] Register `/specialist` via `pi.registerCommand()`
- [ ] Discussion flow: what gap does this specialist fill? → check existing specialists for overlap → propose spec → user approval → delegate to creator team

## Other Queued Work

- **`/seed` skill — new-project content:** Scaffold is in place (`skills/seed/`). Needs real instructions and templates for `new-project` seed. See `skills/seed/seeds/new-project/SEED.md`.
- **`/seed` skill — interactive seeds (future):** Seeds are currently non-interactive. Future enhancement for seeds that ask questions before scaffolding.

## Future Evolution

See `docs/FUTURE_WORK.md` for deferred design ideas (team critic, campaign supervision, automated review gates, Merlin integration) with "revisit when" triggers. Source design documents are archived in `docs/archive/design/`.

## Blockers

- None

## Risks

- Sub-agent spawning pattern needs hands-on validation with Pi CLI (documented but not yet tested in practice)
- Packet model should stay lean and be driven by specialist I/O needs, not speculative design
- Specialist-creator team has a bootstrapping problem: it may need specialists that don't exist yet. Plan for a manual bootstrap of any prerequisite specialists before the creator team can self-sustain.
