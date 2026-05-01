# AGENTS.md

Agent-agnostic guidance for any AI coding assistant working in this repository.

## What This Project Is

my-pi is a Pi package (pi.dev) that implements extension-powered multi-agent orchestration. It provides TypeScript extensions that enable an orchestrator to delegate work to specialized sub-agents with packet-based I/O and state-machine routing.

Agent definitions in `agents/` are the specs. TypeScript extensions in `extensions/` are the implementations.

Durable YAML authoring specs for specialists and teams now live under `specs/`, but current runtime authority still lives in TypeScript.

## Architecture

**Orchestrator-first control model.** Only the orchestrator has broad context by default. All downstream actors (specialists, teams, sequences) are narrow-by-default and work from task packets.

**Execution hierarchy:** specialists -> teams -> sequences (build lower layers before higher ones).

**Current specialist roster:** planner, builder, reviewer, tester, spec-writer, schema-designer, routing-designer, critic, boundary-auditor -- defined in `agents/specialists/`, implemented in `extensions/specialists/`.

**Packets carry execution state.** Task packets define what a specialist should do; result packets define what they did. Packet types and validation live in `extensions/shared/types.ts` and `extensions/shared/packets.ts`.

**State-machine routing** for teams: defined in team definitions, enforced by `extensions/shared/routing.ts`. Teams are opaque to the orchestrator -- send a TaskPacket in, get a ResultPacket out.

**I/O contracts** formalize what each specialist requires as input and guarantees as output. Contracts live on `SpecialistPromptConfig` and are validated by `extensions/shared/contracts.ts`.

## Core Principles

1. Build reusable primitives before one-off conveniences.
2. Prefer small, composable capabilities over monolithic systems.
3. Keep changes minimal, targeted, and reviewable.
4. Protect portability -- this repo should be safe to clone onto a new machine.
5. Build only what is needed. Do not add complexity unless it clearly improves speed, reliability, safety, or reuse.

## Development

```bash
make typecheck  # Type-check without emitting
make test       # Run tests (vitest)
make test-watch # Run tests in watch mode
```

## Branch Guard

Specialist Taxonomy Migration work (T-27 through T-34, or any task whose `NEXT_TASK.md` points into that phase) belongs on the `taxonomy-migration` branch. Before editing for that phase, run `git branch --show-current`; if you are not on `taxonomy-migration`, stop and report the mismatch before changing files.

If `taxonomy-migration` is not present in a fresh clone, fetch it with `git fetch origin taxonomy-migration` and check it out with `git switch --track origin/taxonomy-migration`. If it already exists locally, use `git switch taxonomy-migration`.

## Code Conventions

