import { afterEach, expect, test, vi } from "vitest";
import {
  downloadTextFile,
  downloadWorkflowCopy,
  hydratePersistedWorkflow,
  loadBoardOrientation,
  loadInspectorCollapsed,
  loadRightClickDelete,
  loadSimplifyPrefs,
  loadSound,
  loadTheme,
  loadThemes,
  LS_BOARD_ORIENTATION,
  LS_CHROME_THEME,
  LS_INSPECTOR_COLLAPSED,
  LS_RIGHT_CLICK_DELETE,
  LS_SIMPLIFY,
  LS_SOUND,
  LS_THEME,
  LS_THEMES,
  LS_WORKFLOW,
  MIGRATED_THEME_NAME,
  parseThemesState,
  SAVE_COPY_FILENAME,
  saveBoardOrientation,
  saveInspectorCollapsed,
  saveThemes,
  saveRightClickDelete,
  saveSimplifyPrefs,
  saveSound,
  saveTheme,
  writeWorkflow,
  type StorageLike,
} from "./persistence";
import { OAK_PARK_IDS, oakParkInvoice } from "../demos/oakParkInvoice";
import { robotMailroom, MAILROOM_IDS } from "../demos/robotMailroom";
import { AssignmentLane, ColorScheme, SplitKind, StepKind, WorkflowNodeKind } from "../workflow/catalogs";
import { emptyAfterOverlay, emptyWorkflow, laneAssignments, type WorkflowDoc } from "../workflow/types";
import { workflowToYaml } from "../workflow/serialize";
import { CHROME_THEME_DEFAULTS, ICE_THEME, mixSrgb } from "../app/theme/chromeTheme";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

