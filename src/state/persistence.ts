/**
 * Load/save the workflow document (Import / Export + localStorage).
 * Theme, keybind, sound, and inspector-fold keys live here so persist concerns stay in one module.
 *
 * Persistence status is saved / dirty / unavailable (SH-11). Failed startup
 * payloads stay under LS_WORKFLOW until the user downloads or starts fresh (SH-10).
 * localStorage is pretty JSON. Export and Save copy download YAML (SH-13).
 */
import { restoreBlankActorFills } from "../workflow/actors";
import { ColorScheme } from "../workflow/catalogs";
import { parseDocument } from "../workflow/migrate";
import type { GraphViolation } from "../workflow/graph";
import {
  WORKFLOW_JSON_MIME,
  WORKFLOW_YAML_MIME,
  workflowExportFilename,
  workflowToYaml,
} from "../workflow/serialize";
import {
  parseBoardOrientation,
  type BoardOrientation,
} from "../board/flow/flowProfile";
import {
  DEFAULT_SIMPLIFY_PREFS,
  parseSimplifyPrefs,
  type SimplifyPrefs,
} from "../board/simplify/prefs";
import type { WorkflowDoc } from "../workflow/types";

export type PersistStatus = "saved" | "dirty" | "unavailable";

export type RecoveryState = {
  raw: string;
  violations: GraphViolation[];
  message: string;
};

export type StorageLike = Pick<Storage, "getItem" | "setItem">;

export type HydrateResult = {
  workflow: WorkflowDoc;
  persistStatus: PersistStatus;
  recovery: RecoveryState | null;
  unfolded?: boolean;
  droppedAfterOnly?: boolean;
};

/** Pretty JSON for localStorage. Files use YAML via workflowToYaml. */
export function toJson(doc: WorkflowDoc): string {
  return JSON.stringify(doc, null, 2);
}

/** Parse a saved board; throws if the candidate is not a valid workflow. */
export function fromJson(raw: string): WorkflowDoc {
  const parsed = parseDocument(raw);
  if (!parsed.ok) {
    throw new Error(parsed.message);
  }
  return parsed.doc;
}

export const LS_WORKFLOW = "automation-pitch.workflow";
export const LS_KEYMAP = "automation-pitch.keymap";
export const LS_THEME = "automation-pitch.theme";
export const LS_SOUND = "automation-pitch.sound";
export const LS_RIGHT_CLICK_DELETE = "automation-pitch.right-click-delete";
export const LS_INSPECTOR_COLLAPSED = "automation-pitch.inspectorCollapsed";
export const LS_SIMPLIFY = "automation-pitch.simplify";
export const LS_BOARD_ORIENTATION = "automation-pitch.board-orientation";
export const SAVE_COPY_FILENAME = "untitled.yaml";
export const RECOVERY_COPY_FILENAME = "automation-pitch.recovery.json";

