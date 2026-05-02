---
schema_version: "v2.1"
artifact_kind: output_template
template_id: critique-artifact
artifact_type: critique
required_fields:
  - assessment
  - issues
  - recommendation
optional_fields:
  - reuseCandidates
---

# Critique Artifact Template

**Template id:** `critique-artifact`
**Schema version:** `v2.1`
**Artifact kind:** `output_template`
**Artifact type:** `critique`

## Required Fields

- `assessment`: concise quality assessment.
- `issues`: scope, redundancy, reuse, or conceptual issues.
- `recommendation`: proceed, revise, reject, or escalate.

## Optional Fields

- `reuseCandidates`: existing artifacts or primitives that may satisfy the need.

## Format Rules

- Evaluate whether the work should exist, not just whether it is correctly formed.

## Validation Expectations

- Recommendations must follow from listed issues or evidence.
