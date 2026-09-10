/**
 * Who / Manage actors keys: Humans first, Robots on their own row,
 * centered as one cluster in the inspector (NA-05, NA-06).
 */
import { FIGURE_INK_ON_PASTEL, humansOf, robotsOf } from "../../workflow/actors";
import { actorWhoAria, actorWhoCaption, isHuman, type ActorDto } from "../../workflow/types";
import { HumanFigure } from "../../board/tiles/HumanFigure";
import { RobotFigure } from "../../board/tiles/RobotFigure";

function ActorWhoButton({
  actor,
  on,
  disabled,
  deleteMode,
  ariaLabel,
  option,
  onClick,
}: {
  actor: ActorDto;
  on: boolean;
  disabled?: boolean;
  deleteMode?: boolean;
  ariaLabel: string;
  option?: boolean;
  onClick: () => void;
}) {
  const human = isHuman(actor);
  return (
    <button
      type="button"
      role={option ? "option" : undefined}
      aria-selected={option ? on : undefined}
      aria-pressed={option ? undefined : on}
      className={`inspector-who${on ? " is-on" : ""}${deleteMode ? " is-delete" : ""}`}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
    >
      <span className="inspector-who-fig" style={{ background: actor.color }}>
        {human ? (
          <HumanFigure size={26} color={FIGURE_INK_ON_PASTEL} />
        ) : (
          <RobotFigure size={26} color={FIGURE_INK_ON_PASTEL} />
        )}
      </span>
      <span className="inspector-who-name">{actorWhoCaption(actor)}</span>
    </button>
  );
}

function KindRow({
  label,
  actors,
  selectedId,
  disabled,
  deleteMode,
  option,
  whoPrefix,
  onPick,
}: {
  label: string;
  actors: ActorDto[];
  selectedId: string | null;
  disabled?: boolean;
  deleteMode?: boolean;
  option?: boolean;
  whoPrefix: boolean;
  onPick: (id: string) => void;
}) {
  if (!actors.length) return null;
  return (
    <div className="inspector-who-grid" role="group" aria-label={label}>
      {actors.map((actor) => (
        <ActorWhoButton
          key={actor.id}
          actor={actor}
          on={!deleteMode && actor.id === selectedId}
          disabled={disabled}
          deleteMode={deleteMode}
          option={option}
          ariaLabel={actorWhoAria(actor, whoPrefix)}
          onClick={() => onPick(actor.id)}
        />
      ))}
    </div>
  );
}

export function ActorWhoGrid({
  actors,
  selectedId,
  onPick,
  disabled,
  deleteMode,
  listbox,
  ariaLabel,
}: {
  actors: ActorDto[];
  selectedId: string | null;
  onPick: (id: string) => void;
  disabled?: boolean;
  deleteMode?: boolean;
  listbox?: boolean;
  ariaLabel: string;
}) {
  return (
    <div
      className="inspector-who-groups"
      role={listbox ? "listbox" : "group"}
      aria-label={ariaLabel}
    >
      <KindRow
        label="Humans"
        actors={humansOf(actors)}
        selectedId={selectedId}
        disabled={disabled}
        deleteMode={deleteMode}
        option={listbox}
        whoPrefix={!listbox}
        onPick={onPick}
      />
      <KindRow
        label="Robots"
        actors={robotsOf(actors)}
        selectedId={selectedId}
        disabled={disabled}
        deleteMode={deleteMode}
        option={listbox}
        whoPrefix={!listbox}
        onPick={onPick}
      />
    </div>
  );
}
