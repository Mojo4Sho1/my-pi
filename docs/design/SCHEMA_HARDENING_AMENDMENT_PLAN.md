# Schema Hardening Amendment Plan

## Purpose

This document defines a focused schema-hardening amendment for the specialist taxonomy migration campaign.

The repository already completed the Stage 3.5 YAML schema/template checkpoint. A later review found several issues that should be corrected before Stage 4 runtime/type metadata migration continues. These issues do not require redesigning the taxonomy, but they do affect whether runtime metadata can safely mirror the schema without implementation agents inventing missing semantics.

This amendment inserts a new Stage 3.6 between the completed Stage 3.5 checkpoint and the Stage 4 runtime/type metadata migration.

## Summary

Add the following staged work before resuming T-30:

```text
T-29b — Stage 3.6: Schema Hardening Plan Assimilation
T-29c — Stage 3.6: Schema/Template Hardening Implementation
T-29d — Stage 3.6: Concrete Specialist YAML Readiness
T-30  — Stage 4: Runtime/type metadata migration
```

T-29b is documentation-assimilation only.

T-29c hardens schema/spec/template files under `specs/`.

T-29d adds or updates concrete specialist YAML definitions needed by T-30.

T-30 resumes only after the schema hardening work needed for runtime mirroring is complete.

## Background

The current migration campaign has already established the following canonical architecture:

- Four first-class base specialist classes:
  - Planner
  - Scribe
  - Builder
  - Reviewer
- Default everyday team:
  - `planner -> builder -> reviewer`
- Full design-to-build team:
  - `planner -> scribe -> builder -> reviewer`
- `builder` remains the generic base implementation specialist.
- `builder-test` is the canonical Builder variant for authoring or revising executable test artifacts.
- `tester` is transitional/deprecated and should migrate alias-first to `builder-test`.
- Team definitions should evolve toward state-machine definitions.
- Stable source contracts should be committed, while generated per-task effective contracts should not be committed by default.
- YAML schemas/templates under `specs/` are the correct home for schema/template artifacts.
- Runtime TypeScript metadata should mirror or consume the YAML/documentation metadata rather than redefining it independently.

The current Stage 3.5 schema is directionally correct, but several details remain too ambiguous for safe runtime mirroring:

1. Context `presentation_order` and `authority_order` conflate context section ids with contract-layer ids.
2. Authority precedence can be misread as allowing task packets to override repository-level constraints.
3. The YAML taxonomy shape does not cleanly project into the intended TypeScript `taxonomy` object.
4. Specialist identity surfaces are ambiguous across canonical ids, runtime ids, config ids, extension directories, and delegate tools.
5. Alias lifecycle entries lack an explicit next advancement condition.
6. `migration_status` conflates definition status, taxonomy status, runtime migration state, and alias state.
7. Team state targets are currently scalar strings, which makes future nested teams or parallel states harder to represent.
8. `state_to_specialist_mapping` duplicates state target information and can drift.
9. Output template schema expectations do not match the current Markdown template files.
10. Committed effective-contract examples use wording that can be confused with actual generated artifacts.
11. Concrete specialist YAML files are not yet clearly distinguished from examples/templates.
12. Pi-native resources and project-native schema artifacts need an explicit boundary.

This amendment resolves those issues before implementation agents continue runtime migration.

## Scope

This plan covers:

- Campaign/task queue updates.
- Schema-hardening decisions.
- Schema/spec/template documentation changes.
- Concrete specialist YAML readiness for specialists directly needed by T-30.
- Acceptance criteria for staged implementation.
- Guardrails for Codex or other implementation agents.

## Non-goals

Stage 3.6 must not perform the following unless a later task explicitly authorizes it:

- No runtime TypeScript changes during T-29b or T-29c.
- No YAML runtime loading.
- No router/team runtime migration.
- No validation enforcement.
- No generated effective contracts committed to the repo.
- No broad file renames.
- No alias cleanup/removal.
- No activation of proposed aliases unrelated to T-30.
- No promotion of `reviewer-validation`.
- No promotion of `doc-formatter` into the canonical taxonomy.
- No redesign of the base taxonomy.
- No move of schema artifacts out of `specs/`.

