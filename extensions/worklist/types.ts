/**
 * Worklist types for execution-state tracking (Stage 4e.2).
 *
 * The worklist is an orchestrator-internal aid — it tracks item status
 * during multi-specialist delegations but does not influence routing.
 */

export type WorklistItemStatus = "pending" | "in_progress" | "completed" | "blocked" | "abandoned";

export type WorklistItemKind =
  | "discovery"
  | "planning"
  | "implementation"
  | "validation"
  | "review_gate"
  | "blocker"
  | "completion_criteria";

export interface WorklistItem {
  /** Unique identifier (e.g., "wl_item_abc123") */
  id: string;
  /** What category of work this represents */
  kind: WorklistItemKind;
  /** Human-readable description of the work item */
  description: string;
  /** Current status */
  status: WorklistItemStatus;
  /** Which specialist this is attached to (e.g., "specialist_builder") */
  specialistId?: string;
  /** Reason for blocking — required when status is "blocked", cleared on unblock */
  blockReason?: string;
  /** When this item was created */
  createdAt: string;
  /** When this item's status last changed */
  updatedAt: string;
}

export interface Worklist {
  /** ID of the task this worklist belongs to */
  taskId: string;
  /** Human-readable description of the overall task */
  description: string;
  /** Ordered list of work items */
  items: WorklistItem[];
  /** When this worklist was created */
  createdAt: string;
  /** When this worklist was last modified */
  updatedAt: string;
}

export interface WorklistSummary {
  /** Total item count */
  totalItems: number;
  /** Count of items in each status */
  statusCounts: Record<WorklistItemStatus, number>;
  /** Items currently blocked (id + reason) */
  blockedItems: Array<{ id: string; description: string; blockReason: string }>;
  /** Whether all items are in a terminal state (completed or abandoned) */
  isComplete: boolean;
  /** Whether any items are blocked */
  hasBlockers: boolean;
}
