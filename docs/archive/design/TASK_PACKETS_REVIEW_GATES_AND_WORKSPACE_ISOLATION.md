# Task Packets, Review Gates, and Workspace Isolation

**Status:** Draft design note  
**Intended path:** `docs/design/TASK_PACKETS_REVIEW_GATES_AND_WORKSPACE_ISOLATION.md`  
**Scope:** my-pi execution discipline for decomposing stage contracts into fine-grained task packets, executing them in isolated workspaces, and validating progress through explicit review gates

## Purpose

This document defines a narrower execution discipline for my-pi that sits **inside** the broader segment supervision and episodic execution model.

The purpose of this design is to answer a question that remains underdefined in higher-level campaign documents:

> Once a stage contract exists, how should my-pi execute that stage in a reliable, reviewable, and fresh-context-friendly way?

This document proposes that stage execution should proceed through:

- **fine-grained task packets**
- **explicit review gates**
- **isolated workspaces**
- **formal completion and finalization artifacts**

This design is meant to complement, not replace, the higher-level campaign and segment documents. Segment supervision explains how work advances across stages and checkpoints. This document explains how a stage executor should perform high-quality work **within** a stage.

---

## Background

A stage contract may still be too coarse for direct execution.

Even when a stage is well-defined, allowing an execution episode to attack the entire stage as one undifferentiated block creates avoidable problems:

- context overload
- poorly scoped implementation attempts
- hidden intermediate assumptions
- weak review boundaries
- unclear partial progress
- ambiguous completion claims
- greater risk of drift from the plan

A more reliable pattern is to transform a stage contract into a sequence of **small, explicit task packets** that a fresh executor can complete with bounded context.

This pattern creates several benefits:

- each unit of work is easier to understand
- verification is easier to perform
- handoffs become clearer
- reviews become more meaningful
- partial progress is easier to preserve
- completion claims become more grounded

This document formalizes that pattern.

---

## High-Level Design Position

A stage executor should rarely attempt a large stage as one uninterrupted unit of work.

Instead, my-pi should prefer the following flow:

1. consume a stage contract
2. compile the stage into one or more task packets
3. execute one task packet or a small packet batch in an isolated workspace
4. pass through explicit review gates
5. emit bounded progress artifacts
6. continue until the stage contract is satisfied or blocked
7. finalize the workspace state in a structured way

This is not merely task decomposition for convenience. It is an execution discipline designed to preserve bounded context, evidence-based progress, and clean relay between fresh agents.

---

## Core Goals

This subsystem should aim to:

1. decompose stage contracts into bounded executable units
2. make intermediate progress reviewable and inspectable
3. reduce context drift within stage execution
4. support fresh-context execution inside a stage
5. separate compliance review from quality review
6. keep repo modifications isolated and structured
7. make stage completion and branch readiness explicit

---

## Non-Goals

This design does **not** aim to do the following.

### 1. Replace stage contracts

Stage contracts remain the execution-ready definition of a stage. Task packets are a lower-level decomposition of a stage, not a substitute for stage contracts.

### 2. Require tiny packets in every situation

The system should prefer bounded packets, but it should not force artificial fragmentation where a slightly larger packet remains coherent and safe.

### 3. Impose one universal validation ritual on every task

Different task types may need different validation methods. A profiling task, refactor, benchmark, schema change, or documentation update may require different evidence.

### 4. Turn every review into a heavy ceremony

Review gates should be explicit, but they should remain proportional to the task packet and risk level.

### 5. Replace higher-level segment supervision

This design applies within stage execution. Segment supervision remains the higher-level mechanism that governs progression across stages and checkpoints.

---

## Scope Boundaries

This document is about what happens **inside** a stage execution episode.

It covers:

- task packet generation
- packet execution discipline
- intra-stage review gates
- isolated workspace behavior
- finalization of stage-local execution results

It does not primarily cover:

- campaign planning
- campaign segmentation
- checkpoint policy
- long-horizon supervision
- persistent assistant behavior
- cross-stage campaign continuity

Those belong elsewhere.