class MemoryStorage implements StorageLike {
  private data = new Map<string, string>();
  getItem(key: string) {
    return this.data.has(key) ? this.data.get(key)! : null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
}

class UnreadableStorage implements StorageLike {
  getItem(): string | null {
    throw new Error("denied");
  }
  setItem() {}
}

class UnwritableStorage extends MemoryStorage {
  setItem(): void {
    throw new Error("quota");
  }
}

const fallback = (): WorkflowDoc => ({
  version: 2,
  actors: [],
  nodes: [
    {
      id: "s_fb",
      type: WorkflowNodeKind.Step,
      position: { x: 0, y: 0 },
      stepKind: StepKind.Other,
      title: "fallback",
      detail: "",
      split: SplitKind.Exclusive,
    },
  ],
  edges: [],
  assignments: {},
  after: emptyAfterOverlay(),
});

const validV1 = JSON.stringify({
  version: 1,
  actors: [],
  nodes: [
    {
      id: "s_read",
      type: "step",
      position: { x: 0, y: 0 },
      stepKind: "other",
      title: "ok",
      detail: "",
      split: "exclusive",
    },
  ],
  edges: [],
  assignments: { before: {}, after: {} },
});

test("hydrate restores a picker-white Missy to her purple preset", () => {
  const storage = new MemoryStorage();
  const washed = oakParkInvoice();
  storage.setItem(
    LS_WORKFLOW,
    JSON.stringify({
      ...washed,
      actors: washed.actors.map((a) => (a.name === "Missy" ? { ...a, color: "#ffffff" } : a)),
    }),
  );
  const result = hydratePersistedWorkflow(fallback, storage);
  expect(result.workflow.actors.find((a) => a.name === "Missy")?.color).toBe("#c89bf5");
});

test("empty storage writes the fallback and reports saved", () => {
  const storage = new MemoryStorage();
  const result = hydratePersistedWorkflow(fallback, storage);
  expect(result.recovery).toBeNull();
  expect(result.persistStatus).toBe("saved");
  expect(result.workflow.nodes[0]?.id).toBe("s_fb");
  expect(JSON.parse(storage.getItem(LS_WORKFLOW)!).version).toBe(2);
});

test("valid v1 storage migrates and overwrites with v2", () => {
  const storage = new MemoryStorage();
  storage.setItem(LS_WORKFLOW, validV1);
  const result = hydratePersistedWorkflow(fallback, storage);
  expect(result.recovery).toBeNull();
  expect(result.persistStatus).toBe("saved");
  expect(result.workflow.version).toBe(2);
  const saved = JSON.parse(storage.getItem(LS_WORKFLOW)!);
  expect(saved.version).toBe(2);
  expect(saved.after.groups).toEqual([]);
  expect(saved.assignments).toEqual({});
});

test("grouped v2 storage unfolds groups and keeps After Who", () => {
  const storage = new MemoryStorage();
  const mail = robotMailroom();
  const grouped = {
    ...mail,
    after: {
      ...mail.after,
      groups: [
        {
          id: MAILROOM_IDS.group,
          memberIds: [MAILROOM_IDS.scan, MAILROOM_IDS.lookup, MAILROOM_IDS.route],
        },
      ],
    },
  };
  storage.setItem(LS_WORKFLOW, JSON.stringify(grouped));
  const result = hydratePersistedWorkflow(fallback, storage);
  expect(result.recovery).toBeNull();
  expect(result.unfolded).toBe(true);
  expect(result.workflow.after.groups).toEqual([]);
  expect(laneAssignments(result.workflow, AssignmentLane.After)[MAILROOM_IDS.scan]).toBe(MAILROOM_IDS.mailbot);
  expect(JSON.parse(storage.getItem(LS_WORKFLOW)!).after.groups).toEqual([]);
});

test("YAML stuffed into localStorage still hydrates and is rewritten as JSON", () => {
  const storage = new MemoryStorage();
  storage.setItem(LS_WORKFLOW, workflowToYaml(robotMailroom()));
  const result = hydratePersistedWorkflow(fallback, storage);
  expect(result.recovery).toBeNull();
  expect(result.workflow.nodes[0]?.id).toBe(MAILROOM_IDS.open);
  const saved = storage.getItem(LS_WORKFLOW)!;
  expect(saved.trimStart().startsWith("{")).toBe(true);
  expect(JSON.parse(saved).version).toBe(2);
});

test("an After copy and both look books survive save and reload; storage has no file header", () => {
  const storage = new MemoryStorage();
  const doc = oakParkInvoice();
  doc.looks = { [OAK_PARK_IDS.alice]: { accessories: ["sunglasses"] } };
  doc.after = { ...doc.after, looks: { [OAK_PARK_IDS.roy]: { accessories: ["tablet"] } } };
  expect(doc.after.fork).not.toBeNull();
  expect(writeWorkflow(doc, storage)).toBe("saved");
  expect(JSON.parse(storage.getItem(LS_WORKFLOW)!)).not.toHaveProperty("type");
  const result = hydratePersistedWorkflow(fallback, storage);
  expect(result.recovery).toBeNull();
  expect(result.workflow).toEqual(doc);
});

test("invalid graph keeps the raw key and returns recovery (SH-09, SH-10)", () => {
  const storage = new MemoryStorage();
  const raw = JSON.stringify({
    version: 1,
    actors: [],
    nodes: [
      {
        id: "a",
        type: "step",
        position: { x: 0, y: 0 },
        stepKind: "other",
        title: "",
        detail: "",
        split: "exclusive",
      },
      {
        id: "b",
        type: "step",
        position: { x: 0, y: 40 },
        stepKind: "other",
        title: "",
        detail: "",
        split: "exclusive",
      },
    ],
    edges: [
      { id: "e1", source: "a", target: "b", label: "" },
      { id: "e2", source: "b", target: "a", label: "" },
    ],
    assignments: { before: {}, after: {} },
  });
  storage.setItem(LS_WORKFLOW, raw);
  const result = hydratePersistedWorkflow(fallback, storage);
  expect(storage.getItem(LS_WORKFLOW)).toBe(raw);
  expect(result.persistStatus).toBe("dirty");
  expect(result.recovery?.raw).toBe(raw);
  expect(result.recovery?.violations.map((v) => v.code)).toEqual(
    expect.arrayContaining(["cycle", "no-root"]),
  );
  expect(result.workflow.nodes[0]?.id).toBe("s_fb");
});

test("getItem failure is unavailable and does not write", () => {
  const result = hydratePersistedWorkflow(fallback, new UnreadableStorage());
  expect(result.persistStatus).toBe("unavailable");
  expect(result.recovery).toBeNull();
  expect(result.workflow.nodes[0]?.id).toBe("s_fb");
});

test("setItem failure is unavailable; repeated writes stay a single status", () => {
  const storage = new UnwritableStorage();
  const first = hydratePersistedWorkflow(fallback, storage);
  expect(first.persistStatus).toBe("unavailable");
  const second = writeWorkflow(emptyWorkflow(), storage);
  expect(second).toBe("unavailable");
});

test("downloadWorkflowCopy writes a .illustrator attachment named from the project", () => {
  const click = vi.fn();
  const createObjectURL = vi.fn((blob: Blob) => {
    expect(blob.type).toBe("application/vnd.automation-illustrator+json");
    return "blob:test";
  });
  const revoke = vi.fn();
  vi.stubGlobal("URL", { createObjectURL, revokeObjectURL: revoke });
  const realCreate = document.createElement.bind(document);
  const anchor = {
    href: "",
    download: "",
    rel: "",
    click,
    remove: () => {},
  };
  vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
    if (tag === "a") return anchor as unknown as HTMLAnchorElement;
    return realCreate(tag);
  });
  vi.spyOn(document.body, "appendChild").mockImplementation((node) => node);
  downloadWorkflowCopy(emptyWorkflow());
  expect(anchor.download).toBe("untitled.illustrator");
  downloadWorkflowCopy(robotMailroom());
  expect(anchor.download).toBe("robot-mailroom.illustrator");
  expect(createObjectURL).toHaveBeenCalled();
  expect(click).toHaveBeenCalledTimes(2);
  expect(revoke).toHaveBeenCalled();
  downloadTextFile(SAVE_COPY_FILENAME, "{}");
  expect(click).toHaveBeenCalledTimes(3);
});

