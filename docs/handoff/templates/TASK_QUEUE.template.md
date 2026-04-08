# Task Queue

**Last updated:** YYYY-MM-DD
**Owner:** [who maintains this queue]

## Purpose

Prioritized backlog of discrete, agent-executable tasks. After completing assigned tasks, agents must:
1. Mark completed tasks `done` below.
2. Update `CURRENT_STATUS.md` with what was accomplished.
3. Update `NEXT_TASK.md` to point at the next `queued` task(s).

## Status key

- `done` — completed and verified
- `active` — currently being worked on (should match `NEXT_TASK.md`)
- `queued` — ready to start, dependencies met
- `blocked` — cannot start, dependency not met
- `deferred` — intentionally postponed while a higher-priority task or phase is active

---

## Phase N: [Phase Name]

| ID | Status | Task | Specs to Read | Acceptance Criteria |
|----|--------|------|---------------|---------------------|
| T-001 | queued | [Task description] | [doc1.md], [doc2.md] | [Concise pass/fail criteria] |
| T-002 | blocked | [Task description] | [doc1.md] | [Concise pass/fail criteria] |
| T-003 | deferred | [Deferred follow-on task] | [doc1.md] | [What must be true before this is reactivated] |

---

## Notes

- Tasks within a phase are ordered by dependency. Complete them in order unless explicitly marked as parallelizable.
- An agent should only work on `active` tasks. If no task is `active`, promote the first `queued` task.
- If a task is `blocked`, do not attempt it. Instead, check `DECISIONS_NEEDED.md` or notify the human.
- If a task is `deferred`, leave it visible and record why it is parked rather than deleting it from the queue.
