/**
 * Pixel sizes and placement helpers for board tiles.
 * Board.tsx uses the sizes; store.ts uses snap/vacant/dock when adding or linking tiles.
 */
import { WorkflowNodeKind, type WorkflowNodeKind as WorkflowNodeKindT } from "../../workflow/catalogs";
import type { Point } from "../../workflow/types";

export const STEP_W = 256;
export const STEP_H = 160;
/** Left column of a Step tile (human/robot figure + name). */
export const ACTOR_W = 96;
export const FIELD_W = 128;
export const FIELD_H = 96;
export const TILE_GAP = 64;
export const BRANCH_GAP = 32;
export const GRID = 32;

export type Placed = { position: Point; type: WorkflowNodeKindT };

/** Snap a coordinate onto the 32px board grid. */
export function snapToGrid(n: number): number {
  return Math.round(n / GRID) * GRID;
}

/** Bounding size for a workflow node kind (not the React Flow `"field"` alias). */
export function nodeSize(type: WorkflowNodeKindT) {
  return type === WorkflowNodeKind.Step
    ? { w: STEP_W, h: STEP_H }
    : { w: FIELD_W, h: FIELD_H };
}

function nodeRect(n: Placed) {
  const { w, h } = nodeSize(n.type);
  return { x: n.position.x, y: n.position.y, w, h };
}

/** True when two tiles would collide, including a one-grid gutter. */
export function rectsOverlap(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
  pad = GRID,
) {
  return !(
    a.x + a.w + pad <= b.x ||
    b.x + b.w + pad <= a.x ||
    a.y + a.h + pad <= b.y ||
    b.y + b.h + pad <= a.y
  );
}

function overlapsAny(pos: Point, type: WorkflowNodeKindT, others: Placed[]) {
  const r = { x: pos.x, y: pos.y, ...nodeSize(type) };
  return others.some((n) => rectsOverlap(r, nodeRect(n)));
}

/** Vertical pitch so a branch of `targetType` cannot sit on a sibling. */
function dockStride(sourceType: WorkflowNodeKindT, targetType: WorkflowNodeKindT) {
  return Math.max(nodeSize(sourceType).h, nodeSize(targetType).h) + BRANCH_GAP;
}

/**
 * Where a newly linked tile should sit: to the right of `source`, stacked by port index.
 * Stride uses the taller of source/target so a Step never overlaps another Step
 * when both hang off a shorter Data tile.
 */
export function dockPosition(
  source: Placed,
  targetType: WorkflowNodeKindT,
  portIndex: number,
): Point {
  const src = nodeSize(source.type);
  const tgt = nodeSize(targetType);
  const stride = dockStride(source.type, targetType);
  return {
    x: snapToGrid(source.position.x + src.w + TILE_GAP),
    y: snapToGrid(source.position.y + src.h / 2 + portIndex * stride - tgt.h / 2),
  };
}

/**
 * Same as dockPosition, then walk down the column until the slot is empty.
 * Used by store.spawnBranch when + creates a connected Node.
 */
export function clearDockPosition(
  source: Placed,
  targetType: WorkflowNodeKindT,
  portIndex: number,
  others: Placed[],
): Point {
  for (let i = portIndex; i < portIndex + 40; i++) {
    const pos = dockPosition(source, targetType, i);
    if (!overlapsAny(pos, targetType, others)) return pos;
  }
  const x = dockPosition(source, targetType, 0).x;
  const maxY = Math.max(0, ...others.map((n) => n.position.y + nodeSize(n.type).h));
  return { x, y: snapToGrid(maxY + TILE_GAP) };
}

/** First empty column to the right of existing tiles — palette Data (and the first Step). */
export function vacantSpot(
  nodes: Placed[],
  type: WorkflowNodeKindT = WorkflowNodeKind.Step,
): Point {
  if (!nodes.length) return { x: GRID, y: GRID * 5 };
  const maxX = Math.max(...nodes.map((n) => n.position.x + nodeSize(n.type).w));
  const x = snapToGrid(maxX + TILE_GAP);
  const { h } = nodeSize(type);
  let y = snapToGrid(Math.min(...nodes.map((n) => n.position.y)));
  for (let n = 0; n < 40; n++) {
    const pos = { x, y };
    if (!overlapsAny(pos, type, nodes)) return pos;
    y = snapToGrid(y + h + BRANCH_GAP);
  }
  const maxY = Math.max(...nodes.map((n) => n.position.y + nodeSize(n.type).h));
  return { x, y: snapToGrid(maxY + TILE_GAP) };
}

/** Approximate width of the on-canvas edge label chip. */
export function labelChipWidth(label: string) {
  const t = label.trim();
  if (!t) return 0;
  return Math.max(GRID, Math.ceil((t.length * 8 + 32) / GRID) * GRID);
}

/** Horizontal gap needed between source and target so a label is not under a tile. */
export function gapForLabel(label: string) {
  return Math.max(TILE_GAP, labelChipWidth(label) + GRID);
}
