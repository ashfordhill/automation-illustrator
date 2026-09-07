/**
 * Hit-testing ELK Path routes for drag-to-insert (flow coordinates).
 */
import type { Point } from "../../workflow/types";
import type { LaneLayout } from "./laneLayout";

function distToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 < 1) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

export function distToPolyline(p: Point, route: Point[]): number {
  if (route.length < 2) return Infinity;
  let best = Infinity;
  for (let i = 0; i < route.length - 1; i++) {
    best = Math.min(best, distToSegment(p, route[i]!, route[i + 1]!));
  }
  return best;
}

/** Longest interior segment — the drop band sits on this run, not the ports. */
export function longestMidSegment(route: Point[]): { a: Point; b: Point } | null {
  if (route.length < 2) return null;
  const last = route.length - 2;
  const start = route.length > 3 ? 1 : 0;
  const end = route.length > 3 ? last - 1 : last;
  let best: { a: Point; b: Point; len: number } | null = null;
  for (let i = start; i <= end; i++) {
    const a = route[i]!;
    const b = route[i + 1]!;
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (!best || len > best.len) best = { a, b, len };
  }
  return best ? { a: best.a, b: best.b } : { a: route[0]!, b: route[route.length - 1]! };
}

export function hitPathId(
  layout: LaneLayout | null,
  p: Point,
  skip: (edgeId: string) => boolean,
  threshold = 22,
): string | null {
  if (!layout) return null;
  let bestId: string | null = null;
  let best = threshold;
  for (const [id, route] of Object.entries(layout.routes)) {
    if (skip(id)) continue;
    const d = distToPolyline(p, route);
    if (d < best) {
      best = d;
      bestId = id;
    }
  }
  return bestId;
}
