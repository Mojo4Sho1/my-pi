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
  | "abort"
  | "quality_failure";

// --- Structured Review Findings (Stage 4e) ---

export type ReviewVerdict = "approve" | "request_changes" | "comment" | "blocked";

export type FindingPriority = "critical" | "major" | "minor" | "nit";

export interface ReviewFinding {
  /** Author-assigned by reviewer (e.g., "F1", "F2") */
  id: string;
  /** Severity of the finding */
  priority: FindingPriority;
  /** Freeform category: "scope", "correctness", "style", etc. */
  category: string;
  /** Short title of the finding */
  title: string;
  /** What the issue is and why it matters */
  explanation: string;
  /** Specific code, line, or artifact that demonstrates the issue */
  evidence: string;
  /** What should be done to address this */
  suggestedAction: string;
  /** Optional file references */
  fileRefs?: string[];
}

export interface StructuredReviewOutput {
  /** Review verdict */
  verdict: ReviewVerdict;
  /** Individual review findings */
  findings: ReviewFinding[];
  /** Brief summary of review outcome */
  summary: string;
}

// --- Structured Test Output (Stage 5a) ---

export type TestMethod = "manual" | "automated" | "inspection";

export interface TestResult {
  /** Author-assigned by tester (e.g., "T1", "T2") */
  id: string;
  /** What was tested */
  subject: string;
  /** How it was tested */
  method: TestMethod;
  /** What should be true */
  expectedCondition: string;
  /** What was observed */
  actualResult: string;
  /** Whether the test passed */
  passed: boolean;
}

export interface StructuredTestOutput {
  /** Individual test results */
  testResults: TestResult[];
  /** Brief summary of test outcome */
  summary: string;
}

// --- Model Routing (Stage 4e) ---

export interface ModelRoutingPolicy {
  /** Map of specialist ID to model identifier */
  specialistDefaults: Record<string, string>;
}

export interface ModelResolutionContext {
  /** From DelegationInput or task packet (highest precedence) */
  runtimeOverride?: string;
  /** From project-level model config */
  projectConfig?: string;
  /** From SpecialistPromptConfig.preferredModel */
  specialistDefault?: string;
  // Host default is implicit (Pi's own model selection when no --model flag)
}

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
  /** Token usage for this invocation (if available from subprocess) */
  tokenUsage?: TokenUsage;
}

// --- Token Tracking (Stage 5a.1) ---

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface TokenThresholds {
  /** Surface warning in widget/dashboard, execution continues */
  warn: number;
  /** Orchestrator should prefer fresh bounded invocation or reduced packet scope */
  split: number;
  /** Runtime blocks further delegation under current packet shape */
  deny: number;
}

export type ThresholdLevel = "ok" | "warn" | "split" | "deny";

export interface ThresholdResult {
  level: ThresholdLevel;
  currentUsage: number;
  /** The threshold that was hit (or the next one if ok) */
  threshold: number;
  message?: string;
}

// --- Hook Substrate (Stage 5a.1b) ---

/** All hook event names in the system */
export type HookEventName =
  | "onSessionStart"
  | "onSessionEnd"
  | "onTeamStart"
  | "beforeStateTransition"
  | "afterStateTransition"
  | "beforeDelegation"
  | "afterDelegation"
  | "beforeSubprocessSpawn"
  | "afterSubprocessExit"
  | "onAdequacyFailure"
  | "onPolicyViolation"
  | "onArtifactWritten"
  | "onCommandInvoked";

export interface HookEvent<T = unknown> {
  eventName: HookEventName;
  timestamp: string;
  sessionId: string;
  payload: T;
}

export interface HookFailure {
  hookId: string;
  eventName: HookEventName;
  error: string;
  timestamp: string;
}

export type PolicyResult =
  | { allowed: true }
  | { allowed: false; reason: string; annotations?: Record<string, unknown> };

