# IMPLEMENTATION_PLAN.md

## Purpose

This document defines the staged implementation plan for building my-pi as an extension-powered orchestration system.

It translates the architectural vision from `docs/PROJECT_FOUNDATION.md` into an ordered build strategy focused on TypeScript Pi extensions.

Live execution state belongs in `STATUS.md`. This document defines the sequence and exit criteria, not daily progress.

---

## Planning doctrine

1. **Walk before run.** Specialists before teams, teams before sequences, shared types before extensions.
2. **Contracts before convenience.** TypeScript interfaces and validation before automation.
3. **Expand only from proven exemplars.** Prove each abstraction with one implementation before generalizing.
4. **Stable lower layers before higher layers.** Do not build teams until specialists work, do not build sequences until teams work.

---

## Stage overview

1. Foundation and shared types
2. First specialist extension (builder)
3. Remaining specialists + orchestrator
   - 3a: Extract shared specialist infrastructure
   - 3b: Remaining specialists (planner, reviewer, tester)
   - 3c: Orchestrator extension
   - 3c.1: Selective context forwarding
   - 3d: Integration and end-to-end validation
4. Team routing and validation
   - 4a: I/O contracts and typed deliverables
   - 4b: Team definition format and router
   - 4c: Schema validation
   - 4d: Observability
5. Meta-teams and self-expansion
   - 5a: Bootstrap specialists (spec-writer, critic)
   - 5b: Specialist-creator team (first meta-team)
   - 5c: Team-creator team
   - 5d: Sequence definition and execution
   - 5e: Sequence-creator team
   - 5f: Seed-creator team
   - 5g: Dynamic selection and discovery
   - 5h: Escalation and retry
6. Slash commands and interactive workflows
   - 6a: `/plan` command
   - 6b: `/next` command
   - 6c: `/specialist` command

---

# Stage 1 — Foundation and Shared Types

## Purpose

Establish the TypeScript foundation that all extensions share.

## Key deliverables

- `tsconfig.json` configured for Pi extension development
- `extensions/shared/types.ts` — TypeScript interfaces:
  - `TaskPacket`: task objective, allowed files, acceptance criteria, context boundaries
  - `ResultPacket`: outcome, deliverables, status, escalation info
  - `AgentDefinition`: mirrors the agent definition contract fields
  - `SpecialistConfig`: specialist-specific configuration
  - `TeamDefinition`: member specialists, state transitions, entry/exit conditions
- `extensions/shared/packets.ts` — Packet creation, validation, serialization:
  - `createTaskPacket()`, `createResultPacket()`
  - `validatePacket()` — runtime type checking
- `extensions/shared/routing.ts` — State machine routing utilities:
  - State machine definition types
  - Transition validation
  - Packet-at-transition validation
- Basic tests for packet validation and routing

## Exit criteria

- Can programmatically create typed packets and validate them
- State machine can be defined and transitions validated
- TypeScript compiles cleanly
- Tests pass

## Status

**Complete.** All Stage 1 deliverables implemented and tested (39 tests).

## Dependencies

- Pi extension API reference: see `docs/PI_EXTENSION_API.md`

---

# Stage 2 — First Specialist Extension (Builder)

## Purpose

Prove the specialist extension pattern with one concrete implementation.

## Why builder first

The builder is the most concrete specialist — it takes files and makes changes. If delegation works for the builder, it will work for the others.

## Key deliverables

- `extensions/specialists/builder/index.ts` — A Pi extension that:
  - Registers a `delegate-to-builder` tool
  - Accepts a TaskPacket (objective, allowed files, acceptance criteria)
  - Launches an isolated Pi sub-agent process
  - Injects the builder's working style and constraints from `agents/specialists/builder.md`
  - Returns a structured ResultPacket
- Tests for builder delegation round-trip

## Exit criteria

- Can invoke `delegate-to-builder` with a task packet
- Builder sub-agent respects its scope constraints (narrow context, bounded read set)
- Receives a structured result packet back
- Error/escalation cases are handled

## Status

**Complete.** Builder extension implemented with 4-module pattern (prompt, result-parser, subprocess, index). 26 tests.

## Dependencies

- Stage 1 complete (shared types available) ✓
- Pi sub-agent spawning pattern: see `docs/PI_EXTENSION_API.md` (sub-agent spawning section)

---

# Stage 3 — Remaining Specialists + Orchestrator

## Purpose

Complete the specialist layer and build the orchestrator that selects and delegates.

Stage 3 is broken into sub-stages to keep each task manageable for a single agent session.

---

## Stage 3a — Extract Shared Specialist Infrastructure

### Purpose

The builder's 4-module pattern (prompt, result-parser, subprocess, index) is reusable. Before building three more specialists, extract the generic parts into `extensions/shared/` so each new specialist is thin glue over shared infrastructure.

### Key deliverables

- `extensions/shared/subprocess.ts` — Extracted from builder. Specialist-agnostic sub-agent spawn, JSON event parsing, timeout/abort handling.
- `extensions/shared/result-parser.ts` — Extracted from builder. Generic structured JSON extraction from sub-agent output.
- `extensions/shared/specialist-prompt.ts` — Generic `buildSpecialistSystemPrompt(config)` and `buildSpecialistTaskPrompt(task)` that accept working style config as input rather than hardcoding builder values.
- Refactor builder to use shared modules (no behavior change, verify with existing tests).
- Tests for shared modules.

### Exit criteria

- Builder still passes all 26 tests after refactor
- Shared modules are independently tested
- Adding a new specialist requires only: a prompt config object + a thin index.ts

### Implementation Notes (pre-resolved design decisions)

**Result structure: Uniform.** All specialists return the same `ResultPacket` fields (`status`, `summary`, `deliverables`, `modifiedFiles`, `escalation`). Specialist-specific data goes in `deliverables` as strings. This matches the existing `ResultPacket` interface in `extensions/shared/types.ts` — no type changes needed.

**Prompt config shape.** `buildSpecialistSystemPrompt(config)` accepts:
```typescript
interface SpecialistPromptConfig {
  id: string;           // e.g. "specialist_builder"
  name: string;         // e.g. "Builder"
  role: string;         // e.g. "Execute bounded implementation tasks within explicit scope"
  workingStyle: WorkingStyle;  // from extensions/shared/types.ts
  constraints: string[];       // specialist-specific constraints
  outputFields?: string[];     // any specialist-specific JSON fields to add to output format
}
```
The shared prompt builder renders these into the system prompt template. The builder passes its values explicitly; future specialists pass theirs.

**Function naming.** Extracted functions:
- `spawnBuilderAgent()` → `spawnSubAgent()` (in `extensions/shared/subprocess.ts`)
- `parseBuilderOutput()` → `parseSpecialistOutput()` (in `extensions/shared/result-parser.ts`)
- `ParsedBuilderResult` → `ParsedSpecialistResult` (same file)

