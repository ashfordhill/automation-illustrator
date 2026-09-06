/**
 * Named catalogs for domain values that used to be scattered as raw strings.
 * Import the const object at call sites (`WorkflowNodeKind.Step`) and the matching
 * type for annotations. JSON on disk still stores the string values.
 */

/** Workflow document version written by persist/workflowJson.ts. */
export const WORKFLOW_VERSION = 1 as const;

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

/** Custom orthogonal arrow registered in board/FlowArrow.tsx. */
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

/** Before/After assignment maps — Both is display-only and uses Before for editing. */
export const AssignmentLane = {
  Before: "before",
  After: "after",
} as const;
export type AssignmentLane =
  (typeof AssignmentLane)[keyof typeof AssignmentLane];

export const Tool = {
  Pointer: "pointer",
  Hand: "hand",
} as const;
export type Tool = (typeof Tool)[keyof typeof Tool];

export const ColorScheme = {
  Light: "light",
  Dark: "dark",
} as const;
export type ColorScheme = (typeof ColorScheme)[keyof typeof ColorScheme];

/** What the details panel (details/SelectedItemForm.tsx) is editing. */
export const SelectionKind = {
  Node: "node",
  Edge: "edge",
  Actor: "actor",
} as const;
export type SelectionKind = (typeof SelectionKind)[keyof typeof SelectionKind];

/** Prefixes for identity/ids.ts so step vs person vs arrow ids stay distinguishable. */
export const IdPrefix = {
  Step: "s",
  DataField: "d",
  Human: "h",
  Robot: "r",
  Edge: "e",
} as const;
export type IdPrefix = (typeof IdPrefix)[keyof typeof IdPrefix];

export const KeyPreset = {
  Arrows: "arrows",
  Wasd: "wasd",
} as const;
export type KeyPreset = (typeof KeyPreset)[keyof typeof KeyPreset];

/** Actions in keyboard/bindings.ts — the Keybinds modal rebinds these. */
export const KeyAction = {
  Undo: "undo",
  ToolPointer: "toolPointer",
  ToolHand: "toolHand",
  PanLeft: "panLeft",
  PanRight: "panRight",
  PanUp: "panUp",
  PanDown: "panDown",
  Help: "help",
  ToggleView: "toggleView",
  PathConfirm: "pathConfirm",
  Delete: "delete",
  AddPath: "addPath",
  DetachPath: "detachPath",
  ToggleDash: "toggleDash",
  AddBranchStep: "addBranchStep",
  AddBranchData: "addBranchData",
  LinkExisting: "linkExisting",
} as const;
export type KeyAction = (typeof KeyAction)[keyof typeof KeyAction];
