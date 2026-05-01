# SPECIALIST_AND_TEAM_YAML_SPEC.md

## Purpose

This document is the durable concrete schema/spec reference for YAML authoring structure under `specs/`.

It defines the V2 authoring shape for specialist specs, team specs, context bundles, contract layers, output template references, invocation addenda, and effective-contract assembly. V2 extends the V1 authoring shape introduced during Stage 5a.7 and the optional V1.1 onboarding metadata extension introduced during onboarding Stage 4.

## Authority And Relationship To Other Docs

- This file is the durable concrete schema/spec reference for YAML authoring structure.
- It is a companion to `docs/archive/design/CONTRACT-DRIVEN_SPECIALISTS_TEAM_ARTIFACTS_AND_PACKET_ROUTING_DESIGN.md`.
- The Stage 5a.7 redesign doc remains the broad architectural source for the contract/artifact redesign.
- This schema/spec doc owns the concrete YAML structure decisions for the `specs/` tree.
- Structured YAML under `specs/specialists/` and `specs/teams/` is the future authoring authority for taxonomy and routing metadata.
- YAML is not yet runtime-loaded.
- Current runtime behavior remains in TypeScript until runtime YAML loading or mirroring is implemented.
- When runtime and YAML differ, docs must remain truthful about that gap rather than pretending YAML is already loaded at runtime.

## Specs Directory Layout

- `specs/_SPECS_INDEX.md` routes the durable authoring/spec tree.
- `specs/schemas/` stores durable structure references such as this file.
- `specs/specialists/` stores specialist authoring templates, examples, and future concrete specialist specs.
- `specs/teams/` stores team authoring templates, examples, and future concrete team specs.
- `specs/context/` stores context-bundle templates and examples.
- `specs/contracts/` stores committed contract layers that do not have a natural host elsewhere.
- `specs/templates/` stores reusable output templates addressed by stable template id.
- `specs/examples/` stores clearly marked examples, including effective-contract examples. Generated effective contracts are not committed by default.

## YAML Authoring Conventions

- YAML keys use `snake_case`.
- Top-level keys stay flat; do not introduce a `metadata:` wrapper.
- Nested structures should mirror current runtime vocabulary where practical.
- Templates may use YAML comments to clarify authoring intent, but comments do not change schema shape.
- Reusable templates should be illustrative rather than empty shells.
- Concrete specs should describe future authoring/source-of-truth intent without claiming current runtime loading exists.
- `onboarding` fields are declarative metadata for future context construction; they do not trigger automated loading in the current runtime.
- Stable identifiers should be kebab-case where they name specialists, teams, templates, contract layers, or context bundles.
- Runtime-facing field names may preserve existing camelCase names when they mirror current TypeScript packet/result fields.

## V2 Field Glossary

`schema_version`

- Type: `string`
- Required: yes
- Description: Schema version for the artifact. V2 artifacts use `"v2"`; V1/V1.1 files remain historical inputs until migrated.

`artifact_kind`

- Type: `string`
- Required: yes for new V2 artifact surfaces
- Description: Machine-readable artifact family, such as `specialist_definition`, `team_definition`, `context_bundle`, `output_template`, or `effective_contract_example`.

`specialist_id`

- Type: `string`
- Required: specialist definitions
- Description: Current runtime-facing specialist identifier until alias migration is complete.

`team_id`

- Type: `string`
- Required: team definitions
- Description: Stable team identifier.

`canonical_name`

- Type: `string`
- Required: specialist definitions and renamed teams
- Description: Final taxonomy name to prefer in new documentation and team definitions.

`current_runtime_id`

- Type: `string`
- Required: specialist definitions until runtime migration completes
- Description: Identifier currently used by TypeScript routing.

`base_class`

- Type: `Planner | Scribe | Builder | Reviewer | null`
- Required: specialist definitions
- Description: Canonical base class. `null` is allowed only for explicitly out-of-taxonomy utilities.

`variant`

- Type: `string | null`
- Required: specialist definitions
- Description: Canonical variant name. Generic base specialists use `null`; specialized variants use base-class-prefixed kebab-case names such as `builder-test`.

