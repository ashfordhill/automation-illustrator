/**
 * Imperative handle to the active React Flow instance.
 * Board.tsx binds on mount; keyboard/useAppKeys.ts pans with panBy.
 * Needed because key handlers sit outside the React Flow tree.
 */
import type { ReactFlowInstance } from "@xyflow/react";

let inst: ReactFlowInstance | null = null;

/** Called from Board Inner so pan keys can move the viewport. */
export function bindReactFlow(next: ReactFlowInstance | null) {
  inst = next;
}

/** Nudge the camera — used by panLeft/Right/Up/Down key actions. */
export function panBy(dx: number, dy: number) {
  if (!inst) return;
  const v = inst.getViewport();
  void inst.setViewport({ x: v.x + dx, y: v.y + dy, zoom: v.zoom }, { duration: 80 });
}
