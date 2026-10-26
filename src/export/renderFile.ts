/**
 * One workflow file in, images out: the contract behind render.html.
 * The document goes through the same parser as Import; the look comes from the
 * `.illustrator` header (horizontal Ice when it has none).
 */
import { exportLayoutEngine } from "../board/layout/elkClient";
import { parseDocument } from "../workflow/migrate";
import { parseWorkflowText } from "../workflow/serialize";
import { projectDisplayName } from "../workflow/types";
import { readAppearance, type Appearance } from "./appearance";
import {
  IMAGE_VIEWS,
  renderBoardImage,
  svgToPng,
  type ImageFormat,
  type ImageView,
} from "./exportImage";

export type RenderRequest = {
  /** Defaults to every view: compare, before, after. */
  views?: ImageView[];
  /** Defaults to svg. */
  formats?: ImageFormat[];
  /** PNG pixels per board pixel. Defaults to 2. */
  scale?: number;
};

export type RenderedView = {
  view: ImageView;
  width: number;
  height: number;
  svg?: string;
  /** Base64 PNG bytes. */
  png?: string;
};

export type RenderResult =
  | { ok: true; name: string; appearance: Appearance; images: RenderedView[] }
  | { ok: false; message: string };

const FORMATS: readonly ImageFormat[] = ["svg", "png"];

async function base64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

export async function renderIllustratorFile(
  text: string,
  request: RenderRequest = {},
): Promise<RenderResult> {
  const parsed = parseDocument(text);
  if (!parsed.ok) return { ok: false, message: parsed.message };
  let header: unknown = null;
  try {
    header = parseWorkflowText(text);
  } catch {
    header = null;
  }
  const appearance = readAppearance(header);
  const views = (request.views ?? []).filter((v) => IMAGE_VIEWS.includes(v));
  const formats = (request.formats ?? []).filter((f) => FORMATS.includes(f));
  const images: RenderedView[] = [];
  for (const view of views.length ? views : IMAGE_VIEWS) {
    const image = await renderBoardImage(parsed.doc, view, { appearance, engine: exportLayoutEngine });
    const out: RenderedView = { view, width: image.width, height: image.height };
    if (!formats.length || formats.includes("svg")) out.svg = image.svg;
    if (formats.includes("png")) out.png = await base64(await svgToPng(image, request.scale ?? 2));
    images.push(out);
  }
  return { ok: true, name: projectDisplayName(parsed.doc), appearance, images };
}
