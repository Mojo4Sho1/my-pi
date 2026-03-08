# AGENTS.md

## Purpose

This repository is the source of truth for my portable, modular, coding-focused Pi package.

Use this repo to build reusable coding primitives, scaffolds, documentation, and supporting tooling that can evolve over time without losing portability, clarity, or scope discipline.

## Startup rule

`AGENTS.md` is auto-read first by platform behavior.

After reading this file:

1. Read `INDEX.md`
2. Route by actor class from `INDEX.md`
3. If orchestrator-class, continue along the orchestrator route
4. If downstream, stop unless a task packet explicitly expands the read set

`INDEX.md` is the universal routing entrypoint.

## Access model

This repository uses an orchestrator-first model.

- Only orchestrator-class actors have broad default routing.
- Downstream actors are narrow by default.
- Downstream actors should read only the files explicitly required for their task.
- Only orchestrator-class actors should read or update live handoff state by default.

## Core principles

1. Build reusable primitives before one-off conveniences.
2. Prefer small, composable capabilities over monolithic systems.
3. Keep changes minimal, targeted, and reviewable.
4. Protect portability. This repo should be safe to clone onto a new machine.
5. Favor maintainability over cleverness.
6. Build only what is needed.
7. When a repeated pattern appears, look for a reusable scaffold, helper, validator, template, or primitive.
8. Do not add complexity unless it clearly improves speed, reliability, safety, or reuse.

## Primitive hierarchy rule

Preserve the primitive build order:

1. specialists
2. teams
3. sequences

Do not collapse multiple layers into one artifact, and do not build higher layers before the lower layer is sufficiently useful.

## Scope boundary

This repo should remain coding-focused.

Keep here only what is reusable across coding projects, including:

- Pi extensions
- Pi skills
- Pi prompts
- Pi themes
- coding-oriented orchestration primitives
- scaffolding tools
- helper scripts
- install/bootstrap docs
- validation helpers
- routing, handoff, seed, and template infrastructure

Do not put here:

- secrets, tokens, credentials, or auth files
- machine-specific shell state
- transient caches or local session history
- one-off hacks tied to a single outside project
- capabilities that belong to a future assistant layer rather than the coding system itself
- edits made directly in Pi-managed directories as the primary source of truth

## Source-of-truth rule

This repository is the canonical editable source for this system.

If a change is worth keeping, make it here. Do not treat files inside Pi-managed directories as the long-term home of custom behavior.

## Working style

1. Start with the smallest useful change.
2. Prefer design clarity before broad edits.
3. Make one focused improvement at a time.
4. Avoid sweeping refactors unless they are clearly justified.
5. Keep naming clear and literal.
6. Add brief documentation when it materially improves future continuity.

## Tool-building philosophy

This repo should improve its own development velocity over time.

When adding a new capability, ask:

- Does this solve a recurring problem?
- Can this become a reusable primitive, scaffold, helper, validator, template, or seed?
- Will this reduce future friction for building the next layer of tooling?

Do not build meta-tools unless they provide clear recurring value.

## Package conventions

Assume this repo is a Pi package.

Expected top-level resource directories include:

- `extensions/`
- `skills/`
- `prompts/`
- `themes/`

Supporting directories such as `docs/`, `templates/`, `agents/`, `seeds/`, `tests/`, or `scripts/` are acceptable when they clearly improve maintainability.

## Standards for reusable artifacts

### Extensions
Extensions should be:

- single-purpose or clearly modular
- safe by default
- easy to test in isolation
- briefly documented

Avoid hidden behavior and surprising side effects.

### Skills and prompts
Skills and prompts should be:

- narrow
- explicit
- reusable
- concrete

Avoid vague prose that does not change behavior.

### Agent definitions
Agent definitions should:

- follow the agent-definition contract
- remain narrow by default unless explicitly broad
- declare routing and context properties clearly
- avoid overlapping responsibility without reason

## Safety and validation

Before making changes:

- avoid destructive actions unless clearly necessary
- prefer additive or narrowly scoped edits
- review the local diff before concluding work
- call out risky assumptions
- keep secrets out of code and docs

Validate the smallest thing that proves the change works:

1. static inspection
2. narrow smoke test
3. targeted command or script run
4. broader validation only if needed

Do not introduce heavyweight infrastructure unless the repo truly benefits from it.

## Documentation rules

Keep docs concise, operational, and role-aware.

- Use one root `INDEX.md` for top-level routing.
- Use local `_X_INDEX.md` files inside subtrees when narrower routing is needed.
- Update documentation when durable behavior, structure, or workflow changes.
- Do not force downstream actors to read broad docs by default.

## Key routing documents

Use these only as needed:

- `INDEX.md` for repo routing
- `docs/PROJECT_FOUNDATION.md` for project intent and boundaries
- `docs/ORCHESTRATION_MODEL.md` for system vocabulary and hierarchy
- `docs/WORKFLOW.md` for orchestrator behavior
- `docs/handoff/_HANDOFF_INDEX.md` for live work-state routing
- `agents/_AGENTS_INDEX.md` for agent subtree routing

## Current priority

Build the foundation before the ecosystem.

Near-term priority is:

- routing and handoff stability
- template and seed infrastructure
- scaffold tooling
- the first specialist layer
- the path from specialists to teams
- the path from teams to sequences

Avoid expanding into broad end-user features before the primitive creation workflow is smooth.