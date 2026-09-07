/**
 * React Flow canvas for one Before or After lane.
 * Maps WorkflowDoc → derived lane layout + Smart Edge Paths; click/link/remove-pick
 * dispatch into the store. Binds reactFlowBridge so keyboard pan can move this viewport.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  BackgroundVariant,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
  type Rect,
} from "@xyflow/react";
import { SmartEdgeProvider, type SmartEdgeMetrics } from "@tisoap/react-flow-smart-edge";
import "@xyflow/react/dist/style.css";
import {
  ReactFlowEdgeKind,
  reactFlowTypeFor,
  SelectionKind,
  WorkflowNodeKind,
} from "../workflow/catalogs";
import { bindReactFlow } from "./reactFlowBridge";
import { useStore } from "../state/store";
import { edgeTypes, nodeTypes, type Lane } from "./nodes/reactFlowRegistry";
import { FIELD_H, FIELD_W, GRID, STEP_H, STEP_W, nodeSize } from "./layout/tileMetrics";
import { layoutLane } from "./layout/layoutLane";
import { measureLabelBox } from "./layout/labelBox";
import { pointAt, useModestMotion } from "./layout/useModestMotion";
import { removalCandidateIds } from "../workflow/graph";
import { PathLayoutProvider } from "./routing/PathLayout";
import { smartProviderOptions } from "./routing/smartStep";
import type { FlowPathData } from "./routing/FlowArrow";
import type { LabelPlacement } from "./routing/placeLabels";
import type { NodeRect } from "./routing/polyline";

/** Clicking a tile should send Delete to the board, not a leftover inspector field. */
function blurDetailsFocus() {
  queueMicrotask(() => {
    const ae = document.activeElement;
    if (ae instanceof HTMLElement && ae.closest(".details-rail")) ae.blur();
  });
}

function nodeClassName(
  id: string,
  interaction: ReturnType<typeof useStore.getState>["interaction"],
  candidates: string[],
  departingId: string | null,
): string {
  const parts = ["nopan"];
  if (departingId === id) parts.push("node-departing");
  if (interaction.kind === "remove-pick" && candidates.includes(id)) {
    parts.push(interaction.candidateId === id ? "remove-candidate-on" : "remove-candidate");
  }
  if (interaction.kind === "remove-preview" && interaction.plan.nodeId === id) {
    parts.push("remove-candidate-on");
  }
  return parts.join(" ");
}

function tileSize(type: (typeof WorkflowNodeKind)[keyof typeof WorkflowNodeKind]) {
  return type === WorkflowNodeKind.Step
    ? { w: STEP_W, h: STEP_H }
    : { w: FIELD_W, h: FIELD_H };
}