test("sound preference defaults on and only 'off' disables it (SH-03)", () => {
  localStorage.clear();
  expect(loadSound()).toBe(true);
  saveSound(false);
  expect(localStorage.getItem(LS_SOUND)).toBe("off");
  expect(loadSound()).toBe(false);
  saveSound(true);
  expect(loadSound()).toBe(true);
  localStorage.setItem(LS_SOUND, "yes");
  expect(loadSound()).toBe(true);
});

test("theme preference defaults light and round-trips (P-09)", () => {
  localStorage.clear();
  expect(loadTheme()).toBe(ColorScheme.Light);
  saveTheme(ColorScheme.Dark);
  expect(localStorage.getItem(LS_THEME)).toBe(ColorScheme.Dark);
  expect(loadTheme()).toBe(ColorScheme.Dark);
  saveTheme(ColorScheme.Light);
  expect(loadTheme()).toBe(ColorScheme.Light);
});

test("inspector fold defaults open and only 'on' collapses it (P-05)", () => {
  localStorage.clear();
  expect(loadInspectorCollapsed()).toBe(false);
  saveInspectorCollapsed(true);
  expect(localStorage.getItem(LS_INSPECTOR_COLLAPSED)).toBe("on");
  expect(loadInspectorCollapsed()).toBe(true);
  saveInspectorCollapsed(false);
  expect(loadInspectorCollapsed()).toBe(false);
  localStorage.setItem(LS_INSPECTOR_COLLAPSED, "yes");
  expect(loadInspectorCollapsed()).toBe(false);
});

test("simplify prefs default off and persist a JSON object", () => {
  localStorage.clear();
  expect(loadSimplifyPrefs()).toEqual({
    hideVisuals: false,
  });
  saveSimplifyPrefs({
    hideVisuals: true,
  });
  expect(JSON.parse(localStorage.getItem(LS_SIMPLIFY) ?? "{}")).toEqual({
    hideVisuals: true,
  });
  expect(loadSimplifyPrefs().hideVisuals).toBe(true);
  localStorage.setItem(
    LS_SIMPLIFY,
    JSON.stringify({ hideVisualsOnZoomOut: true, hideVisuals: false, hideData: true }),
  );
  expect(loadSimplifyPrefs()).toEqual({ hideVisuals: false });
  localStorage.setItem(LS_SIMPLIFY, "nope");
  expect(loadSimplifyPrefs()).toEqual({ hideVisuals: false });
});

test("right-click-delete defaults off and only 'on' enables it", () => {
  localStorage.clear();
  expect(loadRightClickDelete()).toBe(false);
  saveRightClickDelete(true);
  expect(localStorage.getItem(LS_RIGHT_CLICK_DELETE)).toBe("on");
  expect(loadRightClickDelete()).toBe(true);
  saveRightClickDelete(false);
  expect(loadRightClickDelete()).toBe(false);
  localStorage.setItem(LS_RIGHT_CLICK_DELETE, "yes");
  expect(loadRightClickDelete()).toBe(false);
});

