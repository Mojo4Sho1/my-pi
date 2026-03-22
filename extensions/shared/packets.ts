/**
 * Packet creation and validation utilities.
 *
 * Provides functions to create valid TaskPackets and ResultPackets,
 * and to validate packet structure at runtime.
 */

import type { TaskPacket, ResultPacket, PacketStatus } from "./types.js";

/**
 * Create a new TaskPacket with generated ID and timestamp.
 */
export function createTaskPacket(
  params: Omit<TaskPacket, "id" | "createdAt">
): TaskPacket {
  return {
    id: generateId("task"),
    createdAt: new Date().toISOString(),
    ...params,
  };
}

/**
 * Create a new ResultPacket with generated ID and timestamp.
 */
export function createResultPacket(
  params: Omit<ResultPacket, "id" | "createdAt">
): ResultPacket {
  return {
    id: generateId("result"),
    createdAt: new Date().toISOString(),
    ...params,
  };
}

/**
 * Validate that a TaskPacket has all required fields and correct types.
 * Returns an array of validation errors (empty if valid).
 */
export function validateTaskPacket(packet: unknown): string[] {
  const errors: string[] = [];
  if (!packet || typeof packet !== "object") {
    return ["Packet must be a non-null object"];
  }

  const p = packet as Record<string, unknown>;

  if (typeof p.id !== "string" || !p.id) errors.push("id is required");
  if (typeof p.objective !== "string" || !p.objective)
    errors.push("objective is required");
  if (!Array.isArray(p.allowedReadSet))
    errors.push("allowedReadSet must be an array");
  if (!Array.isArray(p.allowedWriteSet))
    errors.push("allowedWriteSet must be an array");
  if (!Array.isArray(p.acceptanceCriteria))
    errors.push("acceptanceCriteria must be an array");
  if (typeof p.targetAgent !== "string" || !p.targetAgent)
    errors.push("targetAgent is required");
  if (typeof p.sourceAgent !== "string" || !p.sourceAgent)
    errors.push("sourceAgent is required");
  if (typeof p.createdAt !== "string" || !p.createdAt)
    errors.push("createdAt is required");

  return errors;
}

/**
 * Validate that a ResultPacket has all required fields and correct types.
 * Returns an array of validation errors (empty if valid).
 */
export function validateResultPacket(packet: unknown): string[] {
  const errors: string[] = [];
  if (!packet || typeof packet !== "object") {
    return ["Packet must be a non-null object"];
  }

  const p = packet as Record<string, unknown>;
  const validStatuses: PacketStatus[] = [
    "success",
    "partial",
    "failure",
    "escalation",
  ];

  if (typeof p.id !== "string" || !p.id) errors.push("id is required");
  if (typeof p.taskId !== "string" || !p.taskId)
    errors.push("taskId is required");
  if (!validStatuses.includes(p.status as PacketStatus))
    errors.push(`status must be one of: ${validStatuses.join(", ")}`);
  if (typeof p.summary !== "string") errors.push("summary is required");
  if (!Array.isArray(p.deliverables))
    errors.push("deliverables must be an array");
  if (!Array.isArray(p.modifiedFiles))
    errors.push("modifiedFiles must be an array");
  if (typeof p.sourceAgent !== "string" || !p.sourceAgent)
    errors.push("sourceAgent is required");
  if (typeof p.createdAt !== "string" || !p.createdAt)
    errors.push("createdAt is required");

  if (p.status === "escalation" && !p.escalation) {
    errors.push("escalation details required when status is 'escalation'");
  }

  return errors;
}

function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`;
}
