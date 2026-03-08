# AGENTS.md

## Purpose

This repository is the source of truth for my portable Pi package.

Use this repo to build reusable Pi capabilities that I can carry across machines and environments. Keep the focus on durable leverage: extensions, skills, prompts, themes, scaffolds, helper scripts, and documentation that make future work faster and safer.

## Startup reading order

Use this file as the root behavioral guide.

`AGENTS.md` is auto-read first by platform behavior.

After reading this file:

1. Read `INDEX.md`
2. Route by actor class from `INDEX.md`
3. If orchestrator-class: continue to `docs/WORKFLOW.md`, then `docs/handoff/NEXT_TASK.md`, then `docs/handoff/CURRENT_STATUS.md`
4. If downstream: stop at `INDEX.md` unless a task packet explicitly expands the read set

`INDEX.md` is the universal routing entrypoint.

## Orchestrator boundary

This repository uses an orchestrator-first model.

Only orchestrator-class actors have broad default routing and are responsible for selecting specialists, teams, sequences, and seeds as needed.

Downstream actors are narrow by default, should receive narrowed task context, and should not independently expand scope unless necessary.

## Key routing documents

Use these documents for deeper operating guidance:

- `INDEX.md` for repository navigation
- `docs/ORCHESTRATION_MODEL.md` for system vocabulary and hierarchy
- `docs/WORKFLOW.md` for orchestrator behavior
- `docs/handoff/_HANDOFF_INDEX.md` for active work-state routing

## Core principles

1. Build reusable primitives before building one-off conveniences.
2. Prefer small, composable capabilities over large monolithic tools.
3. Keep changes minimal, targeted, and easy to review.
4. Protect portability. Anything in this repo should be safe to clone onto a new machine.
5. Favor maintainability over cleverness.
6. When a repeated workflow appears, look for a way to scaffold or automate it.
7. Do not add complexity just to be “more advanced.” Add it only when it clearly improves speed, reliability, safety, or reuse.

## What belongs in this repo

Keep these here when they are reusable across projects:

- Pi extensions
- Pi skills
- Pi prompts
- Pi themes
- scaffolding tools
- helper scripts
- install/bootstrap docs
- lightweight test or validation helpers
- guidance for coding agents working in this repo

## What does not belong in this repo

Do not commit or generate these here:

- secrets, tokens, API keys, or credentials
- auth files
- machine-specific shell state
- transient caches
- local session history
- one-off hacks tied to a single outside project
- edits made directly in Pi-managed directories as the primary source of truth

## Source-of-truth rule

This repository is the canonical editable source for my Pi customizations.

If a change is worth keeping, make it here. Do not treat files inside Pi-managed directories as the long-term home of custom behavior. Pi should load this package; this repo should own the implementation.

## Repo intent

This package should stay globally useful.

Project-specific behavior belongs in the target project, usually through local project configuration or project-local Pi resources. Do not pollute this repo with assumptions that only make sense for one repository.

## Working style

When working in this repo:

1. Start by understanding the smallest useful change.
2. Prefer discussion and design clarity before broad edits.
3. Make one focused improvement at a time.
4. Avoid sweeping refactors unless they are necessary and explicitly justified.
5. Keep naming clear and literal.
6. Add brief documentation for anything another future session would not instantly understand.

## Tool-building philosophy

This repo should gradually improve its own development velocity.

When adding a new capability, first ask:

- Does this solve a recurring problem?
- Can this be turned into a reusable scaffold, helper, validator, or template?
- Will this reduce future friction for adding the next tool?

Good first-class additions include:

- extension scaffolds
- skill scaffolds
- prompt scaffolds
- validation/check helpers
- safety guards
- lightweight repo introspection utilities
- documentation generators or update helpers

Do not build meta-tools unless they provide clear recurring value.

## Pi package conventions

Assume this repo is a Pi package and keep the layout clean.

Expected top-level directories include:

- `extensions/`
- `skills/`
- `prompts/`
- `themes/`

You may add supporting directories such as `scripts/`, `docs/`, `templates/`, `tests/`, `agents/`, or `seeds/` when they clearly help maintainability.

## Standards for new extensions

Every new extension should be:

- single-purpose or clearly modular
- named clearly
- documented briefly
- safe by default
- easy to test in isolation

For each extension, capture at least:

- what it does
- why it exists
- expected inputs
- expected outputs or side effects
- important safety constraints
- a minimal usage example when helpful

Avoid hidden behavior and surprising side effects.

## Standards for new skills and prompts

Skills and prompts should be narrow, explicit, and reusable.

Prefer:

- one well-defined responsibility
- concrete instructions
- examples only when they improve reliability
- language that reduces ambiguity

Avoid long vague prose that does not change behavior.

## Safety and change boundaries

Before making changes, protect the repo from accidental damage.

- Avoid destructive commands unless they are clearly necessary.
- Do not delete or overwrite large sections of the repo without strong justification.
- Prefer additive or narrowly scoped edits.
- Review the local diff before concluding work.
- Call out any risky assumptions.
- Keep secrets out of code, docs, and examples.

## Validation and testing

Validate the smallest thing that proves the change works.

Prefer this order:

1. static inspection
2. narrow smoke test
3. targeted command or script run
4. broader validation only if needed

Do not introduce heavyweight test infrastructure unless the repo actually benefits from it.

When adding a new reusable tool, include a lightweight way to verify it.

## Documentation rules

Keep docs concise and operational.

When behavior, structure, or workflow changes in a durable way, update the relevant documentation in the same work session. If the agent makes a repeated mistake or a new convention emerges, update this `AGENTS.md` so the correction persists.

Prefer one root `INDEX.md` for top-level routing and use local `_X_INDEX.md` files within subtrees where additional routing is needed.

## Guidance for coding agents

When acting as a coding agent in this repo:

1. Read this file first and follow it closely.
2. Prefer minimal, high-confidence edits.
3. Preserve the repo’s role as a portable Pi package.
4. Do not mix reusable global behavior with project-specific assumptions.
5. When creating a new capability, consider whether a scaffold/helper version should exist first.
6. Keep explanations grounded in the actual repo state.
7. When unsure, choose the simpler design.
8. If a rule here proves incomplete, update this file as part of the fix.

## Current priority

Build the foundation before the ecosystem.

Near-term work should prioritize:

- package cleanliness
- scaffolding for new Pi components
- safety guardrails
- lightweight validation utilities
- clear bootstrap and usage documentation
- orchestrator-first operating documents
- handoff and routing infrastructure

Avoid expanding into many end-user features before the creation workflow is smooth.