/**
 * Path topology: outgoing order and exclusive-split dotted strokes.
 * Framework-free; consumed by Board Paths, the +/- pad, and store.ts when linking.
 */
import { SplitKind, WorkflowNodeKind } from "./catalogs";
import {
  isStepNode,
  type AfterOverlay,
  type Assignments,
  type EdgeDto,
  type MergeGroupDto,
  type NodeDto,
  type Point,
  type PositionMap,
  type StepNodeDto,
  type WorkflowDoc,
  type WorkflowDocV1,
} from "./types";

/** Structured graph/document check used by Zod refinements, migrate.ts, and SH-09. */
export type GraphViolation = {
  code: GraphViolationCode;
  message: string;
};

/** Codes for each SH-09 / WG-02..WG-04 / identity class Slice 3 tests by name. */
export type GraphViolationCode =
  | "invalid-shape"
  | "duplicate-id"
  | "missing-ref"
  | "invalid-assignment"
  | "invalid-group"
  | "duplicate-path"
  | "multiple-roots"
  | "no-root"
  | "unreachable"
  | "cycle";

/** Look up a tile by id — used when sorting outgoing Paths by target position. */
function nodeOf(nodes: NodeDto[], id: string) {
  return nodes.find((n) => n.id === id);
}

/** Displayed position when a layout map has one, else the saved hint. */
export function positionOf(nodes: NodeDto[], id: string, positions?: PositionMap): Point | undefined {
  return positions?.[id] ?? nodeOf(nodes, id)?.position;
}

/** Outgoing Paths of a tile, top-to-bottom (then left-to-right) by displayed position. */
export function outgoingSorted(
  nodes: NodeDto[],
  edges: EdgeDto[],
  sourceId: string,
  positions?: PositionMap,
) {
  return edges
    .filter((e) => e.source === sourceId)
    .slice()
    .sort((a, b) => {
      const pa = positionOf(nodes, a.target, positions);
      const pb = positionOf(nodes, b.target, positions);
      const ya = pa?.y ?? 0;
      const yb = pb?.y ?? 0;
      if (ya !== yb) return ya - yb;
      return (pa?.x ?? 0) - (pb?.x ?? 0);
    });
}

/**
 * PC-02 default stroke from Split and outgoing count.
 * One of (exclusive) + two or more outgoing → dotted; Every → solid;
 * a single outgoing Path is always solid.
 */
export function splitDefaultDashed(split: SplitKind, outgoingCount: number): boolean {
  if (outgoingCount < 2) return false;
  return split === SplitKind.Exclusive;
}

/**
 * Stroke for one Path (PC-01, PC-02). A single outgoing Path is always solid.
 * Otherwise an explicit `dashed` flag wins; omitted flags follow Split.
 */
export function edgeIsDotted(
  nodes: NodeDto[],
  edges: EdgeDto[],
  edge: EdgeDto,
): boolean {
  const outs = outgoingSorted(nodes, edges, edge.source);
  if (outs.length < 2) return false;
  if (edge.dashed === true) return true;
  if (edge.dashed === false) return false;
  const src = nodeOf(nodes, edge.source);
  if (!src || src.type !== WorkflowNodeKind.Step) return false;
  return splitDefaultDashed(src.split, outs.length);
}

/** True when source already has an outgoing Path (a new one is an extra branch). */
export function defaultDashed(edges: EdgeDto[], sourceId: string) {
  return edges.some((e) => e.source === sourceId);
}

/** PC-03: changing Split re-applies the PC-02 default to every outgoing Path. */
export function applyDashForSplit(
  nodes: NodeDto[],
  edges: EdgeDto[],
  sourceId: string,
): EdgeDto[] {
  const src = nodeOf(nodes, sourceId);
  if (!src || src.type !== WorkflowNodeKind.Step) return edges;
  const outs = outgoingSorted(nodes, edges, sourceId);
  const dashed = splitDefaultDashed(src.split, outs.length);
  return edges.map((e) => (e.source !== sourceId ? e : { ...e, dashed }));
}

/**
 * Stroke for a newly connected Path. Crossing from one outgoing to two
 * applies Split defaults to every outgoing Path (PC-02). Extra branches
 * after that keep existing overrides and only stamp the new Path.
 */
