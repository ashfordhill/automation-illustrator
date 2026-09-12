/**
 * Hover/selected-tile chrome: stretchy + tab (Step / Data), Path-pull tracks, and X (CX-01).
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
import type { InsertHover } from "../../state/interaction";
import { bundleInsertPreviewGeom, insertPreviewGeom } from "../layout/insertPreview";
import { bundleTrunkPolyline, hitInsertTarget, incidentPathIds } from "../layout/pathHit";
import { FIELD_RX, STEP_RX, nodeRadius, nodeSize } from "../layout/tileMetrics";
import { polylineToSvg } from "../routing/polyline";
import { PathKnotIcon } from "./PathKnotIcon";
import { DataChip } from "../tiles/DataChip";
import { plusPreviewKinds, previewCenters } from "./plusPreviewLayout";
import { fallbackTileRect, scaleCornerRadius, type TileRect } from "./tileOverlay";
import type { BoardOrientation } from "../flow/flowProfile";

const PULL_THRESHOLD = 36;
const SPRING_MS = 200;
/** Outside pad so ~3px of solid `--line` remains after antialiasing (matches tile/tab borders). */
const TAFFY_BORDER = 5;

type TaffyRibbon = { fill: string; outline: string };

/** Capsule taffy from an origin under the tile face to the pointer (round caps, no tile-edge cut). */
function taffyRibbon(x0: number, y0: number, x1: number, y1: number): TaffyRibbon {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.max(1, Math.hypot(dx, dy));
  const ux = dx / len;
  const uy = dy / len;
  const px = -uy;
  const py = ux;
  const r0 = 16;
  const r1 = Math.max(10, 18 - len * 0.04);
  const bulge = Math.min(22, len * 0.18);
  const mx = (x0 + x1) / 2 + px * bulge;
  const my = (y0 + y1) / 2 + py * bulge;
  const capsule = (pad: number) => {
    const a = r0 + pad;
    const b = r1 + pad;
    const a0x = x0 + px * a;
    const a0y = y0 + py * a;
    const b0x = x0 - px * a;
    const b0y = y0 - py * a;
    const a1x = x1 + px * b;
    const a1y = y1 + py * b;
    const b1x = x1 - px * b;
    const b1y = y1 - py * b;
    const topC = `${mx + px * a} ${my + py * a}`;
    const botC = `${mx - px * a} ${my - py * a}`;
    return `M ${a0x} ${a0y} Q ${topC} ${a1x} ${a1y} A ${b} ${b} 0 0 1 ${b1x} ${b1y} Q ${botC} ${b0x} ${b0y} A ${a} ${a} 0 0 1 ${a0x} ${a0y} Z`;
  };
  return {
    fill: capsule(0),
    outline: capsule(TAFFY_BORDER),
  };
}

function nodeScreenRect(nodeId: string): TileRect | null {
  const el = document.querySelector(
    `.react-flow__node[data-id="${CSS.escape(nodeId)}"] .board-node`,
  );
  if (!(el instanceof HTMLElement)) return null;
  const b = el.getBoundingClientRect();
  const cssRx = Number.parseFloat(getComputedStyle(el).borderTopLeftRadius);
  const fallback = el.classList.contains("field-piece") ? FIELD_RX : STEP_RX;
  const layoutRx = Number.isFinite(cssRx) && cssRx > 0 ? cssRx : fallback;
  const rx = scaleCornerRadius(layoutRx, el.offsetWidth, b.width);
  return { x: b.left, y: b.top, w: b.width, h: b.height, rx };
}

function overlayTileRect(nodeId: string, rest: { right: number; top: number }): TileRect {
  const node = findNode(useStore.getState().workflow, nodeId);
  return nodeScreenRect(nodeId) ?? fallbackTileRect(rest, node?.type);
}

function underTileOrigin(
  tile: TileRect,
  restX: number,
  restY: number,
  inbound: boolean,
  orientation: BoardOrientation,
): { x: number; y: number } {
  if (orientation === "vertical") {
    return {
      x: Math.min(Math.max(restX, tile.x + tile.rx + 8), tile.x + tile.w - tile.rx - 8),
      y: inbound ? tile.y + 22 : tile.y + tile.h - 22,
    };
  }
  return {
    x: inbound ? tile.x + 22 : tile.x + tile.w - 22,
    y: Math.min(Math.max(restY, tile.y + tile.rx + 8), tile.y + tile.h - tile.rx - 8),
  };
}

