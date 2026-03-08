# NEXT_TASK_CONTRACT.md

## Purpose

This contract defines the required structure, meaning, and update rules for `docs/handoff/NEXT_TASK.md`.

`NEXT_TASK.md` is the active repository-level bundle definition. It identifies the single bundle of work that should be executed next at the repository handoff layer.

`NEXT_TASK.md` is **not** a downstream worker task packet. It may be used by the orchestrator to generate task packets, but it must not be treated as identical to those packets.

---

## Scope

This contract governs only:

- the meaning of `docs/handoff/NEXT_TASK.md`
- the required schema and field semantics for that document
- the update rules for activating, revising, closing, and rotating the active bundle

This contract does **not** govern:

- downstream task packets for teams or specialists
- downstream result packets returned by teams or specialists
- the overall handoff system beyond how it interacts with `NEXT_TASK.md`

Those concerns belong to their own contracts.

---

## Role of `NEXT_TASK.md`

`NEXT_TASK.md` is the **sole execution selector** for the repository handoff layer.

It exists to answer:

- what bundle is active now
- why that bundle is next
- what its boundaries are
- what validation level applies
- what would make the bundle complete, partial, or blocked
- how the active bundle should be executed

`NEXT_TASK.md` is intended to be readable by:

- Joe
- Codex operating directly on the repository
- the orchestrator, when the system is operating in my-pi mode

It is a repository control-plane document, not a worker instruction packet.

---

## Core Principles

### 1. Single active bundle

`NEXT_TASK.md` must define exactly one active task bundle at a time.

That bundle may contain several tightly related subtasks, but those subtasks must support one coherent objective.

### 2. Repository-level definition

`NEXT_TASK.md` defines repository work at the bundle level. It must not descend into specialist-level packet semantics unless those details are necessary to define bundle boundaries or routing expectations.

### 3. Not a worker packet

`NEXT_TASK.md` must not be written as though it were already a downstream task packet for a team or specialist.

### 4. Execution-path awareness

`NEXT_TASK.md` must explicitly indicate whether the active bundle is meant to be executed directly or packetized by the orchestrator.

### 5. Bounded execution

Every active bundle must define explicit scope, constraints, validation requirements, and done criteria.

### 6. Closure discipline

A bundle must not be treated as closed until its outcome has been reflected into the handoff layer.

### 7. Human-readable but schema-shaped

`NEXT_TASK.md` must remain easy for a human to read while also following a stable field structure that an orchestrator or automated executor can interpret reliably.

---

## Ownership and Authority

### Repository ownership

`NEXT_TASK.md` is a handoff-layer document. It belongs to the repository control plane.

### Selection authority

`NEXT_TASK.md` is the authoritative answer to the question: "What bundle should be executed next?"

If `TASK_QUEUE.md` and `NEXT_TASK.md` diverge, `NEXT_TASK.md` controls execution, and the inconsistency must be corrected in the handoff layer.

### Interpretation authority

The active bundle in `NEXT_TASK.md` may be interpreted in one of two ways:

- **direct execution** by a top-level executor such as Codex
- **orchestrated execution** by the orchestrator, which may convert the bundle into one or more downstream task packets

`NEXT_TASK.md` does not itself decide the detailed contents of downstream packets unless the active execution mode is intentionally direct and packet generation is bypassed.

---

## Required Schema for `NEXT_TASK.md`

`NEXT_TASK.md` must contain the following sections in this order unless a later contract revision explicitly changes the schema.

### 1. Title

A concise title naming the active bundle.

Recommended format:

`# Next Task`

### 2. Last updated

Must include the most recent update date.

Recommended format:

`Last updated: YYYY-MM-DD`

### 3. Owner

Must state the current ownership context for the bundle.

Examples:

- `Owner: Joe + Codex`
- `Owner: Joe + my-pi orchestrator`
- `Owner: Joe`

### 4. Status

Must state the current active bundle state.

Allowed values:

- `active`
- `partial`
- `blocked`

`NEXT_TASK.md` must never describe a queued-but-inactive bundle as though it were already active.

### 5. Bundle ID

Must include a stable identifier for the active bundle.

Recommended format:

