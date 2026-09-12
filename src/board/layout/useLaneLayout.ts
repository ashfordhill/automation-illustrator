/**
 * Ask the layout engine for one lane's ELK layout (Improvement 01 / 36 / 61).
 * A cache hit renders synchronously (no flash on view switches). Before and
 * After share one graph key. Otherwise the previous layout stays on screen
 * with phase "updating", or "initial" when nothing has been laid out yet —
 * including when the previous layout is a different orientation. Publishes
 * displayed positions to the store so WG-09 / WG-11 follow what the user sees.
 * The previous layout is also passed into ELK as stability hints when the
 * graph changes in the same orientation.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import type { LaneProjection } from "../../state/projection";
import { useStore } from "../../state/store";
import { AssignmentLane } from "../../workflow/catalogs";
import type { BoardOrientation } from "../flow/flowProfile";
import { layoutKeyOrientation } from "../flow/flowProfile";
import { layoutEngine } from "./elkClient";
import type { LayoutMode, TileSizes } from "./elkGraph";
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
  mode: LayoutMode = "tile",
  orientation: BoardOrientation = "horizontal",
  engine: LayoutEngine = layoutEngine,
): LaneLayoutState {
  const key = useMemo(
    () => engine.keyFor(projection, boxes, sizes, mode, orientation),
    [engine, projection, boxes, sizes, mode, orientation],
  );
  const cached = engine.get(key);
  const [state, setState] = useState<{ layout: LaneLayout | null; error: boolean }>({
    layout: cached ?? null,
    error: false,
  });
  const inputs = useRef({ projection, boxes, sizes, mode, orientation });
  inputs.current = { projection, boxes, sizes, mode, orientation };

  const raw = cached ?? state.layout;
  const sameOrient = raw ? layoutKeyOrientation(raw.key) === orientation : false;
  const layout = cached ?? (sameOrient ? raw : null);
  const shownRef = useRef<LaneLayout | null>(layout);
  shownRef.current = layout;
  const phase: LayoutPhase = !layout ? "initial" : layout.key === key ? "ready" : "updating";

  useEffect(() => {
    if (cached) {
      setState((s) => (s.layout === cached && !s.error ? s : { layout: cached, error: false }));
      return;
    }
    let live = true;
    const { projection: p, boxes: b, sizes: z, mode: m, orientation: o } = inputs.current;
    const beforeHints =
      lane === AssignmentLane.After
        ? useStore.getState().laneLayoutPositions[AssignmentLane.Before]
        : undefined;
    const shown = shownRef.current;
    const hints =
      shown && layoutKeyOrientation(shown.key) === o ? (shown.positions ?? beforeHints) : undefined;
    engine.request(lane, p, b, z, hints, m, o).then(
      (next) => {
        if (live) setState({ layout: next, error: false });
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
