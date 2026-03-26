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
   - 3a: Extract shared specialist infrastructure
   - 3b: Remaining specialists (planner, reviewer, tester)
   - 3c: Orchestrator extension
   - 3d: Integration and end-to-end validation
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

**Complete.** All Stage 1 deliverables implemented and tested (39 tests).

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

## Status

**Complete.** Builder extension implemented with 4-module pattern (prompt, result-parser, subprocess, index). 26 tests.

## Dependencies

- Stage 1 complete (shared types available) ✓
- Pi sub-agent spawning pattern: see `docs/PI_EXTENSION_API.md` (sub-agent spawning section)

---

# Stage 3 — Remaining Specialists + Orchestrator

## Purpose

Complete the specialist layer and build the orchestrator that selects and delegates.

Stage 3 is broken into sub-stages to keep each task manageable for a single agent session.

---

## Stage 3a — Extract Shared Specialist Infrastructure

### Purpose

The builder's 4-module pattern (prompt, result-parser, subprocess, index) is reusable. Before building three more specialists, extract the generic parts into `extensions/shared/` so each new specialist is thin glue over shared infrastructure.

### Key deliverables

- `extensions/shared/subprocess.ts` — Extracted from builder. Specialist-agnostic sub-agent spawn, JSON event parsing, timeout/abort handling.
- `extensions/shared/result-parser.ts` — Extracted from builder. Generic structured JSON extraction from sub-agent output.
- `extensions/shared/specialist-prompt.ts` — Generic `buildSpecialistSystemPrompt(config)` and `buildSpecialistTaskPrompt(task)` that accept working style config as input rather than hardcoding builder values.
- Refactor builder to use shared modules (no behavior change, verify with existing tests).
- Tests for shared modules.

### Exit criteria

- Builder still passes all 26 tests after refactor
- Shared modules are independently tested
- Adding a new specialist requires only: a prompt config object + a thin index.ts

### Implementation Notes (pre-resolved design decisions)

**Result structure: Uniform.** All specialists return the same `ResultPacket` fields (`status`, `summary`, `deliverables`, `modifiedFiles`, `escalation`). Specialist-specific data goes in `deliverables` as strings. This matches the existing `ResultPacket` interface in `extensions/shared/types.ts` — no type changes needed.

**Prompt config shape.** `buildSpecialistSystemPrompt(config)` accepts:
```typescript
interface SpecialistPromptConfig {
  id: string;           // e.g. "specialist_builder"
  name: string;         // e.g. "Builder"
  role: string;         // e.g. "Execute bounded implementation tasks within explicit scope"
  workingStyle: WorkingStyle;  // from extensions/shared/types.ts
  constraints: string[];       // specialist-specific constraints
  outputFields?: string[];     // any specialist-specific JSON fields to add to output format
}
```
The shared prompt builder renders these into the system prompt template. The builder passes its values explicitly; future specialists pass theirs.

**Function naming.** Extracted functions:
- `spawnBuilderAgent()` → `spawnSubAgent()` (in `extensions/shared/subprocess.ts`)
- `parseBuilderOutput()` → `parseSpecialistOutput()` (in `extensions/shared/result-parser.ts`)
- `ParsedBuilderResult` → `ParsedSpecialistResult` (same file)

**Test organization: Dedicated files.** New test files matching the existing pattern:
- `tests/subprocess.test.ts` — tests the shared subprocess spawner
- `tests/result-parser.test.ts` — tests the shared result parser
- `tests/specialist-prompt.test.ts` — tests the shared prompt builder

Existing `tests/builder.test.ts` keeps builder-specific prompt tests and integration tests, but imports from shared modules after refactor.

**Extraction approach.** Move code first, update imports, verify builder tests still pass, then add shared tests. The builder's `prompt.ts` stays in `extensions/specialists/builder/` as a thin wrapper that calls the shared `buildSpecialistSystemPrompt()` with builder-specific config.

### Dependencies

- Stage 2 complete ✓

---

## Stage 3b — Remaining Specialists (Planner, Reviewer, Tester)

### Purpose

Implement the three remaining specialists following the proven pattern.

### Key deliverables

- `extensions/specialists/planner/index.ts` — Registers `delegate-to-planner`. Accepts a task, returns a structured plan. Planner-specific prompt config encoding working style from `agents/specialists/planner.md`.
- `extensions/specialists/reviewer/index.ts` — Registers `delegate-to-reviewer`. Accepts artifacts, returns structured review findings. Reviewer-specific prompt config from `agents/specialists/reviewer.md`.
- `extensions/specialists/tester/index.ts` — Registers `delegate-to-tester`. Accepts verification task, returns structured test results. Tester-specific prompt config from `agents/specialists/tester.md`.
- Tests for each specialist (prompt config, integration with shared infra).

### Exit criteria

- All four `delegate-to-*` tools register successfully
- Each specialist's system prompt encodes its definition's working style and constraints
- Tests pass for all specialists

### Dependencies

- Stage 3a complete (shared infrastructure available)

---

## Stage 3c — Orchestrator Extension

### Purpose

Build the orchestrator that selects and delegates to specialists.

### Key deliverables

- `extensions/orchestrator/index.ts` — The orchestrator extension:
  - Reads current project state
  - Selects appropriate specialist(s) for a task
  - Packages task packets with narrowed context
  - Collects and synthesizes results
  - Implements delegation modes: direct specialist and multi-specialist
- Tests for orchestrator delegation logic and result synthesis

### Exit criteria

- Orchestrator can delegate to any specialist via tool invocation
- Orchestrator packages task packets with narrowed context (not full repo)
- Orchestrator synthesizes results from specialist(s) into a coherent response
- Tests cover: specialist selection, packet construction, result synthesis, error propagation

