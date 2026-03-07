# PROJECT_FOUNDATION.md

## Purpose

This document is the canonical foundation for the `my-pi` project.

It explains why this project exists, what role it plays in a larger tooling ecosystem, what principles govern its design, what belongs inside its scope, and how it should be decomposed into operational documents, specifications, primitives, templates, and tooling.

This document is a stable, high-signal project reference. It is not a live status log, a task tracker, or a handoff document.

---

## What this project is

`my-pi` is the source-of-truth repository for a portable, modular, coding-focused Pi package and orchestration environment.

It exists to help build, extend, and maintain coding tooling for:

- class projects
- personal projects
- PhD and research projects
- the `my-pi` project itself

`my-pi` is intended to become a coherent system through which coding-related tasks can be assigned, decomposed, delegated, executed, validated, and summarized through a disciplined orchestrator-first model.

---

## Why this project exists

This project exists to create a durable personal foundation for digital tooling.

The long-term intent is not just to collect useful extensions or prompts, but to create a lean, composable system of primitives that can be combined to produce increasingly capable behavior over time.

The project is built on the belief that:

- simple rules can produce useful complexity
- specialized primitives are more durable than monolithic systems
- a modular system can adapt more easily to new tasks and new domains
- building the right primitives now unlocks higher-order systems later

The immediate goal is to build a strong coding system.

The broader long-term vision is that this coding system becomes a reusable substrate from which later systems can be composed, while remaining a distinct project with its own scope and discipline.

---

## Long-term vision

The long-term vision for `my-pi` is to become the cornerstone module for the author's future digital tooling.

In its mature form, `my-pi` should be able to:

- accept coding-related tasks or task sets
- reason about those tasks through an orchestrator-first workflow
- delegate work to specialized primitives
- compose those primitives into teams and sequences when needed
- generate and improve its own supporting tooling
- maintain continuity across work sessions through documentation and handoff artifacts
- bootstrap or improve other coding-oriented repositories using reusable seeds, templates, and decomposition patterns

This vision is intentionally coding-focused.

`my-pi` is meant to become a robust personal coding system, not a catch-all personal assistant platform.

---

## Scope

### In scope

The following are in scope for `my-pi`:

- Pi extensions
- Pi skills
- Pi prompts
- Pi themes
- coding-oriented orchestration primitives
- specialist definitions
- team definitions
- sequence definitions
- seed definitions related to coding repo setup and coding workflows
- scaffold and bootstrap tooling
- documentation and routing systems
- handoff infrastructure
- validation helpers
- decomposition workflows for turning project descriptions into specs, tasks, and repo artifacts
- tooling used to improve the `my-pi` project itself

### Out of scope

The following are out of scope for `my-pi`:

- non-coding assistant behavior unless it is directly required by the coding system
- client-specific personas
- domain-specific business systems unrelated to coding work
- machine-local secrets, credentials, and ephemeral session state
- one-off project hacks that do not generalize
- tooling that belongs to a future assistant layer rather than the coding layer
- broad personal-assistant features that should live in a future Merlin-related system

---

## Project boundary

`my-pi` must remain distinct from any later assistant-oriented system.

It may eventually serve as a reusable coding-oriented substrate for higher layers, but those higher layers should not be allowed to blur the scope of this repo.

A future assistant system may build on top of `my-pi`.  
A future client persona system may build on top of later layers.  
But `my-pi` itself should stay disciplined and coding-focused.

A useful boundary rule is:

> If a capability is not needed by the coding system itself, it should not be added to `my-pi`.

That rule exists to protect modularity, portability, and long-term clarity.

---

## Core design principles

### 1. Reusable primitives before conveniences

Build primitive units first.

If a repeated pattern emerges, abstract it into a reusable primitive only when doing so clearly improves speed, reliability, safety, or reuse.

### 2. Modularity everywhere

Anything that can reasonably be modular should be modular.

The system should favor small specialized parts over large all-purpose constructs.

