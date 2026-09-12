import type { ElkNode } from "elkjs/lib/elk-api";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { oakParkInvoice } from "../../demos/oakParkInvoice";
import { projectAfter, projectBefore, type LaneProjection } from "../../state/projection";
import { AssignmentLane } from "../../workflow/catalogs";
import { createLayoutEngine, LayoutSuperseded, type ElkLike } from "./layoutEngine";
import { measureLabelBox, type LabelBox } from "./labelBox";

/** Fake ELK: places children on a row, routes edges straight, resolves when told to. */
function fakeElk() {
  const pending: Array<() => void> = [];
  const layout = vi.fn((graph: ElkNode) => {
    return new Promise<ElkNode>((resolve) => {
      pending.push(() => {
        const children = (graph.children ?? []).map((c, i) => ({ ...c, x: i * 300, y: 0 }));
        const edges = (graph.edges ?? []).map((e) => ({
          ...e,
          sections: [
            {
              id: `${e.id}_s`,
              startPoint: { x: 0, y: 0 },
              endPoint: { x: 10, y: 0 },
            },
          ],
        }));
        resolve({ ...graph, x: 0, y: 0, width: 1000, height: 200, children, edges });
      });
    });
  });
  const elk: ElkLike = { layout };
  return { elk, layout, flush: () => { while (pending.length) pending.shift()!(); } };
}

function boxesFor(projection: LaneProjection): Record<string, LabelBox> {
  const boxes: Record<string, LabelBox> = {};
  for (const e of projection.edges) if (e.label.trim()) boxes[e.id] = measureLabelBox(e.label);
  return boxes;
}

const doc = oakParkInvoice();
const projection = projectBefore(doc);
const boxes = boxesFor(projection);

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

test("the first request runs without waiting for the debounce", async () => {
  const { elk, layout, flush } = fakeElk();
  const engine = createLayoutEngine(elk, { debounceMs: 60 });
  const p = engine.request(AssignmentLane.Before, projection, boxes);
  expect(layout).not.toHaveBeenCalled();
  await Promise.resolve();
  expect(layout).toHaveBeenCalledTimes(1);
  flush();
  await p;
  expect(engine.get(engine.keyFor(projection, boxes))).toBeTruthy();
});

test("debounces later graph changes, then serves the cache synchronously", async () => {
  const { elk, layout, flush } = fakeElk();
  const engine = createLayoutEngine(elk, { debounceMs: 60 });
  const first = engine.request(AssignmentLane.Before, projection, boxes);
  await Promise.resolve();
  flush();
  const result = await first;
  const key = engine.keyFor(projection, boxes);
  expect(result.key).toBe(key);
  expect(Object.keys(result.positions)).toHaveLength(projection.nodes.length);

  const again = await engine.request(AssignmentLane.Before, projection, boxes);
  expect(again).toBe(result);
  expect(layout).toHaveBeenCalledTimes(1);

  layout.mockClear();
  const smaller: LaneProjection = { ...projection, nodes: projection.nodes.slice(0, 2), edges: [] };
  const p = engine.request(AssignmentLane.Before, smaller, {});
  expect(layout).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(60);
  expect(layout).toHaveBeenCalledTimes(1);
  flush();
  await p;
  expect(engine.get(engine.keyFor(smaller, {}))).toBeTruthy();
});

test("a newer request for the same lane supersedes a pending one", async () => {
  const { elk, layout, flush } = fakeElk();
  const engine = createLayoutEngine(elk, { debounceMs: 60 });
  const warm = engine.request(AssignmentLane.Before, projection, boxes);
  await Promise.resolve();
  flush();
  await warm;
  layout.mockClear();
  const smaller: LaneProjection = { ...projection, nodes: projection.nodes.slice(0, 2), edges: [] };
  const first = engine.request(AssignmentLane.Before, smaller, {});
  const secondGraph: LaneProjection = { ...projection, nodes: projection.nodes.slice(0, 1), edges: [] };
  const second = engine.request(AssignmentLane.Before, secondGraph, {});
  await expect(first).rejects.toBeInstanceOf(LayoutSuperseded);
  await vi.advanceTimersByTimeAsync(60);
  expect(layout).toHaveBeenCalledTimes(1);
  flush();
  const result = await second;
  expect(result.key).toBe(engine.keyFor(secondGraph, {}));
});

