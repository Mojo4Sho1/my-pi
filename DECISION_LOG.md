# DECISION_LOG.md

Append-only record of durable project decisions. Do not rewrite prior entries except to correct factual errors. Mark superseded decisions with `[superseded by #N]`.

When making a new decision, append it to the end with the next number.

## Decisions

### 1. Behavioral steering field is `working_style` (2026-03-08) [active]

Use `working_style` (not `persona`) to keep steering implementation-oriented.

### 2. `working_style` required for specialists (2026-03-08) [active]

Required for specialists, optional for other agent classes until formally upgraded.

### 3. Live state owned by `STATUS.md` (2026-03-08) [active]

Single live-state control plane prevents drift. Originally `docs/handoff/`, simplified to root `STATUS.md`.

### 4. `PROJECT_FOUNDATION.md` is stable architecture only (2026-03-08) [active]

Not a live state source. Live state belongs in `STATUS.md`.

### 5. Top-level `skills/` and `prompts/` are first-class package areas (2026-03-08) [active]

Matching package config and project scope.

### 6. Template contract/index must match actual structure (2026-03-08) [superseded by #12]

Templates archived as part of extension pivot. No longer actively maintained.

### 7. Phase transition to primitive implementation confirmed (2026-03-07) [active]

Confirmed after documentation stabilization.

### 8. Initial specialist set fixed to planner, reviewer, builder, tester (2026-03-07) [active]

Minimum roles to prove the team abstraction.

### 9. Canonical project foundation path is `docs/PROJECT_FOUNDATION.md` (2026-03-07) [active]

### 10. Startup flow: `AGENTS.md` → `INDEX.md` (2026-03-07) [active]

`AGENTS.md` is auto-read first by platform behavior. `INDEX.md` is the universal routing entrypoint.

### 11. Only orchestrator-class actors have broad default routing (2026-03-07) [active]

Downstream actors are narrow by default.

### 12. Pivot to extension-powered orchestration (2026-03-21) [active]

Build TypeScript Pi extensions implementing orchestrator/specialist routing as sub-agents with packet-based delegation and state-machine routing. Contracts and packet validation implemented in TypeScript types and runtime validation. Markdown agent definitions remain as specs that extensions implement. Governance documentation simplified heavily; archived files preserved in `docs/archive/`.

### 13. Consolidate decision tracking into single file (2026-03-22) [active]

Merged `docs/CANONICAL_DECISIONS.md` into root `DECISION_LOG.md`. Single source of truth for all decisions with `[active]`/`[superseded]` status markers. Archived the former file.