**Test organization: Dedicated files.** New test files matching the existing pattern:
- `tests/subprocess.test.ts` — tests the shared subprocess spawner
- `tests/result-parser.test.ts` — tests the shared result parser
- `tests/specialist-prompt.test.ts` — tests the shared prompt builder

Existing `tests/builder.test.ts` keeps builder-specific prompt tests and integration tests, but imports from shared modules after refactor.

**Extraction approach.** Move code first, update imports, verify builder tests still pass, then add shared tests. The builder's `prompt.ts` stays in `extensions/specialists/builder/` as a thin wrapper that calls the shared `buildSpecialistSystemPrompt()` with builder-specific config.

### Dependencies

- Stage 2 complete ✓

---

## Stage 3b — Remaining Specialists (Planner, Reviewer, Tester)

### Purpose

Implement the three remaining specialists following the proven pattern.

### Key deliverables

- `extensions/specialists/planner/index.ts` — Registers `delegate-to-planner`. Accepts a task, returns a structured plan. Planner-specific prompt config encoding working style from `agents/specialists/planner.md`.
- `extensions/specialists/reviewer/index.ts` — Registers `delegate-to-reviewer`. Accepts artifacts, returns structured review findings. Reviewer-specific prompt config from `agents/specialists/reviewer.md`.
- `extensions/specialists/tester/index.ts` — Registers `delegate-to-tester`. Accepts verification task, returns structured test results. Tester-specific prompt config from `agents/specialists/tester.md`.
- Tests for each specialist (prompt config, integration with shared infra).

### Exit criteria

- All four `delegate-to-*` tools register successfully
- Each specialist's system prompt encodes its definition's working style and constraints
- Tests pass for all specialists

### Dependencies

- Stage 3a complete (shared infrastructure available)

---

## Stage 3c — Orchestrator Extension

### Purpose

Build the orchestrator that selects and delegates to specialists.

### Key deliverables

- `extensions/orchestrator/index.ts` — The orchestrator extension:
  - Reads current project state
  - Selects appropriate specialist(s) for a task
  - Packages task packets with narrowed context
  - Collects and synthesizes results
  - Implements delegation modes: direct specialist and multi-specialist
- Tests for orchestrator delegation logic and result synthesis

### Exit criteria

- Orchestrator can delegate to any specialist via tool invocation
- Orchestrator packages task packets with narrowed context (not full repo)
- Orchestrator synthesizes results from specialist(s) into a coherent response
- Tests cover: specialist selection, packet construction, result synthesis, error propagation

### Implementation Notes (pre-resolved design decisions)

**Orchestrator is structurally different from specialists.** Specialists register a single tool (`delegate-to-X`) that the LLM calls. The orchestrator is the *caller* of those tools — it selects which specialist(s) to invoke and manages the delegation lifecycle. The orchestrator extension registers its own tool(s) and uses the shared infrastructure directly.

**Tool registration: `orchestrate` tool.** The orchestrator registers a single tool named `orchestrate` (or `orchestrate-task`). The LLM calls this tool with a high-level task description. Inside, the orchestrator selects specialist(s), constructs task packets, spawns sub-agents, and synthesizes results. Parameters should include:
- `task`: string — what needs to be done
- `relevantFiles`: string[] — files related to the task
- `delegationHint`: optional string — "planner" | "reviewer" | "builder" | "tester" | "auto" — lets the caller suggest which specialist(s) to use, with "auto" as default

**Specialist selection strategy: keep it simple for Stage 3c.** The orchestrator does NOT need an LLM-based selection step. Use a straightforward approach:
- If `delegationHint` names a specific specialist, use that specialist
- If `delegationHint` is "auto" or omitted, use keyword/heuristic matching on the task description (e.g., "plan" → planner, "review" → reviewer, "implement"/"build"/"fix" → builder, "test"/"validate"/"verify" → tester)
- Multi-specialist: if the task clearly spans multiple specialists, delegate sequentially and feed results forward
- The selection logic should be a separate pure function (`selectSpecialists`) for testability

**How the orchestrator invokes specialists: use shared infrastructure directly.** The orchestrator imports specialist prompt configs and shared modules:
```typescript
import { PLANNER_PROMPT_CONFIG } from "../specialists/planner/prompt.js";
import { BUILDER_PROMPT_CONFIG } from "../specialists/builder/prompt.js";
// ... etc.
import { buildSpecialistSystemPrompt, buildSpecialistTaskPrompt } from "../shared/specialist-prompt.js";
import { spawnSpecialistAgent } from "../shared/subprocess.js";
import { parseSpecialistOutput } from "../shared/result-parser.js";
import { createTaskPacket, createResultPacket, validateTaskPacket } from "../shared/packets.js";
```
It constructs task packets, builds prompts from the specialist's config, spawns sub-agents via `spawnSpecialistAgent()`, and parses results via `parseSpecialistOutput()`. This reuses the exact same delegation lifecycle as `specialist-extension.ts` but driven by the orchestrator instead of a registered tool handler.

**Context narrowing.** The orchestrator narrows context by:
- Setting `allowedReadSet` and `allowedWriteSet` on the task packet based on `relevantFiles`
- Not passing the full repo — only files relevant to the task
- The specialist's system prompt already enforces scope constraints

**Multi-specialist delegation: sequential with result forwarding.** When multiple specialists are needed:
1. Run them sequentially (planner first, then reviewer, then builder, then tester — following the natural workflow order)
2. Each subsequent specialist receives prior results in the task packet's `context` field
3. If any specialist returns `failure` or `escalation`, stop the chain and return the error

**Result synthesis.** The orchestrator's return value should be an `AgentToolResult` containing:
- A human-readable text summary synthesizing all specialist results
- A `details` object containing: all individual `ResultPacket`s, the list of specialists invoked, and overall status
- Overall status: `success` only if all specialists succeeded; `partial` if some succeeded; `failure` if the critical specialist failed; `escalation` if any specialist escalated

**File structure.** The orchestrator is more complex than a specialist and warrants multiple modules:
- `extensions/orchestrator/index.ts` — extension entry point, tool registration
- `extensions/orchestrator/select.ts` — `selectSpecialists(task, hint)` pure function
- `extensions/orchestrator/delegate.ts` — `delegateToSpecialist(config, taskPacket, signal)` — wraps the spawn/parse cycle
- `extensions/orchestrator/synthesize.ts` — `synthesizeResults(results[])` — combines multiple ResultPackets into a summary

