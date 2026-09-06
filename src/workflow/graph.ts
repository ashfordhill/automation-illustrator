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

/** Outgoing Paths of a tile, top-to-bottom (then left-to-right). */
export function outgoingSorted(nodes: NodeDto[], edges: EdgeDto[], sourceId: string) {
  return edges
    .filter((e) => e.source === sourceId)
    .slice()
    .sort((a, b) => {
      const na = nodeOf(nodes, a.target);
      const nb = nodeOf(nodes, b.target);
      const ya = na?.position.y ?? 0;
      const yb = nb?.position.y ?? 0;
      if (ya !== yb) return ya - yb;
      return (na?.position.x ?? 0) - (nb?.position.x ?? 0);
    });
}

/**
 * Stroke for one Path. An explicit `dashed` flag wins; otherwise exclusive
 * splits draw the first outgoing Path solid and the rest dotted.
 */
export function edgeIsDotted(
  nodes: NodeDto[],
  edges: EdgeDto[],
  edge: EdgeDto,
): boolean {
  if (edge.dashed === true) return true;
  if (edge.dashed === false) return false;
  const src = nodeOf(nodes, edge.source);
  if (!src || src.type !== WorkflowNodeKind.Step) return false;
  if (src.split === SplitKind.Parallel) return false;
  const outs = outgoingSorted(nodes, edges, edge.source);
  if (outs.length < 2) return false;
  return outs.findIndex((e) => e.id === edge.id) > 0;
}

/** Extra outgoing Paths start dotted so a new branch reads as a split. */
export function defaultDashed(edges: EdgeDto[], sourceId: string) {
  return edges.some((e) => e.source === sourceId);
}

/** Exclusive: first solid, rest dotted. Parallel: every Path solid. */
export function applyDashForSplit(
  nodes: NodeDto[],
  edges: EdgeDto[],
  sourceId: string,
): EdgeDto[] {
  const src = nodeOf(nodes, sourceId);
  if (!src || src.type !== WorkflowNodeKind.Step) return edges;
  const outs = outgoingSorted(nodes, edges, sourceId);
  return edges.map((e) => {
    if (e.source !== sourceId) return e;
    if (src.split === SplitKind.Parallel) return { ...e, dashed: false };
    const i = outs.findIndex((o) => o.id === e.id);
    return { ...e, dashed: i > 0 };
  });
}

/** Next stacked port index when adding another outgoing Path from a tile. */
export function nextPortIndex(edges: EdgeDto[], sourceId: string) {
  return edges.filter((e) => e.source === sourceId).length;
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