## Stage and Version Naming

Use the following naming:

```text
Campaign stage: Stage 3.6
Schema revision: v2.1
Task family: T-29b / T-29c / T-29d
```

Stage 3.6 is a schema-hardening amendment, not a new taxonomy design phase.

Schema v2.1 hardens and clarifies v2. It supersedes conflicting v2 wording but does not introduce runtime YAML loading.

Reserve v3 for a later, larger formalization step, such as JSON Schema sidecars, runtime YAML loading, or enforced validation.

## Task Insertion Plan

### Current interpretation

The current campaign says:

```text
T-29 — done
T-30 — active
T-31 — blocked
T-32 — blocked
T-33 — blocked
T-34 — blocked
```

After this amendment is assimilated, the queue should become:

```text
T-29  — done
T-29b — active
T-29c — blocked on T-29b
T-29d — blocked on T-29c
T-30  — blocked on T-29c and, where applicable, T-29d
T-31  — blocked on T-30
T-32  — blocked on T-30/T-31
T-33  — blocked on T-32
T-34  — blocked on T-33
```

T-30 is still the correct next runtime task. It is temporarily blocked because runtime metadata should not mirror a schema with known ambiguity.

## T-29b — Stage 3.6: Schema Hardening Plan Assimilation

### Goal

Assimilate this plan into the repository’s durable campaign documentation so future agents with no chat context can follow the new task ordering.

### Task type

Documentation and campaign planning only.

### Files likely touched

```text
docs/design/SCHEMA_HARDENING_AMENDMENT_PLAN.md
docs/handoff/TASK_QUEUE.md
docs/handoff/NEXT_TASK.md
docs/handoff/CURRENT_STATUS.md
agents/SPECIALIST_TAXONOMY_MIGRATION_PLAN.md
agents/SPECIALIST_TAXONOMY_DECISION_LOG.md
```

### Files not to touch

```text
extensions/
tests/
specs/schemas/
specs/templates/
specs/teams/
specs/specialists/
specs/examples/
```

T-29b may create or update this plan document itself, but it must not implement the schema changes described by the plan.

### Required updates

T-29b should:

1. Add this plan under:

   ```text
   docs/design/SCHEMA_HARDENING_AMENDMENT_PLAN.md
   ```

2. Update `docs/handoff/TASK_QUEUE.md` to add:

   ```text
   T-29b — Stage 3.6: Schema Hardening Plan Assimilation
   T-29c — Stage 3.6: Schema/Template Hardening Implementation
   T-29d — Stage 3.6: Concrete Specialist YAML Readiness
   ```

3. Mark T-29b active.

4. Mark T-30 blocked until the required Stage 3.6 work is complete.

5. Update `docs/handoff/NEXT_TASK.md` so the next task is T-29b, not T-30.

6. Update `docs/handoff/CURRENT_STATUS.md` to explain that T-30 is paused because schema hardening is now a prerequisite for safe runtime metadata mirroring.

7. Update `agents/SPECIALIST_TAXONOMY_MIGRATION_PLAN.md` with a Stage 3.6 section.

8. Update `agents/SPECIALIST_TAXONOMY_DECISION_LOG.md` with the D-H decisions listed below.

### T-29b non-goals

T-29b must not:

- Edit TypeScript.
- Edit runtime tests.
- Edit team runtime definitions.
- Edit schema/template/spec files under `specs/`.
- Add concrete specialist YAML files.
- Add validation enforcement.
- Add YAML loading.
- Perform cleanup or alias removal.
- Reorder the campaign beyond the task insertion described here.

### T-29b acceptance criteria

T-29b is complete when:

- This plan exists in the repo.
- The task queue includes T-29b, T-29c, and T-29d.
- T-29b is the active next task.
- T-30 is blocked pending schema hardening.
- The migration plan includes Stage 3.6.
- The decision log records D-H1 through D-H15.
- No runtime/code/spec implementation changes were made.

