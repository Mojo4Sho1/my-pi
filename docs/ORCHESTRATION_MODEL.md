# ORCHESTRATION_MODEL.md

## Purpose

This document defines the control hierarchy and execution model for this repository.

It establishes the first-class objects that the system uses to organize work:

- orchestrator
- specialist
- team
- sequence
- seed

It also defines how these objects relate to one another and how they interact with repository artifacts such as workflow documents, handoff documents, specs, templates, and generated outputs.

This document defines the model. It does **not** define the step-by-step operating procedure for the orchestrator. That belongs in `docs/WORKFLOW.md`.

---

## Core principle

The orchestrator is the only actor that holds the broadest working view of the repository state by default.

All other actors work from narrowed task context.

This design exists to:

- control context size
- preserve modularity
- improve specialization
- reduce drift between actors
- make delegation and handoff explicit
- support future multi-stage and multi-team execution

---

## First-class objects

### 1. Orchestrator

The orchestrator is the top-level control agent.

The orchestrator is responsible for:

- reading the operating workflow
- reading current work state
- reading the next task definition
- selecting the correct execution strategy
- deciding whether to delegate to a specialist, multiple specialists, a team, a sequence, or a combination
- filtering and packaging context for downstream actors
- receiving and synthesizing returned results
- updating project state and handoff artifacts after work completes

The orchestrator remains above all other execution structures.

A team does not replace the orchestrator.  
A sequence does not replace the orchestrator.  
A future manager-of-team construct, if ever added, still reports upward into the orchestrator.

The orchestrator is the persistent coordinating layer.

---

### 2. Specialist

A specialist is the primitive execution unit.

A specialist owns one narrow class of work and should require only bounded context.

Examples include:

- planner
- reviewer
- builder
- tester
- debugger
- scout
- profiler
- evaluator
- documentation maintainer

A specialist definition should describe:

- purpose
- scope
- expected inputs
- expected outputs
- allowed actions
- context boundaries
- escalation conditions
- validation responsibility

A specialist does not manage overall project workflow.  
A specialist performs a bounded task and returns a bounded result.

---

### 3. Team

A team is a reusable grouping of specialists for a recurring class of work.

A team is not only a membership list.  
A team also defines a collaboration pattern.

Examples include:

- planning team
- build team
- QA team
- debugging team
- scouting team
- profiling team

A team definition should describe:

- purpose
- member specialists
- default collaboration order or interaction pattern
- expected deliverable
- expected handback format
- activation conditions
- when not to use the team

A team exists to package a repeatable multi-specialist pattern.

The orchestrator may choose to call a specialist directly instead of a team when the task is too small to justify the team structure.

---

### 4. Sequence

A sequence is a reusable execution pattern.

A sequence defines **how work proceeds over time**.  
A team defines **who is involved**.

A sequence may invoke:

- one specialist
- multiple specialists
- one team
- multiple teams
- mixed combinations of specialists and teams

Examples include:

- plan -> review -> build -> test -> summarize
- scout -> gap report -> planning
- reproduce -> debug -> verify
- profile -> analyze -> report

A sequence definition should describe:

- purpose
- activation conditions
- ordered stages
- optional parallel stages
- merge or synthesis points
- stop conditions
- expected final deliverable
- expected final handback format

A sequence is the reusable representation of a workflow pattern.

The orchestrator selects and runs sequences.  
A sequence does not supersede the orchestrator.

---

### 5. Seed

A seed is a reusable bootstrap context pack.

A seed is **not** an agent.  
A seed is **not** a team.  
A seed is **not** a sequence.

A seed provides structured starting context for a class of repositories, domains, or tasks.

Examples include:

- new project seed
- profiling project seed
- research project seed
- forked codebase seed

A seed may contain or define:

- starting assumptions
- recommended repository structure
- recommended documentation layout
- expected artifacts
- recommended specialists
- recommended teams
- recommended sequences
- initial setup or scouting expectations
- domain-specific concerns
- missing-item discovery guidance

A seed informs orchestration and setup.  
A seed does not itself execute work.

---

## Object hierarchy

The system uses the following conceptual hierarchy:

