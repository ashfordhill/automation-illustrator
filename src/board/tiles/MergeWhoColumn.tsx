/**
 * Merge-tile Who column: normal-size Robot plus name/type chips.
 * Height follows the tile; the figure is never scaled (MG-08).
 */
import { HumanFigure } from "./HumanFigure";
import { RobotFigure } from "./RobotFigure";
import { ACTOR_W } from "../layout/tileMetrics";
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

export function MergeWhoColumn({ actor }: { actor: ActorDto | undefined }) {
  const human = actor?.kind !== ActorKind.Robot;
  const role = isHuman(actor)
    ? (actor.role ?? "").trim() || DEFAULT_HUMAN_ROLE
    : isRobot(actor)
      ? ROBOT_KIND_LABEL[actor.robotKind]
      : "";
  return (
    <div
      className="merge-who"
      style={{
        width: ACTOR_W,
        alignSelf: "stretch",
        flex: "0 0 auto",
        background: actor?.color ?? "var(--actor-empty)",
        borderRight: "3px solid var(--line)",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        justifyContent: "flex-start",
        gap: 6,
        padding: "8px 8px 10px",
        boxSizing: "border-box",
        overflow: "visible",
        ["--actor-fill" as string]: actor?.color ?? "var(--actor-empty)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "center", flex: "0 0 auto" }}>
        {human ? (
          <HumanFigure size={42} color={FIGURE_INK_ON_PASTEL} />
        ) : (
          <RobotFigure size={42} color={FIGURE_INK_ON_PASTEL} />
        )}
      </div>
      <div className="actor-card">
        <div className="actor-chip actor-chip-name">
          <FitLabel
            text={actor?.name ?? "—"}
            maxFontSizePx={14}
            minFontSizePx={11}
            mode="multiline"
            maxLines={2}
            hug
          />
        </div>
        {role ? (
          <div className="actor-chip actor-chip-role">
            <FitLabel
              text={role}
              maxFontSizePx={11}
              minFontSizePx={9}
              mode="box"
              maxLines={2}
              hug
              color={FIGURE_INK_ON_PASTEL}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
