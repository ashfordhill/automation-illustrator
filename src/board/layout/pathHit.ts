/**
 * Hit-testing ELK Path routes for drag-to-insert (flow coordinates).
 */
import type { Point } from "../../workflow/types";
import type { LaneLayout } from "./laneLayout";
import { alongOf, type FlowAxis } from "../flow/flowProfile";

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
  const skippedRoutes = Object.entries(layout.routes)
    .filter(([id, route]) => skip(id) && route.length >= 2)
    .map(([, route]) => route);
  let bestId: string | null = null;
  let best = threshold;
  for (const [id, route] of Object.entries(layout.routes)) {
    if (skip(id) || route.length < 2) continue;
    const d = distToUniquePolyline(p, route, skippedRoutes);
    if (d < best) {
      best = d;
      bestId = id;
    }
  }
  if (!bestId) return null;
  let skippedBest = Infinity;
  for (const route of skippedRoutes) {
    skippedBest = Math.min(skippedBest, distToPolyline(p, route));
  }
  if (skippedBest <= best) return null;
  return bestId;
}

const BUNDLE_EPS = 2;
/** ELK may offset a merged stroke by a few pixels; still one trunk for hit-testing. */
const TRUNK_ALIGN = 8;

function samePt(a: Point, b: Point, eps = BUNDLE_EPS): boolean {
  return Math.abs(a.x - b.x) <= eps && Math.abs(a.y - b.y) <= eps;
}

export function incidentPathIds(
  edges: { id: string; source: string; target: string }[],
  nodeId: string,
): Set<string> {
  const ids = new Set<string>();
  for (const e of edges) {
    if (e.source === nodeId || e.target === nodeId) ids.add(e.id);
  }
  return ids;
}

/** Shared ELK trunk (same start + same first-bend along the flow axis) or shared inbound merge. */
export function routesShareBundle(a: Point[], b: Point[], along: FlowAxis = "x"): boolean {
  if (a.length < 2 || b.length < 2) return false;
  if (samePt(a[0]!, b[0]!)) {
    const a1 = a[1]!, b1 = b[1]!;
    if (Math.abs(alongOf(a1, along) - alongOf(b1, along)) <= BUNDLE_EPS) return true;
  }
  const ae = a[a.length - 1]!;
  const be = b[b.length - 1]!;
  if (samePt(ae, be) && a.length >= 2 && b.length >= 2) {
    const a2 = a[a.length - 2]!;
    const b2 = b[b.length - 2]!;
    if (Math.abs(alongOf(a2, along) - alongOf(b2, along)) <= BUNDLE_EPS) return true;
  }
  return false;
}

function segmentSharedWith(a: Point, b: Point, routes: Point[][], eps = BUNDLE_EPS): boolean {
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  return routes.some(
    (r) =>
      distToPolyline(a, r) <= eps &&
      distToPolyline(b, r) <= eps &&
      distToPolyline(mid, r) <= eps,
  );
}

/** Distance to segments that are not on the incident bundle (unique branch / inbound run). */
export function distToUniquePolyline(
  p: Point,
  route: Point[],
  sharedWith: Point[][],
  eps = BUNDLE_EPS,
): number {
  if (sharedWith.length === 0) return distToPolyline(p, route);
  if (route.length < 2) return Infinity;
  let best = Infinity;
  let any = false;
  for (let i = 0; i < route.length - 1; i++) {
    const a = route[i]!;
    const b = route[i + 1]!;
    if (segmentSharedWith(a, b, sharedWith, eps)) continue;
    any = true;
    best = Math.min(best, distToSegment(p, a, b));
  }
  return any ? best : Infinity;
}

export function uniqueSegments(route: Point[], sharedWith: Point[][]): { a: Point; b: Point }[] {
  const out: { a: Point; b: Point }[] = [];
  if (route.length < 2) return out;
  for (let i = 0; i < route.length - 1; i++) {
    const a = route[i]!;
    const b = route[i + 1]!;
    if (segmentSharedWith(a, b, sharedWith)) continue;
    out.push({ a, b });
  }
  return out;
}

