# IMPLEMENTATION_PLAN.md

> Routing note: Do not read this file end-to-end for routine work. Start with `docs/_IMPLEMENTATION_PLAN_INDEX.md`, identify the smallest relevant stage or section, and read only that portion of this document. Full-plan reads are for architecture-wide replanning, implementation-plan maintenance, cross-stage design decisions, or explicit user instruction.

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
   - 4e: Substrate hardening (structured review findings, model routing, worklist)
5. Meta-teams and self-expansion
   - 5a: Bootstrap specialists (spec-writer, schema-designer, routing-designer, critic, boundary-auditor)
   - 5a.1: Token tracking substrate (with threshold semantics)
   - 5a.1b: Hook substrate
   - 5a.1c: Deterministic sandboxing and path protection
   - 5a.2: Dashboard substrate + persistent widget
   - 5a.3: Build-team validation on real tasks (specialist chains)
   - 5a.6: Panic and teardown — run registry, abort propagation, `/panic` command (Decision #43, BLOCKING)
   - 5a.3b: Team state machine end-to-end validation
   - 5a.3c: Tester specialist role redesign (test author, not runner — Decision #40)
   - 5a.3d: Specialist invocation patterns (verified build, parallel scout — Decision #41)
   - 5a.3e: Orchestrator observability: live token logging and per-specialist cost surfacing
   - 5a.4: `/dashboard` command (detailed inspector) — priority bumped for real-time orchestration monitoring
   - 5b: Specialist-creator team (first meta-team)
   - 5c: Team-creator team
   - 5d: Sequence definition and execution
   - 5e: Sequence-creator team
   - 5f: Seed-creator team
   - 5g: Dynamic selection and discovery
   - 5h: Escalation and retry
   - 5i: Task relay and handoff system
   - 5j: Context-aware self-respawn
6. Reflective expertise layer
   - 6a: Expertise types and registry
   - 6b: Context loader and runtime injection
   - 6c: Governance pipeline
   - 6d: Local expertise pilot
7. Command surface (commands emerge from real usage; see Decision #17)

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
- Team definition validator: members exist, state machine is valid, contracts are compatible at transitions
- Validation test suite that checks all of the above (CI-checkable via `make test`)

### Implementation Notes (pre-resolved design decisions)

**Approach: test-based validation.** Validators are library functions in `extensions/shared/validation.ts`. They are exercised by test files that load actual definitions from the repo. No separate CLI command or Pi-registered command — validation runs as part of `make test`. This follows the existing pattern where `routing.ts` has `validateStateMachine()` exercised by `tests/routing.test.ts`.

**Agent definition validator.** Parse markdown files from `agents/specialists/` and validate against the structure in `AGENT_DEFINITION_CONTRACT.md`. The validator should check:

1. **Required sections present:** Definition, Intent, Working Style, Routing and access, Inputs and outputs, Control and escalation, Validation, Relationships, Authority flags, Specialist-specific fields
2. **Required fields within sections:** Each section has expected fields per the contract. For specialists: `id`, `name`, `definition_type`, `purpose`, `scope`, `non_goals`, `routing_class`, `context_scope`, `required_inputs`, `expected_outputs`, `specialization`, `task_boundary`, `deliverable_boundary`, `failure_boundary`
3. **`working_style` completeness:** For specialists, `working_style` must contain `reasoning_posture`, `communication_posture`, `risk_posture`, `default_bias`, `anti_patterns`
4. **Value validation:** `routing_class` must be `downstream` for specialists, `definition_type` must be `specialist`, `can_delegate` must be `false`
5. **Non-empty required fields:** `purpose`, `scope`, `specialization` should not be empty strings

**Markdown parsing approach.** Agent definitions use a consistent structure: `## Section Name` headers with `- \`field_name\`: value` entries. The parser should:
- Split by `## ` to find sections
- Within sections, extract `\`field_name\`` entries
- For list fields (like `scope`, `non_goals`, `anti_patterns`), recognize indented sub-items
- Return a structured object that can be validated against expected fields

```typescript
interface ParsedAgentDefinition {
  sections: Record<string, ParsedSection>;
  rawContent: string;
}

interface ParsedSection {
  name: string;
  fields: Record<string, string | string[]>;
}

function parseAgentDefinition(markdown: string): ParsedAgentDefinition;
function validateAgentDefinition(parsed: ParsedAgentDefinition, definitionType: DefinitionType): string[];
```

**Team definition validator.** Validate `TeamDefinition` objects from `extensions/teams/definitions.ts`. The validator should check:

1. **Member existence:** All `members` IDs should correspond to known specialist IDs. The validator takes a list of known specialist IDs as a parameter (not hardcoded). For 4c, the known list comes from the four existing specialist prompt configs.
2. **State machine structural validity:** Already handled by `validateStateMachine()` in `routing.ts` — reuse that function.
3. **Agent references in states:** Every `state.agent` in the state machine should be either a member specialist ID or `"orchestrator"` (for terminal states). Flag unknown agent references.
4. **Contract compatibility at transitions:** For each non-terminal transition `A → B`, check that the output contract of the specialist in state A is compatible with the input contract of the specialist in state B using `contractsCompatible()` from `contracts.ts`. This requires a mapping from specialist ID → prompt config (to access contracts).
5. **Entry/exit contract consistency:** The team's `entryContract` should be satisfiable by the task the orchestrator sends. The team's `exitContract` should be producible by the terminal state's preceding specialist.

```typescript
interface TeamValidationContext {
  knownSpecialistIds: string[];
  specialistContracts: Record<string, { input: InputContract; output: OutputContract }>;
}

function validateTeamDefinition(team: TeamDefinition, context: TeamValidationContext): string[];
```

**File structure:**

| File | Purpose |
|------|---------|
| `extensions/shared/validation.ts` | `parseAgentDefinition()`, `validateAgentDefinition()`, `validateTeamDefinition()` |
| `tests/validation-agents.test.ts` | Test agent definition validator against actual `.md` files in `agents/specialists/` + synthetic bad definitions |
| `tests/validation-teams.test.ts` | Test team definition validator against `BUILD_TEAM` + synthetic bad team definitions |

**Test scenarios for agent definition validator:**

Valid cases:
- All four existing specialist definitions (`builder.md`, `planner.md`, `reviewer.md`, `tester.md`) pass validation

Invalid cases (synthetic):
- Missing `## Working Style` section → error
- Missing `purpose` field in Intent → error
- Empty `specialization` field → error
- Wrong `routing_class` value (e.g., `orchestrator` for a specialist) → error
- Missing `anti_patterns` in working_style → error

**Test scenarios for team definition validator:**

Valid cases:
- `BUILD_TEAM` passes validation (with known specialist IDs from the four existing specialists)

Invalid cases (synthetic):
- Team references a non-existent specialist ID in `members` → error
- State machine references an agent not in `members` (and not `"orchestrator"`) → error
- Transition from state A to state B where A's output contract is incompatible with B's input contract → error
- State machine with structural errors (validated by existing `validateStateMachine()`) → error

**What this stage does NOT do:**
- Does not validate orchestrator definitions (only one exists, and its structure differs significantly from specialists)
- Does not validate sequence definitions (Stage 5d, not yet implemented)
- Does not add runtime pre-flight validation (that's Stage 4d)
- Does not require new Makefile targets (`make test` already runs all tests)

### Three-level team testing doctrine

Team tests should cover three distinct levels:

1. **State-machine correctness** — deterministic orchestration: valid transitions occur, invalid transitions are rejected, terminal states reached correctly, retry/loop guards enforced, unreachable states stay unreachable
2. **Contract-level task success** — the team produces correct outputs for representative inputs: required deliverables present, output matches team contract, team terminates for the right reason, produced artifacts are usable by downstream consumers
3. **Session quality** — workflow efficiency: no unnecessary loops, reasonable transition counts for task class, downstream specialists don't repeatedly catch predictable upstream mistakes

This is testing guidance, not new infrastructure — existing vitest patterns suffice. Level 1 tests should resemble workflow-engine tests with controlled inputs. Levels 2-3 use representative task suites.

**For 4c specifically:** Level 1 is the primary focus — the team validator and its tests prove state-machine correctness for `BUILD_TEAM` and synthetic malformed teams. Levels 2-3 are deferred to later stages when more teams exist and representative task suites can be built.

### Key files to read before implementing

| File | Why |
|------|-----|
| `agents/AGENT_DEFINITION_CONTRACT.md` | Defines expected structure for agent definition `.md` files |
| `agents/specialists/builder.md` | Exemplar of a well-formed specialist definition (reference for parser) |
| `extensions/shared/types.ts` | `TeamDefinition`, `InputContract`, `OutputContract`, `StateMachineDefinition` types |
| `extensions/shared/contracts.ts` | `contractsCompatible()` — reuse for transition contract checks |
| `extensions/shared/routing.ts` | `validateStateMachine()` — reuse for structural state machine validation |
| `extensions/teams/definitions.ts` | `BUILD_TEAM` — the exemplar team definition to validate |
| `extensions/specialists/*/prompt.ts` | `*_PROMPT_CONFIG` — contain `inputContract`/`outputContract` for each specialist |
| `tests/contracts.test.ts` | Reference for contract validation test patterns |
| `tests/routing.test.ts` | Reference for state machine validation test patterns |

### Exit criteria

- Agent definition validator catches malformed specs (missing sections, missing fields, wrong values)
- Team definition validator catches: unknown members, unknown state agents, incompatible contracts at transitions, structural state machine errors
- All four existing specialist definitions pass validation
- `BUILD_TEAM` passes validation
- All existing tests still pass (no regressions)
- Validation runs as part of `make test`

### Dependencies

- Stage 4b complete (team definitions exist to validate) ✓

---

## Stage 4d — Observability [COMPLETE]

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

### Implementation Notes (pre-resolved design decisions)

**Three workstreams.** Stage 4d has three distinct deliverables that can be implemented in order:
1. Execution logging (delegation audit trail)
2. Pre-flight contract validation (catch bad inputs before spawning)
3. Team session artifacts (structured execution records)

---

#### Workstream 1: Execution Logging

**Approach: injectable logger.** Logging is implemented via a `DelegationLogger` interface that `delegateToSpecialist()` and `executeTeam()` accept as an optional parameter. In production, the orchestrator passes a logger backed by `pi.appendEntry()`. In tests, no logger is passed (or a mock is used). This avoids coupling shared library code to the Pi runtime.

```typescript
// extensions/shared/logging.ts

export type LogLevel = "info" | "warn" | "error";

export interface DelegationLogEntry {
  timestamp: string;
  level: LogLevel;
  event: DelegationEvent;
  sourceAgent: string;
  targetAgent: string;
  /** Task packet ID */
  taskId: string;
  /** Result status (only present for completion/failure events) */
  status?: PacketStatus;
  /** Bounded summary (not full packet) */
  summary?: string;
  /** Failure reason category (only for failures) */
  failureReason?: FailureReason;
}

export type DelegationEvent =
  | "delegation_start"      // About to delegate to specialist
  | "delegation_complete"   // Specialist returned result
  | "delegation_error"      // Specialist failed to start or crashed
  | "preflight_fail"        // Pre-flight validation rejected task packet
  | "team_start"            // Team execution beginning
  | "team_state_transition" // State machine advanced
  | "team_complete"         // Team execution finished
  | "team_loop_exhausted";  // Revision loop hit maxIterations

export interface DelegationLogger {
  log(entry: DelegationLogEntry): void;
}

/** No-op logger for tests and environments without Pi runtime */
export const NULL_LOGGER: DelegationLogger = {
  log() {},
};

/**
 * Create a logger backed by pi.appendEntry().
 * Called once in the orchestrator extension's execute() function.
 */
export function createPiLogger(pi: { appendEntry(type: string, data?: unknown): void }): DelegationLogger {
  return {
    log(entry: DelegationLogEntry) {
      pi.appendEntry("delegation_log", entry);
    },
  };
}
```

**Where logging hooks in:**

1. `delegateToSpecialist()` in `extensions/orchestrator/delegate.ts` — accepts optional `logger?: DelegationLogger` in `DelegationInput`. Logs `delegation_start` before spawning, `delegation_complete` or `delegation_error` after.

2. `executeTeam()` in `extensions/teams/router.ts` — accepts optional `logger?: DelegationLogger` parameter. Logs `team_start` at entry, `team_state_transition` on each advance, `team_complete` at end, `team_loop_exhausted` on exhaustion. Passes logger through to `delegateToSpecialist()` calls within the team.

3. `orchestratorExtension()` in `extensions/orchestrator/index.ts` — creates a `createPiLogger(pi)` once and passes it to `delegateToSpecialist()` and `delegateToTeam()` calls. `delegateToTeam()` forwards it to `executeTeam()`.

**Signature changes:**

```typescript
// delegate.ts
export interface DelegationInput {
  promptConfig: SpecialistPromptConfig;
  taskPacket: TaskPacket;
  signal?: AbortSignal;
  logger?: DelegationLogger;  // NEW
}

export async function delegateToTeam(input: {
  teamId: string;
  taskPacket: TaskPacket;
  signal?: AbortSignal;
  logger?: DelegationLogger;  // NEW
}): Promise<DelegationOutput>

// router.ts
export async function executeTeam(
  team: TeamDefinition,
  taskPacket: TaskPacket,
  signal?: AbortSignal,
  logger?: DelegationLogger,  // NEW
): Promise<TeamExecutionResult>
```

---

#### Workstream 2: Pre-flight Contract Validation

**Approach: validate input contract before subprocess spawn.** Before each `delegateToSpecialist()` call, check that the task packet's `context` satisfies the specialist's `inputContract` using `validateInputContract()` from `contracts.ts`.

**Where it hooks in:** Inside `delegateToSpecialist()` in `delegate.ts`, after building prompts (step 1) but before spawning the subprocess (step 2). If validation fails, return a failure ResultPacket immediately without spawning — and log a `preflight_fail` event if a logger is present.

```typescript
// In delegateToSpecialist(), new step between prompt building and spawn:

// 1.5 Pre-flight contract validation
if (promptConfig.inputContract) {
  const preflightErrors = validateInputContract(
    taskPacket.context as Record<string, unknown> | undefined,
    promptConfig.inputContract
  );
  if (preflightErrors.length > 0) {
    logger?.log({
      timestamp: new Date().toISOString(),
      level: "error",
      event: "preflight_fail",
      sourceAgent: taskPacket.sourceAgent,
      targetAgent: agentId,
      taskId: taskPacket.id,
      summary: `Pre-flight validation failed: ${preflightErrors.join("; ")}`,
      failureReason: "contract_violation",
    });
    const failurePacket = createResultPacket({
      taskId: taskPacket.id,
      status: "failure",
      summary: `Pre-flight validation failed for ${promptConfig.roleName}: ${preflightErrors.join("; ")}`,
      deliverables: [],
      modifiedFiles: [],
      sourceAgent: agentId,
    });
    return { resultPacket: failurePacket, success: false };
  }
}
```

**Important:** Existing specialists have only optional input contract fields (all `required: false`), so pre-flight validation will pass for current specialists. The guard becomes meaningful in Stage 5a when new specialists may declare required input fields.

---

#### Workstream 3: Team Session Artifacts

**Approach: `executeTeam()` builds and returns a `TeamSessionArtifact`.** The artifact is constructed inside `executeTeam()` as the state machine runs, then included in the `TeamExecutionResult`. The orchestrator can then log it via `pi.appendEntry()`.

```typescript
// extensions/shared/types.ts — new types

export type FailureReason =
  | "task_failure"          // Specialist returned failure status
  | "contract_violation"    // Input/output contract check failed
  | "policy_refusal"       // Specialist declined the task
  | "scope_mismatch"       // Task outside specialist's declared boundary
  | "retry_exhaustion"     // Loop maxIterations reached
  | "missing_artifact"     // Required input artifact not available
  | "validation_failure"   // Packet or state machine validation error
  | "escalation"           // Specialist explicitly escalated
  | "abort";               // Execution aborted by signal

export interface StateTraceEntry {
  /** State name */
  state: string;
  /** Agent that executed this state */
  agent: string;
  /** Result status from the agent */
  resultStatus: PacketStatus;
  /** Transition taken (target state name) */
  transitionTo: string;
  /** Timestamp when this state was entered */
  enteredAt: string;
  /** Timestamp when this state completed */
  completedAt: string;
  /** Loop iteration count for this edge (if applicable) */
  iterationCount?: number;
}

export interface SpecialistInvocationSummary {
  /** Specialist agent ID */
  agentId: string;
  /** Invocation order (1-indexed) */
  order: number;
  /** Bounded summary of the specialist's output */
  outputSummary: string;
  /** Result status */
  status: PacketStatus;
  /** Whether output contract was satisfied */
  contractSatisfied: boolean;
  /** Duration in milliseconds (if measurable) */
  durationMs?: number;
}

export interface TeamSessionArtifact {
  /** Unique session ID */
  sessionId: string;
  /** Timestamp of session start */
  startedAt: string;
  /** Timestamp of session completion */
  completedAt: string;
  /** Team definition ID */
  teamId: string;
  /** Team definition name */
  teamName: string;
  /** Hash or version identifier of the team definition used */
  teamVersion: string;
  /** Starting state */
  startState: string;
  /** Ending state */
  endState: string;
  /** Why the team stopped */
  terminationReason: FailureReason | "success";
  /** Ordered state trace */
  stateTrace: StateTraceEntry[];
  /** Per-specialist invocation summaries */
  specialistSummaries: SpecialistInvocationSummary[];
  /** Final outcome */
  outcome: {
    status: PacketStatus;
    failureReason?: FailureReason;
  };
  /** Lightweight metrics */
  metrics: {
    totalTransitions: number;
    loopCount: number;
    retryCount: number;
    totalDurationMs: number;
    revisionCount: number;
  };
}
```

**Team version identity.** For 4d, team version is a deterministic hash of the `TeamDefinition` object (JSON.stringify + simple hash). This is lightweight and sufficient until a formal versioning scheme is needed. A helper `computeTeamVersion(team: TeamDefinition): string` lives in `extensions/shared/logging.ts`.

```typescript
/** Compute a deterministic version string from a team definition */
export function computeTeamVersion(team: TeamDefinition): string {
  const content = JSON.stringify({
    id: team.id,
    members: team.members,
    states: team.states,
    entryContract: team.entryContract,
    exitContract: team.exitContract,
  });
  // Simple djb2 hash — not cryptographic, just a fingerprint
  let hash = 5381;
  for (let i = 0; i < content.length; i++) {
    hash = ((hash << 5) + hash + content.charCodeAt(i)) & 0xffffffff;
  }
  return `v0-${(hash >>> 0).toString(16)}`;
}
```

**Where it hooks in:**

1. `executeTeam()` in `router.ts` — builds `StateTraceEntry` items during the execution loop and `SpecialistInvocationSummary` items after each delegation. Assembles the full `TeamSessionArtifact` at the end.

2. `TeamExecutionResult` gains a new field: `sessionArtifact: TeamSessionArtifact`.

3. The orchestrator logs the artifact via `pi.appendEntry("team_session", artifact)` after receiving the team result.

**Mapping `FailureReason` from existing failure modes.** The team router already handles several failure cases — each maps to a specific reason:
- `resultPacket.status === "failure"` → `"task_failure"`
- `resultPacket.status === "escalation"` → `"escalation"`
- Loop exhaustion (`exhausted` in advanceResult) → `"retry_exhaustion"`
- State machine error → `"validation_failure"`
- Abort signal → `"abort"`
- Pre-flight contract failure → `"contract_violation"`

**Contract satisfaction check in specialist summaries.** After each specialist delegation within the team, if the specialist has an `outputContract`, validate the result's deliverables against it using `validateOutputContract()`. Record `contractSatisfied: true/false` in the summary. This is informational (does not block execution — a specialist may produce a valid result without structured deliverables).

---

#### File structure

| File | Purpose |
|------|---------|
| `extensions/shared/logging.ts` | **NEW** — `DelegationLogger`, `DelegationLogEntry`, `DelegationEvent`, `NULL_LOGGER`, `createPiLogger()`, `computeTeamVersion()` |
| `extensions/shared/types.ts` | **MODIFY** — Add `FailureReason`, `StateTraceEntry`, `SpecialistInvocationSummary`, `TeamSessionArtifact` |
| `extensions/orchestrator/delegate.ts` | **MODIFY** — Add `logger` param to `DelegationInput` and `delegateToTeam()`, add pre-flight validation, add logging calls |
| `extensions/teams/router.ts` | **MODIFY** — Add `logger` param, build `TeamSessionArtifact` during execution, include in `TeamExecutionResult` |
| `extensions/orchestrator/index.ts` | **MODIFY** — Create `PiLogger` from `pi.appendEntry()`, pass to delegation calls |
| `tests/logging.test.ts` | **NEW** — Test `DelegationLogger`, `createPiLogger()`, `computeTeamVersion()` |
| `tests/preflight.test.ts` | **NEW** — Test pre-flight validation in `delegateToSpecialist()` (mock subprocess, verify failure packet returned without spawn) |
| `tests/session-artifact.test.ts` | **NEW** — Test `TeamSessionArtifact` construction in `executeTeam()` (mock delegations, verify artifact fields, state trace, metrics) |

#### Test scenarios

**Logging tests (`tests/logging.test.ts`):**
- `NULL_LOGGER.log()` does not throw
- `createPiLogger()` calls `pi.appendEntry()` with correct type and data
- `computeTeamVersion()` returns deterministic hash for same definition
- `computeTeamVersion()` returns different hash when members/states change

**Pre-flight validation tests (`tests/preflight.test.ts`):**
- Specialist with no input contract — delegation proceeds normally
- Specialist with optional-only input contract — delegation proceeds normally
- Specialist with required input contract field missing from context — returns failure packet, does not spawn subprocess
- Pre-flight failure logs `preflight_fail` event when logger is present

**Session artifact tests (`tests/session-artifact.test.ts`):**
- Happy path team execution produces artifact with correct metadata, state trace, and metrics
- Artifact `stateTrace` has one entry per non-terminal state visited
- Artifact `specialistSummaries` has one entry per delegation
- Loop/revision produces correct `loopCount` and `revisionCount` in metrics
- Escalation (loop exhaustion) produces artifact with `terminationReason: "retry_exhaustion"`
- Failure in mid-chain produces artifact with `terminationReason: "task_failure"`
- `teamVersion` is consistent and deterministic
- `contractSatisfied` is correctly computed per specialist

#### What this stage does NOT do

- Does not add a CLI command or Pi-registered command for querying logs (logs are persisted via `appendEntry`, queryable by future tooling)
- Does not add raw transcript capture (bounded summaries only, per plan)
- Does not add session-level token usage tracking (Pi subprocess API doesn't expose token counts yet — `durationMs` is the available proxy)
- Does not add output contract enforcement at delegation boundaries (contract check is informational in specialist summaries, not blocking)

#### Key files to read before implementing

| File | Why |
|------|-----|
| `extensions/orchestrator/delegate.ts` | Where pre-flight validation and logging hook into specialist delegation |
| `extensions/teams/router.ts` | Where session artifacts are built and logging hooks into team execution |
| `extensions/orchestrator/index.ts` | Where `PiLogger` is created from `pi.appendEntry()` and passed to delegation |
| `extensions/shared/contracts.ts` | `validateInputContract()` and `validateOutputContract()` — reused for pre-flight and contract satisfaction checks |
| `extensions/shared/types.ts` | Where new types (`FailureReason`, `TeamSessionArtifact`, etc.) are added |
| `docs/PI_EXTENSION_API.md` | `pi.appendEntry()` API reference |

---

## Stage 4e — Substrate Hardening [NOT STARTED]

### Purpose

Strengthen the existing specialist and orchestration substrate before expanding the specialist roster in Stage 5a. This stage adds structured review output, model routing, and a coding-scoped execution-state tracker — all of which benefit the five new specialists immediately upon bootstrap.

See Decisions #26, #27, #28 in `DECISION_LOG.md`. Design doc item 4.4 (observability) is already satisfied by Stage 4d (Decision #29).

### Phase A (4e.1): Tighten Existing Primitives

**Two workstreams.** Phase A has two deliverables that should be implemented in order:

1. Structured review findings contract (reviewer output becomes typed)
2. Per-specialist model routing policy (specialists can declare model preferences)

Workstream 1 is self-contained. Workstream 2 is self-contained. Neither depends on the other, but implementing them in order avoids merge conflicts in shared files.

#### What this phase does NOT do

- Does not change the reviewer's `inputContract` (only the `outputContract` changes)
- Does not add a UI or CLI for viewing review findings (findings are in ResultPacket deliverables, queryable by future tooling)
- Does not enforce model routing at the Pi platform level (model routing is advisory — if Pi doesn't support a `--model` flag, the resolved model is logged but the host default is used)
- Does not add model routing to team-level delegation (only specialist-level)
- Does not retroactively populate `preferredModel` on existing specialists (they use `undefined`, meaning host default)

---

#### Workstream 1: Structured Review Findings Contract

**Approach: typed reviewer output.** The reviewer's `outputContract` is replaced with a structured format. The existing `buildOutputFormatBlock()` in `specialist-prompt.ts` already generates JSON output templates from `outputContract.fields`, so updating the contract automatically updates what the reviewer is asked to produce. A new `parseReviewOutput()` function extracts and validates the structured output from the sub-agent response. Synthesis is updated to consume verdicts and surface critical findings.

**Types (added to `extensions/shared/types.ts`):**

```typescript
// --- Structured Review Findings (Stage 4e) ---

export type ReviewVerdict = "approve" | "request_changes" | "comment" | "blocked";

export type FindingPriority = "critical" | "major" | "minor" | "nit";

export interface ReviewFinding {
  id: string;
  priority: FindingPriority;
  category: string;
  title: string;
  explanation: string;
  evidence: string;
  suggestedAction: string;
  fileRefs?: string[];
}

export interface StructuredReviewOutput {
  verdict: ReviewVerdict;
  findings: ReviewFinding[];
  summary: string;
}
```

All fields on `ReviewFinding` are required except `fileRefs`. The `id` is author-assigned by the reviewer sub-agent (e.g., `"F1"`, `"F2"`). The `category` is freeform (e.g., `"scope"`, `"correctness"`, `"style"`).

**Verdict-to-status mapping.** The reviewer sub-agent still outputs a top-level `status` field (required by all specialists). The `verdict` is an additional field specific to the reviewer's structured output. The mapping:

| verdict | status | Meaning |
|---------|--------|---------|
| `approve` | `success` | Review passed |
| `request_changes` | `partial` | Actionable issues found, not blocking |
| `comment` | `success` | Informational findings only, no action required |
| `blocked` | `failure` | Cannot proceed, critical issues |

The reviewer sub-agent is instructed to set `status` consistent with `verdict`. If they conflict, `status` takes precedence for routing (it's what the orchestrator and team router already use). `verdict` provides richer semantics for synthesis and downstream consumers.

**Reviewer output contract update (`extensions/specialists/reviewer/prompt.ts`):**

Replace the existing `outputContract` on `REVIEWER_PROMPT_CONFIG`:

```typescript
// BEFORE (current):
outputContract: {
  fields: [
    { name: "findings", type: "string[]", required: true, description: "Review findings" },
    { name: "approved", type: "boolean", required: true, description: "Whether the review passed" },
    { name: "blockers", type: "string[]", required: true, description: "Blocking issues found" },
  ],
},

// AFTER (4e):
outputContract: {
  fields: [
    { name: "verdict", type: "string", required: true, description: "Review verdict: approve | request_changes | comment | blocked" },
    { name: "findings", type: "object", required: true, description: "Array of ReviewFinding objects: [{id, priority, category, title, explanation, evidence, suggestedAction, fileRefs?}]" },
    { name: "summary", type: "string", required: true, description: "Brief summary of review outcome" },
  ],
},
```

Note: `findings` uses `ContractFieldType = "object"` because the contract system doesn't have an `"object[]"` type. The `"object"` type passes `matchesType()` for any non-null object including arrays. The `description` field documents the expected shape. Runtime validation of individual `ReviewFinding` objects happens in `parseReviewOutput()`, not in the contract system.

**The output template is auto-generated.** Because `buildOutputFormatBlock()` in `specialist-prompt.ts` reads `outputContract.fields` and calls `getFieldExample(type)`, updating the contract automatically changes the JSON template in the reviewer's system prompt. For `"object"` type, `getFieldExample()` returns `{}`. To produce a better example, add a special case for the reviewer in the system prompt construction — see below.

**Reviewer system prompt enhancement.** Add a `outputFormatOverride?: string` field to `SpecialistPromptConfig`:

```typescript
// In extensions/shared/specialist-prompt.ts, add to SpecialistPromptConfig:
export interface SpecialistPromptConfig {
  // ... existing fields ...
  outputFormatOverride?: string;  // NEW: if set, replaces the auto-generated output format block
}
```

Then in `buildSpecialistSystemPrompt()`, check for `outputFormatOverride` before calling `buildOutputFormatBlock()`:

```typescript
// In buildSpecialistSystemPrompt():
const outputBlock = config.outputFormatOverride
  ? config.outputFormatOverride
  : buildOutputFormatBlock(config);
```

Set `outputFormatOverride` on `REVIEWER_PROMPT_CONFIG` to provide a concrete example:

```typescript
outputFormatOverride: `Respond with a JSON block in this exact format:

\`\`\`json
{
  "status": "success | partial | failure | escalation",
  "summary": "Brief summary of review outcome",
  "verdict": "approve | request_changes | comment | blocked",
  "findings": [
    {
      "id": "F1",
      "priority": "critical | major | minor | nit",
      "category": "scope | correctness | style | security | performance | contract",
      "title": "Short title of the finding",
      "explanation": "What the issue is and why it matters",
      "evidence": "Specific code, line, or artifact that demonstrates the issue",
      "suggestedAction": "What should be done to address this",
      "fileRefs": ["path/to/file.ts"]
    }
  ],
  "modifiedFiles": [],
  "escalation": { "reason": "...", "suggestedAction": "..." }
}
\`\`\`

Set status consistent with verdict: approve/comment → "success", request_changes → "partial", blocked → "failure".
The findings array must always be present (use [] if no findings).
The escalation field is only required when status is "escalation".`,
```

**parseReviewOutput() function (`extensions/shared/result-parser.ts`):**

Add a new exported function that extracts `StructuredReviewOutput` from a `ParsedSpecialistResult`. This runs *after* `parseSpecialistOutput()` — it's a second-pass parser for reviewer-specific structure, not a replacement for the generic parser.

```typescript
import type { StructuredReviewOutput, ReviewFinding, ReviewVerdict, FindingPriority } from "./types.js";

const VALID_VERDICTS: readonly ReviewVerdict[] = ["approve", "request_changes", "comment", "blocked"];
const VALID_PRIORITIES: readonly FindingPriority[] = ["critical", "major", "minor", "nit"];

/**
 * Extract structured review output from a parsed specialist result.
 * Called after parseSpecialistOutput() for reviewer results only.
 *
 * @param parsedResult - The generic ParsedSpecialistResult from parseSpecialistOutput()
 * @param rawJson - The raw JSON object extracted during initial parsing (if available)
 * @returns StructuredReviewOutput if valid structured data found, undefined otherwise
 */
export function parseReviewOutput(
  parsedResult: ParsedSpecialistResult,
  rawJson?: Record<string, unknown>
): StructuredReviewOutput | undefined
```

**Implementation logic:**

1. If `rawJson` is provided and has `verdict` and `findings` fields, attempt structured extraction
2. Validate `verdict` is one of `VALID_VERDICTS`; if not, return `undefined`
3. Validate `findings` is an array; if not, return `undefined`
4. For each finding in the array, validate required fields (`id`, `priority`, `category`, `title`, `explanation`, `evidence`, `suggestedAction`). Skip findings that are malformed (filter, don't reject the whole output)
5. Validate each finding's `priority` is one of `VALID_PRIORITIES`; default to `"minor"` if invalid
6. Return `{ verdict, findings: validFindings, summary: parsedResult.summary }`
7. If no valid structured data found, return `undefined`

**To make rawJson available:** Modify `parseSpecialistOutput()` to also return the raw parsed JSON object. Change the return type:

```typescript
// BEFORE:
export function parseSpecialistOutput(finalText: string, sourceAgentId: string): ParsedSpecialistResult

// AFTER:
export interface ParseResult {
  result: ParsedSpecialistResult;
  rawJson?: Record<string, unknown>;  // The raw JSON object, if one was found
}

export function parseSpecialistOutput(finalText: string, sourceAgentId: string): ParseResult
```

**Update all callers of `parseSpecialistOutput()`** to destructure the new return type:

```typescript
// In delegate.ts, change:
const parsedResult = parseSpecialistOutput(subAgentResult.finalText, agentId);
// To:
const { result: parsedResult, rawJson } = parseSpecialistOutput(subAgentResult.finalText, agentId);
```

There are two callers: `delegateToSpecialist()` in `delegate.ts` and `executeTeam()` in `teams/router.ts`. Both need this update.

**Where parseReviewOutput() is called.** In `delegateToSpecialist()` in `delegate.ts`, after parsing:

```typescript
const { result: parsedResult, rawJson } = parseSpecialistOutput(subAgentResult.finalText, agentId);

// If this is a reviewer result, attempt structured extraction
let reviewOutput: StructuredReviewOutput | undefined;
if (input.promptConfig.id === "specialist_reviewer" && rawJson) {
  reviewOutput = parseReviewOutput(parsedResult, rawJson);
}
```

The `reviewOutput` is stored in the `ResultPacket.context` field (which is currently unused on result packets — it's only on task packets). **Instead**, attach it to a new optional field on `DelegationOutput`:

```typescript
// In delegate.ts, add to DelegationOutput:
export interface DelegationOutput {
  resultPacket: ResultPacket;
  success: boolean;
  sessionArtifact?: TeamSessionArtifact;
  reviewOutput?: StructuredReviewOutput;  // NEW: populated for reviewer results only
}
```

**Synthesis update (`extensions/orchestrator/synthesize.ts`):**

The orchestrator's `index.ts` calls `synthesizeResults()`. To pass structured review data through, update the synthesis interface:

```typescript
// BEFORE:
export function synthesizeResults(results: ResultPacket[]): SynthesizedResult

// AFTER:
export interface SynthesisInput {
  results: ResultPacket[];
  reviewOutputs?: Map<string, StructuredReviewOutput>;  // keyed by sourceAgent
}

export function synthesizeResults(input: SynthesisInput): SynthesizedResult
```

**Synthesis logic changes:**

1. After computing `overallStatus` (existing logic unchanged), check `reviewOutputs`
2. If any review has `verdict === "blocked"`, append to summary: `"\n\n⚠ BLOCKED: {finding.title}"` for each critical finding
3. If any review has critical or major findings, append to summary: `"\n\nReview findings ({N} critical, {M} major): {titles}"`
4. Add a new field to `SynthesizedResult`:

```typescript
export interface SynthesizedResult {
  overallStatus: PacketStatus;
  summary: string;
  specialistsInvoked: string[];
  results: ResultPacket[];
  reviewFindings?: StructuredReviewOutput;  // NEW: first reviewer's structured output, if available
}
```

**Update the orchestrator's index.ts** to build the `reviewOutputs` map from `DelegationOutput[]` and pass it to `synthesizeResults()`.

**Workstream 1 file changes:**

| File | Action |
|------|--------|
| `extensions/shared/types.ts` | **MODIFY** — Add `ReviewVerdict`, `FindingPriority`, `ReviewFinding`, `StructuredReviewOutput` types |
| `extensions/shared/specialist-prompt.ts` | **MODIFY** — Add `outputFormatOverride?: string` to `SpecialistPromptConfig`, use it in `buildSpecialistSystemPrompt()` |
| `extensions/specialists/reviewer/prompt.ts` | **MODIFY** — Replace `outputContract` fields, add `outputFormatOverride` with concrete example |
| `extensions/shared/result-parser.ts` | **MODIFY** — Change `parseSpecialistOutput()` return to `ParseResult`, add `parseReviewOutput()` |
| `extensions/orchestrator/delegate.ts` | **MODIFY** — Destructure new `ParseResult`, call `parseReviewOutput()` for reviewer, add `reviewOutput` to `DelegationOutput` |
| `extensions/teams/router.ts` | **MODIFY** — Destructure new `ParseResult` return type (no other changes) |
| `extensions/orchestrator/synthesize.ts` | **MODIFY** — Change to `SynthesisInput`, add review finding surfacing, add `reviewFindings` to `SynthesizedResult` |
| `extensions/orchestrator/index.ts` | **MODIFY** — Build `reviewOutputs` map, pass `SynthesisInput` to `synthesizeResults()` |
| `tests/review-findings.test.ts` | **NEW** — See test spec below |

**Tests (`tests/review-findings.test.ts`):**

```typescript
import { describe, it, expect } from "vitest";
import { parseReviewOutput } from "../extensions/shared/result-parser.js";
import { parseSpecialistOutput } from "../extensions/shared/result-parser.js";
import { synthesizeResults } from "../extensions/orchestrator/synthesize.js";
import type { StructuredReviewOutput, ReviewFinding } from "../extensions/shared/types.js";
import { createResultPacket } from "../extensions/shared/packets.js";

describe("parseReviewOutput", () => {
  // Test: valid structured output with all fields
  // Test: valid output with empty findings array (approve verdict)
  // Test: returns undefined when verdict is missing
  // Test: returns undefined when verdict is invalid string
  // Test: returns undefined when findings is not an array
  // Test: filters out malformed findings (missing required fields), keeps valid ones
  // Test: defaults invalid priority to "minor"
  // Test: preserves optional fileRefs when present
  // Test: returns undefined when rawJson is undefined
});

describe("parseSpecialistOutput return type", () => {
  // Test: returns { result, rawJson } when JSON is found
  // Test: returns { result, rawJson: undefined } when no JSON found (fallback)
});

describe("synthesizeResults with review findings", () => {
  // Test: review findings surfaced in summary when critical findings present
  // Test: blocked verdict appends warning to summary
  // Test: all-nit findings do not modify summary
  // Test: reviewFindings populated on SynthesizedResult when reviewer present
  // Test: synthesis works normally when no reviewOutputs provided (backward compat)
});
```

---

#### Workstream 2: Per-Specialist Model Routing Policy

**Approach: resolution function + subprocess parameter.** A pure function `resolveModel()` implements the 4-level precedence chain. The resolved model is passed to `spawnSpecialistAgent()` via a new optional parameter. If a model is resolved, it's passed as `--model {modelId}` to the Pi CLI. If the Pi CLI doesn't support `--model`, the parameter is silently ignored and the resolution is logged for observability.

**Pi CLI model flag status.** The Pi CLI documentation in `docs/PI_EXTENSION_API.md` does not document a `--model` flag. However, the Pi CLI is actively developed and model selection is a natural capability. The implementation adds `--model` support optimistically:
- If Pi supports it: model routing works end-to-end
- If Pi doesn't support it yet: the flag is passed but may be ignored by Pi. The `DelegationLogger` logs the resolved model for observability. No runtime error — Pi will use its default model.

This is consistent with the existing project risk: "Sub-agent spawning pattern needs hands-on validation with Pi CLI."

**Types (added to `extensions/shared/types.ts`):**

```typescript
// --- Model Routing (Stage 4e) ---

export interface ModelRoutingPolicy {
  specialistDefaults: Record<string, string>;  // specialistId → model identifier
}

export interface ModelResolutionContext {
  runtimeOverride?: string;       // From DelegationInput or task packet
  projectConfig?: string;         // From project-level model config
  specialistDefault?: string;     // From SpecialistPromptConfig.preferredModel
  // Host default is implicit (Pi's own model selection when no --model flag)
}
```

**resolveModel() function (`extensions/shared/config.ts` — NEW file):**

```typescript
import type { ModelResolutionContext } from "./types.js";

/**
 * Resolve which model a specialist should use, following a 4-level precedence chain.
 * Returns undefined when no override applies (use host default).
 *
 * Precedence (highest to lowest):
 * 1. runtimeOverride — explicit override passed in DelegationInput
 * 2. projectConfig — project-level model assignment
 * 3. specialistDefault — declared in specialist's SpecialistPromptConfig
 * 4. (implicit) host default — Pi's own model selection
 *
 * @param context - ModelResolutionContext with optional values at each level
 * @returns Model identifier string, or undefined to use host default
 */
export function resolveModel(context: ModelResolutionContext): string | undefined {
  return context.runtimeOverride
    ?? context.projectConfig
    ?? context.specialistDefault
    ?? undefined;
}
```

The function is intentionally trivial — the value is in the typed interface and the integration points, not in complex logic.

**SpecialistPromptConfig update (`extensions/shared/specialist-prompt.ts`):**

```typescript
export interface SpecialistPromptConfig {
  // ... existing fields ...
  outputFormatOverride?: string;  // From workstream 1
  preferredModel?: string;        // NEW: specialist's default model preference
}
```

Existing specialists (builder, planner, reviewer, tester) do NOT set `preferredModel` — they use `undefined`, meaning host default. Future specialists (Stage 5a) can set it if desired.

**spawnSpecialistAgent() update (`extensions/shared/subprocess.ts`):**

Add optional `model` parameter:

```typescript
// BEFORE:
export function spawnSpecialistAgent(
  systemPrompt: string,
  taskPrompt: string,
  signal?: AbortSignal,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<SubAgentResult>

// AFTER:
export function spawnSpecialistAgent(
  systemPrompt: string,
  taskPrompt: string,
  signal?: AbortSignal,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
  model?: string
): Promise<SubAgentResult>
```

In the implementation, conditionally add `--model` to the spawn args:

```typescript
const args = ["--print", "-s", systemPrompt, "-p", taskPrompt];
if (model) {
  args.push("--model", model);
}
const child = spawn("pi", args, { stdio: ["ignore", "pipe", "pipe"], signal: ... });
```

**DelegationInput update (`extensions/orchestrator/delegate.ts`):**

```typescript
export interface DelegationInput {
  promptConfig: SpecialistPromptConfig;
  taskPacket: TaskPacket;
  signal?: AbortSignal;
  logger?: DelegationLogger;
  modelOverride?: string;    // NEW: runtime model override (highest precedence)
  projectModelConfig?: string;  // NEW: project-level model for this specialist
}
```

**Where resolveModel() is called** — in `delegateToSpecialist()`, after building prompts and before spawning:

```typescript
// In delegateToSpecialist(), after prompt building:
const resolvedModel = resolveModel({
  runtimeOverride: input.modelOverride,
  projectConfig: input.projectModelConfig,
  specialistDefault: input.promptConfig.preferredModel,
});

// Log the resolved model for observability
if (resolvedModel && input.logger) {
  input.logger.log({
    timestamp: new Date().toISOString(),
    level: "info",
    event: "delegation_start",  // reuse existing event, model info in summary
    sourceAgent: "orchestrator",
    targetAgent: input.promptConfig.id,
    taskId: input.taskPacket.id,
    summary: `Model resolved: ${resolvedModel}`,
  });
}

// Pass to subprocess
const subAgentResult = await spawnSpecialistAgent(
  systemPrompt,
  taskPrompt,
  input.signal,
  DEFAULT_TIMEOUT_MS,
  resolvedModel  // NEW parameter
);
```

**How the orchestrator provides modelOverride and projectModelConfig.** The orchestrator's `index.ts` `execute()` function receives `params` from the tool call. Add optional `modelOverride` to the orchestrate tool's parameters. For `projectModelConfig`, the orchestrator can read from a config source in the future — for now, it's passed through from the tool params or left undefined.

```typescript
// In extensions/orchestrator/index.ts, update the tool parameter schema:
parameters: {
  // ... existing params ...
  modelOverride: { type: "string", description: "Override model for all specialists in this delegation", optional: true },
}
```

When building `DelegationInput` for each specialist, pass through:

```typescript
const delegationInput: DelegationInput = {
  promptConfig: getPromptConfig(specialistId),
  taskPacket,
  signal,
  logger,
  modelOverride: params.modelOverride as string | undefined,
  // projectModelConfig left undefined until a config source is wired up
};
```

**Workstream 2 file changes:**

| File | Action |
|------|--------|
| `extensions/shared/types.ts` | **MODIFY** — Add `ModelRoutingPolicy`, `ModelResolutionContext` |
| `extensions/shared/config.ts` | **NEW** — `resolveModel()` function |
| `extensions/shared/specialist-prompt.ts` | **MODIFY** — Add `preferredModel?: string` to `SpecialistPromptConfig` |
| `extensions/shared/subprocess.ts` | **MODIFY** — Add `model?: string` parameter to `spawnSpecialistAgent()` |
| `extensions/orchestrator/delegate.ts` | **MODIFY** — Add `modelOverride?`, `projectModelConfig?` to `DelegationInput`, call `resolveModel()`, pass model to subprocess |
| `extensions/orchestrator/index.ts` | **MODIFY** — Add `modelOverride` to orchestrate tool params, pass through to delegation |
| `tests/model-routing.test.ts` | **NEW** — See test spec below |

**Tests (`tests/model-routing.test.ts`):**

```typescript
import { describe, it, expect } from "vitest";
import { resolveModel } from "../extensions/shared/config.js";
import type { ModelResolutionContext } from "../extensions/shared/types.js";

describe("resolveModel", () => {
  // Test: returns runtimeOverride when all levels provided
  // Test: returns projectConfig when no runtimeOverride
  // Test: returns specialistDefault when no runtimeOverride or projectConfig
  // Test: returns undefined when no levels provided (use host default)
  // Test: returns runtimeOverride even when it's an empty-ish value? No — only non-undefined values count
  // Test: different specialists resolve different models from different defaults
});
```

Six tests. Pure function, no mocking needed.

**Additional integration test (add to `tests/orchestrator-delegate.test.ts`):**

```typescript
// Test: delegateToSpecialist passes resolved model to spawnSpecialistAgent
// Test: delegateToSpecialist passes undefined model when no overrides (host default)
// Test: modelOverride in DelegationInput takes precedence over promptConfig.preferredModel
```

---

### Phase A (4e.1) exit criteria

- `StructuredReviewOutput` types exist and are exported from `types.ts`
- Reviewer's `outputContract` uses the new three-field structure (verdict, findings, summary)
- Reviewer's system prompt includes concrete JSON example via `outputFormatOverride`
- `parseReviewOutput()` extracts valid findings and returns `undefined` for malformed output
- `parseSpecialistOutput()` returns `ParseResult` with `rawJson` (backward-compatible for all callers)
- `synthesizeResults()` accepts `SynthesisInput` and surfaces critical/major findings in summary
- `resolveModel()` implements 4-level precedence chain
- `spawnSpecialistAgent()` accepts optional `model` parameter
- `DelegationInput` accepts `modelOverride` and `projectModelConfig`
- All new code has tests; all 280 existing tests still pass (no regressions)

### Key files to read before implementing 4e.1

A fresh agent implementing 4e.1 should read ONLY these files. No other exploration is needed — all design decisions are pre-resolved above.

| File | Why |
|------|-----|
| `extensions/shared/types.ts` | Where new types are added (end of file) |
| `extensions/shared/specialist-prompt.ts` | Where `SpecialistPromptConfig` is defined and `buildOutputFormatBlock()` generates templates |
| `extensions/specialists/reviewer/prompt.ts` | Where `REVIEWER_PROMPT_CONFIG` is updated |
| `extensions/shared/result-parser.ts` | Where `parseSpecialistOutput()` return type changes and `parseReviewOutput()` is added |
| `extensions/orchestrator/delegate.ts` | Where model resolution and review output extraction hook in |
| `extensions/orchestrator/synthesize.ts` | Where `synthesizeResults()` gains review-aware logic |
| `extensions/orchestrator/index.ts` | Where orchestrate tool params and synthesis input are wired |
| `extensions/shared/subprocess.ts` | Where `spawnSpecialistAgent()` gains `model` parameter |
| `extensions/teams/router.ts` | Where `parseSpecialistOutput()` return type needs destructuring update |

### Phase B (4e.2): Execution-State Artifact

Adds a coding-scoped worklist extension. The worklist is an execution-state aid, **not a routing authority**. Routing remains the orchestrator's responsibility.

#### What this phase does NOT do

- Does not register Pi tools — the worklist is internal to the orchestrator, exposed as pure functions. If external visibility is needed later, read-only Pi tools can be added on top.
- Does not persist worklist to disk — worklist is in-memory during execution, then logged as a session artifact via `appendEntry()` for post-run inspection.
- Does not allow specialists to access or manipulate worklist state — enforced by API design (no tool registration, no worklist in task packets).
- Does not influence routing — the orchestrator reads worklist state for status awareness but uses `select.ts` for all routing decisions.
- Does not handle non-coding tasks — scope is strictly coding tasks (no personal reminders, life tasks, or assistant-wide planning).

---

#### Worklist Types

**File: `extensions/worklist/types.ts` (NEW)**

```typescript
export type WorklistItemStatus = "pending" | "in_progress" | "completed" | "blocked" | "abandoned";

export type WorklistItemKind =
  | "discovery"
  | "planning"
  | "implementation"
  | "validation"
  | "review_gate"
  | "blocker"
  | "completion_criteria";

export interface WorklistItem {
  /** Unique identifier (e.g., "wl_item_abc123") */
  id: string;
  /** What category of work this represents */
  kind: WorklistItemKind;
  /** Human-readable description of the work item */
  description: string;
  /** Current status */
  status: WorklistItemStatus;
  /** Which specialist this is attached to (e.g., "specialist_builder") */
  specialistId?: string;
  /** Reason for blocking — required when status is "blocked", cleared on unblock */
  blockReason?: string;
  /** When this item was created */
  createdAt: string;
  /** When this item's status last changed */
  updatedAt: string;
}

export interface Worklist {
  /** ID of the task this worklist belongs to */
  taskId: string;
  /** Human-readable description of the overall task */
  description: string;
  /** Ordered list of work items */
  items: WorklistItem[];
  /** When this worklist was created */
  createdAt: string;
  /** When this worklist was last modified */
  updatedAt: string;
}

export interface WorklistSummary {
  /** Total item count */
  totalItems: number;
  /** Count of items in each status */
  statusCounts: Record<WorklistItemStatus, number>;
  /** Items currently blocked (id + reason) */
  blockedItems: Array<{ id: string; description: string; blockReason: string }>;
  /** Whether all items are in a terminal state (completed or abandoned) */
  isComplete: boolean;
  /** Whether any items are blocked */
  hasBlockers: boolean;
}
```

**Notes:**
- `metadata` field removed from the spec — it was undocumented and speculative. If a concrete use case arises, add it then.
- `specialistStage` renamed to `specialistId` for consistency with existing codebase naming (e.g., `sourceAgent`, `targetAgent`).
- `WorklistItem` gains `createdAt` and `updatedAt` timestamps for observability.
- `WorklistSummary` is fully defined — `getWorklistSummary()` returns this type.

#### State Transition Rules

Valid transitions (7 total):

```
pending      → in_progress, abandoned
in_progress  → completed, blocked, abandoned
blocked      → in_progress, abandoned
completed    → (terminal — no transitions out)
abandoned    → (terminal — no transitions out)
```

The `VALID_TRANSITIONS` map is defined in `operations.ts` and enforced by `updateItemStatus()`. Invalid transitions return an error string; valid transitions return the updated `Worklist`.

```typescript
export const VALID_TRANSITIONS: Record<WorklistItemStatus, readonly WorklistItemStatus[]> = {
  pending: ["in_progress", "abandoned"],
  in_progress: ["completed", "blocked", "abandoned"],
  blocked: ["in_progress", "abandoned"],
  completed: [],
  abandoned: [],
};
```

#### Operations

**File: `extensions/worklist/operations.ts` (NEW)**

All operations are **pure functions** that return a new `Worklist` (immutable pattern). They do not mutate the input. Error cases return `{ error: string }`.

```typescript
import type { Worklist, WorklistItem, WorklistItemStatus, WorklistItemKind, WorklistSummary } from "./types.js";

type WorklistResult = { worklist: Worklist } | { error: string };

/**
 * Create a new empty worklist for a task.
 */
export function createWorklist(taskId: string, description: string): Worklist;

/**
 * Append a new item to the worklist. Items start as "pending".
 * Returns error if an item with the same ID already exists.
 */
export function appendItem(
  worklist: Worklist,
  item: { id: string; kind: WorklistItemKind; description: string }
): WorklistResult;

/**
 * Update an item's status. Validates the transition against VALID_TRANSITIONS.
 * When transitioning TO "blocked", reason is required.
 * When transitioning FROM "blocked" to "in_progress", blockReason is cleared.
 * Returns error if: item not found, invalid transition, or blocked without reason.
 */
export function updateItemStatus(
  worklist: Worklist,
  itemId: string,
  newStatus: WorklistItemStatus,
  reason?: string
): WorklistResult;

/**
 * Convenience: mark an item as blocked with a reason.
 * Equivalent to updateItemStatus(worklist, itemId, "blocked", reason).
 */
export function markBlocked(
  worklist: Worklist,
  itemId: string,
  reason: string
): WorklistResult;

/**
 * Attach a worklist item to a specialist (e.g., "specialist_builder").
 * Returns error if item not found.
 */
export function attachToSpecialist(
  worklist: Worklist,
  itemId: string,
  specialistId: string
): WorklistResult;

/**
 * Generate a machine-readable summary of worklist state.
 */
export function getWorklistSummary(worklist: Worklist): WorklistSummary;
```

**ID generation for worklist items:** The caller provides the `id` field when calling `appendItem()`. The orchestrator generates IDs using a simple `wl_item_${Date.now()}_${random}` pattern (same style as session IDs in `router.ts`). This is NOT a responsibility of the worklist module — the worklist just stores whatever ID it receives.

#### Extension Entry Point

**File: `extensions/worklist/index.ts` (NEW)**

The extension entry point does **NOT** register Pi tools. It exports the pure functions and types for the orchestrator to import directly:

```typescript
export { createWorklist, appendItem, updateItemStatus, markBlocked, attachToSpecialist, getWorklistSummary } from "./operations.js";
export type { Worklist, WorklistItem, WorklistItemStatus, WorklistItemKind, WorklistSummary } from "./types.js";
```

This is a barrel export module — no Pi extension registration, no `pi.registerTool()` calls. The orchestrator imports from `extensions/worklist/index.js`.

#### Orchestrator Integration

**File: `extensions/orchestrator/index.ts` (MODIFY)**

The orchestrator creates a worklist when running multi-specialist delegations and logs it as a session artifact when done. Changes are minimal:

```typescript
// At the start of the multi-specialist delegation loop:
import { createWorklist, appendItem, updateItemStatus, getWorklistSummary } from "../worklist/index.js";
import type { Worklist } from "../worklist/index.js";

// Inside execute(), after specialist selection:
let worklist = createWorklist(taskPacket.id, task);
for (const specialistId of selection.specialists) {
  const itemId = `wl_${specialistId}_${Date.now()}`;
  const result = appendItem(worklist, {
    id: itemId,
    kind: specialistId === "planner" ? "planning"
      : specialistId === "reviewer" ? "review_gate"
      : specialistId === "tester" ? "validation"
      : "implementation",
    description: `${specialistId} phase`,
  });
  if ("worklist" in result) worklist = result.worklist;
}

// Inside the delegation loop, before each specialist:
const statusResult = updateItemStatus(worklist, itemId, "in_progress");
if ("worklist" in statusResult) worklist = statusResult.worklist;

// After each specialist returns:
const doneStatus = delegationOutput.resultPacket.status === "success" ? "completed"
  : delegationOutput.resultPacket.status === "failure" ? "blocked"
  : delegationOutput.resultPacket.status === "escalation" ? "blocked"
  : "completed";
const doneResult = updateItemStatus(worklist, itemId, doneStatus,
  doneStatus === "blocked" ? delegationOutput.resultPacket.summary : undefined);
if ("worklist" in doneResult) worklist = doneResult.worklist;

// After the delegation loop, before returning:
const worklistSummary = getWorklistSummary(worklist);
pi.appendEntry("worklist_session", { worklist, summary: worklistSummary });
```

**Note:** The integration is intentionally thin — the orchestrator creates items, updates their status based on delegation outcomes, and logs the final state. The worklist does not influence routing decisions.

#### Synthesis Integration

**File: `extensions/orchestrator/synthesize.ts` (MODIFY)**

Add optional `worklistSummary` to `SynthesisInput` and surface blocker info:

```typescript
// Add to SynthesisInput:
export interface SynthesisInput {
  results: ResultPacket[];
  reviewOutputs?: Map<string, StructuredReviewOutput>;
  worklistSummary?: WorklistSummary;  // NEW
}

// Add to SynthesizedResult:
export interface SynthesizedResult {
  // ... existing fields ...
  worklistSummary?: WorklistSummary;  // NEW
}

// In synthesizeResults(), after review findings surfacing:
if (input.worklistSummary) {
  if (input.worklistSummary.hasBlockers) {
    const blockerDescs = input.worklistSummary.blockedItems
      .map(b => `${b.description}: ${b.blockReason}`).join("; ");
    summary += `\n\nBlocked items: ${blockerDescs}`;
  }
}
```

---

#### File Changes Summary

| File | Action |
|------|--------|
| `extensions/worklist/types.ts` | **NEW** — `WorklistItemStatus`, `WorklistItemKind`, `WorklistItem`, `Worklist`, `WorklistSummary` |
| `extensions/worklist/operations.ts` | **NEW** — `createWorklist`, `appendItem`, `updateItemStatus`, `markBlocked`, `attachToSpecialist`, `getWorklistSummary`, `VALID_TRANSITIONS` |
| `extensions/worklist/index.ts` | **NEW** — Barrel export (no Pi tool registration) |
| `extensions/orchestrator/index.ts` | **MODIFY** — Create worklist, update items during delegation loop, log session artifact |
| `extensions/orchestrator/synthesize.ts` | **MODIFY** — Add `worklistSummary` to `SynthesisInput` and `SynthesizedResult`, surface blockers |
| `tests/worklist.test.ts` | **NEW** — Worklist operations tests |
| `tests/worklist-interop.test.ts` | **NEW** — Orchestrator integration tests |

---

#### Tests

**File: `tests/worklist.test.ts` (NEW)**

```typescript
describe("createWorklist", () => {
  // creates worklist with correct taskId and description
  // creates worklist with empty items array
  // sets createdAt and updatedAt timestamps
});

describe("appendItem", () => {
  // appends item with pending status
  // sets createdAt and updatedAt on item
  // returns error if item ID already exists
  // updates worklist updatedAt timestamp
});

describe("updateItemStatus — valid transitions", () => {
  // pending → in_progress
  // in_progress → completed
  // in_progress → blocked (with reason)
  // in_progress → abandoned
  // blocked → in_progress (clears blockReason)
  // blocked → abandoned
  // pending → abandoned
});

describe("updateItemStatus — invalid transitions", () => {
  // completed → any (returns error)
  // abandoned → any (returns error)
  // pending → completed (returns error — must go through in_progress)
  // pending → blocked (returns error — must go through in_progress)
  // blocked → completed (returns error — must go through in_progress)
});

describe("updateItemStatus — blocker rules", () => {
  // transitioning to blocked without reason returns error
  // transitioning to blocked with reason sets blockReason
  // transitioning from blocked to in_progress clears blockReason
});

describe("markBlocked", () => {
  // convenience wrapper: marks item as blocked with reason
  // returns error if item not in_progress
});

describe("attachToSpecialist", () => {
  // sets specialistId on item
  // returns error if item not found
});

describe("getWorklistSummary", () => {
  // returns correct totalItems count
  // returns correct statusCounts for each status
  // surfaces blocked items with id, description, and reason
  // isComplete true when all items completed or abandoned
  // isComplete false when any items pending/in_progress/blocked
  // hasBlockers true when blocked items exist
  // hasBlockers false when no blocked items
  // handles empty worklist (0 items)
});

describe("serialization", () => {
  // worklist round-trips through JSON.stringify/parse
  // item timestamps preserved through serialization
});
```

**File: `tests/worklist-interop.test.ts` (NEW)**

These tests verify orchestrator integration. They mock `spawnSpecialistAgent` (same pattern as `tests/orchestrator-e2e.test.ts`) and verify worklist state after orchestration.

```typescript
describe("orchestrator worklist integration", () => {
  // orchestrate() creates worklist items for each specialist
  // successful specialist → item status "completed"
  // failed specialist → item status "blocked" with reason
  // worklist summary logged via appendEntry after orchestration
  // worklist does not affect specialist selection (selection is same with/without worklist)
  // blocked items surfaced in synthesized summary
});
```

---

### Phase B (4e.2) Exit Criteria

- `Worklist`, `WorklistItem`, `WorklistSummary` types exist and are exported
- `VALID_TRANSITIONS` enforces the 7-transition state machine
- All 6 operations are pure functions returning `WorklistResult`
- `getWorklistSummary()` returns correct counts and blocker info
- Orchestrator creates worklist during multi-specialist runs and logs it via `appendEntry()`
- Synthesis surfaces blocked worklist items in summary
- No Pi tools registered (worklist is orchestrator-internal)
- All existing 305 tests still pass (no regressions)

### Dependencies

- Stage 4e.1 complete (structured review findings, model routing) ✓

### Key files to read before implementing 4e.2

| File | Why |
|------|-----|
| `extensions/orchestrator/index.ts` | Where worklist is created and updated during delegation |
| `extensions/orchestrator/synthesize.ts` | Where worklist summary feeds into synthesis |
| `extensions/shared/logging.ts` | Existing `appendEntry()` patterns for session artifacts |
| `tests/orchestrator-e2e.test.ts` | Mock patterns for orchestrator integration tests |

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
- Stage 4e complete (structured review findings — so the critic can consume typed review output; model routing — so new specialists can declare model preferences)

### Implementation Notes (pre-resolved design decisions)

**Pattern.** Every new specialist follows the exact same 6-step pattern as the existing four. No new infrastructure is needed — only new files and registrations.

**Step-by-step per specialist:**
1. Create `agents/specialists/{name}.md` — agent definition markdown
2. Create `extensions/specialists/{name}/prompt.ts` — `SpecialistPromptConfig` + two helper functions
3. Create `extensions/specialists/{name}/index.ts` — `createSpecialistExtension()` factory call
4. Create `tests/{name}.test.ts` — config validation, system prompt assertions, task prompt assertions
5. Add to `extensions/orchestrator/select.ts` — extend `SpecialistId` type, add `SPECIALIST_KEYWORDS` entry, add to `WORKFLOW_ORDER`
6. Add to `extensions/orchestrator/delegate.ts` — import config, add to `PROMPT_CONFIG_MAP`, add case to `buildContextForSpecialist()`

**Registration changes (select.ts):**

```typescript
// Updated SpecialistId type (add all 5 at once)
export type SpecialistId =
  | "planner" | "reviewer" | "builder" | "tester"
  | "spec-writer" | "schema-designer" | "routing-designer" | "critic" | "boundary-auditor";

// Updated WORKFLOW_ORDER — new specialists slot in between plan/review and build/test
const WORKFLOW_ORDER: SpecialistId[] = [
  "planner",
  "spec-writer",
  "schema-designer",
  "routing-designer",
  "critic",
  "boundary-auditor",
  "reviewer",
  "builder",
  "tester",
];

// New keyword entries
const SPECIALIST_KEYWORDS: Record<SpecialistId, RegExp> = {
  // ... existing 4 entries unchanged ...
  "spec-writer": /\b(spec\w*|defin\w*|boundar\w*|scope\s+doc|agent\s+def|working\s+style|non.?goal)\b/i,
  "schema-designer": /\b(schema|type\s+def|contract|packet\s+shape|i.?o\s+contract|typebox|interface\s+design|validation\s+constraint)\b/i,
  "routing-designer": /\b(state\s+machine|routing|transition|escalation\s+path|unreachable|team\s+definition|workflow\s+design)\b/i,
  "critic": /\b(critic\w*|evaluat\w*\s+design|redundan\w*|simplif\w*|over.?engineer|reuse|unnecessary|proportional)\b/i,
  "boundary-auditor": /\b(boundary|access\s+control|permission|minimal.?context|narrow.?by.?default|excess\s+context|control\s+philosophy)\b/i,
};
```

**Registration changes (delegate.ts):**

```typescript
// Add imports (after existing specialist imports)
import { SPEC_WRITER_PROMPT_CONFIG } from "../specialists/spec-writer/prompt.js";
import { SCHEMA_DESIGNER_PROMPT_CONFIG } from "../specialists/schema-designer/prompt.js";
import { ROUTING_DESIGNER_PROMPT_CONFIG } from "../specialists/routing-designer/prompt.js";
import { CRITIC_PROMPT_CONFIG } from "../specialists/critic/prompt.js";
import { BOUNDARY_AUDITOR_PROMPT_CONFIG } from "../specialists/boundary-auditor/prompt.js";

// Add to PROMPT_CONFIG_MAP
const PROMPT_CONFIG_MAP: Record<SpecialistId, SpecialistPromptConfig> = {
  builder: BUILDER_PROMPT_CONFIG,
  planner: PLANNER_PROMPT_CONFIG,
  reviewer: REVIEWER_PROMPT_CONFIG,
  tester: TESTER_PROMPT_CONFIG,
  "spec-writer": SPEC_WRITER_PROMPT_CONFIG,
  "schema-designer": SCHEMA_DESIGNER_PROMPT_CONFIG,
  "routing-designer": ROUTING_DESIGNER_PROMPT_CONFIG,
  "critic": CRITIC_PROMPT_CONFIG,
  "boundary-auditor": BOUNDARY_AUDITOR_PROMPT_CONFIG,
};

// Add to buildContextForSpecialist() switch:
case "spec-writer":
  return undefined; // Spec-writer works from the task objective, no prior-result context needed

case "schema-designer": {
  // Needs spec content from spec-writer if available
  const specResult = priorResults.find(r => r.sourceAgent === "specialist_spec-writer");
  if (!specResult) return undefined;
  return {
    specSummary: specResult.summary,
    specDeliverables: specResult.deliverables,
  };
}

case "routing-designer": {
  // Needs schema info from schema-designer if available
  const schemaResult = priorResults.find(r => r.sourceAgent === "specialist_schema-designer");
  if (!schemaResult) return undefined;
  return {
    schemaSummary: schemaResult.summary,
    schemaDeliverables: schemaResult.deliverables,
  };
}

case "critic": {
  // Needs whatever artifacts have been produced so far
  const allSummaries = priorResults.map(r => `[${r.sourceAgent}] ${r.summary}`);
  if (allSummaries.length === 0) return undefined;
  return {
    priorSummaries: allSummaries,
    priorDeliverables: priorResults.flatMap(r => r.deliverables),
  };
}

case "boundary-auditor": {
  // Same as critic — needs all prior artifacts for audit
  const allSummaries = priorResults.map(r => `[${r.sourceAgent}] ${r.summary}`);
  if (allSummaries.length === 0) return undefined;
  return {
    priorSummaries: allSummaries,
    priorDeliverables: priorResults.flatMap(r => r.deliverables),
  };
}
```

**Also update `extractFieldFromResult()` in `contracts.ts`** to map the new field names:

```typescript
// Add to the switch in extractFieldFromResult():
case "specSummary":
  return result.summary;
case "specDeliverables":
  return result.deliverables;
case "schemaSummary":
  return result.summary;
case "schemaDeliverables":
  return result.deliverables;
case "priorSummaries":
  return undefined; // These are built from multiple results, not extracted from one
case "priorDeliverables":
  return undefined; // Same — handled by buildContextForSpecialist directly
```

**Also update `_SPECIALISTS_INDEX.md`** to include the new specialists.

**Also add all 5 new specialists as `"read-only"` in the `READ_ONLY_SPECIALISTS` set in `index.ts`:**

```typescript
// extensions/orchestrator/index.ts
const READ_ONLY_SPECIALISTS = new Set([
  "planner", "reviewer",
  "spec-writer", "schema-designer", "routing-designer", "critic", "boundary-auditor",
]);
```

All five new specialists are read-only (they produce design artifacts, not code changes). Only builder and tester get write access.

---

#### Specialist 1: Spec-Writer

**Agent definition** (`agents/specialists/spec-writer.md`):

```markdown
# spec-writer.md

## Definition

- `id`: specialist_spec-writer
- `name`: Specialist Spec-Writer
- `definition_type`: specialist

## Intent

- `purpose`: Write exhaustive prose specifications for agent definitions, boundary definitions, working style design, and "what this does NOT do" framing.
- `scope`:
  - write agent definition markdown files
  - define scope boundaries and non-goals
  - design working style postures
  - enumerate what a primitive does NOT do
- `non_goals`:
  - implementation of TypeScript code
  - type or schema design
  - routing or state machine design
  - broad architectural planning

## Working Style

- `working_style`:
  - `reasoning_posture`: Exhaustive enumeration and boundary-first thinking — systematically list all cases, then define scope by exclusion before inclusion.
  - `communication_posture`: Precise boundary-oriented prose — every scope claim paired with an explicit exclusion.
  - `risk_posture`: Conservative on scope — when uncertain whether something belongs, exclude it and note the exclusion.
  - `default_bias`: Prefer tight, well-fenced definitions over broad, flexible ones.
  - `anti_patterns`:
    - write implementation code instead of specifications
    - leave scope boundaries implicit or ambiguous
    - define what something does without defining what it does NOT do
    - produce vague specifications that could apply to multiple primitives

## Routing and access

- `routing_class`: downstream
- `context_scope`: narrow
- `default_read_set`:
  - task packet
  - existing agent definitions for reference
  - `agents/AGENT_DEFINITION_CONTRACT.md`
- `forbidden_by_default`:
  - `DECISION_LOG.md`
  - `STATUS.md`
  - edits outside explicit scope

## Inputs and outputs

- `required_inputs`:
  - what primitive to specify (name, purpose)
  - design constraints or boundary requirements
- `expected_outputs`:
  - complete agent definition markdown
  - explicit non-goals list
  - working style design
- `handback_format`:
  - the specification document
  - assumptions made
  - open questions requiring resolution

## Control and escalation

- `activation_conditions`:
  - new primitive needs a specification
  - existing specification needs revision
- `escalation_conditions`:
  - purpose overlaps significantly with an existing primitive
  - scope cannot be adequately bounded

## Validation

- `validation_expectations`:
  - specification follows AGENT_DEFINITION_CONTRACT.md structure
  - all required sections present
  - non-goals are explicit and testable

## Relationships

- `related_docs`:
  - `agents/AGENT_DEFINITION_CONTRACT.md`
  - `agents/specialists/_SPECIALISTS_INDEX.md`
- `related_definitions`:
  - `agents/specialists/planner.md`
  - `agents/specialists/critic.md`

## Authority flags

- `can_delegate`: false
- `can_synthesize`: false
- `can_update_handoff`: false
- `can_update_workflow_docs`: false
- `can_request_broader_context`: true

## Specialist-specific fields

- `specialization`: Exhaustive prose specification writing with boundary-first framing.
- `task_boundary`: Specification tasks with clear subject and design constraints.
- `deliverable_boundary`: Agent definition markdowns and scope boundary documents.
- `failure_boundary`: Stop when purpose overlaps unresolvably with existing primitives.

## Summary

Downstream specialist for specification writing. Produces exhaustive prose definitions with explicit boundaries, non-goals, and working style design without taking implementation or architectural ownership.
```

**Prompt config** (`extensions/specialists/spec-writer/prompt.ts`):

```typescript
import type { TaskPacket } from "../../shared/types.js";
import {
  buildSpecialistSystemPrompt,
  buildSpecialistTaskPrompt,
  type SpecialistPromptConfig,
} from "../../shared/specialist-prompt.js";

export const SPEC_WRITER_PROMPT_CONFIG: SpecialistPromptConfig = {
  id: "specialist_spec-writer",
  roleName: "Spec-Writer Specialist",
  roleDescription:
    "Write exhaustive prose specifications with boundary-first framing for agent definitions, scope boundaries, and working style design.",
  workingStyle: {
    reasoning:
      "Exhaustive enumeration and boundary-first thinking — systematically list all cases, then define scope by exclusion before inclusion.",
    communication:
      "Precise boundary-oriented prose — every scope claim paired with an explicit exclusion.",
    risk: "Conservative on scope — when uncertain whether something belongs, exclude it and note the exclusion.",
    defaultBias:
      "Prefer tight, well-fenced definitions over broad, flexible ones.",
  },
  constraints: [
    "You may ONLY write specifications — do NOT implement code.",
    "Every scope claim must have a corresponding non-goal or exclusion.",
    "Follow the structure defined in agents/AGENT_DEFINITION_CONTRACT.md.",
    "Do NOT define types, schemas, or routing — only prose specifications.",
  ],
  antiPatterns: [
    "leave scope boundaries implicit or ambiguous",
    "define what something does without defining what it does NOT do",
    "produce vague specifications that could apply to multiple primitives",
    "write implementation code instead of specifications",
  ],
  inputContract: { fields: [] },
  outputContract: {
    fields: [
      { name: "specification", type: "string", required: true, description: "The complete specification document" },
      { name: "nonGoals", type: "string[]", required: true, description: "Explicit non-goals" },
      { name: "openQuestions", type: "string[]", required: true, description: "Unresolved questions" },
    ],
  },
};

export function buildSpecWriterSystemPrompt(): string {
  return buildSpecialistSystemPrompt(SPEC_WRITER_PROMPT_CONFIG);
}

export function buildSpecWriterTaskPrompt(task: TaskPacket): string {
  return buildSpecialistTaskPrompt(task);
}
```

**Extension entry** (`extensions/specialists/spec-writer/index.ts`):

```typescript
import { createSpecialistExtension } from "../../shared/specialist-extension.js";
import { SPEC_WRITER_PROMPT_CONFIG } from "./prompt.js";

export default createSpecialistExtension({
  promptConfig: SPEC_WRITER_PROMPT_CONFIG,
  toolName: "delegate-to-spec-writer",
  toolLabel: "Delegate to Spec-Writer",
  toolDescription:
    "Delegate a specification-writing task to the spec-writer specialist. " +
    "The spec-writer produces exhaustive prose definitions with explicit boundaries " +
    "and returns a structured result packet.",
});
```

---

#### Specialist 2: Schema-Designer

**Prompt config** (`extensions/specialists/schema-designer/prompt.ts`):

```typescript
import type { TaskPacket } from "../../shared/types.js";
import {
  buildSpecialistSystemPrompt,
  buildSpecialistTaskPrompt,
  type SpecialistPromptConfig,
} from "../../shared/specialist-prompt.js";

export const SCHEMA_DESIGNER_PROMPT_CONFIG: SpecialistPromptConfig = {
  id: "specialist_schema-designer",
  roleName: "Schema-Designer Specialist",
  roleDescription:
    "Design all typed structures: TypeScript interfaces, packet shapes, I/O contracts, invariants, failure modes, output templates, and validation constraints.",
  workingStyle: {
    reasoning:
      "Formal type design — enumerate exact shapes, invariants, and failure modes before writing any type definition.",
    communication:
      "Express designs as TypeScript interfaces with inline documentation of invariants and edge cases.",
    risk: "Conservative on type breadth — prefer narrow, exact types over permissive ones; flag ambiguous shapes for resolution.",
    defaultBias:
      "Prefer precise types that make invalid states unrepresentable over flexible types with runtime validation.",
  },
  constraints: [
    "You may ONLY design types and schemas — do NOT implement runtime logic.",
    "Every type must document its invariants.",
    "I/O contracts must specify required vs optional fields explicitly.",
    "Do NOT design routing, state machines, or prose specifications.",
  ],
  antiPatterns: [
    "design overly permissive types that require extensive runtime validation",
    "omit failure mode types or error shapes",
    "define types without specifying invariants",
    "conflate schema design with implementation",
  ],
  inputContract: {
    fields: [
      { name: "specSummary", type: "string", required: false, description: "Specification summary from spec-writer", sourceSpecialist: "spec-writer" },
      { name: "specDeliverables", type: "string[]", required: false, description: "Specification deliverables", sourceSpecialist: "spec-writer" },
    ],
  },
  outputContract: {
    fields: [
      { name: "typeDefinitions", type: "string", required: true, description: "TypeScript interface definitions" },
      { name: "contracts", type: "string", required: true, description: "I/O contract definitions" },
      { name: "invariants", type: "string[]", required: true, description: "Type invariants and constraints" },
    ],
  },
};

export function buildSchemaDesignerSystemPrompt(): string {
  return buildSpecialistSystemPrompt(SCHEMA_DESIGNER_PROMPT_CONFIG);
}

export function buildSchemaDesignerTaskPrompt(task: TaskPacket): string {
  return buildSpecialistTaskPrompt(task);
}
```

**Agent definition** — same structural pattern as spec-writer above, with:
- ID: `specialist_schema-designer`
- reasoning_posture: "Formal type design — enumerate exact shapes, invariants, and failure modes"
- specialization: "Typed structure design: interfaces, contracts, packet shapes, validation constraints"
- task_boundary: "Schema design tasks with clear subject and structural requirements"
- deliverable_boundary: "TypeScript type definitions, I/O contracts, invariant documentation"
- failure_boundary: "Stop when type design cannot be completed without implementation decisions"

**Extension entry** (`extensions/specialists/schema-designer/index.ts`):

```typescript
import { createSpecialistExtension } from "../../shared/specialist-extension.js";
import { SCHEMA_DESIGNER_PROMPT_CONFIG } from "./prompt.js";

export default createSpecialistExtension({
  promptConfig: SCHEMA_DESIGNER_PROMPT_CONFIG,
  toolName: "delegate-to-schema-designer",
  toolLabel: "Delegate to Schema-Designer",
  toolDescription:
    "Delegate a schema or type design task to the schema-designer specialist. " +
    "The schema-designer produces TypeScript interfaces, I/O contracts, and invariant documentation.",
});
```

---

#### Specialist 3: Routing-Designer

**Prompt config** (`extensions/specialists/routing-designer/prompt.ts`):

```typescript
import type { TaskPacket } from "../../shared/types.js";
import {
  buildSpecialistSystemPrompt,
  buildSpecialistTaskPrompt,
  type SpecialistPromptConfig,
} from "../../shared/specialist-prompt.js";

export const ROUTING_DESIGNER_PROMPT_CONFIG: SpecialistPromptConfig = {
  id: "specialist_routing-designer",
  roleName: "Routing-Designer Specialist",
  roleDescription:
    "Design state machine routing definitions for teams: states, transitions, entry/exit conditions, escalation paths, and unreachable state detection.",
  workingStyle: {
    reasoning:
      "State enumeration and transition completeness — systematically list all states, verify all transitions are reachable, identify dead ends and missing escalation paths.",
    communication:
      "Express routing designs as state machine definitions with explicit transition tables and completeness analysis.",
    risk: "Conservative on missing transitions — flag any state without a clear exit path or escalation route.",
    defaultBias:
      "Prefer simple, linear state machines with explicit loop guards over complex branching designs.",
  },
  constraints: [
    "You may ONLY design routing and state machines — do NOT implement runtime logic.",
    "Every state must have at least one exit transition or be explicitly terminal.",
    "Loop edges must have maxIterations guards.",
    "Do NOT design types, schemas, or prose specifications.",
  ],
  antiPatterns: [
    "design state machines with unreachable states",
    "omit escalation paths for failure or loop exhaustion",
    "create unbounded loops without maxIterations guards",
    "conflate routing design with implementation",
  ],
  inputContract: {
    fields: [
      { name: "schemaSummary", type: "string", required: false, description: "Schema design summary", sourceSpecialist: "schema-designer" },
      { name: "schemaDeliverables", type: "string[]", required: false, description: "Schema deliverables", sourceSpecialist: "schema-designer" },
    ],
  },
  outputContract: {
    fields: [
      { name: "stateMachine", type: "string", required: true, description: "State machine definition" },
      { name: "transitionTable", type: "string", required: true, description: "Complete transition table" },
      { name: "completenessAnalysis", type: "string", required: true, description: "Analysis of reachability and completeness" },
    ],
  },
};

export function buildRoutingDesignerSystemPrompt(): string {
  return buildSpecialistSystemPrompt(ROUTING_DESIGNER_PROMPT_CONFIG);
}

export function buildRoutingDesignerTaskPrompt(task: TaskPacket): string {
  return buildSpecialistTaskPrompt(task);
}
```

**Agent definition** — same pattern, with:
- ID: `specialist_routing-designer`
- specialization: "State machine routing design with transition completeness verification"
- task_boundary: "Routing design tasks with clear team purpose and member roster"
- deliverable_boundary: "State machine definitions, transition tables, completeness analysis"
- failure_boundary: "Stop when routing design cannot guarantee transition completeness"

**Extension entry** (`extensions/specialists/routing-designer/index.ts`):

```typescript
import { createSpecialistExtension } from "../../shared/specialist-extension.js";
import { ROUTING_DESIGNER_PROMPT_CONFIG } from "./prompt.js";

export default createSpecialistExtension({
  promptConfig: ROUTING_DESIGNER_PROMPT_CONFIG,
  toolName: "delegate-to-routing-designer",
  toolLabel: "Delegate to Routing-Designer",
  toolDescription:
    "Delegate a routing or state machine design task to the routing-designer specialist. " +
    "The routing-designer produces state machine definitions with transition completeness analysis.",
});
```

---

#### Specialist 4: Critic

**Prompt config** (`extensions/specialists/critic/prompt.ts`):

```typescript
import type { TaskPacket } from "../../shared/types.js";
import {
  buildSpecialistSystemPrompt,
  buildSpecialistTaskPrompt,
  type SpecialistPromptConfig,
} from "../../shared/specialist-prompt.js";

export const CRITIC_PROMPT_CONFIG: SpecialistPromptConfig = {
  id: "specialist_critic",
  roleName: "Critic Specialist",
  roleDescription:
    "Evaluate designs for quality, redundancy, proportional complexity, unnecessary abstractions, and reuse opportunities. Quality reviewer in the compliance/quality review split.",
  workingStyle: {
    reasoning:
      "Adversarial evaluation — actively search for what is wrong, wasteful, redundant, or unnecessarily complex before acknowledging strengths.",
    communication:
      "Direct critique with severity rankings and concrete improvement suggestions; lead with the most impactful finding.",
    risk: "Aggressive on identifying waste — prefer flagging potential issues over staying silent; accept some false positives to avoid missing real problems.",
    defaultBias:
      "Prefer simpler solutions and existing reuse over novel abstractions; burden of proof is on complexity.",
  },
  constraints: [
    "You may ONLY evaluate and critique — do NOT rewrite or implement.",
    "Search existing primitives for reuse before approving new creation.",
    "Rank findings by severity: critical, significant, minor.",
    "Do NOT approve designs that have unresolved critical findings.",
  ],
  antiPatterns: [
    "approve designs without searching for existing reuse opportunities",
    "provide vague feedback without concrete improvement suggestions",
    "conflate stylistic preferences with structural problems",
    "skip the reuse search step",
  ],
  inputContract: {
    fields: [
      { name: "priorSummaries", type: "string[]", required: false, description: "Summaries of all prior specialist outputs" },
      { name: "priorDeliverables", type: "string[]", required: false, description: "All prior deliverables" },
    ],
  },
  outputContract: {
    fields: [
      { name: "findings", type: "string[]", required: true, description: "Critique findings ranked by severity" },
      { name: "reuseOpportunities", type: "string[]", required: true, description: "Existing primitives that could be reused" },
      { name: "approved", type: "boolean", required: true, description: "Whether the design passes quality review" },
    ],
  },
};

export function buildCriticSystemPrompt(): string {
  return buildSpecialistSystemPrompt(CRITIC_PROMPT_CONFIG);
}

export function buildCriticTaskPrompt(task: TaskPacket): string {
  return buildSpecialistTaskPrompt(task);
}
```

**Agent definition** — same pattern, with:
- ID: `specialist_critic`
- specialization: "Adversarial design evaluation with reuse scouting"
- task_boundary: "Evaluation tasks with clear subject artifacts and evaluation criteria"
- deliverable_boundary: "Ranked critique findings, reuse opportunities, approval/rejection"
- failure_boundary: "Stop when evaluation cannot proceed without access to the subject artifacts"

**Extension entry** (`extensions/specialists/critic/index.ts`):

```typescript
import { createSpecialistExtension } from "../../shared/specialist-extension.js";
import { CRITIC_PROMPT_CONFIG } from "./prompt.js";

export default createSpecialistExtension({
  promptConfig: CRITIC_PROMPT_CONFIG,
  toolName: "delegate-to-critic",
  toolLabel: "Delegate to Critic",
  toolDescription:
    "Delegate a design evaluation task to the critic specialist. " +
    "The critic evaluates for quality, redundancy, and reuse opportunities.",
});
```

---

#### Specialist 5: Boundary-Auditor

**Prompt config** (`extensions/specialists/boundary-auditor/prompt.ts`):

```typescript
import type { TaskPacket } from "../../shared/types.js";
import {
  buildSpecialistSystemPrompt,
  buildSpecialistTaskPrompt,
  type SpecialistPromptConfig,
} from "../../shared/specialist-prompt.js";

export const BOUNDARY_AUDITOR_PROMPT_CONFIG: SpecialistPromptConfig = {
  id: "specialist_boundary-auditor",
  roleName: "Boundary-Auditor Specialist",
  roleDescription:
    "Audit designs for access control violations, excess context exposure, undeclared assumptions, overly broad permissions, and compliance with the narrow-by-default control philosophy.",
  workingStyle: {
    reasoning:
      "Control philosophy enforcement — for every context exposure, permission grant, or routing authority, verify it is explicitly declared, minimally scoped, and justified.",
    communication:
      "Report boundary violations with exact location, violation type, and minimal remediation path.",
    risk: "Zero tolerance for undeclared context exposure — flag every instance even if it appears benign.",
    defaultBias:
      "Prefer minimal-context, narrow-permission designs; burden of proof is on any request for broader access.",
  },
  constraints: [
    "You may ONLY audit boundaries — do NOT redesign or implement.",
    "Flag every undeclared context exposure, even if seemingly harmless.",
    "Verify all permissions against the narrow-by-default doctrine.",
    "Do NOT approve designs with undeclared routing authority.",
  ],
  antiPatterns: [
    "approve designs with undeclared context exposure because they seem harmless",
    "skip checking hidden routing authority in supposedly downstream primitives",
    "confuse boundary auditing with general code review",
    "accept 'it works' as justification for broad permissions",
  ],
  inputContract: {
    fields: [
      { name: "priorSummaries", type: "string[]", required: false, description: "Summaries of all prior specialist outputs" },
      { name: "priorDeliverables", type: "string[]", required: false, description: "All prior deliverables" },
    ],
  },
  outputContract: {
    fields: [
      { name: "violations", type: "string[]", required: true, description: "Boundary violations found" },
      { name: "exposures", type: "string[]", required: true, description: "Undeclared context exposures" },
      { name: "compliant", type: "boolean", required: true, description: "Whether the design is boundary-compliant" },
    ],
  },
};

export function buildBoundaryAuditorSystemPrompt(): string {
  return buildSpecialistSystemPrompt(BOUNDARY_AUDITOR_PROMPT_CONFIG);
}

export function buildBoundaryAuditorTaskPrompt(task: TaskPacket): string {
  return buildSpecialistTaskPrompt(task);
}
```

**Agent definition** — same pattern, with:
- ID: `specialist_boundary-auditor`
- specialization: "Access control and minimal-context enforcement"
- task_boundary: "Boundary audit tasks with clear subject designs and control requirements"
- deliverable_boundary: "Violation reports, exposure lists, compliance assessment"
- failure_boundary: "Stop when audit cannot proceed without access to the subject designs"

**Extension entry** (`extensions/specialists/boundary-auditor/index.ts`):

```typescript
import { createSpecialistExtension } from "../../shared/specialist-extension.js";
import { BOUNDARY_AUDITOR_PROMPT_CONFIG } from "./prompt.js";

export default createSpecialistExtension({
  promptConfig: BOUNDARY_AUDITOR_PROMPT_CONFIG,
  toolName: "delegate-to-boundary-auditor",
  toolLabel: "Delegate to Boundary-Auditor",
  toolDescription:
    "Delegate a boundary audit task to the boundary-auditor specialist. " +
    "The boundary-auditor checks for access control violations and excess context exposure.",
});
```

---

#### Test pattern (same for all 5)

Each test file (`tests/{name}.test.ts`) follows the builder test pattern with 13 tests per specialist:

```typescript
import { describe, it, expect } from "vitest";
import { build{Name}SystemPrompt, build{Name}TaskPrompt, {NAME}_PROMPT_CONFIG } from "../extensions/specialists/{name}/prompt.js";
import { createTaskPacket } from "../extensions/shared/packets.js";

describe("{NAME}_PROMPT_CONFIG", () => {
  it("has the correct specialist ID", () => {
    expect({NAME}_PROMPT_CONFIG.id).toBe("specialist_{name}");
  });
  it("has the correct role name", () => {
    expect({NAME}_PROMPT_CONFIG.roleName).toBe("{Title} Specialist");
  });
  it("includes all working style fields", () => {
    expect({NAME}_PROMPT_CONFIG.workingStyle.reasoning).toBeTruthy();
    expect({NAME}_PROMPT_CONFIG.workingStyle.communication).toBeTruthy();
    expect({NAME}_PROMPT_CONFIG.workingStyle.risk).toBeTruthy();
    expect({NAME}_PROMPT_CONFIG.workingStyle.defaultBias).toBeTruthy();
  });
  it("has constraints", () => {
    expect({NAME}_PROMPT_CONFIG.constraints.length).toBeGreaterThan(0);
  });
  it("has anti-patterns", () => {
    expect({NAME}_PROMPT_CONFIG.antiPatterns.length).toBeGreaterThan(0);
  });
  it("has output contract", () => {
    expect({NAME}_PROMPT_CONFIG.outputContract).toBeDefined();
    expect({NAME}_PROMPT_CONFIG.outputContract!.fields.length).toBeGreaterThan(0);
  });
});

describe("build{Name}SystemPrompt", () => {
  const prompt = build{Name}SystemPrompt();
  it("includes the role name and ID", () => {
    expect(prompt).toContain("{NAME}_PROMPT_CONFIG.roleName");
    expect(prompt).toContain("specialist_{name}");
  });
  it("includes working style", () => {
    expect(prompt).toContain("Working Style");
  });
  it("includes constraints", () => {
    expect(prompt).toContain("Constraints");
  });
  it("includes anti-patterns", () => {
    expect(prompt).toContain("Anti-Patterns");
  });
  it("includes JSON output format", () => {
    expect(prompt).toContain("```json");
    expect(prompt).toContain('"status"');
  });
});

describe("build{Name}TaskPrompt", () => {
  const task = createTaskPacket({
    objective: "Test objective",
    allowedReadSet: ["file.ts"],
    allowedWriteSet: [],
    acceptanceCriteria: ["Criteria"],
    targetAgent: "specialist_{name}",
    sourceAgent: "orchestrator",
  });
  it("includes task fields", () => {
    const prompt = build{Name}TaskPrompt(task);
    expect(prompt).toContain("Test objective");
    expect(prompt).toContain("file.ts");
  });
  it("includes context when provided", () => {
    const taskWithCtx = createTaskPacket({
      objective: "Test",
      allowedReadSet: [],
      allowedWriteSet: [],
      acceptanceCriteria: [],
      context: { key: "value" },
      targetAgent: "specialist_{name}",
      sourceAgent: "orchestrator",
    });
    expect(build{Name}TaskPrompt(taskWithCtx)).toContain("Additional context");
  });
});
```

---

#### Orchestrator integration tests

Add a new test file `tests/orchestrator-5a-integration.test.ts` with tests verifying:
1. All 9 specialists appear in `SpecialistId` type (compile-time check — if tests compile, this passes)
2. `getPromptConfig()` returns valid config for each of the 5 new specialists
3. `selectSpecialists()` returns the correct specialist for each new keyword set
4. `buildContextForSpecialist()` returns the expected context shape for each new specialist

---

#### File structure summary

**New files (25 total):**

| File | Purpose |
|------|---------|
| `agents/specialists/spec-writer.md` | Agent definition |
| `agents/specialists/schema-designer.md` | Agent definition |
| `agents/specialists/routing-designer.md` | Agent definition |
| `agents/specialists/critic.md` | Agent definition |
| `agents/specialists/boundary-auditor.md` | Agent definition |
| `extensions/specialists/spec-writer/prompt.ts` | Prompt config |
| `extensions/specialists/spec-writer/index.ts` | Extension entry |
| `extensions/specialists/schema-designer/prompt.ts` | Prompt config |
| `extensions/specialists/schema-designer/index.ts` | Extension entry |
| `extensions/specialists/routing-designer/prompt.ts` | Prompt config |
| `extensions/specialists/routing-designer/index.ts` | Extension entry |
| `extensions/specialists/critic/prompt.ts` | Prompt config |
| `extensions/specialists/critic/index.ts` | Extension entry |
| `extensions/specialists/boundary-auditor/prompt.ts` | Prompt config |
| `extensions/specialists/boundary-auditor/index.ts` | Extension entry |
| `tests/spec-writer.test.ts` | 13 tests |
| `tests/schema-designer.test.ts` | 13 tests |
| `tests/routing-designer.test.ts` | 13 tests |
| `tests/critic.test.ts` | 13 tests |
| `tests/boundary-auditor.test.ts` | 13 tests |
| `tests/orchestrator-5a-integration.test.ts` | Integration tests |

**Modified files (5 total):**

| File | Change |
|------|--------|
| `extensions/orchestrator/select.ts` | Extend `SpecialistId`, `WORKFLOW_ORDER`, `SPECIALIST_KEYWORDS` |
| `extensions/orchestrator/delegate.ts` | Add 5 imports, extend `PROMPT_CONFIG_MAP`, extend `buildContextForSpecialist()` |
| `extensions/orchestrator/index.ts` | Extend `READ_ONLY_SPECIALISTS` set |
| `extensions/shared/contracts.ts` | Extend `extractFieldFromResult()` with new field mappings |
| `agents/specialists/_SPECIALISTS_INDEX.md` | Add 5 new entries |

**What this stage does NOT do:**
- Does not add the new specialists to any team definitions (that's 5b+)
- Does not add new delegationHint values to the orchestrator tool params (auto-selection via keywords is sufficient)
- Does not redesign the keyword matching (Stage 5g replaces it with LLM-based selection)

### 5a addendum: Cross-cutting substrate enhancements (Decisions #31-32)

The following enhancements are implemented alongside the 5 new specialists. They strengthen the substrate before creator teams (5b) introduce self-expansion.

#### Semantic adequacy gates (Decision #31)

Add lightweight structural predicates that validate specialist outputs beyond type correctness.

**New module:** `extensions/shared/adequacy.ts` (or fold into `contracts.ts`)

```typescript
interface AdequacyCheck {
  name: string;
  predicate: (result: ResultPacket) => boolean;
  failureMessage: string;
}

interface AdequacyResult {
  adequate: boolean;
  failures: string[];
}

function validateAdequacy(checks: AdequacyCheck[], result: ResultPacket): AdequacyResult;
```

**Integration point:** Called post-parse in `delegateToSpecialist()` (in `delegate.ts`). If `adequate === false`, the result status is overridden to `"failure"` with `failureReason: "quality_failure"`.

**Type change:** Add `"quality_failure"` to the `FailureReason` union in `types.ts`.

**Per-specialist predicates (defined on `SpecialistPromptConfig` via optional `adequacyChecks` field):**

| Specialist | Predicate | Failure message |
|-----------|-----------|----------------|
| planner | `deliverables.length >= 1` | "Planner must produce at least one deliverable" |
| planner | `deliverables.some(d => /verif|test|valid|confirm/i.test(d))` | "Planner output must include at least one verification step" |
| builder | `status !== "success" \|\| deliverables.length >= 1` | "Builder must produce deliverables on success" |
| builder | `status !== "success" \|\| modifiedFiles.length >= 1` | "Builder must report modified files on success" |
| reviewer | `verdict !== "request_changes" \|\| findings.length >= 1` | "Reviewer must include findings when requesting changes" |
| tester | Each test result has evidence field | "Tester results must include evidence" |
| New 5a specialists | Defined per specialist as part of prompt config | — |

**New files:**

| File | Purpose |
|------|---------|
| `extensions/shared/adequacy.ts` | Adequacy validation module |
| `tests/adequacy.test.ts` | Tests for adequacy predicates and integration |

#### Expanded critic spec: primitive classification (Decision #32)

The critic's output format gains a `classifiedAs` field. When evaluating any proposed creation, the critic must classify the subject.

**Additions to critic prompt config:**
- Output format override adds `classifiedAs` field: `"specialist" | "team" | "sequence" | "seed" | "convention" | "tool-capability"`
- Working style directive addition: "When evaluating proposed creations, classify what the subject actually is before evaluating whether it should exist"
- Constraint addition: "Redundancy evaluation must answer: is this a new primitive or a variant of an existing one?"
- Adequacy check: `classifiedAs` field must be present in output when status is success

**Additions to critic agent definition (`agents/specialists/critic.md`):**
- Add "primitive type classification" to scope
- Add "classify proposed creations by primitive type" to expected_outputs

#### Structured tester output (evidence pattern)

Extend the reviewer's structured findings pattern to the tester. Each test result should carry machine-consumable evidence.

**Tester output format addition:**
```json
{
  "testResults": [
    {
      "id": "T1",
      "subject": "What was tested",
      "method": "manual | automated | inspection",
      "expectedCondition": "What should be true",
      "actualResult": "What was observed",
      "passed": true
    }
  ]
}
```

**Additions to tester prompt config:**
- `outputFormatOverride` with the testResults structure above
- Adequacy check: each testResult must have subject, method, and passed fields

#### PrimitiveRegistryEntry type definition

Define the schema that all primitives must eventually satisfy. Creator teams (5b+) must emit registry-compatible entries.

```typescript
interface PrimitiveRegistryEntry {
  id: string;
  version: string;
  kind: "specialist" | "team" | "sequence" | "seed";
  purpose: string;
  inputContract: ContractField[];
  outputContract: ContractField[];
  selectionHints: string[];
  status: "active" | "proposed" | "deprecated";
}
```

**Implementation:** Type definition only in `types.ts`. Manually populate for all 9 specialists after 5a completes. No runtime registry service (that's Stage 5g). Creator teams (5b+) must emit a `PrimitiveRegistryEntry` as part of their output.

**New file:** None — add to `extensions/shared/types.ts`

#### Live subprocess hardening test pass

Validate operational robustness of the subprocess pattern with adversarial test cases.

**New file:** `tests/subprocess-hardening.test.ts`

**Test cases:**
1. Timeout behavior: verify SIGTERM → SIGKILL sequence fires correctly
2. Malformed JSON recovery: partial/corrupted JSON events → graceful fallback
3. Abort mid-stream: abort signal during active output → clean termination
4. Empty output: subprocess exits 0 with no stdout → handled without crash
5. Multiple sequential delegations: verify cleanup between runs
6. Large output: oversized response → no buffer overflow or truncation

**Approach:** Use a test harness subprocess (a simple script that simulates various failure modes) rather than mocking. These tests validate the actual I/O and process management behavior that mocked tests cannot cover.

#### Updated file manifest (5a addendum)

| File | Purpose |
|------|---------|
| `extensions/shared/adequacy.ts` | Adequacy validation module |
| `extensions/shared/types.ts` | Add `quality_failure` to FailureReason, add PrimitiveRegistryEntry |
| `tests/adequacy.test.ts` | Adequacy predicate tests |
| `tests/subprocess-hardening.test.ts` | Live subprocess adversarial tests |

#### Key files to read before implementing

| File | Why |
|------|-----|
| `extensions/specialists/builder/prompt.ts` | Exemplar prompt config to follow |
| `extensions/specialists/builder/index.ts` | Exemplar extension entry |
| `tests/builder.test.ts` | Exemplar test file |
| `agents/specialists/builder.md` | Exemplar agent definition |
| `extensions/orchestrator/select.ts` | Where to register keywords and specialist IDs |
| `extensions/orchestrator/delegate.ts` | Where to register configs and context forwarding |
| `extensions/orchestrator/index.ts` | Where to mark new specialists as read-only |
| `extensions/shared/contracts.ts` | Where to add field extraction mappings |
| `extensions/shared/result-parser.ts` | Where adequacy gates integrate |
| `extensions/specialists/reviewer/prompt.ts` | Exemplar for structured output format (evidence pattern) |

---

## Stage 5a.1 — Token Tracking Substrate

### Purpose

Add token usage tracking to the specialist invocation and team execution infrastructure, including threshold semantics for operational safety. Token usage is currently invisible — there are no fields for it anywhere in the system. This substrate enhancement benefits all observability (dashboard, session artifacts, future cost analysis) and should be in place before heavy team usage begins.

See Decisions #36, #37.

### Key deliverables

**New type: `TokenUsage`**

```typescript
interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}
```

**New type: `TokenThresholds`**

```typescript
interface TokenThresholds {
  warn: number;   // Surface warning in widget/dashboard, execution continues
  split: number;  // Orchestrator should prefer fresh bounded invocation or reduced packet scope
  deny: number;   // Runtime blocks further delegation under current packet shape
}
```

**New type: `ThresholdResult`**

```typescript
type ThresholdLevel = "ok" | "warn" | "split" | "deny";

interface ThresholdResult {
  level: ThresholdLevel;
  currentUsage: number;
  threshold: number;       // The threshold that was hit (or the next one)
  message?: string;
}
```

**Modifications:**

1. **`SpecialistInvocationSummary`** — add optional `tokenUsage?: TokenUsage` field
2. **`TeamSessionArtifact.metrics`** — add `totalTokenUsage?: TokenUsage` rollup field
3. **`extensions/shared/subprocess.ts`** — capture token usage from sub-agent JSON events (Pi's `--print` mode emits usage stats)
4. **Token rollup utility** — aggregate `TokenUsage` across invocations, states, teams
5. **Threshold check utility** — `checkThresholds(usage: TokenUsage, thresholds: TokenThresholds): ThresholdResult`
6. **Threshold integration** — delegation path checks thresholds before spawning; warn emits event, split/deny influence orchestrator behavior

**New files:**

| File | Purpose |
|------|---------|
| `extensions/shared/tokens.ts` | `TokenUsage`, `TokenThresholds`, `ThresholdResult` types, rollup/aggregation utilities, `checkThresholds()` |
| `tests/tokens.test.ts` | Rollup correctness, percentage calculation, partial data handling, threshold checking |

**Modified files:**

| File | Change |
|------|--------|
| `extensions/shared/types.ts` | Add `TokenUsage`, update `SpecialistInvocationSummary`, update `TeamSessionArtifact.metrics` |
| `extensions/shared/subprocess.ts` | Extract token usage from sub-agent JSON events |
| `extensions/teams/router.ts` | Propagate token usage into session artifact metrics |
| `extensions/orchestrator/delegate.ts` | Check thresholds before delegation |

### Exit criteria

- Token usage captured from subprocess output when available
- Invocation summaries include token counts
- Team session artifacts include rollup totals
- Rollup utility correctly aggregates across hierarchy levels
- Threshold check correctly classifies usage against warn/split/deny levels
- Delegation path respects threshold results (warn logs, split/deny influence behavior)
- Tests pass for all token tracking paths including absent/partial data and threshold edge cases

### Dependencies

- Stage 5a complete (expanded specialist roster)

---

## Stage 5a.1b — Hook Substrate

### Purpose

Provide a clean lifecycle mechanism for interception and observation at runtime execution points. Hooks allow policy enforcement, instrumentation, and review without scattering those concerns across orchestration and delegation code. The hook substrate provides the event model that the widget, dashboard, sandboxing, and future features consume.

See Decision #38.

### Design

Three hook classes (Phase 1 implements policy and observer only):

- **Policy hooks** — authoritative gates. May allow/deny execution, attach structured reasons. Must be deterministic. May NOT call models, reroute execution, or mutate orchestration state.
- **Observer hooks** — non-authoritative listeners. May log events, emit artifacts, update projections, collect metrics. May NOT veto execution or rewrite packets.
- **Review hooks** (Phase 2, deferred) — the only hooks that may trigger specialist activity, through explicit packetized invocations visible in traces.

### Key deliverables

**Event surface:**

- `onSessionStart` / `onSessionEnd`
- `onTeamStart`
- `beforeStateTransition` / `afterStateTransition`
- `beforeDelegation` / `afterDelegation`
- `beforeSubprocessSpawn` / `afterSubprocessExit`
- `onAdequacyFailure`
- `onPolicyViolation`
- `onArtifactWritten`
- `onCommandInvoked`

**New types:**

```typescript
interface HookEvent<T = unknown> {
  eventName: string;
  timestamp: string;
  sessionId: string;
  payload: T;
}

interface HookFailure {
  hookId: string;
  eventName: string;
  error: string;
  timestamp: string;
}

type PolicyResult =
  | { allowed: true }
  | { allowed: false; reason: string; annotations?: Record<string, unknown> };
```

**Hook registration and dispatch:**

- `HookRegistry` — local in-process registration (no HTTP, no dynamic code loading)
- Typed event payloads per event (session metadata, packet metadata, token totals, policy envelope, etc.)
- Hook error isolation — a failing hook does not crash execution; failures are typed and visible

**Governance rules:**

1. Hooks do not silently reroute execution
2. Hooks do not gain broad context by default
3. Policy hooks are deterministic
4. Observer hooks are side-effect-limited to approved artifact or telemetry outputs
5. Hook failures are typed and visible

**New files:**

| File | Purpose |
|------|---------|
| `extensions/shared/hooks.ts` | `HookRegistry`, event types, dispatch, hook class definitions |
| `tests/hooks.test.ts` | Registration, dispatch, policy allow/deny, observer side effects, error isolation |

**Modified files:**

| File | Change |
|------|--------|
| `extensions/shared/types.ts` | Add `HookEvent`, `HookFailure`, `PolicyResult` types |
| `extensions/orchestrator/delegate.ts` | Emit `beforeDelegation` / `afterDelegation` events |
| `extensions/shared/subprocess.ts` | Emit `beforeSubprocessSpawn` / `afterSubprocessExit` events |
| `extensions/teams/router.ts` | Emit `onTeamStart`, `beforeStateTransition` / `afterStateTransition` events |

### Exit criteria

- Hook registry supports policy and observer hook registration
- All listed events fire at appropriate execution points
- Policy hooks can block execution with structured reasons
- Observer hooks receive events without blocking execution
- Hook failures are isolated and produce `HookFailure` artifacts
- Tests cover registration, dispatch, policy decisions, error isolation

### Dependencies

- Stage 5a.1 complete (token tracking — hooks may observe token events)

---

## Stage 5a.1c — Deterministic Sandboxing and Path Protection

### Purpose

Convert the existing architectural authority model (read-only specialists, bounded write sets) into deterministic runtime enforcement. The system already thinks in terms of narrow specialists and bounded authority — this stage adds hard enforcement at the subprocess launcher level.

See Decision #38.

### Design

Every delegation carries a **policy envelope** validated before subprocess spawn. The existing `subprocess.ts` becomes a hardened launcher that checks policy before execution and emits structured violations when boundaries are crossed.

### Key deliverables

**New type: `PolicyEnvelope`**

```typescript
interface PolicyEnvelope {
  allowedWritePaths: string[];
  allowedReadRoots: string[];
  allowShell: boolean;
  allowNetwork: boolean;
  allowProcessSpawn: boolean;
  allowedCommands?: string[];
  forbiddenGlobs?: string[];
}
```

**New type: `PolicyViolation`**

```typescript
interface PolicyViolation {
  timestamp: string;
  sessionId: string;
  invocationId: string;
  attemptedAction: string;
  targetPath?: string;
  targetCommand?: string;
  expectedPolicy: Partial<PolicyEnvelope>;
  violationType: "write_denied" | "read_denied" | "shell_denied" | "network_denied" | "spawn_denied" | "command_denied" | "glob_forbidden";
  enforcementResult: "blocked" | "logged";
}
```

**Default authority model:**

- **Read-only by default (7 specialists):** planner, reviewer, critic, spec-writer, schema-designer, routing-designer, boundary-auditor
- **Narrow-write by explicit grant (2 specialists):** builder, tester — only when the packet explicitly grants write paths

**Hardened launcher:**

- Enhance `subprocess.ts` to accept and validate `PolicyEnvelope` before spawn
- Path validation: check write targets against `allowedWritePaths` and `forbiddenGlobs`
- Emit `onPolicyViolation` hook events on boundary violations
- Record `SpawnRecord` artifacts for traceability

**New type: `SpawnRecord`**

```typescript
interface SpawnRecord {
  timestamp: string;
  sessionId: string;
  specialistId: string;
  policyEnvelope: PolicyEnvelope;
  outcome: "spawned" | "blocked";
  blockReason?: string;
}
```

**New files:**

| File | Purpose |
|------|---------|
| `extensions/shared/sandbox.ts` | `PolicyEnvelope` type, policy validation, `validatePathAccess()`, `buildDefaultEnvelope()` |
| `tests/sandbox.test.ts` | Envelope validation, path checks, violation generation, default authority model |

**Modified files:**

| File | Change |
|------|--------|
| `extensions/shared/types.ts` | Add `PolicyEnvelope`, `PolicyViolation`, `SpawnRecord` types |
| `extensions/shared/subprocess.ts` | Accept and enforce `PolicyEnvelope`, emit hook events on violations |
| `extensions/orchestrator/delegate.ts` | Build and attach `PolicyEnvelope` to delegation based on specialist authority class |

### Exit criteria

- Every delegation carries a `PolicyEnvelope`
- Subprocess launcher validates policy before spawn
- Policy violations produce typed `PolicyViolation` records
- Violations fire `onPolicyViolation` hook events
- Read-only specialists cannot gain write access without explicit packet grant
- `SpawnRecord` artifacts capture every subprocess launch
- Tests cover allow/deny paths, all violation types, default authority model

### Dependencies

- Stage 5a.1b complete (hook substrate — violations fire hook events)

---

## Stage 5a.2 — Dashboard Substrate and Persistent Widget

### Purpose

Build the projection layer that derives dashboard-ready state from execution artifacts, and ship the first visible observability surface: a persistent widget showing session health at a glance.

See Decision #36.

### Key deliverables

**Dashboard types:**

```typescript
interface WidgetState {
  sessionStatus: "idle" | "running" | "completed" | "failed" | "escalated";
  activePath: ActivePrimitivePath | null;
  worklistProgress: WorklistProgressView | null;
  hasBlockers: boolean;
  hasEscalation: boolean;
  elapsedMs: number;
  totalTokens: number;
}

interface ActivePrimitivePath {
  team?: string;
  state?: string;
  agent?: string;
}

interface WorklistProgressView {
  total: number;
  completed: number;
  remaining: number;
  blocked: number;
}
```

**Projection layer** — derive widget-ready state from:
- `TeamSessionArtifact` (active path, status, metrics, token usage)
- `WorklistSummary` (progress counts, blockers)
- `DelegationLogEntry[]` (delegation events, failures)
- Token rollup data (from 5a.1)

**Persistent widget** — register via Pi's `ctx.ui.setWidget()`:
- Session status indicator
- Stacked active path (team → state → agent, only levels that exist)
- Worklist progress (total / completed / remaining / blocked)
- Blocker/escalation indicator
- Elapsed time bubble
- Total token count bubble

**New files:**

| File | Purpose |
|------|---------|
| `extensions/dashboard/types.ts` | `WidgetState`, `ActivePrimitivePath`, `WorklistProgressView`, view model types |
| `extensions/dashboard/projections.ts` | Derive widget state from execution artifacts |
| `extensions/dashboard/widget.ts` | Widget rendering and `setWidget` integration |
| `extensions/dashboard/index.ts` | Extension entry point, lifecycle hooks |
| `tests/dashboard-projections.test.ts` | Projection correctness tests |
| `tests/dashboard-widget.test.ts` | Widget state formatting tests |

### Exit criteria

- Widget displays session health at a glance during team execution
- Widget updates as execution progresses (state transitions, worklist changes, token accumulation)
- Widget is compact, stable, and current-session only
- Projections are tested with synthetic artifact data
- Widget degrades gracefully when data is partial or missing

### Dependencies

- Stage 5a.1 complete (token tracking)
- Stage 4e.2 complete (worklist)
- Stage 4d complete (session artifacts, logging)

---

## Stage 5a.3 — Build-Team Validation on Real Tasks

### Purpose

Validate the full orchestration stack by running the existing build-team on actual implementation tasks. This is the first real-world stress test of routing, contracts, delegation, session artifacts, token tracking, and the dashboard widget together.

See Decision #36.

### Approach

This is not a code-delivery stage — it's an **operational validation pass**. The deliverables are observations, bug fixes, and substrate iterations.

1. Select 2–3 bounded implementation tasks suitable for build-team execution
2. Run the build-team end-to-end on each task using the orchestrator
3. Observe dashboard widget behavior during execution
4. Review session artifacts, token data, and delegation logs after each run
5. Identify and fix substrate issues (contract gaps, routing edge cases, context forwarding problems, token tracking gaps)
6. Iterate until a clean end-to-end run produces useful observability data

### Exit criteria

- Build-team has completed at least one real implementation task end-to-end
- Token tracking data is being captured and displayed in the widget
- Session artifacts are complete and informative
- Any substrate bugs discovered have been fixed
- Confidence that the routing/contracts/delegation stack works in practice (not just tests)

### Dependencies

- Stage 5a.2 complete (dashboard widget for observation)
- Stage 5a complete (full specialist roster available)

---

## Stage 5a.4 — `/dashboard` Command (Detailed Inspector)

### Purpose

Ship a near-full-screen, read-only session inspector opened via `/dashboard`. This provides deeper diagnosis than the persistent widget, with structured panels for different observability concerns.

See Decision #36.

### Key deliverables

**Register `/dashboard`** via `pi.registerCommand()`.

**Five panels:**

1. **Overview** — session status, active team/state/specialist, top-line work progress, failure/escalation state, token total, terminal outcome when completed
2. **Tokens** — hierarchical tree with rollups (session → team → state → specialist → invocation), percentages of parent and session total
3. **Execution Path** — structured textual path through the team run: entered state, assigned specialist, result status, transition target, timestamps, iteration counts
4. **Worklist** — full item summary, counts by state, active/completed/blocked/remaining items
5. **Failures / Escalations** — compact failure summary, most recent failure, source stage/specialist, failure category, root cause summary when derivable

**Layout:** Overview-led, with tokens as highly prominent. Modular enough to adjust after real use.

**New/modified files:**

| File | Purpose |
|------|---------|
| `extensions/dashboard/types.ts` | Add panel view model types (`TokenTreeNode`, `ExecutionPathStep`, `FailureSummaryView`, etc.) |
| `extensions/dashboard/projections.ts` | Add panel projection functions |
| `extensions/dashboard/command.ts` | `/dashboard` command registration and rendering |
| `extensions/dashboard/panels/overview.ts` | Overview panel rendering |
| `extensions/dashboard/panels/tokens.ts` | Token tree panel rendering |
| `extensions/dashboard/panels/execution-path.ts` | Execution path panel rendering |
| `extensions/dashboard/panels/worklist.ts` | Worklist panel rendering |
| `extensions/dashboard/panels/failures.ts` | Failures/escalations panel rendering |
| `tests/dashboard-panels.test.ts` | Panel view model and rendering tests |
| `tests/dashboard-command.test.ts` | Command registration and loading tests |

### Exit criteria

- `/dashboard` opens a structured, readable inspector for the current session
- Token spend is attributable hierarchically
- Execution path is legible with state, specialist, status, and transition info
- Work progress and failure state are easy to inspect
- Graceful handling of missing optional data (e.g., no worklist, no failures)

### Dependencies

- Stage 5a.2 complete (dashboard substrate, projection layer)
- Stage 5a.3 informative (validation insights improve panel design)

---

## Stage 5a.6 — Panic and Teardown: Deterministic Descendant Lifecycle Control

### Purpose

Prevent runaway token consumption and orphaned sub-agent processes by implementing a deterministic teardown model for nested agent execution. During Stage 5a.3 validation, a canceled orchestration task continued consuming tokens via orphaned subprocess specialists. This must be fixed before additional orchestration complexity is added. See Decision #43.

**Full design document:** `docs/design/PANIC_AND_TEARDOWN_DESIGN.md`

### Key deliverables

**A. Run Registry** — Parent-owned registry tracking all nested work (sub-agent sessions, subprocesses, tmux panes). Each entry: unique run ID, parent run ID, run kind, lifecycle state, termination handles, cleanup strategy. No fire-and-forget spawning — all nested work must register.

**B. Abort Propagation** — Parent cancellation automatically propagates to all descendants. Covers: nested agent sessions, subprocesses, tmux-backed children. Registry state updated as cancellation progresses.

**C. Settled-State Barrier** — Distinguish between cancellation-requested, cancellation-in-progress, and fully-settled. A task is not "done canceling" until all descendants are terminal (`settled`, `failed`, `killed`, `canceled`).

**D. `/panic` Extension Command** — Emergency stop command. Traverses run registry, attempts graceful shutdown, escalates to forced kill after configurable grace period, reports results. Must be deterministic, safe to invoke repeatedly, and not depend on LLM interpretation.

**E. Graceful-Then-Forced Teardown** — Mark targets as `canceling`, request graceful stop, wait grace period, force-kill remaining, wait for settle, report. Applies to both `/panic` and normal parent-abort flows.

**F. Teardown Reporting** — Structured output: target run count, each descendant termination attempt, escalation events, final settled result. Required even before widget exists.

### Integration points

- `extensions/shared/subprocess.ts` — sub-agent spawn must register in run registry
- `extensions/orchestrator/delegate.ts` — delegation must register and propagate abort
- `extensions/teams/router.ts` — team execution must register and propagate abort
- New: `extensions/shared/run-registry.ts` — run registry implementation
- New: `extensions/shared/teardown.ts` — teardown orchestration logic
- New: `extensions/panic/index.ts` — `/panic` extension command

### Exit criteria

1. All nested work is registered in a parent-owned run registry
2. Parent abort automatically triggers descendant teardown
3. Cancellation is not reported complete until settled state
4. Graceful-then-forced escalation works
5. `/panic` command exists and reports what it stopped
6. No orphaned subprocess survives parent cancellation
7. Documentation explains the teardown model
8. Future widget work has a clean lifecycle state model to consume
9. Validated with controlled failure scenarios (normal completion, parent cancel, panic, ignored graceful stop, repeated panic)

### Dependencies

- Stage 5a.3 complete (specialist delegation proven — needed to understand all spawn paths)

### Relationship to other stages

- **5a.3b–5a.3e** depend on this: no additional orchestration complexity until teardown is reliable
- **5a.4 (dashboard)** should consume run registry state for real-time monitoring
- **5i (task relay)** and **5j (self-respawn)** must respect teardown lifecycle
- Future repo-local policy files (`.pi/policies/teardown.yaml`) should be able to tune grace periods, max depth, max concurrent sub-agents — design must not hard-code these

---

## Stage 5a.3b — Team State Machine End-to-End Validation

### Purpose

Validate that the build-team state machine works end-to-end with real Pi subprocess specialist invocations. Stage 5a.3 validated specialist chains (sequential delegation via `delegationHint`); this stage validates the team router (`teamHint`) with its state machine transitions, revision loops, and session artifacts.

### Key deliverables

- At least one clean build-team run on a real task via `teamHint: "build-team"` with no errors
- Verify state machine transitions execute in correct order (planning → building → review → testing → done)
- Verify team session artifact is produced with complete state trace
- Verify `partial` status transitions work (fixed in 5a.3 but not yet validated live)
- Document any additional substrate bugs found

### Exit criteria

- Build-team completes a real task end-to-end via the team router
- State trace in session artifact matches expected transition sequence
- No missing-transition errors

### Dependencies

- Stage 5a.3 complete (specialist delegation proven)
- `partial` status transitions fixed in team definitions

---

## Stage 5a.3c — Tester Specialist Role Redesign

### Purpose

Redefine the tester specialist from "test runner" to "test author." Running `make test` is a commodity operation any agent can do — it doesn't warrant a specialist invocation. The tester's value is writing tests independently from the implementation, keeping the builder honest. See Decision #40.

### Key deliverables

- Update tester agent definition (`agents/specialists/tester.md`) — role is test authorship, not execution
- Update tester prompt config (`extensions/specialists/tester/prompt.ts`) — working style, output contract, and system prompt reflect test-writing focus
- Update build-team state machine to support the new flow: planner → builder (code) → tester (writes tests) → builder (runs tests, fixes) → reviewer → done
- Update build-team definition in `extensions/teams/definitions.ts`
- Update tests to reflect new tester behavior

### Exit criteria

- Tester specialist's identity is "test author" across agent def, prompt config, and working style
- Build-team state machine supports builder → tester → builder loop
- All existing tests pass with updated definitions
- At least one end-to-end validation with the new flow

### Dependencies

- Stage 5a.3b complete (team state machine proven before redesigning roles)

---

## Stage 5a.3d — Specialist Invocation Patterns

### Purpose

Define lightweight orchestrator-managed invocation patterns for tasks that don't need full team machinery. These are not teams (no state machine, no routing) — they are structured patterns the orchestrator executes directly. See Decision #41.

### Design

**Verified build pattern:**
1. Orchestrator calls builder specialist
2. Orchestrator runs `make typecheck && make test` as a verification gate
3. On failure: loop back to builder with error output (up to N retries)
4. On success: return result
5. No tester or reviewer specialist invoked — cheapest possible structured execution

**Parallel scout pattern:**
1. Orchestrator spawns multiple read-only specialist instances in parallel
2. Each scout reads a bounded file set and reports findings (codebase exploration, pattern discovery, dependency mapping)
3. Orchestrator merges results into a unified report
4. Useful for large codebases where sequential exploration is too slow/expensive

### Key deliverables

- Orchestrator support for named invocation patterns (not just `delegationHint` and `teamHint`)
- `patternHint` parameter on the `orchestrate` tool (e.g., `"verified-build"`, `"parallel-scout"`)
- Verified build implementation with configurable retry count
- Parallel scout implementation with configurable parallelism and file partitioning
- Tests for both patterns

### Exit criteria

- `orchestrate` tool accepts `patternHint` and executes the named pattern
- Verified build loops on test failure and succeeds on retry
- Parallel scout merges results from concurrent specialist invocations
- Both patterns are cheaper (fewer tokens) than equivalent team flows

### Dependencies

- Stage 5a.3b complete (team validation, so patterns are a proven alternative)

---

## Stage 5a.3e — Orchestrator Observability: Live Token Logging

### Purpose

Surface per-specialist token counts and costs in the orchestrator's output so users can monitor efficiency and identify wasteful invocations. Currently token data is tracked internally but buried in session artifacts.

### Key deliverables

- Per-specialist token counts in orchestrator result output (input tokens, output tokens, total)
- Running total across the specialist chain
- Token summary in the synthesized result text (not just `details`)
- Dashboard widget updated to show token consumption per specialist during live orchestration

### Exit criteria

- After each orchestration, the result text includes a token summary table
- Dashboard widget shows per-specialist token usage during and after orchestration
- Users can identify which specialist consumed the most tokens

### Dependencies

- Stage 5a.1 complete (token tracking substrate)

---

## Stage 5a.5 — Convention-Aware Orchestrator

### Purpose

Make the orchestrator automatically discover and forward project conventions to specialist sub-agents, so specialists produce code that conforms to the host repo's patterns without manual prompt engineering.

Currently, specialists receive only their role prompt and a task packet. They have no awareness of the host project's test framework, import style, linter config, or build commands. This causes predictable failures (e.g., using `node:test` in a vitest project, missing `.js` import extensions) that require manual re-runs.

### Problem observed (Stage 5a.3)

During validation, the builder specialist consistently produced code that passed at runtime but violated project conventions — wrong test framework, missing import extensions, not running typecheck. Each failure required a follow-up delegation to fix. The orchestrator should prevent this class of error by giving specialists the context they need upfront.

### Key deliverables

**Convention scanner** — A function that runs once per orchestration session and extracts project conventions from the host repo. Scans for:

| Source | Signals extracted |
|--------|-------------------|
| `AGENTS.md` | Full content (agent-agnostic conventions) |
| `package.json` | Test framework (`vitest`, `jest`, `mocha`), scripts (`test`, `lint`, `typecheck`), type (`module` vs `commonjs`) |
| `Makefile` / `justfile` | Available targets (build, test, lint, typecheck) |
| `tsconfig.json` | Module resolution, strict mode, path aliases |
| `.eslintrc` / `biome.json` | Linter presence and key rules |

**Convention injection** — The orchestrator injects a `projectConventions` section into each specialist's task prompt. This is a compact summary (not raw file dumps) of what the specialist needs to know: test framework, import style, verification commands, and any explicit instructions from AGENTS.md.

**Caching** — Conventions are scanned once per `orchestrate` call (or once per session if session state is available) and reused across all specialist delegations in that call.

### New/modified files

| File | Purpose |
|------|---------|
| `extensions/shared/conventions.ts` | Convention scanner: reads repo files, extracts signals, produces a `ProjectConventions` object |
| `extensions/shared/types.ts` | Add `ProjectConventions` type |
| `extensions/shared/specialist-prompt.ts` | Inject conventions into task prompt |
| `extensions/orchestrator/index.ts` | Call convention scanner before delegation loop |
| `tests/conventions.test.ts` | Scanner tests with mocked file system |

### Design constraints

- **No network calls.** Convention scanning reads only local files in the working directory.
- **Graceful degradation.** If no convention files are found, specialists get no convention context (current behavior). No errors.
- **Compact output.** The injected context should be <500 tokens. Summarize, don't dump raw files.
- **Read-only.** The scanner never modifies repo files.

### Exit criteria

- Convention scanner correctly extracts test framework, import style, and verification commands from at least 3 different project setups (vitest + Makefile, jest + npm scripts, no test config)
- Specialists receive convention context in their task prompts
- A builder specialist in a vitest project produces vitest tests without being told in the task text
- `make typecheck` and `make test` pass

### Dependencies

- Stage 5a.3 complete (validation findings inform what conventions matter most)
- Stage 5a.4 is independent (can be parallelized)

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
5. **Critic** — evaluates: is this specialist warranted? Does it overlap? Is the scope right? Reuse search. **Classifies** the proposed primitive (Decision #32).
6. **Boundary-auditor** — checks for excess context exposure, permission violations
7. **Builder** — implements the TypeScript extension, prompt config, factory integration
8. **Reviewer** — pass/fail on the deliverable against the spec
9. **Tester** — validates the specialist works end-to-end

Not every creation needs every specialist — the planner decides which are relevant.

### Proposal artifact governance (Decision #33)

Creator teams emit a **ProposalArtifact** rather than directly producing active primitives. The proposal goes through a validation gate before activation.

**ProposalArtifact type:**
```typescript
interface ProposalArtifact {
  candidateDefinition: string;    // Agent definition markdown
  registryEntry: PrimitiveRegistryEntry;
  rationale: string;
  criticClassification: string;   // From critic's classifiedAs field
}
```

**State machine addition:** A "propose" state is inserted between the builder's output and activation. The state machine becomes:

`plan → spec → schema → [routing] → critique → audit → implement → **propose** → validate → activate`

- **propose** — builder output packaged as ProposalArtifact
- **validate** — critic (re-checks classification and redundancy on final artifact) + boundary-auditor (re-checks permissions on implementation)
- **activate** — write definition files, register in orchestrator, update registry

Rejection at the validate stage routes findings back to the appropriate earlier stage (spec-writer for spec issues, builder for implementation issues) via existing loop mechanisms.

### Typed deliverables (Decision #34)

Stage 5b introduces the `Deliverable` type to replace `deliverables: string[]`:

```typescript
interface Deliverable {
  kind: "code" | "plan" | "spec" | "test-report" | "review" | "schema" | "routing-def";
  content: string;
  label?: string;
}
```

**Breaking change** to `ResultPacket`. Migration plan:
1. Add `Deliverable` type to `types.ts`
2. Update `ResultPacket.deliverables` from `string[]` to `Deliverable[]`
3. Update `result-parser.ts` to produce typed deliverables
4. Update `synthesize.ts` to handle typed deliverables
5. Update all test fixtures

### Key deliverables

- Specialist-creator team definition (state machine, member roster, I/O contracts)
- Proposal artifact governance: new specialists validated against existing ones for overlap (critic), boundary compliance (boundary-auditor), schema (4c) before activation
- Typed deliverables migration
- At least one specialist successfully created by the team as proof

### Exit criteria

- Creator team can produce a working specialist end-to-end
- Output includes: ProposalArtifact with agent definition `.md`, TypeScript extension, prompt config, tests
- New specialists are validated (no redundancy, passes schema checks, boundary-compliant)
- Proposal → validation → activation flow works end-to-end
- Typed deliverables used throughout the pipeline

### Dependencies

- Stage 5a complete (spec-writer, critic with classification, adequacy gates)
- Stage 4b complete (team infrastructure)
- Stage 4c complete (schema validation for new primitives)
- Stage 4e complete (model routing, worklist for tracking multi-step creation workflows)

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

See Decision #19 and the seed-definition assets under `skills/seed/seeds/`. Note that the interactive `/seed` command is future extension work, not current functionality.

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
- Seed-definition assets in `skills/seed/seeds/` available; real `/seed` extension command remains future work

---

## Stage 5g — Dynamic Selection and Discovery

### Purpose

Replace hardcoded specialist selection with dynamic, capability-aware routing.

**Migration path:** See `docs/FUTURE_WORK.md` "Specialist Selection Migration Path" for the phased approach. Contract-aware pruning should be step 1, LLM tiebreaker step 2. The `PrimitiveRegistryEntry` schema (defined in 5a) provides the data model for discovery.

### Key deliverables

- Discovery service: index available specialists, teams, and sequences at load time, using `PrimitiveRegistryEntry` as the registry data model
- Contract-aware selection pruning: filter candidates by input contract compatibility before heuristic/LLM evaluation
- LLM-based specialist selection: replace keyword heuristics in `select.ts` with capability analysis (after contract pruning)
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

## Stage 5i — Task Relay and Handoff System

### Purpose

Enable the orchestrator to manage bounded, sequential task execution with structured handoff documents, so each agent invocation has clear scope, exit criteria, and responsibility to prepare the next agent's context. This formalizes the pattern: plan upfront, execute in bounded chunks, checkpoint between tasks.

### Design

**Handoff document structure:**
```
docs/handoff/
  STATUS.md          — current project/session state (agent-updated)
  TASK_QUEUE.md      — ordered task list with acceptance checklists
  NEXT_TASK.md       — the active task (read on start, cleared on completion)
  DECISIONS_NEEDED.md — questions requiring human input (agent appends, human resolves)
```

**Relay flow:**
1. Orchestrator reads `NEXT_TASK.md` on invocation
2. Delegates to appropriate specialist(s) based on task spec
3. Specialist completes work, orchestrator verifies exit criteria from task checklist
4. On success: orchestrator pops next task from `TASK_QUEUE.md` into `NEXT_TASK.md`, updates `STATUS.md`
5. On decision needed: appends to `DECISIONS_NEEDED.md`, stops and notifies human
6. On failure: stops, reports to human with diagnostic context

**Task queue format:** Each task entry includes:
- Task ID and title
- Specialist hint (which primitive(s) to use)
- Acceptance checklist (what "done" means)
- Relevant files
- Dependencies (which prior tasks must be complete)
- Human gate flag (whether human review is required before proceeding to next task)

**Key principles:**
- Human authors the campaign plan and detailed specs; agents execute bounded tasks
- Each task is self-contained — an agent with fresh context can execute it from the handoff docs alone
- The orchestrator manages the relay loop; humans gate when the `humanGate` flag is set or when `DECISIONS_NEEDED.md` has unresolved items
- Templates are repo-agnostic — the handoff structure works in any project using my-pi

### Key deliverables

- Handoff document templates (task queue, next task, status, decisions needed)
- `extensions/shared/handoff.ts` — read/write/validate handoff documents
- Orchestrator relay mode: read `NEXT_TASK.md`, execute, update handoff state
- Task queue management: pop next task, check dependencies, respect human gates
- Makefile target or equivalent for manual relay invocation (`make relay`)

### Exit criteria

- Orchestrator can read a task from `NEXT_TASK.md`, delegate it, verify acceptance criteria, and advance the queue
- Human gate stops the relay and surfaces `DECISIONS_NEEDED.md` when flagged
- Handoff documents are correctly updated after each task completion
- A fresh agent invocation with empty context can resume from handoff docs alone
- Templates work in external repos (not hardcoded to my-pi paths)

### Dependencies

- Stage 5a.3 complete (proven specialist delegation)
- Stage 5a.5 complete (convention awareness, so specialists in external repos produce conforming code)

---

## Stage 5j — Context-Aware Self-Respawn

### Purpose

Enable the orchestrator to detect when its context budget is approaching capacity and autonomously checkpoint to handoff documents, then spawn a fresh instance of itself to continue execution — without requiring human intervention. This implements Decision #37 (split/respawn over summarization) as a concrete orchestrator capability.

### Design

**Context budget tracking:**
- The orchestrator monitors its own context consumption (token count or message count) against a configurable threshold
- When the threshold is reached mid-relay, the orchestrator enters "respawn mode" instead of delegating the next task

**Respawn flow:**
1. Orchestrator detects context approaching limit (e.g., 80% of budget)
2. Writes all current state to handoff documents (`STATUS.md`, `NEXT_TASK.md`, `TASK_QUEUE.md`)
3. Includes a respawn marker in `STATUS.md` indicating this was an automatic checkpoint, not a human-initiated stop
4. Spawns a new Pi subprocess with a bootstrap prompt: "Read `docs/handoff/NEXT_TASK.md` and continue the relay"
5. The current orchestrator instance exits cleanly
6. The new instance picks up with fresh context, reads handoff docs, and resumes

**Human-in-the-loop considerations:**
- Self-respawn only occurs when no `humanGate` tasks are pending and `DECISIONS_NEEDED.md` is empty
- If a human gate is next in the queue, the orchestrator stops and notifies rather than respawning
- Configurable: the relay can be set to always require human approval between respawns, or to allow autonomous continuation
- A maximum respawn count prevents runaway loops (default: configurable per task queue)

**Key constraints:**
- The respawn must be lossless — no in-flight specialist work should be lost
- The new instance must not need any state beyond what's in the handoff documents
- The mechanism must work for both my-pi internal development and external repos using my-pi as a coding agent

### Key deliverables

- Context budget monitor (token/message tracking against configurable threshold)
- Respawn checkpoint writer (flush all orchestrator state to handoff docs)
- Self-spawn mechanism (Pi subprocess invocation with bootstrap prompt)
- Respawn marker in `STATUS.md` (distinguishes automatic checkpoint from human stop)
- Maximum respawn guard (prevent infinite loops)
- Configuration surface for respawn behavior (autonomous vs. human-gated, threshold, max respawns)

### Exit criteria

- Orchestrator autonomously respawns when context budget is 80% consumed
- New instance resumes from handoff docs with no loss of task queue state
- Human gates and unresolved decisions prevent automatic respawn
- Maximum respawn count is enforced
- Works in both my-pi and external repos

### Dependencies

- Stage 5i complete (handoff system must exist for respawn to checkpoint into)
- Stage 5a.1 complete (token tracking substrate for budget monitoring)

---

# Stage 6 — Reflective Expertise Layer

## Purpose

Enable specialists to improve over time through governed, typed, versioned expertise overlays — without mutating base specialist identity. See Decision #35 in `DECISION_LOG.md`.

This stage is intentionally sketched at the same level as Stage 5. Details should be informed by real experience from earlier stages, particularly team execution artifacts (4d) and the expanded specialist roster (5a).

---

## Stage 6a — Expertise Types and Registry

### Purpose

Define the core data model for specialist expertise and implement versioned storage with inspection and rollback.

### Key deliverables

- `ExpertiseProfile` type — specialist-specific, scoped (local/global), versioned collection of approved knowledge overlays
- `ExpertiseEntry` type — individual expertise item with category, statement, rationale, applicability tags, exclusions, priority (advisory/strong/critical), confidence, and source lesson references
- `ExpertisePatch` type — proposed additive or subtractive modification to an expertise profile, with rationale, conflict detection, and review status
- Versioned registry storage with diff inspection and rollback capability
- Conflict detection: contradictory entries, redundant entries, entries that weaken specialist boundaries
- Human-readable markdown projections alongside typed authoritative layer

### Exit criteria

- Can create an expertise profile for a specialist with typed entries
- Can propose, review, and apply patches with version tracking
- Profiles are inspectable in both typed and markdown forms
- Conflict detection catches contradictory or redundant entries

### Dependencies

- Stage 5a complete (expanded specialist roster provides the subjects for expertise profiles)

---

## Stage 6b — Context Loader and Runtime Injection

### Purpose

Select relevant expertise overlays at invocation time and inject them into specialist context within bounded token budgets.

### Key deliverables

- Expertise selection by task type, tags, packet metadata, local/global scope, and token budget
- Selection priority ordering: critical boundary rules > task-relevant local expertise > task-relevant global expertise > anti-pattern reminders > quality rules > lower-priority heuristics
- Integration with existing `specialist-prompt.ts` composition pipeline — expertise overlay as a new layer between task context and process constraints
- `ExpertiseInjectionReport` artifact: specialist, profile versions used, selected entry IDs, omitted entry IDs, selection rationale, token budget used, source lesson IDs

### Exit criteria

- A specialist invocation can include selected expertise overlays from its active profile
- Injected content is bounded by token budget and explainable via injection report
- Invocation logs record which expertise entries were used and why
- Base specialist identity is unchanged — overlay is additive only

### Dependencies

- Stage 6a complete (expertise registry must exist)
- Stage 4d (observability infrastructure for injection reports)

---

## Stage 6c — Governance Pipeline

### Purpose

Ensure no expertise change activates without proper validation, review, and versioning.

### Key deliverables

- Lesson and patch lifecycle states: `proposed` → `under_review` → `approved` → `applied` → `deprecated` / `rejected`
- Review approval gates: required before a lesson becomes global, a patch modifies active expertise, a boundary rule changes specialist behavior, or an old entry is removed
- Evidence validation: every expertise entry must trace to source lessons/artifacts
- Scope validation: local lessons checked for repo-specific language before global promotion
- Version stamping: active expertise version recorded in invocation metadata

### Exit criteria

- Patches cannot activate without passing through the governance pipeline
- Applied patches are fully attributable (who proposed, who approved, what evidence, what changed)
- Deprecated or rejected entries are preserved in version history
- Local/global scope boundaries are enforced

### Dependencies

- Stage 6a complete (registry and patch model)

---

## Stage 6d — Local Expertise Pilot

### Purpose

Validate the full expertise overlay mechanism end-to-end with one pilot specialist using local scope only.

### Key deliverables

- Apply 6a-6c to one pilot specialist (likely reviewer — review behavior is observable, quality rules are expressible, failures are identifiable)
- Local scope only — no global expertise in initial pilot
- Manual lesson creation and approval — no automated lesson extraction
- Measurement framework: track reduced repeated mistakes, improved output consistency, fewer correction loops, improved review acceptance rates

### Exit criteria

- One specialist runs with selected local expertise overlays that demonstrably affect its behavior
- Overlays improve specialist output quality without bloating context
- The governance pipeline is exercised end-to-end (create lesson → propose patch → review → apply → inject)
- Injection reports provide clear observability into what was injected and why
- No regression in specialist base behavior when expertise is empty or disabled

### Dependencies

- Stages 6a, 6b, 6c complete
- Sufficient execution history with the pilot specialist to create meaningful initial expertise entries

---

# Stage 7 — Command Surface

## Purpose

Provide user-facing entry points for orchestrated work beyond `/dashboard` (which ships in 5a.4). The command surface should emerge from real usage patterns, not speculative design.

See Decision #17 (amended 2026-04-02) in `DECISION_LOG.md`.

## Current state

`/dashboard` is the only committed command. It is implemented in Stage 5a.4.

## Future commands

Additional commands will be added when repeated user workflows demonstrate a genuine orchestration need. Any future command must satisfy all five governance criteria from Decision #17:

1. It exposes a repeated orchestration pattern that users intentionally invoke
2. It does not bypass contracts, policy enforcement, or artifact generation
3. It does not duplicate a lower-level tool surface without adding orchestration value
4. It projects or initiates behavior through the same substrate as normal execution
5. It remains understandable as a top-level user affordance

This stage will be populated with specific sub-stages as usage patterns emerge from real operation of the system.

### Dependencies

- System in active use (post-5a.3 validation at minimum)

---

## Notes

Stages 5–7 are intentionally sketched at a higher level than Stages 1–4. Their details should be informed by real experience from earlier stages. Do not over-design before the lower layers are proven.

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
        → Stage 4e (substrate hardening: review findings, model routing, worklist)
          → Stage 5a (bootstrap: spec-writer, schema-designer, routing-designer, critic, boundary-auditor)
            → Stage 5a.1 (token tracking substrate)
              → Stage 5a.2 (dashboard substrate + persistent widget)
                → Stage 5a.3 (specialist chain validation)
                  → Stage 5a.6 (panic and teardown — BLOCKING)
                    → Stage 5a.3b (team state machine e2e) → 5a.3c (tester redesign) → 5a.3d (invocation patterns)
                    → Stage 5a.3e (token logging)
                  → Stage 5a.4 (/dashboard command — consumes run registry for real-time monitoring)
              → Stage 5b (specialist-creator team) → 5c (team-creator team)
          → Stage 5d (sequences) → 5e (sequence-creator team)
          → Stage 5f (seed-creator team) [depends on 5b]
          → Stage 5g (discovery)
          → Stage 5h (escalation)
          → Stage 5i (task relay and handoff) → 5j (context-aware self-respawn)
          → Stage 6a (expertise types) → 6b (context loader) → 6c (governance) → 6d (local pilot)
            → Stage 7 (command surface, as justified by real usage)
```

Stages within the same level can be parallelized where dependencies allow. Do not skip stages.
