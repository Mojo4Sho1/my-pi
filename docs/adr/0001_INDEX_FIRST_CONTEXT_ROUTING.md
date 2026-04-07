# 0001_INDEX_FIRST_CONTEXT_ROUTING.md

## Context

`my-pi` has a large implementation plan and several dense documentation areas. Agents could easily over-read broad documentation, especially `docs/IMPLEMENTATION_PLAN.md`, even when only a narrow task-specific slice was needed.

That behavior conflicts with the repo's broader architecture:

- the orchestrator should package narrowed context
- downstream actors should stay narrow by default
- repo continuity should live in explicit artifacts instead of oversized conversational context

The repo already had some routing files, but not a consistent, repo-wide index-first convention for the active docs tree.

## Decision

Adopt index-first context routing for repository documentation.

This means:

- routine navigation starts from `AGENTS.md` then `INDEX.md` then the nearest relevant local index
- dense documentation areas should provide explicit local index files
- routine work should use `docs/_IMPLEMENTATION_PLAN_INDEX.md` before opening the large implementation plan
- the full `docs/IMPLEMENTATION_PLAN.md` should be read end-to-end only when architecture-wide context is actually needed
- local index files use explicit underscore-prefixed names, with the root `INDEX.md` preserved as the single bootstrap exception

This pass is a documentation and repo-convention rollout only. It does not add runtime or policy-file enforcement.

## Consequences

Positive:

- lower default token spend for routine work
- clearer routing for fresh agents with no prior context
- better alignment between repo navigation and the system's narrow-context architecture
- less accidental loading of historical or irrelevant docs

Tradeoffs:

- more routing docs must be maintained
- authors must keep indexes truthful as directories evolve
- some older docs need updates so they do not continue teaching broad-read habits

Governance:

- `DECISION_LOG.md` remains the canonical decision ledger
- this ADR is a durable companion record, not a replacement decision system
- future enforcement through policy files or runtime checks may build on this convention, but is not implemented by this ADR