---

## Core Concepts

## 1. Stage Contract

A stage contract is the execution-ready artifact for a stage.

It defines:

- the stage objective
- required inputs
- required deliverables
- validation expectations
- stage-level exit criteria
- handoff requirements

This document assumes the stage contract already exists.

---

## 2. Task Packet

A task packet is the smallest preferred bounded execution unit inside a stage.

A task packet should be narrow enough that a fresh executor can understand and complete it with limited context, while still being meaningful enough to avoid unnecessary fragmentation.

A task packet should usually define:

- packet id
- parent stage id
- objective
- exact repo scope
- expected files or artifacts
- required inputs
- constraints and non-goals
- validation steps
- completion criteria
- documentation obligations

A task packet is not a vague todo item. It is an execution contract at a finer granularity.

---

## 3. Packet Batch

A packet batch is a small group of task packets that may be executed together when they are tightly related and share the same context efficiently.

A batch may be justified when:

- the packets are strongly coupled
- the validation context is shared
- splitting them would create unnecessary overhead
- the executor can still remain bounded and focused

Packet batches should remain small and deliberate. The default should remain one packet at a time unless batching is clearly beneficial.

---

## 4. Review Gate

A review gate is an explicit evaluation boundary after packet execution or packet batch execution.

A review gate exists to prevent the system from silently drifting forward after weak or incomplete work.

This document proposes two distinct review gate types:

- **compliance review**
- **quality review**

These should remain conceptually separate even if they are sometimes lightweight in practice.

---

## 5. Compliance Review

A compliance review answers:

- Did the packet satisfy its objective?
- Were required files or artifacts produced?
- Were required validation steps completed?
- Does the result conform to the stage contract and packet constraints?
- Is the packet genuinely complete, or only apparently complete?

This is the first review gate.

A result that fails compliance review should not move on to quality review as if the task were already complete.

---

## 6. Quality Review

A quality review answers:

- Is the implementation clean?
- Is complexity acceptable?
- Is the design still coherent?
- Are there obvious maintainability issues?
- Are there avoidable shortcuts or fragile decisions?
- Does the solution introduce debt not justified by the packet?

This is the second review gate.

Quality review should happen only after basic compliance is established.

---

## 7. Isolated Workspace

An isolated workspace is the bounded execution environment in which a stage or packet-level implementation occurs.

In many cases, this will align with the current segment branch. In some workflows, additional isolation may exist within that boundary.

The purpose of isolation is to ensure:

- bounded repo mutation
- clear review boundaries
- easier rollback or discard
- easier comparison of intermediate states
- cleaner finalization

The isolated workspace should be treated as a deliberate execution boundary, not just a convenience.

---

## 8. Finalization Artifact

A finalization artifact is the structured record produced when a bounded execution unit reaches a meaningful completion state.

Depending on scope, this may represent:

- packet finalization
- stage-local finalization
- workspace finalization
- branch readiness status

A finalization artifact should make it clear:

- what was completed
- what validations passed
- what remains open
- whether the work is ready for continuation, review, merge, hold, or discard

---

## Design Principles

## 1. Small Enough to Succeed

A packet should be small enough that a fresh executor can succeed with bounded context.

## 2. Explicit Over Implicit

Packet objectives, files, validations, and completion criteria should be written down, not assumed.

## 3. Review Before Forward Motion

The system should not proceed simply because code was written. It should proceed because a packet passed the relevant review gates.

## 4. Compliance Before Quality

The system should first verify that the work fulfills the packet and stage contract, then evaluate implementation quality.

## 5. Isolate Change

Repo mutation should occur inside clear workspace boundaries so that progress can be inspected and managed.

## 6. Completion Must Be Evidence-Based

A packet is complete only when its deliverables, validation evidence, and review outcomes support that claim.

## 7. Keep Reviews Proportional

Not every packet deserves the same review weight. Small documentation changes and risky architecture changes should not be treated identically.

---

## Task Packet Model

## Why Task Packets Matter

A stage contract often expresses what a stage must achieve, but not the best bounded units for execution.

