/**
 * Deterministic condition placement after routing (CX-04).
 * Prefers long, clear, horizontal segments; stable tie-breakers; never guesses.
 */
import type { LabelBox } from "../layout/labelBox";
import {
  alongSegment,
  pointRectDistance,
  rectsOverlap,
  segmentsOf,
  type NodeRect,
  type PolyPoint,
  type Segment,
} from "./polyline";

export type LabelPlacement = { x: number; y: number; w: number; h: number };

const T_CANDIDATES = [0.5, 0.35, 0.65, 0.2, 0.8, 0.1, 0.9];

function chipRect(at: PolyPoint, box: LabelBox, dx = 0, dy = 0): LabelPlacement {
  return {
    x: at.x - box.w / 2 + dx,
    y: at.y - box.h / 2 + dy,
    w: box.w,
    h: box.h,
  };
}

function overlapPenalty(
  rect: LabelPlacement,
  obstacles: Array<{ x: number; y: number; w: number; h: number }>,
  pad: number,
): number {
  let n = 0;
  for (const o of obstacles) {
    if (rectsOverlap(rect, o, pad)) n += 1;
  }
  return n;
}

function clearance(at: PolyPoint, nodes: NodeRect[]): number {
  if (!nodes.length) return 80;
  return Math.min(...nodes.map((r) => pointRectDistance(at, r)));
}

function scoreCandidate(
  seg: Segment,
  t: number,
  box: LabelBox,
  nodes: NodeRect[],
  occupied: LabelPlacement[],
  offset: { dx: number; dy: number },
): { score: number; rect: LabelPlacement; at: PolyPoint } {
  const at = alongSegment(seg, t);
  const rect = chipRect(at, box, offset.dx, offset.dy);
  const hitsNodes = overlapPenalty(rect, nodes, 8);
  const hitsLabels = overlapPenalty(rect, occupied, 28);
  const score =
    seg.length +
    (seg.horizontal ? 90 : 0) +
    clearance(at, nodes) * 2 -
    hitsNodes * 8000 -
    hitsLabels * 4000 -
    Math.abs(t - 0.5) * 20;
  return { score, rect, at };
}

function offsetsFor(seg: Segment, box: LabelBox, at: PolyPoint, nodes: NodeRect[]): Array<{ dx: number; dy: number }> {
  const side = (seg.horizontal ? box.h : box.w) / 2 + 10;
  const out: Array<{ dx: number; dy: number }> = [{ dx: 0, dy: 0 }];
  if (seg.horizontal) {
    out.push({ dx: 0, dy: -side }, { dx: 0, dy: side }, { dx: 0, dy: -side * 2 }, { dx: 0, dy: side * 2 });
  } else {
    out.push({ dx: side, dy: 0 }, { dx: -side, dy: 0 }, { dx: side * 2, dy: 0 }, { dx: -side * 2, dy: 0 });
  }
  for (const n of nodes) {
    if (seg.horizontal) {
      out.push({ dx: 0, dy: n.y - at.y - box.h / 2 - 8 });
      out.push({ dx: 0, dy: n.y + n.h - at.y + box.h / 2 + 8 });
    } else {
      out.push({ dx: n.x - at.x - box.w / 2 - 8, dy: 0 });
      out.push({ dx: n.x + n.w - at.x + box.w / 2 + 8, dy: 0 });
    }
  }
  return out;
}

function bestOnPath(
  points: PolyPoint[],
  box: LabelBox,
  nodes: NodeRect[],
  occupied: LabelPlacement[],
): LabelPlacement | null {
  if (box.w <= 0) return null;
  const segs = segmentsOf(points);
  if (!segs.length) {
    const mid = points[Math.floor(points.length / 2)] ?? { x: 0, y: 0 };
    return chipRect(mid, box);
  }
  let best: ReturnType<typeof scoreCandidate> | null = null;
  for (const seg of segs) {
    for (const t of T_CANDIDATES) {
      for (const offset of offsetsFor(seg, box, alongSegment(seg, t), nodes)) {
        const cand = scoreCandidate(seg, t, box, nodes, occupied, offset);
        if (
          !best ||
          cand.score > best.score + 0.01 ||
          (Math.abs(cand.score - best.score) <= 0.01 &&
            (cand.rect.y < best.rect.y || (cand.rect.y === best.rect.y && cand.rect.x < best.rect.x)))
        ) {
          best = cand;
        }
      }
    }
  }
  return best?.rect ?? null;
}

/**
 * Place every labeled Path. `edgeIds` order is the stable paint/tie order;
 * callers should pass sorted ids so previously placed labels are well-defined.
 */
export function placeAllConditions(
  paths: Record<string, PolyPoint[]>,
  boxes: Record<string, LabelBox>,
  nodes: NodeRect[],
  edgeIds: string[],
): Record<string, LabelPlacement> {
  const occupied: LabelPlacement[] = [];
  const out: Record<string, LabelPlacement> = {};
  for (const id of edgeIds) {
    const box = boxes[id];
    const path = paths[id];
    if (!box || box.w <= 0 || !path?.length) continue;
    const placed = bestOnPath(path, box, nodes, occupied);
    if (!placed) continue;
    out[id] = placed;
    occupied.push(placed);
  }
  return out;
}

export function placementCenter(p: LabelPlacement): PolyPoint {
  return { x: p.x + p.w / 2, y: p.y + p.h / 2 };
}
