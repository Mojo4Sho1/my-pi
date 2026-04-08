# T20_YAML_SPEC_LAYER_IMPLEMENTATION_PLAN.md

## Purpose

Decision-complete implementation brief for T-20.

The next fresh-context agent should use this file as the execution contract for T-20 and should not make naming, layout, or authority decisions beyond what is written here.

T-20 itself is the introduction of a durable `specs/` authoring layer plus the initial YAML schema/reference and starter templates. It does **not** add runtime YAML loading.

## Decisions Already Locked

- `docs/design/` remains proposal/design territory
- `specs/` becomes durable authoring/spec territory
- broad umbrella specs live directly under `specs/`
- structural schema references live in `specs/schemas/`
- YAML templates and concrete specs live in `specs/specialists/` and `specs/teams/`
- the durable YAML schema/spec reference is `specs/schemas/SPECIALIST_AND_TEAM_YAML_SPEC.md`
- that schema/spec file is a companion to `docs/design/CONTRACT-DRIVEN_SPECIALISTS_TEAM_ARTIFACTS_AND_PACKET_ROUTING_DESIGN.md`, not a replacement
- current runtime authority remains in TypeScript during T-20
- T-20 does not add runtime YAML loading
- YAML keys use `snake_case`
- YAML top-level keys are flat, with no `metadata:` wrapper
- nested YAML structures should mirror current runtime vocabulary where practical

## Files To Create

Create exactly these files:

- `specs/_SPECS_INDEX.md`
- `specs/schemas/SPECIALIST_AND_TEAM_YAML_SPEC.md`
- `specs/specialists/SPECIALIST_TEMPLATE.yaml`
- `specs/teams/TEAM_TEMPLATE.yaml`
- `specs/teams/build-team.yaml`

No additional spec files are required for T-20.

## Files To Update

Update exactly these files:

- `INDEX.md`
- `AGENTS.md`
- `docs/_DOCS_INDEX.md`
- `docs/REPO_CONVENTIONS.md` if needed for truthful routing
- `docs/handoff/CURRENT_STATUS.md`
- `docs/handoff/TASK_QUEUE.md`
- `docs/handoff/NEXT_TASK.md`
- `STATUS.md`

Do not move YAML-structure decisions into `docs/design/` as their primary home.

## Durable Schema Spec Requirements

`specs/schemas/SPECIALIST_AND_TEAM_YAML_SPEC.md` must use this exact section structure:

1. `# SPECIALIST_AND_TEAM_YAML_SPEC.md`
2. `## Purpose`
3. `## Authority And Relationship To Other Docs`
4. `## Specs Directory Layout`
5. `## YAML Authoring Conventions`
6. `## Specialist Spec V1`
7. `## Team Spec V1`
8. `## Starter Build-Team Spec Requirements`
9. `## Current Runtime Mapping`
10. `## Evolution Rules`

It must explicitly state:

- it is the durable concrete schema/spec reference for YAML authoring structure
- it is a companion to the Stage 5a.7 redesign doc
- the redesign doc remains the broad architectural source for Stage 5a.7
- the schema/spec doc owns the concrete YAML structure decisions
- YAML is not yet runtime authority
- when runtime and YAML differ, docs must remain truthful

### Specialist headings to lock

The schema/spec doc must define these exact specialist top-level headings:

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

It must define these nested structures:

- `when_to_use`
  - `activation_conditions`
  - `escalation_conditions`
- `boundaries`
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
- `boundaries.authority_flags`
  - `can_delegate`
  - `can_synthesize`
  - `can_update_handoff`
  - `can_update_workflow_docs`
  - `can_request_broader_context`
- `input_contract.fields`
- `output_contract.fields`
- each contract field
  - `name`
  - `type`
  - `required`
  - `description`
  - `source_specialist` only for input fields
- `status_semantics`
  - `success`
  - `partial`
  - `failure`
  - `escalation`
- `artifact_template`
  - `artifact_type`
  - `summary_guidance`
  - `fields`
- each artifact field
  - `name`
  - `type`
  - `required`
  - `description`
- `prompt_requirements`
  - `role_description`
  - `working_style`
  - `constraints`
  - `anti_patterns`
- `prompt_requirements.working_style`
  - `reasoning`
  - `communication`
  - `risk`
  - `default_bias`
- `validation_requirements`
  - `contract_rules`
  - `adequacy_checks`

### Team headings to lock

The schema/spec doc must define these exact team top-level headings:

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

It must define these nested structures:

- `entry_contract.fields`
- `exit_contract.fields`
- each contract field
  - `name`
  - `type`
  - `required`
  - `description`
- `state_machine`
  - `start_state`
  - `terminal_states`
  - `states`
- each `state_machine.states.<state>`
  - `transitions`
- each transition
  - `on`
  - `to`
  - `max_iterations` optional
- `state_to_specialist_mapping`
  - state name to specialist id or `orchestrator`
- `per_state_expected_artifact`
  - state name to artifact expectations
- each `per_state_expected_artifact.<state>`
  - `consumes`
  - `produces`
  - `editable_fields`
  - `read_only_fields`
