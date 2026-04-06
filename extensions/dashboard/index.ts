/**
 * Dashboard extension entry point (Stage 5a.2, Decision #36).
 *
 * Maintains a current-branch dashboard snapshot, reconstructs from session
 * entries on session lifecycle events, and attaches observers to every new
 * hook registry through the shared installer seam.
 */

import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import type {
  ArtifactHookPayload,
  DelegationHookPayload,
  SessionHookPayload,
  StateTransitionHookPayload,
  TeamStartHookPayload,
  TokenUsage,
} from "../shared/types.js";
import type { DelegationLogEntry } from "../shared/logging.js";
import type { WorklistSummary } from "../worklist/types.js";
import { registerHookInstaller } from "../shared/hooks.js";
import { aggregateTokenUsage } from "../shared/tokens.js";
import type { DashboardSessionSnapshot } from "./types.js";
import { projectWidgetState } from "./projections.js";
import { applyWidget } from "./widget.js";

type DashboardBranchEntry = {
  type: string;
  customType?: string;
  data?: unknown;
};

type WorklistSessionArtifact = {
  summary: WorklistSummary;
};

function createEmptySnapshot(): DashboardSessionSnapshot {
  return {
    activePathHint: null,
    delegationLogs: [],
  };
}

function rollTokenUsage(
  current: TokenUsage | undefined,
  next: TokenUsage | undefined
): TokenUsage | undefined {
  if (!current && !next) {
    return undefined;
  }
  const rolled = aggregateTokenUsage([current, next]);
  return rolled.totalTokens > 0 ? rolled : undefined;
}

