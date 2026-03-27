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
