/**
 * Merge groups and After-only Steps/Paths (MG-02..MG-07, MG-10, BA-06, BA-07, NA-04).
 * Commands stay framework-free; the store commits only a successful result.
 */
import { ensureDefaultRobot } from "./actors";
import { IdPrefix, SplitKind } from "./catalogs";
import {
  MSG,
  collapseStroke,
  fail,
  fanPairings,
  joinConditions,
  nearestPairings,
  ok,
  succeed,
  uniqueIds,
  type CommandResult,
  type RemovalPlan,
  type RemovalPairing,
} from "./commands";
import {
  afterGraph,
  applyConnectStroke,
  edgeIsDotted,
  incomingSorted,
  isConvex,
  maybeExclusiveSplit,
  outgoingSorted,
  removalCandidateIds,
  rootNodeId,
  splitDefaultDashed,
  supportingInternalIds,
  wouldCreateCycle,
} from "./graph";
import { nid } from "./ids";
import {
  findMergeGroup,
  findNode,
  isAfterOnlyNode,
} from "./selectors";
import {
  isDataFieldNode,
  isStepNode,
  stepDisplayLabel,
  type EdgeDto,
  type MergeGroupDto,
  type NodeDto,
  type StepNodeDto,
  type WorkflowDoc,
} from "./types";

export type MergePreview = {
  memberIds: string[];
  supportingIds: string[];
};

function groupCaption(doc: WorkflowDoc, group: MergeGroupDto): string {
  const names = group.memberIds.map((id) => {
    const n = doc.nodes.find((x) => x.id === id);
    if (n && isStepNode(n)) return stepDisplayLabel(n.stepKind, n.title);
    return id;
  });
  return names.filter(Boolean).join(", ") || group.id;
}

export function mergeConvexityMessage(doc: WorkflowDoc, group: MergeGroupDto): string {
  return `That Path would leave merge group "${groupCaption(doc, group)}" and re-enter it. Unmerge first.`;
}

function orderByPosition(ids: string[], nodes: NodeDto[]): string[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  return ids.slice().sort((a, b) => {
    const na = byId.get(a);
    const nb = byId.get(b);
    const xa = na?.position.x ?? 0;
    const xb = nb?.position.x ?? 0;
    if (xa !== xb) return xa - xb;
    const ya = na?.position.y ?? 0;
    const yb = nb?.position.y ?? 0;
    if (ya !== yb) return ya - yb;
    return a.localeCompare(b);
  });
}

function weaklyConnected(ids: string[], nodes: NodeDto[], edges: EdgeDto[]): boolean {
  if (ids.length <= 1) return true;
  const adj = new Map<string, string[]>();
  const ensure = (id: string) => {
    if (!adj.has(id)) adj.set(id, []);
  };
  for (const n of nodes) ensure(n.id);
  for (const e of edges) {
    ensure(e.source);
    ensure(e.target);
    adj.get(e.source)!.push(e.target);
    adj.get(e.target)!.push(e.source);
  }
  const start = ids[0]!;
  const seen = new Set<string>([start]);
  const queue = [start];
  while (queue.length) {
    const id = queue.shift()!;
    for (const next of adj.get(id) ?? []) {
      if (seen.has(next)) continue;
      seen.add(next);
      queue.push(next);
    }
  }
  return ids.every((id) => seen.has(id));
}

function seedStepIds(doc: WorkflowDoc, selectedIds: string[]): CommandResult<string[]> {
  const seed: string[] = [];
  const seen = new Set<string>();
  const add = (id: string) => {
    if (seen.has(id)) return;
    seen.add(id);
    seed.push(id);
  };
  for (const id of selectedIds) {
    const group = findMergeGroup(doc, id);
    if (group) {
      for (const memberId of group.memberIds) add(memberId);
      continue;
    }
    if (isAfterOnlyNode(doc, id)) {
      return fail("merge-after-only", MSG.mergeAfterOnly);
    }
    const node = doc.nodes.find((n) => n.id === id);
    if (!node) return fail("missing-ref", MSG.missingNode);
    if (isDataFieldNode(node)) return fail("merge-data", MSG.mergeData);
    if (!isStepNode(node)) return fail("merge-need-steps", MSG.mergeNeedSteps);
    add(id);
  }
  if (!seed.length) return fail("merge-need-steps", MSG.mergeNeedSteps);
  return ok(seed);
}

