# Task 05 — Extract Shared Constants

**Tier:** 2 (medium complexity)
**Stress-test focus:** Multi-file refactor, import rewiring, regression risk

## Objective

Extract hardcoded string literals (specialist IDs, hook event names, widget key) into a shared constants module, and update all imports across the codebase.

## Task Specification

> Create `extensions/shared/constants.ts` that centralizes frequently hardcoded string values:
>
> 1. **Specialist IDs** — `"planner"`, `"builder"`, `"reviewer"`, `"tester"`, `"spec-writer"`, `"schema-designer"`, `"routing-designer"`, `"critic"`, `"boundary-auditor"`. These appear in sandbox.ts (`READ_ONLY_SPECIALISTS`, `WRITE_SPECIALISTS`), orchestrator select.ts, and various test files.
>
> 2. **Hook event names** — The `HookEventName` union in types.ts already defines these, but the string literals are used directly in many places. Export a `HOOK_EVENTS` object with named keys (e.g., `HOOK_EVENTS.SESSION_START = "onSessionStart"`).
>
> 3. **Widget key** — `"my-pi-dashboard"` from `extensions/dashboard/widget.ts`.
>
> After creating the constants module, update imports in:
> - `extensions/shared/sandbox.ts` — use specialist ID constants
> - `extensions/dashboard/widget.ts` — use widget key constant
> - `extensions/orchestrator/select.ts` — use specialist ID constants where applicable
>
> Do NOT update test files (they can use string literals for readability). Ensure `make typecheck` and `make test` pass after all changes.

## Expected Specialist Flow

1. **Planner** — inventories all hardcoded strings, decides which to extract and which to leave, plans the import rewiring
2. **Builder** — creates the constants module and updates imports
3. **Reviewer** — validates that no string literals were missed in production code and no regressions introduced

## Stress-Test Focus

- Does the planner correctly scope a multi-file refactor?
- Can the builder modify multiple files without introducing import errors?
- Does the reviewer catch any missed hardcoded strings or broken imports?
- Does sandbox enforcement correctly grant write access to multiple paths?
- Are revision loops triggered if the reviewer finds issues?

## Layer 1 — Verification Checklist

| # | Assertion |
|---|-----------|
| T1 | `extensions/shared/constants.ts` exists with specialist IDs, hook event names, and widget key |
| T2 | `sandbox.ts` imports specialist IDs from constants instead of hardcoding |
| T3 | `dashboard/widget.ts` imports widget key from constants |
| T4 | `orchestrator/select.ts` uses specialist ID constants where applicable |
| T5 | `make typecheck` passes |
| T6 | `make test` passes (all 545+ tests) |
| T7 | No test files were modified |

## Notes

- **Files touched:** Creates `extensions/shared/constants.ts`; modifies `extensions/shared/sandbox.ts`, `extensions/dashboard/widget.ts`, `extensions/orchestrator/select.ts`
- **Risk:** Medium — import rewiring can break compilation if done incorrectly. Tests act as a safety net.
- **What this stress-tests uniquely:** Multi-file modification with interdependencies. This is the first task where the builder must modify existing files rather than creating new ones.
