/**
 * Path topology: outgoing order, exclusive-split dotted arrows, and label clearance.
 * Consumed by Board arrows (FlowArrow), the +/- pad, and store.ts when linking.
 */
import { SplitKind, WorkflowNodeKind } from "../model/catalogs";
import type { EdgeDto, NodeDto } from "../model/types";
import { gapForLabel, nodeSize } from "./tileMetrics";

/** Look up a tile by id — used when sorting outgoing paths by target position. */
function nodeOf(nodes: NodeDto[], id: string) {
  return nodes.find((n) => n.id === id);
}

/** Outgoing edges of a tile, top-to-bottom (then left-to-right). */
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
 * Stroke for one path. An explicit `dashed` flag wins; otherwise exclusive
 * splits draw the first outgoing path solid and the rest dotted.
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

/** Extra outgoing paths start dotted so a new branch reads as a split. */
export function defaultDashed(edges: EdgeDto[], sourceId: string) {
  return edges.some((e) => e.source === sourceId);
}

/** Exclusive: first solid, rest dotted. Parallel: every path solid. */
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

/** Next stacked port index when adding another outgoing path from a tile. */
export function nextPortIndex(edges: EdgeDto[], sourceId: string) {
  return edges.filter((e) => e.source === sourceId).length;
}

/** Mark a step Exclusive once it has two or more outgoing paths (unless already Parallel). */
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

/**
 * Push targets (and everything at/right of them) so long edge labels fit in the gap.
 * Runs inside store.commit so typed labels like `invoice > $50,000` do not sit under tiles.
 */
export function spreadForLabels(nodes: NodeDto[], edges: EdgeDto[]): NodeDto[] {
  const labeled = edges
    .filter((e) => e.label.trim())
    .slice()
    .sort((a, b) => {
      const na = nodeOf(nodes, a.source);
      const nb = nodeOf(nodes, b.source);
      return (na?.position.x ?? 0) - (nb?.position.x ?? 0);
    });
  if (!labeled.length) return nodes;

  let next = nodes;
  let changed = false;
  for (const e of labeled) {
    const src = nodeOf(next, e.source);
    const tgt = nodeOf(next, e.target);
    if (!src || !tgt) continue;
    const srcW = nodeSize(src.type).w;
    const need = gapForLabel(e.label);
    const gap = tgt.position.x - (src.position.x + srcW);
    if (gap >= need) continue;
    const delta = need - gap;
    const threshold = tgt.position.x;
    next = next.map((n) =>
      n.id !== src.id && n.position.x >= threshold
        ? { ...n, position: { ...n.position, x: n.position.x + delta } }
        : n,
    );
    changed = true;
  }
  return changed ? next : nodes;
}
