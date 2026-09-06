/**
 * Antenna robot drawn on ActorColumn and the roster.
 * Pair with HumanFigure; fill color comes from ROBOT_COLORS[RobotKind].
 */
type Fig = { size?: number; color?: string; className?: string };

export function RobotFigure({ size = 44, color = "var(--ink)", className }: Fig) {
  return (
    <svg
      className={className}
      width={size}
      height={size * 1.55}
      viewBox="0 0 40 64"
      fill="none"
      aria-hidden
    >
      <path d="M14 3 L14 8 M26 3 L26 8" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="14" cy="2.4" r="1.6" fill={color} />
      <circle cx="26" cy="2.4" r="1.6" fill={color} />
      <rect x="11" y="8" width="18" height="16" rx="1.5" stroke={color} strokeWidth="2.4" />
      <circle cx="16.5" cy="15" r="1.4" fill={color} />
      <circle cx="23.5" cy="15" r="1.4" fill={color} />
      <path
        d="M20 24 V40 M8.5 30 H31.5 M20 40 L10 58 M20 40 L30 58"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
