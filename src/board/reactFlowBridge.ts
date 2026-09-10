/**
 * Imperative handles to per-lane React Flow instances.
 * Board.tsx binds on mount. In Both, pan/zoom is copied onto the other lane (BA-05).
 */
import type { ReactFlowInstance, Viewport } from "@xyflow/react";
import { AssignmentLane, ViewMode, otherLane } from "../workflow/catalogs";
import { useStore } from "../state/store";

const insts: Partial<Record<AssignmentLane, ReactFlowInstance | null>> = {};
const programmatic = new Set<AssignmentLane>();

/** Called from Board Inner so pan keys and Both-sync can move this lane's viewport. */
export function bindReactFlow(lane: AssignmentLane, next: ReactFlowInstance | null) {
  insts[lane] = next;
}

export function getReactFlow(lane: AssignmentLane): ReactFlowInstance | null {
  return insts[lane] ?? null;
}

export function isProgrammaticViewport(lane: AssignmentLane): boolean {
  return programmatic.has(lane);
}

function close(a: Viewport, b: Viewport): boolean {
  return Math.abs(a.x - b.x) < 0.5 && Math.abs(a.y - b.y) < 0.5 && Math.abs(a.zoom - b.zoom) < 0.01;
}

/** Set one lane's camera without echoing back as a user move. */
export function applyViewport(lane: AssignmentLane, viewport: Viewport) {
  const inst = insts[lane];
  if (!inst) return;
  if (close(inst.getViewport(), viewport)) return;
  programmatic.add(lane);
  void inst.setViewport(viewport, { duration: 0 }).finally(() => {
    queueMicrotask(() => programmatic.delete(lane));
  });
}

/** True when this Present pane is collapsed away from the split. */
export function laneIsTucked(lane: AssignmentLane): boolean {
  const s = useStore.getState();
  return s.present && s.presentExpand !== null && s.presentExpand !== lane;
}

/** Compare and Present stack Before/After and share one pan/zoom camera (BA-05, P-07). */
export function sharesCompareCamera(): boolean {
  const s = useStore.getState();
  return s.present || s.view === ViewMode.Both;
}

/** Best-effort shared camera: copy this viewport onto the other stacked lane. */
export function syncBothViewports(source: AssignmentLane, viewport: Viewport) {
  if (!sharesCompareCamera()) return;
  if (programmatic.has(source)) return;
  applyViewport(otherLane(source), viewport);
}

/** Nudge the camera — in Compare/Present, both lanes move together. */
export function panBy(dx: number, dy: number, lane: AssignmentLane) {
  if (sharesCompareCamera()) {
    const inst =
      insts[lane] ?? insts[AssignmentLane.Before] ?? insts[AssignmentLane.After];
    if (!inst) return;
    const v = inst.getViewport();
    const next = { x: v.x + dx, y: v.y + dy, zoom: v.zoom };
    applyViewport(AssignmentLane.Before, next);
    applyViewport(AssignmentLane.After, next);
    useStore.getState().setLaneViewport(AssignmentLane.Before, next);
    useStore.getState().setLaneViewport(AssignmentLane.After, next);
    return;
  }
  const inst = insts[lane];
  if (!inst) return;
  const v = inst.getViewport();
  void inst.setViewport({ x: v.x + dx, y: v.y + dy, zoom: v.zoom }, { duration: 80 });
}
