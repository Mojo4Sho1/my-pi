/**
 * I/O contract validation utilities (Stage 4a).
 *
 * Provides functions to validate that specialist outputs match their
 * declared contracts, that inputs satisfy requirements, and that
 * adjacent specialists in a pipeline are compatible.
 */

import type {
  InputContract,
  OutputContract,
  ContractField,
  ContractFieldType,
  ResultPacket,
  TeamStepArtifact,
} from "./types.js";

const SHARED_RESULT_FIELD_TYPES: Readonly<Record<string, ContractFieldType>> = {
  summary: "string",
  deliverables: "string[]",
  modifiedFiles: "string[]",
};

const INPUT_FIELD_ALIASES: Readonly<Record<string, readonly string[]>> = {
  modifiedFiles: ["modifiedFiles"],
  planSummary: ["summary"],
  planSteps: ["steps", "deliverables"],
  planDeliverables: ["steps", "deliverables"],
  implementationSummary: ["changeDescription", "summary"],
  changeDescription: ["changeDescription", "summary"],
  specSummary: ["summary"],
  specDeliverables: ["deliverables"],
  schemaSummary: ["summary"],
  schemaDeliverables: ["deliverables"],
};

/**
 * Check whether a runtime value matches a declared ContractFieldType.
 */
function matchesType(value: unknown, expectedType: ContractFieldType): boolean {
  switch (expectedType) {
    case "string":
      return typeof value === "string";
    case "string[]":
      return Array.isArray(value) && value.every((v) => typeof v === "string");
    case "boolean":
      return typeof value === "boolean";
    case "number":
      return typeof value === "number";
    case "object":
      return typeof value === "object" && value !== null && !Array.isArray(value);
    case "object[]":
      return Array.isArray(value) && value.every((v) => typeof v === "object" && v !== null && !Array.isArray(v));
    default:
      return false;
  }
}

/**
 * Validate that a structured output payload satisfies an output contract.
 * Returns an array of error strings (empty if valid).
 */
export function validateOutputContract(
  outputPayload: Record<string, unknown> | undefined,
  contract: OutputContract
): string[] {
  const errors: string[] = [];

  for (const field of contract.fields) {
    const value = outputPayload?.[field.name];

    if (value === undefined || value === null) {
      if (field.required) {
        errors.push(`Missing required output field '${field.name}'`);
      }
      continue;
    }

    if (!matchesType(value, field.type)) {
      errors.push(
        `Output field '${field.name}' has wrong type: expected ${field.type}, got ${typeof value}${Array.isArray(value) ? "[]" : ""}`
      );
    }
  }

  return errors;
}

/**
 * Collect the subset of structured output fields that satisfy the declared output contract.
 * This lets the router persist and forward only validated named fields even when the overall contract is not fully satisfied.
 */
export function collectValidatedOutputFields(
  outputPayload: Record<string, unknown> | undefined,
  contract: OutputContract
): Record<string, unknown> {
  const validatedFields: Record<string, unknown> = {};

  if (!outputPayload) {
    return validatedFields;
  }

  for (const field of contract.fields) {
    const value = outputPayload[field.name];
    if (value !== undefined && value !== null && matchesType(value, field.type)) {
      validatedFields[field.name] = value;
    }
  }

  return validatedFields;
}

/**
 * Validate that a context object satisfies an input contract.
 * Returns an array of error strings (empty if valid).
 */
export function validateInputContract(
  context: Record<string, unknown> | undefined,
  contract: InputContract
): string[] {
  const errors: string[] = [];
  const requiredFields = contract.fields.filter((f) => f.required);

  // No required fields and no context — valid
  if (requiredFields.length === 0) {
    return errors;
  }

  // Required fields but no context — error for each
  if (!context) {
    for (const field of requiredFields) {
      errors.push(`Missing required input field '${field.name}' (context is undefined)`);
    }
    return errors;
  }

  for (const field of contract.fields) {
    const value = context[field.name];

    if (value === undefined || value === null) {
      if (field.required) {
        errors.push(`Missing required input field '${field.name}'`);
      }
      continue;
    }

    if (!matchesType(value, field.type)) {
      errors.push(
        `Input field '${field.name}' has wrong type: expected ${field.type}, got ${typeof value}${Array.isArray(value) ? "[]" : ""}`
      );
    }
  }

  return errors;
}

/**
 * Check if an output contract can satisfy an input contract statically
 * (without runtime data). Verifies that every required input field has
 * a matching upstream field, allowing for shared ResultPacket fields and
 * transitional alias mappings used by runtime packet construction.
 */
