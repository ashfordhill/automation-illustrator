/**
 * Domain document types for a Before/After workflow board.
 * Runtime state lives in state/store.ts; JSON IO in state/persistence.ts.
 * String catalogs (ActorKind, StepKind, …) live in catalogs.ts and are re-exported here.
 */
import {
  ActorKind,
  AssignmentLane,
  RobotKind,
  SplitKind,
  StepKind,
  WorkflowNodeKind,
  WORKFLOW_VERSION,
  WORKFLOW_VERSION_V1,
} from "./catalogs";

export {
  ActorKind,
  AssignmentLane,
  ColorScheme,
  RobotKind,
  SelectionKind,
  SplitKind,
  StepKind,
  ViewMode,
  WorkflowNodeKind,
  WORKFLOW_VERSION,
  WORKFLOW_VERSION_V1,
} from "./catalogs";

/** Inspector Type buttons: alphabetical labels, Other last (NA-05). Schema still accepts every value. */
export const STEP_KINDS = [
  StepKind.Approve,
  StepKind.Call,
  StepKind.Copy,
  StepKind.Drag,
  StepKind.Email,
  StepKind.File,
  StepKind.Print,
  StepKind.Read,
  StepKind.Review,
  StepKind.Scan,
  StepKind.Search,
  StepKind.Write,
  StepKind.Other,
] as const;

/** Types offered in the inspector picker. Scan, Drag, Approve, and File stay in the schema for existing boards. */
export const PICKER_STEP_KINDS: ReadonlySet<StepKind> = new Set([
  StepKind.Call,
  StepKind.Copy,
  StepKind.Email,
  StepKind.Print,
  StepKind.Read,
  StepKind.Review,
  StepKind.Search,
  StepKind.Write,
  StepKind.Other,
]);

/** Alphabetical Type buttons, Other last. A retired Type still appears when the selected Step already has it. */
export function typePickerKinds(current: StepKind): StepKind[] {
  return STEP_KINDS.filter((kind) => PICKER_STEP_KINDS.has(kind) || kind === current);
}

/** UI copy for RobotKind values — stored key `ai` is shown as LLM. */
export const ROBOT_KIND_LABEL: Record<RobotKind, string> = {
  [RobotKind.Llm]: "LLM",
  [RobotKind.Agent]: "Agent",
  [RobotKind.Script]: "Script",
};

export type Point = { x: number; y: number };

/**
 * Displayed (derived-layout) Node positions for one lane. Optional input to the
 * WG-09 / WG-11 graph rules so "first child" and "nearest" follow what the user
 * sees; callers fall back to saved positions when absent (GOAL amendment 2026-09-07).
 */
export type PositionMap = Record<string, Point>;

/** Default HumanDto.role — the people equivalent of robot LLM / Agent / Script. */
export const DEFAULT_HUMAN_ROLE = "worker";

export type HumanDto = {
  id: string;
  kind: typeof ActorKind.Human;
  name: string;
  color: string;
  role: string;
};

export type RobotDto = {
  id: string;
  kind: typeof ActorKind.Robot;
  name: string;
  color: string;
  robotKind: RobotKind;
};

export type ActorDto = HumanDto | RobotDto;

export type StepNodeDto = {
  id: string;
  type: typeof WorkflowNodeKind.Step;
  position: Point;
  stepKind: StepKind;
  title: string;
  detail: string;
  split: SplitKind;
};

export type DataFieldNodeDto = {
  id: string;
  type: typeof WorkflowNodeKind.DataField;
  position: Point;
  label: string;
};

export type NodeDto = StepNodeDto | DataFieldNodeDto;

export type EdgeDto = {
  id: string;
  source: string;
  target: string;
  label: string;
  /** Explicit stroke; omit to fall back to Split default (PC-02). */
  dashed?: boolean;
};

/** stepId → actorId for one Before/After lane. */
export type Assignments = Record<string, string>;

/** Ordered Before-origin Step ids swallowed by one After merge tile (MG-02). */
export type MergeGroupDto = {
  id: string;
  memberIds: string[];
};

/** Sparse After overlay on a v2 document (BA-01). */
export type AfterOverlay = {
  assignments: Assignments;
  groups: MergeGroupDto[];
  extraNodes: StepNodeDto[];
  extraEdges: EdgeDto[];
};

