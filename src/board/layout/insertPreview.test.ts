import { expect, test } from "vitest";
import ELK from "elkjs/lib/elk.bundled.js";
import { oakParkInvoice, OAK_PARK_IDS } from "../../demos/oakParkInvoice";
import { projectBefore } from "../../state/projection";
import type { LaneProjection } from "../../state/projection";
import { buildElkGraph, laneGraphKey } from "./elkGraph";
import { toLaneLayout } from "./elkLayout";
import { measureLabelBox, type LabelBox } from "./labelBox";
import type { LaneLayout, Rect } from "./laneLayout";
import { insertPreviewGeom, stubsWithNeighborShift } from "./insertPreview";
import { nodeSize, STEP_H, STEP_W, TILE_GAP } from "./tileMetrics";

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

function orthogonal(points: { x: number; y: number }[]): boolean {
  for (let i = 0; i + 1 < points.length; i++) {
    const a = points[i]!;
    const b = points[i + 1]!;
    if (a.x !== b.x && a.y !== b.y) return false;
  }
  return true;
}

function intersects(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

test("insertPreviewGeom is null when the route is missing", () => {
  const layout: LaneLayout = {
    key: "empty",
    positions: { s: { x: 0, y: 0 }, u: { x: 400, y: 0 } },
    routes: {},
    labels: {},
    bounds: { x: 0, y: 0, w: 400, h: 160 },
  };
  expect(insertPreviewGeom(layout, "e-missing", { w: STEP_W, h: STEP_H })).toBeNull();
});

test("3-node chain: gap clears S and U; stubs are orthogonal; rightward Path eases apart", () => {
  const s = { x: 0, y: 0 };
  const u = { x: STEP_W + STEP_W + TILE_GAP, y: 0 };
  const layout: LaneLayout = {
    key: "chain",
    positions: { s, u },
    routes: {
      e1: [
        { x: s.x + STEP_W, y: s.y + STEP_H / 2 },
        { x: u.x, y: u.y + STEP_H / 2 },
      ],
    },
    labels: {},
    bounds: { x: 0, y: 0, w: u.x + STEP_W, h: STEP_H },
  };
  const geom = insertPreviewGeom(layout, "e1", { w: STEP_W, h: STEP_H });
  expect(geom).not.toBeNull();
  if (!geom) return;
  const sRect: Rect = { x: s.x, y: s.y, w: STEP_W, h: STEP_H };
  const uRect: Rect = { x: u.x, y: u.y, w: STEP_W, h: STEP_H };
  expect(intersects(geom.gap, sRect)).toBe(false);
  expect(intersects(geom.gap, uRect)).toBe(false);
  expect(orthogonal(geom.leftStub)).toBe(true);
  expect(orthogonal(geom.rightStub)).toBe(true);
  expect(geom.shiftS.x).toBeLessThanOrEqual(0);
  expect(geom.shiftU.x).toBeGreaterThanOrEqual(0);
  expect(geom.shiftS.x).toBe(-Math.round(STEP_W / 2 + TILE_GAP / 2));
  expect(geom.shiftU.x).toBe(Math.round(STEP_W / 2 + TILE_GAP / 2));
  const eased = stubsWithNeighborShift(geom, true);
  expect(orthogonal(eased.left)).toBe(true);
  expect(orthogonal(eased.right)).toBe(true);
  expect(eased.left[0]!.x).toBe(geom.leftStub[0]!.x + geom.shiftS.x);
});

test("Oak Park Enter→Review: stubs stay orthogonal and S shifts left of U", async () => {
  const projection = projectBefore(oakParkInvoice());
  const layout = await layoutOf(projection);
  const tile = nodeSize(projection.nodes.find((n) => n.id === OAK_PARK_IDS.review)!.type);
  const geom = insertPreviewGeom(layout, OAK_PARK_IDS.enterReview, tile);
  expect(geom).not.toBeNull();
  if (!geom) return;
  expect(orthogonal(geom.leftStub)).toBe(true);
  expect(orthogonal(geom.rightStub)).toBe(true);
  expect(geom.shiftS.x).toBeLessThanOrEqual(0);
  expect(geom.shiftU.x).toBeGreaterThanOrEqual(0);
  const enter = layout.positions[OAK_PARK_IDS.enter]!;
  const review = layout.positions[OAK_PARK_IDS.review]!;
  const enterRect: Rect = { ...enter, ...nodeSize(projection.nodes.find((n) => n.id === OAK_PARK_IDS.enter)!.type) };
  const reviewRect: Rect = { ...review, ...tile };
  const shiftedEnter = { ...enterRect, x: enterRect.x + geom.shiftS.x, y: enterRect.y + geom.shiftS.y };
  const shiftedReview = { ...reviewRect, x: reviewRect.x + geom.shiftU.x, y: reviewRect.y + geom.shiftU.y };
  expect(intersects(shiftedEnter, shiftedReview)).toBe(false);
});
