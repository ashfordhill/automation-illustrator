/**
 * Path polylines: SVG output, the right-angle fallback for Paths ELK did not
 * lay out (remove-preview), and interpolation for CX-06 motion.
 */
import type { Point } from "../../workflow/types";
import { GRID } from "../layout/tileMetrics";
import type { FlowAxis } from "../flow/flowProfile";

export type PolyPoint = Point;

/** Right-angle fallback for Paths that have no ELK route (remove-preview). */
export function orthogonalPolyline(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  along: FlowAxis = "x",
): PolyPoint[] {
  const sx = Math.round(sourceX);
  const sy = Math.round(sourceY);
  const tx = Math.round(targetX);
  const ty = Math.round(targetY);
  if (along === "y") {
    if (Math.abs(sx - tx) < GRID) {
      const x = Math.round((sx + tx) / 2);
      return [
        { x, y: sy },
        { x, y: ty },
      ];
    }
    const midY = sy + Math.max(GRID, Math.round((ty - sy) / 2));
    return [
      { x: sx, y: sy },
      { x: sx, y: midY },
      { x: tx, y: midY },
      { x: tx, y: ty },
    ];
  }
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

/** Choice (dotted) Path dash pattern (PC-01). */
export const DOTTED_DASH = 8;
export const DOTTED_GAP = 7;
export const DOTTED_PERIOD = DOTTED_DASH + DOTTED_GAP;

/** Restitch preview dash (CX-06). */
export const RESTITCH_DASH = 10;
export const RESTITCH_GAP = 6;
export const RESTITCH_PERIOD = RESTITCH_DASH + RESTITCH_GAP;

export type DrawSegment = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  dashOffset: number;
};

function mod(n: number, period: number): number {
  return ((n % period) + period) % period;
}

/**
 * Split an orthogonal polyline into axis-aligned segments whose dash phase is
 * locked to world X (horizontal) or Y (vertical). Shared trunks then keep the
 * same gaps instead of stacking out of phase into a fake solid stroke.
 */
export function polylineDrawSegments(points: PolyPoint[], period: number): DrawSegment[] {
  const out: DrawSegment[] = [];
  for (let i = 0; i + 1 < points.length; i++) {
    const a = points[i]!;
    const b = points[i + 1]!;
    if (Math.hypot(b.x - a.x, b.y - a.y) < 0.5) continue;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    if (Math.abs(dx) >= Math.abs(dy)) {
      const left = a.x <= b.x ? a : b;
      const right = a.x <= b.x ? b : a;
      out.push({
        x1: left.x,
        y1: left.y,
        x2: right.x,
        y2: right.y,
        dashOffset: -mod(left.x, period),
      });
    } else {
      const top = a.y <= b.y ? a : b;
      const bottom = a.y <= b.y ? b : a;
      out.push({
        x1: top.x,
        y1: top.y,
        x2: bottom.x,
        y2: bottom.y,
        dashOffset: -mod(top.y, period),
      });
    }
  }
  return out;
}

/** SVG dash phase at `distance` along a segment (`d - stroke-dashoffset`). */
export function svgDashPhase(distance: number, dashOffset: number, period: number): number {
  return mod(distance - dashOffset, period);
}
