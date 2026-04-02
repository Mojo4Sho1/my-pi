# Design Document: Runtime Maturity Additions for `my-pi`

## Status

Draft proposal aligned to current Stage 5 / Stage 5a.1 work.

## Purpose

This document defines a set of runtime-maturity additions for `my-pi` that strengthen the system without changing its core philosophy. The goal is not to make `my-pi` resemble Claude Code at a surface level. The goal is to selectively adopt the parts of Claude Code that improve runtime quality, observability, and governance while preserving the bounded-context, contract-first, orchestrator-led architecture that already defines `my-pi`.

This document focuses on five additions:

1. hook substrate
2. deterministic sandboxing and path protection
3. minimal command ergonomics
4. bounded parallelism and execution scheduling
5. token telemetry as a safety redline rather than a memory rescue strategy

## Architectural Context

`my-pi` already has a strong architectural identity.

The orchestrator is the only broadly contextual actor by default. Specialists are narrow. Teams are opaque units with explicit entry and exit contracts. Delegation uses bounded packets rather than broad transcript inheritance. The worklist is an execution aid rather than a second routing authority. Recent Stage 5 work extends this substrate with new design and governance specialists, semantic adequacy checks, and subprocess hardening.

That architecture is already good. The additions in this document are intended to mature the runtime around it.

## Design Philosophy

The following principles govern every addition proposed here.

### 1. No compaction as a control strategy

`my-pi` does not use compaction to rescue oversized context. If an invocation approaches unsafe context size, the correct response is to split the task, reduce the packet, or spawn a fresh bounded agent. Token telemetry exists to prevent the system from approaching context limits, not to justify summarizing accumulated history to fit.

### 2. The orchestrator remains the only broad-context authority

No hook, command, dashboard, or runtime service may become a hidden second orchestrator. New runtime features may observe, constrain, or report on execution, but they may not silently reroute the system outside explicit orchestration contracts.

### 3. Deterministic guardrails outrank learned permissioning

`my-pi` should prefer explicit runtime policies, visible boundaries, and hard enforcement over learned approval systems or LLM-based permission classifiers. Access boundaries should be inspectable, reproducible, and artifacted.

### 4. Observability is artifact-backed

The runtime should project state from structured artifacts, not reconstruct truth from free-form transcript text. The widget, `/dashboard`, token views, policy failures, and execution traces should all consume the same typed execution records.

### 5. Parallelism stays bounded and typed

Parallelism is useful, but only in constrained forms. Read-only and analysis-only work may fan out. Mutating work stays exclusive unless explicitly proven safe. Every parallel branch requires an explicit join contract.

### 6. Command surface emerges from real usage

The system should not commit early to a large command vocabulary. At this stage, only `/dashboard` is clearly justified. Future commands should emerge from repeated user workflows rather than from speculative feature design.

## Scope

This document covers:

- lifecycle hooks
- path protection and sandbox policy
- command ergonomics centered on `/dashboard`
- bounded execution scheduling
- token telemetry and thresholding
- projection and runtime observability
- rollout sequencing

This document does not cover:

- MCP integration
- context compaction
- learned permission classifiers
- background teammate-style autonomous swarms
- speculative large command surfaces

## Goals

### Primary goals

- increase runtime inspectability
- harden execution boundaries
- expose useful runtime state during orchestration
- preserve bounded fresh-context execution
- create clean extension points for policy and instrumentation
- enable future safe parallelism

### Secondary goals

- reduce hidden coupling in runtime behavior
- make failures easier to diagnose
- create clean seams for future governance features
- avoid premature UX sprawl

## Non-Goals

The following are explicitly out of scope for this phase.

### 1. Conversation compaction

The system does not implement compaction as an operational strategy. It may summarize artifacts for user-facing presentation, but it does not compress oversized conversational state to keep an invocation alive.

### 2. MCP support

The system does not integrate MCP in this phase. External capability protocols may be evaluated later, but only after governance, runtime boundaries, and artifact-backed observability are mature.

### 3. Implicit specialist invocation commands