### Control layer
- orchestrator

### Execution-pattern layer
- sequences

### Collaboration layer
- teams

### Worker layer
- specialists

### Context layer
- seeds
- specs
- handoff documents
- templates
- generated artifacts

This hierarchy matters because each layer solves a different problem:

- the orchestrator decides
- sequences structure execution
- teams package collaboration
- specialists perform bounded work
- context artifacts inform and constrain the work

---

## Relationship model

### Orchestrator and specialists

The orchestrator may delegate directly to a specialist when:

- the task is narrow
- the required output is small and well-bounded
- no multi-role collaboration is needed
- the overhead of a team is unnecessary

### Orchestrator and teams

The orchestrator may delegate to a team when:

- the task requires repeated multi-specialist collaboration
- the work pattern is stable enough to justify a named bundle
- the deliverable benefits from role separation
- the team definition provides a cleaner interface than individual delegation

### Orchestrator and sequences

The orchestrator may invoke a sequence when:

- the task requires multiple stages
- the ordering of work matters
- the task includes checkpoints or synthesis phases
- the workflow pattern is likely to recur

### Orchestrator and seeds

The orchestrator may consult a seed when:

- bootstrapping a new repo
- onboarding a forked repo
- initializing a known project type
- entering a specialized domain
- determining expected missing artifacts or setup gaps

### Teams and specialists

A team composes specialists.  
A specialist may belong to multiple teams.

### Sequences and teams

A sequence may invoke teams, specialists, or both.

### Seeds and templates

Seeds may be implemented through templates, but seeds remain conceptually distinct from templates.

Templates describe **how artifacts are generated**.  
Seeds describe **what initialization context should exist**.

---

## Access and routing model

Route eligibility is a property of the actor definition, not just a reader choice.

This means the system should not rely only on prose instructions like "read this" or "do not read this." Instead, access expectations should be carried in the definition of the orchestrator, specialist, team, or sequence actor.

The access and routing model exists to ensure that:

- broad context is reserved for the right actors
- downstream actors do not pollute their own context windows
- routing decisions remain explicit and inspectable
- documentation access policy is part of the primitive system design

### Core rule

The orchestrator is broad-context by default.  
All other actors are narrow-context by default unless explicitly granted broader access.

### Recommended access properties

Actor definitions carry properties such as:

- role type
- routing class
- context scope
- default read set
- restricted-by-default documents
- whether the actor can update handoff state
- whether the actor can update workflow or operating documents

These properties do not have to be fully schematized in this document, but the model assumes that such routing and access information belongs to the actor definition itself.

### Default routing classes

A useful default split is:

- `orchestrator` -> broad route
- `downstream` -> narrow route

A future system may refine this further, but the broad-versus-narrow distinction should remain central.

### Default update authority

By default:

- the orchestrator may read and update broad operating state
- downstream actors may not read or update broad operating state unless explicitly permitted

This keeps the continuity layer coherent and prevents partial-state pollution from bounded workers.

---

## Context boundary rules

### Rule 1: only the orchestrator reads broadly by default

The orchestrator reads the broadest operational context.

Specialists and teams should not read the full workflow or broad repository state by default unless the orchestrator explicitly decides that the task requires it.

### Rule 2: downstream actors work from packets

The orchestrator should provide narrowed task context to all downstream actors.

That packet should include only what is necessary for the delegated work.

### Rule 3: actors should not self-expand scope by default

A specialist, team, or sequence should not assume permission to widen its own context without cause.

If broader context is required, that should be surfaced back upward.

### Rule 4: returned outputs should be structured

Downstream actors should return structured deliverables rather than broad narrative dumps.

That keeps synthesis clean and allows the orchestrator to integrate results efficiently.

### Rule 5: route eligibility belongs to the actor definition

Whether an actor follows the broad route or narrow route should be determined by its definition.

This keeps access policy modular and makes later changes easy to apply by updating the primitive definitions rather than rewriting the whole documentation system.

### Rule 6: broad-state update authority is restricted by default

Workflow documents, handoff documents, and other broad-state artifacts should be updated only by actors explicitly granted that authority.

