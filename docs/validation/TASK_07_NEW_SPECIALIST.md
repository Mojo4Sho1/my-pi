# Task 07 — Build a New Specialist

**Tier:** 3 (high complexity)
**Stress-test focus:** The build-team's intended purpose — creating new specialists

## Objective

Use the build-team to create a new `doc-formatter` utility specialist that normalizes markdown documents (consistent heading levels, trailing newlines, list formatting).

## Task Specification

> Create a new `doc-formatter` specialist that takes a markdown document as input and produces a normalized version as output. The specialist should:
>
> 1. **Agent definition** — Create `agents/specialists/doc-formatter.md` following the contract in `agents/AGENT_DEFINITION_CONTRACT.md`. The doc-formatter has a `working_style` focused on precision and consistency. It is a read-only specialist (does not write files — it returns normalized content).
>
> 2. **Extension** — Create `extensions/specialists/doc-formatter/`:
>    - `prompt.ts` — `SpecialistPromptConfig` with I/O contracts. Input: raw markdown content. Output: normalized markdown content.
>    - `index.ts` — Extension entry point using the `createSpecialistExtension` factory from `extensions/shared/specialist-prompt.ts`.
>
> 3. **Tests** — Create `tests/doc-formatter.test.ts` following the existing specialist test pattern (see any specialist test like `tests/planner.test.ts`). Test prompt construction, I/O contract fields, and the extension factory.
>
> Follow existing patterns exactly. Every specialist uses the same 2-file structure (prompt.ts + index.ts) and the `createSpecialistExtension` factory. Do not deviate from this pattern.

## Expected Specialist Flow

Build-team state machine: planning → review → building → testing → done

1. **Planner** — designs the specialist: agent definition structure, prompt config, I/O contracts, test strategy
2. **Reviewer** — reviews the plan for consistency with existing specialist patterns
3. **Builder** — creates all three files (agent def, prompt.ts, index.ts, test file)
4. **Tester** — runs the new tests and validates they pass

## Stress-Test Focus

- Does the full build-team state machine execute end-to-end?
- Do revision loops trigger if the reviewer rejects the plan?
- Can the builder create files across multiple directories (`agents/`, `extensions/`, `tests/`)?
- Does sandbox enforcement correctly handle a new specialist (write paths must include all three directories)?
- Are session artifacts complete enough to reconstruct the full execution path?
- Is token usage reasonable for a multi-specialist, multi-file creation task?

## Layer 1 — Verification Checklist

| # | Assertion |
|---|-----------|
| T1 | `agents/specialists/doc-formatter.md` exists and follows the agent definition contract |
| T2 | `extensions/specialists/doc-formatter/prompt.ts` exists with valid `SpecialistPromptConfig` |
| T3 | `extensions/specialists/doc-formatter/index.ts` exists and uses `createSpecialistExtension` factory |
| T4 | I/O contracts are defined: input contract has markdown content field, output contract has normalized content field |
| T5 | `tests/doc-formatter.test.ts` exists with tests for prompt construction and contract fields |
| T6 | The specialist is read-only (no file write capabilities in its prompt config) |
| T7 | `make typecheck` passes |
| T8 | `make test` passes (all existing + new tests) |
| T9 | File structure matches existing specialist pattern (compare with `extensions/specialists/planner/`) |

## Notes

- **Files touched:** Creates `agents/specialists/doc-formatter.md`, `extensions/specialists/doc-formatter/prompt.ts`, `extensions/specialists/doc-formatter/index.ts`, `tests/doc-formatter.test.ts`
- **Risk:** Medium — new specialist must follow exact existing patterns. Multiple directories touched. But no existing files modified.
- **Why doc-formatter:** It's a simple, well-understood transformation (markdown normalization) that doesn't require domain knowledge. It exercises the specialist creation pattern without complex business logic.
- **Sandbox consideration:** The builder specialist needs write access to `agents/specialists/`, `extensions/specialists/`, and `tests/`. The task packet's `allowedWriteSet` must cover all three paths.
