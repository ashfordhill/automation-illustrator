/**
 * Display-only insert-on-Path preview geometry (NG-02 / CX-05).
 * Does not mutate the document; ELK is not consulted on pointer move.
 */
import type { Point } from "../../workflow/types";
import type { LaneLayout, Rect } from "./laneLayout";
import { longestMidSegment } from "./pathHit";
import { FIELD_H, FIELD_W, STEP_H, STEP_W, TILE_GAP } from "./tileMetrics";

export type InsertPreviewGeom = {
  gap: Rect;
  leftStub: Point[];
  rightStub: Point[];
  shiftS: Point;
  shiftU: Point;
};

function roundPt(p: Point): Point {
  return { x: Math.round(p.x), y: Math.round(p.y) };
}

function roundRect(r: Rect): Rect {
  return {
    x: Math.round(r.x),
    y: Math.round(r.y),
    w: Math.round(r.w),
    h: Math.round(r.h),
  };
}

function boxesOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

function dedupe(points: Point[]): Point[] {
  const out: Point[] = [];
  for (const p of points) {
    const r = roundPt(p);
    const last = out[out.length - 1];
    if (!last || last.x !== r.x || last.y !== r.y) out.push(r);
  }
  return out;
}

/** Keep stubs orthogonal; jog horizontally first (elk.direction RIGHT). */
export function ensureOrthogonal(points: Point[]): Point[] {
  const src = dedupe(points);
  if (src.length < 2) return src;
  const out: Point[] = [src[0]!];
  for (let i = 1; i < src.length; i++) {
    const a = out[out.length - 1]!;
    const b = src[i]!;
    if (a.x === b.x || a.y === b.y) {
      out.push(b);
    } else {
      out.push({ x: b.x, y: a.y });
      out.push(b);
    }
  }
  return dedupe(out);
}

function segmentIndex(route: Point[], a: Point, b: Point): number {
  for (let i = 0; i < route.length - 1; i++) {
    const p = route[i]!;
    const q = route[i + 1]!;
    if (p === a && q === b) return i;
    if (p.x === a.x && p.y === a.y && q.x === b.x && q.y === b.y) return i;
  }
  return 0;
}

function plausibleSize(w: number, h: number): boolean {
  return w >= 48 && w <= 640 && h >= 40 && h <= 640;
}

/** Infer displayed tile boxes from ELK positions and Path ports. */
function inferNodeRects(layout: LaneLayout): Record<string, Rect> {
  const rects: Record<string, Rect> = {};
  for (const [id, pos] of Object.entries(layout.positions)) {
    let w: number | undefined;
    let h: number | undefined;
    for (const route of Object.values(layout.routes)) {
      if (route.length < 2) continue;
      const start = route[0]!;
      const end = route[route.length - 1]!;
      const outW = start.x - pos.x;
      const outH = 2 * (start.y - pos.y);
      if (plausibleSize(outW, outH) && start.y > pos.y) {
        if (w === undefined || outW < w) {
          w = outW;
          h = outH;
        }
      }
      if (Math.abs(end.x - pos.x) <= 1 && end.y > pos.y) {
        const inH = 2 * (end.y - pos.y);
        if (inH >= 40 && inH <= 640) h = h ?? inH;
      }
    }
    if (w === undefined && h !== undefined) {
      if (Math.abs(h - STEP_H) <= 1) w = STEP_W;
      else if (Math.abs(h - FIELD_H) <= 1) w = FIELD_W;
      else w = STEP_W;
    }
    rects[id] = {
      x: pos.x,
      y: pos.y,
      w: Math.round(w ?? STEP_W),
      h: Math.round(h ?? STEP_H),
    };
  }
  return rects;
}

function nearestPort(
  rects: Record<string, Rect>,
  port: Point,
  side: "east" | "west",
): string | null {
  let best: string | null = null;
  let bestD = Infinity;
  for (const [id, r] of Object.entries(rects)) {
    const p = side === "east" ? { x: r.x + r.w, y: r.y + r.h / 2 } : { x: r.x, y: r.y + r.h / 2 };
    const d = Math.hypot(p.x - port.x, p.y - port.y);
    if (d < bestD) {
      bestD = d;
      best = id;
    }
  }
  return bestD <= 2 ? best : null;
}

