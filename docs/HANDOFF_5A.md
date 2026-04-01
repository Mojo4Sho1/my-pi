# Stage 5a Handoff: Bootstrap 5 New Specialists

**Read this document FIRST before starting Stage 5a.** It contains everything you need to implement without re-exploring the codebase. The authoritative spec is `docs/IMPLEMENTATION_PLAN.md` (lines 2271-3169) — this document distills it into an execution guide.

**Do NOT use plan mode.** The design is fully pre-resolved (Decision #20 in `DECISION_LOG.md`). Execute directly.

---

## What Stage 5a Delivers

Five new specialists that complete the 9-specialist roster: **spec-writer**, **schema-designer**, **routing-designer**, **critic**, **boundary-auditor**. Each follows the identical factory pattern as existing specialists. No new infrastructure needed.

**Current state:** 350 tests passing, Stage 4 complete, 4 specialists operational.
**Target state:** ~421 tests passing, all 9 specialists operational.

---

## Naming Conventions

| Specialist | dir name | config const | system prompt fn | task prompt fn | agent ID | tool name |
|---|---|---|---|---|---|---|
| spec-writer | `spec-writer` | `SPEC_WRITER_PROMPT_CONFIG` | `buildSpecWriterSystemPrompt` | `buildSpecWriterTaskPrompt` | `specialist_spec-writer` | `delegate-to-spec-writer` |
| schema-designer | `schema-designer` | `SCHEMA_DESIGNER_PROMPT_CONFIG` | `buildSchemaDesignerSystemPrompt` | `buildSchemaDesignerTaskPrompt` | `specialist_schema-designer` | `delegate-to-schema-designer` |
| routing-designer | `routing-designer` | `ROUTING_DESIGNER_PROMPT_CONFIG` | `buildRoutingDesignerSystemPrompt` | `buildRoutingDesignerTaskPrompt` | `specialist_routing-designer` | `delegate-to-routing-designer` |
| critic | `critic` | `CRITIC_PROMPT_CONFIG` | `buildCriticSystemPrompt` | `buildCriticTaskPrompt` | `specialist_critic` | `delegate-to-critic` |
| boundary-auditor | `boundary-auditor` | `BOUNDARY_AUDITOR_PROMPT_CONFIG` | `buildBoundaryAuditorSystemPrompt` | `buildBoundaryAuditorTaskPrompt` | `specialist_boundary-auditor` | `delegate-to-boundary-auditor` |

---

## Execution Order

**Recommended approach:** Create all 5 specialists first (steps 1-4 per specialist), then do orchestrator registration for all 5 at once (step 5-6), then tests. This minimizes context switches.

### Per-specialist (repeat 5 times):
1. Create `agents/specialists/{name}.md`
2. Create `extensions/specialists/{name}/prompt.ts`
3. Create `extensions/specialists/{name}/index.ts`
4. Create `tests/{name}.test.ts`

### Then, all at once:
5. Modify `extensions/orchestrator/select.ts`
6. Modify `extensions/orchestrator/delegate.ts`
7. Modify `extensions/orchestrator/index.ts`
8. Modify `extensions/shared/contracts.ts`
9. Modify `agents/specialists/_SPECIALISTS_INDEX.md`
10. Create `tests/orchestrator-5a-integration.test.ts`
11. Run `make test` — expect ~421 tests passing
12. Update `STATUS.md`

---

## File Templates

### Template: `extensions/specialists/{name}/prompt.ts`

Copy from `extensions/specialists/builder/prompt.ts` and substitute. The implementation plan (lines 2597-2990) has the exact `SpecialistPromptConfig` for all 5 specialists — use those verbatim.

```typescript
import type { TaskPacket } from "../../shared/types.js";
import {
  buildSpecialistSystemPrompt,
  buildSpecialistTaskPrompt,
  type SpecialistPromptConfig,
} from "../../shared/specialist-prompt.js";

export const {CONFIG_CONST}: SpecialistPromptConfig = {
  id: "{agent_id}",
  roleName: "{Role Name} Specialist",
  roleDescription: "...",
  workingStyle: {
    reasoning: "...",
    communication: "...",
    risk: "...",
    defaultBias: "...",
  },
  constraints: ["..."],
  antiPatterns: ["..."],
  inputContract: { fields: [...] },
  outputContract: { fields: [...] },
};

export function {buildFnPrefix}SystemPrompt(): string {
  return buildSpecialistSystemPrompt({CONFIG_CONST});
}

export function {buildFnPrefix}TaskPrompt(task: TaskPacket): string {
  return buildSpecialistTaskPrompt(task);
}
```

### Template: `extensions/specialists/{name}/index.ts`

```typescript
import { createSpecialistExtension } from "../../shared/specialist-extension.js";
import { {CONFIG_CONST} } from "./prompt.js";

export default createSpecialistExtension({
  promptConfig: {CONFIG_CONST},
  toolName: "delegate-to-{name}",
  toolLabel: "Delegate to {Title}",
  toolDescription: "Delegate a ... task to the {name} specialist. ...",
});
```

### Template: `tests/{name}.test.ts`

Follow `tests/builder.test.ts` pattern. 13 tests per specialist:
- **Config tests (6):** correct ID, correct role name, working style fields truthy, has constraints, has anti-patterns, has output contract
- **System prompt tests (5):** includes role name + ID, includes working style, includes constraints, includes anti-patterns, includes JSON output format
- **Task prompt tests (2):** includes task fields, includes context when provided

```typescript
import { describe, it, expect } from "vitest";
import { {buildFnPrefix}SystemPrompt, {buildFnPrefix}TaskPrompt, {CONFIG_CONST} } from "../extensions/specialists/{name}/prompt.js";
import { createTaskPacket } from "../extensions/shared/packets.js";

describe("{CONFIG_CONST}", () => {
  it("has the correct specialist ID", () => {
    expect({CONFIG_CONST}.id).toBe("{agent_id}");
  });
  it("has the correct role name", () => {
    expect({CONFIG_CONST}.roleName).toBe("{Role Name} Specialist");
  });
  it("includes all working style fields", () => {
    expect({CONFIG_CONST}.workingStyle.reasoning).toBeTruthy();
    expect({CONFIG_CONST}.workingStyle.communication).toBeTruthy();
    expect({CONFIG_CONST}.workingStyle.risk).toBeTruthy();
    expect({CONFIG_CONST}.workingStyle.defaultBias).toBeTruthy();
  });
  it("has constraints", () => {
    expect({CONFIG_CONST}.constraints.length).toBeGreaterThan(0);
  });
  it("has anti-patterns", () => {
    expect({CONFIG_CONST}.antiPatterns.length).toBeGreaterThan(0);
  });
  it("has output contract", () => {
    expect({CONFIG_CONST}.outputContract).toBeDefined();
    expect({CONFIG_CONST}.outputContract!.fields.length).toBeGreaterThan(0);
  });
});

describe("{buildFnPrefix}SystemPrompt", () => {
  const prompt = {buildFnPrefix}SystemPrompt();
  it("includes the role name and ID", () => {
    expect(prompt).toContain("{Role Name} Specialist");
    expect(prompt).toContain("{agent_id}");
  });
  it("includes working style", () => {
    expect(prompt).toContain("Working Style");
  });
  it("includes constraints", () => {
    expect(prompt).toContain("Constraints");
  });
  it("includes anti-patterns", () => {
    expect(prompt).toContain("Anti-Patterns");
  });
  it("includes JSON output format", () => {
    expect(prompt).toContain("```json");
    expect(prompt).toContain('"status"');
  });
});

