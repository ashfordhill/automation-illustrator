/**
 * Interpolate modest layout changes (CX-06): positions, Path routes, and chip
 * rects move together so Path endpoints stay glued to their tiles. Large jumps
 * (New / Demo / Import), the first layout, and reduced motion snap. Not a
 * history entry. Ids new to the target appear in place; removed ids drop.
 */
import { useEffect, useRef, useState } from "react";
import type { Point } from "../../workflow/types";
import { lerpPolylines } from "../routing/polyline";
import type { LaneLayout, Rect } from "./laneLayout";

const SNAP_PX = 1;
export const MODEST_MAX_PX = 280;
const DURATION_MS = 200;

function maxDelta(from: LaneLayout, to: LaneLayout): number {
  let max = 0;
  for (const id of Object.keys(to.positions)) {
    const a = from.positions[id];
    const b = to.positions[id]!;
    if (!a) continue;
    max = Math.max(max, Math.hypot(b.x - a.x, b.y - a.y));
  }
  return max;
}

function lerpPoint(a: Point, b: Point, t: number): Point {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function lerpRect(a: Rect, b: Rect, t: number): Rect {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, w: b.w, h: b.h };
}

/** Frame between two layouts; the result carries the target key and bounds. */
export function lerpLayouts(from: LaneLayout, to: LaneLayout, t: number): LaneLayout {
  if (t >= 1) return to;
  const positions: LaneLayout["positions"] = {};
  for (const id of Object.keys(to.positions)) {
    const b = to.positions[id]!;
    const a = from.positions[id];
    positions[id] = a ? lerpPoint(a, b, t) : b;
  }
  const routes: LaneLayout["routes"] = {};
  for (const id of Object.keys(to.routes)) {
    const b = to.routes[id]!;
    const a = from.routes[id];
    routes[id] = a && a.length >= 2 && b.length >= 2 ? lerpPolylines(a, b, t) : b;
  }
  const labels: LaneLayout["labels"] = {};
  for (const id of Object.keys(to.labels)) {
    const b = to.labels[id]!;
    const a = from.labels[id];
    labels[id] = a ? lerpRect(a, b, t) : b;
  }
  return { key: to.key, positions, routes, labels, bounds: to.bounds };
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useAnimatedLayout(target: LaneLayout | null): LaneLayout | null {
  const [current, setCurrent] = useState<LaneLayout | null>(target);
  const shownRef = useRef<LaneLayout | null>(target);
  const targetRef = useRef(target);
  targetRef.current = target;
  const key = target?.key ?? "";

  useEffect(() => {
    const next = targetRef.current;
    const from = shownRef.current;
    const snap = () => {
      shownRef.current = next;
      setCurrent(next);
    };
    if (!next || !from || prefersReducedMotion()) {
      snap();
      return;
    }
    const delta = maxDelta(from, next);
    if (delta < SNAP_PX || delta > MODEST_MAX_PX) {
      snap();
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION_MS);
      const eased = 1 - (1 - t) ** 2;
      const frame = lerpLayouts(from, next, eased);
      shownRef.current = frame;
      setCurrent(frame);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [key]);

  /* The very first layout is shown in the same render it arrives (no saved-position frame). */
  return current ?? target;
}

export function pointAt(positions: Record<string, Point> | undefined, id: string, fallback: Point): Point {
  return positions?.[id] ?? fallback;
}
