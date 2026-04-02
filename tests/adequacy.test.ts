import { describe, it, expect } from "vitest";
import { validateAdequacy } from "../extensions/shared/adequacy.js";
import type { AdequacyCheck } from "../extensions/shared/specialist-prompt.js";
import { createResultPacket } from "../extensions/shared/packets.js";

describe("validateAdequacy", () => {
  const makeResult = (overrides: Partial<Parameters<typeof createResultPacket>[0]> = {}) =>
    createResultPacket({
      taskId: "task_1",
      status: "success",
      summary: "Test summary",
      deliverables: ["d1"],
      modifiedFiles: ["f1.ts"],
      sourceAgent: "specialist_builder",
      ...overrides,
    });

  it("returns adequate when no checks provided", () => {
    const result = validateAdequacy([], makeResult());
    expect(result.adequate).toBe(true);
    expect(result.failures).toHaveLength(0);
  });

  it("returns adequate when all checks pass", () => {
    const checks: AdequacyCheck[] = [
      {
        name: "has-deliverables",
        predicate: (r) => r.deliverables.length >= 1,
        failureMessage: "Must have at least one deliverable",
      },
    ];
    const result = validateAdequacy(checks, makeResult());
    expect(result.adequate).toBe(true);
    expect(result.failures).toHaveLength(0);
  });

  it("returns inadequate when a check fails", () => {
    const checks: AdequacyCheck[] = [
      {
        name: "has-deliverables",
        predicate: (r) => r.deliverables.length >= 1,
        failureMessage: "Must have at least one deliverable",
      },
    ];
    const result = validateAdequacy(checks, makeResult({ deliverables: [] }));
    expect(result.adequate).toBe(false);
    expect(result.failures).toContain("Must have at least one deliverable");
  });

  it("collects multiple failures", () => {
    const checks: AdequacyCheck[] = [
      {
        name: "has-deliverables",
        predicate: (r) => r.deliverables.length >= 1,
        failureMessage: "Must have deliverables",
      },
      {
        name: "has-modified-files",
        predicate: (r) => r.modifiedFiles.length >= 1,
        failureMessage: "Must have modified files",
      },
    ];
    const result = validateAdequacy(checks, makeResult({ deliverables: [], modifiedFiles: [] }));
    expect(result.adequate).toBe(false);
    expect(result.failures).toHaveLength(2);
  });

  it("passes when check condition is met (planner verification step)", () => {
    const plannerCheck: AdequacyCheck = {
      name: "has-verification-step",
      predicate: (r) => r.deliverables.some(d => /verif|test|valid|confirm/i.test(d)),
      failureMessage: "Planner output must include at least one verification step",
    };
    const result = validateAdequacy(
      [plannerCheck],
      makeResult({ deliverables: ["Implement feature", "Verify integration tests pass"] })
    );
    expect(result.adequate).toBe(true);
  });

  it("fails planner verification step when missing", () => {
    const plannerCheck: AdequacyCheck = {
      name: "has-verification-step",
      predicate: (r) => r.deliverables.some(d => /verif|test|valid|confirm/i.test(d)),
      failureMessage: "Planner output must include at least one verification step",
    };
    const result = validateAdequacy(
      [plannerCheck],
      makeResult({ deliverables: ["Implement feature", "Refactor module"] })
    );
    expect(result.adequate).toBe(false);
    expect(result.failures).toContain("Planner output must include at least one verification step");
  });

  it("builder check: success requires deliverables and modified files", () => {
    const builderChecks: AdequacyCheck[] = [
      {
        name: "success-has-deliverables",
        predicate: (r) => r.status !== "success" || r.deliverables.length >= 1,
        failureMessage: "Builder must produce deliverables on success",
      },
      {
        name: "success-has-modified-files",
        predicate: (r) => r.status !== "success" || r.modifiedFiles.length >= 1,
        failureMessage: "Builder must report modified files on success",
      },
    ];

    // Success with deliverables and files — adequate
    expect(validateAdequacy(builderChecks, makeResult()).adequate).toBe(true);

    // Success with no deliverables — inadequate
    const noDeliverables = validateAdequacy(builderChecks, makeResult({ deliverables: [] }));
    expect(noDeliverables.adequate).toBe(false);

    // Failure status with no deliverables — still adequate (condition doesn't apply)
    const failResult = validateAdequacy(
      builderChecks,
      makeResult({ status: "failure", deliverables: [], modifiedFiles: [] })
    );
    expect(failResult.adequate).toBe(true);
  });
});
