# Critique Artifact Template

**Template id:** `critique-artifact`
**Schema version:** `v2`
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
