/**
 * Shrinks and wraps a string so it stays inside a fixed chip.
 * Uses auto-text-size instead of growing the actor column.
 */
import { AutoTextSize } from "auto-text-size";

export function FitLabel({
  text,
  maxFontSizePx,
  minFontSizePx = 8,
  mode = "box",
}: {
  text: string;
  maxFontSizePx: number;
  minFontSizePx?: number;
  mode?: "box" | "multiline";
}) {
  return (
    <AutoTextSize
      mode={mode}
      minFontSizePx={minFontSizePx}
      maxFontSizePx={maxFontSizePx}
      style={{
        fontWeight: 800,
        textAlign: "center",
        lineHeight: 1.15,
        color: "var(--ink)",
      }}
    >
      {text}
    </AutoTextSize>
  );
}
