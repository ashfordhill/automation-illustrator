/**
 * React Flow canvas for one Before or After lane.
 * Maps WorkflowDoc → RF nodes/edges; click/link/remove-pick dispatch into the store.
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
  WorkflowNodeKind,
} from "../workflow/catalogs";
import { bindReactFlow } from "./reactFlowBridge";
import { useStore } from "../state/store";
import { edgeTypes, nodeTypes, type Lane } from "./nodes/reactFlowRegistry";
import { FIELD_H, FIELD_W, GRID, STEP_H, STEP_W } from "./layout/tileMetrics";
import { removalCandidateIds } from "../workflow/graph";

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

  useEffect(() => {
    if (!departing) return;
    const t = window.setTimeout(() => {
      useStore.getState().clearDeparting();
    }, 240);
    return () => window.clearTimeout(t);
  }, [departing]);

  const rfNodes: Node[] = workflow.nodes.map((n) => ({
    id: n.id,
    type: reactFlowTypeFor(n.type),
    position: n.position,
    data: { lane },
    draggable: false,
    selectable: editing,
    selected: selected?.type === SelectionKind.Node && selected.id === n.id,
    className: nodeClassName(n.id, interaction, candidates, null),
    style: {
      width: n.type === WorkflowNodeKind.Step ? STEP_W : FIELD_W,
      height: n.type === WorkflowNodeKind.Step ? STEP_H : FIELD_H,
    },
  }));

  if (departing && !workflow.nodes.some((n) => n.id === departing.node.id)) {
    const n = departing.node;
    rfNodes.push({
      id: n.id,
      type: reactFlowTypeFor(n.type),
      position: n.position,
      data: { lane, departing: true },
      draggable: false,
      selectable: false,
      className: nodeClassName(n.id, interaction, [], n.id),
      style: {
        width: n.type === WorkflowNodeKind.Step ? STEP_W : FIELD_W,
        height: n.type === WorkflowNodeKind.Step ? STEP_H : FIELD_H,
        pointerEvents: "none",
      },
    });
  }

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
    selectable: editing && interaction.kind !== "remove-pick" && interaction.kind !== "remove-preview",
    selected: selected?.type === SelectionKind.Edge && selected.id === e.id,
  }));

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
