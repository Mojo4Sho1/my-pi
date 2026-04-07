# Current Status

**Last updated:** 2026-04-07
**Owner:** Joe

## Current focus

Stage 5a.3 — Build-team validation on real tasks.

## Completed in current focus

- Defined validation methodology and 8 tasks across 3 tiers (`docs/validation/`)
- Fixed 7 substrate bugs discovered during validation:
  1. Extension loading — barrel export crash, fixed with explicit `pi.extensions` paths
  2. CLI flags — `--print` != JSON; correct: `--mode json --print --system-prompt <prompt> <task>`
  3. Timeout — increased to 10min for real coding tasks
  4. Token usage field names — parser handles both Pi and Anthropic naming
  5. Dashboard in sub-agents — `ctx.hasUI` guard for non-interactive mode
  6. Empty finalText — `message_update` accumulation + buffer flush on close
  7. Wrong specialist selection — removed keyword matching, LLM-driven via explicit `delegationHint`
- Completed validation tasks:
  - Task 03 (Format Helpers) — builder created `extensions/shared/format.ts`, tester validated
  - Task 04 (Contract Completeness) — builder created `tests/contract-completeness.test.ts`, fixed typecheck issues
  - Task 05 (Extract Shared Constants) — builder created `extensions/shared/constants.ts`, imports updated across `sandbox.ts`, `widget.ts`, `select.ts`
  - Task 06 (Widget Rendering Snapshot Tests) — builder created `tests/dashboard-widget-snapshots.test.ts` covering all 8 widget states with exact inline string-array assertions; tester validated
  - Task 07 (Build a New Specialist) — created read-only `doc-formatter` specialist definition, extension, and tests in `agents/`, `extensions/`, and `tests/`; logged results in `docs/validation/results/RESULT_07_NEW_SPECIALIST.md`
- Added `inferFilePaths()` to orchestrator — reads `.md` files from `relevantFiles` and extracts file paths from content
- Restructured docs: AGENTS.md is single source of truth for all AI agents, CLAUDE.md is pointer + Claude-specific guidance
- Added Stage 5a.5 (Convention-Aware Orchestrator), 5i (Task Relay), 5j (Self-Respawn) to implementation plan
- Created handoff document templates in `docs/handoff/templates/`

## Passing checks

- Run timestamp: `2026-04-07`
- `make typecheck`: PASS
- `make test`: PASS — 612 tests, 45 test files, all passing

## Known gaps / blockers

- Tasks 01 and 02 (Tier 1) were not run through the orchestrator — low priority, can be done later
- Task 07 exposed a flow mismatch: the requested `planner,reviewer,builder,tester` specialist sequence blocked at reviewer because it looked for built artifacts before the builder ran

## Decision notes for next session

- Specialist selection is now LLM-driven via `delegationHint` — always specify the specialist(s) explicitly
- The orchestrator's `delegationHint` accepts comma-separated strings (e.g., "builder,tester") parsed into arrays at runtime
- `inferFilePaths()` extracts paths from task text and referenced `.md` files — reduces need for exhaustive `relevantFiles` lists
- Handoff system adopted: agents read `NEXT_TASK.md` on start, update all handoff docs on completion

## Next task (single target)

Task 08 — /dashboard command skeleton (see `NEXT_TASK.md`)

## Definition of done for next task

- Create `extensions/dashboard/command.ts`, `extensions/dashboard/panels/overview.ts`, and `tests/dashboard-command.test.ts`
- Reuse existing dashboard projections/types without duplicating logic
- `make typecheck` and `make test` pass
- Keep the task additive and overview-only
