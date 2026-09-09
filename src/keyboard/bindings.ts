/**
 * Keyboard action catalog and localStorage IO.
 * Consumed by useAppKeys.ts (runtime) and KeybindsModal.tsx (rebind UI).
 * Store holds the live map; Toolbar shows prettyKey in tooltips.
 */
import { KeyAction } from "../workflow/catalogs";
import { LS_KEYMAP } from "../state/persistence";

export { KeyAction };

/** action id → KeyboardEvent key (lowercase, Space is `" "`). Empty string = unbound. */
export type Keymap = Record<KeyAction, string>;

/** Retired Slice 4 ids plus withdrawn Merge/Unmerge and the old 1/2 spawn keys. Ignored on load (SH-14). */
export const RETIRED_KEY_ACTIONS = [
  "toolPointer",
  "toolHand",
  "pathConfirm",
  "detachPath",
  "merge",
  "unmerge",
  "addBranchStep",
  "addBranchData",
] as const;

export const DEFAULT_KEYMAP: Keymap = {
  [KeyAction.Undo]: "backspace",
  [KeyAction.PanLeft]: "",
  [KeyAction.PanRight]: "",
  [KeyAction.PanUp]: "",
  [KeyAction.PanDown]: "",
  [KeyAction.Help]: "?",
  [KeyAction.ToggleView]: " ",
  [KeyAction.Confirm]: "enter",
  [KeyAction.Delete]: "delete",
  [KeyAction.AddPath]: "=",
  [KeyAction.RemoveNode]: "-",
  [KeyAction.ToggleDash]: ".",
  [KeyAction.AddStepIn]: "q",
  [KeyAction.AddStepOut]: "e",
  [KeyAction.AddDataIn]: "a",
  [KeyAction.AddDataOut]: "d",
  [KeyAction.LinkExisting]: "3",
};

export const ACTION_LABELS: Record<KeyAction, string> = {
  [KeyAction.Undo]: "Undo last",
  [KeyAction.PanLeft]: "Pan left",
  [KeyAction.PanRight]: "Pan right",
  [KeyAction.PanUp]: "Pan up",
  [KeyAction.PanDown]: "Pan down",
  [KeyAction.Help]: "Keybinds",
  [KeyAction.ToggleView]: "Toggle Before/After (present)",
  [KeyAction.Confirm]: "Confirm",
  [KeyAction.Delete]: "Remove selected Node",
  [KeyAction.AddPath]: "unused — pull the Path tab",
  [KeyAction.RemoveNode]: "Remove selected Node",
  [KeyAction.ToggleDash]: "Toggle Path solid / dotted",
  [KeyAction.AddStepIn]: "New Step to the left",
  [KeyAction.AddStepOut]: "New Step to the right",
  [KeyAction.AddDataIn]: "New Data to the left",
  [KeyAction.AddDataOut]: "New Data to the right",
  [KeyAction.LinkExisting]: "unused — pull the Path tab",
};

/** Normalize a keydown into the string we store in Keymap. */
export function eventKey(e: KeyboardEvent): string {
  if (e.key === " ") return " ";
  return e.key.toLowerCase();
}

/** Which KeyAction (if any) this event should fire. Unbound actions are skipped. */
export function actionFor(map: Keymap, e: KeyboardEvent): KeyAction | null {
  const k = eventKey(e);
  const hit = (Object.entries(map) as [KeyAction, string][]).find(([, v]) => v && v === k);
  return hit?.[0] ?? null;
}

/** True when this event matches a mapped action, including Shift+= as AddPath. */
export function keyIs(map: Keymap, action: KeyAction, e: KeyboardEvent): boolean {
  const want = map[action];
  if (!want) return false;
  const k = eventKey(e);
  if (k === want) return true;
  if (action === KeyAction.AddPath && (e.key === "+" || k === "+")) return true;
  return false;
}

/** Load from localStorage, filling gaps from the default map. Empty strings (unbound pan) are kept. */
export function loadKeymap(): Keymap {
  try {
    const raw = localStorage.getItem(LS_KEYMAP);
    if (!raw) return { ...DEFAULT_KEYMAP };
    const saved = JSON.parse(raw) as Record<string, unknown>;
    return { ...DEFAULT_KEYMAP, ...pickKnown(saved) };
  } catch {
    return { ...DEFAULT_KEYMAP };
  }
}

/** Ignore unknown and retired keys from older localStorage maps (SH-14). */
export function pickKnown(saved: Record<string, unknown>): Partial<Keymap> {
  const next: Partial<Keymap> = {};
  const retired = new Set<string>(RETIRED_KEY_ACTIONS);
  for (const key of Object.keys(DEFAULT_KEYMAP) as KeyAction[]) {
    if (retired.has(key)) continue;
    const value = saved[key];
    if (typeof value === "string") next[key] = value;
  }
  return next;
}

export function saveKeymap(map: Keymap) {
  try {
    localStorage.setItem(LS_KEYMAP, JSON.stringify(map));
  } catch {
    /* keymap is session-only if storage is denied */
  }
}

/** Human-readable key for tooltips and the Keybinds modal. */
export function prettyKey(key: string) {
  if (!key) return "None";
  if (key === " ") return "Space";
  if (key === "=") return "+";
  if (key === "arrowleft") return "←";
  if (key === "arrowright") return "→";
  if (key === "arrowup") return "↑";
  if (key === "arrowdown") return "↓";
  if (key === "enter") return "Enter";
  if (key === "backspace") return "Backspace";
  if (key === "delete") return "Delete";
  if (key === "escape") return "Esc";
  return key.length === 1 ? key.toUpperCase() : key;
}
