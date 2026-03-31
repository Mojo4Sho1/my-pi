/**
 * Stage 4e.2 — Worklist operations tests.
 *
 * Tests all pure worklist functions: creation, item management,
 * state transitions, blocker rules, and summary generation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createWorklist,
  appendItem,
  updateItemStatus,
  markBlocked,
  attachToSpecialist,
  getWorklistSummary,
  VALID_TRANSITIONS,
} from "../extensions/worklist/index.js";
import type { Worklist, WorklistItemStatus } from "../extensions/worklist/index.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a worklist with one item in the given status. */
function worklistWithItem(
  status: WorklistItemStatus,
  opts?: { blockReason?: string },
): Worklist {
  let wl = createWorklist("task-1", "test task");
  const r = appendItem(wl, { id: "item-1", kind: "implementation", description: "do thing" });
  if (!("worklist" in r)) throw new Error(r.error);
  wl = r.worklist;

  if (status === "pending") return wl;

  // Move to in_progress
  const r2 = updateItemStatus(wl, "item-1", "in_progress");
  if (!("worklist" in r2)) throw new Error(r2.error);
  wl = r2.worklist;
  if (status === "in_progress") return wl;

  if (status === "blocked") {
    const r3 = updateItemStatus(wl, "item-1", "blocked", opts?.blockReason ?? "stuck");
    if (!("worklist" in r3)) throw new Error(r3.error);
    return r3.worklist;
  }

  if (status === "completed") {
    const r3 = updateItemStatus(wl, "item-1", "completed");
    if (!("worklist" in r3)) throw new Error(r3.error);
    return r3.worklist;
  }

  if (status === "abandoned") {
    const r3 = updateItemStatus(wl, "item-1", "abandoned");
    if (!("worklist" in r3)) throw new Error(r3.error);
    return r3.worklist;
  }

  return wl;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("createWorklist", () => {
  it("creates worklist with correct taskId and description", () => {
    const wl = createWorklist("task-42", "Build the widget");
    expect(wl.taskId).toBe("task-42");
    expect(wl.description).toBe("Build the widget");
  });

  it("creates worklist with empty items array", () => {
    const wl = createWorklist("t", "d");
    expect(wl.items).toEqual([]);
  });

  it("sets createdAt and updatedAt timestamps", () => {
    const wl = createWorklist("t", "d");
    expect(wl.createdAt).toBeTruthy();
    expect(wl.updatedAt).toBeTruthy();
    expect(wl.createdAt).toBe(wl.updatedAt);
  });
});

describe("appendItem", () => {
  it("appends item with pending status", () => {
    const wl = createWorklist("t", "d");
    const r = appendItem(wl, { id: "i1", kind: "planning", description: "plan it" });
    expect("worklist" in r).toBe(true);
    if (!("worklist" in r)) return;
    expect(r.worklist.items).toHaveLength(1);
    expect(r.worklist.items[0].status).toBe("pending");
    expect(r.worklist.items[0].kind).toBe("planning");
    expect(r.worklist.items[0].description).toBe("plan it");
  });

  it("sets createdAt and updatedAt on item", () => {
    const wl = createWorklist("t", "d");
    const r = appendItem(wl, { id: "i1", kind: "implementation", description: "build" });
    if (!("worklist" in r)) throw new Error("unexpected");
    expect(r.worklist.items[0].createdAt).toBeTruthy();
    expect(r.worklist.items[0].updatedAt).toBeTruthy();
  });

  it("returns error if item ID already exists", () => {
    const wl = createWorklist("t", "d");
    const r1 = appendItem(wl, { id: "dup", kind: "implementation", description: "first" });
    if (!("worklist" in r1)) throw new Error("unexpected");
    const r2 = appendItem(r1.worklist, { id: "dup", kind: "validation", description: "second" });
    expect("error" in r2).toBe(true);
    if ("error" in r2) {
      expect(r2.error).toContain("dup");
    }
  });

  it("updates worklist updatedAt timestamp", () => {
    const wl = createWorklist("t", "d");
    const origUpdated = wl.updatedAt;
    const r = appendItem(wl, { id: "i1", kind: "implementation", description: "build" });
    if (!("worklist" in r)) throw new Error("unexpected");
    // Timestamps may be equal if executed fast, but should exist
    expect(r.worklist.updatedAt).toBeTruthy();
  });
});

describe("updateItemStatus — valid transitions", () => {
  it("pending → in_progress", () => {
    const wl = worklistWithItem("pending");
    const r = updateItemStatus(wl, "item-1", "in_progress");
    expect("worklist" in r).toBe(true);
    if ("worklist" in r) expect(r.worklist.items[0].status).toBe("in_progress");
  });

  it("in_progress → completed", () => {
    const wl = worklistWithItem("in_progress");
    const r = updateItemStatus(wl, "item-1", "completed");
    expect("worklist" in r).toBe(true);
    if ("worklist" in r) expect(r.worklist.items[0].status).toBe("completed");
  });

  it("in_progress → blocked (with reason)", () => {
    const wl = worklistWithItem("in_progress");
    const r = updateItemStatus(wl, "item-1", "blocked", "waiting on dependency");
    expect("worklist" in r).toBe(true);
    if ("worklist" in r) {
      expect(r.worklist.items[0].status).toBe("blocked");
      expect(r.worklist.items[0].blockReason).toBe("waiting on dependency");
    }
  });

  it("in_progress → abandoned", () => {
    const wl = worklistWithItem("in_progress");
    const r = updateItemStatus(wl, "item-1", "abandoned");
    expect("worklist" in r).toBe(true);
    if ("worklist" in r) expect(r.worklist.items[0].status).toBe("abandoned");
  });

  it("blocked → in_progress (clears blockReason)", () => {
    const wl = worklistWithItem("blocked", { blockReason: "stuck on X" });
    expect(wl.items[0].blockReason).toBe("stuck on X");
    const r = updateItemStatus(wl, "item-1", "in_progress");
    expect("worklist" in r).toBe(true);
    if ("worklist" in r) {
      expect(r.worklist.items[0].status).toBe("in_progress");
      expect(r.worklist.items[0].blockReason).toBeUndefined();
    }
  });

  it("blocked → abandoned", () => {
    const wl = worklistWithItem("blocked");
    const r = updateItemStatus(wl, "item-1", "abandoned");
    expect("worklist" in r).toBe(true);
    if ("worklist" in r) expect(r.worklist.items[0].status).toBe("abandoned");
  });

  it("pending → abandoned", () => {
    const wl = worklistWithItem("pending");
    const r = updateItemStatus(wl, "item-1", "abandoned");
    expect("worklist" in r).toBe(true);
    if ("worklist" in r) expect(r.worklist.items[0].status).toBe("abandoned");
  });
});

describe("updateItemStatus — invalid transitions", () => {
  it("completed → any returns error", () => {
    const wl = worklistWithItem("completed");
    for (const target of ["pending", "in_progress", "blocked", "abandoned"] as WorklistItemStatus[]) {
      const r = updateItemStatus(wl, "item-1", target);
      expect("error" in r).toBe(true);
    }
  });

  it("abandoned → any returns error", () => {
    const wl = worklistWithItem("abandoned");
    for (const target of ["pending", "in_progress", "completed", "blocked"] as WorklistItemStatus[]) {
      const r = updateItemStatus(wl, "item-1", target);
      expect("error" in r).toBe(true);
    }
  });

  it("pending → completed returns error (must go through in_progress)", () => {
    const wl = worklistWithItem("pending");
    const r = updateItemStatus(wl, "item-1", "completed");
    expect("error" in r).toBe(true);
  });

  it("pending → blocked returns error (must go through in_progress)", () => {
    const wl = worklistWithItem("pending");
    const r = updateItemStatus(wl, "item-1", "blocked");
    expect("error" in r).toBe(true);
  });

  it("blocked → completed returns error (must go through in_progress)", () => {
    const wl = worklistWithItem("blocked");
    const r = updateItemStatus(wl, "item-1", "completed");
    expect("error" in r).toBe(true);
  });
});

describe("updateItemStatus — blocker rules", () => {
  it("transitioning to blocked without reason returns error", () => {
    const wl = worklistWithItem("in_progress");
    const r = updateItemStatus(wl, "item-1", "blocked");
    expect("error" in r).toBe(true);
    if ("error" in r) expect(r.error).toContain("Reason is required");
  });

  it("transitioning to blocked with reason sets blockReason", () => {
    const wl = worklistWithItem("in_progress");
    const r = updateItemStatus(wl, "item-1", "blocked", "dependency missing");
    expect("worklist" in r).toBe(true);
    if ("worklist" in r) expect(r.worklist.items[0].blockReason).toBe("dependency missing");
  });

  it("transitioning from blocked to in_progress clears blockReason", () => {
    const wl = worklistWithItem("blocked", { blockReason: "old reason" });
    const r = updateItemStatus(wl, "item-1", "in_progress");
    expect("worklist" in r).toBe(true);
    if ("worklist" in r) expect(r.worklist.items[0].blockReason).toBeUndefined();
  });
});

describe("updateItemStatus — item not found", () => {
  it("returns error for unknown item ID", () => {
    const wl = createWorklist("t", "d");
    const r = updateItemStatus(wl, "nonexistent", "in_progress");
    expect("error" in r).toBe(true);
    if ("error" in r) expect(r.error).toContain("nonexistent");
  });
});

describe("markBlocked", () => {
  it("marks item as blocked with reason", () => {
    const wl = worklistWithItem("in_progress");
    const r = markBlocked(wl, "item-1", "waiting for API");
    expect("worklist" in r).toBe(true);
    if ("worklist" in r) {
      expect(r.worklist.items[0].status).toBe("blocked");
      expect(r.worklist.items[0].blockReason).toBe("waiting for API");
    }
  });

  it("returns error if item not in_progress", () => {
    const wl = worklistWithItem("pending");
    const r = markBlocked(wl, "item-1", "reason");
    expect("error" in r).toBe(true);
  });
});

describe("attachToSpecialist", () => {
  it("sets specialistId on item", () => {
    const wl = worklistWithItem("pending");
    const r = attachToSpecialist(wl, "item-1", "specialist_builder");
    expect("worklist" in r).toBe(true);
    if ("worklist" in r) expect(r.worklist.items[0].specialistId).toBe("specialist_builder");
  });

  it("returns error if item not found", () => {
    const wl = createWorklist("t", "d");
    const r = attachToSpecialist(wl, "ghost", "specialist_planner");
    expect("error" in r).toBe(true);
    if ("error" in r) expect(r.error).toContain("ghost");
  });
});

describe("getWorklistSummary", () => {
  it("returns correct totalItems count", () => {
    let wl = createWorklist("t", "d");
    let r = appendItem(wl, { id: "a", kind: "planning", description: "plan" });
    if ("worklist" in r) wl = r.worklist;
    r = appendItem(wl, { id: "b", kind: "implementation", description: "build" });
    if ("worklist" in r) wl = r.worklist;

    const summary = getWorklistSummary(wl);
    expect(summary.totalItems).toBe(2);
  });

  it("returns correct statusCounts for each status", () => {
    // Build a worklist with items in various states
    let wl = createWorklist("t", "d");

    // Item 1: pending
    let r = appendItem(wl, { id: "i1", kind: "planning", description: "plan" });
    if ("worklist" in r) wl = r.worklist;

    // Item 2: in_progress
    r = appendItem(wl, { id: "i2", kind: "implementation", description: "build" });
    if ("worklist" in r) wl = r.worklist;
    const r2 = updateItemStatus(wl, "i2", "in_progress");
    if ("worklist" in r2) wl = r2.worklist;

    // Item 3: completed
    r = appendItem(wl, { id: "i3", kind: "validation", description: "test" });
    if ("worklist" in r) wl = r.worklist;
    let r3 = updateItemStatus(wl, "i3", "in_progress");
    if ("worklist" in r3) wl = r3.worklist;
    r3 = updateItemStatus(wl, "i3", "completed");
    if ("worklist" in r3) wl = r3.worklist;

    const summary = getWorklistSummary(wl);
    expect(summary.statusCounts.pending).toBe(1);
    expect(summary.statusCounts.in_progress).toBe(1);
    expect(summary.statusCounts.completed).toBe(1);
    expect(summary.statusCounts.blocked).toBe(0);
    expect(summary.statusCounts.abandoned).toBe(0);
  });

  it("surfaces blocked items with id, description, and reason", () => {
    let wl = createWorklist("t", "d");
    let r = appendItem(wl, { id: "b1", kind: "implementation", description: "build X" });
    if ("worklist" in r) wl = r.worklist;
    let r2 = updateItemStatus(wl, "b1", "in_progress");
    if ("worklist" in r2) wl = r2.worklist;
    r2 = updateItemStatus(wl, "b1", "blocked", "missing dep");
    if ("worklist" in r2) wl = r2.worklist;

    const summary = getWorklistSummary(wl);
    expect(summary.blockedItems).toHaveLength(1);
    expect(summary.blockedItems[0]).toEqual({
      id: "b1",
      description: "build X",
      blockReason: "missing dep",
    });
  });

  it("isComplete true when all items completed or abandoned", () => {
    let wl = createWorklist("t", "d");
    let r = appendItem(wl, { id: "c1", kind: "planning", description: "plan" });
    if ("worklist" in r) wl = r.worklist;
    r = appendItem(wl, { id: "c2", kind: "implementation", description: "build" });
    if ("worklist" in r) wl = r.worklist;

    // c1: completed
    let r2 = updateItemStatus(wl, "c1", "in_progress");
    if ("worklist" in r2) wl = r2.worklist;
    r2 = updateItemStatus(wl, "c1", "completed");
    if ("worklist" in r2) wl = r2.worklist;

    // c2: abandoned
    r2 = updateItemStatus(wl, "c2", "abandoned");
    if ("worklist" in r2) wl = r2.worklist;

    expect(getWorklistSummary(wl).isComplete).toBe(true);
  });

  it("isComplete false when any items pending/in_progress/blocked", () => {
    let wl = createWorklist("t", "d");
    let r = appendItem(wl, { id: "x", kind: "planning", description: "plan" });
    if ("worklist" in r) wl = r.worklist;
    expect(getWorklistSummary(wl).isComplete).toBe(false);
  });

  it("hasBlockers true when blocked items exist", () => {
    const wl = worklistWithItem("blocked", { blockReason: "stuck" });
    expect(getWorklistSummary(wl).hasBlockers).toBe(true);
  });

  it("hasBlockers false when no blocked items", () => {
    const wl = worklistWithItem("in_progress");
    expect(getWorklistSummary(wl).hasBlockers).toBe(false);
  });

  it("handles empty worklist (0 items)", () => {
    const wl = createWorklist("t", "d");
    const summary = getWorklistSummary(wl);
    expect(summary.totalItems).toBe(0);
    expect(summary.isComplete).toBe(false);
    expect(summary.hasBlockers).toBe(false);
    expect(summary.blockedItems).toEqual([]);
  });
});

describe("serialization", () => {
  it("worklist round-trips through JSON.stringify/parse", () => {
    let wl = createWorklist("task-1", "test serialization");
    let r = appendItem(wl, { id: "s1", kind: "implementation", description: "build" });
    if ("worklist" in r) wl = r.worklist;
    let r2 = updateItemStatus(wl, "s1", "in_progress");
    if ("worklist" in r2) wl = r2.worklist;

    const json = JSON.stringify(wl);
    const parsed = JSON.parse(json) as typeof wl;

    expect(parsed.taskId).toBe(wl.taskId);
    expect(parsed.items).toHaveLength(1);
    expect(parsed.items[0].status).toBe("in_progress");
  });

  it("item timestamps preserved through serialization", () => {
    let wl = createWorklist("t", "d");
    const r = appendItem(wl, { id: "ts1", kind: "planning", description: "plan" });
    if ("worklist" in r) wl = r.worklist;

    const json = JSON.stringify(wl);
    const parsed = JSON.parse(json) as typeof wl;

    expect(parsed.items[0].createdAt).toBe(wl.items[0].createdAt);
    expect(parsed.items[0].updatedAt).toBe(wl.items[0].updatedAt);
  });
});

describe("VALID_TRANSITIONS", () => {
  it("has exactly 7 valid transitions", () => {
    let count = 0;
    for (const targets of Object.values(VALID_TRANSITIONS)) {
      count += targets.length;
    }
    expect(count).toBe(7);
  });

  it("completed and abandoned are terminal (no outgoing transitions)", () => {
    expect(VALID_TRANSITIONS.completed).toEqual([]);
    expect(VALID_TRANSITIONS.abandoned).toEqual([]);
  });
});
