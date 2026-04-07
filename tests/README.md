# Test Organization

This directory contains 41 test files covering the orchestration substrate, specialist extensions, team routing, observability, sandboxing, and validation layers in this project. The current suite contains 545+ tests and is organized below by subsystem so it is easier to find the right coverage area.

## Running the test suite

- `make test` — run the full Vitest suite once
- `make test-watch` — run Vitest in watch mode during development
- `npm test` — direct equivalent of `make test`
- `npm run test:watch` — direct equivalent of `make test-watch`

## Foundation: packets, routing, prompts, parsing, and contracts

- `packets.test.ts` — verifies task/result packet creation and packet validation rules.
- `routing.test.ts` — verifies state machine validation, transitions, loop tracking, and terminal-state helpers.
- `specialist-prompt.test.ts` — verifies shared specialist system/task prompt construction.
- `result-parser.test.ts` — verifies structured JSON result extraction from specialist output.
- `contracts.test.ts` — verifies input/output contract validation, compatibility checks, and context building.
- `validation-agents.test.ts` — verifies agent definition parsing and validation against real and synthetic specs.
- `validation-teams.test.ts` — verifies team definition validation, including member references and contract compatibility.

## Specialist extensions

### Core specialists

- `planner.test.ts` — verifies planner prompt config plus planner system/task prompt generation.
- `builder.test.ts` — verifies builder prompt config plus builder system/task prompt generation.
- `reviewer.test.ts` — verifies reviewer prompt config plus reviewer system/task prompt generation.
- `tester.test.ts` — verifies tester prompt config plus tester system/task prompt generation.

### Stage 5a specialists

- `spec-writer.test.ts` — verifies spec-writer prompt config plus spec-writing prompt generation.
- `schema-designer.test.ts` — verifies schema-designer prompt config plus schema design prompt generation.
- `routing-designer.test.ts` — verifies routing-designer prompt config plus routing design prompt generation.
- `critic.test.ts` — verifies critic prompt config plus critique/classification prompt generation.
- `boundary-auditor.test.ts` — verifies boundary-auditor prompt config plus boundary-audit prompt generation.

## Orchestrator selection, delegation, and synthesis

- `orchestrator-select.test.ts` — verifies explicit hints, auto-selection, multi-specialist ordering, and selection reasoning.
- `orchestrator-delegate.test.ts` — verifies specialist delegation behavior, error handling, and prompt-config lookup.
- `orchestrator-context.test.ts` — verifies selective context forwarding between planner, builder, reviewer, and tester.
- `orchestrator-synthesize.test.ts` — verifies final result synthesis, status aggregation, and summary composition.
- `orchestrator-e2e.test.ts` — verifies end-to-end orchestrator workflows with mocked specialist subprocesses.
- `orchestrator-team-e2e.test.ts` — verifies orchestrator delegation to opaque team primitives.
- `orchestrator-5a-integration.test.ts` — verifies Stage 5a additions such as new specialists, context forwarding, and primitive registry data.

## Teams, artifacts, and logging

- `team-router.test.ts` — verifies team state-machine execution, routing, loops, escalation, and errors.
- `session-artifact.test.ts` — verifies team session artifact construction, trace data, metrics, and outcomes.
- `logging.test.ts` — verifies logging helpers, null logger behavior, and deterministic team-version computation.
- `preflight.test.ts` — verifies pre-delegation contract checks before specialist subprocess spawn.

## Structured review and structured test outputs

- `review-findings.test.ts` — verifies parsing structured review verdicts/findings and synthesis behavior that consumes them.
- `test-findings.test.ts` — verifies parsing structured tester evidence and integration with the shared output parser.
- `adequacy.test.ts` — verifies semantic adequacy gates used to detect insufficient specialist output.

## Subprocess, hooks, tokens, and sandboxing

- `subprocess.test.ts` — verifies specialist subprocess spawning and JSON event parsing.
- `subprocess-hardening.test.ts` — verifies malformed output recovery, escalation handling, empty output, and no state leakage across runs.
- `hooks.test.ts` — verifies hook registration, policy dispatch, observer dispatch, installer wiring, and error isolation.
- `hooks-integration.test.ts` — verifies runtime hook emission across integrated execution paths.
- `tokens.test.ts` — verifies token aggregation, threshold checking, and threshold-percentage helpers.
- `model-routing.test.ts` — verifies specialist model resolution precedence across runtime, project, specialist, and host defaults.
- `sandbox.test.ts` — verifies authority envelopes, path checks, forbidden globs, and spawn-record generation.

## Dashboard and worklist substrate

- `dashboard-projections.test.ts` — verifies dashboard projection logic that derives widget state from live artifacts and runtime data.
- `dashboard-widget.test.ts` — verifies compact widget rendering plus reconstruction/live-update behavior.
- `worklist.test.ts` — verifies worklist creation, item lifecycle transitions, blockers, summaries, and serialization.
- `worklist-interop.test.ts` — verifies orchestrator/worklist integration and artifact coordination.

## Notes

- The suite intentionally mixes unit tests, integration-style tests with mocked subprocesses, and artifact/projection tests.
- `tests/fixtures/mock-subprocess.ts` is a helper fixture used by some tests, but it is not itself a test file.
- If you are new to the codebase, a good reading order is: `packets.test.ts` → `routing.test.ts` → `contracts.test.ts` → orchestrator tests → team/worklist/dashboard tests.
