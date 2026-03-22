# Next Task

Last updated: 2026-03-19
Owner: Joe + Codex
Status: active
Bundle ID: BUNDLE-20260319-identity-and-execution-artifact-model

## Task summary
Define the identity and execution artifact model that enables contract-governed runtime behavior: canonical IDs, packet families, YAML format, routing fields, packet contracts, and runtime artifact location.

## Why this bundle is next
Stage 0 (control-plane alignment) is complete. Stage 1 is the next dependency in the implementation plan — it provides the identity and packet foundations that Stage 2 (specialist hardening) requires.

## Objective
Establish canonical identity conventions and the minimum packet model needed for specialists to operate as contract-bound typed transformers with predictable I/O.

## Execution path
`direct_bundle_execution`

## Bundle owner
`top_level_executor`

## Scope (in)
- Define canonical ID naming conventions for first-class objects (specialists, teams, sequences, packet types, templates, seeds, adapters).
- Define the minimum useful packet families for the system (task, result, review, build, test, escalation at minimum).
- Formalize YAML as the canonical packet format.
- Define authoritative routing fields for packets.
- Define what a packet contract must specify.
- Define runtime artifact location strategy (`runs/` subtree separation from `docs/handoff/`).

## Scope (out)
- Implementing the routing runtime.
- Changing existing specialist definitions (that's Stage 2).
- Team or sequence definition work.
- Host-platform realization.
- Template taxonomy changes.
- Filesystem restructuring beyond establishing `runs/` convention.

## Dependencies / prerequisites
- `docs/PROJECT_FOUNDATION.md` (canonical identity doctrine, packet model, routing doctrine sections)
- `docs/IMPLEMENTATION_PLAN.md` (Stage 1 sub-stages 1.1-1.6)
- `agents/AGENT_DEFINITION_CONTRACT.md` (current identity fields)
- `docs/handoff/TASK_PACKET_CONTRACT.md` (existing packet contract for reference)
- `docs/handoff/RESULT_PACKET_CONTRACT.md` (existing result contract for reference)

## Required read set
- `AGENTS.md`
- `INDEX.md`
- `docs/WORKFLOW.md`
- `docs/PROJECT_FOUNDATION.md` (canonical identity doctrine, first-class object model, packet sections)
- `docs/IMPLEMENTATION_PLAN.md` (Stage 1)
- `docs/CANONICAL_DECISIONS.md`
- `agents/AGENT_DEFINITION_CONTRACT.md`
- `docs/handoff/TASK_PACKET_CONTRACT.md`
- `docs/handoff/RESULT_PACKET_CONTRACT.md`
- `agents/specialists/*.md` (current specialist ID patterns)

## Allowed write set
- New file: canonical ID conventions document (location TBD, likely `docs/` or a new spec)
- New file: packet taxonomy/families document
- New file: packet contract structure document (or updates to existing packet contracts)
- New file: runtime artifact location spec
- `docs/handoff/NEXT_TASK.md`
- `docs/handoff/CURRENT_STATUS.md`
- `docs/handoff/TASK_QUEUE.md`
- `docs/handoff/DECISION_LOG.md`
- `docs/handoff/OPEN_DECISIONS.md`

## Constraints
- Keep the packet model lean enough to remain adaptable — define minimum useful families, not exhaustive taxonomy.
- Canonical IDs must be human-readable, stable across renames, and unique within repository namespace.
- YAML is the canonical packet format per foundation doctrine.
- Runtime artifacts must be clearly separated from `docs/handoff/`.
- Do not force premature packet-type proliferation.
- Ground packet families in actual specialist I/O needs (planner, reviewer, builder, tester).

## Implementation notes
- Reference `docs/PROJECT_FOUNDATION.md` sections on canonical identity doctrine (lines 401-432), packets (lines 478-499), and routing doctrine (lines 921-954) as authoritative guidance.
- Reference `docs/IMPLEMENTATION_PLAN.md` Stage 1 sub-stages (1.1-1.6) for detailed deliverable expectations.
- The existing `TASK_PACKET_CONTRACT.md` and `RESULT_PACKET_CONTRACT.md` are repository-level handoff contracts. Stage 1 packet work defines the execution-level packet model that specialists produce and consume.
- Consider whether existing specialist IDs (`specialist_planner`, etc.) already follow a sufficient canonical ID pattern or need formalization.

## Subtasks
1. Define canonical ID naming conventions and document them.
2. Define packet families grounded in specialist I/O (task packet, result variants per specialist type, escalation, team transition).
3. Formalize YAML as canonical packet format with initial structural expectations.
4. Define authoritative routing fields (packet type, producer, status, terminal meaning, escalation, target).
5. Define packet-contract expectations (what a valid packet contract must specify).
6. Define runtime artifact location strategy (`runs/` subtree).

## Validation level
`local_consistency_check`

## Acceptance criteria
- Canonical ID conventions are defined and documented.
- Packet families are defined well enough to support specialist I/O in Stage 2.
- YAML is explicitly established as the canonical packet format.
- Authoritative routing fields are declared.
- Packet contracts have a defined structure.
- Runtime artifact location is decided and documented.

## Verification checklist
- Confirm canonical ID conventions cover all first-class object types listed in the foundation.
- Confirm packet families map to specialist input/output needs.
- Confirm routing fields are explicit enough for future routing enforcement.
- Confirm runtime artifact location is clearly separated from `docs/handoff/`.
- Confirm no contradictions with existing `TASK_PACKET_CONTRACT.md` or `RESULT_PACKET_CONTRACT.md`.

## Risks / rollback notes
- Risk: over-designing the packet taxonomy before real usage.
  - Mitigation: define minimum families only; defer expansion until teams exercise the model.
- Risk: canonical ID conventions that are too rigid or too loose.
  - Mitigation: test conventions against existing specialist IDs and projected team/sequence IDs before finalizing.

## Escalation conditions
- Packet model design creates unresolvable tension with existing handoff packet contracts.
- Canonical ID conventions conflict with host-platform naming constraints.
- Runtime artifact location strategy conflicts with repository governance doctrine.
