/**
 * Build the ELK input graph for one lane projection (Improvement 01 / 36 / 61).
 * First layout uses projection array order. When a previous derived layout is
 * supplied, Nodes and Paths are ordered by the across-flow axis so forks keep
 * their rows (horizontal) or columns (vertical).
 */
import type { ElkExtendedEdge, ElkNode } from "elkjs/lib/elk-api";
import type { LaneProjection } from "../../state/projection";
import { WorkflowNodeKind } from "../../workflow/catalogs";
import type { Point, PositionMap } from "../../workflow/types";
import {
  acrossOf,
  flowProfile,
  type BoardOrientation,
  type FlowAxis,
  type FlowProfile,
} from "../flow/flowProfile";
import type { LabelBox } from "./labelBox";
import { BRANCH_GAP, GRID, TILE_GAP, nodeSize } from "./tileMetrics";

export type TileSizes = Record<string, { w: number; h: number }>;

/** Tile ELK vs word-web ELK (oval sizes + wider gutters). */
export type LayoutMode = "tile" | "web";

/** Between-layer air while simplified (tile TILE_GAP is 64). */
export const WEB_LAYER_GAP = 160;
/** Sibling air while simplified (tile BRANCH_GAP is 32). */
export const WEB_NODE_GAP = 80;

/** Layered, orthogonal, hyperedges bundled at shared ports. Direction comes from FlowProfile. */
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

/** Same algorithm as tiles; longer gutters so oval pills do not touch. */
export function wordWebRootOptions(): Record<string, string> {
  return {
    ...ROOT_OPTIONS,
    "elk.spacing.nodeNode": String(WEB_NODE_GAP),
    "elk.layered.spacing.nodeNodeBetweenLayers": String(WEB_LAYER_GAP),
  };
}

function rootOptionsFor(profile: FlowProfile, mode: LayoutMode): Record<string, string> {
  const base = mode === "web" ? wordWebRootOptions() : ROOT_OPTIONS;
  return {
    ...base,
    "elk.direction": profile.elkDirection,
    "elk.aspectRatio": profile.aspectRatio,
  };
}

/**
 * After the first layout: keep source-rank layers and the across-flow order we
 * seeded from displayed positions (Improvement 36 / 61).
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

function byHint(a: Point & { id: string }, b: Point & { id: string }, across: FlowAxis): number {
  const ac = acrossOf(a, across) - acrossOf(b, across);
  if (ac !== 0) return ac;
  const along: FlowAxis = across === "y" ? "x" : "y";
  const al = acrossOf(a, along) - acrossOf(b, along);
  if (al !== 0) return al;
  return a.id.localeCompare(b.id);
}

function hasPreviousHints(projection: LaneProjection, previous: PositionMap | undefined): boolean {
  return !!previous && projection.nodes.some((n) => previous[n.id]);
}

/**
 * Flat root graph: one child per projected Node with fixed in/out ports
 * (west/east or north/south), one edge per projected Path, one inline center
 * label per labeled Path sized by the wrapped chip box.
 */
export function buildElkGraph(
  projection: LaneProjection,
  boxes: Record<string, LabelBox>,
  sizes?: TileSizes,
  previous?: PositionMap,
  mode: LayoutMode = "tile",
  orientation: BoardOrientation = "horizontal",
): ElkNode {
  const profile = flowProfile(orientation);
  const chipBoxes = mode === "web" ? {} : boxes;
  const rootOptions = rootOptionsFor(profile, mode);
  const stable = mode !== "web" && hasPreviousHints(projection, previous);
  const nodes = stable
    ? [...projection.nodes].sort((a, b) =>
        byHint(
          { id: a.id, ...hintOf(projection, a.id, previous) },
          { id: b.id, ...hintOf(projection, b.id, previous) },
          profile.across,
        ),
      )
    : projection.nodes;
  const edgesIn = stable
    ? [...projection.edges].sort((a, b) => {
        const ta = { id: a.target, ...hintOf(projection, a.target, previous) };
        const tb = { id: b.target, ...hintOf(projection, b.target, previous) };
        const byTarget = byHint(ta, tb, profile.across);
        if (byTarget) return byTarget;
        return byHint(
          { id: a.source, ...hintOf(projection, a.source, previous) },
          { id: b.source, ...hintOf(projection, b.source, previous) },
          profile.across,
        );
      })
    : projection.edges;

  const children: ElkNode[] = nodes.map((n) => {
    const { w, h } = sizeOf(projection, n.id, sizes);
    const inn = profile.portIn(w, h);
    const out = profile.portOut(w, h);
    return {
      id: n.id,
      width: w,
      height: h,
      layoutOptions: { ...NODE_OPTIONS },
      ports: [
        {
          id: inPortId(n.id),
          x: inn.x,
          y: inn.y,
          width: 0,
          height: 0,
          layoutOptions: { "elk.port.side": profile.inSide },
        },
        {
          id: outPortId(n.id),
          x: out.x,
          y: out.y,
          width: 0,
          height: 0,
          layoutOptions: { "elk.port.side": profile.outSide },
        },
      ],
    };
  });
  const edges: ElkExtendedEdge[] = edgesIn.map((e) => {
    const box = chipBoxes[e.id];
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
    layoutOptions: stable ? { ...rootOptions, ...STABILITY_OPTIONS } : { ...rootOptions },
    children,
    edges,
  };
}

/**
 * Cache key for one graph. Changes with orientation, Node ids/types/sizes, Path
 * endpoints, chip boxes, and tile vs word-web mode. Not titles, details,
 * actors, or Before vs After — those lanes share one derived layout.
 */
export function laneGraphKey(
  projection: LaneProjection,
  boxes: Record<string, LabelBox>,
  sizes?: TileSizes,
  mode: LayoutMode = "tile",
  orientation: BoardOrientation = "horizontal",
): string {
  const nodes = projection.nodes
    .map((n) => {
      const { w, h } = sizeOf(projection, n.id, sizes);
      return `${n.id}:${n.type}:${w}x${h}`;
    })
    .join(",");
  const chipBoxes = mode === "web" ? {} : boxes;
  const edges = projection.edges
    .map((e) => {
      const box = chipBoxes[e.id];
      const bw = box ? box.w : 0;
      const bh = box ? box.h : 0;
      return `${e.id}:${e.source}>${e.target}:${bw}x${bh}`;
    })
    .join(",");
  return `${orientation}|${mode}|${nodes}|${edges}`;
}
