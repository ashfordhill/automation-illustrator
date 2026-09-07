/**
 * Knot / hook glyph for the Path-pull tab: a filled knot on the left and
 * a short string (one loop + tail) exiting right. Black in both themes.
 */
const GLYPH = "#071c28";

export function PathKnotIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden
      focusable="false"
    >
      <path
        fill={GLYPH}
        fillRule="evenodd"
        d="M11 7.2a8.8 8.8 0 1 1 0 17.6 8.8 8.8 0 0 1 0-17.6zm0 5.2a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2z"
      />
      <path
        fill="none"
        stroke={GLYPH}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.2 14.6c2.6-2.8 6.2-1.4 7.2 1.6.8 2.4-1 4.6-3.2 4.2 2.4 1.8 6.2.2 7.2-3.2"
      />
    </svg>
  );
}
