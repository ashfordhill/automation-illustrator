import { afterEach, beforeEach, expect, test } from "vitest";
import { ColorScheme, SelectionKind, ViewMode } from "../workflow/catalogs";
import { OAK_PARK_IDS } from "../demos/oakParkInvoice";
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
  s.setSoundEnabled(false);
}

beforeEach(() => {
  resetSession();
});

afterEach(() => {
  resetSession();
});

test("sound is off by default and persists on/off (SH-03)", () => {
  expect(useStore.getState().soundEnabled).toBe(false);
  useStore.getState().setSoundEnabled(true);
  expect(useStore.getState().soundEnabled).toBe(true);
  expect(localStorage.getItem("automation-pitch.sound")).toBe("on");
  useStore.getState().setSoundEnabled(false);
  expect(localStorage.getItem("automation-pitch.sound")).toBe("off");
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
