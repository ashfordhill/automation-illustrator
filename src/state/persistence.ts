/**
 * Load/save the workflow document as JSON (Import menu + localStorage).
 * Theme, keybind, and sound keys live here so persist concerns stay in one module.
 *
 * Persistence status is saved / dirty / unavailable (SH-11). Failed startup
 * payloads stay under LS_WORKFLOW until the user downloads or starts fresh (SH-10).
 * Save copy downloads the validated v2 document (SH-13).
 */
import { ColorScheme } from "../workflow/catalogs";
import { parseDocument } from "../workflow/migrate";
import type { GraphViolation } from "../workflow/graph";
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
};

/** Pretty JSON for localStorage and the Import file picker. */
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
export const SAVE_COPY_FILENAME = "automation-pitch.json";
export const RECOVERY_COPY_FILENAME = "automation-pitch.recovery.json";

/** Trigger a JSON file download (Save copy / recovery). No-op when Blob URLs are missing. */
export function downloadTextFile(filename: string, contents: string): void {
  if (typeof document === "undefined" || typeof URL.createObjectURL !== "function") {
    return;
  }
  const blob = new Blob([contents], { type: "application/json" });
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

/** Save copy of the live validated v2 document (SH-06, SH-13). */
export function downloadWorkflowCopy(doc: WorkflowDoc): void {
  downloadTextFile(SAVE_COPY_FILENAME, toJson(doc));
}

/** Download the untouched failed startup payload (SH-10). */
export function downloadRecoveryCopy(raw: string): void {
  downloadTextFile(RECOVERY_COPY_FILENAME, raw);
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

  return {
    workflow: parsed.doc,
    persistStatus: writeWorkflow(parsed.doc, storage),
    recovery: null,
    unfolded: parsed.unfolded,
  };
}

/** Last chosen light/dark; Toolbar hamburger toggles this. */
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

/** Sound is off unless the saved value is exactly `on` (SH-03). */
export function loadSound(): boolean {
  try {
    return localStorage.getItem(LS_SOUND) === "on";
  } catch {
    return false;
  }
}

export function saveSound(on: boolean) {
  try {
    localStorage.setItem(LS_SOUND, on ? "on" : "off");
  } catch {
    /* preference is session-only if storage is denied */
  }
}