`Bundle ID: BUNDLE-YYYYMMDD-short-name`

The exact ID style may evolve, but it must remain unique and human-readable.

### 6. Task summary

A short explanation of what the active bundle is intended to accomplish.

### 7. Why this bundle is next

A concise explanation of why this bundle has been selected now instead of other queued work.

This section should explain sequencing logic, not merely restate the task summary.

### 8. Objective

A clear statement of the desired end condition for the bundle.

This is the primary mission statement for the bundle.

### 9. Execution path

Must explicitly state how the active bundle is expected to be executed.

Allowed values:

- `direct_bundle_execution`
- `orchestrator_packetization`
- `orchestrator_discretion`

Definitions:

- `direct_bundle_execution`: a top-level executor may act directly on the bundle from the repository handoff layer.
- `orchestrator_packetization`: the orchestrator must interpret the bundle and create downstream task packets.
- `orchestrator_discretion`: the orchestrator may decide whether to execute directly, delegate to specialists, delegate to a team, invoke a sequence, or use a mixed strategy.

### 10. Bundle owner

Must indicate which layer currently owns execution of the active bundle.

Allowed values:

- `top_level_executor`
- `orchestrator`

Definitions:

- `top_level_executor`: the bundle is expected to be consumed directly by a top-level executor such as Codex.
- `orchestrator`: the bundle is expected to be interpreted by the orchestrator before downstream work is delegated.

### 11. Scope (in)

A bounded list of what is included in the active bundle.

### 12. Scope (out)

A bounded list of what is explicitly excluded from the active bundle.

Anything not listed here but likely to be tempting adjacent work should be called out explicitly to prevent scope drift.

### 13. Dependencies / prerequisites

A list of documents, decisions, files, or prior bundles that must already exist or be satisfied before this bundle can be completed safely.

### 14. Required read set

A bounded list of documents or files that the active executor must read before attempting the bundle.

This section defines the minimum required reading, not every possibly relevant file in the repo.

### 15. Allowed write set

A bounded list of files or directories that may be modified as part of the bundle.

If file creation is allowed, the intended target path(s) must be listed explicitly.

### 16. Constraints

Explicit rules that limit what the executor may do while working the bundle.

Examples:

- do not broaden scope
- do not rename major structures
- do not perform unrelated cleanup
- do not introduce unapproved abstractions

### 17. Implementation notes

Practical execution guidance that helps the active executor perform the bundle safely and coherently.

This section may include tactics, cautionary notes, or sequencing tips, but it must not weaken any other boundaries defined in the contract.

### 18. Subtasks

A bounded list of tightly related subtasks contained within the active bundle.

Subtasks must remain coherent with the bundle objective. If subtasks stop being tightly related, the bundle should be split.

### 19. Validation level

Must declare the required validation level for the bundle.

Allowed values:

- `doc_check`
- `local_consistency_check`
- `repo_validation`

These levels are cumulative.

#### `doc_check`

Confirms:

- internal documentation coherence within touched files
- no newly introduced contradictions
- documentation-level done criteria are satisfied

#### `local_consistency_check`

Includes all `doc_check` requirements, plus:

- referenced files and paths exist where required
- read/write boundaries were respected
- touched handoff documents remain mutually consistent
- no obvious local drift exists across directly affected surfaces

#### `repo_validation`

Includes all `local_consistency_check` requirements, plus:

- available repository-level validation steps are run when appropriate
- implementation-level behavior is checked where feasible
- concrete validation evidence is recorded

### 20. Acceptance criteria

A list of conditions that must be true for the bundle to be considered complete.

These define conceptual completion.

### 21. Verification checklist

A procedural checklist of the checks that must be performed or reviewed before the bundle is closed.

These define practical verification.

### 22. Risks / rollback notes

Optional but recommended whenever the bundle can create meaningful rework, state corruption, or accidental drift.

This section should describe foreseeable risks and how to recover safely if something goes wrong.

### 23. Escalation conditions

A list of conditions under which the executor must stop normal execution flow and either:

- mark the bundle as `partial`
- mark the bundle as `blocked`
- surface an open decision
- request human review