- `transition_rules`
  - state name with explicit notes for `success`, `partial`, `failure`, `escalation`
- `partial_handling`
  - state name to explicit `on_partial` behavior
- `loop_limits`
  - list entries with `from`, `to`, `on`, `max_iterations`
- `final_result_requirements`
  - `required_fields`
  - `derived_from_states`
  - `success_condition`

## YAML Template Requirements

Require:

- `specs/specialists/SPECIALIST_TEMPLATE.yaml` to use the exact specialist headings and nested structure above
- `specs/teams/TEAM_TEMPLATE.yaml` to use the exact team headings and nested structure above
- both templates should be reusable and illustrative, not empty shells
- both templates should include placeholder/example values that make the intended structure obvious
- templates must stay truthful about being authoring templates, not active runtime loaders

## Starter Build-Team Spec Requirements

`specs/teams/build-team.yaml` must be concrete and aligned to the current runtime flow.

It must use these exact states:

- `planning`
- `building`
- `testing`
- `rebuilding`
- `review`
- `done`
- `failed`

It must use this exact state-to-specialist mapping:

- `planning: specialist_planner`
- `building: specialist_builder`
- `testing: specialist_tester`
- `rebuilding: specialist_builder`
- `review: specialist_reviewer`
- `done: orchestrator`
- `failed: orchestrator`

It must encode these exact transitions:

- `planning`
  - `success -> building`
  - `partial -> failed`
  - `failure -> failed`
  - `escalation -> failed`
- `building`
  - `success -> testing`
  - `partial -> planning` with `max_iterations: 2`
  - `failure -> planning` with `max_iterations: 2`
  - `escalation -> failed`
- `testing`
  - `success -> rebuilding`
  - `partial -> rebuilding` with `max_iterations: 2`
  - `failure -> rebuilding` with `max_iterations: 2`
  - `escalation -> failed`
- `rebuilding`
  - `success -> review`
  - `partial -> rebuilding` with `max_iterations: 2`
  - `failure -> rebuilding` with `max_iterations: 2`
  - `escalation -> failed`
- `review`
  - `success -> done`
  - `partial -> rebuilding` with `max_iterations: 2`
  - `failure -> rebuilding` with `max_iterations: 2`
  - `escalation -> failed`

It must make these semantics explicit:

- `testing` is tester-authorship, not generic validation-running
- `rebuilding` is the second builder verification/fix pass
- `review` happens after tester-authored artifacts and the post-tester builder pass
- `build-team.yaml` is a future authoring/source-of-truth spec, not current runtime authority

It must also align artifact expectations at a high level:

- `planning` centered on `steps`, `dependencies`, `risks`
- `building` centered on `modifiedFiles`, `changeDescription`
- `testing` centered on `testStrategy`, `testCasesAuthored`, `executionCommands`, `expectedPassConditions`, `coverageNotes`
- `rebuilding` centered on `modifiedFiles`, `changeDescription`, `testExecutionResults`
- `review` centered on `verdict`, `findings`, `summary`

## Documentation Requirements

Update docs so a fresh agent can discover the new `specs/` layer naturally.

Minimum documentation updates:

- `INDEX.md`
  - mention `specs/` in the top-level repo structure
- `AGENTS.md`
  - add `specs/` to the repo/package structure truthfully
- `docs/_DOCS_INDEX.md`
  - mention the new specs area as the durable authoring/spec route when relevant
- `docs/handoff/NEXT_TASK.md`
  - replace T-20 after completion and reference the new schema/spec doc while T-20 is active
- `docs/handoff/CURRENT_STATUS.md`
  - describe the landed `specs/` structure and schema/spec reference
- `docs/handoff/TASK_QUEUE.md`
  - mark T-20 done and promote T-21
- `STATUS.md`
  - update Stage 5a.7 progress bullets truthfully

Do not describe runtime YAML loading as implemented.

## Verification Requirements

Follow these defaults:

- if the change is doc/YAML-only, runtime tests are optional
- if any code or typed tests are touched, run `make typecheck`
- if any code or tests are touched, run `make test`

Required acceptance checks:

- `specs/_SPECS_INDEX.md` exists and routes the new spec tree clearly
- the schema/spec doc exists and matches the locked decisions
- both YAML templates match the schema/spec doc exactly
- `build-team.yaml` matches the canonical runtime flow already implemented
- touched docs remain truthful about proposal docs vs durable specs vs runtime authority

## Done Criteria

T-20 is done only when all of the following are true:

- the handoff implementation brief exists in `docs/handoff/T20_YAML_SPEC_LAYER_IMPLEMENTATION_PLAN.md`
- the new `specs/` tree exists with the five required files
- `specs/schemas/SPECIALIST_AND_TEAM_YAML_SPEC.md` contains the locked schema decisions
- the two template YAML files match that schema
- `specs/teams/build-team.yaml` matches the canonical reconciled build-team flow
- repo routing/handoff/status docs all point agents to the new durable `specs/` layer truthfully
- T-21 is promoted as the next queued/active follow-on in handoff docs

