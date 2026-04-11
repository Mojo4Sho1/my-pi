# REPO_CONVENTIONS.md

## Purpose

Practical repository navigation and documentation rules for humans and agents working in `my-pi`.

Use this file to decide how to route through the repo efficiently and truthfully.

## Navigation Rules

1. Start at `AGENTS.md`, then `INDEX.md`, then the nearest relevant local index.
2. Read the minimum relevant file or section for the task.
3. Prefer a local index before opening a large document set or a long planning document.
4. Treat `docs/archive/` as background or historical material, not default working context.
5. If a task is narrow, keep the read set narrow. Broad reads need a concrete reason.

## Layered Onboarding

Fresh agents should load context in layers and keep stable reference material separate from current-run working artifacts.

- Stable reference material lives in places such as `docs/`, `docs/adr/`, `DECISION_LOG.md`, `specs/`, and the repo's index files.
- Working artifacts are current packets, validated upstream outputs, team/session artifacts, active task files, and handoff targets for the current run.
- Specialists default to narrow onboarding: the minimum routing context they need, their role contract, and the current packet or upstream artifacts.
- The orchestrator has broader but still bounded onboarding: it may read indexes, routing docs, and future policies/manifests so it can package narrowed downstream context.
- Machine-first artifacts such as YAML and JSON are the canonical runtime-routing inputs; Markdown remains the human-facing explanation layer.
- `my-pi` follows factory-vs-run discipline: configure durable repo structure once, then produce bounded run artifacts under that structure.

See `docs/LAYERED_ONBOARDING.md` for the full model, profiles, and truthful implementation status.

## Index Naming

All local index files in this repo should:

- start with `_`
- include the indexed subject before `INDEX`
- use all-capital names
- avoid repeated generic names such as `INDEX.md`

Examples:

- `docs/_DOCS_INDEX.md`
- `docs/_IMPLEMENTATION_PLAN_INDEX.md`
- `docs/validation/_VALIDATION_INDEX.md`
- `docs/handoff/_HANDOFF_INDEX.md`

### Root Exception

The root `INDEX.md` remains the bootstrap router for the whole repo. It is the only exception to the underscore-prefixed local-index naming rule.

## Implementation Plan Rule

Do not read `docs/IMPLEMENTATION_PLAN.md` end-to-end for routine work.

Default behavior:

1. open `docs/_IMPLEMENTATION_PLAN_INDEX.md`
2. identify the smallest relevant stage or section
3. read only that section of `docs/IMPLEMENTATION_PLAN.md` if needed

A full read of `docs/IMPLEMENTATION_PLAN.md` is justified only when:

- doing architecture-wide replanning
- editing or restructuring the implementation plan itself
- making a cross-stage design decision
- the user explicitly asks for a full-plan review

## Design Docs vs ADRs

### Design docs

Design docs are working proposals. In this repo they live under `docs/design/`.

- They may drive an implementation pass.
- They may be updated to reflect implementation status.
- They are not the canonical source of durable accepted decisions.

### Durable specs

Durable authoring/spec files live under `specs/`.

- They own concrete YAML structure decisions for the future specialist/team authoring layer.
- They are companions to the relevant design docs, not replacements for architectural rationale.
- Until runtime YAML loading exists, they do not override live TypeScript runtime behavior.

### ADRs

ADRs are durable architectural decision records. In this repo they live under `docs/adr/`.

- They capture accepted decisions and consequences.
- They complement `DECISION_LOG.md`; they do not replace it.
- `DECISION_LOG.md` remains the canonical ledger of active/superseded decisions.

## Truthfulness Rule

Document only what the repo actually does now.

- Do not describe planned automation as implemented.
- If future policy-file or runtime enforcement is mentioned, label it as future work.
- Fix stale file references when they are discovered during doc updates.

## Common Routing Defaults

| Need | Start here |
|---|---|
| docs tree | `docs/_DOCS_INDEX.md` |
| implementation stages | `docs/_IMPLEMENTATION_PLAN_INDEX.md` |
| validation tasks/results | `docs/validation/_VALIDATION_INDEX.md` |
| handoff flow | `docs/handoff/_HANDOFF_INDEX.md` |
| agent definitions | `agents/_AGENTS_INDEX.md` |

## Handoff Placement

- Active handoff docs belong under `docs/handoff/`.
- Completed-stage execution guides or superseded handoff material belong under `docs/archive/`.
- Do not leave historical handoff guides mixed into the active top level of `docs/` if they are no longer part of the startup path.

## Update Rule

Update this file when repo navigation conventions, index naming rules, or durable documentation expectations materially change.