`artifact_responsibility`

- Type: object with `primary` and optional `excluded`
- Required: specialist definitions
- Description: Artifact families the specialist owns and explicitly does not own.

`aliases`

- Type: list of alias lifecycle entries
- Required: specialist definitions; use `[]` when none exist
- Description: Compatibility names governed by D-D1.

`migration_status`

- Type: `active | transitional | proposed | blocked-for-new-use | out-of-taxonomy | deprecated | removed`
- Required: specialist and team definitions during taxonomy migration
- Description: Current migration state of the artifact or identifier.

`lifecycle_state`

- Type: `active | deprecated | blocked-for-new-use | removal-candidate | removed`
- Required: each alias entry
- Description: D-D1 alias lifecycle state.

`cleanup_condition`

- Type: `string`
- Required: deprecated aliases and transitional artifacts
- Description: Explicit condition required before advancing the alias or migration state.

`presentation_order`

- Type: list of context section ids
- Required: context bundles and effective-contract examples
- Description: Order in which context is presented to the specialist.

`authority_order`

- Type: list of context section ids
- Required: context bundles and effective-contract examples
- Description: Conflict-resolution priority. Authority order overrides presentation order on conflict.

`contract_layers`

- Type: list of contract-layer references
- Required: context bundles and effective-contract examples
- Description: Ordered source layers used to assemble the effective contract.

`artifact_template`

- Type: output-template reference block
- Required: specialist definitions
- Description: Stable reference to the output template the specialist must satisfy.

`effective_contract`

- Type: object
- Required: effective-contract examples only
- Description: Assembled per-invocation contract delivered through the task packet. Generated effective contracts are not committed by default.

## Required And Optional Field Rules

- Required fields must be present and non-empty unless their type explicitly allows `null`.
- Optional fields may be omitted. If present, they must satisfy the declared type.
- Lists that are required but intentionally empty should be written as `[]`.
- `base_class: null` is valid only for explicitly out-of-taxonomy utilities and must pair with a migration status explaining why.
- `variant: null` is valid only for generic base specialists.
- Deprecated aliases must include `name`, `canonical_target`, `reason`, `lifecycle_state`, and `cleanup_condition`.
- New team definitions must use canonical specialist names unless they are explicitly documenting compatibility with current runtime ids.
- Runtime-current identifiers must remain truthful until T-30 or later migrates TypeScript metadata.

## Specialist Spec V2

Specialist YAML specs use these exact top-level headings:

- `schema_version`
- `artifact_kind`
- `specialist_id`
- `canonical_name`
- `current_runtime_id`
- `display_name`
- `role`
- `base_class`
- `variant`
- `artifact_responsibility`
- `aliases`
- `migration_status`
- `migration_notes`
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
- optional `onboarding` (V1.1 extension)
- optional `variant_contract`

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

- `template_id`
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
- `taxonomy_rules`
- `alias_lifecycle_rules`

`aliases` is a list. Each alias entry contains:

- `name`
- `canonical_target`
- `reason`
- `lifecycle_state`
- `cleanup_condition`

`variant_contract`, when present, contains:

- `inherits`
- `constraints`
- `output_template_refs`

Validation expectations:

- `base_class` must be one of the canonical base classes or `null` for out-of-taxonomy utilities.
- Non-null `variant` should be base-class-prefixed kebab-case.
- `canonical_name` must match `variant` for variants and the base specialist id for generic base specialists.
- Deprecated aliases must follow the D-D1 lifecycle.
- `artifact_template.template_id` must resolve to a committed file under `specs/templates/`.
- Contract fields must have stable names, types, required flags, and descriptions.

If present, `onboarding` contains:

- `profile`
- `layer1_conventions`
- `layer3_refs`
- `notes`

## Team Spec V2

Team YAML specs use these exact top-level headings:

- `schema_version`
- `artifact_kind`
- `team_id`
- `canonical_name`
- `current_runtime_id`
- `display_name`
- `migration_status`
- `migration_notes`
- `purpose`
- `members`
- `aliases`
- `entry_contract`
- `state_machine`
- `state_to_specialist_mapping`
- `per_state_expected_artifact`
- `transition_rules`
- `partial_handling`
- `loop_limits`
- `exit_contract`
- `final_result_requirements`
- optional `onboarding` (V1.1 extension)

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

