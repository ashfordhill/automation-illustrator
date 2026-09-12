/**
 * Imperative handles to per-lane React Flow instances.
 * Board.tsx binds on mount. After always follows Before's camera (BA-05);
 * Compare and Present also copy live pan/zoom onto the stacked other lane.
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

/** Mark this lane's next camera change as programmatic (fitView, restore). */
export function beginProgrammaticViewport(lane: AssignmentLane) {
  programmatic.add(lane);
}

export function endProgrammaticViewport(lane: AssignmentLane) {
  queueMicrotask(() => programmatic.delete(lane));
}

/** Set one lane's camera without echoing back as a user move. */
export function applyViewport(lane: AssignmentLane, viewport: Viewport) {
  const inst = insts[lane];
  if (!inst) return;
  if (close(inst.getViewport(), viewport)) return;
  beginProgrammaticViewport(lane);
  void inst.setViewport(viewport, { duration: 0 }).finally(() => {
    endProgrammaticViewport(lane);
  });
}

/** True when this Present pane is collapsed away from the split. */
export function laneIsTucked(lane: AssignmentLane): boolean {
  const s = useStore.getState();
  return s.present && s.presentExpand !== null && s.presentExpand !== lane;
}

/** Compare and Present stack Before/After and share one live pan/zoom camera (BA-05, P-07). */
export function sharesCompareCamera(): boolean {
  const s = useStore.getState();
  return s.present || s.view === ViewMode.Both;
}

/** Persist the same camera on both lanes so After follows Before after a remount. */
export function persistSharedViewport(viewport: Viewport) {
  const s = useStore.getState();
  s.setLaneViewport(AssignmentLane.Before, viewport);
  s.setLaneViewport(AssignmentLane.After, viewport);
}

/**
 * Camera the mounting lane should inherit instead of fitting on its own.
 * Only stored cameras count — a live sibling still at the default 0,0,1
 * must not block the first fitView. After prefers Before.
 */
export function cameraToFollow(lane: AssignmentLane): Viewport | undefined {
  const stored = useStore.getState().laneViewports;
  return (
    stored[AssignmentLane.Before] ??
    stored[lane] ??
    stored[otherLane(lane)]
  );
}

/** Best-effort shared camera: copy this viewport onto the other stacked lane. */
export function syncBothViewports(source: AssignmentLane, viewport: Viewport) {
  if (programmatic.has(source)) return;
  applyViewport(otherLane(source), viewport);
}

/** Nudge the camera. After follows Before; both stored viewports stay aligned. */
export function panBy(dx: number, dy: number, lane: AssignmentLane) {
  const inst =
    insts[lane] ?? insts[AssignmentLane.Before] ?? insts[AssignmentLane.After];
  if (!inst) return;
  const v = inst.getViewport();
  const next = { x: v.x + dx, y: v.y + dy, zoom: v.zoom };
  applyViewport(AssignmentLane.Before, next);
  applyViewport(AssignmentLane.After, next);
  persistSharedViewport(next);
}