/** Closure of selected Before-origin Steps (MG-03) plus connectivity (MG-04). */
export function expandMergeSelection(
  doc: WorkflowDoc,
  selectedIds: string[],
): CommandResult<MergePreview> {
  const seeds = seedStepIds(doc, selectedIds);
  if (!seeds.ok) return seeds;
  const seed = seeds.value;
  const onPath = supportingInternalIds(seed, doc.nodes, doc.edges);
  const members = new Set(seed);
  const supporting: string[] = [];
  for (const id of onPath) {
    const n = doc.nodes.find((x) => x.id === id);
    if (!n) continue;
    if (isStepNode(n)) members.add(n.id);
    else supporting.push(n.id);
  }
  const memberIds = orderByPosition([...members], doc.nodes);
  const supportingIds = orderByPosition(supporting, doc.nodes);
  if (memberIds.length > 1) {
    const keep = new Set([...memberIds, ...supportingIds]);
    const subNodes = doc.nodes.filter((n) => keep.has(n.id));
    const subEdges = doc.edges.filter((e) => keep.has(e.source) && keep.has(e.target));
    if (!weaklyConnected(memberIds, subNodes, subEdges)) {
      return fail("merge-disconnected", MSG.mergeDisconnected);
    }
  }
  if (!isConvex(memberIds, doc.nodes, doc.edges)) {
    return fail("merge-disconnected", MSG.mergeDisconnected);
  }
  return ok({ memberIds, supportingIds });
}

function assignMembers(
  assignments: Record<string, string>,
  memberIds: string[],
  robotId: string,
): Record<string, string> {
  const next = { ...assignments };
  for (const id of memberIds) next[id] = robotId;
  return next;
}

/**
 * Create, extend, or flatten merge groups from a selection (MG-02..MG-06).
 * Uses the default Robot (auto-created per NA-04) for every member.
 */
export function createMergeGroup(
  doc: WorkflowDoc,
  selectedIds: string[],
  groupId?: string,
): CommandResult<WorkflowDoc> {
  const valid = succeed(doc);
  if (!valid.ok) return valid;
  const preview = expandMergeSelection(doc, selectedIds);
  if (!preview.ok) return preview;
  let memberIds = preview.value.memberIds;

  const intersecting = doc.after.groups.filter((g) =>
    g.memberIds.some((id) => memberIds.includes(id) || selectedIds.includes(g.id)),
  );
  if (intersecting.length) {
    const union = new Set(memberIds);
    for (const g of intersecting) {
      for (const id of g.memberIds) union.add(id);
    }
    const again = expandMergeSelection(doc, [...union]);
    if (!again.ok) return again;
    memberIds = again.value.memberIds;
  }

  const withRobot = ensureDefaultRobot(doc);
  const keepId = intersecting[0]?.id ?? groupId ?? nid(IdPrefix.Group);
  const groups = [
    ...doc.after.groups.filter((g) => !intersecting.some((x) => x.id === g.id)),
    { id: keepId, memberIds },
  ];
  return succeed({
    ...withRobot.doc,
    after: {
      ...withRobot.doc.after,
      groups,
      assignments: assignMembers(withRobot.doc.after.assignments, memberIds, withRobot.robotId),
    },
  });
}

/** Full-group unmerge; member After Who values stay (MG-07). */
export function removeMergeGroup(doc: WorkflowDoc, groupId: string): CommandResult<WorkflowDoc> {
  const valid = succeed(doc);
  if (!valid.ok) return valid;
  if (!findMergeGroup(doc, groupId)) {
    return fail("missing-ref", MSG.mergeMissing);
  }
  return succeed({
    ...doc,
    after: {
      ...doc.after,
      groups: doc.after.groups.filter((g) => g.id !== groupId),
    },
  });
}

