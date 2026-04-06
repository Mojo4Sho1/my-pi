/**
 * Token usage tracking and threshold utilities (Stage 5a.1, Decisions #36, #37).
 *
 * Provides types and pure functions for token tracking, rollup aggregation,
 * and threshold checking. Token telemetry is preventive — it exists to
 * maintain healthy bounded execution, not to rescue oversized context.
 */

import type { TokenUsage, TokenThresholds, ThresholdResult } from "./types.js";

export const ZERO_USAGE: TokenUsage = {
  inputTokens: 0,
  outputTokens: 0,
  totalTokens: 0,
};

/**
 * Aggregate token usage across multiple invocations, skipping undefined entries.
 */
export function aggregateTokenUsage(usages: (TokenUsage | undefined)[]): TokenUsage {
  return usages.reduce<TokenUsage>((total, usage) => {
    if (!usage) {
      return total;
    }

    return {
      inputTokens: total.inputTokens + usage.inputTokens,
      outputTokens: total.outputTokens + usage.outputTokens,
      totalTokens: total.totalTokens + usage.totalTokens,
    };
  }, ZERO_USAGE);
}

/**
 * Compare token usage against warn/split/deny thresholds.
 */
export function checkThresholds(
  usage: TokenUsage,
  thresholds: TokenThresholds
): ThresholdResult {
  const currentUsage = usage.totalTokens;

  if (currentUsage >= thresholds.deny) {
    return {
      level: "deny",
      currentUsage,
      threshold: thresholds.deny,
      message: `Token usage ${currentUsage} reached deny threshold ${thresholds.deny}.`,
    };
  }

  if (currentUsage >= thresholds.split) {
    return {
      level: "split",
      currentUsage,
      threshold: thresholds.split,
      message: `Token usage ${currentUsage} reached split threshold ${thresholds.split}.`,
    };
  }

  if (currentUsage >= thresholds.warn) {
    return {
      level: "warn",
      currentUsage,
      threshold: thresholds.warn,
      message: `Token usage ${currentUsage} reached warn threshold ${thresholds.warn}.`,
    };
  }

  return {
    level: "ok",
    currentUsage,
    threshold: thresholds.warn,
  };
}

/**
 * Return token usage as a percentage of the provided threshold.
 */
export function percentageOfThreshold(usage: TokenUsage, threshold: number): number {
  if (threshold <= 0) {
    return 0;
  }

  return (usage.totalTokens / threshold) * 100;
}