test("themes default to Ice with no custom presets and persist as pretty JSON", () => {
  localStorage.clear();
  expect(loadThemes()).toEqual({ selected: "ice", custom: [] });
  expect(localStorage.getItem(LS_THEMES)).toBeNull();
  const preset = { ...ICE_THEME, id: "custom-abc12345", name: "Mine" };
  saveThemes({ selected: "custom-abc12345", custom: [preset] });
  const raw = localStorage.getItem(LS_THEMES) ?? "";
  expect(raw).toContain("\n  ");
  expect(JSON.parse(raw)).toEqual({ version: 1, selected: "custom-abc12345", custom: [preset] });
  expect(loadThemes()).toEqual({ selected: "custom-abc12345", custom: [preset] });
  saveThemes({ selected: "ice", custom: [] });
  expect(localStorage.getItem(LS_THEMES)).toBeNull();
  localStorage.setItem(LS_THEMES, "nope");
  expect(loadThemes()).toEqual({ selected: "ice", custom: [] });
});

test("themes: missing selected id falls back to Ice; bad entries and duplicate names are cleaned", () => {
  localStorage.clear();
  const a = { ...ICE_THEME, id: "custom-a", name: "Dup" };
  const b = { ...ICE_THEME, id: "custom-b", name: "dup" };
  const stored = {
    version: 1,
    selected: "custom-missing",
    custom: [a, b, { id: "custom-bad", name: "Bad", colors: { chrome: "red" } }, { ...a, id: "ice" }],
  };
  localStorage.setItem(LS_THEMES, JSON.stringify(stored));
  const loaded = loadThemes();
  expect(loaded.selected).toBe("ice");
  expect(loaded.custom.map((t) => t.name)).toEqual(["Dup", "dup 2"]);
  expect(parseThemesState({ selected: "plum", custom: [] }).selected).toBe("plum");
});

test("Improvement 65 hex map migrates to a selected custom preset and the old key is removed", () => {
  localStorage.clear();
  localStorage.setItem(
    LS_CHROME_THEME,
    JSON.stringify({
      chrome: "#802020",
      chromeBtn: "#f7fcfe",
      chromeLine: "#5ec8e8",
      chromeInk: "#f3fbfe",
      yellow: "#e8c14a",
      paper: "#e8f4fa",
    }),
  );
  const migrated = loadThemes();
  expect(localStorage.getItem(LS_CHROME_THEME)).toBeNull();
  expect(migrated.custom).toHaveLength(1);
  const mine = migrated.custom[0]!;
  expect(mine.name).toBe(MIGRATED_THEME_NAME);
  expect(mine.id.startsWith("custom-")).toBe(true);
  expect(migrated.selected).toBe(mine.id);
  expect(mine.colors.chrome).toBe("#802020");
  expect(mine.colors.chromeWell).toBe(mixSrgb("#802020", "#000000", 0.62));
  expect(mine.texture).toEqual({ pattern: "dots", color: mixSrgb("#e8f4fa", "#802020", 0.72) });
  expect(JSON.parse(localStorage.getItem(LS_THEMES) ?? "{}").selected).toBe(mine.id);
  // Second load is stable.
  expect(loadThemes()).toEqual(migrated);

  // A stored map equal to Ice is simply dropped.
  localStorage.clear();
  localStorage.setItem(LS_CHROME_THEME, JSON.stringify(CHROME_THEME_DEFAULTS));
  expect(loadThemes()).toEqual({ selected: "ice", custom: [] });
  expect(localStorage.getItem(LS_CHROME_THEME)).toBeNull();
  expect(localStorage.getItem(LS_THEMES)).toBeNull();
});

test("board orientation defaults horizontal and only vertical is stored", () => {
  localStorage.clear();
  expect(loadBoardOrientation()).toBe("horizontal");
  saveBoardOrientation("vertical");
  expect(localStorage.getItem(LS_BOARD_ORIENTATION)).toBe("vertical");
  expect(loadBoardOrientation()).toBe("vertical");
  saveBoardOrientation("horizontal");
  expect(loadBoardOrientation()).toBe("horizontal");
  localStorage.setItem(LS_BOARD_ORIENTATION, "sideways");
  expect(loadBoardOrientation()).toBe("horizontal");
});
