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
  s.resetThemes();
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

const rootVar = (name: string) => document.documentElement.style.getPropertyValue(name);

test("theme draft edits stay off :root until Save; Save applies and closes (P-09)", () => {
  const s = useStore.getState();
  expect(s.appliedTheme().id).toBe("ice");
  const past = s.past.length;
  s.openTheme();
  expect(useStore.getState().themeOpen).toBe(true);
  expect(useStore.getState().themeDraft?.presetId).toBe("ice");
  useStore.getState().setThemeDraft({ colors: { chrome: "#802020" } });
  expect(useStore.getState().themeDraft?.colors.chrome).toBe("#802020");
  expect(useStore.getState().themeDraftEdited()).toBe(true);
  expect(rootVar("--chrome")).toBe("");
  expect(useStore.getState().appliedTheme().colors.chrome).toBe("#0c3349");

  // Built-ins cannot be overwritten; Save as new creates and applies a custom preset.
  expect(useStore.getState().saveTheme("overwrite")).toBe(false);
  expect(useStore.getState().saveTheme({ name: "Ice" })).toBe(false);
  expect(useStore.getState().saveTheme({ name: "  Ember " })).toBe(true);
  const st = useStore.getState();
  expect(st.themeOpen).toBe(false);
  expect(st.themeDraft).toBeNull();
  expect(st.themes.custom).toHaveLength(1);
  expect(st.themes.custom[0]!.name).toBe("Ember");
  expect(st.themes.custom[0]!.id.startsWith("custom-")).toBe(true);
  expect(st.themes.selected).toBe(st.themes.custom[0]!.id);
  expect(rootVar("--chrome")).toBe("#802020");
  expect(rootVar("--chrome-well")).toBe("#07202d");
  expect(rootVar("--grid-dot")).toBe("#aabec8");
  const stored = JSON.parse(localStorage.getItem("automation-pitch.themes") ?? "{}");
  expect(stored.version).toBe(1);
  expect(stored.selected).toBe(st.themes.selected);
  expect(stored.custom[0].colors.chrome).toBe("#802020");
  expect(st.past.length).toBe(past);
});

test("closing the Theme window discards the draft; Reset restores the saved body", () => {
  useStore.getState().openTheme();
  useStore.getState().setThemeDraft({ texture: { pattern: "mesh" } });
  expect(useStore.getState().themeDraftEdited()).toBe(true);
  useStore.getState().resetThemeDraft();
  expect(useStore.getState().themeDraft?.texture.pattern).toBe("dots");
  expect(useStore.getState().themeDraftEdited()).toBe(false);

  useStore.getState().setThemeDraft({ colors: { paper: "#ffffff" } });
  useStore.getState().requestCloseTheme();
  expect(useStore.getState().themePrompt).toBe("discard");
  expect(useStore.getState().themeOpen).toBe(true);
  useStore.getState().closeTheme();
  expect(useStore.getState().themeOpen).toBe(false);
  expect(useStore.getState().themeDraft).toBeNull();
  expect(useStore.getState().appliedTheme().colors.paper).toBe("#e8f4fa");
  expect(rootVar("--paper")).toBe("");

  useStore.getState().openTheme();
  useStore.getState().requestCloseTheme();
  expect(useStore.getState().themePrompt).toBeNull();
  expect(useStore.getState().themeOpen).toBe(false);
});

test("selecting a preset loads it; Save on an unedited draft applies it; delete falls back to Ice", () => {
  useStore.getState().openTheme();
  useStore.getState().selectThemePreset("forest");
  expect(useStore.getState().themeDraft?.colors.chrome).toBe("#16382b");
  expect(useStore.getState().themeDraftEdited()).toBe(false);
  expect(useStore.getState().saveTheme("overwrite")).toBe(true);
  expect(useStore.getState().themes.selected).toBe("forest");
  expect(rootVar("--chrome-well")).toBe("#0e231b");
  expect(rootVar("--grid-dot")).toBe("#b8cdb4");

  useStore.getState().openTheme();
  useStore.getState().setThemeDraft({ colors: { chromeWell: "#111111" } });
  useStore.getState().saveTheme({ name: "Deep forest" });
  const customId = useStore.getState().themes.selected;
  expect(customId.startsWith("custom-")).toBe(true);
  expect(rootVar("--chrome-well")).toBe("#111111");

  useStore.getState().openTheme();
  useStore.getState().setThemeDraft({ colors: { chromeWell: "#222222" } });
  expect(useStore.getState().saveTheme("overwrite")).toBe(true);
  expect(useStore.getState().themes.custom[0]!.colors.chromeWell).toBe("#222222");

  useStore.getState().openTheme();
  useStore.getState().deleteThemePreset("ice");
  expect(useStore.getState().themes.custom).toHaveLength(1);
  useStore.getState().deleteThemePreset(customId);
  expect(useStore.getState().themes.custom).toHaveLength(0);
  expect(useStore.getState().themes.selected).toBe("ice");
  expect(useStore.getState().themeDraft?.presetId).toBe("ice");
  expect(rootVar("--chrome-well")).toBe("");
});

test("importTheme adds to My themes with a unique name and loads the draft without applying", () => {
  useStore.getState().openTheme();
  const yaml = [
    "version: 1",
    "name: Ice",
    "colors:",
    '  chrome: "#0c3349"',
    '  chromeWell: "#07202d"',
    '  chromeBtn: "#f7fcfe"',
    '  chromeLine: "#5ec8e8"',
    '  chromeInk: "#f3fbfe"',
    '  yellow: "#e8c14a"',
    '  paper: "#e8f4fa"',
    "texture:",
    "  pattern: rings",
    '  color: "#aabec8"',
    "",
  ].join("\n");
  expect(useStore.getState().importTheme(yaml)).toBe(true);
  const st = useStore.getState();
  expect(st.themes.custom).toHaveLength(1);
  expect(st.themes.custom[0]!.name).toBe("Ice 2");
  expect(st.themeDraft?.presetId).toBe(st.themes.custom[0]!.id);
  expect(st.themeDraft?.texture.pattern).toBe("rings");
  expect(st.themes.selected).toBe("ice");
  expect(rootVar("--chrome")).toBe("");

  expect(useStore.getState().importTheme("version: 2\nname: Nope\n")).toBe(false);
  expect(useStore.getState().notice).toBe("Theme file is not valid");
  expect(useStore.getState().themes.custom).toHaveLength(1);
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
