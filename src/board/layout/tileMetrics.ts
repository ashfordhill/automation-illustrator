/**
 * Pixel sizes and placement helpers for board tiles.
 * Board.tsx uses the sizes; store.ts uses snap/vacant/dock when adding or linking tiles.
 */
import { WorkflowNodeKind, type WorkflowNodeKind as WorkflowNodeKindT } from "../../workflow/catalogs";
import type { Point, PositionMap } from "../../workflow/types";
import { flowProfile, type BoardOrientation } from "../flow/flowProfile";

export const STEP_W = 256;
export const STEP_H = 160;
/** Left column of a Step tile (human/robot figure + name). */
export const ACTOR_W = 96;
export const FIELD_W = 128;
export const FIELD_H = 96;
/** Step tile corner radius (px, unscaled). Overlay masks must use the screen-scaled value. */
export const STEP_RX = 14;
/** Data tile corner radius (px, unscaled). Pill-like; never reuse STEP_RX for Data. */
export const FIELD_RX = 32;
export const TILE_GAP = 64;
export const BRANCH_GAP = 32;
export const GRID = 32;

export type Placed = { position: Point; type: WorkflowNodeKindT; id?: string };

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

/** Corner radius for a workflow node kind. Overlay holes must follow this, not Step’s 14. */
export function nodeRadius(type: WorkflowNodeKindT) {
  return type === WorkflowNodeKind.Step ? STEP_RX : FIELD_RX;
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
 * Where a newly linked tile should sit: along the flow from `source`.
 * Same across-flow slot first (port 0). Stride uses the taller/wider of
 * source/target so a Step never overlaps another Step when both hang off a
 * shorter Data tile.
 */
export function dockPosition(
  source: Placed,
  targetType: WorkflowNodeKindT,
  portIndex: number,
  side: "out" | "in" = "out",
  orientation: BoardOrientation = "horizontal",
): Point {
  const src = nodeSize(source.type);
  const tgt = nodeSize(targetType);
  const profile = flowProfile(orientation);
  if (profile.along === "y") {
    const stride = Math.max(src.w, tgt.w) + BRANCH_GAP;
    const y =
      side === "in"
        ? snapToGrid(source.position.y - TILE_GAP - tgt.h)
        : snapToGrid(source.position.y + src.h + TILE_GAP);
    return {
      x: snapToGrid(source.position.x + src.w / 2 + portIndex * stride - tgt.w / 2),
      y,
    };
  }
  const stride = dockStride(source.type, targetType);
  const x =
    side === "in"
      ? snapToGrid(source.position.x - TILE_GAP - tgt.w)
      : snapToGrid(source.position.x + src.w + TILE_GAP);
  return {
    x,
    y: snapToGrid(source.position.y + src.h / 2 + portIndex * stride - tgt.h / 2),
  };
}

/**
 * Overlay displayed (ELK) positions onto tiles for docking. Saved document
 * positions stay creation hints until a layout exists.
 */
export function withDisplayedPositions(nodes: Placed[], positions?: PositionMap): Placed[] {
  if (!positions) return nodes;
  return nodes.map((n) => {
    const next = n.id ? positions[n.id] : undefined;
    return next ? { ...n, position: next } : n;
  });
}

/**
 * Same across-flow slot as `source`, walking further along the dock axis if
 * that slot is taken; then stack on the sibling axis from `portIndex`.
 * Used by store.spawnBranch.
 */
export function clearDockPosition(
  source: Placed,
  targetType: WorkflowNodeKindT,
  portIndex: number,
  others: Placed[],
  side: "out" | "in" = "out",
  orientation: BoardOrientation = "horizontal",
): Point {
  const src = nodeSize(source.type);
  const tgt = nodeSize(targetType);
  const profile = flowProfile(orientation);
  if (profile.along === "y") {
    const sameX = snapToGrid(source.position.x + src.w / 2 - tgt.w / 2);
    const strideY = tgt.h + TILE_GAP;
    const baseY =
      side === "in"
        ? snapToGrid(source.position.y - TILE_GAP - tgt.h)
        : snapToGrid(source.position.y + src.h + TILE_GAP);
    const dir = side === "in" ? -1 : 1;
    for (let col = 0; col < 40; col++) {
      const pos = { x: sameX, y: snapToGrid(baseY + dir * col * strideY) };
      if (!overlapsAny(pos, targetType, others)) return pos;
    }
    const start = Math.max(1, portIndex);
    for (let i = start; i < start + 40; i++) {
      const pos = dockPosition(source, targetType, i, side, orientation);
      if (!overlapsAny(pos, targetType, others)) return pos;
    }
    const y = dockPosition(source, targetType, 0, side, orientation).y;
    const maxX = Math.max(0, ...others.map((n) => n.position.x + nodeSize(n.type).w));
    return { x: snapToGrid(maxX + TILE_GAP), y };
  }
  const sameY = snapToGrid(source.position.y + src.h / 2 - tgt.h / 2);
  const strideX = tgt.w + TILE_GAP;
  const baseX =
    side === "in"
      ? snapToGrid(source.position.x - TILE_GAP - tgt.w)
      : snapToGrid(source.position.x + src.w + TILE_GAP);
  const dir = side === "in" ? -1 : 1;
  for (let col = 0; col < 40; col++) {
    const pos = { x: snapToGrid(baseX + dir * col * strideX), y: sameY };
    if (!overlapsAny(pos, targetType, others)) return pos;
  }
  const start = Math.max(1, portIndex);
  for (let i = start; i < start + 40; i++) {
    const pos = dockPosition(source, targetType, i, side, orientation);
    if (!overlapsAny(pos, targetType, others)) return pos;
  }
  const x = dockPosition(source, targetType, 0, side, orientation).x;
  const maxY = Math.max(0, ...others.map((n) => n.position.y + nodeSize(n.type).h));
  return { x, y: snapToGrid(maxY + TILE_GAP) };
}

/** First empty slot past existing tiles along the flow. */
export function vacantSpot(
  nodes: Placed[],
  type: WorkflowNodeKindT = WorkflowNodeKind.Step,
  orientation: BoardOrientation = "horizontal",
): Point {
  if (!nodes.length) return { x: GRID, y: GRID * 5 };
  const { w, h } = nodeSize(type);
  if (flowProfile(orientation).along === "y") {
    const maxY = Math.max(...nodes.map((n) => n.position.y + nodeSize(n.type).h));
    const y = snapToGrid(maxY + TILE_GAP);
    let x = snapToGrid(Math.min(...nodes.map((n) => n.position.x)));
    for (let n = 0; n < 40; n++) {
      const pos = { x, y };
      if (!overlapsAny(pos, type, nodes)) return pos;
      x = snapToGrid(x + w + BRANCH_GAP);
    }
    const maxX = Math.max(...nodes.map((n) => n.position.x + nodeSize(n.type).w));
    return { x: snapToGrid(maxX + TILE_GAP), y };
  }
  const maxX = Math.max(...nodes.map((n) => n.position.x + nodeSize(n.type).w));
  const x = snapToGrid(maxX + TILE_GAP);
  let y = snapToGrid(Math.min(...nodes.map((n) => n.position.y)));
  for (let n = 0; n < 40; n++) {
    const pos = { x, y };
    if (!overlapsAny(pos, type, nodes)) return pos;
    y = snapToGrid(y + h + BRANCH_GAP);
  }
  const maxY = Math.max(...nodes.map((n) => n.position.y + nodeSize(n.type).h));
  return { x, y: snapToGrid(maxY + TILE_GAP) };
}
