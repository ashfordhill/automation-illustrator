/**
 * React Flow canvas for one Before or After lane.
 * Maps WorkflowDoc → RF nodes/edges; click/link/path-pick dispatch into the store.
 * Binds reactFlowBridge so keyboard pan can move this viewport.
 */
import { useCallback, useEffect } from "react";
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
  reactFlowTypeFor,
  SelectionKind,
  Tool,
  WorkflowNodeKind,
} from "../workflow/catalogs";
import { isStepNode } from "../workflow/types";
import { bindReactFlow } from "./reactFlowBridge";
import { useStore } from "../state/store";
import { edgeTypes, nodeTypes, type Lane } from "./nodes/reactFlowRegistry";
import { FIELD_H, FIELD_W, GRID, STEP_H, STEP_W } from "./layout/tileMetrics";

/** Clicking a tile should send Delete to the board, not a leftover inspector field. */
function blurDetailsFocus() {
  queueMicrotask(() => {
    const ae = document.activeElement;
    if (ae instanceof HTMLElement && ae.closest(".details-rail")) ae.blur();
  });
}

/** The actual React Flow instance; Board wraps it in ReactFlowProvider. */
function Inner({ lane, height }: { lane: Lane; height?: string }) {
  const workflow = useStore((s) => s.workflow);
  const tool = useStore((s) => s.tool);
  const present = useStore((s) => s.present);
  const selected = useStore((s) => s.selected);
  const focusId = useStore((s) => s.focusId);
  const linkFrom = useStore((s) => s.linkFrom);
  const pathPick = useStore((s) => s.pathPick);
  const rf = useReactFlow();
  const isHand = tool === Tool.Hand || present;
  const editing = !present && !isHand;

  const rfNodes: Node[] = workflow.nodes.map((n) => ({
    id: n.id,
    type: reactFlowTypeFor(n.type),
    position: n.position,
    data: { lane },
    draggable: false,
    selectable: editing,
    selected: selected?.type === SelectionKind.Node && selected.id === n.id,
    className: isHand ? undefined : "nopan",
    style: {
      width: n.type === WorkflowNodeKind.Step ? STEP_W : FIELD_W,
      height: n.type === WorkflowNodeKind.Step ? STEP_H : FIELD_H,
    },
  }));

  useEffect(() => {
    bindReactFlow(rf);
    return () => bindReactFlow(null);
  }, [rf]);

  useEffect(() => {
    if (!focusId) return;
    const id = focusId;
    const n = workflow.nodes.find((x) => x.id === id);
    if (n) {
      const w = n.type === WorkflowNodeKind.Step ? STEP_W : FIELD_W;
      const h = n.type === WorkflowNodeKind.Step ? STEP_H : FIELD_H;
      void rf.setCenter(n.position.x + w / 2, n.position.y + h / 2, {
        duration: 280,
        zoom: 1,
      });
    }
    queueMicrotask(() => {
      useStore.getState().consumeFocus(id);
    });
  }, [focusId, rf, workflow.nodes]);

  const edges: Edge[] = workflow.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    type: ReactFlowEdgeKind.Flow,
    selectable: editing && !pathPick,
    selected: selected?.type === SelectionKind.Edge && selected.id === e.id,
  }));

  const onNodeClick = useCallback((_: unknown, n: Node) => {
    const s = useStore.getState();
    if (s.present || s.tool === Tool.Hand) return;
    if (s.linkFrom) {
      s.completeLinkTo(n.id);
      return;
    }
    if (s.selected?.type === SelectionKind.Actor) {
      const node = s.workflow.nodes.find((x) => x.id === n.id);
      if (node && isStepNode(node)) {
        s.assignActor(n.id, s.selected.id);
        s.select({ type: SelectionKind.Node, id: n.id });
        blurDetailsFocus();
        return;
      }
    }
    s.select({ type: SelectionKind.Node, id: n.id });
    blurDetailsFocus();
  }, []);

  return (
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
      panOnScroll={isHand}
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
        if (s.linkFrom) {
          s.completeLinkNew();
          return;
        }
        if (s.linkMenu) {
          s.closeBoardModes();
          return;
        }
        s.select(null);
      }}
      onNodeClick={onNodeClick}
      onEdgeClick={(_, e) => {
        const s = useStore.getState();
        if (s.present || s.tool === Tool.Hand) return;
        if (s.pathPick) {
          s.pickPathByEdge(e.id);
          return;
        }
        s.select({ type: SelectionKind.Edge, id: e.id });
        blurDetailsFocus();
      }}
      className={`${isHand ? "hand-mode" : "pointer-mode"}${linkFrom ? " linking" : ""}`}
      style={{ height: height ?? "100%", background: "transparent" }}
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={GRID}
        size={2.2}
        color="var(--grid-dot)"
      />
    </ReactFlow>
  );
}

export function Board({ lane, height }: { lane: Lane; height?: string }) {
  return (
    <ReactFlowProvider>
      <Inner lane={lane} height={height} />
    </ReactFlowProvider>
  );
}
