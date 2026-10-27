/**
 * Load/save the workflow document in localStorage, plus plain file downloads.
 * Theme, keybind, sound, and inspector-fold keys live here so persist concerns stay in one module.
 *
 * Persistence status is saved / dirty / unavailable (SH-11). Failed startup
 * payloads stay under LS_WORKFLOW until the user downloads or starts fresh (SH-10).
 * localStorage is pretty JSON. Save as… and Save copy go through fileSave.ts (SH-13).
 */
import { restoreBlankActorFills } from "../workflow/actors";
import { ColorScheme } from "../workflow/catalogs";
import { parseDocument } from "../workflow/migrate";
import type { GraphViolation } from "../workflow/graph";
import { ILLUSTRATOR_FILE_MIME, WORKFLOW_JSON_MIME } from "../workflow/serialize";
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
import {
  BUILTIN_THEMES,
  CHROME_THEME_DEFAULTS,
  CUSTOM_THEME_ID_PREFIX,
  DEFAULT_THEME_ID,
  chromeThemesEqual,
  isBuiltinThemeId,
  legacyThemeToBody,
  parseChromeTheme,
  themePresetSchema,
  uniqueThemeName,
  type ThemePreset,
} from "../app/theme/chromeTheme";
import { shortId } from "../workflow/ids";

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

/** Pretty JSON for localStorage. Files use workflowToIllustrator. */
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
/** Improvement 65 hex map; migrated into LS_THEMES on load and then removed. */
export const LS_CHROME_THEME = "automation-pitch.chrome-theme";
export const LS_THEMES = "automation-pitch.themes";
export const THEMES_STORAGE_VERSION = 1;
export const MIGRATED_THEME_NAME = "My theme";
export const SAVE_COPY_FILENAME = "untitled.illustrator";
export const RECOVERY_COPY_FILENAME = "automation-pitch.recovery.json";

/** Trigger a file download. No-op when Blob URLs are missing. */
export function downloadTextFile(
  filename: string,
  contents: string,
  mimeType: string = ILLUSTRATOR_FILE_MIME,
): void {
  downloadBlob(filename, new Blob([contents], { type: mimeType }));
}

export function downloadBlob(filename: string, blob: Blob): void {
  if (typeof document === "undefined" || typeof URL.createObjectURL !== "function") {
    return;
  }
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

/** Applied preset id plus the user's own presets. Built-ins are constants, never stored. */
export type ThemesState = { selected: string; custom: ThemePreset[] };

export function defaultThemesState(): ThemesState {
  return { selected: DEFAULT_THEME_ID, custom: [] };
}

export function newCustomThemeId(): string {
  return `${CUSTOM_THEME_ID_PREFIX}${shortId()}`;
}

/** Parse the stored themes blob leniently: bad custom entries are skipped, unknown ids fall back to Ice. */
export function parseThemesState(raw: unknown): ThemesState {
  const out = defaultThemesState();
  if (typeof raw !== "object" || raw === null) return out;
  const rec = raw as Record<string, unknown>;
  const custom = Array.isArray(rec.custom) ? rec.custom : [];
  const seenIds = new Set<string>(BUILTIN_THEMES.map((t) => t.id));
  for (const entry of custom) {
    const parsed = themePresetSchema.safeParse(entry);
    if (!parsed.success) continue;
    if (isBuiltinThemeId(parsed.data.id) || seenIds.has(parsed.data.id)) continue;
    seenIds.add(parsed.data.id);
    out.custom.push({
      id: parsed.data.id,
      name: uniqueThemeName(
        parsed.data.name,
        [...BUILTIN_THEMES, ...out.custom].map((t) => t.name),
      ),
      colors: { ...parsed.data.colors },
      texture: { ...parsed.data.texture },
    });
  }
  const selected = typeof rec.selected === "string" ? rec.selected : DEFAULT_THEME_ID;
  out.selected =
    isBuiltinThemeId(selected) || out.custom.some((t) => t.id === selected)
      ? selected
      : DEFAULT_THEME_ID;
  return out;
}

function readThemesState(): ThemesState {
  try {
    const raw = localStorage.getItem(LS_THEMES);
    if (!raw) return defaultThemesState();
    return parseThemesState(JSON.parse(raw));
  } catch {
    return defaultThemesState();
  }
}

/**
 * Improvement 65 stored one hex map. On first load it becomes the custom preset
 * "My theme" (selected), or is dropped when it equals Ice. The old key is removed either way.
 */
export function migrateLegacyChromeTheme(state: ThemesState): ThemesState {
  let raw: string | null;
  try {
    raw = localStorage.getItem(LS_CHROME_THEME);
  } catch {
    return state;
  }
  if (raw == null) return state;
  let next = state;
  try {
    const legacy = parseChromeTheme(JSON.parse(raw));
    if (!chromeThemesEqual(legacy, CHROME_THEME_DEFAULTS)) {
      const preset: ThemePreset = {
        id: newCustomThemeId(),
        name: uniqueThemeName(
          MIGRATED_THEME_NAME,
          [...BUILTIN_THEMES, ...state.custom].map((t) => t.name),
        ),
        ...legacyThemeToBody(legacy),
      };
      next = { selected: preset.id, custom: [...state.custom, preset] };
    }
  } catch {
    /* unreadable legacy map: nothing to carry over */
  }
  try {
    localStorage.removeItem(LS_CHROME_THEME);
  } catch {
    /* ignore */
  }
  if (next !== state) saveThemes(next);
  return next;
}

/** Themes at startup: stored state plus the one-time Improvement 65 migration. */
export function loadThemes(): ThemesState {
  return migrateLegacyChromeTheme(readThemesState());
}

export function saveThemes(state: ThemesState) {
  try {
    if (state.selected === DEFAULT_THEME_ID && state.custom.length === 0) {
      localStorage.removeItem(LS_THEMES);
      return;
    }
    localStorage.setItem(
      LS_THEMES,
      JSON.stringify(
        { version: THEMES_STORAGE_VERSION, selected: state.selected, custom: state.custom },
        null,
        2,
      ),
    );
  } catch {
    /* preference is session-only if storage is denied */
  }
}