/** Segments of `route` that sit on every mate (shared trunk or inbound merge). */
export function sharedSegments(route: Point[], mates: Point[][]): { a: Point; b: Point }[] {
  const out: { a: Point; b: Point }[] = [];
  if (route.length < 2 || mates.length === 0) return out;
  for (let i = 0; i < route.length - 1; i++) {
    const a = route[i]!;
    const b = route[i + 1]!;
    if (mates.every((m) => segmentSharedWith(a, b, [m]))) out.push({ a, b });
  }
  return out;
}

export function distToSharedPolyline(p: Point, route: Point[], mates: Point[][]): number {
  const segs = sharedSegments(route, mates);
  if (segs.length === 0) return Infinity;
  let best = Infinity;
  for (const { a, b } of segs) best = Math.min(best, distToSegment(p, a, b));
  return best;
}

/** Shared trunk polyline for a merge/split bundle, or null when routes do not overlap. */
export function sharedPolyline(routes: Point[][]): Point[] | null {
  if (routes.length < 2) return null;
  const segs = sharedSegments(routes[0]!, routes.slice(1));
  if (segs.length === 0) return null;
  const pts: Point[] = [segs[0]!.a];
  for (const s of segs) {
    const last = pts[pts.length - 1]!;
    if (!samePt(last, s.a)) pts.push(s.a);
    if (!samePt(pts[pts.length - 1]!, s.b)) pts.push(s.b);
  }
  return pts.length >= 2 ? pts : null;
}

export type PathBundle = {
  role: "merge" | "split";
  hostId: string;
  edgeIds: string[];
};

/** Fan-out from one Tile, or fan-in into one Tile (two or more Paths). */
export function pathBundles(
  edges: { id: string; source: string; target: string }[],
): PathBundle[] {
  const bySource = new Map<string, string[]>();
  const byTarget = new Map<string, string[]>();
  for (const e of edges) {
    const outs = bySource.get(e.source);
    if (outs) outs.push(e.id);
    else bySource.set(e.source, [e.id]);
    const ins = byTarget.get(e.target);
    if (ins) ins.push(e.id);
    else byTarget.set(e.target, [e.id]);
  }
  const out: PathBundle[] = [];
  for (const [hostId, edgeIds] of bySource) {
    if (edgeIds.length >= 2) out.push({ role: "split", hostId, edgeIds });
  }
  for (const [hostId, edgeIds] of byTarget) {
    if (edgeIds.length >= 2) out.push({ role: "merge", hostId, edgeIds });
  }
  return out;
}

export type InsertTarget =
  | { kind: "path"; edgeId: string }
  | { kind: "bundle"; role: "merge" | "split"; hostId: string; edgeIds: string[] };

/** Skip Paths that actually touch the dragged Tile (not bundled siblings). */
export function skipInsertHover(
  _layout: LaneLayout,
  incidentIds: ReadonlySet<string>,
): (edgeId: string) => boolean {
  return (edgeId: string) => incidentIds.has(edgeId);
}

/**
 * Insert drop target: incident Paths are skipped. Bundled siblings stay
 * hittable on unique segments after the split (or before the merge). The
 * shared trunk / inbound merge does not pick a Path.
 */
export function hitInsertPathId(
  layout: LaneLayout | null,
  p: Point,
  incidentIds: ReadonlySet<string>,
  threshold = 22,
): string | null {
  return hitPathId(layout, p, (id) => incidentIds.has(id), threshold);
}

/**
 * Unique Path segments stay single-Path insert. A shared merge/split trunk is
 * a bundle drop unless the dragged Tile already sits on one of those Paths
 * (then the trunk stays a dead zone).
 */
