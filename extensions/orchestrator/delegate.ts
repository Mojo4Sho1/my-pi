/**
 * Delegation lifecycle for the orchestrator.
 *
 * Wraps the shared specialist infrastructure (prompt building, subprocess
 * spawning, result parsing) into a single delegation call.
 */

import type { TaskPacket, ResultPacket, TeamDefinition } from "../shared/types.js";
import type { SpecialistPromptConfig } from "../shared/specialist-prompt.js";
import { buildSpecialistSystemPrompt, buildSpecialistTaskPrompt } from "../shared/specialist-prompt.js";
import { spawnSpecialistAgent } from "../shared/subprocess.js";
import { parseSpecialistOutput, parseReviewOutput } from "../shared/result-parser.js";
import { validateAdequacy } from "../shared/adequacy.js";
import type { StructuredReviewOutput } from "../shared/types.js";
import { resolveModel } from "../shared/config.js";
import { createResultPacket, validateResultPacket } from "../shared/packets.js";
import { validateInputContract } from "../shared/contracts.js";
import type { DelegationLogger } from "../shared/logging.js";
import type { HookRegistry } from "../shared/hooks.js";
import {
  buildDefaultEnvelope,
  validateEnvelope,
  checkWritePaths,
  createSpawnRecord,
} from "../shared/sandbox.js";
import { BUILDER_PROMPT_CONFIG } from "../specialists/builder/prompt.js";
import { PLANNER_PROMPT_CONFIG } from "../specialists/planner/prompt.js";
import { REVIEWER_PROMPT_CONFIG } from "../specialists/reviewer/prompt.js";
import { TESTER_PROMPT_CONFIG } from "../specialists/tester/prompt.js";
import { SPEC_WRITER_PROMPT_CONFIG } from "../specialists/spec-writer/prompt.js";
import { SCHEMA_DESIGNER_PROMPT_CONFIG } from "../specialists/schema-designer/prompt.js";
import { ROUTING_DESIGNER_PROMPT_CONFIG } from "../specialists/routing-designer/prompt.js";
import { CRITIC_PROMPT_CONFIG } from "../specialists/critic/prompt.js";
import { BOUNDARY_AUDITOR_PROMPT_CONFIG } from "../specialists/boundary-auditor/prompt.js";
import type { SpecialistId } from "./select.js";

export interface DelegationInput {
  /** Prompt configuration for the target specialist */
  promptConfig: SpecialistPromptConfig;
  /** Task packet to delegate */
  taskPacket: TaskPacket;
  /** Optional abort signal */
  signal?: AbortSignal;
  /** Optional logger for delegation events */
  logger?: DelegationLogger;
  /** Hook registry for lifecycle events */
  hookRegistry?: HookRegistry;
  /** Runtime model override (highest precedence in model resolution) */
  modelOverride?: string;
  /** Project-level model config for this specialist */
  projectModelConfig?: string;
}

export interface DelegationOutput {
  /** The result packet from the specialist */
  resultPacket: ResultPacket;
  /** Whether the delegation was successful (status is "success") */
  success: boolean;
  /** Team session artifact (only present for team delegations) */
  sessionArtifact?: import("../shared/types.js").TeamSessionArtifact;
  /** Structured review output (only present for reviewer results) */
  reviewOutput?: StructuredReviewOutput;
  /** Token usage from the specialist subprocess (if available) */
  tokenUsage?: import("../shared/types.js").TokenUsage;
  /** Policy envelope used for this delegation */
  policyEnvelope?: import("../shared/types.js").PolicyEnvelope;
}

const PROMPT_CONFIG_MAP: Record<SpecialistId, SpecialistPromptConfig> = {
  builder: BUILDER_PROMPT_CONFIG,
  planner: PLANNER_PROMPT_CONFIG,
  reviewer: REVIEWER_PROMPT_CONFIG,
  tester: TESTER_PROMPT_CONFIG,
  "spec-writer": SPEC_WRITER_PROMPT_CONFIG,
  "schema-designer": SCHEMA_DESIGNER_PROMPT_CONFIG,
  "routing-designer": ROUTING_DESIGNER_PROMPT_CONFIG,
  "critic": CRITIC_PROMPT_CONFIG,
  "boundary-auditor": BOUNDARY_AUDITOR_PROMPT_CONFIG,
};