The system does not assume that explicit specialist commands belong in the initial command surface. They may become useful later, but they are not adopted by default.

### 4. Ambient autonomous background execution

The system does not adopt teammate-style background swarms or hidden long-lived sub-agent activity as a default operating mode.

## Proposed Additions

## 1. Hook Substrate

### Motivation

The current architecture already has explicit execution points where policies, instrumentation, and reviews naturally belong. Right now, those concerns risk being scattered across orchestration and delegation code. A hook substrate provides a clean lifecycle mechanism for interception and observation without turning those concerns into hidden control flow.

### Design objectives

The hook system should:

- expose runtime lifecycle events as stable interfaces
- allow policy enforcement without contaminating routing logic
- allow structured instrumentation and logging
- preserve explicit orchestration authority
- support future extensibility without creating hidden behavior

### Hook classes

The system defines three hook classes.

#### A. Policy hooks

Policy hooks are authoritative gates.

They may:

- allow execution
- deny execution
- attach structured reasons
- attach structured policy annotations

They may not:

- call models
- perform hidden rerouting
- mutate orchestration state outside their declared output

Policy hooks should remain deterministic.

#### B. Observer hooks

Observer hooks are non-authoritative listeners.

They may:

- log structured events
- emit derived artifacts
- update runtime projections
- collect metrics
- support dashboard/widget projections

They may not:

- veto execution
- rewrite task packets
- trigger hidden routing

#### C. Review hooks

Review hooks are the only hook class that may trigger specialist activity, and only through explicit packetized downstream invocations. A review hook may request a bounded audit or critique, but the resulting invocation must appear in the trace as an explicit runtime action.

This preserves the rule that hooks do not become a second orchestrator.

### Event surface

The hook substrate should expose a small but meaningful event model.

Initial events:

- `onSessionStart`
- `onTeamStart`
- `beforeStateTransition`
- `afterStateTransition`
- `beforeDelegation`
- `afterDelegation`
- `beforeSubprocessSpawn`
- `afterSubprocessExit`
- `onAdequacyFailure`
- `onPolicyViolation`
- `onArtifactWritten`
- `onCommandInvoked`
- `onSessionEnd`

These map cleanly to current `my-pi` execution semantics.

### Hook payloads

Every hook event should receive a typed payload. Payloads should include only the information appropriate to the event, not a generic global runtime bag.

Example payload categories:

- session metadata
- active team or primitive
- bounded task packet metadata
- token totals and thresholds
- policy envelope
- subprocess metadata
- artifact references
- adequacy result
- failure classification

The payload design should reinforce boundedness. Hooks should receive the minimum event-local data necessary.

### Governance rules

The hook system must obey the following rules:

1. hooks do not silently reroute execution
2. hooks do not gain broad context by default
3. policy hooks are deterministic
4. review hooks trigger explicit traceable invocations
5. observer hooks are side-effect-limited to approved artifact or telemetry outputs
6. hook failures are typed and visible

### Initial implementation strategy

Phase 1 hook support should include:

- local in-process registration only
- policy hooks
- observer hooks
- typed event payloads
- hook error reporting
- hook event traces

Phase 1 should not include:

- HTTP hooks
- arbitrary external network hooks
- dynamic code loading from untrusted locations
- hook-triggered hidden orchestration

### Initial use cases

Immediate hook use cases include:

- policy enforcement before subprocess spawn
- token warning emission
- widget projection updates
- artifact creation logs
- adequacy failure logging
- boundary auditing triggers through explicit review invocations

## 2. Deterministic Sandboxing and Path Protection

### Motivation

The runtime already thinks in terms of narrow specialists, bounded authority, and allowed write sets. Those constraints now need hard runtime enforcement. Architectural intent alone is not sufficient. The runtime should convert those constraints into deterministic execution boundaries.

### Design objectives

The sandbox and path protection layer should:

- enforce declared path authority
- separate read and write permissions
- fence subprocess execution
- produce structured violation artifacts
- remain useful even without OS-specific sandbox backends
- compose cleanly with specialist and team semantics

### Policy envelope

Every delegation should carry an explicit runtime policy envelope.

