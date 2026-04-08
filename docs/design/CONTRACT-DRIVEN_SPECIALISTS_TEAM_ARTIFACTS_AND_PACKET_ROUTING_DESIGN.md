# CONTRACT-DRIVEN SPECIALISTS, TEAM ARTIFACTS, AND PACKET ROUTING DESIGN

## Status

Proposed

## Purpose

This document defines the next architectural step for `my-pi` so that specialists and teams operate through strict machine-first contracts, validated artifacts, and router-owned packet construction.

The immediate goals are:

1. eliminate ambiguity in how specialists receive work and produce results
2. prevent teams from passing around loosely structured or partially interpreted outputs
3. introduce strong guardrails around artifact ownership and edit scope
4. reconcile the tester/build-team redesign everywhere in the repo
5. create a schema-driven foundation for adding future specialists and teams

This design is intended to drive an implementation pass. Once the implementation is complete and the durable repo documentation has been updated accordingly, this design document may be archived according to the repo's normal design-doc workflow.

---

## Background

The repo already contains important pieces of a contract-oriented architecture:

- typed task and result packet structures
- specialist and team definitions
- input and output contract fields
- shared prompt-generation utilities
- routing logic
- result parsing
- validation task coverage

However, the current system is only partially contract-driven in practice.

Several issues are now visible:

1. structured specialist outputs are not preserved cleanly end-to-end
2. output contracts are not enforced against the actual named fields specialists claim to produce
3. downstream packet construction still relies in part on ad hoc field mapping and generic summaries/deliverables
4. build-team and tester semantics have drifted across the repo
5. persisted artifacts are not yet treated as canonical machine-first forms
6. team handoff semantics are still too loose for reliable specialist composition

At the same time, the project has already moved conceptually toward a better model:

- selective context forwarding
- contract-aware routing
- tester as test author rather than test runner
- stronger team orchestration
- future policy-driven behavior
- index-first context routing
- improved teardown and observability

This design pulls those directions into one coherent contract-and-artifact architecture.

---

## Problem Statement

The system currently behaves as though specialists have contracts, but it does not yet fully enforce a model where specialists simply receive a validated packet, fill out a role-specific machine artifact, and hand that artifact back to the router for validation and downstream packet construction.

This creates several problems:

- output validation can be lossy or indirect
- downstream routing depends on generic fields rather than typed specialist outputs
- specialists can conceptually overreach into work products they do not own
- build-team handoff semantics remain underspecified
- partial outputs can create routing ambiguity
- future specialist/team creation remains too ad hoc

The project needs a stricter architecture in which:

1. each specialist has a well-defined machine-readable contract
2. persisted artifacts are canonical and machine-first
3. the router validates specialist artifacts directly
4. the router constructs the next task packet from validated outputs
5. specialists do not directly mutate shared team state
6. specialist and team definitions can eventually be generated from stable YAML specs

---

## Core Decisions

### 1. Specialists must operate through explicit machine-readable contracts

Every specialist must have a formal contract describing:

- required input fields
- optional input fields
- output fields it is responsible for producing
- field types
- ownership boundaries
- allowed actions
- escalation rules
- status semantics

These contracts must not exist only as prose. They must be represented in machine-readable form and enforced by runtime validation.

### 2. Persisted specialist artifacts must be machine-first

Persisted specialist outputs must use machine-first canonical artifacts.

Preferred canonical formats are:

- YAML
- JSON

Human-oriented Markdown summaries may exist later, but they must not be the canonical form used for routing and validation.

The machine artifact is the source of truth.

### 3. Teams must not pass around one mutable shared specialist-edited file

Teams should not use a model where the planner writes a file, the builder edits that same file, the tester edits the same file again, and so on.

That model weakens ownership boundaries and makes validation difficult.

Instead, the system should use:

- a router-owned team session artifact
- specialist-owned output artifacts
- router-built downstream task packets

### 4. The router must validate artifacts and create the next task packet

The router must become the canonical packet constructor between team steps.

The intended flow is:

1. specialist receives validated TaskPacket
2. specialist produces a role-owned machine artifact
3. router parses and validates that artifact against the specialist's output contract
4. router stores/links the artifact
5. router constructs the next specialist's TaskPacket from validated fields only
6. router forwards only the fields permitted by the downstream input contract

