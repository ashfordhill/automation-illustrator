/**
 * Antenna robot drawn on ActorColumn and the roster.
 * Pair with HumanFigure; fill color comes from ROBOT_COLORS[RobotKind].
 * crop "head" is the inspector add-robot key.
 * Artwork lives in robot-figure.svg.
 */
import robotMarkup from "./robot-figure.svg?raw";
import { svgInner } from "./svgInner";

type Fig = { size?: number; color?: string; className?: string };

const INNER = svgInner(robotMarkup);

export function RobotFigure({
  size = 44,
  color = "var(--ink)",
  className,
  crop = "full",
}: Fig & { crop?: "full" | "head" }) {
  const head = crop === "head";
  return (
    <svg
      className={className}
      width={size}
      height={head ? size : size * 1.55}
      viewBox={head ? "9 0 22 25" : "0 0 40 64"}
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      aria-hidden
      color={color}
      dangerouslySetInnerHTML={{ __html: INNER }}
    />
  );
}
