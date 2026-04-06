# Task 01 — Add JSDoc to Shared Types

**Tier:** 1 (low risk)
**Stress-test focus:** Single-file bounded edit, basic delegation loop

## Objective

Add JSDoc documentation comments to every exported type, interface, and type alias in `extensions/shared/types.ts`. The file has ~52 exports and ~490 lines with no documentation.

## Task Specification

> Add JSDoc comments to every exported type, interface, and type alias in `extensions/shared/types.ts`. Each comment should be 1-3 sentences explaining the type's purpose and role in the system. Do not modify any type definitions — only add `/** ... */` comments above each export. Group comments should reference related types where helpful (e.g., "Used by `delegateToSpecialist` in the delegation lifecycle — see also `DelegationOutput`").

## Expected Specialist Flow

1. **Builder** — reads `types.ts`, adds JSDoc comments above each exported type

This is a single-specialist task. No planning or review phase needed. The builder should be able to complete this in one pass.

## Stress-Test Focus

- Does the basic delegation loop work end-to-end?
- Does the builder receive the correct file context?
- Does token tracking capture a single-specialist delegation?
- Is the policy envelope correctly applied (builder = write specialist)?

## Layer 1 — Verification Checklist

| # | Assertion |
|---|-----------|
| T1 | Every `export type`, `export interface`, and `export const` in `types.ts` has a JSDoc comment directly above it |
| T2 | No type definitions were modified (only comments added) |
| T3 | `make typecheck` passes |
| T4 | `make test` passes (all 545+ tests) |
| T5 | Comments are accurate — spot-check at least 5 comments against the actual type semantics |

## Notes

- **Files touched:** `extensions/shared/types.ts` only
- **Risk:** Very low — comments cannot break compilation or tests
- **Why this is a good first task:** Minimal blast radius, exercises the full delegation path, easy to verify
