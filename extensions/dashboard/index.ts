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
  CommandHookPayload,
  DelegationHookPayload,
  SessionHookPayload,
  StateTransitionHookPayload,
  SubprocessHookPayload,
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
import { registerDashboardCommand } from "./command.js";
import { selectSpecialists, type DelegationHint } from "../orchestrator/select.js";

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
    completedDelegations: 0,
    currentDelegationIndex: 0,
    subprocessActive: false,
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
    case "onCommandInvoked": {
      const commandPayload = payload as CommandHookPayload;
      if (commandPayload.commandName !== "orchestrate") {
        return snapshot;
      }

      const rawHint = commandPayload.delegationHint;
      let parsedHint: DelegationHint | undefined;
      if (rawHint && rawHint !== "auto" && rawHint.includes(",")) {
        parsedHint = rawHint.split(",").map((segment) => segment.trim()) as DelegationHint;
      } else if (rawHint) {
        parsedHint = rawHint as DelegationHint;
      }

      const plannedSpecialists = commandPayload.teamHint
        ? undefined
        : selectSpecialists(commandPayload.task ?? "", parsedHint).specialists;

      return {
        ...snapshot,
        plannedSpecialists,
        completedDelegations: 0,
        currentDelegationIndex: 0,
      };
    }

    case "onSessionStart": {
      const sessionPayload = payload as SessionHookPayload;
      return {
        ...createEmptySnapshot(),
        plannedSpecialists: snapshot.plannedSpecialists,
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
        sessionStatusHint:
          transitionPayload.resultStatus === "failure"
            ? "failed"
            : transitionPayload.resultStatus === "escalation"
              ? "escalated"
              : "running",
        latestResultStatus: transitionPayload.resultStatus,
        activePathHint: {
          team: transitionPayload.teamId,
          state: transitionPayload.toState,
          agent: transitionPayload.agentId,
        },
        subprocessActive: false,
      };
    }

    case "beforeDelegation": {
      const delegationPayload = payload as DelegationHookPayload;
      const completedDelegations = snapshot.completedDelegations ?? 0;
      return {
        ...snapshot,
        sessionStatusHint: "running",
        activePathHint: snapshot.activePathHint?.team
          ? {
              ...snapshot.activePathHint,
              agent: delegationPayload.specialistId,
            }
          : { agent: delegationPayload.specialistId },
        currentDelegationIndex: Math.min(
          snapshot.plannedSpecialists?.length ?? completedDelegations + 1,
          completedDelegations + 1
        ),
      };
    }

    case "afterDelegation": {
      const delegationPayload = payload as DelegationHookPayload;
      const completedDelegations = (snapshot.completedDelegations ?? 0) + 1;
      return {
        ...snapshot,
        latestResultStatus: delegationPayload.resultStatus,
        sessionStatusHint:
          delegationPayload.resultStatus === "failure"
            ? "failed"
            : delegationPayload.resultStatus === "escalation"
              ? "escalated"
              : "running",
        completedDelegations,
        currentDelegationIndex: Math.min(
          snapshot.plannedSpecialists?.length ?? completedDelegations,
          completedDelegations
        ),
        subprocessActive: false,
        totalTokenUsage: rollTokenUsage(snapshot.totalTokenUsage, delegationPayload.tokenUsage),
      };
    }

    case "beforeSubprocessSpawn": {
      const subprocessPayload = payload as SubprocessHookPayload;
      return {
        ...snapshot,
        subprocessActive: true,
        activePathHint: snapshot.activePathHint?.team
          ? {
              ...snapshot.activePathHint,
              agent: subprocessPayload.specialistId,
            }
          : { agent: subprocessPayload.specialistId },
      };
    }

    case "afterSubprocessExit": {
      return {
        ...snapshot,
        subprocessActive: false,
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
        subprocessActive: false,
        totalTokenUsage: sessionPayload.totalTokenUsage ?? snapshot.totalTokenUsage,
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
  registerDashboardCommand(pi);

  let currentCtx: ExtensionContext | undefined;
  let snapshot = createEmptySnapshot();
  let renderTimer: ReturnType<typeof setInterval> | undefined;

  function renderCurrentWidget(): void {
    if (!currentCtx || !currentCtx.hasUI) {
      return;
    }
    applyWidget(currentCtx, projectWidgetState(snapshot));
  }

  function syncRenderTimer(): void {
    const widgetState = projectWidgetState(snapshot);
    if (widgetState.sessionStatus === "running") {
      if (!renderTimer) {
        renderTimer = setInterval(() => {
          renderCurrentWidget();
        }, 1000);
        renderTimer.unref?.();
      }
      return;
    }

    if (renderTimer) {
      clearInterval(renderTimer);
      renderTimer = undefined;
    }
  }

  function handleSessionContext(ctx: ExtensionContext): void {
    // In --print / --mode json sub-agent contexts, UI and session manager may not exist
    if (!ctx.hasUI) {
      return;
    }
    currentCtx = ctx;
    try {
      snapshot = reconstructSnapshotFromBranch(ctx.sessionManager.getBranch() as DashboardBranchEntry[]);
    } catch {
      // sessionManager.getBranch() may not be available — start with empty snapshot
      snapshot = createEmptySnapshot();
    }
    renderCurrentWidget();
    syncRenderTimer();
  }

  registerHookInstaller((registry) => {
    registry.registerObserver("onCommandInvoked", (event) => {
      snapshot = applyDashboardObserverEvent(snapshot, event.eventName, event.payload, event.timestamp);
      renderCurrentWidget();
      syncRenderTimer();
    });
    registry.registerObserver("onSessionStart", (event) => {
      snapshot = applyDashboardObserverEvent(snapshot, event.eventName, event.payload, event.timestamp);
      renderCurrentWidget();
      syncRenderTimer();
    });
    registry.registerObserver("onTeamStart", (event) => {
      snapshot = applyDashboardObserverEvent(snapshot, event.eventName, event.payload, event.timestamp);
      renderCurrentWidget();
      syncRenderTimer();
    });
    registry.registerObserver("beforeStateTransition", (event) => {
      snapshot = applyDashboardObserverEvent(snapshot, event.eventName, event.payload, event.timestamp);
      renderCurrentWidget();
      syncRenderTimer();
    });
    registry.registerObserver("afterStateTransition", (event) => {
      snapshot = applyDashboardObserverEvent(snapshot, event.eventName, event.payload, event.timestamp);
      renderCurrentWidget();
      syncRenderTimer();
    });
    registry.registerObserver("beforeDelegation", (event) => {
      snapshot = applyDashboardObserverEvent(snapshot, event.eventName, event.payload, event.timestamp);
      renderCurrentWidget();
      syncRenderTimer();
    });
    registry.registerObserver("afterDelegation", (event) => {
      snapshot = applyDashboardObserverEvent(snapshot, event.eventName, event.payload, event.timestamp);
      renderCurrentWidget();
      syncRenderTimer();
    });
    registry.registerObserver("beforeSubprocessSpawn", (event) => {
      snapshot = applyDashboardObserverEvent(snapshot, event.eventName, event.payload, event.timestamp);
      renderCurrentWidget();
      syncRenderTimer();
    });
    registry.registerObserver("afterSubprocessExit", (event) => {
      snapshot = applyDashboardObserverEvent(snapshot, event.eventName, event.payload, event.timestamp);
      renderCurrentWidget();
      syncRenderTimer();
    });
    registry.registerObserver("onArtifactWritten", (event) => {
      snapshot = applyDashboardObserverEvent(snapshot, event.eventName, event.payload, event.timestamp);
      renderCurrentWidget();
      syncRenderTimer();
    });
    registry.registerObserver("onSessionEnd", (event) => {
      snapshot = applyDashboardObserverEvent(snapshot, event.eventName, event.payload, event.timestamp);
      renderCurrentWidget();
      syncRenderTimer();
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
