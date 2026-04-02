# ORCHESTRATION_MODEL.md

## Purpose

Defines the system vocabulary and control hierarchy for this repository. All agent definitions, extensions, and tooling should use these terms consistently.

---

## Control Doctrine

The orchestrator is the broad-context control authority. Everything else exists to execute, constrain, validate, or explain work under that control model.

The primitive build order remains:

1. Specialists
2. Teams
3. Sequences

Higher layers compose lower ones. Supporting artifacts such as contracts, packets, worklists, logs, templates, and seeds inform or govern execution, but they do not replace the primitive hierarchy.

---

## Primitive Execution Objects

### Orchestrator

The top-level control agent. Responsible for:

- Reading current work state and selecting execution strategy
- Deciding whether to delegate to specialists, teams, or sequences
- Filtering and packaging context for downstream actors
- Receiving and synthesizing returned results
- Updating project state after work completes

The orchestrator is the only actor that holds broad context by default. It remains above all other execution structures — teams, sequences, and any future constructs report upward into the orchestrator.

### Specialist

The primitive execution unit. A specialist owns one narrow class of work and requires only bounded context.

The current implemented roster has nine specialists:

- **planner** — sequencing, decomposition, dependency-aware execution planning
- **builder** — implementation and code changes
- **reviewer** — contract and acceptance review
- **tester** — validation and execution evidence
- **spec-writer** — prose definitions, boundaries, working style, non-goals
- **schema-designer** — TypeScript types, packet shapes, I/O contracts, invariants
- **routing-designer** — state machines, transitions, escalation paths, routing completeness
- **critic** — scope evaluation, redundancy detection, reuse search, primitive classification
- **boundary-auditor** — access control, minimal-context enforcement, control-philosophy compliance

A specialist definition describes: purpose, scope, expected inputs/outputs, allowed actions, context boundaries, escalation conditions, and validation responsibility. See `agents/AGENT_DEFINITION_CONTRACT.md`.

A specialist performs a bounded task and returns a bounded result. It does not manage overall project workflow.

### Team

A reusable grouping of specialists for a recurring class of work. A team defines both membership and a collaboration pattern (not just a roster).

Examples: planning team, build team, QA team, debugging team.

A team definition describes: purpose, member specialists, collaboration order, expected deliverable and handback format, activation conditions, and when not to use the team.

Teams are state-machine-driven, not conversational swarms. They are opaque to the orchestrator at runtime: the orchestrator sends a team-level task packet in and receives a team-level result packet out.

The orchestrator may call a specialist directly instead of a team when the task is too small to justify the team structure.

### Sequence

A reusable execution pattern that defines **how work proceeds over time** (whereas a team defines **who is involved**).

A sequence may invoke specialists, teams, or mixed combinations.

Examples:
- plan → review → build → test → summarize
- scout → gap report → planning
- reproduce → debug → verify

A sequence definition describes: purpose, activation conditions, ordered stages, optional parallel stages, merge/synthesis points, stop conditions, and expected deliverable.

The orchestrator selects and runs sequences. A sequence does not supersede the orchestrator.

### Seed

A reusable bootstrap context pack. A seed is **not** an agent, team, or sequence.

Seeds provide structured starting context for a class of repositories, domains, or tasks (e.g., new project seed, profiling project seed).

A seed may define: starting assumptions, recommended repo structure, recommended documentation layout, expected artifacts, recommended specialists/teams/sequences, and domain-specific concerns.

Seeds inform orchestration and setup. They do not execute work. Seeds may be implemented through templates, but remain conceptually distinct — templates describe **how artifacts are generated**; seeds describe **what initialization context should exist**.

---

## Supporting Artifacts and Runtime Surfaces

### Contracts

Normative machine-readable definitions of what an object requires, guarantees, or permits.

Examples: specialist input/output contracts, routing validity rules, validation constraints, proposal governance checks.

Contracts govern execution. They are not execution actors.

### Packets

The bounded transfer objects used to hand work and results between execution units.

Task packets define what should be done and with what bounded context. Result packets define what happened, what was produced, and whether execution succeeded, failed, or escalated.

Packets carry execution state between actors. They are first-class and authoritative over free-form narration.

### Execution Artifacts

Structured records emitted during or after execution for observability, validation, and recovery.

Examples: delegation logs, worklist summaries, review/test outputs, team session artifacts, token summaries, future expertise injection reports.

Artifacts support inspection and projection. They do not independently route work.

### Templates

Reusable construction aids for creating valid specialists, teams, sequences, seeds, or supporting files. Templates help produce consistent artifacts but are not themselves governance rules.

### Registry Entries

Typed index records describing active primitives and their metadata. Registry entries support discovery and governed activation; they are not substitutes for the primitives they describe.

