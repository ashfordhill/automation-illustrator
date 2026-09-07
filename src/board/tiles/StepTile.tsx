/**
 * Combined Step card: actor column + task (icon, Type + Target).
 * Mounted by board/nodes/StepNode.tsx inside React Flow.
 */
import { STEP_H, STEP_W } from "../layout/tileMetrics";
import { stepDisplayLabel, type ActorDto, type StepKind } from "../../workflow/types";
import { ActorColumn } from "./ActorColumn";
import { FitLabel } from "./FitLabel";
import { StepKindIcon } from "./StepKindIcon";

/** Right half of a Step tile — icon, then Type + Target, then optional detail. */
function TaskCard({
  kind,
  title,
  detail,
}: {
  kind: StepKind;
  title: string;
  detail: string;
}) {
  const headline = stepDisplayLabel(kind, title);
  const trimmedDetail = detail.trim();
  return (
    <div className="task-card">
      <StepKindIcon kind={kind} />
      <div className="task-card-title">
        <FitLabel text={headline} maxFontSizePx={14} mode="box" maxLines={3} />
      </div>
      {trimmedDetail ? (
        <div className="task-card-detail">
          <FitLabel text={trimmedDetail} maxFontSizePx={12} mode="box" maxLines={2} />
        </div>
      ) : null}
    </div>
  );
}

export function StepTile({
  actor,
  kind,
  title,
  detail,
  selected,
  lifted,
}: {
  actor: ActorDto | undefined;
  kind: StepKind;
  title: string;
  detail: string;
  selected?: boolean;
  lifted?: boolean;
}) {
  return (
    <div
      className={`board-node step-piece${selected ? " selected" : ""}`}
      style={{
        width: STEP_W,
        height: STEP_H,
        display: "flex",
        border: `3px solid var(--line)`,
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
      <TaskCard kind={kind} title={title} detail={detail} />
    </div>
  );
}
