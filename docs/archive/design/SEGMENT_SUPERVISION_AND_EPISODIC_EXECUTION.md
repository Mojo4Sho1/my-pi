# Segment Supervision and Episodic Execution

**Status:** Draft design note  
**Intended path:** `docs/design/SEGMENT_SUPERVISION_AND_EPISODIC_EXECUTION.md`  
**Scope:** my-pi execution of approved campaign segments using fresh-context stage executors, durable handoffs, and checkpoint packages

## Purpose

This document proposes a framework for executing an approved project plan in my-pi using **bounded campaign segments**, **fresh-context execution episodes**, and **durable repo-centered handoff artifacts**.

The purpose of this design is to formalize a workflow pattern that already works well in practice:

1. give a fresh agent a bounded set of tasks
2. let it execute using available primitives
3. force it to externalize state into durable handoff documentation
4. start a new fresh agent with the next bounded task set
5. repeat until a meaningful review boundary is reached

This design attempts to make that pattern operational inside my-pi so that progress can continue across multiple fresh execution sessions **without requiring a human to manually restart the next agent every time**.

This document does **not** attempt to make my-pi the final long-horizon assistant system. Instead, it defines a bounded execution-side subsystem that is useful on its own and remains compatible with a future Merlin control plane.

---

## Background

A long-running execution agent often accumulates problems over time:

- stale assumptions
- context bloat
- hidden state
- ambiguous responsibility
- difficult replay and diagnosis
- degraded task focus

By contrast, a workflow built from **fresh execution episodes** forces state to be externalized into artifacts rather than preserved only in conversation memory. That improves debuggability, resumability, auditability, and transfer of work across sessions.

my-pi is a natural place for this design because it is already intended to be a governed execution substrate. It can therefore support a disciplined relay model in which fresh stage executors perform bounded work, emit structured handoff artifacts, and advance a campaign segment until the next checkpoint.

---

## High-Level Design Position

my-pi should be able to consume an **approved campaign plan** and execute it **one campaign segment at a time**.

A segment is supervised by a bounded **campaign supervisor** inside my-pi. That supervisor does not own the entire project forever. It owns progress only until the next checkpoint.

Within a segment, the campaign supervisor launches **fresh stage executors**. Each stage executor is a standard fresh agent session bounded to one stage contract. It may use specialists, teams, tools, and subagents as needed, but it is responsible only for its stage.

At the end of each stage, the stage executor must emit a **handoff package**. At the end of the segment, the campaign supervisor must emit a **checkpoint package**. Those repo-centered artifacts allow work to continue without requiring persistent conversational context.

This design treats **fresh context as a first-class execution strategy**, not as a workaround.

---

## Core Goals

This subsystem should aim to:

1. execute approved work in bounded, fresh-context episodes
2. preserve continuity through durable repo artifacts rather than chat history
3. allow staged autonomous progress between explicit campaign checkpoints
4. support human review only when needed, especially at segment boundaries
5. make blocked progress explicit through structured blocker artifacts
6. remain useful in my-pi even before Merlin exists
7. remain compatible with a future Merlin campaign control plane

---

## Non-Goals

This design does **not** aim to do the following:

### 1. Replace Merlin

my-pi is not becoming the final long-horizon assistant. This subsystem is a bounded execution-side proxy for campaign progress, not a full persistent assistant identity.

### 2. Create fully unconstrained end-to-end autonomy

The goal is not to remove all review boundaries. The goal is to allow autonomous progress **between approved checkpoints**.

### 3. Keep one immortal orchestrator alive indefinitely

This design specifically rejects the idea that a single long-running agent session should own the entire project from start to finish.

### 4. Require specifications for every stage

Some stages need detailed specifications. Others only need a clear stage contract and validation requirements. The system should not force unnecessary formalism.

### 5. Replace specialist- and team-level execution primitives

Stage executors still rely on the existing my-pi primitive hierarchy. This subsystem adds campaign/segment structure above that layer; it does not replace the underlying primitives.

### 6. Store continuity only in memory

