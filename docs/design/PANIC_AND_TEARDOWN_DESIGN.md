# PANIC AND TEARDOWN DESIGN

## Status

Proposed

## Purpose

This document defines the immediate design needed to safely terminate nested agent execution when something goes wrong, especially when sub-agents continue consuming tokens after the visible parent task has been canceled.

The primary goal is to prevent runaway cost and hidden background execution. The secondary goal is to create a durable teardown model that later observability tooling and widget work can build on.

This design is intended to drive an implementation pass in the `my-pi` repo. Once implemented and integrated into the project's durable documentation, this design document may be archived according to the repo's normal design-doc workflow.

---

## Background

A validation task was canceled from the visible Pi session, but token usage continued dropping afterward, strongly suggesting that one or more nested runs or subprocesses may have remained alive after the parent task stopped.

This reveals a serious operational gap:

- parent cancellation does not currently guarantee descendant termination
- active nested work is not sufficiently visible
- there is no deterministic emergency stop command inside the package
- there is no trustworthy notion of when a task is truly settled

This must be fixed before additional orchestration complexity is added.

The issue is not only observability. It is also ownership and lifecycle control. A dashboard can help reveal the problem, but it does not solve it. The system needs a deterministic teardown path.

---

## Problem Statement

The current system appears to allow nested agent work to outlive the visible parent task in some cases.

That is unacceptable because it creates all of the following risks:

- uncontrolled token consumption
- inability to know whether work is still active
- inability to trust cancellation
- orphaned subprocesses or child sessions
- hidden repo mutations after the user believes work has stopped
- poor debuggability of the orchestrator and teams system

The project needs a teardown model where:

1. all spawned work is owned and tracked
2. parent abort reliably propagates to descendants
3. the user has an explicit emergency stop command
4. the system does not claim cancellation until all descendants are settled or killed

---

## Core Decisions

### 1. Introduce a dedicated emergency stop command: `/panic`

The repo should implement a custom extension command named `/panic`.

This command exists specifically for emergency teardown of active work. It is not a prompt template and not a skill.

It should be implemented as an extension command because it requires deterministic runtime behavior, immediate execution, and direct control over active sessions and processes.

### 2. Treat teardown as an extension/runtime concern

The actual stopping of active descendant work must live in the extension/runtime layer, not in a prompt and not in a skill.

A skill may later help with investigation or reconciliation, but the stop action itself must be deterministic and immediate.

### 3. Introduce a parent-owned run registry

Every spawned child run, subprocess, tmux pane, or nested session must be registered by the parent orchestration layer.

There must be no fire-and-forget sub-agent execution.

The registry is the foundation for:

- emergency kill behavior
- parent-to-child abort propagation
- later widget observability
- accurate settled-state detection
- future policy enforcement

### 4. Parent cancel must imply descendant cancel

If the parent task is canceled, all descendants must be marked `canceling` and then torn down before the task is considered truly canceled.

The system must not equate "the visible top-level call stopped streaming" with "all work has ended."

### 5. The system must have a settled-state barrier

Cancellation must not be reported as complete until all known descendants are in a terminal state.

Terminal states should include:

- `settled`
- `failed`
- `killed`
- `canceled`

This creates a stronger and more honest lifecycle model.

### 6. Observability should consume teardown state, not define it

The future widget should display live run state, but the underlying teardown model must exist before the widget is considered complete.

The widget should be built on top of a reliable run registry and lifecycle state model rather than inventing a parallel view of execution.

### 7. Teardown policy should later be repo-configurable

The teardown mechanism itself should be global and reusable, but repo-specific behavior should eventually be configurable through repo-local policy files.

Examples of repo-specific behavior include:

- grace period duration
- maximum concurrent sub-agents
- maximum sub-agent depth
- whether certain validations may spawn nested work
- whether teardown should be aggressive or conservative

This policy system does not need to be fully implemented in this pass, but this design should remain compatible with it.

---

## Scope

### In scope

- introducing `/panic`
- introducing a run registry
- defining parent-child lifecycle ownership
- implementing parent abort propagation
- implementing descendant teardown
- defining settled-state behavior
- updating docs to explain teardown and emergency stop behavior
- making future widget work depend on this state model

### Out of scope for this pass unless already straightforward

- full widget/dashboard implementation
- broad UI polish
- rich historical telemetry
- seed propagation of policy templates
- complete policy framework implementation
- forensic debugging tools beyond basic reporting
- advanced multi-host or distributed teardown

---

## Desired User Experience

### Emergency stop

If a user suspects something is wrong, they should be able to invoke:

`/panic`

That command should:

1. identify the active top-level run context
2. mark it as `canceling`
3. identify all known descendants
4. attempt graceful shutdown first
5. force-kill lingering descendants after the grace window
6. wait until the system is settled
7. report what was stopped and whether anything could not be terminated cleanly

### Normal cancel

Normal parent cancellation should also trigger descendant teardown automatically, even if `/panic` is never invoked.

`/panic` exists as an explicit emergency command and diagnostic aid, not as the only safe cancellation path.

---

## Required Architecture

## A. Run Registry

Create a parent-owned run registry that tracks all nested work.

Each tracked entry should include at least:

- unique run id
- parent run id
- run kind
  - parent task
  - child session
  - subprocess
  - tmux session or pane
  - validation worker
- owning command or orchestrator task
- cwd or repo root
- start time
- current state
- termination handles
- cleanup strategy
- optional human-readable label
- optional associated task id or validation id

Recommended lifecycle states:

- `starting`
- `active`
- `canceling`
- `settled`
- `failed`
- `killed`
- `canceled`

The registry should be the single source of truth for active work inside the package runtime.

### Requirements

- no spawned child may exist without registry entry creation
- registry entries must be removed or finalized only when terminal state is reached
- parent-child relationships must be explicit
- the registry should support traversal from parent to descendants

## B. Abort Propagation

When the parent task is aborted, the runtime must propagate that intent to all descendants.

This should include:

- aborting nested agent sessions where supported
- sending termination signals to subprocesses
- killing tmux-backed children if they do not exit cleanly
- updating registry state as cancellation progresses

The design must assume that some child work may ignore graceful cancellation. Therefore, propagation must support escalation from graceful stop to forced kill.

## C. Settled-State Barrier

The runtime must distinguish between:

- cancellation requested
- cancellation in progress
- fully settled

A task should only be considered fully stopped when all descendants known to the registry are in terminal state.

This barrier is required for:

- honest user messaging
- safe return to idle
- accurate widget state later
- confidence that token usage should have stopped

## D. `/panic` Extension Command

Implement a new extension command, `/panic`.

### Command responsibilities

- work even when other activity is ongoing
- stop the current task tree
- traverse and tear down descendants
- escalate if descendants do not stop
- summarize results

### Minimum output

The command should report:

- how many runs were found
- how many were gracefully canceled
- how many required force kill
- whether any runs could not be confirmed as stopped
- whether the system is now settled

### Behavioral requirements

- `/panic` must be deterministic
- `/panic` must not rely on the model interpreting a natural-language instruction correctly
- `/panic` must act on runtime state, not only on docs or prompts
- `/panic` should be safe to invoke more than once

## E. Graceful-Then-Forced Teardown

The teardown strategy should follow this sequence:

1. mark targeted runs as `canceling`
2. request graceful stop
3. wait for a short configurable grace period
4. re-check remaining active descendants
5. force-kill remaining descendants
6. wait for settle
7. report final result

This should apply both to `/panic` and to normal parent-abort flows.

## F. Basic Teardown Reporting

Even before a widget exists, the system should provide enough reporting to understand what happened during teardown.

This may be done through structured logs, status messages, or a small runtime summary.

At minimum, teardown reporting should capture:

- start of panic sequence
- target run count
- each descendant termination attempt
- escalation to forced kill
- final settled result

---

## Guidance on Implementation Shape

### Preferred implementation layer

This work should be implemented primarily in the extension/runtime layer.

It may require updates to:

- orchestrator extension logic
- any task execution manager
- any sub-agent spawn helper
- any tmux/process execution helper
- any internal session wrapper

### Things that should not be relied upon

Do not rely on:

- prompt text alone
- a skill instructing the model to stop things
- best-effort human memory of child processes
- the visible UI stopping as proof that all work has ended

### Optional later additions

After the core teardown model exists, later enhancements may include:

- an investigative skill that summarizes stuck or recently killed runs
- widget integration
- historical activity ledger
- repo-local teardown policy files
- automatic panic suggestions when spend spikes or a run appears stalled

---

## Documentation Changes Required

### 1. Add durable documentation for panic and teardown behavior

Create or update durable repo docs so future agents understand:

- `/panic` exists as an emergency extension command
- nested work must be registered and owned
- parent cancel implies descendant cancel
- a task is not "done canceling" until it is settled

### 2. Update architecture docs and implementation plan

Relevant docs should be updated so the repo no longer implies that cancellation of the visible top-level task is sufficient.

Any documentation discussing:

