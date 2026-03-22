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

// --- Team and Routing Types ---

export interface TeamDefinition {
  id: string;
  name: string;
  purpose: string;
  members: string[]; // Specialist IDs
  states: StateMachineDefinition;
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
  /** Valid transitions from this state */
  transitions: TransitionDefinition[];
}

export interface TransitionDefinition {
  /** Condition that triggers this transition */
  on: PacketStatus;
  /** Target state */
  to: string;
}
