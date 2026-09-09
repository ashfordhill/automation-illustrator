/**
 * Build the ELK input graph for one lane projection (Improvement 01 / 36).
 * First layout uses projection array order. When a previous derived layout is
 * supplied, Nodes and Paths are ordered by those y values so forks keep their rows.
 */
import type { ElkExtendedEdge, ElkNode } from "elkjs/lib/elk-api";
import type { LaneProjection } from "../../state/projection";
import { WorkflowNodeKind } from "../../workflow/catalogs";
import type { Point, PositionMap } from "../../workflow/types";
import type { LabelBox } from "./labelBox";
import { BRANCH_GAP, GRID, TILE_GAP, nodeSize } from "./tileMetrics";

export type TileSizes = Record<string, { w: number; h: number }>;

/** Layered, left-to-right, orthogonal, hyperedges bundled at shared ports. */
export const ROOT_OPTIONS: Record<string, string> = {
  "elk.algorithm": "layered",
  "elk.direction": "RIGHT",
  "elk.edgeRouting": "ORTHOGONAL",
  "elk.padding": `[top=${GRID},left=${GRID},bottom=${GRID},right=${GRID}]`,
  "elk.spacing.nodeNode": String(BRANCH_GAP),
  "elk.layered.spacing.nodeNodeBetweenLayers": String(TILE_GAP),
  "elk.layered.spacing.edgeNodeBetweenLayers": "32",
  "elk.layered.spacing.edgeEdgeBetweenLayers": "16",
  "elk.spacing.edgeNode": "16",
  "elk.spacing.edgeEdge": "16",
  "elk.spacing.edgeLabel": "8",
  "elk.edgeLabels.placement": "CENTER",
  "elk.layered.layering.strategy": "NETWORK_SIMPLEX",
  "elk.layered.nodePlacement.strategy": "BRANDES_KOEPF",
  /* BALANCED centers a fan-out parent on its children and keeps 1:1 chains straight
     (the default alignment sat the parent level with its first child). */
  "elk.layered.nodePlacement.bk.fixedAlignment": "BALANCED",
  "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
  "elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES",
  "elk.layered.thoroughness": "10",
  "elk.layered.mergeEdges": "true",
  "elk.separateConnectedComponents": "false",
  "elk.layered.wrapping.strategy": "OFF",
  "elk.aspectRatio": "1.6",
};

/**
 * After the first layout: keep source-rank columns and the y-order we just
 * seeded from displayed positions (Improvement 36).
 */
export const STABILITY_OPTIONS: Record<string, string> = {
  "elk.layered.layering.strategy": "LONGEST_PATH_SOURCE",
  "elk.layered.crossingMinimization.forceNodeModelOrder": "true",
};

export const NODE_OPTIONS: Record<string, string> = {
  "elk.portConstraints": "FIXED_POS",
};

export const PORT_OPTIONS_IN: Record<string, string> = { "elk.port.side": "WEST" };
export const PORT_OPTIONS_OUT: Record<string, string> = { "elk.port.side": "EAST" };

/** ELK honors `inline` only on the label element itself, not on the root. */
export const LABEL_OPTIONS: Record<string, string> = {
  "elk.edgeLabels.inline": "true",
};

/** Every option id this module sends, for the knownLayoutOptions unit check. */
export function usedOptionIds(): string[] {
  return [
    ...Object.keys(ROOT_OPTIONS),
    ...Object.keys(STABILITY_OPTIONS),
    ...Object.keys(NODE_OPTIONS),
    ...Object.keys(PORT_OPTIONS_IN),
    ...Object.keys(PORT_OPTIONS_OUT),
    ...Object.keys(LABEL_OPTIONS),
  ];
}

export function inPortId(nodeId: string): string {
  return `${nodeId}__in`;
}

export function outPortId(nodeId: string): string {
  return `${nodeId}__out`;
}

export function labelId(edgeId: string): string {
  return `${edgeId}__label`;
}

function sizeOf(projection: LaneProjection, id: string, sizes: TileSizes | undefined) {
  const custom = sizes?.[id];
  if (custom) return custom;
  const n = projection.nodes.find((x) => x.id === id);
  return n ? nodeSize(n.type) : nodeSize(WorkflowNodeKind.Step);
}