export function applyConnectStroke(
  nodes: NodeDto[],
  edges: EdgeDto[],
  sourceId: string,
  newEdgeId: string,
  previousOutgoingCount: number,
): EdgeDto[] {
  if (previousOutgoingCount < 2) {
    return applyDashForSplit(nodes, edges, sourceId);
  }
  const src = nodeOf(nodes, sourceId);
  const split =
    src && src.type === WorkflowNodeKind.Step ? src.split : SplitKind.Parallel;
  const dashed = splitDefaultDashed(split, previousOutgoingCount + 1);
  return edges.map((e) => (e.id === newEdgeId ? { ...e, dashed } : e));
}

/** Incoming Paths of a tile, top-to-bottom (then left-to-right) by displayed source position. */
export function incomingSorted(
  nodes: NodeDto[],
  edges: EdgeDto[],
  targetId: string,
  positions?: PositionMap,
) {
  return edges
    .filter((e) => e.target === targetId)
    .slice()
    .sort((a, b) => {
      const pa = positionOf(nodes, a.source, positions);
      const pb = positionOf(nodes, b.source, positions);
      const ya = pa?.y ?? 0;
      const yb = pb?.y ?? 0;
      if (ya !== yb) return ya - yb;
      const xa = pa?.x ?? 0;
      const xb = pb?.x ?? 0;
      if (xa !== xb) return xa - xb;
      return a.source < b.source ? -1 : a.source > b.source ? 1 : 0;
    });
}

/**
 * WG-08: the host plus Nodes on incident Paths, excluding the root (WG-06).
 * Order is outgoing children, then the host, then predecessors.
 */
export function removalCandidateIds(
  nodes: NodeDto[],
  edges: EdgeDto[],
  hostId: string,
  positions?: PositionMap,
): string[] {
  const root = rootNodeId(nodes, edges);
  const seen = new Set<string>();
  const ids: string[] = [];
  const add = (id: string) => {
    if (!id || seen.has(id) || id === root) return;
    if (!nodes.some((n) => n.id === id)) return;
    seen.add(id);
    ids.push(id);
  };
  for (const e of outgoingSorted(nodes, edges, hostId, positions)) add(e.target);
  add(hostId);
  for (const e of incomingSorted(nodes, edges, hostId, positions)) add(e.source);
  return ids;
}

/** WG-09: first outgoing child (by displayed position); a leaf defaults to itself when removable. */
export function defaultRemovalCandidateId(
  nodes: NodeDto[],
  edges: EdgeDto[],
  hostId: string,
  positions?: PositionMap,
): string | null {
  const candidates = removalCandidateIds(nodes, edges, hostId, positions);
  if (!candidates.length) return null;
  const firstChild = outgoingSorted(nodes, edges, hostId, positions)[0]?.target;
  if (firstChild && candidates.includes(firstChild)) return firstChild;
  if (candidates.includes(hostId)) return hostId;
  return candidates[0] ?? null;
}

/** Next stacked port index when adding another outgoing Path from a tile. */
export function nextPortIndex(edges: EdgeDto[], sourceId: string) {
  return edges.filter((e) => e.source === sourceId).length;
}

/** The unique Node with no incoming Path, or null when empty / not unique (WG-02). */
export function rootNodeId(nodes: NodeDto[], edges: EdgeDto[]): string | null {
  if (!nodes.length) return null;
  const incoming = new Set(edges.map((e) => e.target));
  const roots = nodes.map((n) => n.id).filter((id) => !incoming.has(id));
  return roots.length === 1 ? roots[0]! : null;
}

/** Nodes reachable by following Paths forward from `start` (includes `start`). */
export function reachableFrom(start: string, edges: EdgeDto[]): Set<string> {
  const outgoing = new Map<string, string[]>();
  for (const e of edges) {
    const list = outgoing.get(e.source);
    if (list) list.push(e.target);
    else outgoing.set(e.source, [e.target]);
  }
  const seen = new Set<string>([start]);
  const queue = [start];
  while (queue.length) {
    const id = queue.shift()!;
    for (const next of outgoing.get(id) ?? []) {
      if (seen.has(next)) continue;
      seen.add(next);
      queue.push(next);
    }
  }
  return seen;
}

