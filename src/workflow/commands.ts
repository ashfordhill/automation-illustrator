/**
 * Pure structural commands. Store commits only after a successful result
 * that still passes validateWorkflow (WG-02..WG-04).
 */
import { IdPrefix, WorkflowNodeKind } from "./catalogs";
import {
  applyConnectStroke,
  edgeIsDotted,
  incomingSorted,
  maybeExclusiveSplit,
  outgoingSorted,
  positionOf,
  retargetIncoming,
  validateWorkflow,
  wouldCreateCycle,
} from "./graph";
import { nid } from "./ids";
import { findNode } from "./selectors";
import {
  emptyAfterOverlay,
  isDataFieldNode,
  isStepNode,
  type AfterOverlay,
  type Assignments,
  type EdgeDto,
  type NodeDto,
  type PositionMap,
  type StepNodeDto,
  type WorkflowDoc,
} from "./types";

export type CommandResult<T> =
  | { ok: true; value: T }
  | { ok: false; code: string; message: string };

export type RemovalPairing = {
  predecessorId: string;
  successorId: string;
  condition: string;
  dashed: boolean;
};

/** Overlay after a base Node is removed (BA-09). */
export type OverlayEffects = {
  after: AfterOverlay;
  notices: string[];
};

export type RemovalPlan = {
  nodeId: string;
  mode: "auto" | "preview";
  pairings: RemovalPairing[];
  removedEdgeIds: string[];
  overlayEffects: OverlayEffects;
};

export const MSG = {
  cycle: "That Path would create a cycle.",
  duplicatePath: "That Path already exists.",
  selfLoop: "A Path cannot start and end on the same Node.",
  boardSplit: "Removing this Tile would split the board into separate workflows.",
  pathRemoval: "Removing this Path would split the board into separate workflows.",
  manyToMany:
    "This Node has multiple incoming and outgoing Paths. Confirm pairings before removing it.",
  notEmpty: "A Tile is already on the board. New Nodes must connect from an existing Node.",
  notStep: "After-only Nodes must be Steps.",
  rootKind: "The first Node on a board must be a Step or Data.",
  missingNode: "That Node is not on the board.",
  invalidPairings: "Every successor needs at least one incoming Path after removal.",
  insertSelf: "Drop the Node onto a Path that does not already touch it.",
  insertHostGone: "That Path is gone after reconnecting the Node’s old neighborhood.",
  missingPath: "That Path is not on the board.",
} as const;

/** Spawn direction: out = child to the right; in = predecessor to the left. */
export type BranchSide = "out" | "in";

export function fail<T>(code: string, message: string): CommandResult<T> {
  return { ok: false, code, message };
}

export function ok<T>(value: T): CommandResult<T> {
  return { ok: true, value };
}

function requireValid(doc: WorkflowDoc): CommandResult<WorkflowDoc> {
  const violations = validateWorkflow(doc);
  if (violations.length) {
    return fail("invalid-document", violations[0]!.message);
  }
  return ok(doc);
}

export function succeed(doc: WorkflowDoc): CommandResult<WorkflowDoc> {
  const violations = validateWorkflow(doc);
  if (violations.length) {
    return fail("invalid-document", violations[0]!.message);
  }
  return ok(doc);
}

