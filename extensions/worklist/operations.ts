/**
 * Worklist operations (Stage 4e.2).
 *
 * All operations are pure functions returning a new Worklist (immutable pattern).
 * Error cases return { error: string }.
 */

import type { Worklist, WorklistItem, WorklistItemStatus, WorklistItemKind, WorklistSummary } from "./types.js";

export type WorklistResult = { worklist: Worklist } | { error: string };

export const VALID_TRANSITIONS: Record<WorklistItemStatus, readonly WorklistItemStatus[]> = {
  pending: ["in_progress", "abandoned"],
  in_progress: ["completed", "blocked", "abandoned"],
  blocked: ["in_progress", "abandoned"],
  completed: [],
  abandoned: [],
};

/**
 * Create a new empty worklist for a task.
 */
export function createWorklist(taskId: string, description: string): Worklist {
  const now = new Date().toISOString();
  return {
    taskId,
    description,
    items: [],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Append a new item to the worklist. Items start as "pending".
 * Returns error if an item with the same ID already exists.
 */
export function appendItem(
  worklist: Worklist,
  item: { id: string; kind: WorklistItemKind; description: string },
): WorklistResult {
  if (worklist.items.some((i) => i.id === item.id)) {
    return { error: `Item with id "${item.id}" already exists` };
  }

  const now = new Date().toISOString();
  const newItem: WorklistItem = {
    id: item.id,
    kind: item.kind,
    description: item.description,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };

  return {
    worklist: {
      ...worklist,
      items: [...worklist.items, newItem],
      updatedAt: now,
    },
  };
}

/**
 * Update an item's status. Validates the transition against VALID_TRANSITIONS.
 * When transitioning TO "blocked", reason is required.
 * When transitioning FROM "blocked" to "in_progress", blockReason is cleared.
 * Returns error if: item not found, invalid transition, or blocked without reason.
 */
export function updateItemStatus(
  worklist: Worklist,
  itemId: string,
  newStatus: WorklistItemStatus,
  reason?: string,
): WorklistResult {
  const itemIndex = worklist.items.findIndex((i) => i.id === itemId);
  if (itemIndex === -1) {
    return { error: `Item "${itemId}" not found` };
  }

  const item = worklist.items[itemIndex];
  const allowed = VALID_TRANSITIONS[item.status];

  if (!allowed.includes(newStatus)) {
    return { error: `Invalid transition: "${item.status}" → "${newStatus}"` };
  }

  if (newStatus === "blocked" && !reason) {
    return { error: `Reason is required when transitioning to "blocked"` };
  }

  const now = new Date().toISOString();
  const updatedItem: WorklistItem = {
    ...item,
    status: newStatus,
    updatedAt: now,
    // Set blockReason when blocking, clear when unblocking
    blockReason: newStatus === "blocked" ? reason : undefined,
  };

  const newItems = [...worklist.items];
  newItems[itemIndex] = updatedItem;

  return {
    worklist: {
      ...worklist,
      items: newItems,
      updatedAt: now,
    },
  };
}

/**
 * Convenience: mark an item as blocked with a reason.
 * Equivalent to updateItemStatus(worklist, itemId, "blocked", reason).
 */
export function markBlocked(
  worklist: Worklist,
  itemId: string,
  reason: string,
): WorklistResult {
  return updateItemStatus(worklist, itemId, "blocked", reason);
}

/**
 * Attach a worklist item to a specialist (e.g., "specialist_builder").
 * Returns error if item not found.
 */
export function attachToSpecialist(
  worklist: Worklist,
  itemId: string,
  specialistId: string,
): WorklistResult {
  const itemIndex = worklist.items.findIndex((i) => i.id === itemId);
  if (itemIndex === -1) {
    return { error: `Item "${itemId}" not found` };
  }

  const now = new Date().toISOString();
  const updatedItem: WorklistItem = {
    ...worklist.items[itemIndex],
    specialistId,
    updatedAt: now,
  };

  const newItems = [...worklist.items];
  newItems[itemIndex] = updatedItem;

  return {
    worklist: {
      ...worklist,
      items: newItems,
      updatedAt: now,
    },
  };
}

/**
 * Generate a machine-readable summary of worklist state.
 */
export function getWorklistSummary(worklist: Worklist): WorklistSummary {
  const statusCounts: Record<WorklistItemStatus, number> = {
    pending: 0,
    in_progress: 0,
    completed: 0,
    blocked: 0,
    abandoned: 0,
  };

  const blockedItems: Array<{ id: string; description: string; blockReason: string }> = [];

  for (const item of worklist.items) {
    statusCounts[item.status]++;
    if (item.status === "blocked" && item.blockReason) {
      blockedItems.push({
        id: item.id,
        description: item.description,
        blockReason: item.blockReason,
      });
    }
  }

  const totalItems = worklist.items.length;
  const terminalCount = statusCounts.completed + statusCounts.abandoned;
  const isComplete = totalItems > 0 && terminalCount === totalItems;

  return {
    totalItems,
    statusCounts,
    blockedItems,
    isComplete,
    hasBlockers: blockedItems.length > 0,
  };
}