**Test organization.**
- `tests/orchestrator-select.test.ts` — specialist selection logic (keyword matching, hint handling, edge cases)
- `tests/orchestrator-delegate.test.ts` — delegation lifecycle (packet construction, spawn mocking, error handling)
- `tests/orchestrator-synthesize.test.ts` — result synthesis (single result, multi-result, mixed statuses, escalation)

**What the orchestrator does NOT do in Stage 3c:**
- No team routing (Stage 4)
- No sequence execution (Stage 4+)
- No LLM-based specialist selection (keep it heuristic)
- No `STATUS.md` or `DECISION_LOG.md` updates (those are orchestrator-agent behaviors, not extension behaviors)
- No reading of project state files — the *extension* receives task info from the LLM; the *LLM* reads project state

### Status

**Complete.** Orchestrator extension implemented with 4-module pattern (select, delegate, synthesize, index). 41 tests. See `STATUS.md` for details.

### Dependencies

- Stage 3b complete (all specialists available) ✓

---

## Stage 3c.1 — Selective Context Forwarding

### Purpose

Replace the current "pass all prior ResultPackets" approach with selective context forwarding. Each downstream specialist receives only the fields it needs from prior results, not full ResultPackets with metadata.

### Why this matters

In a 4-specialist chain, the current approach passes O(n²) context — the tester receives 3 full ResultPackets including tracing fields (`id`, `taskId`, `createdAt`, `sourceAgent`) it doesn't need. This wastes ~40-50% of context tokens. See Decision #15 in `DECISION_LOG.md`.

### Key deliverables

- `buildContextForSpecialist(specialistId, priorResults)` function in `extensions/orchestrator/delegate.ts`
- Updated orchestrator `index.ts` to use selective forwarding
- Tests for context mapping

### Implementation Notes (pre-resolved design decisions)

**Context mapping per specialist type:**
- **Planner:** No prior context (always first in chain) — return `undefined`
- **Builder:** `{ planSummary: string, planDeliverables: string[] }` extracted from planner's ResultPacket (if present)
- **Reviewer:** `{ modifiedFiles: string[], implementationSummary: string }` extracted from builder's ResultPacket (if present)
- **Tester:** `{ modifiedFiles: string[], implementationSummary: string }` extracted from builder's ResultPacket (if present)

If a specialist's expected prior isn't present (e.g., builder runs without planner), return `undefined` — don't pass an empty context object.

**This is a tactical step toward Stage 4 I/O contracts.** The mapping function will be replaced by formal contract validation in Stage 4a. For now, it's a simple switch-case over specialist type.

### Exact changes required

**Files to modify (2):**

1. **`extensions/orchestrator/delegate.ts`** — Add a new exported function:

```typescript
/**
 * Build selective context for a specialist from prior results.
 * Each specialist type receives only the fields it needs.
 * Returns undefined if no relevant context exists.
 */
export function buildContextForSpecialist(
  specialistId: SpecialistId,
  priorResults: ResultPacket[]
): Record<string, unknown> | undefined
```

Implementation: switch on `specialistId`. For each case, find the relevant prior result by `sourceAgent` field (e.g., look for `sourceAgent === "specialist_planner"` when building context for builder). Extract only the needed fields. Return `undefined` if the expected prior result isn't present.

Lookup helpers — use these to find specific prior results:
- `priorResults.find(r => r.sourceAgent === "specialist_planner")` → planner result
- `priorResults.find(r => r.sourceAgent === "specialist_builder")` → builder result

Field extraction from ResultPacket:
- `summary` → use as `planSummary` or `implementationSummary`
- `deliverables` → use as `planDeliverables`
- `modifiedFiles` → pass through as `modifiedFiles`

2. **`extensions/orchestrator/index.ts`** — Change one line (line 91):

```typescript
// BEFORE (current):
context: priorResults.length > 0 ? { priorResults } : undefined,

// AFTER:
context: buildContextForSpecialist(specialistId, priorResults),
```

Add import of `buildContextForSpecialist` from `./delegate.js`.

**Files to create (1):**

3. **`tests/orchestrator-context.test.ts`** — Tests for `buildContextForSpecialist()`:
   - Planner always gets `undefined` (even with prior results)
   - Builder gets `{ planSummary, planDeliverables }` when planner result exists
   - Builder gets `undefined` when no planner result exists
   - Reviewer gets `{ modifiedFiles, implementationSummary }` when builder result exists
   - Reviewer gets `undefined` when no builder result exists
   - Tester gets `{ modifiedFiles, implementationSummary }` when builder result exists
   - Tester gets `undefined` when no builder result exists
   - No full ResultPacket objects appear in any returned context

**Testing pattern:** Use `createResultPacket()` from `extensions/shared/packets.ts` to build mock prior results. No subprocess mocking needed — this is a pure function test.

**No other files need to change.** The existing 159 tests should continue to pass since the orchestrator-delegate tests mock `spawnSpecialistAgent` and don't inspect context forwarding. The orchestrator-select and orchestrator-synthesize tests are unaffected.

### Exit criteria

- Context passed to each specialist contains only relevant fields
- No specialist receives full ResultPackets in context
- All 159 existing tests pass (no regressions)
- New context mapping tests pass
- Context does not grow O(n²) with chain length

### Status

**Complete.** `buildContextForSpecialist()` added to `delegate.ts`, orchestrator updated to use selective forwarding. 14 new tests in `tests/orchestrator-context.test.ts`. All 173 tests pass.

### Dependencies

- Stage 3c complete ✓

---

## Stage 3d — Integration and End-to-End Validation

### Purpose

Validate the full orchestration chain works end-to-end via integration tests with mocked subprocesses. These tests exercise the orchestrator's `execute()` function in `extensions/orchestrator/index.ts` as an integrated whole — the unit tests in 3c tested each module in isolation.

### Key deliverables

- `tests/orchestrator-e2e.test.ts` — Integration tests covering all scenarios below
- Documentation updates (`STATUS.md`, this file)

### Test scenarios

**Full workflow integration tests:**

1. **2-specialist success (planner → builder):** Mock `child_process.spawn` to return success from both. Call `orchestrate` tool with task "plan and implement the feature", `relevantFiles: ["src/index.ts"]`. Verify: planner invoked first with `allowedWriteSet: []`, builder invoked second with planner context forwarded and `allowedWriteSet: ["src/index.ts"]`, synthesized result is `status: "success"` with both summaries.

2. **3-specialist success (planner → builder → tester):** All three succeed. Verify context forwarding at each step and final synthesis.

3. **Mid-chain failure (planner succeeds, builder fails):** Verify: chain stops after builder, tester never invoked, synthesized status is `"partial"`, planner's success result preserved alongside builder's failure.

4. **Escalation stops chain (planner escalates):** Planner returns `status: "escalation"` with `{ reason: "scope ambiguous", suggestedAction: "clarify requirements" }`. Verify: no subsequent specialists invoked, synthesized status is `"escalation"`, escalation details preserved.

