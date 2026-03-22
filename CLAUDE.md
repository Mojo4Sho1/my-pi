# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

my-pi is a Pi package (pi.dev) that implements extension-powered multi-agent orchestration. It provides TypeScript extensions that enable an orchestrator to delegate work to specialized sub-agents (planner, reviewer, builder, tester) with packet-based I/O and state-machine routing.

Agent definitions in `agents/` are the specs. TypeScript extensions in `extensions/` are the implementations.

## Architecture

**Orchestrator-first control model.** Only the orchestrator has broad context by default. All downstream actors (specialists, teams, sequences) are narrow-by-default and work from task packets.

**Execution hierarchy:** specialists → teams → sequences (build lower layers before higher ones).

**Four specialists:** planner, reviewer, builder, tester — defined in `agents/specialists/`, implemented in `extensions/specialists/`.

**Packets carry execution state.** Task packets define what a specialist should do; result packets define what they did. Packet types and validation live in `extensions/shared/types.ts` and `extensions/shared/packets.ts`.

**State-machine routing** for teams: defined in team definitions, enforced by `extensions/shared/routing.ts`.

## Key Documents

| Document | Purpose |
|---|---|
| `STATUS.md` | Current project state and queued work |
| `DECISION_LOG.md` | Durable project decisions (single source of truth) |
| `docs/IMPLEMENTATION_PLAN.md` | Staged build strategy (5 stages) |
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

See `STATUS.md` for live project state. The project follows a 5-stage implementation plan (`docs/IMPLEMENTATION_PLAN.md`):

1. **Foundation and shared types** (complete) — TypeScript interfaces, packet validation, routing utilities
2. **First specialist extension (builder)** — prove the sub-agent delegation pattern
3. **Remaining specialists + orchestrator** — complete the core delegation loop
4. **Team routing and validation** — state-machine teams, primitive validation
5. **Meta-teams and expansion** — teams that build other primitives, sequences

## Development

```bash
npx tsc --noEmit  # Type-check without emitting
npm test          # Run tests (vitest)
npm run test:watch # Run tests in watch mode
```

Key source files:
- `extensions/shared/types.ts` — Packet, agent, and routing type definitions
- `extensions/shared/packets.ts` — Packet creation and validation
- `extensions/shared/routing.ts` — State machine routing utilities
