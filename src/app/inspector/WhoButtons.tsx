/**
 * Who assignment: every Human and Robot in both lanes (NA-03, NA-05, NA-11).
 */
import { FIGURE_INK_ON_PASTEL } from "../../workflow/actors";
import { isHuman, type ActorDto } from "../../workflow/types";
import { HumanFigure } from "../../board/tiles/HumanFigure";
import { RobotFigure } from "../../board/tiles/RobotFigure";

export function WhoButtons({
  actors,
  value,
  onChange,
}: {
  actors: ActorDto[];
  value: string;
  onChange: (actorId: string) => void;
}) {
  return (
    <div className="inspector-who-grid" role="group" aria-label="Who">
      {actors.map((actor) => {
        const on = value === actor.id;
        const human = isHuman(actor);
        return (
          <button
            key={actor.id}
            type="button"
            className={`inspector-who${on ? " is-on" : ""}`}
            aria-pressed={on}
            aria-label={`Who ${actor.name}`}
            onClick={() => onChange(actor.id)}
          >
            <span className="inspector-who-fig" style={{ background: actor.color }}>
              {human ? (
                <HumanFigure size={26} color={FIGURE_INK_ON_PASTEL} />
              ) : (
                <RobotFigure size={26} color={FIGURE_INK_ON_PASTEL} />
              )}
            </span>
            <span className="inspector-who-name">{actor.name}</span>
          </button>
        );
      })}
    </div>
  );
}
