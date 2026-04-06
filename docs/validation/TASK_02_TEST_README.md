# Task 02 — Test Organization README

**Tier:** 1 (low risk)
**Stress-test focus:** Multi-specialist routing, handoff between specialists

## Objective

Create a `tests/README.md` that documents the test organization across the project's 41 test files, grouped by subsystem and with brief descriptions.

## Task Specification

> Create a `tests/README.md` that describes the test organization for this project. The project has 41 test files covering: packet/routing foundations, specialist extensions (9 specialists), orchestrator (selection, delegation, context, synthesis, e2e), team routing, worklist, session artifacts, contracts, hooks, sandbox, tokens, dashboard, and more. Group the tests by subsystem, list each test file with a one-line description, and note the total test count (545+). Include any useful guidance for running tests (`make test`, `make test-watch`).

## Expected Specialist Flow

1. **Spec-writer** — drafts the README structure and content based on the test file inventory
2. **Builder** — writes the actual `tests/README.md` file
3. **Reviewer** — validates that all 41 test files are listed and descriptions are accurate

## Stress-Test Focus

- Does multi-specialist routing work (three specialists in sequence)?
- Are handoffs between specialists clean (spec-writer output feeds builder)?
- Does the reviewer receive adequate context to validate completeness?
- Are session artifacts captured for each step in the chain?

## Layer 1 — Verification Checklist

| # | Assertion |
|---|-----------|
| T1 | `tests/README.md` exists |
| T2 | All 41 test files are listed |
| T3 | Tests are grouped by subsystem (not just a flat list) |
| T4 | Each test file has an accurate one-line description |
| T5 | Running instructions are included (`make test`, `make test-watch`) |
| T6 | Total test count is mentioned |
| T7 | No existing files were modified |

## Notes

- **Files touched:** Creates `tests/README.md` only
- **Risk:** Very low — new file, no code changes
- **Why this is useful:** The project has no test guide; this is genuinely helpful for onboarding