/** MG-06: Who on the giant Step updates every swallowed Step. */
export function assignMergeGroupWho(
  doc: WorkflowDoc,
  groupId: string,
  actorId: string,
): CommandResult<WorkflowDoc> {
  const valid = succeed(doc);
  if (!valid.ok) return valid;
  const group = findMergeGroup(doc, groupId);
  if (!group) return fail("missing-ref", MSG.mergeMissing);
  if (!doc.actors.some((a) => a.id === actorId)) {
    return fail("missing-ref", MSG.missingNode);
  }
  return succeed({
    ...doc,
    after: {
      ...doc.after,
      assignments: assignMembers(doc.after.assignments, group.memberIds, actorId),
    },
  });
}

function swallowedIds(doc: WorkflowDoc, group: MergeGroupDto): Set<string> {
  const supporting = supportingInternalIds(group.memberIds, doc.nodes, doc.edges);
  return new Set([...group.memberIds, ...supporting]);
}

function groupBoundaryMember(
  doc: WorkflowDoc,
  group: MergeGroupDto,
  role: "source" | "target",
): string {
  const swallowed = swallowedIds(doc, group);
  const edges = afterGraph(doc).edges;
  const ordered = orderByPosition(group.memberIds, doc.nodes);
  if (role === "source") {
    const sinks = ordered.filter(
      (id) => !edges.some((e) => e.source === id && swallowed.has(e.target)),
    );
    return sinks[sinks.length - 1] ?? ordered[ordered.length - 1]!;
  }
  const entries = ordered.filter(
    (id) => !edges.some((e) => e.target === id && swallowed.has(e.source)),
  );
  return entries[0] ?? ordered[0]!;
}

/** Map a visible After tile id (base, extra, or merge group) onto a document Node id. */
export function resolveAfterEndpoint(
  doc: WorkflowDoc,
  visibleId: string,
  role: "source" | "target",
): CommandResult<string> {
  const group = findMergeGroup(doc, visibleId);
  if (group) return ok(groupBoundaryMember(doc, group, role));
  if (findNode(doc, visibleId)) return ok(visibleId);
  return fail("missing-ref", MSG.missingNode);
}

function extraDashed(doc: WorkflowDoc, sourceId: string, previousOutgoing: number): boolean {
  const src = findNode(doc, sourceId);
  const split = src && isStepNode(src) ? src.split : undefined;
  return splitDefaultDashed(split ?? SplitKind.Exclusive, previousOutgoing + 1);
}

/** After-only Path between any two Nodes visible in After (BA-06, WG-04 on After). */
export function connectAfter(
  doc: WorkflowDoc,
  sourceVisible: string,
  targetVisible: string,
  options?: { id?: string; label?: string },
): CommandResult<WorkflowDoc> {
  const valid = succeed(doc);
  if (!valid.ok) return valid;
  if (sourceVisible === targetVisible) return fail("self-loop", MSG.selfLoop);
  const sourceRes = resolveAfterEndpoint(doc, sourceVisible, "source");
  if (!sourceRes.ok) return sourceRes;
  const targetRes = resolveAfterEndpoint(doc, targetVisible, "target");
  if (!targetRes.ok) return targetRes;
  const source = sourceRes.value;
  const target = targetRes.value;
  if (source === target) return fail("self-loop", MSG.mergeInternalPath);

  const graph = afterGraph(doc);
  const ids = new Set(graph.nodes.map((n) => n.id));
  if (!ids.has(source) || !ids.has(target)) {
    return fail("missing-ref", MSG.missingNode);
  }
  if (graph.edges.some((e) => e.source === source && e.target === target)) {
    return fail("duplicate-path", MSG.duplicatePath);
  }
  const root = rootNodeId(doc.nodes, doc.edges);
  if (root && target === root) return fail("root-incoming", MSG.rootIncoming);
  if (wouldCreateCycle(graph.edges, source, target)) {
    return fail("cycle", MSG.cycle);
  }

  const previousOutgoing = graph.edges.filter((e) => e.source === source).length;
  const edgeId = options?.id ?? nid(IdPrefix.Edge);
  const extraEdge: EdgeDto = {
    id: edgeId,
    source,
    target,
    label: options?.label ?? "",
    dashed: extraDashed(doc, source, previousOutgoing),
  };
  let extraNodes = doc.after.extraNodes;
  let extraEdges = [...doc.after.extraEdges, extraEdge];
  if (isAfterOnlyNode(doc, source)) {
    extraNodes = maybeExclusiveSplit(extraNodes, extraEdges, source) as StepNodeDto[];
    extraEdges = applyConnectStroke(extraNodes, extraEdges, source, edgeId, previousOutgoing);
  }
  return succeed({
    ...doc,
    after: { ...doc.after, extraNodes, extraEdges },
  });
}

