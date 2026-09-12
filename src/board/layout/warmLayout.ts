/**
 * Kick the shared ELK pass as soon as the document is known so the first
 * board paint can wait on a cache hit instead of a cold worker.
 */
import { projectBefore } from "../../state/projection";
import { AssignmentLane } from "../../workflow/catalogs";
import type { WorkflowDoc } from "../../workflow/types";
import { loadBoardOrientation } from "../../state/persistence";
import { layoutEngine } from "./elkClient";
import { measureLabelBox, type LabelBox } from "./labelBox";

export function warmDocumentLayout(doc: WorkflowDoc): Promise<unknown> {
  if (!doc.nodes.length) return Promise.resolve();
  const projection = projectBefore(doc);
  const boxes: Record<string, LabelBox> = {};
  for (const e of projection.edges) {
    if (e.label.trim()) boxes[e.id] = measureLabelBox(e.label);
  }
  return layoutEngine.request(
    AssignmentLane.Before,
    projection,
    boxes,
    undefined,
    undefined,
    "tile",
    loadBoardOrientation(),
  );
}
