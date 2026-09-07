/**
 * Pure Before/After projections from a v2 document (BA-01, BA-02, MG-09).
 * Layout and React Flow consume these graphs; the saved document is unchanged.
 */
import { AssignmentLane, WorkflowNodeKind } from "../workflow/catalogs";
import { reachableFrom } from "../workflow/graph";
import { isStepNode, type EdgeDto, type NodeDto, type StepNodeDto, type WorkflowDoc } from "../workflow/types";

export type ProjectedKind = "base" | "extra" | "group";

export type ProjectedNode = NodeDto & {
  /** Document id to edit; group tiles use the merge-group id. */
  originId: string;
  projectedKind: ProjectedKind;
  memberIds?: string[];
  supportingIds?: string[];
};

export type ProjectedEdge = EdgeDto & {
  /** Underlying Path id (base or After-only). */
  originId: string;
};

export type GroupInternals = {
  groupId: string;
  memberIds: string[];
  supportingIds: string[];
  internalEdges: EdgeDto[];
};

export type LaneProjection = {
  lane: AssignmentLane;
  nodes: ProjectedNode[];
  edges: ProjectedEdge[];
  internals: GroupInternals[];
};

function asProjected(node: NodeDto, kind: ProjectedKind, originId = node.id): ProjectedNode {
  return { ...node, originId, projectedKind: kind };
}

function asProjectedEdge(edge: EdgeDto): ProjectedEdge {
  return { ...edge, originId: edge.id };
}

/** Data (and any other non-member) Nodes that sit on a base path between two members (MG-03). */
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

function averagePosition(nodes: NodeDto[]): { x: number; y: number } {
  if (!nodes.length) return { x: 0, y: 0 };
  let x = 0;
  let y = 0;
  for (const n of nodes) {
    x += n.position.x;
    y += n.position.y;
  }
  return { x: x / nodes.length, y: y / nodes.length };
}

function groupTile(
  groupId: string,
  members: StepNodeDto[],
  hidden: NodeDto[],
): ProjectedNode {
  const first = members[0]!;
  const position = averagePosition(hidden.length ? hidden : members);
  return {
    id: groupId,
    type: WorkflowNodeKind.Step,
    position,
    stepKind: first.stepKind,
    title: first.title,
    detail: "",
    split: first.split,
    originId: groupId,
    projectedKind: "group",
    memberIds: members.map((m) => m.id),
  };
}

/** Before: base graph only. After-only data never appears (BA-06). */
export function projectBefore(doc: WorkflowDoc): LaneProjection {
  return {
    lane: AssignmentLane.Before,
    nodes: doc.nodes.map((n) => asProjected(n, "base")),
    edges: doc.edges.map(asProjectedEdge),
    internals: [],
  };
}

/**
 * After: extra Nodes/Paths plus merge groups. Internal Paths are hidden;
 * boundary endpoints remap to the group render id; parallel conditions stay distinct (MG-09).
 */
export function projectAfter(doc: WorkflowDoc): LaneProjection {
  const hiddenToGroup = new Map<string, string>();
  const internals: GroupInternals[] = [];
  const hiddenIds = new Set<string>();

  for (const g of doc.after.groups) {
    const members = g.memberIds
      .map((id) => doc.nodes.find((n) => n.id === id))
      .filter((n): n is StepNodeDto => !!n && isStepNode(n));
    if (!members.length) continue;
    const supportingIds = supportingInternalIds(g.memberIds, doc.nodes, doc.edges);
    const swallowed = new Set([...g.memberIds, ...supportingIds]);
    const internalEdges = [...doc.edges, ...doc.after.extraEdges].filter(
      (e) => swallowed.has(e.source) && swallowed.has(e.target),
    );
    internals.push({
      groupId: g.id,
      memberIds: g.memberIds.slice(),
      supportingIds,
      internalEdges,
    });
    for (const id of swallowed) {
      if (!hiddenToGroup.has(id)) hiddenToGroup.set(id, g.id);
      hiddenIds.add(id);
    }
  }

  const remap = (id: string) => hiddenToGroup.get(id) ?? id;

  const groupNodes: ProjectedNode[] = internals.map((g) => {
    const members = g.memberIds
      .map((id) => doc.nodes.find((n) => n.id === id))
      .filter((n): n is StepNodeDto => !!n && isStepNode(n));
    const hidden = [...g.memberIds, ...g.supportingIds]
      .map((id) => doc.nodes.find((n) => n.id === id))
      .filter((n): n is NodeDto => !!n);
    return groupTile(g.groupId, members, hidden);
  });

  const visibleBase = doc.nodes
    .filter((n) => !hiddenIds.has(n.id))
    .map((n) => asProjected(n, "base"));
  const extra = doc.after.extraNodes
    .filter((n) => !hiddenIds.has(n.id))
    .map((n) => asProjected(n, "extra"));

  const rawEdges = [...doc.edges, ...doc.after.extraEdges];
  const edges: ProjectedEdge[] = [];
  for (const e of rawEdges) {
    const source = remap(e.source);
    const target = remap(e.target);
    if (source === target) continue;
    if (hiddenIds.has(e.source) && hiddenIds.has(e.target) && source === target) continue;
    const srcGroup = hiddenToGroup.get(e.source);
    const tgtGroup = hiddenToGroup.get(e.target);
    if (srcGroup && tgtGroup && srcGroup === tgtGroup) continue;
    edges.push({ ...e, source, target, originId: e.id });
  }

  return {
    lane: AssignmentLane.After,
    nodes: [...visibleBase, ...groupNodes, ...extra],
    edges,
    internals,
  };
}

export function projectLane(doc: WorkflowDoc, lane: AssignmentLane): LaneProjection {
  return lane === AssignmentLane.After ? projectAfter(doc) : projectBefore(doc);
}