/** Trigger a file download. No-op when Blob URLs are missing. */
export function downloadTextFile(
  filename: string,
  contents: string,
  mimeType: string = WORKFLOW_YAML_MIME,
): void {
  if (typeof document === "undefined" || typeof URL.createObjectURL !== "function") {
    return;
  }
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/** Export / Save copy of the live validated v2 document as YAML. */
export function downloadWorkflowCopy(doc: WorkflowDoc): void {
  downloadTextFile(workflowExportFilename(doc), workflowToYaml(doc), WORKFLOW_YAML_MIME);
}

/** Download the untouched failed startup payload (SH-10). */
export function downloadRecoveryCopy(raw: string): void {
  downloadTextFile(RECOVERY_COPY_FILENAME, raw, WORKFLOW_JSON_MIME);
}

function browserStorage(): StorageLike | null {
  try {
    return localStorage;
  } catch {
    return null;
  }
}

export function writeWorkflow(
  doc: WorkflowDoc,
  storage: StorageLike | null = browserStorage(),
): PersistStatus {
  if (!storage) return "unavailable";
  try {
    storage.setItem(LS_WORKFLOW, toJson(doc));
    return "saved";
  } catch {
    return "unavailable";
  }
}

/**
 * Read, parse, and on success persist v2. Invalid graphs keep the raw value
 * on the original key and return recovery state instead of writing (SH-09, SH-10).
 */
export function hydratePersistedWorkflow(
  fallback: () => WorkflowDoc,
  storage: StorageLike | null = browserStorage(),
): HydrateResult {
  if (!storage) {
    return { workflow: fallback(), persistStatus: "unavailable", recovery: null };
  }

  let raw: string | null;
  try {
    raw = storage.getItem(LS_WORKFLOW);
  } catch {
    return { workflow: fallback(), persistStatus: "unavailable", recovery: null };
  }

  if (raw == null || raw === "") {
    const workflow = fallback();
    return { workflow, persistStatus: writeWorkflow(workflow, storage), recovery: null };
  }

  const parsed = parseDocument(raw);
  if (!parsed.ok) {
    return {
      workflow: fallback(),
      persistStatus: "dirty",
      recovery: {
        raw,
        violations: parsed.violations,
        message: parsed.message,
      },
    };
  }

  const actors = restoreBlankActorFills(parsed.doc.actors);
  const workflow = actors === parsed.doc.actors ? parsed.doc : { ...parsed.doc, actors };
  return {
    workflow,
    persistStatus: writeWorkflow(workflow, storage),
    recovery: null,
    unfolded: parsed.unfolded,
    droppedAfterOnly: parsed.droppedAfterOnly,
  };
}

/** Last chosen light/dark. There is no hamburger toggle; tests may still set this. */
export function loadTheme(): ColorScheme {
  try {
    const v = localStorage.getItem(LS_THEME);
    if (v === ColorScheme.Dark || v === ColorScheme.Light) return v;
  } catch {
    /* ignore */
  }
  return ColorScheme.Light;
}

export function saveTheme(scheme: ColorScheme) {
  try {
    localStorage.setItem(LS_THEME, scheme);
  } catch {
    /* theme is session-only if storage is denied */
  }
}

/** Sound is on unless the user saved `off` (SH-03). */
export function loadSound(): boolean {
  try {
    return localStorage.getItem(LS_SOUND) !== "off";
  } catch {
    return true;
  }
}

export function saveSound(on: boolean) {
  try {
    localStorage.setItem(LS_SOUND, on ? "on" : "off");
  } catch {
    /* preference is session-only if storage is denied */
  }
}

/** Right-click Tile delete is off unless the saved value is exactly `on`. */
export function loadRightClickDelete(): boolean {
  try {
    return localStorage.getItem(LS_RIGHT_CLICK_DELETE) === "on";
  } catch {
    return false;
  }
}

export function saveRightClickDelete(on: boolean) {
  try {
    localStorage.setItem(LS_RIGHT_CLICK_DELETE, on ? "on" : "off");
  } catch {
    /* preference is session-only if storage is denied */
  }
}

/** View (word-web) pref. Missing or invalid JSON is off. Hide data is ignored. */
export function loadSimplifyPrefs(): SimplifyPrefs {
  try {
    return parseSimplifyPrefs(localStorage.getItem(LS_SIMPLIFY));
  } catch {
    return { ...DEFAULT_SIMPLIFY_PREFS };
  }
}

export function saveSimplifyPrefs(prefs: SimplifyPrefs) {
  try {
    localStorage.setItem(LS_SIMPLIFY, JSON.stringify(prefs));
  } catch {
    /* preference is session-only if storage is denied */
  }
}

/** Board orientation. Missing or unknown values are horizontal. */
export function loadBoardOrientation(): BoardOrientation {
  try {
    return parseBoardOrientation(localStorage.getItem(LS_BOARD_ORIENTATION));
  } catch {
    return "horizontal";
  }
}

export function saveBoardOrientation(orientation: BoardOrientation) {
  try {
    localStorage.setItem(LS_BOARD_ORIENTATION, orientation);
  } catch {
    /* preference is session-only if storage is denied */
  }
}

/** Inspector starts open unless the saved value is exactly `on` (folded strip). */
export function loadInspectorCollapsed(): boolean {
  try {
    return localStorage.getItem(LS_INSPECTOR_COLLAPSED) === "on";
  } catch {
    return false;
  }
}

export function saveInspectorCollapsed(collapsed: boolean) {
  try {
    localStorage.setItem(LS_INSPECTOR_COLLAPSED, collapsed ? "on" : "off");
  } catch {
    /* preference is session-only if storage is denied */
  }
}