/** Payload for beforeDelegation / afterDelegation */
export interface DelegationHookPayload {
  specialistId: string;
  taskId: string;
  sourceAgent: string;
  /** Only on afterDelegation */
  resultStatus?: PacketStatus;
  /** Only on afterDelegation */
  tokenUsage?: TokenUsage;
}

/** Payload for beforeSubprocessSpawn / afterSubprocessExit */
export interface SubprocessHookPayload {
  specialistId: string;
  taskId: string;
  /** Only on afterSubprocessExit */
  exitCode?: number;
  /** Only on afterSubprocessExit */
  tokenUsage?: TokenUsage;
}

/** Payload for beforeStateTransition / afterStateTransition */
export interface StateTransitionHookPayload {
  teamId: string;
  fromState: string;
  toState: string;
  agentId: string;
  taskId: string;
  /** Only on afterStateTransition */
  resultStatus?: PacketStatus;
}

/** Payload for onTeamStart */
export interface TeamStartHookPayload {
  teamId: string;
  teamVersion: string;
  taskId: string;
}

/** Payload for onAdequacyFailure */
export interface AdequacyFailureHookPayload {
  specialistId: string;
  taskId: string;
  failures: string[];
}

/** Payload for onSessionStart / onSessionEnd */
export interface SessionHookPayload {
  sessionId: string;
  /** Only on onSessionEnd */
  totalTokenUsage?: TokenUsage;
}

/** Payload for onPolicyViolation */
export type PolicyViolationHookPayload =
  | PolicyViolation
  | {
    specialistId: string;
    taskId: string;
    reason: string;
    annotations?: Record<string, unknown>;
  };

/** Payload for onArtifactWritten */
export interface ArtifactHookPayload {
  artifactType: string;
  taskId?: string;
  artifact?: unknown;
}

/** Payload for onCommandInvoked */
export interface CommandHookPayload {
  commandName: string;
  toolCallId: string;
  task?: string;
  delegationHint?: string;
  teamHint?: string;
}

// --- Sandboxing and Path Protection (Stage 5a.1c) ---

export interface PolicyEnvelope {
  /** Paths the invocation may write to */
  allowedWritePaths: string[];
  /** Root paths the invocation may read from */
  allowedReadRoots: string[];
  /** Whether shell execution is permitted */
  allowShell: boolean;
  /** Whether network access is permitted */
  allowNetwork: boolean;
  /** Whether process spawning is permitted */
  allowProcessSpawn: boolean;
  /** Specific commands allowed (if undefined, all non-forbidden commands ok when shell is allowed) */
  allowedCommands?: string[];
  /** Glob patterns that are always forbidden for writes */
  forbiddenGlobs?: string[];
}

export type PolicyViolationType =
  | "write_denied"
  | "read_denied"
  | "shell_denied"
  | "network_denied"
  | "spawn_denied"
  | "command_denied"
  | "glob_forbidden";

export interface PolicyViolation {
  timestamp: string;
  sessionId: string;
  invocationId: string;
  attemptedAction: string;
  targetPath?: string;
  targetCommand?: string;
  expectedPolicy: Partial<PolicyEnvelope>;
  violationType: PolicyViolationType;
  enforcementResult: "blocked" | "logged";
}

export interface SpawnRecord {
  timestamp: string;
  sessionId: string;
  specialistId: string;
  policyEnvelope: PolicyEnvelope;
  outcome: "spawned" | "blocked";
  blockReason?: string;
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
    /** Aggregated token usage across all specialist invocations */
    totalTokenUsage?: TokenUsage;
  };
}

// --- Primitive Registry (Stage 5a) ---

export interface PrimitiveRegistryEntry {
  id: string;
  version: string;
  kind: "specialist" | "team" | "sequence" | "seed";
  purpose: string;
  inputContract: ContractField[];
  outputContract: ContractField[];
  selectionHints: string[];
  status: "active" | "proposed" | "deprecated";
}
