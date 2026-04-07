/**
 * Deterministic sandboxing and path protection (Stage 5a.1c, Decision #38).
 *
 * Converts the architectural authority model (read-only specialists, bounded
 * write sets) into deterministic runtime enforcement. Every delegation carries
 * a PolicyEnvelope validated before subprocess spawn.
 */

import {
  SPECIALIST_IDS,
} from "./constants.js";
import type {
  PolicyEnvelope,
  PolicyViolation,
  SpawnRecord,
} from "./types.js";

export const READ_ONLY_SPECIALISTS: ReadonlySet<string> = new Set([
  SPECIALIST_IDS.PLANNER,
  SPECIALIST_IDS.REVIEWER,
  SPECIALIST_IDS.CRITIC,
  SPECIALIST_IDS.SPEC_WRITER,
  SPECIALIST_IDS.SCHEMA_DESIGNER,
  SPECIALIST_IDS.ROUTING_DESIGNER,
  SPECIALIST_IDS.BOUNDARY_AUDITOR,
]);

export const WRITE_SPECIALISTS: ReadonlySet<string> = new Set([
  SPECIALIST_IDS.BUILDER,
  SPECIALIST_IDS.TESTER,
]);

interface PolicyContext {
  sessionId?: string;
  invocationId?: string;
}

function toSpecialistId(specialistId: string): string {
  return specialistId.startsWith("specialist_")
    ? specialistId.slice("specialist_".length)
    : specialistId;
}

function normalizePath(input: string): string {
  const withForwardSlashes = input.replace(/\\/g, "/").replace(/\/+/g, "/");
  if (withForwardSlashes.length > 1 && withForwardSlashes.endsWith("/")) {
    return withForwardSlashes.slice(0, -1);
  }
  return withForwardSlashes;
}

function escapeRegex(source: string): string {
  return source.replace(/[.+^${}()|[\]\\]/g, "\\$&");
}

function globToRegExp(glob: string): RegExp {
  const normalized = normalizePath(glob);
  let pattern = "";
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    const next = normalized[i + 1];
    if (char === "*" && next === "*") {
      pattern += ".*";
      i++;
      continue;
    }
    if (char === "*") {
      pattern += "[^/]*";
      continue;
    }
    pattern += escapeRegex(char);
  }

  if (normalized.startsWith("**/")) {
    pattern = "(?:.*/)?" + pattern.slice(4);
  }

  return new RegExp(`^${pattern}$`);
}

function createViolation(
  violationType: PolicyViolation["violationType"],
  attemptedAction: string,
  envelope: PolicyEnvelope,
  details: {
    targetPath?: string;
    targetCommand?: string;
    context?: PolicyContext;
  } = {},
): PolicyViolation {
  return {
    timestamp: new Date().toISOString(),
    sessionId: details.context?.sessionId ?? "unknown_session",
    invocationId: details.context?.invocationId ?? "unknown_invocation",
    attemptedAction,
    targetPath: details.targetPath,
    targetCommand: details.targetCommand,
    expectedPolicy: {
      allowedWritePaths: envelope.allowedWritePaths,
      allowedReadRoots: envelope.allowedReadRoots,
      allowShell: envelope.allowShell,
      allowNetwork: envelope.allowNetwork,
      allowProcessSpawn: envelope.allowProcessSpawn,
      allowedCommands: envelope.allowedCommands,
      forbiddenGlobs: envelope.forbiddenGlobs,
    },
    violationType,
    enforcementResult: "blocked",
  };
}

/**
 * Build a policy envelope for a specialist based on its authority class and task packet.
 */
export function buildDefaultEnvelope(
  specialistId: string,
  taskPacket: { allowedReadSet: string[]; allowedWriteSet: string[] }
): PolicyEnvelope {
  const normalizedSpecialistId = toSpecialistId(specialistId);
  const isReadOnly = READ_ONLY_SPECIALISTS.has(normalizedSpecialistId);

  return {
    allowedWritePaths: isReadOnly ? [] : [...taskPacket.allowedWriteSet],
    allowedReadRoots: [...taskPacket.allowedReadSet],
    allowShell: !isReadOnly,
    allowNetwork: false,
    allowProcessSpawn: !isReadOnly,
    allowedCommands: undefined,
    forbiddenGlobs: [
      "**/.env",
      "**/.env.*",
      "**/credentials*",
      "**/secrets*",
      "**/*.pem",
      "**/*.key",
    ],
  };
}

/**
 * Validate that a policy envelope is structurally sound.
 */
