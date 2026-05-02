/**
 * Schema validation for agent definitions and team definitions (Stage 4c).
 *
 * Provides functions to parse agent definition markdown files and validate
 * them against the expected structure from AGENT_DEFINITION_CONTRACT.md.
 * Also validates TeamDefinition objects for member existence, state machine
 * validity, and contract compatibility at transitions.
 *
 * Validators are library functions exercised by test files — no CLI command
 * or Pi-registered command. Validation runs as part of `make test`.
 */

import type {
  TeamDefinition,
  InputContract,
  OutputContract,
} from "./types.js";
import { validateStateMachine } from "./routing.js";
import { contractsCompatible } from "./contracts.js";
import { resolveSpecialistAgentId } from "./constants.js";

// --- Parsed Agent Definition Types ---

export interface ParsedSection {
  name: string;
  fields: Record<string, string | string[]>;
}

export interface ParsedAgentDefinition {
  sections: Record<string, ParsedSection>;
  rawContent: string;
}

// --- Team Validation Context ---

export interface TeamValidationContext {
  knownSpecialistIds: string[];
  specialistContracts: Record<string, { input: InputContract; output: OutputContract }>;
}

// --- Constants ---

const REQUIRED_SPECIALIST_SECTIONS = [
  "Definition",
  "Intent",
  "Working Style",
  "Routing and access",
  "Inputs and outputs",
  "Control and escalation",
  "Validation",
  "Relationships",
  "Authority flags",
  "Specialist-specific fields",
];

const REQUIRED_DEFINITION_FIELDS = ["id", "name", "definition_type"];
const REQUIRED_INTENT_FIELDS = ["purpose", "scope", "non_goals"];
const REQUIRED_ROUTING_FIELDS = ["routing_class", "context_scope", "default_read_set", "forbidden_by_default"];
const REQUIRED_IO_FIELDS = ["required_inputs", "expected_outputs", "handback_format"];
const REQUIRED_CONTROL_FIELDS = ["activation_conditions", "escalation_conditions"];
const REQUIRED_VALIDATION_FIELDS = ["validation_expectations"];
const REQUIRED_RELATIONSHIPS_FIELDS = ["related_docs", "related_definitions"];
const REQUIRED_AUTHORITY_FIELDS = [
  "can_delegate",
  "can_synthesize",
  "can_update_handoff",
  "can_update_workflow_docs",
  "can_request_broader_context",
];
const REQUIRED_SPECIALIST_SPECIFIC_FIELDS = [
  "specialization",
  "task_boundary",
  "deliverable_boundary",
  "failure_boundary",
];
const REQUIRED_WORKING_STYLE_SUBFIELDS = [
  "reasoning_posture",
  "communication_posture",
  "risk_posture",
  "default_bias",
  "anti_patterns",
];

const SECTION_REQUIRED_FIELDS: Record<string, string[]> = {
  "Definition": REQUIRED_DEFINITION_FIELDS,
  "Intent": REQUIRED_INTENT_FIELDS,
  "Routing and access": REQUIRED_ROUTING_FIELDS,
  "Inputs and outputs": REQUIRED_IO_FIELDS,
  "Control and escalation": REQUIRED_CONTROL_FIELDS,
  "Validation": REQUIRED_VALIDATION_FIELDS,
  "Relationships": REQUIRED_RELATIONSHIPS_FIELDS,
  "Authority flags": REQUIRED_AUTHORITY_FIELDS,
  "Specialist-specific fields": REQUIRED_SPECIALIST_SPECIFIC_FIELDS,
};

/** Check if a parsed field value is effectively empty */
function isEmptyValue(val: string | string[] | undefined): boolean {
  if (val === undefined) return true;
  if (typeof val === "string") return val.trim() === "";
  if (Array.isArray(val)) return val.length === 0;
  return false;
}

function normalizeAgentReference(agentId: string): string {
  return resolveSpecialistAgentId(agentId) ?? agentId;
}

// --- Agent Definition Parser ---

/**
 * Parse an agent definition markdown file into structured sections and fields.
 *
 * Expects ## headers for sections and `field_name`: value entries within them.
 * List fields (indented sub-items) are collected as string arrays.
 */
