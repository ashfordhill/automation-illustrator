import { afterEach, beforeEach, expect, test } from "vitest";
import { ColorScheme, SelectionKind, SplitKind, StepKind, ViewMode, WorkflowNodeKind } from "../workflow/catalogs";
import { OAK_PARK_IDS } from "../demos/oakParkInvoice";
import { MAILROOM_IDS } from "../demos/robotMailroom";
import { DemoId } from "../demos/catalog";
import { isStepNode } from "../workflow/types";
import { defaultRobotId } from "../workflow/actors";
import { useStore } from "./store";

function resetSession() {
  localStorage.clear();
  const s = useStore.getState();
  s.resetDemo();
  s.setView(ViewMode.Before);
  s.setPresent(false);
  s.select(null);
  s.setHelp(false);
  s.cancelReplace();
  s.clearImportError();
  s.closeBoardModes();
  s.closeManageActors({ restoreFocus: false });
  s.setNotice(null);
  s.setColorScheme(ColorScheme.Light);
  s.setInspectorCollapsed(false);
  if (s.recovery) s.clearRecoveryHold();
}

beforeEach(() => {
  resetSession();
});

afterEach(() => {
  resetSession();
});

test("spawnBranch from a Step inherits that Step’s Who, not last-used Human (NA-03)", () => {
  const { read, enter, review, acct, roy, alice, robot } = OAK_PARK_IDS;
  const s = useStore.getState();
  s.assignActor(read, roy);
  expect(useStore.getState().lastHumanId).toBe(roy);

  const childOfAlice = useStore.getState().spawnBranch(enter, WorkflowNodeKind.Step);
  expect(childOfAlice).toBeTruthy();
  expect(useStore.getState().workflow.assignments[childOfAlice]).toBe(alice);
  expect(useStore.getState().workflow.after.assignments[childOfAlice]).toBe(alice);

  s.assignActor(review, roy);
  const childOfRoy = useStore.getState().spawnBranch(review, WorkflowNodeKind.Step);
  expect(useStore.getState().workflow.assignments[childOfRoy]).toBe(roy);
  expect(useStore.getState().workflow.after.assignments[childOfRoy]).toBe(roy);
  expect(useStore.getState().lastHumanId).toBe(roy);

  s.assignActor(review, robot);
  const childOfRobot = useStore.getState().spawnBranch(review, WorkflowNodeKind.Step);
  expect(useStore.getState().workflow.assignments[childOfRobot]).toBe(robot);
  expect(useStore.getState().workflow.after.assignments[childOfRobot]).toBe(robot);

  const fromData = useStore.getState().spawnBranch(acct, WorkflowNodeKind.Step);
  expect(useStore.getState().workflow.assignments[fromData]).toBe(alice);
});

test("After-only Step on a New board uses LLM (NA-04)", () => {
  const s = useStore.getState();
  s.requestNew();
  s.confirmReplaceDiscard();
  const root = useStore.getState().addStep();
  expect(root).toBeTruthy();
  const llm = useStore.getState().workflow.actors.find((a) => a.name === "LLM")?.id;
  expect(llm).toBeTruthy();
  expect(defaultRobotId(useStore.getState().workflow.actors)).toBe(llm);

  s.setView(ViewMode.After);
  const extra = useStore.getState().spawnBranch(root, WorkflowNodeKind.Step);
  expect(extra).toBeTruthy();
  expect(useStore.getState().workflow.after.assignments[extra]).toBe(llm);
  expect(useStore.getState().workflow.nodes.some((n) => n.id === extra)).toBe(false);
  expect(useStore.getState().workflow.after.extraNodes.some((n) => n.id === extra)).toBe(true);
});

test("New board: a child of Roy, including off Roy’s Data, is Roy (NA-03)", () => {
  const s = useStore.getState();
  s.requestNew();
  s.confirmReplaceDiscard();
  const root = useStore.getState().addStep();
  const roy = useStore.getState().workflow.actors.find((a) => a.name === "Roy")?.id;
  expect(root).toBeTruthy();
  expect(roy).toBeTruthy();
  useStore.getState().assignActor(root, roy!);
  const child = useStore.getState().spawnBranch(root, WorkflowNodeKind.Step);
  expect(useStore.getState().workflow.assignments[child]).toBe(roy);
  expect(useStore.getState().workflow.after.assignments[child]).toBe(roy);

  const data = useStore.getState().spawnBranch(root, WorkflowNodeKind.DataField);
  const fromData = useStore.getState().spawnBranch(data, WorkflowNodeKind.Step);
  expect(useStore.getState().workflow.assignments[fromData]).toBe(roy);
  expect(useStore.getState().workflow.after.assignments[fromData]).toBe(roy);
});

