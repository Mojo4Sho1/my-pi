/**
 * Shared type definitions for the my-pi orchestration system.
 *
 * These TypeScript interfaces are the code equivalents of the contracts
 * defined in agents/AGENT_DEFINITION_CONTRACT.md. They define the packet
 * structures, agent configurations, and routing types used by all extensions.
 */

// --- Packet Types ---

/**
 * Enumerates the high-level outcome states that task and result flows can report.
 * It is used across packets, routing transitions, and session artifacts to describe execution status.
 */
export type PacketStatus = "success" | "partial" | "failure" | "escalation";

/**
 * Represents the bounded unit of work the orchestrator or a team sends to a downstream agent.
 * It carries the objective, permissions, and scoped context needed to execute a delegation safely.
 */
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

/**
 * Captures the structured handback produced in response to a TaskPacket.
 * See also TaskPacket and TeamSessionArtifact for how results are routed and recorded over a full run.
 */
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
  /** Canonical machine-readable specialist output preserved for validation and routing */
  structuredOutput?: Record<string, unknown>;
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

/**
 * Classifies the primitive kind an agent definition describes within the orchestration hierarchy.
 * The value determines whether a definition represents a top-level orchestrator, a narrow specialist, a team, or a sequence.
 */
export type DefinitionType = "orchestrator" | "specialist" | "team" | "sequence";

/**
 * Distinguishes broad orchestration actors from downstream executors.
 * This helps enforce the authority model described by AgentDefinition.
 */
export type RoutingClass = "orchestrator" | "downstream";

/**
 * Describes how much context an agent is expected to receive by default.
 * It supports the system's broad-orchestrator, narrow-specialist control model.
 */
export type ContextScope = "broad" | "narrow";

/**
 * Encodes the behavioral guidance that shapes how an agent should reason, communicate, and manage risk.
 * These settings inform prompt construction and help keep specialists within their intended boundaries.
 */
export interface WorkingStyle {
  reasoningPosture: string;
  communicationPosture: string;
  riskPosture: string;
  defaultBias: string;
  antiPatterns: string[];
}

/**
 * Defines the shared metadata and operating contract for any agent-like primitive in the system.
 * Specialized definitions such as SpecialistConfig extend this base shape with stricter guarantees.
 */
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

/**
 * Narrows AgentDefinition to the stricter contract required for downstream specialists.
 * It guarantees specialist-specific boundary fields and requires a WorkingStyle. See also AgentDefinition.
 */
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

/**
 * Lists the primitive field shapes supported by typed input and output contracts.
 * These values let contracts describe the structured data specialists exchange through context and deliverables.
 */
export type ContractFieldType = "string" | "string[]" | "boolean" | "number" | "object" | "object[]";

/**
 * Describes one named field in an input or output contract.
 * It is the basic schema unit used by InputContract and OutputContract.
 */
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

/**
 * Defines the structured fields a specialist or team expects to find in TaskPacket.context.
 * See also OutputContract, which describes the fields a primitive promises to produce.
 */
export interface InputContract {
  fields: ContractField[];
}

/**
 * Defines the structured fields a specialist or team guarantees in its deliverables.
 * It is paired with InputContract to validate compatibility between adjacent execution steps.
 */
export interface OutputContract {
  fields: ContractField[];
}

// --- Team and Routing Types ---

/**
 * Describes a reusable team primitive composed of multiple specialists and a routing state machine.
 * It packages membership, contracts, and transition rules into a unit the orchestrator can treat as opaque.
 */
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

/**
 * Defines the full routing graph for a team execution.
 * It identifies the entry state, terminal states, and per-state behavior described by StateDefinition.
 */
export interface StateMachineDefinition {
  startState: string;
  terminalStates: string[];
  states: Record<string, StateDefinition>;
}

/**
 * Describes how a single team state is executed and where it may transition next.
 * It supports both normal single-agent states and future fan-out state shapes.
 */
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

/**
 * Defines one edge in a team's state machine based on a returned PacketStatus.
 * It can also impose loop limits to force escalation when retries are exhausted.
 */
export interface TransitionDefinition {
  /** Condition that triggers this transition */
  on: PacketStatus;
  /** Target state */
  to: string;
  /** Max iterations for loop edges — escalate when exhausted */
  maxIterations?: number;
}

// --- Failure Reason Taxonomy (Stage 4d) ---

