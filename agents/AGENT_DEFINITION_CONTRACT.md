# Agent Definition Contract

Required fields, routing rules, and type-specific expectations for orchestrator, specialist, team, and sequence definitions. Route eligibility is a property of the definition itself; actors do not decide their own access scope.

> These field contracts will be mirrored as TypeScript interfaces in `extensions/shared/types.ts`.

---

## Definition Classes

| Class | Role |
|---|---|
| **orchestrator** | Top-level coordinator. Reads broad state, delegates, synthesizes, updates project state. |
| **specialist** | Primitive execution unit. Narrow context, bounded input/output. |
| **team** | Reusable collaboration bundle grouping specialists around a recurring class of work. |
| **sequence** | Reusable staged workflow invoking specialists, teams, or both. |

---

## Common Required Fields

**Identity**: `id` (stable machine-friendly identifier), `name` (human-readable), `definition_type` (orchestrator | specialist | team | sequence)

**Intent**: `purpose` (what it exists to do), `scope` (work inside its boundary), `non_goals` (what it must not attempt)

**Routing and access**: `routing_class` (orchestrator | downstream), `context_scope` (broad | narrow), `default_read_set` (docs readable by default), `forbidden_by_default` (docs excluded unless explicitly granted)

**Inputs and outputs**: `required_inputs` (what it must receive before acting), `expected_outputs` (what it returns), `handback_format` (structure of the returned result)

**Control and escalation**: `activation_conditions` (when to use this definition), `escalation_conditions` (when to hand control back or request broader context)

**Validation**: `validation_expectations` (checking/review/verification responsibilities)

**Relationships**: `related_docs` (relevant docs), `related_definitions` (commonly co-used definitions)

---

## Access and Authority Fields

All booleans. Defaults vary by class (see type-specific sections below).

| Field | Controls |
|---|---|
| `can_delegate` | May delegate work to other actors |
| `can_synthesize` | May integrate multiple results into one |
| `can_update_handoff` | May update handoff state documents |
| `can_update_workflow_docs` | May update workflow/orchestration docs |
| `can_request_broader_context` | May ask for more context when blocked (request != automatic permission) |

---

## Common Optional Fields

`notes`, `examples`, `recommended_task_types`, `disallowed_actions`, `allowed_actions`, `known_limitations`, `working_style`

---

## `working_style`

Execution-style control for consistent behavior across runs. Not a theatrical persona. If any `working_style` statement conflicts with scope, routing, or authority, the scope/routing/authority rule wins.

**Recommended subfields**: `reasoning_posture`, `communication_posture`, `risk_posture`, `default_bias`, `anti_patterns`

**Current-phase requirements**:
- Required for specialists
- Strongly recommended for orchestrators
- Optional for teams and sequences

---

## Type-Specific Required Fields

### Orchestrator

| Field | Description |
|---|---|
| `startup_read_order` | Ordered list of docs read at session start |
| `delegation_modes` | Allowed modes: direct specialist, multi-specialist, team, sequence, mixed |
| `state_update_responsibilities` | State artifacts it must maintain |
| `selection_policy` | Rule for choosing specialists/teams/sequences |

**Defaults**: `routing_class: orchestrator`, `context_scope: broad`, `can_delegate: true`, `can_synthesize: true`, `can_update_handoff: true`

### Specialist

| Field | Description |
|---|---|
| `specialization` | Narrow class of work it owns |
| `task_boundary` | Kinds of tasks it may accept |
| `deliverable_boundary` | Kinds of outputs it may produce |
| `failure_boundary` | When to stop and escalate |
| `working_style` | Required (see above) |

**Defaults**: `routing_class: downstream`, `context_scope: narrow`, `can_delegate: false`, `can_synthesize: false`, `can_update_handoff: false`

### Team

| Field | Description |
|---|---|
| `members` | Specialists in the team |
| `collaboration_pattern` | How members interact |
| `team_deliverable` | What the team returns as a whole |
| `member_context_policy` | What each member receives by default |

**Defaults**: `routing_class: downstream`, `context_scope: narrow`, `can_delegate: false`, `can_synthesize: true` only if explicitly designed, `can_update_handoff: false`

### Sequence

| Field | Description |
|---|---|
| `stages` | Ordered list of stages |
| `stage_actors` | Specialists/teams acting in each stage |
| `parallel_rules` | Stages that may run in parallel |
| `merge_points` | Where parallel outputs combine |
| `stop_conditions` | When to halt or return control upward |
| `sequence_deliverable` | What the sequence returns when complete |

**Defaults**: `routing_class: downstream`, `context_scope: narrow`, `can_delegate: false`, `can_synthesize: true` only if explicitly designed, `can_update_handoff: false`

---

## Naming Rules

- IDs: stable, machine-friendly (e.g., `orchestrator_main`, `specialist_planner`, `team_planning`, `sequence_feature_delivery`)
- Names: literal and human-readable
- Prefer consistency over creativity

---

## File Placement

- `agents/orchestrator.md`
- `agents/specialists/`
- `agents/teams/`
- `agents/sequences/`

---

## Authoring Rules

- Definitions must be short, explicit, and role-specific
- Define boundaries in operational terms, not vague claims ("helps with many things", "acts broadly")
- Written so a future agent can use them without guessing intent

---

## Minimum Acceptance Rule

A definition is incomplete unless it answers: what this actor is, what it does, what it does not do, how it behaves inside its boundary, what it may/must-not read by default, what it receives, what it returns, when it escalates, and whether it may update project state.

For specialists in the current phase, omission of `working_style` also makes the definition incomplete.
