import { expect, test } from "vitest";
import { ActorKind, SplitKind, StepKind, WorkflowNodeKind } from "./catalogs";
import {
  MSG,
  addConnectedNode,
  applyNodeRemoval,
  collapseStroke,
  connectNodes,
  createRootStep,
  joinConditions,
  planNodeRemoval,
  pruneAfterOverlay,
  insertNodeOnPath,
  validatePairings,
  type RemovalPairing,
} from "./commands";
import { validateWorkflow } from "./graph";
import {
  emptyAfterOverlay,
  emptyWorkflow,
  type EdgeDto,
  type NodeDto,
  type StepNodeDto,
  type WorkflowDoc,
} from "./types";

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

function actor(id = "h1") {
  return {
    id,
    kind: ActorKind.Human,
    name: "Ada",
    color: "#f4c6d4",
    role: "worker",
  };
}

function doc(nodes: NodeDto[], edges: EdgeDto[], extra?: Partial<WorkflowDoc>): WorkflowDoc {
  return {
    version: 2,
    actors: extra?.actors ?? [actor()],
    nodes,
    edges,
    assignments: extra?.assignments ?? {},
    after: extra?.after ?? emptyAfterOverlay(),
  };
}

function pair(
  predecessorId: string,
  successorId: string,
  condition = "",
  dashed = false,
): RemovalPairing {
  return { predecessorId, successorId, condition, dashed };
}

test("joinConditions trims, skips empties, and joins with +", () => {
  expect(joinConditions("a", "b")).toBe("a + b");
  expect(joinConditions(" a ", "  ", "b")).toBe("a + b");
  expect(joinConditions("", "  ")).toBe("");
  expect(joinConditions("keep", "x", "y")).toBe("keep + x + y");
});

test("collapseStroke is dotted if any replaced Path was dotted (PC-04)", () => {
  expect(collapseStroke(false, false)).toBe(false);
  expect(collapseStroke(true, false)).toBe(true);
  expect(collapseStroke(false, true)).toBe(true);
  expect(collapseStroke(true, true)).toBe(true);
});

test("createRootStep puts the first Step on an empty board", () => {
  const result = createRootStep(emptyWorkflow(), step("s_root"), { beforeId: "h1", afterId: "h1" });
  expect(result.ok).toBe(false);

  const withActor = { ...emptyWorkflow(), actors: [actor()] };
  const ok = createRootStep(withActor, step("s_root"), { beforeId: "h1", afterId: "h1" });
  expect(ok.ok).toBe(true);
  if (!ok.ok) return;
  expect(ok.value.nodes.map((n) => n.id)).toEqual(["s_root"]);
  expect(ok.value.edges).toEqual([]);
  expect(validateWorkflow(ok.value)).toEqual([]);
});

test("createRootStep rejects a second root", () => {
  const rooted = createRootStep(
    { ...emptyWorkflow(), actors: [actor()] },
    step("s_root"),
    { beforeId: "h1" },
  );
  expect(rooted.ok).toBe(true);
  if (!rooted.ok) return;
  const blocked = createRootStep(rooted.value, step("s_two"), { beforeId: "h1" });
  expect(blocked.ok).toBe(false);
  if (blocked.ok) return;
  expect(blocked.code).toBe("not-empty");
});

test("connectNodes rejects self-loop, duplicate, root incoming, and cycle", () => {
  const board = doc(
    [step("r"), step("a", 40), step("b", 80)],
    [path("e1", "r", "a"), path("e2", "a", "b")],
  );
  expect(validateWorkflow(board)).toEqual([]);

  const loop = connectNodes(board, "a", "a");
  expect(loop.ok).toBe(false);
  if (!loop.ok) expect(loop.code).toBe("self-loop");

  const dup = connectNodes(board, "r", "a");
  expect(dup.ok).toBe(false);
  if (!dup.ok) {
    expect(dup.code).toBe("duplicate-path");
    expect(dup.message).toBe(MSG.duplicatePath);
  }

  const intoRoot = connectNodes(board, "b", "r");
  expect(intoRoot.ok).toBe(false);
  if (!intoRoot.ok) expect(intoRoot.code).toBe("root-incoming");

  const cycle = connectNodes(board, "b", "a");
  expect(cycle.ok).toBe(false);
  if (!cycle.ok) expect(cycle.code).toBe("cycle");

  expect(board.edges).toHaveLength(2);
});

