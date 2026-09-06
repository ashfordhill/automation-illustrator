/**
 * Combined Step card: actor column + task (icon, Type + Target).
 * Mounted by board/StepNode.tsx inside React Flow.
 */
import { ACTOR_W, STEP_H, STEP_W } from "../board/tileMetrics";
import { stepDisplayLabel, type ActorDto, type StepKind } from "../model/types";
import { ActorColumn } from "./ActorColumn";
import { StepKindIcon } from "./StepKindIcon";

/** Right half of a Step tile — icon, then Type + Target. */
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
  return (
    <div
      className="task-card"
      style={{
        width: STEP_W - ACTOR_W,
        minHeight: STEP_H,
        background: "var(--cream)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        padding: "8px 10px 10px",
        boxSizing: "border-box",
      }}
    >
      <StepKindIcon kind={kind} />
      <div
        style={{
          fontWeight: 800,
          fontSize: 14,
          textAlign: "center",
          lineHeight: 1.25,
          overflowWrap: "anywhere",
          wordBreak: "break-word",
          borderTop: `3px solid var(--line)`,
          borderBottom: detail ? `3px solid var(--line)` : undefined,
          padding: "6px 2px",
          width: "100%",
          color: "var(--ink)",
        }}
      >
        {headline}
      </div>
      {detail ? (
        <div
          style={{
            fontSize: 12,
            color: "var(--ink)",
            fontWeight: 700,
            paddingTop: 4,
            overflowWrap: "anywhere",
            wordBreak: "break-word",
            textAlign: "center",
            width: "100%",
          }}
        >
          {detail}
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
