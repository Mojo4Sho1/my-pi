/**
 * Tester Specialist Extension
 *
 * Registers a `delegate-to-tester` tool that delegates bounded
 * test-authoring tasks to the tester specialist sub-agent.
 */

import { createSpecialistExtension } from "../../shared/specialist-extension.js";
import { TESTER_PROMPT_CONFIG } from "./prompt.js";

export default createSpecialistExtension({
  promptConfig: TESTER_PROMPT_CONFIG,
  toolName: "delegate-to-tester",
  toolLabel: "Delegate to Tester",
  toolDescription:
    "Delegate a test-authoring task to the tester specialist. The tester " +
    "writes focused tests, execution commands, and pass conditions " +
    "that the builder or runtime should satisfy.",
});
