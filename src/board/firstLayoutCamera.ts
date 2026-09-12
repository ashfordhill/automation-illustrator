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

/** Cover the board until the first nonempty camera is applied (no pre-fit flash). */
export function boardNeedsCover(nodeCount: number, cameraApplied: boolean): boolean {
  return nodeCount > 0 && !cameraApplied;
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

/** Fit `rect` in the pane with the same padding first-layout fitView uses. */
export function viewportToFitRect(
  pane: { width: number; height: number },
  rect: Rect,
  padding = FIRST_LAYOUT_FIT_PADDING,
  zoomMin = 0.2,
  zoomMax = 2.5,
): { x: number; y: number; zoom: number } {
  const pad = Math.max(0.05, padding);
  const zoom = Math.min(zoomMax, Math.max(zoomMin, Math.min(pane.width / (rect.w * (1 + 2 * pad)), pane.height / (rect.h * (1 + 2 * pad)))));
  return viewportToCenterRect(pane, rect, zoom);
}

export function layoutBoundsAreUsable(bounds: Rect | undefined): bounds is Rect {
  return Boolean(bounds && bounds.w > 0 && bounds.h > 0);
}

/** Union of placed node boxes (not the padded ELK root). Matches fitView extents. */
export function unionNodeBounds(
  positions: Record<string, { x: number; y: number }>,
  sizes: Record<string, { w: number; h: number }>,
): Rect | undefined {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [id, p] of Object.entries(positions)) {
    const s = sizes[id];
    if (!s || s.w <= 0 || s.h <= 0) continue;
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x + s.w);
    maxY = Math.max(maxY, p.y + s.h);
  }
  if (!Number.isFinite(minX)) return undefined;
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}
