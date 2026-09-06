/**
 * Undo/redo stacks for the workflow document.
 * Structural create/connect/remove and per-keystroke text each push one entry.
 * Replace actions (New / Demo / Import) use replaceHistory so undo cannot cross
 * a document boundary (WG-13, SH-12).
 */
import { clone } from "../workflow/ids";
import type { WorkflowDoc } from "../workflow/types";

export const HISTORY_LIMIT = 500;

export type HistoryKind = "structural" | "text";

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

export function commitStructural(
  workflow: WorkflowDoc,
  past: WorkflowDoc[],
  next: WorkflowDoc,
): HistoryStacks {
  return commitHistory(workflow, past, next);
}

export function commitText(
  workflow: WorkflowDoc,
  past: WorkflowDoc[],
  next: WorkflowDoc,
): HistoryStacks {
  return commitHistory(workflow, past, next);
}

/** Explicit history boundary: the new document cannot undo into the previous one. */
export function replaceHistory(next: WorkflowDoc): HistoryStacks {
  return { workflow: clone(next), past: [], future: [] };
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