test("Who assigns in both lanes, including a Robot in Before (NA-03, NA-11)", () => {
  const { read, review, roy, robot } = OAK_PARK_IDS;
  const s = useStore.getState();
  s.assignActor(read, roy);
  expect(useStore.getState().workflow.assignments[read]).toBe(roy);
  expect(useStore.getState().lastHumanId).toBe(roy);

  s.assignActor(read, robot);
  expect(useStore.getState().workflow.assignments[read]).toBe(robot);
  expect(useStore.getState().lastHumanId).toBe(roy);

  s.setView(ViewMode.After);
  useStore.getState().assignActor(review, robot);
  expect(useStore.getState().workflow.after.assignments[review]).toBe(robot);
  expect(useStore.getState().workflow.assignments[review]).toBe(OAK_PARK_IDS.roy);
});

test("changing Split re-applies default strokes (PC-02, PC-03)", () => {
  const { read, gt, lt } = OAK_PARK_IDS;
  const s = useStore.getState();
  s.updateNode(read, { split: SplitKind.Parallel });
  const every = useStore.getState().workflow;
  expect(every.edges.find((e) => e.id === gt)?.dashed).toBe(false);
  expect(every.edges.find((e) => e.id === lt)?.dashed).toBe(false);

  s.updateNode(read, { split: SplitKind.Exclusive });
  const oneOf = useStore.getState().workflow;
  expect(oneOf.edges.find((e) => e.id === gt)?.dashed).toBe(true);
  expect(oneOf.edges.find((e) => e.id === lt)?.dashed).toBe(true);

  s.updateEdge(gt, { dashed: false });
  expect(useStore.getState().workflow.edges.find((e) => e.id === gt)?.dashed).toBe(false);
  s.updateNode(read, { split: SplitKind.Exclusive });
  expect(useStore.getState().workflow.edges.find((e) => e.id === gt)?.dashed).toBe(true);
});

test("toggleSelectedDash toggles that Path only, including a Data-sourced lone Path", () => {
  const { gt, lt, acctEnter } = OAK_PARK_IDS;
  const s = useStore.getState();
  s.select({ type: SelectionKind.Edge, id: acctEnter });
  expect(useStore.getState().workflow.edges.find((e) => e.id === acctEnter)?.dashed).toBe(false);
  s.toggleSelectedDash();
  expect(useStore.getState().workflow.edges.find((e) => e.id === acctEnter)?.dashed).toBe(true);

  s.select({ type: SelectionKind.Edge, id: gt });
  expect(useStore.getState().workflow.edges.find((e) => e.id === gt)?.dashed).toBe(true);
  expect(useStore.getState().workflow.edges.find((e) => e.id === lt)?.dashed).toBe(true);
  s.toggleSelectedDash();
  expect(useStore.getState().workflow.edges.find((e) => e.id === gt)?.dashed).toBe(false);
  expect(useStore.getState().workflow.edges.find((e) => e.id === lt)?.dashed).toBe(true);
  s.toggleSelectedDash();
  expect(useStore.getState().workflow.edges.find((e) => e.id === gt)?.dashed).toBe(true);
  expect(useStore.getState().workflow.edges.find((e) => e.id === lt)?.dashed).toBe(true);
});

test("focusPathLabel opens on-canvas Path label edit, not the inspector field", () => {
  const { gt } = OAK_PARK_IDS;
  const s = useStore.getState();
  s.select({ type: SelectionKind.Edge, id: gt });
  s.focusPathLabel();
  const next = useStore.getState();
  expect(next.interaction).toEqual({ kind: "path-label-edit", edgeId: gt });
  expect(next.selected).toEqual({ type: SelectionKind.Edge, id: gt });
});

test("removeActor blocks used humans and deletes unused Priya (NA-02)", () => {
  const s = useStore.getState();
  expect(s.removeActor(OAK_PARK_IDS.alice)).toBe(false);
  expect(useStore.getState().notice).toMatch(/Alice is assigned to/);
  expect(useStore.getState().notice).toMatch(/Read invoice\.pdf \(Before\)/);
  expect(useStore.getState().workflow.actors.some((a) => a.id === OAK_PARK_IDS.alice)).toBe(true);

  s.requestDemo(DemoId.RobotMailroom);
  s.confirmReplaceDiscard();
  expect(useStore.getState().removeActor(MAILROOM_IDS.priya)).toBe(true);
  expect(useStore.getState().workflow.actors.some((a) => a.id === MAILROOM_IDS.priya)).toBe(false);
});

