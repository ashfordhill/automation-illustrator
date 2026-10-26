/**
 * Text layout for image export, mirroring what FitLabel shows on the board.
 * auto-text-size's `multiline` mode keeps one line at the largest size that fits
 * the width and wraps only at the minimum. Its `box` mode settles on the minimum
 * size for the board's auto-height boxes, so box labels wrap at that size.
 * Lines past the clamp end in an ellipsis. Widths come from a canvas when the
 * page has one (the app, the render page); jsdom falls back to an average glyph.
 */
export const EXPORT_FONT_FAMILY = '"Nunito Variable", Nunito, system-ui, sans-serif';

const FALLBACK_EM = 0.6;
const FALLBACK_ASCENT = 1.011;
const FALLBACK_DESCENT = 0.353;
const SIZE_STEP_PX = 0.5;
const ELLIPSIS = "…";

type Measurer = {
  width(text: string, sizePx: number, weight: number): number;
  ascent: number;
  descent: number;
};

let measurer: Measurer | null = null;

function canvasContext(): CanvasRenderingContext2D | null {
  if (typeof document === "undefined") return null;
  if (typeof navigator !== "undefined" && /jsdom/i.test(navigator.userAgent)) return null;
  try {
    return document.createElement("canvas").getContext("2d");
  } catch {
    return null;
  }
}

function getMeasurer(): Measurer {
  if (measurer) return measurer;
  const ctx = canvasContext();
  if (!ctx) {
    measurer = {
      width: (text, sizePx) => text.length * sizePx * FALLBACK_EM,
      ascent: FALLBACK_ASCENT,
      descent: FALLBACK_DESCENT,
    };
    return measurer;
  }
  ctx.font = `800 100px ${EXPORT_FONT_FAMILY}`;
  const probe = ctx.measureText("Hg");
  measurer = {
    width(text, sizePx, weight) {
      ctx.font = `${weight} ${sizePx}px ${EXPORT_FONT_FAMILY}`;
      return ctx.measureText(text).width;
    },
    ascent: probe.fontBoundingBoxAscent ? probe.fontBoundingBoxAscent / 100 : FALLBACK_ASCENT,
    descent: probe.fontBoundingBoxDescent ? probe.fontBoundingBoxDescent / 100 : FALLBACK_DESCENT,
  };
  return measurer;
}

/** Forget cached metrics; call after the export font finishes loading. */
export function resetTextMeasurer(): void {
  measurer = null;
}

export function textWidth(text: string, sizePx: number, weight = 800): number {
  return getMeasurer().width(text, sizePx, weight);
}

export type WrapBox = {
  width: number;
  size: number;
  maxLines: number;
  lineHeight: number;
  /** Clamp to the lines that fit this height too. Omitted when the box grows with its text. */
  height?: number;
  weight?: number;
};

export type FittedText = { size: number; lines: string[]; lineHeight: number };

function splitWord(word: string, maxWidth: number, size: number, weight: number): string[] {
  const out: string[] = [];
  let piece = "";
  for (const ch of word) {
    if (piece && textWidth(piece + ch, size, weight) > maxWidth) {
      out.push(piece);
      piece = ch;
    } else {
      piece += ch;
    }
  }
  if (piece) out.push(piece);
  return out;
}

/** Greedy wrap at spaces; a word wider than the line breaks anywhere (`overflow-wrap: anywhere`). */
function wrap(text: string, maxWidth: number, size: number, weight: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const joined = line ? `${line} ${word}` : word;
    if (textWidth(joined, size, weight) <= maxWidth) {
      line = joined;
      continue;
    }
    if (line) lines.push(line);
    if (textWidth(word, size, weight) <= maxWidth) {
      line = word;
      continue;
    }
    const pieces = splitWord(word, maxWidth, size, weight);
    lines.push(...pieces.slice(0, -1));
    line = pieces[pieces.length - 1] ?? "";
  }
  if (line) lines.push(line);
  return lines;
}

function withEllipsis(line: string, maxWidth: number, size: number, weight: number): string {
  let kept = line;
  while (kept.length > 0 && textWidth(`${kept}${ELLIPSIS}`, size, weight) > maxWidth) {
    kept = kept.slice(0, -1);
  }
  return `${kept.trimEnd()}${ELLIPSIS}`;
}

/** Wrap at one size, then clamp to `maxLines` (and `height`) with an ellipsis. */
export function wrapText(text: string, box: WrapBox): FittedText {
  const weight = box.weight ?? 800;
  const t = text.trim();
  if (!t) return { size: box.size, lines: [], lineHeight: box.lineHeight };
  const lines = wrap(t, box.width, box.size, weight);
  const byHeight =
    box.height == null
      ? box.maxLines
      : Math.max(1, Math.floor((box.height + 0.5) / (box.size * box.lineHeight)));
  const keep = Math.min(box.maxLines, byHeight);
  if (lines.length <= keep) return { size: box.size, lines, lineHeight: box.lineHeight };
  const kept = lines.slice(0, keep);
  kept[keep - 1] = withEllipsis(kept[keep - 1]!, box.width, box.size, weight);
  return { size: box.size, lines: kept, lineHeight: box.lineHeight };
}

/** `multiline` mode: one line at the largest size from max to min, else wrap at min. */
export function fitOneLine(
  text: string,
  box: Omit<WrapBox, "size" | "height"> & { maxFont: number; minFont: number },
): FittedText {
  const weight = box.weight ?? 800;
  const t = text.trim().replace(/\s+/g, " ");
  for (let size = box.maxFont; size >= box.minFont - 1e-6; size -= SIZE_STEP_PX) {
    if (t && textWidth(t, size, weight) <= box.width) {
      return { size, lines: [t], lineHeight: box.lineHeight };
    }
  }
  return wrapText(t, { ...box, size: box.minFont });
}

/** Alphabetic baseline of line `index` in a block whose first line box starts at `top`. */
export function baselineY(top: number, index: number, size: number, lineHeight: number): number {
  const m = getMeasurer();
  const lineBox = size * lineHeight;
  const halfLeading = (lineBox - (m.ascent + m.descent) * size) / 2;
  return top + index * lineBox + halfLeading + m.ascent * size;
}

export function blockHeight(fitted: FittedText): number {
  return fitted.lines.length * fitted.size * fitted.lineHeight;
}
