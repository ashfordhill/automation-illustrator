import { StepKind } from "../../workflow/catalogs";
import {
  isDataFieldNode,
  isStepNode,
  nodeCaption,
  stepDisplayLabel,
  type NodeDto,
} from "../../workflow/types";

/** First line of tile copy (newline split). Empty after trim is "". */
export function firstHeadlineLine(text: string): string {
  return text.split(/\r?\n/, 1)[0]?.trim() ?? "";
}

/**
 * Word-web copy: Type + Name for Steps, Data label.
 * An Other Step with no Name shows "?" — not the word Step.
 */
export function simplifyHeadline(node: NodeDto): string {
  if (isStepNode(node)) {
    const line = firstHeadlineLine(stepDisplayLabel(node.stepKind, node.title));
    if (line) return line;
    if (node.stepKind === StepKind.Other) return "?";
    return nodeCaption(node);
  }
  if (isDataFieldNode(node)) {
    return firstHeadlineLine(node.label) || nodeCaption(node);
  }
  return nodeCaption(node);
}

/**
 * Design-space type for word-web ovals (flow pixels at zoom 1).
 * Camera fit scales the whole web; do not inverse-scale with 1/zoom.
 */
export function simplifyScreenFontPx(_zoom = 1, kind: "step" | "data" = "step"): number {
  return kind === "data" ? 28 : 40;
}

const MAX_OVAL_FLOW_W = 640;
/** Empty Other "?" keeps a real pill, not a sliver. */
export const QUESTION_OVAL_MIN_W = 168;

function estimateTextWidthPx(text: string, fontPx: number): number {
  if (typeof document !== "undefined" && typeof document.createElement === "function") {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.font = `800 ${fontPx}px Nunito, sans-serif`;
      const w = ctx.measureText(text).width;
      if (w > 0) return w;
    }
  }
  return text.length * fontPx * 0.62;
}

/**
 * Flow-pixel oval box at the design font. Zoom is ignored (kept for callers);
 * ELK uses these numbers as node width/height while simplified.
 */
export function measureSimplifyOval(
  text: string,
  _zoom = 1,
  kind: "step" | "data" = "step",
): { w: number; h: number; font: number } {
  const font = simplifyScreenFontPx(1, kind);
  const padX = Math.max(28, font * 0.85);
  const padY = Math.max(16, font * 0.48);
  const rawW = estimateTextWidthPx(text, font) + padX * 2;
  const minW = kind === "step" ? Math.max(QUESTION_OVAL_MIN_W, font * 3.2) : Math.max(120, font * 2.8);
  const w = Math.min(MAX_OVAL_FLOW_W, Math.max(minW, rawW));
  const h = font * 1.35 + padY * 2;
  return { w, h, font };
}

/** ELK / RF node size for one visible word-web oval. */
export function wordWebNodeSize(node: NodeDto): { w: number; h: number } {
  const kind = isDataFieldNode(node) ? "data" : "step";
  const { w, h } = measureSimplifyOval(simplifyHeadline(node), 1, kind);
  return { w, h };
}
