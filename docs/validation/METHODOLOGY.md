# Stage 5a.3 — Validation Methodology

## Purpose

Stage 5a.3 validates the full orchestration stack by running the build-team on real implementation tasks. This is not a code-delivery stage — it is an **operational validation pass**. The deliverables are observations, bug fixes, and substrate iterations.

See Decision #36 and `docs/IMPLEMENTATION_PLAN.md` Stage 5a.3.

## Two-Layer Verification

Every task run is evaluated against two independent layers.

### Layer 1 — Task Verification

Did the build-team produce the correct output? Each task doc defines a **pre-written checklist** of concrete, checkable assertions. These are task-specific and must be evaluated after the run completes.

Examples: "file exists", "every exported type has JSDoc", "tests pass", "function returns expected format".

### Layer 2 — Substrate Verification

Did the orchestration infrastructure work correctly? This shared checklist applies to **every** task run, regardless of the task content.

| # | Check | What to look for |
|---|-------|-------------------|
| S1 | Token tracking | Token data captured for each specialist delegation. `TokenUsage` fields populated in delegation output and session artifacts. |
| S2 | Dashboard widget | Widget rendered during execution. Widget state updated at key lifecycle points (session start, delegation, state transition, session end). |
| S3 | Session artifacts | Delegation logs present and complete. `TeamSessionArtifact` has state traces, metrics, invocation summaries. No missing fields. |
| S4 | Hook events | Observer events fired in expected sequence. Payloads contain correct data (specialist ID, packet metadata, token totals). No unexpected failures in `HookRegistry.getFailures()`. |
| S5 | Sandbox enforcement | Policy envelopes applied to every delegation. Read-only specialists (7) get empty `allowedWritePaths`. Write specialists (builder, tester) get task-scoped paths. Forbidden glob violations caught. |
| S6 | Revision loops | If the team routing triggered a revision (critic rejects, retry), the loop is visible in session artifacts: iteration count incremented, multiple invocation summaries for the same state. |
| S7 | Error resilience | Hook/observer failures captured in `HookFailure` records without blocking execution. Policy dispatch failures don't crash the delegation. |

### Evaluation

For each check, record one of:
- **PASS** — observed and correct
- **FAIL** — observed and incorrect (log the issue)
- **N/A** — not applicable to this task (e.g., S6 if no revision loop occurred)
- **UNABLE** — could not observe (log why — e.g., widget not visible in headless mode)

## Execution Order

Tasks are organized into three tiers and executed sequentially within each tier:

**Tier 1 (low risk, basic validation):** Tasks 01, 02, 03
**Tier 2 (medium complexity, multi-specialist):** Tasks 04, 05, 06
**Tier 3 (high complexity, full build-team):** Tasks 07, 08

Run Tier 1 first. Fix any substrate issues discovered before proceeding to Tier 2. Tier 3 tasks are the real stress tests — they should only run after confidence from earlier tiers.

## Results Logging

After each task run, create a result file in `docs/validation/results/`:

```
RESULT_NN_<TASK_NAME>.md
```

For example: `RESULT_01_JSDOC.md`, `RESULT_04_CONTRACT_VALIDATION.md`.

### Result File Template

```markdown
# Result: Task NN — <Title>

**Date:** YYYY-MM-DD
**Duration:** approximate wall-clock time
**Build-team configuration:** (any non-default settings)

## Layer 1 — Task Verification

| # | Assertion | Result | Notes |
|---|-----------|--------|-------|
| T1 | <from task doc> | PASS/FAIL | |
| T2 | ... | ... | |

## Layer 2 — Substrate Verification

| # | Check | Result | Notes |
|---|-------|--------|-------|
| S1 | Token tracking | PASS/FAIL/N-A/UNABLE | |
| S2 | Dashboard widget | ... | |
| S3 | Session artifacts | ... | |
| S4 | Hook events | ... | |
| S5 | Sandbox enforcement | ... | |
| S6 | Revision loops | ... | |
| S7 | Error resilience | ... | |

## Bugs Found

- (list any substrate bugs discovered, with file:line if applicable)

## Substrate Iterations

- (list any fixes applied before re-running or moving to the next task)

## Observations

- (qualitative notes: what worked well, what was surprising, what needs attention)
```

## Exit Criteria (Stage 5a.3)

From `docs/IMPLEMENTATION_PLAN.md`:

- [ ] Build-team has completed at least one real implementation task end-to-end
- [ ] Token tracking data is being captured and displayed in the widget
- [ ] Session artifacts are complete and informative
- [ ] Any substrate bugs discovered have been fixed
- [ ] Confidence that the routing/contracts/delegation stack works in practice (not just tests)

## Task Index

| Task | Tier | Doc |
|------|------|-----|
| 01 — Add JSDoc to shared types | 1 | [TASK_01_JSDOC.md](TASK_01_JSDOC.md) |
| 02 — Test organization README | 1 | [TASK_02_TEST_README.md](TASK_02_TEST_README.md) |
| 03 — Format helpers for violations/thresholds | 1 | [TASK_03_FORMAT_HELPERS.md](TASK_03_FORMAT_HELPERS.md) |
| 04 — Contract validation test | 2 | [TASK_04_CONTRACT_VALIDATION.md](TASK_04_CONTRACT_VALIDATION.md) |
| 05 — Extract shared constants | 2 | [TASK_05_CONSTANTS.md](TASK_05_CONSTANTS.md) |
| 06 — Widget rendering snapshots | 2 | [TASK_06_WIDGET_SNAPSHOTS.md](TASK_06_WIDGET_SNAPSHOTS.md) |
| 07 — Build a new specialist | 3 | [TASK_07_NEW_SPECIALIST.md](TASK_07_NEW_SPECIALIST.md) |
| 08 — /dashboard command skeleton | 3 | [TASK_08_DASHBOARD_CMD.md](TASK_08_DASHBOARD_CMD.md) |
