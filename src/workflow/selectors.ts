/**
 * Document lookup. Pass a lane when Before and After can hold the same id
 * with different fields — the base copy is not the After copy.
 */
import { AssignmentLane } from "./catalogs";
import { laneBoard, type EdgeDto, type NodeDto, type WorkflowDoc } from "./types";

/** Node on a lane, or the base Node, else a fork-only / legacy After Step. */
export function findNode(doc: WorkflowDoc, id: string, lane?: AssignmentLane): NodeDto | undefined {
  if (lane) return laneBoard(doc, lane).nodes.find((n) => n.id === id);
  return (
    doc.nodes.find((n) => n.id === id) ??
    doc.after.fork?.nodes.find((n) => n.id === id) ??
    doc.after.extraNodes.find((n) => n.id === id)
  );
}

/** Path on a lane, or the base Path, else a fork-only / legacy After Path. */
export function findEdge(doc: WorkflowDoc, id: string, lane?: AssignmentLane): EdgeDto | undefined {
  if (lane) return laneBoard(doc, lane).edges.find((e) => e.id === id);
  return (
    doc.edges.find((e) => e.id === id) ??
    doc.after.fork?.edges.find((e) => e.id === id) ??
    doc.after.extraEdges.find((e) => e.id === id)
  );
}

export function isAfterOnlyNode(doc: WorkflowDoc, id: string): boolean {
  return doc.after.extraNodes.some((n) => n.id === id);
}

export function isBeforeOriginNode(doc: WorkflowDoc, id: string): boolean {
  return doc.nodes.some((n) => n.id === id);
}

export function isAfterOnlyEdge(doc: WorkflowDoc, id: string): boolean {
  return doc.after.extraEdges.some((e) => e.id === id);
}
