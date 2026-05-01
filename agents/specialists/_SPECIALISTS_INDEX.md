# _SPECIALISTS_INDEX.md

## Purpose

Routing file for specialist definitions in `agents/specialists/`.

## Subtree role

This subtree contains primitive, narrow-scope worker definitions for the current specialist roster.
All specialists in this subtree are expected to conform to `agents/AGENT_DEFINITION_CONTRACT.md`, including required `working_style` in the current phase.

Specialists are also subject to the canonical specialist taxonomy in `agents/SPECIALIST_TAXONOMY_AND_CONTEXT_MODEL.md`, which defines the four base classes (`Planner`, `Scribe`, `Builder`, `Reviewer`) and the variant naming convention. Migration from the current flat roster to a base-class-plus-variant model is staged in `agents/SPECIALIST_TAXONOMY_MIGRATION_PLAN.md` and tracked in `agents/SPECIALIST_TAXONOMY_DECISION_LOG.md`.

## Access model

Only orchestrator-class actors have broad default routing.
Downstream actors are narrow by default.

## Current specialist set

Each entry lists the current filename, canonical base class, canonical variant, and migration status. Filenames have not been changed in this pass; rename strategy is tracked in D-O1.

| File | Base class | Canonical variant | Deprecated alias / status |
|---|---|---|---|
| `agents/specialists/planner.md` | `Planner` | `null` (generic base `planner`) | none / `active` |
| `agents/specialists/reviewer.md` | `Reviewer` | `null` (generic base `reviewer`) | none / `active` |
| `agents/specialists/builder.md` | `Builder` | `null` (generic base `builder`) | none / `active`; D-O5 keeps `builder` |
| `agents/specialists/tester.md` | `Builder` | `builder-test` | `tester` / `deprecated` per D-O4 and D-D1 |
| `agents/specialists/spec-writer.md` | `Scribe` | `scribe-spec` | `spec-writer` / `deprecated` per D-P1 and D-D1 |
| `agents/specialists/schema-designer.md` | `Scribe` | `scribe-schema` | `schema-designer` / `deprecated` per D-P2 and D-D1 |
| `agents/specialists/routing-designer.md` | `Scribe` | `scribe-routing` | `routing-designer` / `deprecated` per D-P3 and D-D1 |
| `agents/specialists/critic.md` | `Reviewer` | `reviewer-critic` | `critic` / `deprecated` per D-P4 and D-D1 |
| `agents/specialists/boundary-auditor.md` | `Reviewer` | `reviewer-boundary-auditor` | `boundary-auditor` / `deprecated` per D-P5 and D-D1 |
| `agents/specialists/doc-formatter.md` | `null` (out-of-taxonomy utility) | `null` | none / `blocked-for-new-use`; D-D3 does not promote it |

## Routing guidance

Use this subtree when defining or revising narrow execution roles.

### Planner

Use when a task needs structured decomposition, dependency mapping, risk identification, and actionable next-step planning.
Do not use when the primary need is implementation or execution-side validation.

### Reviewer

Use when a plan, change proposal, or output needs consistency/scope/constraint review.
Do not use as the primary implementer.

### Builder

Use when bounded implementation work is ready to be executed within explicit scope.
Do not use for broad planning or final validation ownership.

### Tester

Use when implementation needs independent test authorship, executable pass conditions, and coverage framing.
Do not use as a generic test runner, for broad design decisions, or for orchestration.

Taxonomy note: under `agents/SPECIALIST_TAXONOMY_AND_CONTEXT_MODEL.md`, `tester` is reclassified as the Builder variant `builder-test`. Its useful responsibility (creating or revising test artifacts) is preserved. Running tests alone is an action, not a specialist responsibility, and does not justify a dedicated specialist. Runtime alias migration is deferred to D-O4, with lifecycle states governed by D-D1.

### Spec-Writer

Use when a new primitive needs an exhaustive prose specification with boundary-first framing.
Do not use for implementation, type design, or routing design.

### Schema-Designer

Use when TypeScript types, packet shapes, I/O contracts, or invariants need design.
Do not use for prose specifications, routing design, or runtime implementation.

### Routing-Designer

Use when a team needs state machine routing design with transition completeness analysis.
Do not use for type design, prose specifications, or runtime implementation.

### Critic

Use when designs need quality evaluation, redundancy detection, or reuse opportunity search.
Do not use for compliance review, boundary auditing, or implementation.

### Boundary-Auditor

Use when designs need access control audit and narrow-by-default compliance verification.
Do not use for quality evaluation, compliance review, or implementation.

### Doc-Formatter (validation artifact)

`agents/specialists/doc-formatter.md` exists as a specialist created during Stage 5a.3 validation (Task T-07) to exercise the build-team's ability to produce a new specialist end-to-end. It has a full agent definition, extension (`extensions/specialists/doc-formatter/`), and tests, but it is **not** wired into the orchestrator's routing — it is absent from `extensions/shared/constants.ts` and `extensions/orchestrator/delegate.ts`. Per D-D3, it is not promoted into the canonical taxonomy; preserve it only as a transitional utility unless a future decision supersedes D-D3.

## Update rule

Update this index when specialist files are added, removed, renamed, re-routed, or materially re-scoped.
