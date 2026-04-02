# _SPECIALISTS_INDEX.md

## Purpose

Routing file for specialist definitions in `agents/specialists/`.

## Subtree role

This subtree contains primitive, narrow-scope worker definitions for the initial specialist layer.
All specialists in this subtree are expected to conform to `agents/AGENT_DEFINITION_CONTRACT.md`, including required `working_style` in the current phase.

## Access model

Only orchestrator-class actors have broad default routing.
Downstream actors are narrow by default.

## Initial specialist set

- `agents/specialists/planner.md`
- `agents/specialists/reviewer.md`
- `agents/specialists/builder.md`
- `agents/specialists/tester.md`
- `agents/specialists/spec-writer.md`
- `agents/specialists/schema-designer.md`
- `agents/specialists/routing-designer.md`
- `agents/specialists/critic.md`
- `agents/specialists/boundary-auditor.md`

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

Use when implementation needs validation through the smallest appropriate check layer.
Do not use for broad design decisions or orchestration.

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

## Update rule

Update this index when specialist files are added, removed, renamed, re-routed, or materially re-scoped.