This design assumes that continuity should live in versioned artifacts written to the repo.

---

## Scope Boundaries

my-pi should support the following parts of the workflow:

- ingesting an approved campaign plan
- validating that the plan is executable enough for segment-level work
- shaping campaign segments and stage contracts
- launching fresh stage executors
- advancing work across stages within a segment
- producing handoff, blocker, and checkpoint artifacts
- pausing at campaign checkpoints for review or approval
- handing off the next segment to a fresh campaign supervisor

my-pi should **not** be responsible for:

- creating the initial campaign plan from scratch through open-ended long-horizon conversation
- acting as the permanent owner of all project continuity across indefinite time
- becoming the single universal control plane for all assistant behavior

Those responsibilities may later belong to Merlin or to a human+Merlin workflow outside my-pi.

---

## Core Concepts

## 1. Campaign Plan

The campaign plan is the approved project-level artifact that defines what the project is trying to achieve.

A campaign plan should typically include:

- project goal
- constraints
- assumptions
- research findings
- chosen direction
- candidate stages
- dependencies
- acceptance criteria
- checkpoint intent
- approval requirements

The campaign plan is upstream of execution. my-pi consumes it; it does not necessarily create it.

---

## 2. Feasibility / Plan-Shaping Team

Before execution begins, a feasibility-oriented team may be used to transform the campaign plan into an execution-ready structure.

Its responsibilities may include:

- stress-testing realism
- identifying missing dependencies
- breaking work into stages
- determining whether a stage needs a specification
- shaping stage contracts
- defining checkpoint boundaries
- identifying risky or ambiguous work
- identifying where human approval should be required

This team does not implement the campaign. It prepares the campaign for execution.

---

## 3. Campaign Segment

A campaign segment is a bounded portion of the campaign that can be executed autonomously between two checkpoints.

A segment may contain:

- one or more stages
- shared constraints
- a branch strategy
- a local success definition
- one checkpoint boundary at the end

The segment is the largest unit of autonomous continuation in this design.

Segments should be shaped so that they are:

- meaningful
- reviewable
- bounded
- resumable
- safe to pause after

The system should prefer a small number of coherent segment boundaries over an excessive number of tiny checkpoints.

---

## 4. Stage Contract

A stage contract is the execution-ready artifact for one stage.

It is more concrete than the campaign plan and narrower than the full segment.

A stage contract should include at least:

- stage id
- segment id
- objective
- exact deliverables
- required inputs
- relevant repo areas
- boundaries and non-goals
- required validation steps
- exit criteria
- handoff requirements
- blocker reporting requirements

A stage contract is the primary input to a stage executor.

---

## 5. Optional Specification

Some stages may require a more formal design or technical specification.

Examples include:

- API changes
- architecture changes
- schema changes
- interface changes
- high-risk refactors

Other stages may not require a spec. For example:

- profiling runs
- data collection
- benchmark execution
- narrow repo maintenance work

The system should treat specifications as optional, stage-dependent artifacts rather than universal requirements.

---

## 6. Campaign Supervisor

The campaign supervisor is the bounded manager for one campaign segment inside my-pi.

Its responsibilities include:

- reading the campaign segment definition
- selecting or confirming the next stage to execute
- launching a fresh stage executor
- evaluating returned handoff packages
- deciding whether the segment can continue
- collecting blocker artifacts when needed
- producing the checkpoint package at the end of the segment
- handing off to a fresh supervisor for the next segment, if appropriate

The campaign supervisor is intentionally **segment-scoped**, not campaign-global.

It is not a permanent orchestrator. It is a bounded supervisory role.

---

## 7. Stage Executor

A stage executor is a fresh-context execution episode responsible for one stage contract.

A stage executor is a standard agent session with access to my-pi primitives as allowed. It may invoke specialists, teams, tools, and subagents if appropriate, but it remains bounded by its stage contract.

Its responsibilities include:

- executing the stage
- updating the repo as needed
- producing required artifacts
- validating results
- documenting repo state changes
- producing a structured handoff package
- producing a blocker package if the stage cannot complete