test("beginTileTextEdit and beginTilePie open on-canvas Step edit (NA-08, NA-11)", () => {
  const { read, roy } = OAK_PARK_IDS;
  const s = useStore.getState();
  s.beginTileTextEdit(read, "title");
  expect(useStore.getState().interaction).toEqual({
    kind: "tile-text-edit",
    nodeId: read,
    field: "title",
  });
  expect(useStore.getState().selected).toEqual({ type: SelectionKind.Node, id: read });

  s.beginTilePie(read, "type", 100, 80);
  expect(useStore.getState().interaction).toMatchObject({
    kind: "tile-pie",
    nodeId: read,
    pie: "type",
    x: 100,
    y: 80,
  });

  s.beginTilePie(read, "who", 10, 10);
  expect(useStore.getState().interaction.kind).toBe("tile-pie");
  s.assignActor(read, roy);
  expect(useStore.getState().workflow.assignments[read]).toBe(roy);

  s.closeBoardModes();
  s.setPresent(true);
  s.beginTileTextEdit(read, "detail");
  expect(useStore.getState().interaction).toEqual({ kind: "idle" });
  s.setPresent(false);
  s.setView(ViewMode.Both);
  s.beginTilePie(read, "type", 0, 0);
  expect(useStore.getState().interaction).toEqual({ kind: "idle" });
  s.setView(ViewMode.Before);
  s.closeBoardModes();
  expect(useStore.getState().interaction).toEqual({ kind: "idle" });
});


test("addHuman inserts before robots; addRobot appends after robots", () => {
  const s = useStore.getState();
  s.requestNew();
  s.confirmReplaceDiscard();
  const hid = useStore.getState().addHuman("Pat");
  expect(useStore.getState().workflow.actors.map((a) => a.name)).toEqual([
    "Alice",
    "Roy",
    "Jack",
    "Missy",
    "Pat",
    "LLM",
    "Script",
    "Agent",
  ]);
  expect(useStore.getState().workflow.actors.find((a) => a.id === hid)?.name).toBe("Pat");

  const rid = useStore.getState().addRobot();
  const names = useStore.getState().workflow.actors.map((a) => a.name);
  expect(names.at(-1)).toBe("Robot");
  expect(names.indexOf("Pat")).toBe(4);
  expect(useStore.getState().workflow.actors.find((a) => a.id === rid)?.name).toBe("Robot");
});

test("Manage actors opens on the selected Step’s Who", () => {
  const { fs, review, roy, alice } = OAK_PARK_IDS;
  const s = useStore.getState();
  s.select({ type: SelectionKind.Node, id: fs });
  s.openManageActors();
  expect(useStore.getState().manageActorsOpen).toBe(true);
  expect(useStore.getState().manageActorId).toBe(alice);
  s.closeManageActors({ restoreFocus: false });
  s.select({ type: SelectionKind.Node, id: review });
  s.openManageActors();
  expect(useStore.getState().manageActorId).toBe(roy);
});

test("new Other Steps are named Task; choosing Other fills an empty Name once", () => {
  const { review, read } = OAK_PARK_IDS;
  const child = useStore.getState().spawnBranch(review, WorkflowNodeKind.Step);
  const spawned = useStore.getState().workflow.nodes.find((n) => n.id === child);
  expect(spawned && isStepNode(spawned) && spawned.stepKind).toBe(StepKind.Other);
  expect(spawned && isStepNode(spawned) && spawned.title).toBe("Task");

  useStore.getState().updateNode(read, { stepKind: StepKind.Other });
  const kept = useStore.getState().workflow.nodes.find((n) => n.id === read);
  expect(kept && isStepNode(kept) && kept.title).toBe("invoice.pdf");

  useStore.getState().updateNode(read, { title: "", stepKind: StepKind.Read });
  useStore.getState().updateNode(read, { stepKind: StepKind.Other });
  const seeded = useStore.getState().workflow.nodes.find((n) => n.id === read);
  expect(seeded && isStepNode(seeded) && seeded.title).toBe("Task");
});
