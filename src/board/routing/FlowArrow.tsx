/**
 * Orthogonal Path renderer: ELK route from the lane layout plus a condition chip
 * at the rect ELK reserved for it (CX-04, CX-05). Stroke is graph.edgeIsDotted
 * (PC-01, PC-05). Chips are independent hit targets (CX-02). Remove-preview
 * Paths are not laid out and fall back to a right-angle polyline.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { BaseEdge, EdgeLabelRenderer, type EdgeProps } from "@xyflow/react";
import { SelectionKind, ViewMode } from "../../workflow/catalogs";
import { useStore } from "../../state/store";
import { afterGraph, edgeIsDotted } from "../../workflow/graph";
import { findEdge } from "../../workflow/selectors";
import type { WorkflowDoc } from "../../workflow/types";
import { wrapConditionLines } from "../layout/labelBox";
import { useLaneLayoutContext } from "./LaneLayoutContext";
import {
  lerpPolylines,
  orthogonalPolyline,
  pathLength,
  pointAtLength,
  polylineDrawSegments,
  polylineKey,
  polylineToSvg,
  type PolyPoint,
  DOTTED_DASH,
  DOTTED_GAP,
  DOTTED_PERIOD,
  RESTITCH_DASH,
  RESTITCH_GAP,
  RESTITCH_PERIOD,
} from "./polyline";

export type FlowPathData = {
  restitch?: boolean;
  condition?: string;
  dashed?: boolean;
  dotted?: boolean;
  stretch?: boolean;
  viaX?: number;
  viaY?: number;
} & Record<string, unknown>;

/** Invisible Path hit pad in SVG units — wider than the drawn stroke. */
export const PATH_HIT_WIDTH = 44;

