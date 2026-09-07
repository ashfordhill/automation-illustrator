/**
 * Wrapped Path-condition chip size. Fed to ELK as inline edge-label boxes (CX-04, CX-05).
 * Explicit max width; extra lines clamp with an ellipsis. No DOM required.
 */
import { GRID } from "./tileMetrics";

/** Widest a condition chip may grow before wrapping (CX-04). */
export const LABEL_MAX_WIDTH = GRID * 6;
export const LABEL_MAX_LINES = 3;
export const LABEL_FONT_PX = 12;
export const LABEL_LINE_HEIGHT = 1.2;
export const LABEL_PAD_X = 10;
export const LABEL_PAD_Y = 6;
export const LABEL_BORDER = 3;

const CHAR_PX = LABEL_FONT_PX * 0.62;

export type LabelBox = { w: number; h: number; lines: string[] };

function wrapLine(text: string, maxChars: number): string[] {
  const t = text.trim();
  if (!t) return [];
  if (t.length <= maxChars) return [t];
  const out: string[] = [];
  let rest = t;
  while (rest.length > maxChars) {
    const slice = rest.slice(0, maxChars);
    const space = slice.lastIndexOf(" ");
    const cut = space >= Math.floor(maxChars * 0.4) ? space : maxChars;
    out.push(rest.slice(0, cut).trimEnd());
    rest = rest.slice(cut).trimStart();
  }
  if (rest) out.push(rest);
  return out;
}

/** Wrap then clamp to LABEL_MAX_LINES. Full original text stays the accessible name. */
export function wrapConditionLines(text: string, maxWidth = LABEL_MAX_WIDTH): string[] {
  const inner = Math.max(48, maxWidth - LABEL_PAD_X * 2 - LABEL_BORDER * 2);
  const maxChars = Math.max(8, Math.floor(inner / CHAR_PX));
  const wrapped = wrapLine(text, maxChars);
  if (wrapped.length <= LABEL_MAX_LINES) return wrapped;
  const kept = wrapped.slice(0, LABEL_MAX_LINES);
  const last = kept[LABEL_MAX_LINES - 1] ?? "";
  kept[LABEL_MAX_LINES - 1] = `${last.replace(/\s+\S*$/, "").slice(0, Math.max(1, maxChars - 1))}…`;
  return kept;
}

/** Pixel box for a condition chip, including border and padding. */
export function measureLabelBox(text: string): LabelBox {
  const t = text.trim();
  if (!t) return { w: 0, h: 0, lines: [] };
  const lines = wrapConditionLines(t);
  const innerW = Math.max(...lines.map((line) => Math.ceil(line.length * CHAR_PX)), 1);
  const h = Math.max(
    48,
    Math.ceil(lines.length * LABEL_FONT_PX * LABEL_LINE_HEIGHT) +
      LABEL_PAD_Y * 2 +
      LABEL_BORDER * 2,
  );
  const w = Math.min(
    LABEL_MAX_WIDTH,
    Math.max(48, GRID, innerW + LABEL_PAD_X * 2 + LABEL_BORDER * 2),
  );
  return { w, h, lines };
}
