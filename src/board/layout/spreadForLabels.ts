/**
 * Push targets (and everything at/right of them) so long Path conditions fit in the gap.
 * Interim layout helper until Slice 9; runs inside store.commit so typed conditions
 * like `invoice > $50,000` do not sit under tiles.
 */
import type { EdgeDto, NodeDto } from "../../workflow/types";
import { gapForLabel, nodeSize } from "./tileMetrics";

function nodeOf(nodes: NodeDto[], id: string) {
  return nodes.find((n) => n.id === id);
}

export function spreadForLabels(nodes: NodeDto[], edges: EdgeDto[]): NodeDto[] {
  const labeled = edges
    .filter((e) => e.label.trim())
    .slice()
    .sort((a, b) => {
      const na = nodeOf(nodes, a.source);
      const nb = nodeOf(nodes, b.source);
      return (na?.position.x ?? 0) - (nb?.position.x ?? 0);
    });
  if (!labeled.length) return nodes;

  let next = nodes;
  let changed = false;
  for (const e of labeled) {
    const src = nodeOf(next, e.source);
    const tgt = nodeOf(next, e.target);
    if (!src || !tgt) continue;
    const srcW = nodeSize(src.type).w;
    const need = gapForLabel(e.label);
    const gap = tgt.position.x - (src.position.x + srcW);
    if (gap >= need) continue;
    const delta = need - gap;
    const threshold = tgt.position.x;
    next = next.map((n) =>
      n.id !== src.id && n.position.x >= threshold
        ? { ...n, position: { ...n.position, x: n.position.x + delta } }
        : n,
    );
    changed = true;
  }
  return changed ? next : nodes;
}
