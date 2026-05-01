# Repository Contract

**Contract id:** `repository-contract`
**Schema version:** `v2`
**Status:** committed source contract

## Scope

This contract lifts project-specific working rules into a stable contract layer for future effective-contract assembly. It summarizes agent-relevant rules; `AGENTS.md` and the handoff docs remain the live human working guide.

## Rules

- Keep runtime truthfulness explicit: current behavior lives in TypeScript until YAML loading or mirroring is implemented.
- Use `.js` extensions for relative TypeScript imports.
- Use vitest for tests; do not introduce `node:test` or `node:assert`.
- Keep changes minimal, targeted, and reviewable.
- Do not change `extensions/`, `tests/`, package files, router files, or runtime code during schema-only taxonomy checkpoint tasks.
- Do not commit secrets, local machine state, or generated per-task effective contracts.
- Specialist Taxonomy Migration tasks T-27 through T-34 belong on `taxonomy-migration`.

## Validation Expectations

- Effective contracts should include only the subset of repository rules relevant to the target specialist and invocation.
- Repository rules outrank universal, base-class, variant, team-node, output-template, and upstream-artifact guidance when conflicts arise.
