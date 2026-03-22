# TASK_QUEUE.md

Last updated: 2026-03-19

## Completed bundles
- `BUNDLE-20260308-handoff-contract-layer`: Created and normalized repository handoff + packet contracts.
- `BUNDLE-20260308-sync-contract-surface`: Synchronized specialist definitions, handoff surface, and routing docs to contract vocabulary.
- `BUNDLE-20260308-documentation-reconciliation-sync`: Reconciled live documentation to current repository truth, aligned CANONICAL_DECISIONS with DECISION_LOG, updated stale references across core docs.

## Active bundle
- `BUNDLE-20260319-identity-and-execution-artifact-model`
  - Objective: Define canonical identity conventions, packet families, YAML packet format, authoritative routing fields, packet-contract expectations, and runtime artifact location strategy (Stage 1 of IMPLEMENTATION_PLAN.md).
  - Depends on: completed documentation reconciliation (Stage 0).

## Partial bundles
- None.

## Blocked bundles
- None.

## Deferred bundles
- `BUNDLE-20260308-specialist-layer-execution-readiness`
  - Reason: sequencing pause; Stage 1 (identity/artifact model) must precede specialist hardening (Stage 2).

## Queued bundles (next candidates)
- `BUNDLE-specialist-hardening`
  - Dependency: Stage 1 identity/artifact model bundle complete.
- `BUNDLE-initial-team-layer-definitions`
  - Dependency: specialist hardening complete.
- `BUNDLE-initial-sequence-layer-definitions`
  - Dependency: team-layer patterns stabilized.
- `BUNDLE-seed-bootstrap-alignment`
  - Dependency: stable specialist/team/sequence execution patterns.

## Queue notes
- `NEXT_TASK.md` is the execution selector for the single active bundle.
- `TASK_QUEUE.md` tracks ordering and dependencies but does not override active-bundle selection.