This is the central architecture decision of this design.

### 5. Role ownership and edit scope must be enforceable

Every persisted specialist artifact must declare its owner and edit scope.

A specialist should never be able to silently fill in or overwrite fields that belong to another role.

The runtime must validate this.

### 6. The tester must become a test author everywhere

The repo must fully adopt the already-discussed redesign:

- the tester is not primarily a test runner
- the tester authors tests and test expectations
- the builder then runs those tests and updates the implementation until the code satisfies them
- the reviewer performs the final review
- orchestration may run final verification commands itself where appropriate

This new model must be reflected consistently in:

- specialist docs
- specialist prompt configs
- team definitions
- routing logic
- validation docs
- implementation plan references
- any other docs that still describe the old model

### 7. Specialist and team creation must move toward schema-driven specs

The project should introduce YAML templates and starter specs for specialists and teams so that future additions are authored through consistent structured inputs rather than freeform invention.

This does not require full code generation in this pass, but it does require:

- defining the canonical spec shape
- creating templates
- documenting that these specs are the future source-of-truth authoring mechanism

---

## Desired End State

After this design is implemented, the system should work like this:

1. the orchestrator or team router chooses a specialist
2. the router validates the incoming TaskPacket against that specialist's input contract
3. the specialist receives a constrained packet and a role-specific artifact template
4. the specialist fills out only the fields it owns
5. the specialist returns a machine-first artifact
6. the router validates the artifact directly against the specialist's output contract
7. the router stores the artifact, updates the team session artifact, and constructs the next TaskPacket from validated fields only
8. downstream specialists receive only the data their contracts declare
9. human-readable summaries remain optional, not canonical

---

## Artifact Model

## A. Router-Owned Team Session Artifact

Each team run should have a canonical session artifact owned by the router/runtime, not by specialists.

Recommended path shape:

- `artifacts/team-sessions/<team-session-id>/TEAM_SESSION.yaml`

This artifact should include at minimum:

- `schema_version`
- `team_id`
- `team_session_id`
- `task_id`
- `objective`
- `current_state`
- `current_owner_role`
- `status`
- `created_at`
- `updated_at`
- `task_packet_lineage`
- `artifact_refs`
- `state_history`
- `routing_notes`
- `final_result_ref` if complete

This artifact is system-owned.

Specialists may read it as context, but they must not directly edit it.

The router updates it after each validated transition.

## B. Specialist-Owned Output Artifacts

Each specialist invocation should produce one canonical machine artifact owned by that specialist role.

Recommended path shape:

- `artifacts/team-sessions/<team-session-id>/<step-seq>_<ROLE>_OUTPUT.yaml`

Examples:

- `001_PLANNER_OUTPUT.yaml`
- `002_BUILDER_OUTPUT.yaml`
- `003_TESTER_OUTPUT.yaml`
- `004_BUILDER_OUTPUT.yaml`
- `005_REVIEWER_OUTPUT.yaml`

Each artifact should contain at minimum:

- `schema_version`
- `specialist_id`
- `owner_role`
- `team_id` if applicable
- `team_session_id` if applicable
- `task_id`
- `input_packet_id`
- `output_artifact_id`
- `status`
- `editable_fields`
- `read_only_fields`
- `derived_from`
- `produced_at`
- specialist-specific typed payload fields

These artifacts are canonical machine-first forms used for validation and routing.

## C. Optional Human Summary Artifacts

The system may optionally produce human-readable summaries later, but these must be derived from the canonical machine artifacts and must not be treated as routing inputs.

---

## Why Not Use One Shared Mutable Specialist File

The project should explicitly reject a design where all specialists edit the same mutable file.

Reasons:

1. ownership becomes unclear
2. unauthorized edits become hard to detect
3. output validation becomes document-diff based instead of schema based
4. builder/tester loops become opaque
5. field-level routing becomes harder
6. structured artifact reuse becomes weaker

The hybrid model in this design provides the same continuity without sacrificing ownership.

---

## Packet Model

### 1. TaskPacket remains the bounded unit of work

Each specialist invocation must receive a TaskPacket representing the exact work for that specialist.

That packet should not be a freeform inheritance of all prior context.

It should be built by the router from validated artifacts according to the downstream input contract.

