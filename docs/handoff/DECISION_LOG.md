# DECISION_LOG.md

## Purpose

Append-only record of durable project decisions.

## Append-only rule

Do not rewrite prior decisions except to correct factual errors. Add new dated entries instead.

## Most recent decisions

### Decision 1

- Decision title: Canonical behavioral steering field
- Decision statement: Canonical behavioral steering field is `working_style` (not `persona`) to keep steering implementation-oriented in the current coding-focused phase.
- Rationale: to keep steering implementation-oriented in the current coding-focused phase.
- Date: 2026-03-08
- Downstream implications: Not explicitly recorded in the original entry.

### Decision 2

- Decision title: Specialist `working_style` requirement
- Decision statement: `working_style` is required for specialists and optional for other agent classes until those classes are formally upgraded, to avoid premature cross-class refactors.
- Rationale: to avoid premature cross-class refactors.
- Date: 2026-03-08
- Downstream implications: Not explicitly recorded in the original entry.

### Decision 3

- Decision title: Handoff ownership of live phase/state truth
- Decision statement: Live phase/state truth is owned exclusively by `docs/handoff/` to prevent drift across non-handoff docs.
- Rationale: to prevent drift across non-handoff docs.
- Date: 2026-03-08
- Downstream implications: Not explicitly recorded in the original entry.

### Decision 4

- Decision title: `PROJECT_FOUNDATION.md` role boundary
- Decision statement: `docs/PROJECT_FOUNDATION.md` is stable architecture-only and not a live phase/state source.
- Rationale: Not explicitly recorded in the original entry.
- Date: 2026-03-08
- Downstream implications: Not explicitly recorded in the original entry.

### Decision 5

- Decision title: Top-level `skills/` and `prompts/` materialization
- Decision statement: Top-level `skills/` and `prompts/` are explicitly materialized as first-class package areas to match package config and project scope.
- Rationale: to match package config and project scope.
- Date: 2026-03-08
- Downstream implications: Not explicitly recorded in the original entry.

### Decision 6

- Decision title: Template contract/index alignment rule
- Decision statement: Template contract/index docs must match the actual `templates/` subtree unless a later explicit task introduces a new taxonomy.
- Rationale: Not explicitly recorded in the original entry.
- Date: 2026-03-08
- Downstream implications: Not explicitly recorded in the original entry.

### Decision 7

- Decision title: Phase transition to primitive layer implementation
- Decision statement: Phase transition confirmed to primitive layer implementation (specialists) after documentation stabilization.
- Rationale: after documentation stabilization.
- Date: 2026-03-07
- Downstream implications: Not explicitly recorded in the original entry.

### Decision 8

- Decision title: Initial specialist set
- Decision statement: Initial specialist set fixed to `planner`, `reviewer`, `builder`, and `tester` per `agents/PRIMITIVE_LAYER_PLAN.md`.
- Rationale: Not explicitly recorded in the original entry.
- Date: 2026-03-07
- Downstream implications: Not explicitly recorded in the original entry.

### Decision 9

- Decision title: Canonical project foundation path
- Decision statement: Canonical project foundation path is `docs/PROJECT_FOUNDATION.md`.
- Rationale: Not explicitly recorded in the original entry.
- Date: 2026-03-07
- Downstream implications: Not explicitly recorded in the original entry.

### Decision 10

- Decision title: Startup flow standardization
- Decision statement: Startup flow is standardized as `AGENTS.md` (auto-read) -> `INDEX.md` (universal routing entrypoint), with orchestrator continuing to workflow and handoff docs.
- Rationale: Not explicitly recorded in the original entry.
- Date: 2026-03-07
- Downstream implications: Not explicitly recorded in the original entry.

### Decision 11

- Decision title: Default routing split
- Decision statement: Only orchestrator-class actors have broad default routing; downstream actors are narrow by default.
- Rationale: Not explicitly recorded in the original entry.
- Date: 2026-03-07
- Downstream implications: Not explicitly recorded in the original entry.
