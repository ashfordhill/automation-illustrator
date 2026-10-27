/**
 * Image views, formats, and file names. Kept apart from exportImage.tsx so the
 * Export image window can name files before the exporter (and its embedded
 * font) has loaded.
 */
import { filenameSlug } from "../workflow/serialize";
import { projectDisplayName, type WorkflowDoc } from "../workflow/types";

export type ImageView = "compare" | "before" | "after";
export const IMAGE_VIEWS: readonly ImageView[] = ["compare", "before", "after"];
export type ImageFormat = "svg" | "png";

export const IMAGE_VIEW_LABEL: Record<ImageView, string> = {
  compare: "Compare",
  before: "Before",
  after: "After",
};

/** "Oak Park Invoice", after, png → oak-park-invoice.after.png. Compare has no view suffix. */
export function imageFilename(
  doc: Pick<WorkflowDoc, "name">,
  view: ImageView,
  format: ImageFormat,
): string {
  const slug = filenameSlug(projectDisplayName(doc)) || "untitled";
  return `${slug}${view === "compare" ? "" : `.${view}`}.${format}`;
}
