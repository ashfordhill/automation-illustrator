import { afterEach, beforeEach, expect, test } from "vitest";
import { ColorScheme, SelectionKind, ViewMode } from "../workflow/catalogs";
import { OAK_PARK_IDS } from "../demos/oakParkInvoice";
import { LS_BOARD_ORIENTATION } from "./persistence";
import { useStore } from "./store";

function resetSession() {
  localStorage.clear();
  const s = useStore.getState();
  s.resetDemo();
  s.setView(ViewMode.Before);
  s.setPresent(false);
  s.select(null);
  s.setHelp(false);
  s.closeBoardModes();
  s.setColorScheme(ColorScheme.Light);
  s.setSoundEnabled(true);
  s.setRightClickDelete(false);
  s.setSimplify({
    hideVisuals: false,
  });
  s.setInspectorCollapsed(false);
  s.setBoardOrientation("horizontal");
}

beforeEach(() => {
  resetSession();
});

afterEach(() => {
  resetSession();
});

test("sound is on by default and persists on/off (SH-03)", () => {
  expect(useStore.getState().soundEnabled).toBe(true);
  useStore.getState().setSoundEnabled(false);
  expect(useStore.getState().soundEnabled).toBe(false);
  expect(localStorage.getItem("automation-pitch.sound")).toBe("off");
  useStore.getState().setSoundEnabled(true);
  expect(localStorage.getItem("automation-pitch.sound")).toBe("on");
});

test("theme persists across setColorScheme (P-09)", () => {
  useStore.getState().setColorScheme(ColorScheme.Dark);
  expect(localStorage.getItem("automation-pitch.theme")).toBe(ColorScheme.Dark);
  useStore.getState().setColorScheme(ColorScheme.Light);
  expect(localStorage.getItem("automation-pitch.theme")).toBe(ColorScheme.Light);
});

test("inspector fold persists and defaults open (P-05)", () => {
  expect(useStore.getState().inspectorCollapsed).toBe(false);
  useStore.getState().setInspectorCollapsed(true);
  expect(useStore.getState().inspectorCollapsed).toBe(true);
  expect(localStorage.getItem("automation-pitch.inspectorCollapsed")).toBe("on");
  useStore.getState().setInspectorCollapsed(false);
  expect(localStorage.getItem("automation-pitch.inspectorCollapsed")).toBe("off");
});

test("simplify prefs are off by default and persist independently", () => {
  expect(useStore.getState().simplify).toEqual({ hideVisuals: false });
  useStore.getState().setSimplify({ hideVisuals: true });
  expect(useStore.getState().simplify.hideVisuals).toBe(true);
  const saved = JSON.parse(localStorage.getItem("automation-pitch.simplify") ?? "{}");
  expect(saved).toEqual({ hideVisuals: true });
  expect("hideData" in saved).toBe(false);
  expect("hideVisualsOnZoomOut" in saved).toBe(false);
});

test("right-click-delete is off by default and persists on/off", () => {
  expect(useStore.getState().rightClickDelete).toBe(false);
  useStore.getState().setRightClickDelete(true);
  expect(useStore.getState().rightClickDelete).toBe(true);
  expect(localStorage.getItem("automation-pitch.right-click-delete")).toBe("on");
  useStore.getState().setRightClickDelete(false);
  expect(localStorage.getItem("automation-pitch.right-click-delete")).toBe("off");
});

test("focusDataLabel opens a folded inspector (NA-08)", () => {
  useStore.getState().select({ type: SelectionKind.Node, id: OAK_PARK_IDS.acct });
  useStore.getState().setInspectorCollapsed(true);
  useStore.getState().focusDataLabel();
  expect(useStore.getState().inspectorCollapsed).toBe(false);
});

test("exiting Present restores the previous view and selection (P-07)", () => {
  useStore.getState().select({ type: SelectionKind.Node, id: OAK_PARK_IDS.read });
  useStore.getState().setView(ViewMode.After);
  useStore.getState().setPresent(true);
  expect(useStore.getState().present).toBe(true);
  expect(useStore.getState().selected).toBeNull();
  useStore.getState().setView(ViewMode.Before);
  useStore.getState().setPresent(false);
  expect(useStore.getState().present).toBe(false);
  expect(useStore.getState().view).toBe(ViewMode.After);
  expect(useStore.getState().selected).toEqual({
    type: SelectionKind.Node,
    id: OAK_PARK_IDS.read,
  });
});

test("Present expand starts split; Space swaps fullscreen lanes; exit clears expand (P-07)", () => {
  useStore.getState().setView(ViewMode.After);
  useStore.getState().setPresent(true);
  expect(useStore.getState().presentExpand).toBeNull();
  useStore.getState().togglePresentLane();
  expect(useStore.getState().presentExpand).toBe("before");
  useStore.getState().togglePresentLane();
  expect(useStore.getState().presentExpand).toBe("after");
  useStore.getState().setPresentExpand(null);
  expect(useStore.getState().presentExpand).toBeNull();
  useStore.getState().setPresent(false);
  expect(useStore.getState().view).toBe(ViewMode.After);
  expect(useStore.getState().presentExpand).toBeNull();
});

test("board orientation persists and is not an undo entry", () => {
  expect(useStore.getState().boardOrientation).toBe("horizontal");
  const past = useStore.getState().past.length;
  const epoch = useStore.getState().canvasEpoch;
  useStore.getState().setBoardOrientation("vertical");
  expect(useStore.getState().boardOrientation).toBe("vertical");
  expect(localStorage.getItem(LS_BOARD_ORIENTATION)).toBe("vertical");
  expect(useStore.getState().past.length).toBe(past);
  expect(useStore.getState().canvasEpoch).toBe(epoch);
  useStore.getState().setBoardOrientation("horizontal");
  expect(useStore.getState().boardOrientation).toBe("horizontal");
  expect(localStorage.getItem(LS_BOARD_ORIENTATION)).toBe("horizontal");
});