test("addConnectedNode applies One of stroke to every outgoing Path (PC-02)", () => {
  const board = doc(
    [step("r"), step("a", 0, 40)],
    [path("e1", "r", "a", "", false)],
  );
  const added = addConnectedNode(board, "r", step("b", 80, 40));
  expect(added.ok).toBe(true);
  if (!added.ok) return;
  expect(added.value.edges.map((e) => e.dashed)).toEqual([true, true]);
});

test("connectNodes accepts a legal reconvergence Path", () => {
  const board = doc(
    [step("r"), step("a", 0, 40), step("b", 80, 40), step("c", 40, 80)],
    [path("e1", "r", "a"), path("e2", "r", "b"), path("e3", "a", "c")],
  );
  const result = connectNodes(board, "b", "c", { id: "e4", label: "also" });
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.value.edges.some((e) => e.source === "b" && e.target === "c")).toBe(true);
  expect(validateWorkflow(result.value)).toEqual([]);
});

test("addConnectedNode creates a reachable child in one step", () => {
  const board = doc([step("r")], []);
  const added = addConnectedNode(board, "r", step("s_child", 0, 40), {
    beforeId: "h1",
    afterId: "h1",
  });
  expect(added.ok).toBe(true);
  if (!added.ok) return;
  expect(validateWorkflow(added.value)).toEqual([]);
  expect(added.value.edges).toHaveLength(1);
});

test("planNodeRemoval blocks the root", () => {
  const board = doc([step("r"), step("a", 0, 40)], [path("e1", "r", "a")]);
  const plan = planNodeRemoval(board, "r");
  expect(plan.ok).toBe(false);
  if (!plan.ok) {
    expect(plan.code).toBe("root-removal");
    expect(plan.message).toBe(MSG.rootRemoval);
  }
});

test("leaf removal drops the Node and its incoming Path", () => {
  const board = doc(
    [step("r"), step("a", 0, 40), step("leaf", 0, 80)],
    [path("e1", "r", "a"), path("e2", "a", "leaf", "done")],
  );
  const plan = planNodeRemoval(board, "leaf");
  expect(plan.ok).toBe(true);
  if (!plan.ok) return;
  expect(plan.value.mode).toBe("auto");
  expect(plan.value.pairings).toEqual([]);
  const applied = applyNodeRemoval(board, plan.value);
  expect(applied.ok).toBe(true);
  if (!applied.ok) return;
  expect(applied.value.nodes.map((n) => n.id)).toEqual(["r", "a"]);
  expect(applied.value.edges.map((e) => e.id)).toEqual(["e1"]);
  expect(validateWorkflow(applied.value)).toEqual([]);
});

test("1:1 removal reconnects and joins conditions", () => {
  const board = doc(
    [step("r"), step("mid", 0, 40), step("tail", 0, 80)],
    [path("e1", "r", "mid", "first"), path("e2", "mid", "tail", "second")],
  );
  const plan = planNodeRemoval(board, "mid");
  expect(plan.ok).toBe(true);
  if (!plan.ok) return;
  expect(plan.value.mode).toBe("auto");
  expect(plan.value.pairings).toEqual([
    { predecessorId: "r", successorId: "tail", condition: "first + second", dashed: false },
  ]);
  const applied = applyNodeRemoval(board, plan.value);
  expect(applied.ok).toBe(true);
  if (!applied.ok) return;
  expect(applied.value.nodes.map((n) => n.id)).toEqual(["r", "tail"]);
  expect(applied.value.edges).toHaveLength(1);
  expect(applied.value.edges[0]).toMatchObject({
    source: "r",
    target: "tail",
    label: "first + second",
    dashed: false,
  });
  expect(validateWorkflow(applied.value)).toEqual([]);
});

