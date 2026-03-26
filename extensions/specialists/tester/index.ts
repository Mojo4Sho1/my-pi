/**
 * Tester Specialist Extension
 *
 * Registers a `delegate-to-tester` tool that delegates bounded
 * validation tasks to the tester specialist sub-agent.
 */

import { createSpecialistExtension } from "../../shared/specialist-extension.js";
import { TESTER_PROMPT_CONFIG } from "./prompt.js";

export default createSpecialistExtension({
  promptConfig: TESTER_PROMPT_CONFIG,
  toolName: "delegate-to-tester",
  toolLabel: "Delegate to Tester",
  toolDescription:
    "Delegate a validation task to the tester specialist. The tester " +
    "runs targeted checks against acceptance criteria and returns " +
    "structured pass/fail results with evidence.",
});
