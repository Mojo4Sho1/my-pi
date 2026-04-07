# Next Task

**Last updated:** 2026-04-07
**Owner:** Joe

## Task summary

Implement the panic and teardown system (Stage 5a.6): run registry, abort propagation, settled-state barrier, `/panic` extension command, and graceful-then-forced teardown. This is a BLOCKING prerequisite for all further orchestration work.

## Why this task is next

- During Stage 5a.3 validation, a canceled orchestration task left orphaned sub-agent subprocesses consuming tokens invisibly
- This is a safety and cost control issue that must be fixed before adding any orchestration complexity
- Decision #43 and the full design are in `docs/design/PANIC_AND_TEARDOWN_DESIGN.md`

## Scope (in)

- Create `extensions/shared/run-registry.ts` — parent-owned run registry with lifecycle states
- Create `extensions/shared/teardown.ts` — graceful-then-forced teardown logic
- Create `extensions/panic/index.ts` — `/panic` extension command
- Update `extensions/shared/subprocess.ts` — register spawned sub-agents in run registry
- Update `extensions/orchestrator/delegate.ts` — register delegations, propagate abort
- Update `extensions/teams/router.ts` — register team executions, propagate abort
- Add tests for run registry, teardown, abort propagation, and `/panic`
- Update `package.json` to register the panic extension

## Scope (out)

- Full widget/dashboard implementation (consumes this work later)
- Repo-local policy files (`.pi/policies/teardown.yaml`) — design must be compatible but not implemented
- Rich historical telemetry
- Distributed/multi-host teardown

## Specialist flow

This task should NOT use the orchestrator — it modifies the orchestrator itself. Implement directly.

## Relevant files

- Design doc: `docs/design/PANIC_AND_TEARDOWN_DESIGN.md`
- Modifies: `extensions/shared/subprocess.ts`, `extensions/orchestrator/delegate.ts`, `extensions/teams/router.ts`, `package.json`
- Creates: `extensions/shared/run-registry.ts`, `extensions/shared/teardown.ts`, `extensions/panic/index.ts`, `tests/run-registry.test.ts`, `tests/teardown.test.ts`, `tests/panic.test.ts`

## Dependencies / prerequisites

- Stage 5a.3 complete (all spawn paths identified through validation)
- Design document exists: `docs/design/PANIC_AND_TEARDOWN_DESIGN.md`

## Acceptance criteria (definition of done)

- All nested work registered in parent-owned run registry
- Parent abort automatically triggers descendant teardown
- Cancellation not reported complete until all descendants are terminal
- Graceful-then-forced teardown escalation works
- `/panic` extension command exists and reports what it stopped
- No orphaned subprocess survives parent cancellation
- Validated with scenarios: normal completion, parent cancel, panic, ignored graceful stop, repeated panic
- `make typecheck` passes
- `make test` passes

## Verification checklist

- [ ] Run registry tracks all spawned sub-agents and subprocesses
- [ ] Parent abort propagates to all descendants
- [ ] Settled-state barrier prevents premature completion
- [ ] `/panic` command works and reports results
- [ ] Graceful-then-forced escalation tested
- [ ] All 5 validation scenarios pass
- [ ] `make typecheck` passes
- [ ] `make test` passes
- [ ] Update `docs/handoff/CURRENT_STATUS.md` with results
- [ ] Update `docs/handoff/TASK_QUEUE.md`
- [ ] Update `docs/handoff/NEXT_TASK.md` with next task

## Risks / rollback notes

- This modifies core subprocess and delegation infrastructure — high blast radius
- Must not break existing specialist delegation or team routing
- Test thoroughly before considering complete
