/**
 * Stick-figure person drawn on ActorColumn and the roster.
 * Stroke should stay dark on pastel fills (FIGURE_INK_ON_PASTEL), not theme --ink.
 * crop "head" is the inspector add-human key (Human vs Robot differ by the head).
 * Artwork lives in human-figure.svg.
 */
import humanMarkup from "./human-figure.svg?raw";
import { svgInner } from "./svgInner";

type Fig = { size?: number; color?: string; className?: string };

const INNER = svgInner(humanMarkup);

export function HumanFigure({
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
      viewBox={head ? "11 1 18 18" : "0 0 40 64"}
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      aria-hidden
      color={color}
      dangerouslySetInnerHTML={{ __html: INNER }}
    />
  );
}
