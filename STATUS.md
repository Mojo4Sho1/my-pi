# STATUS.md

Last updated: 2026-03-26

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

### Stage 3c — Orchestrator Extension [NOT STARTED]

- [ ] `extensions/orchestrator/index.ts` — Orchestrator extension:
  - [ ] Reads current project state
  - [ ] Selects appropriate specialist(s) for a task
  - [ ] Packages task packets with narrowed context
  - [ ] Collects and synthesizes results
- [ ] Delegation modes: direct specialist, multi-specialist
- [ ] Tests for orchestrator delegation and synthesis

### Stage 3d — Integration and End-to-End Validation [NOT STARTED]

- [ ] Full plan → review → build → test loop works for a simple task
- [ ] Each specialist respects its definition boundaries
- [ ] Error/escalation propagation through orchestrator works
- [ ] Integration tests covering the full delegation chain

### Stage 4 — Team Routing and Validation [NOT STARTED]

- [ ] Team definition format
- [ ] Team router in orchestrator (state machine execution)
- [ ] Exemplar team (`build-team`: planner → reviewer → builder → tester)
- [ ] Schema validation for agent definitions
- [ ] `validate` command or test suite
- [ ] Orchestrator can delegate to a named team

### Stage 5 — Meta-Teams and Expansion [NOT STARTED]

- [ ] Sequence definition format and execution engine
- [ ] Meta-team capability
- [ ] Discovery/activation system
- [ ] Controlled team-layer expansion

## Other Queued Work

- **`/seed` skill — new-project content:** Scaffold is in place (`skills/seed/`). Needs real instructions and templates for `new-project` seed. See `skills/seed/seeds/new-project/SEED.md`.
- **`/seed` skill — interactive seeds (future):** Seeds are currently non-interactive. Future enhancement for seeds that ask questions before scaffolding.

## Blockers

- None

## Risks

- Sub-agent spawning pattern needs hands-on validation with Pi CLI (documented but not yet tested in practice)
- Packet model should stay lean and be driven by specialist I/O needs, not speculative design
