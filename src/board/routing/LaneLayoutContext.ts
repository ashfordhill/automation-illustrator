/**
 * Shares the animated ELK lane layout with FlowArrow (Improvement 01).
 * Board provides it around <ReactFlow>; Paths read their route and chip rect.
 */
import { createContext, useContext } from "react";
import type { LaneLayout } from "../layout/laneLayout";

export type LaneLayoutValue = { layout: LaneLayout | null };

export const LaneLayoutContext = createContext<LaneLayoutValue>({ layout: null });

export function useLaneLayoutContext(): LaneLayoutValue {
  return useContext(LaneLayoutContext);
}