This section is critical for predictable behavior under uncertainty.

---

## Bundle State Semantics

`NEXT_TASK.md` may only use the following active states.

### `active`

The bundle is currently executable and is the active repository target.

### `partial`

Meaningful progress has been made, but the bundle is not yet complete.

A bundle may be marked `partial` only if:

- completed work is clearly identifiable
- remaining work is clearly identifiable
- the reason it is not complete is explicitly stated

### `blocked`

The bundle cannot proceed safely at this time.

A bundle may be marked `blocked` only if:

- the blocking condition is named explicitly
- the blocker is concrete rather than vague
- the bundle cannot safely continue without resolving the blocker

`NEXT_TASK.md` must not use:

- `queued`
- `complete`
- `deferred`

Those are queue- and status-level states, not active-bundle states for `NEXT_TASK.md`.

---

## Relationship to `TASK_QUEUE.md`

`TASK_QUEUE.md` is the planning pool. `NEXT_TASK.md` is the active selector.

The active bundle described in `NEXT_TASK.md` should originate from `TASK_QUEUE.md`, but once activated, `NEXT_TASK.md` becomes the authoritative execution target.

If a discrepancy exists:

1. execution follows `NEXT_TASK.md`
2. the discrepancy must be corrected in the handoff state before loop closure

---

## Relationship to Task Packets

`NEXT_TASK.md` is **not** a downstream task packet.

It may inform or trigger the creation of downstream task packets, but those packets must be generated according to `TASK_PACKET_CONTRACT.md`.

A task packet may inherit from the active bundle:

- objective
- scope boundaries
- constraints
- validation requirements
- escalation conditions

A task packet must still add packet-specific information such as:

- target actor
- actor-local read set
- actor-local write set
- packet-local deliverables
- packet return expectations

---

## Relationship to Direct Codex Execution

When `execution_path` is `direct_bundle_execution` and `bundle_owner` is `top_level_executor`, a top-level executor such as Codex may work directly from `NEXT_TASK.md`.

In that mode:

- `NEXT_TASK.md` remains a bundle definition, not a specialist packet
- the executor must still obey scope, constraints, validation level, and escalation rules
- the executor must update the handoff layer before closing the loop

---

## Relationship to Orchestrated Execution

When `execution_path` is `orchestrator_packetization` or `bundle_owner` is `orchestrator`, the orchestrator must interpret the active bundle and generate downstream packets or select an execution strategy.

In that mode:

- the orchestrator reads the active bundle from `NEXT_TASK.md`
- the orchestrator decides how to route the work
- downstream actors should work from orchestrator-issued packets rather than directly from `NEXT_TASK.md`
- returned results must be synthesized back into the handoff layer

---

## Update Rules

### When `NEXT_TASK.md` must be updated

`NEXT_TASK.md` must be updated when:

- a new bundle becomes active
- the active bundle changes from `active` to `partial`
- the active bundle changes from `active` or `partial` to `blocked`
- the active bundle is materially re-scoped
- the execution path changes
- the bundle owner changes
- done criteria or escalation conditions must be corrected to remain accurate

### When `NEXT_TASK.md` must not be updated casually

`NEXT_TASK.md` must not be updated merely to add incidental narrative, speculative ideas, or archival noise.

It should remain concise, current, and operational.

### Rotation rule

When the active bundle is completed, `NEXT_TASK.md` must be rotated to the next active bundle selected from the queue, or the handoff layer must explicitly indicate that no bundle is currently active.

A completed bundle should not remain in `NEXT_TASK.md` as stale historical content.

---

## Closure Rules

A loop that works the active bundle must not be considered closed until all of the following are true:

- the active bundle outcome has been determined
- `NEXT_TASK.md` reflects the current live bundle state or has been rotated forward
- `CURRENT_STATUS.md` reflects the current repo state accurately
- `TASK_QUEUE.md` reflects the updated queue position of the bundle
- any newly surfaced durable decisions have been recorded in `DECISION_LOG.md`
- any unresolved but non-blocking decisions have been recorded in `OPEN_DECISIONS.md` if applicable

---

## Partial and Blocked Handling

### Partial handling

