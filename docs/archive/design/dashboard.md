# Dashboard Design Document for `my-pi`

## Document Status

Draft 1

## Purpose

Define a modular, artifact-backed dashboard for `my-pi` that provides:

1. An always-visible persistent widget for rapid session awareness
2. A `/dashboard` near-full-screen inspector for deeper diagnosis
3. A staged implementation plan that begins with the current substrate and expands incrementally

This dashboard is intended for long-term personal operator use, not for a generalized multi-user product.

---

## Core Design Philosophy

The dashboard should be:

- **artifact-backed**, not transcript-backed
- **read-only** with respect to orchestration state
- **single-session scoped** in v1
- **team-centric** in v1
- **modular at the panel level**
- **incremental**, so layout and detail level can evolve through real use
- **future-compatible** with sequences, campaigns, session comparison, and richer visualizations

The dashboard should help answer these questions:

1. What is happening right now?
2. Where is it happening?
3. Is the run healthy or stuck?
4. How much progress has been made?
5. Where are tokens being spent?
6. Why did something fail, loop, or escalate?

---

## Non-Goals for v1

The dashboard should **not** try to:

- mutate orchestration state
- act as a second orchestrator
- support multi-session tabs
- support cross-session comparisons
- center sequences or campaigns in the UI
- render full graphical state-machine or campaign diagrams in the first release
- implement advanced keyboard interaction beyond opening the dashboard

These are possible future extensions, but they should not shape the first implementation excessively.

---

## Current Scope Assumptions

This design assumes the current project already has structured execution substrate for:

- team execution
- state tracing
- specialist invocation summaries
- worklist support
- observability/session artifacts
- delegation logging

This design also assumes:

- sequences and campaigns are not yet first-class runtime surfaces
- `/dashboard` will be introduced as a new slash command
- token usage needs new or expanded dedicated artifact support

---

## First-Class Dashboard Entities for v1

The dashboard data model should treat the following as first-class:

- `SessionDashboardState`
- `WidgetState`
- `TeamRunView`
- `ExecutionPathView`
- `InvocationView`
- `WorklistProgressView`
- `FailureSummaryView`
- `TokenUsageTreeView`

The following should be anticipated in the model but **not** treated as first-class in the v1 UI:

- sequence
- campaign
- parallel branch / fan-out segment
- cross-session comparison view

---

## Dashboard Surfaces

## 1. Persistent Widget

### Purpose

Provide rapid, always-visible understanding of the current session.

### Scope

- always visible
- current session only
- read-only
- compact multi-line layout
- focused on progress, not deep execution diagnosis

### Required Content

The persistent widget should display:

- current status
- explicit stacked active path
- compact progress-oriented worklist summary
- blocker / escalation indicator
- elapsed time
- total token count

### Active Path Presentation

The active path should be shown with explicit stacked labels rather than a compressed breadcrumb.

Example:

- Team  
  `build-team`

- State  
  `review`

- Agent  
  `reviewer`

Only levels that currently exist should be shown.

### Worklist Summary

The widget worklist summary should be progress-oriented, not execution-oriented.

It should show:

- total items
- completed items
- remaining items
- blocked count when nonzero

Conceptually, the worklist region answers:

**How much work exists, how much is done, how much remains, and is anything blocked?**

### Instrument Bubbles

The widget should include two small highlighted instrument bubbles:

- bottom left: elapsed time
- bottom right: total tokens

These bubbles should be visually distinct but unobtrusive.

### Widget Design Goals

The widget should optimize for:

- quick comprehension
- low cognitive overhead
- stability across runs
- high glance value

The widget should **not** attempt to show:

- token breakdown tree
- detailed failure chain
- structured execution history
- state-machine diagram
- campaign/sequence visualization

---

## 2. `/dashboard` Inspector

### Purpose

Provide a near-full-screen, read-only inspector for the current session.

### Invocation

The dashboard should be opened via:

`/dashboard`

### Scope

- near-full-screen
- current-session only in v1
- read-only
- modular
- overview-led
- designed for layout iteration after first implementation

### Core Panels

The dashboard should initially expose five required panels:

1. Overview
2. Tokens
3. Execution Path
4. Worklist
5. Failures / Escalations

### Layout Philosophy

The dashboard should not hard-code a permanent panel geometry too early.

Instead, the design should distinguish between:

- required panels
- initial default layout
- future layout experimentation

### Initial Default Layout Guidance

The first implementation should be **overview-led**, with **Tokens** treated as highly prominent.

A reasonable starting point is:

- Overview: prominent
- Tokens: prominent
- Execution Path: supporting
- Worklist: supporting
- Failures / Escalations: supporting

However, the shell should be modular enough that this layout can be adjusted after practical use.

---

## Panel Definitions

## Overview Panel

### Purpose

Summarize session health and top-line execution state.

### Required Content

- current session status
- active team
- active state
- active specialist
- top-line work progress
- summary failure/escalation state
- top-line token total
- high-level session metrics
- terminal outcome when completed

