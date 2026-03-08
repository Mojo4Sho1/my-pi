# INDEX.md

## Purpose

This is the top-level routing document for the `my-pi` repository.

Use this file to determine:

- what this repository is
- which route applies to your role
- which documents to read next
- where major repository areas live

This file is a router, not a full specification.

---

## What this repository is

`my-pi` is the source-of-truth repository for a portable, modular, coding-focused Pi package and orchestration environment.

It is intended to support:

- coding-related work across projects
- self-improvement of the `my-pi` system
- reusable primitives for orchestration, scaffolding, documentation, and repo setup

For the full project vision and boundaries, see:

- `docs/PROJECT_FOUNDATION.md`

Do not read that document by default unless your route below tells you to or your task packet explicitly requires it.

---

## Universal entrypoint

`AGENTS.md` is auto-read first by platform behavior.

After `AGENTS.md`, all actors read `INDEX.md`.

`INDEX.md` is the universal routing entrypoint:

- orchestrator-class actors continue to `docs/WORKFLOW.md`, then `docs/handoff/NEXT_TASK.md`, then `docs/handoff/CURRENT_STATUS.md`
- downstream actors stop at `INDEX.md` unless a task packet explicitly expands their read set

---

## Role routing

Choose the route that matches your role.

### Route A — orchestrator

Use this route if you are responsible for:

- understanding the active task
- reading current work state
- selecting specialists, teams, sequences, or seeds
- packaging context for downstream actors
- integrating results
- updating repository state

If that is your role, read next:

1. `docs/WORKFLOW.md`
2. `docs/handoff/NEXT_TASK.md`
3. `docs/handoff/CURRENT_STATUS.md`

Read additional routing or deeper documents only as needed after that.

### Route B — downstream actor

Use this route if you are a:

- specialist
- team member
- sequence stage actor
- narrowly scoped task worker

If that is your role, do **not** read broad repository state by default.

Read next:

1. your assigned task packet or task brief
2. only the files or docs explicitly named in that packet

Stop there unless the packet tells you to read more.

Downstream actors should not read `docs/WORKFLOW.md`, handoff documents, or broad project docs unless explicitly instructed.

---

## Default rule

If you are unsure which route applies, assume you are a downstream actor and wait for a task packet.

Only orchestrator-class actors have broad default routing. Downstream actors are narrow by default.

---

## Core documents

### `AGENTS.md`
Universal behavioral guide for this repo.

Read first by platform behavior.  
Then read `INDEX.md`.

### `docs/PROJECT_FOUNDATION.md`
Canonical project foundation.

Use when deeper understanding is required about:

- why the project exists
- long-term vision
- project scope
- design principles
- success criteria

Do not read by default unless your role or task requires it.

### `docs/ORCHESTRATION_MODEL.md`
Defines the system vocabulary and hierarchy.

Use when deeper architectural understanding is required for:

- orchestrator
- specialists
- teams
- sequences
- seeds
- templates

Do not read by default unless your task requires architectural context.

### `docs/WORKFLOW.md`
Defines how the orchestrator behaves.

Orchestrator route only by default.

---

## Active work-state documents

These documents track live project state.

They are primarily for the orchestrator.

### `docs/handoff/_HANDOFF_INDEX.md`
Routing map for handoff documents.

### `docs/handoff/NEXT_TASK.md`
Defines the next immediate task or task set.

### `docs/handoff/CURRENT_STATUS.md`
Defines the current active state of the project.

### `docs/handoff/TASK_QUEUE.md`
Defines broader queued work and near-term backlog.

### `docs/handoff/DECISION_LOG.md`
Records meaningful decisions that should persist across sessions.

Downstream actors should not read these by default unless explicitly instructed.

---

## Major repository areas

### `docs/`
Operating docs, project docs, handoff docs, specs, and documentation-side templates.

Use this area when working on:

- project understanding
- workflow
- orchestration
- live work state
- specs
- documentation structure

### `agents/`
Definitions for specialists, teams, and sequences.

Use this area when working on execution primitives and reusable collaboration patterns.

### `seeds/`
Reusable bootstrap context packs for repo setup and domain-specific coding workflows.

Use this area when working on repo initialization, onboarding patterns, or reusable startup structures.

### `templates/`
Artifact-generation and bundle-generation definitions.

Use this area when working on scaffold behavior, template contracts, documentation generation, or seed/template composition.

### `extensions/`
Pi extensions.

### `skills/`
Pi skills.

### `prompts/`
Pi prompts.

### `themes/`
Pi themes.

These Pi-facing resource directories should remain clean, modular, and reusable.

---

## Task-based routing

### If the task is about project intent or long-term direction
Read only if needed:

- `docs/PROJECT_FOUNDATION.md`

### If the task is about orchestrator behavior
Orchestrator route:

- `docs/WORKFLOW.md`

### If the task is about current project state
Orchestrator route:

- `docs/handoff/_HANDOFF_INDEX.md`
- `docs/handoff/NEXT_TASK.md`
- `docs/handoff/CURRENT_STATUS.md`

### If the task is about architecture or system vocabulary
Read only if needed:

- `docs/ORCHESTRATION_MODEL.md`

### If the task is about specialists, teams, or sequences
Read only the relevant subtree under:

- `agents/`

### If the task is about repo bootstrapping or reusable startup patterns
Read only the relevant files under:

- `seeds/`

### If the task is about scaffolding, generation, or template rules
Read only the relevant files under:

- `templates/`

---

## Reading discipline

Do not read the entire repository by default.

The intended pattern is:

1. `AGENTS.md`
2. this file
3. the route that matches your role
4. only the minimum additional documents needed for the task

This repository is designed around narrowed context, explicit routing, and modular understanding.

---

## Update rule

Update this file when:

- the top-level repository structure changes
- the role-routing model changes
- the startup reading path changes
- a major repository area is added, removed, or renamed

Do not update this file for ordinary content changes inside already-routed documents unless the routing itself changes.

---

## Summary

`INDEX.md` is the top-level router for `my-pi`.

`AGENTS.md` points here.  
The orchestrator uses this file to enter the broader operating path.  
Downstream actors use this file to avoid reading unnecessary repository context.