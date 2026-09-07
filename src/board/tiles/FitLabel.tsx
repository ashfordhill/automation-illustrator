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
  color = "var(--ink)",
  hug = false,
}: {
  text: string;
  maxFontSizePx: number;
  minFontSizePx?: number;
  mode?: "box" | "multiline" | "oneline";
  maxLines?: number;
  color?: string;
  hug?: boolean;
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
            lineHeight: hug ? 1 : 1.15,
            color,
            width: "100%",
            height: hug ? "auto" : "100%",
            maxHeight: hug ? "2.4em" : undefined,
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
