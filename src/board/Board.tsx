/**
 * React Flow canvas for one Before or After lane.
 * Projects the v2 document, derives the lane layout with ELK (Improvement 01),
 * and binds a per-lane viewport. After always follows Before's camera (BA-05).
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import "./Board.css";
import {
  Background,
  BackgroundVariant,
  getViewportForBounds,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  useViewport,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  ReactFlowEdgeKind,
  ViewMode,
  reactFlowTypeFor,
  SelectionKind,
  otherLane,
} from "../workflow/catalogs";
import {
  applyViewport,
  beginProgrammaticViewport,
  bindReactFlow,
  cameraToFollow,
  endProgrammaticViewport,
  isProgrammaticViewport,
  laneIsTucked,
  persistSharedViewport,
  sharesCompareCamera,
  syncBothViewports,
} from "./reactFlowBridge";
import { projectLane } from "../state/projection";
import { useStore } from "../state/store";
import { edgeTypes, nodeTypes, type Lane } from "./nodes/reactFlowRegistry";
import { GRID, nodeSize } from "./layout/tileMetrics";
import { bundleInsertPreviewGeom, insertPreviewGeom } from "./layout/insertPreview";
import { incidentPathIds } from "./layout/pathHit";
import { findNode } from "../workflow/selectors";
import { isSimplified } from "./simplify/prefs";
import { wordWebNodeSize } from "./simplify/headline";
import { SimplifyContext } from "./simplify/SimplifyContext";
import {
  isWebFitted,
  markWebFitted,
  rememberTileCamera,
  restoreTileCamera,
} from "./simplify/wordWebCamera";
import { measureLabelBox, type LabelBox } from "./layout/labelBox";
import type { TileSizes } from "./layout/elkGraph";
import { useLaneLayout } from "./layout/useLaneLayout";
import { pointAt, useAnimatedLayout } from "./layout/useAnimatedLayout";
import { LaneLayoutContext } from "./routing/LaneLayoutContext";
import { layoutKeyMode } from "./flow/flowProfile";
import { pathIsDotted, type FlowPathData } from "./routing/FlowArrow";
import {
  MIN_ZOOM,
  MAX_ZOOM,
  ZOOM_BOUNDS_PAD,
  clampWheelZoom,
  graphIsIsland,
  pointInPaddedBounds,
  pointerOverNodeOrPath,
  shouldZoomTowardBounds,
  viewportZoomAround,
  wheelZoomFactor,
} from "./zoom";
import {
  FIRST_LAYOUT_FIT_PADDING,
  boardNeedsCover,
  canApplyFirstLayoutCamera,
  firstLayoutCentersAtCurrentZoom,
  layoutBoundsAreUsable,
  unionNodeBounds,
  viewportToCenterRect,
  viewportToFitRect,
} from "./firstLayoutCamera";

function flowContentBox(rf: ReturnType<typeof useReactFlow>): { x: number; y: number; w: number; h: number } | null {
  const nodes = rf.getNodes().filter((n) => !n.hidden);
  if (nodes.length === 0) return null;
  const box = rf.getNodesBounds(nodes);
  if (box.width <= 0 || box.height <= 0) return null;
  return { x: box.x, y: box.y, w: box.width, h: box.height };
}

function fitZoomFromFlow(rf: ReturnType<typeof useReactFlow>, pane: { width: number; height: number }): number {
  const box = flowContentBox(rf);
  if (!box || pane.width < 1 || pane.height < 1) return MIN_ZOOM;
  return getViewportForBounds(
    { x: box.x, y: box.y, width: box.w, height: box.h },
    pane.width,
    pane.height,
    MIN_ZOOM,
    MAX_ZOOM,
    FIRST_LAYOUT_FIT_PADDING,
  ).zoom;
}

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
): string {
  const parts = ["nopan"];
  if (departingId === id) parts.push("node-departing");
  if (interaction.kind === "remove-preview" && interaction.plan.nodeId === id) {
    parts.push("remove-candidate-on");
  }
  if (interaction.kind === "path-pull" && interaction.hoverTargetId === id) {
    parts.push("path-drop-target");
  }
  if (interaction.kind === "plus-pull" && interaction.sourceId === id) {
    parts.push("plus-pull-source");
  }
  if (interaction.kind === "tile-drag" && interaction.nodeId === id) {
    parts.push("tile-drag-origin-fade");
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
  const { zoom } = useViewport();
  const simplifyPrefs = useStore((s) => s.simplify);
  const boardOrientation = useStore((s) => s.boardOrientation);
  const [webFit, setWebFit] = useState(false);
  const lastZoomRef = useRef(zoom);
  const simplified = isSimplified(simplifyPrefs);
  useEffect(() => {
    lastZoomRef.current = zoom;
  }, [zoom]);
  const simplifyView = useMemo(
    () => ({ simplified, prefs: simplifyPrefs, zoom }),
    [simplified, simplifyPrefs, zoom],
  );
  const editing = !present;

  const projection = useMemo(() => projectLane(workflow, lane), [workflow, lane]);
  const layoutMode = simplified ? "web" : "tile";

  /* Condition-chip boxes are ELK label sizes (CX-05). Word-web omits chips. */
  const labelBoxes = useMemo(() => {
    if (simplified) return {} as Record<string, LabelBox>;
    const boxes: Record<string, LabelBox> = {};
    for (const e of projection.edges) {
      if (e.label.trim()) boxes[e.id] = measureLabelBox(e.label);
    }
    return boxes;
  }, [simplified, projection.edges]);

  const tileSizes = useMemo(() => {
    if (!simplified) return {} as TileSizes;
    const sizes: TileSizes = {};
    for (const n of projection.nodes) {
      sizes[n.id] = wordWebNodeSize(n);
    }
    return sizes;
  }, [simplified, projection]);

  const { layout, phase, error } = useLaneLayout(
    lane,
    projection,
    labelBoxes,
    tileSizes,
    layoutMode,
    boardOrientation,
  );
  const shown = useAnimatedLayout(layout);
  const viewLayout = shown;
  const display = viewLayout?.positions;
  const lastPos = useRef<Record<string, { x: number; y: number }>>({});
  if (display) lastPos.current = { ...lastPos.current, ...display };
  const hostRef = useRef<HTMLDivElement>(null);
  const shownRef = useRef(viewLayout);
  shownRef.current = viewLayout;

  const insertHover = interaction.kind === "tile-drag" ? interaction.hover : null;
  const dragNodeId = interaction.kind === "tile-drag" ? interaction.nodeId : null;
  const fadeInsertPath = useMemo(() => {
    if (!dragNodeId) return (_id: string) => false;
    const edgeList = [...workflow.edges, ...workflow.after.extraEdges];
    const incident = incidentPathIds(edgeList, dragNodeId);
    return (id: string) => incident.has(id);
  }, [dragNodeId, workflow.edges, workflow.after.extraEdges]);
  const reduceMotion =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const insertPreview = (() => {
    if (!insertHover || interaction.kind !== "tile-drag" || !shown) return null;
    const drag = findNode(workflow, interaction.nodeId);
    if (!drag) return null;
    const tile = tileSizes[interaction.nodeId] ?? nodeSize(drag.type);
    if (insertHover.kind === "path") {
      const edge = projection.edges.find(
        (e) => e.id === insertHover.edgeId || e.originId === insertHover.edgeId,
      );
      if (!edge) return null;
      const geom = insertPreviewGeom(shown, edge.id, tile);
      if (!geom) return null;
      return { geom, sourceId: edge.source, targetId: edge.target };
    }
    const geom = bundleInsertPreviewGeom(shown, insertHover.edgeIds, tile);
    if (!geom) return null;
    return insertHover.role === "split"
      ? { geom, sourceId: insertHover.hostId, targetId: null as string | null }
      : { geom, sourceId: null as string | null, targetId: insertHover.hostId };
  })();

  /* First nonempty layout: hold the board until ELK and the camera land, then
     fit once unless this lane already has a saved viewport. Empty New does not
     consume that fit (P-08). A sole Tile is centered at the current zoom so
     Add Step / Add Data is not stuck at the top left. After copies Before's
     camera instead of fitting independently (BA-05). */
  const nodeCount = projection.nodes.length;
  const layoutKey = layout?.key ?? "";
  const cameraApplied = useRef(false);
  const [boardReady, setBoardReady] = useState(nodeCount === 0);
  const covering = boardNeedsCover(nodeCount, boardReady);
  const prevOrientation = useRef(boardOrientation);
  useLayoutEffect(() => {
    if (prevOrientation.current === boardOrientation) return;
    prevOrientation.current = boardOrientation;
    cameraApplied.current = false;
    setBoardReady(false);
  }, [boardOrientation]);
  useLayoutEffect(() => {
    bindReactFlow(lane, rf);
    return () => bindReactFlow(lane, null);
  }, [rf, lane]);
  useLayoutEffect(() => {
    if (nodeCount === 0) {
      cameraApplied.current = false;
      setBoardReady(true);
      return;
    }
    if (cameraApplied.current) {
      setBoardReady(true);
      return;
    }
    if (!canApplyFirstLayoutCamera(phase, nodeCount)) {
      setBoardReady(false);
      return;
    }
    let raf = 0;
    let cancelled = false;
    const finish = (next?: { x: number; y: number; zoom: number }) => {
      if (!next) {
        cameraApplied.current = true;
        setBoardReady(true);
        return;
      }
      persistSharedViewport(next);
      if (sharesCompareCamera()) applyViewport(otherLane(lane), next);
      beginProgrammaticViewport(lane);
      void rf.setViewport(next, { duration: 0 }).finally(() => {
        endProgrammaticViewport(lane);
        if (cancelled) return;
        cameraApplied.current = true;
        setBoardReady(true);
      });
    };
    const attempt = () => {
      const follow = cameraToFollow(lane);
      if (follow) {
        finish(follow);
        return;
      }
      const paneEl = hostRef.current?.querySelector(".react-flow");
      const pane = paneEl instanceof HTMLElement ? paneEl.getBoundingClientRect() : null;
      if (!pane || pane.width < 1 || pane.height < 1) {
        raf = requestAnimationFrame(attempt);
        return;
      }
      if (firstLayoutCentersAtCurrentZoom(nodeCount)) {
        const box = layout?.bounds;
        if (!layoutBoundsAreUsable(box)) {
          raf = requestAnimationFrame(attempt);
          return;
        }
        const zoom = rf.getViewport().zoom || 1;
        finish(viewportToCenterRect(pane, box, zoom));
        return;
      }
      const sizes: Record<string, { w: number; h: number }> = {};
      for (const n of projection.nodes) {
        sizes[n.id] = tileSizes[n.id] ?? nodeSize(n.type);
      }
      const box = layout ? unionNodeBounds(layout.positions, sizes) : undefined;
      if (!layoutBoundsAreUsable(box)) {
        raf = requestAnimationFrame(attempt);
        return;
      }
      finish(viewportToFitRect(pane, box, FIRST_LAYOUT_FIT_PADDING, MIN_ZOOM, MAX_ZOOM));
    };
    attempt();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
    // layout.bounds is keyed by layoutKey; do not retrigger on animated `shown`.
  }, [phase, rf, lane, nodeCount, layoutKey]);

  /* Word-web camera: store the tile viewport on enter, fit the oval layout,
     restore on leave. After follows Before (BA-05). */
  const cameraSimplified = useRef(false);
  const drivesSimplifyCamera = !sharesCompareCamera() || lane === "before";
  useEffect(() => {
    const prev = cameraSimplified.current;
    if (simplified === prev) return;
    cameraSimplified.current = simplified;
    if (simplified && !prev) {
      rememberTileCamera(rf.getViewport());
      setWebFit(false);
      return;
    }
    if (!simplified && prev) {
      const stored = restoreTileCamera();
      setWebFit(false);
      if (stored && drivesSimplifyCamera) {
        applyViewport(lane, stored);
        persistSharedViewport(stored);
        if (sharesCompareCamera()) applyViewport(otherLane(lane), stored);
      }
    }
  }, [simplified, rf, lane, drivesSimplifyCamera]);

  useEffect(() => {
    if (!simplified || isWebFitted()) return;
    if (!drivesSimplifyCamera) return;
    if (phase !== "ready" || !layout || layoutKeyMode(layout.key) !== "web") return;
    if (!layoutBoundsAreUsable(layout.bounds)) return;
    let raf = 0;
    const attempt = () => {
      const paneEl = hostRef.current?.querySelector(".react-flow");
      const pane = paneEl instanceof HTMLElement ? paneEl.getBoundingClientRect() : null;
      if (!pane || pane.width < 1 || pane.height < 1) {
        raf = requestAnimationFrame(attempt);
        return;
      }
      const next = viewportToFitRect(pane, layout.bounds, FIRST_LAYOUT_FIT_PADDING, MIN_ZOOM, MAX_ZOOM);
      applyViewport(lane, next);
      persistSharedViewport(next);
      if (sharesCompareCamera()) applyViewport(otherLane(lane), next);
      markWebFitted();
      setWebFit(true);
    };
    raf = requestAnimationFrame(attempt);
    return () => cancelAnimationFrame(raf);
  }, [simplified, phase, layout, layoutKey, rf, lane, drivesSimplifyCamera]);

  useEffect(() => {
    if (!departing) return;
    const t = window.setTimeout(() => {
      useStore.getState().clearDeparting();
    }, 240);
    return () => window.clearTimeout(t);
  }, [departing]);

  useEffect(() => {
    const on = interaction.kind === "tile-drag";
    document.body.classList.toggle("is-tile-dragging", on);
    return () => document.body.classList.remove("is-tile-dragging");
  }, [interaction.kind]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const onWheel = (e: WheelEvent) => {
      if (laneIsTucked(lane)) return;
      if (e.ctrlKey) return;
      if (e.deltaY === 0) return;
      e.preventDefault();
      e.stopPropagation();
      const vp = rf.getViewport();
      const paneEl = host.querySelector(".react-flow");
      const pane = (paneEl instanceof HTMLElement ? paneEl : host).getBoundingClientRect();
      const fitZoom = fitZoomFromFlow(rf, pane);
      const nextZoom = clampWheelZoom(
        vp.zoom,
        vp.zoom * wheelZoomFactor(e.deltaY, e.deltaMode),
        fitZoom,
      );
      if (Math.abs(nextZoom - vp.zoom) < 1e-6) return;
      lastZoomRef.current = nextZoom;
      const flowPointer = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const bounds = shownRef.current?.bounds;
      const hasBounds = Boolean(bounds && bounds.w > 0 && bounds.h > 0);
      const toward =
        hasBounds &&
        bounds &&
        shouldZoomTowardBounds({
          zoomingIn: nextZoom > vp.zoom,
          pointerOverNodeOrPath: pointerOverNodeOrPath(e.target),
          pointerInPaddedBounds: pointInPaddedBounds(flowPointer, bounds, ZOOM_BOUNDS_PAD),
          graphIsland: graphIsIsland(bounds, vp.zoom, pane),
        });
      const flowFocal = toward && bounds
        ? { x: bounds.x + bounds.w / 2, y: bounds.y + bounds.h / 2 }
        : flowPointer;
      const screenFocal = toward
        ? rf.flowToScreenPosition(flowFocal)
        : { x: e.clientX, y: e.clientY };
      const next = viewportZoomAround({
        paneLeft: pane.left,
        paneTop: pane.top,
        clientX: screenFocal.x,
        clientY: screenFocal.y,
        flowX: flowFocal.x,
        flowY: flowFocal.y,
        nextZoom,
      });
      /* Copy onto the other stacked lane before marking this instance programmatic. */
      syncBothViewports(lane, next);
      applyViewport(lane, next);
      if (laneIsTucked(lane)) return;
      persistSharedViewport(next);
    };
    host.addEventListener("wheel", onWheel, { passive: false });
    return () => host.removeEventListener("wheel", onWheel);
  }, [rf, lane]);

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
    const shift =
      insertPreview && !reduceMotion
        ? n.id === insertPreview.sourceId
          ? insertPreview.geom.shiftS
          : n.id === insertPreview.targetId
            ? insertPreview.geom.shiftU
            : null
        : null;
    const easing = Boolean(shift && (shift.x !== 0 || shift.y !== 0));
    const nodeStyle: CSSProperties = {
      width: size.w,
      height: size.h,
      ...(easing && shift ? { translate: `${shift.x}px ${shift.y}px` } : {}),
    };
    return {
      id: n.id,
      type: reactFlowTypeFor(n.type),
      position: pos,
      data: {
        lane,
        node: n,
        projectedKind: n.projectedKind,
        originId: n.originId,
      },
      draggable: false,
      selectable: editing,
      selected: selected?.type === SelectionKind.Node && selected.id === n.id,
      className: `${nodeClassName(n.id, interaction, null)}${easing ? " is-insert-easing" : ""}`,
      width: size.w,
      height: size.h,
      measured: { width: size.w, height: size.h },
      style: nodeStyle,
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
  const visualEdges = projection.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    originId: e.originId,
    displayHop: false,
    dotted: pathIsDotted(workflow, e.originId),
  }));
  const laneEdges = visualEdges.map((e) => {
    const stretching = !e.displayHop && stretchIds.has(e.id);
    const isSelected =
      !e.displayHop && selected?.type === SelectionKind.Edge && selected.id === e.originId;
    const dotted = e.dotted;
    const insertHoverPath =
      !e.displayHop &&
      interaction.kind === "tile-drag" &&
      interaction.hover?.kind === "path" &&
      interaction.hover.edgeId === e.originId;
    const fadeIncident = Boolean(dragNodeId) && !e.displayHop && fadeInsertPath(e.id);
    const rfEdge: Edge<FlowPathData> = {
      id: e.id,
      source: e.source,
      target: e.target,
      type: ReactFlowEdgeKind.Flow,
      selectable:
        editing &&
        !e.displayHop &&
        interaction.kind !== "remove-preview" &&
        interaction.kind !== "tile-drag",
      selected: isSelected,
      className: [
        insertHoverPath ? "path-insert-hover" : undefined,
        fadeIncident ? "path-drag-incident" : undefined,
        dotted ? "is-path-dotted" : "is-path-solid",
        e.displayHop ? "is-display-hop" : undefined,
      ]
        .filter(Boolean)
        .join(" "),
      data:
        stretching && via
          ? { stretch: true, viaX: via.x, viaY: via.y, originId: e.originId, dotted, displayHop: e.displayHop }
          : { originId: e.originId, dotted, displayHop: e.displayHop },
    };
    return { rfEdge, isSelected, dotted };
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
    if (s.interaction.kind === "remove-preview") return;
    s.select({ type: SelectionKind.Node, id: n.id });
    blurDetailsFocus();
  }, [lane]);

  const panTarget = view === ViewMode.Both && focusedLane === lane;
  const contextValue = useMemo(() => ({ layout: viewLayout }), [viewLayout]);

  return (
    <div
      ref={hostRef}
      className="board-lane"
      data-layout={phase}
      data-board={covering ? "loading" : "ready"}
      data-layout-error={error ? "true" : undefined}
      data-orientation={boardOrientation}
      data-board-orientation={boardOrientation}
      aria-busy={covering || undefined}
      data-insert-preview={insertHover ? "true" : undefined}
      data-insert-kind={insertHover?.kind}
      data-insert-bundle={insertHover?.kind === "bundle" ? insertHover.role : undefined}
      data-tile-drag={dragNodeId ? "true" : undefined}
      data-editable={editing && view !== ViewMode.Both ? "true" : undefined}
      data-lane={lane}
      data-simplified={simplified ? "true" : "false"}
      data-web-fit={webFit ? "true" : undefined}
      data-layout-mode={layoutMode}
      data-pan-target={panTarget ? "true" : "false"}
      aria-label={lane === "after" ? "After lane" : "Before lane"}
      style={{ height: height ?? "100%" }}
      onPointerDown={() => useStore.getState().setFocusedLane(lane)}
    >
      <SimplifyContext.Provider value={simplifyView}>
      <LaneLayoutContext.Provider value={contextValue}>
        <ReactFlow
          nodes={rfNodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          nodesConnectable={false}
          nodesFocusable={editing}
          edgesFocusable={editing}
          deleteKeyCode={null}
          elementsSelectable={editing}
          nodesDraggable={false}
          panOnDrag
          selectionOnDrag={false}
          selectNodesOnDrag={false}
          zoomOnScroll={false}
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
            if (laneIsTucked(lane)) return;
            const prevZoom = lastZoomRef.current;
            lastZoomRef.current = viewport.zoom;
            const paneEl = hostRef.current?.querySelector(".react-flow");
            const pane = paneEl instanceof HTMLElement ? paneEl.getBoundingClientRect() : null;
            if (pane && viewport.zoom < prevZoom - 1e-4) {
              const fitZoom = fitZoomFromFlow(rf, pane);
              const nextZoom = clampWheelZoom(prevZoom, viewport.zoom, fitZoom);
              if (Math.abs(nextZoom - viewport.zoom) > 1e-4) {
                const next = { ...viewport, zoom: nextZoom };
                lastZoomRef.current = nextZoom;
                applyViewport(lane, next);
                syncBothViewports(lane, next);
                return;
              }
            }
            syncBothViewports(lane, viewport);
          }}
          onMoveEnd={(_, viewport) => {
            if (isProgrammaticViewport(lane)) return;
            if (laneIsTucked(lane)) return;
            persistSharedViewport(viewport);
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
          onNodeContextMenu={(event, n) => {
            event.preventDefault();
            event.stopPropagation();
            const s = useStore.getState();
            s.setFocusedLane(lane);
            if (!s.canvasEditable()) return;
            if (!s.rightClickDelete) return;
            if (
              s.interaction.kind === "remove-preview" ||
              s.interaction.kind === "tile-drag" ||
              s.interaction.kind === "plus-pull" ||
              s.interaction.kind === "path-pull"
            ) {
              return;
            }
            s.removeTarget(n.id);
          }}
          onEdgeClick={(_, e) => {
            const s = useStore.getState();
            s.setFocusedLane(lane);
            if (s.present) return;
            if (s.interaction.kind === "remove-preview" || s.interaction.kind === "tile-drag") {
              return;
            }
            const data = e.data as FlowPathData | undefined;
            if (data?.displayHop) return;
            const originId = data?.originId;
            s.select({ type: SelectionKind.Edge, id: typeof originId === "string" ? originId : e.id });
            blurDetailsFocus();
          }}
          onEdgeContextMenu={(event, e) => {
            event.preventDefault();
            event.stopPropagation();
            const s = useStore.getState();
            s.setFocusedLane(lane);
            if (!s.canvasEditable()) return;
            if (s.interaction.kind === "remove-preview" || s.interaction.kind === "tile-drag") {
              return;
            }
            const data = e.data as FlowPathData | undefined;
            if (data?.displayHop) return;
            const originId = data?.originId;
            const id = typeof originId === "string" ? originId : e.id;
            s.openPathMenu(id, event.clientX, event.clientY);
          }}
          onEdgeDoubleClick={(_, e) => {
            const s = useStore.getState();
            s.setFocusedLane(lane);
            if (!s.canvasEditable()) return;
            const data = e.data as FlowPathData | undefined;
            if (data?.displayHop) return;
            const originId = data?.originId;
            const id = typeof originId === "string" ? originId : e.id;
            s.select({ type: SelectionKind.Edge, id });
            s.toggleSelectedDash();
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
      </SimplifyContext.Provider>
      {covering ? (
        <div className="board-loading" role="status">
          Loading...
        </div>
      ) : null}
    </div>
  );
}

export function Board({ lane, height }: { lane: Lane; height?: string }) {
  const epoch = useStore((s) => s.canvasEpoch);
  return (
    <ReactFlowProvider key={String(epoch)}>
      <Inner lane={lane} height={height} />
    </ReactFlowProvider>
  );
}