If the active bundle ends in a partial state, `NEXT_TASK.md` must include enough information for the next loop to resume intelligently.

At minimum, that means the bundle definition must still make clear:

- what has already been achieved
- what remains
- why the bundle is not yet complete

This may be expressed directly in the updated bundle description or through tightly synchronized status references in the handoff layer.

### Blocked handling

If the active bundle becomes blocked, `NEXT_TASK.md` must identify:

- the blocking condition
- whether the blocker is technical, architectural, informational, or human-decision-based
- what resolution is required before progress can safely resume

If the blocker is an unresolved decision, it should also be represented in `OPEN_DECISIONS.md`.

---

## Writing Guidelines

`NEXT_TASK.md` should be written in a style that is:

- concise
- operational
- bounded
- explicit about uncertainty
- explicit about exclusions
- easy to scan quickly

It should avoid:

- speculative prose
- unnecessary background history
- specialist packet wording when bundle-level language is sufficient
- vague statements such as "clean things up" or "improve docs" without concrete boundaries

---

## Anti-Patterns

The following are considered contract violations or near-violations.

### 1. Treating `NEXT_TASK.md` as a specialist packet

Example failure:

- writing the active bundle as though it were already assigned to one narrow worker with packet-local context

### 2. Omitting execution mode

Example failure:

- the bundle can be interpreted either directly or through packetization, but no execution path is declared

### 3. Missing out-of-scope boundaries

Example failure:

- adjacent cleanup work is not excluded, leading to likely scope creep

### 4. Missing validation declaration

Example failure:

- the bundle says "verify" or "check" without naming the required validation level

### 5. Bundling unrelated work

Example failure:

- the bundle mixes two or more objectives that should be separated into independent bundles

### 6. Leaving stale completed content in place

Example failure:

- `NEXT_TASK.md` still describes already-completed work while the queue has moved on

### 7. Silent re-scoping

Example failure:

- the bundle has materially changed but the document still presents the old objective and boundaries

---

## Recommended Skeleton for `NEXT_TASK.md`

The following structure is recommended.

```md
# Next Task

Last updated: YYYY-MM-DD
Owner: Joe + <executor context>
Status: active | partial | blocked
Bundle ID: BUNDLE-YYYYMMDD-short-name

## Task summary

<short summary>

## Why this bundle is next

<sequencing rationale>

## Objective

<desired end condition>

## Execution path

direct_bundle_execution | orchestrator_packetization | orchestrator_discretion

## Bundle owner

top_level_executor | orchestrator

## Scope (in)

- ...
- ...

## Scope (out)

- ...
- ...

## Dependencies / prerequisites

- ...
- ...

## Required read set

- ...
- ...

## Allowed write set

- ...
- ...

## Constraints

- ...
- ...

## Implementation notes

- ...
- ...

## Subtasks

- [ ] ...
- [ ] ...
- [ ] ...

## Validation level

doc_check | local_consistency_check | repo_validation

## Acceptance criteria

- ...
- ...

## Verification checklist

- ...
- ...

## Risks / rollback notes

- ...
- ...

## Escalation conditions

- ...
- ...
```

---

## Minimum Completeness Standard

A valid `NEXT_TASK.md` must include at least:

- title
- last updated
- owner
- status
- bundle ID
- task summary
- why this bundle is next
- objective
- execution path
- bundle owner
- scope in
- scope out
- required read set
- allowed write set
- constraints
- subtasks
- validation level
- acceptance criteria
- escalation conditions

If any of those are missing, the bundle definition is incomplete.

---

## Revision Policy

This contract may be revised when the repository evolves, especially when:

- teams and sequences become routine execution targets
- multiple bundle orchestration becomes a live feature
- the result-packet and handoff contracts formalize stronger cross-document linkage

Until then, this contract should be treated as the governing definition for `docs/handoff/NEXT_TASK.md`.

---

## Summary Rule

`NEXT_TASK.md` defines the single active repository-level bundle.

It tells the repo what work is next.

It does **not** replace orchestrator-generated task packets.

It must remain explicit enough for humans, Codex, and the orchestrator to interpret consistently without collapsing bundle selection and worker delegation into the same artifact.