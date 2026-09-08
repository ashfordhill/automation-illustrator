import { expect, test } from "vitest";
import { SplitKind, StepKind, WorkflowNodeKind } from "./catalogs";
import {
  applyConnectStroke,
  applyDashForSplit,
  defaultRemovalCandidateId,
  edgeIsDotted,
  outgoingSorted,
  removalCandidateIds,
  rootNodeId,
  splitDefaultDashed,
  wouldCreateCycle,
} from "./graph";
import type { EdgeDto, NodeDto } from "./types";

function step(id: string, y: number): NodeDto {
  return {
    id,
    type: WorkflowNodeKind.Step,
    position: { x: 0, y },
    stepKind: StepKind.Other,
    title: "",
    detail: "",
    split: SplitKind.Exclusive,
  };
}

test("outgoingSorted orders by target y then x", () => {
  const nodes = [step("a", 0), step("b", 40), step("c", 10)];
  const edges: EdgeDto[] = [
    { id: "e2", source: "a", target: "b", label: "" },
    { id: "e1", source: "a", target: "c", label: "" },
  ];
  expect(outgoingSorted(nodes, edges, "a").map((e) => e.id)).toEqual(["e1", "e2"]);
});

test("a PositionMap reorders siblings and the WG-09 default follows it", () => {
  const nodes = [step("a", 0), step("b", 40), step("c", 10)];
  const edges: EdgeDto[] = [
    { id: "e2", source: "a", target: "b", label: "" },
    { id: "e1", source: "a", target: "c", label: "" },
  ];
  const displayed = { a: { x: 0, y: 0 }, b: { x: 300, y: 0 }, c: { x: 300, y: 200 } };
  expect(outgoingSorted(nodes, edges, "a", displayed).map((e) => e.id)).toEqual(["e2", "e1"]);
  expect(removalCandidateIds(nodes, edges, "a", displayed)).toEqual(["b", "c"]);
  expect(defaultRemovalCandidateId(nodes, edges, "a")).toBe("c");
  expect(defaultRemovalCandidateId(nodes, edges, "a", displayed)).toBe("b");
  /* Ids missing from the map fall back to saved positions. */
  expect(outgoingSorted(nodes, edges, "a", { b: { x: 0, y: 5 } }).map((e) => e.id)).toEqual(["e2", "e1"]);
});

function data(id: string, y: number): NodeDto {
  return {
    id,
    type: WorkflowNodeKind.DataField,
    position: { x: 0, y },
    label: "d",
  };
}

test("PC-02: omitted stroke follows Split; an explicit dashed flag wins even on one outgoing", () => {
  const nodes = [step("a", 0), step("b", 0), step("c", 40)];
  const one: EdgeDto[] = [{ id: "e1", source: "a", target: "b", label: "" }];
  expect(edgeIsDotted(nodes, one, one[0]!)).toBe(false);
  expect(edgeIsDotted(nodes, one, { ...one[0]!, dashed: true })).toBe(true);
  expect(splitDefaultDashed(SplitKind.Exclusive, 1)).toBe(false);
  expect(splitDefaultDashed(SplitKind.Exclusive, 2)).toBe(true);
  expect(splitDefaultDashed(SplitKind.Parallel, 2)).toBe(false);

  const two: EdgeDto[] = [
    { id: "e1", source: "a", target: "b", label: "" },
    { id: "e2", source: "a", target: "c", label: "" },
  ];
  expect(edgeIsDotted(nodes, two, two[0]!)).toBe(true);
  expect(edgeIsDotted(nodes, two, two[1]!)).toBe(true);

  const mixed: EdgeDto[] = [
    { id: "e1", source: "a", target: "b", label: "", dashed: false },
    { id: "e2", source: "a", target: "c", label: "", dashed: true },
  ];
  expect(edgeIsDotted(nodes, mixed, mixed[0]!)).toBe(false);
  expect(edgeIsDotted(nodes, mixed, mixed[1]!)).toBe(true);

  const fromData = [data("d", 0), step("b", 0)];
  const dataOut: EdgeDto[] = [{ id: "e1", source: "d", target: "b", label: "", dashed: true }];
  expect(edgeIsDotted(fromData, dataOut, dataOut[0]!)).toBe(true);
});

