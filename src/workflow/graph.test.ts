import { expect, test } from "vitest";
import { SplitKind, StepKind, WorkflowNodeKind } from "./catalogs";
import { edgeIsDotted, outgoingSorted, rootNodeId, wouldCreateCycle } from "./graph";
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

test("edgeIsDotted: exclusive split first solid, rest dotted when dashed is omitted", () => {
  const nodes = [step("a", 0), step("b", 0), step("c", 40)];
  const edges: EdgeDto[] = [
    { id: "e1", source: "a", target: "b", label: "" },
    { id: "e2", source: "a", target: "c", label: "" },
  ];
  expect(edgeIsDotted(nodes, edges, edges[0])).toBe(false);
  expect(edgeIsDotted(nodes, edges, edges[1])).toBe(true);
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