The stage executor should never quietly fail or silently drop incomplete work.

---

## 8. Handoff Package

The handoff package is the durable artifact produced at the end of a stage execution episode.

Its purpose is to let a fresh future executor continue work without needing the full previous session history.

A handoff package should include at least:

- campaign id
- segment id
- stage id
- executor/session id
- stage outcome
- summary of work completed
- files changed
- artifacts produced
- tests run and results
- validation evidence
- unresolved issues
- repo state summary
- explicit next tasks
- risks and cautions
- readiness signal for the next stage
- references to supporting docs

This is one of the most important artifacts in the design.

---

## 9. Blocker Package

If a stage cannot be completed, the stage executor must emit a blocker package.

A blocker package should explain:

- what failed
- why progress stopped
- what evidence supports the diagnosis
- whether the blocker is technical, environmental, dependency-related, or plan-related
- what the minimum remediation path is
- whether a human decision is required
- whether the campaign segment can continue around the blocker or must pause

A blocker package prevents ambiguous failure and makes stalled progress actionable.

---

## 10. Checkpoint Package

At the end of a campaign segment, the campaign supervisor must emit a checkpoint package.

A checkpoint package should summarize:

- what stages were completed in the segment
- what branch contains the work
- what validations passed
- what validations failed
- what artifacts were produced
- what risks remain
- whether the segment met its success criteria
- whether human review is required
- whether the next segment is ready
- what the next campaign supervisor should inherit

A checkpoint package is the durable boundary between one segment and the next.

---

## 11. Segment Branch

The default branch strategy for this design should be **one branch per campaign segment**, not necessarily one branch per stage.

This keeps work grouped around meaningful review boundaries rather than fragmenting the repo into many tiny short-lived branches.

Within a segment branch:

- multiple stage executors may contribute
- multiple handoff packages may accumulate
- the campaign supervisor manages progression within that branch

At a checkpoint:

- segment work is summarized
- evaluation occurs
- the next segment may start in a fresh branch

---

## Execution Model

## Overview

The execution model is:

- approved campaign plan enters my-pi
- feasibility/plan-shaping step converts it into segments and stage contracts
- a campaign supervisor takes ownership of the current segment
- the campaign supervisor launches a fresh stage executor for the first stage
- the stage executor performs the work and emits a handoff package
- the campaign supervisor reads the handoff and decides whether to continue, retry, pause, or escalate
- this repeats until the segment reaches its checkpoint
- the campaign supervisor emits a checkpoint package
- a human may review if needed
- a fresh campaign supervisor may later take over the next segment

This is a **relay model**, not a continuous-agent model.

---

## Fresh-Context Principle

Freshness is a design feature, not a fallback.

The system should prefer:

- a fresh stage executor for each stage
- a fresh campaign supervisor for each segment
- durable artifacts instead of persistent conversation memory
- bounded context packets instead of full session transcripts

This improves:

- task focus
- debuggability
- resumability
- evidence quality
- handoff clarity

---

## Suggested Lifecycle

## Phase 1: Plan Intake

The campaign plan is added to the repo or otherwise made available to my-pi.

This phase may include a lightweight validation step to ensure that the plan is at least structurally usable.

## Phase 2: Feasibility and Shaping

A feasibility-oriented team reviews the plan and produces:

- segment definitions
- stage contracts
- optional specifications where needed
- checkpoint placement
- branch strategy guidance
- risk notes

## Phase 3: Segment Initialization

A campaign supervisor is launched for the first segment.

It creates or validates the segment branch and prepares the first stage context packet.

## Phase 4: Stage Execution

A fresh stage executor is launched for the current stage.

It performs the work, updates the repo, validates as required, and emits a handoff or blocker artifact.

## Phase 5: Segment Continuation

The campaign supervisor evaluates the result and chooses the next action:

- advance to next stage
- retry under policy
- route to diagnosis
- pause for human input
- terminate segment as blocked
- finalize the checkpoint

## Phase 6: Checkpoint Finalization

