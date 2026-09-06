/**
 * Domain document types for a Before/After workflow board.
 * Runtime state lives in state/store.ts; JSON IO in persist/workflowJson.ts.
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
} from "./catalogs";

export {
  ActorKind,
  AssignmentLane,
  ColorScheme,
  RobotKind,
  SelectionKind,
  SplitKind,
  StepKind,
  Tool,
  ViewMode,
  WorkflowNodeKind,
  WORKFLOW_VERSION,
} from "./catalogs";

/** Ordered list for palette / details selects — keep in display order. */
export const STEP_KINDS = [
  StepKind.Read,
  StepKind.Search,
  StepKind.Write,
  StepKind.Review,
  StepKind.Copy,
  StepKind.Print,
  StepKind.Email,
  StepKind.Drag,
  StepKind.Scan,
  StepKind.Approve,
  StepKind.Call,
  StepKind.File,
  StepKind.Other,
] as const;

/** UI copy for RobotKind values — stored key `ai` is shown as LLM. */
export const ROBOT_KIND_LABEL: Record<RobotKind, string> = {
  [RobotKind.Llm]: "LLM",
  [RobotKind.Agent]: "Agent",
  [RobotKind.Script]: "Script",
};

export type Point = { x: number; y: number };

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
  /** True when created via + as a placeholder; detach may delete it. */
  stub?: boolean;
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
  /** Explicit stroke; omit to fall back to exclusive-split (first solid, rest dotted). */
  dashed?: boolean;
};

/** stepId → actorId for one Before/After lane. */
export type Assignments = Record<string, string>;

export type WorkflowDoc = {
  version: typeof WORKFLOW_VERSION;
  actors: ActorDto[];
  nodes: NodeDto[];
  edges: EdgeDto[];
  assignments: Record<AssignmentLane, Assignments>;
};

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

/** Empty document used when parsing JSON that is missing fields. */
export function emptyWorkflow(): WorkflowDoc {
  return {
    version: WORKFLOW_VERSION,
    actors: [],
    nodes: [],
    edges: [],
    assignments: {
      [AssignmentLane.Before]: {},
      [AssignmentLane.After]: {},
    },
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
