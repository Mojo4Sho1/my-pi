import { createSpecialistExtension } from "../../shared/specialist-extension.js";
import { CRITIC_PROMPT_CONFIG } from "./prompt.js";

export default createSpecialistExtension({
  promptConfig: CRITIC_PROMPT_CONFIG,
  toolName: "delegate-to-critic",
  toolLabel: "Delegate to Critic",
  toolDescription:
    "Delegate a design evaluation task to the critic specialist. " +
    "The critic evaluates for quality, redundancy, and reuse opportunities.",
});
