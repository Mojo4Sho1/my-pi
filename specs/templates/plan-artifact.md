---
schema_version: "v2.1"
artifact_kind: output_template
template_id: plan-artifact
artifact_type: plan
required_fields:
  - steps
  - dependencies
  - risks
optional_fields:
  - open_questions
---

# Plan Artifact Template

**Template id:** `plan-artifact`
**Schema version:** `v2.1`
**Artifact kind:** `output_template`
**Artifact type:** `plan`

## Required Fields

- `steps`: ordered implementation or workflow steps.
- `dependencies`: prerequisites, ordering constraints, or external blockers.
- `risks`: known risks and mitigation notes.

## Optional Fields

- `open_questions`: questions that block confident execution.

## Format Rules

- Keep steps actionable and bounded.
- Do not include implementation changes as if they were already performed.

## Validation Expectations

- Required fields must be present and non-empty for `success`.
