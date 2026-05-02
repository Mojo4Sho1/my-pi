---
schema_version: "v2.1"
artifact_kind: output_template
template_id: implementation-artifact
artifact_type: implementation
required_fields:
  - modifiedFiles
  - changeDescription
optional_fields:
  - validationCommands
  - knownGaps
---

# Implementation Artifact Template

**Template id:** `implementation-artifact`
**Schema version:** `v2.1`
**Artifact kind:** `output_template`
**Artifact type:** `implementation`

## Required Fields

- `modifiedFiles`: files changed or expected to be changed.
- `changeDescription`: concise description of the implementation.

## Optional Fields

- `validationCommands`: commands run by the builder.
- `knownGaps`: remaining limitations.

## Format Rules

- Distinguish completed changes from proposed changes.
- Do not claim validation that was not run.

## Validation Expectations

- `modifiedFiles` must be an array, even when empty.
