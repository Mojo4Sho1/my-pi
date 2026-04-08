/**
 * `/dashboard` command skeleton (Stage 5a.3 validation / 5a.4 head start).
 *
 * Registers the overview-only inspector panel and reconstructs the current
 * branch snapshot from session entries before rendering.
 */

import type {
  ExtensionAPI,
  ExtensionCommandContext,
} from "@mariozechner/pi-coding-agent";
import { reconstructSnapshotFromBranch } from "./index.js";
import { renderOverviewPanel } from "./panels/overview.js";

type DashboardBranchEntry = {
  type: string;
  customType?: string;
  data?: unknown;
};

export async function runDashboardCommand(
  args: string,
  ctx: ExtensionCommandContext
): Promise<void> {
  const panel = args.trim();
  const snapshot = reconstructSnapshotFromBranch(
    ctx.sessionManager.getBranch() as DashboardBranchEntry[]
  );

  const lines = renderOverviewPanel(snapshot);
  if (panel && panel !== "overview") {
    lines.push("");
    lines.push(`Panel \"${panel}\" is not implemented yet; showing overview.`);
  }

  ctx.ui.notify(lines.join("\n"), "info");
}

export function registerDashboardCommand(pi: ExtensionAPI): void {
  if (typeof (pi as Partial<ExtensionAPI>).registerCommand !== "function") {
    return;
  }

  pi.registerCommand("dashboard", {
    description: "Show the dashboard inspector overview for the current session",
    handler: runDashboardCommand,
  });
}
