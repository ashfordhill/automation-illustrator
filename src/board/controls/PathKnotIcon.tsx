/**
 * Knot / hook glyph for the Path-pull tab: a black loop you pull a string from.
 */
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
        fill="currentColor"
        d="M6.5 11.2h9.2c.4-2.8 2.7-5 5.6-5 3.2 0 5.8 2.6 5.8 5.9 0 3.2-2.6 5.8-5.8 5.8-1.8 0-3.4-.8-4.5-2.1v2.3c1.3 1 2.9 1.6 4.5 1.6 4.3 0 7.8-3.5 7.8-7.6S23.3 4.2 19 4.2c-3.4 0-6.3 2.2-7.4 5.2H6.5c-.8 0-1.4.6-1.4 1.4s.6 1.4 1.4 1.4zm0 5.4h8.4v2.8H6.5c-.8 0-1.4.6-1.4 1.4s.6 1.4 1.4 1.4h7.2l2.2 4.6c.2.5.8.8 1.3.6.5-.2.8-.8.6-1.3l-1.8-3.9h2.1c.8 0 1.4-.6 1.4-1.4 0-.7-.6-1.4-1.4-1.4h-2.4v-2.8H25c.8 0 1.5-.6 1.5-1.4s-.7-1.4-1.5-1.4H6.5c-.8 0-1.4.6-1.4 1.4s.6 1.4 1.4 1.4z"
      />
    </svg>
  );
}
