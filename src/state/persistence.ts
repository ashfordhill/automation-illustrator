/**
 * Load/save the workflow document as JSON (Import menu + localStorage).
 * Theme and keybind keys live here so persist concerns stay in one module.
 *
 * Persistence status is saved / dirty / unavailable (SH-11). Failed startup
 * payloads stay under LS_WORKFLOW until recovery UI (Slice 5) discards them (SH-10).
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

