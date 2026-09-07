import { expect, test } from "vitest";
import { WorkflowNodeKind } from "../../workflow/catalogs";
import type { EdgeDto, NodeDto } from "../../workflow/types";
import { measureLabelBox } from "./labelBox";
import { layoutLane } from "./layoutLane";
import { TILE_GAP } from "./tileMetrics";

function step(id: string, x: number, y = 0): NodeDto {
  return {
    id,
    type: WorkflowNodeKind.Step,
    position: { x, y },
    stepKind: "other",
    title: id,
    detail: "",
    split: "exclusive",
  };
}

function path(id: string, source: string, target: string, label: string): EdgeDto {
  return { id, source, target, label };
}

test("long conditions expand the lane past TILE_GAP (CX-05)", () => {
  const nodes = [step("a", 32), step("b", 32 + 256 + TILE_GAP)];
  const edges = [path("e", "a", "b", "invoice > $50,000")];
  const placed = layoutLane(nodes, edges);
  const gap = placed.b!.x - (placed.a!.x + 256);
  expect(gap).toBeGreaterThan(TILE_GAP);
  expect(gap).toBeGreaterThanOrEqual(measureLabelBox("invoice > $50,000").w);
  expect(placed.a!.x).toBe(32);
});

test("shortening a condition contracts back to canonical positions (CX-05)", () => {
  const nodes = [step("a", 32), step("b", 352)];
  const long = layoutLane(nodes, [path("e", "a", "b", "invoice amount is enormous")]);
  expect(long.b!.x).toBeGreaterThan(352);
  const short = layoutLane(nodes, [path("e", "a", "b", "")]);
  expect(short.b!.x).toBe(352);
  expect(short.a!.x).toBe(32);
});

test("layout never writes a Node left of its canonical x", () => {
  const nodes = [step("a", 64), step("b", 400)];
  const placed = layoutLane(nodes, [path("e", "a", "b", "x")]);
  expect(placed.a!.x).toBeGreaterThanOrEqual(64);
  expect(placed.b!.x).toBeGreaterThanOrEqual(400);
});

test("about 30 Nodes and Paths stay cheap (P-03)", () => {
  const nodes: NodeDto[] = [];
  const edges: EdgeDto[] = [];
  for (let i = 0; i < 15; i++) {
    nodes.push(step(`s${i}`, 32 + i * 320, i % 2 === 0 ? 32 : 220));
    if (i > 0) {
      edges.push(path(`e${i}`, `s${i - 1}`, `s${i}`, i % 3 === 0 ? "longish condition text" : ""));
    }
  }
  const t0 = performance.now();
  const placed = layoutLane(nodes, edges);
  expect(performance.now() - t0).toBeLessThan(50);
  expect(Object.keys(placed)).toHaveLength(15);
});