- `type` optional
- `target` optional
- `transitions`

Each transition uses:

- `on`
- `to`
- `max_iterations` optional
- `condition` optional

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

Validation expectations:

- `state_machine.start_state` must exist in `state_machine.states`.
- Every terminal state must exist and have no required outgoing transitions.
- Every non-terminal state must define explicit handling for `success`, `partial`, `failure`, and `escalation`, either in transitions or transition rules.
- Every non-terminal state target must resolve to a team member, nested team, or `orchestrator`.
- Loop transitions must include bounded `max_iterations`.
- `state_to_specialist_mapping` may remain as a compatibility view, but `state_machine.states.<state>.target` is the preferred state-machine-ready V2 shape.
- New team specs should use canonical specialist names and may include current runtime ids in migration notes where needed.

If present, `onboarding` contains:

- `profile`
- `layer3_refs`
- `team_state_context`
- `upstream_artifacts`

## Context Bundle V2

Context bundles describe the per-task context package delivered with a task packet. They are distinct from `specs/onboarding/` manifests, which describe static startup context profiles.

Context bundle YAML uses these top-level headings:

- `schema_version`
- `artifact_kind`
- `context_bundle_id`
- `description`
- `target`
- `presentation_order`
- `authority_order`
- `sections`
- `contract_layers`
- `validation_requirements`

`target` contains:

- `specialist_id` optional
- `team_id` optional
- `state` optional

Each `sections.<section_id>` contains:

- `source`
- `required`
- `description`

Each `contract_layers` entry contains:

- `layer`
- `source`
- `required`

Validation expectations:

- `presentation_order` and `authority_order` must reference declared section ids.
- Required sections must either have a concrete source or be provided by the task packet at invocation time.
- Authority order is the conflict-resolution order and must be applied even when presentation order differs.
- Context bundles must not claim to be active runtime loading until a later runtime task implements assembly.

## Contract Layer Model V2

The effective contract is assembled from modular source layers. Layer ordering for presentation follows D-O7:

1. base specialist context
2. variant context
3. global repository rules
4. assembled specialist contract
5. orchestrator task packet
6. task-specific context
7. upstream artifacts and evidence
8. output template

Authority order for conflicts:

1. task packet and explicit invocation addendum
2. repository contract
3. universal contract
4. team/node contract
5. variant contract
6. base-class contract
7. output template
8. upstream artifacts and evidence

Contract layers:

- Universal specialist contract: committed at `specs/contracts/universal.md`.
- Repository contract: committed at `specs/contracts/repository.md`.
- Base-class contract: derived from `agents/SPECIALIST_TAXONOMY_AND_CONTEXT_MODEL.md`.
- Variant contract: declared in the relevant specialist YAML.
- Team/node contract: derived from team YAML state, transition, artifact, partial, and loop fields.
- Invocation addendum: generated per task and delivered in the packet; not committed by default.
- Output template reference: committed under `specs/templates/` and referenced by stable id.

Validation expectations:

- Lower layers may narrow higher layers but must not contradict them.
- Contract references should use stable ids before file paths when possible.
- Source contract files are committed; generated effective contracts are not committed by default.

## Invocation Addendum V2

Invocation addenda are small per-task constraints assembled by the orchestrator and delivered in the task packet. They are not committed as normal repository artifacts.

Invocation addendum shape:

- `schema_version`
- `artifact_kind: invocation_addendum`
- `invocation_id`
- `target`
- `task_objective`
- `allowed_read_set`
- `allowed_write_set`
- `required_outputs`
- `temporary_constraints`
- `deadline_or_budget` optional
- `validation_requirements`

Validation expectations:

- `allowed_write_set` must be empty for read-only specialists.
- Temporary constraints may narrow but not broaden repository or universal contract rules.
- Required outputs must be satisfiable by the target specialist's output contract and output template.

## Output Template References V2

