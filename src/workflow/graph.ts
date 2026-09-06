/**
 * Path topology: outgoing order and exclusive-split dotted strokes.
 * Framework-free; consumed by Board Paths, the +/- pad, and store.ts when linking.
 */
import { SplitKind, WorkflowNodeKind } from "./catalogs";
import type { EdgeDto, NodeDto } from "./types";

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
