import { expect, test } from "vitest";
import { ActorKind, AssignmentLane, RobotKind, SplitKind, StepKind, WorkflowNodeKind } from "./catalogs";
import {
  actorInUseMessage,
  actorUsages,
  defaultActors,
  defaultHumanId,
  defaultRobotId,
  ensureDefaultRobot,
  HUMAN_PRESETS,
  ROBOT_PRESETS,
  removeActor,
  whoForChildStep,
  whoForPredecessorStep,
} from "./actors";
import { emptyAfterOverlay, emptyWorkflow, isRobot, type WorkflowDoc } from "./types";

const doc: WorkflowDoc = {
  ...emptyWorkflow(),
  actors: [
    { id: "h_ada", kind: "human", name: "Ada", color: "#f4c6d4", role: "clerk" },
    { id: "h_priya", kind: "human", name: "Priya", color: "#d5c6e6", role: "ap" },
    { id: "r1", kind: "robot", name: "Bot", color: "#8aa8b8", robotKind: "script" },
  ],
  nodes: [
    {
      id: "s_read",
      type: WorkflowNodeKind.Step,
      position: { x: 0, y: 0 },
      stepKind: StepKind.Read,
      title: "mail",
      detail: "",
      split: SplitKind.Exclusive,
    },
  ],
  assignments: { s_read: "h_ada" },
  after: {
    ...emptyAfterOverlay(),
    assignments: { s_read: "r1", s_extra: "h_ada" },
    extraNodes: [
      {
        id: "s_extra",
        type: WorkflowNodeKind.Step,
        position: { x: 80, y: 0 },
        stepKind: StepKind.Email,
        title: "receipt",
        detail: "",
        split: SplitKind.Exclusive,
      },
    ],
  },
};

test("Roy’s fill is honey-apricot, not Script-robot blue", () => {
  expect(HUMAN_PRESETS[1]).toEqual({ name: "Roy", color: "#f4c07a" });
});

test("default roster is Alice, Roy, Jack, Missy, then LLM, Script, Agent (WG-01, NA-04)", () => {
  const actors = defaultActors();
  expect(actors.filter((a) => a.kind === ActorKind.Human).map((a) => a.name)).toEqual([
    "Alice",
    "Roy",
    "Jack",
    "Missy",
  ]);
  const robots = actors.filter((a) => a.kind === ActorKind.Robot);
  expect(robots.map((a) => a.name)).toEqual(["LLM", "Script", "Agent"]);
  expect(robots.map((a) => (isRobot(a) ? a.robotKind : ""))).toEqual(
    ROBOT_PRESETS.map((p) => p.robotKind),
  );
  expect(defaultRobotId(actors)).toBe(robots[0]?.id);
});

test("ensureDefaultRobot keeps the first Robot and otherwise creates LLM (NA-04)", () => {
  const roster = defaultActors();
  const kept = ensureDefaultRobot({ ...emptyWorkflow(), actors: roster });
  expect(kept.robotId).toBe(defaultRobotId(roster));
  expect(kept.doc.actors).toHaveLength(7);

  const created = ensureDefaultRobot(emptyWorkflow());
  expect(created.doc.actors).toHaveLength(1);
  const robot = created.doc.actors[0];
  expect(robot?.name).toBe("LLM");
  expect(robot && isRobot(robot) && robot.robotKind).toBe(RobotKind.Llm);
  expect(created.robotId).toBe(robot?.id);
});

test("whoForChildStep inherits a Step parent’s Who and walks Data to the upstream Step (NA-03)", () => {
  expect(whoForChildStep(doc, "s_read", "h_priya")).toEqual({
    beforeId: "h_ada",
    afterId: "h_ada",
  });
  const fromData = whoForChildStep(
    {
      ...doc,
      nodes: [
        ...doc.nodes,
        {
          id: "d1",
          type: WorkflowNodeKind.DataField,
          position: { x: 40, y: 0 },
          label: "Account",
        },
      ],
      edges: [{ id: "e1", source: "s_read", target: "d1", label: "", dashed: false }],
    },
    "d1",
    "h_priya",
  );
  expect(fromData).toEqual({ beforeId: "h_ada", afterId: "h_ada" });
  const orphanData = whoForChildStep(
    {
      ...doc,
      nodes: [
        ...doc.nodes,
        {
          id: "d2",
          type: WorkflowNodeKind.DataField,
          position: { x: 40, y: 0 },
          label: "Orphan",
        },
      ],
    },
    "d2",
    "h_priya",
  );
  expect(orphanData).toEqual({ beforeId: "h_priya", afterId: "h_priya" });
});

test("whoForPredecessorStep uses last-used Human and does not copy the successor (NA-03)", () => {
  expect(whoForPredecessorStep(doc, "h_priya")).toEqual({
    beforeId: "h_priya",
    afterId: "h_priya",
  });
  expect(whoForPredecessorStep(doc, null)).toEqual({
    beforeId: "h_ada",
    afterId: "h_ada",
  });
});

test("defaultHumanId prefers last-used Human, then Alice, then the first Human (NA-03)", () => {
  const actors = doc.actors;
  expect(defaultHumanId(actors, "h_priya")).toBe("h_priya");
  expect(defaultHumanId(actors, "missing")).toBe("h_ada");
  expect(defaultHumanId(actors, "r1")).toBe("h_ada");
  expect(
    defaultHumanId([
      { id: "h_alice", kind: "human", name: "Alice", color: "#f4c6d4", role: "worker" },
      ...actors,
    ]),
  ).toBe("h_alice");
});

test("actorUsages lists Before, After, and After-only Steps (NA-02)", () => {
  const uses = actorUsages(doc, "h_ada");
  expect(uses).toEqual([
    { stepId: "s_read", lane: AssignmentLane.Before, title: "Read mail" },
    { stepId: "s_extra", lane: AssignmentLane.After, title: "Email receipt" },
  ]);
  expect(actorUsages(doc, "h_priya")).toEqual([]);
});

test("removeActor blocks used actors with assigning Step names and deletes unused ones", () => {
  const blocked = removeActor(doc, "h_ada");
  expect(blocked.ok).toBe(false);
  if (blocked.ok) return;
  expect(blocked.message).toBe(
    actorInUseMessage("Ada", actorUsages(doc, "h_ada")),
  );
  expect(blocked.message).toMatch(/Read mail \(Before\)/);
  expect(blocked.message).toMatch(/Email receipt \(After\)/);

  const robotBlocked = removeActor(doc, "r1");
  expect(robotBlocked.ok).toBe(false);

  const gone = removeActor(doc, "h_priya");
  expect(gone.ok).toBe(true);
  if (!gone.ok) return;
  expect(gone.value.actors.some((a) => a.id === "h_priya")).toBe(false);
  expect(gone.value.nodes).toEqual(doc.nodes);
});
