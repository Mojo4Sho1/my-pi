# Task 03 — Format Helpers for Violations and Thresholds

**Tier:** 1 (low risk)
**Stress-test focus:** Code creation + test creation, two-specialist flow

## Objective

Add human-readable formatting functions for `PolicyViolation` and `ThresholdResult` types, with tests.

## Task Specification

> Create two formatting utility functions in a new file `extensions/shared/format.ts`:
>
> 1. `formatPolicyViolation(violation: PolicyViolation): string` — returns a single-line human-readable summary of a policy violation. Example output: `"BLOCKED: write to .env.local — forbidden glob match (.env*) for specialist_builder"`
>
> 2. `formatThresholdResult(result: ThresholdResult): string` — returns a single-line summary of a threshold check. Example output: `"WARN: 85000/100000 tokens (85%) — approaching split threshold"`
>
> Both functions should produce output suitable for log lines or CLI display. Create corresponding tests in `tests/format.test.ts` covering: all violation types, all threshold levels (ok, warn, split, deny), edge cases (zero tokens, 100% usage).
>
> Import types from `extensions/shared/types.ts`. Do not modify any existing files other than adding the new ones.

## Expected Specialist Flow

1. **Builder** — creates `extensions/shared/format.ts` with both functions
2. **Tester** — creates `tests/format.test.ts` with comprehensive tests

## Stress-Test Focus

- Does the two-specialist flow work (builder creates, tester tests)?
- Does the tester receive the builder's output as context?
- Are both new files created correctly?
- Does sandbox enforcement allow builder to write to `extensions/shared/`?

## Layer 1 — Verification Checklist

| # | Assertion |
|---|-----------|
| T1 | `extensions/shared/format.ts` exists with both exported functions |
| T2 | `tests/format.test.ts` exists with tests for both functions |
| T3 | `formatPolicyViolation` handles all `PolicyViolationType` values |
| T4 | `formatThresholdResult` handles all threshold levels (ok, warn, split, deny) |
| T5 | Output is human-readable single-line strings |
| T6 | `make typecheck` passes |
| T7 | `make test` passes (all existing + new tests) |
| T8 | No existing files were modified |

## Notes

- **Files touched:** Creates `extensions/shared/format.ts` and `tests/format.test.ts`
- **Risk:** Low — new files only, no modifications to existing code
- **Types to reference:** `PolicyViolation` and `PolicyViolationType` from types.ts (violation types: `forbidden_glob`, `outside_allowed_paths`, `shell_not_allowed`, `network_not_allowed`, `process_spawn_not_allowed`); `ThresholdResult` from types.ts (levels: `ok`, `warn`, `split`, `deny`)