function hintOf(projection: LaneProjection, id: string, previous: PositionMap | undefined): Point {
  if (previous?.[id]) return previous[id]!;
  const n = projection.nodes.find((x) => x.id === id);
  return n?.position ?? { x: 0, y: 0 };
}

function byHint(a: Point & { id: string }, b: Point & { id: string }): number {
  if (a.y !== b.y) return a.y - b.y;
  if (a.x !== b.x) return a.x - b.x;
  return a.id.localeCompare(b.id);
}

function hasPreviousHints(projection: LaneProjection, previous: PositionMap | undefined): boolean {
  return !!previous && projection.nodes.some((n) => previous[n.id]);
}

/**
 * Flat root graph: one child per projected Node with fixed WEST/EAST ports at
 * mid-height (matching the React Flow handles), one edge per projected Path,
 * one inline center label per labeled Path sized by the wrapped chip box.
 */
export function buildElkGraph(
  projection: LaneProjection,
  boxes: Record<string, LabelBox>,
  sizes?: TileSizes,
  previous?: PositionMap,
): ElkNode {
  const stable = hasPreviousHints(projection, previous);
  const nodes = stable
    ? [...projection.nodes].sort((a, b) =>
        byHint({ id: a.id, ...hintOf(projection, a.id, previous) }, { id: b.id, ...hintOf(projection, b.id, previous) }),
      )
    : projection.nodes;
  const edgesIn = stable
    ? [...projection.edges].sort((a, b) => {
        const ta = { id: a.target, ...hintOf(projection, a.target, previous) };
        const tb = { id: b.target, ...hintOf(projection, b.target, previous) };
        const byTarget = byHint(ta, tb);
        if (byTarget) return byTarget;
        return byHint(
          { id: a.source, ...hintOf(projection, a.source, previous) },
          { id: b.source, ...hintOf(projection, b.source, previous) },
        );
      })
    : projection.edges;

  const children: ElkNode[] = nodes.map((n) => {
    const { w, h } = sizeOf(projection, n.id, sizes);
    return {
      id: n.id,
      width: w,
      height: h,
      layoutOptions: { ...NODE_OPTIONS },
      ports: [
        { id: inPortId(n.id), x: 0, y: h / 2, width: 0, height: 0, layoutOptions: { ...PORT_OPTIONS_IN } },
        { id: outPortId(n.id), x: w, y: h / 2, width: 0, height: 0, layoutOptions: { ...PORT_OPTIONS_OUT } },
      ],
    };
  });
  const edges: ElkExtendedEdge[] = edgesIn.map((e) => {
    const box = boxes[e.id];
    const edge: ElkExtendedEdge = {
      id: e.id,
      sources: [outPortId(e.source)],
      targets: [inPortId(e.target)],
    };
    if (box && box.w > 0 && box.h > 0) {
      edge.labels = [
        {
          id: labelId(e.id),
          text: e.label,
          width: box.w,
          height: box.h,
          layoutOptions: { ...LABEL_OPTIONS },
        },
      ];
    }
    return edge;
  });
  return {
    id: "root",
    layoutOptions: stable ? { ...ROOT_OPTIONS, ...STABILITY_OPTIONS } : { ...ROOT_OPTIONS },
    children,
    edges,
  };
}

/**
 * Cache key for one lane graph. Changes with Node ids/types/sizes, Path
 * endpoints, and chip box sizes; not with titles, details, or actors.
 */
export function laneGraphKey(
  projection: LaneProjection,
  boxes: Record<string, LabelBox>,
  sizes?: TileSizes,
): string {
  const nodes = projection.nodes
    .map((n) => {
      const { w, h } = sizeOf(projection, n.id, sizes);
      return `${n.id}:${n.type}:${w}x${h}`;
    })
    .join(",");
  const edges = projection.edges
    .map((e) => {
      const box = boxes[e.id];
      const bw = box ? box.w : 0;
      const bh = box ? box.h : 0;
      return `${e.id}:${e.source}>${e.target}:${bw}x${bh}`;
    })
    .join(",");
  return `${projection.lane}|${nodes}|${edges}`;
}
