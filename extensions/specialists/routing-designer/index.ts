import { createSpecialistExtension } from "../../shared/specialist-extension.js";
import { ROUTING_DESIGNER_PROMPT_CONFIG } from "./prompt.js";

export default createSpecialistExtension({
  promptConfig: ROUTING_DESIGNER_PROMPT_CONFIG,
  toolName: "delegate-to-routing-designer",
  toolLabel: "Delegate to Routing-Designer",
  toolDescription:
    "Delegate a routing or state machine design task to the routing-designer specialist. " +
    "The routing-designer produces state machine definitions with transition completeness analysis.",
});
