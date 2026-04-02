# DECISION_LOG.md

Append-only record of durable project decisions. Do not rewrite prior entries except to correct factual errors. Mark superseded decisions with `[superseded by #N]`.

When making a new decision, append it to the end with the next number.

## Decisions

### 1. Behavioral steering field is `working_style` (2026-03-08) [active]

Use `working_style` (not `persona`) to keep steering implementation-oriented.

### 2. `working_style` required for specialists (2026-03-08) [active]

Required for specialists, optional for other agent classes until formally upgraded.

### 3. Live state owned by `STATUS.md` (2026-03-08) [active]

Single live-state control plane prevents drift. Originally `docs/handoff/`, simplified to root `STATUS.md`.

### 4. `PROJECT_FOUNDATION.md` is stable architecture only (2026-03-08) [active]

Not a live state source. Live state belongs in `STATUS.md`.

### 5. Top-level `skills/` and `prompts/` are first-class package areas (2026-03-08) [active]

Matching package config and project scope.

### 6. Template contract/index must match actual structure (2026-03-08) [superseded by #12]

Templates archived as part of extension pivot. No longer actively maintained.

### 7. Phase transition to primitive implementation confirmed (2026-03-07) [active]

Confirmed after documentation stabilization.

### 8. Initial specialist set fixed to planner, reviewer, builder, tester (2026-03-07) [active]

Minimum roles to prove the team abstraction.

### 9. Canonical project foundation path is `docs/PROJECT_FOUNDATION.md` (2026-03-07) [active]

### 10. Startup flow: `AGENTS.md` → `INDEX.md` (2026-03-07) [active]

`AGENTS.md` is auto-read first by platform behavior. `INDEX.md` is the universal routing entrypoint.

### 11. Only orchestrator-class actors have broad default routing (2026-03-07) [active]

Downstream actors are narrow by default.

### 12. Pivot to extension-powered orchestration (2026-03-21) [active]

Build TypeScript Pi extensions implementing orchestrator/specialist routing as sub-agents with packet-based delegation and state-machine routing. Contracts and packet validation implemented in TypeScript types and runtime validation. Markdown agent definitions remain as specs that extensions implement. Governance documentation simplified heavily; archived files preserved in `docs/archive/`.

### 13. Consolidate decision tracking into single file (2026-03-22) [active]

Merged `docs/CANONICAL_DECISIONS.md` into root `DECISION_LOG.md`. Single source of truth for all decisions with `[active]`/`[superseded]` status markers. Archived the former file.

### 14. Standardized I/O contracts for all primitives (2026-03-26) [active]

Every primitive (specialist, team, sequence) declares an **input contract** (what it requires in its TaskPacket) and an **output contract** (what it guarantees in its ResultPacket). This applies at every layer:

- **Specialists** declare typed input requirements and typed output schemas (e.g., planner outputs `{ steps, dependencies, risks }`, builder outputs `{ modifiedFiles, changeDescription }`)
- **Teams** are opaque to the orchestrator — the orchestrator sends a team-level TaskPacket and receives a team-level ResultPacket. Intra-team communication is the team's responsibility; the orchestrator only evaluates the outcome.
- **Sequences** compose teams/specialists using the same contract model. Each stage's output contract must satisfy the next stage's input contract.

**Why:** Token efficiency (orchestrator doesn't see intra-team traffic), composability (teams and specialists are interchangeable from the orchestrator's perspective), and machine-checkable validation (contracts can be verified at transition points).

**Rejected alternative:** Passing all prior results to all downstream actors. This creates O(n²) context growth and couples the orchestrator to specialist internals.

**Implementation:** Contracts will be formalized in Stage 4 as part of team routing. Selective context forwarding (Stage 3c.1) is the tactical first step.

### 15. Selective context forwarding between specialists (2026-03-26) [active]

In multi-specialist orchestration, each downstream specialist receives only the context it needs from prior results — not all prior ResultPackets. The orchestrator maps prior outputs to downstream inputs based on specialist type.

**Why:** The current approach of passing all `priorResults` to every specialist creates ~40-50% waste in context tokens. A planner's output is irrelevant to a tester; a builder only needs the plan summary, not the planner's metadata.

**Implementation:** Stage 3c.1 implements a context mapping function. Stage 4 formalizes this as part of I/O contracts.

### 16. Meta-teams produce full implementations, not just specs (2026-03-26) [active]