/** After-only Step with default Robot, connected from a visible After Node (BA-06, BA-07, NA-04). */
export function addAfterStep(
  doc: WorkflowDoc,
  sourceVisible: string,
  node: StepNodeDto,
  options?: { edgeId?: string; label?: string },
): CommandResult<WorkflowDoc> {
  const valid = succeed(doc);
  if (!valid.ok) return valid;
  if (!isStepNode(node)) return fail("not-step", MSG.notStep);
  const sourceRes = resolveAfterEndpoint(doc, sourceVisible, "source");
  if (!sourceRes.ok) return sourceRes;
  const source = sourceRes.value;
  const graph = afterGraph(doc);
  if (!graph.nodes.some((n) => n.id === source)) {
    return fail("missing-ref", MSG.missingNode);
  }
  if (graph.nodes.some((n) => n.id === node.id) || findMergeGroup(doc, node.id)) {
    return fail("duplicate-id", `Duplicate id "${node.id}".`);
  }
  const withRobot = ensureDefaultRobot(doc);
  const previousOutgoing = afterGraph(withRobot.doc).edges.filter((e) => e.source === source).length;
  const edgeId = options?.edgeId ?? nid(IdPrefix.Edge);
  const extraEdge: EdgeDto = {
    id: edgeId,
    source,
    target: node.id,
    label: options?.label ?? "",
    dashed: extraDashed(withRobot.doc, source, previousOutgoing),
  };
  let extraNodes = [...withRobot.doc.after.extraNodes, node];
  let extraEdges = [...withRobot.doc.after.extraEdges, extraEdge];
  if (isAfterOnlyNode(withRobot.doc, source) || source === node.id) {
    extraNodes = maybeExclusiveSplit(extraNodes, extraEdges, source) as StepNodeDto[];
    extraEdges = applyConnectStroke(extraNodes, extraEdges, source, edgeId, previousOutgoing);
  }
  return succeed({
    ...withRobot.doc,
    after: {
      ...withRobot.doc.after,
      extraNodes,
      extraEdges,
      assignments: { ...withRobot.doc.after.assignments, [node.id]: withRobot.robotId },
    },
  });
}

function applyAfterPairings(
  nodes: NodeDto[],
  extraEdges: EdgeDto[],
  baseEdges: EdgeDto[],
  pairings: RemovalPairing[],
): EdgeDto[] {
  let next = extraEdges;
  for (const pairing of pairings) {
    const extraHit = next.find(
      (e) => e.source === pairing.predecessorId && e.target === pairing.successorId,
    );
    if (extraHit) {
      next = next.map((e) =>
        e.id === extraHit.id
          ? {
              ...e,
              label: joinConditions(e.label, pairing.condition),
              dashed: collapseStroke(edgeIsDotted(nodes, [...baseEdges, ...next], e), pairing.dashed),
            }
          : e,
      );
      continue;
    }
    if (baseEdges.some((e) => e.source === pairing.predecessorId && e.target === pairing.successorId)) {
      continue;
    }
    next = [
      ...next,
      {
        id: nid(IdPrefix.Edge),
        source: pairing.predecessorId,
        target: pairing.successorId,
        label: pairing.condition,
        dashed: pairing.dashed,
      },
    ];
  }
  return next;
}

