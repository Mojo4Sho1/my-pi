# AGENTS.md

## Purpose

This repository is the source of truth for a portable, modular, coding-focused Pi package that implements extension-powered orchestration.

It provides TypeScript extensions that enable an orchestrator to delegate work to specialized sub-agents through packet-based I/O and state-machine routing. The current specialist roster lives in `docs/ORCHESTRATION_MODEL.md` and `STATUS.md`.

## Core principles

1. Build reusable primitives before one-off conveniences.
2. Prefer small, composable capabilities over monolithic systems.
3. Keep changes minimal, targeted, and reviewable.
4. Protect portability — this repo should be safe to clone onto a new machine.
5. Build only what is needed. Do not add complexity unless it clearly improves speed, reliability, safety, or reuse.

## Primitive hierarchy

Preserve the build order: specialists → teams → sequences.

Do not collapse multiple layers into one artifact, and do not build higher layers before the lower layer is sufficiently useful.

## Package conventions

This repo is a Pi package. Resource directories:

- `extensions/` — TypeScript extensions (orchestrator, specialists, shared types)
- `skills/` — Pi skills
- `prompts/` — Pi prompts
- `themes/` — Pi themes

Supporting directories: `agents/` (definition specs), `docs/` (architectural reference), `tests/`.

**Extension loading gotcha:** Only `extensions/orchestrator/index.ts` and `extensions/dashboard/index.ts` are Pi extensions (they export default factory functions). Everything else under `extensions/` — `shared/`, `specialists/`, `teams/`, `worklist/` — are internal libraries imported by code. The `package.json` explicitly lists the two extension files to prevent Pi from trying to auto-discover and load library modules as extensions. Do not change `pi.extensions` back to `["./extensions"]` or add new entries without ensuring the file exports a valid Pi extension factory.

## Development context

See `CLAUDE.md` for development guidance, reading order, and current project state.
See `STATUS.md` for what is in progress and what comes next.
