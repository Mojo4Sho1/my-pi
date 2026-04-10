# STATUS.md

Last updated: 2026-04-10 (T-22 durable onboarding docs complete; T-23 conventions/routing updates next)

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
- [x] `extensions/specialists/tester/index.ts` — `delegate-to-tester` tool now frames the tester as a focused test author, not a generic runner
- [x] `extensions/specialists/tester/prompt.ts` — Tester-specific prompt config reconciled to the Stage 5a.7 test-author model
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

**Note:** 4a + 4b implemented together (Decision #24). 4c + 4d followed as a separate pass. 4e (substrate hardening) added from design doc review (Decisions #26–29) — not yet started.

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
- [x] Initial `build-team` exemplar landed in `extensions/teams/definitions.ts`; Stage 5a.7 has now reconciled it to the canonical target flow `planner -> builder -> tester -> builder -> reviewer -> done`
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

### Stage 4e — Substrate Hardening [COMPLETE]

Strengthen the existing specialist and orchestration substrate before expanding the specialist roster. See Decisions #26–29.

#### 4e.1 — Tighten Existing Primitives [COMPLETE]
- [x] **Structured review findings contract** — `ReviewVerdict`, `ReviewFinding`, `StructuredReviewOutput` types; update reviewer prompt, result parser, orchestrator synthesis
- [x] **Per-specialist model routing policy** — 4-level resolution chain (runtime → project config → specialist default → host default); new `extensions/shared/config.ts`
- [x] `tests/review-findings.test.ts` — 17 tests (parseReviewOutput, ParseResult return type, synthesis with review findings)
- [x] `tests/model-routing.test.ts` — 6 tests (4-level precedence chain, host default fallback)
- [x] All 305 tests pass (280 existing + 25 new), TypeScript compiles cleanly

#### 4e.2 — Execution-State Artifact [COMPLETE]
- [x] **Coding-scoped worklist extension** — `extensions/worklist/` with typed items, state vocabulary, CRUD operations
- [x] **Worklist/orchestrator interop rules** — boundary enforcement: worklist informs status, not routing
- [x] `tests/worklist.test.ts` — 39 tests (creation, items, transitions, blockers, summary, serialization)
- [x] `tests/worklist-interop.test.ts` — 6 tests (orchestrator creates/updates worklist, logs session artifact, surfaces blockers)
- [x] All 350 tests pass (305 existing + 45 new), TypeScript compiles cleanly

### Stage 5 — Meta-Teams and Self-Expansion [NOT STARTED]

#### 5a — Bootstrap Specialists + Substrate Enhancements [COMPLETE]
Five new specialists manually built. Cross-cutting substrate enhancements (Decisions #31-32) implemented alongside.

Each specialist follows the existing factory pattern (`createSpecialistExtension`): agent definition markdown, TypeScript extension, prompt config, tests.

**Specialists:**
- [x] **Spec-writer** — prose definitions, agent boundaries, working style design, "what this does NOT do"
- [x] **Schema-designer** — TypeScript types, packet shapes, I/O contracts, invariants, failure modes, output templates, validation constraints
- [x] **Routing-designer** — state machines, transition completeness, escalation paths, unreachable state detection
- [x] **Critic** — scope evaluation, redundancy detection, reuse search, "should this exist?", **primitive type classification** (Decision #32)
- [x] **Boundary-auditor** — access control, minimal-context enforcement, permission review, control philosophy compliance
- [x] Register all five in orchestrator's selection and delegation infrastructure
- [x] Update `select.ts` keyword matching and `delegate.ts` config map
- [x] Update `buildContextForSpecialist()` for new specialists' prior-result field needs

**Substrate enhancements:**
- [x] **Semantic adequacy gates** (Decision #31) — per-specialist structural predicates, `quality_failure` status, `validateAdequacy()` module
- [x] **Structured tester output** — evidence pattern (subject, method, expected, actual, passed) matching reviewer's finding structure
- [x] **PrimitiveRegistryEntry type** — schema for registry entries, populated manually for all 9 specialists
- [x] **Live subprocess hardening** — adversarial integration tests for timeout, malformed output, abort, cleanup
- [x] All 465 tests pass (350 existing + 115 new), TypeScript compiles cleanly

#### 5a.1 — Token Tracking Substrate [COMPLETE]
Add token usage tracking and threshold semantics to specialist invocations and team session artifacts. See Decisions #36, #37.

- [x] `TokenUsage` type (inputTokens, outputTokens, totalTokens)
- [x] `TokenThresholds` type (warn, split, deny levels)
- [x] `ThresholdResult` type and `checkThresholds()` utility
- [x] Add `tokenUsage?` to `SpecialistInvocationSummary`
- [x] Add `totalTokenUsage?` to `TeamSessionArtifact.metrics`
- [x] Capture token counts from sub-agent subprocess JSON events
- [x] Token rollup/aggregation utilities (`extensions/shared/tokens.ts`)
- [x] Threshold integration point added to delegation path (`TODO(5a.1)` marker for session-level warn/split/deny enforcement)
- [x] Tests for token tracking, rollup correctness, and threshold checking
- [x] All 480 tests pass, TypeScript compiles cleanly

#### 5a.1b — Hook Substrate [COMPLETE]
Clean lifecycle mechanism for interception and observation at runtime execution points. See Decision #38.

- [x] `HookEvent`, `HookFailure`, `PolicyResult` types
- [x] `HookRegistry` — local in-process registration and dispatch
- [x] Policy hooks (authoritative gates: allow/deny with structured reasons)
- [x] Observer hooks (non-authoritative listeners: logging, metrics, projections)
- [x] Event surface: `onSessionStart`, `beforeDelegation`, `afterDelegation`, `beforeSubprocessSpawn`, `afterSubprocessExit`, `onAdequacyFailure`, `onPolicyViolation`, `onArtifactWritten`, `onCommandInvoked`, `onSessionEnd`, `onTeamStart`, `beforeStateTransition`, `afterStateTransition`
- [x] Typed event payloads per event (session metadata, packet metadata, token totals, policy envelope)
- [x] Hook error isolation (failing hooks produce `HookFailure` artifacts, do not crash execution)
- [x] Integration: emit events from delegate.ts, router.ts, and orchestrator entrypoints (`subprocess.ts` remains a pure utility)
- [x] Tests for registration, dispatch, policy decisions, error isolation
- [x] All 500 tests pass, TypeScript compiles cleanly

#### 5a.1c — Deterministic Sandboxing and Path Protection [COMPLETE]
Runtime enforcement of the architectural authority model. See Decision #38.

- [x] `PolicyEnvelope` type (allowedWritePaths, allowedReadRoots, allowShell, allowNetwork, allowProcessSpawn, allowedCommands, forbiddenGlobs)
- [x] `PolicyViolation` type (timestamp, attempted action, target, expected policy, violation type, enforcement result)
- [x] `SpawnRecord` type (timestamp, specialist, policy envelope, outcome)
- [x] Hardened launcher validation in `delegate.ts` before spawn using `sandbox.ts` policy envelopes
- [x] Path validation: check write targets against allowedWritePaths and forbiddenGlobs
- [x] Default authority model: 7 read-only specialists, 2 narrow-write by explicit grant (builder, tester)
- [x] `buildDefaultEnvelope()` per specialist authority class
- [x] Integration with hook substrate: violations fire `onPolicyViolation` events
- [x] Tests for envelope validation, path checks, violation generation, default authority model
- [x] All 522 tests pass, TypeScript compiles cleanly

#### 5a.2 — Dashboard Substrate + Persistent Widget [COMPLETE]
Build projection layer and ship persistent widget for session observability. See Decision #36.

- [x] Dashboard types: `WidgetState`, `ActivePrimitivePath`, `WorklistProgressView`, `DashboardSessionSnapshot`
- [x] Projection layer: derive widget state from `TeamSessionArtifact`, `WorklistSummary`, delegation logs, token data
- [x] Persistent widget via `ctx.ui.setWidget()` (status, active path, worklist progress, blocker indicator, elapsed time, token count)
- [x] `extensions/dashboard/` extension entry point and lifecycle hooks
- [x] Shared hook-installer seam in `extensions/shared/hooks.ts` so standalone extensions can attach observers to every new `HookRegistry`
- [x] Standardized `onArtifactWritten` payloads for `team_session` and `worklist_session` (live `artifact` included)
- [x] Tests for projections, widget state, hook installers, and live artifact payloads
- [x] All 545 tests pass, TypeScript compiles cleanly

#### 5a.3 — Build-Team Validation on Real Tasks [PARTIALLY COMPLETE, DEFERRED WHILE T-22-T-26 RUN]
Operational validation pass: run build-team on actual implementation tasks. See Decision #36.
Methodology and task catalog: `docs/validation/METHODOLOGY.md`

- [x] Define validation methodology (two-layer: task verification + substrate verification)
- [x] Define 8 validation tasks across 3 tiers (see `docs/validation/`)
- [x] **Tier 1:** Task 01 (JSDoc) — verified 2026-04-07; `extensions/shared/types.ts` already satisfies the task and full validation passed (`docs/validation/results/RESULT_01_JSDOC.md`)
- [x] **Tier 1:** Task 02 (test README), Task 03 (format helpers)
- [x] **Tier 2:** Task 04 (contract validation), Task 05 (constants extraction), Task 06 (widget snapshots)
- [x] **Tier 3:** Task 07 (new specialist), Task 08 (/dashboard command skeleton) — implementation landed and local verification passed on 2026-04-07 (`docs/validation/results/RESULT_08_DASHBOARD_CMD.md`)
- [x] Surface real routing/design gaps from live validation attempts, including missing `partial` transitions and build-team semantic drift
- [x] Stage 5a.7 reconciled contracts, artifacts, and the canonical build-team flow, so live build-team validation can resume
- [x] Follow-on side quest T-22 established the durable layered onboarding model before resuming the live validation track

#### 5a.4 — `/dashboard` Command (Detailed Inspector) [DEFERRED, POST-5a.3b]
Near-full-screen read-only session inspector. See Decision #36.

- [ ] Register `/dashboard` via `pi.registerCommand()`
- [ ] Overview panel (session status, active path, progress, token total)
- [ ] Token tree panel (hierarchical rollups with percentages)
- [ ] Execution path panel (structured textual path through team run)
- [ ] Worklist panel (full item summary, counts by state)
- [ ] Failures/escalations panel (compact summary, source, category, root cause)
- [ ] Tests for panel projections and command registration

#### 5a.7 — Contract-Driven Specialists, Team Artifacts, and Packet Routing [COMPLETE]
Completed redesign pass. Historical design rationale lives in `docs/archive/design/CONTRACT-DRIVEN_SPECIALISTS_TEAM_ARTIFACTS_AND_PACKET_ROUTING_DESIGN.md`.

- [x] Documentation and roadmap realignment (T-15)
- [x] Preserve structured specialist outputs end-to-end and validate named output fields directly (T-16)
- [x] Add router-owned team session artifacts and downstream packet construction from validated artifacts only (T-17)
- [x] Enforce ownership/edit scope and explicit `partial` routing semantics (T-18)
- [x] Reconcile tester/build-team behavior across prompts, team definitions, and durable docs (T-19)
- [x] Add YAML specialist/team templates plus a `build-team` starter spec (T-20)
- [x] Add validation coverage and run a contradiction audit for the redesigned flow (T-21)

#### 5b — Specialist-Creator Team
The first meta-team. Its output is a fully working new specialist: agent definition markdown, TypeScript extension, prompt config, and tests. See Decisions #16, #33, #34.

Full 9-specialist roster available. Typical creation workflow uses a subset.

- [ ] Define specialist-creator team state machine with **proposal governance** (Decision #33): plan → spec → schema → [routing] → critique → audit → implement → **propose** → validate → activate
- [ ] Implement **ProposalArtifact** type: candidate definition + PrimitiveRegistryEntry + rationale
- [ ] Implement **typed deliverables** (Decision #34): `Deliverable` type with kind field, migrate ResultPacket
- [ ] Governed creation: critic classifies primitive type, boundary-auditor validates, proposal validated before activation
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

### Stage 6 — Reflective Expertise Layer [NOT STARTED]

Enable specialists to improve over time through governed, typed, versioned expertise overlays. See Decision #35.

#### 6a — Expertise Types and Registry
- [ ] Define `ExpertiseProfile`, `ExpertiseEntry`, `ExpertisePatch` types
- [ ] Implement versioned registry storage with diff inspection and rollback
- [ ] Conflict detection (contradictory entries, redundancy, boundary weakening)
- [ ] Human-readable markdown projections alongside typed authoritative layer

#### 6b — Context Loader and Runtime Injection
- [ ] Expertise selection by task type, tags, packet metadata, scope, and token budget
- [ ] Priority ordering: critical boundary rules > local > global > anti-patterns > quality > heuristics
- [ ] Integration with existing `specialist-prompt.ts` composition pipeline
- [ ] `ExpertiseInjectionReport` artifact for observability

#### 6c — Governance Pipeline
- [ ] Lesson and patch lifecycle states: proposed → under_review → approved → applied → deprecated/rejected
- [ ] Review approval gates before activation
- [ ] Evidence validation and scope validation
- [ ] Version stamping in invocation metadata

#### 6d — Local Expertise Pilot
- [ ] Apply 6a-6c to one pilot specialist (likely reviewer)
- [ ] Local scope only, manual lesson creation and approval
- [ ] Measurement: reduced repeated mistakes, improved output consistency, fewer correction loops

### Stage 7 — Command Surface [NOT STARTED]

Command surface emerges from real usage. `/dashboard` (5a.4) is the only committed command. Future commands must satisfy the 5 governance criteria from Decision #17 (amended 2026-04-02). This stage will be populated with specific sub-stages as usage patterns emerge from real operation of the system.

## Other Queued Work

- **`/seed` skill — new-project content:** Scaffold is in place (`skills/seed/`). Needs real instructions and templates for `new-project` seed. See `skills/seed/seeds/new-project/SEED.md`.
- **`/seed` skill — interactive seeds (future):** Seeds are currently non-interactive. Future enhancement for seeds that ask questions before scaffolding.

## Future Evolution

See `docs/FUTURE_WORK.md` for deferred design ideas (team critic, campaign supervision, automated review gates, Merlin integration, hashline editing, isolated execution environments, archive normalization, lesson derivation pipeline, consolidation workflows, historian specialist) with "revisit when" triggers. Source design documents are archived in `docs/archive/design/`.

## Blockers

- No hard repo blocker currently prevents resuming Stage 5a.3b live validation once it returns to the front of the queue.
- T-10 is intentionally deferred while T-22 through T-26 establish the layered onboarding architecture.
- T-11 through T-14 remain follow-on work; keep them behind T-10 unless live validation exposes a reason to reprioritize.

## Risks

- Packet model should stay lean and be driven by specialist I/O needs, not speculative design
- Specialist-creator team has a bootstrapping problem: it may need specialists that don't exist yet. Plan for a manual bootstrap of any prerequisite specialists before the creator team can self-sustain.