/**
 * Enumerates normalized reasons a run can fail, abort, or escalate.
 * These values are used in artifacts and metrics so failures can be analyzed consistently across executions.
 */
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

/**
 * Represents the overall disposition of a structured review.
 * It summarizes whether work is approved, blocked, or needs changes. See also StructuredReviewOutput.
 */
export type ReviewVerdict = "approve" | "request_changes" | "comment" | "blocked";

/**
 * Ranks the severity of an individual review finding.
 * It helps downstream synthesis and display code distinguish critical issues from minor comments.
 */
export type FindingPriority = "critical" | "major" | "minor" | "nit";

/**
 * Captures one structured issue identified by a reviewer.
 * Multiple findings are collected into a StructuredReviewOutput for downstream handling.
 */
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

/**
 * Defines the structured payload returned by review-oriented specialists.
 * It combines an overall verdict, detailed findings, and a summary for orchestration and reporting.
 */
export interface StructuredReviewOutput {
  /** Review verdict */
  verdict: ReviewVerdict;
  /** Individual review findings */
  findings: ReviewFinding[];
  /** Brief summary of review outcome */
  summary: string;
}

// --- Structured Test Output (Stage 5a) ---

/**
 * Describes the method used to validate a subject during structured testing.
 * It gives test outputs a consistent vocabulary across manual, automated, and inspection-based checks.
 */
export type TestMethod = "manual" | "automated" | "inspection";

/**
 * Records one structured test case outcome produced by a tester.
 * These entries roll up into StructuredTestOutput in the same way review findings roll up into review output.
 */
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

/**
 * Defines the structured payload returned by testing-oriented specialists.
 * It groups individual test results with a brief execution summary. See also TestResult.
 */
export interface StructuredTestOutput {
  /** Individual test results */
  testResults: TestResult[];
  /** Brief summary of test outcome */
  summary: string;
}

// --- Model Routing (Stage 4e) ---

/**
 * Stores configured default model selections for specialists.
 * It supports the model resolution chain that combines runtime, project, and specialist-level preferences.
 */
export interface ModelRoutingPolicy {
  /** Map of specialist ID to model identifier */
  specialistDefaults: Record<string, string>;
}

/**
 * Carries the layered inputs used to choose a model for a specialist invocation.
 * Each field represents a different precedence tier in the system's model routing policy.
 */
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

/**
 * Records one executed state transition within a team session.
 * These entries form the ordered trace stored on TeamSessionArtifact.
 */
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

/**
 * Summarizes a single specialist invocation inside a broader team run.
 * It gives session artifacts compact per-agent visibility, including status, contract success, and token usage.
 */
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

/**
 * Identifies a canonical machine-first artifact produced during team execution.
 * These lightweight refs let the router link session records to per-step artifacts without copying full payloads everywhere.
 */
export interface ArtifactRef {
  /** Unique artifact identifier */
  artifactId: string;
  /** Runtime artifact kind */
  artifactType: "team_session" | "team_step_output";
  /** Logical canonical path for the artifact */
  logicalPath: string;
  /** Agent or runtime component that owns this artifact */
  ownerAgent: string;
  /** Timestamp when the artifact was created */
  createdAt: string;
  /** Step order for per-specialist artifacts */
  stepOrder?: number;
  /** Team state associated with the artifact */
  state?: string;
}

/**
 * Captures one canonical machine-first specialist artifact created by the router after validating a team step.
 * The router owns the lifecycle of this record even though the specialist owns the payload fields it produced.
 */
