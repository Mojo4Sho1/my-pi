# _HANDOFF_INDEX.md

## Purpose

Routing map for live handoff state documents.

## Canonical files

- `docs/handoff/NEXT_TASK.md`
- `docs/handoff/CURRENT_STATUS.md`
- `docs/handoff/TASK_QUEUE.md`
- `docs/handoff/DECISION_LOG.md`

## Orchestrator reading order

1. `docs/handoff/NEXT_TASK.md`
2. `docs/handoff/CURRENT_STATUS.md`
3. `docs/handoff/TASK_QUEUE.md` when needed
4. `docs/handoff/DECISION_LOG.md` when decision history matters

## Update routing

- update `NEXT_TASK.md` when the immediate next task changes
- update `CURRENT_STATUS.md` when active state changes
- update `TASK_QUEUE.md` when priorities/backlog change
- append `DECISION_LOG.md` when durable decisions are made
