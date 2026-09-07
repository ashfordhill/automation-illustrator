import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { DemoId } from "../demos/catalog";
import { freshBoard, isEmptyBoard, OAK_PARK_IDS } from "../demos/oakParkInvoice";
import { MAILROOM_IDS } from "../demos/robotMailroom";
import { ColorScheme, ViewMode } from "../workflow/catalogs";
import * as persist from "./persistence";
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
  s.setColorScheme(ColorScheme.Light);
  if (s.recovery) s.clearRecoveryHold();
}

beforeEach(() => {
  resetSession();
});

afterEach(() => {
  vi.restoreAllMocks();
  resetSession();
});

test("cancel never mutates the current board (SH-06)", () => {
  const before = useStore.getState().workflow;
  useStore.getState().requestNew();
  expect(useStore.getState().pendingReplace).toEqual({ kind: "new" });
  useStore.getState().cancelReplace();
  expect(useStore.getState().pendingReplace).toBeNull();
  expect(useStore.getState().workflow).toBe(before);
  expect(useStore.getState().workflow.nodes.some((n) => n.id === OAK_PARK_IDS.read)).toBe(true);
});

test("Discard New loads an empty roster board and clears history (WG-01, SH-12)", () => {
  useStore.getState().updateNode(OAK_PARK_IDS.review, { title: "typed" });
  expect(useStore.getState().past.length).toBeGreaterThan(0);
  useStore.getState().requestNew();
  useStore.getState().confirmReplaceDiscard();
  expect(isEmptyBoard(useStore.getState().workflow)).toBe(true);
  expect(useStore.getState().workflow.actors).toHaveLength(5);
  expect(useStore.getState().past).toEqual([]);
  expect(useStore.getState().future).toEqual([]);
  expect(useStore.getState().pendingReplace).toBeNull();
});

test("Save copy downloads then replaces (SH-06, SH-13)", () => {
  const download = vi.spyOn(persist, "downloadWorkflowCopy").mockImplementation(() => undefined);
  const before = useStore.getState().workflow;
  useStore.getState().requestDemo(DemoId.RobotMailroom);
  useStore.getState().confirmReplaceSaveCopy();
  expect(download).toHaveBeenCalledTimes(1);
  expect(download.mock.calls[0]?.[0].nodes.map((n) => n.id)).toEqual(before.nodes.map((n) => n.id));
  expect(useStore.getState().workflow.nodes[0]?.id).toBe(MAILROOM_IDS.open);
  expect(useStore.getState().past).toEqual([]);
});

test("requestNew on an empty board is a no-op", () => {
  useStore.getState().loadDoc(freshBoard());
  useStore.getState().requestNew();
  expect(useStore.getState().pendingReplace).toBeNull();
  expect(isEmptyBoard(useStore.getState().workflow)).toBe(true);
});

test("addStep on an empty board creates the root (WG-01)", () => {
  useStore.getState().loadDoc(freshBoard());
  const id = useStore.getState().addStep();
  expect(id).toBeTruthy();
  expect(useStore.getState().workflow.nodes).toHaveLength(1);
  expect(useStore.getState().workflow.nodes[0]?.id).toBe(id);
});

test("Start fresh discards recovery and writes an empty board (SH-10)", () => {
  const raw = '{"version":1';
  useStore.setState({
    recovery: {
      raw,
      violations: [{ code: "invalid-shape", message: "Saved data is not valid JSON." }],
      message: "Saved data is not valid JSON.",
    },
    persistStatus: "dirty",
  });
  const download = vi.spyOn(persist, "downloadRecoveryCopy").mockImplementation(() => undefined);
  useStore.getState().downloadHeldRecovery();
  expect(download).toHaveBeenCalledWith(raw);
  useStore.getState().startFresh();
  expect(useStore.getState().recovery).toBeNull();
  expect(isEmptyBoard(useStore.getState().workflow)).toBe(true);
  expect(useStore.getState().past).toEqual([]);
});
