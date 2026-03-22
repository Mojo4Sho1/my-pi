# RESULT_PACKET_CONTRACT

## Purpose

This document defines the contract for result packets returned by teams, specialists, or other delegated execution units after working on an orchestrator-issued task packet.

A result packet is a structured return artifact. It is not a repository-level handoff document. Its purpose is to report execution outcomes back to the orchestrator so the orchestrator can:

- assess completion state
- integrate results
- update repository handoff state
- determine the next routing decision

## Scope

This contract governs result packets generated from orchestrator-issued task packets.

This contract does **not** govern:

- `docs/handoff/NEXT_TASK.md`
- repository-level bundle state updates
- durable architectural decisions
- open-decision tracking at the repository level

Those belong to the handoff layer.

## Core rule

A result packet reports the outcome of a delegated packet.

It must be specific enough for the orchestrator to determine:

- what was attempted
- what was completed
- what remains
- what blocked progress
- what should happen next

## Relationship to other contracts

- `NEXT_TASK_CONTRACT.md` defines the active repository bundle.
- `TASK_PACKET_CONTRACT.md` defines the delegated work packet.
- `RESULT_PACKET_CONTRACT.md` defines the return artifact for that delegated work.
- `HANDOFF_CONTRACT.md` defines how the orchestrator updates repository state after interpreting returned results.

## Result packet principles

A valid result packet must be:

- **bounded**: reports only on the delegated packet
- **evidence-aware**: does not claim unverified completion
- **outcome-oriented**: emphasizes execution state, not narration
- **integration-ready**: gives the orchestrator enough information to update state without guessing
- **compact**: includes only the information needed for correct upstream integration

## Required fields

Every result packet must include the following fields.

### 1. `packet_id`
Unique identifier of the task packet being reported.

### 2. `parent_bundle_id`
Identifier of the repository-level bundle from which the task packet was derived.

### 3. `actor_id`
The team, specialist, or execution unit returning the result.

### 4. `outcome`
One of:

- `complete`
- `partial`
- `blocked`
- `failed`

Definitions:

- `complete`: delegated work satisfied its packet-level completion criteria
- `partial`: meaningful progress was made, but completion criteria were not fully satisfied
- `blocked`: safe progress could not continue because of a blocker
- `failed`: execution produced an invalid or unusable result due to error, contradiction, or loss of task integrity

### 5. `summary`
Brief description of what was done.

This should be concise and factual.

### 6. `work_completed`
A specific list of completed actions, deliverables, or verifiable outcomes.

### 7. `artifacts_changed`
List of files, documents, or artifacts modified, created, or otherwise affected.

If no artifacts changed, state that explicitly.

### 8. `validation_performed`
List of validations actually performed.

If no validation was performed, state that explicitly.

### 9. `remaining_delta`
What still remains for full completion of the delegated packet.

For `complete`, this may be `none`.

### 10. `blockers`
List of blockers encountered.

For `complete`, this may be `none`.

### 11. `recommended_next_action`
The most appropriate next step from the perspective of the returning actor.

This is a recommendation, not a routing decision.

## Optional fields

These fields may be included when relevant.

### `open_questions`
Questions surfaced during execution that do not yet block integration.

### `open_decisions_candidate`
Potential decision points the orchestrator may wish to elevate into repository-level open-decision tracking.

### `risks_noted`
Risks observed during execution that may affect future work.

### `follow_on_suggestions`
Small, bounded recommendations related to the delegated packet outcome.

These must not expand scope or create implied new authority.

### `evidence_refs`
Paths, commands, outputs, or other evidence references supporting claims made in the result packet.

## Outcome rules

## `complete`
Use only when packet-level completion criteria were satisfied.

A packet must not be marked `complete` if critical validation was skipped or a stated blocker still prevents safe completion.

## `partial`
Use when meaningful progress occurred but completion criteria were not fully satisfied.

A `partial` result must clearly identify:

- what is done
- what remains
- why the packet is not yet complete

## `blocked`
Use when safe forward progress could not continue.

A `blocked` result must clearly identify:

- the blocker
- why it blocks progress
- what kind of intervention is needed, if known

## `failed`
Use when the execution result cannot be treated as a valid partial or complete return.

This should be used sparingly and only when the task packet was not successfully carried forward in a usable way.

## Validation and claims rule

A result packet must not overclaim.

If something was not verified, the packet must say so explicitly.

Validation statements should distinguish between:

- work performed
- work observed
- work verified

## Repository-state rule

A result packet does not directly update repository handoff state.

The orchestrator interprets the result packet and then updates:

- `CURRENT_STATUS.md`
- `TASK_QUEUE.md`
- `NEXT_TASK.md`
- `DECISION_LOG.md`
- `OPEN_DECISIONS.md`

as appropriate under the handoff contract.

## Decision-handling rule

If execution surfaces a possible durable decision, the result packet may flag it in `open_decisions_candidate`.

The returning actor does not directly write repository-level durable decisions through the result packet.

The orchestrator decides whether the surfaced issue should become:

- an open decision
- a blocker requiring escalation
- a durable logged decision
- or no repository-level decision item at all

## Minimal result packet template

A compliant minimal result packet should contain:

- `packet_id`
- `parent_bundle_id`
- `actor_id`
- `outcome`
- `summary`
- `work_completed`
- `artifacts_changed`
- `validation_performed`
- `remaining_delta`
- `blockers`
- `recommended_next_action`

## Compactness guidance

Result packets should be concise.

Prefer:

- short factual bullets
- explicit file/artifact references
- direct blocker statements
- minimal interpretation

Avoid:

- long narrative prose
- repository-level planning language
- speculative architectural redesign
- unrelated cleanup suggestions

## Default interpretation rule

If a result packet is ambiguous, the orchestrator must not guess.

It should treat ambiguity as unresolved state and either:

- request clarification through a follow-on packet, or
- record the uncertainty in repository handoff state
- or mark the parent bundle as partial/blocked if safe interpretation is not possible