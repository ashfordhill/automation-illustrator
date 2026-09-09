import { expect, test } from "vitest";
import ELK from "elkjs/lib/elk.bundled.js";
import {
  bundleTrunkPolyline,
  distToPolyline,
  hitInsertPathId,
  hitInsertTarget,
  hitPathId,
  incidentPathIds,
  pathBundles,
  routesShareBundle,
  sharedPolyline,
  sharedSegments,
  skipInsertHover,
  uniqueSegments,
} from "./pathHit";
import type { LaneLayout } from "./laneLayout";
import { oakParkInvoice, OAK_PARK_IDS } from "../../demos/oakParkInvoice";
import { projectBefore } from "../../state/projection";
import { buildElkGraph, laneGraphKey } from "./elkGraph";
import { toLaneLayout } from "./elkLayout";
import { measureLabelBox } from "./labelBox";
import { nodeSize } from "./tileMetrics";

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

  const edges = oakParkInvoice().edges;
  expect(hitInsertTarget(layout, gt[0]!, edges, incident)).toBeNull();
  expect(hitInsertTarget(layout, p, edges, incident)).toEqual({
    kind: "path",
    edgeId: OAK_PARK_IDS.lt,
  });

  const enterIncident = incidentPathIds(edges, OAK_PARK_IDS.enter);
  const webAcct = layout.routes[OAK_PARK_IDS.webAcct]!;
  const fsAcct = layout.routes[OAK_PARK_IDS.fsAcct]!;
  const mergeRun = sharedPolyline([webAcct, fsAcct]);
  expect(mergeRun).not.toBeNull();
  if (!mergeRun) return;
  const mergeMid = mergeRun[Math.floor(mergeRun.length / 2)]!;
  expect(hitInsertTarget(layout, mergeMid, edges, enterIncident)).toMatchObject({
    kind: "bundle",
    role: "merge",
    hostId: OAK_PARK_IDS.acct,
  });

  const acctIncident = incidentPathIds(edges, OAK_PARK_IDS.acct);
  const splitRun = sharedPolyline([gt, lt]);
  expect(splitRun).not.toBeNull();
  if (!splitRun) return;
  const splitMid = {
    x: (splitRun[0]!.x + splitRun[splitRun.length - 1]!.x) / 2,
    y: (splitRun[0]!.y + splitRun[splitRun.length - 1]!.y) / 2,
  };
  expect(hitInsertTarget(layout, splitMid, edges, acctIncident)).toMatchObject({
    kind: "bundle",
    role: "split",
    hostId: OAK_PARK_IDS.read,
  });
  expect(hitInsertTarget(layout, splitMid, edges, incident)).toBeNull();

  const acctBox = nodeSize(projection.nodes.find((n) => n.id === OAK_PARK_IDS.acct)!.type);
  const acctPos = layout.positions[OAK_PARK_IDS.acct]!;
  const mergeGutter = { x: acctPos.x - 18, y: acctPos.y + acctBox.h / 2 };
  expect(hitInsertTarget(layout, mergeGutter, edges, enterIncident)).toMatchObject({
    kind: "bundle",
    role: "merge",
    hostId: OAK_PARK_IDS.acct,
  });

  const readBox = nodeSize(projection.nodes.find((n) => n.id === OAK_PARK_IDS.read)!.type);
  const readPos = layout.positions[OAK_PARK_IDS.read]!;
  const splitGutter = { x: readPos.x + readBox.w + 18, y: readPos.y + readBox.h / 2 };
  expect(hitInsertTarget(layout, splitGutter, edges, acctIncident)).toMatchObject({
    kind: "bundle",
    role: "split",
    hostId: OAK_PARK_IDS.read,
  });
  expect(hitInsertTarget(layout, splitGutter, edges, incident)).toBeNull();
});

const mergeLayout: LaneLayout = {
  key: "merge",
  positions: {},
  routes: {
    e1: [
      { x: 0, y: 10 },
      { x: 40, y: 10 },
      { x: 40, y: 50 },
      { x: 80, y: 50 },
    ],
    e2: [
      { x: 0, y: 90 },
      { x: 40, y: 90 },
      { x: 40, y: 50 },
      { x: 80, y: 50 },
    ],
  },
  labels: {},
  bounds: { x: 0, y: 0, w: 80, h: 90 },
};

const mergeEdges = [
  { id: "e1", source: "a", target: "c" },
  { id: "e2", source: "b", target: "c" },
];

const fanEdges = [
  { id: "e1", source: "s", target: "a" },
  { id: "e2", source: "s", target: "b" },
  { id: "e3", source: "a", target: "c" },
];

test("sharedSegments keeps the inbound merge run", () => {
  const shared = sharedSegments(mergeLayout.routes.e1!, [mergeLayout.routes.e2!]);
  expect(shared.some((s) => s.a.x === 40 && s.b.x === 80)).toBe(true);
  expect(sharedPolyline([mergeLayout.routes.e1!, mergeLayout.routes.e2!])).not.toBeNull();
});

