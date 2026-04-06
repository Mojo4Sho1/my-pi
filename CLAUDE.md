# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

my-pi is a Pi package (pi.dev) that implements extension-powered multi-agent orchestration. It provides TypeScript extensions that enable an orchestrator to delegate work to specialized sub-agents with packet-based I/O and state-machine routing.

Agent definitions in `agents/` are the specs. TypeScript extensions in `extensions/` are the implementations.

## Architecture

**Orchestrator-first control model.** Only the orchestrator has broad context by default. All downstream actors (specialists, teams, sequences) are narrow-by-default and work from task packets.

**Execution hierarchy:** specialists → teams → sequences (build lower layers before higher ones).

**Current specialist roster:** planner, builder, reviewer, tester, spec-writer, schema-designer, routing-designer, critic, boundary-auditor — defined in `agents/specialists/`, implemented in `extensions/specialists/`.

**Packets carry execution state.** Task packets define what a specialist should do; result packets define what they did. Packet types and validation live in `extensions/shared/types.ts` and `extensions/shared/packets.ts`.

**State-machine routing** for teams: defined in team definitions, enforced by `extensions/shared/routing.ts`. Teams are opaque to the orchestrator — send a TaskPacket in, get a ResultPacket out.

**I/O contracts** formalize what each specialist requires as input and guarantees as output. Contracts live on `SpecialistPromptConfig` and are validated by `extensions/shared/contracts.ts`.

## How to Implement the Next Stage

**Before exploring the codebase, read `docs/IMPLEMENTATION_PLAN.md` for the target stage.** It contains pre-resolved design decisions, exact type definitions, function signatures, file lists, and often code snippets. Start from the plan, not from scratch exploration.

- If the implementation plan already has detailed specs (types, function signatures, file changes), **skip plan mode and execute directly**. Plan mode adds significant token overhead and provides no value when the plan already exists.
- If the plan is vague or leaves open questions, use plan mode to resolve them.
- Always check `STATUS.md` for the current state and `DECISION_LOG.md` for relevant decisions before starting.

## Key Documents

| Document | Purpose |
|---|---|
| `STATUS.md` | Current project state and queued work |
| `DECISION_LOG.md` | Durable project decisions (single source of truth) |
| `docs/IMPLEMENTATION_PLAN.md` | Staged build strategy and current roadmap |
| `docs/HANDOFF_5A1B.md` | Historical execution guide for Stage 5a.1b (hook substrate) |
| `docs/HANDOFF_5A1C.md` | Historical execution guide for Stage 5a.1c (sandboxing/path protection) |
| `docs/HANDOFF_5A2.md` | Historical execution guide for Stage 5a.2 (dashboard substrate + persistent widget) |
| `docs/validation/METHODOLOGY.md` | Stage 5a.3 validation methodology, task index, and substrate verification checklist |
| `docs/PI_EXTENSION_API.md` | Pi extension API reference (tool registration, sub-agents, lifecycle) |
| `docs/PROJECT_FOUNDATION.md` | Project vision and architectural boundaries |
| `docs/ORCHESTRATION_MODEL.md` | System vocabulary and hierarchy |
| `agents/AGENT_DEFINITION_CONTRACT.md` | Contract for agent definition structure |

## Key Conventions

- **`working_style`** (not `persona`) steers agent behavior
- Agent definitions are markdown specs in `agents/`; extensions implement them in TypeScript
- Contracts and packet validation are in TypeScript (`extensions/shared/`), not markdown docs
- Changes go in this repo (source of truth), not in Pi-managed directories
- No secrets, tokens, or machine-specific state in the repo

## Pi Package Structure

This repo is a Pi package (`package.json` with `pi` key):
- `extensions/` — TypeScript extensions (orchestrator, specialists, shared types) — **main build target**
- `skills/` — Pi skills (future)
- `prompts/` — Pi prompts (future)
- `themes/` — Pi themes

Supporting: `agents/` (definition specs), `docs/` (architectural reference), `tests/` (validation)

## Current Stage

See `STATUS.md` for live project state. The project follows a staged implementation plan (`docs/IMPLEMENTATION_PLAN.md`):

1. **Foundation and shared types** (complete) — TypeScript interfaces, packet validation, routing utilities
2. **First specialist extension (builder)** (complete) — proved sub-agent delegation pattern
3. **Remaining specialists + orchestrator** (complete) — full delegation loop with selective context forwarding
4. **Team routing and validation** (complete) — I/O contracts, team router, state-machine teams, substrate hardening
5. **Meta-teams and expansion** (5a.2 complete, 5a.3 next) — teams that build other primitives, sequences
   - 5a.1: Token tracking + threshold semantics (complete)
   - 5a.1b: Hook substrate (complete)
   - 5a.1c: Deterministic sandboxing (complete)
   - 5a.2: Dashboard substrate + persistent widget (complete)
   - **For Stage 5a.3:** Start from `STATUS.md`, the Stage 5a.3 section of `docs/IMPLEMENTATION_PLAN.md`, and `docs/HANDOFF_5A2.md` for the live observability substrate now in place.
   - 5a.3–5a.4: Real-task validation and `/dashboard` command build on the live dashboard substrate
6. **Reflective expertise layer** — governed specialist improvement through typed, versioned expertise overlays
7. **Command surface** — commands emerge from real usage; `/dashboard` is the only committed command

## Development

```bash
make typecheck  # Type-check without emitting
make test       # Run tests (vitest)
make test-watch # Run tests in watch mode
```

## Key Source Files

### Shared infrastructure (`extensions/shared/`)
- `types.ts` — Packet, agent, routing, and I/O contract type definitions
- `packets.ts` — Packet creation and validation
- `routing.ts` — State machine routing with iteration tracking and maxIterations guards
- `contracts.ts` — I/O contract validation (`validateOutputContract`, `validateInputContract`, `contractsCompatible`, `buildContextFromContract`)
- `hooks.ts` — Hook registry, observer/policy dispatch, and global hook installer seam
- `tokens.ts` — Token aggregation and threshold utilities
- `sandbox.ts` — Deterministic policy envelopes and authority model
- `specialist-prompt.ts` — System/task prompt construction with typed output templates
- `result-parser.ts` — Structured output extraction from sub-agent responses
- `subprocess.ts` — Pi sub-agent spawn and JSON event parsing

### Orchestrator (`extensions/orchestrator/`)
- `index.ts` — Extension entry point, `orchestrate` tool registration (supports `delegationHint` and `teamHint`)
- `select.ts` — Specialist selection (keyword heuristics, explicit hints)
- `delegate.ts` — Delegation lifecycle (`delegateToSpecialist`, `delegateToTeam`, `buildContextForSpecialist`)
- `synthesize.ts` — Result synthesis from multiple specialist outputs

### Teams (`extensions/teams/`)
- `router.ts` — Team state machine executor (`executeTeam`) with revision loops and escalation
- `definitions.ts` — Team registry and `build-team` exemplar

### Dashboard (`extensions/dashboard/`)
- `types.ts` — Widget-local view models and dashboard session snapshot types
- `projections.ts` — Pure widget projections from session artifacts and live runtime state
- `widget.ts` — Compact line-array widget rendering via `ctx.ui.setWidget()`
- `index.ts` — Lifecycle reconstruction, hook observer wiring, and widget updates

### Specialists (`extensions/specialists/*/`)
- `prompt.ts` — Specialist-specific prompt config with I/O contracts
- `index.ts` — Extension entry point (uses `createSpecialistExtension` factory)
