/**
 * Dashboard overview panel rendering (Stage 5a.3 validation / 5a.4 head start).
 *
 * Reuses existing dashboard projections to present a read-only top-level session
 * summary suitable for slash-command display.
 */

import { projectWidgetState } from "../projections.js";
import type { DashboardSessionSnapshot } from "../types.js";

function formatPath(snapshot: ReturnType<typeof projectWidgetState>): string {
  if (!snapshot.activePath) {
    return "unavailable";
  }

  const segments = [snapshot.activePath.team, snapshot.activePath.state, snapshot.activePath.agent]
    .filter((segment): segment is string => Boolean(segment));

  return segments.length > 0 ? segments.join(" > ") : "unavailable";
}

function formatWorkProgress(snapshot: ReturnType<typeof projectWidgetState>): string {
  if (!snapshot.worklistProgress) {
    return "unavailable";
  }

  const parts = [
    `${snapshot.worklistProgress.total} total`,
    `${snapshot.worklistProgress.completed} done`,
    `${snapshot.worklistProgress.remaining} remaining`,
  ];

  if (snapshot.worklistProgress.blocked > 0) {
    parts.push(`${snapshot.worklistProgress.blocked} blocked`);
  }

  return parts.join(" | ");
}

function formatOutcome(snapshot: DashboardSessionSnapshot): string {
  const outcome = snapshot.teamSession?.outcome;
  if (!outcome) {
    return "pending";
  }

  if (outcome.failureReason) {
    return `${outcome.status} (${outcome.failureReason})`;
  }

  return outcome.status;
}

export function renderOverviewPanel(snapshot: DashboardSessionSnapshot): string[] {
  const widgetState = projectWidgetState(snapshot);

  return [
    "Dashboard Overview",
    `Status: ${widgetState.sessionStatus}`,
    `Active Path: ${formatPath(widgetState)}`,
    `Work Progress: ${formatWorkProgress(widgetState)}`,
    `Signals: blockers=${widgetState.hasBlockers ? "yes" : "no"} | escalation=${widgetState.hasEscalation ? "yes" : "no"}`,
    `Tokens: ${widgetState.totalTokens.toLocaleString("en-US")}`,
    `Outcome: ${formatOutcome(snapshot)}`,
  ];
}
