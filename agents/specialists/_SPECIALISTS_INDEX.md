# _SPECIALISTS_INDEX.md

## Purpose

Routing file for specialist definitions in `agents/specialists/`.

## Subtree role

This subtree contains primitive, narrow-scope worker definitions for the initial specialist layer.

## Access model

Only orchestrator-class actors have broad default routing.
Downstream actors are narrow by default.

## Initial specialist set

- `agents/specialists/planner.md`
- `agents/specialists/reviewer.md`
- `agents/specialists/builder.md`
- `agents/specialists/tester.md`

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

## Update rule

Update this index when specialist files are added, removed, renamed, re-routed, or materially re-scoped.