function mapPacketStatusToWidgetStatus(
  status?: DashboardSessionSnapshot["latestResultStatus"]
): DashboardSessionSnapshot["sessionStatusHint"] | undefined {
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

export function applyDashboardObserverEvent(
  snapshot: DashboardSessionSnapshot,
  eventName: string,
  payload: unknown,
  receivedAt: string
): DashboardSessionSnapshot {
  switch (eventName) {
    case "onSessionStart": {
      const sessionPayload = payload as SessionHookPayload;
      return {
        ...createEmptySnapshot(),
        sessionId: sessionPayload.sessionId,
        startedAt: receivedAt,
        sessionStatusHint: "running",
      };
    }

    case "onTeamStart": {
      const teamPayload = payload as TeamStartHookPayload;
      return {
        ...snapshot,
        sessionStatusHint: snapshot.sessionStatusHint ?? "running",
        activePathHint: { team: teamPayload.teamId },
      };
    }

    case "beforeStateTransition": {
      const transitionPayload = payload as StateTransitionHookPayload;
      return {
        ...snapshot,
        sessionStatusHint: "running",
        activePathHint: {
          team: transitionPayload.teamId,
          state: transitionPayload.fromState,
          agent: transitionPayload.agentId,
        },
      };
    }

    case "afterStateTransition": {
      const transitionPayload = payload as StateTransitionHookPayload;
      return {
        ...snapshot,
        sessionStatusHint: transitionPayload.resultStatus
          ? mapPacketStatusToWidgetStatus(transitionPayload.resultStatus)
          : "running",
        latestResultStatus: transitionPayload.resultStatus,
        activePathHint: {
          team: transitionPayload.teamId,
          state: transitionPayload.toState,
          agent: transitionPayload.agentId,
        },
      };
    }

    case "beforeDelegation": {
      const delegationPayload = payload as DelegationHookPayload;
      return {
        ...snapshot,
        sessionStatusHint: "running",
        activePathHint: snapshot.activePathHint?.team
          ? snapshot.activePathHint
          : { agent: delegationPayload.specialistId },
      };
    }

    case "afterDelegation": {
      const delegationPayload = payload as DelegationHookPayload;
      return {
        ...snapshot,
        latestResultStatus: delegationPayload.resultStatus,
        sessionStatusHint: delegationPayload.resultStatus
          ? mapPacketStatusToWidgetStatus(delegationPayload.resultStatus)
          : snapshot.sessionStatusHint,
        totalTokenUsage: rollTokenUsage(snapshot.totalTokenUsage, delegationPayload.tokenUsage),
      };
    }

    case "onArtifactWritten": {
      const artifactPayload = payload as ArtifactHookPayload;
      if (artifactPayload.artifactType === "team_session" && artifactPayload.artifact) {
        const teamSession = artifactPayload.artifact as NonNullable<DashboardSessionSnapshot["teamSession"]>;
        return {
          ...snapshot,
          teamSession,
          sessionId: teamSession.sessionId,
          startedAt: teamSession.startedAt,
          completedAt: teamSession.completedAt,
          latestResultStatus: teamSession.outcome.status,
          sessionStatusHint: mapPacketStatusToWidgetStatus(teamSession.outcome.status),
          totalTokenUsage: teamSession.metrics.totalTokenUsage,
        };
      }
      if (artifactPayload.artifactType === "worklist_session" && artifactPayload.artifact) {
        const worklistArtifact = artifactPayload.artifact as WorklistSessionArtifact;
        return {
          ...snapshot,
          worklistSummary: worklistArtifact.summary,
        };
      }
      return snapshot;
    }

    case "onSessionEnd": {
      const sessionPayload = payload as SessionHookPayload;
      return {
        ...snapshot,
        sessionId: sessionPayload.sessionId ?? snapshot.sessionId,
        completedAt: receivedAt,
        totalTokenUsage: rollTokenUsage(snapshot.totalTokenUsage, sessionPayload.totalTokenUsage),
        sessionStatusHint: snapshot.teamSession
          ? snapshot.sessionStatusHint
          : mapPacketStatusToWidgetStatus(snapshot.latestResultStatus) ?? snapshot.sessionStatusHint,
      };
    }

    default:
      return snapshot;
  }
}

export function reconstructSnapshotFromBranch(
  entries: DashboardBranchEntry[]
): DashboardSessionSnapshot {
  const snapshot = createEmptySnapshot();

  for (const entry of entries) {
    if (entry.type !== "custom") {
      continue;
    }

    if (entry.customType === "delegation_log") {
      snapshot.delegationLogs.push(entry.data as DelegationLogEntry);
      continue;
    }

    if (entry.customType === "team_session") {
      snapshot.teamSession = entry.data as DashboardSessionSnapshot["teamSession"];
      continue;
    }

    if (entry.customType === "worklist_session") {
      snapshot.worklistSummary = (entry.data as WorklistSessionArtifact).summary;
    }
  }

  if (snapshot.teamSession) {
    snapshot.sessionId = snapshot.teamSession.sessionId;
    snapshot.startedAt = snapshot.teamSession.startedAt;
    snapshot.completedAt = snapshot.teamSession.completedAt;
    snapshot.latestResultStatus = snapshot.teamSession.outcome.status;
    snapshot.sessionStatusHint = mapPacketStatusToWidgetStatus(snapshot.teamSession.outcome.status);
    snapshot.totalTokenUsage = snapshot.teamSession.metrics.totalTokenUsage;
  }

  return snapshot;
}

export default function dashboardExtension(pi: ExtensionAPI): void {
  let currentCtx: ExtensionContext | undefined;
  let snapshot = createEmptySnapshot();

  function renderCurrentWidget(): void {
    if (!currentCtx) {
      return;
    }
    applyWidget(currentCtx, projectWidgetState(snapshot));
  }

  function handleSessionContext(ctx: ExtensionContext): void {
    currentCtx = ctx;
    snapshot = reconstructSnapshotFromBranch(ctx.sessionManager.getBranch() as DashboardBranchEntry[]);
    renderCurrentWidget();
  }

  registerHookInstaller((registry) => {
    registry.registerObserver("onSessionStart", (event) => {
      snapshot = applyDashboardObserverEvent(snapshot, event.eventName, event.payload, event.timestamp);
      renderCurrentWidget();
    });
    registry.registerObserver("onTeamStart", (event) => {
      snapshot = applyDashboardObserverEvent(snapshot, event.eventName, event.payload, event.timestamp);
      renderCurrentWidget();
    });
    registry.registerObserver("beforeStateTransition", (event) => {
      snapshot = applyDashboardObserverEvent(snapshot, event.eventName, event.payload, event.timestamp);
      renderCurrentWidget();
    });
    registry.registerObserver("afterStateTransition", (event) => {
      snapshot = applyDashboardObserverEvent(snapshot, event.eventName, event.payload, event.timestamp);
      renderCurrentWidget();
    });
    registry.registerObserver("beforeDelegation", (event) => {
      snapshot = applyDashboardObserverEvent(snapshot, event.eventName, event.payload, event.timestamp);
      renderCurrentWidget();
    });
    registry.registerObserver("afterDelegation", (event) => {
      snapshot = applyDashboardObserverEvent(snapshot, event.eventName, event.payload, event.timestamp);
      renderCurrentWidget();
    });
    registry.registerObserver("onArtifactWritten", (event) => {
      snapshot = applyDashboardObserverEvent(snapshot, event.eventName, event.payload, event.timestamp);
      renderCurrentWidget();
    });
    registry.registerObserver("onSessionEnd", (event) => {
      snapshot = applyDashboardObserverEvent(snapshot, event.eventName, event.payload, event.timestamp);
      renderCurrentWidget();
    });
  });

  pi.on("session_start", async (_event, ctx) => {
    handleSessionContext(ctx);
  });
  pi.on("session_switch", async (_event, ctx) => {
    handleSessionContext(ctx);
  });
  pi.on("session_fork", async (_event, ctx) => {
    handleSessionContext(ctx);
  });
  pi.on("session_tree", async (_event, ctx) => {
    handleSessionContext(ctx);
  });
}
