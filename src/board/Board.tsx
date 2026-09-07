/**
 * React Flow canvas for one Before or After lane.
 * Projects the v2 document, derives the lane layout with ELK (Improvement 01),
 * and binds a per-lane viewport. In Both, both lanes share one camera (BA-05).
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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  ReactFlowEdgeKind,
  ReactFlowNodeKind,
  ViewMode,
  reactFlowTypeFor,
  SelectionKind,
  otherLane,
} from "../workflow/catalogs";
import {
  applyViewport,
  bindReactFlow,
  getReactFlow,
  isProgrammaticViewport,
  syncBothViewports,
} from "./reactFlowBridge";
import { projectLane } from "../state/projection";
import { useStore } from "../state/store";
import { edgeTypes, nodeTypes, type Lane } from "./nodes/reactFlowRegistry";
import { GRID, nodeSize } from "./layout/tileMetrics";
import { mergeTileSize } from "./layout/mergeFlow";
import { measureLabelBox, type LabelBox } from "./layout/labelBox";
import type { TileSizes } from "./layout/elkGraph";
import { useLaneLayout } from "./layout/useLaneLayout";
import { pointAt, useAnimatedLayout } from "./layout/useAnimatedLayout";
import { LaneLayoutContext } from "./routing/LaneLayoutContext";
import { pathIsDotted, type FlowPathData } from "./routing/FlowArrow";

/** Scroll/pinch zoom only (P-08). Wide enough for several wheel stops between overview and a single tile. */
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 2.5;

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
  departingId: string | null,
  merge?: boolean,
  mergePicked?: boolean,
): string {
  const parts = ["nopan"];
  if (merge) parts.push("is-merge-group");
  if (departingId === id) parts.push("node-departing");
  if (interaction.kind === "remove-preview" && interaction.plan.nodeId === id) {
    parts.push("remove-candidate-on");
  }
  if (interaction.kind === "path-pull" && interaction.hoverTargetId === id) {
    parts.push("path-drop-target");
  }
  if (interaction.kind === "merge-pick" && mergePicked) {
    parts.push("merge-candidate-on");
  }
  return parts.join(" ");
}