**Tests:** All tests use [vitest](https://vitest.dev/) -- `describe`, `it`, `expect`. Do NOT use `node:test` or `node:assert`. Test files live in `tests/` with the pattern `<name>.test.ts`. See any existing test (e.g., `tests/tokens.test.ts`) for the import pattern.

**Imports:** TypeScript files use `.js` extensions on relative imports (e.g., `import { foo } from "./bar.js"`). This applies to both source and test files.

**Formatting:** No explicit formatter configured. Match the style of surrounding code.

**Before finishing:** Any agent creating or modifying `.ts` files must run `make typecheck` and fix all errors before reporting success. If `make test` is available, run it too.

**Naming:** `working_style` (not `persona`) steers agent behavior. Agent definitions are markdown specs in `agents/`; extensions implement them in TypeScript.

## Key Conventions

- Contracts and packet validation are in TypeScript (`extensions/shared/`), not markdown docs
- Changes go in this repo (source of truth), not in Pi-managed directories
- No secrets, tokens, or machine-specific state in the repo

## Pi Package Structure

This repo is a Pi package (`package.json` with `pi` key):
- `extensions/` -- TypeScript extensions (orchestrator, specialists, shared types) -- **main build target**
- `specs/` -- durable YAML authoring/spec layer for specialists and teams; not runtime-loaded yet
- `artifacts/` -- runtime/session artifact root for team sessions and future per-run validation outputs
- `skills/` -- Pi skills (future)
- `prompts/` -- Pi prompts (future)
- `themes/` -- Pi themes

Supporting: `agents/` (definition specs), `docs/` (architectural reference), `tests/` (validation)

Stable config belongs under `specs/`; run-specific outputs belong under `artifacts/`. Current runtime authority still lives in TypeScript until future manifest loading is implemented.

## Gotchas

**Extension loading:** Only `extensions/orchestrator/index.ts`, `extensions/dashboard/index.ts`, and `extensions/panic/index.ts` are Pi extensions (they export default factory functions). Everything else under `extensions/` -- `shared/`, `specialists/`, `teams/`, `worklist/` -- are internal libraries imported by code. The `package.json` explicitly lists the three extension files to prevent Pi from trying to auto-discover and load library modules as extensions. Do not change `pi.extensions` back to `["./extensions"]` or add new entries without ensuring the file exports a valid Pi extension factory.

**Sub-agent CLI:** Pi's `--print` flag means "run once and exit" -- it does NOT produce JSON output. For structured JSONL event parsing, you must use `--mode json --print`. The system prompt uses `--system-prompt`, and the task prompt is a positional argument (not `-p`). See `extensions/shared/subprocess.ts` for the correct invocation.

**JSONL event parsing:** Pi delivers assistant content via `message_update` events (streamed incrementally), NOT in `message_end`. The `agent_end` event carries the full message history. The last JSONL line may lack a trailing newline. See `subprocess.ts` for the parser that handles all of this.

**Sub-agent teardown history:** Parent-task cancellation previously risked orphaning spawned specialist subprocesses. Stage 5a.6 implemented the panic and teardown fix; if you need teardown semantics or historical context, start with `docs/archive/design/PANIC_AND_TEARDOWN_DESIGN.md` and the current runtime implementation before assuming the old behavior still applies.

## Key Documents

| Document | Purpose |
|---|---|
| `INDEX.md` | Root bootstrap router for the repo |
| `docs/REPO_CONVENTIONS.md` | Repo navigation rules, index naming, and truthfulness conventions |
| `docs/LAYERED_ONBOARDING.md` | Durable reference for layered context initialization, role breadth, and factory-vs-run structure |
| `docs/_DOCS_INDEX.md` | Router for the docs tree |
| `docs/_IMPLEMENTATION_PLAN_INDEX.md` | Router for the staged implementation plan |
| `STATUS.md` | Current project state and queued work |
| `DECISION_LOG.md` | Durable project decisions (single source of truth) |
| `docs/IMPLEMENTATION_PLAN.md` | Staged build strategy and current roadmap |
| `docs/validation/METHODOLOGY.md` | Stage 5a.3 validation methodology, task index, and substrate verification checklist |
| `docs/PI_EXTENSION_API.md` | Pi extension API reference (tool registration, sub-agents, lifecycle) |
| `docs/UPSTREAM_PI_POLICY.md` | Policy for tracking upstream Pi changes, reviewing upgrades, and validating compatibility-sensitive updates |
| `docs/PROJECT_FOUNDATION.md` | Project vision and architectural boundaries |
| `docs/ORCHESTRATION_MODEL.md` | System vocabulary and hierarchy |
| `agents/AGENT_DEFINITION_CONTRACT.md` | Contract for agent definition structure |

## How to Implement the Next Stage

**Before broad documentation reads, route through `INDEX.md` and the nearest local index.** For staged work, start with `docs/_IMPLEMENTATION_PLAN_INDEX.md`, then read only the relevant section of `docs/IMPLEMENTATION_PLAN.md`, unless `NEXT_TASK.md` or a task-local plan points to a more specific staged plan such as `docs/design/ONBOARDING_IMPLEMENTATION_PLAN.md`.

- Read the full `docs/IMPLEMENTATION_PLAN.md` only when doing architecture-wide replanning, plan maintenance, cross-stage design work, or an explicitly requested full-plan review.
- If the implementation plan section already has detailed specs, **execute directly** rather than spending tokens on planning.
- If the plan is vague or leaves open questions, plan first to resolve them.
- Always check `STATUS.md` for the current state and `DECISION_LOG.md` for relevant decisions before starting.
- If the task touches Pi versions, package loading, extension lifecycle behavior, or spawned `pi` CLI behavior, also read `docs/UPSTREAM_PI_POLICY.md` before making compatibility-sensitive changes.

## Current Stage

See `STATUS.md` for live project state. The project follows a staged implementation plan (`docs/IMPLEMENTATION_PLAN.md`):

1. **Foundation and shared types** (complete)
2. **First specialist extension (builder)** (complete)
3. **Remaining specialists + orchestrator** (complete)
4. **Team routing and validation** (complete)
5. **Meta-teams and expansion** (5a.7 complete; onboarding side quest T-22–T-26 complete; T-10 live build-team validation parked; Specialist Taxonomy Migration phase active — T-28 is the current target, see `docs/handoff/NEXT_TASK.md`)
6. **Reflective expertise layer** (future)
7. **Command surface** (future)

## Key Source Files

### Shared infrastructure (`extensions/shared/`)
- `types.ts` -- Packet, agent, routing, and I/O contract type definitions
- `packets.ts` -- Packet creation and validation
- `routing.ts` -- State machine routing with iteration tracking and maxIterations guards
- `contracts.ts` -- I/O contract validation
- `hooks.ts` -- Hook registry, observer/policy dispatch, and global hook installer seam
- `tokens.ts` -- Token aggregation and threshold utilities
- `sandbox.ts` -- Deterministic policy envelopes and authority model
- `specialist-prompt.ts` -- System/task prompt construction with typed output templates
- `result-parser.ts` -- Structured output extraction from sub-agent responses
- `subprocess.ts` -- Pi sub-agent spawn and JSON event parsing

### Orchestrator (`extensions/orchestrator/`)
- `index.ts` -- Extension entry point, `orchestrate` tool registration (supports `delegationHint` and `teamHint`)
- `select.ts` -- Specialist selection (LLM-driven via explicit hints)
- `delegate.ts` -- Delegation lifecycle
- `synthesize.ts` -- Result synthesis from multiple specialist outputs

### Teams (`extensions/teams/`)
- `router.ts` -- Team state machine executor with revision loops and escalation
- `definitions.ts` -- Team registry and `build-team` exemplar

### Dashboard (`extensions/dashboard/`)
- `types.ts` -- Widget-local view models and dashboard session snapshot types
- `projections.ts` -- Pure widget projections from session artifacts and live runtime state
- `widget.ts` -- Compact line-array widget rendering
- `index.ts` -- Lifecycle reconstruction, hook observer wiring, and widget updates

### Specialists (`extensions/specialists/*/`)
- `prompt.ts` -- Specialist-specific prompt config with I/O contracts
- `index.ts` -- Extension entry point (uses `createSpecialistExtension` factory)