test("pathBundles finds a split from S and a merge into U", () => {
  expect(pathBundles(fanEdges)).toEqual([{ role: "split", hostId: "s", edgeIds: ["e1", "e2"] }]);
  expect(pathBundles(mergeEdges)).toEqual([{ role: "merge", hostId: "c", edgeIds: ["e1", "e2"] }]);
});

test("hitInsertTarget: unique branch is a Path; shared trunk is a bundle", () => {
  expect(hitInsertTarget(fanLayout, { x: 70, y: 90 }, fanEdges, new Set())).toEqual({
    kind: "path",
    edgeId: "e2",
  });
  expect(hitInsertTarget(fanLayout, { x: 20, y: 50 }, fanEdges, new Set())).toMatchObject({
    kind: "bundle",
    role: "split",
    hostId: "s",
  });
  expect(hitInsertTarget(fanLayout, { x: 40, y: 50 }, fanEdges, new Set())).toMatchObject({
    kind: "bundle",
    role: "split",
    hostId: "s",
  });
});

test("hitInsertTarget: shared trunk is a dead zone when the Tile already sits on the bundle", () => {
  const incident = new Set(["e1"]);
  expect(hitInsertTarget(fanLayout, { x: 20, y: 50 }, fanEdges, incident)).toBeNull();
  expect(hitInsertTarget(fanLayout, { x: 40, y: 50 }, fanEdges, incident)).toBeNull();
  expect(hitInsertTarget(fanLayout, { x: 70, y: 90 }, fanEdges, incident)).toEqual({
    kind: "path",
    edgeId: "e2",
  });
});

test("hitInsertTarget: inbound merge trunk is a bundle; unique incoming stay a Path", () => {
  expect(hitInsertTarget(mergeLayout, { x: 60, y: 50 }, mergeEdges, new Set())).toMatchObject({
    kind: "bundle",
    role: "merge",
    hostId: "c",
  });
  expect(hitInsertTarget(mergeLayout, { x: 20, y: 10 }, mergeEdges, new Set())).toEqual({
    kind: "path",
    edgeId: "e1",
  });
  expect(hitInsertTarget(mergeLayout, { x: 60, y: 50 }, mergeEdges, new Set(["e1"]))).toBeNull();
});

test("hitInsertTarget: Oak Park-shaped 32px merge trunk beats the unique spine", () => {
  const layout: LaneLayout = {
    key: "oak-merge",
    positions: {},
    routes: {
      e_web_acct: [
        { x: 825, y: 112 },
        { x: 857, y: 112 },
        { x: 857, y: 208 },
        { x: 889, y: 208 },
      ],
      e_fs_acct: [
        { x: 825, y: 304 },
        { x: 857, y: 304 },
        { x: 857, y: 208 },
        { x: 889, y: 208 },
      ],
    },
    labels: {},
    bounds: { x: 0, y: 0, w: 900, h: 320 },
  };
  const edges = [
    { id: "e_web_acct", source: "s_web", target: "d_acct" },
    { id: "e_fs_acct", source: "s_fs", target: "d_acct" },
  ];
  expect(hitInsertTarget(layout, { x: 873, y: 208 }, edges, new Set())).toMatchObject({
    kind: "bundle",
    role: "merge",
    hostId: "d_acct",
  });
  expect(hitInsertTarget(layout, { x: 857, y: 160 }, edges, new Set())).toEqual({
    kind: "path",
    edgeId: "e_web_acct",
  });
});

test("hitInsertTarget: a few pixels of ELK offset still counts as one merge trunk", () => {
  const offsetLayout: LaneLayout = {
    key: "offset-merge",
    positions: {},
    routes: {
      e1: [
        { x: 0, y: 10 },
        { x: 40, y: 10 },
        { x: 40, y: 50 },
        { x: 80, y: 50 },
      ],
      e2: [
        { x: 0, y: 90 },
        { x: 40, y: 90 },
        { x: 40, y: 54 },
        { x: 80, y: 54 },
      ],
    },
    labels: {},
    bounds: { x: 0, y: 0, w: 80, h: 90 },
  };
  expect(sharedPolyline([offsetLayout.routes.e1!, offsetLayout.routes.e2!])).toBeNull();
  expect(bundleTrunkPolyline([offsetLayout.routes.e1!, offsetLayout.routes.e2!])).not.toBeNull();
  expect(hitInsertTarget(offsetLayout, { x: 60, y: 52 }, mergeEdges, new Set())).toMatchObject({
    kind: "bundle",
    role: "merge",
    hostId: "c",
  });
  expect(hitInsertTarget(offsetLayout, { x: 20, y: 10 }, mergeEdges, new Set())).toEqual({
    kind: "path",
    edgeId: "e1",
  });
});
