/**
 * Top-down mouse with the right button filled (P-06 / P-05).
 * Uses currentColor so hints and status chrome can tint it.
 */
export function MouseRightClickIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
      focusable="false"
      data-mouse-right-click=""
    >
      <path
        d="M12 3.25h4.2A4.05 4.05 0 0 1 20.25 7.3v3.95H12Z"
        fill="currentColor"
      />
      <path
        d="M8.1 3.25h7.8A4.05 4.05 0 0 1 20 7.3v9.2A7.05 7.05 0 0 1 12 22.75 7.05 7.05 0 0 1 4 16.5V7.3A4.05 4.05 0 0 1 8.1 3.25Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinejoin="round"
      />
      <path
        d="M12 3.25v8M4.15 11.25h15.7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
      />
    </svg>
  );
}
