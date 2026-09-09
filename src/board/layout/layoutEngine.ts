/**
 * Lane layout requests to ELK: key cache, per-lane coalescing, debounce.
 * Framework-free so unit tests can drive it with a fake ELK.
 *
 * - A cache hit resolves synchronously via `get(key)` (no flash on view switches).
 * - Requests inside the debounce window replace the pending one; the replaced
 *   request rejects with LayoutSuperseded so callers keep their previous layout.
 * - An empty projection resolves to `emptyLayout` without calling ELK.
 * - ELK errors are logged once per engine and rejected so the caller keeps the
 *   previous layout.
 */
import type { ElkNode } from "elkjs/lib/elk-api";
import type { LaneProjection } from "../../state/projection";
import type { AssignmentLane } from "../../workflow/catalogs";
import type { PositionMap } from "../../workflow/types";
import { buildElkGraph, laneGraphKey, type TileSizes } from "./elkGraph";
import { emptyLayout, toLaneLayout } from "./elkLayout";
import type { LabelBox } from "./labelBox";
import type { LaneLayout } from "./laneLayout";

export type ElkLike = { layout(graph: ElkNode): Promise<ElkNode> };

export type LayoutEngine = {
  /** Cached layout for a key, or undefined. */
  get(key: string): LaneLayout | undefined;
  /** Key the engine would compute for these inputs. */
  keyFor(projection: LaneProjection, boxes: Record<string, LabelBox>, sizes?: TileSizes): string;
  /** Resolve to the layout for these inputs; may reject with LayoutSuperseded or an ELK error. */
  request(
    lane: AssignmentLane,
    projection: LaneProjection,
    boxes: Record<string, LabelBox>,
    sizes?: TileSizes,
    previous?: PositionMap,
  ): Promise<LaneLayout>;
};

export class LayoutSuperseded extends Error {
  constructor(public readonly key: string) {
    super(`Layout request superseded: ${key}`);
    this.name = "LayoutSuperseded";
  }
}

type Pending = {
  key: string;
  graph: ElkNode;
  timer: ReturnType<typeof setTimeout> | null;
  resolve: (layout: LaneLayout) => void;
  reject: (error: unknown) => void;
  promise: Promise<LaneLayout>;
};

export function createLayoutEngine(
  elk: ElkLike,
  { cacheSize = 32, debounceMs = 60 }: { cacheSize?: number; debounceMs?: number } = {},
): LayoutEngine {
  const cache = new Map<string, LaneLayout>();
  const pending = new Map<string, Pending>();
  const inFlight = new Map<string, Promise<LaneLayout>>();
  let loggedError = false;

  function remember(layout: LaneLayout) {
    cache.delete(layout.key);
    cache.set(layout.key, layout);
    while (cache.size > cacheSize) {
      const oldest = cache.keys().next().value;
      if (oldest === undefined) break;
      cache.delete(oldest);
    }
  }

  function run(key: string, graph: ElkNode): Promise<LaneLayout> {
    const existing = inFlight.get(key);
    if (existing) return existing;
    const job = elk
      .layout(graph)
      .then((laidOut) => {
        const layout = toLaneLayout(key, laidOut);
        remember(layout);
        return layout;
      })
      .catch((error: unknown) => {
        if (!loggedError) {
          loggedError = true;
          console.error("ELK layout failed", error);
        }
        throw error;
      })
      .finally(() => {
        if (inFlight.get(key) === job) inFlight.delete(key);
      });
    inFlight.set(key, job);
    return job;
  }

  return {
    get: (key) => cache.get(key),
    keyFor: (projection, boxes, sizes) => laneGraphKey(projection, boxes, sizes),
    request(lane, projection, boxes, sizes, previous) {
      const key = laneGraphKey(projection, boxes, sizes);
      const hit = cache.get(key);
      if (hit) return Promise.resolve(hit);
      if (!projection.nodes.length) {
        const empty = emptyLayout(key);
        remember(empty);
        return Promise.resolve(empty);
      }
      const running = inFlight.get(key);
      if (running) return running;

      const current = pending.get(lane);
      if (current) {
        if (current.key === key) return current.promise;
        if (current.timer) clearTimeout(current.timer);
        pending.delete(lane);
        current.reject(new LayoutSuperseded(current.key));
      }

      const graph = buildElkGraph(projection, boxes, sizes, previous);
      let resolve!: (layout: LaneLayout) => void;
      let reject!: (error: unknown) => void;
      const promise = new Promise<LaneLayout>((res, rej) => {
        resolve = res;
        reject = rej;
      });
      const entry: Pending = { key, graph, timer: null, resolve, reject, promise };
      const fire = () => {
        if (pending.get(lane) === entry) pending.delete(lane);
        run(key, graph).then(entry.resolve, entry.reject);
      };
      if (debounceMs > 0) {
        entry.timer = setTimeout(fire, debounceMs);
      } else {
        queueMicrotask(fire);
      }
      pending.set(lane, entry);
      return promise;
    },
  };
}
