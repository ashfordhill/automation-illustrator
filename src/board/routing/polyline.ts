/**
 * Path polylines for placement and restitch stretch (CX-04, CX-06).
 */
import { getSmoothStepPath } from "@xyflow/react";
import type { Point } from "../../workflow/types";
import { GRID } from "../layout/tileMetrics";

export type PolyPoint = Point;

export type NodeRect = { id: string; x: number; y: number; w: number; h: number };

export type Segment = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  length: number;
  horizontal: boolean;
};

/** Right-angle fallback used when Smart Edge has not routed yet. */
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

export function nativeStepPolyline(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  sourcePosition: string,
  targetPosition: string,
): { d: string; points: PolyPoint[] } {
  const [d] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition: sourcePosition as never,
    targetPosition: targetPosition as never,
    borderRadius: 0,
  });
  return { d, points: parseSvgPath(d) };
}

/** Parse the M/L/H/V (and simple Q/C endpoint) commands Smart Edge / StepEdge emit. */
export function parseSvgPath(d: string): PolyPoint[] {
  const points: PolyPoint[] = [];
  const re = /([MLHVCSQTAZmlhvcsqtaz])([^MLHVCSQTAZmlhvcsqtaz]*)/g;
  let cx = 0;
  let cy = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(d))) {
    const cmd = match[1]!;
    const nums = (match[2] ?? "")
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number)
      .filter((n) => Number.isFinite(n));
    const abs = cmd === cmd.toUpperCase();
    const op = cmd.toUpperCase();
    if (op === "M" || op === "L") {
      for (let i = 0; i + 1 < nums.length; i += 2) {
        cx = abs ? nums[i]! : cx + nums[i]!;
        cy = abs ? nums[i + 1]! : cy + nums[i + 1]!;
        points.push({ x: cx, y: cy });
      }
    } else if (op === "H") {
      for (const n of nums) {
        cx = abs ? n : cx + n;
        points.push({ x: cx, y: cy });
      }
    } else if (op === "V") {
      for (const n of nums) {
        cy = abs ? n : cy + n;
        points.push({ x: cx, y: cy });
      }
    } else if (op === "C" && nums.length >= 6) {
      cx = abs ? nums[nums.length - 2]! : cx + nums[nums.length - 2]!;
      cy = abs ? nums[nums.length - 1]! : cy + nums[nums.length - 1]!;
      points.push({ x: cx, y: cy });
    } else if (op === "Q" && nums.length >= 4) {
      cx = abs ? nums[nums.length - 2]! : cx + nums[nums.length - 2]!;
      cy = abs ? nums[nums.length - 1]! : cy + nums[nums.length - 1]!;
      points.push({ x: cx, y: cy });
    }
  }
  return dedupe(points);
}

export function pointsFromSmart(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  waypoints: number[][],
): PolyPoint[] {
  const inner = waypoints
    .map((pair) => ({ x: pair[0] ?? 0, y: pair[1] ?? 0 }))
    .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
  return dedupe([{ x: sourceX, y: sourceY }, ...inner, { x: targetX, y: targetY }]);
}

function dedupe(points: PolyPoint[]): PolyPoint[] {
  const out: PolyPoint[] = [];
  for (const p of points) {
    const last = out[out.length - 1];
    if (last && Math.abs(last.x - p.x) < 0.5 && Math.abs(last.y - p.y) < 0.5) continue;
    out.push(p);
  }
  return out.length ? out : points;
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

export function segmentsOf(points: PolyPoint[]): Segment[] {
  const segs: Segment[] = [];
  for (let i = 0; i + 1 < points.length; i++) {
    const a = points[i]!;
    const b = points[i + 1]!;
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    if (length < 1) continue;
    segs.push({
      x1: a.x,
      y1: a.y,
      x2: b.x,
      y2: b.y,
      length,
      horizontal: Math.abs(b.y - a.y) <= Math.abs(b.x - a.x),
    });
  }
  return segs;
}

export function alongSegment(seg: Segment, t: number): PolyPoint {
  return {
    x: seg.x1 + (seg.x2 - seg.x1) * t,
    y: seg.y1 + (seg.y2 - seg.y1) * t,
  };
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

export function nearestOnPolyline(points: PolyPoint[], x: number, y: number): PolyPoint {
  const segs = segmentsOf(points);
  if (!segs.length) return points[0] ?? { x, y };
  let best = alongSegment(segs[0]!, 0.5);
  let bestD = Infinity;
  for (const seg of segs) {
    for (const t of [0.2, 0.35, 0.5, 0.65, 0.8]) {
      const p = alongSegment(seg, t);
      const d = (p.x - x) ** 2 + (p.y - y) ** 2;
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
  }
  return best;
}

export function rectsOverlap(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
  pad = 0,
): boolean {
  return !(
    a.x + a.w + pad <= b.x ||
    b.x + b.w + pad <= a.x ||
    a.y + a.h + pad <= b.y ||
    b.y + b.h + pad <= a.y
  );
}

export function pointRectDistance(
  p: PolyPoint,
  r: { x: number; y: number; w: number; h: number },
): number {
  const cx = Math.min(Math.max(p.x, r.x), r.x + r.w);
  const cy = Math.min(Math.max(p.y, r.y), r.y + r.h);
  return Math.hypot(p.x - cx, p.y - cy);
}

export function polylineKey(points: PolyPoint[]): string {
  return points.map((p) => `${Math.round(p.x)},${Math.round(p.y)}`).join("|");
}
