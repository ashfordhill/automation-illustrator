import { expect, test } from "vitest";
import ELK from "elkjs/lib/elk.bundled.js";
import { distToPolyline, hitPathId, incidentPathIds, routesShareBundle, skipInsertHover } from "./pathHit";
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

test("skipInsertHover skips the incident Path and its bundled sibling, not a disjoint Path", () => {
  const layout: LaneLayout = {
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
  const skip = skipInsertHover(layout, new Set(["e1"]));
  expect(skip("e1")).toBe(true);
  expect(skip("e2")).toBe(true);
  expect(skip("e3")).toBe(false);
  expect(hitPathId(layout, { x: 40, y: 88 }, skip)).toBeNull();
  expect(hitPathId(layout, { x: 110, y: 10 }, skip)).toBe("e3");
});

test("Oak Park: dragging Web skips the amount fan-out bundle, not Enter→Review", async () => {
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
  const skip = skipInsertHover(
    layout,
    incidentPathIds(oakParkInvoice().edges, OAK_PARK_IDS.web),
  );
  expect(skip(OAK_PARK_IDS.gt)).toBe(true);
  expect(skip(OAK_PARK_IDS.lt)).toBe(true);
  expect(skip(OAK_PARK_IDS.enterReview)).toBe(false);
});