test("1:N removal fans the predecessor to every successor", () => {
  const board = doc(
    [step("r"), step("n", 40, 40), step("a", 0, 80), step("b", 80, 80)],
    [
      path("e1", "r", "n"),
      path("e2", "n", "a", "up", true),
      path("e3", "n", "b", "down", false),
    ],
  );
  const plan = planNodeRemoval(board, "n");
  expect(plan.ok).toBe(true);
  if (!plan.ok) return;
  expect(plan.value.mode).toBe("auto");
  expect(plan.value.pairings.map((p) => [p.predecessorId, p.successorId, p.condition, p.dashed])).toEqual([
    ["r", "a", "up", true],
    ["r", "b", "down", false],
  ]);
  const applied = applyNodeRemoval(board, plan.value);
  expect(applied.ok).toBe(true);
  if (!applied.ok) return;
  expect(applied.value.edges).toHaveLength(2);
  expect(validateWorkflow(applied.value)).toEqual([]);
});

test("N:1 removal fans every predecessor onto the successor", () => {
  const board = doc(
    [step("r"), step("a", 0, 40), step("b", 80, 40), step("n", 40, 80), step("c", 40, 120)],
    [
      path("e1", "r", "a"),
      path("e2", "r", "b"),
      path("e3", "a", "n", "from-a"),
      path("e4", "b", "n", "from-b"),
      path("e5", "n", "c", "out"),
    ],
  );
  const plan = planNodeRemoval(board, "n");
  expect(plan.ok).toBe(true);
  if (!plan.ok) return;
  expect(plan.value.mode).toBe("auto");
  expect(plan.value.pairings).toHaveLength(2);
  const applied = applyNodeRemoval(board, plan.value);
  expect(applied.ok).toBe(true);
  if (!applied.ok) return;
  const labels = applied.value.edges
    .filter((e) => e.target === "c")
    .map((e) => `${e.source}:${e.label}`)
    .sort();
  expect(labels).toEqual(["a:from-a + out", "b:from-b + out"]);
  expect(validateWorkflow(applied.value)).toEqual([]);
});

test("M:N nearest pairings follow a displayed PositionMap over saved positions", () => {
  const board = doc(
    [
      step("r"),
      step("a", 0, 40),
      step("b", 100, 40),
      step("n", 50, 80),
      step("c", 0, 120),
      step("d", 100, 120),
    ],
    [
      path("e1", "r", "a"),
      path("e2", "r", "b"),
      path("e3", "a", "n"),
      path("e4", "b", "n"),
      path("e5", "n", "c"),
      path("e6", "n", "d"),
    ],
  );
  /* The derived layout shows a below b and c below d: the nearest pairing flips. */
  const displayed = {
    a: { x: 400, y: 300 },
    b: { x: 400, y: 0 },
    c: { x: 800, y: 300 },
    d: { x: 800, y: 0 },
  };
  const plan = planNodeRemoval(board, "n", displayed);
  expect(plan.ok).toBe(true);
  if (!plan.ok) return;
  expect(plan.value.pairings.map((p) => [p.predecessorId, p.successorId])).toEqual([
    ["b", "d"],
    ["a", "c"],
  ]);
  const applied = applyNodeRemoval(board, plan.value, plan.value.pairings, displayed);
  expect(applied.ok).toBe(true);
  if (!applied.ok) return;
  expect(validateWorkflow(applied.value)).toEqual([]);
});

test("M:N plan uses nearest visual pairings and stays preview", () => {
  const board = doc(
    [
      step("r"),
      step("a", 0, 40),
      step("b", 100, 40),
      step("n", 50, 80),
      step("c", 0, 120),
      step("d", 100, 120),
    ],
    [
      path("e1", "r", "a"),
      path("e2", "r", "b"),
      path("e3", "a", "n"),
      path("e4", "b", "n"),
      path("e5", "n", "c"),
      path("e6", "n", "d"),
    ],
  );
  const plan = planNodeRemoval(board, "n");
  expect(plan.ok).toBe(true);
  if (!plan.ok) return;
  expect(plan.value.mode).toBe("preview");
  expect(
    plan.value.pairings.map((p) => [p.predecessorId, p.successorId]),
  ).toEqual([
    ["a", "c"],
    ["b", "d"],
  ]);
  const applied = applyNodeRemoval(board, plan.value);
  expect(applied.ok).toBe(true);
  if (!applied.ok) return;
  expect(validateWorkflow(applied.value)).toEqual([]);
  expect(
    applied.value.edges
      .filter((e) => e.source === "a" || e.source === "b")
      .map((e) => `${e.source}->${e.target}`)
      .sort(),
  ).toEqual(["a->c", "b->d"]);
});

