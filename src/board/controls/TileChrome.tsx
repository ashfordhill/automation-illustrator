/**
 * Selected-tile chrome: stretchy + tab (Step / Data), Path-pull knot, and X.
 * Pointer capture stays on the tabs so tile pickup and pan do not steal the gesture.
 */
import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useReactFlow, ViewportPortal } from "@xyflow/react";
import { IconX } from "@tabler/icons-react";
import { ViewMode, WorkflowNodeKind } from "../../workflow/catalogs";
import { useStore } from "../../state/store";
import { findNode } from "../../workflow/selectors";
import { nodeCaption } from "../../workflow/types";
import { useLaneLayoutContext } from "../routing/LaneLayoutContext";
import { hitPathId } from "../layout/pathHit";
import { insertPreviewGeom } from "../layout/insertPreview";
import { nodeSize } from "../layout/tileMetrics";
import { PathKnotIcon } from "./PathKnotIcon";
import { DataChip } from "../tiles/DataChip";

const PULL_THRESHOLD = 36;
const SPRING_MS = 520;
const PREVIEW_RADIUS = 118;
const PREVIEW_OUT = 28;
const PREVIEW_SPREAD = 56;
const PREVIEW_W = 92;
const PREVIEW_H = 88;

type TileRect = { x: number; y: number; w: number; h: number };

function previewCenters(restX: number, restY: number, count: number): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i += 1) {
    const angle = count === 1 ? 0 : -PREVIEW_SPREAD / 2 + (i * PREVIEW_SPREAD) / Math.max(1, count - 1);
    const rad = (angle * Math.PI) / 180;
    out.push({
      x: restX + PREVIEW_OUT + Math.cos(rad) * PREVIEW_RADIUS,
      y: restY + Math.sin(rad) * PREVIEW_RADIUS,
    });
  }
  return out;
}

function clusterBox(centers: { x: number; y: number }[]): TileRect {
  const left = Math.min(...centers.map((c) => c.x)) - PREVIEW_W / 2;
  const right = Math.max(...centers.map((c) => c.x)) + PREVIEW_W / 2;
  const top = Math.min(...centers.map((c) => c.y)) - PREVIEW_H / 2;
  const bottom = Math.max(...centers.map((c) => c.y)) + PREVIEW_H / 2;
  return { x: left, y: top, w: right - left, h: bottom - top };
}

/** Trapezoid from the source tile's right edge to the preview cluster (WG-07). */
function wedgePath(tile: TileRect, cluster: TileRect): string {
  const x0 = tile.x + tile.w;
  const y0a = tile.y;
  const y0b = tile.y + tile.h;
  const x1 = cluster.x;
  const y1a = cluster.y;
  const y1b = cluster.y + cluster.h;
  return `M ${x0} ${y0a} L ${x1} ${y1a} L ${x1} ${y1b} L ${x0} ${y0b} Z`;
}

function nodeScreenRect(nodeId: string): TileRect | null {
  const el = document.querySelector(`.react-flow__node[data-id="${CSS.escape(nodeId)}"]`);
  if (!(el instanceof HTMLElement)) return null;
  const b = el.getBoundingClientRect();
  return { x: b.left, y: b.top, w: b.width, h: b.height };
}

function reducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function PlusPreview({
  kind,
  label,
  hovering,
  style,
}: {
  kind: "step" | "data";
  label: string;
  hovering: boolean;
  style: CSSProperties;
}) {
  return (
    <button
      type="button"
      data-plus-preview={kind}
      aria-label={label}
      className={`plus-preview${hovering ? " is-hover" : ""}`}
      style={style}
    >
      <span className={`plus-preview-thumb is-${kind}`} aria-hidden>
        {kind === "step" ? (
          <>
            <span className="plus-preview-who" />
            <span className="plus-preview-task" />
          </>
        ) : (
          <DataChip />
        )}
      </span>
      <span className="plus-preview-name">{kind === "step" ? "Step" : "Data"}</span>
    </button>
  );
}