export function parseAgentDefinition(markdown: string): ParsedAgentDefinition {
  const sections: Record<string, ParsedSection> = {};
  const sectionBlocks = markdown.split(/^## /m);

  for (const block of sectionBlocks) {
    if (!block.trim()) continue;

    const lines = block.split("\n");
    const sectionName = lines[0].trim();

    // Skip the h1 title line (before any ## section)
    if (sectionName.startsWith("# ") || sectionName.match(/^[a-z_]+\.md$/i)) continue;

    const fields: Record<string, string | string[]> = {};
    let currentField: string | null = null;
    let currentList: string[] | null = null;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];

      // Match `field_name`: value pattern
      const fieldMatch = line.match(/^- `([^`]+)`:\s*(.*)/);
      if (fieldMatch) {
        // Save previous list field if any
        if (currentField && currentList) {
          fields[currentField] = currentList;
        }

        const fieldName = fieldMatch[1];
        const value = fieldMatch[2].trim();

        if (value) {
          // Inline value (not a list)
          fields[fieldName] = value;
          currentField = fieldName;
          currentList = null;
        } else {
          // Empty value — expect indented list items below
          currentField = fieldName;
          currentList = [];
        }
        continue;
      }

      // Match indented sub-field: `sub_field`: value (inside working_style)
      const subFieldMatch = line.match(/^\s+- `([^`]+)`:\s*(.*)/);
      if (subFieldMatch && currentField) {
        const subFieldName = subFieldMatch[1];
        const subValue = subFieldMatch[2].trim();

        if (subValue) {
          // Nested field with a value — store under parent as a special key
          if (currentList) {
            // We're building a list for the parent, but this is a named sub-field
            // For working_style, store sub-fields in the parent section
            fields[subFieldName] = subValue;
          } else {
            fields[subFieldName] = subValue;
          }
        } else {
          // Nested field expecting a list (e.g., anti_patterns)
          if (currentList) {
            // Save current parent list
            fields[currentField] = currentList;
          }
          currentField = subFieldName;
          currentList = [];
        }
        continue;
      }

      // Match indented list item (deeper nesting)
      const deepListMatch = line.match(/^\s{4,}- (.+)/);
      if (deepListMatch && currentField && currentList !== null) {
        currentList.push(deepListMatch[1].trim());
        continue;
      }

      // Match indented list item
      const listMatch = line.match(/^\s{2,}- (.+)/);
      if (listMatch && currentField) {
        if (currentList === null) {
          currentList = [];
        }
        currentList.push(listMatch[1].trim());
        continue;
      }
    }

    // Save last field if it was a list
    if (currentField && currentList) {
      fields[currentField] = currentList;
    }

    sections[sectionName] = { name: sectionName, fields };
  }

  return { sections, rawContent: markdown };
}

// --- Agent Definition Validator ---

/**
 * Validate a parsed agent definition for a given definition type.
 * Returns an array of error strings (empty if valid).
 */
