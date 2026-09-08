import { afterEach, beforeEach, expect, test } from "vitest";
import { ColorScheme, SelectionKind, SplitKind, StepKind, ViewMode, WorkflowNodeKind } from "../workflow/catalogs";
import { OAK_PARK_IDS } from "../demos/oakParkInvoice";
import { MAILROOM_IDS } from "../demos/robotMailroom";
import { DemoId } from "../demos/catalog";
import { isStepNode } from "../workflow/types";
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
  if (s.recovery) s.clearRecoveryHold();
}

beforeEach(() => {
  resetSession();
});

afterEach(() => {
  resetSession();
});

test("spawnBranch from a Step inherits that Step’s Who, not last-used Human (NA-03)", () => {
  const { read, review, acct, roy, alice, robot } = OAK_PARK_IDS;
  const s = useStore.getState();
  s.assignActor(read, roy);
  expect(useStore.getState().lastHumanId).toBe(roy);

  const childOfAlice = useStore.getState().spawnBranch(review, WorkflowNodeKind.Step);
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
  expect(useStore.getState().workflow.assignments[fromData]).toBe(roy);
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
  expect(useStore.getState().workflow.assignments[review]).toBe(OAK_PARK_IDS.alice);
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