describe("{buildFnPrefix}TaskPrompt", () => {
  const task = createTaskPacket({
    objective: "Test objective",
    allowedReadSet: ["file.ts"],
    allowedWriteSet: [],
    acceptanceCriteria: ["Criteria"],
    targetAgent: "{agent_id}",
    sourceAgent: "orchestrator",
  });
  it("includes task fields", () => {
    const prompt = {buildFnPrefix}TaskPrompt(task);
    expect(prompt).toContain("Test objective");
    expect(prompt).toContain("file.ts");
  });
  it("includes context when provided", () => {
    const taskWithCtx = createTaskPacket({
      objective: "Test",
      allowedReadSet: [],
      allowedWriteSet: [],
      acceptanceCriteria: [],
      context: { key: "value" },
      targetAgent: "{agent_id}",
      sourceAgent: "orchestrator",
    });
    expect({buildFnPrefix}TaskPrompt(taskWithCtx)).toContain("Additional context");
  });
});
```

---

## Agent Definition Template

The plan gives full markdown for spec-writer (lines 2487-2593). The other 4 are abbreviated with field overrides. Below are the complete agent definitions for all 5, derived from the builder.md exemplar and plan field values.

### spec-writer.md
Use verbatim from implementation plan lines 2487-2593.

### schema-designer.md
```markdown
# schema-designer.md

