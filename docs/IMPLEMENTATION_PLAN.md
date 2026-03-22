# IMPLEMENTATION_PLAN.md

## Purpose

This document defines the staged implementation plan for building my-pi as an extension-powered orchestration system.

It translates the architectural vision from `docs/PROJECT_FOUNDATION.md` into an ordered build strategy focused on TypeScript Pi extensions.

Live execution state belongs in `STATUS.md`. This document defines the sequence and exit criteria, not daily progress.

---

## Planning doctrine

1. **Walk before run.** Specialists before teams, teams before sequences, shared types before extensions.
2. **Contracts before convenience.** TypeScript interfaces and validation before automation.
3. **Expand only from proven exemplars.** Prove each abstraction with one implementation before generalizing.
4. **Stable lower layers before higher layers.** Do not build teams until specialists work, do not build sequences until teams work.

---

## Stage overview

1. Foundation and shared types
2. First specialist extension (builder)
3. Remaining specialists + orchestrator
4. Team routing and validation
5. Meta-teams and expansion

---

# Stage 1 — Foundation and Shared Types

## Purpose

Establish the TypeScript foundation that all extensions share.

## Key deliverables

- `tsconfig.json` configured for Pi extension development
- `extensions/shared/types.ts` — TypeScript interfaces:
  - `TaskPacket`: task objective, allowed files, acceptance criteria, context boundaries
  - `ResultPacket`: outcome, deliverables, status, escalation info
  - `AgentDefinition`: mirrors the agent definition contract fields
  - `SpecialistConfig`: specialist-specific configuration
  - `TeamDefinition`: member specialists, state transitions, entry/exit conditions
- `extensions/shared/packets.ts` — Packet creation, validation, serialization:
  - `createTaskPacket()`, `createResultPacket()`
  - `validatePacket()` — runtime type checking
- `extensions/shared/routing.ts` — State machine routing utilities:
  - State machine definition types
  - Transition validation
  - Packet-at-transition validation
- Basic tests for packet validation and routing

## Exit criteria

- Can programmatically create typed packets and validate them
- State machine can be defined and transitions validated
- TypeScript compiles cleanly
- Tests pass

## Status

**Complete.** All Stage 1 deliverables are implemented and tested (39 tests passing).

## Dependencies

- Pi extension API reference: see `docs/PI_EXTENSION_API.md`

---

# Stage 2 — First Specialist Extension (Builder)

## Purpose

Prove the specialist extension pattern with one concrete implementation.

## Why builder first

The builder is the most concrete specialist — it takes files and makes changes. If delegation works for the builder, it will work for the others.

## Key deliverables

- `extensions/specialists/builder/index.ts` — A Pi extension that:
  - Registers a `delegate-to-builder` tool
  - Accepts a TaskPacket (objective, allowed files, acceptance criteria)
  - Launches an isolated Pi sub-agent process
  - Injects the builder's working style and constraints from `agents/specialists/builder.md`
  - Returns a structured ResultPacket
- Tests for builder delegation round-trip

## Exit criteria

- Can invoke `delegate-to-builder` with a task packet
- Builder sub-agent respects its scope constraints (narrow context, bounded read set)
- Receives a structured result packet back
- Error/escalation cases are handled

## Dependencies

- Stage 1 complete (shared types available) ✓
- Pi sub-agent spawning pattern: see `docs/PI_EXTENSION_API.md` (sub-agent spawning section)

---

# Stage 3 — Remaining Specialists + Orchestrator

## Purpose

Complete the specialist layer and build the orchestrator that selects and delegates.

## Key deliverables

- `extensions/specialists/planner/index.ts` — Registers `delegate-to-planner`. Accepts a task, returns a structured plan.
- `extensions/specialists/reviewer/index.ts` — Registers `delegate-to-reviewer`. Accepts artifacts, returns structured review findings.
- `extensions/specialists/tester/index.ts` — Registers `delegate-to-tester`. Accepts verification task, returns structured test results.
- `extensions/orchestrator/index.ts` — The orchestrator extension:
  - Reads current project state
  - Selects appropriate specialist(s) for a task
  - Packages task packets with narrowed context
  - Collects and synthesizes results
  - Implements delegation modes: direct specialist, multi-specialist, and (later) team

## Exit criteria

- User can invoke the orchestrator, describe a task, and the orchestrator:
  - Selects the right specialist(s)
  - Delegates via sub-agents with proper task packets
  - Synthesizes results
- The full plan → review → build → test loop works for a simple task
- Each specialist respects its definition boundaries

## Dependencies

- Stage 2 complete (builder pattern proven and reusable)

---

# Stage 4 — Team Routing and Validation

## Purpose

Introduce teams as composed specialist sequences with state-machine routing. Add validation for all primitives.

## Key deliverables

### Team system
- Team definition format (YAML or TypeScript): member specialists, state transitions, entry/exit conditions
- Team router in orchestrator: reads a team definition, executes the state machine, routes packets between specialists, validates packets at each transition
- One exemplar team (e.g., `build-team`: planner → reviewer → builder → tester)

### Validation system
- Schema validation for agent definitions: do the markdown specs in `agents/` match the expected structure from `AGENT_DEFINITION_CONTRACT.md`?
- Packet validation: do packets conform to TypeScript interfaces at runtime?
- Transition validation: does the state machine reject invalid transitions?
- A `validate` command or test suite that checks all of the above

## Exit criteria

- Orchestrator can delegate to a named team
- Team executes its state machine correctly
- Invalid packets and invalid transitions fail with clear errors
- Agent definition validator catches malformed specs
- Validation can run as part of CI/test suite

## Dependencies

- Stage 3 complete (all specialists and orchestrator working)

---

# Stage 5 — Meta-Teams and Expansion

## Purpose

Build infrastructure for teams that create other primitives, and introduce sequences for multi-stage workflows.

## Key deliverables

- Sequence definition format and execution engine
- Meta-team capability: a team whose output is a new specialist, team, or sequence definition
- Discovery/activation system: orchestrator can query available specialists, teams, and sequences
- Controlled team-layer expansion: add teams only when they test new useful patterns

## Exit criteria

- System can build new primitives through its own orchestration
- Sequences can compose teams and specialists across multiple stages
- The orchestrator discovers available primitives dynamically

## Dependencies

- Stage 4 complete (team routing and validation working)

## Notes

This stage is intentionally sketched lightly. Its details should be informed by real experience from Stages 1-4. Do not over-design before the lower layers are proven.

---

## Explicitly deferred work

- Seed system design (deferred until specialist/team layer proves useful patterns)
- Host-platform realization decisions (only when justified by actual needs)
- Sequence runtime implementation (until team layer is stable)
- Coordinator-agent design for complex teams
- Public package decomposition

---

## Cross-stage dependency chain

Stage 1 (types) → Stage 2 (builder) → Stage 3 (all specialists + orchestrator) → Stage 4 (teams + validation) → Stage 5 (meta-teams + sequences)

Each stage depends on the one before it. Do not skip stages.