5. **Reviewer rejection (planner → reviewer, reviewer fails):** Reviewer returns `status: "failure"`. Verify chain stops, synthesized status is `"partial"`.

**Context forwarding tests:**

6. Builder's task packet `context` contains relevant planner output (after 3c.1: only `planSummary` and `planDeliverables`, not full ResultPacket).
7. Tester's task packet `context` contains builder's `modifiedFiles` and `summary`.
8. First specialist (planner) receives no `context` field.

**Boundary enforcement tests** (verify packet structure, not LLM behavior):

9. Read-only specialists (planner, reviewer) receive `allowedWriteSet: []`.
10. Write specialists (builder, tester) receive `allowedWriteSet` matching `relevantFiles`.
11. Each specialist's task packet has `targetAgent` matching the specialist's config ID (e.g., `specialist_builder`).

**Error handling tests:**

12. Subprocess spawn throws → failure result returned, chain stops.
13. Subprocess exits non-zero with no output → failure packet includes stderr.
14. Malformed specialist output (no JSON block) → `status: "partial"` in result.

### Implementation Notes (pre-resolved design decisions)

#### How to invoke the orchestrator's `execute()` in tests

The orchestrator's `execute()` function is defined inline inside `pi.registerTool()` in `extensions/orchestrator/index.ts`. To call it in tests, you must:

1. **Mock the Pi `ExtensionAPI`** — create a fake `pi` object that captures the registered tool
2. **Import and call the extension** — `orchestratorExtension(mockPi)` which triggers `pi.registerTool()`
3. **Extract the captured tool's `execute` method** — then call it directly

```typescript
// Step 1: Create a mock Pi API that captures the registered tool
let capturedTool: any;
const mockPi = {
  registerTool: (config: any) => { capturedTool = config; },
  // Add other methods as stubs if needed (none are currently used by the orchestrator)
};

// Step 2: Import and invoke the extension to register the tool.
// IMPORTANT: Use vi.doMock() + dynamic import to get the module with mocked child_process.
const { default: orchestratorExtension } = await import("../extensions/orchestrator/index.js");
orchestratorExtension(mockPi as any);

// Step 3: Call execute directly
const result = await capturedTool.execute(
  "test-call-id",             // toolCallId
  {                            // params (OrchestrateParamsType)
    task: "plan and implement the feature",
    relevantFiles: ["src/index.ts"],
    delegationHint: "auto",   // or omit for auto
  },
  undefined,                   // signal (AbortSignal | undefined)
  undefined,                   // onUpdate callback
  {} as any,                   // ctx (ExtensionContext — not used by orchestrator)
);

// result is AgentToolResult<unknown> with .content and .details
expect(result.details.overallStatus).toBe("success");
```

#### How to mock `child_process.spawn` with per-specialist responses

The mock needs to return different outputs depending on which specialist is being spawned. The specialist is identified by the **system prompt** passed to `spawnSpecialistAgent()`, which ultimately calls `child_process.spawn("pi", ["--print", "-s", systemPrompt, "-p", taskPrompt])`. The system prompt contains the specialist's ID (e.g., `"specialist_planner"`, `"specialist_builder"`).

Use this pattern (same as `tests/subprocess.test.ts`):

```typescript
import { EventEmitter } from "events";
import { Readable } from "stream";

// Helper: create a mock child process that emits a Pi JSON event stream
function createMockChild(jsonOutput: Record<string, unknown>) {
  const child = new EventEmitter() as any;
  child.stdout = new Readable({ read() {} });
  child.stderr = new Readable({ read() {} });
  child.kill = vi.fn();

  // Emit the response asynchronously (must be async so spawn returns first)
  setTimeout(() => {
    const event = JSON.stringify({
      type: "message_end",
      message: {
        role: "assistant",
        content: [{ type: "text", text: "```json\n" + JSON.stringify(jsonOutput) + "\n```" }],
      },
    });
    child.stdout.push(event + "\n");
    child.stdout.push(null);
    child.stderr.push(null);
    child.emit("close", 0);
  }, 10);

  return child;
}

// Helper: build a mock spawn function that routes by specialist
function createSpecialistMockSpawn(responses: Record<string, Record<string, unknown>>) {
  return vi.fn().mockImplementation((_cmd: string, args: string[]) => {
    const systemPrompt = args[2]; // args = ["--print", "-s", systemPrompt, "-p", taskPrompt]

    // Determine which specialist is being spawned by checking the system prompt
    for (const [specialistKey, output] of Object.entries(responses)) {
      if (systemPrompt.includes(specialistKey)) {
        return createMockChild(output);
      }
    }

    // Fallback: unknown specialist
    return createMockChild({ status: "failure", summary: "Unknown specialist", deliverables: [], modifiedFiles: [] });
  });
}
```

Usage in a test:

```typescript
it("2-specialist success: planner → builder", async () => {
  const mockSpawn = createSpecialistMockSpawn({
    specialist_planner: {
      status: "success",
      summary: "Plan: add handler and tests",
      deliverables: ["step-1: create handler", "step-2: add tests"],
      modifiedFiles: [],
    },
    specialist_builder: {
      status: "success",
      summary: "Implemented handler and tests",
      deliverables: ["Added handler"],
      modifiedFiles: ["src/index.ts"],
    },
  });

  vi.doMock("child_process", () => ({ spawn: mockSpawn }));

  // Must re-import everything after mocking child_process
  const { default: orchestratorExtension } = await import("../extensions/orchestrator/index.js");
  let capturedTool: any;
  orchestratorExtension({ registerTool: (c: any) => { capturedTool = c; } } as any);

  const result = await capturedTool.execute("call-1", {
    task: "plan and implement the feature",
    relevantFiles: ["src/index.ts"],
  }, undefined, undefined, {} as any);

  expect(result.details.overallStatus).toBe("success");
  expect(result.details.specialistsInvoked).toHaveLength(2);
  expect(mockSpawn).toHaveBeenCalledTimes(2);
});
```

**CRITICAL:** Because `vi.doMock()` + `await import()` is used, each test must call `vi.restoreAllMocks()` and `vi.resetModules()` in `beforeEach` to ensure clean imports.

#### Capturing task packets to verify context forwarding and boundary enforcement

To verify what task packets were constructed for each specialist, capture the `systemPrompt` and `taskPrompt` arguments from the mock spawn:

