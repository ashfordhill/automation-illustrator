/**
 * Stick-figure person drawn on ActorColumn and the roster.
 * Stroke should stay dark on pastel fills (FIGURE_INK_ON_PASTEL), not theme --ink.
 */
type Fig = { size?: number; color?: string; className?: string };

export function HumanFigure({ size = 44, color = "var(--ink)", className }: Fig) {
  return (
    <svg
      className={className}
      width={size}
      height={size * 1.55}
      viewBox="0 0 40 64"
      fill="none"
      aria-hidden
    >
      <circle cx="20" cy="10" r="7.5" stroke={color} strokeWidth="2.4" />
      <path
        d="M20 18.2 V40 M8.5 28.5 H31.5 M20 40 L10 58 M20 40 L30 58"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
