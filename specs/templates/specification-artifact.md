---
schema_version: "v2.1"
artifact_kind: output_template
template_id: specification-artifact
artifact_type: specification
required_fields:
  - purpose
  - boundaries
  - successCriteria
optional_fields:
  - openQuestions
---

# Specification Artifact Template

**Template id:** `specification-artifact`
**Schema version:** `v2.1`
**Artifact kind:** `output_template`
**Artifact type:** `specification`

## Required Fields

- `purpose`: what the artifact or primitive is for.
- `boundaries`: what it does and does not own.
- `successCriteria`: observable completion criteria.

## Optional Fields

- `openQuestions`: unresolved design questions.

## Format Rules

- Prefer boundary-first prose.
- Keep implementation details separate from requirements unless assigned.

## Validation Expectations

- Scope and non-goals must be explicit.