## T-29c — Stage 3.6: Schema/Template Hardening Implementation

### Goal

Update the Stage 3.5 schema, templates, examples, and related specs to v2.1 so runtime migration can mirror them safely.

### Task type

Schema/spec/template documentation implementation.

### Files likely touched

```text
specs/schemas/SPECIALIST_AND_TEAM_YAML_SPEC.md
specs/context/CONTEXT_BUNDLE_TEMPLATE.yaml
specs/specialists/SPECIALIST_TEMPLATE.yaml
specs/teams/TEAM_TEMPLATE.yaml
specs/examples/*.yaml
specs/templates/*.md
specs/_SPECS_INDEX.md
```

### Files not to touch

```text
extensions/
tests/
docs/handoff/NEXT_TASK.md except final handoff update
docs/handoff/TASK_QUEUE.md except final task status update
```

T-29c should not implement runtime behavior.

### Required schema hardening work

T-29c should implement the D-H decisions below in the schema/spec/template files.

At minimum, it should:

1. Split context presentation from authority-bearing layers.
2. Clarify that repository/universal constraints are non-overridable.
3. Add specialist identifier-surface fields.
4. Add first-class YAML taxonomy shape and runtime projection rules.
5. Split `migration_status`.
6. Extend alias lifecycle entries.
7. Replace or prepare replacement of scalar state targets with target objects.
8. Mark `state_to_specialist_mapping` as compatibility-only.
9. Make output templates machine-parseable with YAML front matter or document an explicit transition plan.
10. Mark committed effective-contract examples as examples rather than generated artifacts.
11. Add Pi platform projection notes.
12. Update schema examples to match the hardened schema.

### T-29c acceptance criteria

T-29c is complete when:

- The schema is internally consistent.
- `presentation_order` and authority semantics are no longer conflated.
- The specialist template includes an `identifiers` block.
- The specialist template includes a first-class `taxonomy` block.
- The TypeScript runtime projection from YAML taxonomy metadata is explicitly documented.
- `migration_status` is replaced or superseded by:
  - `definition_status`
  - `taxonomy_status`
  - `runtime_migration_status`
- Alias lifecycle entries include:
  - `name`
  - `canonical_target`
  - `reason`
  - `lifecycle_state`
  - `cleanup_condition`
  - `next_lifecycle_state`
  - `next_advancement_condition`
- Team state targets use or document a target-object shape.
- `state_to_specialist_mapping` is explicitly compatibility-only and must match authoritative state targets if present.
- Output template metadata is parseable or has an explicit transition plan.
- Effective-contract examples are not labeled as actual generated artifacts.
- Pi platform projection is documented.
- No TypeScript/runtime behavior changes were made.

## T-29d — Stage 3.6: Concrete Specialist YAML Readiness

### Goal

Ensure the concrete specialist YAML needed by T-30 exists and matches the hardened v2.1 schema.

### Task type

Concrete metadata preparation.

### Why this task exists

The migration plan says committed specialist YAML files should exist for existing specialists. The current specs currently distinguish templates/examples from future concrete specialist specs.

T-30 should not be forced to mirror only an example if the runtime migration depends on a concrete canonical specialist. At minimum, concrete YAML should exist for the specialists directly involved in T-30.

### Required concrete YAML scope

T-29d should create or update concrete YAML for the specialists directly needed by T-30.

Minimum likely set:

```text
specs/specialists/planner.yaml
specs/specialists/builder.yaml
specs/specialists/builder-test.yaml
specs/specialists/reviewer.yaml
```

If Scribe is directly referenced by the hardened schema examples or active team specs, include:

```text
specs/specialists/scribe.yaml
```

Do not create speculative variants unless the current repo already requires them.

### T-29d acceptance criteria

T-29d is complete when:

