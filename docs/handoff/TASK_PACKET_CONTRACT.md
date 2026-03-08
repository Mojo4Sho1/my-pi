# TASK_PACKET_CONTRACT.md

## Purpose

This document defines the contract for **task packets**.

A task packet is a **downstream execution artifact** created from an active repository bundle and issued to a specific actor for bounded work. Task packets are used when the system is operating in an **orchestrated execution context** and work is being delegated by the orchestrator rather than executed directly from repository handoff documents.

Task packets are **not** repository-level handoff documents. They are derived instructions for teams and specialists.

---

## Core distinction

The system contains two different instruction layers:

1. **Repository bundle layer**
   - Defined by repository handoff documents such as `docs/handoff/NEXT_TASK.md`
   - Describes the active bundle of repository work
   - Intended for humans, Codex, and the orchestrator
   - Establishes bundle-level objective, status, and sequencing

2. **Task packet layer**
   - Created by the orchestrator from the active repository bundle
   - Issued to a specific downstream actor
   - Narrows the bundle into bounded delegated work
   - Establishes packet-level scope, context, deliverables, and return requirements

A task packet MUST NOT be treated as equivalent to `NEXT_TASK.md`.

`NEXT_TASK.md` selects and defines the active repository bundle.  
A task packet defines delegated work for a downstream actor.

---

## Contract intent

This contract exists to ensure that task packets are:

- narrow
- explicit
- bounded
- minimally contextualized
- easy to validate
- easy to return upward
- safe to consume by teams and specialists without guessing

The task packet layer exists to prevent two failure modes:

1. confusing repository bundle state with downstream work instructions
2. forwarding broad repository context to downstream actors without narrowing it first

---

## Authority and precedence

A valid task packet MUST conform to all higher-priority constraints.

Precedence order:

1. system-level safety and platform rules
2. durable repository contracts and canonical decisions
3. active repository bundle constraints
4. target actor definition and authority boundaries
5. task packet fields
6. target actor `working_style`

Implications:

- a task packet MAY narrow work further than the active bundle
- a task packet MUST NOT widen work beyond the active bundle
- a task packet MUST NOT expand the target actor’s authority beyond its definition
- a task packet MUST NOT override durable decisions
- a task packet MUST NOT override `working_style`; it may only rely on it

---

## Packet ownership

### Root packet issuance

A root task packet MUST be issued by the orchestrator.

### Child packet issuance

A child task packet MAY be issued by an authorized coordinating actor only when one of the following is true:

- the parent packet explicitly allows delegation
- the active workflow mode explicitly allows packet subdivision
- the team or sequence contract explicitly grants that coordinating authority

A child packet MUST reference its parent packet.

---

## Task packet invariants

Every valid task packet MUST satisfy all of the following:

- it has exactly one target actor
- it has exactly one coherent objective
- it is a strict narrowing of the active bundle
- it has explicit scope boundaries
- it has an explicit read boundary
- it has an explicit write boundary
- it has explicit deliverables
- it has explicit completion criteria
- it defines return expectations
- it defines escalation conditions

A packet MUST NOT combine multiple unrelated objectives into one packet.  
If work divides naturally into multiple independent units, the orchestrator SHOULD issue multiple packets.

---

## Targeting rules

A packet MUST target exactly one actor.

Valid target types include:

- orchestrator-coordinated team
- specialist
- sequence coordinator
- other formally defined actor classes introduced later

A single packet MUST NOT target multiple independent specialists at once.

If multiple specialists need work, the orchestrator SHOULD issue multiple packets unless a team packet is the intended coordination surface.

---

## Team packets vs specialist packets

### Specialist packet

A specialist packet is an execution-ready packet for one specialist.

It SHOULD be as narrow as possible and SHOULD avoid broad contextual overload.

### Team packet

A team packet is a coordination packet issued to a team as a unit.

A team packet MUST state whether the team may decompose work further.

If a team packet allows downstream decomposition, it MUST define delegation policy explicitly.

Recommended delegation policy values:

- `none`
- `coordinator_only`
- `team_discretion`

If omitted, the default is `none`.

---

## Read and write boundary rules

### Effective read set

A target actor may already have a contract-level default read set.  
The packet contract defines the **packet-specific read surface**.

The effective read set is:

- the actor’s default read set
- plus the packet’s `Required read set`
- plus any packet `Conditional read set` that is activated by stated conditions

The packet SHOULD list only the incremental materials needed for the delegated work unless repeating key items improves safety or clarity.

### Write boundary

The packet MUST define an explicit `Allowed write set`.