/** True when source→target would close a directed cycle (self-loop included). */
export function wouldCreateCycle(edges: EdgeDto[], source: string, target: string): boolean {
  if (source === target) return true;
  return reachableFrom(target, edges).has(source);
}

/**
 * Nodes that sit on a directed base path between two members (MG-03).
 * Callers treat Steps as members and Data as supporting internals.
 */
export function supportingInternalIds(
  memberIds: string[],
  nodes: NodeDto[],
  edges: EdgeDto[],
): string[] {
  const members = new Set(memberIds);
  if (members.size < 2) return [];
  const fromMember = new Map<string, Set<string>>();
  for (const id of memberIds) {
    fromMember.set(id, reachableFrom(id, edges));
  }
  const supporting: string[] = [];
  for (const n of nodes) {
    if (members.has(n.id)) continue;
    const fromHere = reachableFrom(n.id, edges);
    let onPath = false;
    for (const a of memberIds) {
      if (!fromMember.get(a)?.has(n.id)) continue;
      for (const b of memberIds) {
        if (a === b) continue;
        if (fromHere.has(b)) {
          onPath = true;
          break;
        }
      }
      if (onPath) break;
    }
    if (onPath) supporting.push(n.id);
  }
  return supporting;
}

/**
 * MG-04: no directed path between members may visit a Step that is not a member
 * (that path would leave the group and re-enter it). Data on those paths is supporting.
 */
export function isConvex(memberIds: string[], nodes: NodeDto[], edges: EdgeDto[]): boolean {
  if (memberIds.length <= 1) return true;
  for (const id of supportingInternalIds(memberIds, nodes, edges)) {
    const n = nodes.find((x) => x.id === id);
    if (n && isStepNode(n)) return false;
  }
  return true;
}

/** Mark a Step Exclusive once it has two or more outgoing Paths (unless already Parallel). */
export function maybeExclusiveSplit(
  nodes: NodeDto[],
  edges: EdgeDto[],
  sourceId: string,
): NodeDto[] {
  const outs = edges.filter((e) => e.source === sourceId).length;
  if (outs < 2) return nodes;
  return nodes.map((n) =>
    n.id === sourceId && n.type === WorkflowNodeKind.Step && n.split !== SplitKind.Parallel
      ? { ...n, split: SplitKind.Exclusive }
      : n,
  );
}

function v(code: GraphViolationCode, message: string): GraphViolation {
  return { code, message };
}

function uniqueIds(parts: Array<{ id: string; where: string }>): GraphViolation[] {
  const seen = new Map<string, string>();
  const out: GraphViolation[] = [];
  for (const part of parts) {
    const prev = seen.get(part.id);
    if (prev) {
      out.push(v("duplicate-id", `Duplicate id "${part.id}" (${prev} and ${part.where}).`));
    } else {
      seen.set(part.id, part.where);
    }
  }
  return out;
}

function edgeRefs(nodes: Array<{ id: string }>, edges: EdgeDto[], where: string): GraphViolation[] {
  const ids = new Set(nodes.map((n) => n.id));
  const out: GraphViolation[] = [];
  for (const e of edges) {
    if (!ids.has(e.source)) {
      out.push(v("missing-ref", `Path "${e.id}" source "${e.source}" is not a ${where}.`));
    }
    if (!ids.has(e.target)) {
      out.push(v("missing-ref", `Path "${e.id}" target "${e.target}" is not a ${where}.`));
    }
  }
  return out;
}

function assignmentRefs(
  assignments: Assignments,
  stepIds: Set<string>,
  actorIds: Set<string>,
  lane: string,
): GraphViolation[] {
  const out: GraphViolation[] = [];
  for (const [stepId, actorId] of Object.entries(assignments)) {
    if (!stepIds.has(stepId)) {
      out.push(
        v("invalid-assignment", `${lane} Who for "${stepId}" is not a Step on that lane.`),
      );
    }
    if (!actorIds.has(actorId)) {
      out.push(
        v("invalid-assignment", `${lane} Who on "${stepId}" points at missing actor "${actorId}".`),
      );
    }
  }
  return out;
}