/** Stroke for a document Path by origin id: dotted = choice, solid = always visited. */
export function pathIsDotted(workflow: WorkflowDoc, originId: string): boolean {
  const edge = findEdge(workflow, originId);
  if (!edge) return false;
  const inBefore = workflow.edges.some((e) => e.id === edge.id);
  if (inBefore) return edgeIsDotted(workflow.nodes, workflow.edges, edge);
  const graph = afterGraph(workflow);
  return edgeIsDotted(graph.nodes, graph.edges, edge);
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Restitch stretch (CX-06): from the polyline through the departing tile to the settled route. */
function useStretch(active: boolean, from: PolyPoint[], to: PolyPoint[]): PolyPoint[] | null {
  const fromKey = polylineKey(from);
  const toKey = polylineKey(to);
  const [t, setT] = useState(active ? 0 : 1);

  useEffect(() => {
    if (!active || prefersReducedMotion()) {
      setT(1);
      return;
    }
    setT(0);
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const next = Math.min(1, (now - start) / 240);
      setT(next);
      if (next < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, fromKey, toKey]);

  if (!active || t >= 1) return null;
  return lerpPolylines(from, to, t);
}

function PathChipEditor({
  edgeId,
  value,
}: {
  edgeId: string;
  value: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    el.select();
  }, [edgeId]);
  return (
    <input
      ref={ref}
      id="path-chip-editor"
      className="path-chip-editor nopan nowheel"
      aria-label="Path label"
      autoComplete="off"
      spellCheck={false}
      value={value}
      onChange={(e) => useStore.getState().updateEdge(edgeId, { label: e.target.value })}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    />
  );
}

export function FlowArrow({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  selected,
  data,
}: EdgeProps) {
  const pathData = (data ?? {}) as FlowPathData;
  const originId = typeof pathData.originId === "string" ? pathData.originId : id;
  const workflow = useStore((s) => s.workflow);
  const present = useStore((s) => s.present);
  const view = useStore((s) => s.view);
  const editingLabel = useStore(
    (s) => s.interaction.kind === "path-label-edit" && s.interaction.edgeId === originId,
  );
  const { layout } = useLaneLayoutContext();
  const restitch = Boolean(pathData.restitch);
  const stretch = Boolean(pathData.stretch);
  const restitchCondition = restitch && typeof pathData.condition === "string" ? pathData.condition : "";
  const restitchDashed = restitch ? Boolean(pathData.dashed) : false;
  const edge = restitch ? undefined : findEdge(workflow, originId);
  const dotted = restitch ? restitchDashed : pathIsDotted(workflow, originId);
  const label = restitch ? restitchCondition : edge?.label;

  const route = layout?.routes[id];
  const routeKey = route ? polylineKey(route) : "";
  const settled = useMemo<PolyPoint[]>(
    () => (route && route.length >= 2 ? route : orthogonalPolyline(sourceX, sourceY, targetX, targetY)),
    // routeKey stands in for the route array identity (animated frames reuse ids).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [routeKey, sourceX, sourceY, targetX, targetY],
  );

  const viaX = pathData.viaX;
  const viaY = pathData.viaY;
  const fromVia = useMemo(() => {
    if (viaX == null || viaY == null) return settled;
    const start = settled[0]!;
    const end = settled[settled.length - 1]!;
    const a = orthogonalPolyline(start.x, start.y, viaX, viaY);
    const b = orthogonalPolyline(viaX, viaY, end.x, end.y);
    return [...a.slice(0, -1), ...b];
  }, [viaX, viaY, settled]);

  const stretched = useStretch(stretch && viaX != null, fromVia, settled);
  const points = stretched ?? settled;
  const path = polylineToSvg(points);
  const dashPeriod = restitch ? RESTITCH_PERIOD : DOTTED_PERIOD;
  const dashArray = restitch ? `${RESTITCH_DASH} ${RESTITCH_GAP}` : `${DOTTED_DASH} ${DOTTED_GAP}`;
  const showDots = restitch || dotted;
  const segments = useMemo(
    () => (showDots ? polylineDrawSegments(points, dashPeriod) : []),
    [showDots, dashPeriod, points],
  );

  const insertHover = useStore(
    (s) =>
      s.interaction.kind === "tile-drag" &&
      s.interaction.hover?.kind === "path" &&
      s.interaction.hover.edgeId === originId,
  );
  const hideFullStroke = insertHover && !restitch;

  const rect = layout?.labels[id];
  const chip = (() => {
    if (rect) return { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2, w: rect.w, h: rect.h };
    const mid = pointAtLength(points, pathLength(points) / 2);
    return { x: mid.x, y: mid.y, w: undefined, h: undefined };
  })();

  const lines = label ? wrapConditionLines(label) : [];
  const motionClass = restitch ? "edge-restitch" : stretch && stretched ? "edge-stretch" : undefined;
  const hitOnly = showDots || hideFullStroke;
  const strokeClass = showDots ? "path-stroke-dotted" : "path-stroke-solid";
  const edgePathClass = [hitOnly ? undefined : motionClass, strokeClass, hitOnly ? "path-hit-only" : undefined]
    .filter(Boolean)
    .join(" ");

  const stroke = restitch ? "var(--blue-deep)" : "var(--line)";
  const strokeWidth = selected || restitch || insertHover ? 4 : 2.75;

  return (
    <>
      {insertHover ? (
        <BaseEdge
          id={`${id}-insert-hover`}
          path={path}
          className="path-insert-band"
          interactionWidth={0}
          style={{
            stroke: "var(--blue)",
            strokeWidth: 8,
            strokeDasharray: "14 8",
            strokeLinecap: "butt",
            opacity: 0.55,
          }}
        />
      ) : null}
      <BaseEdge
        id={id}
        path={path}
        className={edgePathClass}
        interactionWidth={PATH_HIT_WIDTH}
        style={{
          stroke: showDots || hideFullStroke ? "transparent" : stroke,
          strokeWidth,
          strokeLinecap: "butt",
          strokeLinejoin: "miter",
        }}
      />
      {showDots && !hideFullStroke
        ? segments.map((seg, i) => (
            <path
              key={`${i}-${seg.x1}-${seg.y1}-${seg.x2}-${seg.y2}`}
              data-path-overlay={id}
              d={`M ${seg.x1} ${seg.y1} L ${seg.x2} ${seg.y2}`}
              fill="none"
              pointerEvents="none"
              style={{
                stroke,
                strokeWidth,
                strokeDasharray: dashArray,
                strokeDashoffset: seg.dashOffset,
                strokeLinecap: "butt",
                strokeLinejoin: "miter",
              }}
            />
          ))
        : null}
      {editingLabel && !restitch && !present && view !== ViewMode.Both ? (
        <EdgeLabelRenderer>
          <div
            className="nopan nowheel path-condition-wrap"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${chip.x}px, ${chip.y}px)`,
              width: chip.w ?? 96,
              height: chip.h ?? 48,
              pointerEvents: "all",
              zIndex: 8,
            }}
          >
            <PathChipEditor edgeId={originId} value={label ?? ""} />
          </div>
        </EdgeLabelRenderer>
      ) : label && lines.length ? (
        <EdgeLabelRenderer>
          <div
            className="nopan nowheel path-condition-wrap"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${chip.x}px, ${chip.y}px)`,
              width: chip.w,
              height: chip.h,
              pointerEvents: restitch ? "none" : "all",
            }}
          >
            <button
              type="button"
              className={`path-condition${restitch ? " is-restitch" : ""}${selected ? " is-on" : ""}`}
              style={chip.w ? { width: chip.w, height: chip.h } : undefined}
              title={label}
              aria-label={label}
              tabIndex={restitch || present ? -1 : 0}
              onPointerDown={(e) => {
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (present || restitch) return;
                useStore.getState().select({ type: SelectionKind.Edge, id: originId });
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (present || restitch || view === ViewMode.Both) return;
                useStore.getState().openPathMenu(originId, e.clientX, e.clientY);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (present || restitch || view === ViewMode.Both) return;
                const s = useStore.getState();
                s.select({ type: SelectionKind.Edge, id: originId });
                s.toggleSelectedDash();
              }}
            >
              {lines.map((line, i) => (
                <span key={`${i}-${line}`}>{line}</span>
              ))}
            </button>
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}
