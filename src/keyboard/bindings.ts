/**
 * Keyboard action catalog, presets, and localStorage IO.
 * Consumed by useAppKeys.ts (runtime) and KeybindsModal.tsx (rebind UI).
 * Store holds the live map; Toolbar shows prettyKey in tooltips.
 */
import { KeyAction, KeyPreset } from "../workflow/catalogs";
import { LS_KEYMAP } from "../state/persistence";

export { KeyAction, KeyPreset };

/** action id → KeyboardEvent key (lowercase, Space is `" "`). */
export type Keymap = Record<KeyAction, string>;

/** Retired Slice 4 ids: Pointer/Hand, path-confirm, detach. Ignored on load (SH-14). */
export const RETIRED_KEY_ACTIONS = [
  "toolPointer",
  "toolHand",
  "pathConfirm",
  "detachPath",
] as const;

export const ARROW_PRESET: Keymap = {
  [KeyAction.Undo]: "backspace",
  [KeyAction.PanLeft]: "arrowleft",
  [KeyAction.PanRight]: "arrowright",
  [KeyAction.PanUp]: "arrowup",
  [KeyAction.PanDown]: "arrowdown",
  [KeyAction.Help]: "?",
  [KeyAction.ToggleView]: " ",
  [KeyAction.Confirm]: "enter",
  [KeyAction.Delete]: "delete",
  [KeyAction.AddPath]: "=",
  [KeyAction.RemoveNode]: "-",
  [KeyAction.ToggleDash]: ".",
  [KeyAction.AddBranchStep]: "1",
  [KeyAction.AddBranchData]: "2",
  [KeyAction.LinkExisting]: "3",
  [KeyAction.Merge]: "m",
  [KeyAction.Unmerge]: "u",
};

export const WASD_PRESET: Keymap = {
  ...ARROW_PRESET,
  [KeyAction.PanLeft]: "a",
  [KeyAction.PanRight]: "d",
  [KeyAction.PanUp]: "w",
  [KeyAction.PanDown]: "s",
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
  [KeyAction.Delete]: "Remove selected Node (picker)",
  [KeyAction.AddPath]: "Open + menu on selected Node",
  [KeyAction.RemoveNode]: "Remove Node picker (−)",
  [KeyAction.ToggleDash]: "Toggle Path solid / dotted",
  [KeyAction.AddBranchStep]: "New Step (inside + menu)",
  [KeyAction.AddBranchData]: "New Data (inside + menu)",
  [KeyAction.LinkExisting]: "Connect existing (inside + menu)",
  [KeyAction.Merge]: "Merge (After)",
  [KeyAction.Unmerge]: "Unmerge (After)",
};

/** Normalize a keydown into the string we store in Keymap. */
export function eventKey(e: KeyboardEvent): string {
  if (e.key === " ") return " ";
  return e.key.toLowerCase();
}

/** Which KeyAction (if any) this event should fire. */
export function actionFor(map: Keymap, e: KeyboardEvent): KeyAction | null {
  const k = eventKey(e);
  const hit = (Object.entries(map) as [KeyAction, string][]).find(([, v]) => v === k);
  return hit?.[0] ?? null;
}

/** True when this event matches a mapped action, including Shift+= as AddPath. */
export function keyIs(map: Keymap, action: KeyAction, e: KeyboardEvent): boolean {
  const k = eventKey(e);
  const want = map[action];
  if (k === want) return true;
  if (action === KeyAction.AddPath && (e.key === "+" || k === "+")) return true;
  return false;
}

/** Load from localStorage, filling gaps from the arrow preset. */
export function loadKeymap(): Keymap {
  try {
    const raw = localStorage.getItem(LS_KEYMAP);
    if (!raw) return { ...ARROW_PRESET };
    const saved = JSON.parse(raw) as Record<string, unknown>;
    return { ...ARROW_PRESET, ...pickKnown(saved) };
  } catch {
    return { ...ARROW_PRESET };
  }
}

/** Ignore unknown and retired keys from older localStorage maps (SH-14). */
export function pickKnown(saved: Record<string, unknown>): Partial<Keymap> {
  const next: Partial<Keymap> = {};
  const retired = new Set<string>(RETIRED_KEY_ACTIONS);
  for (const key of Object.keys(ARROW_PRESET) as KeyAction[]) {
    if (retired.has(key)) continue;
    const value = saved[key];
    if (typeof value === "string" && value.length) next[key] = value;
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
