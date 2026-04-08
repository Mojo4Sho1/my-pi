# SPECIALIST_AND_TEAM_YAML_SPEC.md

## Purpose

This document is the durable concrete schema/spec reference for YAML authoring structure under `specs/`.

It defines the initial V1 authoring shape for specialist specs and team specs introduced during Stage 5a.7.

## Authority And Relationship To Other Docs

- This file is the durable concrete schema/spec reference for YAML authoring structure.
- It is a companion to `docs/archive/design/CONTRACT-DRIVEN_SPECIALISTS_TEAM_ARTIFACTS_AND_PACKET_ROUTING_DESIGN.md`.
- The Stage 5a.7 redesign doc remains the broad architectural source for the contract/artifact redesign.
- This schema/spec doc owns the concrete YAML structure decisions for the `specs/` tree.
- YAML is not yet runtime authority.
- Current runtime authority remains in TypeScript until runtime YAML loading is implemented.
- When runtime and YAML differ, docs must remain truthful about that gap rather than pretending YAML is already loaded at runtime.

## Specs Directory Layout

- `specs/_SPECS_INDEX.md` routes the durable authoring/spec tree.
- `specs/schemas/` stores durable structure references such as this file.
- `specs/specialists/` stores specialist authoring templates and future concrete specialist specs.
- `specs/teams/` stores team authoring templates and future concrete team specs.

## YAML Authoring Conventions

- YAML keys use `snake_case`.
- Top-level keys stay flat; do not introduce a `metadata:` wrapper.
- Nested structures should mirror current runtime vocabulary where practical.
- Templates may use YAML comments to clarify authoring intent, but comments do not change schema shape.
- Reusable templates should be illustrative rather than empty shells.
- Concrete specs should describe future authoring/source-of-truth intent without claiming current runtime loading exists.

## Specialist Spec V1

Specialist YAML specs use these exact top-level headings:

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

`when_to_use` contains:

- `activation_conditions`
- `escalation_conditions`

`boundaries` contains:

- `scope`
- `non_goals`
- `routing_class`
- `context_scope`
- `default_read_set`
- `forbidden_by_default`
- `task_boundary`
- `deliverable_boundary`
- `failure_boundary`
- `authority_flags`

`boundaries.authority_flags` contains:

- `can_delegate`
- `can_synthesize`
- `can_update_handoff`
- `can_update_workflow_docs`
- `can_request_broader_context`

`input_contract.fields` and `output_contract.fields` are lists of field definitions.

Each contract field uses:

- `name`
- `type`
- `required`
- `description`
- `source_specialist` only for input fields

`status_semantics` contains:

- `success`
- `partial`
- `failure`
- `escalation`

`artifact_template` contains:

- `artifact_type`
- `summary_guidance`
- `fields`

Each artifact field uses:

- `name`
- `type`
- `required`
- `description`

`prompt_requirements` contains:

- `role_description`
- `working_style`
- `constraints`
- `anti_patterns`

`prompt_requirements.working_style` contains:

- `reasoning`
- `communication`
- `risk`
- `default_bias`

`validation_requirements` contains:

- `contract_rules`
- `adequacy_checks`

## Team Spec V1

Team YAML specs use these exact top-level headings:

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

`entry_contract.fields` and `exit_contract.fields` are lists of field definitions.

Each contract field uses:

- `name`
- `type`
- `required`
- `description`

`state_machine` contains:

- `start_state`
- `terminal_states`
- `states`

Each `state_machine.states.<state>` contains:

- `transitions`

Each transition uses:

- `on`
- `to`
- `max_iterations` optional

`state_to_specialist_mapping` maps a state name to a specialist id or `orchestrator`.

`per_state_expected_artifact` maps a state name to artifact expectations.

Each `per_state_expected_artifact.<state>` contains:

- `consumes`
- `produces`
- `editable_fields`
- `read_only_fields`

`transition_rules` contains explicit notes for each state's `success`, `partial`, `failure`, and `escalation` handling.

`partial_handling` maps each relevant state to explicit `on_partial` behavior.

`loop_limits` is a list of entries using:

- `from`
- `to`
- `on`
- `max_iterations`

`final_result_requirements` contains:

- `required_fields`
- `derived_from_states`
- `success_condition`

## Starter Build-Team Spec Requirements

The starter `specs/teams/build-team.yaml` must stay aligned to the current canonical runtime flow:

- `planning`
- `building`
- `testing`
- `rebuilding`
- `review`
- `done`
- `failed`

Its state-to-specialist mapping is:

- `planning: specialist_planner`
- `building: specialist_builder`
- `testing: specialist_tester`
- `rebuilding: specialist_builder`
- `review: specialist_reviewer`
- `done: orchestrator`
- `failed: orchestrator`

Its transitions are:

- `planning`: `success -> building`, `partial -> failed`, `failure -> failed`, `escalation -> failed`
- `building`: `success -> testing`, `partial -> planning`, `failure -> planning`, `escalation -> failed`
- `testing`: `success -> rebuilding`, `partial -> rebuilding`, `failure -> rebuilding`, `escalation -> failed`
- `rebuilding`: `success -> review`, `partial -> rebuilding`, `failure -> rebuilding`, `escalation -> failed`
- `review`: `success -> done`, `partial -> rebuilding`, `failure -> rebuilding`, `escalation -> failed`

Where loop limits apply, `max_iterations: 2` is used.

The starter spec must also make these semantics explicit:

- `testing` is tester-authorship, not generic validation-running
- `rebuilding` is the second builder verification/fix pass
- `review` happens after tester-authored artifacts and the post-tester builder pass
- `build-team.yaml` is a future authoring/source-of-truth spec, not current runtime authority

The high-level artifact expectations are:

- `planning` centered on `steps`, `dependencies`, `risks`
- `building` centered on `modifiedFiles`, `changeDescription`
- `testing` centered on `testStrategy`, `testCasesAuthored`, `executionCommands`, `expectedPassConditions`, `coverageNotes`
- `rebuilding` centered on `modifiedFiles`, `changeDescription`, `testExecutionResults`
- `review` centered on `verdict`, `findings`, `summary`

## Current Runtime Mapping

Until runtime YAML loading exists, the active runtime mapping remains in TypeScript:

- specialist contracts and prompt behavior live in `extensions/specialists/*/prompt.ts`
- team runtime authority for `build-team` lives in `extensions/teams/definitions.ts`
- packet and contract validation live in `extensions/shared/packets.ts` and `extensions/shared/contracts.ts`

The initial YAML structures mirror the current runtime vocabulary as closely as practical:

- planner output currently centers on `steps`, `dependencies`, `risks`
- builder output currently centers on `modifiedFiles`, `changeDescription`, and optional `testExecutionResults`
- tester output currently centers on `testStrategy`, `testCasesAuthored`, `executionCommands`, `expectedPassConditions`, `coverageNotes`
- reviewer output currently centers on `verdict`, `findings`, `summary`
- the canonical team flow is `planner -> builder -> tester -> builder -> reviewer -> done`

If TypeScript runtime behavior changes before YAML loading exists, this schema/spec doc and any concrete YAML specs should be updated so the repo stays truthful about which layer currently governs execution.

## Evolution Rules

- Keep this file as the durable owner of concrete YAML structure decisions.
- Keep architectural rationale in the redesign doc rather than duplicating that material here.
- Prefer additive versioning when expanding the YAML shape.
- Do not introduce runtime-loading claims until the repo actually implements them.
- When a new concrete spec is added, confirm it follows these headings and conventions before treating it as durable authoring input.