### Design Role

This is the primary “what is happening?” panel.

---

## Tokens Panel

### Purpose

Answer the question:

**Where are the tokens going?**

### Required Behavior

The token panel should use a **hierarchical tree** with rollups.

### Required Aggregation Model

The token tree should support this conceptual hierarchy:

- Session
  - Team
    - State
      - Specialist
        - Invocation

Only levels that exist should be rendered.

### Future-Compatible Hierarchy

The model should later allow expansion to:

- Session
  - Campaign segment
    - Sequence stage
      - Team
        - State
          - Specialist
            - Invocation

### Required Data per Node

Each node in the tree should support:

- total tokens
- percentage of parent
- percentage of session total
- optional token subtype counts when available

### v1 Scope

For v1, the token panel should focus on:

- raw token counts
- percentages
- hierarchical attribution

It should **not** focus on:

- cost estimates
- budget enforcement
- compaction policy simulation

### Why Token Usage Needs Dedicated Support

Token usage is one of the main reasons this dashboard exists. Therefore, token accounting should not remain an incidental metric. It should become a dedicated observability artifact or artifact family.

---

## Execution Path Panel

### Purpose

Show the structured path of execution through the current team run.

### v1 Approach

Use a structured textual path representation rather than a graphical state-machine visualization.

### Required Content

For each step in the path:

- entered state
- assigned specialist
- result status
- transition target
- timestamp when available
- duration when available
- iteration count when relevant

### Future Extension

After the textual path proves useful, a future phase may add:

- graphical state-machine rendering
- more visual state progression
- visual indicators for loops or retries

---

## Worklist Panel

### Purpose

Provide detailed progress and task-state visibility for the current session.

### Required Content

- full worklist item summary
- counts by state
- active items
- completed items
- blocked items
- remaining items

### Boundary

The worklist panel is an **observability surface**, not a routing controller.

The dashboard should not allow the worklist to become an accidental second orchestrator.

---

## Failures / Escalations Panel

### Purpose

Provide diagnosis support for unhealthy runs.

### Required v1 Content

- compact failure summary
- most recent failure or escalation
- source stage / source specialist when available
- failure category
- root cause summary when derivable

### Deferred Detail

Detailed failure drill-down should be deferred until after the first release.

That later drill-down may include:

- full contributing event chain
- causal ancestry
- related transitions
- related invocation outcomes

---

## Focus Mode

### Purpose

Allow a panel to expand into a more detailed inspection view without introducing heavy tabbing.

### v1 Decision

Focus mode should be anticipated architecturally, but it does not need to ship in the very first visible release.

### Likely First Focus Candidates

- Tokens
- Execution Path
- Failures / Escalations

---

## Artifact Model

## Principle

Everything shown in the dashboard should come from one of these categories:

- execution artifact
- observability artifact
- derived dashboard projection

The UI should avoid transcript scraping and avoid ad hoc view-side reconstruction.

## Existing Artifact Sources to Consume

The dashboard should consume current structured project artifacts such as:

- team session artifacts
- state trace data
- specialist invocation summaries
- worklist state
- delegation logs

## New or Expanded Artifact Support Needed

### 1. Token Usage Artifact

A dedicated token usage artifact or rollup structure should be introduced.

It should support:

- session total
- team totals
- state totals
- specialist totals
- invocation totals
- optional token subtype counts
- rollup aggregation

### 2. Dashboard Projection Layer

A projection module should derive dashboard-ready state from underlying artifacts.

This projection should produce:

- widget-ready summary state
- dashboard panel view models
- active primitive path
- worklist progress summary
- failure summary projection
- token usage tree

### 3. Active Primitive Path Projection

The active primitive path should be a derived field.

Conceptual example:

`Team: build-team > State: review > Agent: reviewer`

In the widget, this should be rendered as stacked labels rather than inline.

### 4. Worklist Progress Projection

A dedicated dashboard-facing worklist summary should be derived:

- total
- completed
- remaining
- blocked
- optionally active count if easy to compute

### 5. Failure Summary Projection

A normalized summary structure should support:

- latest failure
- latest escalation
- category
- source location
- compact root cause description

This keeps widget and panel rendering simple and consistent.

---

## Module Breakdown

The dashboard should be implemented as a new extension and organized into clear modules.

## Proposed Modules

### Substrate / Model

- `extensions/dashboard/types.ts`
- `extensions/dashboard/projections/`
- `extensions/dashboard/token-usage.ts`
- `extensions/dashboard/failure-summary.ts`
- `extensions/dashboard/widget-state.ts`

### UI

- `extensions/dashboard/widget.ts`
- `extensions/dashboard/command.ts`
- `extensions/dashboard/view.ts`
- `extensions/dashboard/panels/overview.ts`
- `extensions/dashboard/panels/tokens.ts`
- `extensions/dashboard/panels/execution-path.ts`
- `extensions/dashboard/panels/worklist.ts`
- `extensions/dashboard/panels/failures.ts`

