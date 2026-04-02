import { createSpecialistExtension } from "../../shared/specialist-extension.js";
import { SCHEMA_DESIGNER_PROMPT_CONFIG } from "./prompt.js";

export default createSpecialistExtension({
  promptConfig: SCHEMA_DESIGNER_PROMPT_CONFIG,
  toolName: "delegate-to-schema-designer",
  toolLabel: "Delegate to Schema-Designer",
  toolDescription:
    "Delegate a schema or type design task to the schema-designer specialist. " +
    "The schema-designer produces TypeScript interfaces, I/O contracts, and invariant documentation.",
});
