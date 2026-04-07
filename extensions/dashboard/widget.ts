/**
 * Persistent dashboard widget rendering (Stage 5a.2, Decision #36).
 */

import type { ExtensionContext } from "@mariozechner/pi-coding-agent";
import { DASHBOARD_WIDGET_KEY } from "../shared/constants.js";
import type { WidgetState } from "./types.js";

export const WIDGET_KEY = DASHBOARD_WIDGET_KEY;

function formatDuration(elapsedMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

function formatCount(value: number): string {
  return Math.max(0, Math.trunc(value))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function renderWidgetLines(state: WidgetState): string[] {
  const statusTags: string[] = [];
  if (state.hasBlockers) {
    statusTags.push("[blockers]");
  }
  if (state.hasEscalation) {
    statusTags.push("[escalation]");
  }

  const lines = [`Status: ${state.sessionStatus}${statusTags.length > 0 ? ` ${statusTags.join(" ")}` : ""}`];

  if (state.activePath?.team) {
    lines.push(`Team: ${state.activePath.team}`);
  }
  if (state.activePath?.state) {
    lines.push(`State: ${state.activePath.state}`);
  }
  if (state.activePath?.agent) {
    lines.push(`Agent: ${state.activePath.agent}`);
  }

  if (state.worklistProgress) {
    let worklistLine =
      `Work: ${formatCount(state.worklistProgress.total)} total` +
      ` | ${formatCount(state.worklistProgress.completed)} done` +
      ` | ${formatCount(state.worklistProgress.remaining)} remaining`;
    if (state.worklistProgress.blocked > 0) {
      worklistLine += ` | ${formatCount(state.worklistProgress.blocked)} blocked`;
    }
    lines.push(worklistLine);
  }

  lines.push(`Time: ${formatDuration(state.elapsedMs)} | Tokens: ${formatCount(state.totalTokens)}`);
  return lines;
}

export function applyWidget(ctx: ExtensionContext, state: WidgetState): void {
  if (!ctx.hasUI) {
    return;
  }

  if (state.sessionStatus === "idle") {
    ctx.ui.setWidget(WIDGET_KEY, undefined);
    return;
  }

  ctx.ui.setWidget(WIDGET_KEY, renderWidgetLines(state));
}
