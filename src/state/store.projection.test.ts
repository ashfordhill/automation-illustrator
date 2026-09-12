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
}

beforeEach(() => {
  resetSession();
});

afterEach(() => {
  resetSession();
});

test("shared base fields edited from After update Before immediately (BA-02)", () => {
  useStore.getState().setView(ViewMode.After);
  useStore.getState().updateNode(OAK_PARK_IDS.read, { title: "shared-from-after" });
  const afterEdit = useStore.getState().workflow.nodes.find((n) => n.id === OAK_PARK_IDS.read);
  expect(afterEdit && isStepNode(afterEdit) && afterEdit.title).toBe("shared-from-after");
  useStore.getState().setView(ViewMode.Before);
  const still = useStore.getState().workflow.nodes.find((n) => n.id === OAK_PARK_IDS.read);
  expect(still && isStepNode(still) && still.title).toBe("shared-from-after");
});

test("Both does not mutate; After may remove a Before-origin Step (BA-04, BA-05)", () => {
  const s = useStore.getState();
  const title = s.workflow.nodes.find((n) => n.id === OAK_PARK_IDS.read);
  const beforeTitle = title && isStepNode(title) ? title.title : "";
  s.setView(ViewMode.Both);
  s.updateNode(OAK_PARK_IDS.read, { title: "should-not-stick" });
  const blocked = useStore.getState().workflow.nodes.find((n) => n.id === OAK_PARK_IDS.read);
  expect(blocked && isStepNode(blocked) && blocked.title).toBe(beforeTitle);

  s.setView(ViewMode.After);
  s.beginRemovePick(OAK_PARK_IDS.review);
  expect(useStore.getState().workflow.nodes.some((n) => n.id === OAK_PARK_IDS.review)).toBe(false);
  s.setView(ViewMode.Before);
  expect(useStore.getState().workflow.nodes.some((n) => n.id === OAK_PARK_IDS.review)).toBe(false);
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
