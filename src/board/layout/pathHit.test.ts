import { expect, test } from "vitest";
import ELK from "elkjs/lib/elk.bundled.js";
import {
  distToPolyline,
  hitInsertPathId,
  hitPathId,
  incidentPathIds,
  routesShareBundle,
  skipInsertHover,
  uniqueSegments,
} from "./pathHit";
import type { LaneLayout } from "./laneLayout";
import { oakParkInvoice, OAK_PARK_IDS } from "../../demos/oakParkInvoice";
import { projectBefore } from "../../state/projection";
import { buildElkGraph, laneGraphKey } from "./elkGraph";
import { toLaneLayout } from "./elkLayout";
import { measureLabelBox } from "./labelBox";

test("hitPathId returns the closest route within the threshold", () => {
  const layout: LaneLayout = {
    key: "test",
    positions: {},
    routes: {
      e1: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ],
      e2: [
        { x: 0, y: 40 },
        { x: 100, y: 40 },
      ],
    },
    labels: {},
    bounds: { x: 0, y: 0, w: 100, h: 40 },
  };
  expect(distToPolyline({ x: 50, y: 4 }, layout.routes.e1!)).toBeLessThan(5);
  expect(hitPathId(layout, { x: 50, y: 3 }, () => false)).toBe("e1");
  expect(hitPathId(layout, { x: 50, y: 38 }, () => false)).toBe("e2");
  expect(hitPathId(layout, { x: 50, y: 200 }, () => false)).toBeNull();
  expect(hitPathId(layout, { x: 50, y: 3 }, (id) => id === "e1")).toBeNull();
});

test("routesShareBundle detects a shared trunk and a shared inbound merge", () => {
  const trunkA = [
    { x: 0, y: 50 },
    { x: 40, y: 50 },
    { x: 40, y: 10 },
    { x: 80, y: 10 },
  ];
  const trunkB = [
    { x: 0, y: 50 },
    { x: 40, y: 50 },
    { x: 40, y: 90 },
    { x: 80, y: 90 },
  ];
  const other = [
    { x: 80, y: 10 },
    { x: 140, y: 10 },
  ];
  const mergeA = [
    { x: 0, y: 10 },
    { x: 40, y: 10 },
    { x: 40, y: 50 },
    { x: 80, y: 50 },
  ];
  const mergeB = [
    { x: 0, y: 90 },
    { x: 40, y: 90 },
    { x: 40, y: 50 },
    { x: 80, y: 50 },
  ];
  expect(routesShareBundle(trunkA, trunkB)).toBe(true);
  expect(routesShareBundle(trunkA, other)).toBe(false);
  expect(routesShareBundle(mergeA, mergeB)).toBe(true);
});

const fanLayout: LaneLayout = {
  key: "fan",
  positions: {},
  routes: {
    e1: [
      { x: 0, y: 50 },
      { x: 40, y: 50 },
      { x: 40, y: 10 },
      { x: 80, y: 10 },
    ],
    e2: [
      { x: 0, y: 50 },
      { x: 40, y: 50 },
      { x: 40, y: 90 },
      { x: 80, y: 90 },
    ],
    e3: [
      { x: 80, y: 10 },
      { x: 140, y: 10 },
    ],
  },
  labels: {},
  bounds: { x: 0, y: 0, w: 140, h: 90 },
};

test("skipInsertHover skips only the incident Path, not its bundled sibling", () => {
  const skip = skipInsertHover(fanLayout, new Set(["e1"]));
  expect(skip("e1")).toBe(true);
  expect(skip("e2")).toBe(false);
  expect(skip("e3")).toBe(false);
});

test("hitInsertPathId hits a bundled sibling on its unique branch, not the shared trunk", () => {
  const incident = new Set(["e1"]);
  expect(hitInsertPathId(fanLayout, { x: 20, y: 50 }, incident)).toBeNull();
  expect(hitInsertPathId(fanLayout, { x: 40, y: 50 }, incident)).toBeNull();
  expect(hitInsertPathId(fanLayout, { x: 40, y: 88 }, incident)).toBe("e2");
  expect(hitInsertPathId(fanLayout, { x: 70, y: 90 }, incident)).toBe("e2");
  expect(hitInsertPathId(fanLayout, { x: 110, y: 10 }, incident)).toBe("e3");
  const unique = uniqueSegments(fanLayout.routes.e2!, [fanLayout.routes.e1!]);
  expect(unique.length).toBeGreaterThan(0);
  expect(unique.some((s) => s.a.y === 90 || s.b.y === 90)).toBe(true);
});

test("Oak Park: dragging Web hits the other amount branch, not the shared trunk", async () => {
  const elk = new ELK();
  const projection = projectBefore(oakParkInvoice());
  const boxes: Record<string, { w: number; h: number; lines: string[] }> = {};
  for (const e of projection.edges) {
    if (e.label.trim()) boxes[e.id] = measureLabelBox(e.label);
  }
  const layout = toLaneLayout(
    laneGraphKey(projection, boxes),
    await elk.layout(buildElkGraph(projection, boxes)),
  );
  const incident = incidentPathIds(oakParkInvoice().edges, OAK_PARK_IDS.web);
  expect(incident.has(OAK_PARK_IDS.gt)).toBe(true);
  expect(skipInsertHover(layout, incident)(OAK_PARK_IDS.gt)).toBe(true);
  expect(skipInsertHover(layout, incident)(OAK_PARK_IDS.lt)).toBe(false);
  expect(skipInsertHover(layout, incident)(OAK_PARK_IDS.enterReview)).toBe(false);

  const gt = layout.routes[OAK_PARK_IDS.gt]!;
  const lt = layout.routes[OAK_PARK_IDS.lt]!;
  expect(hitInsertPathId(layout, gt[0]!, incident)).toBeNull();
  const unique = uniqueSegments(lt, [gt]);
  expect(unique.length).toBeGreaterThan(0);
  const mid = unique[unique.length - 1]!;
  const p = { x: (mid.a.x + mid.b.x) / 2, y: (mid.a.y + mid.b.y) / 2 };
  expect(hitInsertPathId(layout, p, incident)).toBe(OAK_PARK_IDS.lt);
  const enter = layout.routes[OAK_PARK_IDS.enterReview]!;
  const enterMid = enter[Math.floor(enter.length / 2)]!;
  expect(hitInsertPathId(layout, enterMid, incident)).toBe(OAK_PARK_IDS.enterReview);
});