Task packets exist to bridge that gap.

They help convert a stage from:

- broad
- difficult to scope
- review-heavy at the end
- prone to silent drift

into something that is:

- explicit
- bounded
- verifiable
- relay-friendly
- reviewable at useful intermediate points

---

## Task Packet Requirements

A task packet should include at least the following fields.

### Identity

- packet id
- stage id
- segment id if applicable
- packet order or dependency position

### Objective

- a concise statement of what this packet must accomplish

### Scope

- exact repo areas or files in scope
- areas explicitly out of scope
- any boundaries on changes

### Inputs

- required artifacts
- required prior packet outputs
- required environment or dependencies

### Deliverables

- files to create or modify
- code artifacts
- documentation artifacts
- test or evaluation artifacts
- any required structured output

### Validation

- tests to run
- checks to perform
- evidence to capture
- criteria for pass/fail

### Completion Criteria

- conditions under which the packet can be declared complete

### Documentation Obligations

- notes to record
- state to summarize
- follow-up risks to surface
- what the next executor must know

---

## Packet Granularity Guidance

A packet should be:

- small enough for bounded execution
- large enough to be meaningful
- coherent in terms of context
- reviewable without excessive ceremony

A packet is probably too large if:

- it spans too many unrelated files
- it requires too many conceptual jumps
- its validation burden is broad and fuzzy
- a fresh executor would need extensive background to complete it safely

A packet is probably too small if:

- it creates overhead with little clarity benefit
- it slices a coherent change into meaningless fragments
- it forces reviews on trivial half-steps that have no standalone value

The goal is disciplined boundedness, not microscopic fragmentation.

---

## Packet Batch Guidance

Packet batches may be appropriate when:

- the packets share one tight conceptual unit
- the same executor context is clearly beneficial
- the batch remains reviewable as a bounded whole
- the review gates remain meaningful

Packet batches should be used sparingly and intentionally. A batch should not become an excuse to bypass boundedness.

---

## Stage-to-Packet Compilation

## Purpose of Compilation

Stage contracts should be compiled into task packets before major execution begins.

This compilation step should answer:

- what exact bounded units are required?
- what order should they proceed in?
- which units can be batched?
- what validations apply to each packet?
- what artifacts or dependencies must be produced first?

This may be performed by:

- the stage executor at stage start
- a dedicated planning/refinement team
- a packetization step within the broader stage workflow

The exact mechanism is open, but the concept should be explicit.

---

## Desired Output of Compilation

The result of stage-to-packet compilation should be a packet plan that includes:

- ordered packet list
- packet dependencies
- batching decisions
- validation mapping
- review expectations
- intermediate artifact expectations

This packet plan should become part of the stage-local execution context.

---

## Review Gate Model

## Why Two Review Gates

A single generic "review" step often hides two different questions:

1. Did the work do what it was supposed to do?
2. Is the way it was done acceptable?

Those questions should be separated because they fail differently.

A packet may:
- fail compliance even if the code is elegant
- pass compliance but still be sloppy or fragile
- fail both
- pass both

This document therefore proposes two review layers.

---

## Compliance Review Questions

A compliance review should check:

- Was the packet objective satisfied?
- Were the required files changed?
- Were the required artifacts produced?
- Did the output stay within scope?
- Did the executor follow packet constraints?
- Were validation steps completed and passed?
- Is the packet ready to be marked complete?

A failed compliance review means the packet is not done.

---

## Quality Review Questions

A quality review should check:

- Is the implementation understandable?
- Is complexity proportional to the problem?
- Does the code or artifact fit the local design?
- Are there maintainability issues?
- Are there signs of unnecessary coupling?
- Are there obvious refactor needs?
- Is there unjustified technical debt?

A packet may pass compliance and still fail quality review if the solution is too weak to preserve.

---

## Lightweight Versus Heavy Reviews

Not all packets need the same review intensity.

For example:

- a narrow documentation fix may need a light compliance and light quality check
- a risky refactor may require deeper compliance and stronger quality review
- a profiling packet may need stronger evidence review than code-style review
- an architectural interface packet may need strong spec compliance review

