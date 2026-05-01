# Routing Design Artifact Template

**Template id:** `routing-design-artifact`
**Schema version:** `v2`
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
