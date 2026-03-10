# TASK_QUEUE.md

Last updated: 2026-03-10

## Completed bundles
- `BUNDLE-20260308-handoff-contract-layer`: Created and normalized repository handoff + packet contracts.
- `BUNDLE-20260308-sync-contract-surface`: Synchronized specialist definitions, handoff surface, and routing docs to contract vocabulary.

## Active bundle
- `BUNDLE-20260308-documentation-reconciliation-sync`
  - Objective: Reconcile live documentation to current repository truth, including remaining legacy template-taxonomy references and deterministic stale future-tense drift in live docs.
  - Depends on: completed handoff/contract synchronization bundles.

## Partial bundles
- None.

## Blocked bundles
- None.

## Deferred bundles
- `BUNDLE-20260308-specialist-layer-execution-readiness`
  - Reason: sequencing pause while documentation reconciliation is treated as milestone 1.

## Queued bundles (next candidates)
- `BUNDLE-initial-team-layer-definitions`
  - Dependency: specialist execution readiness bundle complete.
- `BUNDLE-initial-sequence-layer-definitions`
  - Dependency: team-layer patterns stabilized.
- `BUNDLE-seed-bootstrap-alignment`
  - Dependency: stable specialist/team/sequence execution patterns.

## Queue notes
- `NEXT_TASK.md` is the execution selector for the single active bundle.
- `TASK_QUEUE.md` tracks ordering and dependencies but does not override active-bundle selection.