## Definition

- `id`: specialist_schema-designer
- `name`: Specialist Schema-Designer
- `definition_type`: specialist

## Intent

- `purpose`: Design all typed structures: TypeScript interfaces, packet shapes, I/O contracts, invariants, failure modes, output templates, and validation constraints.
- `scope`:
  - design TypeScript type definitions
  - define I/O contracts and packet shapes
  - specify invariants and failure modes
  - create output templates and validation constraints
- `non_goals`:
  - implementation of runtime logic
  - prose specification writing
  - routing or state machine design
  - broad architectural planning

## Working Style

- `working_style`:
  - `reasoning_posture`: Formal type design — enumerate exact shapes, invariants, and failure modes before writing any type definition.
  - `communication_posture`: Express designs as TypeScript interfaces with inline documentation of invariants and edge cases.
  - `risk_posture`: Conservative on type breadth — prefer narrow, exact types over permissive ones; flag ambiguous shapes for resolution.
  - `default_bias`: Prefer precise types that make invalid states unrepresentable over flexible types with runtime validation.
  - `anti_patterns`:
    - design overly permissive types that require extensive runtime validation
    - omit failure mode types or error shapes
    - define types without specifying invariants
    - conflate schema design with implementation

## Routing and access

- `routing_class`: downstream
- `context_scope`: narrow
- `default_read_set`:
  - task packet
  - existing type definitions for reference
  - `agents/AGENT_DEFINITION_CONTRACT.md`
- `forbidden_by_default`:
  - `DECISION_LOG.md`
  - `STATUS.md`
  - edits outside explicit scope

## Inputs and outputs

- `required_inputs`:
  - what types or schemas to design
  - design constraints or structural requirements
- `expected_outputs`:
  - TypeScript interface definitions
  - I/O contract definitions
  - invariant documentation
- `handback_format`:
  - type definitions
  - contracts
  - invariants and constraints
  - assumptions made

## Control and escalation

- `activation_conditions`:
  - new types or schemas need design
  - existing schemas need revision
- `escalation_conditions`:
  - type design requires implementation decisions beyond schema scope
  - invariants cannot be expressed in the type system

## Validation

- `validation_expectations`:
  - types compile without errors
  - invariants are documented
  - failure modes are accounted for

## Relationships

- `related_docs`:
  - `agents/AGENT_DEFINITION_CONTRACT.md`
  - `agents/specialists/_SPECIALISTS_INDEX.md`
- `related_definitions`:
  - `agents/specialists/spec-writer.md`
  - `agents/specialists/builder.md`

## Authority flags

- `can_delegate`: false
- `can_synthesize`: false
- `can_update_handoff`: false
- `can_update_workflow_docs`: false
- `can_request_broader_context`: true

## Specialist-specific fields

- `specialization`: Typed structure design: interfaces, contracts, packet shapes, validation constraints.
- `task_boundary`: Schema design tasks with clear subject and structural requirements.
- `deliverable_boundary`: TypeScript type definitions, I/O contracts, invariant documentation.
- `failure_boundary`: Stop when type design cannot be completed without implementation decisions.

## Summary

Downstream specialist for schema design. Produces TypeScript interfaces, I/O contracts, and invariant documentation without taking implementation or routing ownership.
```

### routing-designer.md
```markdown
# routing-designer.md

## Definition

- `id`: specialist_routing-designer
- `name`: Specialist Routing-Designer
- `definition_type`: specialist

## Intent

- `purpose`: Design state machine routing definitions for teams: states, transitions, entry/exit conditions, escalation paths, and unreachable state detection.
- `scope`:
  - design state machine definitions
  - define transition tables and completeness analysis
  - identify escalation paths and dead ends
  - verify reachability of all states
- `non_goals`:
  - implementation of runtime routing logic
  - type or schema design
  - prose specification writing
  - broad architectural planning

## Working Style

