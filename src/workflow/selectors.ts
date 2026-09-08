/**
 * Document lookup across the base workflow and After overlay (BA-01, BA-02).
 */
import type { EdgeDto, NodeDto, WorkflowDoc } from "./types";

/** Base Node or After-only Step. */
export function findNode(doc: WorkflowDoc, id: string): NodeDto | undefined {
  return doc.nodes.find((n) => n.id === id) ?? doc.after.extraNodes.find((n) => n.id === id);
}

/** Base Path or After-only Path. */
export function findEdge(doc: WorkflowDoc, id: string): EdgeDto | undefined {
  return doc.edges.find((e) => e.id === id) ?? doc.after.extraEdges.find((e) => e.id === id);
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
