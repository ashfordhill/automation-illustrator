/**
 * Add / edit / delete humans and robots in the right inspector (NA-01, NA-02, NA-06).
 */
import { IconTrash } from "@tabler/icons-react";
import { ActorColorField } from "./ActorColorField";
import { InspectorField } from "./InspectorField";
import { FIGURE_INK_ON_PASTEL } from "../../workflow/actors";
import { DEFAULT_HUMAN_ROLE, isHuman, isRobot } from "../../workflow/types";
import { HumanFigure } from "../../board/tiles/HumanFigure";
import { RobotFigure } from "../../board/tiles/RobotFigure";
import { useStore } from "../../state/store";
import { ActorWhoGrid } from "./ActorWhoGrid";

export function ManageActorsPanel() {
  const workflow = useStore((s) => s.workflow);
  const actorId = useStore((s) => s.manageActorId);
  const deleteMode = useStore((s) => s.manageActorsDeleteMode);
  const actor = workflow.actors.find((a) => a.id === actorId) ?? null;

  return (
    <div className="inspector-manage">
      <div className="inspector-actor-ops" role="group" aria-label="Add or remove actors">
        <button
          type="button"
          className="inspector-actor-op"
          aria-label="Add human"
          onClick={() => useStore.getState().addHuman()}
        >
          <span className="inspector-actor-head">
            <HumanFigure size={56} crop="head" color={FIGURE_INK_ON_PASTEL} />
          </span>
          <span className="inspector-actor-plus" aria-hidden>
            +
          </span>
        </button>
        <button
          type="button"
          className="inspector-actor-op"
          aria-label="Add robot"
          onClick={() => useStore.getState().addRobot()}
        >
          <span className="inspector-actor-head">
            <RobotFigure size={56} crop="head" color={FIGURE_INK_ON_PASTEL} />
          </span>
          <span className="inspector-actor-plus" aria-hidden>
            +
          </span>
        </button>
        <button
          type="button"
          className={`inspector-actor-op inspector-actor-delete${deleteMode ? " is-on" : ""}`}
          aria-label="Delete mode"
          aria-pressed={deleteMode}
          onClick={() => useStore.getState().setManageActorsDeleteMode(!deleteMode)}
        >
          <IconTrash size={48} color="var(--minus)" stroke={2.2} aria-hidden />
        </button>
      </div>
      {actor && !deleteMode ? (
        <div className="inspector-actor-edit">
          <div className="inspector-actor-edit-text">
            <InspectorField
              id="actor-name-field"
              ariaLabel="Name"
              value={actor.name}
              onChange={(name) => useStore.getState().updateActor(actor.id, { name })}
            />
            <InspectorField
              id="actor-role-field"
              ariaLabel="Role"
              value={
                isHuman(actor)
                  ? (actor.role ?? DEFAULT_HUMAN_ROLE)
                  : isRobot(actor)
                    ? actor.role
                    : ""
              }
              onChange={(role) => useStore.getState().updateActor(actor.id, { role })}
            />
          </div>
          <ActorColorField
            value={actor.color}
            onChange={(color) => useStore.getState().updateActor(actor.id, { color })}
          />
        </div>
      ) : null}
      <ActorWhoGrid
        actors={workflow.actors}
        selectedId={deleteMode ? null : actorId}
        listbox
        deleteMode={deleteMode}
        ariaLabel="Actors"
        onPick={(id) => {
          const s = useStore.getState();
          if (s.manageActorsDeleteMode) {
            s.removeActor(id);
            return;
          }
          s.setManageActorId(id);
        }}
      />
    </div>
  );
}
