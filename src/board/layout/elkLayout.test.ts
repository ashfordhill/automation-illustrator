/**
 * ELK layout invariants on real documents (Improvement 01), run with
 * elk.bundled.js on the main thread.
 */
import ELK from "elkjs/lib/elk.bundled.js";
import { describe, expect, test } from "vitest";
import { oakParkInvoice, OAK_PARK_IDS } from "../../demos/oakParkInvoice";
import { robotMailroom } from "../../demos/robotMailroom";
import { projectAfter, projectBefore, type LaneProjection } from "../../state/projection";
import { IdPrefix, SplitKind, StepKind, WorkflowNodeKind } from "../../workflow/catalogs";
import type { EdgeDto, NodeDto, WorkflowDoc } from "../../workflow/types";
import { buildElkGraph, laneGraphKey, usedOptionIds } from "./elkGraph";
import { emptyLayout, toLaneLayout } from "./elkLayout";
import { measureLabelBox, type LabelBox } from "./labelBox";
import type { LaneLayout, Rect } from "./laneLayout";
import { nodeSize } from "./tileMetrics";

const elk = new ELK();

function boxesFor(projection: LaneProjection): Record<string, LabelBox> {
  const boxes: Record<string, LabelBox> = {};
  for (const e of projection.edges) if (e.label.trim()) boxes[e.id] = measureLabelBox(e.label);
  return boxes;
}

async function layoutOf(projection: LaneProjection): Promise<LaneLayout> {
  const boxes = boxesFor(projection);
  const key = laneGraphKey(projection, boxes);
  const laidOut = await elk.layout(buildElkGraph(projection, boxes));
  return toLaneLayout(key, laidOut);
}

function nodeRect(projection: LaneProjection, layout: LaneLayout, id: string): Rect {
  const n = projection.nodes.find((x) => x.id === id)!;
  const p = layout.positions[id]!;
  const { w, h } = nodeSize(n.type);
  return { x: p.x, y: p.y, w, h };
}

function intersects(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

function contains(outer: Rect, inner: Rect): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.w <= outer.x + outer.w &&
    inner.y + inner.h <= outer.y + outer.h
  );
}

function distanceToPolyline(points: { x: number; y: number }[], p: { x: number; y: number }): number {
  let best = Infinity;
  for (let i = 0; i + 1 < points.length; i++) {
    const a = points[i]!;
    const b = points[i + 1]!;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len2 = dx * dx + dy * dy;
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2));
    const q = { x: a.x + dx * t, y: a.y + dy * t };
    best = Math.min(best, Math.hypot(p.x - q.x, p.y - q.y));
  }
  return best;
}

function expectInvariants(projection: LaneProjection, layout: LaneLayout) {
  const rects = projection.nodes.map((n) => ({ id: n.id, rect: nodeRect(projection, layout, n.id) }));
  for (const { rect } of rects) {
    expect(Number.isInteger(rect.x)).toBe(true);
    expect(Number.isInteger(rect.y)).toBe(true);
  }
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      expect(intersects(rects[i]!.rect, rects[j]!.rect), `${rects[i]!.id} overlaps ${rects[j]!.id}`).toBe(false);
    }
  }
  for (const e of projection.edges) {
    const route = layout.routes[e.id]!;
    expect(route.length).toBeGreaterThanOrEqual(2);
    const s = nodeRect(projection, layout, e.source);
    const t = nodeRect(projection, layout, e.target);
    const first = route[0]!;
    const last = route[route.length - 1]!;
    expect(Math.abs(first.x - (s.x + s.w))).toBeLessThanOrEqual(1);
    expect(Math.abs(first.y - (s.y + s.h / 2))).toBeLessThanOrEqual(1);
    expect(Math.abs(last.x - t.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(last.y - (t.y + t.h / 2))).toBeLessThanOrEqual(1);
    for (let i = 0; i + 1 < route.length; i++) {
      const a = route[i]!;
      const b = route[i + 1]!;
      expect(a.x === b.x || a.y === b.y, `${e.id} has a diagonal segment`).toBe(true);
    }
  }
  for (const { rect } of rects) expect(contains(layout.bounds, rect)).toBe(true);
  for (const rect of Object.values(layout.labels)) expect(contains(layout.bounds, rect)).toBe(true);
}

