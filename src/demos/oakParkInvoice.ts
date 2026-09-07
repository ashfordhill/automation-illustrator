/**
 * Oak Park invoice walkthrough — first-visit board and hamburger Demo item.
 * IDs match the retired CLI exporter (Slice 5). Both amount Paths are dotted (PC-06).
 */
import { defaultActors, ROBOT_COLORS } from "../workflow/actors";
import {
  ActorKind,
  RobotKind,
  SplitKind,
  StepKind,
  WorkflowNodeKind,
  WORKFLOW_VERSION,
} from "../workflow/catalogs";
import { emptyAfterOverlay, type WorkflowDoc } from "../workflow/types";

export const OAK_PARK_IDS = {
  alice: "h_alice",
  roy: "h_roy",
  jack: "h_jack",
  missy: "h_missy",
  robot: "r_script",
  read: "s_read",
  web: "s_web",
  fs: "s_fs",
  acct: "d_acct",
  enter: "s_enter",
  review: "s_review",
  gt: "e_gt",
  lt: "e_lt",
  webAcct: "e_web_acct",
  fsAcct: "e_fs_acct",
  acctEnter: "e_acct_enter",
  enterReview: "e_enter_review",
} as const;

/** Read → (amount split) Search → Account # → Enter → Review. */
export function oakParkInvoice(): WorkflowDoc {
  const {
    alice,
    roy,
    jack,
    missy,
    robot,
    read,
    web,
    fs,
    acct,
    enter,
    review,
    gt,
    lt,
    webAcct,
    fsAcct,
    acctEnter,
    enterReview,
  } = OAK_PARK_IDS;

  return {
    version: WORKFLOW_VERSION,
    actors: [
      { id: alice, kind: ActorKind.Human, name: "Alice", color: "#f4c6d4", role: "worker" },
      { id: roy, kind: ActorKind.Human, name: "Roy", color: "#c5d4ea", role: "worker" },
      { id: jack, kind: ActorKind.Human, name: "Jack", color: "#c5e0d6", role: "worker" },
      { id: missy, kind: ActorKind.Human, name: "Missy", color: "#d5c6e6", role: "worker" },
      {
        id: robot,
        kind: ActorKind.Robot,
        name: "Robot",
        color: ROBOT_COLORS[RobotKind.Script],
        robotKind: RobotKind.Script,
      },
    ],
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
      { id: gt, source: read, target: web, label: "invoice > $50,000", dashed: true },
      { id: lt, source: read, target: fs, label: "invoice < $50,000", dashed: true },
      { id: webAcct, source: web, target: acct, label: "", dashed: false },
      { id: fsAcct, source: fs, target: acct, label: "", dashed: false },
      { id: acctEnter, source: acct, target: enter, label: "", dashed: false },
      { id: enterReview, source: enter, target: review, label: "", dashed: false },
    ],
    assignments: {
      [read]: alice,
      [web]: alice,
      [fs]: alice,
      [enter]: alice,
      [review]: alice,
    },
    after: {
      ...emptyAfterOverlay(),
      assignments: {
        [read]: robot,
        [web]: robot,
        [fs]: robot,
        [enter]: robot,
        [review]: alice,
      },
    },
  };
}

/** Empty consulting board: default roster, zero Nodes (WG-01). Add Step creates the root. */
export function freshBoard(): WorkflowDoc {
  const actors = defaultActors();
  return {
    version: WORKFLOW_VERSION,
    actors,
    nodes: [],
    edges: [],
    assignments: {},
    after: emptyAfterOverlay(),
  };
}

export function isEmptyBoard(doc: WorkflowDoc): boolean {
  return (
    doc.nodes.length === 0 &&
    doc.edges.length === 0 &&
    doc.after.extraNodes.length === 0 &&
    doc.after.extraEdges.length === 0
  );
}