/** The actual React Flow instance; Board wraps it in ReactFlowProvider. */
function Inner({ lane, height }: { lane: Lane; height?: string }) {
  const workflow = useStore((s) => s.workflow);
  const present = useStore((s) => s.present);
  const selected = useStore((s) => s.selected);
  const focusId = useStore((s) => s.focusId);
  const interaction = useStore((s) => s.interaction);
  const departing = useStore((s) => s.departing);
  const rf = useReactFlow();
  const editing = !present;
  const hostId = interaction.kind === "remove-pick" ? interaction.hostId : null;
  const candidates = hostId
    ? removalCandidateIds(workflow.nodes, workflow.edges, hostId)
    : [];

  const labelBoxes = useMemo(() => {
    const boxes: Record<string, ReturnType<typeof measureLabelBox>> = {};
    for (const e of workflow.edges) {
      if (e.label.trim()) boxes[e.id] = measureLabelBox(e.label);
    }
    return boxes;
  }, [workflow.edges]);

  const derived = useMemo(
    () => layoutLane(workflow.nodes, workflow.edges, labelBoxes),
    [workflow.nodes, workflow.edges, labelBoxes],
  );
  const display = useModestMotion(derived);
  const lastPos = useRef(display);
  lastPos.current = { ...lastPos.current, ...display };

  const [settled, setSettled] = useState(workflow.edges.length === 0);
  const [avoidAreas, setAvoidAreas] = useState<Rect[]>([]);
  const avoidCycles = useRef(0);
  const graphKey = `${workflow.nodes.map((n) => n.id).join(",")}|${workflow.edges.map((e) => `${e.id}:${e.label}`).join(",")}`;

  useEffect(() => {
    avoidCycles.current = 0;
    setAvoidAreas([]);
    setSettled(workflow.edges.length === 0);
  }, [graphKey, workflow.edges.length]);

  const onLabelRects = useCallback((rects: LabelPlacement[]) => {
    if (!rects.length) return;
    if (avoidCycles.current >= 2) return;
    const next: Rect[] = rects.map((r) => ({ x: r.x, y: r.y, width: r.w, height: r.h }));
    avoidCycles.current += 1;
    setAvoidAreas(next);
  }, []);

  const onMetrics = useCallback((metrics: SmartEdgeMetrics) => {
    if (metrics.deferred === 0) setSettled(true);
  }, []);

  useEffect(() => {
    if (!departing) return;
    const t = window.setTimeout(() => {
      useStore.getState().clearDeparting();
    }, 240);
    return () => window.clearTimeout(t);
  }, [departing]);

  const prevEdgeIds = useRef(new Set(workflow.edges.map((e) => e.id)));
  const [stretchIds, setStretchIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!departing) {
      prevEdgeIds.current = new Set(workflow.edges.map((e) => e.id));
      setStretchIds(new Set());
      return;
    }
    const next = new Set(workflow.edges.map((e) => e.id));
    setStretchIds(new Set([...next].filter((id) => !prevEdgeIds.current.has(id))));
  }, [departing, workflow.edges]);

  const hideFromObstacles = new Set<string>();
  if (departing) hideFromObstacles.add(departing.node.id);
  if (interaction.kind === "remove-preview") hideFromObstacles.add(interaction.plan.nodeId);

  const rfNodes: Node[] = workflow.nodes.map((n) => {
    const pos = pointAt(display, n.id, n.position);
    const size = tileSize(n.type);
    return {
      id: n.id,
      type: reactFlowTypeFor(n.type),
      position: pos,
      data: { lane },
      draggable: false,
      selectable: editing,
      selected: selected?.type === SelectionKind.Node && selected.id === n.id,
      className: nodeClassName(n.id, interaction, candidates, null),
      width: size.w,
      height: size.h,
      measured: { width: size.w, height: size.h },
      style: { width: size.w, height: size.h },
    };
  });

  if (departing && !workflow.nodes.some((n) => n.id === departing.node.id)) {
    const n = departing.node;
    const pos = lastPos.current[n.id] ?? n.position;
    const size = tileSize(n.type);
    rfNodes.push({
      id: n.id,
      type: reactFlowTypeFor(n.type),
      position: pos,
      data: { lane, departing: true },
      draggable: false,
      selectable: false,
      className: nodeClassName(n.id, interaction, [], n.id),
      width: size.w,
      height: size.h,
      measured: { width: size.w, height: size.h },
      style: {
        width: size.w,
        height: size.h,
        pointerEvents: "none",
      },
    });
  }

  const obstacleNodes = rfNodes.filter((n) => !hideFromObstacles.has(n.id));

  const displayKey = Object.keys(display)
    .sort()
    .map((id) => {
      const p = display[id]!;
      return `${id}:${Math.round(p.x)},${Math.round(p.y)}`;
    })
    .join("|");

  const nodeRects: NodeRect[] = useMemo(
    () =>
      workflow.nodes.map((n) => {
        const pos = pointAt(display, n.id, n.position);
        const size = nodeSize(n.type);
        return { id: n.id, x: pos.x, y: pos.y, w: size.w, h: size.h };
      }),
    // displayKey captures modest-motion frames without a new identity each rAF.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- display is keyed
    [workflow.nodes, displayKey],
  );

  const labels = useMemo(() => {
    const next: Record<string, string> = {};
    for (const e of workflow.edges) next[e.id] = e.label;
    if (interaction.kind === "remove-preview") {
      for (const p of interaction.plan.pairings) {
        next[`preview-${p.predecessorId}-${p.successorId}`] = p.condition;
      }
    }
    return next;
  }, [workflow.edges, interaction]);

  useEffect(() => {
    bindReactFlow(rf);
    return () => bindReactFlow(null);
  }, [rf]);

  useEffect(() => {
    if (!focusId) return;
    const id = focusId;
    const n = workflow.nodes.find((x) => x.id === id);
    if (n) {
      const pos = pointAt(display, n.id, n.position);
      const w = n.type === WorkflowNodeKind.Step ? STEP_W : FIELD_W;
      const h = n.type === WorkflowNodeKind.Step ? STEP_H : FIELD_H;
      void rf.setCenter(pos.x + w / 2, pos.y + h / 2, {
        duration: 280,
        zoom: 1,
      });
    }
    queueMicrotask(() => {
      useStore.getState().consumeFocus(id);
    });
  }, [focusId, rf, workflow.nodes, display]);

  const via = departing
    ? {
        x: (lastPos.current[departing.node.id] ?? departing.node.position).x + nodeSize(departing.node.type).w / 2,
        y: (lastPos.current[departing.node.id] ?? departing.node.position).y + nodeSize(departing.node.type).h / 2,
      }
    : null;

  const edges: Edge<FlowPathData>[] = workflow.edges.map((e) => {
    const stretching = stretchIds.has(e.id);
    return {
      id: e.id,
      source: e.source,
      target: e.target,
      type: ReactFlowEdgeKind.Flow,
      selectable: editing && interaction.kind !== "remove-pick" && interaction.kind !== "remove-preview",
      selected: selected?.type === SelectionKind.Edge && selected.id === e.id,
      data: stretching && via ? { stretch: true, viaX: via.x, viaY: via.y } : {},
    };
  });

  if (interaction.kind === "remove-preview") {
    for (const p of interaction.plan.pairings) {
      edges.push({
        id: `preview-${p.predecessorId}-${p.successorId}`,
        source: p.predecessorId,
        target: p.successorId,
        type: ReactFlowEdgeKind.Flow,
        selectable: false,
        className: "edge-restitch",
        data: { restitch: true, condition: p.condition, dashed: p.dashed },
      });
    }
  }

  const edgeIds = edges.map((e) => e.id);

  const onNodeClick = useCallback((_: unknown, n: Node) => {
    const s = useStore.getState();
    if (s.present) return;
    if (s.interaction.kind === "connect-existing") {
      s.completeLinkTo(n.id);
      return;
    }
    if (s.interaction.kind === "remove-pick") {
      s.setRemoveCandidate(n.id);
      return;
    }
    if (s.interaction.kind === "remove-preview") return;
    s.select({ type: SelectionKind.Node, id: n.id });
    blurDetailsFocus();
  }, []);

  const linking = interaction.kind === "connect-existing";

  return (
    <div
      className="board-lane"
      data-smart-edge={settled ? "settled" : "pending"}
      style={{ height: height ?? "100%" }}
    >
      <SmartEdgeProvider
        nodes={obstacleNodes}
        options={{ ...smartProviderOptions, avoidAreas }}
        onMetrics={onMetrics}
      >
        <PathLayoutProvider
          edgeIds={edgeIds}
          labels={labels}
          nodeRects={nodeRects}
          onLabelRects={onLabelRects}
        >
          <ReactFlow
            nodes={rfNodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            nodesConnectable={false}
            deleteKeyCode={null}
            elementsSelectable={editing}
            nodesDraggable={false}
            panOnDrag
            selectionOnDrag={false}
            selectNodesOnDrag={false}
            zoomOnScroll
            panOnScroll={false}
            minZoom={0.2}
            maxZoom={1.35}
            snapToGrid
            snapGrid={[GRID, GRID]}
            fitView
            fitViewOptions={{ padding: 0.28 }}
            proOptions={{ hideAttribution: true }}
            onPaneClick={() => {
              const s = useStore.getState();
              if (s.present) return;
              s.closeBoardModes();
              s.select(null);
            }}
            onNodeClick={onNodeClick}
            onEdgeClick={(_, e) => {
              const s = useStore.getState();
              if (s.present) return;
              if (s.interaction.kind === "remove-pick" || s.interaction.kind === "remove-preview") {
                return;
              }
              s.select({ type: SelectionKind.Edge, id: e.id });
              blurDetailsFocus();
            }}
            className={`pointer-mode${linking ? " linking" : ""}`}
            style={{ height: "100%", background: "transparent" }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={GRID}
              size={2.2}
              color="var(--grid-dot)"
            />
          </ReactFlow>
        </PathLayoutProvider>
      </SmartEdgeProvider>
    </div>
  );
}

export function Board({ lane, height }: { lane: Lane; height?: string }) {
  return (
    <ReactFlowProvider>
      <Inner lane={lane} height={height} />
    </ReactFlowProvider>
  );
}
