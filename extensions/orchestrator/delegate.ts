/**
 * Delegation lifecycle for the orchestrator.
 *
 * Wraps the shared specialist infrastructure (prompt building, subprocess
 * spawning, result parsing) into a single delegation call.
 */

import type { TaskPacket, ResultPacket } from "../shared/types.js";
import type { SpecialistPromptConfig } from "../shared/specialist-prompt.js";
import { buildSpecialistSystemPrompt, buildSpecialistTaskPrompt } from "../shared/specialist-prompt.js";
import { spawnSpecialistAgent } from "../shared/subprocess.js";
import { parseSpecialistOutput } from "../shared/result-parser.js";
import { createResultPacket, validateResultPacket } from "../shared/packets.js";
import { BUILDER_PROMPT_CONFIG } from "../specialists/builder/prompt.js";
import { PLANNER_PROMPT_CONFIG } from "../specialists/planner/prompt.js";
import { REVIEWER_PROMPT_CONFIG } from "../specialists/reviewer/prompt.js";
import { TESTER_PROMPT_CONFIG } from "../specialists/tester/prompt.js";
import type { SpecialistId } from "./select.js";

export interface DelegationInput {
  /** Prompt configuration for the target specialist */
  promptConfig: SpecialistPromptConfig;
  /** Task packet to delegate */
  taskPacket: TaskPacket;
  /** Optional abort signal */
  signal?: AbortSignal;
}

export interface DelegationOutput {
  /** The result packet from the specialist */
  resultPacket: ResultPacket;
  /** Whether the delegation was successful (status is "success") */
  success: boolean;
}

const PROMPT_CONFIG_MAP: Record<SpecialistId, SpecialistPromptConfig> = {
  builder: BUILDER_PROMPT_CONFIG,
  planner: PLANNER_PROMPT_CONFIG,
  reviewer: REVIEWER_PROMPT_CONFIG,
  tester: TESTER_PROMPT_CONFIG,
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
  const { promptConfig, taskPacket, signal } = input;
  const agentId = promptConfig.id;

  // 1. Build prompts
  const systemPrompt = buildSpecialistSystemPrompt(promptConfig);
  const taskPrompt = buildSpecialistTaskPrompt(taskPacket);

  // 2. Spawn the specialist sub-agent
  let subAgentResult;
  try {
    subAgentResult = await spawnSpecialistAgent(systemPrompt, taskPrompt, signal);
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
    return { resultPacket: failurePacket, success: false };
  }

  // 3. Handle process-level failures
  if (subAgentResult.exitCode !== 0 && !subAgentResult.finalText) {
    const failurePacket = createResultPacket({
      taskId: taskPacket.id,
      status: "failure",
      summary: `${promptConfig.roleName} process exited with code ${subAgentResult.exitCode}. ${subAgentResult.stderr || "No additional details."}`,
      deliverables: [],
      modifiedFiles: [],
      sourceAgent: agentId,
    });
    return { resultPacket: failurePacket, success: false };
  }

  // 4. Parse specialist output
  const parsed = parseSpecialistOutput(subAgentResult.finalText, agentId);

  // 5. Create and validate result packet
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
    return { resultPacket: fallbackPacket, success: false };
  }

  return {
    resultPacket,
    success: parsed.status === "success",
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
  }
}