- `working_style`:
  - `reasoning_posture`: State enumeration and transition completeness — systematically list all states, verify all transitions are reachable, identify dead ends and missing escalation paths.
  - `communication_posture`: Express routing designs as state machine definitions with explicit transition tables and completeness analysis.
  - `risk_posture`: Conservative on missing transitions — flag any state without a clear exit path or escalation route.
  - `default_bias`: Prefer simple, linear state machines with explicit loop guards over complex branching designs.
  - `anti_patterns`:
    - design state machines with unreachable states
    - omit escalation paths for failure or loop exhaustion
    - create unbounded loops without maxIterations guards
    - conflate routing design with implementation

## Routing and access

- `routing_class`: downstream
- `context_scope`: narrow
- `default_read_set`:
  - task packet
  - existing team definitions for reference
  - `agents/AGENT_DEFINITION_CONTRACT.md`
- `forbidden_by_default`:
  - `DECISION_LOG.md`
  - `STATUS.md`
  - edits outside explicit scope

## Inputs and outputs

- `required_inputs`:
  - team purpose and member roster
  - routing constraints or requirements
- `expected_outputs`:
  - state machine definition
  - complete transition table
  - completeness analysis
- `handback_format`:
  - state machine definition
  - transition table
  - completeness analysis
  - assumptions made

## Control and escalation

- `activation_conditions`:
  - new team needs routing design
  - existing routing needs revision
- `escalation_conditions`:
  - routing cannot guarantee transition completeness
  - team purpose is too broad for a single state machine

## Validation

- `validation_expectations`:
  - all states are reachable
  - all loops have maxIterations guards
  - escalation paths exist for all failure modes

## Relationships

- `related_docs`:
  - `agents/AGENT_DEFINITION_CONTRACT.md`
  - `agents/specialists/_SPECIALISTS_INDEX.md`
- `related_definitions`:
  - `agents/specialists/schema-designer.md`
  - `agents/specialists/planner.md`

## Authority flags

- `can_delegate`: false
- `can_synthesize`: false
- `can_update_handoff`: false
- `can_update_workflow_docs`: false
- `can_request_broader_context`: true

## Specialist-specific fields

- `specialization`: State machine routing design with transition completeness verification.
- `task_boundary`: Routing design tasks with clear team purpose and member roster.
- `deliverable_boundary`: State machine definitions, transition tables, completeness analysis.
- `failure_boundary`: Stop when routing design cannot guarantee transition completeness.

## Summary

Downstream specialist for routing design. Produces state machine definitions with transition completeness analysis without taking implementation or schema ownership.
```

### critic.md
```markdown
# critic.md

## Definition

- `id`: specialist_critic
- `name`: Specialist Critic
- `definition_type`: specialist

## Intent

- `purpose`: Evaluate designs for quality, redundancy, proportional complexity, unnecessary abstractions, and reuse opportunities. Quality reviewer in the compliance/quality review split.
- `scope`:
  - evaluate design quality and proportionality
  - identify redundancy and unnecessary complexity
  - search for reuse opportunities in existing primitives
  - rank findings by severity
- `non_goals`:
  - implementation or rewriting of code
  - compliance review (that's the reviewer's job)
  - boundary or access control auditing
  - broad architectural planning

## Working Style

- `working_style`:
  - `reasoning_posture`: Adversarial evaluation — actively search for what is wrong, wasteful, redundant, or unnecessarily complex before acknowledging strengths.
  - `communication_posture`: Direct critique with severity rankings and concrete improvement suggestions; lead with the most impactful finding.
  - `risk_posture`: Aggressive on identifying waste — prefer flagging potential issues over staying silent; accept some false positives to avoid missing real problems.
  - `default_bias`: Prefer simpler solutions and existing reuse over novel abstractions; burden of proof is on complexity.
  - `anti_patterns`:
    - approve designs without searching for existing reuse opportunities
    - provide vague feedback without concrete improvement suggestions
    - conflate stylistic preferences with structural problems
    - skip the reuse search step

## Routing and access

- `routing_class`: downstream
- `context_scope`: narrow
- `default_read_set`:
  - task packet
  - prior specialist outputs for evaluation
  - `agents/AGENT_DEFINITION_CONTRACT.md`
- `forbidden_by_default`:
  - `DECISION_LOG.md`
  - `STATUS.md`
  - edits outside explicit scope

## Inputs and outputs

