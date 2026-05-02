---
schema_version: "v2.1"
artifact_kind: output_template
template_id: routing-design-artifact
artifact_type: routing_design
required_fields:
  - states
  - transitions
  - loopLimits
  - escalationPaths
optional_fields:
  - parallelizationNotes
---

# Routing Design Artifact Template

**Template id:** `routing-design-artifact`
**Schema version:** `v2.1`
**Artifact kind:** `output_template`
**Artifact type:** `routing_design`

## Required Fields

- `states`: state names and responsibilities.
- `transitions`: status-driven edges and destinations.
- `loopLimits`: bounded retry or revision rules.
- `escalationPaths`: terminal or human/orchestrator escalation behavior.

## Optional Fields

- `parallelizationNotes`: fan-out or fan-in notes for future expansion.

## Format Rules

- Every non-terminal state must define status handling.
- Retry loops must be bounded.

## Validation Expectations

- No unreachable states unless explicitly marked reserved.
