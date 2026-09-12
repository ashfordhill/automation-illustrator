import { expect, test } from "vitest";
import { ActorKind, SplitKind, StepKind, WorkflowNodeKind } from "./catalogs";
import {
  MSG,
  addConnectedNode,
  applyNodeRemoval,
  collapseStroke,
  connectNodes,
  createRootNode,
  createRootStep,
  joinConditions,
  planNodeRemoval,
  pruneAfterOverlay,
  insertNodeOnPath,
  insertNodeOnBundle,
  nextTileAfterRemoval,
  removePath,
  canRemovePath,
  validatePairings,
  type RemovalPairing,
} from "./commands";
import { validateWorkflow } from "./graph";
import { oakParkInvoice, OAK_PARK_IDS } from "../demos/oakParkInvoice";
import { MAILROOM_IDS, robotMailroom } from "../demos/robotMailroom";
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

test("createRootNode accepts a Data root", () => {
  const ok = createRootNode(emptyWorkflow(), data("d_root"));
  expect(ok.ok).toBe(true);
  if (!ok.ok) return;
  expect(ok.value.nodes.map((n) => n.id)).toEqual(["d_root"]);
  expect(ok.value.assignments).toEqual({});
  expect(validateWorkflow(ok.value)).toEqual([]);
});

test("planNodeRemoval allows deleting the sole remaining Tile", () => {
  const board = doc([step("r")], []);
  const plan = planNodeRemoval(board, "r");
  expect(plan.ok).toBe(true);
  if (!plan.ok) return;
  expect(plan.value.mode).toBe("auto");
  const applied = applyNodeRemoval(board, plan.value);
  expect(applied.ok).toBe(true);
  if (!applied.ok) return;
  expect(applied.value.nodes).toEqual([]);
  expect(applied.value.edges).toEqual([]);
  expect(validateWorkflow(applied.value)).toEqual([]);
});