/** The actual React Flow instance; Board wraps it in ReactFlowProvider. */
function Inner({ lane, height }: { lane: Lane; height?: string }) {
  const workflow = useStore((s) => s.workflow);
  const present = useStore((s) => s.present);
  const selected = useStore((s) => s.selected);
  const focusId = useStore((s) => s.focusId);
  const interaction = useStore((s) => s.interaction);
  const departing = useStore((s) => s.departing);
  const focusedLane = useStore((s) => s.focusedLane);
  const view = useStore((s) => s.view);
  const initialViewport = useRef(useStore.getState().laneViewports[lane]);
  const rf = useReactFlow();
  const editing = !present;

  const projection = useMemo(() => projectLane(workflow, lane), [workflow, lane]);

  /* Condition-chip boxes are ELK label sizes (CX-05): the layout reserves room for them. */
  const labelBoxes = useMemo(() => {
    const boxes: Record<string, LabelBox> = {};
    for (const e of projection.edges) {
      if (e.label.trim()) boxes[e.id] = measureLabelBox(e.label);
    }
    return boxes;
  }, [projection.edges]);

  const tileSizes = useMemo(() => {
    const sizes: TileSizes = {};
    for (const g of projection.internals) {
      sizes[g.groupId] = mergeTileSize(workflow, g);
    }
    return sizes;
  }, [workflow, projection.internals]);

  const { layout, phase, error } = useLaneLayout(lane, projection, labelBoxes, tileSizes);
  const shown = useAnimatedLayout(layout);
  const display = shown?.positions;
  const lastPos = useRef<Record<string, { x: number; y: number }>>({});
  if (display) lastPos.current = { ...lastPos.current, ...display };

  /* First layout: fit once unless this lane already has a saved viewport.
     In Both, copy the other lane's camera instead of fitting independently (BA-05). */
  const fitted = useRef(Boolean(initialViewport.current));
  useEffect(() => {
    if (fitted.current || phase === "initial") return;
    if (useStore.getState().view === ViewMode.Both) {
      const other = getReactFlow(otherLane(lane));
      if (other) {
        const v = other.getViewport();
        if (v.zoom > 0) {
          fitted.current = true;
          applyViewport(lane, v);
          useStore.getState().setLaneViewport(lane, v);
          return;
        }
      }
    }
    fitted.current = true;
    let raf = 0;
    const attempt = () => {
      void rf.fitView({ padding: 0.28 }).then((done) => {
        if (!done) {
          raf = requestAnimationFrame(attempt);
          return;
        }
        const v = rf.getViewport();
        const s = useStore.getState();
        s.setLaneViewport(lane, v);
        if (s.view === ViewMode.Both) {
          s.setLaneViewport(otherLane(lane), v);
          applyViewport(otherLane(lane), v);
        }
      });
    };
    attempt();
    return () => cancelAnimationFrame(raf);
  }, [phase, rf, lane]);

  useEffect(() => {
    if (!departing) return;
    const t = window.setTimeout(() => {
      useStore.getState().clearDeparting();
    }, 240);
    return () => window.clearTimeout(t);
  }, [departing]);

  const prevEdgeIds = useRef(new Set(projection.edges.map((e) => e.id)));
  const [stretchIds, setStretchIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!departing) {
      prevEdgeIds.current = new Set(projection.edges.map((e) => e.id));
      setStretchIds(new Set());
      return;
    }
    const next = new Set(projection.edges.map((e) => e.id));
    setStretchIds(new Set([...next].filter((id) => !prevEdgeIds.current.has(id))));
  }, [departing, projection.edges]);

  const rfNodes: Node[] = projection.nodes.map((n) => {
    const pos = pointAt(display, n.id, n.position);
    const size = tileSizes[n.id] ?? nodeSize(n.type);
    const mergePicked =
      interaction.kind === "merge-pick" &&
      (interaction.memberIds.includes(n.id) ||
        (n.memberIds ?? []).some((id) => interaction.memberIds.includes(id)));
    const internals = projection.internals.find((g) => g.groupId === n.id);
    return {
      id: n.id,
      type: n.projectedKind === "group" ? ReactFlowNodeKind.MergeGroup : reactFlowTypeFor(n.type),
      position: pos,
      data: {
        lane,
        node: n,
        projectedKind: n.projectedKind,
        originId: n.originId,
        memberIds: n.memberIds,
        supportingIds: n.supportingIds,
        internals,
      },
      draggable: false,
      selectable: editing,
      selected: selected?.type === SelectionKind.Node && selected.id === n.id,
      className: nodeClassName(
        n.id,
        interaction,
        null,
        n.projectedKind === "group",
        mergePicked,
      ),
      width: size.w,
      height: size.h,
      measured: { width: size.w, height: size.h },
      style: { width: size.w, height: size.h },
    };
  });

  if (departing && !projection.nodes.some((n) => n.id === departing.node.id)) {
    const n = departing.node;
    const pos = lastPos.current[n.id] ?? n.position;
    const size = nodeSize(n.type);
    rfNodes.push({
      id: n.id,
      type: reactFlowTypeFor(n.type),
      position: pos,
      data: { lane, node: n, departing: true },
      draggable: false,
      selectable: false,
      className: nodeClassName(n.id, interaction, n.id),
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

  useEffect(() => {
    bindReactFlow(lane, rf);
    return () => bindReactFlow(lane, null);
  }, [rf, lane]);

  /* Newly created tiles still request focus for selection chrome; never pan or zoom to them. */
  useEffect(() => {
    if (!focusId) return;
    const id = focusId;
    queueMicrotask(() => {
      useStore.getState().consumeFocus(id);
    });
  }, [focusId]);

  const via = departing
    ? {
        x: (lastPos.current[departing.node.id] ?? departing.node.position).x + nodeSize(departing.node.type).w / 2,
        y: (lastPos.current[departing.node.id] ?? departing.node.position).y + nodeSize(departing.node.type).h / 2,
      }
    : null;

  /* Draw order implements the stroke rule at crossings: dotted first, solid last, selected on top. */
  const laneEdges = projection.edges.map((e) => {
    const stretching = stretchIds.has(e.id);
    const isSelected = selected?.type === SelectionKind.Edge && selected.id === e.originId;
    const rfEdge: Edge<FlowPathData> = {
      id: e.id,
      source: e.source,
      target: e.target,
      type: ReactFlowEdgeKind.Flow,
      selectable: editing && interaction.kind !== "remove-preview" && interaction.kind !== "tile-drag",
      selected: isSelected,
      className:
        interaction.kind === "tile-drag" && interaction.hoverEdgeId === e.originId
          ? "path-insert-hover"
          : undefined,
      data: stretching && via ? { stretch: true, viaX: via.x, viaY: via.y, originId: e.originId } : { originId: e.originId },
    };
    return { rfEdge, isSelected, dotted: pathIsDotted(workflow, e.originId) };
  });
  laneEdges.sort((a, b) => {
    const ra = a.isSelected ? 2 : a.dotted ? 0 : 1;
    const rb = b.isSelected ? 2 : b.dotted ? 0 : 1;
    return ra - rb;
  });
  const edges: Edge<FlowPathData>[] = laneEdges.map((x) => x.rfEdge);

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

  const onNodeClick = useCallback((_: unknown, n: Node) => {
    const s = useStore.getState();
    s.setFocusedLane(lane);
    if (s.present) return;
    if (s.interaction.kind === "connect-existing") {
      s.completeLinkTo(n.id);
      return;
    }
    if (s.interaction.kind === "path-pull") {
      s.completePathPull(n.id);
      return;
    }
    if (s.interaction.kind === "plus-pull" || s.interaction.kind === "tile-drag") {
      return;
    }
    if (s.interaction.kind === "merge-pick") {
      s.toggleMergeMember(n.id);
      return;
    }
    if (s.interaction.kind === "remove-preview") return;
    s.select({ type: SelectionKind.Node, id: n.id });
    blurDetailsFocus();
  }, [lane]);

  const panTarget = view === ViewMode.Both && focusedLane === lane;
  const contextValue = useMemo(() => ({ layout: shown }), [shown]);

  return (
    <div
      className={`board-lane${panTarget ? " is-pan-target" : ""}`}
      data-layout={phase}
      data-layout-error={error ? "true" : undefined}
      data-lane={lane}
      data-pan-target={panTarget ? "true" : "false"}
      aria-label={lane === "after" ? "After lane" : "Before lane"}
      style={{ height: height ?? "100%" }}
      onPointerDown={() => useStore.getState().setFocusedLane(lane)}
    >
      <LaneLayoutContext.Provider value={contextValue}>
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
          zoomOnPinch
          zoomOnDoubleClick={false}
          autoPanOnNodeFocus={false}
          panOnScroll={false}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          snapToGrid
          snapGrid={[GRID, GRID]}
          defaultViewport={initialViewport.current}
          onMove={(_, viewport) => {
            if (isProgrammaticViewport(lane)) return;
            syncBothViewports(lane, viewport);
          }}
          onMoveEnd={(_, viewport) => {
            if (isProgrammaticViewport(lane)) return;
            const s = useStore.getState();
            s.setLaneViewport(lane, viewport);
            if (s.view === ViewMode.Both) s.setLaneViewport(otherLane(lane), viewport);
          }}
          proOptions={{ hideAttribution: true }}
          onPaneClick={() => {
            const s = useStore.getState();
            s.setFocusedLane(lane);
            if (s.present) return;
            s.closeBoardModes();
            s.select(null);
          }}
          onNodeClick={onNodeClick}
          onEdgeClick={(_, e) => {
            const s = useStore.getState();
            s.setFocusedLane(lane);
            if (s.present) return;
            if (s.interaction.kind === "remove-preview" || s.interaction.kind === "tile-drag") {
              return;
            }
            const originId = (e.data as FlowPathData | undefined)?.originId;
            s.select({ type: SelectionKind.Edge, id: typeof originId === "string" ? originId : e.id });
            blurDetailsFocus();
          }}
          className="board-pan"
          style={{ height: "100%", background: "transparent" }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={GRID}
            size={2.2}
            color="var(--grid-dot)"
          />
        </ReactFlow>
      </LaneLayoutContext.Provider>
    </div>
  );
}

export function Board({ lane, height }: { lane: Lane; height?: string }) {
  const epoch = useStore((s) => s.canvasEpoch);
  return (
    <ReactFlowProvider key={`${lane}-${epoch}`}>
      <Inner lane={lane} height={height} />
    </ReactFlowProvider>
  );
}
