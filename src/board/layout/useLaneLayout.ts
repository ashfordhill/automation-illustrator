/**
 * Ask the layout engine for one lane's ELK layout (Improvement 01 / 36).
 * A cache hit renders synchronously (no flash on view switches). Otherwise the
 * previous layout stays on screen with phase "updating", or "initial" when
 * nothing has been laid out yet. Publishes displayed positions to the store so
 * WG-09 / WG-11 follow what the user sees. The previous layout is also passed
 * into ELK as row-stability hints when the graph changes.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import type { LaneProjection } from "../../state/projection";
import { useStore } from "../../state/store";
import type { AssignmentLane } from "../../workflow/catalogs";
import { layoutEngine } from "./elkClient";
import type { TileSizes } from "./elkGraph";
import type { LabelBox } from "./labelBox";
import type { LaneLayout, LayoutPhase } from "./laneLayout";
import { LayoutSuperseded, type LayoutEngine } from "./layoutEngine";

export type LaneLayoutState = {
  layout: LaneLayout | null;
  phase: LayoutPhase;
  /** ELK rejected the latest request; the previous layout (if any) is still shown. */
  error: boolean;
};

export function useLaneLayout(
  lane: AssignmentLane,
  projection: LaneProjection,
  boxes: Record<string, LabelBox>,
  sizes?: TileSizes,
  engine: LayoutEngine = layoutEngine,
): LaneLayoutState {
  const key = useMemo(() => engine.keyFor(projection, boxes, sizes), [engine, projection, boxes, sizes]);
  const cached = engine.get(key);
  const [state, setState] = useState<{ layout: LaneLayout | null; error: boolean }>({
    layout: cached ?? null,
    error: false,
  });
  const inputs = useRef({ projection, boxes, sizes });
  inputs.current = { projection, boxes, sizes };

  const layout = cached ?? state.layout;
  const shownRef = useRef<LaneLayout | null>(layout);
  shownRef.current = layout;
  const phase: LayoutPhase = !layout ? "initial" : layout.key === key ? "ready" : "updating";

  useEffect(() => {
    if (cached) {
      setState((s) => (s.layout === cached && !s.error ? s : { layout: cached, error: false }));
      return;
    }
    let live = true;
    const { projection: p, boxes: b, sizes: z } = inputs.current;
    engine.request(lane, p, b, z, shownRef.current?.positions).then(
      (layout) => {
        if (live) setState({ layout, error: false });
      },
      (err: unknown) => {
        if (!live || err instanceof LayoutSuperseded) return;
        setState((s) => ({ layout: s.layout, error: true }));
      },
    );
    return () => {
      live = false;
    };
    // `cached` is derived from `key`; inputs are read through the ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, lane, key]);

  useEffect(() => {
    if (layout) useStore.getState().setLaneLayoutPositions(lane, layout.positions);
  }, [lane, layout]);

  return { layout, phase, error: state.error && phase !== "ready" };
}
