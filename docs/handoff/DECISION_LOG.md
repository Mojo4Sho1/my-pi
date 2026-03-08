# DECISION_LOG.md

## Purpose

Append-only record of durable project decisions.

## Append-only rule

Do not rewrite prior decisions except to correct factual errors. Add new dated entries instead.

## Most recent decisions

- 2026-03-08: Canonical behavioral steering field is `working_style` (not `persona`) to keep steering implementation-oriented in the current coding-focused phase.
- 2026-03-08: `working_style` is required for specialists and optional for other agent classes until those classes are formally upgraded, to avoid premature cross-class refactors.
- 2026-03-08: Live phase/state truth is owned exclusively by `docs/handoff/` to prevent drift across non-handoff docs.
- 2026-03-08: `docs/PROJECT_FOUNDATION.md` is stable architecture-only and not a live phase/state source.
- 2026-03-08: Top-level `skills/` and `prompts/` are explicitly materialized as first-class package areas to match package config and project scope.
- 2026-03-08: Template contract/index docs must match the actual `templates/` subtree unless a later explicit task introduces a new taxonomy.
- 2026-03-07: Phase transition confirmed to primitive layer implementation (specialists) after documentation stabilization.
- 2026-03-07: Initial specialist set fixed to `planner`, `reviewer`, `builder`, and `tester` per `agents/PRIMITIVE_LAYER_PLAN.md`.
- 2026-03-07: Canonical project foundation path is `docs/PROJECT_FOUNDATION.md`.
- 2026-03-07: Startup flow is standardized as `AGENTS.md` (auto-read) -> `INDEX.md` (universal routing entrypoint), with orchestrator continuing to workflow and handoff docs.
- 2026-03-07: Only orchestrator-class actors have broad default routing; downstream actors are narrow by default.