- Concrete specialist YAML exists for all specialists directly needed by T-30 runtime metadata and alias compatibility.
- `builder-test` is represented as canonical.
- `tester` is represented only as a transitional/deprecated alias or compatibility runtime surface.
- Concrete specialist YAML uses the v2.1 fields from T-29c.
- Example files remain examples and do not serve as the only durable source for required T-30 metadata.
- Docs clearly state whether remaining specialist YAML files may be added incrementally.
- No runtime TypeScript changes were made unless this task is explicitly expanded.

## T-30 — Stage 4: Runtime/type metadata migration

T-30 should resume after T-29c and any required T-29d work.

T-30 should then mirror the hardened v2.1 schema into runtime TypeScript metadata.

T-30 must not redefine incompatible shapes.

At minimum, T-30 should preserve the target runtime taxonomy shape:

```ts
taxonomy: {
  baseClass: "Planner" | "Scribe" | "Builder" | "Reviewer";
  variant: string | null;
  artifactResponsibility: string[];
}
```

T-30 should use the documented YAML-to-TypeScript projection:

```text
taxonomy.baseClass = yaml.taxonomy.base_class
taxonomy.variant = yaml.taxonomy.variant
taxonomy.artifactResponsibility = yaml.taxonomy.artifact_responsibility
```

T-30 should preserve alias-first migration:

```text
tester -> builder-test
```

`builder-test` is canonical.

`tester` is transitional/deprecated.

T-30 should not pull T-31 router/team state-machine migration forward unless the campaign docs explicitly authorize that.

## Hardening Decisions

The following decisions should be recorded in `agents/SPECIALIST_TAXONOMY_DECISION_LOG.md`.

### D-H1 — Stage 3.6 is a hardening amendment

Stage 3.6 is a schema-hardening amendment inserted after completed Stage 3.5 and before Stage 4 runtime migration.

It is not a redesign of the specialist taxonomy.

### D-H2 — Schema artifacts remain under `specs/`

Do not create parallel schema/template/contract/example directories under `agents/`.

Schema and template artifacts remain under:

```text
specs/schemas/
specs/specialists/
specs/teams/
specs/context/
specs/contracts/
specs/templates/
specs/examples/
```

### D-H3 — Presentation order and authority model are distinct

Context presentation order describes how context is shown to a specialist.

Authority model describes which rules constrain or supersede other rules.

Do not treat these as the same list.

### D-H4 — Repository/universal constraints are non-overridable

Invocation addenda, orchestrator task packets, team-node contracts, variant contracts, output templates, and upstream evidence may narrow scope or add constraints.

They may not broaden or override repository-level or universal constraints.

### D-H5 — Specialist identity requires an explicit identifier-surface model

Specialist schema must distinguish canonical taxonomy ids from runtime/config/tool/filepath identifiers.

Use an `identifiers` block.

Recommended shape:

```yaml
identifiers:
  canonical_id: builder-test
  taxonomy_variant: builder-test
  current_runtime_id: tester
  runtime_config_id: specialist_tester
  extension_directory: extensions/specialists/tester
  delegate_tool_names:
    - delegate-to-tester
  legacy_aliases:
    - tester
    - specialist_tester
```

`current_runtime_id` may remain temporarily as a compatibility shortcut, but the structured `identifiers` block is preferred.

### D-H6 — Add first-class YAML taxonomy block and runtime projection

Specialist YAML should include:

```yaml
taxonomy:
  base_class: Builder
  variant: builder-test
  artifact_responsibility:
    - test artifacts
    - test fixtures
    - validation commands when explicitly assigned
```

Boundary exclusions should live outside the runtime projection:

```yaml
artifact_boundaries:
  excluded:
    - final acceptance review
    - unrelated production implementation
```

Runtime projection:

```text
taxonomy.baseClass = yaml.taxonomy.base_class
taxonomy.variant = yaml.taxonomy.variant
taxonomy.artifactResponsibility = yaml.taxonomy.artifact_responsibility
```

### D-H7 — Split `migration_status`

Do not use one `migration_status` field to represent multiple concepts.

