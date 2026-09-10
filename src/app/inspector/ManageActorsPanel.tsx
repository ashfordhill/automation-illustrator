/**
 * Add / edit / delete humans and robots in the right inspector (NA-01, NA-02, NA-06).
 */
import { IconMinus, IconPlus } from "@tabler/icons-react";
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
      <div className="inspector-actor-ops" role="group" aria-label="Add or remove actors">
        <button
          type="button"
          className="inspector-actor-add"
          aria-label="Add human"
          onClick={() => useStore.getState().addHuman()}
        >
          <span className="inspector-actor-add-fig" style={{ background: "#ff9fbf" }}>
            <HumanFigure size={22} color={FIGURE_INK_ON_PASTEL} />
          </span>
          <IconPlus className="inspector-actor-add-plus" size={14} stroke={2.6} aria-hidden />
        </button>
        <button
          type="button"
          className="inspector-actor-add"
          aria-label="Add robot"
          onClick={() => useStore.getState().addRobot()}
        >
          <span className="inspector-actor-add-fig" style={{ background: "#6ab0c8" }}>
            <RobotFigure size={22} color={FIGURE_INK_ON_PASTEL} />
          </span>
          <IconPlus className="inspector-actor-add-plus" size={14} stroke={2.6} aria-hidden />
        </button>
        <button
          type="button"
          className={`inspector-actor-minus${deleteMode ? " is-on" : ""}`}
          aria-label="Delete mode"
          aria-pressed={deleteMode}
          onClick={() => useStore.getState().setManageActorsDeleteMode(!deleteMode)}
        >
          <IconMinus size={18} stroke={2.6} aria-hidden />
        </button>
      </div>
      {actor && !deleteMode ? (
        <>
          <InspectorField
            id="actor-name-field"
            ariaLabel="Name"
            value={actor.name}
            onChange={(name) => useStore.getState().updateActor(actor.id, { name })}
          />
          <ActorColorField
            value={actor.color}
            onChange={(color) => useStore.getState().updateActor(actor.id, { color })}
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
        </>
      ) : null}
    </div>
  );
}
