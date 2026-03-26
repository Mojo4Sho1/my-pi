/**
 * Planner Specialist Extension
 *
 * Registers a `delegate-to-planner` tool that delegates bounded
 * planning tasks to the planner specialist sub-agent.
 */

import { createSpecialistExtension } from "../../shared/specialist-extension.js";
import { PLANNER_PROMPT_CONFIG } from "./prompt.js";

export default createSpecialistExtension({
  promptConfig: PLANNER_PROMPT_CONFIG,
  toolName: "delegate-to-planner",
  toolLabel: "Delegate to Planner",
  toolDescription:
    "Delegate a scoped task to the planner specialist for decomposition " +
    "into an actionable plan with dependencies and risk analysis.",
});
