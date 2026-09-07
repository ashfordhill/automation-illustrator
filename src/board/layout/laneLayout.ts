/**
 * Derived lane layout produced by ELK (CX-03, CX-04, CX-05 as amended).
 * Every displayed Node position, Path route, and condition-chip rect for one
 * rendered lane. Absolute integer pixels. Never written to the document.
 */
import type { Point } from "../../workflow/types";

export type Rect = { x: number; y: number; w: number; h: number };

export type LaneLayout = {
  /** laneGraphKey the layout was computed for. */
  key: string;
  /** Node id → top-left. */
  positions: Record<string, Point>;
  /** Path id → [start, ...bends, end]. */
  routes: Record<string, Point[]>;
  /** Path id → condition-chip rect (labeled Paths only). */
  labels: Record<string, Rect>;
  /** Root box including padding. */
  bounds: Rect;
};

/** `initial` = nothing to draw yet; `updating` = previous layout shown while ELK runs. */
export type LayoutPhase = "initial" | "updating" | "ready";