Use:

```yaml
definition_status: active | proposed | deprecated | removed
taxonomy_status: canonical | transitional | out_of_taxonomy
runtime_migration_status: not_started | mirrored | runtime_active | yaml_loaded | cleanup_pending
```

Alias state remains separate under alias lifecycle fields.

### D-H8 — Alias entries require advancement metadata

Alias entries should include:

```yaml
aliases:
  - name: tester
    canonical_target: builder-test
    reason: Current runtime compatibility during staged migration.
    lifecycle_state: deprecated
    cleanup_condition: All existing references resolve through builder-test or have been removed.
    next_lifecycle_state: blocked-for-new-use
    next_advancement_condition: Validation can fail new tester references while preserving legacy resolution.
```

`cleanup_condition` and `next_advancement_condition` are distinct.

### D-H9 — Team state targets should be objects, not only scalar strings

Scalar targets are insufficient for future nested teams, runtime id compatibility, parallel states, or non-specialist terminal states.

Preferred shape:

```yaml
states:
  testing:
    type: specialist
    target:
      kind: specialist
      canonical_id: builder-test
      current_runtime_id: tester
```

Future-compatible examples:

```yaml
target:
  kind: team
  canonical_id: qa-team
```

```yaml
target:
  kind: parallel
  join: all
  targets:
    - kind: specialist
      canonical_id: reviewer-critic
    - kind: specialist
      canonical_id: reviewer-boundary-auditor
```

Do not implement future fan-out behavior in Stage 3.6. Only avoid blocking it.

### D-H10 — `state_to_specialist_mapping` is compatibility-only

`state_machine.states.*.target` is authoritative.

`state_to_specialist_mapping` is a compatibility view and must match the authoritative state targets if present.

New specs may omit `state_to_specialist_mapping` after runtime migration supports state target objects.

### D-H11 — Output templates remain Markdown but need parseable metadata

Project output templates should remain human-readable Markdown.

They should include YAML front matter or an explicitly documented transition plan.

Preferred shape:

```markdown
---
schema_version: "v2.1"
artifact_kind: output_template
template_id: test-artifact
artifact_type: test
required_fields:
  - testStrategy
  - testCasesAuthored
  - executionCommands
  - expectedPassConditions
  - coverageNotes
optional_fields:
  - testExecutionResults
---

# Test Artifact Template
```

### D-H12 — Effective-contract examples are examples, not generated artifacts

Committed examples should not claim to be actual generated artifacts.

Preferred metadata:

```yaml
artifact_kind: effective_contract_example
example: true
example_of: effective_contract
```

Avoid ambiguous fields such as:

```yaml
generated: true
```

in committed examples.

### D-H13 — Concrete specialist YAML must be distinguished from examples

The v2.1 schema/template checkpoint may be complete even if not every concrete specialist YAML file exists yet.

However, runtime migration should not claim to mirror concrete specialist YAML unless concrete files exist for the relevant specialists.

Docs should distinguish:

```text
Schema/template checkpoint complete.
Concrete per-specialist YAML migration partially complete or complete.
Runtime YAML loading not yet implemented.
```

### D-H14 — Pi platform projection must be explicit

`specs/` artifacts are project-native metadata.

They are not directly Pi-loaded prompt templates, skills, extensions, or themes.

Runtime consumption of `specs/` metadata must happen through `my-pi` extension/orchestrator code.

`specs/templates/*.md` are output artifact templates, not Pi slash-command prompt templates.

### D-H15 — Validation expectations are documented now; enforcement remains later

Stage 3.6 should define validation expectations but should not implement broad validation enforcement.

Layered validation remains a later stage.

Expected validation categories:

1. Specialist taxonomy validation.
2. Identifier-surface validation.
3. Alias lifecycle validation.
4. Team state-machine validation.
5. Context bundle and authority-model validation.
6. Output template metadata validation.
7. Effective-contract example validation.
8. Runtime/docs alignment validation.
9. Pi platform projection validation.