export function TileChrome({
  id,
  selected,
  departing,
  children,
}: {
  id: string;
  selected: boolean;
  departing?: boolean;
  children: React.ReactNode;
}) {
  const present = useStore((s) => s.present);
  const view = useStore((s) => s.view);
  const interaction = useStore((s) => s.interaction);
  const workflow = useStore((s) => s.workflow);
  const editing = !present && view !== ViewMode.Both && !departing;
  const showChrome =
    editing &&
    selected &&
    interaction.kind !== "remove-preview";
  const caption = nodeCaption(findNode(workflow, id), id);
  const tabPulling =
    (interaction.kind === "plus-pull" && interaction.sourceId === id) ||
    (interaction.kind === "path-pull" && interaction.sourceId === id);
  const pulling =
    tabPulling || (interaction.kind === "tile-drag" && interaction.nodeId === id);

  return (
    <div
      className={`tile-chrome-host${pulling ? " is-pulling" : ""}`}
      style={{ position: "relative", width: "100%", height: "100%", overflow: "visible" }}
    >
      <TilePickup id={id} selected={!!selected && editing} disabled={!editing || !selected || tabPulling}>
        {children}
      </TilePickup>
      {interaction.kind === "tile-drag" && interaction.nodeId === id ? <InsertSilhouette nodeId={id} /> : null}
      {showChrome ? (
        <>
          <PlusPullTab nodeId={id} />
          <PathPullTab nodeId={id} />
          <button
            type="button"
            className="node-remove-x-btn tile-remove-x"
            aria-label={`Remove ${caption}`}
            title={`Remove ${caption}`}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              useStore.getState().removeTarget(id);
            }}
          >
            <IconX size={20} stroke={2.6} aria-hidden />
          </button>
        </>
      ) : null}
    </div>
  );
}

function PlusPullTab({ nodeId }: { nodeId: string }) {
  const view = useStore((s) => s.view);
  const interaction = useStore((s) => s.interaction);
  const restRef = useRef<HTMLButtonElement>(null);
  const [drag, setDrag] = useState<{
    x: number;
    y: number;
    restX: number;
    restY: number;
    hovering: "step" | "data" | null;
    live: boolean;
    tile: TileRect;
  } | null>(null);
  const items = view === ViewMode.After ? (["step"] as const) : (["step", "data"] as const);
  const stretched = drag
    ? Math.hypot(drag.x - drag.restX, drag.y - drag.restY) >= PULL_THRESHOLD
    : false;
  const showFan = stretched || Boolean(drag?.live && reducedMotion());

  useEffect(() => {
    if (interaction.kind === "path-pull" || interaction.kind === "tile-drag") setDrag(null);
  }, [interaction.kind]);

  const finish = (next: typeof drag, spawn: "step" | "data" | null) => {
    if (spawn === "step") {
      useStore.getState().spawnBranch(nodeId, WorkflowNodeKind.Step);
    } else if (spawn === "data") {
      useStore.getState().spawnBranch(nodeId, WorkflowNodeKind.DataField);
    }
    useStore.getState().closeBoardModes();
    if (!spawn && next && !reducedMotion()) {
      setDrag({ ...next, live: false, hovering: null });
      window.setTimeout(() => setDrag(null), SPRING_MS);
    } else {
      setDrag(null);
    }
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const rest = restRef.current?.getBoundingClientRect();
    if (!rest) return;
    const restX = rest.left + rest.width / 2;
    const restY = rest.top + rest.height / 2;
    const tile = nodeScreenRect(nodeId) ?? {
      x: rest.right - 160,
      y: rest.top - 8,
      w: 160,
      h: 96,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    useStore.getState().beginPlusPull(nodeId);
    setDrag({ x: e.clientX, y: e.clientY, restX, restY, hovering: null, live: true, tile });
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!drag?.live) return;
    e.stopPropagation();
    let hovering: "step" | "data" | null = null;
    const dist = Math.hypot(e.clientX - drag.restX, e.clientY - drag.restY);
    if (dist >= PULL_THRESHOLD) {
      const hit = document
        .elementFromPoint(e.clientX, e.clientY)
        ?.closest("[data-plus-preview]") as HTMLElement | null;
      const kind = hit?.dataset.plusPreview;
      if (kind === "step" || kind === "data") hovering = kind;
    }
    setDrag({ ...drag, x: e.clientX, y: e.clientY, hovering, tile: nodeScreenRect(nodeId) ?? drag.tile });
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!drag?.live) return;
    e.stopPropagation();
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    const dist = Math.hypot(e.clientX - drag.restX, e.clientY - drag.restY);
    const spawn = dist >= PULL_THRESHOLD ? drag.hovering : null;
    finish({ ...drag, x: e.clientX, y: e.clientY, live: false }, spawn);
  };

  const tabX = drag?.live ? drag.x : drag ? drag.restX : 0;
  const tabY = drag?.live ? drag.y : drag ? drag.restY : 0;
  const centers = drag ? previewCenters(drag.restX, drag.restY, items.length) : [];
  const cluster = centers.length ? clusterBox(centers) : null;
  const overlay =
    drag && typeof document !== "undefined"
      ? createPortal(
          <div className="plus-pull-layer" aria-hidden={!showFan}>
            {showFan ? (
              <svg className="plus-scrim-svg" width="100%" height="100%">
                <defs>
                  <mask id={`plus-pull-hole-${nodeId}`}>
                    <rect width="100%" height="100%" fill="white" />
                    <rect
                      x={drag.tile.x}
                      y={drag.tile.y}
                      width={drag.tile.w}
                      height={drag.tile.h}
                      rx="14"
                      fill="black"
                    />
                  </mask>
                </defs>
                <rect
                  className="plus-pull-scrim-fill"
                  width="100%"
                  height="100%"
                  mask={`url(#plus-pull-hole-${nodeId})`}
                  data-plus-scrim="true"
                />
                {cluster ? (
                  <path className="plus-wedge" data-plus-wedge="true" d={wedgePath(drag.tile, cluster)} />
                ) : null}
              </svg>
            ) : null}
            {showFan
              ? items.map((kind, i) => {
                  const pos = centers[i]!;
                  return (
                    <PlusPreview
                      key={kind}
                      kind={kind}
                      label={kind === "step" ? (view === ViewMode.After ? "After-only Step" : "New Step") : "New Data"}
                      hovering={drag.hovering === kind}
                      style={{ left: pos.x, top: pos.y }}
                    />
                  );
                })
              : null}
            {drag.live ? (
              <div className="plus-tab-ghost" style={{ left: tabX, top: tabY }}>
                +
              </div>
            ) : null}
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={restRef}
        type="button"
        className={`plus-tab${drag?.live ? " is-hidden-rest" : ""}`}
        aria-label={view === ViewMode.After ? "Add After-only Step" : "Add Step or Data"}
        title={view === ViewMode.After ? "Pull to add an After-only Step" : "Pull onto Step or Data"}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={(e) => e.stopPropagation()}
      >
        +
      </button>
      {overlay}
    </>
  );
}

