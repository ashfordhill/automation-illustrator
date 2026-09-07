/**
 * Wrap, shrink to a readable minimum, then clamp with ellipsis (NA-10).
 * The full string stays on title and aria-label so truncated copy is still exposed.
 */
import { AutoTextSize } from "auto-text-size";

/** Smallest tile type that stays readable (NA-10). */
export const MIN_TILE_FONT_PX = 11;

export function FitLabel({
  text,
  maxFontSizePx,
  minFontSizePx = MIN_TILE_FONT_PX,
  mode = "box",
  maxLines = 3,
}: {
  text: string;
  maxFontSizePx: number;
  minFontSizePx?: number;
  mode?: "box" | "multiline" | "oneline";
  maxLines?: number;
}) {
  const oneline = mode === "oneline";
  return (
    <div className="fit-label" title={text} role="group" aria-label={text}>
      <div className={`fit-label-fit${oneline ? " is-oneline" : ""}`}>
        <AutoTextSize
          mode={mode}
          minFontSizePx={minFontSizePx}
          maxFontSizePx={maxFontSizePx}
          style={{
            fontWeight: 800,
            textAlign: "center",
            lineHeight: 1.15,
            color: "var(--ink)",
            width: "100%",
            height: "100%",
            overflow: "hidden",
            overflowWrap: "anywhere",
            wordBreak: "break-word",
            ...(oneline
              ? { textOverflow: "ellipsis", whiteSpace: "nowrap" as const }
              : {
                  display: "-webkit-box",
                  WebkitBoxOrient: "vertical" as const,
                  WebkitLineClamp: maxLines,
                }),
          }}
        >
          {text}
        </AutoTextSize>
      </div>
    </div>
  );
}