export function uniqueIds(edges: EdgeDto[], key: "source" | "target"): string[] {
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const e of edges) {
    const id = e[key];
    if (seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

function dropAssign(lane: Assignments, nodeId: string): Assignments {
  if (!(nodeId in lane)) return lane;
  const next = { ...lane };
  delete next[nodeId];
  return next;
}

function pairingKey(predecessorId: string, successorId: string) {
  return `${predecessorId}\0${successorId}`;
}

function compareVisual(
  a: { dy: number; dx: number; id: string },
  b: { dy: number; dx: number; id: string },
) {
  if (a.dy !== b.dy) return a.dy - b.dy;
  if (a.dx !== b.dx) return a.dx - b.dx;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/** WG-12: trimmed nonempty conditions, traversal order, joined with ` + `. */
export function joinConditions(...labels: string[]): string {
  return labels
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .join(" + ");
}

/** PC-04: collapsed Path is dotted if any replaced Path was dotted. */
export function collapseStroke(...dotted: boolean[]): boolean {
  return dotted.some(Boolean);
}

/**
 * BA-09: restitch After-only Paths on the After graph with the same
 * fan/nearest rules so After-only Steps stay reachable.
 */
export function pruneAfterOverlay(
  after: AfterOverlay,
  removedNodeId: string,
  _remainingNodes: NodeDto[],
  _remainingEdges: EdgeDto[],
  original?: { nodes: NodeDto[]; edges: EdgeDto[] },
  positions?: PositionMap,
): OverlayEffects {
  const extraIds = new Set(after.extraNodes.map((n) => n.id));
  let extraEdges = after.extraEdges.filter(
    (e) => e.source !== removedNodeId && e.target !== removedNodeId,
  );

  if (original) {
    const afterNodes = [...original.nodes, ...after.extraNodes];
    const afterEdges = [...original.edges, ...after.extraEdges];
    const incoming = incomingSorted(afterNodes, afterEdges, removedNodeId, positions);
    const outgoing = outgoingSorted(afterNodes, afterEdges, removedNodeId, positions);
    const predCount = uniqueIds(incoming, "source").length;
    const succCount = uniqueIds(outgoing, "target").length;
    const pairings =
      predCount >= 2 && succCount >= 2
        ? nearestPairings(afterNodes, afterEdges, incoming, outgoing, positions)
        : fanPairings(afterNodes, afterEdges, incoming, outgoing);
    const extraPairings = pairings.filter(
      (p) => extraIds.has(p.predecessorId) || extraIds.has(p.successorId),
    );
    extraEdges = applyPairings(afterNodes, extraEdges, extraPairings);
  }

  return {
    after: {
      extraNodes: after.extraNodes,
      extraEdges,
      groups: [],
      assignments: dropAssign(after.assignments, removedNodeId),
    },
    notices: [],
  };
}

function collapsedPairing(
  nodes: NodeDto[],
  edges: EdgeDto[],
  incoming: EdgeDto,
  outgoing: EdgeDto,
): RemovalPairing {
  return {
    predecessorId: incoming.source,
    successorId: outgoing.target,
    condition: joinConditions(incoming.label, outgoing.label),
    dashed: collapseStroke(
      edgeIsDotted(nodes, edges, incoming),
      edgeIsDotted(nodes, edges, outgoing),
    ),
  };
}

/** Incident Paths and unique neighbor ids on any Node/Path lists (base or After graph). */
export function neighborhoodOf(
  nodes: NodeDto[],
  edges: EdgeDto[],
  nodeId: string,
  positions?: PositionMap,
) {
  const incoming = incomingSorted(nodes, edges, nodeId, positions);
  const outgoing = outgoingSorted(nodes, edges, nodeId, positions);
  return {
    incoming,
    outgoing,
    predecessorIds: uniqueIds(incoming, "source"),
    successorIds: uniqueIds(outgoing, "target"),
  };
}

/** Incident Paths and unique neighbor ids for a Node (WG-10 / WG-11). */
export function removalNeighborhood(doc: WorkflowDoc, nodeId: string, positions?: PositionMap) {
  return neighborhoodOf(doc.nodes, doc.edges, nodeId, positions);
}

/**
 * Tile to keep selected after a remove: parent first (incoming order), else a remaining
 * successor so a source delete does not clear the board, else none (empty board).
 */
export function nextTileAfterRemoval(
  remaining: WorkflowDoc,
  predecessorIds: string[],
  successorIds: string[],
): string | null {
  const alive = (id: string) => Boolean(findNode(remaining, id));
  return predecessorIds.find(alive) ?? successorIds.find(alive) ?? null;
}

/** WG-12 / PC-04 pairing for one predecessor → successor through a removed Node. */
export function pairingBetween(
  doc: WorkflowDoc,
  removedId: string,
  predecessorId: string,
  successorId: string,
  positions?: PositionMap,
): RemovalPairing | null {
  const incoming = incomingSorted(doc.nodes, doc.edges, removedId, positions).find(
    (e) => e.source === predecessorId,
  );
  const outgoing = outgoingSorted(doc.nodes, doc.edges, removedId, positions).find(
    (e) => e.target === successorId,
  );
  if (!incoming || !outgoing) return null;
  return collapsedPairing(doc.nodes, doc.edges, incoming, outgoing);
}

/** WG-11 nearest predecessor per successor, by displayed position when a map is given. */
export function nearestPairings(
  nodes: NodeDto[],
  edges: EdgeDto[],
  incoming: EdgeDto[],
  outgoing: EdgeDto[],
  positions?: PositionMap,
): RemovalPairing[] {
  const pairings: RemovalPairing[] = [];
  for (const out of outgoing) {
    const succ = positionOf(nodes, out.target, positions);
    let best: EdgeDto | undefined;
    let bestKey: { dy: number; dx: number; id: string } | undefined;
    for (const inn of incoming) {
      const pred = positionOf(nodes, inn.source, positions);
      const dy = Math.abs((pred?.y ?? 0) - (succ?.y ?? 0));
      const dx = Math.abs((pred?.x ?? 0) - (succ?.x ?? 0));
      const key = { dy, dx, id: inn.source };
      if (!bestKey || compareVisual(key, bestKey) < 0) {
        best = inn;
        bestKey = key;
      }
    }
    if (best) pairings.push(collapsedPairing(nodes, edges, best, out));
  }
  return pairings;
}

export function fanPairings(
  nodes: NodeDto[],
  edges: EdgeDto[],
  incoming: EdgeDto[],
  outgoing: EdgeDto[],
): RemovalPairing[] {
  const pairings: RemovalPairing[] = [];
  for (const inn of incoming) {
    for (const out of outgoing) {
      pairings.push(collapsedPairing(nodes, edges, inn, out));
    }
  }
  return pairings;
}

export function validatePairings(
  pairings: RemovalPairing[],
  predecessorIds: string[],
  successorIds: string[],
): CommandResult<true> {
  const preds = new Set(predecessorIds);
  const succs = new Set(successorIds);
  const seen = new Set<string>();
  const covered = new Set<string>();
  for (const p of pairings) {
    if (!preds.has(p.predecessorId) || !succs.has(p.successorId)) {
      return fail("invalid-pairings", MSG.invalidPairings);
    }
    const key = pairingKey(p.predecessorId, p.successorId);
    if (seen.has(key)) {
      return fail("invalid-pairings", MSG.invalidPairings);
    }
    seen.add(key);
    covered.add(p.successorId);
  }
  if (successorIds.some((id) => !covered.has(id))) {
    return fail("invalid-pairings", MSG.invalidPairings);
  }
  return ok(true);
}

/** WG-01 / WG-02: the first Step or Data on an empty board. */
export function createRootNode(
  doc: WorkflowDoc,
  node: NodeDto,
  who?: { beforeId?: string; afterId?: string },
): CommandResult<WorkflowDoc> {
  const valid = requireValid(doc);
  if (!valid.ok) return valid;
  if (doc.nodes.length) return fail("not-empty", MSG.notEmpty);
  if (!isStepNode(node) && !isDataFieldNode(node)) return fail("not-step", MSG.rootKind);
  const assignments = { ...doc.assignments };
  const afterAssignments = { ...doc.after.assignments };
  if (isStepNode(node)) {
    if (who?.beforeId) assignments[node.id] = who.beforeId;
    if (who?.afterId) afterAssignments[node.id] = who.afterId;
  }
  return succeed({
    ...doc,
    nodes: [node],
    edges: [],
    assignments,
    after: { ...doc.after, assignments: afterAssignments },
  });
}

/** WG-01 / WG-02: the first Step on an empty board is the sole root. */
export function createRootStep(
  doc: WorkflowDoc,
  node: StepNodeDto,
  who?: { beforeId?: string; afterId?: string },
): CommandResult<WorkflowDoc> {
  if (!isStepNode(node)) return fail("not-step", MSG.notStep);
  return createRootNode(doc, node, who);
}

/** WG-04: connect two existing Nodes, or reject before mutation. */
export function connectNodes(
  doc: WorkflowDoc,
  source: string,
  target: string,
  options?: { id?: string; label?: string },
): CommandResult<WorkflowDoc> {
  const valid = requireValid(doc);
  if (!valid.ok) return valid;
  if (source === target) return fail("self-loop", MSG.selfLoop);
  const ids = new Set(doc.nodes.map((n) => n.id));
  if (!ids.has(source) || !ids.has(target)) {
    return fail("missing-ref", MSG.missingNode);
  }
  if (doc.edges.some((e) => e.source === source && e.target === target)) {
    return fail("duplicate-path", MSG.duplicatePath);
  }
  if (wouldCreateCycle(doc.edges, source, target)) {
    return fail("cycle", MSG.cycle);
  }
  const previousOutgoing = doc.edges.filter((e) => e.source === source).length;
  const edgeId = options?.id ?? nid(IdPrefix.Edge);
  const rawEdges: EdgeDto[] = [
    ...doc.edges,
    {
      id: edgeId,
      source,
      target,
      label: options?.label ?? "",
      dashed: false,
    },
  ];
  const nodes = maybeExclusiveSplit(doc.nodes, rawEdges, source);
  const edges = applyConnectStroke(nodes, rawEdges, source, edgeId, previousOutgoing);
  return succeed({ ...doc, nodes, edges });
}

/**
 * Drop a Path when the remaining graph stays a connected DAG (WG-03).
 * Base Paths and After-only Paths both go through validateWorkflow.
 */
export function removePath(doc: WorkflowDoc, edgeId: string): CommandResult<WorkflowDoc> {
  const valid = requireValid(doc);
  if (!valid.ok) return valid;
  const inBase = doc.edges.some((e) => e.id === edgeId);
  const inExtra = doc.after.extraEdges.some((e) => e.id === edgeId);
  if (!inBase && !inExtra) return fail("missing-path", MSG.missingPath);
  const next: WorkflowDoc = inBase
    ? { ...doc, edges: doc.edges.filter((e) => e.id !== edgeId) }
    : {
        ...doc,
        after: {
          ...doc.after,
          extraEdges: doc.after.extraEdges.filter((e) => e.id !== edgeId),
        },
      };
  const checked = succeed(next);
  if (!checked.ok) return fail("path-keeps-reachability", MSG.pathRemoval);
  return checked;
}

export function canRemovePath(doc: WorkflowDoc, edgeId: string): boolean {
  return removePath(doc, edgeId).ok;
}

/**
 * Add a connected Node and its Path in one validated step (create + connect).
 * Outbound (`inbound` omitted): extra child Path `source → new` (a fork when
 * `source` already has outgoing Paths). Inbound: insert a parent — retarget
 * every Path into `sourceId` onto the new Tile, then add `new → source`.
 */
export function addConnectedNode(
  doc: WorkflowDoc,
  sourceId: string,
  node: NodeDto,
  options?: {
    edgeId?: string;
    label?: string;
    beforeId?: string;
    afterId?: string;
    inbound?: boolean;
  },
): CommandResult<WorkflowDoc> {
  const valid = requireValid(doc);
  if (!valid.ok) return valid;
  if (!doc.nodes.some((n) => n.id === sourceId)) {
    return fail("missing-ref", MSG.missingNode);
  }
  if (doc.nodes.some((n) => n.id === node.id)) {
    return fail("duplicate-id", `Duplicate id "${node.id}".`);
  }
  const inbound = Boolean(options?.inbound);
  const pathSource = inbound ? node.id : sourceId;
  const pathTarget = inbound ? sourceId : node.id;
  const previousOutgoing = doc.edges.filter((e) => e.source === pathSource).length;
  const edgeId = options?.edgeId ?? nid(IdPrefix.Edge);
  const nodes = [...doc.nodes, node];
  const existing = inbound ? retargetIncoming(doc.edges, sourceId, node.id) : doc.edges;
  const rawEdges: EdgeDto[] = [
    ...existing,
    {
      id: edgeId,
      source: pathSource,
      target: pathTarget,
      label: options?.label ?? "",
      dashed: false,
    },
  ];
  const splitNodes = maybeExclusiveSplit(nodes, rawEdges, pathSource);
  const edges = applyConnectStroke(splitNodes, rawEdges, pathSource, edgeId, previousOutgoing);
  let assignments = doc.assignments;
  let afterAssignments = doc.after.assignments;
  if (node.type === WorkflowNodeKind.Step) {
    if (options?.beforeId) assignments = { ...assignments, [node.id]: options.beforeId };
    if (options?.afterId) {
      afterAssignments = { ...afterAssignments, [node.id]: options.afterId };
    }
  }
  return succeed({
    ...doc,
    nodes: splitNodes,
    edges,
    assignments,
    after: { ...doc.after, assignments: afterAssignments },
  });
}

function planFromNeighborhood(
  doc: WorkflowDoc,
  nodeId: string,
  incoming: EdgeDto[],
  outgoing: EdgeDto[],
  pairings: RemovalPairing[],
  mode: RemovalPlan["mode"],
  positions?: PositionMap,
): CommandResult<RemovalPlan> {
  if (outgoing.length && incoming.length) {
    const checked = validatePairings(
      pairings,
      uniqueIds(incoming, "source"),
      uniqueIds(outgoing, "target"),
    );
    if (!checked.ok) return checked;
  } else if (pairings.length && !incoming.length) {
    return fail("invalid-pairings", MSG.invalidPairings);
  }
  const remainingNodes = doc.nodes.filter((n) => n.id !== nodeId);
  const remainingEdges = applyPairings(
    doc.nodes,
    doc.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
    pairings,
  );
  const overlayEffects = pruneAfterOverlay(
    doc.after,
    nodeId,
    remainingNodes,
    remainingEdges,
    { nodes: doc.nodes, edges: doc.edges },
    positions,
  );
  return ok({
    nodeId,
    mode,
    pairings,
    removedEdgeIds: doc.edges.filter((e) => e.source === nodeId || e.target === nodeId).map((e) => e.id),
    overlayEffects,
  });
}

/** WG-10 / WG-11: auto fan for 1:1, 1:N, N:1; preview nearest pairings for M:N. */
export function planNodeRemoval(
  doc: WorkflowDoc,
  nodeId: string,
  positions?: PositionMap,
): CommandResult<RemovalPlan> {
  const valid = requireValid(doc);
  if (!valid.ok) return valid;
  if (!doc.nodes.some((n) => n.id === nodeId)) {
    return fail("missing-ref", MSG.missingNode);
  }
  const incoming = incomingSorted(doc.nodes, doc.edges, nodeId, positions);
  const outgoing = outgoingSorted(doc.nodes, doc.edges, nodeId, positions);
  const predCount = uniqueIds(incoming, "source").length;
  const succCount = uniqueIds(outgoing, "target").length;
  if (predCount >= 2 && succCount >= 2) {
    return planFromNeighborhood(
      doc,
      nodeId,
      incoming,
      outgoing,
      nearestPairings(doc.nodes, doc.edges, incoming, outgoing, positions),
      "preview",
      positions,
    );
  }
  return planFromNeighborhood(
    doc,
    nodeId,
    incoming,
    outgoing,
    fanPairings(doc.nodes, doc.edges, incoming, outgoing),
    "auto",
    positions,
  );
}

function applyPairings(
  nodes: NodeDto[],
  edges: EdgeDto[],
  pairings: RemovalPairing[],
): EdgeDto[] {
  let next = edges;
  for (const pairing of pairings) {
    const existing = next.find(
      (e) => e.source === pairing.predecessorId && e.target === pairing.successorId,
    );
    if (existing) {
      next = next.map((e) =>
        e.id === existing.id
          ? {
              ...e,
              label: joinConditions(e.label, pairing.condition),
              dashed: collapseStroke(
                edgeIsDotted(nodes, next, e),
                pairing.dashed,
              ),
            }
          : e,
      );
    } else {
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
  }
  return next;
}

/** Apply a RemovalPlan atomically (WG-11 confirmation; auto plans included). */
export function applyNodeRemoval(
  doc: WorkflowDoc,
  plan: RemovalPlan,
  pairings: RemovalPairing[] = plan.pairings,
  positions?: PositionMap,
): CommandResult<WorkflowDoc> {
  const valid = requireValid(doc);
  if (!valid.ok) return valid;
  if (!doc.nodes.some((n) => n.id === plan.nodeId)) {
    return fail("missing-ref", MSG.missingNode);
  }
  const incoming = incomingSorted(doc.nodes, doc.edges, plan.nodeId, positions);
  const outgoing = outgoingSorted(doc.nodes, doc.edges, plan.nodeId, positions);
  if (outgoing.length && incoming.length) {
    const checked = validatePairings(
      pairings,
      uniqueIds(incoming, "source"),
      uniqueIds(outgoing, "target"),
    );
    if (!checked.ok) return checked;
  } else if (pairings.length) {
    return fail("invalid-pairings", MSG.invalidPairings);
  }

  const remainingNodes = doc.nodes.filter((n) => n.id !== plan.nodeId);
  const withoutIncident = doc.edges.filter(
    (e) => e.source !== plan.nodeId && e.target !== plan.nodeId,
  );
  const remainingEdges = applyPairings(doc.nodes, withoutIncident, pairings);
  const overlayEffects = pruneAfterOverlay(
    doc.after,
    plan.nodeId,
    remainingNodes,
    remainingEdges,
    { nodes: doc.nodes, edges: doc.edges },
    positions,
  );
  const next: WorkflowDoc = {
    ...doc,
    nodes: remainingNodes,
    edges: remainingEdges,
    assignments: dropAssign(doc.assignments, plan.nodeId),
    after: remainingNodes.length === 0 ? emptyAfterOverlay() : overlayEffects.after,
  };
  const checked = succeed(next);
  if (!checked.ok) {
    const split = validateWorkflow(next).some((v) => v.code === "disconnected");
    if (split) return fail("board-split", MSG.boardSplit);
    return checked;
  }
  return checked;
}

/**
 * Relocate an existing Node onto Path S→U: restitch the old neighborhood
 * (WG-10..12, nearest pairings if M:N) then connect S→T and T→U in one step.
 * The original condition stays on S→T (closer to the Path’s source).
 */
export function insertNodeOnPath(
  doc: WorkflowDoc,
  nodeId: string,
  edgeId: string,
  positions?: PositionMap,
): CommandResult<WorkflowDoc> {
  const valid = requireValid(doc);
  if (!valid.ok) return valid;
  const host = doc.edges.find((e) => e.id === edgeId);
  if (!host) return fail("missing-ref", MSG.missingPath);
  if (nodeId === host.source || nodeId === host.target) {
    return fail("insert-self", MSG.insertSelf);
  }
  if (!doc.nodes.some((n) => n.id === nodeId)) {
    return fail("missing-ref", MSG.missingNode);
  }

  const planned = planNodeRemoval(doc, nodeId, positions);
  if (!planned.ok) return planned;

  const withoutIncident = doc.edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
  const restitched = applyPairings(doc.nodes, withoutIncident, planned.value.pairings);
  const liveHost = restitched.find((e) => e.id === edgeId);
  if (!liveHost) return fail("insert-host-gone", MSG.insertHostGone);

  const rest = restitched.filter((e) => e.id !== edgeId);
  const inId = nid(IdPrefix.Edge);
  const outId = nid(IdPrefix.Edge);
  const previousOutgoing = rest.filter((e) => e.source === liveHost.source).length;
  const rawEdges: EdgeDto[] = [
    ...rest,
    {
      id: inId,
      source: liveHost.source,
      target: nodeId,
      label: liveHost.label,
      dashed: liveHost.dashed,
    },
    {
      id: outId,
      source: nodeId,
      target: liveHost.target,
      label: "",
      dashed: false,
    },
  ];
  if (
    wouldCreateCycle(rest, liveHost.source, nodeId) ||
    wouldCreateCycle(
      [...rest, { id: inId, source: liveHost.source, target: nodeId, label: "" }],
      nodeId,
      liveHost.target,
    )
  ) {
    return fail("cycle", MSG.cycle);
  }
  let nodes = maybeExclusiveSplit(doc.nodes, rawEdges, liveHost.source);
  nodes = maybeExclusiveSplit(nodes, rawEdges, nodeId);
  let edges = applyConnectStroke(nodes, rawEdges, liveHost.source, inId, previousOutgoing);
  edges = applyConnectStroke(nodes, edges, nodeId, outId, 0);
  return succeed({ ...doc, nodes, edges });
}
