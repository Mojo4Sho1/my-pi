/**
 * Deterministic sandboxing tests (Stage 5a.1c).
 *
 * Validates the canonical authority model, default envelopes,
 * path access checks, violation generation, and spawn records.
 */

import { describe, it, expect } from "vitest";
import {
  READ_ONLY_SPECIALISTS,
  WRITE_SPECIALISTS,
  buildDefaultEnvelope,
  validateEnvelope,
  checkPathAccess,
  checkWritePaths,
  createSpawnRecord,
} from "../extensions/shared/sandbox.js";

describe("sandbox authority model", () => {
  it("contains all seven read-only specialists", () => {
    expect(Array.from(READ_ONLY_SPECIALISTS).sort()).toEqual([
      "boundary-auditor",
      "critic",
      "planner",
      "reviewer",
      "routing-designer",
      "schema-designer",
      "spec-writer",
    ]);
  });

  it("contains builder, builder-test, and tester compatibility alias as write specialists", () => {
    expect(Array.from(WRITE_SPECIALISTS).sort()).toEqual([
      "builder",
      "builder-test",
      "tester",
    ]);
  });

  it("keeps the two sets disjoint and covers canonical specialists plus tester alias", () => {
    const all = new Set([...READ_ONLY_SPECIALISTS, ...WRITE_SPECIALISTS]);
    for (const specialistId of WRITE_SPECIALISTS) {
      expect(READ_ONLY_SPECIALISTS.has(specialistId)).toBe(false);
    }
    expect(Array.from(all).sort()).toEqual([
      "boundary-auditor",
      "builder",
      "builder-test",
      "critic",
      "planner",
      "reviewer",
      "routing-designer",
      "schema-designer",
      "spec-writer",
      "tester",
    ]);
  });
});

describe("buildDefaultEnvelope", () => {
  const taskPacket = {
    allowedReadSet: ["src", "tests"],
    allowedWriteSet: ["src/app.ts", "src/lib"],
  };

  it("builds a read-only envelope for read-only specialists", () => {
    const envelope = buildDefaultEnvelope("planner", taskPacket);

    expect(envelope.allowedWritePaths).toEqual([]);
    expect(envelope.allowedReadRoots).toEqual(["src", "tests"]);
    expect(envelope.allowShell).toBe(false);
    expect(envelope.allowNetwork).toBe(false);
    expect(envelope.allowProcessSpawn).toBe(false);
    expect(envelope.forbiddenGlobs).toContain("**/.env");
  });

  it("builds a write-capable envelope for builder/tester", () => {
    const envelope = buildDefaultEnvelope("specialist_builder", taskPacket);

    expect(envelope.allowedWritePaths).toEqual(["src/app.ts", "src/lib"]);
    expect(envelope.allowShell).toBe(true);
    expect(envelope.allowNetwork).toBe(false);
    expect(envelope.allowProcessSpawn).toBe(true);
  });
});

describe("validateEnvelope", () => {
  it("returns no errors for a valid envelope", () => {
    const envelope = buildDefaultEnvelope("builder", {
      allowedReadSet: ["src"],
      allowedWriteSet: ["src/index.ts"],
    });
    expect(validateEnvelope(envelope)).toEqual([]);
  });

  it("returns errors for structurally invalid envelopes", () => {
    const invalidEnvelope = {
      allowedWritePaths: [""],
      allowedReadRoots: [""],
      allowShell: false,
      allowNetwork: "nope",
      allowProcessSpawn: true,
      allowedCommands: ["git"],
      forbiddenGlobs: "bad",
    } as any;

    expect(validateEnvelope(invalidEnvelope)).toEqual([
      "allowNetwork must be a boolean",
      "forbiddenGlobs must be an array when provided",
      "allowedWritePaths may not contain empty entries",
      "allowedReadRoots may not contain empty entries",
      "allowedCommands cannot be set when allowShell is false",
    ]);
  });
});

