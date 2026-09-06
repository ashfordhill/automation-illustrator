/**
 * Left column of a Step tile: figure + name + role/type chip.
 * Used by StepTile; figures come from actors/. Fill is the actor’s pastel.
 * Name and role use FitLabel (auto-text-size) so long copy cannot grow the tile.
 */
import { HumanFigure } from "../actors/HumanFigure";
import { RobotFigure } from "../actors/RobotFigure";
import { ACTOR_W, STEP_H } from "../board/tileMetrics";
import { ActorKind } from "../model/catalogs";
import { FIGURE_INK_ON_PASTEL } from "../model/colors";
import {
  DEFAULT_HUMAN_ROLE,
  ROBOT_KIND_LABEL,
  isHuman,
  isRobot,
  type ActorDto,
} from "../model/types";
import { FitLabel } from "./FitLabel";

const NAME_H = 34;
const ROLE_H = 48;

function Chip({
  text,
  maxFontSizePx,
  minFontSizePx = 8,
  topRule,
  mode,
}: {
  text: string;
  maxFontSizePx: number;
  minFontSizePx?: number;
  topRule?: boolean;
  mode?: "box" | "multiline";
}) {
  return (
    <div
      style={{
        background: "var(--cream)",
        borderTop: topRule ? `2.5px solid var(--line)` : undefined,
        height: topRule ? NAME_H : ROLE_H,
        width: "100%",
        boxSizing: "border-box",
        overflow: "hidden",
        padding: "4px 6px",
      }}
    >
      <FitLabel text={text} maxFontSizePx={maxFontSizePx} minFontSizePx={minFontSizePx} mode={mode} />
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
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", justifyContent: "center", flex: "0 0 auto" }}>
        {human ? (
          <HumanFigure size={52} color={FIGURE_INK_ON_PASTEL} />
        ) : (
          <RobotFigure size={52} color={FIGURE_INK_ON_PASTEL} />
        )}
      </div>
      <div style={{ flex: "0 0 auto" }}>
        <Chip text={actor?.name ?? "—"} maxFontSizePx={13} minFontSizePx={11} topRule mode="multiline" />
        {role ? <Chip text={role} maxFontSizePx={12} mode="box" /> : null}
      </div>
    </div>
  );
}
