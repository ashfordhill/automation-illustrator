/**
 * Left column of a Step tile: figure + name + role/type chip.
 * Used by StepTile; figures live beside this file. Fill is the actor’s pastel.
 * Name and role are separate boxes so the title sits in a contrasting sub-box (NA-10).
 */
import { HumanFigure } from "./HumanFigure";
import { RobotFigure } from "./RobotFigure";
import { ACTOR_W, STEP_H } from "../layout/tileMetrics";
import { FIGURE_INK_ON_PASTEL } from "../../workflow/actors";
import { ActorKind } from "../../workflow/catalogs";
import {
  DEFAULT_HUMAN_ROLE,
  ROBOT_KIND_LABEL,
  isHuman,
  isRobot,
  type ActorDto,
} from "../../workflow/types";
import { FitLabel } from "./FitLabel";

function Chip({
  text,
  maxFontSizePx,
  minFontSizePx = 11,
  tone,
  mode,
  maxLines,
}: {
  text: string;
  maxFontSizePx: number;
  minFontSizePx?: number;
  tone: "name" | "role";
  mode?: "box" | "multiline";
  maxLines?: number;
}) {
  return (
    <div className={`actor-chip actor-chip-${tone}`}>
      <FitLabel
        text={text}
        maxFontSizePx={maxFontSizePx}
        minFontSizePx={minFontSizePx}
        mode={mode}
        maxLines={maxLines}
      />
    </div>
  );
}

export function ActorColumn({ actor }: { actor: ActorDto | undefined }) {
  const human = actor?.kind !== ActorKind.Robot;
  const role = isHuman(actor)
    ? (actor.role ?? "").trim() || DEFAULT_HUMAN_ROLE
    : isRobot(actor)
      ? ROBOT_KIND_LABEL[actor.robotKind]
      : "";
  return (
    <div
      className="actor-strip"
      style={{
        width: ACTOR_W,
        height: STEP_H,
        background: actor?.color ?? "var(--actor-empty)",
        borderRight: `3px solid var(--line)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        justifyContent: "space-between",
        padding: "8px 0 0",
        boxSizing: "border-box",
        overflow: "visible",
      }}
    >
      <div style={{ display: "flex", justifyContent: "center", flex: "0 0 auto", overflow: "visible" }}>
        {human ? (
          <HumanFigure size={42} color={FIGURE_INK_ON_PASTEL} />
        ) : (
          <RobotFigure size={42} color={FIGURE_INK_ON_PASTEL} />
        )}
      </div>
      <div className="actor-text">
        <Chip
          text={actor?.name ?? "—"}
          maxFontSizePx={13}
          minFontSizePx={11}
          tone="name"
          mode="multiline"
          maxLines={2}
        />
        {role ? (
          <Chip text={role} maxFontSizePx={12} tone="role" mode="box" maxLines={3} />
        ) : null}
      </div>
    </div>
  );
}
