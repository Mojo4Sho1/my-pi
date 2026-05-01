# Specification Artifact Template

**Template id:** `specification-artifact`
**Schema version:** `v2`
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
