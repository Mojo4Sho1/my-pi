import { describe, it, expect } from "vitest";
import {
  createTaskPacket,
  createResultPacket,
  validateTaskPacket,
  validateResultPacket,
} from "../extensions/shared/packets.js";
import type { TaskPacket, ResultPacket } from "../extensions/shared/types.js";

describe("createTaskPacket", () => {
  it("creates a packet with auto-generated id and timestamp", () => {
    const packet = createTaskPacket({
      objective: "Implement login form",
      allowedReadSet: ["src/auth/"],
      allowedWriteSet: ["src/auth/login.ts"],
      acceptanceCriteria: ["Form renders", "Submits credentials"],
      targetAgent: "specialist_builder",
      sourceAgent: "orchestrator",
    });

    expect(packet.id).toMatch(/^task_/);
    expect(packet.createdAt).toBeTruthy();
    expect(packet.objective).toBe("Implement login form");
    expect(packet.targetAgent).toBe("specialist_builder");
    expect(packet.sourceAgent).toBe("orchestrator");
  });

  it("preserves all provided fields", () => {
    const packet = createTaskPacket({
      objective: "Review code",
      allowedReadSet: ["src/"],
      allowedWriteSet: [],
      acceptanceCriteria: ["No lint errors"],
      targetAgent: "specialist_reviewer",
      sourceAgent: "orchestrator",
      context: { priority: "high" },
    });

    expect(packet.allowedReadSet).toEqual(["src/"]);
    expect(packet.allowedWriteSet).toEqual([]);
    expect(packet.context).toEqual({ priority: "high" });
  });
});

describe("createResultPacket", () => {
  it("creates a packet with auto-generated id and timestamp", () => {
    const packet = createResultPacket({
      taskId: "task_abc123",
      status: "success",
      summary: "Login form implemented",
      deliverables: ["src/auth/login.ts"],
      modifiedFiles: ["src/auth/login.ts"],
      sourceAgent: "specialist_builder",
    });

    expect(packet.id).toMatch(/^result_/);
    expect(packet.createdAt).toBeTruthy();
    expect(packet.taskId).toBe("task_abc123");
    expect(packet.status).toBe("success");
  });

  it("includes escalation details when provided", () => {
    const packet = createResultPacket({
      taskId: "task_abc123",
      status: "escalation",
      summary: "Cannot proceed",
      deliverables: [],
      modifiedFiles: [],
      sourceAgent: "specialist_builder",
      escalation: {
        reason: "Missing dependency",
        suggestedAction: "Install lodash",
      },
    });

    expect(packet.escalation?.reason).toBe("Missing dependency");
  });

  it("preserves structured output when provided", () => {
    const packet = createResultPacket({
      taskId: "task_abc123",
      status: "success",
      summary: "Plan created",
      deliverables: [],
      modifiedFiles: [],
      structuredOutput: {
        status: "success",
        summary: "Plan created",
        steps: ["step-1"],
        dependencies: [],
        risks: [],
        modifiedFiles: [],
      },
      sourceAgent: "specialist_planner",
    });

    expect(packet.structuredOutput).toEqual({
      status: "success",
      summary: "Plan created",
      steps: ["step-1"],
      dependencies: [],
      risks: [],
      modifiedFiles: [],
    });
  });
});

