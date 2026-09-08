/**
 * Path-pull tab glyph (WG-07, AQ-01): a chunky orthogonal fork of rounded
 * capsules — one trunk splitting into two Paths. Same capsule language as the
 * three-track motif; arranged the way Paths actually leave a Node on the board.
 * Ink in both themes on the teal Path-tab fill.
 */
const GLYPH = "#071c28";

export function PathTracksIcon({ size = 24 }: { size?: number }) {
  const t = 6.2;
  const r = t / 2;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden
      focusable="false"
    >
      <rect x="4.3" y="12.9" width="14.2" height={t} rx={r} fill={GLYPH} />
      <rect x="14.1" y="4.5" width={t} height="22.8" rx={r} fill={GLYPH} />
      <rect x="14.1" y="4.5" width="13.8" height={t} rx={r} fill={GLYPH} />
      <rect x="14.1" y="21.1" width="13.8" height={t} rx={r} fill={GLYPH} />
    </svg>
  );
}

export { PathTracksIcon as PathSpindleIcon };
export { PathTracksIcon as PathKnotIcon };
