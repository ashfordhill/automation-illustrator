/**
 * After either shows Before, or owns a copy taken at the first After edit.
 * Before edits never write that copy. Restart throws the copy away.
 * Graph commands stay lane-blind: they see one board at a time.
 */
import { AssignmentLane } from "./catalogs";
import { ok, type CommandResult } from "./commands";
import {
  afterFollowsBefore,
  emptyAfterOverlay,
  laneBoard,
  sealAfter,
  type WorkflowDoc,
} from "./types";

export { afterFollowsBefore, laneBoard };

/** A document whose nodes, Paths, and Who are exactly that lane. Overlay is empty. */
export function asLaneDocument(doc: WorkflowDoc, lane: AssignmentLane): WorkflowDoc {
  const board = laneBoard(doc, lane);
  if (lane === AssignmentLane.After && doc.after.fork) {
    return {
      ...doc,
      nodes: board.nodes,
      edges: board.edges,
      assignments: board.assignments,
      after: emptyAfterOverlay(),
    };
  }
  return { ...doc, after: emptyAfterOverlay() };
}

/**
 * Run a base-graph command against one lane.
 * Before leaves an existing After copy alone.
 * After copies Before on the first edit, then writes only that copy.
 */
export function editLane(
  doc: WorkflowDoc,
  lane: AssignmentLane,
  mutate: (laneDoc: WorkflowDoc) => CommandResult<WorkflowDoc>,
): CommandResult<WorkflowDoc> {
  if (lane !== AssignmentLane.After) {
    const result = mutate({ ...doc, after: emptyAfterOverlay() });
    if (!result.ok) return result;
    return ok({
      ...result.value,
      after: sealAfter(doc.after, doc.after.fork ?? null),
    });
  }
  const board = doc.after.fork ?? {
    nodes: doc.nodes,
    edges: doc.edges,
    assignments: doc.assignments,
  };
  const result = mutate({
    ...doc,
    nodes: structuredClone(board.nodes),
    edges: structuredClone(board.edges),
    assignments: structuredClone(board.assignments),
    after: emptyAfterOverlay(),
  });
  if (!result.ok) return result;
  return ok({
    ...doc,
    actors: result.value.actors,
    after: sealAfter(doc.after, {
      nodes: result.value.nodes,
      edges: result.value.edges,
      assignments: result.value.assignments,
    }),
  });
}

/** Drop the After copy so After shows the current Before board. Already following returns the same doc. */
export function restartAfter(doc: WorkflowDoc): WorkflowDoc {
  if (
    !doc.after.fork &&
    doc.after.extraNodes.length === 0 &&
    doc.after.extraEdges.length === 0 &&
    Object.keys(doc.after.assignments).length === 0 &&
    doc.after.groups.length === 0 &&
    doc.after.looks == null
  ) {
    return doc;
  }
  return { ...doc, after: emptyAfterOverlay() };
}
