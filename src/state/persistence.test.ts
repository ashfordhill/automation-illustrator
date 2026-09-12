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
  LS_BOARD_ORIENTATION,
  LS_INSPECTOR_COLLAPSED,
  LS_RIGHT_CLICK_DELETE,
  LS_SIMPLIFY,
  LS_SOUND,
  LS_THEME,
  LS_WORKFLOW,
  SAVE_COPY_FILENAME,
  saveBoardOrientation,
  saveInspectorCollapsed,
  saveRightClickDelete,
  saveSimplifyPrefs,
  saveSound,
  saveTheme,
  writeWorkflow,
  type StorageLike,
} from "./persistence";
import { oakParkInvoice } from "../demos/oakParkInvoice";
import { robotMailroom, MAILROOM_IDS } from "../demos/robotMailroom";
import { ColorScheme, SplitKind, StepKind, WorkflowNodeKind } from "../workflow/catalogs";
import { emptyAfterOverlay, emptyWorkflow, type WorkflowDoc } from "../workflow/types";
import { workflowToYaml } from "../workflow/serialize";

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
  expect(result.workflow.after.assignments[MAILROOM_IDS.scan]).toBe(MAILROOM_IDS.mailbot);
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

test("downloadWorkflowCopy writes a YAML attachment named from the project", () => {
  const click = vi.fn();
  const createObjectURL = vi.fn((blob: Blob) => {
    expect(blob.type).toBe("text/yaml");
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
  expect(anchor.download).toBe("untitled.yaml");
  downloadWorkflowCopy(robotMailroom());
  expect(anchor.download).toBe("robot-mailroom.yaml");
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
