/**
 * Left column of a Step tile: figure + name + role/type chip.
 * Used by StepTile; figures live beside this file. Fill is the actor’s pastel.
 * Name and role use FitLabel so long copy wraps, shrinks, then ellipsizes (NA-10).
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

const NAME_H = 34;
const ROLE_H = 48;

function Chip({
  text,
  maxFontSizePx,
  minFontSizePx = 11,
  topRule,
  mode,
  maxLines,
}: {
  text: string;
  maxFontSizePx: number;
  minFontSizePx?: number;
  topRule?: boolean;
  mode?: "box" | "multiline";
  maxLines?: number;
}) {
  return (
    <div
      className="actor-chip"
      style={{
        background: "var(--cream)",
        borderTop: topRule ? `2.5px solid var(--line)` : undefined,
        height: topRule ? NAME_H : ROLE_H,
        width: "100%",
        boxSizing: "border-box",
        padding: "4px 6px",
      }}
    >
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
        padding: "10px 0 0",
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
      <div style={{ flex: "0 0 auto" }}>
        <Chip
          text={actor?.name ?? "—"}
          maxFontSizePx={13}
          minFontSizePx={11}
          topRule
          mode="multiline"
          maxLines={2}
        />
        {role ? <Chip text={role} maxFontSizePx={12} mode="box" maxLines={3} /> : null}
      </div>
    </div>
  );
}
