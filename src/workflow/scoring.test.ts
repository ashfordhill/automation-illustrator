import { expect, test } from "vitest";
import { ActorKind, SplitKind, StepKind, WorkflowNodeKind, WORKFLOW_VERSION } from "./catalogs";
import { oakParkInvoice, OAK_PARK_IDS } from "../demos/oakParkInvoice";
import { MAILROOM_IDS, robotMailroom } from "../demos/robotMailroom";
import { emptyAfterOverlay, type WorkflowDoc } from "./types";
import { automationCounts, automationScore } from "./scoring";

test("Oak Park score counts Before-origin Steps that become Robot After", () => {
  const doc = oakParkInvoice();
  expect(automationScore(doc)).toMatch(/will become automated/);
  const { automated, total } = automationCounts(doc);
  expect(total).toBe(doc.nodes.filter((n) => n.type === WorkflowNodeKind.Step).length);
  expect(automated).toBeGreaterThan(0);
  expect(doc.after.assignments[OAK_PARK_IDS.review]).toBe(OAK_PARK_IDS.alice);
});

test("After-only Steps are omitted from the score; merge members count individually (BA-08)", () => {
  const doc = robotMailroom();
  expect(automationCounts(doc)).toEqual({ automated: 3, total: 6 });
  expect(automationScore(doc)).toBe(
    "3 Steps out of 6 will become automated instead of manually performed",
  );

  const withGhost: WorkflowDoc = {
    ...doc,
    after: {
      ...doc.after,
      extraNodes: [
        ...doc.after.extraNodes,
        {
          id: "s_ghost",
          type: WorkflowNodeKind.Step,
          position: { x: 0, y: 0 },
          stepKind: StepKind.Other,
          title: "ghost",
          detail: "",
          split: SplitKind.Exclusive,
        },
      ],
      extraEdges: [
        ...doc.after.extraEdges,
        { id: "e_ghost", source: MAILROOM_IDS.file, target: "s_ghost", label: "" },
      ],
      assignments: {
        ...doc.after.assignments,
        s_ghost: MAILROOM_IDS.mailbot,
      },
    },
  };
  expect(automationCounts(withGhost)).toEqual({ automated: 3, total: 6 });
});

test("empty board has no score steps", () => {
  const empty: WorkflowDoc = {
    version: WORKFLOW_VERSION,
    actors: [
      { id: "h1", kind: ActorKind.Human, name: "Ada", color: "#f4c6d4", role: "worker" },
    ],
    nodes: [],
    edges: [],
    assignments: {},
    after: emptyAfterOverlay(),
  };
  expect(automationScore(empty)).toBe("No steps yet.");
});
