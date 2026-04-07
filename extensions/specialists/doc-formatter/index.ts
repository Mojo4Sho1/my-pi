import { createSpecialistExtension } from "../../shared/specialist-extension.js";
import { DOC_FORMATTER_PROMPT_CONFIG } from "./prompt.js";

export default createSpecialistExtension({
  promptConfig: DOC_FORMATTER_PROMPT_CONFIG,
  toolName: "delegate-to-doc-formatter",
  toolLabel: "Delegate to Doc Formatter",
  toolDescription:
    "Delegate a scoped markdown-normalization task to the doc-formatter specialist for read-only formatting cleanup.",
});
