# PROJECT_FOUNDATION.md

## Purpose of this document

Stable canonical reference for the foundational design of this project.

It defines the project's identity, scope, architectural doctrine, control philosophy, platform posture, and long-term direction. It is intentionally durable and should change only when the project's foundational understanding changes.

This document is **not** the place for transient progress, task tracking, or implementation details. Live project state belongs in `STATUS.md`. Detailed object models belong in `ORCHESTRATION_MODEL.md`. Staged build plans belong in `IMPLEMENTATION_PLAN.md`.

---

## What this project is

This project is the long-term source-of-truth repository for a coding-focused orchestration system.

Its purpose is to support a structured, reusable, agent-friendly working environment for software creation, improvement, and maintenance. The system helps an orchestrator and its downstream execution units work predictably through explicit contracts, bounded access, reusable components, and inspectable execution flows.

The repository is the canonical home for:

- foundational architecture and execution doctrine
- governance rules and contracts
- reusable primitives (specialists, teams, sequences)
- routing definitions and templates
- platform-integration posture

---

## Why this project exists

Agentic systems become unreliable when they depend on implicit state, freeform collaboration, unclear boundaries, or poorly routed governance. This repository solves that by making the system explicit.

The project prioritizes:

- narrow responsibilities and explicit contracts
- declarative routing and bounded context
- reusable execution primitives
- machine-checkable structure with human-readable architecture
- portable governance independent of any one tool runtime

The goal is a system that can be reasoned about, maintained, extended, validated, and trusted over the long term.

---

## Long-term vision

A coding-oriented orchestration substrate built from reusable primitives that compose into increasingly capable execution structures.

At maturity, the project should support:

- **Specialists** that perform narrow bounded work
- **Teams** that compose specialists through explicit state-machine routing
- **Sequences** that compose teams and/or specialists into higher-order workflows
- Reusable contracts and templates that reduce ambiguity
- Machine-enforced routing and validation
- Dynamic orchestrator selection of the best primitive or combination for a task
- Governed creation of new primitives when capability gaps are identified

The growth path is deliberate: correct, explicit, and stable at the primitive level before broad or elaborate.

---

## Scope

This project is specifically for coding-oriented orchestration and adjacent engineering support.

**In scope:**

- Code generation, modification, review, testing, planning
- Repository maintenance and routing/execution structure
- Architecture for reusable agent execution within coding contexts
- Tooling and runtime support for contracts, packets, routing, and validation

**Out of scope** (unless explicitly re-scoped):

- Generic life management or broad personal assistant behavior
- Unrelated productivity workflows
- Open-ended conversation systems not grounded in coding work
- General-purpose autonomy without explicit governance

---

## Project boundary

This repository defines the coding-oriented substrate and its supporting doctrine. As portions stabilize, components may be extracted into standalone packages.

When that happens, this repository remains the canonical source of intent, architecture, and governance unless explicitly moved elsewhere. The project should remain architecturally portable even when implemented on top of a specific platform.

---

## Platform posture

The project distinguishes between:

- **Project-native architecture** -- the durable concepts of this system
- **Platform-native implementation** -- one possible realization on a specific host platform (currently Pi)

This distinction preserves long-term maintainability and reduces coupling to any one runtime. Host-platform artifacts should exist only when they materially improve execution, integration, distribution, or maintainability.

Project-native contracts, specs, routing definitions, and canonical identities remain authoritative even when host-platform realizations exist.

---

## Core design principles

### 1. Reusable primitives before conveniences

Specialists before teams. Teams before sequences. Stable routing before adaptive orchestration. Explicit governance before automation convenience.

### 2. Complexity through composition

Higher-order behavior emerges from composing simpler well-governed units. Prefer small well-defined primitives, explicit interfaces, declared transitions, and layered composition over monolithic agents with broad undefined responsibility.

### 3. Orchestrator-first control

The orchestrator is the default broad-context control authority. Downstream units are narrower in responsibility and visibility unless explicitly granted broader access. The system defaults toward central coordination of broad context, local execution of bounded work, explicit routing, and explicit escalation.

### 4. Explicit access boundaries

Units receive the minimum context needed to perform their role. Prefer bounded task packets with declared inputs and outputs over unrestricted repository awareness or open-ended conversational memory.

### 5. Contract-governed execution

Work units should not rely on informal prose interpretation when predictable structure can be declared. Inputs, outputs, invariants, transitions, and terminal conditions are represented through contracts and machine-readable artifacts. Contracts and packets are implemented in TypeScript, not markdown.

### 6. Structured packets over freeform dialogue

