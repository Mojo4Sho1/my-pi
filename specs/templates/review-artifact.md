---
schema_version: "v2.1"
artifact_kind: output_template
template_id: review-artifact
artifact_type: review
required_fields:
  - verdict
  - findings
  - summary
optional_fields:
  - residualRisk
---

# Review Artifact Template

**Template id:** `review-artifact`
**Schema version:** `v2.1`
**Artifact kind:** `output_template`
**Artifact type:** `review`

## Required Fields

- `verdict`: one of `approve`, `request_changes`, `comment`, or `blocked`.
- `findings`: structured findings with priority, category, evidence, and suggested action.
- `summary`: concise review summary.

## Optional Fields

- `residualRisk`: risk that remains after review.

## Format Rules

- Findings must be evidence-backed.
- Do not perform implementation work.

## Validation Expectations

- `request_changes` and `blocked` verdicts must include at least one finding.