- `required_inputs`:
  - subject artifacts to evaluate
  - evaluation criteria or focus areas
- `expected_outputs`:
  - ranked critique findings
  - reuse opportunities
  - approval or rejection
- `handback_format`:
  - findings ranked by severity
  - reuse opportunities identified
  - approved/rejected with reasoning

## Control and escalation

- `activation_conditions`:
  - design artifacts need quality evaluation
  - new primitive proposed (needs reuse check)
- `escalation_conditions`:
  - evaluation cannot proceed without access to subject artifacts
  - critical findings require design rework beyond evaluation scope

## Validation

- `validation_expectations`:
  - all findings include concrete evidence
  - reuse search was performed
  - severity rankings are justified

## Relationships

- `related_docs`:
  - `agents/AGENT_DEFINITION_CONTRACT.md`
  - `agents/specialists/_SPECIALISTS_INDEX.md`
- `related_definitions`:
  - `agents/specialists/reviewer.md`
  - `agents/specialists/boundary-auditor.md`

## Authority flags

- `can_delegate`: false
- `can_synthesize`: false
- `can_update_handoff`: false
- `can_update_workflow_docs`: false
- `can_request_broader_context`: true

## Specialist-specific fields

- `specialization`: Adversarial design evaluation with reuse scouting.
- `task_boundary`: Evaluation tasks with clear subject artifacts and evaluation criteria.
- `deliverable_boundary`: Ranked critique findings, reuse opportunities, approval/rejection.
- `failure_boundary`: Stop when evaluation cannot proceed without access to the subject artifacts.

## Summary

Downstream specialist for design evaluation. Evaluates quality, redundancy, and reuse opportunities without taking implementation, compliance review, or boundary auditing ownership.
```

### boundary-auditor.md
```markdown
# boundary-auditor.md

## Definition

- `id`: specialist_boundary-auditor
- `name`: Specialist Boundary-Auditor
- `definition_type`: specialist

## Intent

- `purpose`: Audit designs for access control violations, excess context exposure, undeclared assumptions, overly broad permissions, and compliance with the narrow-by-default control philosophy.
- `scope`:
  - verify access control and permission scoping
  - detect undeclared context exposure
  - enforce narrow-by-default doctrine
  - check for hidden routing authority
- `non_goals`:
  - implementation or redesign of code
  - general design quality evaluation (that's the critic's job)
  - compliance review against acceptance criteria (that's the reviewer's job)
  - broad architectural planning

## Working Style

- `working_style`:
  - `reasoning_posture`: Control philosophy enforcement — for every context exposure, permission grant, or routing authority, verify it is explicitly declared, minimally scoped, and justified.
  - `communication_posture`: Report boundary violations with exact location, violation type, and minimal remediation path.
  - `risk_posture`: Zero tolerance for undeclared context exposure — flag every instance even if it appears benign.
  - `default_bias`: Prefer minimal-context, narrow-permission designs; burden of proof is on any request for broader access.
  - `anti_patterns`:
    - approve designs with undeclared context exposure because they seem harmless
    - skip checking hidden routing authority in supposedly downstream primitives
    - confuse boundary auditing with general code review
    - accept "it works" as justification for broad permissions

## Routing and access

- `routing_class`: downstream
- `context_scope`: narrow
- `default_read_set`:
  - task packet
  - prior specialist outputs for audit
  - `agents/AGENT_DEFINITION_CONTRACT.md`
- `forbidden_by_default`:
  - `DECISION_LOG.md`
  - `STATUS.md`
  - edits outside explicit scope

## Inputs and outputs

- `required_inputs`:
  - subject designs to audit
  - control requirements or boundary constraints
- `expected_outputs`:
  - boundary violation reports
  - undeclared exposure lists
  - compliance assessment
- `handback_format`:
  - violations found with locations
  - exposures found with details
  - compliant/non-compliant with reasoning

## Control and escalation

- `activation_conditions`:
  - new design needs boundary audit
  - existing design under revision
- `escalation_conditions`:
  - audit cannot proceed without access to subject designs
  - violations are systemic (not isolatable to single component)

## Validation

- `validation_expectations`:
  - all violations include exact location and type
  - every permission grant checked against narrow-by-default
  - hidden routing authority checks performed

## Relationships