export function contractsCompatible(
  outputContract: OutputContract,
  inputContract: InputContract
): { compatible: boolean; missingFields: string[] } {
  const outputFieldMap = new Map<string, ContractField>();
  for (const field of outputContract.fields) {
    outputFieldMap.set(field.name, field);
  }

  const missingFields: string[] = [];

  for (const inputField of inputContract.fields) {
    if (!inputField.required) continue;

    const candidateNames = [inputField.name, ...(INPUT_FIELD_ALIASES[inputField.name] ?? [])];
    let compatible = false;
    let mismatchMessage: string | undefined;

    for (const candidateName of candidateNames) {
      const outputField = outputFieldMap.get(candidateName);
      if (outputField) {
        if (outputField.type === inputField.type) {
          compatible = true;
          break;
        }

        mismatchMessage = `${inputField.name} (type mismatch: output=${outputField.type}, input=${inputField.type})`;
        continue;
      }

      const sharedType = SHARED_RESULT_FIELD_TYPES[candidateName];
      if (sharedType) {
        if (sharedType === inputField.type) {
          compatible = true;
          break;
        }

        mismatchMessage = `${inputField.name} (type mismatch: output=${sharedType}, input=${inputField.type})`;
      }
    }

    if (!compatible) {
      missingFields.push(mismatchMessage ?? inputField.name);
    }
  }

  return {
    compatible: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Build context for a downstream specialist from prior results,
 * using the specialist's input contract to select fields.
 *
 * For each field in the input contract that has a `sourceSpecialist`,
 * finds the matching prior result and extracts the field value from the
 * preserved structured payload first, then shared ResultPacket fields.
 *
 * Returns undefined if no fields could be extracted.
 */
export function buildContextFromContract(
  inputContract: InputContract,
  priorResults: ResultPacket[]
): Record<string, unknown> | undefined {
  if (inputContract.fields.length === 0) {
    return undefined;
  }

  const context: Record<string, unknown> = {};
  let hasAnyField = false;

  for (const field of inputContract.fields) {
    if (!field.sourceSpecialist) continue;

    const sourceResult = priorResults.find(
      (r) => r.sourceAgent === `specialist_${field.sourceSpecialist}`
    );

    if (!sourceResult) continue;

    // Map well-known field names to ResultPacket properties
    const value = extractFieldFromResult(field.name, sourceResult);
    if (value !== undefined) {
      context[field.name] = value;
      hasAnyField = true;
    }
  }

  return hasAnyField ? context : undefined;
}

/**
 * Build context for a downstream specialist from router-owned step artifacts.
 * Only validated artifact fields and artifact metadata are eligible routing inputs.
 */
export function buildContextFromArtifacts(
  inputContract: InputContract,
  priorArtifacts: TeamStepArtifact[]
): Record<string, unknown> | undefined {
  if (inputContract.fields.length === 0) {
    return undefined;
  }

  const context: Record<string, unknown> = {};
  let hasAnyField = false;

  for (const field of inputContract.fields) {
    if (!field.sourceSpecialist) continue;

    const sourceArtifact = [...priorArtifacts].reverse().find(
      (artifact) => artifact.specialistId === `specialist_${field.sourceSpecialist}`
    );

    if (!sourceArtifact) continue;

    const value = extractFieldFromArtifact(field.name, sourceArtifact);
    if (value !== undefined) {
      context[field.name] = value;
      hasAnyField = true;
    }
  }

  return hasAnyField ? context : undefined;
}

/**
 * Extract a named field from a ResultPacket.
 * Maps contract field names to ResultPacket properties.
 */
function extractFieldFromResult(
  fieldName: string,
  result: ResultPacket
): unknown {
  const structuredValue = result.structuredOutput?.[fieldName];
  if (structuredValue !== undefined) {
    return structuredValue;
  }

  // Direct ResultPacket property mappings and transitional aliases
  switch (fieldName) {
    case "modifiedFiles":
      return result.structuredOutput?.modifiedFiles ?? result.modifiedFiles;
    case "implementationSummary":
      return result.structuredOutput?.changeDescription ?? result.summary;
    case "planSummary":
      return result.summary;
    case "planDeliverables":
    case "planSteps":
      return result.structuredOutput?.steps ?? result.deliverables;
    case "changeDescription":
      return result.structuredOutput?.changeDescription ?? result.summary;
    case "specSummary":
      return result.summary;
    case "specDeliverables":
      return result.deliverables;
    case "schemaSummary":
      return result.summary;
    case "schemaDeliverables":
      return result.deliverables;
    case "priorSummaries":
      return undefined; // Built from multiple results, not extracted from one
    case "priorDeliverables":
      return undefined; // Same — handled by buildContextForSpecialist directly
    default:
      return undefined;
  }
}

/**
 * Extract a named field from a canonical team step artifact.
 * Uses only contract-validated output fields plus router-owned artifact metadata.
 */
function extractFieldFromArtifact(
  fieldName: string,
  artifact: TeamStepArtifact
): unknown {
  const validatedValue = artifact.validatedOutput[fieldName];
  if (validatedValue !== undefined) {
    return validatedValue;
  }

  switch (fieldName) {
    case "modifiedFiles":
      return artifact.validatedOutput.modifiedFiles ?? artifact.modifiedFiles;
    case "implementationSummary":
      return artifact.validatedOutput.changeDescription ?? artifact.summary;
    case "planSummary":
      return artifact.summary;
    case "planDeliverables":
    case "planSteps":
      return artifact.validatedOutput.steps ?? artifact.deliverables;
    case "changeDescription":
      return artifact.validatedOutput.changeDescription ?? artifact.summary;
    case "specSummary":
    case "schemaSummary":
      return artifact.summary;
    case "specDeliverables":
    case "schemaDeliverables":
      return artifact.deliverables;
    case "priorSummaries":
    case "priorDeliverables":
      return undefined;
    default:
      return undefined;
  }
}
