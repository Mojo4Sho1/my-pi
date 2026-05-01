# Boundary Audit Artifact Template

**Template id:** `boundary-audit-artifact`
**Schema version:** `v2`
**Artifact kind:** `output_template`
**Artifact type:** `boundary_audit`

## Required Fields

- `authorityAssessment`: whether requested authority is appropriate.
- `contextAssessment`: whether supplied context is minimal and sufficient.
- `violations`: boundary, permission, or context-scope issues.
- `recommendation`: approve, narrow, block, or escalate.

## Optional Fields

- `requiredNarrowing`: specific reductions to read/write scope or context.

## Format Rules

- Distinguish insufficient context from excessive context.
- Do not redesign the artifact unless boundary repair requires it.

## Validation Expectations

- Blocking recommendations must cite the violated rule or missing authority.
