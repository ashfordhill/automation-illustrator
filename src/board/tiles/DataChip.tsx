/**
 * Coral oval mark on Data tiles — not yellow (yellow is inspector/view selection)
 * and not teal (Path tab / icy paper family).
 * Lives next to StepKindIcon so board marks stay in tiles/.
 */
import type { CSSProperties } from "react";
import "./dataMark.css";

export function DataChip({ style }: { style?: CSSProperties }) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" style={style} aria-hidden>
      <ellipse
        cx="14"
        cy="14"
        rx="12"
        ry="9"
        fill="var(--data-mark)"
        stroke="var(--ink)"
        strokeWidth="2.6"
      />
    </svg>
  );
}
