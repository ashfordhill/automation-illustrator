/**
 * Oval mark on Data tiles. Unset color uses the theme purple (`--data-mark`),
 * not yellow (inspector/view selection), teal (Path tab), or Missy’s lavender Who.
 * Lives next to StepKindIcon so board marks stay in tiles/.
 */
import type { CSSProperties } from "react";
import "./dataMark.css";

/** Keep in sync with `--data-mark` in dataMark.css. The picker shows these when a tile has no stored color. */
export const DATA_MARK_LIGHT = "#ae78f2";
export const DATA_MARK_DARK = "#c9a6ff";

export function DataChip({ color, style }: { color?: string; style?: CSSProperties }) {
  const fill = color?.trim() || "var(--data-mark)";
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" style={style} aria-hidden>
      <ellipse
        cx="14"
        cy="14"
        rx="12"
        ry="9"
        fill={fill}
        stroke="var(--ink)"
        strokeWidth="2.6"
      />
    </svg>
  );
}
