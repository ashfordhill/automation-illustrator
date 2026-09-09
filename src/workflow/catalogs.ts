/**
 * Named catalogs for domain values that used to be scattered as raw strings.
 * Import the const object at call sites (`WorkflowNodeKind.Step`) and the matching
 * type for annotations. YAML/JSON files and localStorage JSON still store these strings.
 */

/** Version 1 on-disk documents; migrate.ts maps them to WORKFLOW_VERSION. */
export const WORKFLOW_VERSION_V1 = 1 as const;

/** Workflow document version written by state/persistence.ts (BA-01). */
export const WORKFLOW_VERSION = 2 as const;

/** Board tiles in the saved document (React Flow uses a parallel ReactFlowNodeKind). */
export const WorkflowNodeKind = {
  Step: "step",
  DataField: "dataField",
} as const;
export type WorkflowNodeKind =
  (typeof WorkflowNodeKind)[keyof typeof WorkflowNodeKind];

/** React Flow `node.type` — DataField is `"field"` here because RF already uses "step". */
export const ReactFlowNodeKind = {
  Step: "step",
  DataField: "field",
} as const;
export type ReactFlowNodeKind =
  (typeof ReactFlowNodeKind)[keyof typeof ReactFlowNodeKind];

/** Custom orthogonal Path registered in board/routing/FlowArrow.tsx (ELK route). */
export const ReactFlowEdgeKind = {
  Flow: "flow",
} as const;
export type ReactFlowEdgeKind =
  (typeof ReactFlowEdgeKind)[keyof typeof ReactFlowEdgeKind];

export const ActorKind = {
  Human: "human",
  Robot: "robot",
} as const;
export type ActorKind = (typeof ActorKind)[keyof typeof ActorKind];

/** Stored as `ai` in JSON; UI label is LLM (see ROBOT_KIND_LABEL). */
export const RobotKind = {
  Llm: "ai",
  Agent: "agent",
  Script: "script",
} as const;
export type RobotKind = (typeof RobotKind)[keyof typeof RobotKind];

export const SplitKind = {
  Exclusive: "exclusive",
  Parallel: "parallel",
} as const;
export type SplitKind = (typeof SplitKind)[keyof typeof SplitKind];

/** Task icon on a Step tile — stored on StepNodeDto.stepKind. */
export const StepKind = {
  Read: "read",
  Search: "search",
  Write: "write",
  Review: "review",
  Copy: "copy",
  Print: "print",
  Email: "email",
  Drag: "drag",
  Scan: "scan",
  Approve: "approve",
  Call: "call",
  File: "file",
  Other: "other",
} as const;
export type StepKind = (typeof StepKind)[keyof typeof StepKind];

/** Map the saved document tile kind onto React Flow's node.type. */
export function reactFlowTypeFor(kind: WorkflowNodeKind): ReactFlowNodeKind {
  return kind === WorkflowNodeKind.Step
    ? ReactFlowNodeKind.Step
    : ReactFlowNodeKind.DataField;
}

export const ViewMode = {
  Before: "before",
  After: "after",
  Both: "both",
} as const;
export type ViewMode = (typeof ViewMode)[keyof typeof ViewMode];

/** Visible names on the top-bar switch. Stored view `both` is labeled Compare. */
export const VIEW_SWITCH_LABEL: Record<ViewMode, string> = {
  [ViewMode.Before]: "Before",
  [ViewMode.After]: "After",
  [ViewMode.Both]: "Compare",
};

/** Before/After assignment maps — Both is read-only comparison (BA-05). */
export const AssignmentLane = {
  Before: "before",
  After: "after",
} as const;
export type AssignmentLane =
  (typeof AssignmentLane)[keyof typeof AssignmentLane];

/** The other comparison lane — used to share the Both camera (BA-05). */
export function otherLane(lane: AssignmentLane): AssignmentLane {
  return lane === AssignmentLane.Before ? AssignmentLane.After : AssignmentLane.Before;
}

export const ColorScheme = {
  Light: "light",
  Dark: "dark",
} as const;
export type ColorScheme = (typeof ColorScheme)[keyof typeof ColorScheme];

/** What the inspector (app/inspector/SelectedItemForm.tsx) is editing. */
export const SelectionKind = {
  Node: "node",
  Edge: "edge",
  Actor: "actor",
} as const;
export type SelectionKind = (typeof SelectionKind)[keyof typeof SelectionKind];

/** Prefixes for workflow/ids.ts so Step vs person vs Path ids stay distinguishable. */
export const IdPrefix = {
  Step: "s",
  DataField: "d",
  Human: "h",
  Robot: "r",
  Edge: "e",
  Group: "g",
} as const;
export type IdPrefix = (typeof IdPrefix)[keyof typeof IdPrefix];

export const KeyPreset = {
  Arrows: "arrows",
  Wasd: "wasd",
} as const;
export type KeyPreset = (typeof KeyPreset)[keyof typeof KeyPreset];

/** Actions in keyboard/bindings.ts — the Keybinds modal rebinds these (SH-14). */
export const KeyAction = {
  Undo: "undo",
  PanLeft: "panLeft",
  PanRight: "panRight",
  PanUp: "panUp",
  PanDown: "panDown",
  Help: "help",
  ToggleView: "toggleView",
  Confirm: "confirm",
  Delete: "delete",
  AddPath: "addPath",
  RemoveNode: "removeNode",
  ToggleDash: "toggleDash",
  AddBranchStep: "addBranchStep",
  AddBranchData: "addBranchData",
  LinkExisting: "linkExisting",
} as const;
export type KeyAction = (typeof KeyAction)[keyof typeof KeyAction];