The system should support proportional review rather than identical ceremony everywhere.

---

## Workspace Isolation Model

## Why Isolation Matters

Execution should occur inside an isolated workspace so that:

- changes are bounded
- diffs are inspectable
- failures are easier to contain
- review boundaries are cleaner
- branch readiness is easier to determine

Without workspace isolation, packet execution becomes harder to reason about and harder to finalize cleanly.

---

## Default Workspace Guidance

The default recommendation is:

- the broader **segment branch** acts as the main isolated workspace
- packets execute within that bounded workspace
- packet-level artifacts record local progress inside the segment branch
- finalization determines whether the segment workspace is ready to continue or be surfaced at a checkpoint

In some future workflows, more granular isolation may exist, but segment-aligned isolation should remain the baseline.

---

## Workspace Obligations During Execution

A stage executor operating inside an isolated workspace should:

- avoid unrelated repo edits
- keep changes scoped to the packet or packet batch
- surface any required cross-cutting changes explicitly
- avoid using workspace isolation as an excuse for undisciplined accumulation of unrelated work

The existence of an isolated workspace does not remove the need for scoped execution.

---

## Completion and Finalization

## Packet Completion

A packet should be considered complete only when:

- the packet objective is satisfied
- required artifacts exist
- required validation passes
- compliance review passes
- quality review passes at the required level
- required documentation is recorded

Writing code alone is not completion.

---

## Stage-Local Finalization

As packets accumulate, the stage executor or supervising mechanism should maintain a stage-local view of:

- packets completed
- packets blocked
- packets remaining
- validations passed
- unresolved risks
- stage readiness status

When the stage contract is satisfied, the system should emit a stage-local finalization artifact.

This artifact should summarize:

- completed packets
- validation evidence
- review outcomes
- unresolved issues
- whether the stage is ready for handoff or upward evaluation

---

## Workspace Finalization

A broader finalization step should also indicate the state of the isolated workspace itself.

This should answer questions like:

- Is the workspace coherent?
- Are validations green at the required level?
- Is the current state ready for continuation?
- Is the current state ready for checkpoint review?
- Is the current state ready to merge?
- Should the branch be held for later work?
- Should the work be discarded or rolled back?

This is especially important for segment branches.

---

## Finalization Status Examples

A future finalization artifact may include statuses such as:

- ready for next packet
- ready for next stage
- ready for checkpoint
- ready for merge
- hold for human review
- blocked pending decision
- discard recommended

The exact vocabulary can evolve later.

---

## Failure and Rework

## Packet Failure

If a packet cannot be completed, the system should produce a structured failure or blocker record rather than leaving ambiguous partial work.

A packet-level blocker should include:

- packet id
- failure summary
- evidence
- likely cause
- whether retry is appropriate
- whether broader stage assumptions are threatened

---

## Rework After Review

If a packet fails compliance or quality review, rework should remain scoped.

The system should prefer:

- targeted correction
- explicit revalidation
- explicit repeat of the relevant review gate

It should avoid:

- silently folding the rework into later packets
- losing track of what failed
- broad unsupervised drift from the original packet plan

---

## Relationship to Segment Supervision

This document is a lower-level companion to `SEGMENT_SUPERVISION_AND_EPISODIC_EXECUTION.md`.

That higher-level design explains:

- campaign segments
- campaign supervisors
- stage executors
- checkpoint packages
- handoff packages

This document explains what the stage executor should do **within** a stage:

- compile into task packets
- execute bounded packets
- pass through compliance and quality review gates
- use isolated workspaces
- produce finalization artifacts

Together, the two documents describe both the **between-stage** and **within-stage** execution discipline.

---

## Relationship to Existing my-pi Primitives

This design does not replace specialists, teams, or other primitive layers.

Instead:

- task packets may be executed by a stage executor using specialists
- review gates may be carried out by reviewer-oriented teams
- validations may invoke existing testing or evaluation tools
- packet compilation may itself be performed by a planning/refinement mechanism

