# Next Task

Last updated: 2026-03-08
Owner: Joe + Codex
Status: active
Bundle ID: BUNDLE-20260308-specialist-layer-execution-readiness

## Task summary
Execute the first post-contract specialist-layer bundle by validating specialist execution readiness and bounded downstream packetization flow.

## Why this bundle is next
The contract layer and synchronization pass are complete. The next highest-priority dependency is proving the specialist layer can execute work cleanly before teams and sequences are expanded.

## Objective
Establish an execution-ready specialist layer that can accept bounded task packets and return contract-aligned outputs without scope or routing drift.

## Execution path
`direct_bundle_execution`

## Bundle owner
`top_level_executor`

## Scope (in)
- Validate specialist definitions against `agents/AGENT_DEFINITION_CONTRACT.md` in execution-oriented terms.
- Produce any small contract-conforming specialist-support artifacts required for first practical use.
- Verify routing and handoff docs remain aligned while specialist execution readiness is established.

## Scope (out)
- Creating teams.
- Creating sequences.
- Template-system redesign.
- Broad package/root restructuring.
- Changes to canonical decisions unless a direct contradiction requires a tiny repair.

## Dependencies / prerequisites
- `docs/CANONICAL_DECISIONS.md` entries on `working_style` and handoff ownership.
- Handoff contracts under `docs/handoff/`.
- Existing specialist set under `agents/specialists/`.

## Required read set
- `AGENTS.md`
- `INDEX.md`
- `docs/WORKFLOW.md`
- `docs/CANONICAL_DECISIONS.md`
- `agents/AGENT_DEFINITION_CONTRACT.md`
- `agents/specialists/_SPECIALISTS_INDEX.md`
- `agents/specialists/planner.md`
- `agents/specialists/reviewer.md`
- `agents/specialists/builder.md`
- `agents/specialists/tester.md`
- `docs/handoff/HANDOFF_CONTRACT.md`
- `docs/handoff/NEXT_TASK_CONTRACT.md`
- `docs/handoff/TASK_PACKET_CONTRACT.md`
- `docs/handoff/RESULT_PACKET_CONTRACT.md`
- `docs/handoff/_HANDOFF_INDEX.md`
- `docs/handoff/CURRENT_STATUS.md`
- `docs/handoff/TASK_QUEUE.md`
- `docs/handoff/OPEN_DECISIONS.md`
- `docs/handoff/DECISION_LOG.md`

## Allowed write set
- `agents/specialists/_SPECIALISTS_INDEX.md`
- `agents/specialists/planner.md`
- `agents/specialists/reviewer.md`
- `agents/specialists/builder.md`
- `agents/specialists/tester.md`
- `docs/handoff/NEXT_TASK.md`
- `docs/handoff/CURRENT_STATUS.md`
- `docs/handoff/TASK_QUEUE.md`
- `docs/handoff/OPEN_DECISIONS.md`
- `docs/handoff/_HANDOFF_INDEX.md`
- `docs/WORKFLOW.md`
- `INDEX.md`
- `docs/handoff/DECISION_LOG.md` (only if a new durable decision is required)

## Constraints
- Keep changes minimal and targeted to specialist execution readiness.
- Treat repository bundle state and downstream task packets as distinct layers.
- Do not broaden specialist scope while improving execution readiness.
- Do not treat `NEXT_TASK.md` as a downstream packet.
- Preserve orchestrator-first routing and narrow-default downstream access.

## Implementation notes
- Prefer additive clarifications and narrow conformance edits.
- Use existing contract vocabulary verbatim where possible.
- If blocked by unresolved policy, record it in `OPEN_DECISIONS.md` instead of guessing.

## Subtasks
- Confirm specialist definitions remain contract-conformant during execution-readiness updates.
- Ensure handoff and routing docs continue to distinguish bundle state from packetized downstream work.
- Record final state transitions in handoff docs at loop close.

## Validation level
`local_consistency_check`

## Acceptance criteria
- Specialist layer is execution-ready within current contract boundaries.
- Touched docs remain internally consistent and use contract vocabulary.
- Handoff state documents agree on active bundle and queue progression.

## Verification checklist
- Confirm all touched file references exist.
- Confirm specialist docs and index are mutually consistent.
- Confirm `NEXT_TASK.md`, `CURRENT_STATUS.md`, and `TASK_QUEUE.md` agree on active/queued status.
- Confirm no out-of-scope redesign work was introduced.

## Risks / rollback notes
- Risk: incidental scope expansion into teams/sequences.
  - Mitigation: enforce strict scope-out list and escalate instead of broadening.
- Risk: bundle/packet terminology drift.
  - Mitigation: check touched routing/handoff docs for consistent terms.

## Escalation conditions
- Required execution-readiness change would exceed allowed write scope.
- Contract docs contain unresolved contradictions that block safe interpretation.
- A durable policy decision is required to proceed and cannot be inferred safely.
