# _HANDOFF_INDEX.md

## Purpose

Routing file for the active handoff system under `docs/handoff/`.

Use this directory when starting a new session, finding the active queued task, checking current focus, or recording blockers that require human input.

## Start Here

For normal handoff-driven execution:

1. `docs/handoff/NEXT_TASK.md`
2. `docs/handoff/CURRENT_STATUS.md`
3. `docs/handoff/TASK_QUEUE.md`
4. `docs/handoff/DECISIONS_NEEDED.md` only if blocked by a real decision gap

Do not read every handoff file by default.

If the queue shows deferred work, treat it as intentionally parked. Do not revive deferred tasks just because they were once active; wait until the queue promotes them again.

## File Authority

| File | Authority | Read when | Skip when |
|---|---|---|---|
| `NEXT_TASK.md` | single active target | starting work or checking the currently assigned task | you only need backlog/status history |
| `CURRENT_STATUS.md` | current focus and recent progress | understanding what was completed and known gaps | the next task doc already answers your question |
| `TASK_QUEUE.md` | backlog and task state | checking queue order, readiness, or task ids | you only need the active task |
| `DECISIONS_NEEDED.md` | unresolved human decisions | blocked by a genuine authority gap | no open decision is blocking work |
| `T20_YAML_SPEC_LAYER_IMPLEMENTATION_PLAN.md` | task-specific execution brief for T-20 | the active task is T-20 and you need the locked implementation details | the active task is not T-20 |
| `T21_VALIDATION_AND_CONTRADICTION_AUDIT_IMPLEMENTATION_PLAN.md` | task-specific execution brief for T-21 | the active task is T-21 and you need the locked implementation details | the active task is not T-21 |
| `templates/` | handoff-system maintenance only | editing or recreating handoff docs/templates | ordinary task execution |

## Common Access Patterns

### Starting a normal queued task

1. `NEXT_TASK.md`
2. `CURRENT_STATUS.md`
3. `TASK_QUEUE.md`
4. the task-local design or stage doc named by `NEXT_TASK.md`

For the current active queue state, the fastest path is:

1. `docs/handoff/NEXT_TASK.md`
2. `docs/handoff/T21_VALIDATION_AND_CONTRADICTION_AUDIT_IMPLEMENTATION_PLAN.md` when the active task is T-21
3. `docs/design/CONTRACT-DRIVEN_SPECIALISTS_TEAM_ARTIFACTS_AND_PACKET_ROUTING_DESIGN.md`
4. Stage 5a.7 in `docs/IMPLEMENTATION_PLAN.md`
5. the code, specs, and tests named in `NEXT_TASK.md`

### Updating handoff state after finishing a task

1. `CURRENT_STATUS.md`
2. `TASK_QUEUE.md`
3. `NEXT_TASK.md`
4. `DECISIONS_NEEDED.md` only if a new blocking decision appeared

When a new priority phase supersedes older tasks:

1. mark the parked tasks `deferred` rather than deleting them
2. record the reason for deferral in `CURRENT_STATUS.md` or `TASK_QUEUE.md`
3. make sure `NEXT_TASK.md` points only at the single active target

### Maintaining the handoff system itself

1. this index
2. `templates/`
3. the specific handoff files being changed

## Related But Usually Background-Only Files

These historical execution guides now live in `docs/archive/` and are not part of the active handoff flow:

- `docs/archive/HANDOFF_5A1B.md`
- `docs/archive/HANDOFF_5A1C.md`
- `docs/archive/HANDOFF_5A2.md`

Read them only when you specifically need execution guidance from those completed stages.
