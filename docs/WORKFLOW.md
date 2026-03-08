# WORKFLOW.md

## Purpose

This document defines how the orchestrator operates in this repository.

It explains:

- what the orchestrator reads
- how the orchestrator selects delegation targets
- how the orchestrator limits context
- what downstream actors return
- what repository artifacts must be updated after work completes

This document describes operational behavior.  
For the system vocabulary and object model, see `docs/ORCHESTRATION_MODEL.md`.

---

## Audience

This document is for the orchestrator.

Specialists, teams, and sequences do **not** read this document by default unless a specific task requires it.

---

## Core rule

Only orchestrator-class actors have broad default routing.

Downstream actors are narrow by default and work from narrowed task packets.

---

## Startup reading order

At the start of a work session, the orchestrator follows this order:

1. `AGENTS.md` (auto-read first by platform behavior)
2. `INDEX.md` (universal routing entrypoint)
3. `docs/WORKFLOW.md`
4. `docs/handoff/NEXT_TASK.md`
5. `docs/handoff/CURRENT_STATUS.md`
6. `docs/handoff/_HANDOFF_INDEX.md` only if additional routing is needed
7. other documents only as required by the current task

The orchestrator should avoid broad exploratory reading unless the task requires it.

---

## Primary responsibility

The orchestrator is responsible for:

- understanding the active task
- determining the correct execution approach
- selecting specialists, teams, sequences, or combinations of them
- passing only the required context downward
- collecting and synthesizing returned outputs
- updating repository state after work completes

The orchestrator remains the final integration layer.

---

## Execution strategy selection

The orchestrator chooses one of the following execution modes.

### 1. Direct specialist delegation

Use this mode when one specialist can complete the task cleanly.

Choose this when:

- the task is narrow
- the scope is stable
- the output is well-bounded
- multi-role collaboration is unnecessary

### 2. Multi-specialist delegation

Use this mode when several specialists are needed, but the task does not justify invoking a named team.

Choose this when:

- roles are clear
- collaboration is limited
- the work is small enough that a formal team adds overhead

### 3. Team delegation

Use this mode when a known reusable collaboration pattern exists.

Choose this when:

- the task matches a stable class of work
- multiple specialists are routinely needed together
- the team definition provides a clean handback format

### 4. Sequence execution

Use this mode when the task requires staged work.

Choose this when:

- ordering matters
- checkpoints matter
- synthesis stages matter
- parallel branches matter
- the workflow pattern is likely to recur

### 5. Mixed execution

The orchestrator may combine the above modes.

Example:

- invoke a planning sequence
- then call a build team
- then call a QA specialist
- then synthesize results

---

## Current delegation policy

At the current stage of the system, delegation should be explicit and conservative.

The orchestrator should prefer:

1. direct specialist delegation when possible
2. named teams when the collaboration pattern is already clear
3. named sequences when the task is clearly multi-stage

The orchestrator should **not** improvise complex delegation logic unless the task requires it and the necessary definitions already exist.

Future tooling may allow more dynamic delegation, but current workflow should remain simple and inspectable.

---

## Context management

The orchestrator should pass only the context required for the delegated task.

Each downstream task packet should include only the minimum needed set of:

- task objective
- task boundaries
- required inputs
- exact files or docs to read
- files allowed to change, if relevant
- expected deliverable
- validation expectations
- handback format

The orchestrator should avoid giving downstream actors broad repository context by default.

If a downstream actor reports that additional context is required, the orchestrator may expand the packet deliberately.

---

## Repository bundle layer vs downstream packet layer

The orchestrator operates across two distinct layers:

- repository bundle layer: active execution state in `docs/handoff/NEXT_TASK.md` and companion handoff docs
- downstream packet layer: orchestrator-generated task packets for delegated specialists/teams

These layers are related but not equivalent. `NEXT_TASK.md` selects repository-level work; task packets narrow delegated work.

## Task packet rule

The orchestrator delegates work through task packets.

A task packet should answer:

- what must be done
- why it matters
- what to read
- what not to touch
- what to return
- how success will be judged

Task packets are the standard interface between the orchestrator and all downstream actors.

---

## Seeds

When the task involves repo setup, domain initialization, or specialized onboarding, the orchestrator may consult a seed.

Seeds are context packs, not actors.

The orchestrator may use seeds to:

- initialize repository structure
- initialize documentation structure
- identify expected artifacts
- identify likely missing pieces
- select suitable specialists, teams, or sequences

The orchestrator should treat a seed as structured guidance, not as an execution target.

---

## Specialist behavior expectations

When the orchestrator delegates to a specialist, it should expect the specialist to:

- stay within scope
- use only the provided context unless more is explicitly needed
- return a bounded result
- surface blockers clearly
- avoid broad repo reinterpretation

Specialists do not manage workflow.

---

## Team behavior expectations

When the orchestrator delegates to a team, it should expect the team to:

- follow its defined collaboration pattern
- produce the expected team deliverable
- return a clear handback artifact or summary
- avoid taking over orchestration responsibilities

Teams package collaboration.  
They do not replace the orchestrator.

---

## Sequence behavior expectations

When the orchestrator invokes a sequence, it should expect the sequence to:

- follow a defined stage order
- respect any parallel or merge structure
- produce the expected final output
- return control cleanly to the orchestrator

Sequences package recurring workflow patterns.  
They do not replace the orchestrator.

---

## Handback requirements

All downstream actors should return structured outputs.

A handback should include, as applicable:

- result summary
- work completed
- files changed or recommended for change
- blockers or open questions
- validation performed
- follow-up recommendations, if relevant to the assigned scope

The orchestrator is responsible for integrating those handbacks into repository state.

---

## State update responsibilities

After completing a task or task stage, the orchestrator should update the relevant repository artifacts.

At minimum, the orchestrator should consider:

- `docs/handoff/CURRENT_STATUS.md`
- `docs/handoff/NEXT_TASK.md`
- `docs/handoff/TASK_QUEUE.md`
- `docs/handoff/DECISION_LOG.md`

The orchestrator should update only what the completed work materially affects.

### Update guidelines

- update `CURRENT_STATUS.md` when project state changes
- update `NEXT_TASK.md` when the immediate next task changes
- update `TASK_QUEUE.md` when priorities or backlog items change
- append to `DECISION_LOG.md` when a real decision is made or confirmed

The orchestrator may also update specs, indexes, or other docs when the task materially changes them.

---

## Human review log

The orchestrator should maintain a reviewable trail for the human principal.

That trail should be lightweight and readable.

It may consist of:

- handoff updates
- appended decisions
- explicit status summaries
- concise records of completed work and remaining work

The system should favor durable summaries over noisy narrative logs.

---

## Current-stage operating assumptions

At the current stage of this repository:

- one top-level orchestrator governs work
- specialist definitions remain primitive and narrow
- team definitions remain reusable but explicit
- sequence definitions remain reusable execution patterns
- seeds remain reusable bootstrap/context packs
- delegation logic remains conservative and inspectable

This workflow should support present work without assuming that all future tooling already exists.

---

## Future extension boundary

The workflow may later support:

- dynamic delegation selection
- richer team management
- nested or manager-style execution layers
- automated seed generation
- automated task-packet generation
- automated result-packet generation

These possibilities do **not** change the current rule:

**the orchestrator remains the top-level coordinating authority.**

---

## Non-goals

This document does not define:

- the detailed template contract
- the detailed schema for specialists, teams, sequences, or seeds
- the exact internal structure of every handoff file
- Pi extension implementation details

Those belong in their own documents.

---

## Summary

The orchestrator runs this repository through constrained delegation.

It reads the active workflow and handoff state, selects the appropriate execution structure, passes only the needed context downward, receives structured outputs back, and updates repository state accordingly.

Only orchestrator-class actors have broad default routing. Downstream actors are narrow by default.