import { expect, test } from "vitest";
import { freshBoard } from "../demos/oakParkInvoice";
import { AssignmentLane, IdPrefix, SplitKind, StepKind, WorkflowNodeKind, WORKFLOW_VERSION } from "./catalogs";
import { editLane, restartAfter } from "./lane";
import { nid } from "./ids";
import { ok } from "./commands";
import {
  afterFollowsBefore,
  emptyAfterOverlay,
  laneAssignments,
  laneBoard,
  settleAfter,
  type StepNodeDto,
  type WorkflowDoc,
} from "./types";

function step(id: string, title = ""): StepNodeDto {
  return {
    id,
    type: WorkflowNodeKind.Step,
    position: { x: 0, y: 0 },
    stepKind: StepKind.Other,
    title,
    detail: "",
    split: SplitKind.Exclusive,
  };
}

function boardWith(title: string, who: string): WorkflowDoc {
  const id = "s1";
  return {
    version: WORKFLOW_VERSION,
    actors: [],
    nodes: [step(id, title)],
    edges: [],
    assignments: { [id]: who },
    after: emptyAfterOverlay(),
  };
}

test("a following After reads Before, including Who", () => {
  const doc = boardWith("invoice", "h1");
  expect(afterFollowsBefore(doc)).toBe(true);
  expect(laneBoard(doc, AssignmentLane.After).nodes[0]?.id).toBe("s1");
  expect(laneAssignments(doc, AssignmentLane.After).s1).toBe("h1");
});

test("an After edit copies Before and does not write it", () => {
  const doc = boardWith("invoice", "h1");
  const edited = editLane(doc, AssignmentLane.After, (lane) =>
    ok({
      ...lane,
      nodes: lane.nodes.map((n) => (n.id === "s1" && n.type === "step" ? { ...n, title: "later" } : n)),
      assignments: { s1: "r1" },
    }),
  );
  expect(edited.ok).toBe(true);
  if (!edited.ok) return;
  expect(edited.value.nodes[0]).toMatchObject({ title: "invoice" });
  expect(edited.value.assignments.s1).toBe("h1");
  expect(edited.value.after.fork?.nodes[0]).toMatchObject({ title: "later" });
  expect(edited.value.after.fork?.assignments.s1).toBe("r1");
  expect(afterFollowsBefore(edited.value)).toBe(false);
});

test("Before edits leave an After copy alone", () => {
  const doc = boardWith("invoice", "h1");
  const forked = editLane(doc, AssignmentLane.After, (lane) =>
    ok({
      ...lane,
      nodes: lane.nodes.map((n) => (n.id === "s1" && n.type === "step" ? { ...n, title: "later" } : n)),
    }),
  );
  if (!forked.ok) throw new Error("fork");
  const next = editLane(forked.value, AssignmentLane.Before, (lane) =>
    ok({
      ...lane,
      nodes: lane.nodes.map((n) => (n.id === "s1" && n.type === "step" ? { ...n, title: "before" } : n)),
      assignments: { s1: "h2" },
    }),
  );
  expect(next.ok).toBe(true);
  if (!next.ok) return;
  expect(next.value.nodes[0]).toMatchObject({ title: "before" });
  expect(next.value.assignments.s1).toBe("h2");
  expect(next.value.after.fork?.nodes[0]).toMatchObject({ title: "later" });
  expect(next.value.after.fork?.assignments.s1).toBe("h1");
});

test("Restart drops the After copy", () => {
  const doc = boardWith("invoice", "h1");
  const forked = editLane(doc, AssignmentLane.After, (lane) =>
    ok({ ...lane, nodes: lane.nodes.filter((n) => n.id !== "s1"), edges: [], assignments: {} }),
  );
  if (!forked.ok) throw new Error("fork");
  const reset = restartAfter(forked.value);
  expect(afterFollowsBefore(reset)).toBe(true);
  expect(laneBoard(reset, AssignmentLane.After).nodes).toHaveLength(1);
  const fresh = freshBoard();
  expect(restartAfter(fresh)).toBe(fresh);
});

test("legacy After Who becomes a fork; a matching map stays a mirror", () => {
  const diverged = settleAfter({
    ...boardWith("invoice", "h1"),
    after: { ...emptyAfterOverlay(), assignments: { s1: "r1" } },
  });
  expect(diverged.after.fork?.assignments.s1).toBe("r1");
  expect(diverged.after.assignments).toEqual({});

  const same = settleAfter({
    ...boardWith("invoice", "h1"),
    after: { ...emptyAfterOverlay(), assignments: { s1: "h1" } },
  });
  expect(same.after.fork).toBeNull();

  const extraId = nid(IdPrefix.Step);
  const withExtra = settleAfter({
    ...boardWith("invoice", "h1"),
    after: {
      ...emptyAfterOverlay(),
      extraNodes: [step(extraId, "receipt")],
      assignments: { s1: "h1", [extraId]: "r1" },
    },
  });
  expect(withExtra.after.fork?.nodes.map((n) => n.id)).toEqual(["s1", extraId]);
  expect(withExtra.after.extraNodes).toEqual([]);
});
