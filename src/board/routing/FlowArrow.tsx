/**
 * Orthogonal flow Path between tiles.
 * Stroke is edge.dashed, or exclusive-split fallback (graph.edgeIsDotted).
 * During − pick, matching Paths flash (.edge-pick / .edge-pick-on in tokens.css).
 */
import { BaseEdge, EdgeLabelRenderer, type EdgeProps } from "@xyflow/react";
import { useStore } from "../../state/store";
import { edgeIsDotted, outgoingSorted } from "../../workflow/graph";
import { GRID } from "../layout/tileMetrics";

/** Right-angle path with a label anchor at the elbow / midpoint. */
function orthogonalPath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
): [string, number, number] {
  const sx = Math.round(sourceX);
  const sy = Math.round(sourceY);
  const tx = Math.round(targetX);
  const ty = Math.round(targetY);
  if (Math.abs(sy - ty) < GRID) {
    const y = Math.round((sy + ty) / 2);
    return [`M ${sx} ${y} L ${tx} ${y}`, (sx + tx) / 2, y];
  }
  const midX = sx + Math.max(GRID, Math.round((tx - sx) / 2));
  return [
    `M ${sx} ${sy} L ${midX} ${sy} L ${midX} ${ty} L ${tx} ${ty}`,
    midX,
    Math.round((sy + ty) / 2),
  ];
}

export function FlowArrow({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  selected,
}: EdgeProps) {
  const workflow = useStore((s) => s.workflow);
  const pathPick = useStore((s) => s.pathPick);
  const edge = workflow.edges.find((e) => e.id === id);
  const dotted = edge ? edgeIsDotted(workflow.nodes, workflow.edges, edge) : false;
  const [path, labelX, labelY] = orthogonalPath(sourceX, sourceY, targetX, targetY);
  const outs = pathPick
    ? outgoingSorted(workflow.nodes, workflow.edges, pathPick.sourceId)
    : [];
  const pickIndex = outs.findIndex((e) => e.id === id);
  const flashing = pickIndex >= 0;
  const pickOn = flashing && pickIndex === pathPick?.index;
  const className = pickOn ? "edge-pick-on" : flashing ? "edge-pick" : undefined;

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        className={className}
        style={{
          stroke: pickOn ? "var(--blue-deep)" : "var(--line)",
          strokeWidth: selected || pickOn ? 4 : 2.75,
          strokeDasharray: dotted ? "8 7" : undefined,
          strokeLinecap: "square",
        }}
      />
      {edge?.label ? (
        <EdgeLabelRenderer>
          <div
            className="nopan"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              background: "var(--cream)",
              border: "3px solid var(--line)",
              borderRadius: 10,
              padding: "3px 9px",
              fontSize: 12,
              fontWeight: 800,
              whiteSpace: "nowrap",
              pointerEvents: "all",
              color: "var(--ink)",
              boxShadow: "var(--chip-shadow)",
            }}
          >
            {edge.label}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}