In the default model, that authority belongs to the orchestrator.

---

## Repository artifact model

The orchestration system relies on several classes of repository artifacts.

### 1. Operating documents

These define how the repository works.

Examples:
- `AGENTS.md`
- `docs/WORKFLOW.md`
- `docs/ORCHESTRATION_MODEL.md`
- `docs/OPERATING_MODEL.md`

### 2. Handoff documents

These define current state and near-term work.

Examples:
- `docs/handoff/CURRENT_STATUS.md`
- `docs/handoff/NEXT_TASK.md`
- `docs/handoff/TASK_QUEUE.md`
- `docs/handoff/DECISION_LOG.md`

### 3. Specification documents

These define system or project truth in depth.

Examples:
- architecture
- interfaces
- validation strategy
- domain-specific design notes

### 4. Agent-definition artifacts

These define specialists, teams, sequences, and the orchestrator definition.

Examples:
- `agents/specialists/...`
- `agents/teams/...`
- `agents/sequences/...`
- `agents/orchestrator.md`

### 5. Seed artifacts

These define reusable bootstrap context packs.

Examples:
- `seeds/new-project/...`
- `seeds/profiling-project/...`

### 6. Template artifacts

These define how files are generated.

Examples:
- extension templates
- prompt templates
- skill templates
- theme templates

---

## Delegation model

The orchestrator chooses among four primary delegation modes:

### Mode 1: direct specialist delegation

Use when one specialist can complete the task cleanly.

### Mode 2: multi-specialist delegation

Use when multiple narrow specialists are needed, but the task does not justify invoking a named team.

### Mode 3: team delegation

Use when a known reusable collaboration pattern already exists.

### Mode 4: sequence execution

Use when the task requires staged execution, multiple checkpoints, parallel branches, synthesis, or a recurring workflow pattern.

These modes may be combined.

For example, the orchestrator may:

- invoke a planning sequence
- then call a build team
- then call a QA specialist directly
- then synthesize all outputs itself

---

## Present and future boundary

### Present model

At present, the system should assume:

- one top-level orchestrator
- specialists as the primitive reusable work units
- teams as reusable bundles of specialists
- sequences as reusable workflow patterns
- seeds as reusable bootstrap context packs
- actor definitions carry routing and access properties
- broad-state authority belongs to the orchestrator by default

### Future extension space

The model may later support:

- team managers
- nested teams
- multi-team orchestration layers
- dynamically selected delegation logic
- automated seed generation
- automated sequence generation
- richer artifact synthesis and reporting
- more granular routing classes
- explicit access-control or context-packet tooling

These future extensions do not alter the current core rule:

**the orchestrator remains the top-level control authority.**

---

## Design goals

This orchestration model exists to satisfy the following goals:

1. Keep context disciplined.
2. Keep responsibilities explicit.
3. Keep reusable patterns modular.
4. Keep the orchestrator in control of broad state.
5. Keep specialists simple and bounded.
6. Support staged multi-agent workflows without collapsing into a monolithic harness.
7. Allow seeds, templates, teams, and sequences to evolve independently.
8. Make routing and access policy part of the primitive system rather than an afterthought.

---

## Non-goals

This model does not attempt to:

- define the exact workflow startup order
- define the exact structure of every handoff artifact
- define the template contract
- define the exact schema for specialists, teams, sequences, or seeds
- define implementation details for Pi extensions

Those concerns belong in their own documents.

---

## Summary

This repository uses an orchestrator-first execution model.

The orchestrator remains the top-level control layer.  
Specialists are the primitive execution units.  
Teams are reusable bundles of specialists.  
Sequences are reusable execution patterns.  
Seeds are reusable bootstrap context packs.

The orchestrator reads broad context, chooses the proper execution structure, passes narrowed context downward, receives structured results back, and updates repository state accordingly.

Route eligibility and broad-state authority are properties of actor definitions, not just document prose. Broad context and broad-state updates belong to the orchestrator by default unless another actor is explicitly granted that access.

This document defines the system vocabulary and control hierarchy that all later workflow, template, and tooling documents should follow.