### 3. Keep the system lean

Only build what is needed.

Avoid speculative complexity, premature abstraction, and features that exist only because they seem powerful.

### 4. Complexity through composition

The system should be able to produce richer behavior by composing simple specialized parts.

Higher-order capability should arise through structured composition, not through a giant all-knowing harness.

### 5. Orchestrator-first control

The orchestrator owns broad context, decomposition, delegation, synthesis, and state updates.

Downstream actors should operate from narrowed task packets.

### 6. Documentation-first continuity

The project should preserve durable understanding through well-structured documentation.

The system should be able to survive time gaps, new sessions, new agent instances, and future decomposition work without losing project intent.

### 7. Build tools that help build better tools

A central goal of this project is recursive leverage.

`my-pi` should help build the tools that make it easier to build the next layer of tools.

### 8. Portable source of truth

This repo should remain safe to clone onto a new machine and serve as the canonical editable source of the system.

---

## System worldview

`my-pi` is based on the idea that useful intelligent systems can be built from simple, specialized, composable units.

The preferred model is closer to a colony of cooperating specialized workers than to a single monolithic assistant.

That means the system should prefer:

- narrow roles
- explicit boundaries
- explicit handoffs
- reusable collaboration patterns
- reusable execution patterns
- stable operating documents
- decomposition over improvisation

This worldview should govern all later tooling decisions.

---

## First-class objects

The system is organized around the following first-class objects:

- orchestrator
- specialists
- teams
- sequences
- seeds
- templates
- handoff artifacts
- specs

These objects are defined in more detail in `docs/ORCHESTRATION_MODEL.md`, but their project-level role is summarized here.

### Orchestrator

The orchestrator is the top-level control layer.

It reads broad repository state, chooses execution strategy, delegates work, receives structured outputs, and updates repository state.

### Specialists

Specialists are the primitive work units.

They should be narrow, explicit, and bounded.

### Teams

Teams are reusable bundles of specialists for recurring collaboration patterns.

### Sequences

Sequences are reusable execution patterns that define stage order, checkpoints, merge points, and handback expectations.

### Seeds

Seeds are reusable bootstrap context packs for initializing repos, workflows, or specialized coding domains.

### Templates

Templates define how artifacts and bundles are generated.

They support repeatability and decomposition.

### Handoff artifacts

Handoff artifacts preserve current work state and continuity between sessions.

### Specs

Specs preserve durable project truth in structured form.

---

## Primitive hierarchy

The system should grow in a disciplined order.

The intended dependency order is:

1. specialists
2. teams
3. sequences

That means:

- it does not make sense to build teams before there are useful specialists
- it does not make sense to build sequences before there are useful teams or recurring stage patterns
- all higher-order constructs should remain grounded in simpler primitives

This repo should keep that order in mind when prioritizing work.

---

## Seeds and templates

Seeds and templates play different roles and should remain conceptually distinct.

### Seeds

Seeds are bootstrap context packs used to initialize a repo or a repo class.

A seed may include:

- expected repo structure
- expected documentation layout
- expected setup steps
- likely missing artifacts
- recommended primitives
- progress checkpoints
- domain-specific initialization guidance

Seeds are contextual setup artifacts.  
They are not actors.

### Templates

Templates are generation recipes.

They define how individual artifacts or bundles of artifacts are created.

Examples include templates for:

- `AGENTS.md`
- handoff documents
- specs
- seed manifests
- specialist definitions
- team definitions
- sequence definitions

A seed may use templates.  
A template does not become a seed simply because it generates a seed-related file.

---

## Relationship to future systems

`my-pi` may eventually support or enable later systems, but it should not absorb their scope.

A future assistant-oriented system may be built on top of `my-pi`.  
Future persona or client systems may be built on top of later layers.  
Those later systems may reuse patterns, primitives, templates, or extensions developed here.

However, this repo should remain disciplined about its own role:

- `my-pi` is the coding-oriented foundation
- later layers are separate concerns
- future business or client systems should not be allowed to pollute this repo's scope