## Recommended v2.1 Schema Shapes

### Specialist definition

Preferred shape:

```yaml
schema_version: "v2.1"
artifact_kind: specialist_definition

identifiers:
  canonical_id: builder-test
  taxonomy_variant: builder-test
  current_runtime_id: tester
  runtime_config_id: specialist_tester
  extension_directory: extensions/specialists/tester
  delegate_tool_names:
    - delegate-to-tester
  legacy_aliases:
    - tester
    - specialist_tester

taxonomy:
  base_class: Builder
  variant: builder-test
  artifact_responsibility:
    - test artifacts
    - test fixtures
    - validation commands when explicitly assigned

artifact_boundaries:
  excluded:
    - final acceptance review
    - unrelated production implementation

definition_status: active
taxonomy_status: canonical
runtime_migration_status: mirrored

aliases:
  - name: tester
    canonical_target: builder-test
    reason: Current runtime compatibility during staged migration.
    lifecycle_state: deprecated
    cleanup_condition: All existing references resolve through builder-test or have been removed.
    next_lifecycle_state: blocked-for-new-use
    next_advancement_condition: Validation can fail new tester references while preserving legacy resolution.

contracts:
  universal: specs/contracts/universal.md
  repository: specs/contracts/repository.md
  base_class: specs/contracts/base-builder.md
  variant: specs/contracts/variant-builder-test.md

output_templates:
  - specs/templates/test-artifact.md
```

### Context bundle

Preferred shape:

```yaml
schema_version: "v2.1"
artifact_kind: context_bundle_template

presentation_order:
  - base_specialist_context
  - variant_context
  - repository_rules
  - assembled_specialist_contract
  - orchestrator_task_packet
  - task_specific_context
  - upstream_artifacts_and_evidence
  - output_template

authority_model:
  non_overridable_layers:
    - repository_contract
    - universal_contract
    - safety_policy
    - branch_guard
  narrowing_layers:
    - invocation_addendum
    - orchestrator_task_packet
    - team_node_contract
    - variant_contract
    - base_class_contract
    - output_template
    - upstream_artifacts_and_evidence
  rule: narrowing_layers_may_narrow_but_not_broaden_non_overridable_layers

sections:
  - id: base_specialist_context
    required: true
  - id: variant_context
    required: false
  - id: repository_rules
    required: true
  - id: assembled_specialist_contract
    required: true
  - id: orchestrator_task_packet
    required: true
  - id: task_specific_context
    required: false
  - id: upstream_artifacts_and_evidence
    required: false
  - id: output_template
    required: true
```

### Team definition

Preferred shape:

```yaml
schema_version: "v2.1"
artifact_kind: team_definition
team_id: build-team

state_machine:
  initial_state: planning

  states:
    planning:
      type: specialist
      target:
        kind: specialist
        canonical_id: planner
        current_runtime_id: planner
      transitions:
        - on: success
          to: building

    building:
      type: specialist
      target:
        kind: specialist
        canonical_id: builder
        current_runtime_id: builder
      transitions:
        - on: success
          to: reviewing
        - on: needs_tests
          to: testing

    testing:
      type: specialist
      target:
        kind: specialist
        canonical_id: builder-test
        current_runtime_id: tester
      transitions:
        - on: success
          to: reviewing
        - on: needs_build_changes
          to: building

    reviewing:
      type: specialist
      target:
        kind: specialist
        canonical_id: reviewer
        current_runtime_id: reviewer
      transitions:
        - on: accepted
          to: done
        - on: changes_requested
          to: building

    done:
      type: terminal
      target:
        kind: orchestrator

compatibility:
  state_to_specialist_mapping:
    planning: planner
    building: builder
    testing: builder-test
    reviewing: reviewer
  compatibility_rule: must_match_state_machine_targets_if_present
```

### Output template

Preferred shape:

```markdown
---
schema_version: "v2.1"
artifact_kind: output_template
template_id: test-artifact
artifact_type: test
description: Template for Builder test-artifact output.
required_fields:
  - testStrategy
  - testCasesAuthored
  - executionCommands
  - expectedPassConditions
  - coverageNotes
optional_fields:
  - testExecutionResults
  - knownLimitations
platform_projection:
  pi:
    not_prompt_template: true
    not_slash_command: true
    consumed_by: orchestrator/effective-contract-assembler
---

# Test Artifact Template

## Test Strategy

## Test Cases Authored

## Execution Commands

## Expected Pass Conditions

## Coverage Notes

## Test Execution Results

## Known Limitations
```

### Effective contract example

Preferred shape:

```yaml
schema_version: "v2.1"
artifact_kind: effective_contract_example
example: true
example_of: effective_contract

specialist:
  canonical_id: builder-test
  base_class: Builder
  variant: builder-test

assembled_from:
  - specs/contracts/universal.md
  - specs/contracts/repository.md
  - base class contract
  - variant contract
  - team/node contract
  - invocation addendum
  - output template reference

commit_policy:
  generated_effective_contracts_committed_by_default: false
  this_file_is_committed_because: selected_example
```

## Pi Platform Projection

The schema must distinguish project-native metadata from Pi-native package resources.

Project-native metadata includes:

```text
specs/schemas/
specs/specialists/
specs/teams/
specs/context/
specs/contracts/
specs/templates/
specs/examples/
```

Pi-native implementation resources include:

```text
extensions/
prompts/
skills/
themes/
```

Rules:

1. `specs/` artifacts are not directly loaded by Pi as prompt templates, skills, extensions, or themes.
2. Runtime consumption of `specs/` metadata must happen through `my-pi` extension/orchestrator code.
3. `specs/templates/*.md` files are output artifact templates.
4. `specs/templates/*.md` files are not Pi slash-command prompt templates.
5. Pi extension tools, commands, shortcuts, and prompt snippets may project or consume taxonomy metadata, but they are not the source of taxonomy authority.
6. The source of project architecture remains the committed project docs/specs and, later, validated runtime mirrors.

## Validation Expectations

Stage 3.6 should document future validation expectations but not enforce them broadly.

Future validation should support warning mode first and failure mode later.

Expected categories:

### Specialist taxonomy validation

Check that:

- `base_class` is one of:
  - Planner
  - Scribe
  - Builder
  - Reviewer
- Base specialists use `variant: null` or omit variant according to final schema rule.
- Variants use base-class-prefixed kebab-case where required.
- `builder-test` is canonical.
- `tester` is not canonical.

### Identifier-surface validation

Check that:

- `identifiers.canonical_id` is present.
- Runtime ids, config ids, delegate tool names, and extension directories are explicitly represented where they exist.
- Deprecated aliases do not silently appear as canonical ids.
- New references do not use blocked aliases after the lifecycle advances.

### Alias lifecycle validation

Check that each alias has:

- `name`
- `canonical_target`
- `reason`
- `lifecycle_state`
- `cleanup_condition`
- `next_lifecycle_state`
- `next_advancement_condition`

Check that lifecycle values are one of:

```text
active
deprecated
blocked-for-new-use
removal-candidate
removed
```

### Team state-machine validation

Check that:

- Each state has a valid type.
- Each specialist target resolves to a canonical specialist id.
- Runtime compatibility ids are represented where needed.
- Transitions point to valid states.
- Terminal states are explicit.
- Retry/failure policies are bounded where required.
- Compatibility mappings match authoritative state targets if present.

### Context bundle and authority-model validation

Check that:

- `presentation_order` references declared context sections.
- `authority_model` references authority-bearing layers.
- Non-overridable layers cannot be broadened by invocation/task layers.
- Narrowing layers are documented as narrowing-only.

### Output template metadata validation

Check that:

- Markdown output templates include parseable front matter or an explicit transition marker.
- Required fields are declared.
- Optional fields are declared.
- Artifact type is declared.
- Output templates are not mislabeled as Pi prompt templates.

### Effective-contract example validation

Check that:

