/**
 * Selected-tile spawn keys follow the compass corners.
 * Horizontal: Q/E Step left/right, A/D Data left/right.
 * Vertical: Q/A Step up/down, E/D Data up/down. Keycaps stay in the same corners.
 */
import type { BoardOrientation } from "../board/flow/flowProfile";
import { KeyAction, WorkflowNodeKind, type KeyAction as KeyActionId } from "../workflow/catalogs";
import { ACTION_LABELS } from "./bindings";

export type SpawnHotkey = {
  type: typeof WorkflowNodeKind.Step | typeof WorkflowNodeKind.DataField;
  side: "in" | "out";
};

const VERTICAL_SPAWN: Partial<Record<KeyActionId, SpawnHotkey>> = {
  [KeyAction.AddStepIn]: { type: WorkflowNodeKind.Step, side: "in" },
  [KeyAction.AddDataIn]: { type: WorkflowNodeKind.Step, side: "out" },
  [KeyAction.AddStepOut]: { type: WorkflowNodeKind.DataField, side: "in" },
  [KeyAction.AddDataOut]: { type: WorkflowNodeKind.DataField, side: "out" },
};

const HORIZONTAL_SPAWN: Partial<Record<KeyActionId, SpawnHotkey>> = {
  [KeyAction.AddStepIn]: { type: WorkflowNodeKind.Step, side: "in" },
  [KeyAction.AddStepOut]: { type: WorkflowNodeKind.Step, side: "out" },
  [KeyAction.AddDataIn]: { type: WorkflowNodeKind.DataField, side: "in" },
  [KeyAction.AddDataOut]: { type: WorkflowNodeKind.DataField, side: "out" },
};

const VERTICAL_LABELS: Partial<Record<KeyActionId, string>> = {
  [KeyAction.AddStepIn]: "New Step above",
  [KeyAction.AddStepOut]: "New Data above",
  [KeyAction.AddDataIn]: "New Step below",
  [KeyAction.AddDataOut]: "New Data below",
};

export function spawnForAction(
  orientation: BoardOrientation,
  action: KeyActionId,
): SpawnHotkey | null {
  const table = orientation === "vertical" ? VERTICAL_SPAWN : HORIZONTAL_SPAWN;
  return table[action] ?? null;
}

export function actionLabel(
  action: KeyActionId,
  orientation: BoardOrientation = "horizontal",
): string {
  if (orientation === "vertical") {
    const label = VERTICAL_LABELS[action];
    if (label) return label;
  }
  return ACTION_LABELS[action];
}
