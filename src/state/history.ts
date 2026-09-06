/**
 * Undo/redo stacks for the workflow document.
 * Extracted from store.ts unchanged (capacity 80 until Slice 4).
 */
import { clone } from "../workflow/ids";
import type { WorkflowDoc } from "../workflow/types";

const HISTORY_LIMIT = 80;

export type HistoryStacks = {
  workflow: WorkflowDoc;
  past: WorkflowDoc[];
  future: WorkflowDoc[];
};

/** Snapshot current board onto the undo stack and clear redo. */
export function commitHistory(
  workflow: WorkflowDoc,
  past: WorkflowDoc[],
  next: WorkflowDoc,
): HistoryStacks {
  return {
    workflow: next,
    past: [...past, clone(workflow)].slice(-HISTORY_LIMIT),
    future: [],
  };
}

export function undoHistory(
  past: WorkflowDoc[],
  workflow: WorkflowDoc,
  future: WorkflowDoc[],
): HistoryStacks | null {
  const prev = past.at(-1);
  if (!prev) return null;
  return {
    workflow: prev,
    past: past.slice(0, -1),
    future: [clone(workflow), ...future],
  };
}

export function redoHistory(
  past: WorkflowDoc[],
  workflow: WorkflowDoc,
  future: WorkflowDoc[],
): HistoryStacks | null {
  const nxt = future[0];
  if (!nxt) return null;
  return {
    workflow: nxt,
    past: [...past, clone(workflow)],
    future: future.slice(1),
  };
}