function maxShift(id: string, desired: Point, rects: Record<string, Rect>): Point {
  if (desired.x === 0 && desired.y === 0) return desired;
  const r = rects[id];
  if (!r) return { x: 0, y: 0 };
  const others = Object.entries(rects)
    .filter(([k]) => k !== id)
    .map(([, box]) => box);
  const fits = (dx: number, dy: number) => {
    const moved = { x: r.x + dx, y: r.y + dy, w: r.w, h: r.h };
    return !others.some((o) => boxesOverlap(moved, o));
  };
  if (fits(desired.x, desired.y)) return desired;
  if (desired.y === 0) {
    const sign = Math.sign(desired.x);
    for (let a = Math.abs(desired.x) - 1; a > 0; a -= 1) {
      if (fits(sign * a, 0)) return { x: sign * a, y: 0 };
    }
    return { x: 0, y: 0 };
  }
  const sign = Math.sign(desired.y);
  for (let a = Math.abs(desired.y) - 1; a > 0; a -= 1) {
    if (fits(0, sign * a)) return { x: 0, y: sign * a };
  }
  return { x: 0, y: 0 };
}

function gapFaces(
  gap: Rect,
  a: Point,
  b: Point,
): { entry: Point; exit: Point } {
  const horiz = Math.abs(b.x - a.x) >= Math.abs(b.y - a.y);
  if (horiz) {
    const y = a.y;
    const left = { x: gap.x, y };
    const right = { x: gap.x + gap.w, y };
    return b.x >= a.x ? { entry: left, exit: right } : { entry: right, exit: left };
  }
  const x = a.x;
  const top = { x, y: gap.y };
  const bottom = { x, y: gap.y + gap.h };
  return b.y >= a.y ? { entry: top, exit: bottom } : { entry: bottom, exit: top };
}

export function insertPreviewGeom(
  layout: LaneLayout,
  edgeId: string,
  tile: { w: number; h: number },
  tileGap: number = TILE_GAP,
): InsertPreviewGeom | null {
  const route = layout.routes[edgeId];
  if (!route || route.length < 2) return null;
  const mid = longestMidSegment(route);
  if (!mid) return null;
  const i = segmentIndex(route, mid.a, mid.b);
  const a = route[i]!;
  const b = route[i + 1]!;
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const gap = roundRect({
    x: mx - tile.w / 2,
    y: my - tile.h / 2,
    w: tile.w,
    h: tile.h,
  });
  const { entry, exit } = gapFaces(gap, a, b);
  const leftStub = ensureOrthogonal([...route.slice(0, i + 1), entry]);
  const rightStub = ensureOrthogonal([exit, ...route.slice(i + 1)]);
  if (leftStub.length < 2 || rightStub.length < 2) return null;

  const rects = inferNodeRects(layout);
  const start = route[0]!;
  const end = route[route.length - 1]!;
  const sId = nearestPort(rects, start, "east");
  const uId = nearestPort(rects, end, "west");
  const mag = Math.round(tile.w / 2 + tileGap / 2);
  let shiftS: Point = { x: 0, y: 0 };
  let shiftU: Point = { x: 0, y: 0 };
  if (sId && uId && rects[sId] && rects[uId]) {
    const sRect = rects[sId]!;
    const uRect = rects[uId]!;
    const horiz = Math.abs(b.x - a.x) >= Math.abs(b.y - a.y);
    if (horiz) {
      const sLeft = sRect.x + sRect.w / 2 <= uRect.x + uRect.w / 2;
      shiftS = maxShift(sId, { x: sLeft ? -mag : mag, y: 0 }, rects);
      shiftU = maxShift(uId, { x: sLeft ? mag : -mag, y: 0 }, rects);
    } else {
      const sAbove = sRect.y + sRect.h / 2 <= uRect.y + uRect.h / 2;
      shiftS = maxShift(sId, { x: 0, y: sAbove ? -mag : mag }, rects);
      shiftU = maxShift(uId, { x: 0, y: sAbove ? mag : -mag }, rects);
    }
  }

  return { gap, leftStub, rightStub, shiftS, shiftU };
}

/** Add S/U visual shift to stub endpoints so handles stay glued to the Path. */
export function stubsWithNeighborShift(
  geom: InsertPreviewGeom,
  ease: boolean,
): { left: Point[]; right: Point[] } {
  if (!ease) return { left: geom.leftStub, right: geom.rightStub };
  const left = geom.leftStub.map((p) => ({ ...p }));
  const right = geom.rightStub.map((p) => ({ ...p }));
  const first = left[0];
  if (first) left[0] = { x: first.x + geom.shiftS.x, y: first.y + geom.shiftS.y };
  const last = right[right.length - 1];
  if (last) right[right.length - 1] = { x: last.x + geom.shiftU.x, y: last.y + geom.shiftU.y };
  return { left: ensureOrthogonal(left), right: ensureOrthogonal(right) };
}
