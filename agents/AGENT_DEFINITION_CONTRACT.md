# AGENT_DEFINITION_CONTRACT.md

## Purpose

This document defines the contract for agent-related definitions in this repository.

It establishes the required fields, behavioral boundaries, routing and access rules, and type-specific expectations for the following definition classes:

- orchestrator
- specialist
- team
- sequence

This document defines the contract. It does not define the current set of concrete agents. Those belong in their own files.

---

## Core rule

Route eligibility is a property of the definition itself.

An actor does not decide for itself whether it should read broad repository context. That authority is encoded in its definition and enforced through routing rules, task packets, and orchestration behavior.

This means:

- the orchestrator is broad by default
- most downstream actors are narrow by default
- exceptions must be explicit in the definition

---

## Contract goals

This contract exists to ensure that agent-related definitions are:

- modular
- explicit
- composable
- context-disciplined
- behaviorally steerable
- easy to route
- easy to validate
- easy to expand over time

The contract should favor clarity over cleverness.

---

## Definition classes

### Orchestrator

Top-level coordinating actor.

The orchestrator reads broad repository state by default, selects execution strategy, delegates work, synthesizes results, and updates project state.

### Specialist

Primitive execution unit.

A specialist performs one narrow class of work from bounded context and returns a bounded result.

### Team

Reusable collaboration bundle.

A team groups specialists around a recurring class of work and defines a default collaboration pattern and deliverable.

### Sequence

Reusable execution pattern.

A sequence defines a staged workflow that may invoke specialists, teams, or both.

---

## Common required fields

Every definition file should include the following fields.

### Identity

- `id`  
  Stable machine-friendly identifier.

- `name`  
  Human-readable name.

- `definition_type`  
  One of:
  - `orchestrator`
  - `specialist`
  - `team`
  - `sequence`

### Intent

- `purpose`  
  What this definition exists to do.

- `scope`  
  What kinds of work are inside its boundary.

- `non_goals`  
  What this definition should not try to do.

### Routing and access

- `routing_class`  
  One of:
  - `orchestrator`
  - `downstream`

- `context_scope`  
  One of:
  - `broad`
  - `narrow`

- `default_read_set`  
  The documents or document classes this actor may read by default.

- `forbidden_by_default`  
  The documents or document classes this actor should not read unless explicitly instructed.

### Inputs and outputs

- `required_inputs`  
  What this actor must receive before acting.

- `expected_outputs`  
  What this actor returns when work is complete.

- `handback_format`  
  The expected structure of the returned result.

### Control and escalation

- `activation_conditions`  
  When this definition should be used.

- `escalation_conditions`  
  When this actor must hand control back upward or request broader context.

### Validation

- `validation_expectations`  
  What level of checking, review, or verification this actor is responsible for.

### Relationships

- `related_docs`  
  Directly relevant docs for understanding or using this definition.

- `related_definitions`  
  Other definitions commonly used with or around this one.

---

## Common optional fields

These fields are optional, but useful when they improve clarity.

- `notes`
- `examples`
- `recommended_task_types`
- `disallowed_actions`
- `allowed_actions`
- `known_limitations`
- `working_style`

Optional fields should not replace required fields.

---

## Behavioral steering

### `working_style`

`working_style` defines how an actor should approach work within its existing boundaries.

It is not a theatrical persona. It is an execution-style control that helps keep behavior consistent across runs.

`working_style` must never:

- expand scope
- broaden read access
- override authority boundaries
- weaken escalation rules
- conflict with task-packet constraints
- conflict with handoff, workflow, or routing rules

If a `working_style` statement conflicts with scope, routing, or authority, the scope/routing/authority rule wins.

### Recommended `working_style` subfields

When `working_style` is present, it should normally include:

- `reasoning_posture`  
  How the actor tends to think while doing its work.

- `communication_posture`  
  How the actor should present findings, decisions, or outputs.

- `risk_posture`  
  How cautious or aggressive the actor should be when uncertainty exists.

- `default_bias`  
  The actor's preferred direction when several valid choices exist.

