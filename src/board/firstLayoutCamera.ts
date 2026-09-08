/**
 * First-layout camera (P-08): empty New must not consume the one-time fit.
 * After Add Step / Add Data, pan the sole Tile to the board center at the
 * current zoom — do not zoom in on a single island.
 */
import type { LayoutPhase, Rect } from "./layout/laneLayout";

/** Same padding demos use when the first nonempty graph is larger than the pane. */
export const FIRST_LAYOUT_FIT_PADDING = 0.28;

/** True when this layout may take the one-time camera (nonempty and settled). */
export function canApplyFirstLayoutCamera(phase: LayoutPhase, nodeCount: number): boolean {
  return phase === "ready" && nodeCount > 0;
}

/** A single Tile from New: keep zoom and pan to center. Demos still fitView. */
export function firstLayoutCentersAtCurrentZoom(nodeCount: number): boolean {
  return nodeCount === 1;
}

/**
 * React Flow viewport translation so `rect`'s center sits in the pane center
 * at `zoom`. Flow point (fx, fy) maps to pane (x + fx * zoom, y + fy * zoom).
 */
export function viewportToCenterRect(
  pane: { width: number; height: number },
  rect: Rect,
  zoom: number,
): { x: number; y: number; zoom: number } {
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  return {
    x: pane.width / 2 - cx * zoom,
    y: pane.height / 2 - cy * zoom,
    zoom,
  };
}

export function layoutBoundsAreUsable(bounds: Rect | undefined): bounds is Rect {
  return Boolean(bounds && bounds.w > 0 && bounds.h > 0);
}
