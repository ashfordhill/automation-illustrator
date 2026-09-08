/**
 * Path-pull tab glyph (WG-07, AQ-01): three equal round dashes.
 * Drawn as capsules (not stroke-dasharray) so they stay even at tab size.
 * Wider than they are thick so they read as a Path, not an ellipsis.
 * Ink on the teal Path-tab fill.
 */
const GLYPH = "#071c28";

const DASH = 7.6;
const GAP = 2.4;
const THICK = 4.2;
const TOTAL = DASH * 3 + GAP * 2;
const X0 = (32 - TOTAL) / 2;
const Y = (32 - THICK) / 2;

export function PathKnotIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden
      focusable="false"
    >
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          x={X0 + i * (DASH + GAP)}
          y={Y}
          width={DASH}
          height={THICK}
          rx={THICK / 2}
          fill={GLYPH}
        />
      ))}
    </svg>
  );
}
