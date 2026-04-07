# Result: Task 07 — Build a New Specialist

**Date:** 2026-04-07
**Duration:** ~15 minutes
**Build-team configuration:** Initial specialist-flow orchestration attempt via `planner,reviewer,builder,tester`; implementation completed directly in-repo after the reviewer step blocked before build artifacts existed.

## Summary

Created the new read-only `doc-formatter` specialist across `agents/`, `extensions/`, and `tests/`. The specialist follows the existing two-file extension pattern, uses the shared `createSpecialistExtension()` factory, declares markdown input/output contracts, and keeps `modifiedFiles` empty by design. Verification completed with `make typecheck` and `make test` passing.

## Layer 1 — Task Verification

| # | Assertion | Result | Notes |
|---|-----------|--------|-------|
| T1 | `agents/specialists/doc-formatter.md` exists and follows the agent definition contract | PASS | Added full specialist definition with required sections, working style, authority flags, and specialist-specific boundary fields. |
| T2 | `extensions/specialists/doc-formatter/prompt.ts` exists with valid `SpecialistPromptConfig` | PASS | Added `DOC_FORMATTER_PROMPT_CONFIG` plus prompt-builder wrappers. |
| T3 | `extensions/specialists/doc-formatter/index.ts` exists and uses `createSpecialistExtension` factory | PASS | Extension default export is created by `createSpecialistExtension()`. |
| T4 | I/O contracts are defined: input contract has markdown content field, output contract has normalized content field | PASS | `markdownContent` input and `normalizedMarkdown` output are declared as required string fields. |
| T5 | `tests/doc-formatter.test.ts` exists with tests for prompt construction and contract fields | PASS | Added prompt/config/task-prompt/factory registration coverage. |
| T6 | The specialist is read-only (no file write capabilities in its prompt config) | PASS | Constraints explicitly forbid file writes; tests assert read-only constraints and task prompt uses empty write set. |
| T7 | `make typecheck` passes | PASS | `npx tsc --noEmit` completed successfully via `make typecheck`. |
| T8 | `make test` passes (all existing + new tests) | PASS | `make test` passed with 45 test files / 612 tests green. |
| T9 | File structure matches existing specialist pattern (compare with `extensions/specialists/planner/`) | PASS | New specialist uses `prompt.ts` + `index.ts` wrappers mirroring the planner pattern. |

## Layer 2 — Substrate Verification

| # | Check | Result | Notes |
|---|-------|--------|-------|
| S1 | Token tracking | UNABLE | The requested specialist-flow orchestration blocked before a full implementation run completed, so no end-to-end multi-specialist token trail was captured for the final successful implementation path. |
| S2 | Dashboard widget | UNABLE | No interactive widget state was observed during this task execution path. |
| S3 | Session artifacts | UNABLE | No successful full team/session artifact was produced for the completed implementation path. |
| S4 | Hook events | UNABLE | Hook event sequencing was not directly inspected in this task run. |
| S5 | Sandbox enforcement | UNABLE | The direct in-repo implementation path did not exercise a completed delegated builder/tester run with observable policy envelopes. |
| S6 | Revision loops | N/A | No revision loop occurred. The initial reviewer block happened before builder execution rather than as an iterative revise/retry cycle. |
| S7 | Error resilience | PASS | The initial orchestration attempt failed soft with a structured reviewer block rather than crashing the session. |

## Bugs Found

- Specialist-flow ordering `planner,reviewer,builder,tester` did not complete Task 07 as written because the reviewer evaluated for existing build artifacts before the builder ran, producing a premature block instead of a plan review outcome.

## Substrate Iterations

- Completed the required specialist implementation directly after the blocked orchestration attempt.
- Added Task 07 validation result logging.
- Updated handoff documents to point to Task 08.

## Observations

- The repository-side specialist pattern remains lightweight and easy to reproduce once the reference files are known.
- The orchestration result suggests a mismatch between the intended "review the plan" step and how the reviewer currently interprets the task packet in this flow.
- Task 08 is the next useful validation target and should include formal result logging from the start.