- `anti_patterns`  
  Behaviors the actor should actively avoid.

Additional subfields may be added when they improve clarity, but these five should be treated as the default schema.

### Current-phase requirement rule

In the current phase of this repository:

- `working_style` is required for specialists
- `working_style` is strongly recommended for orchestrators
- `working_style` is optional for teams and sequences until those classes are formally upgraded

This rule may be revised later by durable decision, but definitions should follow it unless explicitly superseded.

---

## Access and authority fields

These fields are especially important because they control repository visibility and state authority.

### `can_delegate`

Boolean.

- `true` means the actor may delegate work to other actors
- `false` means the actor performs assigned work only

Default expectation:
- orchestrator: `true`
- most specialists: `false`

### `can_synthesize`

Boolean.

- `true` means the actor may integrate multiple results into a single result
- `false` means the actor should return only its own bounded result

Default expectation:
- orchestrator: `true`
- most downstream actors: `false`

### `can_update_handoff`

Boolean.

Controls whether the actor may update handoff documents by default.

Default expectation:
- orchestrator: `true`
- most downstream actors: `false`

### `can_update_workflow_docs`

Boolean.

Controls whether the actor may update operating documents such as workflow or orchestration docs by default.

Default expectation:
- orchestrator: usually `true`
- most downstream actors: `false`

### `can_request_broader_context`

Boolean.

Indicates whether the actor may ask for more context when blocked.

Default expectation:
- generally `true`
- but request does not imply automatic permission

---

## Type-specific required fields

## Orchestrator-specific fields

An orchestrator definition must also include:

- `startup_read_order`  
  Ordered list of documents the orchestrator reads at the start of a session.

- `delegation_modes`  
  Which of the following it may use:
  - direct specialist delegation
  - multi-specialist delegation
  - team delegation
  - sequence execution
  - mixed execution

- `state_update_responsibilities`  
  Which state artifacts it is expected to maintain.

- `selection_policy`  
  High-level rule for choosing specialists, teams, sequences, or mixed patterns.

### Orchestrator defaults

An orchestrator should normally have:

- `routing_class: orchestrator`
- `context_scope: broad`
- `can_delegate: true`
- `can_synthesize: true`
- `can_update_handoff: true`

### Orchestrator working-style guidance

An orchestrator definition should normally include `working_style`, even though only specialists are currently required to do so.

Orchestrator `working_style` should reinforce:

- disciplined routing
- bounded delegation
- explicit packetization
- clean separation between repository bundle state and downstream task packets
- state-maintenance discipline

---

## Specialist-specific fields

A specialist definition must also include:

- `specialization`  
  The narrow class of work it owns.

- `task_boundary`  
  What kinds of tasks it may accept.

- `deliverable_boundary`  
  What kinds of outputs it may produce.

- `failure_boundary`  
  When it should stop and escalate rather than continue.

- `working_style`  
  The specialist's execution-style guidance, following the rules and subfields defined above.

### Specialist defaults

A specialist should normally have:

- `routing_class: downstream`
- `context_scope: narrow`
- `can_delegate: false`
- `can_synthesize: false`
- `can_update_handoff: false`

### Specialist working-style guidance

A specialist `working_style` should make the specialist more predictable, not broader.

It should help answer:

- how the specialist reasons
- how it communicates
- how it handles uncertainty
- what default tradeoff it prefers
- what kinds of drift or overreach it should avoid

---

## Team-specific fields

A team definition must also include:

- `members`  
  The specialists that make up the team.

- `collaboration_pattern`  
  How members interact.

- `team_deliverable`  
  What the team returns as a whole.

- `member_context_policy`  
  What each member should receive by default.

### Team defaults

A team should normally have:

- `routing_class: downstream`
- `context_scope: narrow`
- `can_delegate: false` by default unless explicitly designed otherwise
- `can_synthesize: true` only if the team definition explicitly includes synthesis responsibility
- `can_update_handoff: false`

### Team working-style guidance

If a team includes `working_style`, it should describe the collaboration posture of the team as a unit, not duplicate every member's specialist behavior.

---

