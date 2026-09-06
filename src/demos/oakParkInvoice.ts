/**
 * Oak Park invoice walkthrough — the board that loads on first visit
 * and from the hamburger Demo item. Wired through store.resetDemo / loadStart.
 */
import { GRID } from "../board/layout/tileMetrics";
import { aliceId, defaultActors, defaultRobotId } from "../workflow/actors";
import {
  IdPrefix,
  SplitKind,
  StepKind,
  WorkflowNodeKind,
  WORKFLOW_VERSION,
} from "../workflow/catalogs";
import { nid } from "../workflow/ids";
import { emptyAfterOverlay, type WorkflowDoc } from "../workflow/types";

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
    assignments: Object.fromEntries(Object.values(steps).map((id) => [id, alice])),
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

/** Empty consulting board: people plus one Step. Later Steps spawn from + on a tile. */
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
    assignments: alice ? { [id]: alice } : {},
    after: {
      ...emptyAfterOverlay(),
      assignments: alice ? { [id]: alice } : {},
    },
  };
}
