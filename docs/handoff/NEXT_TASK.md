# Next Task

Last updated: 2026-03-08
Owner: Joe + Codex
Status: active
Bundle ID: BUNDLE-20260308-documentation-reconciliation-sync

## Task summary
Rotate the live handoff layer to a documentation-reconciliation bundle, then reconcile live docs to current repository truth without changing filesystem structure or introducing a new template taxonomy.

## Why this bundle is next
A contract-truth reconciliation bundle is required to prevent control-plane/documentation drift before resuming specialist-layer progression.

## Objective
Establish contract-aligned documentation truth by making documentation reconciliation the single active bundle, removing legacy template taxonomy references across live docs, and normalizing `DECISION_LOG.md` structure while preserving all existing decision content, dates, and order.

## Execution path
`direct_bundle_execution`

## Bundle owner
`top_level_executor`

## Scope (in)
- Rotate the live handoff layer so documentation reconciliation is the single active bundle.
- Reconcile legacy template-taxonomy references in live documentation to the current `templates/` subtree (`extension/`, `prompt/`, `skill/`, `theme/`).
- Normalize `docs/handoff/DECISION_LOG.md` to required durable-decision structure while preserving every existing decision, date, and ordering.
- Validate that `NEXT_TASK.md`, `CURRENT_STATUS.md`, and `TASK_QUEUE.md` remain mutually consistent.

## Scope (out)
- Filesystem restructuring.
- Introducing a new template taxonomy.
- Specialist/team/sequence implementation work.
- Canonical-policy changes not required for truthfulness.
- Editing `AGENTS.md` unless a hard contradiction requires it.

## Dependencies / prerequisites
- `docs/handoff/HANDOFF_CONTRACT.md`
- `docs/handoff/NEXT_TASK_CONTRACT.md`
- Existing handoff-state documents under `docs/handoff/`
- Existing templates subtree under `templates/`

## Required read set
- `AGENTS.md`
- `INDEX.md`
- `docs/WORKFLOW.md`
- `docs/CANONICAL_DECISIONS.md`
- `templates/CONTRACT.md`
- `templates/_TEMPLATES_INDEX.md`
- `docs/ORCHESTRATION_MODEL.md`
- `docs/handoff/HANDOFF_CONTRACT.md`
- `docs/handoff/NEXT_TASK_CONTRACT.md`
- `docs/handoff/_HANDOFF_INDEX.md`
- `docs/handoff/CURRENT_STATUS.md`
- `docs/handoff/TASK_QUEUE.md`
- `docs/handoff/OPEN_DECISIONS.md`
- `docs/handoff/DECISION_LOG.md`

## Allowed write set
- `docs/handoff/NEXT_TASK.md`
- `docs/handoff/CURRENT_STATUS.md`
- `docs/handoff/TASK_QUEUE.md`
- `docs/handoff/OPEN_DECISIONS.md`
- `docs/handoff/DECISION_LOG.md`
- `templates/CONTRACT.md`
- `templates/_TEMPLATES_INDEX.md`
- `docs/ORCHESTRATION_MODEL.md`

## Constraints
- Keep changes minimal and targeted to documentation truth reconciliation.
- Treat this as documentation/control-plane work only.
- Do not change filesystem structure or introduce a new template taxonomy.
- Do not treat `NEXT_TASK.md` as a downstream packet.
- Preserve orchestrator-first routing and narrow-default downstream access.
- Do not alter `AGENTS.md` unless required to preserve truthfulness.

## Implementation notes
- Perform handoff rotation updates before any other documentation edits.
- Search repo-wide for legacy template-taxonomy references and reconcile all live documentation references.
- Preserve existing decision statements/dates/ordering during decision-log normalization.
- If blocked by unresolved policy, record it in `OPEN_DECISIONS.md` instead of guessing.

## Subtasks
- Rotate active bundle state across `NEXT_TASK.md`, `CURRENT_STATUS.md`, and `TASK_QUEUE.md`.
- Reconcile legacy template-taxonomy references in live docs.
- Normalize `DECISION_LOG.md` entry shape without changing decision substance.
- Run local consistency checks for touched paths and cross-handoff alignment.

## Validation level
`local_consistency_check`

## Acceptance criteria
- Documentation reconciliation bundle is the single active bundle in the handoff layer.
- Legacy template-taxonomy references are removed from live documentation.
- `DECISION_LOG.md` entries conform to durable-decision structure while preserving decision content/date/order.
- Handoff state documents agree on active bundle and queue progression.

## Verification checklist
- Confirm all touched file references exist.
- Confirm no filesystem/taxonomy restructuring was introduced.
- Confirm `NEXT_TASK.md`, `CURRENT_STATUS.md`, and `TASK_QUEUE.md` agree on active/queued status.
- Confirm repo-wide search shows no remaining live legacy template-taxonomy references.

## Risks / rollback notes
- Risk: normalization accidentally changes decision meaning.
  - Mitigation: preserve each decision statement/date/order verbatim and normalize structure only.
- Risk: hidden legacy reference remains outside `templates/`.
  - Mitigation: perform repo-wide search with explicit legacy patterns.

## Escalation conditions
- Required reconciliation change would require a new policy/architectural decision not already defined.
- Contract docs contain unresolved contradictions that block safe interpretation.
- Required fix exceeds allowed write scope.