Default rule:

- no writes are allowed outside the `Allowed write set`

If a target actor discovers that additional writes are needed, it MUST escalate rather than silently broadening scope.

---

## Worker interaction with repository handoff docs

By default, downstream actors operating from a task packet MUST NOT update repository-level handoff documents directly.

Repository handoff updates are normally the responsibility of the orchestrator after integrating result packets.

A packet MAY authorize handoff-document updates only if that authority is explicitly granted in the packet’s `Allowed write set` and is consistent with the target actor’s authority boundaries.

This exception SHOULD be rare.

---

## Packet lifecycle states

A packet may move through the following states:

- `draft`
- `issued`
- `active`
- `partial`
- `blocked`
- `complete`
- `superseded`
- `cancelled`

### State definitions

#### `draft`
The packet has been formulated but not yet issued.

#### `issued`
The packet is valid and ready for execution.

#### `active`
Execution has begun.

#### `partial`
Meaningful progress has been made, but the packet is not complete.

A packet MAY be marked `partial` only if the following are recorded in the result:

- work completed
- remaining delta
- blocker or reason for incompleteness
- recommended next action

#### `blocked`
No safe forward progress can continue under current constraints.

A packet SHOULD be marked `blocked` when execution cannot continue without:

- new authority
- missing inputs
- conflict resolution
- human decision
- environment repair

#### `complete`
All packet-level done criteria are satisfied.

#### `superseded`
The packet has been replaced by one or more newer packets.

#### `cancelled`
The packet is no longer to be executed.

---

## Validation semantics

Each packet MUST define a packet-level validation requirement.

Packet validation is local to the delegated work.  
Bundle-level validation may be stricter and is handled at the orchestrator or repository layer.

Recommended validation levels:

- `doc_check`
- `local_consistency_check`
- `repo_validation`

These levels are cumulative:

- `local_consistency_check` includes all `doc_check` requirements
- `repo_validation` includes all `local_consistency_check` requirements

A packet MUST state the minimum validation required before returning a result.

---

## Escalation semantics

Every task packet MUST define escalation conditions.

Escalation conditions SHOULD include, where relevant:

- missing required inputs
- required files absent from the read surface
- needed writes outside the allowed write set
- conflict with actor authority boundaries
- conflict with durable decisions
- ambiguity that would likely cause rework
- inability to satisfy validation requirements
- need for a human decision that now blocks safe progress

If escalation conditions are met, the actor SHOULD return a partial or blocked result rather than guessing.

---

## Required packet fields

Every task packet MUST contain the following fields.

### 1. Packet ID
A unique identifier for the packet.

### 2. Parent bundle ID
The bundle from which the packet was derived.

### 3. Parent packet ID
Required only for child packets.

### 4. Issued by
The actor that created the packet.

### 5. Target actor
The specific actor expected to execute the packet.

### 6. Target actor class
Examples: `specialist`, `team`, `sequence_coordinator`.

### 7. Packet status
One of the lifecycle states defined above.

### 8. Objective
A concise statement of what this actor is meant to accomplish.

### 9. Delegation rationale
Why this work is being delegated to this actor.

### 10. Scope (in)
What is explicitly included.

### 11. Scope (out)
What is explicitly excluded.

### 12. Required read set
The materials that must be read to execute the packet safely.

### 13. Conditional read set
Optional. Materials that may be consulted only if stated conditions arise.

### 14. Allowed write set
Files or surfaces the target actor may modify.

### 15. Constraints
Rules, limitations, invariants, and non-goals.

### 16. Deliverables
What outputs the actor must produce.

### 17. Validation level
The minimum validation required before return.

### 18. Done criteria
What must be true for the packet to count as complete.

### 19. Escalation conditions
What should trigger escalation, partial return, or blocked return.

### 20. Return requirements
What the actor must send back and in what format.

---

## Recommended packet fields

These fields are strongly recommended, but not always required.

### 21. Packet title
A short human-readable name.

### 22. Last updated
Timestamp for current packet version.

### 23. Dependencies / ordering
Required sequencing relationships, if any.

### 24. Assumptions
Assumptions the actor is permitted to rely on.

### 25. Implementation notes
Practical guidance that does not expand scope.

### 26. Delegation policy
Especially important for team packets.

### 27. Return-to actor
Defaults to the packet issuer unless otherwise specified.

### 28. Parent bundle references
Useful when the packet must quote specific bundle constraints.

---

## Required field semantics

### Objective
The objective MUST define one coherent unit of delegated work.

