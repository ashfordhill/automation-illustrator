/**
 * Pastel fills for named people and automation types.
 * ActorColumn / HumanFigure sit on HUMAN_PRESETS; robots use ROBOT_COLORS[RobotKind].
 */
import { RobotKind } from "./catalogs";

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