function PathPullTab({ nodeId }: { nodeId: string }) {
  const restRef = useRef<HTMLButtonElement>(null);
  const interaction = useStore((s) => s.interaction);
  const [drag, setDrag] = useState<{
    x: number;
    y: number;
    restX: number;
    restY: number;
    live: boolean;
  } | null>(null);

  useEffect(() => {
    if (interaction.kind === "plus-pull" || interaction.kind === "tile-drag") setDrag(null);
  }, [interaction.kind]);

  const targetIdAt = (x: number, y: number) => {
    const el = document.elementFromPoint(x, y);
    const node = el?.closest(".react-flow__node") as HTMLElement | null;
    const hid = node?.getAttribute("data-id");
    if (!hid || hid === nodeId) return null;
    return hid;
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const rest = restRef.current?.getBoundingClientRect();
    if (!rest) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    useStore.getState().beginPathPull(nodeId);
    setDrag({
      x: e.clientX,
      y: e.clientY,
      restX: rest.left + rest.width / 2,
      restY: rest.top + rest.height / 2,
      live: true,
    });
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!drag?.live) return;
    e.stopPropagation();
    const hover = targetIdAt(e.clientX, e.clientY);
    useStore.getState().setPathPullHover(hover);
    setDrag({ ...drag, x: e.clientX, y: e.clientY });
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!drag?.live) return;
    e.stopPropagation();
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    const hover = targetIdAt(e.clientX, e.clientY);
    if (hover) useStore.getState().completePathPull(hover);
    else useStore.getState().closeBoardModes();
    if (!hover && !reducedMotion()) {
      setDrag({ ...drag, live: false, x: e.clientX, y: e.clientY });
      window.setTimeout(() => setDrag(null), SPRING_MS);
    } else {
      setDrag(null);
    }
  };

  const endX = drag?.live ? drag.x : drag?.restX ?? 0;
  const endY = drag?.live ? drag.y : drag?.restY ?? 0;
  const overlay =
    drag && typeof document !== "undefined"
      ? createPortal(
          <div className="path-pull-layer">
            <svg className="plus-taffy" width="100%" height="100%">
              <path
                d={`M ${drag.restX} ${drag.restY} Q ${(drag.restX + endX) / 2 + 24} ${(drag.restY + endY) / 2} ${endX} ${endY}`}
                fill="none"
                stroke="var(--ink)"
                strokeWidth={4}
                strokeLinecap="round"
                strokeDasharray="10 7"
              />
            </svg>
            {drag.live ? (
              <div className="path-tab-ghost" style={{ left: endX, top: endY }}>
                <PathKnotIcon size={20} />
              </div>
            ) : null}
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={restRef}
        type="button"
        className={`path-tab${drag?.live ? " is-hidden-rest" : ""}`}
        aria-label="Pull a Path to an existing Node"
        title="Pull a Path onto another Step or Data"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={(e) => e.stopPropagation()}
      >
        <PathKnotIcon size={20} />
      </button>
      {overlay}
    </>
  );
}