### Implementation Notes (pre-resolved design decisions)

**Orchestrator is structurally different from specialists.** Specialists register a single tool (`delegate-to-X`) that the LLM calls. The orchestrator is the *caller* of those tools — it selects which specialist(s) to invoke and manages the delegation lifecycle. The orchestrator extension registers its own tool(s) and uses the shared infrastructure directly.

**Tool registration: `orchestrate` tool.** The orchestrator registers a single tool named `orchestrate` (or `orchestrate-task`). The LLM calls this tool with a high-level task description. Inside, the orchestrator selects specialist(s), constructs task packets, spawns sub-agents, and synthesizes results. Parameters should include:
- `task`: string — what needs to be done
- `relevantFiles`: string[] — files related to the task
- `delegationHint`: optional string — "planner" | "reviewer" | "builder" | "tester" | "auto" — lets the caller suggest which specialist(s) to use, with "auto" as default

**Specialist selection strategy: keep it simple for Stage 3c.** The orchestrator does NOT need an LLM-based selection step. Use a straightforward approach:
- If `delegationHint` names a specific specialist, use that specialist
- If `delegationHint` is "auto" or omitted, use keyword/heuristic matching on the task description (e.g., "plan" → planner, "review" → reviewer, "implement"/"build"/"fix" → builder, "test"/"validate"/"verify" → tester)
- Multi-specialist: if the task clearly spans multiple specialists, delegate sequentially and feed results forward
- The selection logic should be a separate pure function (`selectSpecialists`) for testability

**How the orchestrator invokes specialists: use shared infrastructure directly.** The orchestrator imports specialist prompt configs and shared modules:
```typescript
import { PLANNER_PROMPT_CONFIG } from "../specialists/planner/prompt.js";
import { BUILDER_PROMPT_CONFIG } from "../specialists/builder/prompt.js";
// ... etc.
import { buildSpecialistSystemPrompt, buildSpecialistTaskPrompt } from "../shared/specialist-prompt.js";
import { spawnSpecialistAgent } from "../shared/subprocess.js";
import { parseSpecialistOutput } from "../shared/result-parser.js";
import { createTaskPacket, createResultPacket, validateTaskPacket } from "../shared/packets.js";
```
It constructs task packets, builds prompts from the specialist's config, spawns sub-agents via `spawnSpecialistAgent()`, and parses results via `parseSpecialistOutput()`. This reuses the exact same delegation lifecycle as `specialist-extension.ts` but driven by the orchestrator instead of a registered tool handler.

**Context narrowing.** The orchestrator narrows context by:
- Setting `allowedReadSet` and `allowedWriteSet` on the task packet based on `relevantFiles`
- Not passing the full repo — only files relevant to the task
- The specialist's system prompt already enforces scope constraints

**Multi-specialist delegation: sequential with result forwarding.** When multiple specialists are needed:
1. Run them sequentially (planner first, then reviewer, then builder, then tester — following the natural workflow order)
2. Each subsequent specialist receives prior results in the task packet's `context` field
3. If any specialist returns `failure` or `escalation`, stop the chain and return the error

**Result synthesis.** The orchestrator's return value should be an `AgentToolResult` containing:
- A human-readable text summary synthesizing all specialist results
- A `details` object containing: all individual `ResultPacket`s, the list of specialists invoked, and overall status
- Overall status: `success` only if all specialists succeeded; `partial` if some succeeded; `failure` if the critical specialist failed; `escalation` if any specialist escalated

**File structure.** The orchestrator is more complex than a specialist and warrants multiple modules:
- `extensions/orchestrator/index.ts` — extension entry point, tool registration
- `extensions/orchestrator/select.ts` — `selectSpecialists(task, hint)` pure function
- `extensions/orchestrator/delegate.ts` — `delegateToSpecialist(config, taskPacket, signal)` — wraps the spawn/parse cycle
- `extensions/orchestrator/synthesize.ts` — `synthesizeResults(results[])` — combines multiple ResultPackets into a summary

**Test organization.**
- `tests/orchestrator-select.test.ts` — specialist selection logic (keyword matching, hint handling, edge cases)
- `tests/orchestrator-delegate.test.ts` — delegation lifecycle (packet construction, spawn mocking, error handling)
- `tests/orchestrator-synthesize.test.ts` — result synthesis (single result, multi-result, mixed statuses, escalation)

**What the orchestrator does NOT do in Stage 3c:**
- No team routing (Stage 4)
- No sequence execution (Stage 4+)
- No LLM-based specialist selection (keep it heuristic)
- No `STATUS.md` or `DECISION_LOG.md` updates (those are orchestrator-agent behaviors, not extension behaviors)
- No reading of project state files — the *extension* receives task info from the LLM; the *LLM* reads project state

### Dependencies

- Stage 3b complete (all specialists available) ✓

---

## Stage 3d — Integration and End-to-End Validation

### Purpose

Validate the full delegation chain works end-to-end.

### Key deliverables

- Integration tests covering: plan → review → build → test loop for a simple task
- Verification that each specialist respects its definition boundaries
- Error/escalation propagation through orchestrator
- Documentation updates (`STATUS.md`, this file)

### Exit criteria

- The full plan → review → build → test loop works for a simple task
- Each specialist respects its definition boundaries
- Error cases propagate correctly through the orchestrator

### Dependencies

- Stage 3c complete (orchestrator available)

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

Stage 1 (types) → Stage 2 (builder) → Stage 3a (shared infra) → Stage 3b (specialists) → Stage 3c (orchestrator) → Stage 3d (integration) → Stage 4 (teams + validation) → Stage 5 (meta-teams + sequences)

Each stage depends on the one before it. Do not skip stages.
