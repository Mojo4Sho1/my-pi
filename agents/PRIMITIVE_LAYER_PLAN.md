# PRIMITIVE_LAYER_PLAN.md

## Purpose

This document defines the first implementation phase for execution primitives in `my-pi`.

The goal of this phase is to create the smallest useful primitive layer that allows the system to begin delegating meaningful coding work without prematurely building higher-order structures.

This phase is intentionally narrow.

---

## Why this phase exists

The repository now has foundational operating documents, routing documents, and an orchestration model.

The next step is to create the first execution primitives that the orchestrator can eventually use.

These primitives should be built in dependency order:

1. specialists
2. teams
3. sequences

This document only covers the first layer: specialists.

---

## Core rule

Do not build teams before useful specialists exist.  
Do not build sequences before useful teams or recurring stage patterns exist.

Primitive growth must remain disciplined.

---

## Phase objective

Create the first minimal specialist layer for coding-oriented work.

This layer should be sufficient to support later composition into small teams and simple sequences.

The initial specialist set is:

- planner
- reviewer
- builder
- tester

These four roles should remain narrow and complementary.

---

## Why these four specialists come first

### Planner
The planner turns a task into an actionable implementation or investigation plan.

### Reviewer
The reviewer checks plans, proposed changes, or outputs against scope, consistency, and documented expectations.

### Builder
The builder performs bounded implementation work.

### Tester
The tester validates changes through the smallest appropriate validation layer.

Together, these roles establish a minimal loop:

- understand
- critique
- implement
- validate

That is enough to support useful delegation without prematurely expanding the primitive set.

---

## Specialist design rules

All specialist definitions created in this phase must follow these rules:

1. remain single-purpose by default
2. follow `agents/AGENT_DEFINITION_CONTRACT.md`
3. use narrow context by default
4. avoid broad repo interpretation unless explicitly granted
5. define clear inputs, outputs, and handback expectations
6. define clear non-goals
7. avoid role overlap unless there is a strong reason
8. avoid hidden team or sequence behavior inside a specialist definition

A specialist is a primitive worker, not a workflow engine.

---

## Scope boundaries for this phase

### In scope

- `agents/specialists/_SPECIALISTS_INDEX.md`
- `agents/specialists/planner.md`
- `agents/specialists/reviewer.md`
- `agents/specialists/builder.md`
- `agents/specialists/tester.md`

### Out of scope

- team definitions
- sequence definitions
- dynamic delegation logic
- automatic agent generation
- handoff automation
- seed generation
- template generation beyond what is required to document this layer

---

## Role boundaries

### Planner

The planner is responsible for:

- turning a task into a structured plan
- identifying dependencies, risks, and missing information
- defining actionable next steps
- proposing bounded work decomposition

The planner is not responsible for:

- approving the final plan
- implementing the plan
- validating implementation
- updating handoff state by default

### Reviewer

The reviewer is responsible for:

- checking plans, changes, or outputs for consistency
- identifying scope violations, ambiguity, or weak reasoning
- ensuring alignment with existing documentation and constraints

The reviewer is not responsible for:

- owning project workflow
- implementing changes by default
- performing final orchestration
- updating handoff state by default

### Builder

The builder is responsible for:

- carrying out bounded implementation tasks
- modifying files inside the allowed scope
- returning a clear summary of changes made

The builder is not responsible for:

- broad planning
- broad repo routing
- final validation ownership
- handoff-state ownership by default

### Tester

The tester is responsible for:

- validating work through the smallest appropriate validation layer
- checking whether claimed changes behave as expected
- returning validation findings clearly

The tester is not responsible for:

- planning implementation
- making broad design decisions by default
- broad orchestration
- handoff-state ownership by default

---

## Build order inside this phase

Implement these artifacts in this order:

1. `agents/specialists/_SPECIALISTS_INDEX.md`
2. `agents/specialists/planner.md`
3. `agents/specialists/reviewer.md`
4. `agents/specialists/builder.md`
5. `agents/specialists/tester.md`

This order helps establish routing first, then the planning/review side, then the execution/validation side.

---

## Quality bar

This phase is complete when:

- each specialist fully conforms to the agent definition contract
- each specialist has a clearly distinct responsibility
- no specialist implicitly performs orchestration
- no specialist definition contains hidden team logic
- `_SPECIALISTS_INDEX.md` correctly routes within the subtree
- the four specialists together form a coherent minimal primitive layer

---

## Expected follow-on phase

After this phase, the likely next step is to define the first simple teams built from these specialists.

Probable early team candidates include:

- planning team
- implementation team
- validation team

Do not build those in this phase.

---

## Related future contracts

This phase does not block future contract work, but it should not be delayed by it.

Important future contracts likely include:

- handoff documentation contract
- task queue contract
- archival/completion policy for queued work
- result packet contract
- task packet contract
- team definition contract
- sequence definition contract

Those should be created in later phases once the specialist layer is stable enough to justify them.

---

## Immediate implementation note

For the current phase, implementation should prefer minimal, clean, contract-conforming specialist definitions over ambitious or highly expressive ones.

The purpose of this phase is to establish reliable primitives, not to maximize capability immediately.

---

## Summary

This phase creates the first execution primitives for `my-pi`.

The initial specialist layer consists of:

- planner
- reviewer
- builder
- tester

These specialists should remain narrow, contract-conforming, and clearly separated in purpose so that later teams and sequences can be built on top of them without confusion or role drift.