export function validateEnvelope(envelope: PolicyEnvelope): string[] {
  const errors: string[] = [];

  if (!Array.isArray(envelope.allowedWritePaths)) {
    errors.push("allowedWritePaths must be an array");
  }
  if (!Array.isArray(envelope.allowedReadRoots)) {
    errors.push("allowedReadRoots must be an array");
  }
  if (typeof envelope.allowShell !== "boolean") {
    errors.push("allowShell must be a boolean");
  }
  if (typeof envelope.allowNetwork !== "boolean") {
    errors.push("allowNetwork must be a boolean");
  }
  if (typeof envelope.allowProcessSpawn !== "boolean") {
    errors.push("allowProcessSpawn must be a boolean");
  }
  if (envelope.allowedCommands && !Array.isArray(envelope.allowedCommands)) {
    errors.push("allowedCommands must be an array when provided");
  }
  if (envelope.forbiddenGlobs && !Array.isArray(envelope.forbiddenGlobs)) {
    errors.push("forbiddenGlobs must be an array when provided");
  }

  for (const path of envelope.allowedWritePaths) {
    if (typeof path !== "string" || path.trim() === "") {
      errors.push("allowedWritePaths may not contain empty entries");
      break;
    }
  }
  for (const root of envelope.allowedReadRoots) {
    if (typeof root !== "string" || root.trim() === "") {
      errors.push("allowedReadRoots may not contain empty entries");
      break;
    }
  }

  if (!envelope.allowShell && envelope.allowedCommands && envelope.allowedCommands.length > 0) {
    errors.push("allowedCommands cannot be set when allowShell is false");
  }

  return errors;
}

/**
 * Check if a target path is equal to or inside a root path.
 */
function pathIsWithin(target: string, root: string): boolean {
  const normalizedTarget = normalizePath(target);
  const normalizedRoot = normalizePath(root);

  if (normalizedTarget === normalizedRoot) {
    return true;
  }

  return normalizedTarget.startsWith(`${normalizedRoot}/`);
}

/**
 * Check if a path matches any forbidden glob.
 */
function matchesForbiddenGlob(targetPath: string, globs: string[] | undefined): boolean {
  if (!globs || globs.length === 0) {
    return false;
  }

  const normalizedPath = normalizePath(targetPath);
  return globs.some((glob) => globToRegExp(glob).test(normalizedPath));
}

/**
 * Check whether a specific path access is allowed by the envelope.
 */
export function checkPathAccess(
  path: string,
  envelope: PolicyEnvelope,
  action: "read" | "write",
  context?: PolicyContext
): PolicyViolation | null {
  const normalizedPath = normalizePath(path);

  if (action === "write") {
    if (envelope.allowedWritePaths.length === 0) {
      return createViolation("write_denied", "write", envelope, {
        targetPath: normalizedPath,
        context,
      });
    }

    const allowed = envelope.allowedWritePaths.some((allowedPath) => pathIsWithin(normalizedPath, allowedPath));
    if (!allowed) {
      return createViolation("write_denied", "write", envelope, {
        targetPath: normalizedPath,
        context,
      });
    }

    if (matchesForbiddenGlob(normalizedPath, envelope.forbiddenGlobs)) {
      return createViolation("glob_forbidden", "write", envelope, {
        targetPath: normalizedPath,
        context,
      });
    }
  }

  if (action === "read") {
    const allowed = envelope.allowedReadRoots.some((root) => pathIsWithin(normalizedPath, root));
    if (!allowed) {
      return createViolation("read_denied", "read", envelope, {
        targetPath: normalizedPath,
        context,
      });
    }
  }

  return null;
}

/**
 * Validate a set of write paths against the envelope.
 */
export function checkWritePaths(
  writePaths: string[],
  envelope: PolicyEnvelope,
  context?: PolicyContext
): PolicyViolation[] {
  return writePaths
    .map((path) => checkPathAccess(path, envelope, "write", context))
    .filter((violation): violation is PolicyViolation => violation !== null);
}

/**
 * Create a SpawnRecord artifact for traceability.
 */
export function createSpawnRecord(
  specialistId: string,
  envelope: PolicyEnvelope,
  outcome: SpawnRecord["outcome"],
  reason?: string,
  sessionId: string = "unknown_session"
): SpawnRecord {
  return {
    timestamp: new Date().toISOString(),
    sessionId,
    specialistId,
    policyEnvelope: envelope,
    outcome,
    blockReason: reason,
  };
}