Specialist YAML uses `artifact_template.template_id` to reference committed output templates under `specs/templates/`.

Output template files use these top-level headings:

- `schema_version`
- `artifact_kind: output_template`
- `template_id`
- `artifact_type`
- `description`
- `required_fields`
- `optional_fields`
- `format_rules`
- `validation_expectations`

Validation expectations:

- `template_id` must be unique.
- Required fields must match or be a subset of the specialist output contract.
- Template field names should align with current runtime field names when they represent packet/result fields.

## Effective Contract Assembly V2

The orchestrator assembles effective contracts before delegation and delivers them through the task packet. Specialists consume the assembled contract; they do not reassemble source layers.

Assembled effective contract shape:

- `schema_version`
- `artifact_kind: effective_contract_example` for committed examples, `effective_contract` for generated per-task artifacts
- `generated: true`
- `example: true` only for committed examples
- `target`
- `presentation_order`
- `authority_order`
- `resolved_layers`
- `effective_contract`
- `validation_expectations`

`effective_contract` contains:

- `role`
- `scope`
- `allowed_actions`
- `required_inputs`
- `required_outputs`
- `write_authority`
- `conflict_resolution`
- `output_template_ref`

Validation expectations:

- Generated effective contracts are not committed by default.
- Committed effective contracts must be under `specs/examples/` and clearly marked with `example: true`.
- The assembler must preserve provenance for every resolved layer once implementation exists.

## Schema V2 Open Questions

- Should V3 use formal JSON Schema files in addition to this Markdown reference?
- Should canonical specialist YAML for every existing specialist be generated in one migration task or incrementally as runtime metadata is mirrored?
- Should context bundles be authored per specialist, per team state, or both?
- Should output templates be Markdown-only, YAML-only, or paired Markdown/YAML artifacts once automated validation begins?
- Should state-machine `target` supersede `state_to_specialist_mapping` entirely after runtime migration?

## Onboarding Metadata (V1.1)

The `onboarding` section is optional for both specialist and team specs.

- Existing V1 specs remain valid without an `onboarding` block.
- When omitted, specs use project defaults and task-local routing instead of spec-declared onboarding hints.
- These fields are declarative metadata for orchestrator context construction and documentation.
- They do not mean runtime YAML loading or automated onboarding bundle assembly already exists.

### Shared onboarding reference entries

`onboarding.layer1_conventions` and `onboarding.layer3_refs` use the same entry shape when present.

Each reference entry contains:

- `path`
- `section` optional
- `reason`

### Specialist onboarding fields

`onboarding.profile`

- Type: `string`
- Optional: yes
- Description: Manifest id or manifest path reference for the specialist's default onboarding profile.
- Default behavior when omitted: follow the current project-default specialist onboarding behavior, equivalent to `specialist-default`.

`onboarding.layer1_conventions`

- Type: `OnboardingReference[]`
- Optional: yes
- Description: Narrower-than-default repo routing or conventions references relevant to this specialist's normal work.

`onboarding.layer3_refs`

- Type: `OnboardingReference[]`
- Optional: yes
- Description: Stable reference docs or sections relevant to this specialist's typical task family.

`onboarding.notes`

- Type: `string`
- Optional: yes
- Description: Free-text onboarding notes for the orchestrator or future bundle builder.

### Team onboarding fields

`onboarding.profile`

- Type: `string`
- Optional: yes
- Description: Manifest id or manifest path reference for the team's onboarding profile.
- Default behavior when omitted: use the current project defaults plus the team's declared entry contract and routing shape.

`onboarding.layer3_refs`

- Type: `OnboardingReference[]`
- Optional: yes
- Description: Stable reference docs or sections that help the orchestrator package context for this team's normal task family.

`onboarding.team_state_context`

- Type: `string[]`
- Optional: yes
- Description: Named team-state context items the orchestrator should package for specialists when this team is active.

`onboarding.upstream_artifacts`

- Type: `string[]`
- Optional: yes
- Description: Upstream artifact types this team commonly consumes at team entry.
- Use `[]` when the team normally starts from the entry contract rather than prior artifacts.

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