This boundary is important for maintainability, public/private separation, and long-term architectural clarity.

---

## Public and private evolution

This repo is currently public and intended to hold reusable coding-oriented primitives and operating patterns.

As later systems emerge, some layers may need to become private.

A likely long-term separation is:

- `my-pi` remains the public or semi-public coding primitive layer
- later assistant-oriented systems may live in separate repos
- future client personas or client-specific systems likely live in private repos

This repo should be designed so that such later separation is easy rather than painful.

That means the project should favor clear interfaces, narrow responsibilities, and modular reuse.

---

## Success criteria

In its mature state, `my-pi` should:

- act as a coherent coding-oriented orchestration system
- let the author assign coding-related tasks and task sets
- delegate work through an orchestrator-first model
- manage specialists, teams, and sequences cleanly
- preserve continuity through high-quality documentation and handoff artifacts
- bootstrap new coding repos through seeds and templates
- decompose high-signal project descriptions into specs, handoff artifacts, and task structures
- improve itself through the same systems it uses on other coding repos
- remain lean, modular, and inspectable while increasing capability over time

---

## Current phase

The current phase of the project is:

**foundational architecture and operating-document setup**

At this stage, the goal is to define:

- the project foundation
- the orchestration model
- the workflow
- handoff structure
- documentation routing
- template contract
- seed structure
- the initial scaffold tooling
- the initial path for building primitive execution units

This stage is about getting the bones of the system right before building a larger ecosystem on top of them.

---

## Near-term priorities

Near-term work should prioritize:

- stable operating documents
- stable handoff structure
- a clear template contract
- a clear seed model
- initial documentation templates
- initial scaffold tooling
- early specialist primitives
- the path from specialists to teams
- the path from teams to sequences
- tooling that helps build additional primitives safely and repeatably

The near-term goal is not breadth.  
It is a strong, composable foundation.

---

## Decomposition intent

This document is intended to serve as a source document for decomposition.

Agents should be able to use this document to derive:

- specs
- operating documents
- handoff artifacts
- task queue structure
- specialist candidates
- team candidates
- sequence candidates
- seed candidates
- template priorities
- bootstrap plans for future coding-oriented repos

This means the project should be documented in a way that is stable enough to be decomposed and reused.

---

## What this document should not become

This document should not become:

- a daily log
- a current status file
- a next-task file
- an append-only decision journal
- an implementation scratchpad
- a substitute for the workflow doc
- a substitute for the orchestration model
- a substitute for the handoff system

Its role is foundational, not operational.

---

## Open questions

The project still has open questions that should be resolved over time through design work and iteration.

Current examples include:

- the exact schema for specialist definitions
- the exact schema for team definitions
- the exact schema for sequence definitions
- the exact structure of seeds
- the exact template contract
- how spec decomposition should work
- what standard spec categories should exist across coding-oriented repos
- how much should be generated versus hand-authored
- how much dynamic delegation should eventually exist

These questions are real, but they should be resolved incrementally rather than through premature complexity.

---

## End-state philosophy

The desired end state is a system that stays simple at the primitive level while becoming more capable at the system level.

The project should grow the way a good modular system grows:

- only when needed
- only through reusable parts
- only with clear boundaries
- only with strong documentation
- only with explicit reasons

The goal is not to build the biggest system.  
The goal is to build the right primitives so that powerful systems can later be composed from them.

---

## Summary

`my-pi` is the foundational coding-oriented substrate for the author's future digital tooling.

It is intended to remain a disciplined, modular, portable, orchestrator-first system for coding-related work. It should grow by building lean reusable primitives, composing those primitives into higher-order structures, and preserving project understanding through strong documentation, routing, handoff, seeds, and templates.

It should remain distinct from later assistant-oriented or client-oriented systems, even if those systems eventually build on top of it.

The central idea of this project is that useful complexity can emerge from simple, specialized, well-composed parts.