/** Same hole for the plus-pull scrim and taffy/Path exit — uses this tile’s screen-space rx, never Step’s 14. */
function TileExitMask({ id, tile }: { id: string; tile: TileRect }) {
  return (
    <mask id={id} maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse">
      <rect width="100%" height="100%" fill="white" />
      <rect
        data-tile-hole="true"
        x={tile.x}
        y={tile.y}
        width={tile.w}
        height={tile.h}
        rx={tile.rx}
        fill="black"
      />
    </mask>
  );
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
  const tabPulling =
    (interaction.kind === "plus-pull" && interaction.sourceId === id) ||
    (interaction.kind === "path-pull" && interaction.sourceId === id);
  const pulling =
    tabPulling || (interaction.kind === "tile-drag" && interaction.nodeId === id);
  const showChrome = editing && interaction.kind !== "remove-preview";
  const caption = nodeCaption(findNode(workflow, id), id);

  return (
    <div
      className={`tile-chrome-host${pulling ? " is-pulling" : ""}${selected && editing ? " is-selected" : ""}`}
      style={{ position: "relative", width: "100%", height: "100%", overflow: "visible" }}
    >
      <TilePickup id={id} disabled={!editing || tabPulling}>
        {children}
      </TilePickup>
      {interaction.kind === "tile-drag" && interaction.nodeId === id ? <InsertSilhouette nodeId={id} /> : null}
      {showChrome ? (
        <div className="tile-chrome-actions">
          <div className="tile-side-tabs is-out">
            <PathPullTab nodeId={id} inbound={false} />
            <PlusPullTab nodeId={id} inbound={false} />
          </div>
          <div className="tile-side-tabs is-in">
            <PathPullTab nodeId={id} inbound />
            <PlusPullTab nodeId={id} inbound />
          </div>
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
        </div>
      ) : null}
    </div>
  );
}