### 2. ResultPacket must preserve structured output

The system must stop reducing specialist outputs to only generic summaries and deliverables for core routing behavior.

The router/runtime must preserve the parsed, named, structured fields produced by the specialist and validate them directly.

The generic summary and deliverables may remain as convenience fields, but they must not be the only routing substrate.

### 3. The router constructs the next packet from validated fields only

This is required.

A downstream packet must never be built from:

- unvalidated narrative text
- untyped fallback deliverables alone
- assumptions about missing fields
- ad hoc role-specific hacks when a contract already exists

The router must use the validated artifact payload as the canonical source.

---

## Contract Model

## A. Input Contracts

Each specialist input contract must describe:

- field name
- type
- required vs optional
- source expectations
- semantic meaning
- whether the field is router-supplied, inherited, or user-supplied

Input contract validation must happen before specialist delegation.

## B. Output Contracts

Each specialist output contract must describe:

- field name
- type
- required vs optional
- ownership
- allowed value constraints if applicable
- whether the field is terminal, advisory, or transitional
- whether the field may be consumed by specific downstream roles

Output validation must happen against the actual structured artifact payload, not against synthetic `deliverable_0`-style placeholders.

This is a required fix.

## C. Ownership Metadata

Contracts must include explicit ownership metadata.

At minimum, the system must be able to determine:

- which role owns each field
- whether a field is writable by the current specialist
- whether a field is system-owned
- whether a field is derived and therefore read-only

## D. Status Semantics

The system must define consistent status semantics for specialist artifacts and routing.

At minimum:

- `success`
- `failure`
- `partial`
- `escalation`

must be supported where relevant.

Teams must explicitly define how `partial` is handled in each state.

A specialist producing structured but incomplete work should not silently break routing.

---

## Router Responsibilities

The router must become the central enforcement layer for teams.

For each specialist step, the router must:

1. validate the incoming TaskPacket against the specialist input contract
2. delegate work
3. parse the returned artifact
4. validate the artifact against the specialist output contract
5. verify field ownership and edit scope
6. persist the artifact
7. update the team session artifact
8. determine the next state based on validated status and transition rules
9. construct the next TaskPacket from validated fields only
10. forward only the context required by the downstream input contract

The router must be the only component that merges specialist artifacts into the team session record.

Specialists must not directly mutate team session state.

---

## Guardrails

## A. Editable Field Guardrails

Specialists must only be given writable templates for fields they own.

The runtime must reject artifacts that include unauthorized writable changes outside the specialist's allowed field set.

## B. Read-Only Field Guardrails

Read-only fields may appear for reference, but the specialist must not be allowed to change them in the canonical artifact payload.

## C. Router-Owned Fields

Fields like these should be system-owned and non-editable by specialists:

- packet ids
- session ids
- lineage
- routing state
- artifact refs
- timestamps managed by runtime
- transition metadata

## D. Schema Versioning

All canonical artifacts and specs must include schema versioning.

This protects future migrations and avoids silent format drift.

## E. Canonical Parsing

The runtime must parse the specialist's structured output into a typed canonical object before applying validation and routing.

This canonical object must be stored and accessible, not thrown away after extracting summary text.

---

## Tester and Build-Team Redesign

The repo must fully reconcile the build-team redesign so that all code and documentation agree on the same flow.

## New intended build-team flow

The intended default build-team flow should be:

1. planner
2. builder
3. tester
4. builder
5. reviewer
6. done

### Planner responsibilities

- define implementation plan
- specify constraints
- identify expected deliverables
- provide implementation steps or milestones

### First builder responsibilities

- implement code according to the plan
- report changed files and implementation notes
- identify unresolved issues if present

### Tester responsibilities

The tester is a test author.

The tester should:

- create or update tests that express the expected behavior
- specify the commands the builder should run
- identify expected pass conditions
- produce test-authoring artifacts, not merely a validation verdict

### Second builder responsibilities

The builder should:

- run the tester-authored tests
- fix the code until it satisfies those tests
- report final implementation adjustments
- report pass/fail outcomes from execution
- escalate if requirements cannot be satisfied

### Reviewer responsibilities

The reviewer should:

- inspect the final implementation
- assess code quality and alignment with requirements
- identify residual concerns
- approve or request further work