Meta-teams (specialist-creator, team-creator, sequence-creator) output complete, working implementations — not just definition specs. For a specialist-creator team, that means: agent definition markdown, TypeScript extension code, prompt config, and tests.

**Why:** A spec-only output creates a second manual implementation step that defeats the purpose of self-expansion. The system should be able to create and validate new primitives end-to-end.

**Bootstrapping constraint:** The specialist-creator team may require specialists that don't exist yet (e.g., a spec-writer or scaffolder). These prerequisite specialists must be built manually before the creator team can function. After bootstrap, the creator team can sustain itself.

**Ordering:** Specialist-creator first (Stage 5a), then team-creator (5b), then sequence-creator (5d). Each validates the layer below.

### 17. Slash commands are `/plan`, `/next`, and `/specialist` — not per-specialist (2026-03-26) [active]

The system will NOT register per-specialist slash commands (`/build`, `/review`, `/test`, `/plan-specialist`). Instead, three higher-level commands:

- **`/plan`** — Interactive planning session. User discusses goals with the agent, then the orchestrator selects and invokes the appropriate primitives to execute. This is the primary entry point for new work.
- **`/next`** — Resume an existing plan/campaign from the repo. Orchestrator reads plan state, determines next steps, and executes using available primitives. This is the entry point for continuing work across sessions.
- **`/specialist`** — Interactive discussion about whether a new specialist is needed. Evaluates the gap, checks for redundancy against existing specialists, and delegates to the specialist-creator team (5a) if approved.

**Why:** Per-specialist commands assume the user knows which specialist to invoke. The orchestrator's job is to make that selection. `/plan` and `/next` let the orchestrator do its job. `/specialist` is the user-facing entry to the self-expansion capability.

### 18. Expand specialist set with spec-writer and critic (2026-03-26) [superseded by #20]

Original decision called for spec-writer and critic. Superseded by Decision #20 which defines the full 9-specialist roster.

### 19. Seed-creator team on roadmap (2026-03-26) [active]

A meta-team that creates seeds (reusable bootstrap context packs for setting up project repos). Seeds include instructions (`SEED.md`) and associated template files. Seeds can target fresh repos or forked repos, and will eventually cover non-project use cases too.

**Why:** Seeds are a distinct output type from specialists/teams/sequences, but the creation workflow is similar: design → write spec → create templates → review → validate. The seed-creator team uses the full specialist roster.

**Placement:** Added as Stage 5 item. Depends on specialist-creator team (5b) proving the meta-team pattern.

### 20. Full 9-specialist roster (2026-03-26) [active]

Supersedes Decision #18. The system's specialist roster expands from the initial four (Decision #8) to nine. Each specialist has a distinct reasoning posture — the test for inclusion is whether its cognitive mode cannot be achieved by prompting another specialist differently.

