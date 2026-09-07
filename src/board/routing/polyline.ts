/**
 * Path polylines: SVG output, the right-angle fallback for Paths ELK did not
 * lay out (remove-preview), and interpolation for CX-06 motion.
 */
import type { Point } from "../../workflow/types";
import { GRID } from "../layout/tileMetrics";

export type PolyPoint = Point;

/** Right-angle fallback for Paths that have no ELK route (remove-preview). */
export function orthogonalPolyline(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
): PolyPoint[] {
  const sx = Math.round(sourceX);
  const sy = Math.round(sourceY);
  const tx = Math.round(targetX);
  const ty = Math.round(targetY);
  if (Math.abs(sy - ty) < GRID) {
    const y = Math.round((sy + ty) / 2);
    return [
      { x: sx, y },
      { x: tx, y },
    ];
  }
  const midX = sx + Math.max(GRID, Math.round((tx - sx) / 2));
  return [
    { x: sx, y: sy },
    { x: midX, y: sy },
    { x: midX, y: ty },
    { x: tx, y: ty },
  ];
}

export function polylineToSvg(points: PolyPoint[]): string {
  if (!points.length) return "";
  const first = points[0]!;
  let d = `M ${round(first.x)} ${round(first.y)}`;
  for (let i = 1; i < points.length; i++) {
    const p = points[i]!;
    d += ` L ${round(p.x)} ${round(p.y)}`;
  }
  return d;
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}

export function pathLength(points: PolyPoint[]): number {
  let n = 0;
  for (let i = 0; i + 1 < points.length; i++) {
    n += Math.hypot(points[i + 1]!.x - points[i]!.x, points[i + 1]!.y - points[i]!.y);
  }
  return n;
}

export function pointAtLength(points: PolyPoint[], dist: number): PolyPoint {
  if (points.length === 0) return { x: 0, y: 0 };
  if (points.length === 1 || dist <= 0) return points[0]!;
  let left = dist;
  for (let i = 0; i + 1 < points.length; i++) {
    const a = points[i]!;
    const b = points[i + 1]!;
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (left <= len) {
      const t = len === 0 ? 0 : left / len;
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
    left -= len;
  }
  return points[points.length - 1]!;
}

export function resamplePolyline(points: PolyPoint[], count: number): PolyPoint[] {
  const n = Math.max(2, count);
  const total = pathLength(points);
  if (total <= 0) return Array.from({ length: n }, () => points[0] ?? { x: 0, y: 0 });
  const out: PolyPoint[] = [];
  for (let i = 0; i < n; i++) {
    out.push(pointAtLength(points, (total * i) / (n - 1)));
  }
  return out;
}

export function lerpPolylines(from: PolyPoint[], to: PolyPoint[], t: number): PolyPoint[] {
  const samples = Math.max(from.length, to.length, 8);
  const a = resamplePolyline(from, samples);
  const b = resamplePolyline(to, samples);
  return a.map((p, i) => {
    const q = b[i]!;
    return { x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t };
  });
}

export function polylineKey(points: PolyPoint[]): string {
  return points.map((p) => `${Math.round(p.x)},${Math.round(p.y)}`).join("|");
}
