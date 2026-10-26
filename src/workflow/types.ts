/**
 * Domain document types for a Before/After workflow board.
 * Runtime state lives in state/store.ts; YAML/JSON IO in serialize.ts and persistence.ts.
 * String catalogs (ActorKind, StepKind, …) live in catalogs.ts and are re-exported here.
 */
import { normalizeAccessories } from "./accessories";
import {
  AccessoryKind,
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
  AccessoryKind,
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
  StepKind.Drag,
  StepKind.Email,
  StepKind.File,
  StepKind.Print,
  StepKind.Read,
  StepKind.Review,
  StepKind.Scan,
  StepKind.Search,
  StepKind.Travel,
  StepKind.Write,
  StepKind.Other,
] as const;

/** Types offered in the inspector picker. Drag, Approve, and File stay in the schema for existing boards. */
export const PICKER_STEP_KINDS: ReadonlySet<StepKind> = new Set([
  StepKind.Call,
  StepKind.Email,
  StepKind.Print,
  StepKind.Read,
  StepKind.Review,
  StepKind.Scan,
  StepKind.Search,
  StepKind.Travel,
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

/** Default Role for a newly added Robot (NA-01). */
export const DEFAULT_ROBOT_ROLE = "Script";

/** Default Name for roster Robots and Add robot (WG-01, NA-01). */
export const DEFAULT_ROBOT_NAME = "Robot";

export type HumanDto = {
  id: string;
  kind: typeof ActorKind.Human;
  name: string;
  color: string;
  role: string;
};

/**
 * Lane-specific presentation of one roster actor.
 * Name, color, role, and kind stay on the actor. Add future per-lane
 * attributes here. Do not add a second map beside this one.
 * Accessories are Humans only; an empty look is omitted.
 */
export type ActorLook = {
  accessories?: AccessoryKind[];
};

/** actorId → look. A missing id wears nothing. */
export type ActorLooks = Record<string, ActorLook>;

export type RobotDto = {
  id: string;
  kind: typeof ActorKind.Robot;
  name: string;
  color: string;
  robotKind: RobotKind;
  role: string;
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
  /** Omitted to keep the theme purple mark (`--data-mark`). */
  color?: string;
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

/** Kept in the schema so old JSON still parses. Runtime load unfolds groups to []. */
export type MergeGroupDto = {
  id: string;
  memberIds: string[];
};

/**
 * Independent After board. Present only after After has its own edits.
 * While this is missing, After is the Before board.
 */
export type AfterFork = {
  nodes: NodeDto[];
  edges: EdgeDto[];
  assignments: Assignments;
};

/**
 * After overlay (BA-01). `fork` null means After shows the Before board.
 * `looks` null means After shows the Before look book.
 * Those copies are independent: editing Steps does not copy looks, and
 * editing looks does not copy the board.
 * `assignments` / `extraNodes` / `extraEdges` are legacy; load folds them into `fork`.
 */
export type AfterOverlay = {
  assignments: Assignments;
  groups: MergeGroupDto[];
  extraNodes: StepNodeDto[];
  extraEdges: EdgeDto[];
  fork?: AfterFork | null;
  /** Null means After wears whatever Before wears. `{}` is a copy where everyone wears nothing. */
  looks?: ActorLooks | null;
};

/** Version 2 document: shared base workflow plus one After overlay (BA-01). */
export type WorkflowDocV2 = {
  version: typeof WORKFLOW_VERSION;
  /** Project title shown in the status bar. Missing or blank displays Untitled. */
  name?: string;
  actors: ActorDto[];
  nodes: NodeDto[];
  edges: EdgeDto[];
  /** Before-lane Who for base Steps. */
  assignments: Assignments;
  /** Before look book. Missing means nobody wears anything. */
  looks?: ActorLooks;
  after: AfterOverlay;
};

/** Status-bar copy: named documents keep their title; New / unnamed boards are Untitled. */
export function projectDisplayName(doc: Pick<WorkflowDocV2, "name">): string {
  const name = doc.name?.trim();
  return name ? name : "Untitled";
}

export type WorkflowDoc = WorkflowDocV2;

/** Shown once when load/import drops `after.groups`. */
export const UNFOLD_NOTICE = "Merged tiles were unfolded.";

/** Shown once when load/import drops After-only Steps/Paths. */
export const AFTER_ONLY_DROP_NOTICE = "After-only Steps were removed.";

/** Drop merge groups; member After Who stays. */
export function unfoldMergeGroups(doc: WorkflowDoc): { doc: WorkflowDoc; unfolded: boolean } {
  if (doc.after.groups.length === 0) return { doc, unfolded: false };
  return {
    unfolded: true,
    doc: {
      ...doc,
      after: { ...doc.after, groups: [] },
    },
  };
}

/** Drop After-only Steps/Paths and their After Who keys (BA-01 withdrawn extras). */
export function dropAfterOnlyOverlay(doc: WorkflowDoc): { doc: WorkflowDoc; dropped: boolean } {
  const extras = doc.after.extraNodes;
  const extraEdges = doc.after.extraEdges;
  if (extras.length === 0 && extraEdges.length === 0) return { doc, dropped: false };
  const extraIds = new Set(extras.map((n) => n.id));
  const assignments = { ...doc.after.assignments };
  for (const id of extraIds) delete assignments[id];
  return {
    dropped: true,
    doc: {
      ...doc,
      after: {
        ...doc.after,
        extraNodes: [],
        extraEdges: [],
        assignments,
      },
    },
  };
}

/**
 * Unfold groups, then fold a legacy After difference into a fork.
 * Following boards stay mirrors. Idempotent. Extras are kept inside the fork.
 */
export function normalizeAfterOverlay(doc: WorkflowDoc): {
  doc: WorkflowDoc;
  unfolded: boolean;
  droppedAfterOnly: boolean;
} {
  const unfolded = unfoldMergeGroups(doc);
  return {
    doc: liftLegacyAccessories(settleAfter(unfolded.doc)),
    unfolded: unfolded.unfolded,
    droppedAfterOnly: false,
  };
}

/**
 * Old files stored accessories on the Human. That list becomes the Before look.
 * After keeps following, so both lanes show it until an After look edit.
 * An actor who already has a look keeps that look. Idempotent.
 */
export function liftLegacyAccessories(doc: WorkflowDoc): WorkflowDoc {
  let looks = doc.looks ?? {};
  let changed = false;
  const actors = doc.actors.map((actor) => {
    if (!isHuman(actor) || !("accessories" in actor)) return actor;
    const worn = normalizeAccessories(
      (actor as HumanDto & { accessories?: AccessoryKind[] }).accessories,
    );
    const { accessories: _drop, ...rest } = actor as HumanDto & { accessories?: AccessoryKind[] };
    if (worn.length > 0 && !(actor.id in looks)) {
      if (!changed) looks = { ...looks };
      looks = { ...looks, [actor.id]: { accessories: worn } };
    }
    changed = true;
    return rest;
  });
  if (!changed) return doc;
  return { ...doc, actors, looks };
}

/** Notice after load/import overlay cleanup. After-only drop wins if both ran. */
export function overlayLoadNotice(unfolded: boolean, droppedAfterOnly: boolean): string | null {
  if (droppedAfterOnly) return AFTER_ONLY_DROP_NOTICE;
  if (unfolded) return UNFOLD_NOTICE;
  return null;
}

/** Version 1 on-disk shape before migrate.ts (lane maps, optional Human/Robot role, optional stub). */
export type WorkflowDocV1 = {
  version: typeof WORKFLOW_VERSION_V1;
  actors: Array<(Omit<RobotDto, "role"> & { role?: string }) | (Omit<HumanDto, "role"> & { role?: string })>;
  nodes: Array<NodeDto | (StepNodeDto & { stub?: boolean })>;
  edges: EdgeDto[];
  assignments: Record<AssignmentLane, Assignments>;
};

/** Empty After overlay used by New boards and v1 migration. After follows Before, looks included. */
export function emptyAfterOverlay(): AfterOverlay {
  return {
    assignments: {},
    groups: [],
    extraNodes: [],
    extraEdges: [],
    fork: null,
    looks: null,
  };
}

/**
 * Overlay rebuilt around a board copy, still wearing `source`'s look book.
 * `fork` null keeps the board following Before.
 */
export function sealAfter(source: AfterOverlay, fork: AfterFork | null): AfterOverlay {
  return {
    ...emptyAfterOverlay(),
    fork,
    looks: source.looks ?? null,
  };
}

/** True when After has no copy of its own and is showing Before. */
export function afterFollowsBefore(doc: WorkflowDoc): boolean {
  return !doc.after.fork;
}

/** Nodes, Paths, and Who the lane is showing. A following After is Before. */
export function laneBoard(doc: WorkflowDoc, lane: AssignmentLane): AfterFork {
  if (lane === AssignmentLane.After && doc.after.fork) return doc.after.fork;
  return { nodes: doc.nodes, edges: doc.edges, assignments: doc.assignments };
}

/** Who map for the lane being shown. */
export function laneAssignments(doc: WorkflowDoc, lane: AssignmentLane): Assignments {
  return laneBoard(doc, lane).assignments;
}

/**
 * Replace one lane's Who map.
 * An After write copies Before first when After was still following.
 */
export function withLaneAssignments(
  doc: WorkflowDoc,
  lane: AssignmentLane,
  assignments: Assignments,
): WorkflowDoc {
  if (lane !== AssignmentLane.After) return { ...doc, assignments };
  const base = doc.after.fork ?? {
    nodes: structuredClone(doc.nodes),
    edges: structuredClone(doc.edges),
    assignments: structuredClone(doc.assignments),
  };
  return {
    ...doc,
    after: sealAfter(doc.after, { nodes: base.nodes, edges: base.edges, assignments }),
  };
}

/** True when a legacy After Who map is not a mirror of Before. Missing keys do not count. */
function afterWhoDiverges(before: Assignments, after: Assignments): boolean {
  for (const [id, actorId] of Object.entries(after)) {
    if (before[id] !== actorId) return true;
  }
  return false;
}

/**
 * One After representation. A legacy Who difference or After-only Step becomes a fork.
 * An already-following board stays a mirror. Idempotent.
 */
export function settleAfter(doc: WorkflowDoc): WorkflowDoc {
  const extras = doc.after.extraNodes;
  const extraEdges = doc.after.extraEdges;
  const legacyWho = afterWhoDiverges(doc.assignments, doc.after.assignments);
  if (doc.after.fork && extras.length === 0 && extraEdges.length === 0 && !legacyWho) {
    const clean =
      doc.after.groups.length === 0 &&
      Object.keys(doc.after.assignments).length === 0 &&
      doc.after.fork;
    if (clean) return doc;
    return { ...doc, after: sealAfter(doc.after, doc.after.fork) };
  }
  if (!doc.after.fork && extras.length === 0 && extraEdges.length === 0 && !legacyWho) {
    if (
      doc.after.groups.length === 0 &&
      extras.length === 0 &&
      extraEdges.length === 0 &&
      Object.keys(doc.after.assignments).length === 0
    ) {
      return doc.after.fork === null ? doc : { ...doc, after: sealAfter(doc.after, null) };
    }
    return { ...doc, after: sealAfter(doc.after, null) };
  }
  const base = doc.after.fork ?? {
    nodes: doc.nodes,
    edges: doc.edges,
    assignments: { ...doc.assignments },
  };
  const extraIds = new Set(extras.map((n) => n.id));
  const extraEdgeIds = new Set(extraEdges.map((e) => e.id));
  const fork: AfterFork = {
    nodes: [...base.nodes.filter((n) => !extraIds.has(n.id)), ...extras],
    edges: [...base.edges.filter((e) => !extraEdgeIds.has(e.id)), ...extraEdges],
    assignments: { ...base.assignments, ...doc.after.assignments },
  };
  return { ...doc, after: sealAfter(doc.after, structuredClone(fork)) };
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

/** Automation actor — robotKind is LLM / Agent / Script (hidden; Role is the user field). */
export function isRobot(a: ActorDto | undefined): a is RobotDto {
  return a?.kind === ActorKind.Robot;
}

/** Displayed Role for a Robot (stored role, else the hidden Type word). */
export function robotRole(actor: RobotDto): string {
  const role = actor.role?.trim();
  return role || ROBOT_KIND_LABEL[actor.robotKind];
}

/** Who / Manage key caption: Role for Robots, Name for Humans (NA-05). */
export function actorWhoCaption(actor: ActorDto): string {
  return isRobot(actor) ? robotRole(actor) : actor.name;
}

/** Accessible Who / Manage name. Robots include Name and Role when they differ. */
export function actorWhoAria(actor: ActorDto, whoPrefix = false): string {
  const label = isRobot(actor)
    ? actor.name === robotRole(actor)
      ? actor.name
      : `${actor.name} ${robotRole(actor)}`
    : actor.name;
  return whoPrefix ? `Who ${label}` : label;
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
  [StepKind.Travel]: { label: "Travel", defaultTitle: "" },
  [StepKind.Print]: { label: "Print", defaultTitle: "" },
  [StepKind.Email]: { label: "Email", defaultTitle: "" },
  [StepKind.Drag]: { label: "Drag", defaultTitle: "" },
  [StepKind.Scan]: { label: "Scan", defaultTitle: "" },
  [StepKind.Approve]: { label: "Approve", defaultTitle: "" },
  [StepKind.Call]: { label: "Call", defaultTitle: "" },
  [StepKind.File]: { label: "File", defaultTitle: "" },
  [StepKind.Other]: { label: "Other", defaultTitle: "" },
};

/** Longest Type word; inspector Name reserves this width so the field does not jump. */
export const LONGEST_STEP_KIND_LABEL = Object.values(STEP_KIND_META)
  .map((meta) => meta.label)
  .filter((label) => label !== "Other")
  .reduce((a, b) => (a.length >= b.length ? a : b));

/**
 * Switching Type never rewrites Name. Other stays empty until the user types it.
 */
export function titleForStepKindChange(
  _nextKind: StepKind,
  _previousKind: StepKind,
  title: string,
): string {
  return title;
}

/** On-tile copy: Type, then a space, then Name. Other is Name only (never the word Other). */
export function stepDisplayLabel(kind: StepKind, target: string): string {
  const t = target.trim();
  if (kind === StepKind.Other) return t;
  const type = STEP_KIND_META[kind].label.trim();
  if (!t) return type;
  if (t.toLowerCase() === type.toLowerCase()) return type;
  if (t.toLowerCase().startsWith(`${type.toLowerCase()} `)) return t;
  return `${type} ${t}`;
}

/** Accessible caption for a Node (picker, on-tile Remove). Unnamed Other is "Step". */
export function nodeCaption(node: NodeDto | undefined, fallback = "Node"): string {
  if (!node) return fallback;
  if (isDataFieldNode(node)) return node.label.trim() || "Data";
  if (isStepNode(node)) return stepDisplayLabel(node.stepKind, node.title) || "Step";
  return fallback;
}
