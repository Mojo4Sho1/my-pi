# ORCHESTRATION_MODEL.md

## Purpose

Defines the system vocabulary and control hierarchy for this repository. All agent definitions, extensions, and tooling should use these terms consistently.

---

## First-Class Objects

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

Current specialists: **planner**, **reviewer**, **builder**, **tester**.

Possible future specialists: debugger, scout, profiler, evaluator, documentation maintainer.

A specialist definition describes: purpose, scope, expected inputs/outputs, allowed actions, context boundaries, escalation conditions, and validation responsibility. See `agents/AGENT_DEFINITION_CONTRACT.md`.

A specialist performs a bounded task and returns a bounded result. It does not manage overall project workflow.

### Team

A reusable grouping of specialists for a recurring class of work. A team defines both membership and a collaboration pattern (not just a roster).

Examples: planning team, build team, QA team, debugging team.

A team definition describes: purpose, member specialists, collaboration order, expected deliverable and handback format, activation conditions, and when not to use the team.

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

## Object Hierarchy

| Layer | Contains | Solves |
|---|---|---|
| **Control** | Orchestrator | Decision-making and state ownership |
| **Execution-pattern** | Sequences | Staged workflow structure |
| **Collaboration** | Teams | Multi-specialist coordination |
| **Worker** | Specialists | Bounded task execution |
| **Context** | Seeds, specs, templates, generated artifacts | Informing and constraining work |

Each layer solves a different problem. Higher layers compose lower layers.

---

## Relationship Model

**Orchestrator → Specialist (direct):** When the task is narrow, output is well-bounded, and no multi-role collaboration is needed.

**Orchestrator → Team:** When the task requires repeated multi-specialist collaboration and the work pattern is stable enough to justify a named bundle.

**Orchestrator → Sequence:** When the task requires multiple stages, ordering matters, and the workflow pattern is likely to recur.

**Orchestrator → Seed:** When bootstrapping a new repo, onboarding a fork, initializing a known project type, or entering a specialized domain.

**Team ↔ Specialist:** A team composes specialists. A specialist may belong to multiple teams.

**Sequence → Team / Specialist:** A sequence may invoke teams, specialists, or both.

---

## Delegation Modes

The orchestrator chooses among four primary modes (which may be combined):

1. **Direct specialist** — one specialist can complete the task cleanly.
2. **Multi-specialist** — multiple narrow specialists needed, but no named team justified.
3. **Team** — a known reusable collaboration pattern exists.
4. **Sequence** — staged execution with checkpoints, parallel branches, or synthesis.

Example combination: invoke a planning sequence → call a build team → call a QA specialist directly → synthesize all outputs.

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

- **Routing and access control** will be enforced by TypeScript extensions, not document prose. Actor definitions carry routing properties (`routing_class`, `context_scope`, `default_read_set`) that extensions read at runtime.
- **Context boundaries** (broad vs. narrow access, packet-based delegation, structured return values, scope-expansion restrictions) are enforced by the orchestrator extension in code.
- **Live project state** is tracked in `STATUS.md`, not in this document.