describe("Oak Park (Before)", () => {
  const doc = oakParkInvoice();
  const projection = projectBefore(doc);

  test("every option id we send is a known ELK option", async () => {
    const known = new Set(
      (await elk.knownLayoutOptions()).map((o) => (o.id ?? "").replace(/^org\.eclipse\.elk\./, "elk.")),
    );
    for (const id of usedOptionIds()) expect(known.has(id), id).toBe(true);
  });

  test("nodes do not overlap, routes are orthogonal and glued to ports, bounds contain everything", async () => {
    const layout = await layoutOf(projection);
    expectInvariants(projection, layout);
  });

  test("fan-out Paths share a trunk and a spine; 1:1 chains are straight", async () => {
    const layout = await layoutOf(projection);
    const gt = layout.routes[OAK_PARK_IDS.gt]!;
    const lt = layout.routes[OAK_PARK_IDS.lt]!;
    expect(gt[0]).toEqual(lt[0]);
    expect(gt[1]!.x).toBe(lt[1]!.x);
    for (const id of [OAK_PARK_IDS.acctEnter, OAK_PARK_IDS.enterReview]) {
      const route = layout.routes[id]!;
      const ys = new Set(route.map((p) => p.y));
      expect(ys.size, `${id} should be straight`).toBe(1);
    }
    /* Parent is centered on its two children (BALANCED alignment). */
    const read = layout.positions[OAK_PARK_IDS.read]!;
    const web = layout.positions[OAK_PARK_IDS.web]!;
    const fs = layout.positions[OAK_PARK_IDS.fs]!;
    expect(Math.abs(read.y - (web.y + fs.y) / 2)).toBeLessThanOrEqual(1);
    expect(web.y).toBeLessThan(fs.y);
  });

  test("condition chips sit on their own branch and clear every tile", async () => {
    const layout = await layoutOf(projection);
    for (const id of [OAK_PARK_IDS.gt, OAK_PARK_IDS.lt]) {
      const rect = layout.labels[id]!;
      expect(rect).toBeDefined();
      const center = { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
      expect(distanceToPolyline(layout.routes[id]!, center)).toBeLessThanOrEqual(1);
      for (const n of projection.nodes) {
        expect(intersects(rect, nodeRect(projection, layout, n.id)), `${id} chip over ${n.id}`).toBe(false);
      }
    }
    expect(intersects(layout.labels[OAK_PARK_IDS.gt]!, layout.labels[OAK_PARK_IDS.lt]!)).toBe(false);
  });

  test("deterministic and input-independent", async () => {
    const a = await layoutOf(projection);
    const b = await layoutOf(structuredClone(projection));
    expect(a).toEqual(b);
  });

  test("adding a leaf keeps sibling order (web above fs)", async () => {
    const withLeaf: WorkflowDoc = {
      ...doc,
      nodes: [
        ...doc.nodes,
        {
          id: "s_new",
          type: WorkflowNodeKind.Step,
          position: { x: 0, y: 0 },
          stepKind: StepKind.Other,
          title: "New",
          detail: "",
          split: SplitKind.Exclusive,
        },
      ],
      edges: [...doc.edges, { id: "e_new", source: OAK_PARK_IDS.review, target: "s_new", label: "" }],
    };
    const layout = await layoutOf(projectBefore(withLeaf));
    expect(layout.positions[OAK_PARK_IDS.web]!.y).toBeLessThan(layout.positions[OAK_PARK_IDS.fs]!.y);
    expect(layout.positions.s_new!.x).toBeGreaterThan(layout.positions[OAK_PARK_IDS.review]!.x);
  });

  test("laneGraphKey follows chip boxes and endpoints, not titles", () => {
    const base = laneGraphKey(projection, boxesFor(projection));
    const retitled = projectBefore({
      ...doc,
      nodes: doc.nodes.map((n) => (n.id === OAK_PARK_IDS.read && n.type === WorkflowNodeKind.Step ? { ...n, title: "Different" } : n)),
    });
    expect(laneGraphKey(retitled, boxesFor(retitled))).toBe(base);

    const relabeled = projectBefore({
      ...doc,
      edges: doc.edges.map((e) => (e.id === OAK_PARK_IDS.gt ? { ...e, label: "a much longer condition that wraps onto more lines" } : e)),
    });
    expect(laneGraphKey(relabeled, boxesFor(relabeled))).not.toBe(base);

    const rewired = projectBefore({
      ...doc,
      edges: doc.edges.map((e) => (e.id === OAK_PARK_IDS.enterReview ? { ...e, source: OAK_PARK_IDS.acct } : e)),
    });
    expect(laneGraphKey(rewired, boxesFor(rewired))).not.toBe(base);
  });
});

describe("Robot Mailroom (After) and stress", () => {
  test("After projection satisfies the layout invariants", async () => {
    const projection = projectAfter(robotMailroom());
    const layout = await layoutOf(projection);
    expectInvariants(projection, layout);
  });

  test("empty projection maps to an empty layout", () => {
    const empty = emptyLayout("k");
    expect(empty.positions).toEqual({});
    expect(empty.routes).toEqual({});
    expect(empty.bounds).toEqual({ x: 0, y: 0, w: 0, h: 0 });
  });

  test("30 objects lay out in under a second on the main thread", async () => {
    const nodes: NodeDto[] = [];
    const edges: EdgeDto[] = [];
    for (let i = 0; i < 15; i++) {
      nodes.push({
        id: `s${i}`,
        type: WorkflowNodeKind.Step,
        position: { x: 0, y: 0 },
        stepKind: StepKind.Other,
        title: `Step ${i}`,
        detail: "",
        split: SplitKind.Exclusive,
      });
      if (i > 0) {
        const parent = i % 3 === 0 ? i - 3 : i - 1;
        edges.push({ id: `${IdPrefix.Edge}_${i}`, source: `s${Math.max(0, parent)}`, target: `s${i}`, label: i % 4 === 0 ? `cond ${i}` : "" });
      }
    }
    const doc: WorkflowDoc = { ...oakParkInvoice(), nodes, edges };
    const projection = projectBefore(doc);
    expect(projection.nodes.length + projection.edges.length).toBeGreaterThanOrEqual(29);
    const start = performance.now();
    const layout = await layoutOf(projection);
    expect(performance.now() - start).toBeLessThan(1000);
    expectInvariants(projection, layout);
  });
});