```typescript
// After the test runs, inspect mockSpawn.mock.calls
const calls = mockSpawn.mock.calls;
// calls[0] = first specialist spawn: [cmd, args, options]
// calls[0][1][4] = taskPrompt (args = ["--print", "-s", systemPrompt, "-p", taskPrompt])
const firstTaskPrompt = calls[0][1][4];
const secondTaskPrompt = calls[1][1][4];

// The task prompt is built by buildSpecialistTaskPrompt() in extensions/shared/specialist-prompt.ts
// It contains the task packet fields in a structured text format.
// Check for context forwarding:
expect(secondTaskPrompt).toContain("planSummary");  // builder got planner's summary
expect(firstTaskPrompt).not.toContain("Additional context");  // planner got no context

// Check boundary enforcement:
expect(firstTaskPrompt).toContain("Allowed write set: (none)");  // planner is read-only
expect(secondTaskPrompt).toContain("Allowed write set: src/index.ts");  // builder gets write access
```

#### Error handling mock patterns

For subprocess errors, configure the mock differently:

```typescript
// Spawn throws (test scenario 12):
vi.fn().mockImplementation(() => { throw new Error("ENOENT"); });

// Non-zero exit with no output (test scenario 13):
createMockChild but with: child.emit("close", 1) and no stdout data, stderr.push("out of memory")

// Malformed output (test scenario 14):
Same as createMockChild but push plain text instead of JSON event:
child.stdout.push("I did some work but forgot the JSON\n");
```

#### File structure

Single test file: `tests/orchestrator-e2e.test.ts`

Organize tests in `describe` blocks matching the categories above:
- `describe("full workflow integration")`
- `describe("context forwarding")`
- `describe("boundary enforcement")`
- `describe("error handling")`

All share the same `beforeEach` with `vi.restoreAllMocks()` and `vi.resetModules()`, and the same helper functions (`createMockChild`, `createSpecialistMockSpawn`).

#### Key files to read before implementing

| File | Why |
|------|-----|
| `extensions/orchestrator/index.ts` | The `execute()` function being tested end-to-end |
| `extensions/orchestrator/delegate.ts` | `delegateToSpecialist()` + `buildContextForSpecialist()` — the delegation lifecycle |
| `extensions/orchestrator/select.ts` | `selectSpecialists()` — keyword matching that determines which specialists run |
| `extensions/orchestrator/synthesize.ts` | `synthesizeResults()` — how results are combined |
| `extensions/shared/subprocess.ts` | `spawnSpecialistAgent()` — what gets mocked (calls `child_process.spawn`) |
| `extensions/shared/specialist-prompt.ts` | `buildSpecialistTaskPrompt()` — how task packets become prompt text |
| `tests/subprocess.test.ts` | Reference mock pattern for `child_process.spawn` |
| `tests/orchestrator-delegate.test.ts` | Reference mock pattern for `vi.doMock` + dynamic import |

### What "respects definition boundaries" means

Boundary enforcement is tested at the **packet level**, not the LLM level. We verify that:
- The orchestrator constructs packets with correct `allowedReadSet`/`allowedWriteSet` for each specialist type
- Read-only specialists cannot receive write permissions
- Each specialist receives the correct `targetAgent` ID
- System prompts contain the specialist's constraints and anti-patterns

We do NOT test that an LLM sub-agent follows its prompt instructions — that's a property of the LLM, not the extension code.

### Exit criteria

- All integration test scenarios above pass
- Tests exercise the full code path from `orchestrate` tool entry to synthesized result
- Error cases propagate correctly (failure/escalation stop the chain)
- Context forwarding delivers only relevant data to each specialist (after 3c.1)
- All 173 existing tests still pass (no regressions)
- Update `STATUS.md` checklist and this file's status

### Dependencies

- Stage 3c.1 complete (selective context forwarding) ✓

---

# Stage 4 — Team Routing and Validation

## Purpose

Introduce teams as composed specialist sequences with state-machine routing, formalize I/O contracts for all primitives, and add validation infrastructure.

## Core design principle: Standardized I/O contracts

Every primitive (specialist, team, sequence) declares an **input contract** (what it requires in its TaskPacket) and an **output contract** (what it guarantees in its ResultPacket). See Decision #14 in `DECISION_LOG.md`.

Teams are **opaque to the orchestrator** — the orchestrator sends a team-level TaskPacket and receives a team-level ResultPacket. Intra-team communication is the team's responsibility. The orchestrator only evaluates the outcome. This ensures token efficiency and composability.

---

## Stage 4a — I/O Contracts and Typed Deliverables

### Purpose

Formalize what each primitive requires as input and guarantees as output. This replaces the current generic `deliverables: string[]` with typed schemas.

### Key deliverables

- `InputContract` and `OutputContract` types in `extensions/shared/types.ts`
- Each specialist declares its contract (what its `deliverables` field actually contains):
  - **Planner output:** `{ steps: string[], dependencies: string[], risks: string[] }`
  - **Builder output:** `{ modifiedFiles: string[], changeDescription: string }`
  - **Reviewer output:** `{ findings: string[], approved: boolean, blockers: string[] }`
  - **Tester output:** `{ passed: boolean, evidence: string[], failures: string[] }`
- Contract validation function: given specialist A's output and specialist B's input contract, verify compatibility
- Output templates: each specialist receives its expected output schema in its system prompt so it knows exactly what shape to produce

### Exit criteria

- Every specialist has a declared input and output contract
- Contracts are machine-checkable at transition points
- Output templates reduce ambiguity in specialist responses

### Status

**Complete.** `ContractField`, `InputContract`, `OutputContract` types added. All 4 specialists declare typed input/output contracts. `extensions/shared/contracts.ts` provides validation and context building. Typed output templates render in system prompts. 20 new tests in `tests/contracts.test.ts`.

### Dependencies

- Stage 3d complete ✓

---

## Stage 4b — Team Definition Format and Router

### Purpose

Enable reusable multi-specialist collaboration patterns as first-class primitives.

### Key deliverables

