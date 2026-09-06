/**
 * Keyboard action catalog, presets, and localStorage IO.
 * Consumed by useAppKeys.ts (runtime) and KeybindsModal.tsx (rebind UI).
 * Store holds the live map; Toolbar shows prettyKey in tooltips.
 */
import { KeyAction, KeyPreset } from "../model/catalogs";
import { LS_KEYMAP } from "../persist/workflowJson";

export { KeyAction, KeyPreset };

/** action id → KeyboardEvent key (lowercase, Space is `" "`). */
export type Keymap = Record<KeyAction, string>;

export const ARROW_PRESET: Keymap = {
  [KeyAction.Undo]: "backspace",
  [KeyAction.ToolPointer]: "v",
  [KeyAction.ToolHand]: "h",
  [KeyAction.PanLeft]: "arrowleft",
  [KeyAction.PanRight]: "arrowright",
  [KeyAction.PanUp]: "arrowup",
  [KeyAction.PanDown]: "arrowdown",
  [KeyAction.Help]: "?",
  [KeyAction.ToggleView]: " ",
  [KeyAction.PathConfirm]: "enter",
  [KeyAction.Delete]: "delete",
  [KeyAction.AddPath]: "=",
  [KeyAction.DetachPath]: "-",
  [KeyAction.ToggleDash]: ".",
  [KeyAction.AddBranchStep]: "1",
  [KeyAction.AddBranchData]: "2",
  [KeyAction.LinkExisting]: "3",
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
  [KeyAction.ToolPointer]: "Pointer",
  [KeyAction.ToolHand]: "Hand (pan)",
  [KeyAction.PanLeft]: "Pan left",
  [KeyAction.PanRight]: "Pan right",
  [KeyAction.PanUp]: "Pan up / previous path",
  [KeyAction.PanDown]: "Pan down / next path",
  [KeyAction.Help]: "Keybinds",
  [KeyAction.ToggleView]: "Toggle Before/After (present)",
  [KeyAction.PathConfirm]: "Label path, or detach while choosing −",
  [KeyAction.Delete]: "Delete selected tile or arrow",
  [KeyAction.AddPath]: "Open + path menu on selected tile",
  [KeyAction.DetachPath]: "Detach a path (−) on selected tile",
  [KeyAction.ToggleDash]: "Toggle path solid / dotted",
  [KeyAction.AddBranchStep]: "New step path (inside + menu)",
  [KeyAction.AddBranchData]: "New data path (inside + menu)",
  [KeyAction.LinkExisting]: "Link existing tile (inside + menu)",
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
    const saved = JSON.parse(raw) as Partial<Keymap>;
    return { ...ARROW_PRESET, ...pickKnown(saved) };
  } catch {
    return { ...ARROW_PRESET };
  }
}

/** Ignore unknown keys from older localStorage maps. */
function pickKnown(saved: Partial<Keymap>): Partial<Keymap> {
  const next: Partial<Keymap> = {};
  for (const key of Object.keys(ARROW_PRESET) as KeyAction[]) {
    if (saved[key]) next[key] = saved[key];
  }
  return next;
}

export function saveKeymap(map: Keymap) {
  localStorage.setItem(LS_KEYMAP, JSON.stringify(map));
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
