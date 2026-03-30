# `my-pi` Design Document: Near-Term Inclusions and Deferred Candidates

## 1. Purpose

This document defines the next set of additions that should be brought into `my-pi` after the current specialist/orchestrator foundation. It is a **design and prioritization artifact**, not an implementation log. It separates:

- additions that should be implemented in `my-pi` with high confidence,
- additions that are compatible with `my-pi` but should remain modular or deferred,
- ideas observed in other systems that do **not** belong in `my-pi` core.

This document is intentionally aligned with `my-pi`’s stated architectural doctrine: reusable primitives before convenience, complexity through composition, orchestrator-first control, explicit access boundaries, contract-governed execution, structured packets over freeform dialogue, and fresh bounded invocation over role mutation.

## 2. Current Architectural Baseline

`my-pi` is already far enough along that new additions should be judged against a real substrate, not a hypothetical one. The current system already has shared packet and routing types, specialist infrastructure, four specialist implementations (planner, builder, reviewer, tester), an orchestrator that selects and delegates, selective forwarding of prior results, and integration tests around the orchestrator lifecycle.

That baseline matters because it means new work should strengthen one of three things:

1. **execution governance**,  
2. **specialist quality and observability**, or  
3. **host-platform adaptation that preserves the project-native architecture**.

Additions that primarily create broad assistant behavior, personal productivity workflows, or host-fork sprawl should be excluded or deferred. `my-pi` explicitly keeps generic life management and broad personal assistant behavior out of scope.

## 3. Design Goals for This Phase

The next phase should optimize for four goals.

First, `my-pi` should become more reliable at **managing coding work as explicit state**, rather than relying on informal narration between specialists. That is directly consistent with its packet- and contract-centered doctrine.

Second, `my-pi` should improve **specialist differentiation**. Right now the planner, builder, reviewer, and tester exist as typed units, but the system still has room to become more explicit about how they differ in model usage, outputs, and lifecycle handling.

Third, `my-pi` should become more **inspectable**. Its foundation emphasizes inspectable execution flows, human-readable and machine-readable parity, and explicit recovery-oriented errors. New additions should make delegated work easier to inspect without changing the doctrinal center.

Fourth, `my-pi` should remain a **substrate**, not a maximal host fork. PI supports host-layer extensibility, including custom tools and overrides of built-in tools, so platform-facing experiments can be added as adapters rather than fused into orchestrator logic.

## 4. Accepted Additions for `my-pi`

## 4.1 Coding-Scoped Worklist Extension

### Decision
Add a **coding-scoped worklist/checklist extension** to `my-pi`.

### Why it belongs
A worklist is one of the strongest additions because it reinforces `my-pi`’s existing strengths instead of pulling it off mission. The point is not to create a personal productivity app. The point is to maintain explicit execution state for coding tasks inside a governed workflow. That fits `my-pi`’s emphasis on packets, contracts, bounded execution, and explicit transitions.

### What it is
This should be a **separate extension package inside the `my-pi` repo**, not part of orchestrator core logic.

Its role is to maintain a structured worklist for the current coding task or workflow, with items such as:

- discovery / planning steps,
- implementation steps,
- validation steps,
- review gates,
- unresolved blockers,
- completion criteria.

The worklist should be typed and machine-usable, but it does not need to be the main routing primitive. Routing remains the orchestrator’s responsibility. The worklist is an **execution-state aid**, not a routing authority.

### Minimum feature set
The first implementation should support:

- create/replace a worklist for the current task,
- append items,
- update item state,
- mark blockers,
- attach an item to a specialist stage,
- expose current state to the active session and to downstream specialists when appropriate.

A small state vocabulary is enough for v1: `pending`, `in_progress`, `completed`, `blocked`, `abandoned`.

### Explicit boundary
This worklist must remain **coding-scoped**. It should not manage general life tasks, personal reminders, or assistant-wide planning. Those belong outside `my-pi`.

### Proposed ownership
`extensions/worklist/`

### Status
**Implement for sure.**

## 4.2 Structured Review Findings Contract

### Decision
Strengthen the reviewer specialist by introducing a more explicit **review findings contract**.

### Why it belongs
The reviewer already exists, but `my-pi`’s doctrine strongly favors machine-checkable structure over loosely formatted prose. A structured review system is useful because it treats findings as machine-usable outputs with priority levels and verdict aggregation. That pattern fits `my-pi` very well if translated into its own packet/contract style.

### What it is
Define a typed reviewer output structure along these lines:

- `verdict`: `approve | request_changes | comment | blocked`
- `findings[]`
  - `id`
  - `priority`
  - `category`
  - `title`
  - `explanation`
  - `evidence`
  - `suggested_action`
  - `file_refs[]` (optional)

A small initial priority ladder is enough, such as:

- `critical`
- `major`
- `minor`
- `nit`

### Why this matters now
This improves three things at once:

- synthesis quality in the orchestrator,
- downstream machine use of reviewer outputs,
- auditability of why a review succeeded or failed.

It also creates a natural future bridge into richer team-level workflows.

### Proposed ownership
- `extensions/shared/contracts.ts`
- `extensions/specialists/reviewer/*`
- `extensions/orchestrator/synthesize.ts`

### Status
**Implement for sure.**

## 4.3 Per-Specialist Model Routing Policy

### Decision
Add an explicit **model-routing policy layer** for specialists.

### Why it belongs
Different specialist roles may deserve different model assignments. That maps cleanly onto `my-pi`’s specialist architecture. Since the planner, builder, reviewer, and tester already exist as differentiated units, adding a role-aware model policy is a natural next step.

### What it is
A policy layer that allows each specialist to resolve its model from:

1. explicit runtime override,
2. project config,
3. specialist default,
4. host default.

This should not alter packet contracts. It should sit in the delegation/config layer.

### Example policy intent
- planner: cheaper or longer-context reasoning model,
- builder: strongest code-editing model available,
- reviewer: strong reasoning / critique model,
- tester: reliable validation-oriented model.

The exact mapping should be configurable and non-authoritative to the architecture.

### Why it belongs in `my-pi`
This is still a coding-substrate concern. It helps the same specialists do their jobs better without broadening project scope.

### Proposed ownership
- `extensions/shared/config.ts` or equivalent new module
- `extensions/orchestrator/delegate.ts`
- specialist config definitions

### Status
**Implement for sure.**

## 4.4 Delegation and Specialist Observability Layer

### Decision
Add a dedicated **observability layer for delegated specialist execution**.

### Why it belongs
`my-pi` already values inspectable execution flows, but that value is currently stronger in doctrine than in the user-facing or operator-facing surface. Delegated work should be easy to inspect. `my-pi` should adopt that principle without copying an entire maximal task system.

### What it is
A lightweight execution-trace layer for orchestrator delegations, including:

- specialist selected,
- packet summary,
- start/stop timestamps,
- status,
- escalation/failure reason,
- structured output summary,
- optional raw-result capture,
- links to artifacts/log files when available.

This does **not** need a large TUI investment now. Start with durable structured logs and machine-readable summaries. Any richer UI can come later.

### Why it matters
This makes failures more debuggable and makes the system easier to reason about during iterative development.

### Proposed ownership
- `extensions/shared/logging.ts`
- `extensions/orchestrator/*`
- optional `artifacts/` or `logs/` conventions

### Status
**Implement for sure.**

## 4.5 Worklist + Orchestrator Interop Rules

### Decision
Define narrow rules for how the orchestrator may interact with the worklist.

### Why it belongs
If a worklist is added, the dangerous failure mode is to let it turn into a second orchestrator. That must not happen. The worklist is helpful only if its relationship to orchestration stays explicit.

### Rules
The orchestrator may:

- initialize a worklist for a multi-step coding task,
- annotate items with specialist lifecycle events,
- update status based on specialist outcomes,
- stop execution if the worklist reflects a blocking condition.

The orchestrator may **not**:

- delegate based solely on worklist contents,
- treat the worklist as authoritative routing,
- allow specialists to invent new routing paths via worklist manipulation.

### Status
**Implement with the worklist feature.**

## 5. Deferred but Compatible Additions

## 5.1 Hashline Editing Extension

### Decision
Treat hashline editing as a **future-work candidate**, not part of the immediate implementation plan.

### Why defer it
This is not because the idea is weak. It is because the rest of `my-pi`’s substrate should stabilize first. Hashline editing is an editing-substrate concern, not an orchestration concern.

### Why it is still compatible
PI allows extensions to override built-in tools such as `read`, `edit`, and `grep` by registering tools with the same names, or to run with `--no-tools` and provide extension-owned tool implementations. That means hashline can be tested as a **separate PI extension** beneath `my-pi` rather than as a rewrite of the orchestrator.

### Proposed posture
- Do **not** add hashline logic to the orchestrator.
- Do **not** make it part of the current milestone.
- When the time comes, test it on a dedicated branch as an editing-substrate extension.
- Adopt it only if it clearly improves edit reliability in practice for the chosen model mix.

### Proposed ownership
A separate package or extension, for example:

- `extensions/hashline-tools/` in the short term, or
- an external companion package later.

### Status
**Future work / potential add.**

## 5.2 Isolated Specialist Execution

### Decision
Mark isolated execution as a **medium-term candidate**.

### Why it is interesting
The ability to run delegated tasks in isolated backends with explicit merge behavior aligns with `my-pi`’s broader philosophy of fresh bounded invocation and explicit execution boundaries.

### Why defer it
It adds operational complexity fast. The current `my-pi` architecture still benefits more from stronger contracts, observability, and routing clarity than from infrastructure-heavy isolation layers.

### Best future shape
If later adopted, it should be introduced as a **specialist execution backend abstraction**, not as ad hoc builder-only behavior.

### Status
**Future work / potential add.**

## 5.3 Richer Team-Level Workflow Objects

### Decision
Keep higher-order workflow objects on the roadmap, but out of this phase.

### Why
The project foundation already makes clear that teams should behave like state machines and sequences come only after lower layers stabilize. That doctrine should be preserved. The next additions should strengthen the existing substrate rather than prematurely broadening the hierarchy.

### Status
**Deferred by design.**

## 6. Explicit Non-Goals for `my-pi`

The following should **not** be added to `my-pi` in this phase:

- assistant-wide personal task management,
- general reminder systems,
- open-ended approval workflows,
- general productivity routing,
- broad discovery/import of external coding-tool ecosystems,
- host-fork style substrate sprawl such as browser automation, generalized plugin marketplaces, or maximal TUI reinvention.

These ideas may be useful elsewhere, but they are not the right next additions for a coding-oriented orchestration substrate. `my-pi` explicitly excludes broad personal assistant behavior, and its architecture is strongest when it remains a durable coding substrate rather than an everything-system.

## 7. Proposed Implementation Order

The recommended order is:

### Phase A
1. Structured review findings contract
2. Per-specialist model routing policy
3. Delegation observability layer

These all tighten the current substrate without adding a new object with ambiguous scope.

### Phase B
4. Coding-scoped worklist extension
5. Worklist/orchestrator interop rules
6. Minimal worklist persistence / surface conventions

This adds an execution-state artifact once the surrounding contract and visibility story is stronger.

### Phase C
7. Branch-based hashline experiment
8. Isolated execution investigation

These should happen only after the main workflow surface is operating reliably.

This order follows the project’s own doctrine of correct primitive behavior before broader convenience or sophistication.

## 8. Testing Requirements

Each accepted addition should come with specific testing expectations.

### Structured review findings
- contract validation tests,
- reviewer parser tests,
- synthesis behavior tests,
- escalation and blocking edge cases.

### Model routing
- config resolution precedence tests,
- fallback behavior tests,
- specialist-specific override tests,
- resumed-session compatibility tests where relevant.

### Observability
- trace generation tests,
- failure logging tests,
- raw/result summary coherence tests.

### Worklist
- state-transition tests,
- blocker handling tests,
- orchestrator interop tests,
- serialization/persistence tests if persistence is implemented.

### Hashline candidate
If later explored, it should be judged with explicit comparative evaluation on the actual `my-pi` model/tool stack, not just by proxy from external benchmarks.

## 9. Risks and Failure Modes

The main risk is **boundary drift**.

The worklist could drift into acting like a second orchestrator. Model routing could drift into hard-coded complexity that obscures specialist identity. Observability could drift into UI work before the underlying artifacts are stable. Hashline experimentation could consume attention that should first go into stabilizing the core workflow substrate.

The way to manage those risks is simple:

- keep routing authoritative in the orchestrator,
- keep editing mechanics below the orchestrator,
- keep assistant-wide workflow out of `my-pi`,
- prefer extensions and adapters over architectural entanglement.

That approach is consistent with both `my-pi`’s project doctrine and PI’s extension model.

## 10. Final Decisions for This Document

### Implement in `my-pi`
- coding-scoped worklist extension,
- structured review findings contract,
- per-specialist model routing policy,
- delegation/specialist observability layer,
- explicit worklist/orchestrator interop rules.

### Keep as future work / potential adds
- hashline editing extension,
- isolated specialist execution backends,
- richer higher-order workflow objects beyond the current layer.

### Keep out of scope for `my-pi`
- assistant-wide task/reminder systems,
- general productivity workflows,
- maximal host-fork feature expansion.

This document intentionally keeps hashline in the “candidate” bucket. That matches the preference to get the rest of the tooling up and running first, then evaluate edit-substrate experiments later in a deliberate branch rather than prematurely binding the project to one evolving approach.