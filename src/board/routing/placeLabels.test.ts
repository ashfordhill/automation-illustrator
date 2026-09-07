import { Position } from "@xyflow/react";
import { getSmartEdge } from "@tisoap/react-flow-smart-edge";
import { expect, test } from "vitest";
import { measureLabelBox } from "../layout/labelBox";
import { placeAllConditions } from "./placeLabels";
import { orthogonalPolyline, rectsOverlap } from "./polyline";
import { smartStepOptions } from "./smartStep";

test("condition chips pick a segment that does not sit on a Node (CX-04)", () => {
  const path = orthogonalPolyline(0, 40, 240, 40);
  const nodes = [{ id: "n", x: 80, y: 0, w: 80, h: 80 }];
  const boxes = { e1: measureLabelBox("choice") };
  const placed = placeAllConditions({ e1: path }, boxes, nodes, ["e1"]);
  const chip = placed.e1;
  expect(chip).toBeTruthy();
  expect(rectsOverlap(chip!, nodes[0]!, 0)).toBe(false);
});

test("later Path ids yield to earlier chips (stable order)", () => {
  const a = [
    { x: 0, y: 20 },
    { x: 200, y: 20 },
  ];
  const b = [
    { x: 0, y: 24 },
    { x: 200, y: 24 },
  ];
  const box = measureLabelBox("same-size-label");
  const placed = placeAllConditions({ e_a: a, e_b: b }, { e_a: box, e_b: box }, [], ["e_a", "e_b"]);
  expect(placed.e_a).toBeTruthy();
  expect(placed.e_b).toBeTruthy();
  expect(rectsOverlap(placed.e_a!, placed.e_b!, 0)).toBe(false);
});

test("getSmartEdge step path goes around a blocking Node (PC-05)", () => {
  const blocker = {
    id: "mid",
    position: { x: 80, y: 0 },
    measured: { width: 80, height: 80 },
    data: {},
  };
  const source = {
    id: "src",
    position: { x: 0, y: 20 },
    measured: { width: 40, height: 40 },
    data: {},
  };
  const target = {
    id: "tgt",
    position: { x: 220, y: 20 },
    measured: { width: 40, height: 40 },
    data: {},
  };
  const result = getSmartEdge({
    sourceX: 40,
    sourceY: 40,
    targetX: 220,
    targetY: 40,
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    nodes: [source, blocker, target],
    options: smartStepOptions,
  });
  expect(result instanceof Error).toBe(false);
  if (result instanceof Error) return;
  expect(result.svgPathString.startsWith("M")).toBe(true);
  const hitsBlocker = result.points.some(
    ([x, y]) => x! >= 80 && x! <= 160 && y! >= 0 && y! <= 80,
  );
  expect(hitsBlocker).toBe(false);
});
