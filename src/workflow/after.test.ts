import { expect, test } from "vitest";
import {
  addAfterStep,
  afterAwareRemovalCandidateIds,
  applyAfterOnlyRemoval,
  connectAfter,
  planAfterOnlyRemoval,
} from "./after";
import { ActorKind, RobotKind, SplitKind, StepKind, WorkflowNodeKind } from "./catalogs";
import { validateWorkflow } from "./graph";
import { parseDocument } from "./migrate";
import { emptyAfterOverlay, UNFOLD_NOTICE, unfoldMergeGroups, type EdgeDto, type NodeDto, type StepNodeDto, type WorkflowDoc } from "./types";
import { MAILROOM_IDS, robotMailroom } from "../demos/robotMailroom";

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

test("addAfterStep inbound creates an After-only Path into the host", () => {
  const d = doc([step("a"), step("b", 0, 200)], [path("e1", "a", "b")]);
  const extra = addAfterStep(d, "b", step("x", 0, 400), { inbound: true });
  expect(extra.ok).toBe(true);
  if (!extra.ok) return;
  expect(extra.value.after.extraEdges).toEqual([
    expect.objectContaining({ source: "x", target: "b" }),
  ]);
  expect(extra.value.nodes.map((n) => n.id)).toEqual(["a", "b"]);
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

test("load unfolds merge groups and keeps After Robot Who", () => {
  const mail = robotMailroom();
  const grouped = {
    ...mail,
    after: {
      ...mail.after,
      groups: [
        {
          id: MAILROOM_IDS.group,
          memberIds: [MAILROOM_IDS.scan, MAILROOM_IDS.lookup, MAILROOM_IDS.route],
        },
      ],
    },
  };
  const parsed = parseDocument(JSON.stringify(grouped));
  expect(parsed.ok).toBe(true);
  if (!parsed.ok) return;
  expect(parsed.unfolded).toBe(true);
  expect(parsed.doc.after.groups).toEqual([]);
  expect(parsed.doc.after.assignments[MAILROOM_IDS.scan]).toBe(MAILROOM_IDS.mailbot);
  expect(parsed.doc.after.assignments[MAILROOM_IDS.lookup]).toBe(MAILROOM_IDS.mailbot);
  expect(parsed.doc.after.assignments[MAILROOM_IDS.route]).toBe(MAILROOM_IDS.mailbot);
  expect(parsed.doc.after.extraNodes.map((n) => n.id)).toEqual([MAILROOM_IDS.receipt]);
  const again = unfoldMergeGroups(parsed.doc);
  expect(again.unfolded).toBe(false);
  expect(UNFOLD_NOTICE).toMatch(/unfolded/);
});