- Committed examples are marked as examples.
- Committed examples are not marked as actual generated artifacts.
- Generated per-task effective contracts are not committed by default.

### Runtime/docs alignment validation

Check that:

- TypeScript runtime taxonomy mirrors the documented projection.
- Runtime aliases match documented alias lifecycle.
- Runtime specialist ids are mapped to canonical ids.
- Runtime metadata does not redefine incompatible taxonomy shapes.

### Pi platform projection validation

Check that:

- Project-native schema artifacts are not treated as directly Pi-loaded resources.
- Pi-native resources correctly project from project-native metadata where applicable.
- Output artifact templates and Pi prompt templates remain distinct.

## Codex Guardrails

Any Codex or implementation agent working from this plan must follow these guardrails.

### General

- Inspect the current branch before editing.
- Treat the current repo as authoritative if it conflicts with this document.
- If the repo conflicts with this document, record the conflict instead of silently resolving it.
- Do not broaden the task scope.
- Do not implement future stages early.
- Do not make runtime changes during documentation-only tasks.
- Do not create generated effective contracts as committed artifacts.
- Do not promote deferred specialists or variants.
- Do not rename existing files unless the task explicitly requires it.
- Preserve the branch guard.

### T-29b-specific

- Transcribe and assimilate this plan.
- Do not reinterpret or redesign it.
- Do not edit schema/spec/template files.
- Do not edit runtime TypeScript.
- Do not edit tests.
- Do not implement T-29c or T-29d.

### T-29c-specific

- Implement schema/spec/template hardening only.
- Do not edit runtime TypeScript.
- Do not implement YAML loading.
- Do not implement router migration.
- Do not enforce validation broadly.
- Do not create concrete specialist YAML unless T-29c is explicitly expanded.

### T-29d-specific

- Create or update concrete specialist YAML needed for T-30.
- Do not implement runtime TypeScript changes.
- Do not create speculative variants.
- Do not treat examples as the only durable source for required runtime metadata.

### T-30-specific

- Mirror the hardened schema.
- Preserve alias-first migration.
- Keep `builder-test` canonical.
- Keep `tester` transitional/deprecated.
- Do not pull T-31 router/team migration forward.
- Do not implement broad validation enforcement.

## Final Handoff State After T-29b

After T-29b completes, the next task should be T-29c.

Expected handoff summary:

```text
T-29b complete.
Stage 3.6 schema-hardening campaign plan assimilated.
T-29c is now the active next task.
T-30 remains blocked until schema/spec/template hardening is complete.
No runtime changes were made.
```

## Final Handoff State After T-29c

After T-29c completes, the next task should be T-29d unless the repo explicitly determines that concrete specialist YAML readiness is unnecessary before T-30.

Expected handoff summary:

```text
T-29c complete.
Schema/spec/template artifacts hardened to v2.1.
T-29d is now the active next task if concrete specialist YAML is still required.
T-30 remains blocked until required concrete specialist YAML readiness is complete.
No runtime changes were made.
```

## Final Handoff State After T-29d

After T-29d completes, T-30 may resume.

Expected handoff summary:

```text
T-29d complete.
Concrete specialist YAML needed for T-30 exists and conforms to v2.1.
T-30 is unblocked and is now the active next task.
Runtime migration should mirror the hardened v2.1 schema.
No runtime changes were made during T-29d unless explicitly authorized.
```

## Explicit Non-decisions

The following remain out of scope for this amendment:

- Exact JSON Schema sidecar format.
- Runtime YAML loading mechanism.
- Full router migration to state-machine team definitions.
- Full validation enforcement implementation.
- Final removal timing for deprecated aliases.
- Full specialist filename rename strategy.
- Introduction of `reviewer-validation`.
- Canonical promotion of `doc-formatter`.
- Activation of proposed aliases unrelated to T-30.
- Full fan-out/fan-in/nested-team implementation.
- Whether v3 should replace v2.1 after validation/runtime loading exists.

These should be handled by later explicitly scoped tasks.