/**
 * One discriminated canvas interaction (CX-08). Replaces overlapping
 * linkFrom / linkMenu / pathPick booleans. Escape and empty-canvas click
 * always return to idle. merge-pick collects Before-origin Steps before confirm.
 */
import type { ActorDto, NodeDto } from "../workflow/types";
import type { RemovalPlan } from "../workflow/commands";

export type Interaction =
  | { kind: "idle" }
  | { kind: "plus-pull"; sourceId: string }
  | { kind: "path-pull"; sourceId: string; hoverTargetId: string | null }
  | { kind: "tile-drag"; nodeId: string; hoverEdgeId: string | null }
  | { kind: "connect-existing"; sourceId: string }
  | { kind: "remove-preview"; plan: RemovalPlan }
  | { kind: "merge-pick"; memberIds: string[] }
  | { kind: "path-label-edit"; edgeId: string };

export const IDLE: Interaction = { kind: "idle" };

export type DepartingTile = {
  node: NodeDto;
  actor?: ActorDto;
};

export function isTransient(interaction: Interaction): boolean {
  return interaction.kind !== "idle";
}

export function addMenuSource(interaction: Interaction): string | null {
  return interaction.kind === "plus-pull" ? interaction.sourceId : null;
}

export function connectSource(interaction: Interaction): string | null {
  if (interaction.kind === "connect-existing" || interaction.kind === "path-pull") {
    return interaction.sourceId;
  }
  return null;
}

export function removePickHost(_interaction: Interaction): string | null {
  return null;
}

export function removePickCandidate(_interaction: Interaction): string | null {
  return null;
}
