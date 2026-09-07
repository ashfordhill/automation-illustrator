import { expect, test } from "vitest";
import { ActorKind, RobotKind, SplitKind, StepKind, WorkflowNodeKind } from "./catalogs";
import { MSG, connectNodes } from "./commands";
import { isConvex, validateWorkflow } from "./graph";
import {
  addAfterStep,
  applyAfterOnlyRemoval,
  assignMergeGroupWho,
  afterAwareRemovalCandidateIds,
  connectAfter,
  createMergeGroup,
  expandMergeSelection,
  planAfterOnlyRemoval,
  removeMergeGroup,
} from "./merge";
import { emptyAfterOverlay, type EdgeDto, type NodeDto, type StepNodeDto, type WorkflowDoc } from "./types";

function step(id: string, y = 0, x = 0): StepNodeDto {
  return {
    id,
    type: WorkflowNodeKind.Step,
    position: { x, y },
    stepKind: StepKind.Other,
    title: id,
    detail: "",
    split: SplitKind.Exclusive,
  };
}

function data(id: string, y = 0, x = 0): NodeDto {
  return {
    id,
    type: WorkflowNodeKind.DataField,
    position: { x, y },
    label: id,
  };
}

function path(id: string, source: string, target: string, label = "", dashed?: boolean): EdgeDto {
  return dashed === undefined
    ? { id, source, target, label }
    : { id, source, target, label, dashed };
}

function human(id = "h1") {
  return { id, kind: ActorKind.Human, name: "Ada", color: "#f4c6d4", role: "worker" };
}

function robot(id = "r1") {
  return {
    id,
    kind: ActorKind.Robot,
    name: "Robot",
    color: "#8aa8b8",
    robotKind: RobotKind.Script,
  };
}

function doc(nodes: NodeDto[], edges: EdgeDto[], extra?: Partial<WorkflowDoc>): WorkflowDoc {
  return {
    version: 2,
    actors: extra?.actors ?? [human(), robot()],
    nodes,
    edges,
    assignments: extra?.assignments ?? Object.fromEntries(nodes.filter((n) => n.type === "step").map((n) => [n.id, "h1"])),
    after: extra?.after ?? {
      ...emptyAfterOverlay(),
      assignments: Object.fromEntries(nodes.filter((n) => n.type === "step").map((n) => [n.id, "h1"])),
    },
  };
}

test("expandMergeSelection closes a chain with Data supporting internals (MG-03)", () => {
  const d = doc(
    [step("a", 0, 0), data("d", 0, 100), step("b", 0, 200), step("c", 0, 300)],
    [path("e1", "a", "d"), path("e2", "d", "b"), path("e3", "b", "c")],
  );
  const preview = expandMergeSelection(d, ["a", "c"]);
  expect(preview.ok).toBe(true);
  if (!preview.ok) return;
  expect(preview.value.memberIds).toEqual(["a", "b", "c"]);
  expect(preview.value.supportingIds).toEqual(["d"]);
});

test("disconnected sibling Steps are rejected (MG-04)", () => {
  const d = doc(
    [step("r"), step("a", 0, 100), step("b", 40, 100)],
    [path("e1", "r", "a"), path("e2", "r", "b")],
  );
  const preview = expandMergeSelection(d, ["a", "b"]);
  expect(preview.ok).toBe(false);
  if (preview.ok) return;
  expect(preview.message).toBe(MSG.mergeDisconnected);
});

test("Data and After-only Steps cannot be merge members (MG-02)", () => {
  const d = doc(
    [step("a"), data("d", 0, 100), step("b", 0, 200)],
    [path("e1", "a", "d"), path("e2", "d", "b")],
    {
      after: {
        ...emptyAfterOverlay(),
        extraNodes: [step("x", 0, 400)],
        extraEdges: [path("ex", "b", "x")],
        assignments: { a: "h1", b: "h1", x: "r1" },
      },
    },
  );
  expect(expandMergeSelection(d, ["d"]).ok).toBe(false);
  expect(expandMergeSelection(d, ["x"]).ok).toBe(false);
});

test("createMergeGroup assigns the default Robot and unmerge keeps Who (MG-06, MG-07)", () => {
  const d = doc(
    [step("a"), step("b", 0, 200)],
    [path("e1", "a", "b")],
  );
  const merged = createMergeGroup(d, ["a", "b"], "g1");
  expect(merged.ok).toBe(true);
  if (!merged.ok) return;
  expect(merged.value.after.groups).toEqual([{ id: "g1", memberIds: ["a", "b"] }]);
  expect(merged.value.after.assignments.a).toBe("r1");
  expect(merged.value.after.assignments.b).toBe("r1");
  const who = assignMergeGroupWho(merged.value, "g1", "h1");
  expect(who.ok).toBe(true);
  if (!who.ok) return;
  expect(who.value.after.assignments.a).toBe("h1");
  const undone = removeMergeGroup(who.value, "g1");
  expect(undone.ok).toBe(true);
  if (!undone.ok) return;
  expect(undone.value.after.groups).toEqual([]);
  expect(undone.value.after.assignments.a).toBe("h1");
  expect(undone.value.after.assignments.b).toBe("h1");
});

