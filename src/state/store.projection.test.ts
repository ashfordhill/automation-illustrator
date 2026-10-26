import { afterEach, beforeEach, expect, test } from "vitest";
import { DemoId } from "../demos/catalog";
import { OAK_PARK_IDS } from "../demos/oakParkInvoice";
import { MAILROOM_IDS } from "../demos/robotMailroom";
import { ColorScheme, SelectionKind, ViewMode } from "../workflow/catalogs";
import { isStepNode } from "../workflow/types";
import { projectAfter, projectBefore } from "./projection";
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
  s.setColorScheme(ColorScheme.Light);
  s.setSoundEnabled(false);
  s.setInspectorCollapsed(false);
  s.setBoardOrientation("horizontal");
}

beforeEach(() => {
  resetSession();
});

afterEach(() => {
  resetSession();
});

test("After edits stay on After; Restart copies the current Before board", () => {
  const s = useStore.getState();
  s.requestNew();
  s.confirmReplaceDiscard();
  const id = s.addStep();
  const alice = useStore.getState().workflow.actors.find((a) => a.name === "Alice");
  const roy = useStore.getState().workflow.actors.find((a) => a.name === "Roy");
  expect(alice && roy).toBeTruthy();
  s.assignActor(id, roy!.id);
  expect(useStore.getState().workflow.after.fork).toBeNull();
  expect(projectAfter(useStore.getState().workflow).nodes.map((n) => n.id)).toEqual([id]);

  s.setView(ViewMode.After);
  s.updateNode(id, { title: "only-after" });
  const doc = useStore.getState().workflow;
  const before = doc.nodes.find((n) => n.id === id);
  const after = doc.after.fork?.nodes.find((n) => n.id === id);
  expect(before && isStepNode(before) && before.title).toBe("");
  expect(after && isStepNode(after) && after.title).toBe("only-after");
  expect(doc.assignments[id]).toBe(roy!.id);

  s.setView(ViewMode.Before);
  s.updateNode(id, { title: "before-title" });
  s.assignActor(id, alice!.id);
  const forked = useStore.getState().workflow.after.fork;
  const forkedStep = forked?.nodes.find((n) => n.id === id);
  expect(forkedStep && isStepNode(forkedStep) && forkedStep.title).toBe("only-after");
  expect(forked?.assignments[id]).toBe(roy!.id);

  s.setView(ViewMode.After);
  s.restartAfter();
  const reset = useStore.getState().workflow;
  expect(reset.after.fork).toBeNull();
  const shown = projectAfter(reset).nodes.find((n) => n.id === id);
  expect(shown && isStepNode(shown) && shown.title).toBe("before-title");
  expect(reset.assignments[id]).toBe(alice!.id);
});

test("Both does not mutate; removing a Step in After leaves Before in place", () => {
  const s = useStore.getState();
  const title = s.workflow.nodes.find((n) => n.id === OAK_PARK_IDS.read);
  const beforeTitle = title && isStepNode(title) ? title.title : "";
  s.setView(ViewMode.Both);
  s.updateNode(OAK_PARK_IDS.read, { title: "should-not-stick" });
  const blocked = useStore.getState().workflow.nodes.find((n) => n.id === OAK_PARK_IDS.read);
  expect(blocked && isStepNode(blocked) && blocked.title).toBe(beforeTitle);

  s.setView(ViewMode.After);
  s.beginRemovePick(OAK_PARK_IDS.review);
  expect(useStore.getState().workflow.nodes.some((n) => n.id === OAK_PARK_IDS.review)).toBe(true);
  expect(projectAfter(useStore.getState().workflow).nodes.some((n) => n.id === OAK_PARK_IDS.review)).toBe(
    false,
  );
  s.setView(ViewMode.Before);
  expect(useStore.getState().workflow.nodes.some((n) => n.id === OAK_PARK_IDS.review)).toBe(true);
});

test("Robot Mailroom After is 1:1 with Before (no receipt extra)", () => {
  const s = useStore.getState();
  s.requestDemo(DemoId.RobotMailroom);
  s.confirmReplaceDiscard();
  const doc = useStore.getState().workflow;
  expect(doc.after.extraNodes).toEqual([]);
  expect(projectBefore(doc).nodes.map((n) => n.id)).toEqual(projectAfter(doc).nodes.map((n) => n.id));
  expect(projectAfter(doc).nodes.some((n) => n.id === MAILROOM_IDS.receipt)).toBe(false);
  expect(projectAfter(doc).nodes.some((n) => n.id === MAILROOM_IDS.scan)).toBe(true);
  expect(projectAfter(doc).nodes.some((n) => n.id === MAILROOM_IDS.group)).toBe(false);
  expect(projectAfter(doc).nodes.some((n) => n.id === MAILROOM_IDS.recipient)).toBe(true);
  expect(doc.after.groups).toEqual([]);
});

test("focusedLane follows the view and Both keeps the last pan target (BA-05)", () => {
  const s = useStore.getState();
  s.setView(ViewMode.After);
  expect(useStore.getState().focusedLane).toBe("after");
  s.setView(ViewMode.Both);
  expect(useStore.getState().focusedLane).toBe("after");
  s.setFocusedLane("before");
  expect(useStore.getState().focusedLane).toBe("before");
  s.select({ type: SelectionKind.Node, id: OAK_PARK_IDS.read });
  expect(useStore.getState().assignmentLane()).toBe("before");
});

test("entering Both copies the focused lane viewport onto both lanes (BA-05)", () => {
  const seed = { x: 12, y: -40, zoom: 0.72 };
  const s = useStore.getState();
  s.setView(ViewMode.After);
  s.setLaneViewport("after", seed);
  s.setView(ViewMode.Both);
  expect(useStore.getState().laneViewports.before).toEqual(seed);
  expect(useStore.getState().laneViewports.after).toEqual(seed);
});

test("switching to After copies Before's camera so After follows Before (BA-05)", () => {
  const beforeCam = { x: 40, y: -80, zoom: 0.85 };
  const staleAfter = { x: 0, y: 0, zoom: 1 };
  const s = useStore.getState();
  s.setView(ViewMode.Before);
  s.setLaneViewport("before", beforeCam);
  s.setLaneViewport("after", staleAfter);
  s.setView(ViewMode.After);
  expect(useStore.getState().laneViewports.after).toEqual(beforeCam);
  expect(useStore.getState().laneViewports.before).toEqual(beforeCam);
});

test("switching to Before keeps Before's camera when After has drifted (BA-05)", () => {
  const beforeCam = { x: 10, y: 20, zoom: 0.9 };
  const afterCam = { x: 99, y: 99, zoom: 0.4 };
  const s = useStore.getState();
  s.setView(ViewMode.Before);
  s.setLaneViewport("before", beforeCam);
  s.setLaneViewport("after", afterCam);
  s.setView(ViewMode.Before);
  expect(useStore.getState().laneViewports.before).toEqual(beforeCam);
  expect(useStore.getState().laneViewports.after).toEqual(beforeCam);
});