- orchestrator behavior
- teams validation
- nested agent work
- future widget work
- runtime lifecycle
- sub-agent spawning

should be made consistent with this design.

### 3. Explain relationship to future widget work

The docs should state that:

- observability depends on reliable run-state tracking
- the widget should surface registry/lifecycle state
- teardown correctness is a prerequisite for trustworthy observability

### 4. Keep docs truthful

If a future policy-file system or widget behavior is mentioned, it must be labeled as planned unless implemented in this pass.

---

## Relationship to Existing Project Directions

This design should align with the repo's current trajectory, including:

- teams and router validation
- orchestrator-driven delegation
- future widget/dashboard work
- repo-specific policy configuration
- durable repo conventions
- index-first context routing

This design does not replace those directions. It provides an operational safety layer that they depend on.

In particular, future observability work should consume the state defined here, and future repo-local policy files should be able to tune the behavior introduced here.

---

## Future Policy Compatibility

This design should remain compatible with a future repo-local policy file such as:

`.pi/policies/teardown.yaml`

The policy layer does not need to be fully implemented now, but the design should anticipate fields such as:

- grace period duration
- max concurrent sub-agents
- max allowed nesting depth
- whether panic kills all active descendants or only current task tree
- whether forced kill is always enabled
- whether teardown logs should be persisted

The teardown mechanism should not hard-code assumptions that would make these later controls awkward.

---

## Failure Modes to Address

The implementation must specifically guard against the following failure modes:

1. parent session stops but child session continues
2. child subprocess remains alive after parent cancel
3. child tmux pane remains running after parent cancel
4. registry entry is never created for a child
5. registry state reports canceled before all descendants are stopped
6. `/panic` only cancels the visible parent and misses descendants
7. teardown reporting falsely claims the system is settled
8. duplicate panic requests produce inconsistent state
9. hidden cost continues after user believes everything is stopped

---

## Acceptance Criteria

This design is successfully implemented when all of the following are true:

1. The repo has a real `/panic` extension command.
2. All nested work is registered in a parent-owned run registry.
3. Parent abort automatically triggers descendant teardown.
4. Cancellation is not reported complete until the system reaches settled state.
5. The runtime escalates from graceful stop to forced kill when needed.
6. `/panic` reports what it attempted and what it successfully stopped.
7. The system no longer depends on manual OS-level process hunting as the primary teardown mechanism.
8. Documentation explains the teardown model truthfully.
9. Future widget work has a clean lifecycle state model to consume.

---

## Suggested Implementation Sequence

1. Identify every current path that can spawn nested work.
2. Introduce the run registry and require registration for all spawned descendants.
3. Add lifecycle states and terminal-state handling.
4. Implement parent-abort descendant propagation.
5. Implement graceful-then-forced teardown.
6. Implement `/panic`.
7. Add teardown reporting.
8. Update docs and implementation-plan references.
9. Validate with controlled failure scenarios.

---

## Suggested Validation Scenarios

The implementing agent should validate at least the following scenarios:

### Scenario 1: Normal child completion

- spawn child work
- let it finish normally
- verify registry reaches terminal state cleanly

### Scenario 2: Parent canceled during active child work

- start parent
- spawn child
- cancel parent
- verify child is terminated and registry settles

### Scenario 3: Panic during active nested work

- start task tree
- invoke `/panic`
- verify all descendants are canceled or killed
- verify settled state is reached

### Scenario 4: Child ignores graceful stop

- simulate or use a child path that does not exit promptly
- verify escalation to forced kill occurs
- verify final reporting is honest

### Scenario 5: Repeated panic invocation

- invoke `/panic`
- invoke it again while canceling is in progress
- verify behavior is stable and does not corrupt state

---

## Notes on Future Observability

A future widget should expose, at minimum:

- current task tree
- active descendants
- lifecycle state
- elapsed time
- last event
- canceling vs settled status

However, that widget should consume the runtime state introduced here rather than invent its own model.

The sequencing should be:

1. reliable lifecycle ownership
2. reliable teardown
3. observability UI

not the reverse.

---

## Instructions for the Implementing Agent

Use this document as the source of truth for the implementation pass.

You should:

- make the changes directly in the repo
- treat teardown correctness as the priority
- implement `/panic` as an extension command
- introduce a real run registry
- ensure descendant teardown is automatic on parent abort
- keep documentation truthful
- avoid presenting future policy or widget features as implemented unless they truly are
- report changed files, validation performed, and any remaining ambiguity

When this work is complete, the repo should have a deterministic, explainable, and testable teardown model for nested agent execution.