---
name: next
description: Execute the next queued handoff task from the handoff system, run it through the orchestrator, and advance the handoff docs only after successful verification.
---

# Skill: next

Invoke with `/skill:next` to execute the next task from the handoff system.

## What This Skill Does

Reads the handoff documents and executes the current task using the orchestrator, then updates all handoff docs for the next agent.

## Invocation Steps

1. Read `docs/handoff/NEXT_TASK.md` to understand the current task
2. Read `docs/handoff/CURRENT_STATUS.md` for context on what was just completed
3. Read `docs/handoff/TASK_QUEUE.md` to understand the task's position in the queue
4. Check `docs/handoff/DECISIONS_NEEDED.md` — if there are open decisions, stop and notify the user instead of proceeding
5. Use the `orchestrate` tool to execute the task:
   - Set `task` from the task summary in `NEXT_TASK.md`
   - Set `delegationHint` from the specialist flow in `NEXT_TASK.md`
   - Set `relevantFiles` from the relevant files listed in `NEXT_TASK.md`
6. After orchestration completes, verify the acceptance criteria from the verification checklist
7. Update handoff docs per the verification checklist:
   - Update `docs/handoff/CURRENT_STATUS.md` with what was accomplished and passing checks
   - Mark the task as `done` in `docs/handoff/TASK_QUEUE.md`
   - Populate `docs/handoff/NEXT_TASK.md` with the next `queued` task from the queue
   - If any decisions are needed for the next task, append to `docs/handoff/DECISIONS_NEEDED.md`

## Notes

- This is a Pi skill, so it is exposed as `/skill:next`, not bare `/next`
- If there are open decisions in `DECISIONS_NEEDED.md`, do not proceed — ask the user to resolve them first
- If the orchestration fails or returns partial/escalation, do not advance the queue — report the result to the user
- The specialist flow and relevant files are specified in `NEXT_TASK.md` — use them as provided
