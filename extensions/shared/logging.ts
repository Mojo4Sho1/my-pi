/**
 * Execution logging for the delegation system (Stage 4d).
 *
 * Provides an injectable DelegationLogger interface so that shared library
 * code (delegateToSpecialist, executeTeam) stays decoupled from the Pi runtime.
 * In production the orchestrator passes a logger backed by pi.appendEntry();
 * in tests, no logger is passed (or NULL_LOGGER is used).
 */

import type { PacketStatus, TeamDefinition, FailureReason } from "./types.js";

export type DelegationEvent =
  | "delegation_start"
  | "delegation_complete"
  | "delegation_error"
  | "preflight_fail"
  | "adequacy_failure"
  | "team_start"
  | "team_state_transition"
  | "team_complete"
  | "team_loop_exhausted";

export type LogLevel = "info" | "warn" | "error";

export interface DelegationLogEntry {
  timestamp: string;
  level: LogLevel;
  event: DelegationEvent;
  sourceAgent: string;
  targetAgent: string;
  /** Task packet ID */
  taskId: string;
  /** Result status (only present for completion/failure events) */
  status?: PacketStatus;
  /** Bounded summary (not full packet) */
  summary?: string;
  /** Failure reason category (only for failures) */
  failureReason?: FailureReason;
}

export interface DelegationLogger {
  log(entry: DelegationLogEntry): void;
}

/** No-op logger for tests and environments without Pi runtime */
export const NULL_LOGGER: DelegationLogger = {
  log() {},
};

/**
 * Create a logger backed by pi.appendEntry().
 * Called once in the orchestrator extension's execute() function.
 */
export function createPiLogger(pi: { appendEntry(type: string, data?: unknown): void }): DelegationLogger {
  return {
    log(entry: DelegationLogEntry) {
      pi.appendEntry("delegation_log", entry);
    },
  };
}

/**
 * Compute a deterministic version string from a team definition.
 * Uses djb2 hash of the structural fields — not cryptographic, just a fingerprint.
 */
export function computeTeamVersion(team: TeamDefinition): string {
  const content = JSON.stringify({
    id: team.id,
    members: team.members,
    states: team.states,
    entryContract: team.entryContract,
    exitContract: team.exitContract,
  });
  let hash = 5381;
  for (let i = 0; i < content.length; i++) {
    hash = ((hash << 5) + hash + content.charCodeAt(i)) & 0xffffffff;
  }
  return `v0-${(hash >>> 0).toString(16)}`;
}
