/**
 * Left column of a Step tile: figure + a name card with the title nested inside.
 * Fill is the actor’s pastel; the title sub-box reuses that color on cream (NA-10).
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
        hug
        color={tone === "role" ? FIGURE_INK_ON_PASTEL : "var(--ink)"}
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
        height: "100%",
        background: actor?.color ?? "var(--actor-empty)",
        borderRight: `3px solid var(--line)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        justifyContent: "flex-start",
        gap: 6,
        padding: "8px 8px 12px",
        boxSizing: "border-box",
        overflow: "hidden",
        ["--actor-fill" as string]: actor?.color ?? "var(--actor-empty)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "center", flex: "0 0 auto", overflow: "visible" }}>
        {human ? (
          <HumanFigure size={42} color={FIGURE_INK_ON_PASTEL} />
        ) : (
          <RobotFigure size={42} color={FIGURE_INK_ON_PASTEL} />
        )}
      </div>
      <div className="actor-card">
        <Chip
          text={actor?.name ?? "—"}
          maxFontSizePx={16}
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
