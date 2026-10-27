/**
 * Image export: lay out the requested lanes with ELK, draw them with BoardSvg,
 * and serialize one self-contained SVG (font embedded, colors concrete). PNG is
 * that SVG drawn on a canvas. Shared by the Export image window and render.html,
 * which the render Action drives in headless Chromium.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { AssignmentLane } from "../workflow/catalogs";
import { laneBoard, projectDisplayName, type WorkflowDoc } from "../workflow/types";
import { projectLane, type LaneProjection } from "../state/projection";
import { flowProfile } from "../board/flow/flowProfile";
import { measureLabelBox, type LabelBox } from "../board/layout/labelBox";
import type { LaneLayout } from "../board/layout/laneLayout";
import type { LayoutEngine } from "../board/layout/layoutEngine";
import { GRID, nodeSize } from "../board/layout/tileMetrics";
import { TextureCell } from "../board/PaperTexture";
import type { Appearance } from "./appearance";
import { CAPTION_H, LaneArt, LaneCaption } from "./BoardSvg";
import { BOARD_TOKENS, CHIP_SHADOW, TILE_SHADOW, resolveCssVars } from "./boardTokens";
import { exportFontCss, loadExportFont } from "./fontFace";
import { IMAGE_VIEW_LABEL, type ImageView } from "./imageFiles";
import { EXPORT_FONT_FAMILY, resetTextMeasurer } from "./textFit";

export {
  IMAGE_VIEW_LABEL,
  IMAGE_VIEWS,
  imageFilename,
  type ImageFormat,
  type ImageView,
} from "./imageFiles";

export type BoardImage = { svg: string; width: number; height: number };

export type ImageOptions = {
  appearance: Appearance;
  /** Lays out lanes the cache does not already hold. */
  engine: LayoutEngine;
  /** The Board's engine: a lane already on screen exports with exactly that layout. */
  cache?: LayoutEngine;
};

const MARGIN = 40;
const CAPTION_TOP = 24;
const HEADER = CAPTION_TOP + CAPTION_H + 16;
const DIVIDER = 3;
const EMPTY_LANE = { x: 0, y: 0, w: 320, h: 120 };

type Box = { x: number; y: number; w: number; h: number };

type LanePlan = {
  lane: AssignmentLane;
  projection: LaneProjection;
  layout: LaneLayout;
  box: Box;
};

type PlacedLane = { plan: LanePlan; frame: Box; tx: number; ty: number };

function lanesFor(view: ImageView): AssignmentLane[] {
  if (view === "compare") return [AssignmentLane.Before, AssignmentLane.After];
  return [view === "after" ? AssignmentLane.After : AssignmentLane.Before];
}

/** Tiles (with their drop shadow), Path routes, and chips, in board coordinates. */
function contentBox(projection: LaneProjection, layout: LaneLayout): Box {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  const add = (x: number, y: number, w = 0, h = 0) => {
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x + w);
    y1 = Math.max(y1, y + h);
  };
  for (const n of projection.nodes) {
    const at = layout.positions[n.id] ?? n.position;
    const size = nodeSize(n.type);
    add(at.x, at.y, size.w, size.h + TILE_SHADOW.dy);
  }
  for (const route of Object.values(layout.routes)) for (const p of route) add(p.x, p.y);
  for (const rect of Object.values(layout.labels)) add(rect.x, rect.y, rect.w, rect.h + CHIP_SHADOW.dy);
  return Number.isFinite(x0) ? { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } : EMPTY_LANE;
}

async function planLane(
  doc: WorkflowDoc,
  lane: AssignmentLane,
  { appearance, engine, cache }: ImageOptions,
): Promise<LanePlan> {
  const projection = projectLane(doc, lane);
  const boxes: Record<string, LabelBox> = {};
  for (const e of projection.edges) {
    if (e.label.trim()) boxes[e.id] = measureLabelBox(e.label);
  }
  const orientation = appearance.orientation;
  const key = engine.keyFor(projection, boxes, {}, "tile", orientation);
  const layout =
    cache?.get(key) ??
    engine.get(key) ??
    (await engine.request(lane, projection, boxes, {}, undefined, "tile", orientation));
  return { lane, projection, layout, box: contentBox(projection, layout) };
}

/**
 * Compare stacks like the board's Compare split: Before above After when the
 * flow runs left to right, side by side when it runs down. Lanes share the
 * across-flow offset so matching tiles line up.
 */
