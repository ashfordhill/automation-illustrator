/**
 * Pure Before/After projections from a v2 document (BA-01, BA-02).
 * Layout and React Flow consume these graphs; the saved document is unchanged.
 * Merge groups are never projected; After shows every Step as a normal tile.
 */
import { AssignmentLane } from "../workflow/catalogs";
import { type EdgeDto, type NodeDto, type WorkflowDoc } from "../workflow/types";

export type ProjectedKind = "base" | "extra";

export type ProjectedNode = NodeDto & {
  /** Document id to edit. */
  originId: string;
  projectedKind: ProjectedKind;
};

export type ProjectedEdge = EdgeDto & {
  /** Underlying Path id (base or After-only). */
  originId: string;
};

export type LaneProjection = {
  lane: AssignmentLane;
  nodes: ProjectedNode[];
  edges: ProjectedEdge[];
};

function asProjected(node: NodeDto, kind: ProjectedKind, originId = node.id): ProjectedNode {
  return { ...node, originId, projectedKind: kind };
}

function asProjectedEdge(edge: EdgeDto): ProjectedEdge {
  return { ...edge, originId: edge.id };
}

/** Before: base graph only. After-only data never appears (BA-06). */
export function projectBefore(doc: WorkflowDoc): LaneProjection {
  return {
    lane: AssignmentLane.Before,
    nodes: doc.nodes.map((n) => asProjected(n, "base")),
    edges: doc.edges.map(asProjectedEdge),
  };
}

/**
 * After: the Before board while After is following, otherwise After's own copy.
 * Who is read from the same board at render time.
 */
export function projectAfter(doc: WorkflowDoc): LaneProjection {
  const board = doc.after.fork ?? { nodes: doc.nodes, edges: doc.edges };
  return {
    lane: AssignmentLane.After,
    nodes: board.nodes.map((n) => asProjected(n, "base")),
    edges: board.edges.map(asProjectedEdge),
  };
}

export function projectLane(doc: WorkflowDoc, lane: AssignmentLane): LaneProjection {
  return lane === AssignmentLane.After ? projectAfter(doc) : projectBefore(doc);
}