export function validateAgentDefinition(
  parsed: ParsedAgentDefinition,
  definitionType: "specialist"
): string[] {
  const errors: string[] = [];

  // 1. Check required sections
  for (const section of REQUIRED_SPECIALIST_SECTIONS) {
    if (!parsed.sections[section]) {
      errors.push(`Missing required section: '${section}'`);
    }
  }

  // 2. Check required fields within each section
  for (const [sectionName, requiredFields] of Object.entries(SECTION_REQUIRED_FIELDS)) {
    const section = parsed.sections[sectionName];
    if (!section) continue; // Already reported as missing section

    for (const field of requiredFields) {
      if (!(field in section.fields)) {
        errors.push(`Missing required field '${field}' in section '${sectionName}'`);
      }
    }
  }

  // 3. Check working_style completeness
  const workingStyleSection = parsed.sections["Working Style"];
  if (workingStyleSection) {
    for (const subField of REQUIRED_WORKING_STYLE_SUBFIELDS) {
      if (!(subField in workingStyleSection.fields)) {
        errors.push(`Missing required working_style field: '${subField}'`);
      }
    }
  }

  // 4. Value validation
  const defSection = parsed.sections["Definition"];
  if (defSection) {
    if (defSection.fields["definition_type"] !== definitionType) {
      errors.push(
        `Expected definition_type '${definitionType}', got '${defSection.fields["definition_type"]}'`
      );
    }
  }

  const routingSection = parsed.sections["Routing and access"];
  if (routingSection) {
    if (definitionType === "specialist" && routingSection.fields["routing_class"] !== "downstream") {
      errors.push(
        `Specialist routing_class must be 'downstream', got '${routingSection.fields["routing_class"]}'`
      );
    }
  }

  const authoritySection = parsed.sections["Authority flags"];
  if (authoritySection) {
    if (definitionType === "specialist" && authoritySection.fields["can_delegate"] !== "false") {
      errors.push(
        `Specialist can_delegate must be 'false', got '${authoritySection.fields["can_delegate"]}'`
      );
    }
  }

  // 5. Non-empty required fields
  const intentSection = parsed.sections["Intent"];
  if (intentSection) {
    if (isEmptyValue(intentSection.fields["purpose"])) {
      errors.push("Field 'purpose' must not be empty");
    }
    if (isEmptyValue(intentSection.fields["scope"])) {
      errors.push("Field 'scope' must not be empty");
    }
  }

  const specialistSection = parsed.sections["Specialist-specific fields"];
  if (specialistSection) {
    const specVal = specialistSection.fields["specialization"];
    if (isEmptyValue(specVal)) {
      errors.push("Field 'specialization' must not be empty");
    }
  }

  return errors;
}

// --- Team Definition Validator ---

/**
 * Validate a TeamDefinition object for structural correctness and
 * contract compatibility at transitions.
 * Returns an array of error strings (empty if valid).
 */
export function validateTeamDefinition(
  team: TeamDefinition,
  context: TeamValidationContext
): string[] {
  const errors: string[] = [];
  const knownSpecialistIds = new Set(context.knownSpecialistIds.map(normalizeAgentReference));
  const specialistContracts = Object.fromEntries(
    Object.entries(context.specialistContracts).map(([agentId, contracts]) => [
      normalizeAgentReference(agentId),
      contracts,
    ])
  );

  // 1. Member existence — all member IDs should be known specialists
  for (const memberId of team.members) {
    if (!knownSpecialistIds.has(normalizeAgentReference(memberId))) {
      errors.push(`Unknown specialist in members: '${memberId}'`);
    }
  }

  // 2. State machine structural validity — reuse existing validator
  const machineErrors = validateStateMachine(team.states);
  errors.push(...machineErrors);

  // 3. Agent references — every state.agent must be a member or "orchestrator"
  const allowedAgents = new Set([
    ...team.members.map(normalizeAgentReference),
    "orchestrator",
  ]);
  for (const [stateName, stateDef] of Object.entries(team.states.states)) {
    if (!allowedAgents.has(normalizeAgentReference(stateDef.agent))) {
      errors.push(
        `State '${stateName}' references unknown agent '${stateDef.agent}' (not a team member or 'orchestrator')`
      );
    }
  }

  // 4. Contract compatibility at transitions
  for (const [stateName, stateDef] of Object.entries(team.states.states)) {
    // Skip terminal states (no outgoing transitions)
    if (team.states.terminalStates.includes(stateName)) continue;

    const sourceContracts = specialistContracts[normalizeAgentReference(stateDef.agent)];
    if (!sourceContracts) continue; // Non-specialist agent (e.g. orchestrator)

    for (const transition of stateDef.transitions) {
      const targetState = team.states.states[transition.to];
      if (!targetState) continue; // Invalid target caught by validateStateMachine

      // Skip terminal states as targets — they use orchestrator, no input contract
      if (team.states.terminalStates.includes(transition.to)) continue;

      const targetContracts = specialistContracts[normalizeAgentReference(targetState.agent)];
      if (!targetContracts) continue; // Non-specialist target

      const { compatible, missingFields } = contractsCompatible(
        sourceContracts.output,
        targetContracts.input
      );

      if (!compatible) {
        errors.push(
          `Incompatible contracts at transition '${stateName}' → '${transition.to}': ` +
          `${stateDef.agent}'s output cannot satisfy ${targetState.agent}'s input ` +
          `(missing: ${missingFields.join(", ")})`
        );
      }
    }
  }

  return errors;
}
