/**
 * Spindle (bobbin: two discs + a short shaft) with one thread curving off
 * to the right — Path-pull tab glyph (WG-07, AQ-01). Black in both themes
 * on the teal Path-tab fill.
 */
const GLYPH = "#071c28";

export function PathSpindleIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden
      focusable="false"
    >
      <ellipse cx="12" cy="7.6" rx="7" ry="2.5" fill={GLYPH} />
      <ellipse cx="12" cy="24.4" rx="7" ry="2.5" fill={GLYPH} />
      <path fill={GLYPH} d="M6.8 8.4h10.4v15.2H6.8z" />
      <ellipse cx="12" cy="16" rx="5.1" ry="2.1" fill={GLYPH} />
      <path
        fill="none"
        stroke={GLYPH}
        strokeWidth="2.2"
        strokeLinecap="round"
        d="M19.4 14.2c3.4-3.6 8.2-1.4 9.4 2.4"
      />
    </svg>
  );
}

export { PathSpindleIcon as PathKnotIcon };