test("deleting the sole Tile prunes After extras", () => {
  const board = doc([step("r")], [], {
    after: {
      extraNodes: [step("extra", 0, 200)],
      extraEdges: [path("e_x", "r", "extra")],
      groups: [],
      assignments: {},
    },
  });
  const plan = planNodeRemoval(board, "r");
  expect(plan.ok).toBe(true);
  if (!plan.ok) return;
  const applied = applyNodeRemoval(board, plan.value);
  expect(applied.ok).toBe(true);
  if (!applied.ok) return;
  expect(applied.value.nodes).toEqual([]);
  expect(applied.value.after.extraNodes).toEqual([]);
  expect(applied.value.after.extraEdges).toEqual([]);
  expect(validateWorkflow(applied.value)).toEqual([]);
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

test("connectNodes rejects self-loop, duplicate, and cycle; allows fan-in", () => {
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

  const intoSource = connectNodes(board, "b", "r");
  expect(intoSource.ok).toBe(false);
  if (!intoSource.ok) expect(intoSource.code).toBe("cycle");

  const cycle = connectNodes(board, "b", "a");
  expect(cycle.ok).toBe(false);
  if (!cycle.ok) expect(cycle.code).toBe("cycle");

  expect(board.edges).toHaveLength(2);
});

test("connectNodes accepts a fan-in Path between existing Tiles", () => {
  const board = doc(
    [step("a"), step("data", 0, 200), step("b", 80, 0)],
    [path("e1", "a", "data"), path("e2", "a", "b")],
  );
  const fan = connectNodes(board, "b", "data");
  expect(fan.ok).toBe(true);
  if (!fan.ok) return;
  expect(validateWorkflow(fan.value)).toEqual([]);
  expect(fan.value.edges.some((e) => e.source === "b" && e.target === "data")).toBe(true);
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

test("removePath drops a redundant Path and rejects one that would split the board", () => {
  const diamond = doc(
    [step("r"), step("a", 0, 40), step("b", 80, 40), step("c", 40, 80)],
    [path("e1", "r", "a"), path("e2", "r", "b"), path("e3", "a", "c"), path("e4", "b", "c")],
  );
  expect(canRemovePath(diamond, "e3")).toBe(true);
  expect(canRemovePath(diamond, "e1")).toBe(true);
  const dropped = removePath(diamond, "e3");
  expect(dropped.ok).toBe(true);
  if (!dropped.ok) return;
  expect(dropped.value.edges.map((e) => e.id)).toEqual(["e1", "e2", "e4"]);
  expect(validateWorkflow(dropped.value)).toEqual([]);

  const chain = doc(
    [step("r"), step("a", 0, 40), step("b", 0, 80)],
    [path("e1", "r", "a"), path("e2", "a", "b")],
  );
  expect(canRemovePath(chain, "e1")).toBe(false);
  const bridge = removePath(chain, "e1");
  expect(bridge.ok).toBe(false);
  if (bridge.ok) return;
  expect(bridge.message).toBe(MSG.pathRemoval);
});

test("removePath rejects the only Path into an After-only Step", () => {
  const board = doc([step("a"), step("b", 0, 200)], [path("e1", "a", "b")], {
    after: {
      ...emptyAfterOverlay(),
      extraNodes: [step("x", 0, 400)],
      extraEdges: [path("ex", "b", "x")],
      assignments: { a: "h1", b: "h1", x: "h1" },
    },
  });
  const blocked = removePath(board, "ex");
  expect(blocked.ok).toBe(false);
  if (blocked.ok) return;
  expect(blocked.message).toBe(MSG.pathRemoval);
});

test("removePath on Oak Park / Mailroom reconverge Paths", () => {
  const oak = oakParkInvoice();
  expect(canRemovePath(oak, OAK_PARK_IDS.webAcct)).toBe(true);
  expect(canRemovePath(oak, OAK_PARK_IDS.gt)).toBe(true);
  expect(canRemovePath(oak, OAK_PARK_IDS.reviewTo3)).toBe(false);
  const dropped = removePath(oak, OAK_PARK_IDS.webAcct);
  expect(dropped.ok).toBe(true);
  if (!dropped.ok) return;
  expect(validateWorkflow(dropped.value)).toEqual([]);

  const mail = robotMailroom();
  expect(canRemovePath(mail, MAILROOM_IDS.e6)).toBe(true);
  expect(canRemovePath(mail, MAILROOM_IDS.e1)).toBe(false);
  expect(canRemovePath(mail, MAILROOM_IDS.extra)).toBe(false);
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
  expect(added.value.edges[0]).toEqual(expect.objectContaining({ source: "r", target: "s_child" }));
});

test("addConnectedNode inbound creates a predecessor Path", () => {
  const board = doc([step("r")], []);
  const added = addConnectedNode(
    board,
    "r",
    step("s_left", 0, -40),
    { beforeId: "h1", afterId: "h1", inbound: true },
  );
  expect(added.ok).toBe(true);
  if (!added.ok) return;
  expect(validateWorkflow(added.value)).toEqual([]);
  expect(added.value.edges).toEqual([
    expect.objectContaining({ source: "s_left", target: "r" }),
  ]);
});

test("addConnectedNode inbound inserts a parent in front of incoming Paths", () => {
  const oak = oakParkInvoice();
  const added = addConnectedNode(oak, OAK_PARK_IDS.web, step("s_new"), {
    beforeId: OAK_PARK_IDS.alice,
    afterId: OAK_PARK_IDS.alice,
    inbound: true,
  });
  expect(added.ok).toBe(true);
  if (!added.ok) return;
  expect(validateWorkflow(added.value)).toEqual([]);
  expect(added.value.edges.find((e) => e.id === OAK_PARK_IDS.gt)).toEqual(
    expect.objectContaining({
      source: OAK_PARK_IDS.read,
      target: "s_new",
      label: "invoice > $50,000",
      dashed: true,
    }),
  );
  expect(added.value.edges.some((e) => e.source === "s_new" && e.target === OAK_PARK_IDS.web && e.label === "")).toBe(
    true,
  );
  expect(added.value.edges.some((e) => e.source === OAK_PARK_IDS.read && e.target === OAK_PARK_IDS.web)).toBe(false);
  expect(added.value.edges.find((e) => e.id === OAK_PARK_IDS.lt)).toEqual(
    expect.objectContaining({ source: OAK_PARK_IDS.read, target: OAK_PARK_IDS.fs }),
  );
});

test("addConnectedNode inbound with two incoming Paths makes the new Tile the merge", () => {
  const board = doc(
    [step("a"), step("b", 80), step("m", 40, 80)],
    [path("e1", "a", "m", "one", true), path("e2", "b", "m", "two", true)],
    { assignments: { a: "h1", b: "h1", m: "h1" } },
  );
  const added = addConnectedNode(board, "m", step("p", 40, 40), {
    beforeId: "h1",
    afterId: "h1",
    inbound: true,
  });
  expect(added.ok).toBe(true);
  if (!added.ok) return;
  expect(validateWorkflow(added.value)).toEqual([]);
  expect(added.value.edges).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ source: "a", target: "p", label: "one", dashed: true }),
      expect.objectContaining({ source: "b", target: "p", label: "two", dashed: true }),
      expect.objectContaining({ source: "p", target: "m", label: "" }),
    ]),
  );
  expect(added.value.edges.some((e) => e.target === "m" && e.source !== "p")).toBe(false);
});