test("createMergeGroup auto-creates a Script Robot when none exist (NA-04)", () => {
  const d = doc([step("a")], [], { actors: [human()] });
  const merged = createMergeGroup(d, ["a"], "g1");
  expect(merged.ok).toBe(true);
  if (!merged.ok) return;
  expect(merged.value.actors.some((a) => a.kind === ActorKind.Robot && a.name === "Robot")).toBe(true);
  expect(validateWorkflow(merged.value)).toEqual([]);
});

test("selecting members of two groups flattens into one (MG-05)", () => {
  const d = doc(
    [step("a", 0, 0), step("b", 0, 100), step("c", 0, 200), step("d", 0, 300)],
    [path("e1", "a", "b"), path("e2", "b", "c"), path("e3", "c", "d")],
    {
      after: {
        ...emptyAfterOverlay(),
        groups: [
          { id: "g1", memberIds: ["a", "b"] },
          { id: "g2", memberIds: ["c", "d"] },
        ],
        assignments: { a: "r1", b: "r1", c: "r1", d: "r1" },
      },
    },
  );
  const flat = createMergeGroup(d, ["b", "c"]);
  expect(flat.ok).toBe(true);
  if (!flat.ok) return;
  expect(flat.value.after.groups).toHaveLength(1);
  expect(flat.value.after.groups[0]?.memberIds).toEqual(["a", "b", "c", "d"]);
  expect(flat.value.after.groups[0]?.id).toBe("g1");
});

test("Before connect that would break convexity is rejected (MG-10)", () => {
  const d = doc(
    [step("r"), step("a", 0, 100), data("mid", 0, 200), step("c", 0, 300), step("out", 80, 200)],
    [
      path("e0", "r", "a"),
      path("e1", "a", "mid"),
      path("e2", "mid", "c"),
      path("e3", "r", "out"),
      path("e4", "out", "c"),
    ],
    {
      after: {
        ...emptyAfterOverlay(),
        groups: [{ id: "g1", memberIds: ["a", "c"] }],
        assignments: { r: "h1", a: "r1", c: "r1", out: "h1" },
      },
    },
  );
  expect(isConvex(["a", "c"], d.nodes, d.edges)).toBe(true);
  const blocked = connectNodes(d, "a", "out");
  expect(blocked.ok).toBe(false);
  if (blocked.ok) return;
  expect(blocked.message).toMatch(/Unmerge first/);
  expect(blocked.message).toMatch(/Other a, Other c/);
});

test("connectAfter and addAfterStep stay off the Before graph (BA-06, BA-07)", () => {
  const d = doc([step("a"), step("b", 0, 200)], [path("e1", "a", "b")]);
  const extra = addAfterStep(d, "b", step("x", 0, 400));
  expect(extra.ok).toBe(true);
  if (!extra.ok) return;
  expect(extra.value.nodes.map((n) => n.id)).toEqual(["a", "b"]);
  expect(extra.value.after.extraNodes.map((n) => n.id)).toEqual(["x"]);
  expect(extra.value.after.assignments.x).toBe("r1");
  const linked = connectAfter(extra.value, "a", "x");
  expect(linked.ok).toBe(true);
  if (!linked.ok) return;
  expect(linked.value.after.extraEdges.some((e) => e.source === "a" && e.target === "x")).toBe(true);
  const cycled = connectAfter(linked.value, "x", "a");
  expect(cycled.ok).toBe(false);
});

test("After-only removal restitches extra Paths and omits the Step (BA-07)", () => {
  const d = doc([step("a"), step("b", 0, 200)], [path("e1", "a", "b")], {
    after: {
      ...emptyAfterOverlay(),
      extraNodes: [step("x", 0, 400), step("y", 0, 600)],
      extraEdges: [path("ex", "b", "x"), path("ey", "x", "y")],
      assignments: { a: "h1", b: "h1", x: "r1", y: "r1" },
    },
  });
  const planned = planAfterOnlyRemoval(d, "x");
  expect(planned.ok).toBe(true);
  if (!planned.ok) return;
  const applied = applyAfterOnlyRemoval(d, planned.value);
  expect(applied.ok).toBe(true);
  if (!applied.ok) return;
  expect(applied.value.after.extraNodes.map((n) => n.id)).toEqual(["y"]);
  expect(applied.value.after.extraEdges.some((e) => e.source === "b" && e.target === "y")).toBe(true);
  expect(applied.value.nodes.map((n) => n.id)).toEqual(["a", "b"]);
  expect(validateWorkflow(applied.value)).toEqual([]);
});

test("After-only removal picker lists the extra Step, not Before Nodes (BA-07)", () => {
  const d = doc([step("a"), step("b", 0, 200)], [path("e1", "a", "b")], {
    after: {
      ...emptyAfterOverlay(),
      extraNodes: [step("x", 0, 400)],
      extraEdges: [path("ex", "b", "x")],
      assignments: { a: "h1", b: "h1", x: "r1" },
    },
  });
  expect(afterAwareRemovalCandidateIds(d, "x")).toEqual(["x"]);
});
