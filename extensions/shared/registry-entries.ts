/**
 * Manual registry entries for all 9 specialists (Stage 5a).
 *
 * Data file — no runtime service. The registry service comes in Stage 5g.
 * Creator teams (5b+) must emit a PrimitiveRegistryEntry as part of their output.
 */

import type { PrimitiveRegistryEntry } from "./types.js";

export const SPECIALIST_REGISTRY_ENTRIES: PrimitiveRegistryEntry[] = [
  {
    id: "specialist_planner",
    version: "1.0.0",
    kind: "specialist",
    purpose: "Structured decomposition, dependency mapping, risk identification, and actionable next-step planning.",
    inputContract: [],
    outputContract: [
      { name: "planSteps", type: "string[]", required: true, description: "Ordered implementation steps" },
      { name: "risks", type: "string[]", required: true, description: "Identified risks" },
    ],
    selectionHints: ["plan", "design", "strategy", "breakdown", "decompose", "architect"],
    status: "active",
  },
  {
    id: "specialist_reviewer",
    version: "1.0.0",
    kind: "specialist",
    purpose: "Compliance review: consistency, scope, and constraint verification against acceptance criteria.",
    inputContract: [
      { name: "modifiedFiles", type: "string[]", required: false, description: "Files to review" },
      { name: "implementationSummary", type: "string", required: false, description: "What to review" },
    ],
    outputContract: [
      { name: "verdict", type: "string", required: true, description: "Review verdict" },
      { name: "findings", type: "string[]", required: true, description: "Review findings" },
    ],
    selectionHints: ["review", "check", "evaluate", "audit", "inspect", "assess"],
    status: "active",
  },
  {
    id: "specialist_builder",
    version: "1.0.0",
    kind: "specialist",
    purpose: "Execute bounded implementation tasks within explicit scope.",
    inputContract: [
      { name: "planSummary", type: "string", required: false, description: "Summary of the plan" },
      { name: "planSteps", type: "string[]", required: false, description: "Steps from the planner" },
    ],
    outputContract: [
      { name: "modifiedFiles", type: "string[]", required: true, description: "Files that were modified" },
      { name: "changeDescription", type: "string", required: true, description: "Description of changes made" },
    ],
    selectionHints: ["implement", "build", "fix", "create", "add", "update", "refactor", "code", "write"],
    status: "active",
  },
  {
    id: "specialist_tester",
    version: "1.0.0",
    kind: "specialist",
    purpose: "Author focused tests, execution commands, and pass conditions that keep implementation honest.",
    inputContract: [
      { name: "modifiedFiles", type: "string[]", required: false, description: "Implementation files relevant to test authoring" },
      { name: "implementationSummary", type: "string", required: false, description: "What behavior the builder implemented" },
    ],
    outputContract: [
      { name: "testStrategy", type: "string", required: true, description: "How the authored tests prove the behavior" },
      { name: "testCasesAuthored", type: "string[]", required: true, description: "Focused test cases the builder should satisfy" },
      { name: "executionCommands", type: "string[]", required: true, description: "Commands the builder or runtime should execute" },
      { name: "expectedPassConditions", type: "string[]", required: true, description: "Expected pass conditions for the authored tests" },
      { name: "coverageNotes", type: "string[]", required: true, description: "Coverage notes and residual risk" },
    ],
    selectionHints: ["test", "validate", "verify", "assert", "confirm", "ensure"],
    status: "active",
  },
  {
    id: "specialist_spec-writer",
    version: "1.0.0",
    kind: "specialist",
    purpose: "Write exhaustive prose specifications with boundary-first framing.",
    inputContract: [],
    outputContract: [
      { name: "specification", type: "string", required: true, description: "The complete specification document" },
      { name: "nonGoals", type: "string[]", required: true, description: "Explicit non-goals" },
      { name: "openQuestions", type: "string[]", required: true, description: "Unresolved questions" },
    ],
    selectionHints: ["spec", "define", "boundary", "scope", "agent definition", "working style"],
    status: "active",
  },
  {
    id: "specialist_schema-designer",
    version: "1.0.0",
    kind: "specialist",
    purpose: "Design TypeScript interfaces, packet shapes, I/O contracts, invariants, and validation constraints.",
    inputContract: [
      { name: "specSummary", type: "string", required: false, description: "Specification summary from spec-writer" },
      { name: "specDeliverables", type: "string[]", required: false, description: "Specification deliverables" },
    ],
    outputContract: [
      { name: "typeDefinitions", type: "string", required: true, description: "TypeScript interface definitions" },
      { name: "contracts", type: "string", required: true, description: "I/O contract definitions" },
      { name: "invariants", type: "string[]", required: true, description: "Type invariants and constraints" },
    ],
    selectionHints: ["schema", "type definition", "contract", "packet shape", "interface design"],
    status: "active",
  },
  {
    id: "specialist_routing-designer",
    version: "1.0.0",
    kind: "specialist",
    purpose: "Design state machine routing definitions with transition completeness analysis.",
    inputContract: [
      { name: "schemaSummary", type: "string", required: false, description: "Schema design summary" },
      { name: "schemaDeliverables", type: "string[]", required: false, description: "Schema deliverables" },
    ],
    outputContract: [
      { name: "stateMachine", type: "string", required: true, description: "State machine definition" },
      { name: "transitionTable", type: "string", required: true, description: "Complete transition table" },
      { name: "completenessAnalysis", type: "string", required: true, description: "Analysis of reachability and completeness" },
    ],
    selectionHints: ["state machine", "routing", "transition", "escalation path", "team definition"],
    status: "active",
  },
  {
    id: "specialist_critic",
    version: "1.0.0",
    kind: "specialist",
    purpose: "Evaluate designs for quality, redundancy, and reuse opportunities with primitive classification.",
    inputContract: [
      { name: "priorSummaries", type: "string[]", required: false, description: "Summaries of all prior specialist outputs" },
      { name: "priorDeliverables", type: "string[]", required: false, description: "All prior deliverables" },
    ],
    outputContract: [
      { name: "findings", type: "string[]", required: true, description: "Critique findings ranked by severity" },
      { name: "reuseOpportunities", type: "string[]", required: true, description: "Existing primitives that could be reused" },
      { name: "approved", type: "boolean", required: true, description: "Whether the design passes quality review" },
    ],
    selectionHints: ["critique", "evaluate design", "redundancy", "simplify", "reuse", "proportional"],
    status: "active",
  },
  {
    id: "specialist_boundary-auditor",
    version: "1.0.0",
    kind: "specialist",
    purpose: "Audit designs for access control violations and narrow-by-default compliance.",
    inputContract: [
      { name: "priorSummaries", type: "string[]", required: false, description: "Summaries of all prior specialist outputs" },
      { name: "priorDeliverables", type: "string[]", required: false, description: "All prior deliverables" },
    ],
    outputContract: [
      { name: "violations", type: "string[]", required: true, description: "Boundary violations found" },
      { name: "exposures", type: "string[]", required: true, description: "Undeclared context exposures" },
      { name: "compliant", type: "boolean", required: true, description: "Whether the design is boundary-compliant" },
    ],
    selectionHints: ["boundary", "access control", "permission", "minimal context", "narrow by default"],
    status: "active",
  },
];
