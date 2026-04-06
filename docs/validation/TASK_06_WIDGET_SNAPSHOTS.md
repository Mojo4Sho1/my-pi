# Task 06 — Widget Rendering Snapshot Tests

**Tier:** 2 (medium complexity)
**Stress-test focus:** Test-focused task, working with existing test patterns

## Objective

Add snapshot/regression tests for the dashboard widget's line rendering across all major states, ensuring the widget output is stable and predictable.

## Task Specification

> Add snapshot-style tests to `tests/dashboard-widget.test.ts` (or a new `tests/dashboard-widget-snapshots.test.ts`) that capture the exact line output of `renderWidgetLines()` for various `WidgetState` inputs. Cover at least these states:
>
> 1. **Idle** — no active session (should return empty/clear)
> 2. **Running, early** — session just started, no worklist yet, no tokens yet
> 3. **Running, mid-flight** — team active, state machine in a specific state, specialist delegated, worklist partially complete, tokens accumulating
> 4. **Running with blockers** — worklist has blocked items, blocker indicator should appear
> 5. **Running with escalation** — escalation flag set
> 6. **Completed successfully** — session done, all worklist items complete
> 7. **Failed** — session ended with failure status
> 8. **Escalated** — session ended with escalation
>
> Each test should assert the exact array of strings returned by `renderWidgetLines()`. Use inline snapshots or explicit string assertions (not vitest file snapshots). This ensures any future changes to widget rendering are caught as test failures.
>
> Import `renderWidgetLines` from `extensions/dashboard/widget.ts` and `WidgetState` from `extensions/dashboard/types.ts`.

## Expected Specialist Flow

1. **Builder** — writes the snapshot tests following existing test patterns in `tests/dashboard-widget.test.ts`
2. **Tester** — runs the tests and verifies they pass

## Stress-Test Focus

- Can the builder read existing test patterns and produce consistent new tests?
- Does the tester correctly validate test output?
- Is the task bounded enough for a two-specialist flow?
- Are token costs reasonable for a test-writing task?

## Layer 1 — Verification Checklist

| # | Assertion |
|---|-----------|
| T1 | Snapshot tests exist for all 8 states listed above |
| T2 | Each test asserts the exact string array from `renderWidgetLines()` |
| T3 | Tests use inline assertions (not vitest file snapshots) |
| T4 | `make typecheck` passes |
| T5 | `make test` passes (all existing + new tests) |
| T6 | No existing test assertions were modified (additive only) |

## Notes

- **Files touched:** Adds to `tests/dashboard-widget.test.ts` or creates `tests/dashboard-widget-snapshots.test.ts`
- **Risk:** Low — additive test changes only
- **Existing patterns:** `tests/dashboard-widget.test.ts` already has 8 tests using a `makeWidgetState()` helper. The builder should follow this pattern.
- **Key imports:** `renderWidgetLines` from `extensions/dashboard/widget.ts`, `WidgetState` from `extensions/dashboard/types.ts`
