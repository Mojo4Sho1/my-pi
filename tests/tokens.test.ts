/**
 * Token tracking tests (Stage 5a.1).
 *
 * Validates token rollup aggregation, threshold checking,
 * and percentage calculations.
 */

import { describe, it, expect } from "vitest";
import {
  aggregateTokenUsage,
  checkThresholds,
  percentageOfThreshold,
  ZERO_USAGE,
} from "../extensions/shared/tokens.js";

describe("token aggregation", () => {
  it("aggregates multiple token usage objects correctly", () => {
    const total = aggregateTokenUsage([
      { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
      { inputTokens: 25, outputTokens: 10, totalTokens: 35 },
      { inputTokens: 5, outputTokens: 15, totalTokens: 20 },
    ]);

    expect(total).toEqual({
      inputTokens: 130,
      outputTokens: 75,
      totalTokens: 205,
    });
  });

  it("handles empty arrays by returning zero usage", () => {
    expect(aggregateTokenUsage([])).toEqual(ZERO_USAGE);
  });

  it("skips undefined entries", () => {
    const total = aggregateTokenUsage([
      undefined,
      { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
      undefined,
      { inputTokens: 1, outputTokens: 2, totalTokens: 3 },
    ]);

    expect(total).toEqual({
      inputTokens: 11,
      outputTokens: 22,
      totalTokens: 33,
    });
  });

  it("returns a single entry unchanged", () => {
    const usage = { inputTokens: 12, outputTokens: 8, totalTokens: 20 };
    expect(aggregateTokenUsage([usage])).toEqual(usage);
  });
});

describe("threshold checking", () => {
  const thresholds = { warn: 100, split: 200, deny: 300 };

  it("returns ok below warn", () => {
    expect(checkThresholds(
      { inputTokens: 40, outputTokens: 20, totalTokens: 60 },
      thresholds
    )).toEqual({
      level: "ok",
      currentUsage: 60,
      threshold: 100,
    });
  });

  it("returns warn at or above warn and below split", () => {
    const result = checkThresholds(
      { inputTokens: 70, outputTokens: 30, totalTokens: 100 },
      thresholds
    );

    expect(result.level).toBe("warn");
    expect(result.threshold).toBe(100);
  });

  it("returns split at or above split and below deny", () => {
    const result = checkThresholds(
      { inputTokens: 120, outputTokens: 80, totalTokens: 200 },
      thresholds
    );

    expect(result.level).toBe("split");
    expect(result.threshold).toBe(200);
  });

  it("returns deny at or above deny", () => {
    const result = checkThresholds(
      { inputTokens: 180, outputTokens: 120, totalTokens: 300 },
      thresholds
    );

    expect(result.level).toBe("deny");
    expect(result.threshold).toBe(300);
  });

  it("handles exact boundary transitions correctly", () => {
    expect(checkThresholds(
      { inputTokens: 50, outputTokens: 50, totalTokens: 100 },
      thresholds
    ).level).toBe("warn");

    expect(checkThresholds(
      { inputTokens: 100, outputTokens: 100, totalTokens: 200 },
      thresholds
    ).level).toBe("split");

    expect(checkThresholds(
      { inputTokens: 150, outputTokens: 150, totalTokens: 300 },
      thresholds
    ).level).toBe("deny");
  });

  it("returns the threshold value that was hit", () => {
    expect(checkThresholds(
      { inputTokens: 110, outputTokens: 10, totalTokens: 120 },
      thresholds
    ).threshold).toBe(100);

    expect(checkThresholds(
      { inputTokens: 140, outputTokens: 70, totalTokens: 210 },
      thresholds
    ).threshold).toBe(200);

    expect(checkThresholds(
      { inputTokens: 200, outputTokens: 120, totalTokens: 320 },
      thresholds
    ).threshold).toBe(300);
  });
});

describe("threshold percentage", () => {
  it("calculates the correct percentage for partial usage", () => {
    const usage = { inputTokens: 80, outputTokens: 20, totalTokens: 100 };
    expect(percentageOfThreshold(usage, 250)).toBe(40);
  });

  it("returns zero percent for zero usage", () => {
    expect(percentageOfThreshold(ZERO_USAGE, 100)).toBe(0);
  });

  it("handles zero threshold gracefully", () => {
    const usage = { inputTokens: 10, outputTokens: 10, totalTokens: 20 };
    expect(percentageOfThreshold(usage, 0)).toBe(0);
  });
});
