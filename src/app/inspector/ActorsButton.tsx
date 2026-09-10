/**
 * Manage actors toggle (text) and Back when opened from a Step.
 */
import { useStore } from "../../state/store";

export function ActorsButton() {
  const open = useStore((s) => s.manageActorsOpen);
  return (
    <button
      id="manage-actors-btn"
      type="button"
      className={`inspector-actors${open ? " is-on" : ""}`}
      aria-label="Actors"
      aria-pressed={open}
      onClick={() => {
        const s = useStore.getState();
        if (s.manageActorsOpen) s.closeManageActors({ restoreFocus: false });
        else s.openManageActors();
      }}
    >
      Actors
    </button>
  );
}

export function BackButton() {
  return (
    <button
      type="button"
      className="inspector-back"
      aria-label="Back"
      onClick={() => useStore.getState().closeManageActors({ restoreFocus: false })}
    >
      Back
    </button>
  );
}