## Sequence-specific fields

A sequence definition must also include:

- `stages`  
  Ordered list of stages.

- `stage_actors`  
  Which specialists or teams act in each stage.

- `parallel_rules`  
  Any stages that may run in parallel.

- `merge_points`  
  Where parallel outputs are combined.

- `stop_conditions`  
  When the sequence should halt or return control upward.

- `sequence_deliverable`  
  What the sequence returns when complete.

### Sequence defaults

A sequence should normally have:

- `routing_class: downstream`
- `context_scope: narrow`
- `can_delegate: false` unless explicitly acting as a managed execution wrapper
- `can_synthesize: true` only if the sequence definition includes synthesis
- `can_update_handoff: false`

### Sequence working-style guidance

If a sequence includes `working_style`, it should describe execution pacing, merge discipline, escalation behavior, and stop-rule posture.

---

## Read-set rules

### Broad actors

Broad actors may read the orchestrator route by default.

This usually includes:

- `AGENTS.md`
- `INDEX.md`
- `docs/WORKFLOW.md`
- handoff documents required by the startup path

Broad access should be rare and explicit.

### Narrow actors

Narrow actors should read:

- `AGENTS.md`
- `INDEX.md`
- their assigned task packet
- only the docs explicitly named in that packet or in their own definition

Narrow actors should not read workflow or handoff state by default.

Unless explicitly granted, downstream actors should not treat `docs/handoff/NEXT_TASK.md` as their task packet. Repository handoff state and downstream task packets are separate artifacts.

---

## Handoff authority rule

By default, only the orchestrator should update:

- `docs/handoff/CURRENT_STATUS.md`
- `docs/handoff/NEXT_TASK.md`
- `docs/handoff/TASK_QUEUE.md`
- `docs/handoff/DECISION_LOG.md`
- `docs/handoff/OPEN_DECISIONS.md`

A downstream actor may only update those artifacts if its definition explicitly grants that authority.

The default system assumption is that live state remains orchestrator-owned.

---

## Authoring rules

Definitions should be:

- short
- explicit
- role-specific
- behaviorally steerable without becoming theatrical
- non-overlapping where possible
- written so that another future agent can use them without guessing intent

Avoid vague phrases like:

- “helps with many things”
- “may do whatever is needed”
- “acts broadly”
- “has a strong personality”
- “behaves like a senior expert”

Instead, define boundaries clearly and describe execution posture in operational terms.

---

## Naming rules

Identifiers should be stable and machine-friendly.

Names should be literal and readable.

Examples of good IDs:

- `orchestrator_main`
- `specialist_planner`
- `team_planning`
- `sequence_feature_delivery`

Prefer consistency over creativity.

---

## File placement

Definitions should live under `agents/` in the appropriate subtree.

Expected layout:

- `agents/orchestrator/` or equivalent orchestrator location
- `agents/specialists/`
- `agents/teams/`
- `agents/sequences/`

A local index file may later route within these subtrees.

---

## Minimum acceptance rule

A definition is not complete unless it answers:

- what this actor is
- what it does
- what it does not do
- how it should behave while staying inside its boundary
- what it may read by default
- what it must not read by default
- what it receives
- what it returns
- when it escalates
- whether it may update project state

If any of those are unclear, the definition is incomplete.

For specialists in the current phase, omission of `working_style` also makes the definition incomplete.

---

## Non-goals

This contract does not define:

- the full concrete roster of actors
- the exact contents of repository handoff artifacts
- the exact contents of `NEXT_TASK.md`
- the exact contents of task packets
- the exact contents of result packets
- the exact template system
- the exact handoff schema

Those belong in separate documents.

---

## Summary

This contract defines the shared structure for agent-related definitions in `my-pi`.

Its most important rules are:

- access and routing are properties of the definition itself
- the orchestrator is broad by default
- most downstream actors are narrow by default
- repository handoff state is not the same thing as a downstream task packet
- `working_style` steers behavior but never overrides scope, routing, or authority

This contract should be used as the basis for all future orchestrator, specialist, team, and sequence definition files.