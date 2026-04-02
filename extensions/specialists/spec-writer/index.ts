import { createSpecialistExtension } from "../../shared/specialist-extension.js";
import { SPEC_WRITER_PROMPT_CONFIG } from "./prompt.js";

export default createSpecialistExtension({
  promptConfig: SPEC_WRITER_PROMPT_CONFIG,
  toolName: "delegate-to-spec-writer",
  toolLabel: "Delegate to Spec-Writer",
  toolDescription:
    "Delegate a specification-writing task to the spec-writer specialist. " +
    "The spec-writer produces exhaustive prose definitions with explicit boundaries " +
    "and returns a structured result packet.",
});