function PlusPullTab({ nodeId, inbound }: { nodeId: string; inbound: boolean }) {
  const interaction = useStore((s) => s.interaction);
  const orientation = useStore((s) => s.boardOrientation);
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
  const items = plusPreviewKinds(orientation);
  const stretched = drag
    ? Math.hypot(drag.x - drag.restX, drag.y - drag.restY) >= PULL_THRESHOLD
    : false;
  const showFan = Boolean(drag?.live && (stretched || reducedMotion()));

  useEffect(() => {
    if (interaction.kind === "path-pull" || interaction.kind === "tile-drag") setDrag(null);
  }, [interaction.kind]);

  const finish = (spawn: "step" | "data" | null) => {
    if (spawn === "step") {
      useStore.getState().spawnBranch(nodeId, WorkflowNodeKind.Step, inbound ? "in" : "out");
    } else if (spawn === "data") {
      useStore.getState().spawnBranch(nodeId, WorkflowNodeKind.DataField, inbound ? "in" : "out");
    }
    useStore.getState().closeBoardModes();
    setDrag(null);
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const rest = restRef.current?.getBoundingClientRect();
    if (!rest) return;
    const restX = rest.left + rest.width / 2;
    const restY = rest.top + rest.height / 2;
    const tile = overlayTileRect(nodeId, rest);
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
    finish(spawn);
  };

  const tabX = drag?.live ? drag.x : drag ? drag.restX : 0;
  const tabY = drag?.live ? drag.y : drag ? drag.restY : 0;
  const centers = drag ? previewCenters(drag.restX, drag.restY, items.length, inbound, orientation) : [];
  const plusOrigin = drag
    ? underTileOrigin(drag.tile, drag.restX, drag.restY, inbound, orientation)
    : { x: 0, y: 0 };
  const ribbon = drag ? taffyRibbon(plusOrigin.x, plusOrigin.y, tabX, tabY) : null;
  const overlay =
    drag && typeof document !== "undefined"
      ? createPortal(
          <div className="plus-pull-layer" aria-hidden={!showFan}>
            {showFan ? (
              <svg className="plus-scrim-svg" width="100%" height="100%">
                <defs>
                  <TileExitMask id={`plus-pull-hole-${nodeId}`} tile={drag.tile} />
                </defs>
                <rect
                  className="plus-pull-scrim-fill"
                  width="100%"
                  height="100%"
                  mask={`url(#plus-pull-hole-${nodeId})`}
                  data-plus-scrim="true"
                />
              </svg>
            ) : null}
            {drag.live && ribbon ? (
              <svg className="plus-taffy" width="100%" height="100%" overflow="visible">
                <defs>
                  <TileExitMask id={`plus-taffy-exit-${nodeId}`} tile={drag.tile} />
                </defs>
                <g mask={`url(#plus-taffy-exit-${nodeId})`}>
                  <path
                    data-plus-taffy-stroke="true"
                    d={ribbon.outline}
                    fill="var(--line)"
                  />
                  <path
                    data-plus-taffy="true"
                    d={ribbon.fill}
                    fill="var(--plus)"
                  />
                </g>
              </svg>
            ) : null}
            {showFan
              ? items.map((kind, i) => {
                  const pos = centers[i]!;
                  return (
                    <PlusPreview
                      key={kind}
                      kind={kind}
                      label={kind === "step" ? "New Step" : "New Data"}
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
        aria-label={inbound ? "Add left Step or Data" : "Add Step or Data"}
        title={inbound ? "Pull left onto Step or Data" : "Pull onto Step or Data"}
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

function PathPullTab({ nodeId, inbound }: { nodeId: string; inbound: boolean }) {
  const restRef = useRef<HTMLButtonElement>(null);
  const interaction = useStore((s) => s.interaction);
  const orientation = useStore((s) => s.boardOrientation);
  const [drag, setDrag] = useState<{
    x: number;
    y: number;
    restX: number;
    restY: number;
    live: boolean;
    tile: TileRect;
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
    const tile = overlayTileRect(nodeId, rest);
    e.currentTarget.setPointerCapture(e.pointerId);
    useStore.getState().beginPathPull(nodeId, inbound);
    setDrag({
      x: e.clientX,
      y: e.clientY,
      restX: rest.left + rest.width / 2,
      restY: rest.top + rest.height / 2,
      live: true,
      tile,
    });
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!drag?.live) return;
    e.stopPropagation();
    const hover = targetIdAt(e.clientX, e.clientY);
    useStore.getState().setPathPullHover(hover);
    setDrag({ ...drag, x: e.clientX, y: e.clientY, tile: nodeScreenRect(nodeId) ?? drag.tile });
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
  const pathOrigin = drag
    ? underTileOrigin(drag.tile, drag.restX, drag.restY, inbound, orientation)
    : { x: 0, y: 0 };
  const pathMid = (() => {
    const dx = endX - pathOrigin.x;
    const dy = endY - pathOrigin.y;
    const len = Math.max(1, Math.hypot(dx, dy));
    const px = -dy / len;
    const py = dx / len;
    const bulge = Math.min(16, len * 0.12);
    return { x: (pathOrigin.x + endX) / 2 + px * bulge, y: (pathOrigin.y + endY) / 2 + py * bulge };
  })();
  const overlay =
    drag && typeof document !== "undefined"
      ? createPortal(
          <div className="path-pull-layer">
            <svg className="plus-taffy" width="100%" height="100%">
              <defs>
                <TileExitMask id={`path-pull-exit-${nodeId}`} tile={drag.tile} />
              </defs>
              <path
                d={`M ${pathOrigin.x} ${pathOrigin.y} Q ${pathMid.x} ${pathMid.y} ${endX} ${endY}`}
                fill="none"
                stroke="var(--ink)"
                strokeWidth={4}
                strokeLinecap="round"
                strokeDasharray="10 7"
                mask={`url(#path-pull-exit-${nodeId})`}
              />
            </svg>
            {drag.live ? (
              <div className="path-tab-ghost" style={{ left: endX, top: endY }}>
                <PathKnotIcon size={22} />
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
        aria-label={
          inbound ? "Pull a Path from an existing Node" : "Pull a Path to an existing Node"
        }
        title={
          inbound
            ? "Pull a Path from another Step or Data"
            : "Pull a Path onto another Step or Data"
        }
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={(e) => e.stopPropagation()}
      >
        <PathKnotIcon size={22} />
      </button>
      {overlay}
    </>
  );
}

function previewGeom(
  layout: NonNullable<ReturnType<typeof useLaneLayoutContext>["layout"]>,
  hover: InsertHover,
  tile: { w: number; h: number },
) {
  return hover.kind === "path"
    ? insertPreviewGeom(layout, hover.edgeId, tile)
    : bundleInsertPreviewGeom(layout, hover.edgeIds, tile);
}

function InsertSilhouette({ nodeId }: { nodeId: string }) {
  const { layout } = useLaneLayoutContext();
  const hover = useStore((s) =>
    s.interaction.kind === "tile-drag" && s.interaction.nodeId === nodeId
      ? s.interaction.hover
      : null,
  );
  const workflow = useStore((s) => s.workflow);
  if (!hover || !layout) return null;
  const node = findNode(workflow, nodeId);
  if (!node) return null;
  const geom = previewGeom(layout, hover, nodeSize(node.type));
  if (!geom) return null;
  const bundleRoutes =
    hover.kind === "bundle"
      ? hover.edgeIds
          .map((id) => layout.routes[id])
          .filter((r): r is NonNullable<(typeof layout.routes)[string]> => Boolean(r && r.length >= 2))
      : [];
  const band = hover.kind === "bundle" ? bundleTrunkPolyline(bundleRoutes) : null;
  const bandBox = band
    ? {
        x: Math.min(...band.map((p) => p.x)) - 8,
        y: Math.min(...band.map((p) => p.y)) - 8,
        w: Math.max(...band.map((p) => p.x)) - Math.min(...band.map((p) => p.x)) + 16,
        h: Math.max(...band.map((p) => p.y)) - Math.min(...band.map((p) => p.y)) + 16,
      }
    : null;
  const bandLocal = band && bandBox
    ? band.map((p) => ({ x: p.x - bandBox.x, y: p.y - bandBox.y }))
    : null;
  return (
    <ViewportPortal>
      {bandLocal && bandBox ? (
        <svg
          className="insert-bundle-band"
          aria-hidden
          width={Math.max(bandBox.w, 16)}
          height={Math.max(bandBox.h, 16)}
          style={{
            position: "absolute",
            overflow: "visible",
            left: bandBox.x,
            top: bandBox.y,
            pointerEvents: "none",
          }}
        >
          <path className="path-insert-band" d={polylineToSvg(bandLocal)} />
        </svg>
      ) : null}
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
          borderRadius: nodeRadius(node.type),
          pointerEvents: "none",
        }}
      />
    </ViewportPortal>
  );
}

function TilePickup({
  id,
  disabled,
  children,
}: {
  id: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  const rf = useReactFlow();
  const { layout } = useLaneLayoutContext();
  const view = useStore((s) => s.view);
  const hostRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef(layout);
  const viewRef = useRef(view);
  const rfRef = useRef(rf);
  layoutRef.current = layout;
  viewRef.current = view;
  rfRef.current = rf;
  const [ghost, setGhost] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
    rx: number;
  } | null>(null);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const dragging = useRef(false);
  const stopGesture = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (disabled) {
      const wasDragging = dragging.current;
      stopGesture.current?.();
      dragging.current = false;
      origin.current = null;
      setGhost(null);
      if (wasDragging) useStore.getState().closeBoardModes();
    }
  }, [disabled]);

  useEffect(() => () => stopGesture.current?.(), []);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled || e.button !== 0 || origin.current) return;
    if ((e.target as HTMLElement).closest("button, a, input, textarea")) return;
    origin.current = { x: e.clientX, y: e.clientY };
    dragging.current = false;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);

    const onMove = (ev: PointerEvent) => {
      if (!origin.current) return;
      const dist = Math.hypot(ev.clientX - origin.current.x, ev.clientY - origin.current.y);
      if (!dragging.current && dist < 10) return;
      if (!dragging.current) {
        dragging.current = true;
        useStore.getState().beginTileDrag(id);
        const box = hostRef.current?.getBoundingClientRect();
        const face = hostRef.current?.querySelector(".board-node");
        const live = face instanceof HTMLElement ? nodeScreenRect(id) : null;
        setGhost({
          x: ev.clientX,
          y: ev.clientY,
          w: live?.w ?? box?.width ?? 160,
          h: live?.h ?? box?.height ?? 96,
          rx: live?.rx ?? STEP_RX,
        });
      }
      /* Grid snap would pull the pointer off a short merge/split trunk onto a unique spine. */
      const flow = rfRef.current.screenToFlowPosition(
        { x: ev.clientX, y: ev.clientY },
        { snapToGrid: false },
      );
      const doc = useStore.getState().workflow;
      const edges = [...doc.edges, ...doc.after.extraEdges];
      const hover =
        viewRef.current === ViewMode.Both
          ? null
          : hitInsertTarget(layoutRef.current, flow, edges, incidentPathIds(edges, id));
      useStore.getState().setTileDragHover(hover);
      setGhost((g) => (g ? { ...g, x: ev.clientX, y: ev.clientY } : g));
    };

    const onUp = (ev: PointerEvent) => {
      stopGesture.current?.();
      origin.current = null;
      const host = hostRef.current;
      if (host) {
        try {
          host.releasePointerCapture(ev.pointerId);
        } catch {
          /* already released */
        }
      }
      if (dragging.current) {
        const s = useStore.getState();
        if (s.interaction.kind === "tile-drag" && s.interaction.hover) {
          const hover = s.interaction.hover;
          if (hover.kind === "path") s.insertOnPath(id, hover.edgeId);
          else s.insertOnBundle(id, { role: hover.role, hostId: hover.hostId });
        } else {
          s.closeBoardModes();
        }
      }
      dragging.current = false;
      setGhost(null);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    stopGesture.current = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      stopGesture.current = null;
    };
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
              borderRadius: ghost.rx,
            }}
          />,
          document.body,
        )
      : null;

  return (
    <div
      ref={hostRef}
      className="tile-pickup"
      onPointerDownCapture={onPointerDown}
    >
      {children}
      {layer}
    </div>
  );
}