function groupRefs(
  groups: MergeGroupDto[],
  baseStepIds: Set<string>,
): GraphViolation[] {
  const out: GraphViolation[] = [];
  const owned = new Map<string, string>();
  for (const g of groups) {
    if (!g.memberIds.length) {
      out.push(v("invalid-group", `Merge group "${g.id}" has no members.`));
      continue;
    }
    const seen = new Set<string>();
    for (const memberId of g.memberIds) {
      if (seen.has(memberId)) {
        out.push(v("invalid-group", `Merge group "${g.id}" repeats member "${memberId}".`));
      }
      seen.add(memberId);
      if (!baseStepIds.has(memberId)) {
        out.push(
          v(
            "invalid-group",
            `Merge group "${g.id}" member "${memberId}" is not a Before-origin Step.`,
          ),
        );
      }
      const prev = owned.get(memberId);
      if (prev && prev !== g.id) {
        out.push(
          v(
            "invalid-group",
            `Step "${memberId}" belongs to merge groups "${prev}" and "${g.id}". Nested groups are not allowed.`,
          ),
        );
      } else {
        owned.set(memberId, g.id);
      }
    }
  }
  return out;
}

/**
 * WG-02..WG-04 on one Node/Path set: single root, reachability, acyclicity, no duplicate Paths.
 * Empty graphs are valid (WG-01).
 */
export function validateGraphInvariants(nodes: NodeDto[], edges: EdgeDto[]): GraphViolation[] {
  if (!nodes.length) {
    if (edges.length) {
      return edgeRefs(nodes, edges, "Node");
    }
    return [];
  }

  const out: GraphViolation[] = [];
  const nodeIds = new Set(nodes.map((n) => n.id));
  const usable = edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));

  const pairSeen = new Map<string, string>();
  for (const e of usable) {
    const key = `${e.source}\0${e.target}`;
    const prev = pairSeen.get(key);
    if (prev) {
      out.push(
        v("duplicate-path", `Duplicate Path from "${e.source}" to "${e.target}" (${prev}, ${e.id}).`),
      );
    } else {
      pairSeen.set(key, e.id);
    }
  }

  const incoming = new Set<string>();
  const outgoing = new Map<string, string[]>();
  for (const id of nodeIds) outgoing.set(id, []);
  for (const e of usable) {
    incoming.add(e.target);
    outgoing.get(e.source)!.push(e.target);
  }

  const roots = nodes.map((n) => n.id).filter((id) => !incoming.has(id));
  if (roots.length === 0) {
    out.push(v("no-root", "This workflow has no root (every Node has an incoming Path)."));
  } else if (roots.length > 1) {
    out.push(
      v(
        "multiple-roots",
        `Multiple roots: ${roots.slice().sort().join(", ")}. Every nonempty workflow needs exactly one root.`,
      ),
    );
  } else {
    const root = roots[0]!;
    const seen = new Set<string>();
    const queue = [root];
    seen.add(root);
    while (queue.length) {
      const id = queue.shift()!;
      for (const next of outgoing.get(id) ?? []) {
        if (seen.has(next)) continue;
        seen.add(next);
        queue.push(next);
      }
    }
    const unreachable = nodes.map((n) => n.id).filter((id) => !seen.has(id));
    if (unreachable.length) {
      out.push(
        v(
          "unreachable",
          `Node${unreachable.length === 1 ? "" : "s"} ${unreachable.sort().join(", ")} cannot be reached from the root.`,
        ),
      );
    }
  }

  const color = new Map<string, 0 | 1 | 2>();
  const stack: string[] = [];
  const visit = (id: string): string[] | null => {
    color.set(id, 1);
    stack.push(id);
    for (const next of outgoing.get(id) ?? []) {
      const c = color.get(next) ?? 0;
      if (c === 1) {
        const i = stack.indexOf(next);
        return [...stack.slice(i), next];
      }
      if (c === 0) {
        const found = visit(next);
        if (found) return found;
      }
    }
    stack.pop();
    color.set(id, 2);
    return null;
  };
  for (const n of nodes) {
    if ((color.get(n.id) ?? 0) === 0) {
      const cycle = visit(n.id);
      if (cycle) {
        out.push(v("cycle", `Cycle: ${cycle.join(" → ")}.`));
        break;
      }
    }
  }

  return out;
}

