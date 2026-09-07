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
import { useReactFlow } from "@xyflow/react";
import { IconX } from "@tabler/icons-react";
import { ViewMode, WorkflowNodeKind } from "../../workflow/catalogs";
import { useStore } from "../../state/store";
import { findMergeGroup, findNode } from "../../workflow/selectors";
import { nodeCaption } from "../../workflow/types";
import { useLaneLayoutContext } from "../routing/LaneLayoutContext";
import { hitPathId } from "../layout/pathHit";
import { PathKnotIcon } from "./PathKnotIcon";

const PULL_THRESHOLD = 36;
const SPRING_MS = 520;

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
          <span className="plus-preview-data" />
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
    interaction.kind !== "merge-pick" &&
    interaction.kind !== "remove-preview";
  const group = findMergeGroup(workflow, id);
  const caption = nodeCaption(findNode(workflow, id), id);
  const pulling =
    (interaction.kind === "plus-pull" ||
      interaction.kind === "path-pull" ||
      interaction.kind === "tile-drag") &&
    ((interaction.kind === "plus-pull" && interaction.sourceId === id) ||
      (interaction.kind === "path-pull" && interaction.sourceId === id) ||
      (interaction.kind === "tile-drag" && interaction.nodeId === id));

  return (
    <div
      className={`tile-chrome-host${pulling ? " is-pulling" : ""}`}
      style={{ position: "relative", width: "100%", height: "100%", overflow: "visible" }}
    >
      <TilePickup id={id} selected={!!selected && editing} disabled={!editing || !selected || pulling}>
        {children}
      </TilePickup>
      {showChrome ? (
        <>
          <PlusPullTab nodeId={id} />
          <PathPullTab nodeId={id} />
          <button
            type="button"
            className="node-remove-x-btn tile-remove-x"
            aria-label={group && view === ViewMode.After ? "Unmerge" : `Remove ${caption}`}
            title={group && view === ViewMode.After ? "Unmerge" : `Remove ${caption}`}
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
  } | null>(null);
  const items = view === ViewMode.After ? (["step"] as const) : (["step", "data"] as const);
  const stretched = drag
    ? Math.hypot(drag.x - drag.restX, drag.y - drag.restY) >= PULL_THRESHOLD
    : false;

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
    e.currentTarget.setPointerCapture(e.pointerId);
    useStore.getState().beginPlusPull(nodeId);
    setDrag({ x: e.clientX, y: e.clientY, restX, restY, hovering: null, live: true });
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
    setDrag({ ...drag, x: e.clientX, y: e.clientY, hovering });
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
  const overlay =
    drag && typeof document !== "undefined"
      ? createPortal(
          <div className="plus-pull-layer" aria-hidden={!stretched}>
            <svg className="plus-taffy" width="100%" height="100%">
              <path
                d={taffyPath(drag.restX, drag.restY, tabX, tabY)}
                fill="var(--plus)"
                fillOpacity={0.88}
                stroke="var(--line)"
                strokeWidth={2}
              />
            </svg>
            {stretched
              ? items.map((kind, i) => {
                  const n = items.length;
                  const spread = n === 1 ? 0 : 56;
                  const angle = n === 1 ? 0 : -spread / 2 + (i * spread) / Math.max(1, n - 1);
                  const rad = (angle * Math.PI) / 180;
                  const radius = 118;
                  const x = drag.restX + 28 + Math.cos(rad) * radius;
                  const y = drag.restY + Math.sin(rad) * radius;
                  return (
                    <PlusPreview
                      key={kind}
                      kind={kind}
                      label={kind === "step" ? (view === ViewMode.After ? "After-only Step" : "New Step") : "New Data"}
                      hovering={drag.hovering === kind}
                      style={{ left: x, top: y }}
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

function taffyPath(x0: number, y0: number, x1: number, y1: number): string {
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
  const a0x = x0 + px * r0;
  const a0y = y0 + py * r0;
  const b0x = x0 - px * r0;
  const b0y = y0 - py * r0;
  const a1x = x1 + px * r1;
  const a1y = y1 + py * r1;
  const b1x = x1 - px * r1;
  const b1y = y1 - py * r1;
  return `M ${a0x} ${a0y} Q ${mx + px * r0} ${my + py * r0} ${a1x} ${a1y} A ${r1} ${r1} 0 0 1 ${b1x} ${b1y} Q ${mx - px * r0} ${my - py * r0} ${b0x} ${b0y} A ${r0} ${r0} 0 0 1 ${a0x} ${a0y} Z`;
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
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!origin.current) return;
    const dist = Math.hypot(e.clientX - origin.current.x, e.clientY - origin.current.y);
    if (!dragging.current && dist < 10) return;
    if (view === ViewMode.After && findMergeGroup(useStore.getState().workflow, id)) {
      return;
    }
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