Initial policy fields:

- `allowedWritePaths`
- `allowedReadRoots`
- `allowShell`
- `allowNetwork`
- `allowProcessSpawn`
- `allowedCommands`
- `forbiddenGlobs`
- `scratchPolicy`
- `artifactWritePolicy`
- `tempDirectoryPolicy`

This envelope should be visible in traces and artifacts.

### Enforcement layers

#### Layer 1: Path policy

Before execution begins, the runtime validates the packet’s path and access policy. This layer determines what the invocation may read, write, or execute.

#### Layer 2: Hardened launcher

All subprocess-based work must pass through a single hardened launcher interface. No specialist should bypass this layer. The launcher validates policy, constructs the execution environment, and records the spawn event.

#### Layer 3: Violation artifacts

Any attempted violation should generate a typed `PolicyViolation` record with at least:

- timestamp
- active session and invocation
- attempted action
- target path or command
- expected policy
- violation type
- enforcement result
- whether any side effect occurred

Violations should surface in artifacts, widget health state, and `/dashboard`.

#### Layer 4: Optional OS isolation backend

A future implementation may add stronger OS-level isolation behind the same interface. This backend remains optional and should not change higher-level semantics. The baseline design should already provide clear and deterministic enforcement using the hardened launcher and path policy layer.

### Default specialist authority model

The runtime should adopt sensible default authority classes.

#### Read-only by default

These specialists should default to read-only execution:

- planner
- reviewer
- critic
- spec-writer
- schema-designer
- routing-designer
- boundary-auditor

#### Narrow-write by explicit grant

These specialists may receive bounded write authority when the packet explicitly grants it:

- builder
- tester

### Governance rules

1. runtime authority is packet-derived, not specialist-self-declared
2. read-only specialists do not gain write access implicitly
3. hidden file mutation is treated as a policy violation
4. shell access is explicit and traceable
5. policy failures remain visible even if the invocation continues in degraded mode

### Initial implementation strategy

Phase 1 should focus on:

- policy envelope schema
- hardened subprocess launcher
- path validation before spawn
- structured policy violation artifacts
- read-only vs narrow-write specialist defaults

Phase 1 should not try to solve:

- full OS-level process isolation across all platforms
- elaborate sandbox UX
- dynamic user approval flows
- learned permission classification

## 3. Command Ergonomics

### Motivation

The runtime needs a small number of user-facing control surfaces. However, command sprawl is a real risk, especially while the project is still iterating and discovering its natural workflow. The command surface should stay minimal and emerge from actual usage rather than speculative design.

### Current design decision

At this stage, the only clearly justified command is:

- `/dashboard`

This command provides a read-only structured view over current session execution artifacts.

### Command design principles

Any command adopted later must satisfy all of the following:

1. it exposes a repeated orchestration pattern that users intentionally invoke
2. it does not bypass contracts, policy enforcement, or artifact generation
3. it does not duplicate a lower-level tool surface without adding orchestration value
4. it projects or initiates behavior through the same substrate as normal execution
5. it remains understandable as a top-level user affordance

### Initial command surface

#### `/dashboard`

`/dashboard` should:

- read from structured session artifacts
- display current session state
- show active primitive path
- show worklist progress
- show policy violations
- show adequacy failures
- show token totals and thresholds
- show major execution events
- remain read-only

`/dashboard` should not:

- mutate runtime state
- reroute work
- silently trigger specialist execution
- act as a control plane disguised as an inspector

### Deferred command surface

No additional commands are committed in this document.

Possible future commands may exist, but they should only be adopted after repeated use patterns demonstrate that they solve a real orchestration need. The project should resist premature commitment to commands such as explicit specialist invocation unless genuine workflow evidence supports them.

### Governance rules

1. commands are entry points into the same governed runtime
2. commands do not bypass routing, policy, or tracing
3. commands should stay few and meaningful
4. no command should create a hidden second control plane

## 4. Bounded Parallelism and Execution Scheduling

### Motivation

