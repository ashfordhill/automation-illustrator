/**
 * User-driven wheel zoom (P-08). Finer steps than React Flow's default; zoom-in
 * on empty paper aims at the laid-out graph instead of the void under the cursor.
 */
import type { Rect } from "./layout/laneLayout";

export const MIN_ZOOM = 0.2;
export const MAX_ZOOM = 2.5;
/** One mouse-wheel notch (100 px or 3 lines) multiplies zoom by this. */
export const WHEEL_ZOOM_FACTOR = 1.08;
export const ZOOM_BOUNDS_PAD = 32;
/** Graph is an "island" when it covers less than this fraction on both axes. */
export const GRAPH_ISLAND_FRACTION = 0.4;

export function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

/** Map a wheel delta to a multiplicative zoom factor (deltaY > 0 zooms out). */
export function wheelZoomFactor(deltaY: number, deltaMode = 0): number {
  const pixels = deltaMode === 1 ? deltaY * (100 / 3) : deltaMode === 2 ? deltaY * 800 : deltaY;
  if (pixels === 0) return 1;
  return Math.pow(WHEEL_ZOOM_FACTOR, -pixels / 100);
}

export function pointInPaddedBounds(
  p: { x: number; y: number },
  bounds: Rect,
  pad = ZOOM_BOUNDS_PAD,
): boolean {
  return (
    p.x >= bounds.x - pad &&
    p.x <= bounds.x + bounds.w + pad &&
    p.y >= bounds.y - pad &&
    p.y <= bounds.y + bounds.h + pad
  );
}

export function graphIsIsland(
  bounds: Rect,
  zoom: number,
  pane: { width: number; height: number },
  fraction = GRAPH_ISLAND_FRACTION,
): boolean {
  if (pane.width <= 0 || pane.height <= 0) return false;
  return bounds.w * zoom < pane.width * fraction && bounds.h * zoom < pane.height * fraction;
}

export function pointerOverNodeOrPath(el: EventTarget | null): boolean {
  if (!(el instanceof Element)) return false;
  return Boolean(
    el.closest(".react-flow__node") ||
      el.closest(".react-flow__edge") ||
      el.closest(".path-condition") ||
      el.closest(".path-condition-wrap") ||
      el.closest(".path-chip-editor"),
  );
}

/**
 * Zooming in on empty paper (or a tiny island graph) uses the layout bounds
 * center. Pointer over a Node or Path, and all zoom-out, stay cursor-centered.
 */
export function shouldZoomTowardBounds(opts: {
  zoomingIn: boolean;
  pointerOverNodeOrPath: boolean;
  pointerInPaddedBounds: boolean;
  graphIsland: boolean;
}): boolean {
  if (!opts.zoomingIn) return false;
  if (opts.pointerOverNodeOrPath) return false;
  return !opts.pointerInPaddedBounds || opts.graphIsland;
}

/** Pan offsets so flow point (flowX, flowY) stays under client (clientX, clientY). */
export function viewportZoomAround(opts: {
  paneLeft: number;
  paneTop: number;
  clientX: number;
  clientY: number;
  flowX: number;
  flowY: number;
  nextZoom: number;
}): { x: number; y: number; zoom: number } {
  return {
    x: opts.clientX - opts.paneLeft - opts.flowX * opts.nextZoom,
    y: opts.clientY - opts.paneTop - opts.flowY * opts.nextZoom,
    zoom: opts.nextZoom,
  };
}
