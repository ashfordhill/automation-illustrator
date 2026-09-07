/**
 * Lane-derived compact layout (CX-05). Canonical Node positions stay on the
 * document; this expands gaps for condition chips and contracts back when they
 * shrink. Never writes the document or undo history.
 */
import type { EdgeDto, NodeDto, Point } from "../../workflow/types";
import { measureLabelBox, type LabelBox } from "./labelBox";
import { GRID, TILE_GAP, nodeSize } from "./tileMetrics";

export type LanePositions = Record<string, Point>;

function needForBox(box: LabelBox): number {
  if (box.w <= 0) return TILE_GAP;
  return Math.max(TILE_GAP, box.w + GRID);
}

/**
 * Display positions for one rendered lane. Starts from saved canonical hints
 * every call so shortening a condition pulls tiles back (no residual whitespace).
 */
export function layoutLane(
  nodes: NodeDto[],
  edges: EdgeDto[],
  labelBoxes: Record<string, LabelBox> = {},
): LanePositions {
  const positions: LanePositions = {};
  for (const n of nodes) positions[n.id] = { x: n.position.x, y: n.position.y };

  const labeled = edges
    .filter((e) => e.label.trim())
    .slice()
    .sort((a, b) => {
      const xa = positions[a.source]?.x ?? 0;
      const xb = positions[b.source]?.x ?? 0;
      if (xa !== xb) return xa - xb;
      return a.id.localeCompare(b.id);
    });

  for (const e of labeled) {
    const src = nodes.find((n) => n.id === e.source);
    const tgt = nodes.find((n) => n.id === e.target);
    if (!src || !tgt) continue;
    const srcPos = positions[src.id];
    const tgtPos = positions[tgt.id];
    if (!srcPos || !tgtPos) continue;
    const box = labelBoxes[e.id] ?? measureLabelBox(e.label);
    const need = needForBox(box);
    const gap = tgtPos.x - (srcPos.x + nodeSize(src.type).w);
    if (gap >= need) continue;
    const delta = need - gap;
    const threshold = tgtPos.x;
    for (const n of nodes) {
      if (n.id === src.id) continue;
      const p = positions[n.id];
      if (!p || p.x < threshold) continue;
      positions[n.id] = { x: p.x + delta, y: p.y };
    }
  }

  return positions;
}

export function positionsEqual(a: LanePositions, b: LanePositions): boolean {
  const ids = Object.keys(a);
  if (ids.length !== Object.keys(b).length) return false;
  for (const id of ids) {
    const pa = a[id];
    const pb = b[id];
    if (!pa || !pb) return false;
    if (pa.x !== pb.x || pa.y !== pb.y) return false;
  }
  return true;
}