/** Version 2 document: shared base workflow plus one After overlay (BA-01). */
export type WorkflowDocV2 = {
  version: typeof WORKFLOW_VERSION;
  actors: ActorDto[];
  nodes: NodeDto[];
  edges: EdgeDto[];
  /** Before-lane Who for base Steps. */
  assignments: Assignments;
  after: AfterOverlay;
};

export type WorkflowDoc = WorkflowDocV2;

/** Version 1 on-disk shape before migrate.ts (lane maps, optional Human role, optional stub). */
export type WorkflowDocV1 = {
  version: typeof WORKFLOW_VERSION_V1;
  actors: Array<RobotDto | (Omit<HumanDto, "role"> & { role?: string })>;
  nodes: Array<NodeDto | (StepNodeDto & { stub?: boolean })>;
  edges: EdgeDto[];
  assignments: Record<AssignmentLane, Assignments>;
};

/** Empty After overlay used by New boards and v1 migration. */
export function emptyAfterOverlay(): AfterOverlay {
  return {
    assignments: {},
    groups: [],
    extraNodes: [],
    extraEdges: [],
  };
}

/** Who map for the active lane (Before is the base map; After is the overlay). */
export function laneAssignments(doc: WorkflowDoc, lane: AssignmentLane): Assignments {
  return lane === AssignmentLane.After ? doc.after.assignments : doc.assignments;
}

/** Replace one lane's Who map without touching the other. */
export function withLaneAssignments(
  doc: WorkflowDoc,
  lane: AssignmentLane,
  assignments: Assignments,
): WorkflowDoc {
  if (lane === AssignmentLane.After) {
    return { ...doc, after: { ...doc.after, assignments } };
  }
  return { ...doc, assignments };
}

/** Narrow a board tile to a Step (the human/robot + task card). */
export function isStepNode(n: NodeDto): n is StepNodeDto {
  return n.type === WorkflowNodeKind.Step;
}

/** Narrow a board tile to a Data field (Account # and similar). */
export function isDataFieldNode(n: NodeDto): n is DataFieldNodeDto {
  return n.type === WorkflowNodeKind.DataField;
}

/** Named person (stick figure) vs automation (antenna figure). */
export function isHuman(a: ActorDto | undefined): a is HumanDto {
  return a?.kind === ActorKind.Human;
}

/** Automation actor — robotKind is LLM / Agent / Script. */
export function isRobot(a: ActorDto | undefined): a is RobotDto {
  return a?.kind === ActorKind.Robot;
}

/** Empty document used by history tests and as a valid zero-Node board (WG-01). */
export function emptyWorkflow(): WorkflowDoc {
  return {
    version: WORKFLOW_VERSION,
    actors: [],
    nodes: [],
    edges: [],
    assignments: {},
    after: emptyAfterOverlay(),
  };
}

export const STEP_KIND_META: Record<
  StepKind,
  { label: string; defaultTitle: string }
> = {
  [StepKind.Read]: { label: "Read", defaultTitle: "" },
  [StepKind.Search]: { label: "Search", defaultTitle: "" },
  [StepKind.Write]: { label: "Write", defaultTitle: "" },
  [StepKind.Review]: { label: "Review", defaultTitle: "" },
  [StepKind.Copy]: { label: "Copy", defaultTitle: "" },
  [StepKind.Print]: { label: "Print", defaultTitle: "" },
  [StepKind.Email]: { label: "Email", defaultTitle: "" },
  [StepKind.Drag]: { label: "Drag", defaultTitle: "" },
  [StepKind.Scan]: { label: "Scan", defaultTitle: "" },
  [StepKind.Approve]: { label: "Approve", defaultTitle: "" },
  [StepKind.Call]: { label: "Call", defaultTitle: "" },
  [StepKind.File]: { label: "File", defaultTitle: "" },
  [StepKind.Other]: { label: "Other", defaultTitle: "" },
};

/** On-tile copy: Type, then a space, then Target. Skips a repeated Type prefix. */
export function stepDisplayLabel(kind: StepKind, target: string): string {
  const type = STEP_KIND_META[kind].label.trim();
  const t = target.trim();
  if (!t) return type;
  if (t.toLowerCase() === type.toLowerCase()) return type;
  if (t.toLowerCase().startsWith(`${type.toLowerCase()} `)) return t;
  return `${type} ${t}`;
}
