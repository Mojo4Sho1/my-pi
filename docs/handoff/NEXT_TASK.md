# NEXT_TASK.md

## Current next task

Create and normalize the handoff contract layer.

## Goal

Define stable contracts for handoff control-plane artifacts, including task/result packets.

## Success condition

Handoff contract docs exist and are aligned with current orchestrator workflow:

- a handoff contract that defines ownership, update rules, and document roles under `docs/handoff/`
- a task packet contract for orchestrator-to-downstream delegation
- a result/handback packet contract for downstream-to-orchestrator returns
- routing references from handoff docs are consistent and non-conflicting

## Immediate inputs/docs to read

- `docs/WORKFLOW.md`
- `docs/CANONICAL_DECISIONS.md`
- `docs/handoff/_HANDOFF_INDEX.md`
- `docs/handoff/CURRENT_STATUS.md`
- `docs/handoff/TASK_QUEUE.md`

## Expected output

A normalized handoff control-plane contract surface that future specialist/team/sequence loops can follow without ambiguity.