function placeLanes(plans: LanePlan[], stack: "column" | "row") {
  const placed: PlacedLane[] = [];
  if (stack === "column") {
    const minX = Math.min(...plans.map((p) => p.box.x));
    const maxX = Math.max(...plans.map((p) => p.box.x + p.box.w));
    const width = Math.ceil(maxX - minX + MARGIN * 2);
    let y = 0;
    plans.forEach((plan, i) => {
      const h = Math.ceil(plan.box.h + HEADER + MARGIN);
      placed.push({ plan, frame: { x: 0, y, w: width, h }, tx: MARGIN - minX, ty: y + HEADER - plan.box.y });
      y += h + (i < plans.length - 1 ? DIVIDER : 0);
    });
    return { placed, width, height: y };
  }
  const minY = Math.min(...plans.map((p) => p.box.y));
  const maxY = Math.max(...plans.map((p) => p.box.y + p.box.h));
  const height = Math.ceil(maxY - minY + HEADER + MARGIN);
  let x = 0;
  plans.forEach((plan, i) => {
    const w = Math.ceil(plan.box.w + MARGIN * 2);
    placed.push({ plan, frame: { x, y: 0, w, h: height }, tx: x + MARGIN - plan.box.x, ty: HEADER - minY });
    x += w + (i < plans.length - 1 ? DIVIDER : 0);
  });
  return { placed, width: x, height };
}

/** Every string the image draws, so the font embed covers it. */
function visibleText(doc: WorkflowDoc, lanes: AssignmentLane[]): string {
  const parts = ["Before After", ...doc.actors.map((a) => `${a.name} ${a.role}`)];
  for (const lane of lanes) {
    const board = laneBoard(doc, lane);
    for (const n of board.nodes) parts.push("label" in n ? n.label : `${n.title} ${n.detail}`);
    for (const e of board.edges) parts.push(e.label);
  }
  return parts.join(" ");
}

function mod(n: number, period: number): number {
  return ((n % period) + period) % period;
}

function ImageSvg({
  doc,
  title,
  placed,
  width,
  height,
  appearance,
  fontCss,
}: {
  doc: WorkflowDoc;
  title: string;
  placed: PlacedLane[];
  width: number;
  height: number;
  appearance: Appearance;
  fontCss: string;
}) {
  const first = placed[0]!;
  const { texture, colors } = appearance.theme;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fontFamily={EXPORT_FONT_FAMILY}
    >
      <title>{title}</title>
      <defs>
        <style dangerouslySetInnerHTML={{ __html: fontCss }} />
        <pattern
          id="paper-texture"
          patternUnits="userSpaceOnUse"
          width={GRID}
          height={GRID}
          x={mod(first.tx, GRID)}
          y={mod(first.ty, GRID)}
        >
          <TextureCell pattern={texture.pattern} color={texture.color} />
        </pattern>
      </defs>
      <rect width={width} height={height} fill={colors.paper} />
      <rect width={width} height={height} fill="url(#paper-texture)" />
      {placed.slice(1).map((p) =>
        p.frame.y > 0 ? (
          <rect key={`div-${p.plan.lane}`} y={p.frame.y - DIVIDER} width={width} height={DIVIDER} fill="var(--line)" />
        ) : (
          <rect key={`div-${p.plan.lane}`} x={p.frame.x - DIVIDER} width={DIVIDER} height={height} fill="var(--line)" />
        ),
      )}
      {placed.map((p) => (
        <g key={p.plan.lane}>
          <LaneCaption
            x={p.frame.x + MARGIN}
            y={p.frame.y + CAPTION_TOP}
            text={p.plan.lane === AssignmentLane.After ? "After" : "Before"}
          />
          <g transform={`translate(${p.tx} ${p.ty})`}>
            <LaneArt
              doc={doc}
              lane={p.plan.lane}
              projection={p.plan.projection}
              layout={p.plan.layout}
              idPrefix={`clip-${p.plan.lane}`}
            />
          </g>
        </g>
      ))}
    </svg>
  );
}

/** One self-contained SVG of the chosen view in the given look. */
export async function renderBoardImage(
  doc: WorkflowDoc,
  view: ImageView,
  options: ImageOptions,
): Promise<BoardImage> {
  await loadExportFont();
  resetTextMeasurer();
  const lanes = lanesFor(view);
  const plans: LanePlan[] = [];
  for (const lane of lanes) plans.push(await planLane(doc, lane, options));
  const { placed, width, height } = placeLanes(plans, flowProfile(options.appearance.orientation).stack);
  const markup = renderToStaticMarkup(
    <ImageSvg
      doc={doc}
      title={`${projectDisplayName(doc)} — ${IMAGE_VIEW_LABEL[view]}`}
      placed={placed}
      width={width}
      height={height}
      appearance={options.appearance}
      fontCss={exportFontCss(visibleText(doc, lanes))}
    />,
  );
  const svg = resolveCssVars(markup, {
    ...BOARD_TOKENS,
    "--paper": options.appearance.theme.colors.paper,
    "--grid-dot": options.appearance.theme.texture.color,
  });
  return { svg: `${svg}\n`, width, height };
}

/** Draw the SVG on a canvas at `scale` and encode PNG. Browser only. */
export async function svgToPng(image: BoardImage, scale = 2): Promise<Blob> {
  const url = URL.createObjectURL(new Blob([image.svg], { type: "image/svg+xml" }));
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is unavailable.");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("PNG encoding failed."))), "image/png");
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}
