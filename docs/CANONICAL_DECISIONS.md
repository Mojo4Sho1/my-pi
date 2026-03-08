# CANONICAL_DECISIONS.md

## Purpose

This document records durable canonical decisions that should not be re-inferred in later loops.

## Durability rule

These decisions remain in force until an explicit superseding decision is recorded in `docs/handoff/DECISION_LOG.md` and reflected in relevant contracts and routing docs.

## Canonical decisions

1. The behavioral steering field is named `working_style`, not `persona`.
Rationale: `working_style` is implementation-oriented and avoids persona-layer ambiguity that does not belong in the current coding-focused phase.

2. `working_style` is required for specialists in the current phase and optional for other agent classes until those classes are formally upgraded.
Rationale: specialists are the active primitive layer, so this requirement locks consistency where execution is happening now without forcing premature refactors elsewhere.

3. All live phase/state truth belongs exclusively to the handoff layer under `docs/handoff/`.
Rationale: a single live-state control plane prevents drift and conflicting status signals across durable architecture documents.

4. `docs/PROJECT_FOUNDATION.md` is a stable architectural document and must not act as the live source of current phase/state.
Rationale: foundation docs should preserve timeless intent and boundaries; live status must remain in handoff artifacts.

5. The repository explicitly materializes top-level `skills/` and `prompts/` directories because package/configuration and scope already treat them as first-class areas.
Rationale: making these paths intentional removes ambiguity between declared package structure and actual repository structure.

6. The templates contract/index must describe the actual current `templates/` subtree rather than an unimplemented alternate taxonomy, unless deliberately introduced by a later explicit task.
Rationale: routing and contract docs must match real structure to keep generation behavior understandable and reliable.

## Downstream implications

The following future docs/tasks must conform to these decisions:

- `agents/AGENT_DEFINITION_CONTRACT.md` and specialist definitions must use `working_style` per the phase rule above.
- Handoff-control-plane work (`docs/handoff/*`) remains the only live phase/state authority.
- `docs/PROJECT_FOUNDATION.md` updates must remain architectural and non-live.
- Template-doc reconciliation tasks must align `templates/CONTRACT.md` and `templates/_TEMPLATES_INDEX.md` with the real `templates/` tree before introducing new taxonomy.
- Future package-structure and scaffold tasks must preserve intentional top-level `skills/` and `prompts/` directories.
