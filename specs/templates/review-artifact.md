# Review Artifact Template

**Template id:** `review-artifact`
**Schema version:** `v2`
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
