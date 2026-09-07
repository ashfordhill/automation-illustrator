/**
 * Compact internal flow for a merged Step (MG-08). Positions are local to the
 * flow pane (right of the normal-size Robot column). Scroll-free.
 */
import { edgeIsDotted } from "../../workflow/graph";
import {
  isStepNode,
  stepDisplayLabel,
  type NodeDto,
  type StepKind,
  type WorkflowDoc,
} from "../../workflow/types";
import type { GroupInternals } from "../../state/projection";
import { ACTOR_W } from "./tileMetrics";

/** Who column: figure + name card, not a stretched STEP_H ActorColumn (MG-08). */
export const MERGE_WHO_H = 148;

export const MERGE_STEP_W = 76;
export const MERGE_STEP_H = 40;
export const MERGE_DATA_W = 68;
export const MERGE_DATA_H = 26;
export const MERGE_COL_GAP = 22;
export const MERGE_ROW_GAP = 10;
export const MERGE_PAD = 10;

export type MergeFlowNode = {
  id: string;
  kind: "step" | "data";
  title: string;
  stepKind?: StepKind;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type MergeFlowEdge = {
  id: string;
  source: string;
  target: string;
  condition: string;
  dotted: boolean;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type MergeFlowLayout = {
  width: number;
  height: number;
  flowX: number;
  flowY: number;
  flowW: number;
  flowH: number;
  nodes: MergeFlowNode[];
  edges: MergeFlowEdge[];
};

function columnIndex(id: string, ids: string[], edges: GroupInternals["internalEdges"]): number {
  const incoming = new Map<string, string[]>();
  for (const n of ids) incoming.set(n, []);
  for (const e of edges) {
    if (!incoming.has(e.target)) continue;
    incoming.get(e.target)!.push(e.source);
  }
  const memo = new Map<string, number>();
  const visit = (nid: string, stack: Set<string>): number => {
    const hit = memo.get(nid);
    if (hit !== undefined) return hit;
    if (stack.has(nid)) return 0;
    stack.add(nid);
    let best = 0;
    for (const src of incoming.get(nid) ?? []) {
      if (!incoming.has(src) && !ids.includes(src)) continue;
      best = Math.max(best, visit(src, stack) + 1);
    }
    stack.delete(nid);
    memo.set(nid, best);
    return best;
  };
  return visit(id, new Set());
}

export function layoutMergeFlow(doc: WorkflowDoc, internals: GroupInternals): MergeFlowLayout {
  const hiddenIds = [...internals.memberIds, ...internals.supportingIds];
  const hidden = hiddenIds
    .map((id) => doc.nodes.find((n) => n.id === id))
    .filter((n): n is NodeDto => !!n);

  const cols = new Map<string, number>();
  let maxCol = 0;
  for (const n of hidden) {
    const col = columnIndex(n.id, hiddenIds, internals.internalEdges);
    cols.set(n.id, col);
    if (col > maxCol) maxCol = col;
  }

  const rowsByCol = new Map<number, NodeDto[]>();
  for (const n of hidden) {
    const col = cols.get(n.id) ?? 0;
    const list = rowsByCol.get(col) ?? [];
    list.push(n);
    rowsByCol.set(col, list);
  }
  for (const list of rowsByCol.values()) {
    list.sort((a, b) => {
      if (a.position.y !== b.position.y) return a.position.y - b.position.y;
      return a.id.localeCompare(b.id);
    });
  }

  const colWidths: number[] = [];
  for (let c = 0; c <= maxCol; c++) {
    const list = rowsByCol.get(c) ?? [];
    const w = list.some((n) => isStepNode(n)) ? MERGE_STEP_W : MERGE_DATA_W;
    colWidths[c] = w;
  }

  const colX: number[] = [];
  let x = 0;
  for (let c = 0; c <= maxCol; c++) {
    colX[c] = x;
    x += (colWidths[c] ?? MERGE_STEP_W) + (c < maxCol ? MERGE_COL_GAP : 0);
  }
  const flowW = Math.max(x, MERGE_STEP_W);

  const nodes: MergeFlowNode[] = [];
  let flowH = MERGE_STEP_H;
  for (let c = 0; c <= maxCol; c++) {
    const list = rowsByCol.get(c) ?? [];
    let y = 0;
    for (const n of list) {
      const step = isStepNode(n);
      const w = step ? MERGE_STEP_W : MERGE_DATA_W;
      const h = step ? MERGE_STEP_H : MERGE_DATA_H;
      const title = isStepNode(n)
        ? stepDisplayLabel(n.stepKind, n.title)
        : n.label;
      nodes.push({
        id: n.id,
        kind: step ? "step" : "data",
        title,
        stepKind: step ? n.stepKind : undefined,
        x: (colX[c] ?? 0) + ((colWidths[c] ?? w) - w) / 2,
        y,
        w,
        h,
      });
      y += h + MERGE_ROW_GAP;
      flowH = Math.max(flowH, y - MERGE_ROW_GAP);
    }
  }

  const box = new Map(nodes.map((n) => [n.id, n]));
  const graphNodes = [...doc.nodes, ...doc.after.extraNodes];
  const graphEdges = [...doc.edges, ...doc.after.extraEdges];
  const edges: MergeFlowEdge[] = [];
  for (const e of internals.internalEdges) {
    const a = box.get(e.source);
    const b = box.get(e.target);
    if (!a || !b) continue;
    edges.push({
      id: e.id,
      source: e.source,
      target: e.target,
      condition: e.label.trim(),
      dotted: edgeIsDotted(graphNodes, graphEdges, e),
      x1: a.x + a.w,
      y1: a.y + a.h / 2,
      x2: b.x,
      y2: b.y + b.h / 2,
    });
  }

  const width = ACTOR_W + MERGE_PAD * 2 + flowW;
  const height = Math.max(MERGE_WHO_H, flowH + MERGE_PAD * 2);
  return {
    width,
    height,
    flowX: ACTOR_W + MERGE_PAD,
    flowY: MERGE_PAD,
    flowW,
    flowH,
    nodes,
    edges,
  };
}

export function mergeTileSize(doc: WorkflowDoc, internals: GroupInternals): { w: number; h: number } {
  const layout = layoutMergeFlow(doc, internals);
  return { w: layout.width, h: layout.height };
}

/** Fallback when internals are missing: a normal Step footprint. */
export function defaultMergeTileSize(): { w: number; h: number } {
  return { w: ACTOR_W + MERGE_PAD * 2 + MERGE_STEP_W, h: MERGE_WHO_H };
}