Some specialist work is naturally parallelizable. However, unrestricted parallelism risks hidden coupling, unclear joins, and governance complexity. The system should support bounded parallel execution where it clearly improves throughput or review quality, but only under strong constraints.

### Design objectives

The scheduler should:

- distinguish safe parallel work from exclusive work
- support explicit fan-out and fan-in patterns
- preserve trace clarity
- surface token and policy data per branch
- support sibling abort when required
- avoid swarm-like hidden autonomy

### Concurrency classes

The scheduler should begin with two classes.

#### A. Parallel-safe

Parallel-safe work must be:

- read-only
- bounded
- independently meaningful
- joinable through an explicit contract

Typical examples:

- critique branches
- boundary audits
- design reviews
- parallel analysis over the same artifact

#### B. Exclusive

Exclusive work includes:

- file mutation
- stateful build steps
- test runs that mutate workspace state
- any work with ambiguous side effects

### Fan-out rules

The initial scheduler should support a conservative fan-out model.

Rules:

1. only parallel-safe branches may fan out
2. each fan-out site defines an explicit join contract
3. no recursive fan-out in the first version
4. branch-local tokens and violations remain visible
5. branch failures are typed
6. sibling abort behavior is explicit

### Join behavior

Every fan-out must define how it rejoins.

Possible join modes:

- synthesis join
- arbitration join
- consensus join
- best-effort aggregation

The runtime should require the join mode to be explicit rather than inferred.

### Sibling abort policy

The first version should support two branch group modes:

- `fail-fast`
- `best-effort`

`fail-fast` means a hard failure or escalation in one branch aborts still-running siblings.

`best-effort` means the runtime gathers as many branches as possible and marks partial failure in the join record.

### Non-goals for initial scheduler

The initial scheduler should not include:

- background teammate execution
- recursive branch trees
- hidden multi-agent swarms
- dynamic branch creation from arbitrary branch outputs

## 5. Token Telemetry as Safety Redline

### Motivation

Stage 5a.1 already introduces token tracking. This work needs a clear doctrinal frame so it does not drift into compaction logic later.

### Core design rule

Token telemetry exists to maintain healthy bounded execution. It does not exist to justify ever-larger context accumulation.

If a packet becomes too large, the orchestrator should split or respawn with fresh context.

### Design objectives

The token layer should:

- measure usage per invocation
- aggregate usage per team
- surface usage in widget and dashboard
- support branch-level views for future fan-out
- trigger warnings and hard redlines
- stay independent from any compaction policy

### Threshold model

Each invocation should define three thresholds.

#### Warn threshold

The runtime surfaces a warning in widget and dashboard. Execution may continue normally.

#### Split threshold

The orchestrator should prefer spawning a fresh bounded invocation or reducing packet scope before continuing along the same path.

#### Deny threshold

The runtime blocks further delegation under the current packet shape and requires a smaller packet or a fresh bounded invocation.

### Rollup levels

The token system should expose rollups at three levels.

#### Per invocation

Tracks the token footprint of a single specialist or team invocation.

#### Per team session

Aggregates token totals across a team execution.

#### Per branch

Tracks token totals for each branch in future fan-out states.

### Governance rules

1. token telemetry is preventive, not rescue-oriented
2. token thresholds should be visible and inspectable
3. token data should not create hidden behavior
4. split and deny actions should be traceable
5. packet size remains an orchestration concern

## 6. Projection Layer and Widget

### Motivation

The runtime needs a persistent, low-friction view of system health. The widget and `/dashboard` should project the same underlying truth from the same artifacts, with different levels of density.

### Design objectives

The projection layer should:

- consume structured artifacts
- remain read-only
- provide session health visibility
- expose token and policy state
- support both compact and expanded views

### Widget scope

The persistent widget should show a compact operational summary. Initial fields should include:

- session status
- active team or primitive path
- worklist progress
- blocker presence
- elapsed time
- token total
- warning or failure indicators

The widget should remain concise. It should not become a dense debugging panel.

### Dashboard scope

`/dashboard` should expose a fuller projection of the same artifact set, including:

