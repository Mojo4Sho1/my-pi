# _AGENTS_INDEX.md

## Purpose

This document is the routing file for the `agents/` subtree.

Use this file to determine:

- what agent definitions exist in this repository
- how the agent hierarchy is organized
- which agent-definition area is relevant to the current task
- which documents to read next within the `agents/` subtree

This file is a router, not a full specification.

---

## Hierarchy

The `agents/` subtree is organized according to the execution hierarchy defined for this repository.

The intended structure is:

- orchestrator
- specialists
- teams
- sequences

This order matters.

The orchestrator is the top-level coordinating actor.  
Specialists are the primitive execution units.  
Teams are reusable bundles of specialists.  
Sequences are reusable execution patterns.

---

## Routing rule

Do not read the entire `agents/` subtree by default.

Read only the minimum needed for the current task.

Use this order:

1. identify the kind of agent artifact you need
2. route to the smallest relevant area
3. read only the target definitions needed for the task

---

## Agent areas

### `agents/orchestrator.md`

This file defines the orchestrator.

Read this when the task involves:

- top-level coordination behavior
- context-scope authority
- startup reading path
- handoff update authority
- delegation selection
- orchestrator responsibilities and boundaries

Do not read this by default unless the task is about orchestration or the orchestrator role itself.

### `agents/specialists/`

This subtree contains specialist definitions.

Use this area when the task involves:

- primitive execution roles
- narrow task ownership
- specialist boundaries
- specialist input/output expectations
- creating or revising specialist definitions

Route through:

- `agents/specialists/_SPECIALISTS_INDEX.md`

### `agents/teams/`

This subtree contains team definitions.

Use this area when the task involves:

- reusable multi-specialist collaboration patterns
- team membership and structure
- team deliverables
- deciding whether a recurring collaboration pattern should become a named team

Route through:

- `agents/teams/_TEAMS_INDEX.md`

### `agents/sequences/`

This subtree contains sequence definitions.

Use this area when the task involves:

- multi-stage execution patterns
- ordering of work
- checkpoints
- merge points
- reusable workflows across specialists and teams

Route through:

- `agents/sequences/_SEQUENCES_INDEX.md`

---

## Task-based routing

### If the task is about top-level coordination
Read:

- `agents/orchestrator.md`

### If the task is about defining or refining primitive worker roles
Read:

- `agents/specialists/_SPECIALISTS_INDEX.md`

### If the task is about reusable collaboration groups
Read:

- `agents/teams/_TEAMS_INDEX.md`

### If the task is about reusable execution order or workflow patterns
Read:

- `agents/sequences/_SEQUENCES_INDEX.md`

### If the task is about the overall hierarchy or vocabulary
Read only if needed:

- `docs/ORCHESTRATION_MODEL.md`

---

## Access model note

Agent definitions in this repository are expected to carry explicit routing and context-scope properties.

That means route eligibility should be determined by the agent definition itself, not by casual reader choice alone.

Examples include properties such as:

- role type
- routing class
- context scope
- default read set
- update authority

The orchestrator is the primary broad-context actor by default.  
Most downstream actors should remain narrow-context by default.

---

## Expected evolution

This subtree will grow in a disciplined order.

The expected path is:

1. define the orchestrator
2. define specialists
3. define teams
4. define sequences

This order should be preserved unless there is a compelling reason to violate it.

---

## Update rule

Update this file when:

- the structure of the `agents/` subtree changes
- a new top-level agent category is introduced
- routing paths within `agents/` materially change
- the hierarchy model materially changes

Do not update this file for ordinary content edits inside already-routed agent definitions unless the routing itself changes.

---

## Summary

`agents/_AGENTS_INDEX.md` is the routing file for the `agents/` subtree.

Use it to find the correct agent-definition area without reading more of the subtree than the current task requires.