export interface TeamStepArtifact {
  /** Artifact schema version for future migrations */
  schemaVersion: string;
  /** Unique artifact identifier */
  artifactId: string;
  /** Artifact kind */
  artifactType: "team_step_output";
  /** Logical canonical path for the artifact */
  logicalPath: string;
  /** Team definition ID */
  teamId: string;
  /** Parent team session ID */
  teamSessionId: string;
  /** Root task ID for the team run */
  taskId: string;
  /** Team state that produced this artifact */
  state: string;
  /** Invocation order within the team session */
  stepOrder: number;
  /** Specialist agent ID (e.g. "specialist_builder") */
  specialistId: string;
  /** Specialist role that owns the payload */
  ownerRole: string;
  /** Task packet ID that was delegated to produce this artifact */
  inputTaskPacketId: string;
  /** Result status returned by the specialist */
  status: PacketStatus;
  /** Summary copied from the validated result packet metadata */
  summary: string;
  /** Deliverables copied from the validated result packet metadata */
  deliverables: string[];
  /** Modified files copied from the validated result packet metadata */
  modifiedFiles: string[];
  /** Fields the specialist is expected to fill */
  editableFields: string[];
  /** Router-owned or derived fields that are read-only to the specialist */
  readOnlyFields: string[];
  /** Upstream packet or artifact IDs this output derives from */
  derivedFrom: string[];
  /** Timestamp when the artifact was recorded */
  producedAt: string;
  /** Raw preserved structured payload returned by the specialist */
  structuredOutput?: Record<string, unknown>;
  /** Contract-validated output fields approved for downstream routing */
  validatedOutput: Record<string, unknown>;
  /** Whether the specialist satisfied its declared output contract */
  contractSatisfied: boolean;
  /** Validation failures observed while recording the artifact */
  contractErrors?: string[];
}

// --- Token Tracking (Stage 5a.1) ---

/**
 * Captures token counts for a single invocation or aggregate rollup.
 * It provides the common accounting shape reused by subprocess parsing, thresholds, and session artifacts.
 */
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

/**
 * Defines token budget breakpoints that trigger warnings, splitting behavior, or denial.
 * These thresholds let the orchestrator react before delegation scope grows too large.
 */
export interface TokenThresholds {
  /** Surface warning in widget/dashboard, execution continues */
  warn: number;
  /** Orchestrator should prefer fresh bounded invocation or reduced packet scope */
  split: number;
  /** Runtime blocks further delegation under current packet shape */
  deny: number;
}

/**
 * Represents the qualitative threshold band for current token usage.
 * It is the normalized status returned alongside numeric threshold checks.
 */
export type ThresholdLevel = "ok" | "warn" | "split" | "deny";

/**
 * Describes the outcome of evaluating token usage against configured thresholds.
 * It includes both the qualitative level and the numeric boundary that was hit or is next.
 */
export interface ThresholdResult {
  level: ThresholdLevel;
  currentUsage: number;
  /** The threshold that was hit (or the next one if ok) */
  threshold: number;
  message?: string;
}

// --- Hook Substrate (Stage 5a.1b) ---

/**
 * Enumerates all lifecycle event names emitted through the hook substrate.
 * These names are used to register observers and policy hooks at key orchestration execution points.
 */
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

/**
 * Represents one typed event emitted by the runtime hook system.
 * The generic payload lets each event carry context-specific data while sharing common session metadata.
 */
export interface HookEvent<T = unknown> {
  eventName: HookEventName;
  timestamp: string;
  sessionId: string;
  payload: T;
}

/**
 * Records a hook execution error without crashing the main orchestration flow.
 * It provides structured diagnostics for failing observers or policies.
 */
export interface HookFailure {
  hookId: string;
  eventName: HookEventName;
  error: string;
  timestamp: string;
}

/**
 * Represents the authoritative decision returned by a policy hook.
 * A denial can carry a reason and annotations that explain why the attempted action was blocked.
 */
export type PolicyResult =
  | { allowed: true }
  | { allowed: false; reason: string; annotations?: Record<string, unknown> };

/**
 * Provides delegation-specific hook metadata for events emitted before and after a specialist run.
 * See also SubprocessHookPayload for lower-level execution details.
 */
export interface DelegationHookPayload {
  specialistId: string;
  taskId: string;
  sourceAgent: string;
  /** Only on afterDelegation */
  resultStatus?: PacketStatus;
  /** Only on afterDelegation */
  tokenUsage?: TokenUsage;
}

/**
 * Provides subprocess-level hook metadata around specialist process launch and exit.
 * It lets observers inspect execution outcomes without coupling to higher-level orchestration logic.
 */
export interface SubprocessHookPayload {
  specialistId: string;
  taskId: string;
  /** Only on afterSubprocessExit */
  exitCode?: number;
  /** Only on afterSubprocessExit */
  tokenUsage?: TokenUsage;
}

/**
 * Provides team routing metadata for hooks around state transitions.
 * It links the originating team, states, and task to the status produced by the transition.
 */
export interface StateTransitionHookPayload {
  teamId: string;
  fromState: string;
  toState: string;
  agentId: string;
  taskId: string;
  /** Only on afterStateTransition */
  resultStatus?: PacketStatus;
}