### Tests

- projection tests
- token rollup tests
- widget-state tests
- panel view-model tests
- slash-command smoke tests
- rendering/unit tests where practical

---

## Staged Implementation Plan

## Phase 0 — Dashboard Substrate

### Goal

Add the data/model foundation before any visible UI.

### Deliverables

- token usage artifact or rollup model
- dashboard projection layer
- active primitive path derivation
- worklist progress summary derivation
- failure summary derivation
- tests for all derivations

### Success Criteria

- dashboard state can be computed from artifacts without transcript parsing
- token rollups are correct
- widget-ready state is available
- panel-ready state is available

---

## Phase 1 — Persistent Widget

### Goal

Ship the first visible observability surface.

### Deliverables

- always-visible widget
- status display
- stacked active path
- progress-oriented worklist summary
- blocker/escalation indicator
- elapsed-time bubble
- total-token bubble

### Success Criteria

- operator can understand session health at a glance
- widget remains compact and stable
- widget is current-session only
- widget does not require opening the dashboard for basic awareness

---

## Phase 2 — `/dashboard` Inspector

### Goal

Ship the first near-full-screen, read-only session inspector.

### Deliverables

- `/dashboard` command
- overview panel
- token tree panel
- execution path panel
- worklist panel
- failures/escalations panel
- initial overview-led layout

### Success Criteria

- operator can inspect the current session without reading raw logs
- token spend can be attributed hierarchically
- execution path is legible
- work progress and failure state are easy to inspect

---

## Phase 3 — Layout Iteration

### Goal

Refine layout using real use rather than speculative assumptions.

### Deliverables

- adjust panel prominence
- adjust panel ordering
- test alternative overview/token arrangements
- refine density and visual emphasis

### Success Criteria

- panel layout reflects real operator usage
- no unnecessary fixed layout assumptions remain

---

## Phase 4 — Focus Mode

### Goal

Allow deep inspection of high-value panels.

### Likely Initial Targets

- Tokens
- Execution Path
- Failures / Escalations

### Success Criteria

- panel detail can be inspected without cluttering the default dashboard
- focus mode improves utility without introducing orchestration controls

---

## Phase 5 — Visual Enrichment

### Goal

Add richer visuals only after the textual/dashboard substrate proves useful.

### Candidates

- graphical state-machine visualization
- richer token visual cues
- more visual worklist summaries
- sequence visualization once sequences exist
- campaign visualization once campaigns exist

### Success Criteria

- visuals improve comprehension rather than add novelty
- added visuals remain artifact-backed

---

## Phase 6 — Future Session Navigation

### Deferred Scope

- session browsing
- session tabs
- historical inspection
- comparison mode
- alternative slash command for session comparison

This should remain out of scope for v1.

---

## Testing Strategy

The dashboard should inherit the project’s existing bias toward typed substrate and strong tests.

## Required Test Categories

### Projection Tests

Verify:

- active path derivation
- worklist progress summary
- failure summary derivation
- token tree assembly
- panel view-model outputs

### Token Tests

Verify:

- rollup correctness
- percentage correctness
- partial hierarchy rendering
- absent-level handling

### Widget Tests

Verify:

- correct session scope
- correct status display
- correct path stacking
- correct worklist progress formatting
- correct token/time bubble values

### Command / UI Tests

Verify:

- `/dashboard` registration
- current-session loading behavior
- panel presence
- graceful handling of missing optional data

---

## UX Guidelines

## Widget

The widget should feel like an instrument cluster, not a dump of execution details.

It should privilege:
- stability
- quick scanning
- low density
- strong information hierarchy

## Dashboard

The dashboard should feel like an inspector, not like a cockpit.

It should privilege:
- clarity
- drill-down readiness
- modularity
- overview-first comprehension

---

## Future Extensions

These should influence architecture but not v1 implementation:

- session tabs
- cross-session comparison
- sequence-aware dashboard layers
- campaign-aware dashboard layers
- fan-out / parallel branch visualization
- model-routing panel
- cost estimates
- compaction-risk view
- richer keyboard interactions
- exportable dashboard summaries

---

## Open Verification Items Against the Repo

Before implementation begins, confirm the exact current artifact interfaces for:

- team session artifact shape
- state trace shape
- specialist invocation summary shape
- worklist state shape
- delegation log structure
- where token usage can be captured most reliably

These confirmations should drive the exact field names in the implementation, but they do not change the design direction.

---

## Final Recommendation

Build the dashboard as a **new read-only extension** that starts with:

1. typed dashboard substrate
2. persistent progress-oriented widget
3. `/dashboard` overview-led inspector
4. modular panel iteration based on real use

Do **not** overcommit to final layout geometry or advanced visuals in the first release.

The correct first goal is not to make the dashboard visually sophisticated.  
The correct first goal is to make the system’s current execution state, progress, and token usage legible at a glance.