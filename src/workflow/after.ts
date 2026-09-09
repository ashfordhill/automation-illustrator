/**
 * After-only Steps and Paths (BA-06, BA-07, NA-04).
 * Merge groups are unfolded on load and are not created at runtime.
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
  maybeExclusiveSplit,
  outgoingSorted,
  removalCandidateIds,
  splitDefaultDashed,
  wouldCreateCycle,
} from "./graph";
import { nid } from "./ids";
import { findNode, isAfterOnlyNode } from "./selectors";
import {
  isStepNode,
  type EdgeDto,
  type NodeDto,
  type PositionMap,
  type StepNodeDto,
  type WorkflowDoc,
} from "./types";

function extraDashed(doc: WorkflowDoc, sourceId: string, previousOutgoing: number): boolean {
  const src = findNode(doc, sourceId);
  const split = src && isStepNode(src) ? src.split : undefined;
  return splitDefaultDashed(split ?? SplitKind.Exclusive, previousOutgoing + 1);
}

function resolveAfterEndpoint(doc: WorkflowDoc, visibleId: string): CommandResult<string> {
  if (findNode(doc, visibleId)) return ok(visibleId);
  return fail("missing-ref", MSG.missingNode);
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
  const sourceRes = resolveAfterEndpoint(doc, sourceVisible);
  if (!sourceRes.ok) return sourceRes;
  const targetRes = resolveAfterEndpoint(doc, targetVisible);
  if (!targetRes.ok) return targetRes;
  const source = sourceRes.value;
  const target = targetRes.value;
  if (source === target) return fail("self-loop", MSG.selfLoop);

  const graph = afterGraph(doc);
  const ids = new Set(graph.nodes.map((n) => n.id));
  if (!ids.has(source) || !ids.has(target)) {
    return fail("missing-ref", MSG.missingNode);
  }
  if (graph.edges.some((e) => e.source === source && e.target === target)) {
    return fail("duplicate-path", MSG.duplicatePath);
  }
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

/** After-only Step with default Robot, connected from (or into) a visible After Node (BA-06, BA-07, NA-04). */
export function addAfterStep(
  doc: WorkflowDoc,
  sourceVisible: string,
  node: StepNodeDto,
  options?: { edgeId?: string; label?: string; inbound?: boolean },
): CommandResult<WorkflowDoc> {
  const valid = succeed(doc);
  if (!valid.ok) return valid;
  if (!isStepNode(node)) return fail("not-step", MSG.notStep);
  const sourceRes = resolveAfterEndpoint(doc, sourceVisible);
  if (!sourceRes.ok) return sourceRes;
  const source = sourceRes.value;
  const graph = afterGraph(doc);
  if (!graph.nodes.some((n) => n.id === source)) {
    return fail("missing-ref", MSG.missingNode);
  }
  if (graph.nodes.some((n) => n.id === node.id)) {
    return fail("duplicate-id", `Duplicate id "${node.id}".`);
  }
  const withRobot = ensureDefaultRobot(doc);
  const pathSource = options?.inbound ? node.id : source;
  const pathTarget = options?.inbound ? source : node.id;
  const previousOutgoing = afterGraph(withRobot.doc).edges.filter((e) => e.source === pathSource).length;
  const edgeId = options?.edgeId ?? nid(IdPrefix.Edge);
  const extraEdge: EdgeDto = {
    id: edgeId,
    source: pathSource,
    target: pathTarget,
    label: options?.label ?? "",
    dashed: extraDashed(withRobot.doc, pathSource, previousOutgoing),
  };
  let extraNodes = [...withRobot.doc.after.extraNodes, node];
  let extraEdges = [...withRobot.doc.after.extraEdges, extraEdge];
  if (isAfterOnlyNode(withRobot.doc, pathSource) || pathSource === node.id) {
    extraNodes = maybeExclusiveSplit(extraNodes, extraEdges, pathSource) as StepNodeDto[];
    extraEdges = applyConnectStroke(extraNodes, extraEdges, pathSource, edgeId, previousOutgoing);
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
  positions?: PositionMap,
): CommandResult<RemovalPlan> {
  const valid = succeed(doc);
  if (!valid.ok) return valid;
  if (!isAfterOnlyNode(doc, nodeId)) {
    return fail("missing-ref", MSG.missingNode);
  }
  const graph = afterGraph(doc);
  const incoming = incomingSorted(graph.nodes, graph.edges, nodeId, positions);
  const outgoing = outgoingSorted(graph.nodes, graph.edges, nodeId, positions);
  const predCount = uniqueIds(incoming, "source").length;
  const succCount = uniqueIds(outgoing, "target").length;
  const pairings =
    predCount >= 2 && succCount >= 2
      ? nearestPairings(graph.nodes, graph.edges, incoming, outgoing, positions)
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
  positions?: PositionMap,
): CommandResult<WorkflowDoc> {
  const planned = planAfterOnlyRemoval(doc, plan.nodeId, positions);
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

/** After-only removal candidates live on the After graph (BA-07). */
export function afterAwareRemovalCandidateIds(
  doc: WorkflowDoc,
  hostId: string,
  positions?: PositionMap,
): string[] {
  if (isAfterOnlyNode(doc, hostId)) {
    const graph = afterGraph(doc);
    return removalCandidateIds(graph.nodes, graph.edges, hostId, positions).filter(
      (id) => id === hostId || isAfterOnlyNode(doc, id),
    );
  }
  return removalCandidateIds(doc.nodes, doc.edges, hostId, positions);
}
