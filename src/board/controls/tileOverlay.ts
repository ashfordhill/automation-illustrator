/**
 * Overlay geometry for tile chrome (plus-pull scrim, taffy/Path exit, drag ghost).
 * Screen-space holes must use the live tile’s radius — never Step’s 14 on Data.
 */
import { WorkflowNodeKind, type WorkflowNodeKind as WorkflowNodeKindT } from "../../workflow/catalogs";
import { nodeRadius, nodeSize } from "../layout/tileMetrics";

export type TileRect = { x: number; y: number; w: number; h: number; rx: number };

/**
 * Map a CSS corner radius onto a screen-space box (React Flow viewport zoom).
 * getComputedStyle radius stays in layout px; getBoundingClientRect is screen px.
 */
export function scaleCornerRadius(cssRx: number, layoutW: number, screenW: number): number {
  if (!(cssRx > 0)) return 0;
  if (!(layoutW > 0) || !(screenW > 0)) return cssRx;
  return cssRx * (screenW / layoutW);
}

/** Last-resort overlay rect when the tile DOM is missing. Uses that Node kind’s size and radius. */
export function fallbackTileRect(
  rest: { right: number; top: number },
  type: WorkflowNodeKindT = WorkflowNodeKind.Step,
): TileRect {
  const { w, h } = nodeSize(type);
  return {
    x: rest.right - w,
    y: rest.top - 8,
    w,
    h,
    rx: nodeRadius(type),
  };
}