When the segment ends, the campaign supervisor emits the checkpoint package.

That package becomes the input for later review or for the next segment’s fresh campaign supervisor.

---

## Supervisor Responsibilities

The campaign supervisor should remain narrow and disciplined.

It should:

- manage only one segment at a time
- launch stage executors with bounded context
- inspect handoff packages
- verify stage completion against stage contracts
- ensure required artifacts exist
- decide whether the next stage is unblocked
- collect blocker evidence
- produce the checkpoint package

It should **not**:

- hold broad unstructured memory across the whole project
- do large amounts of direct implementation itself
- bypass required artifact production
- silently continue after a failed validation
- mutate the campaign plan informally without recording changes

---

## Stage Executor Responsibilities

The stage executor should be responsible for one unit of bounded work.

It should:

- consume exactly the stage contract and required local context
- use my-pi primitives as needed
- produce implementation and validation outputs
- externalize state into repo artifacts
- leave the repo ready for the next fresh agent
- emit a structured handoff or blocker package

It should **not**:

- assume ownership of downstream stages
- retain critical state only in session memory
- modify checkpoint definitions casually
- skip required validation or documentation obligations

---

## Artifact Model

## Artifact Philosophy

The repo should act as the durable source of truth for campaign progress.

That means the execution system should create structured artifacts rather than relying on ad hoc textual notes scattered across session history.

At minimum, the system should support the following artifact classes.

### 1. Campaign Plan
The approved project-level execution blueprint.

### 2. Segment Definition
The bounded subset of campaign work between two checkpoints.

### 3. Stage Contract
The execution-ready definition of one stage.

### 4. Optional Specification
A formal design artifact for a stage that needs one.

### 5. Handoff Package
The structured output of a completed stage execution episode.

### 6. Blocker Package
The structured output of a failed or blocked stage.

### 7. Checkpoint Package
The structured end-of-segment artifact.

### 8. Evaluation Artifact
Any validation, test summary, benchmark result, or stage/segment audit produced during execution.

---

## Handoff Quality Requirements

A handoff package is only useful if it allows a future fresh agent to start effectively.

Therefore, each handoff should aim to answer:

- What was the intended task?
- What got done?
- What changed in the repo?
- What evidence supports completion?
- What remains unresolved?
- What should the next executor do first?
- What should the next executor avoid misunderstanding?

A vague handoff is a workflow failure.

---

## Checkpoint Quality Requirements

A checkpoint package should support:

- human review
- supervisor-to-supervisor transfer
- pause and resume
- branch-level evaluation
- decision on whether to continue autonomously

A checkpoint package is not just a summary note. It is a formal boundary artifact.

---

## Branch Strategy

The default recommendation is:

- one branch per campaign segment
- one checkpoint package per segment
- many stage executor episodes may contribute within that branch

This strategy supports:

- coherent review boundaries
- clearer diffs
- simpler campaign accounting
- segment-level evaluation

The branch strategy may need exceptions for special workflows, but segment-aligned branches should be the default.

---

## Checkpoint Model

A checkpoint is the formal boundary at the end of a campaign segment.

At a checkpoint, the system should:

- freeze and summarize segment progress
- gather validation evidence
- assess whether success criteria were met
- assess whether risk remains acceptable
- determine whether human review is required
- determine whether the next segment is ready
- record what a future supervisor should inherit

Checkpoints should be explicit in the campaign structure, not improvised midstream unless the system records a justified plan change.

---

## Human Involvement Model

Human involvement should not be required after every stage. That would eliminate much of the value of autonomous continuation.

Instead, human involvement should typically be required when:

- a checkpoint requires approval
- a blocker requires a judgment call
- the plan is under-specified
- a stage produces contradictory evidence
- risk exceeds a configured threshold
- a segment changes scope materially
- a stage cannot satisfy its contract under existing assumptions

The system may also provide progress notices even when human action is not required.

---

## Evaluation Model

Evaluation should exist at both stage and checkpoint boundaries.

## Stage-Level Evaluation

A stage should be evaluated against:

