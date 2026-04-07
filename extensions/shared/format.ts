import type { PolicyViolation, ThresholdResult } from "./types";

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function assertNever(value: never): never {
  throw new Error(`Unhandled value: ${String(value)}`);
}

function formatAttemptTarget(violation: PolicyViolation): string {
  if (violation.targetPath) {
    return `${violation.attemptedAction} ${violation.targetPath}`;
  }

  if (violation.targetCommand) {
    return `${violation.attemptedAction} ${violation.targetCommand}`;
  }

  return violation.attemptedAction;
}

function formatViolationReason(violation: PolicyViolation): string {
  switch (violation.violationType) {
    case "write_denied":
      return "write outside allowed paths";
    case "read_denied":
      return "read outside allowed roots";
    case "shell_denied":
      return "shell execution not allowed by policy";
    case "network_denied":
      return "network access not allowed by policy";
    case "spawn_denied":
      return "process spawning not allowed by policy";
    case "command_denied": {
      const allowedCommands = violation.expectedPolicy.allowedCommands;
      if (allowedCommands?.length) {
        return `command not in allowedCommands (${allowedCommands.join(", ")})`;
      }

      return "command not allowed by policy";
    }
    case "glob_forbidden": {
      const forbiddenGlobs = violation.expectedPolicy.forbiddenGlobs;
      if (forbiddenGlobs?.length) {
        return `forbidden glob match (${forbiddenGlobs.join(", ")})`;
      }

      return "forbidden glob match";
    }
    default:
      return assertNever(violation.violationType);
  }
}

function formatThresholdPercent(currentUsage: number, threshold: number): string {
  if (threshold <= 0) {
    return currentUsage <= 0 ? "0%" : "100%";
  }

  return `${Math.round((currentUsage / threshold) * 100)}%`;
}

function defaultThresholdMessage(level: ThresholdResult["level"]): string {
  switch (level) {
    case "ok":
      return "within threshold";
    case "warn":
      return "approaching split threshold";
    case "split":
      return "split threshold reached";
    case "deny":
      return "deny threshold reached";
    default:
      return assertNever(level);
  }
}

export function formatPolicyViolation(violation: PolicyViolation): string {
  const status = violation.enforcementResult.toUpperCase();
  const summary = `${status}: ${formatAttemptTarget(violation)} — ${formatViolationReason(violation)}`;
  return collapseWhitespace(summary);
}

export function formatThresholdResult(result: ThresholdResult): string {
  const level = result.level.toUpperCase();
  const percent = formatThresholdPercent(result.currentUsage, result.threshold);
  const message = result.message ?? defaultThresholdMessage(result.level);

  return collapseWhitespace(
    `${level}: ${result.currentUsage}/${result.threshold} tokens (${percent}) — ${message}`,
  );
}
