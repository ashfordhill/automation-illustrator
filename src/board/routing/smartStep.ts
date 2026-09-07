/**
 * Shared Smart Edge step preset (orthogonal / stepped, PC-05).
 */
import { smartEdgePresets } from "@tisoap/react-flow-smart-edge";
import type { GetSmartEdgeOptions } from "@tisoap/react-flow-smart-edge";

export const SMART_PRESET = "step" as const;
export const SMART_GRID_RATIO = 16;
export const SMART_NODE_PADDING = 12;

export const smartStepOptions: GetSmartEdgeOptions = {
  drawEdge: smartEdgePresets.step.drawEdge,
  generatePath: smartEdgePresets.step.generatePath,
  gridRatio: SMART_GRID_RATIO,
  nodePadding: SMART_NODE_PADDING,
};

export const smartProviderOptions = {
  preset: SMART_PRESET,
  gridRatio: SMART_GRID_RATIO,
  nodePadding: SMART_NODE_PADDING,
  routeOnlyWhenBlocked: true as const,
};