### Platform Adapters

Host-runtime implementations of project-native concepts. In this repository, Pi extensions are adapters that realize orchestrator, specialists, routing, observability, and command surfaces.

Adapters implement the architecture. They do not redefine it.

### Command Surface

User-facing commands are entry points or inspectors layered on top of orchestration. They are not a separate primitive class and they must not become hidden routing authorities.

The current doctrine is intentionally narrow:

- `/dashboard` is the only committed command on the roadmap
- future commands must emerge from repeated real usage
- commands must go through the same contracts, policy, and artifact substrate as ordinary execution

### Hooks, Policy, and Observability Surfaces

Runtime hooks, policy envelopes, widgets, dashboards, and related observer surfaces are substrate layers, not execution primitives.

Their role is to observe, constrain, and project execution without becoming a second orchestrator. They may block unsafe actions when policy says so, but they do not invent alternate routing logic outside explicit orchestration contracts.

---

## Object Hierarchy

| Layer | Contains | Solves |
|---|---|---|
| **Control** | Orchestrator | Decision-making and state ownership |
| **Execution-pattern** | Sequences | Staged workflow structure over time |
| **Collaboration** | Teams | Multi-specialist coordination via state machines |
| **Worker** | Specialists | Bounded task execution |
| **Governance/Data** | Contracts, packets, artifacts, registry entries | Validation, transfer, observability, activation |
| **Context** | Seeds, templates, specs, generated artifacts | Bootstrapping and constraining work |
| **Adapter/UI** | Platform adapters, hooks, widget, `/dashboard` | Host-runtime enforcement and projection |

Each layer solves a different problem. Higher layers compose lower layers.

---

## Relationship Model

**Orchestrator → Specialist (direct):** When the task is narrow, output is well-bounded, and no multi-role collaboration is needed.

**Orchestrator → Team:** When the task requires repeated multi-specialist collaboration and the work pattern is stable enough to justify a named bundle.

**Orchestrator → Sequence:** When the task requires multiple stages, ordering matters, and the workflow pattern is likely to recur.

**Orchestrator → Seed:** When bootstrapping a new repo, onboarding a fork, initializing a known project type, or entering a specialized domain.

**Orchestrator → Command surface:** Commands are user affordances that enter or inspect orchestration. They do not bypass it.

**Team ↔ Specialist:** A team composes specialists. A specialist may belong to multiple teams.

**Sequence → Team / Specialist:** A sequence may invoke teams, specialists, or both.

**Hooks / policy / dashboard → Execution artifacts:** These surfaces observe or project authoritative execution records. They do not become alternate sources of truth.

---

## Delegation Modes

The orchestrator chooses among four primary modes (which may be combined):

1. **Direct specialist** — one specialist can complete the task cleanly.
2. **Multi-specialist** — multiple narrow specialists needed, but no named team justified.
3. **Team** — a known reusable collaboration pattern exists.
4. **Sequence** — staged execution with checkpoints, parallel branches, or synthesis.

Example combination: invoke a planning sequence → call a build team → call a QA specialist directly → synthesize all outputs.

---

## Current Realization

The current codebase has implemented:

- the 9-specialist roster
- orchestrator delegation to specialists and teams
- team routing with contracts, revision loops, and session artifacts
- worklist-based execution-state tracking

The following remain roadmap items rather than current runtime capabilities:

- sequence execution
- seed-creator workflows
- `/dashboard` command and widget surfaces
- reflective expertise overlays

This document defines the vocabulary for both current and near-roadmap objects; live completion state belongs in `STATUS.md`.

---

## Design Goals

1. Keep context disciplined.
2. Keep responsibilities explicit.
3. Keep reusable patterns modular.
4. Keep the orchestrator in control of broad state.
5. Keep specialists simple and bounded.
6. Support staged multi-agent workflows without collapsing into a monolithic harness.
7. Allow seeds, templates, teams, and sequences to evolve independently.
8. Make routing and access policy part of the primitive system rather than an afterthought.
9. The orchestrator remains the top-level control authority — this holds even as the model extends to support team managers, nested teams, or multi-team orchestration.

---

## Implementation Notes

- **Routing and access control** are enforced by TypeScript extensions, not by prose alone.
- **Context boundaries** (broad vs. narrow access, packet-based delegation, structured return values, scope-expansion restrictions) are enforced by the orchestrator and runtime substrate in code.
- **Artifacts are authoritative for observability.** Widget and dashboard surfaces should project from structured records, not reconstruct truth from transcript text.
- **Reflective expertise is additive, not mutative.** Future expertise overlays extend specialist invocations through governed typed overlays; they do not rewrite specialist identity or change the primitive hierarchy.
- **Live project state** is tracked in `STATUS.md`, not in this document.