function overlayParts(after: AfterOverlay): {
  extraNodes: StepNodeDto[];
  extraEdges: EdgeDto[];
  groups: MergeGroupDto[];
  afterAssignments: Assignments;
} {
  return {
    extraNodes: after.extraNodes,
    extraEdges: after.extraEdges,
    groups: after.groups,
    afterAssignments: after.assignments,
  };
}

/** Ungrouped After graph: base Nodes/Paths plus After-only Steps/Paths. */
export function afterGraph(doc: WorkflowDoc): { nodes: NodeDto[]; edges: EdgeDto[] } {
  return {
    nodes: [...doc.nodes, ...doc.after.extraNodes],
    edges: [...doc.edges, ...doc.after.extraEdges],
  };
}

/** Identity, references, and WG-02..WG-04 for a v2 document (including After overlay refs). */
export function validateWorkflow(doc: WorkflowDoc): GraphViolation[] {
  const extra = overlayParts(doc.after);
  const out: GraphViolation[] = [];
  out.push(
    ...uniqueIds([
      ...doc.actors.map((a) => ({ id: a.id, where: "actor" })),
      ...doc.nodes.map((n) => ({ id: n.id, where: "Node" })),
      ...doc.edges.map((e) => ({ id: e.id, where: "Path" })),
      ...extra.extraNodes.map((n) => ({ id: n.id, where: "After-only Step" })),
      ...extra.extraEdges.map((e) => ({ id: e.id, where: "After-only Path" })),
      ...extra.groups.map((g) => ({ id: g.id, where: "merge group" })),
    ]),
  );
  out.push(...edgeRefs(doc.nodes, doc.edges, "Node"));
  const visible = [...doc.nodes, ...extra.extraNodes];
  out.push(...edgeRefs(visible, extra.extraEdges, "Node visible in After"));

  const actorIds = new Set(doc.actors.map((a) => a.id));
  const baseStepIds = new Set(doc.nodes.filter(isStepNode).map((n) => n.id));
  const afterStepIds = new Set([
    ...baseStepIds,
    ...extra.extraNodes.map((n) => n.id),
  ]);
  out.push(...assignmentRefs(doc.assignments, baseStepIds, actorIds, "Before"));
  out.push(...assignmentRefs(extra.afterAssignments, afterStepIds, actorIds, "After"));
  out.push(...groupRefs(extra.groups, baseStepIds));
  out.push(...validateGraphInvariants(doc.nodes, doc.edges));
  if (extra.extraNodes.length || extra.extraEdges.length) {
    out.push(
      ...validateGraphInvariants(
        [...doc.nodes, ...extra.extraNodes],
        [...doc.edges, ...extra.extraEdges],
      ),
    );
  }
  return out;
}

/** Same checks on a parsed v1 document before migration (SH-09: do not repair). */
export function validateWorkflowV1(doc: WorkflowDocV1): GraphViolation[] {
  const nodes = doc.nodes as NodeDto[];
  const out: GraphViolation[] = [];
  out.push(
    ...uniqueIds([
      ...doc.actors.map((a) => ({ id: a.id, where: "actor" })),
      ...nodes.map((n) => ({ id: n.id, where: "Node" })),
      ...doc.edges.map((e) => ({ id: e.id, where: "Path" })),
    ]),
  );
  out.push(...edgeRefs(nodes, doc.edges, "Node"));
  const actorIds = new Set(doc.actors.map((a) => a.id));
  const baseStepIds = new Set(nodes.filter(isStepNode).map((n) => n.id));
  out.push(
    ...assignmentRefs(doc.assignments.before ?? {}, baseStepIds, actorIds, "Before"),
  );
  out.push(
    ...assignmentRefs(doc.assignments.after ?? {}, baseStepIds, actorIds, "After"),
  );
  out.push(...validateGraphInvariants(nodes, doc.edges));
  return out;
}