- session summary
- execution path and state transitions
- worklist state
- token totals and thresholds
- policy violations
- adequacy failures
- current policy envelope summary
- recent artifact writes
- branch summaries when parallelism lands

### Design rule

The widget and dashboard should not compute their own hidden truth. They should project from the same typed runtime records.

## 7. Artifact Model Additions

To support the features above, the runtime should add or formalize the following artifact types.

### Suggested typed records

- `HookEvent`
- `HookFailure`
- `PolicyEnvelope`
- `PolicyViolation`
- `SpawnRecord`
- `InvocationTokenUsage`
- `TeamTokenSummary`
- `BranchTokenSummary`
- `AdequacyFailure`
- `DashboardProjection`

### Artifact principles

1. artifacts are append-friendly
2. artifacts are typed
3. artifacts are session-scoped unless explicitly lifted
4. artifacts should support projection without transcript parsing
5. artifact schemas should stay stable once adopted

## 8. Governance Constraints

The additions in this document must obey the following project-level governance constraints.

### Hidden authority prohibition

No hook, command, dashboard, or policy engine may silently become a routing authority outside the orchestrator.

### Explicit traceability

Every meaningful runtime action should appear in session artifacts.

### Narrow default authority

Specialists start narrow and gain authority only through explicit packet policy.

### Fresh-context preference

When token or task size grows unsafe, the system prefers fresh bounded invocations over context compression.

### Runtime uniformity

Commands, orchestrated flows, hooks, and delegated specialists should all flow through the same governed runtime substrate wherever possible.

## 9. Rollout Sequence

The following sequence best matches the current project direction.

### Step 0: Documentation sync

Before adding new runtime features, align all architecture documents with current Stage 5 reality, including the current specialist roster and current roadmap state.

### Step 1: Finish Stage 5a.1 token substrate

Complete per-invocation token tracking, team rollups, and threshold utilities.

### Step 2: Finish projection layer and persistent widget

Build the read-only projection layer and persistent widget on top of structured artifacts.

### Step 3: Add hook substrate

Start with local in-process policy hooks and observer hooks. Add review hooks only after the event model is stable.

### Step 4: Add deterministic sandboxing and path protection

Introduce policy envelopes, hardened launcher flow, and violation artifacts before heavy operational validation.

### Step 5: Validate on real bounded tasks

Run real build-team tasks with tokens, widget state, policy enforcement, and hook traces active.

### Step 6: Ship `/dashboard`

Expose the expanded inspector view over current session artifacts.

### Step 7: Add bounded parallel fan-out

Implement controlled parallel-safe fan-out with explicit join contracts and visible branch-level traces.

### Step 8: Reevaluate command surface from usage

Only after real usage should the system consider whether additional commands are justified.

## 10. Open Questions

The following questions remain intentionally open.

### 1. Hook registration model

Should hook registration be purely static at first, or should local extension packages register hooks dynamically at load time?

### 2. Policy envelope granularity

How fine-grained should command-level allowlists become before they create unnecessary runtime complexity?

### 3. Widget density

What is the minimum useful information density for the persistent widget before it becomes noisy?

### 4. Parallel join semantics

Which join modes are worth supporting in the first scheduler version beyond a minimal synthesis join?

### 5. Artifact storage format

What artifact format best balances append performance, inspectability, and schema evolution?

## 11. Recommendations

The highest-priority recommendations are:

1. finish the token substrate with explicit threshold semantics
2. keep `/dashboard` as the only committed command for now
3. implement a hook substrate centered on policy and observation
4. harden subprocess execution with a visible policy envelope and typed violations
5. treat bounded parallelism as a later controlled extension, not as a default execution style
6. document explicitly that `my-pi` rejects compaction as an operational strategy

## 12. Final Position

`my-pi` does not need to become more like Claude Code in a broad sense. It already has a stronger architectural thesis around bounded delegation, contractual handoff, and fresh-context execution. The right move is to mature the runtime around that thesis.

The additions in this document do exactly that.

They improve:

- lifecycle extensibility
- execution safety
- runtime visibility
- future concurrency support
- operational clarity

They do so without weakening the core design rules that make `my-pi` interesting in the first place.