/**
 * Provides the initial metadata emitted when a team execution begins.
 * It identifies which team version is running for a given task.
 */
export interface TeamStartHookPayload {
  teamId: string;
  teamVersion: string;
  taskId: string;
}

/**
 * Carries the details of a semantic adequacy failure detected before or after delegation.
 * It lets hooks observe which specialist and task failed quality checks and why.
 */
export interface AdequacyFailureHookPayload {
  specialistId: string;
  taskId: string;
  failures: string[];
}

/**
 * Provides session lifecycle metadata for hook events at the start and end of a run.
 * End-of-session events may also include aggregated token usage.
 */
export interface SessionHookPayload {
  sessionId: string;
  /** Only on onSessionEnd */
  totalTokenUsage?: TokenUsage;
}

/**
 * Represents the payload emitted when a policy rule is violated.
 * It may be a full PolicyViolation record or a lightweight inline form with reason and annotations.
 */
export type PolicyViolationHookPayload =
  | PolicyViolation
  | {
    specialistId: string;
    taskId: string;
    reason: string;
    annotations?: Record<string, unknown>;
  };

/**
 * Carries metadata for artifact emission events observed by the hook system.
 * It allows runtime observers to react to typed artifacts such as team sessions or worklist snapshots.
 */
export interface ArtifactHookPayload {
  artifactType: string;
  taskId?: string;
  artifact?: unknown;
}

/**
 * Carries metadata for command-surface hook events.
 * It is used to observe orchestrator tool invocations and the hints that shaped selection.
 */
export interface CommandHookPayload {
  commandName: string;
  toolCallId: string;
  task?: string;
  delegationHint?: string;
  teamHint?: string;
}

// --- Sandboxing and Path Protection (Stage 5a.1c) ---

/**
 * Defines the execution authority granted to a specialist invocation.
 * It describes permitted reads, writes, and process capabilities for deterministic sandbox enforcement.
 */
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

/**
 * Enumerates the normalized categories of sandbox or policy violations.
 * These values make enforcement results consistent across path, shell, network, and command checks.
 */
export type PolicyViolationType =
  | "write_denied"
  | "read_denied"
  | "shell_denied"
  | "network_denied"
  | "spawn_denied"
  | "command_denied"
  | "glob_forbidden";

/**
 * Records a concrete policy enforcement event triggered by a forbidden action.
 * It captures what was attempted, what policy was expected, and whether the runtime blocked or only logged it.
 */
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

/**
 * Records the sandboxed spawn decision for one specialist subprocess attempt.
 * It preserves both the policy envelope that applied and whether the launch was allowed or blocked.
 */
export interface SpawnRecord {
  timestamp: string;
  sessionId: string;
  specialistId: string;
  policyEnvelope: PolicyEnvelope;
  outcome: "spawned" | "blocked";
  blockReason?: string;
}

/**
 * Captures the structured execution artifact produced for a full team run.
 * It combines trace data, per-specialist summaries, metrics, and final outcome for observability and analysis.
 */
export interface TeamSessionArtifact {
  /** Artifact schema version for future migrations */
  schemaVersion: string;
  /** Unique session ID */
  sessionId: string;
  /** Root task packet ID for this team run */
  taskId: string;
  /** Objective delegated to the team */
  objective: string;
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
  /** Final session status */
  status: PacketStatus;
  /** Current or terminal state when the artifact was emitted */
  currentState: string;
  /** Current or terminal owner role when the artifact was emitted */
  currentOwnerRole: string;
  /** Starting state */
  startState: string;
  /** Ending state */
  endState: string;
  /** Why the team stopped */
  terminationReason: FailureReason | "success";
  /** Full packet lineage for the team run */
  taskPacketLineage: string[];
  /** Linked canonical artifact refs produced during the run */
  artifactRefs: ArtifactRef[];
  /** Ordered state trace */
  stateTrace: StateTraceEntry[];
  /** Per-specialist invocation summaries */
  specialistSummaries: SpecialistInvocationSummary[];
  /** Canonical per-step artifacts recorded by the router */
  stepArtifacts: TeamStepArtifact[];
  /** Ref to the final step artifact when available */
  finalResultRef?: ArtifactRef;
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

/**
 * Describes one registered primitive that can be discovered and selected at runtime.
 * It summarizes identity, contracts, status, and selection hints for specialists, teams, sequences, or seeds.
 */
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
