/**
 * Imperative handles to per-lane React Flow instances.
 * Board.tsx binds on mount; keyboard/useAppKeys.ts pans the focused lane (BA-05).
 */
import type { ReactFlowInstance } from "@xyflow/react";
import { AssignmentLane } from "../workflow/catalogs";

const insts: Partial<Record<AssignmentLane, ReactFlowInstance | null>> = {};

/** Called from Board Inner so pan keys can move this lane's viewport. */
export function bindReactFlow(lane: AssignmentLane, next: ReactFlowInstance | null) {
  insts[lane] = next;
}

/** Nudge the camera of one lane — used by panLeft/Right/Up/Down key actions. */
export function panBy(dx: number, dy: number, lane: AssignmentLane) {
  const inst = insts[lane];
  if (!inst) return;
  const v = inst.getViewport();
  void inst.setViewport({ x: v.x + dx, y: v.y + dy, zoom: v.zoom }, { duration: 80 });
}