function InsertSilhouette({ nodeId }: { nodeId: string }) {
  const { layout } = useLaneLayoutContext();
  const hoverEdgeId = useStore((s) =>
    s.interaction.kind === "tile-drag" && s.interaction.nodeId === nodeId
      ? s.interaction.hoverEdgeId
      : null,
  );
  const workflow = useStore((s) => s.workflow);
  if (!hoverEdgeId || !layout) return null;
  const node = findNode(workflow, nodeId);
  if (!node) return null;
  const geom = insertPreviewGeom(layout, hoverEdgeId, nodeSize(node.type));
  if (!geom) return null;
  return (
    <ViewportPortal>
      <div
        className="tile-insert-silhouette"
        data-insert-silhouette="true"
        aria-hidden
        style={{
          position: "absolute",
          left: geom.gap.x,
          top: geom.gap.y,
          width: geom.gap.w,
          height: geom.gap.h,
          pointerEvents: "none",
        }}
      />
    </ViewportPortal>
  );
}

function TilePickup({
  id,
  selected,
  disabled,
  children,
}: {
  id: string;
  selected: boolean;
  disabled: boolean;
  children: React.ReactNode;
}) {
  const rf = useReactFlow();
  const { layout } = useLaneLayoutContext();
  const view = useStore((s) => s.view);
  const hostRef = useRef<HTMLDivElement>(null);
  const [ghost, setGhost] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const dragging = useRef(false);

  useEffect(() => {
    if (disabled) {
      dragging.current = false;
      origin.current = null;
      setGhost(null);
    }
  }, [disabled]);

  const skipEdge = (edgeId: string) => {
    const doc = useStore.getState().workflow;
    const e = doc.edges.find((x) => x.id === edgeId) ?? doc.after.extraEdges.find((x) => x.id === edgeId);
    if (!e) return true;
    return e.source === id || e.target === id;
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled || !selected || e.button !== 0) return;
    if ((e.target as HTMLElement).closest("button, a, input, textarea")) return;
    origin.current = { x: e.clientX, y: e.clientY };
    dragging.current = false;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!origin.current) return;
    const dist = Math.hypot(e.clientX - origin.current.x, e.clientY - origin.current.y);
    if (!dragging.current && dist < 10) return;
    if (!dragging.current) {
      dragging.current = true;
      useStore.getState().beginTileDrag(id);
      const box = hostRef.current?.getBoundingClientRect();
      setGhost({ x: e.clientX, y: e.clientY, w: box?.width ?? 160, h: box?.height ?? 96 });
    }
    const flow = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY });
    const hover = view === ViewMode.Before ? hitPathId(layout, flow, skipEdge) : null;
    useStore.getState().setTileDragHover(hover);
    setGhost((g) => (g ? { ...g, x: e.clientX, y: e.clientY } : g));
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    origin.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    if (dragging.current) {
      const s = useStore.getState();
      if (s.interaction.kind === "tile-drag" && s.interaction.hoverEdgeId) {
        s.insertOnPath(id, s.interaction.hoverEdgeId);
      } else {
        s.closeBoardModes();
      }
    }
    dragging.current = false;
    setGhost(null);
  };

  const layer =
    ghost && typeof document !== "undefined"
      ? createPortal(
          <div
            className="tile-drag-ghost"
            style={{
              left: ghost.x,
              top: ghost.y,
              width: ghost.w,
              height: ghost.h,
            }}
          />,
          document.body,
        )
      : null;

  return (
    <div
      ref={hostRef}
      className="tile-pickup"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {children}
      {layer}
    </div>
  );
}