test("invalid pairing sets leave a successor without an incoming Path", () => {
  const preds = ["a", "b"];
  const succs = ["c", "d"];
  const missing = validatePairings([pair("a", "c")], preds, succs);
  expect(missing.ok).toBe(false);

  const outsider = validatePairings(
    [pair("a", "c"), pair("x", "d")],
    preds,
    succs,
  );
  expect(outsider.ok).toBe(false);

  const dup = validatePairings(
    [pair("a", "c"), pair("a", "c"), pair("b", "d")],
    preds,
    succs,
  );
  expect(dup.ok).toBe(false);

  const okSet = validatePairings([pair("a", "c"), pair("a", "d")], preds, succs);
  expect(okSet.ok).toBe(true);
});

test("applyNodeRemoval rejects an M:N pairing that drops a successor", () => {
  const board = doc(
    [
      step("r"),
      step("a", 0, 40),
      step("b", 100, 40),
      step("n", 50, 80),
      step("c", 0, 120),
      step("d", 100, 120),
    ],
    [
      path("e1", "r", "a"),
      path("e2", "r", "b"),
      path("e3", "a", "n"),
      path("e4", "b", "n"),
      path("e5", "n", "c"),
      path("e6", "n", "d"),
    ],
  );
  const plan = planNodeRemoval(board, "n");
  expect(plan.ok).toBe(true);
  if (!plan.ok) return;
  const blocked = applyNodeRemoval(board, plan.value, [pair("a", "c")]);
  expect(blocked.ok).toBe(false);
  if (!blocked.ok) expect(blocked.code).toBe("invalid-pairings");
});

test("duplicate collapse keeps the existing Path and joins conditions (WG-12)", () => {
  const board = doc(
    [step("r"), step("mid", 0, 40), step("tail", 0, 80)],
    [
      path("e1", "r", "mid", "via-mid"),
      path("e2", "mid", "tail", "then"),
      path("e3", "r", "tail", "direct"),
    ],
  );
  const plan = planNodeRemoval(board, "mid");
  expect(plan.ok).toBe(true);
  if (!plan.ok) return;
  const applied = applyNodeRemoval(board, plan.value);
  expect(applied.ok).toBe(true);
  if (!applied.ok) return;
  expect(applied.value.edges).toHaveLength(1);
  expect(applied.value.edges[0]).toMatchObject({
    id: "e3",
    source: "r",
    target: "tail",
    label: "direct + via-mid + then",
  });
  expect(validateWorkflow(applied.value)).toEqual([]);
});

test("duplicate collapse is dotted if any collapsed or existing Path was dotted (PC-04)", () => {
  const board = doc(
    [step("r"), step("mid", 0, 40), step("tail", 0, 80)],
    [
      path("e1", "r", "mid", "via", true),
      path("e2", "mid", "tail", "", false),
      path("e3", "r", "tail", "direct", false),
    ],
  );
  const plan = planNodeRemoval(board, "mid");
  expect(plan.ok).toBe(true);
  if (!plan.ok) return;
  expect(plan.value.pairings[0]?.dashed).toBe(true);
  const applied = applyNodeRemoval(board, plan.value);
  expect(applied.ok).toBe(true);
  if (!applied.ok) return;
  expect(applied.value.edges[0]?.dashed).toBe(true);
});

test("pruneAfterOverlay drops extra Paths and Who; groups stay empty", () => {
  const remaining = [step("r"), step("keep", 0, 40), step("other", 80, 40)];
  const remainingEdges = [path("e1", "r", "keep")];
  const after = {
    assignments: { gone: "h1", keep: "h1" },
    groups: [
      { id: "g_empty", memberIds: ["gone"] },
      { id: "g_ok", memberIds: ["keep"] },
    ],
    extraNodes: [
      {
        id: "s_extra",
        type: WorkflowNodeKind.Step,
        position: { x: 80, y: 0 },
        stepKind: StepKind.Other,
        title: "extra",
        detail: "",
        split: SplitKind.Exclusive,
      },
    ],
    extraEdges: [
      path("ex1", "gone", "s_extra"),
      path("ex2", "keep", "s_extra"),
    ],
  };
  const pruned = pruneAfterOverlay(after, "gone", remaining, remainingEdges);
  expect(pruned.after.extraEdges.map((e) => e.id)).toEqual(["ex2"]);
  expect(pruned.after.assignments).toEqual({ keep: "h1" });
  expect(pruned.after.groups).toEqual([]);
  expect(pruned.notices).toEqual([]);
  expect(pruned.after.extraNodes).toHaveLength(1);
});