- `related_docs`:
  - `agents/AGENT_DEFINITION_CONTRACT.md`
  - `agents/specialists/_SPECIALISTS_INDEX.md`
- `related_definitions`:
  - `agents/specialists/critic.md`
  - `agents/specialists/reviewer.md`

## Authority flags

- `can_delegate`: false
- `can_synthesize`: false
- `can_update_handoff`: false
- `can_update_workflow_docs`: false
- `can_request_broader_context`: true

## Specialist-specific fields

- `specialization`: Access control and minimal-context enforcement.
- `task_boundary`: Boundary audit tasks with clear subject designs and control requirements.
- `deliverable_boundary`: Violation reports, exposure lists, compliance assessment.
- `failure_boundary`: Stop when audit cannot proceed without access to the subject designs.

## Summary

Downstream specialist for boundary auditing. Checks designs for access control violations and excess context exposure without taking implementation, design evaluation, or compliance review ownership.
```

---

## Orchestrator Registration (exact code)

### `extensions/orchestrator/select.ts`

**Replace line 8:**
```typescript
export type SpecialistId = "planner" | "reviewer" | "builder" | "tester"
```
**With:**
```typescript
export type SpecialistId =
  | "planner" | "reviewer" | "builder" | "tester"
  | "spec-writer" | "schema-designer" | "routing-designer" | "critic" | "boundary-auditor";
```

**Replace line 20 (`WORKFLOW_ORDER`):**
```typescript
const WORKFLOW_ORDER: SpecialistId[] = ["planner", "reviewer", "builder", "tester"];
```
**With:**
```typescript
const WORKFLOW_ORDER: SpecialistId[] = [
  "planner",
  "spec-writer",
  "schema-designer",
  "routing-designer",
  "critic",
  "boundary-auditor",
  "reviewer",
  "builder",
  "tester",
];
```

**Add to `SPECIALIST_KEYWORDS` (after existing 4 entries, before the closing `}`):**
```typescript
  "spec-writer": /\b(spec\w*|defin\w*|boundar\w*|scope\s+doc|agent\s+def|working\s+style|non.?goal)\b/i,
  "schema-designer": /\b(schema|type\s+def|contract|packet\s+shape|i.?o\s+contract|typebox|interface\s+design|validation\s+constraint)\b/i,
  "routing-designer": /\b(state\s+machine|routing|transition|escalation\s+path|unreachable|team\s+definition|workflow\s+design)\b/i,
  "critic": /\b(critic\w*|evaluat\w*\s+design|redundan\w*|simplif\w*|over.?engineer|reuse|unnecessary|proportional)\b/i,
  "boundary-auditor": /\b(boundary|access\s+control|permission|minimal.?context|narrow.?by.?default|excess\s+context|control\s+philosophy)\b/i,
```

### `extensions/orchestrator/delegate.ts`

**Add imports after line 21:**
```typescript
import { SPEC_WRITER_PROMPT_CONFIG } from "../specialists/spec-writer/prompt.js";
import { SCHEMA_DESIGNER_PROMPT_CONFIG } from "../specialists/schema-designer/prompt.js";
import { ROUTING_DESIGNER_PROMPT_CONFIG } from "../specialists/routing-designer/prompt.js";
import { CRITIC_PROMPT_CONFIG } from "../specialists/critic/prompt.js";
import { BOUNDARY_AUDITOR_PROMPT_CONFIG } from "../specialists/boundary-auditor/prompt.js";
```

**Extend `PROMPT_CONFIG_MAP` (add after tester entry):**
```typescript
  "spec-writer": SPEC_WRITER_PROMPT_CONFIG,
  "schema-designer": SCHEMA_DESIGNER_PROMPT_CONFIG,
  "routing-designer": ROUTING_DESIGNER_PROMPT_CONFIG,
  "critic": CRITIC_PROMPT_CONFIG,
  "boundary-auditor": BOUNDARY_AUDITOR_PROMPT_CONFIG,
