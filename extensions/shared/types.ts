/**
 * Shared type definitions for the my-pi orchestration system.
 *
 * These TypeScript interfaces are the code equivalents of the contracts
 * defined in agents/AGENT_DEFINITION_CONTRACT.md. They define the packet
 * structures, agent configurations, and routing types used by all extensions.
 */

// --- Packet Types ---

export type PacketStatus = "success" | "partial" | "failure" | "escalation";

export interface TaskPacket {
  /** Unique identifier for this task */
  id: string;
  /** What the specialist should accomplish */
  objective: string;
  /** Files the specialist is allowed to read */
  allowedReadSet: string[];
  /** Files the specialist is allowed to modify */
  allowedWriteSet: string[];
  /** Criteria for determining success */
  acceptanceCriteria: string[];
  /** Additional context or constraints */
  context?: Record<string, unknown>;
  /** ID of the agent this packet is addressed to */
  targetAgent: string;
  /** ID of the agent that created this packet */
  sourceAgent: string;
  /** Timestamp of packet creation */
  createdAt: string;
}

export interface ResultPacket {
  /** Unique identifier for this result */
  id: string;
  /** ID of the task packet this result responds to */
  taskId: string;
  /** Outcome status */
  status: PacketStatus;
  /** Summary of what was done */
  summary: string;
  /** Detailed deliverables or findings */
  deliverables: string[];
  /** Files that were modified */
  modifiedFiles: string[];
  /** Escalation details if status is "escalation" */
  escalation?: {
    reason: string;
    suggestedAction: string;
  };
  /** ID of the agent that produced this result */
  sourceAgent: string;
  /** Timestamp of result creation */
  createdAt: string;
}

// --- Agent Definition Types ---

export type DefinitionType = "orchestrator" | "specialist" | "team" | "sequence";
export type RoutingClass = "orchestrator" | "downstream";
export type ContextScope = "broad" | "narrow";

export interface WorkingStyle {
  reasoningPosture: string;
  communicationPosture: string;
  riskPosture: string;
  defaultBias: string;
  antiPatterns: string[];
}

export interface AgentDefinition {
  id: string;
  name: string;
  definitionType: DefinitionType;
  purpose: string;
  scope: string;
  nonGoals: string[];
  routingClass: RoutingClass;
  contextScope: ContextScope;
  defaultReadSet: string[];
  forbiddenByDefault: string[];
  requiredInputs: string[];
  expectedOutputs: string[];
  handbackFormat: string;
  activationConditions: string[];
  escalationConditions: string[];
  workingStyle?: WorkingStyle;
}

export interface SpecialistConfig extends AgentDefinition {
  definitionType: "specialist";
  routingClass: "downstream";
  contextScope: "narrow";
  specialization: string;
  taskBoundary: string;
  deliverableBoundary: string;
  failureBoundary: string;
  workingStyle: WorkingStyle; // Required for specialists
}

// --- I/O Contract Types (Stage 4a) ---

export type ContractFieldType = "string" | "string[]" | "boolean" | "number" | "object";

export interface ContractField {
  /** Field name (e.g. "planSummary") */
  name: string;
  /** Expected type of the field value */
  type: ContractFieldType;
  /** Whether this field must be present */
  required: boolean;
  /** Human-readable description */
  description: string;
  /** Which specialist's output provides this field (for input contracts) */
  sourceSpecialist?: string;
}

/** What a specialist/team requires in its TaskPacket.context */
export interface InputContract {
  fields: ContractField[];
}

/** What a specialist/team guarantees in its structured deliverables */
export interface OutputContract {
  fields: ContractField[];
}

// --- Team and Routing Types ---

export interface TeamDefinition {
  id: string;
  name: string;
  purpose: string;
  members: string[]; // Specialist IDs
  states: StateMachineDefinition;
  /** What the team requires as input */
  entryContract: InputContract;
  /** What the team guarantees as output */
  exitContract: OutputContract;
  entryPacketTypes: string[];
  exitPacketTypes: string[];
  activationConditions: string[];
  escalationConditions: string[];
}

export interface StateMachineDefinition {
  startState: string;
  terminalStates: string[];
  states: Record<string, StateDefinition>;
}

export interface StateDefinition {
  /** Which specialist handles this state */
  agent: string;
  /** For fan-out states — dispatch to all agents (type stub, not yet implemented) */
  agents?: string[];
  /** Valid transitions from this state */
  transitions: TransitionDefinition[];
  /** How to aggregate fan-out results (type stub, not yet implemented) */
  fanOutJoin?: "all" | "any";
}

export interface TransitionDefinition {
  /** Condition that triggers this transition */
  on: PacketStatus;
  /** Target state */
  to: string;
  /** Max iterations for loop edges — escalate when exhausted */
  maxIterations?: number;
}

// --- Failure Reason Taxonomy (Stage 4d) ---

export type FailureReason =
  | "task_failure"
  | "contract_violation"
  | "policy_refusal"
  | "scope_mismatch"
  | "retry_exhaustion"
  | "missing_artifact"
  | "validation_failure"
  | "escalation"
  | "abort";

// --- Team Session Artifacts (Stage 4d) ---

export interface StateTraceEntry {
  /** State name */
  state: string;
  /** Agent that executed this state */
  agent: string;
  /** Result status from the agent */
  resultStatus: PacketStatus;
  /** Transition taken (target state name) */
  transitionTo: string;
  /** Timestamp when this state was entered */
  enteredAt: string;
  /** Timestamp when this state completed */
  completedAt: string;
  /** Loop iteration count for this edge (if applicable) */
  iterationCount?: number;
}

export interface SpecialistInvocationSummary {
  /** Specialist agent ID */
  agentId: string;
  /** Invocation order (1-indexed) */
  order: number;
  /** Bounded summary of the specialist's output */
  outputSummary: string;
  /** Result status */
  status: PacketStatus;
  /** Whether output contract was satisfied */
  contractSatisfied: boolean;
  /** Duration in milliseconds (if measurable) */
  durationMs?: number;
}

export interface TeamSessionArtifact {
  /** Unique session ID */
  sessionId: string;
  /** Timestamp of session start */
  startedAt: string;
  /** Timestamp of session completion */
  completedAt: string;
  /** Team definition ID */
  teamId: string;
  /** Team definition name */
  teamName: string;
  /** Hash or version identifier of the team definition used */
  teamVersion: string;
  /** Starting state */
  startState: string;
  /** Ending state */
  endState: string;
  /** Why the team stopped */
  terminationReason: FailureReason | "success";
  /** Ordered state trace */
  stateTrace: StateTraceEntry[];
  /** Per-specialist invocation summaries */
  specialistSummaries: SpecialistInvocationSummary[];
  /** Final outcome */
  outcome: {
    status: PacketStatus;
    failureReason?: FailureReason;
  };
  /** Lightweight metrics */
  metrics: {
    totalTransitions: number;
    loopCount: number;
    retryCount: number;
    totalDurationMs: number;
    revisionCount: number;
  };
}
