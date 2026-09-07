/**
 * Giant merged Step: normal-size Robot plus condensed internal flow (MG-08).
 * No System/detail text. Conditions and strokes stay on internal Paths (MG-09).
 */
import type { GroupInternals } from "../../state/projection";
import type { ActorDto, WorkflowDoc } from "../../workflow/types";
import { ActorColumn } from "./ActorColumn";
import { DataChip } from "./DataChip";
import { FitLabel } from "./FitLabel";
import { StepKindIcon } from "./StepKindIcon";
import { layoutMergeFlow } from "../layout/mergeFlow";

export function MergedStepTile({
  actor,
  doc,
  internals,
  selected,
  lifted,
}: {
  actor: ActorDto | undefined;
  doc: WorkflowDoc;
  internals: GroupInternals;
  selected?: boolean;
  lifted?: boolean;
}) {
  const layout = layoutMergeFlow(doc, internals);
  return (
    <div
      className={`board-node step-piece merge-flow-tile${selected ? " selected" : ""}`}
      data-merge-group={internals.groupId}
      style={{
        width: layout.width,
        height: layout.height,
        display: "flex",
        alignItems: "flex-start",
        border: "3px solid var(--line)",
        borderRadius: 14,
        overflow: "hidden",
        background: "var(--cream)",
        boxShadow: lifted
          ? "0 10px 0 var(--btn-shadow), 0 18px 24px var(--btn-shadow)"
          : "0 5px 0 var(--btn-shadow)",
        transform: lifted ? "translateY(-3px)" : selected ? "translateY(-1px)" : undefined,
        outline: selected ? "3px solid var(--select-ring)" : "none",
        outlineOffset: 4,
        transition: "transform 140ms ease, box-shadow 140ms ease",
      }}
    >
      <ActorColumn actor={actor} />
      <div
        className="merge-flow-pane"
        style={{
          position: "relative",
          flex: 1,
          height: layout.height,
          minWidth: 0,
        }}
      >
        <svg
          width={layout.width}
          height={layout.height}
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
          aria-hidden
        >
          {layout.edges.map((e) => (
            <g key={e.id}>
              <path
                d={`M ${layout.flowX + e.x1} ${layout.flowY + e.y1} H ${layout.flowX + (e.x1 + e.x2) / 2} V ${layout.flowY + e.y2} H ${layout.flowX + e.x2}`}
                fill="none"
                stroke="var(--ink)"
                strokeWidth={2.4}
                strokeDasharray={e.dotted ? "5 4" : undefined}
                strokeLinecap="square"
              />
              {e.condition ? (
                <text
                  x={layout.flowX + (e.x1 + e.x2) / 2}
                  y={layout.flowY + (e.y1 + e.y2) / 2 - 4}
                  textAnchor="middle"
                  fill="var(--ink)"
                  fontSize="9"
                  fontWeight="800"
                  fontFamily="inherit"
                >
                  {e.condition.length > 22 ? `${e.condition.slice(0, 21)}…` : e.condition}
                </text>
              ) : null}
            </g>
          ))}
        </svg>
        {layout.nodes.map((n) => (
          <div
            key={n.id}
            className={n.kind === "step" ? "merge-flow-step" : "merge-flow-data"}
            style={{
              position: "absolute",
              left: layout.flowX + n.x,
              top: layout.flowY + n.y,
              width: n.w,
              height: n.h,
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "2px 4px",
              boxSizing: "border-box",
              border: "2px solid var(--line)",
              borderRadius: n.kind === "data" ? 999 : 8,
              background: n.kind === "data" ? "var(--yellow)" : "var(--paper)",
              overflow: "hidden",
            }}
          >
            {n.kind === "step" && n.stepKind ? (
              <div style={{ flex: "0 0 auto", transform: "scale(0.55)", transformOrigin: "left center" }}>
                <StepKindIcon kind={n.stepKind} size={36} />
              </div>
            ) : (
              <DataChip style={{ width: 16, height: 16 }} />
            )}
            <div style={{ flex: 1, minWidth: 0, height: "100%" }}>
              <FitLabel text={n.title} maxFontSizePx={11} minFontSizePx={9} mode="box" maxLines={2} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