test("addConnectedNode outbound still forks an extra child Path", () => {
  const board = doc(
    [step("r"), step("a", 0, 80)],
    [path("e1", "r", "a")],
    { assignments: { r: "h1", a: "h1" } },
  );
  const added = addConnectedNode(board, "r", step("s_fork", 80, 80), {
    beforeId: "h1",
    afterId: "h1",
  });
  expect(added.ok).toBe(true);
  if (!added.ok) return;
  expect(validateWorkflow(added.value)).toEqual([]);
  expect(added.value.edges).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ source: "r", target: "a" }),
      expect.objectContaining({ source: "r", target: "s_fork" }),
    ]),
  );
});

test("planNodeRemoval allows a source with one child; splitting a fan is blocked", () => {
  const chain = doc([step("r"), step("a", 0, 40)], [path("e1", "r", "a")]);
  const plan = planNodeRemoval(chain, "r");
  expect(plan.ok).toBe(true);
  if (!plan.ok) return;
  const applied = applyNodeRemoval(chain, plan.value);
  expect(applied.ok).toBe(true);
  if (!applied.ok) return;
  expect(applied.value.nodes.map((n) => n.id)).toEqual(["a"]);

  const fan = doc(
    [step("r"), step("a", 0, 40), step("b", 80, 40)],
    [path("e1", "r", "a"), path("e2", "r", "b")],
  );
  const fanPlan = planNodeRemoval(fan, "r");
  expect(fanPlan.ok).toBe(true);
  if (!fanPlan.ok) return;
  const split = applyNodeRemoval(fan, fanPlan.value);
  expect(split.ok).toBe(false);
  if (!split.ok) {
    expect(split.code).toBe("board-split");
    expect(split.message).toBe(MSG.boardSplit);
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

test("1:1 removal skips a restitch when Data already reaches the successor", () => {
  const board = doc(
    [step("a1"), data("d", 0, 40), step("a2", 40, 40), step("a3", 0, 80)],
    [path("e1", "a1", "a2"), path("e2", "a2", "a3"), path("e3", "a1", "d"), path("e4", "d", "a3")],
  );
  const plan = planNodeRemoval(board, "a2");
  expect(plan.ok).toBe(true);
  if (!plan.ok) return;
  expect(plan.value.mode).toBe("auto");
  const applied = applyNodeRemoval(board, plan.value);
  expect(applied.ok).toBe(true);
  if (!applied.ok) return;
  expect(applied.value.nodes.map((n) => n.id).sort()).toEqual(["a1", "a3", "d"]);
  expect(applied.value.edges).toEqual([
    expect.objectContaining({ source: "a1", target: "d" }),
    expect.objectContaining({ source: "d", target: "a3" }),
  ]);
  expect(applied.value.edges.some((e) => e.source === "a1" && e.target === "a3")).toBe(false);
  expect(validateWorkflow(applied.value)).toEqual([]);
  expect(canRemovePath(applied.value, applied.value.edges[0]!.id)).toBe(false);
});

test("1:N restitch keeps the Data child and skips the shortcut onto Data’s successor", () => {
  const board = doc(
    [step("a1"), step("a2", 0, 40), data("d", 40, 80), step("a3", 0, 80)],
    [path("e1", "a1", "a2"), path("e2", "a2", "a3"), path("e3", "a2", "d"), path("e4", "d", "a3")],
  );
  const plan = planNodeRemoval(board, "a2");
  expect(plan.ok).toBe(true);
  if (!plan.ok) return;
  const applied = applyNodeRemoval(board, plan.value);
  expect(applied.ok).toBe(true);
  if (!applied.ok) return;
  expect(applied.value.edges).toEqual([
    expect.objectContaining({ source: "d", target: "a3" }),
    expect.objectContaining({ source: "a1", target: "d" }),
  ]);
  expect(applied.value.edges.some((e) => e.source === "a1" && e.target === "a3")).toBe(false);
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

test("insertNodeOnPath does not leave a bypass restitch when Data already reaches the host", () => {
  const board = doc(
    [step("a1"), step("a2", 0, 40), data("d", 40, 40), step("a3", 0, 80)],
    [path("e1", "a1", "a2"), path("e2", "a2", "a3"), path("e3", "a1", "d"), path("e4", "d", "a3")],
  );
  const result = insertNodeOnPath(board, "a2", "e4");
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(validateWorkflow(result.value)).toEqual([]);
  expect(result.value.edges.some((e) => e.source === "a1" && e.target === "a3")).toBe(false);
  expect(result.value.edges.some((e) => e.source === "d" && e.target === "a2")).toBe(true);
  expect(result.value.edges.some((e) => e.source === "a2" && e.target === "a3")).toBe(true);
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

test("insertNodeOnPath can drop a fan-out child onto the sibling Path", () => {
  const oak = oakParkInvoice();
  const { web, fs, read, lt } = OAK_PARK_IDS;
  const result = insertNodeOnPath(oak, web, lt);
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(validateWorkflow(result.value)).toEqual([]);
  expect(result.value.edges.some((e) => e.id === lt)).toBe(false);
  expect(result.value.edges.some((e) => e.source === read && e.target === web)).toBe(true);
  expect(result.value.edges.some((e) => e.source === web && e.target === fs)).toBe(true);
  const inPath = result.value.edges.find((e) => e.source === read && e.target === web);
  expect(inPath?.label).toBe("invoice < $50,000");
});

test("insertNodeOnPath can move a source onto a downstream Path; rejects self-drop", () => {
  const board = doc(
    [step("r"), step("a", 0, 40), step("b", 0, 80)],
    [path("e1", "r", "a"), path("e2", "a", "b")],
  );
  const moved = insertNodeOnPath(board, "r", "e2");
  expect(moved.ok).toBe(true);
  if (!moved.ok) return;
  expect(validateWorkflow(moved.value)).toEqual([]);
  expect(moved.value.edges.some((e) => e.source === "a" && e.target === "r")).toBe(true);
  expect(moved.value.edges.some((e) => e.source === "r" && e.target === "b")).toBe(true);

  const self = insertNodeOnPath(board, "a", "e1");
  expect(self.ok).toBe(false);
  if (!self.ok) expect(self.message).toBe(MSG.insertSelf);

  const missing = insertNodeOnPath(board, "a", "nope");
  expect(missing.ok).toBe(false);
  if (!missing.ok) expect(missing.message).toBe(MSG.missingPath);
});

test("insertNodeOnBundle merge: restitch T then every incoming → T and T → U", () => {
  const board = doc(
    [step("a"), step("b", 40), step("u", 20, 80), step("t", 20, 160), step("z", 20, 240)],
    [
      path("e1", "a", "u", "top"),
      path("e2", "b", "u", "bot"),
      path("e3", "u", "t"),
      path("e4", "t", "z"),
    ],
  );
  const result = insertNodeOnBundle(board, "t", { role: "merge", hostId: "u" });
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(validateWorkflow(result.value)).toEqual([]);
  expect(result.value.edges.some((e) => e.source === "a" && e.target === "t" && e.label === "top")).toBe(true);
  expect(result.value.edges.some((e) => e.source === "b" && e.target === "t" && e.label === "bot")).toBe(true);
  expect(result.value.edges.some((e) => e.source === "t" && e.target === "u" && e.label === "")).toBe(true);
  expect(result.value.edges.some((e) => e.source === "u" && e.target === "z")).toBe(true);
  expect(result.value.edges.some((e) => e.source === "u" && e.target === "t")).toBe(false);
  expect(result.value.edges.some((e) => e.target === "u" && (e.source === "a" || e.source === "b"))).toBe(false);

  const onBundle = insertNodeOnBundle(board, "a", { role: "merge", hostId: "u" });
  expect(onBundle.ok).toBe(false);
  if (!onBundle.ok) expect(onBundle.message).toBe(MSG.insertSelf);

  const hostSelf = insertNodeOnBundle(board, "u", { role: "merge", hostId: "u" });
  expect(hostSelf.ok).toBe(false);
});

test("insertNodeOnBundle split: S → T then T inherits the outgoing Paths", () => {
  const board = doc(
    [step("r"), step("s", 0, 80), step("a", 0, 160), step("b", 40, 160), step("t", 40, 80)],
    [
      path("e0", "r", "s"),
      path("e1", "s", "a", "left"),
      path("e2", "s", "b", "right"),
      path("e3", "r", "t"),
    ],
  );
  const result = insertNodeOnBundle(board, "t", { role: "split", hostId: "s" });
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(validateWorkflow(result.value)).toEqual([]);
  expect(result.value.edges.some((e) => e.source === "s" && e.target === "t")).toBe(true);
  expect(result.value.edges.some((e) => e.source === "t" && e.target === "a" && e.label === "left")).toBe(true);
  expect(result.value.edges.some((e) => e.source === "t" && e.target === "b" && e.label === "right")).toBe(true);
  expect(result.value.edges.some((e) => e.source === "s" && e.target === "a")).toBe(false);
  expect(result.value.edges.some((e) => e.source === "r" && e.target === "t")).toBe(false);

  const childOnBundle = insertNodeOnBundle(board, "a", { role: "split", hostId: "s" });
  expect(childOnBundle.ok).toBe(false);
  if (!childOnBundle.ok) expect(childOnBundle.message).toBe(MSG.insertSelf);
});

test("insertNodeOnBundle merge on Oak Park Write onto Account # inbound", () => {
  const oak = oakParkInvoice();
  const { enter, acct, web, fs, review } = OAK_PARK_IDS;
  const result = insertNodeOnBundle(oak, enter, { role: "merge", hostId: acct });
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(validateWorkflow(result.value)).toEqual([]);
  expect(result.value.edges.some((e) => e.source === web && e.target === enter)).toBe(true);
  expect(result.value.edges.some((e) => e.source === fs && e.target === enter)).toBe(true);
  expect(result.value.edges.some((e) => e.source === enter && e.target === acct)).toBe(true);
  expect(result.value.edges.some((e) => e.source === acct && e.target === review)).toBe(true);
});

test("insertNodeOnBundle split on Oak Park Account # onto Read trunk", () => {
  const oak = oakParkInvoice();
  const { read, acct, web, fs, enter } = OAK_PARK_IDS;
  const result = insertNodeOnBundle(oak, acct, { role: "split", hostId: read });
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(validateWorkflow(result.value)).toEqual([]);
  expect(result.value.edges.some((e) => e.source === read && e.target === acct)).toBe(true);
  expect(result.value.edges.some((e) => e.source === acct && e.target === web)).toBe(true);
  expect(result.value.edges.some((e) => e.source === acct && e.target === fs)).toBe(true);
  expect(result.value.edges.some((e) => e.source === web && e.target === enter)).toBe(true);
  expect(result.value.edges.some((e) => e.source === fs && e.target === enter)).toBe(true);
});

test("nextTileAfterRemoval prefers the parent, then a remaining child, else none", () => {
  const chain = doc(
    [step("r"), step("a", 0, 40), step("leaf", 0, 80)],
    [path("e1", "r", "a"), path("e2", "a", "leaf")],
  );
  const withoutLeaf = {
    ...chain,
    nodes: chain.nodes.filter((n) => n.id !== "leaf"),
    edges: chain.edges.filter((e) => e.target !== "leaf"),
  };
  expect(nextTileAfterRemoval(withoutLeaf, ["a"], [])).toBe("a");

  const withoutRoot = {
    ...chain,
    nodes: chain.nodes.filter((n) => n.id !== "r"),
    edges: chain.edges.filter((e) => e.source !== "r"),
  };
  expect(nextTileAfterRemoval(withoutRoot, [], ["a"])).toBe("a");

  const empty = doc([], []);
  expect(nextTileAfterRemoval(empty, ["r"], ["a"])).toBeNull();
});
