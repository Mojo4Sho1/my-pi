/**
 * Model routing configuration for specialist extensions (Stage 4e).
 *
 * Resolves which model a specialist should use via a 4-level precedence chain:
 * 1. runtimeOverride — explicit override from DelegationInput
 * 2. projectConfig — project-level model assignment
 * 3. specialistDefault — declared in SpecialistPromptConfig.preferredModel
 * 4. (implicit) host default — Pi's own model selection when no --model flag
 */

import type { ModelResolutionContext } from "./types.js";

/**
 * Resolve which model a specialist should use.
 * Returns undefined when no override applies (use host default).
 */
export function resolveModel(context: ModelResolutionContext): string | undefined {
  return context.runtimeOverride
    ?? context.projectConfig
    ?? context.specialistDefault
    ?? undefined;
}
