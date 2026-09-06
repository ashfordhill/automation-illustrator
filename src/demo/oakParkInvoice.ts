/**
 * Oak Park invoice walkthrough — the board that loads on first visit
 * and from the hamburger Demo item. Wired through store.resetDemo / loadStart.
 */
import { nid } from "../identity/ids";
import {
  ActorKind,
  IdPrefix,
  RobotKind,
  SplitKind,
  StepKind,
  WorkflowNodeKind,
  WORKFLOW_VERSION,
} from "../model/catalogs";
import { HUMAN_PRESETS, ROBOT_COLORS, randomPastel } from "../model/colors";
import { AssignmentLane } from "../model/catalogs";
import {
  DEFAULT_HUMAN_ROLE,
  type ActorDto,
  type RobotKind as RobotKindT,
  type WorkflowDoc,
} from "../model/types";
import { GRID } from "../board/tileMetrics";

/** Alice, Roy, Jack, Missy, plus one Script robot — also used by New board. */
export function defaultActors(): ActorDto[] {
  const humans: ActorDto[] = HUMAN_PRESETS.map((p) => ({
    id: nid(IdPrefix.Human),
    kind: ActorKind.Human,
    name: p.name,
    color: p.color,
    role: DEFAULT_HUMAN_ROLE,
  }));
  const robot: ActorDto = {
    id: nid(IdPrefix.Robot),
    kind: ActorKind.Robot,
    name: "Robot",
    color: ROBOT_COLORS[RobotKind.Script],
    robotKind: RobotKind.Script,
  };
  return [...humans, robot];
}

/** Prefer Alice so new steps match the demo’s default person. */
export function aliceId(actors: ActorDto[]) {
  return (
    actors.find((a) => a.kind === ActorKind.Human && a.name === "Alice")?.id ??
    actors[0]?.id
  );
}

/** First robot on the roster — After-lane assignments in this demo. */
export function defaultRobotId(actors: ActorDto[]) {
  return actors.find((a) => a.kind === ActorKind.Robot)?.id ?? actors[0]?.id;
}

/** Palette / details “+ New person”. */
export function makeHuman(name?: string, color?: string): ActorDto {
  const n = name?.trim() || `Person ${Math.floor(Math.random() * 90) + 2}`;
  const preset = HUMAN_PRESETS.find((p) => p.name === n);
  const c = color ?? preset?.color ?? randomPastel();
  return {
    id: nid(IdPrefix.Human),
    kind: ActorKind.Human,
    name: n,
    color: c,
    role: DEFAULT_HUMAN_ROLE,
  };
}

/** Palette / details “+ New robot”. Name stays “Robot”; kind drives fill. */
export function makeRobot(
  name = "Robot",
  robotKind: RobotKindT = RobotKind.Script,
): ActorDto {
  return {
    id: nid(IdPrefix.Robot),
    kind: ActorKind.Robot,
    name,
    color: ROBOT_COLORS[robotKind],
    robotKind,
  };
}

/** Read → (amount split) Search → Account # → Enter → Review. */
export function oakParkInvoice(): WorkflowDoc {
  const actors = defaultActors();
  const alice = aliceId(actors)!;
  const robot = defaultRobotId(actors)!;
  const read = nid(IdPrefix.Step);
  const web = nid(IdPrefix.Step);
  const fs = nid(IdPrefix.Step);
  const acct = nid(IdPrefix.DataField);
  const enter = nid(IdPrefix.Step);
  const review = nid(IdPrefix.Step);
  const steps = { read, web, fs, enter, review };

  return {
    version: WORKFLOW_VERSION,
    actors,
    nodes: [
      {
        id: read,
        type: WorkflowNodeKind.Step,
        position: { x: 32, y: 160 },
        stepKind: StepKind.Read,
        title: "invoice.pdf",
        detail: "",
        split: SplitKind.Exclusive,
      },
      {
        id: web,
        type: WorkflowNodeKind.Step,
        position: { x: 352, y: 32 },
        stepKind: StepKind.Search,
        title: "website",
        detail: "",
        split: SplitKind.Exclusive,
      },
      {
        id: fs,
        type: WorkflowNodeKind.Step,
        position: { x: 352, y: 352 },
        stepKind: StepKind.Search,
        title: "filesystem",
        detail: "",
        split: SplitKind.Exclusive,
      },
      {
        id: acct,
        type: WorkflowNodeKind.DataField,
        position: { x: 672, y: 192 },
        label: "Account #",
      },
      {
        id: enter,
        type: WorkflowNodeKind.Step,
        position: { x: 864, y: 160 },
        stepKind: StepKind.Write,
        title: "BS&A Software",
        detail: "",
        split: SplitKind.Exclusive,
      },
      {
        id: review,
        type: WorkflowNodeKind.Step,
        position: { x: 1184, y: 160 },
        stepKind: StepKind.Review,
        title: "BS&A Software",
        detail: "",
        split: SplitKind.Exclusive,
      },
    ],
    edges: [
      { id: nid(IdPrefix.Edge), source: read, target: web, label: "invoice > $50,000", dashed: false },
      { id: nid(IdPrefix.Edge), source: read, target: fs, label: "invoice < $50,000", dashed: true },
      { id: nid(IdPrefix.Edge), source: web, target: acct, label: "", dashed: false },
      { id: nid(IdPrefix.Edge), source: fs, target: acct, label: "", dashed: false },
      { id: nid(IdPrefix.Edge), source: acct, target: enter, label: "", dashed: false },
      { id: nid(IdPrefix.Edge), source: enter, target: review, label: "", dashed: false },
    ],
    assignments: {
      [AssignmentLane.Before]: Object.fromEntries(
        Object.values(steps).map((id) => [id, alice]),
      ),
      [AssignmentLane.After]: {
        [read]: robot,
        [web]: robot,
        [fs]: robot,
        [enter]: robot,
        [review]: alice,
      },
    },
  };
}

/** Empty consulting board: people plus one Step. Later steps spawn from + on a tile. */
export function freshBoard(): WorkflowDoc {
  const actors = defaultActors();
  const alice = aliceId(actors);
  const id = nid(IdPrefix.Step);
  return {
    version: WORKFLOW_VERSION,
    actors,
    nodes: [
      {
        id,
        type: WorkflowNodeKind.Step,
        position: { x: GRID, y: GRID * 5 },
        stepKind: StepKind.Other,
        title: "",
        detail: "",
        split: SplitKind.Exclusive,
      },
    ],
    edges: [],
    assignments: {
      [AssignmentLane.Before]: alice ? { [id]: alice } : {},
      [AssignmentLane.After]: alice ? { [id]: alice } : {},
    },
  };
}
