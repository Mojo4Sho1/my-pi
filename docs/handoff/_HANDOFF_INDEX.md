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

## File Authority

| File | Authority | Read when | Skip when |
|---|---|---|---|
| `NEXT_TASK.md` | single active target | starting work or checking the currently assigned task | you only need backlog/status history |
| `CURRENT_STATUS.md` | current focus and recent progress | understanding what was completed and known gaps | the next task doc already answers your question |
| `TASK_QUEUE.md` | backlog and task state | checking queue order, readiness, or task ids | you only need the active task |
| `DECISIONS_NEEDED.md` | unresolved human decisions | blocked by a genuine authority gap | no open decision is blocking work |
| `templates/` | handoff-system maintenance only | editing or recreating handoff docs/templates | ordinary task execution |

## Common Access Patterns

### Starting a normal queued task

1. `NEXT_TASK.md`
2. `CURRENT_STATUS.md`
3. `TASK_QUEUE.md`
4. task-local docs such as `docs/validation/_VALIDATION_INDEX.md`

### Updating handoff state after finishing a task

1. `CURRENT_STATUS.md`
2. `TASK_QUEUE.md`
3. `NEXT_TASK.md`
4. `DECISIONS_NEEDED.md` only if a new blocking decision appeared

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