describe("checkPathAccess", () => {
  const envelope = buildDefaultEnvelope("builder", {
    allowedReadSet: ["/repo/src", "/repo/tests"],
    allowedWriteSet: ["/repo/src", "/repo/docs/output.md"],
  });

  it("allows writes inside allowed roots", () => {
    expect(checkPathAccess("/repo/src/app.ts", envelope, "write")).toBeNull();
  });

  it("denies writes outside allowed roots", () => {
    expect(checkPathAccess("/repo/package.json", envelope, "write")?.violationType).toBe("write_denied");
  });

  it("denies forbidden glob writes", () => {
    expect(checkPathAccess("/repo/src/.env", envelope, "write")?.violationType).toBe("glob_forbidden");
  });

  it("allows reads inside allowed roots", () => {
    expect(checkPathAccess("/repo/tests/unit.test.ts", envelope, "read")).toBeNull();
  });

  it("denies reads outside allowed roots", () => {
    expect(checkPathAccess("/repo/scripts/build.sh", envelope, "read")?.violationType).toBe("read_denied");
  });

  it("denies writes for read-only envelopes", () => {
    const readOnlyEnvelope = buildDefaultEnvelope("critic", {
      allowedReadSet: ["/repo/src"],
      allowedWriteSet: ["/repo/src"],
    });
    expect(checkPathAccess("/repo/src/app.ts", readOnlyEnvelope, "write")?.violationType).toBe("write_denied");
  });
});

describe("checkWritePaths", () => {
  const envelope = buildDefaultEnvelope("builder", {
    allowedReadSet: ["/repo/src"],
    allowedWriteSet: ["/repo/src", "/repo/docs"],
  });

  it("returns no violations when all paths are allowed", () => {
    expect(checkWritePaths(["/repo/src/a.ts", "/repo/docs/readme.md"], envelope)).toEqual([]);
  });

  it("returns violations for disallowed and forbidden paths", () => {
    const violations = checkWritePaths(
      ["/repo/src/a.ts", "/repo/.env", "/repo/package.json"],
      envelope,
      { sessionId: "session_1", invocationId: "task_1" }
    );

    expect(violations).toHaveLength(2);
    expect(violations[0].violationType).toBe("write_denied");
    expect(violations[0].targetPath).toBe("/repo/.env");
    expect(violations[1].violationType).toBe("write_denied");
    expect(violations[1].targetPath).toBe("/repo/package.json");
  });
});

describe("createSpawnRecord", () => {
  it("creates spawned records with expected fields", () => {
    const envelope = buildDefaultEnvelope("builder", {
      allowedReadSet: ["src"],
      allowedWriteSet: ["src/index.ts"],
    });
    const record = createSpawnRecord("specialist_builder", envelope, "spawned", undefined, "session_1");

    expect(record.specialistId).toBe("specialist_builder");
    expect(record.outcome).toBe("spawned");
    expect(record.sessionId).toBe("session_1");
    expect(record.policyEnvelope).toEqual(envelope);
  });

  it("includes the block reason for blocked records", () => {
    const envelope = buildDefaultEnvelope("critic", {
      allowedReadSet: ["src"],
      allowedWriteSet: [],
    });
    const record = createSpawnRecord("specialist_critic", envelope, "blocked", "write_denied", "session_2");

    expect(record.outcome).toBe("blocked");
    expect(record.blockReason).toBe("write_denied");
  });
});

describe("path matching edge cases", () => {
  const envelope = buildDefaultEnvelope("builder", {
    allowedReadSet: ["/src/foo"],
    allowedWriteSet: ["/src/foo"],
  });

  it("allows exact path matches", () => {
    expect(checkPathAccess("/src/foo", envelope, "write")).toBeNull();
  });

  it("allows child paths", () => {
    expect(checkPathAccess("/src/foo/bar/baz.ts", envelope, "write")).toBeNull();
  });

  it("does not allow partial prefix matches", () => {
    expect(checkPathAccess("/src/foobar/file.ts", envelope, "write")?.violationType).toBe("write_denied");
  });

  it("handles backslashes and separators consistently", () => {
    expect(checkPathAccess("\\src\\foo\\nested.ts", envelope, "write")).toBeNull();
  });
});
