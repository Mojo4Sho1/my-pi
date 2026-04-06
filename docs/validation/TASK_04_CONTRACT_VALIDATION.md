# Task 04 — Contract Validation Test

**Tier:** 2 (medium complexity)
**Stress-test focus:** Three-specialist chain, reading existing code to generate tests

## Objective

Create a programmatic test that loads every specialist's prompt config and validates that their I/O contracts are internally consistent and compatible with the orchestrator's expectations.

## Task Specification

> Create a test file `tests/contract-completeness.test.ts` that programmatically validates every specialist's I/O contracts. The test should:
>
> 1. Import all 9 specialist prompt configs from `extensions/specialists/*/prompt.ts`
> 2. For each specialist, verify:
>    - `inputContract` exists and has at least one required field
>    - `outputContract` exists and has at least one guaranteed field
>    - All fields referenced in contracts are valid (no typos, no undefined references)
>    - Input and output contracts don't overlap in ways that would cause confusion
> 3. Cross-validate: for specialists that commonly chain (e.g., planner → builder), verify output contract of the upstream specialist is compatible with input contract of the downstream specialist using the existing `contractsCompatible()` function from `extensions/shared/contracts.ts`
> 4. Verify all 9 specialists are covered: planner, builder, reviewer, tester, spec-writer, schema-designer, routing-designer, critic, boundary-auditor
>
> Use the existing `validateInputContract`, `validateOutputContract`, and `contractsCompatible` functions from `extensions/shared/contracts.ts`. Do not duplicate validation logic.

## Expected Specialist Flow

1. **Planner** — designs the test structure: which specialists to load, which chains to cross-validate, how to organize assertions
2. **Builder** — writes the test file
3. **Tester** — runs the tests and verifies they pass

## Stress-Test Focus

- Does the three-specialist chain work with proper handoffs?
- Does the planner produce an actionable plan that the builder can execute?
- Can the builder read and reference existing code (contracts.ts, prompt configs)?
- Does the tester correctly validate the builder's output?
- Are revision loops triggered if the tests initially fail?

## Layer 1 — Verification Checklist

| # | Assertion |
|---|-----------|
| T1 | `tests/contract-completeness.test.ts` exists |
| T2 | All 9 specialists are imported and tested |
| T3 | Input and output contract validation uses existing functions from `contracts.ts` |
| T4 | Cross-validation of at least 3 common specialist chains (e.g., planner→builder, builder→tester, spec-writer→reviewer) |
| T5 | `make typecheck` passes |
| T6 | `make test` passes (all existing + new tests) |
| T7 | No existing files were modified |

## Notes

- **Files touched:** Creates `tests/contract-completeness.test.ts`
- **Risk:** Low — new test file only, but requires reading across many existing files
- **Key imports:** `extensions/shared/contracts.ts` exports `validateInputContract`, `validateOutputContract`, `contractsCompatible`, `buildContextFromContract`
- **Specialist prompt configs:** Each at `extensions/specialists/<name>/prompt.ts`, exports a `SpecialistPromptConfig` with `inputContract` and `outputContract` fields
