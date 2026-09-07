/**
 * Map an ELK result back onto LaneLayout (Improvement 01).
 * The root is flat, so child x/y, edge sections, and label x/y are already
 * absolute in the root frame; everything is rounded to integer pixels.
 */
import type { ElkNode } from "elkjs/lib/elk-api";
import type { Point } from "../../workflow/types";
import type { LaneLayout, Rect } from "./laneLayout";

function r(n: number | undefined): number {
  return Math.round(n ?? 0);
}

export function emptyLayout(key: string): LaneLayout {
  return { key, positions: {}, routes: {}, labels: {}, bounds: { x: 0, y: 0, w: 0, h: 0 } };
}

/** Throws when ELK returned something other than one section per edge. */
export function toLaneLayout(key: string, laidOut: ElkNode): LaneLayout {
  const positions: Record<string, Point> = {};
  const routes: Record<string, Point[]> = {};
  const labels: Record<string, Rect> = {};

  for (const child of laidOut.children ?? []) {
    positions[child.id] = { x: r(child.x), y: r(child.y) };
  }

  for (const edge of laidOut.edges ?? []) {
    const sections = edge.sections ?? [];
    if (sections.length !== 1) {
      throw new Error(`ELK returned ${sections.length} sections for Path ${edge.id}; expected 1.`);
    }
    const s = sections[0]!;
    const points: Point[] = [
      { x: r(s.startPoint.x), y: r(s.startPoint.y) },
      ...(s.bendPoints ?? []).map((p) => ({ x: r(p.x), y: r(p.y) })),
      { x: r(s.endPoint.x), y: r(s.endPoint.y) },
    ];
    routes[edge.id] = dedupe(points);
    const label = edge.labels?.[0];
    if (label && label.width && label.height) {
      labels[edge.id] = {
        x: r(label.x),
        y: r(label.y),
        w: r(label.width),
        h: r(label.height),
      };
    }
  }

  return {
    key,
    positions,
    routes,
    labels,
    bounds: { x: r(laidOut.x), y: r(laidOut.y), w: r(laidOut.width), h: r(laidOut.height) },
  };
}

function dedupe(points: Point[]): Point[] {
  const out: Point[] = [];
  for (const p of points) {
    const last = out[out.length - 1];
    if (last && last.x === p.x && last.y === p.y) continue;
    out.push(p);
  }
  return out.length >= 2 ? out : points;
}