test("BA-09 restitch keeps After-only Steps reachable after a Before-origin removal", () => {
  const originalNodes = [step("r"), step("mid", 0, 40), step("tail", 0, 80)];
  const originalEdges = [path("e1", "r", "mid"), path("e2", "mid", "tail")];
  const extraNode = step("s_extra", 0, 80);
  const board = doc(originalNodes, originalEdges, {
    assignments: { r: "h1", mid: "h1", tail: "h1" },
    after: {
      assignments: { r: "h1", mid: "h1", tail: "h1", s_extra: "h1" },
      groups: [],
      extraNodes: [extraNode],
      extraEdges: [path("ex1", "mid", "s_extra")],
    },
  });
  const plan = planNodeRemoval(board, "mid");
  expect(plan.ok).toBe(true);
  if (!plan.ok) return;
  const applied = applyNodeRemoval(board, plan.value);
  expect(applied.ok).toBe(true);
  if (!applied.ok) return;
  expect(validateWorkflow(applied.value)).toEqual([]);
  expect(applied.value.nodes.map((n) => n.id)).toEqual(["r", "tail"]);
  expect(applied.value.after.extraNodes).toHaveLength(1);
  expect(applied.value.after.extraEdges.some((e) => e.source === "r" && e.target === "s_extra")).toBe(
    true,
  );
  expect(applied.value.after.extraEdges.some((e) => e.source === "mid" || e.target === "mid")).toBe(
    false,
  );
});

test("removing a Data Node uses the same 1:1 restitch rules", () => {
  const board = doc(
    [step("r"), data("d1", 0, 40), step("tail", 0, 80)],
    [path("e1", "r", "d1", "in"), path("e2", "d1", "tail", "out")],
  );
  const plan = planNodeRemoval(board, "d1");
  expect(plan.ok).toBe(true);
  if (!plan.ok) return;
  const applied = applyNodeRemoval(board, plan.value);
  expect(applied.ok).toBe(true);
  if (!applied.ok) return;
  expect(applied.value.edges[0]).toMatchObject({
    source: "r",
    target: "tail",
    label: "in + out",
  });
  expect(validateWorkflow(applied.value)).toEqual([]);
});

test("insertNodeOnPath keeps the condition on S→T and leaves T→U unlabeled", () => {
  const board = doc(
    [step("r"), step("a", 0, 40), step("b", 0, 80), step("c", 40, 40)],
    [path("e1", "r", "a"), path("e2", "a", "b", "go"), path("e3", "r", "c")],
  );
  const result = insertNodeOnPath(board, "c", "e2");
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(validateWorkflow(result.value)).toEqual([]);
  expect(result.value.nodes.map((n) => n.id).sort()).toEqual(["a", "b", "c", "r"]);
  expect(result.value.edges.some((e) => e.source === "r" && e.target === "c")).toBe(false);
  const inPath = result.value.edges.find((e) => e.source === "a" && e.target === "c");
  const outPath = result.value.edges.find((e) => e.source === "c" && e.target === "b");
  expect(inPath?.label).toBe("go");
  expect(outPath?.label).toBe("");
});

test("insertNodeOnPath rejects the root, a self-drop, and a missing Path", () => {
  const board = doc(
    [step("r"), step("a", 0, 40), step("b", 0, 80)],
    [path("e1", "r", "a"), path("e2", "a", "b")],
  );
  const root = insertNodeOnPath(board, "r", "e2");
  expect(root.ok).toBe(false);
  if (!root.ok) expect(root.message).toBe(MSG.rootInsert);

  const self = insertNodeOnPath(board, "a", "e1");
  expect(self.ok).toBe(false);
  if (!self.ok) expect(self.message).toBe(MSG.insertSelf);

  const missing = insertNodeOnPath(board, "a", "nope");
  expect(missing.ok).toBe(false);
  if (!missing.ok) expect(missing.message).toBe(MSG.missingPath);
});
