/**
 * Actor roster helpers and pastel fills.
 * ActorColumn / HumanFigure sit on HUMAN_PRESETS; robots use ROBOT_COLORS[RobotKind].
 */
import { ActorKind, IdPrefix, RobotKind } from "./catalogs";
import { nid } from "./ids";
import {
  DEFAULT_HUMAN_ROLE,
  type ActorDto,
  type RobotKind as RobotKindT,
} from "./types";

export const HUMAN_PRESETS = [
  { name: "Alice", color: "#f4c6d4" },
  { name: "Roy", color: "#c5d4ea" },
  { name: "Jack", color: "#c5e0d6" },
  { name: "Missy", color: "#d5c6e6" },
] as const;

export const ROBOT_COLORS = {
  [RobotKind.Llm]: "#8eabc4",
  [RobotKind.Agent]: "#7eaea0",
  [RobotKind.Script]: "#8aa8b8",
} as const;

/** Stick-figure stroke on pastel actor fills (not theme ink, which goes light in dark mode). */
export const FIGURE_INK_ON_PASTEL = "#122836";

/** Random human fill that stays in a quiet HSL band (skips lime/chartreuse). */
export function randomPastel(): string {
  let h = Math.floor(Math.random() * 360);
  if (h > 72 && h < 148) h = h < 110 ? h - 55 : h + 40;
  const s = 38 + Math.round(Math.random() * 12);
  const l = 80 + Math.round(Math.random() * 8);
  return `hsl(${h} ${s}% ${l}%)`;
}

/** Alice, Roy, Jack, Missy, plus one Script robot — also used by New board. */
export function defaultActors(): ActorDto[] {
  const humans: ActorDto[] = HUMAN_PRESETS.map((p) => ({
    id: nid(IdPrefix.Human),
    kind: ActorKind.Human,
    name: p.name,
    color: p.color,
    role: DEFAULT_HUMAN_ROLE,
  }));
  const robot: ActorDto = {
    id: nid(IdPrefix.Robot),
    kind: ActorKind.Robot,
    name: "Robot",
    color: ROBOT_COLORS[RobotKind.Script],
    robotKind: RobotKind.Script,
  };
  return [...humans, robot];
}

/** Prefer Alice so new Steps match the demo’s default person. */
export function aliceId(actors: ActorDto[]) {
  return (
    actors.find((a) => a.kind === ActorKind.Human && a.name === "Alice")?.id ??
    actors[0]?.id
  );
}

/** First robot on the roster — After-lane assignments in the Oak Park demo. */
export function defaultRobotId(actors: ActorDto[]) {
  return actors.find((a) => a.kind === ActorKind.Robot)?.id ?? actors[0]?.id;
}

/** Inspector “+ New person”. */
export function makeHuman(name?: string, color?: string): ActorDto {
  const n = name?.trim() || `Person ${Math.floor(Math.random() * 90) + 2}`;
  const preset = HUMAN_PRESETS.find((p) => p.name === n);
  const c = color ?? preset?.color ?? randomPastel();
  return {
    id: nid(IdPrefix.Human),
    kind: ActorKind.Human,
    name: n,
    color: c,
    role: DEFAULT_HUMAN_ROLE,
  };
}

/** Inspector “+ New robot”. Name stays “Robot”; kind drives fill. */
export function makeRobot(
  name = "Robot",
  robotKind: RobotKindT = RobotKind.Script,
): ActorDto {
  return {
    id: nid(IdPrefix.Robot),
    kind: ActorKind.Robot,
    name,
    color: ROBOT_COLORS[robotKind],
    robotKind,
  };
}