- Team definition format (TypeScript interface): members, state transitions, entry/exit contracts, I/O contract for the team as a whole
- **Extended state machine** (see Decision #21):
  - **Loop transitions** with `maxIterations` guard — enables revision cycles (e.g., critique → revise → critique). When iterations exhaust, the team escalates.
  - **Fan-out states** — dispatch to multiple specialists, collect all results before transitioning. Enables patterns like "critic reviews spec and schema."
- Team router: reads a team definition, executes the extended state machine, routes packets between specialists, validates contracts at each transition
- Teams are **opaque to orchestrator**: orchestrator sends team-level TaskPacket, receives team-level ResultPacket
- Intra-team context passing governed by I/O contracts (Stage 4a), not raw result forwarding
- **Intra-team revision loops** (see Decision #23): when critic/reviewer identifies issues, the team router sends critique back to the original author. Critic success transitions forward; critic partial/failure loops back to the author for revision.
- **Critic context** (see Decision #22): when reviewing an artifact, the critic receives relevant upstream context (e.g., the plan summary when reviewing a spec) via its input contract.
- Exemplar team: `build-team` (planner → reviewer → builder → tester), demonstrating linear flow with a review gate
- Orchestrator can delegate to a named team via the existing `orchestrate` tool (new delegation mode)

### Implementation Notes (pre-resolved design decisions)

**Extended `TransitionDefinition` type.** Add an optional `maxIterations` field to loop edges:

```typescript
interface TransitionDefinition {
  on: PacketStatus;
  to: string;
  maxIterations?: number;  // For loop edges — escalate when exhausted
}
```

**Fan-out state type.** A new optional field on `StateDefinition`:

```typescript
interface StateDefinition {
  agent: string;              // For regular states
  agents?: string[];          // For fan-out states — dispatch to all, collect results
  transitions: TransitionDefinition[];
  fanOutJoin?: "all" | "any"; // How to aggregate fan-out results
}
```

Fan-out states dispatch to all listed agents, collect results, then aggregate (all-must-succeed or any-success-proceeds) before transitioning. This is a **future addition** — the initial 4b implementation focuses on loop transitions. Fan-out is deferred until a concrete team definition requires it.

**Revision loop example (specialist-creator team):**

```
write_spec → critique_spec → (success → design_schema | partial → write_spec)
```

The `critique_spec → write_spec` edge has `maxIterations: 3`. After 3 revision cycles without success, the team escalates.

**DAG model as future evolution.** If the extended state machine proves limiting for complex dependency graphs between parallel branches, a DAG-based routing model is the natural evolution path. Not needed now — the state machine handles linear, branching, and loop patterns.

### Exit criteria

- Orchestrator can delegate to a named team
- Team executes its state machine correctly, including revision loops
- Loop transitions respect `maxIterations` and escalate when exhausted
- Team returns a single ResultPacket (not individual specialist results)
- Invalid contracts and transitions fail with clear errors

### Status

**Complete.** Extended state machine with `maxIterations` guards and iteration tracking. Team router (`extensions/teams/router.ts`) executes state machines with revision loops. `build-team` exemplar defined in `extensions/teams/definitions.ts`. Orchestrator gains `teamHint` parameter for team delegation. Fan-out is type stubs only (deferred). 15 new tests across `tests/team-router.test.ts` and `tests/orchestrator-team-e2e.test.ts`. All 230 tests pass.

### Dependencies

- Stage 4a complete ✓

---

## Stage 4c — Schema Validation

### Purpose

Make all primitive definitions machine-checkable for correctness and consistency.

### Key deliverables

- Agent definition validator: `.md` specs in `agents/` match the expected structure from `AGENT_DEFINITION_CONTRACT.md`
- Packet validation at runtime (existing) + contract validation at transitions (new from 4a)
- Team definition validation: members exist, state machine is valid, contracts are compatible
- `validate` command or test suite that checks all of the above

### Three-level team testing doctrine

Team tests should cover three distinct levels:

1. **State-machine correctness** — deterministic orchestration: valid transitions occur, invalid transitions are rejected, terminal states reached correctly, retry/loop guards enforced, unreachable states stay unreachable
2. **Contract-level task success** — the team produces correct outputs for representative inputs: required deliverables present, output matches team contract, team terminates for the right reason, produced artifacts are usable by downstream consumers
3. **Session quality** — workflow efficiency: no unnecessary loops, reasonable transition counts for task class, downstream specialists don't repeatedly catch predictable upstream mistakes

This is testing guidance, not new infrastructure — existing vitest patterns suffice. Level 1 tests should resemble workflow-engine tests with controlled inputs. Levels 2-3 use representative task suites.

### Exit criteria

- Agent definition validator catches malformed specs
- Contract validator catches incompatible transitions
- Validation can run as part of CI/test suite
- Team tests cover all three levels (correctness, task success, session quality)

### Dependencies

- Stage 4b complete (team definitions exist to validate)

---

## Stage 4d — Observability

### Purpose

Add execution logging, pre-flight validation, and structured team session artifacts to support debugging, auditability, and future evaluation.

### Key deliverables

- Execution logging via `pi.appendEntry()`: audit trail for each delegation event (who delegated, to whom, what packet, what result)
- Pre-flight validation: before delegating, check that task packet meets specialist's input contract requirements
- **Team Session Artifact** — a structured record emitted at the end of each team execution, containing:
  - **Session metadata:** session id, timestamp, team name, team version, starting/ending state, termination reason
  - **State trace:** ordered list of visited states with per-transition source, target, reason, guard outcomes, retry/loop counts
  - **Specialist invocation summary:** per-specialist identity, invocation order, bounded input/output summaries, contract status, latency/token usage if available
  - **Outcome summary:** final status (success/failure/escalation/decline), validation results, whether human intervention occurred
  - **Lightweight metrics:** total transitions, loop count, retry count, total latency, per-specialist latency, total token usage, per-specialist token usage, revision count
- **Failure reason taxonomy** — session artifacts should distinguish among: task failure, contract violation, policy refusal, scope mismatch, retry exhaustion, missing artifact, validation failure, escalation
- **Team version identity** — every session artifact records the precise team definition version used, enabling future version-to-version comparison
- Artifacts should prefer bounded summaries over raw transcript capture (raw transcripts gated behind optional debug mode if ever needed)

### Exit criteria

- Delegation events are logged and inspectable
- Malformed task packets are caught before subprocess spawn
- Team router emits a structured session artifact at completion
- Session artifacts include state trace, metrics, and outcome summary
- Failure reasons are categorized, not generic

### Dependencies

- Stage 4a complete (contracts needed for pre-flight validation)
- Stage 4b complete (team router exists to emit artifacts)

---

# Stage 5 — Meta-Teams and Self-Expansion

## Purpose

Build the system's ability to create new primitives through its own orchestration. The progression is: bootstrap specialists → specialist-creator team → team-creator team → sequences → sequence-creator → seed-creator. Each layer validates the one below before building the one above.

See Decisions #16, #17, #19, and #20 in `DECISION_LOG.md`.

---

## Stage 5a — Bootstrap Specialists

### Purpose

Manually build five new specialists required before the specialist-creator team can function. These fill reasoning-posture gaps that the original four specialists cannot cover. See Decision #20 for the full roster rationale.

### New specialists

Each specialist has a distinct reasoning posture — the test for inclusion is whether its cognitive mode cannot be achieved by prompting another specialist differently.

**1. Spec-writer** — Writes prose specifications: agent definitions, boundary definitions, working style design, "what this does NOT do" framing. Reasoning posture: **exhaustive enumeration and boundary-first thinking**.
- Distinct from planner (thinks in steps, not boundaries) and builder (thinks in code, not specs)

**2. Schema-designer** — Defines all typed structures: TypeScript types, packet shapes, I/O contracts, invariants, failure modes, output templates, validation constraints. Reasoning posture: **formal type design** — "what are the exact shapes, invariants, and failure modes?"
- Distinct from spec-writer (prose specs, not TypeScript types) and builder (implements types, doesn't design them)
- Named "schema-designer" (not "contract-writer") because scope covers types, packets, contracts, templates, and validation shapes — not just contracts. Pairs with routing-designer as a fellow design-time specialist.

**3. Routing-designer** — Designs state machine routing definitions for teams: states, allowed transitions, entry/exit conditions, escalation states, invalid-transition behavior. Reasoning posture: **state enumeration and transition completeness** — "what states exist, what transitions are valid, what's unreachable?"
- Distinct from builder (would implement routing as side effect, not an inspectable design artifact)
- Output is a design artifact that gets reviewed before runtime code exists

**4. Critic** — Broad evaluative lens: is this well-designed? Redundant? Could it be simpler? More efficient? The right abstraction? Reasoning posture: **adversarial evaluation** — finding what's wrong, wasteful, or unnecessary. Also responsible for reuse scouting (searching existing primitives before approving new creation). Functions as the **quality reviewer** in the compliance/quality review split: evaluates design soundness, proportional complexity, unnecessary abstractions, and structural weaknesses.
- Distinct from reviewer (pass/fail on acceptance criteria, not big-picture evaluation)

**5. Boundary-auditor** — Inspects designs for access control violations: excess context exposure, undeclared assumptions, overly broad permissions, hidden routing authority, packet fields that violate minimal-context intent. Reasoning posture: **control philosophy enforcement**.
- Distinct from critic (checks design quality) and reviewer (checks deliverable correctness)
- This is the specialist that enforces the project's narrow-by-default doctrine

### Key deliverables

For each of the five new specialists:
- Agent definition markdown in `agents/specialists/`
- TypeScript extension following the existing factory pattern (`createSpecialistExtension`)
- Prompt config with working style, constraints, anti-patterns
- Tests

Additionally:
- Register all five in the orchestrator's `select.ts` (keyword matching) and `delegate.ts` (config map)
- Update `buildContextForSpecialist()` if any need specific prior-result fields

### Compliance vs. quality review split

With the full 9-specialist roster, review responsibility is formally split between two specialists:

- **Reviewer** (existing) operates as a **compliance reviewer**: did the work satisfy its contract? Were required artifacts produced? Does output match the expected schema? Were validation steps completed? This is pass/fail gatekeeping against specific acceptance criteria.
- **Critic** (new, above) operates as a **quality reviewer**: is the design sound? Is complexity proportional to the problem? Are there unnecessary abstractions or redundancies? Does the solution introduce unjustified debt?

Compliance review should precede quality review — there's no point evaluating design elegance if the deliverable doesn't meet its contract. In team state machines, this means the reviewer gate typically comes before the critic gate, or the reviewer handles compliance while the critic handles a separate quality pass.

### Deferred specialists (revisit later)

- **Registry-curator** — manage admission metadata, canonical naming, lifecycle state. Better handled by tooling until primitive count exceeds ~15-20. Revisit when 5g (discovery) is operational.
- **Doc-sync auditor** — compare contracts, routing definitions, and stable docs for drift. Valuable once creator teams generate primitives faster than humans review. Revisit when self-expansion is operational.

### Exit criteria

- All five specialists register, delegate, and return structured results
- Orchestrator can select and invoke them
- All existing tests still pass
- Full 9-specialist roster operational

### Dependencies

- Stage 4a complete (I/O contracts — so the new specialists have typed contracts from the start)

---

## Stage 5b — Specialist-Creator Team

### Purpose

The first meta-team. Its output is a fully working new specialist: agent definition markdown, TypeScript extension, prompt config, and tests.

### Roster

All 9 specialists available. Typical creation workflow uses a subset:

### Workflow

1. **Planner** — designs the creation workflow for the candidate specialist
2. **Spec-writer** — writes the agent definition, working style, constraints, boundary framing
3. **Schema-designer** — writes the I/O contracts, packet types, validation constraints
4. **Routing-designer** — (if the new specialist participates in teams) designs routing integration
5. **Critic** — evaluates: is this specialist warranted? Does it overlap? Is the scope right? Reuse search.
6. **Boundary-auditor** — checks for excess context exposure, permission violations
7. **Builder** — implements the TypeScript extension, prompt config, factory integration
8. **Reviewer** — pass/fail on the deliverable against the spec
9. **Tester** — validates the specialist works end-to-end

Not every creation needs every specialist — the planner decides which are relevant.

### Key deliverables

- Specialist-creator team definition (state machine, member roster, I/O contracts)
- Governed creation: new specialists validated against existing ones for overlap (critic), boundary compliance (boundary-auditor), schema (4c) before activation
- At least one specialist successfully created by the team as proof

### Exit criteria

- Creator team can produce a working specialist end-to-end
- Output includes: agent definition `.md`, TypeScript extension, prompt config, tests
- New specialists are validated (no redundancy, passes schema checks, boundary-compliant)

### Dependencies

- Stage 5a complete (spec-writer and critic available)
- Stage 4b complete (team infrastructure)
- Stage 4c complete (schema validation for new primitives)

---

## Stage 5c — Team-Creator Team

### Purpose

A meta-team that creates new teams by selecting members, defining state machines, and validating I/O contracts.

### Key deliverables

- Team-creator team: define team purpose → select member specialists → define state machine transitions → validate contracts → test
- Can compose any existing specialists (including those created by 5b)
- Governed creation: new teams validated against I/O contracts before activation

### Exit criteria

- Creator team can produce a working team definition end-to-end
- At least one team successfully created by the team as proof

### Dependencies

- Stage 5b complete (specialist-creator proven)

---

## Stage 5d — Sequence Definition and Execution

### Purpose

Enable multi-stage workflows that compose teams and specialists with ordering, parallel branches, and merge points.

### Key deliverables

- Sequence definition format: ordered stages, parallel branches, merge/synthesis points, stop conditions
- Sequence engine: execute stages, validate I/O contracts between stages
- Each stage's output contract must satisfy the next stage's input contract (same principle as teams)
- **Stage handoff artifact** — structured record produced at the end of each sequence stage, containing: what was done, what changed in the repo, validation evidence, unresolved issues, explicit next tasks, risks and cautions, readiness signal for the next stage. This allows fresh-context execution across stages — a new executor can pick up from a handoff artifact without needing prior session history.
- **Blocker artifact** — structured record when a stage cannot complete: failure category (missing dependency, environment issue, unclear requirement, failed validation, plan infeasibility), evidence, minimum remediation path, whether human decision is required, whether the sequence can continue around the blocker
- **Sequence checkpoint** — optional review boundary between stages where human approval can be required. Checkpoints freeze progress, gather validation evidence, assess success criteria, and determine whether the next stage is ready. Checkpoints should be explicit in the sequence definition, not improvised midstream.

### Exit criteria

- Sequences can compose teams and specialists across multiple stages
- I/O contracts validated at each stage boundary
- Stop conditions and merge points work correctly
- Stage handoff artifacts emitted at each stage boundary
- Blocker artifacts emitted when stages fail (not silent failure)
- Sequence checkpoints support human review gates

### Dependencies

- Stage 4b complete (teams available as sequence building blocks)
- Stage 4d complete (session artifacts provide the structured-record patterns that handoff/blocker artifacts extend)

---

## Stage 5e — Sequence-Creator Team

### Purpose

A meta-team that creates new sequence definitions by composing teams and specialists into multi-stage workflows.

### Key deliverables

- Sequence-creator team: define sequence purpose → select stages → validate contracts at boundaries → test
- Governed creation with validation at each stage boundary

### Exit criteria

- Creator team can produce a working sequence definition end-to-end

### Dependencies

- Stage 5d complete (sequence infrastructure)
- Stage 5c complete (team-creator pattern proven)

---

## Stage 5f — Seed-Creator Team

### Purpose

A meta-team that creates seeds — reusable bootstrap context packs for setting up project repos. Seeds include `SEED.md` instructions and template files. Can target fresh repos, forked repos, or non-project use cases.

See Decision #19 and existing seed infrastructure in `skills/seed/`.

### Roster

Likely the same as specialist-creator: planner + spec-writer + builder + critic + reviewer + tester.

### Workflow

1. **Planner** — designs what the seed covers, target audience, prerequisites
2. **Spec-writer** — writes the `SEED.md` (instructions, template manifest, expected output structure)
3. **Builder** — creates the template files in `templates/` subdirectory
4. **Critic** — evaluates scope, overlap with existing seeds, completeness
5. **Reviewer** — pass/fail on the deliverable
6. **Tester** — validates the seed works when applied to a target repo

### Exit criteria

- Creator team can produce a working seed end-to-end
- At least one seed successfully created by the team as proof

### Dependencies

- Stage 5b complete (specialist-creator proven — same pattern)
- Existing seed infrastructure in `skills/seed/` functional

---

## Stage 5g — Dynamic Selection and Discovery

### Purpose

Replace hardcoded specialist selection with dynamic, capability-aware routing.

### Key deliverables

- Discovery service: index available specialists, teams, and sequences at load time, expose via query
- LLM-based specialist selection: replace keyword heuristics in `select.ts` with capability analysis
- Runtime tool management: `getActiveTools()`/`setActiveTools()` to scope available tools per task context (disable irrelevant specialists based on task type)

### Exit criteria

- Orchestrator discovers available primitives dynamically
- Selection adapts to available capabilities rather than hardcoded mappings

### Dependencies

- Stage 4b complete (teams must be discoverable)

---

## Stage 5h — Escalation and Retry

### Purpose

Handle escalation as a workflow event, not just a terminal status.

### Key deliverables

- Escalation re-try handler: when a specialist escalates requesting broader context, orchestrator expands scope and re-invokes
- Session persistence: carry orchestration state across sessions via `appendEntry()`

### Exit criteria

- Escalation-driven context expansion works end-to-end
- Orchestration state survives session boundaries

### Dependencies

- Stage 4d complete (logging infrastructure)

---

# Stage 6 — Slash Commands and Interactive Workflows

## Purpose

Provide user-facing entry points for orchestrated work. These commands operate at a higher level than individual specialists — the orchestrator decides which primitives to invoke.

See Decision #17 in `DECISION_LOG.md`.

---

## Stage 6a — `/plan` Command

### Purpose

Interactive planning session where the user describes goals, the agent helps refine them, and then the orchestrator executes using available primitives.

### Key deliverables

- Register `/plan` via `pi.registerCommand()`
- Interactive planning flow: gather requirements → select primitives → build execution plan → confirm with user → orchestrate
- Plan output stored in repo (e.g., `plans/` directory or structured format) for resumability via `/next`

### Exit criteria

- User can invoke `/plan`, discuss goals interactively, and trigger orchestrated execution
- Plan state is persisted in the repo

### Dependencies

- Stage 4d complete (observability for tracking execution)
- Orchestrator functional (Stage 3d+)

---

## Stage 6b — `/next` Command

### Purpose

Resume an existing plan. The orchestrator reads plan state from the repo and executes the next set of tasks.

### Key deliverables

- Register `/next` via `pi.registerCommand()`
- Plan discovery: find active plan in repo, determine what's been completed, identify next steps
- Orchestrate next steps using available primitives
- Update plan state after execution (mark completed, note failures/escalations)

### Exit criteria

- User can invoke `/next` to continue a previously created plan
- Plan state is updated after execution

### Dependencies

- Stage 6a complete (plans must exist to resume)

---

## Stage 6c — `/specialist` Command

### Purpose

Interactive session to discuss whether a new specialist is needed. Evaluates the gap, checks for redundancy, and delegates to the specialist-creator team if approved.

### Key deliverables

- Register `/specialist` via `pi.registerCommand()`
- Discussion flow: what gap does this specialist fill? → check existing specialists for overlap → propose spec → user approval → delegate to creator team (5b)

### Exit criteria

- User can invoke `/specialist` to discuss and optionally create a new specialist
- Redundancy checks prevent overlapping specialists

### Dependencies

- Stage 5b complete (specialist-creator team)

---

## Notes

Stages 5–6 are intentionally sketched at a higher level than Stages 1–4. Their details should be informed by real experience from earlier stages. Do not over-design before the lower layers are proven.

---

## Explicitly deferred work

- Host-platform realization decisions (only when justified by actual needs)
- Coordinator-agent design for complex teams
- Public package decomposition

---

## Cross-stage dependency chain

```
Stage 1 (types)
  → Stage 2 (builder)
    → Stage 3a (shared infra) → 3b (specialists) → 3c (orchestrator) → 3c.1 (context) → 3d (integration)
      → Stage 4a (I/O contracts) → 4b (teams) → 4c (validation) → 4d (observability)
        → Stage 5a (bootstrap: spec-writer + critic)
          → Stage 5b (specialist-creator team) → 5c (team-creator team)
        → Stage 5d (sequences) → 5e (sequence-creator team)
        → Stage 5f (seed-creator team) [depends on 5b]
        → Stage 5g (discovery)
        → Stage 5h (escalation)
          → Stage 6a (/plan) → 6b (/next)
          → Stage 6c (/specialist) [depends on 5b]
```

Stages within the same level can be parallelized where dependencies allow. Do not skip stages.
