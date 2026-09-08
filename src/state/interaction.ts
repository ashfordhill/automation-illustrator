/**
 * One discriminated canvas interaction (CX-08). Replaces overlapping
 * linkFrom / linkMenu / pathPick booleans. Escape and empty-canvas click
 * always return to idle.
 */
import type { ActorDto, NodeDto } from "../workflow/types";
import type { RemovalPlan } from "../workflow/commands";

/** On-canvas Step field opened by double-click (Name, Details, actor name, Human role). */
export type TileTextField = "actor-name" | "actor-role" | "title" | "detail";

/** Pie around a Step icon: Type, Who, or Robot Type (LLM / Agent / Script). */
export type TilePieKind = "type" | "who" | "robot-kind";

export type Interaction =
  | { kind: "idle" }
  | { kind: "plus-pull"; sourceId: string }
  | { kind: "path-pull"; sourceId: string; hoverTargetId: string | null }
  | { kind: "tile-drag"; nodeId: string; hoverEdgeId: string | null }
  | { kind: "connect-existing"; sourceId: string }
  | { kind: "remove-preview"; plan: RemovalPlan }
  | { kind: "path-label-edit"; edgeId: string }
  | { kind: "path-menu"; edgeId: string; x: number; y: number }
  | { kind: "tile-text-edit"; nodeId: string; field: TileTextField }
  | { kind: "tile-pie"; nodeId: string; pie: TilePieKind; x: number; y: number };

export const IDLE: Interaction = { kind: "idle" };

export type DepartingTile = {
  node: NodeDto;
  actor?: ActorDto;
};

export function isTransient(interaction: Interaction): boolean {
  return interaction.kind !== "idle";
}

export function isTileEdit(interaction: Interaction): boolean {
  return interaction.kind === "tile-text-edit" || interaction.kind === "tile-pie";
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