### Scope (in) / Scope (out)
These MUST make it clear what the actor should and should not do.  
Out-of-scope boundaries are mandatory.

### Required read set
This MUST be specific enough that the actor does not need to guess which files matter.

### Allowed write set
This MUST be narrow and explicit.  
Broad writes such as “repo-wide docs” or “any relevant files” SHOULD be avoided.

### Constraints
This SHOULD include:

- architectural constraints
- naming constraints
- sequencing constraints
- non-destructive requirements
- consistency expectations
- prohibitions on unrelated cleanup

### Deliverables
These MUST define what the actor returns or produces.

### Done criteria
These MUST be testable and MUST correspond to packet-level completion, not vague progress.

### Return requirements
These MUST reference the result packet contract.

---

## Return contract

Every packet MUST require a return that conforms to `RESULT_PACKET_CONTRACT.md`.

At minimum, the return MUST provide:

- packet ID
- parent bundle ID
- outcome
- summary of work performed
- files changed
- validation performed
- blockers or open issues
- remaining delta if not complete

A packet MUST NOT close silently.  
Every issued packet requires an explicit return path.

---

## Task packet creation rules

When creating a packet, the issuer MUST do all of the following:

1. identify the parent bundle
2. identify the target actor
3. narrow the work to a single coherent objective
4. define explicit scope boundaries
5. define a bounded read set
6. define a bounded write set
7. define concrete deliverables
8. define packet-level validation
9. define completion criteria
10. define escalation conditions
11. define the required return format

The issuer SHOULD minimize context while preserving safety.

If the issuer cannot create a narrow packet without excessive ambiguity, the work SHOULD remain at the bundle layer until clarified.

---

## Packet decomposition rules

A parent packet MAY be split into child packets only if delegation is authorized.

When decomposing:

- each child packet MUST inherit the relevant higher-priority constraints
- each child packet MUST have its own packet ID
- each child packet MUST reference the parent packet ID
- child packets MUST narrow, not broaden, the parent packet
- child packet write surfaces SHOULD avoid overlap unless coordination is explicit

If multiple child packets may touch the same surface, the coordinating actor MUST define integration responsibility clearly.

---

## Invalid packet patterns

The following patterns violate this contract:

- using a packet as a duplicate of `NEXT_TASK.md`
- issuing one packet to multiple independent specialists
- omitting `Scope (out)`
- omitting `Allowed write set`
- giving broad repo-wide write permission without justification
- delegating work outside the target actor’s boundaries
- combining unrelated objectives into one packet
- requiring the actor to infer missing deliverables
- requiring the actor to guess what “done” means
- silently expecting repository handoff updates without explicit authorization
- letting packet notes override durable decisions or actor boundaries

---

## Packet template

The following is the standard packet shape.

## Packet title
[short human-readable packet title]

- **Packet ID:** [unique packet id]
- **Parent bundle ID:** [bundle id]
- **Parent packet ID:** [optional]
- **Issued by:** [actor]
- **Target actor:** [actor name]
- **Target actor class:** [specialist | team | sequence_coordinator | other]
- **Packet status:** [draft | issued | active | partial | blocked | complete | superseded | cancelled]
- **Last updated:** [YYYY-MM-DD]

### Objective
[one coherent delegated objective]

### Delegation rationale
[why this actor is the correct target]

### Scope (in)
- [in-scope item]
- [in-scope item]

### Scope (out)
- [out-of-scope item]
- [out-of-scope item]

### Required read set
- [required file or document]
- [required file or document]

### Conditional read set
- [optional file and the condition that permits/requires reading it]

### Allowed write set
- [file or surface]
- [file or surface]

### Constraints
- [constraint]
- [constraint]

### Deliverables
- [deliverable]
- [deliverable]

### Validation level
[`doc_check` | `local_consistency_check` | `repo_validation`]

### Done criteria
- [criterion]
- [criterion]

### Escalation conditions
- [condition]
- [condition]

### Dependencies / ordering
- [dependency if any]

### Implementation notes
- [practical guidance]
- [practical guidance]

### Delegation policy
[`none` | `coordinator_only` | `team_discretion`]

### Return requirements
Return a result conforming to `RESULT_PACKET_CONTRACT.md` that includes:
- packet ID
- parent bundle ID
- outcome
- summary of work
- files changed
- validation performed
- blockers / open issues
- remaining delta if incomplete

---

## Final rule

A task packet is valid only when it lets the target actor execute safely **without guessing**.

If an actor would need to guess about scope, authority, reads, writes, deliverables, or completion, then the packet is underspecified and should be revised before or during execution.