test("After reuses Before's in-flight layout for the same graph", async () => {
  const { elk, layout, flush } = fakeElk();
  const engine = createLayoutEngine(elk, { debounceMs: 60 });
  const afterProj = projectAfter(doc);
  expect(engine.keyFor(afterProj, boxes)).toBe(engine.keyFor(projection, boxes));
  const before = engine.request(AssignmentLane.Before, projection, boxes);
  const after = engine.request(AssignmentLane.After, afterProj, boxes);
  await Promise.resolve();
  expect(layout).toHaveBeenCalledTimes(1);
  flush();
  const [a, b] = await Promise.all([before, after]);
  expect(a).toBe(b);
});

test("different graphs on two lanes still debounce independently", async () => {
  const { elk, layout, flush } = fakeElk();
  const engine = createLayoutEngine(elk, { debounceMs: 10 });
  const first = engine.request(AssignmentLane.Before, projection, boxes);
  await Promise.resolve();
  flush();
  await first;
  layout.mockClear();
  const smaller: LaneProjection = { ...projection, nodes: projection.nodes.slice(0, 2), edges: [] };
  const other: LaneProjection = {
    ...projection,
    lane: AssignmentLane.After,
    nodes: projection.nodes.slice(0, 1),
    edges: [],
  };
  const a = engine.request(AssignmentLane.Before, smaller, {});
  const b = engine.request(AssignmentLane.After, other, {});
  expect(layout).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(10);
  expect(layout).toHaveBeenCalledTimes(2);
  flush();
  await expect(Promise.all([a, b])).resolves.toHaveLength(2);
});

test("an empty projection resolves without calling ELK", async () => {
  const { elk, layout } = fakeElk();
  const engine = createLayoutEngine(elk);
  const empty: LaneProjection = { lane: AssignmentLane.Before, nodes: [], edges: [] };
  const result = await engine.request(AssignmentLane.Before, empty, {});
  expect(layout).not.toHaveBeenCalled();
  expect(result.positions).toEqual({});
  expect(engine.get(engine.keyFor(empty, {}))).toBe(result);
});

test("an ELK failure rejects and leaves earlier cache entries intact", async () => {
  const failing: ElkLike = { layout: vi.fn(() => Promise.reject(new Error("boom"))) };
  const engine = createLayoutEngine(failing, { debounceMs: 0 });
  const spy = vi.spyOn(console, "error").mockImplementation(() => {});
  const p = engine.request(AssignmentLane.Before, projection, boxes);
  const rejected = expect(p).rejects.toThrow("boom");
  await vi.advanceTimersByTimeAsync(0);
  await rejected;
  expect(engine.get(engine.keyFor(projection, boxes))).toBeUndefined();
  expect(spy).toHaveBeenCalledTimes(1);
  spy.mockRestore();
});

test("a new orientation skips debounce like a cold start", async () => {
  const { elk, layout, flush } = fakeElk();
  const engine = createLayoutEngine(elk, { debounceMs: 60 });
  const first = engine.request(AssignmentLane.Before, projection, boxes);
  await Promise.resolve();
  flush();
  await first;
  layout.mockClear();
  const p = engine.request(
    AssignmentLane.Before,
    projection,
    boxes,
    undefined,
    undefined,
    "tile",
    "vertical",
  );
  await Promise.resolve();
  expect(layout).toHaveBeenCalledTimes(1);
  flush();
  const result = await p;
  expect(result.key).toBe(engine.keyFor(projection, boxes, undefined, "tile", "vertical"));
});
