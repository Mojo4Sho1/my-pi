---
schema_version: "v2.1"
artifact_kind: output_template
template_id: schema-artifact
artifact_type: schema
required_fields:
  - types
  - invariants
  - validationRules
optional_fields:
  - migrationNotes
---

# Schema Artifact Template

**Template id:** `schema-artifact`
**Schema version:** `v2.1`
**Artifact kind:** `output_template`
**Artifact type:** `schema`

## Required Fields

- `types`: data shapes, fields, or contracts.
- `invariants`: rules that must remain true.
- `validationRules`: checks required to verify conformance.

## Optional Fields

- `migrationNotes`: notes for transitioning from an older shape.

## Format Rules

- Use precise field names and required/optional status.
- Separate schema shape from runtime implementation.

## Validation Expectations

- Every required field must define type and purpose.
