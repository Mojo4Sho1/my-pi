/**
 * Builder Specialist Extension
 *
 * Registers a `delegate-to-builder` tool that delegates bounded
 * implementation tasks to the builder specialist sub-agent.
 *
 * Stage 2 deliverable — see docs/IMPLEMENTATION_PLAN.md
 */

import { createSpecialistExtension } from "../../shared/specialist-extension.js";
import { BUILDER_PROMPT_CONFIG } from "./prompt.js";

export default createSpecialistExtension({
  promptConfig: BUILDER_PROMPT_CONFIG,
  toolName: "delegate-to-builder",
  toolLabel: "Delegate to Builder",
  toolDescription:
    "Delegate a bounded implementation task to the builder specialist. " +
    "The builder executes within explicit scope constraints and returns " +
    "a structured result packet.",
});
