import { createSpecialistExtension } from "../../shared/specialist-extension.js";
import { BOUNDARY_AUDITOR_PROMPT_CONFIG } from "./prompt.js";

export default createSpecialistExtension({
  promptConfig: BOUNDARY_AUDITOR_PROMPT_CONFIG,
  toolName: "delegate-to-boundary-auditor",
  toolLabel: "Delegate to Boundary-Auditor",
  toolDescription:
    "Delegate a boundary audit task to the boundary-auditor specialist. " +
    "The boundary-auditor checks for access control violations and excess context exposure.",
});
