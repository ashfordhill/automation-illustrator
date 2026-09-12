/**
 * Display-only insert-on-Path preview geometry (NG-02 / CX-05).
 * Does not mutate the document; ELK is not consulted on pointer move.
 */
import type { Point } from "../../workflow/types";
import type { LaneLayout, Rect } from "./laneLayout";
import { bundleTrunkPolyline, longestMidSegment } from "./pathHit";
import { FIELD_H, FIELD_W, STEP_H, STEP_W, TILE_GAP } from "./tileMetrics";
import { flowProfile, layoutKeyOrientation, type FlowAxis, type FlowProfile } from "../flow/flowProfile";

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

/** Keep stubs orthogonal; jog along the flow axis first. */
export function ensureOrthogonal(points: Point[], along: FlowAxis = "x"): Point[] {
  const src = dedupe(points);
  if (src.length < 2) return src;
  const out: Point[] = [src[0]!];
  for (let i = 1; i < src.length; i++) {
    const a = out[out.length - 1]!;
    const b = src[i]!;
    if (a.x === b.x || a.y === b.y) {
      out.push(b);
    } else {
      if (along === "y") out.push({ x: a.x, y: b.y });
      else out.push({ x: b.x, y: a.y });
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
function inferNodeRects(layout: LaneLayout, profile: FlowProfile): Record<string, Rect> {
  const rects: Record<string, Rect> = {};
  for (const [id, pos] of Object.entries(layout.positions)) {
    let w: number | undefined;
    let h: number | undefined;
    for (const route of Object.values(layout.routes)) {
      if (route.length < 2) continue;
      const start = route[0]!;
      const end = route[route.length - 1]!;
      if (profile.along === "x") {
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
      } else {
        const outH = start.y - pos.y;
        const outW = 2 * (start.x - pos.x);
        if (plausibleSize(outW, outH) && start.x > pos.x) {
          if (h === undefined || outH < h) {
            w = outW;
            h = outH;
          }
        }
        if (Math.abs(end.y - pos.y) <= 1 && end.x > pos.x) {
          const inW = 2 * (end.x - pos.x);
          if (inW >= 48 && inW <= 640) w = w ?? inW;
        }
      }
    }
    if (w === undefined && h !== undefined) {
      if (Math.abs(h - STEP_H) <= 1) w = STEP_W;
      else if (Math.abs(h - FIELD_H) <= 1) w = FIELD_W;
      else w = STEP_W;
    }
    if (h === undefined && w !== undefined) {
      if (Math.abs(w - STEP_W) <= 1) h = STEP_H;
      else if (Math.abs(w - FIELD_W) <= 1) h = FIELD_H;
      else h = STEP_H;
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
  profile: FlowProfile,
  which: "out" | "in",
): string | null {
  let best: string | null = null;
  let bestD = Infinity;
  for (const [id, r] of Object.entries(rects)) {
    const p = which === "out" ? profile.portOut(r.w, r.h) : profile.portIn(r.w, r.h);
    const abs = { x: r.x + p.x, y: r.y + p.y };
    const d = Math.hypot(abs.x - port.x, abs.y - port.y);
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

export function insertPreviewOnRoute(
  layout: LaneLayout,
  route: Point[],
  tile: { w: number; h: number },
  tileGap: number = TILE_GAP,
): InsertPreviewGeom | null {
  if (route.length < 2) return null;
  const profile = flowProfile(layoutKeyOrientation(layout.key));
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
  const leftStub = ensureOrthogonal([...route.slice(0, i + 1), entry], profile.along);
  const rightStub = ensureOrthogonal([exit, ...route.slice(i + 1)], profile.along);
  if (leftStub.length < 2 || rightStub.length < 2) return null;

  const rects = inferNodeRects(layout, profile);
  const start = route[0]!;
  const end = route[route.length - 1]!;
  const sId = nearestPort(rects, start, profile, "out");
  const uId = nearestPort(rects, end, profile, "in");
  const mag = Math.round((profile.along === "y" ? tile.h : tile.w) / 2 + tileGap / 2);
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
  } else if (sId && rects[sId]) {
    shiftS =
      profile.along === "y"
        ? maxShift(sId, { x: 0, y: -mag }, rects)
        : maxShift(sId, { x: -mag, y: 0 }, rects);
  } else if (uId && rects[uId]) {
    shiftU =
      profile.along === "y"
        ? maxShift(uId, { x: 0, y: mag }, rects)
        : maxShift(uId, { x: mag, y: 0 }, rects);
  }

  return { gap, leftStub, rightStub, shiftS, shiftU };
}

export function insertPreviewGeom(
  layout: LaneLayout,
  edgeId: string,
  tile: { w: number; h: number },
  tileGap: number = TILE_GAP,
): InsertPreviewGeom | null {
  const route = layout.routes[edgeId];
  if (!route || route.length < 2) return null;
  return insertPreviewOnRoute(layout, route, tile, tileGap);
}

/** Landing gap on the shared merge/split run. Unique branches stay attached. */
export function bundleInsertPreviewGeom(
  layout: LaneLayout,
  edgeIds: string[],
  tile: { w: number; h: number },
  tileGap: number = TILE_GAP,
): InsertPreviewGeom | null {
  const routes = edgeIds
    .map((id) => layout.routes[id])
    .filter((r): r is Point[] => Boolean(r && r.length >= 2));
  const shared = bundleTrunkPolyline(routes);
  if (!shared) return null;
  return insertPreviewOnRoute(layout, shared, tile, tileGap);
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