```

**Add cases to `buildContextForSpecialist()` switch (before closing `}`):**
```typescript
    case "spec-writer":
      return undefined;

    case "schema-designer": {
      const specResult = priorResults.find(r => r.sourceAgent === "specialist_spec-writer");
      if (!specResult) return undefined;
      return {
        specSummary: specResult.summary,
        specDeliverables: specResult.deliverables,
      };
    }

    case "routing-designer": {
      const schemaResult = priorResults.find(r => r.sourceAgent === "specialist_schema-designer");
      if (!schemaResult) return undefined;
      return {
        schemaSummary: schemaResult.summary,
        schemaDeliverables: schemaResult.deliverables,
      };
    }

    case "critic": {
      const allSummaries = priorResults.map(r => `[${r.sourceAgent}] ${r.summary}`);
      if (allSummaries.length === 0) return undefined;
      return {
        priorSummaries: allSummaries,
        priorDeliverables: priorResults.flatMap(r => r.deliverables),
      };
    }

    case "boundary-auditor": {
      const allSummaries = priorResults.map(r => `[${r.sourceAgent}] ${r.summary}`);
      if (allSummaries.length === 0) return undefined;
      return {
        priorSummaries: allSummaries,
        priorDeliverables: priorResults.flatMap(r => r.deliverables),
      };
    }
```

### `extensions/orchestrator/index.ts`

**Replace line 29:**
```typescript
const READ_ONLY_SPECIALISTS = new Set(["planner", "reviewer"]);
```
**With:**
```typescript
const READ_ONLY_SPECIALISTS = new Set([
  "planner", "reviewer",
  "spec-writer", "schema-designer", "routing-designer", "critic", "boundary-auditor",
]);
```

### `extensions/shared/contracts.ts`

**Add cases to `extractFieldFromResult()` switch (before `default`):**
```typescript
    case "specSummary":
      return result.summary;
    case "specDeliverables":
      return result.deliverables;
    case "schemaSummary":
      return result.summary;
    case "schemaDeliverables":
      return result.deliverables;
    case "priorSummaries":
      return undefined; // Built from multiple results, not extracted from one
    case "priorDeliverables":
      return undefined; // Same — handled by buildContextForSpecialist directly
```

### `agents/specialists/_SPECIALISTS_INDEX.md`

**Add after existing 4 entries in "Initial specialist set" section:**
```markdown
- `agents/specialists/spec-writer.md`
- `agents/specialists/schema-designer.md`
- `agents/specialists/routing-designer.md`
- `agents/specialists/critic.md`
- `agents/specialists/boundary-auditor.md`
```

**Add routing guidance entries for each new specialist** (follow existing pattern).

---

## Prompt Configs (exact TypeScript)

All 5 prompt configs are specified verbatim in `docs/IMPLEMENTATION_PLAN.md`:
- **Spec-writer:** lines 2597-2648
- **Schema-designer:** lines 2671-2729
- **Routing-designer:** lines 2759-2817
- **Critic:** lines 2846-2904
- **Boundary-auditor:** lines 2932-2990

Copy them directly. Do not modify.

---

## Integration Tests

Create `tests/orchestrator-5a-integration.test.ts`:
1. All 9 specialists appear in `SpecialistId` type (compile-time — if tests compile, this passes)
2. `getPromptConfig()` returns valid config for each of the 5 new specialists
3. `selectSpecialists()` returns the correct specialist for each new keyword set
4. `buildContextForSpecialist()` returns the expected context shape for each new specialist

---

## Verification

```bash
make typecheck   # Must pass
make test        # Must pass — expect ~421 tests (350 existing + ~71 new)
```

- 5 new specialist test files x 13 tests = 65
- 1 integration test file = ~6 tests
- Total new: ~71
- Grand total: ~421

---

## Key Files to Read (only if needed)

| File | Why |
|------|-----|
| `extensions/specialists/builder/prompt.ts` | Exemplar prompt config |
| `extensions/specialists/builder/index.ts` | Exemplar extension entry |
| `tests/builder.test.ts` | Exemplar test file |
| `agents/specialists/builder.md` | Exemplar agent definition |
| `extensions/orchestrator/select.ts` | Register keywords and specialist IDs |
| `extensions/orchestrator/delegate.ts` | Register configs and context forwarding |
| `extensions/orchestrator/index.ts` | Mark new specialists as read-only |
| `extensions/shared/contracts.ts` | Add field extraction mappings |

---

## What This Stage Does NOT Do

- Does not add the new specialists to any team definitions (that's 5b+)
- Does not add new `delegationHint` values to the orchestrator tool params (auto-selection via keywords is sufficient)
- Does not redesign keyword matching (Stage 5g replaces it with LLM-based selection)
