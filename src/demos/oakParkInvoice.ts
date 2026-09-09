/**
 * Oak Park invoice walkthrough — first-visit board and hamburger Demo item.
 * The document lives in oak-park-invoice.yaml. IDs stay here for tests.
 */
import oakParkYaml from "./oak-park-invoice.yaml?raw";
import { defaultActors } from "../workflow/actors";
import { WORKFLOW_VERSION } from "../workflow/catalogs";
import { emptyAfterOverlay, type WorkflowDoc } from "../workflow/types";
import { cloneWorkflow, loadYamlFixture } from "./loadYamlFixture";

export const OAK_PARK_IDS = {
  alice: "h_alice",
  roy: "h_roy",
  jack: "h_jack",
  missy: "h_missy",
  robot: "r_script",
  llm: "r_llm",
  read: "s_read",
  web: "s_web",
  fs: "s_fs",
  acct: "d_acct",
  enter: "s_enter",
  review: "s_review",
  review2: "s_review2",
  review3: "s_review3",
  gt: "e_gt",
  lt: "e_lt",
  webAcct: "e_web_acct",
  fsAcct: "e_fs_acct",
  acctEnter: "e_acct_enter",
  enterReview: "e_enter_review",
  reviewTo2: "e_review_2",
  reviewTo3: "e_review_3",
} as const;

/** Read → (amount split) Search → Account # → Write → three Human Reviews. */
export function oakParkInvoice(): WorkflowDoc {
  return cloneWorkflow(loadYamlFixture(oakParkYaml, "Oak Park Invoice"));
}

/** Empty consulting board: default roster, zero Nodes (WG-01). Add Step or Add Data creates the root. */
export function freshBoard(): WorkflowDoc {
  return {
    version: WORKFLOW_VERSION,
    actors: defaultActors(),
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