/**
 * Look up the prompt configuration for a specialist by ID.
 */
export function getPromptConfig(specialistId: SpecialistId): SpecialistPromptConfig {
  return PROMPT_CONFIG_MAP[specialistId];
}

/**
 * Delegate a task to a specialist and return the result.
 *
 * Pipeline:
 * 1. Build system + task prompts from config
 * 2. Spawn sub-agent via spawnSpecialistAgent()
 * 3. Parse output via parseSpecialistOutput()
 * 4. Create and validate ResultPacket
 * 5. Return result with success flag
 */
export async function delegateToSpecialist(input: DelegationInput): Promise<DelegationOutput> {
  const { promptConfig, taskPacket, signal, logger } = input;
  const agentId = promptConfig.id;
  const hookRegistry = input.hookRegistry;
  let policyEnvelope: import("../shared/types.js").PolicyEnvelope | undefined;

  const emitAfterDelegation = (
    resultStatus: ResultPacket["status"],
    tokenUsage?: import("../shared/types.js").TokenUsage,
  ) => {
    hookRegistry?.dispatchObserver("afterDelegation", {
      specialistId: agentId,
      taskId: taskPacket.id,
      sourceAgent: taskPacket.sourceAgent,
      resultStatus,
      tokenUsage,
    });
  };

  // 1. Build prompts
  const systemPrompt = buildSpecialistSystemPrompt(promptConfig);
  const taskPrompt = buildSpecialistTaskPrompt(taskPacket);

  // 1.5 Pre-flight contract validation
  if (promptConfig.inputContract) {
    const preflightErrors = validateInputContract(
      taskPacket.context as Record<string, unknown> | undefined,
      promptConfig.inputContract
    );
    if (preflightErrors.length > 0) {
      logger?.log({
        timestamp: new Date().toISOString(),
        level: "error",
        event: "preflight_fail",
        sourceAgent: taskPacket.sourceAgent,
        targetAgent: agentId,
        taskId: taskPacket.id,
        summary: `Pre-flight validation failed: ${preflightErrors.join("; ")}`,
        failureReason: "contract_violation",
      });
      const failurePacket = createResultPacket({
        taskId: taskPacket.id,
        status: "failure",
        summary: `Pre-flight validation failed for ${promptConfig.roleName}: ${preflightErrors.join("; ")}`,
        deliverables: [],
        modifiedFiles: [],
        sourceAgent: agentId,
      });
      return { resultPacket: failurePacket, success: false, policyEnvelope };
    }
  }

  // 2. Log delegation start
  logger?.log({
    timestamp: new Date().toISOString(),
    level: "info",
    event: "delegation_start",
    sourceAgent: taskPacket.sourceAgent,
    targetAgent: agentId,
    taskId: taskPacket.id,
    summary: taskPacket.objective,
  });

  // 2.5 Resolve model
  const resolvedModel = resolveModel({
    runtimeOverride: input.modelOverride,
    projectConfig: input.projectModelConfig,
    specialistDefault: input.promptConfig.preferredModel,
  });

  // TODO(5a.1): Check token thresholds before delegation
  // When session-level cumulative usage is available, call checkThresholds()
  // and handle warn (log) / split (signal orchestrator) / deny (return failure)

  // 2.7 Build and validate policy envelope (5a.1c)
  policyEnvelope = buildDefaultEnvelope(agentId, taskPacket);
  const sessionId = hookRegistry?.getSessionId() ?? "unknown_session";
  const envelopeErrors = validateEnvelope(policyEnvelope);
  if (envelopeErrors.length > 0) {
    const spawnRecord = createSpawnRecord(
      agentId,
      policyEnvelope,
      "blocked",
      `Invalid policy envelope: ${envelopeErrors.join("; ")}`,
      sessionId
    );
    hookRegistry?.dispatchObserver("onArtifactWritten", {
      artifactType: "spawn_record",
      taskId: taskPacket.id,
      artifact: spawnRecord,
    });
    const deniedPacket = createResultPacket({
      taskId: taskPacket.id,
      status: "failure",
      summary: `Delegation blocked by invalid sandbox policy: ${envelopeErrors.join("; ")}`,
      deliverables: [],
      modifiedFiles: [],
      sourceAgent: agentId,
    });
    logger?.log({
      timestamp: new Date().toISOString(),
      level: "warn",
      event: "delegation_error",
      sourceAgent: taskPacket.sourceAgent,
      targetAgent: agentId,
      taskId: taskPacket.id,
      status: "failure",
      summary: deniedPacket.summary,
      failureReason: "validation_failure",
    });
    emitAfterDelegation(deniedPacket.status);
    return { resultPacket: deniedPacket, success: false, policyEnvelope };
  }

  const writeViolations = checkWritePaths(taskPacket.allowedWriteSet, policyEnvelope, {
    sessionId,
    invocationId: taskPacket.id,
  });
  if (writeViolations.length > 0) {
    for (const violation of writeViolations) {
      hookRegistry?.dispatchObserver("onPolicyViolation", violation);
    }

    const spawnRecord = createSpawnRecord(
      agentId,
      policyEnvelope,
      "blocked",
      `Policy violations: ${writeViolations.map((violation) => violation.violationType).join(", ")}`,
      sessionId
    );
    hookRegistry?.dispatchObserver("onArtifactWritten", {
      artifactType: "spawn_record",
      taskId: taskPacket.id,
      artifact: spawnRecord,
    });

    const deniedPacket = createResultPacket({
      taskId: taskPacket.id,
      status: "failure",
      summary: `Delegation blocked by sandbox policy: ${writeViolations.length} violation(s) — ${writeViolations.map((violation) => `${violation.violationType}: ${violation.targetPath}`).join("; ")}`,
      deliverables: [],
      modifiedFiles: [],
      sourceAgent: agentId,
    });
    logger?.log({
      timestamp: new Date().toISOString(),
      level: "warn",
      event: "delegation_error",
      sourceAgent: taskPacket.sourceAgent,
      targetAgent: agentId,
      taskId: taskPacket.id,
      status: "failure",
      summary: deniedPacket.summary,
      failureReason: "validation_failure",
    });
    emitAfterDelegation(deniedPacket.status);
    return { resultPacket: deniedPacket, success: false, policyEnvelope };
  }

  const spawnRecord = createSpawnRecord(agentId, policyEnvelope, "spawned", undefined, sessionId);
  hookRegistry?.dispatchObserver("onArtifactWritten", {
    artifactType: "spawn_record",
    taskId: taskPacket.id,
    artifact: spawnRecord,
  });

  const beforeDelegationPayload = {
    specialistId: agentId,
    taskId: taskPacket.id,
    sourceAgent: taskPacket.sourceAgent,
  };
  const policyResult = hookRegistry?.dispatchPolicy("beforeDelegation", beforeDelegationPayload);
  if (policyResult && !policyResult.allowed) {
    hookRegistry?.dispatchObserver("onPolicyViolation", {
      specialistId: agentId,
      taskId: taskPacket.id,
      reason: policyResult.reason,
      annotations: policyResult.annotations,
    });
    const deniedPacket = createResultPacket({
      taskId: taskPacket.id,
      status: "failure",
      summary: `Delegation denied by policy: ${policyResult.reason}`,
      deliverables: [],
      modifiedFiles: [],
      sourceAgent: agentId,
    });
    logger?.log({
      timestamp: new Date().toISOString(),
      level: "warn",
      event: "delegation_error",
      sourceAgent: taskPacket.sourceAgent,
      targetAgent: agentId,
      taskId: taskPacket.id,
      status: "failure",
      summary: `Policy denied: ${policyResult.reason}`,
      failureReason: "validation_failure",
    });
    emitAfterDelegation(deniedPacket.status);
    return { resultPacket: deniedPacket, success: false, policyEnvelope };
  }

  hookRegistry?.dispatchObserver("beforeDelegation", beforeDelegationPayload);
  hookRegistry?.dispatchObserver("beforeSubprocessSpawn", {
    specialistId: agentId,
    taskId: taskPacket.id,
  });

  // 3. Spawn the specialist sub-agent
  let subAgentResult;
  try {
    subAgentResult = await spawnSpecialistAgent(systemPrompt, taskPrompt, signal, undefined, resolvedModel);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const failurePacket = createResultPacket({
      taskId: taskPacket.id,
      status: "failure",
      summary: `${promptConfig.roleName} sub-agent failed to start: ${errorMsg}`,
      deliverables: [],
      modifiedFiles: [],
      sourceAgent: agentId,
    });
    logger?.log({
      timestamp: new Date().toISOString(),
      level: "error",
      event: "delegation_error",
      sourceAgent: taskPacket.sourceAgent,
      targetAgent: agentId,
      taskId: taskPacket.id,
      status: "failure",
      summary: errorMsg,
      failureReason: "task_failure",
    });
    emitAfterDelegation(failurePacket.status, subAgentResult?.tokenUsage);
    return {
      resultPacket: failurePacket,
      success: false,
      tokenUsage: subAgentResult?.tokenUsage,
      policyEnvelope,
    };
  }

  hookRegistry?.dispatchObserver("afterSubprocessExit", {
    specialistId: agentId,
    taskId: taskPacket.id,
    exitCode: subAgentResult.exitCode,
    tokenUsage: subAgentResult.tokenUsage,
  });

  // 4. Handle process-level failures
  if (subAgentResult.exitCode !== 0 && !subAgentResult.finalText) {
    const failurePacket = createResultPacket({
      taskId: taskPacket.id,
      status: "failure",
      summary: `${promptConfig.roleName} process exited with code ${subAgentResult.exitCode}. ${subAgentResult.stderr || "No additional details."}`,
      deliverables: [],
      modifiedFiles: [],
      sourceAgent: agentId,
    });
    logger?.log({
      timestamp: new Date().toISOString(),
      level: "error",
      event: "delegation_error",
      sourceAgent: taskPacket.sourceAgent,
      targetAgent: agentId,
      taskId: taskPacket.id,
      status: "failure",
      summary: failurePacket.summary,
      failureReason: "task_failure",
    });
    emitAfterDelegation(failurePacket.status, subAgentResult.tokenUsage);
    return {
      resultPacket: failurePacket,
      success: false,
      tokenUsage: subAgentResult.tokenUsage,
      policyEnvelope,
    };
  }

  // 5. Parse specialist output
  const { result: parsed, rawJson } = parseSpecialistOutput(subAgentResult.finalText, agentId);

  // 5.25 Semantic adequacy gate
  if (promptConfig.adequacyChecks && promptConfig.adequacyChecks.length > 0 && parsed.status === "success") {
    // Build a temporary result packet for adequacy checking
    const tempResult = createResultPacket({
      taskId: taskPacket.id,
      status: parsed.status,
      summary: parsed.summary,
      deliverables: parsed.deliverables,
      modifiedFiles: parsed.modifiedFiles,
      sourceAgent: agentId,
    });
    const adequacyResult = validateAdequacy(promptConfig.adequacyChecks, tempResult);
    if (!adequacyResult.adequate) {
      parsed.status = "failure";
      parsed.summary = `Quality failure: ${adequacyResult.failures.join("; ")}`;
      logger?.log({
        timestamp: new Date().toISOString(),
        level: "warn",
        event: "adequacy_failure",
        sourceAgent: taskPacket.sourceAgent,
        targetAgent: agentId,
        taskId: taskPacket.id,
        summary: parsed.summary,
        failureReason: "quality_failure",
      });
      hookRegistry?.dispatchObserver("onAdequacyFailure", {
        specialistId: agentId,
        taskId: taskPacket.id,
        failures: adequacyResult.failures,
      });
    }
  }

  // 5.5 Extract structured review output for reviewer results
  let reviewOutput: StructuredReviewOutput | undefined;
  if (promptConfig.id === "specialist_reviewer" && rawJson) {
    reviewOutput = parseReviewOutput(parsed, rawJson);
  }

  // 6. Create and validate result packet
  const resultPacket = createResultPacket({
    taskId: taskPacket.id,
    status: parsed.status,
    summary: parsed.summary,
    deliverables: parsed.deliverables,
    modifiedFiles: parsed.modifiedFiles,
    escalation: parsed.escalation,
    sourceAgent: parsed.sourceAgent,
  });

  const validationErrors = validateResultPacket(resultPacket);
  if (validationErrors.length > 0) {
    const fallbackPacket = createResultPacket({
      taskId: taskPacket.id,
      status: "failure",
      summary: `Result packet validation failed: ${validationErrors.join("; ")}`,
      deliverables: [],
      modifiedFiles: [],
      sourceAgent: agentId,
    });
    logger?.log({
      timestamp: new Date().toISOString(),
      level: "error",
      event: "delegation_error",
      sourceAgent: taskPacket.sourceAgent,
      targetAgent: agentId,
      taskId: taskPacket.id,
      status: "failure",
      summary: fallbackPacket.summary,
      failureReason: "validation_failure",
    });
    emitAfterDelegation(fallbackPacket.status, subAgentResult.tokenUsage);
    return {
      resultPacket: fallbackPacket,
      success: false,
      tokenUsage: subAgentResult.tokenUsage,
      policyEnvelope,
    };
  }

  // 7. Log delegation complete
  logger?.log({
    timestamp: new Date().toISOString(),
    level: resultPacket.status === "failure" || resultPacket.status === "escalation" ? "warn" : "info",
    event: "delegation_complete",
    sourceAgent: taskPacket.sourceAgent,
    targetAgent: agentId,
    taskId: taskPacket.id,
    status: resultPacket.status,
    summary: resultPacket.summary,
  });

  emitAfterDelegation(resultPacket.status, subAgentResult.tokenUsage);

  return {
    resultPacket,
    success: parsed.status === "success",
    reviewOutput,
    tokenUsage: subAgentResult.tokenUsage,
    policyEnvelope,
  };
}

