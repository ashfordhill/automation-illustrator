/**
 * Interpolate modest derived-layout moves (CX-06). Large jumps (New / Demo /
 * Import) snap. Reduced motion snaps always. Not a history entry.
 */
import { useEffect, useRef, useState } from "react";
import type { Point } from "../../workflow/types";
import type { LanePositions } from "./layoutLane";

const SNAP_PX = 1;
const MODEST_MAX_PX = 280;
const DURATION_MS = 200;

function keyOf(pos: LanePositions): string {
  return Object.keys(pos)
    .sort()
    .map((id) => {
      const p = pos[id]!;
      return `${id}:${Math.round(p.x)},${Math.round(p.y)}`;
    })
    .join(";");
}

function maxDelta(from: LanePositions, to: LanePositions): number {
  let max = 0;
  for (const id of Object.keys(to)) {
    const a = from[id];
    const b = to[id];
    if (!a || !b) {
      max = Math.max(max, MODEST_MAX_PX + 1);
      continue;
    }
    max = Math.max(max, Math.hypot(b.x - a.x, b.y - a.y));
  }
  for (const id of Object.keys(from)) {
    if (!(id in to)) max = Math.max(max, MODEST_MAX_PX + 1);
  }
  return max;
}

function lerp(from: LanePositions, to: LanePositions, t: number): LanePositions {
  const next: LanePositions = {};
  for (const id of Object.keys(to)) {
    const b = to[id]!;
    const a = from[id] ?? b;
    next[id] = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
  }
  return next;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useModestMotion(target: LanePositions): LanePositions {
  const [current, setCurrent] = useState<LanePositions>(target);
  const fromRef = useRef<LanePositions>(target);
  const targetRef = useRef(target);
  targetRef.current = target;
  const sig = keyOf(target);

  useEffect(() => {
    const next = targetRef.current;
    if (prefersReducedMotion()) {
      fromRef.current = next;
      setCurrent(next);
      return;
    }
    const from = fromRef.current;
    const delta = maxDelta(from, next);
    if (delta < SNAP_PX || delta > MODEST_MAX_PX) {
      fromRef.current = next;
      setCurrent(next);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION_MS);
      const e = 1 - (1 - t) ** 2;
      const frame = lerp(from, next, e);
      setCurrent(frame);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        fromRef.current = next;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [sig]);

  return current;
}

export function pointAt(positions: LanePositions, id: string, fallback: Point): Point {
  return positions[id] ?? fallback;
}
