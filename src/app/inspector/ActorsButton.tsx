/**
 * Manage actors toggle: a Who-key (stickman + Actors) under the roster.
 */
import { FIGURE_INK_ON_PASTEL } from "../../workflow/actors";
import { HumanFigure } from "../../board/tiles/HumanFigure";
import { useStore } from "../../state/store";

export function ActorsButton() {
  const open = useStore((s) => s.manageActorsOpen);
  return (
    <button
      id="manage-actors-btn"
      type="button"
      className={`inspector-who inspector-actors${open ? " is-on" : ""}`}
      aria-label="Actors"
      aria-pressed={open}
      onClick={() => {
        const s = useStore.getState();
        if (s.manageActorsOpen) s.closeManageActors({ restoreFocus: false });
        else s.openManageActors();
      }}
    >
      <span className="inspector-who-fig inspector-actors-fig">
        <HumanFigure size={26} color={FIGURE_INK_ON_PASTEL} />
      </span>
      <span className="inspector-who-name">Actors</span>
    </button>
  );
}

export function ActorsRow() {
  return (
    <div className="inspector-actors-row">
      <ActorsButton />
    </div>
  );
}