- its stage contract
- required deliverables
- validation requirements
- exit criteria
- documentation obligations

## Checkpoint-Level Evaluation

A checkpoint should be evaluated against:

- segment success criteria
- validation completeness
- branch readiness
- unresolved blockers
- risk posture
- readiness of the next segment

The evaluation model does not need to be elaborate at first, but it must be explicit.

---

## Failure and Blocker Handling

A major purpose of this design is to make incomplete progress diagnosable rather than silent.

If a stage fails, the system should prefer:

1. structured blocker reporting
2. evidence collection
3. explicit decision on whether the segment can continue
4. explicit decision on whether human intervention is required

Failures should be categorized where possible, for example:

- missing dependency
- environment issue
- unclear requirement
- repo conflict
- failed validation
- missing specification
- plan infeasibility
- external resource limitation

A blocked stage should never simply disappear into an ambiguous handoff.

---

## Retry Philosophy

Retries may be useful, but they should be governed.

A campaign supervisor may retry a stage only when:

- the retry policy allows it
- the failure mode is considered retryable
- the cause of failure is sufficiently understood
- the retry will not hide a deeper plan or environment issue

Blind repetition should be avoided.

---

## Relationship to Existing my-pi Primitives

This subsystem sits above the primitive layer.

It does not replace:

- specialists
- teams
- sequence-like behavior
- tools
- contracts
- routing

Instead, it uses them as execution machinery inside a stage executor.

Examples:

- a stage executor may invoke a planner specialist
- a stage executor may call a reviewer/tester team
- a stage executor may use a specialized profiling toolchain
- a stage executor may call subagents for bounded subtasks

The new layer is about **campaign/segment progression**, not primitive execution semantics.

---

## Relationship to Merlin

This design should be understood as a **local execution-side proxy** for campaign continuity, not a claim that my-pi owns the entire future assistant architecture.

Future Merlin may eventually own:

- persistent user dialogue
- campaign creation
- broader approvals
- cross-campaign continuity
- multi-repo coordination
- long-horizon memory and supervision

my-pi should still remain useful independently.

Therefore:

- Merlin may someday hand campaign plans or segments into my-pi
- my-pi may someday return checkpoint packages to Merlin
- this design should keep those boundaries clean

For now, my-pi can still benefit from segment supervision even without Merlin.

---

## Suggested Future Team Shapes

This document does not require these teams immediately, but the following team concepts may eventually be useful.

## 1. Feasibility Team

Reviews a campaign plan and turns it into executable segments and stage contracts.

## 2. Stage Contract Team

Produces or refines stage contracts and optional specifications.

## 3. Stage Execution Team

Executes a stage using the primitive layer.

## 4. Handoff Finalization Team

Ensures that handoff artifacts are sufficiently complete for a fresh future executor.

## 5. Blocker Analysis Team

Diagnoses why a stage failed and proposes minimum remediation paths.

## 6. Checkpoint Review Team

Aggregates segment evidence and produces a formal checkpoint package.

These roles may remain conceptual until the primitive layer is mature enough to support them cleanly.

---

## Rollout Plan

This subsystem should be introduced gradually.

## Phase 0: Design-Only Incubation

### Goal

Clarify concepts, artifact boundaries, and responsibilities.

### Deliverables

- this design note
- campaign artifact vocabulary
- initial stage/segment/checkpoint definitions

---

## Phase 1: Artifact Foundations

### Goal

Support durable handoff and blocker artifacts even before segment supervision is automated.

### Deliverables

- handoff package template
- blocker package template
- minimal checkpoint package template

### Value

This immediately improves manual fresh-agent workflows.

---

## Phase 2: Stage Contract Support

### Goal

Make stage execution episodes more disciplined.

### Deliverables

- stage contract schema
- basic stage contract validation
- stage-level completion checks

### Value

Execution becomes less dependent on ad hoc instructions.

---

## Phase 3: Segment Supervision Prototype

### Goal

Introduce a bounded campaign supervisor for one segment.

### Deliverables

