# OPEN_DECISIONS.md

Last updated: 2026-03-08

## Purpose
Track unresolved decisions that may affect repository execution but are not yet durable decisions.

## Open decisions
- None currently.

## Update rule
When a decision is unresolved, add an entry with:
- Decision ID
- Date opened
- Status (`open`, `monitoring`, `resolved`, `blocked`)
- Blocking status (`blocking` or `non_blocking`)
- Context
- Options under consideration
- Work allowed to continue
- Escalation trigger
- Owner
- Target resolution timing
- Resolution notes (once resolved)

## Escalation note
If an open decision becomes blocking, reflect the blocker in `NEXT_TASK.md` and `CURRENT_STATUS.md` in the same loop.
