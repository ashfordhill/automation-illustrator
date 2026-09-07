/**
 * Orthogonal Path renderer: Smart Edge step routing plus custom condition chips.
 * Stroke is graph.edgeIsDotted (PC-01, PC-05). Labels are independent hit targets (CX-02).
 */
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  type EdgeProps,
} from "@xyflow/react";
import { useSmartEdgePath } from "@tisoap/react-flow-smart-edge";
import { SelectionKind } from "../../workflow/catalogs";
import { useStore } from "../../state/store";
import { edgeIsDotted } from "../../workflow/graph";
import { wrapConditionLines } from "../layout/labelBox";
import { usePathLayout } from "./PathLayout";
import { placementCenter } from "./placeLabels";
import {
  lerpPolylines,
  nativeStepPolyline,
  nearestOnPolyline,
  orthogonalPolyline,
  polylineKey,
  polylineToSvg,
  pointsFromSmart,
  type PolyPoint,
} from "./polyline";
import { SMART_GRID_RATIO, SMART_NODE_PADDING, SMART_PRESET } from "./smartStep";

export type FlowPathData = {
  restitch?: boolean;
  condition?: string;
  dashed?: boolean;
  stretch?: boolean;
  viaX?: number;
  viaY?: number;
} & Record<string, unknown>;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

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

export function FlowArrow({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  data,
}: EdgeProps) {
  const pathData = (data ?? {}) as FlowPathData;
  const workflow = useStore((s) => s.workflow);
  const present = useStore((s) => s.present);
  const { reportPath, placements } = usePathLayout();
  const restitch = Boolean(pathData.restitch);
  const stretch = Boolean(pathData.stretch);
  const restitchCondition = restitch && typeof pathData.condition === "string" ? pathData.condition : "";
  const restitchDashed = restitch ? Boolean(pathData.dashed) : false;
  const edge = restitch ? undefined : workflow.edges.find((e) => e.id === id);
  const dotted = restitch ? restitchDashed : edge ? edgeIsDotted(workflow.nodes, workflow.edges, edge) : false;
  const label = restitch ? restitchCondition : edge?.label;

  const { route } = useSmartEdgePath({
    id,
    source,
    target,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    preset: SMART_PRESET,
    options: { gridRatio: SMART_GRID_RATIO, nodePadding: SMART_NODE_PADDING },
  });

  const settled = useMemo(() => {
    if (route?.kind === "routed") {
      const d = route.svgPathString;
      const points = pointsFromSmart(sourceX, sourceY, targetX, targetY, route.points);
      return { d, points };
    }
    const native = nativeStepPolyline(
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition,
    );
    return { d: native.d, points: native.points.length ? native.points : orthogonalPolyline(sourceX, sourceY, targetX, targetY) };
  }, [route, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition]);

  const viaX = pathData.viaX;
  const viaY = pathData.viaY;
  const fromVia = useMemo(() => {
    if (viaX == null || viaY == null) return settled.points;
    const a = orthogonalPolyline(sourceX, sourceY, viaX, viaY);
    const b = orthogonalPolyline(viaX, viaY, targetX, targetY);
    return [...a.slice(0, -1), ...b];
  }, [viaX, viaY, sourceX, sourceY, targetX, targetY, settled.points]);

  const stretched = useStretch(stretch && viaX != null, fromVia, settled.points);
  const points = stretched ?? settled.points;
  const path = stretched ? polylineToSvg(stretched) : settled.d;

  useLayoutEffect(() => {
    reportPath(id, points);
  }, [id, points, reportPath]);

  const placement = placements[id];
  const chip = placement
    ? nearestOnPolyline(points, placementCenter(placement).x, placementCenter(placement).y)
    : points[Math.floor(points.length / 2)] ?? { x: (sourceX + targetX) / 2, y: (sourceY + targetY) / 2 };

  const lines = label ? wrapConditionLines(label) : [];
  const className = restitch ? "edge-restitch" : stretch && stretched ? "edge-stretch" : undefined;

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        className={className}
        interactionWidth={28}
        style={{
          stroke: restitch ? "var(--blue-deep)" : "var(--line)",
          strokeWidth: selected || restitch ? 4 : 2.75,
          strokeDasharray: restitch ? "10 6" : dotted ? "8 7" : undefined,
          strokeLinecap: "square",
        }}
      />
      {label && lines.length ? (
        <EdgeLabelRenderer>
          <div
            className="nopan nowheel path-condition-wrap"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${chip.x}px, ${chip.y}px)`,
              pointerEvents: restitch ? "none" : "all",
            }}
          >
            <button
              type="button"
              className={`path-condition${restitch ? " is-restitch" : ""}${selected ? " is-on" : ""}`}
              title={label}
              aria-label={label}
              tabIndex={restitch || present ? -1 : 0}
              onPointerDown={(e) => {
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (present || restitch) return;
                useStore.getState().select({ type: SelectionKind.Edge, id });
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
