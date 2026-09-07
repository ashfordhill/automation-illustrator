/**
 * One discriminated canvas interaction (CX-08). Replaces overlapping
 * linkFrom / linkMenu / pathPick booleans. Escape and empty-canvas click
 * always return to idle. merge-pick is reserved for Slice 11.
 */
import type { ActorDto, NodeDto } from "../workflow/types";
import type { RemovalPlan } from "../workflow/commands";

export type Interaction =
  | { kind: "idle" }
  | { kind: "add-menu"; sourceId: string }
  | { kind: "connect-existing"; sourceId: string }
  | { kind: "remove-pick"; hostId: string; candidateId: string }
  | { kind: "remove-preview"; plan: RemovalPlan }
  | { kind: "merge-pick"; memberIds: string[] };

export const IDLE: Interaction = { kind: "idle" };

export type DepartingTile = {
  node: NodeDto;
  actor?: ActorDto;
};

export function isTransient(interaction: Interaction): boolean {
  return interaction.kind !== "idle";
}

export function addMenuSource(interaction: Interaction): string | null {
  return interaction.kind === "add-menu" ? interaction.sourceId : null;
}

export function connectSource(interaction: Interaction): string | null {
  return interaction.kind === "connect-existing" ? interaction.sourceId : null;
}

export function removePickHost(interaction: Interaction): string | null {
  return interaction.kind === "remove-pick" ? interaction.hostId : null;
}

export function removePickCandidate(interaction: Interaction): string | null {
  return interaction.kind === "remove-pick" ? interaction.candidateId : null;
}