- segment definition schema
- supervisor logic for launching fresh stage executors
- supervisor logic for consuming handoff packages
- checkpoint generation

### Value

The manual relay loop begins to automate.

---

## Phase 4: Checkpoint Evaluation and Branch Integration

### Goal

Make segment boundaries meaningful and reviewable.

### Deliverables

- segment branch conventions
- checkpoint evaluation rules
- progress notices
- human review triggers

### Value

Autonomous continuation becomes bounded by durable review gates.

---

## Phase 5: Supervisor-to-Supervisor Handoffs

### Goal

Allow fresh campaign supervisors to take over subsequent segments.

### Deliverables

- checkpoint inheritance model
- next-segment startup packet
- supervisor handoff template

### Value

Campaign progress can continue across multiple bounded supervisory episodes.

---

## Suggested Initial Repo Artifacts

The exact structure is open, but the system will likely need stable homes for:

- campaign plans
- segment definitions
- stage contracts
- handoff packages
- blocker packages
- checkpoint packages
- evaluation artifacts

This design note does not mandate the exact repo layout yet, but it assumes the repo will store these artifacts in predictable and versioned locations.

---

## Open Questions and Ambiguities

The following questions should remain open until implementation begins.

## Campaign shaping questions

1. What is the minimum structure required for a campaign plan before my-pi can ingest it?
2. Should segment definitions always be produced by a feasibility team, or can they sometimes be created manually?
3. How should the system distinguish between a stage that needs a formal specification and one that only needs a stage contract?

## Supervisor questions

4. How much authority should a campaign supervisor have to reshuffle stages within a segment?
5. Can a campaign supervisor split a stage into smaller stages if execution reveals that the original plan was too coarse?
6. Should a campaign supervisor be allowed to create an unscheduled checkpoint when risk becomes unexpectedly high?

## Stage executor questions

7. What is the right context packet size for a fresh stage executor?
8. How much prior-stage history should a stage executor receive beyond the latest handoff package?
9. When should a stage executor be allowed to call subagents versus relying only on higher-level teams?

## Artifact questions

10. What is the minimum schema for a handoff package that is still genuinely useful?
11. Should handoff packages be machine-oriented only, or should they include a human-readable companion summary?
12. How should blocker packages distinguish between temporary blockers and structural campaign flaws?
13. What fields are mandatory in a checkpoint package before the next segment may begin?

## Branching questions

14. Should the default always be one branch per segment, or do some campaigns need a different branch strategy?
15. How should the system handle a segment whose stages naturally touch multiple long-lived branches?
16. At what point should a segment branch be merged, and under whose approval?

## Evaluation questions

17. What should be the minimum stage-level evaluation requirements before a handoff may be accepted?
18. What checkpoint signals should automatically trigger human review?
19. Should segment success require all stages to complete, or can some stages resolve into accepted blockers?

## Merlin boundary questions

20. Which pieces of the checkpoint package should eventually be designed for Merlin consumption?
21. How much long-horizon continuity should my-pi retain if Merlin does not yet exist?
22. How should terminology stay aligned later if Merlin introduces a richer campaign control plane?

---

## Initial Recommendation

The project should introduce this subsystem in the following order:

1. define the handoff, blocker, and checkpoint artifacts
2. define a stage contract schema
3. improve manual fresh-agent relay workflows using those artifacts
4. introduce bounded segment supervision
5. later add supervisor-to-supervisor continuation across segments

This order captures value early without overcommitting to premature automation.

---

## Summary

my-pi should support execution of approved project work through **bounded campaign segments** managed by **segment-scoped campaign supervisors** and carried out by **fresh-context stage executors**.

The core principles are:

- continuity should live in repo artifacts, not conversation history
- fresh context should be treated as a feature
- autonomous progress should occur between explicit checkpoints
- stage executors should always leave durable handoff documentation
- blockers should be formalized instead of hidden
- campaign supervision in my-pi should remain bounded and segment-scoped

This design preserves what already works well in manual agent relay workflows while creating a path toward more disciplined and more autonomous execution over time.