function dropAssign(lane: Record<string, string>, nodeId: string): Record<string, string> {
  if (!(nodeId in lane)) return lane;
  const next = { ...lane };
  delete next[nodeId];
  return next;
}

/** BA-07: remove an After-only Step and restitch After-only Paths on the After graph. */
export function planAfterOnlyRemoval(
  doc: WorkflowDoc,
  nodeId: string,
): CommandResult<RemovalPlan> {
  const valid = succeed(doc);
  if (!valid.ok) return valid;
  if (!isAfterOnlyNode(doc, nodeId)) {
    return fail("missing-ref", MSG.missingNode);
  }
  const graph = afterGraph(doc);
  const incoming = incomingSorted(graph.nodes, graph.edges, nodeId);
  const outgoing = outgoingSorted(graph.nodes, graph.edges, nodeId);
  const predCount = uniqueIds(incoming, "source").length;
  const succCount = uniqueIds(outgoing, "target").length;
  const pairings =
    predCount >= 2 && succCount >= 2
      ? nearestPairings(graph.nodes, graph.edges, incoming, outgoing)
      : fanPairings(graph.nodes, graph.edges, incoming, outgoing);
  const extraEdges = applyAfterPairings(
    graph.nodes,
    doc.after.extraEdges.filter((e) => e.source !== nodeId && e.target !== nodeId),
    doc.edges,
    pairings,
  );
  return ok({
    nodeId,
    mode: predCount >= 2 && succCount >= 2 ? "preview" : "auto",
    pairings,
    removedEdgeIds: doc.after.extraEdges
      .filter((e) => e.source === nodeId || e.target === nodeId)
      .map((e) => e.id),
    overlayEffects: {
      after: {
        ...doc.after,
        extraNodes: doc.after.extraNodes.filter((n) => n.id !== nodeId),
        extraEdges,
        assignments: dropAssign(doc.after.assignments, nodeId),
      },
      notices: [],
    },
  });
}

export function applyAfterOnlyRemoval(
  doc: WorkflowDoc,
  plan: RemovalPlan,
  pairings: RemovalPairing[] = plan.pairings,
): CommandResult<WorkflowDoc> {
  const planned = planAfterOnlyRemoval(doc, plan.nodeId);
  if (!planned.ok) return planned;
  const graph = afterGraph(doc);
  const extraEdges = applyAfterPairings(
    graph.nodes,
    doc.after.extraEdges.filter((e) => e.source !== plan.nodeId && e.target !== plan.nodeId),
    doc.edges,
    pairings,
  );
  return succeed({
    ...doc,
    after: {
      ...doc.after,
      extraNodes: doc.after.extraNodes.filter((n) => n.id !== plan.nodeId),
      extraEdges,
      assignments: dropAssign(doc.after.assignments, plan.nodeId),
    },
  });
}

/** MG-10: reject a Before Path that would make an existing group non-convex. */
export function convexityBreakFromConnect(
  doc: WorkflowDoc,
  source: string,
  target: string,
): MergeGroupDto | undefined {
  const trial: EdgeDto[] = [
    ...doc.edges,
    { id: "__trial__", source, target, label: "" },
  ];
  return doc.after.groups.find((g) => !isConvex(g.memberIds, doc.nodes, trial));
}

/** After-only removal candidates live on the After graph (BA-07). */
export function afterAwareRemovalCandidateIds(doc: WorkflowDoc, hostId: string): string[] {
  if (isAfterOnlyNode(doc, hostId)) {
    const graph = afterGraph(doc);
    return removalCandidateIds(graph.nodes, graph.edges, hostId).filter(
      (id) => id === hostId || isAfterOnlyNode(doc, id),
    );
  }
  return removalCandidateIds(doc.nodes, doc.edges, hostId);
}
