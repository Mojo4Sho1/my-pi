/**
 * Reviewer Specialist Extension
 *
 * Registers a `delegate-to-reviewer` tool that delegates bounded
 * review tasks to the reviewer specialist sub-agent.
 */

import { createSpecialistExtension } from "../../shared/specialist-extension.js";
import { REVIEWER_PROMPT_CONFIG } from "./prompt.js";

export default createSpecialistExtension({
  promptConfig: REVIEWER_PROMPT_CONFIG,
  toolName: "delegate-to-reviewer",
  toolLabel: "Delegate to Reviewer",
  toolDescription:
    "Delegate a review task to the reviewer specialist. The reviewer " +
    "evaluates artifacts against scope, consistency, and constraint " +
    "alignment, returning structured findings.",
});