/**
 * Build selective context for a specialist from prior results.
 * Each specialist type receives only the fields it needs.
 * Returns undefined if no relevant context exists.
 */
export function buildContextForSpecialist(
  specialistId: SpecialistId,
  priorResults: ResultPacket[]
): Record<string, unknown> | undefined {
  switch (specialistId) {
    case "planner":
      return undefined;

    case "builder": {
      const plannerResult = priorResults.find(r => r.sourceAgent === "specialist_planner");
      if (!plannerResult) return undefined;
      return {
        planSummary: plannerResult.summary,
        planDeliverables: plannerResult.deliverables,
      };
    }

    case "reviewer":
    case "tester": {
      const builderResult = priorResults.find(r => r.sourceAgent === "specialist_builder");
      if (!builderResult) return undefined;
      return {
        modifiedFiles: builderResult.modifiedFiles,
        implementationSummary: builderResult.summary,
      };
    }

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
  }
}

/**
 * Delegate a task to a named team.
 * The team router executes the team's state machine and returns
 * a single team-level result (teams are opaque to the orchestrator).
 */
export async function delegateToTeam(input: {
  teamId: string;
  taskPacket: TaskPacket;
  signal?: AbortSignal;
  logger?: DelegationLogger;
  hookRegistry?: HookRegistry;
}): Promise<DelegationOutput> {
  const { TEAM_REGISTRY } = await import("../teams/definitions.js");
  const team = TEAM_REGISTRY[input.teamId];

  if (!team) {
    const failurePacket = createResultPacket({
      taskId: input.taskPacket.id,
      status: "failure",
      summary: `Unknown team: '${input.teamId}'`,
      deliverables: [],
      modifiedFiles: [],
      sourceAgent: "orchestrator",
    });
    return { resultPacket: failurePacket, success: false };
  }

  const { executeTeam } = await import("../teams/router.js");
  const teamResult = await executeTeam(
    team,
    input.taskPacket,
    input.signal,
    input.logger,
    input.hookRegistry
  );

  return {
    resultPacket: teamResult.resultPacket,
    success: teamResult.success,
    sessionArtifact: teamResult.sessionArtifact,
  };
}
