/**
 * Dashboard-local view models (Stage 5a.2, Decision #36).
 *
 * These types are presentation-facing projections built from authoritative
 * execution artifacts. Shared execution contracts stay in extensions/shared/.
 */

import type {
  PacketStatus,
  TeamSessionArtifact,
  TokenUsage,
} from "../shared/types.js";
import type { DelegationLogEntry } from "../shared/logging.js";
import type { WorklistSummary } from "../worklist/types.js";

export interface WidgetState {
  sessionStatus: "idle" | "running" | "completed" | "failed" | "escalated";
  activePath: ActivePrimitivePath | null;
  worklistProgress: WorklistProgressView | null;
  hasBlockers: boolean;
  hasEscalation: boolean;
  elapsedMs: number;
  totalTokens: number;
}

export interface ActivePrimitivePath {
  team?: string;
  state?: string;
  agent?: string;
}

export interface WorklistProgressView {
  total: number;
  completed: number;
  remaining: number;
  blocked: number;
}

export interface DashboardSessionSnapshot {
  sessionId?: string;
  startedAt?: string;
  completedAt?: string;
  sessionStatusHint?: WidgetState["sessionStatus"];
  latestResultStatus?: PacketStatus;
  activePathHint?: ActivePrimitivePath | null;
  teamSession?: TeamSessionArtifact;
  worklistSummary?: WorklistSummary;
  delegationLogs: DelegationLogEntry[];
  totalTokenUsage?: TokenUsage;
}
