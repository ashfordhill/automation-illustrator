/**
 * Combined Step card: actor column + task (icon, Type + Target).
 * Mounted by board/nodes/StepNode.tsx inside React Flow.
 */
import { STEP_H, STEP_RX, STEP_W } from "../layout/tileMetrics";
import { StepKind, stepDisplayLabel, type ActorDto } from "../../workflow/types";
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
      <StepKindIcon kind={kind} size={52} />
      {headline ? (
        <div className="task-card-title">
          <FitLabel text={headline} maxFontSizePx={14} mode="box" maxLines={3} />
        </div>
      ) : null}
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
      className={`board-node step-piece${selected ? " selected" : ""}${lifted ? " is-lifted" : ""}`}
      style={{
        width: STEP_W,
        height: STEP_H,
        display: "flex",
        boxSizing: "border-box",
        border: `3px solid var(--line)`,
        borderRadius: STEP_RX,
        overflow: "hidden",
        background: "var(--cream)",
        transform: lifted ? "translateY(-3px)" : undefined,
        transition: "transform 140ms ease",
      }}
    >
      <ActorColumn actor={actor} />
      <TaskCard kind={kind} title={title} detail={detail} />
    </div>
  );
}