This redesign must replace older docs or code that still describe the tester as primarily a test runner.

---

## Specialist Artifact Expectations

The following are recommended conceptual payloads.

### Planner output artifact payload

Examples of owned fields:

- `plan_summary`
- `implementation_steps`
- `acceptance_criteria`
- `constraints`
- `expected_deliverables`
- `risk_notes`

### Builder output artifact payload

Examples of owned fields:

- `implementation_summary`
- `modified_files`
- `new_files`
- `build_notes`
- `known_limitations`
- `execution_notes`
- `test_execution_results` for the second builder pass

### Tester output artifact payload

Examples of owned fields:

- `test_strategy`
- `test_files_to_create`
- `test_files_to_modify`
- `test_cases_authored`
- `execution_commands`
- `expected_pass_conditions`
- `coverage_notes`

### Reviewer output artifact payload

Examples of owned fields:

- `review_summary`
- `approval_status`
- `findings`
- `required_followups`
- `quality_notes`

These are examples of the architectural pattern, not necessarily the final field names.

The actual field names should be standardized in the YAML specialist specs introduced by this design.

---

## Handling Partial Output

The repo has already exposed a real issue around `partial` status handling.

This design requires the following improvements:

1. every team state must explicitly define what happens on `partial`
2. partial structured artifacts must still be validated against their contract as far as possible
3. the router must be able to distinguish:
   - malformed output
   - incomplete but parseable output
   - valid advisory partial result
4. partial output must not default to an undefined transition path
5. the router must not lose typed fields simply because status is `partial`

For many specialist roles, `partial` should likely route to one of:

- retry same specialist
- escalate
- return to upstream builder/planner
- request human clarification

The exact transition semantics should be declared in team specs.

---

## YAML Source-of-Truth Specs

The project should introduce machine-readable YAML specs for specialists and teams.

These specs should become the long-term authoring source of truth from which implementation scaffolding can be derived.

## A. Specialist Spec Template

Recommended path shape:

- `specs/specialists/<specialist-id>.yaml`

Each specialist spec should include at minimum:

- `schema_version`
- `specialist_id`
- `display_name`
- `role`
- `purpose`
- `when_to_use`
- `boundaries`
- `allowed_actions`
- `input_contract`
- `output_contract`
- `status_semantics`
- `artifact_template`
- `editable_fields`
- `read_only_fields`
- `transition_notes`
- `prompt_requirements`
- `validation_requirements`

## B. Team Spec Template

Recommended path shape:

- `specs/teams/<team-id>.yaml`

Each team spec should include at minimum:

- `schema_version`
- `team_id`
- `display_name`
- `purpose`
- `members`
- `entry_contract`
- `state_machine`
- `state_to_specialist_mapping`
- `per_state_expected_artifact`
- `transition_rules`
- `partial_handling`
- `loop_limits`
- `exit_contract`
- `final_result_requirements`

## C. Required templates

This implementation should add at minimum:

- a specialist spec template
- a team spec template
- a build-team spec that reflects the new planner → builder → tester → builder → reviewer flow

These templates must be clear enough that a future "specialist build team" or "team build team" can consume them consistently.

---

## Implementation Requirements

## A. Preserve structured outputs end-to-end

The runtime must preserve the actual named structured specialist payload fields, not just summaries and deliverables.

## B. Validate actual named output fields

Output contracts must be validated against the parsed artifact payload directly.

The current kind of synthetic placeholder validation must be replaced.

## C. Build downstream context generically from validated artifacts

The downstream packet builder must become generic and schema-driven.

It should not depend on a growing list of ad hoc field-name special cases when the data already exists in the validated artifact payload.

## D. Reconcile tester docs, prompt config, and team definitions

Every repo file describing tester or build-team behavior must be audited and aligned to the new model.

## E. Introduce canonical machine-first artifact templates

Specialists should receive role-appropriate artifact templates that expose only the writable fields they own.

## F. Keep summaries optional and derived

Human-readable summaries may continue to exist, but they must be derived from the validated machine artifacts rather than serving as the main routing substrate.

---

## Documentation Changes Required

The implementation pass must update the repo truthfully and comprehensively.

At minimum, update:

- specialist definition docs
- team definition docs
- implementation plan references
- decision log if needed for new accepted details
- validation task docs that still assume the old tester flow
- any contract docs or architecture docs that currently describe generic deliverables as the primary routing substrate
- repo conventions or related docs if new spec directories or artifact directories are added

The repo must no longer contain contradictory explanations of how teams pass work between specialists.

---

## Validation Requirements

The implementing agent must validate at least the following scenarios.

### Scenario 1: Planner to builder handoff

- planner produces a structured artifact
- router validates it
- builder receives a TaskPacket created from validated planner fields only

### Scenario 2: Builder to tester handoff

- builder produces a structured artifact
- tester receives only the fields declared by tester input contract
- tester authors tests in a tester-owned artifact

### Scenario 3: Tester to builder return loop

- tester artifact is validated
- builder receives the tester-authored test instructions and files via a new TaskPacket
- builder updates implementation and reports execution results

### Scenario 4: Unauthorized field attempt

- a specialist attempts to populate or modify a field outside its allowed scope
- runtime rejects the artifact or marks it invalid

### Scenario 5: Partial structured output

- specialist returns a parseable but partial artifact
- router validates what is present
- team state machine follows the declared `partial` transition
- routing remains deterministic

### Scenario 6: Reviewer finalization

- reviewer receives the expected builder/tester outputs
- reviewer artifact is validated
- final result is composed from structured artifacts

### Scenario 7: Build-team flow consistency

- team definitions, specialist docs, and validation docs all reflect the same planner → builder → tester → builder → reviewer sequence

---

## Scope

### In scope

- contract tightening
- machine-first specialist artifacts
- router-owned team session artifact
- router-created downstream task packets from validated artifacts
- specialist/team YAML spec templates
- tester/build-team redesign reconciliation
- stronger ownership guardrails
- `partial` transition handling alignment

### Out of scope for this pass unless already straightforward

- full code generation from YAML specs
- polished human-facing artifact renderers
- broad UI/widget work
- repo-wide historical analytics
- multi-repo spec sharing infrastructure
- policy-file enforcement beyond what is necessary to support this design

These future directions may be mentioned, but they must not be presented as already implemented unless they truly are.

---

## Acceptance Criteria

This design is successfully implemented when all of the following are true:

1. specialists produce canonical machine-first artifacts
2. the router validates specialist artifacts directly against named output contract fields
3. structured outputs are preserved end-to-end
4. the router builds the next TaskPacket from validated artifact fields only
5. team runs use a router-owned session artifact rather than a specialist-edited shared document
6. specialists cannot validly write fields outside their allowed ownership scope
7. the tester is consistently modeled as a test author across code and docs
8. the build-team flow is consistently modeled as planner → builder → tester → builder → reviewer → done
9. team specs define `partial` handling explicitly
10. specialist and team YAML templates exist as future source-of-truth authoring specs
11. the repo contains no contradictory documentation about how specialists hand off work inside teams

---

## Suggested Implementation Sequence

1. audit the current specialist contract, packet, parser, and routing paths
2. introduce or finalize canonical machine-first specialist artifact structures
3. update result parsing to preserve structured payloads end-to-end
4. replace placeholder output validation with direct named-field validation
5. add router-owned team session artifact handling
6. update downstream packet construction to use validated artifact fields generically
7. define artifact ownership and edit-scope checks
8. reconcile tester/build-team flow in code and docs
9. add specialist and team YAML spec templates
10. validate the new flow with targeted scenarios
11. update durable documentation and report remaining gaps honestly

---

## Instructions for the Implementing Agent

Use this document as the source of truth for the implementation pass.

You should:

- implement the contract-and-artifact architecture directly in the repo
- preserve structured outputs instead of collapsing them to generic summaries
- make the router the canonical packet constructor between specialist steps
- treat machine-first persisted artifacts as canonical
- avoid shared mutable specialist-edited team documents
- enforce role ownership and edit scope
- reconcile the tester/build-team redesign everywhere
- add YAML templates/specs for future specialist and team authoring
- keep documentation truthful about what is implemented now versus what is still planned
- report changed files, validations performed, and any unresolved ambiguity

When this work is complete, the repo should support clear, validated, machine-first specialist collaboration with strong guardrails and deterministic packet routing.