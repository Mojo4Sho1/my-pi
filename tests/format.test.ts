import { describe, it, expect } from "vitest";

import { formatPolicyViolation, formatThresholdResult } from "../extensions/shared/format.js";
import type { PolicyViolation, PolicyViolationType, ThresholdLevel, ThresholdResult } from "../extensions/shared/types.js";

function makeViolation(overrides: Partial<PolicyViolation> = {}): PolicyViolation {
  return {
    timestamp: "2026-04-07T10:00:00.000Z",
    sessionId: "session-1",
    invocationId: "invocation-1",
    attemptedAction: "attempted",
    expectedPolicy: {},
    violationType: "write_denied",
    enforcementResult: "blocked",
    ...overrides,
  };
}

describe("formatPolicyViolation", () => {
  it("covers all policy violation types with single-line output", () => {
    const cases: Array<{
      type: PolicyViolationType;
      violation: PolicyViolation;
      includes: string[];
    }> = [
      {
        type: "write_denied",
        violation: makeViolation({
          attemptedAction: "write to",
          targetPath: "extensions/shared/format.ts",
          violationType: "write_denied",
          enforcementResult: "blocked",
        }),
        includes: ["BLOCKED:", "write to extensions/shared/format.ts", "write outside allowed paths"],
      },
      {
        type: "read_denied",
        violation: makeViolation({
          attemptedAction: "read from",
          targetPath: "secrets.txt",
          violationType: "read_denied",
          enforcementResult: "logged",
        }),
        includes: ["LOGGED:", "read from secrets.txt", "read outside allowed roots"],
      },
      {
        type: "shell_denied",
        violation: makeViolation({
          attemptedAction: "run shell command",
          targetCommand: "rm -rf /tmp/cache",
          violationType: "shell_denied",
        }),
        includes: ["run shell command rm -rf /tmp/cache", "shell execution not allowed by policy"],
      },
      {
        type: "network_denied",
        violation: makeViolation({
          attemptedAction: "open network connection to",
          targetCommand: "https://example.com",
          violationType: "network_denied",
        }),
        includes: ["open network connection to https://example.com", "network access not allowed by policy"],
      },
      {
        type: "spawn_denied",
        violation: makeViolation({
          attemptedAction: "spawn process",
          targetCommand: "git status",
          violationType: "spawn_denied",
        }),
        includes: ["spawn process git status", "process spawning not allowed by policy"],
      },
      {
        type: "command_denied",
        violation: makeViolation({
          attemptedAction: "run command",
          targetCommand: "curl https://example.com",
          violationType: "command_denied",
          expectedPolicy: { allowedCommands: ["git status", "npm test"] },
        }),
        includes: [
          "run command curl https://example.com",
          "command not in allowedCommands (git status, npm test)",
        ],
      },
      {
        type: "glob_forbidden",
        violation: makeViolation({
          attemptedAction: "write to",
          targetPath: ".env.local",
          violationType: "glob_forbidden",
          expectedPolicy: { forbiddenGlobs: [".env*", "*.pem"] },
        }),
        includes: ["write to .env.local", "forbidden glob match (.env*, *.pem)"],
      },
    ];

    for (const { type, violation, includes } of cases) {
      const formatted = formatPolicyViolation(violation);

      expect(formatted.includes("\n")).toBe(false);

      for (const fragment of includes) {
        expect(formatted).toMatch(new RegExp(fragment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
      }
    }
  });
});

describe("formatThresholdResult", () => {
  it("covers all threshold levels", () => {
    const cases: Array<{ level: ThresholdLevel; result: ThresholdResult; expected: string }> = [
      {
        level: "ok",
        result: { level: "ok", currentUsage: 40000, threshold: 100000 },
        expected: "OK: 40000/100000 tokens (40%) — within threshold",
      },
      {
        level: "warn",
        result: { level: "warn", currentUsage: 85000, threshold: 100000 },
        expected: "WARN: 85000/100000 tokens (85%) — approaching split threshold",
      },
      {
        level: "split",
        result: { level: "split", currentUsage: 100000, threshold: 100000 },
        expected: "SPLIT: 100000/100000 tokens (100%) — split threshold reached",
      },
      {
        level: "deny",
        result: { level: "deny", currentUsage: 125000, threshold: 100000 },
        expected: "DENY: 125000/100000 tokens (125%) — deny threshold reached",
      },
    ];

    for (const { level, result, expected } of cases) {
      expect(formatThresholdResult(result)).toBe(expected);
    }
  });

  it("handles zero tokens and custom messages", () => {
    expect(formatThresholdResult({ level: "ok", currentUsage: 0, threshold: 100000 })).toBe(
      "OK: 0/100000 tokens (0%) — within threshold",
    );

    expect(
      formatThresholdResult({
        level: "warn",
        currentUsage: 100000,
        threshold: 100000,
        message: "custom warning message",
      }),
    ).toBe("WARN: 100000/100000 tokens (100%) — custom warning message");
  });
});
