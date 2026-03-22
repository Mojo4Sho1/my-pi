# _HANDOFF_INDEX.md

## Purpose
Routing index for the repository handoff control plane.

## Start here
1. `docs/handoff/NEXT_TASK.md` (single active repository bundle)
2. `docs/handoff/CURRENT_STATUS.md` (current operational snapshot)
3. `docs/handoff/TASK_QUEUE.md` (ordered future bundles and dependency flow)
4. `docs/handoff/OPEN_DECISIONS.md` (unresolved decisions)
5. `docs/handoff/DECISION_LOG.md` (durable decisions already made)

## Handoff contracts
- `docs/handoff/HANDOFF_CONTRACT.md`
- `docs/handoff/NEXT_TASK_CONTRACT.md`
- `docs/handoff/TASK_PACKET_CONTRACT.md`
- `docs/handoff/RESULT_PACKET_CONTRACT.md`

## Routing notes
- `NEXT_TASK.md` is the execution selector at the repository handoff layer.
- Downstream task/result packets are separate artifacts defined by packet contracts and generated during orchestrated execution.
- Update this index when handoff files are added, removed, renamed, or materially repurposed.