export function hitInsertTarget(
  layout: LaneLayout | null,
  p: Point,
  edges: { id: string; source: string; target: string }[],
  incidentIds: ReadonlySet<string>,
  threshold = 22,
): InsertTarget | null {
  if (!layout) return null;
  const bundles = pathBundles(edges);
  const skippedRoutes = Object.entries(layout.routes)
    .filter(([id, route]) => incidentIds.has(id) && route.length >= 2)
    .map(([, route]) => route);

  const mateRoutes = (edgeId: string): Point[][] => {
    const mates: Point[][] = [];
    for (const b of bundles) {
      if (!b.edgeIds.includes(edgeId)) continue;
      for (const id of b.edgeIds) {
        if (id === edgeId) continue;
        const route = layout.routes[id];
        if (route && route.length >= 2) mates.push(route);
      }
    }
    return mates;
  };

  let pathId: string | null = null;
  let pathD = threshold;
  for (const [id, route] of Object.entries(layout.routes)) {
    if (incidentIds.has(id) || route.length < 2) continue;
    const d = distToUniquePolyline(p, route, [...skippedRoutes, ...mateRoutes(id)], TRUNK_ALIGN);
    if (d < pathD) {
      pathD = d;
      pathId = id;
    }
  }

  let skipD = Infinity;
  for (const route of skippedRoutes) {
    skipD = Math.min(skipD, distToPolyline(p, route));
  }

  let bundleBest: PathBundle | null = null;
  let bundleD = threshold;
  for (const b of bundles) {
    if (b.edgeIds.some((id) => incidentIds.has(id))) continue;
    const routes = b.edgeIds
      .map((id) => layout.routes[id])
      .filter((r): r is Point[] => Boolean(r && r.length >= 2));
    if (routes.length < 2) continue;
    const d = distToBundleTrunk(p, routes);
    if (d < bundleD) {
      bundleD = d;
      bundleBest = b;
    }
  }

  const hasPath = pathId !== null;
  const hasBundle = bundleBest !== null;
  if (!hasPath && !hasBundle) return null;
  if (skipD <= pathD && skipD <= bundleD) return null;
  if (hasBundle && bundleD <= pathD) {
    return {
      kind: "bundle",
      role: bundleBest!.role,
      hostId: bundleBest!.hostId,
      edgeIds: bundleBest!.edgeIds,
    };
  }
  if (hasPath) return { kind: "path", edgeId: pathId! };
  return null;
}

const TRUNK_OVERLAP = 8;

function routesShareStart(routes: Point[][]): boolean {
  const origin = routes[0]?.[0];
  if (!origin) return false;
  return routes.every((r) => r[0] && samePt(r[0], origin, TRUNK_ALIGN));
}

function routesShareEnd(routes: Point[][]): boolean {
  const last = (r: Point[]) => r[r.length - 1];
  const end = routes[0] ? last(routes[0]) : undefined;
  if (!end) return false;
  return routes.every((r) => {
    const p = last(r);
    return p && samePt(p, end, TRUNK_ALIGN);
  });
}

/** Vertices of `primary` that stay within `eps` of every mate, walking from a shared port. */
function commonRun(routes: Point[][], fromStart: boolean, eps: number): Point[] | null {
  const primary = routes[0];
  if (!primary || primary.length < 2) return null;
  const mates = routes.slice(1);
  const pts: Point[] = [];
  const n = primary.length;
  for (let k = 0; k < n; k++) {
    const p = primary[fromStart ? k : n - 1 - k]!;
    if (!mates.every((m) => distToPolyline(p, m) <= eps)) break;
    pts.push(p);
  }
  if (pts.length < 2) return null;
  return fromStart ? pts : pts.reverse();
}

/**
 * Shared merge/split run: exact overlapping segments, else the common prefix
 * (split) or suffix (merge) when ELK’s strokes sit a few pixels apart.
 */
export function bundleTrunkPolyline(routes: Point[][]): Point[] | null {
  const shared = sharedPolyline(routes);
  if (shared) return shared;
  if (routesShareStart(routes)) {
    const trunk = commonRun(routes, true, TRUNK_ALIGN);
    if (trunk) return trunk;
  }
  if (routesShareEnd(routes)) {
    const trunk = commonRun(routes, false, TRUNK_ALIGN);
    if (trunk) return trunk;
  }
  return null;
}

/** Shared polyline, or two bundle routes that occupy the same pixels. */
export function distToBundleTrunk(p: Point, routes: Point[][]): number {
  const trunk = bundleTrunkPolyline(routes);
  if (trunk) {
    const d = distToPolyline(p, trunk);
    if (Number.isFinite(d)) return d;
  }
  const dists = routes.map((r) => distToPolyline(p, r)).sort((a, b) => a - b);
  if (dists.length >= 2 && dists[0]! <= TRUNK_OVERLAP && dists[1]! <= TRUNK_OVERLAP) {
    return dists[0]!;
  }
  return Infinity;
}