| # | Specialist | Reasoning posture | Distinct from |
|---|---|---|---|
| 1 | **planner** | Step sequencing, dependency ordering, workflow design | — |
| 2 | **spec-writer** | Prose definitions, agent boundaries, working style, "what this does NOT do" | planner (thinks in steps, not boundaries) |
| 3 | **schema-designer** | TypeScript types, packet shapes, I/O contracts, invariants, failure modes, output templates, validation constraints | spec-writer (prose specs); builder (implements, doesn't design types) |
| 4 | **routing-designer** | State machines, transition completeness, escalation paths, unreachable state detection | builder (would implement routing as side effect, not inspectable design artifact) |
| 5 | **builder** | Code implementation — translates specs/schemas/routes into working TypeScript | — |
| 6 | **critic** | Scope evaluation, redundancy detection, reuse search, "should this exist?" | reviewer (pass/fail on acceptance criteria, not big-picture evaluation) |
| 7 | **boundary-auditor** | Access control, minimal-context enforcement, permission review, control philosophy compliance | critic (checks design quality); reviewer (checks deliverable correctness) |
| 8 | **reviewer** | Pass/fail gatekeeping against specific acceptance criteria | — |
| 9 | **tester** | Validation authoring, test writing, conformance checking | — |

**Naming decision:** "schema-designer" (not "contract-writer") because the scope covers types, packets, contracts, templates, and validation shapes — not just contracts. Pairs with "routing-designer" as a fellow design-time specialist.

**Tier 2 fold-ins (capabilities absorbed into existing specialists rather than getting their own):**
- Packet design → folded into schema-designer (packets are typed structures)
- Validation authoring → folded into tester (similar pass/fail reasoning posture)
- Reuse scouting → folded into critic (redundancy detection is already in critic's lens)

**Deferred specialists (real need, premature as standalone):**
- Registry-curator — better handled by tooling until primitive count exceeds ~15-20, then revisit
- Doc-sync auditor — valuable once creator teams generate primitives faster than humans review; revisit when self-expansion is operational

**Bootstrapping:** Five new specialists (spec-writer, schema-designer, routing-designer, critic, boundary-auditor) must be manually built in Stage 5a before the specialist-creator team (5b) can function. After bootstrap, the creator team can sustain itself.

### 21. Extended state machine with loop transitions and fan-out (2026-03-26) [active]

Team routing uses the existing state machine model extended with two additions:

1. **Loop transitions** — A state can transition back to an earlier state (e.g., `critique → revise_spec → critique`). A `maxIterations` guard on loop edges prevents infinite cycles. When iterations are exhausted, the team escalates.
2. **Fan-out states** — A state type that dispatches to multiple specialists and collects results before transitioning. Enables patterns like "critic reviews spec and schema in parallel."

**Critic pass-through:** When the critic has no revisions, it returns `status: "success"` and the state machine transitions forward normally. The loop only activates on `partial`/`failure`.

**Why extended state machine (not DAG):** The state machine is already proven, handles the required patterns (linear, branching, loops), and is incrementally extensible. A DAG-based model would be more expressive but requires a larger rewrite. If the state machine proves limiting in practice (e.g., complex dependency graphs between parallel branches), a DAG model is the natural evolution path.

**Rejected alternative:** DAG-based routing. Deferred as a potential future evolution if the extended state machine proves insufficient.

### 22. Critic reviews artifacts individually with upstream context (2026-03-26) [active]

The critic specialist reviews artifacts one at a time (not batched), but receives relevant upstream context for each review. For example, when reviewing a spec, the critic's task packet includes the plan summary the spec was derived from, enabling alignment checks.

**Why individual reviews:** Narrow context per review (matches narrow-by-default principle), clear traceability (each review produces a distinct result packet tied to a specific artifact), and targeted revisions (if one artifact needs rework, it's clear which one).

**Why upstream context:** Reviewing a spec in isolation misses alignment issues. The critic needs to verify that the spec faithfully implements the plan, so it needs the plan as context. This is the same pattern as selective context forwarding (Decision #15) — each specialist gets only the upstream fields it needs.

**Not a manifest approach:** The critic does not receive a manifest of all artifacts. It receives only the specific upstream artifact(s) relevant to its current review task.

### 23. Intra-team revision loops (2026-03-26) [active]

When a critic (or reviewer) identifies issues with an artifact, the team router sends the critique back to the original author as a new TaskPacket with the critique in the context field. The author revises and the critic re-reviews. This is a loop in the team's state machine.

**Max-iteration guard:** Each loop edge in the state machine has a `maxIterations` limit (e.g., 2-3 revision cycles). When exhausted, the team escalates to the orchestrator rather than looping forever.

**Escalation as safety valve:** If the critique is severe (fundamental scope problem, not a fixable revision), the critic returns `status: "escalation"` which exits the team entirely. The orchestrator decides what to do.

**Why intra-team (not escalation-first):** Keeps the team opaque to the orchestrator (Decision #14). The orchestrator sends a task in and gets a result out — it doesn't need to know about internal revision cycles. The revision logic stays where the domain knowledge lives.

### 24. Stage 4 scope: 4a + 4b together (2026-03-26) [active]

Stage 4a (I/O contracts) and 4b (team router) are implemented together. Contracts without a router are types with no consumer; a router without contracts has nothing to validate.

Stage 4c (schema validation) and 4d (observability) follow as a separate pass — they are independent of 4a/4b and benefit from having both contracts and router available to validate against.

### 25. Fresh-context execution as a first-class principle (2026-03-27) [active]

Fresh context is a design feature, not a workaround. The system should prefer fresh execution episodes with bounded context over long-lived sessions that accumulate stale assumptions and hidden state.

**Core principle:** Continuity should live in repo artifacts (handoff packages, session artifacts, checkpoint packages), not in conversation history or persistent session memory. A fresh agent should be able to pick up work from structured artifacts without needing the prior session's transcript.

**How this already manifests:**
- Specialists are fresh sub-agents with narrow context (narrow-by-default, Decision #11)
- Selective context forwarding passes only relevant fields, not full history (Decision #15)
- Teams are opaque — the orchestrator doesn't see intra-team context (Decision #14)

**How this extends forward:**
- Stage 4d: team session artifacts create durable records of team execution
- Stage 5d: sequence handoff/blocker/checkpoint artifacts enable fresh-context relay across stages
- Future: segment supervision and campaign execution use the same pattern at a higher scale

**Why explicit:** This principle was implicit in the architecture but unstated. Making it explicit ensures that future design decisions (especially around sequences, escalation, and session persistence) don't accidentally introduce long-lived conversational state as a crutch.

### 26. Structured review findings contract (2026-03-30) [active]

Reviewer outputs become typed: `StructuredReviewOutput` containing a `ReviewVerdict` (`approve`/`request_changes`/`comment`/`blocked`) and `ReviewFinding[]` with a priority ladder (`critical`/`major`/`minor`/`nit`). Each finding carries an id, category, title, explanation, evidence, suggested action, and optional file refs.

**Why now:** The reviewer specialist already exists but outputs loosely formatted prose. The project doctrine strongly favors machine-checkable structure. Typed review output improves synthesis quality in the orchestrator, enables downstream machine consumption, and increases auditability. It also creates a natural bridge into future team-level workflows and is needed before the critic specialist (Stage 5a) can consume structured review artifacts.

**Source:** `docs/archive/design/design_doc.md`, Section 4.2.

### 27. Per-specialist model routing policy (2026-03-30) [active]

Each specialist resolves its model via a 4-level precedence chain: explicit runtime override → project config → specialist default → host default. This is a config/delegation concern — it does not alter packet contracts.

**Why:** Different specialist roles may deserve different model assignments (e.g., planner uses a reasoning model, builder uses a code-editing model). Since specialists are already differentiated typed units, role-aware model routing is a natural extension. The resolution chain ensures flexibility without hard-coding complexity.

**Source:** `docs/archive/design/design_doc.md`, Section 4.3.

### 28. Coding-scoped worklist extension (2026-03-30) [active]

A typed execution-state tracker in `extensions/worklist/` maintaining structured worklist items for coding tasks. State vocabulary: `pending`, `in_progress`, `completed`, `blocked`, `abandoned`. The worklist is coding-scoped only — no general life tasks, personal reminders, or assistant-wide planning.

**Critical boundary:** The worklist is an execution-state aid, NOT a routing authority. The orchestrator may initialize, annotate, and update worklist items, but may NOT delegate based solely on worklist contents, treat the worklist as authoritative routing, or allow specialists to invent new routing paths via worklist manipulation. These interop rules prevent the worklist from becoming a second orchestrator.

**Source:** `docs/archive/design/design_doc.md`, Sections 4.1 and 4.5.

### 29. Design doc observability proposal already satisfied by Stage 4d (2026-03-30) [active]

Design doc item 4.4 (Delegation and Specialist Observability Layer) proposed: specialist selection logging, packet summaries, timestamps, status, escalation reasons, structured output summaries, and optional raw-result capture. All of these are already implemented in Stage 4d via `DelegationLogger`, `DelegationLogEntry`, `TeamSessionArtifact`, and related infrastructure.

**Decision:** No additional observability work needed. Stage 4d satisfies the design doc's observability requirements.

### 30. Worklist pre-resolved design: ephemeral + session artifact, pure functions, linear transitions (2026-03-31) [active]

Three design decisions for Stage 4e.2 worklist extension, resolving ambiguities in the original spec:

1. **Persistence model: in-memory + session artifact.** Worklist is in-memory during execution. When orchestration completes, the final worklist state is logged via `appendEntry("worklist_session", ...)` for post-run inspection. Not persisted to disk — inter-session handoff is a sequence-level concern (Stage 5d), not a worklist concern.

2. **Tool surface: pure functions only.** The worklist does NOT register Pi tools. The orchestrator imports and calls worklist functions directly. This enforces the "not a routing authority" boundary — specialists and the host LLM cannot manipulate worklist state. If read-only external visibility is needed later, tools can be layered on top of the pure functions.

3. **State transitions: linear + shortcuts (7 valid transitions).** `pending → in_progress, abandoned`; `in_progress → completed, blocked, abandoned`; `blocked → in_progress, abandoned`; `completed` and `abandoned` are terminal. Invalid transitions are rejected with an error string. This catches bugs where items skip states (e.g., `pending → completed` without going through `in_progress`).

**Why:** These choices minimize complexity while preserving extensibility. The worklist is a substrate aid — it should be invisible to everything except the orchestrator, observable after the fact, and strict enough to catch errors.

### 31. Semantic adequacy gates per specialist (2026-03-31) [active]

Every specialist output is validated for minimum-bar content quality, not just type correctness. Lightweight structural predicates catch "well-typed but useless" outputs cheaply without requiring LLM-based grading.

**Mechanism:** Each `SpecialistPromptConfig` gains an optional `adequacyChecks` field — an array of predicate functions. A new `validateAdequacy(config, result)` function runs these after result parsing. Failure produces `quality_failure` status (new addition to `FailureReason`).

**Per-specialist predicates (initial set):**
- Planner: at least 1 deliverable, at least 1 verification step in deliverables
- Builder: non-empty deliverables when status=success, modifiedFiles present
- Reviewer: findings non-empty when verdict=request_changes
- Tester: evidence field present on each test result
- New specialists (5a): defined per specialist as part of prompt config

**Why:** Type-only validation (Decision #14) catches malformed structure but allows outputs that are structurally valid yet semantically empty — e.g., a planner returning zero deliverables, a reviewer returning request_changes with no findings. Adequacy gates close this gap at minimal cost.

**What this is NOT:** Not LLM-based grading, not full semantic validation, not a replacement for critic/reviewer evaluation. It's a cheap structural floor that catches the most obvious inadequacy modes.

**Implement as part of Stage 5a.**

### 32. Critic as primitive classifier (2026-03-31) [active]

The critic specialist's responsibilities are expanded from "scope evaluation, redundancy detection, reuse search" to also include **primitive type classification**. When evaluating any proposed creation, the critic must classify the subject as: specialist, team, sequence, seed, convention, or tool-capability.

**Why:** Once the system can create primitives (Stage 5b+), distinguishing primitive types becomes critical. Without explicit classification, the system risks ontology sprawl — creating new specialists for things that should be team configurations, seeds, or project conventions. The critic is the natural home for this responsibility because it already performs "should this exist?" evaluation.

**Implementation:** Add `classifiedAs` field to critic's structured output format. Add classification criteria to critic's working style directives and constraints. Redundancy evaluation must answer "is this a new primitive or a variant of [existing]?"

**Classification categories:** specialist | team | sequence | seed | convention | tool-capability

**Implement in Stage 5a critic spec.**

### 33. Proposal artifact governance for creator teams (2026-03-31) [active]

Creator teams (5b+) emit a **ProposalArtifact** (candidate definition + PrimitiveRegistryEntry + rationale) rather than directly producing active primitives. A validation gate separates creation from activation.

**Flow:** create → propose → critic gate (classification, redundancy, scope) → boundary-auditor gate (permissions, context exposure, narrow-by-default) → activate (write definition + extension + register). Rejection routes findings back to the creator team for revision using existing loop mechanisms.

**Why:** Direct activation from creator teams risks unvalidated primitives entering the system. The proposal stage creates a governance checkpoint that leverages the critic and boundary-auditor specialists already in the roster, and fits naturally into the team state machine as a new "propose" state before "implement."

**Design in Stage 5b.**

### 34. Typed deliverables (2026-03-31) [active]

Replace `deliverables: string[]` with `deliverables: Deliverable[]` where `Deliverable` carries a `kind` field, enabling downstream consumers to distinguish artifact types without inspecting content.

```typescript
interface Deliverable {
  kind: "code" | "plan" | "spec" | "test-report" | "review" | "schema" | "routing-def";
  content: string;
  label?: string;
}
```

**Why:** Currently all deliverables are untyped strings. Downstream specialists, teams, and the orchestrator synthesizer must inspect content to understand what they're consuming. Typed deliverables make artifact classification machine-readable, which becomes important when creator teams produce multi-artifact outputs and when contract validation needs to reason about artifact types.

**Breaking change** to `ResultPacket`. Requires migration of result-parser, synthesize, and all consumers.

**Implement in Stage 5b** (coincides with creator team work, which is the first consumer that strongly needs typed deliverables).
