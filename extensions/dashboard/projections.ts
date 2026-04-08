/**
 * Dashboard projections (Stage 5a.2, Decision #36).
 *
 * Pure functions for deriving compact widget state from execution artifacts
 * and dashboard-local runtime snapshots.
 */

import type { PacketStatus } from "../shared/types.js";
import type { WorklistSummary } from "../worklist/types.js";
import type {
  ActivePrimitivePath,
  DashboardSessionSnapshot,
  WidgetState,
  WorklistProgressView,
} from "./types.js";

function normalizeAgentLabel(agent?: string): string | undefined {
  if (!agent) {
    return undefined;
  }
  if (agent.startsWith("specialist_")) {
    return agent.slice("specialist_".length);
  }
  return agent;
}

function mapPacketStatus(status?: PacketStatus): WidgetState["sessionStatus"] | undefined {
  switch (status) {
    case "success":
    case "partial":
      return "completed";
    case "failure":
      return "failed";
    case "escalation":
      return "escalated";
    default:
      return undefined;
  }
}

export function deriveActivePrimitivePath(
  snapshot: DashboardSessionSnapshot
): ActivePrimitivePath | null {
  if (snapshot.activePathHint) {
    const hintedPath: ActivePrimitivePath = {
      team: snapshot.activePathHint.team,
      state: snapshot.activePathHint.state,
      agent: normalizeAgentLabel(snapshot.activePathHint.agent),
    };
    return hintedPath.team || hintedPath.state || hintedPath.agent ? hintedPath : null;
  }

  if (snapshot.teamSession) {
    const latestEntry = snapshot.teamSession.stateTrace.at(-1);
    const artifactPath: ActivePrimitivePath = {
      team: snapshot.teamSession.teamId,
      state: latestEntry?.state,
      agent: normalizeAgentLabel(latestEntry?.agent),
    };
    return artifactPath.team || artifactPath.state || artifactPath.agent ? artifactPath : null;
  }

  return null;
}

export function projectWorklistProgress(
  summary?: WorklistSummary
): WorklistProgressView | null {
  if (!summary) {
    return null;
  }

  return {
    total: summary.totalItems,
    completed: summary.statusCounts.completed,
    remaining:
      summary.statusCounts.pending +
      summary.statusCounts.in_progress +
      summary.statusCounts.blocked,
    blocked: summary.statusCounts.blocked,
  };
}

function projectProgressLabel(
  snapshot: DashboardSessionSnapshot,
  activePath: ActivePrimitivePath | null
): string | null {
  if (snapshot.plannedSpecialists && snapshot.plannedSpecialists.length > 0) {
    const total = snapshot.plannedSpecialists.length;
    const current = Math.max(
      0,
      Math.min(
        total,
        snapshot.currentDelegationIndex ??
          snapshot.completedDelegations ??
          (activePath?.agent ? 1 : 0)
      )
    );
    return `${current}/${total}`;
  }

  if (activePath?.team) {
    const segments = [activePath.state, activePath.agent].filter(
      (segment): segment is string => Boolean(segment)
    );
    return segments.length > 0 ? segments.join(" -> ") : activePath.team;
  }

  return activePath?.agent ?? null;
}

export function projectWidgetState(
  snapshot: DashboardSessionSnapshot,
  now = Date.now()
): WidgetState {
  const activePath = deriveActivePrimitivePath(snapshot);
  const progressLabel = projectProgressLabel(snapshot, activePath);
  const worklistProgress = projectWorklistProgress(snapshot.worklistSummary);
  const artifactStatus = mapPacketStatus(snapshot.teamSession?.outcome.status);
  const hintedStatus = snapshot.sessionStatusHint;
  const latestResultStatus = mapPacketStatus(snapshot.latestResultStatus);

  let sessionStatus: WidgetState["sessionStatus"] = "idle";
  if (artifactStatus) {
    sessionStatus = artifactStatus;
  } else if (hintedStatus) {
    sessionStatus = hintedStatus;
  } else if (latestResultStatus && (!snapshot.startedAt || snapshot.completedAt)) {
    sessionStatus = latestResultStatus;
  } else if (snapshot.startedAt) {
    sessionStatus = "running";
  }

  let elapsedMs = 0;
  const startedAt = snapshot.startedAt ?? snapshot.teamSession?.startedAt;
  const completedAt = snapshot.completedAt ?? snapshot.teamSession?.completedAt;
  if (startedAt) {
    const startedAtMs = Date.parse(startedAt);
    const completedAtMs = completedAt ? Date.parse(completedAt) : now;
    if (!Number.isNaN(startedAtMs) && !Number.isNaN(completedAtMs)) {
      elapsedMs = Math.max(0, completedAtMs - startedAtMs);
    }
  }

  return {
    sessionStatus,
    activePath,
    progressLabel,
    worklistProgress,
    hasBlockers: snapshot.worklistSummary?.hasBlockers ?? false,
    hasEscalation: sessionStatus === "escalated",
    subprocessActive: snapshot.subprocessActive ?? false,
    elapsedMs,
    totalTokens:
      snapshot.totalTokenUsage?.totalTokens ??
      snapshot.teamSession?.metrics.totalTokenUsage?.totalTokens ??
      0,
  };
}