test("PC-03: changing Split re-applies the default stroke to every outgoing Path", () => {
  const nodes = [
    { ...step("a", 0), split: SplitKind.Exclusive },
    step("b", 0),
    step("c", 40),
  ];
  const edges: EdgeDto[] = [
    { id: "e1", source: "a", target: "b", label: "", dashed: false },
    { id: "e2", source: "a", target: "c", label: "", dashed: false },
  ];
  const oneOf = applyDashForSplit(nodes, edges, "a");
  expect(oneOf.map((e) => e.dashed)).toEqual([true, true]);

  const everyNodes = nodes.map((n) =>
    n.id === "a" ? { ...n, split: SplitKind.Parallel } : n,
  );
  const every = applyDashForSplit(everyNodes, oneOf, "a");
  expect(every.map((e) => e.dashed)).toEqual([false, false]);
});

test("applyConnectStroke stamps Split defaults when a second Path appears", () => {
  const nodes = [step("a", 0), step("b", 0), step("c", 40)];
  const first: EdgeDto[] = [{ id: "e1", source: "a", target: "b", label: "", dashed: false }];
  const afterFirst = applyConnectStroke(nodes, first, "a", "e1", 0);
  expect(afterFirst[0]?.dashed).toBe(false);

  const two: EdgeDto[] = [
    ...afterFirst,
    { id: "e2", source: "a", target: "c", label: "", dashed: false },
  ];
  const afterSecond = applyConnectStroke(nodes, two, "a", "e2", 1);
  expect(afterSecond.map((e) => e.dashed)).toEqual([true, true]);

  const three: EdgeDto[] = [
    { id: "e1", source: "a", target: "b", label: "", dashed: false },
    { id: "e2", source: "a", target: "c", label: "", dashed: true },
    { id: "e3", source: "a", target: "b", label: "x", dashed: false },
  ];
  const afterThird = applyConnectStroke(nodes, three, "a", "e3", 2);
  expect(afterThird.find((e) => e.id === "e1")?.dashed).toBe(false);
  expect(afterThird.find((e) => e.id === "e3")?.dashed).toBe(true);
});

test("rootNodeId is the unique Node with no incoming Path", () => {
  const nodes = [step("a", 0), step("b", 40)];
  expect(rootNodeId(nodes, [{ id: "e", source: "a", target: "b", label: "" }])).toBe("a");
  expect(rootNodeId(nodes, [])).toBeNull();
  expect(rootNodeId([], [])).toBeNull();
});

test("wouldCreateCycle detects self-loops and paths back to the source", () => {
  const edges: EdgeDto[] = [
    { id: "e1", source: "a", target: "b", label: "" },
    { id: "e2", source: "b", target: "c", label: "" },
  ];
  expect(wouldCreateCycle(edges, "c", "a")).toBe(true);
  expect(wouldCreateCycle(edges, "a", "a")).toBe(true);
  expect(wouldCreateCycle(edges, "a", "c")).toBe(false);
});

test("removal candidates skip the root; leaf defaults to itself (WG-08, WG-09)", () => {
  const nodes = [step("r", 0), step("a", 10), step("b", 40)];
  const edges: EdgeDto[] = [
    { id: "e1", source: "r", target: "a", label: "" },
    { id: "e2", source: "a", target: "b", label: "" },
  ];
  expect(removalCandidateIds(nodes, edges, "r")).toEqual(["a"]);
  expect(defaultRemovalCandidateId(nodes, edges, "r")).toBe("a");
  expect(removalCandidateIds(nodes, edges, "b")).toEqual(["b", "a"]);
  expect(defaultRemovalCandidateId(nodes, edges, "b")).toBe("b");
  expect(removalCandidateIds(nodes, edges, "a")).toEqual(["b", "a"]);
  expect(defaultRemovalCandidateId(nodes, edges, "a")).toBe("b");
  expect(defaultRemovalCandidateId([step("r", 0)], [], "r")).toBeNull();
});