describe("validateTaskPacket", () => {
  const validPacket: TaskPacket = {
    id: "task_001",
    objective: "Do something",
    allowedReadSet: ["src/"],
    allowedWriteSet: ["src/file.ts"],
    acceptanceCriteria: ["It works"],
    targetAgent: "specialist_builder",
    sourceAgent: "orchestrator",
    createdAt: new Date().toISOString(),
  };

  it("returns no errors for a valid packet", () => {
    expect(validateTaskPacket(validPacket)).toEqual([]);
  });

  it("rejects null", () => {
    expect(validateTaskPacket(null)).toEqual([
      "Packet must be a non-null object",
    ]);
  });

  it("rejects non-objects", () => {
    expect(validateTaskPacket("string")).toEqual([
      "Packet must be a non-null object",
    ]);
  });

  it("catches missing id", () => {
    const errors = validateTaskPacket({ ...validPacket, id: "" });
    expect(errors).toContain("id is required");
  });

  it("catches missing objective", () => {
    const errors = validateTaskPacket({ ...validPacket, objective: "" });
    expect(errors).toContain("objective is required");
  });

  it("catches non-array allowedReadSet", () => {
    const errors = validateTaskPacket({
      ...validPacket,
      allowedReadSet: "not-array",
    });
    expect(errors).toContain("allowedReadSet must be an array");
  });

  it("catches non-array allowedWriteSet", () => {
    const errors = validateTaskPacket({
      ...validPacket,
      allowedWriteSet: "not-array",
    });
    expect(errors).toContain("allowedWriteSet must be an array");
  });

  it("catches non-array acceptanceCriteria", () => {
    const errors = validateTaskPacket({
      ...validPacket,
      acceptanceCriteria: "not-array",
    });
    expect(errors).toContain("acceptanceCriteria must be an array");
  });

  it("catches missing targetAgent", () => {
    const errors = validateTaskPacket({ ...validPacket, targetAgent: "" });
    expect(errors).toContain("targetAgent is required");
  });

  it("catches missing sourceAgent", () => {
    const errors = validateTaskPacket({ ...validPacket, sourceAgent: "" });
    expect(errors).toContain("sourceAgent is required");
  });

  it("catches multiple errors at once", () => {
    const errors = validateTaskPacket({});
    expect(errors.length).toBeGreaterThan(1);
  });
});

describe("validateResultPacket", () => {
  const validPacket: ResultPacket = {
    id: "result_001",
    taskId: "task_001",
    status: "success",
    summary: "Done",
    deliverables: ["file.ts"],
    modifiedFiles: ["file.ts"],
    sourceAgent: "specialist_builder",
    createdAt: new Date().toISOString(),
  };

  it("returns no errors for a valid packet", () => {
    expect(validateResultPacket(validPacket)).toEqual([]);
  });

  it("rejects null", () => {
    expect(validateResultPacket(null)).toEqual([
      "Packet must be a non-null object",
    ]);
  });

  it("catches invalid status", () => {
    const errors = validateResultPacket({
      ...validPacket,
      status: "invalid",
    });
    expect(errors).toContain(
      "status must be one of: success, partial, failure, escalation"
    );
  });

  it("accepts all valid statuses", () => {
    for (const status of ["success", "partial", "failure", "escalation"]) {
      const packet = { ...validPacket, status };
      if (status === "escalation") {
        (packet as any).escalation = {
          reason: "test",
          suggestedAction: "test",
        };
      }
      expect(validateResultPacket(packet)).toEqual([]);
    }
  });

  it("requires escalation details when status is escalation", () => {
    const errors = validateResultPacket({
      ...validPacket,
      status: "escalation",
    });
    expect(errors).toContain(
      "escalation details required when status is 'escalation'"
    );
  });

  it("catches missing taskId", () => {
    const errors = validateResultPacket({ ...validPacket, taskId: "" });
    expect(errors).toContain("taskId is required");
  });

  it("catches non-array deliverables", () => {
    const errors = validateResultPacket({
      ...validPacket,
      deliverables: "not-array",
    });
    expect(errors).toContain("deliverables must be an array");
  });

  it("catches non-array modifiedFiles", () => {
    const errors = validateResultPacket({
      ...validPacket,
      modifiedFiles: "not-array",
    });
    expect(errors).toContain("modifiedFiles must be an array");
  });

  it("catches non-object structuredOutput", () => {
    const errors = validateResultPacket({
      ...validPacket,
      structuredOutput: ["not", "an", "object"],
    });
    expect(errors).toContain("structuredOutput must be an object when provided");
  });
});
