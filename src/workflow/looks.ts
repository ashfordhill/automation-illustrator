/**
 * Per-lane actor presentation.
 * The roster (name, color, role, kind) is shared. A look is what that actor
 * wears on one lane. After shows the Before book until the first After look
 * edit, which copies the whole book. Later Before look edits do not enter
 * that copy. This is separate from the workflow fork in lane.ts: changing
 * glasses does not freeze Steps, and deleting Steps does not freeze looks.
 * Restart After drops the look copy along with the board copy.
 *
 * Future per-lane attributes are fields on ActorLook. packLook is the one
 * place that decides which fields are stored.
 */
import { normalizeAccessories } from "./accessories";
import { AssignmentLane } from "./catalogs";
import { isHuman, type ActorDto, type ActorLook, type ActorLooks, type WorkflowDoc } from "./types";
import type { AccessoryKind } from "./catalogs";

const NO_LOOKS: ActorLooks = {};

export function afterLooksFollow(doc: WorkflowDoc): boolean {
  return doc.after.looks == null;
}

/** Look book the lane is showing. A following After is Before. */
export function laneLooks(doc: WorkflowDoc, lane: AssignmentLane): ActorLooks {
  if (lane === AssignmentLane.After && doc.after.looks) return doc.after.looks;
  return doc.looks ?? NO_LOOKS;
}

/** Accessories that actor wears on this lane. Robots wear nothing. */
export function accessoriesFor(
  doc: WorkflowDoc,
  lane: AssignmentLane,
  actor: ActorDto | undefined,
): AccessoryKind[] {
  if (!isHuman(actor)) return [];
  return normalizeAccessories(laneLooks(doc, lane)[actor.id]?.accessories);
}

/**
 * Drop empty fields. A look with nothing left is omitted from the book.
 * Add a future attribute here, and return null only when every field is empty.
 */
export function packLook(look: ActorLook | undefined): ActorLook | null {
  const accessories = normalizeAccessories(look?.accessories);
  if (accessories.length === 0) return null;
  return { accessories };
}

function sameLook(a: ActorLook | null, b: ActorLook | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  const left = a.accessories ?? [];
  const right = b.accessories ?? [];
  return left.length === right.length && left.every((item, i) => item === right[i]);
}

/**
 * Write one actor's look on a lane.
 * Before writes the Before book. After copies that book on the first change,
 * then writes only the copy. The same worn items do not copy. Robots are ignored.
 * Returns the same document when nothing changes.
 */
export function setActorLook(
  doc: WorkflowDoc,
  lane: AssignmentLane,
  actorId: string,
  patch: ActorLook,
): WorkflowDoc {
  const actor = doc.actors.find((item) => item.id === actorId);
  if (!isHuman(actor)) return doc;
  const following = lane === AssignmentLane.After && doc.after.looks == null;
  const source = following ? (doc.looks ?? {}) : laneLooks(doc, lane);
  const packed = packLook({ ...source[actorId], ...patch });
  if (sameLook(packed, packLook(source[actorId]))) return doc;
  const book: ActorLooks = following ? structuredClone(doc.looks ?? {}) : { ...source };
  if (packed) book[actorId] = packed;
  else delete book[actorId];
  if (lane !== AssignmentLane.After) return { ...doc, looks: book };
  return { ...doc, after: { ...doc.after, looks: book } };
}

/** Remove one actor from both books. Same document when they were already absent. */
export function dropActorLook(doc: WorkflowDoc, actorId: string): WorkflowDoc {
  const before = doc.looks;
  const after = doc.after.looks;
  const inBefore = before != null && actorId in before;
  const inAfter = after != null && actorId in after;
  if (!inBefore && !inAfter) return doc;
  const looks = { ...(before ?? {}) };
  delete looks[actorId];
  if (!inAfter || !after) return { ...doc, looks };
  const afterLooks = { ...after };
  delete afterLooks[actorId];
  return { ...doc, looks, after: { ...doc.after, looks: afterLooks } };
}