Execution units communicate through contract-defined packets. Narrative may exist for observability, but it is not the authoritative control surface. Routing and validation depend on declared fields and rules.

### 7. Fresh bounded invocation over role mutation

Prefer fresh bounded invocation over role swapping within a long-lived session. This preserves bounded context, reproducibility, and cleaner failure analysis.

### 8. Human-readable and machine-readable parity

Important execution structures should be legible to both machines and humans -- a machine-readable definition for enforcement and a human-readable depiction for inspection.

### 9. Documentation-first continuity

Important design knowledge lives in stable, inspectable, versioned artifacts rather than in implicit memory or transient conversations.

### 10. Errors should guide recovery

Error output should help the caller recover: what failed, why, which object was involved, and what to try next.

---

## Execution doctrine

- **Specialists are typed transformers.** Accept declared inputs, perform narrow work, emit declared outputs. No freeform conversation, no routing authority, no undeclared assumptions.

- **Teams are state machines, not group chats.** A team defines entry conditions, member roles, allowed transitions, terminal states, routing authority, and failure/escalation conditions. A non-agentic runtime enforces the declared routing rules.

- **Sequences compose teams and specialists** into higher-order workflows. Deferred until the team layer is stable.

- **Routing is authoritative.** Based on declared fields and transition rules. Specialists do not choose downstream recipients. Invalid transitions fail explicitly. Validation precedes downstream consumption.

- **Packets carry execution state.** First-class bounded artifacts for transferring work, routing signals, and results between units. Implemented as TypeScript types.

- **Activation is governed.** An object is active only after validation, indexing, and explicit admission -- not merely because a file exists.

---

## Primitive hierarchy and build order

The project grows in this order:

1. Specialists (contract-bound typed transformers)
2. Packet contracts and structure (TypeScript)
3. Team contracts
4. Team machine-readable routing definitions
5. Generic team routing runtime
6. Team visualization and validation
7. Sequence contracts and execution definitions
8. Sequence routing and runtime
9. Dynamic primitive selection and governed creation
10. Higher-order automation and package decomposition

This hierarchy is intentional. The project learns to walk before it runs.

---

## First-class object types

The system recognizes these object types (detailed definitions in `ORCHESTRATION_MODEL.md`):

| Object | Role |
|---|---|
| **Specialists** | Primitive execution units with narrow bounded responsibility |
| **Teams** | Governed compositions of specialists with state-machine routing |
| **Sequences** | Higher-order workflows composing teams and/or specialists |
| **Contracts** | Normative governance artifacts defining validity and behavior |
| **Packets** | Bounded execution artifacts for inter-unit communication |
| **Templates** | Construction artifacts for creating new valid objects consistently |
| **Seeds** | Bootstrap bundles for initial project/subsystem structure |
| **Platform adapters** | Implementation-layer mappings to host-platform mechanisms |

Contracts, templates, and seeds serve different purposes and must remain distinct. A template helps create an artifact; a contract defines what makes it valid; a seed provides an initial scaffold.

---

## Host-platform mapping

- Project-native objects remain authoritative; host-platform artifacts are optional realizations
- Team routing may map to platform extensions, provided the router stays generic and team-agnostic
- Prompt templates may exist as convenience front doors but must not become the authoritative home of identity, routing, or governance
- Stable subsystems may be bundled as packages; packaging preserves architectural clarity

---

## Dynamic primitive selection and creation

A long-term goal: the orchestrator chooses the best specialist, team, sequence, or combination at runtime. Built only after lower layers stabilize.

Governed primitive creation follows a strict path:

1. Identify capability gap
2. Invoke governed creation process
3. Generate candidate with contract and validation materials
4. Review and validate
5. Activate only after acceptance

Primitive creation is not unrestricted autonomous self-modification.

---

## What success looks like

- Specialists remain narrow and reusable
- Contracts materially reduce ambiguity
- Packets make execution boundaries clear
- Teams behave like inspectable governed state machines
- Routing is explicit and enforceable
- Validation catches drift early
- Humans understand system behavior from docs; machines execute from declared artifacts
- Host-platform integrations remain adapters, not architectural replacements
- Fresh bounded invocation is the norm
- Growth into higher-order structures happens only after lower layers are stable

---

## Intentionally deferred design

- Sequence runtime and routing implementation
- Dedicated coordinator agents for complex teams
- Broad adaptive orchestration beyond what the stable team layer requires
- Autonomous primitive activation without governance
- Sophisticated host-platform realization for all project-native objects

Deferral is intentional discipline, not incompleteness.