This document adds an execution discipline above the primitive layer, not a new primitive type.

---

## Suggested Future Roles

The following roles may eventually become useful, though they are not required immediately.

## 1. Packetization Role

Turns a stage contract into a packet plan.

## 2. Packet Executor

Executes one packet or small batch in bounded context.

## 3. Compliance Reviewer

Checks packet completion against the packet and stage contract.

## 4. Quality Reviewer

Checks implementation quality after compliance is established.

## 5. Finalization Role

Produces stage-local or workspace finalization artifacts.

These roles may remain conceptual until the system matures further.

---

## Rollout Plan

This subsystem should be introduced gradually.

## Phase 0: Design-Only Incubation

### Goal

Clarify packet, review, and workspace concepts.

### Deliverables

- this design note
- packet vocabulary
- review gate vocabulary
- finalization vocabulary

---

## Phase 1: Manual Packet Discipline

### Goal

Improve manual stage execution even before automation.

### Deliverables

- packet template
- compliance review checklist
- quality review checklist
- minimal finalization template

### Value

Even manually, execution becomes more bounded and more reviewable.

---

## Phase 2: Stage-to-Packet Compilation Support

### Goal

Make packet decomposition explicit and repeatable.

### Deliverables

- packet plan schema
- packet dependency notation
- packet batching guidance
- stage-to-packet compilation support

### Value

Stage execution becomes more structured and less ad hoc.

---

## Phase 3: Review Gate Integration

### Goal

Require explicit compliance and quality checks during packet execution.

### Deliverables

- review gate definitions
- lightweight review policies
- packet completion checks
- review-aware rework flow

### Value

The system stops treating implementation as done just because code was written.

---

## Phase 4: Workspace Finalization Support

### Goal

Make bounded workspace state and readiness explicit.

### Deliverables

- finalization artifact schema
- workspace readiness states
- branch/workspace status reporting
- hold/merge/discard decision support

### Value

Execution results become easier to preserve, review, or reject.

---

## Open Questions and Ambiguities

The following questions should remain open until implementation begins.

## Packet questions

1. What is the minimum viable task packet schema?
2. Should packet plans always be written to the repo, or may they sometimes remain execution-local?
3. What heuristics should determine whether packets are too coarse or too fine?
4. When is packet batching justified?

## Review questions

5. What is the minimum compliance review required for a packet?
6. What kinds of packets deserve a full quality review versus a lighter check?
7. Can compliance and quality review ever be merged safely for very small packets?
8. How should review failure be recorded so that rework remains traceable?

## Workspace questions

9. Should every packet execute in the same segment branch workspace, or are there cases where narrower isolation is beneficial?
10. How should the system represent partial workspace readiness when some packets are complete and others are blocked?
11. At what point should a workspace be considered too dirty or too drifted to continue safely?

## Finalization questions

12. What statuses should a finalization artifact support initially?
13. What evidence is required before a workspace can be labeled ready for merge?
14. Should finalization artifacts be packet-level, stage-level, workspace-level, or all three?

## Integration questions

15. Who or what performs stage-to-packet compilation?
16. Should packetization happen once up front or be revisable during stage execution?
17. How should this packet model interact with handoff packages and checkpoint packages from the higher-level campaign system?

---

## Initial Recommendation

The project should adopt this execution discipline in the following order:

1. define task packet templates
2. define compliance and quality review checklists
3. define minimal finalization artifacts
4. use the packet model manually inside stage execution
5. later add packet-aware automation and workspace finalization support

This order creates immediate value while preserving flexibility.

---

## Summary

my-pi should execute stage work through **fine-grained task packets**, **explicit review gates**, and **isolated workspaces**.

The key ideas are:

- stage contracts should be compiled into bounded task packets
- packet execution should remain small enough for fresh-context success
- compliance review should precede quality review
- repo changes should occur inside isolated workspaces
- completion claims should be supported by validation and review
- finalization artifacts should make workspace readiness explicit

This design strengthens what happens *inside* a stage execution episode and complements the broader campaign and segment supervision model.