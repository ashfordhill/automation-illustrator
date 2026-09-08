/**
 * Full-width bottom status bar. Overlaps the inspector (P-05 amendment).
 * Project name, Actors, right-click-delete, and package.json version.
 */
import { useStore } from "../../state/store";
import { ViewMode } from "../../workflow/catalogs";
import { projectDisplayName } from "../../workflow/types";
import { APP_VERSION } from "../version";

export function StatusBar() {
  const name = useStore((s) => projectDisplayName(s.workflow));
  const rightClickDelete = useStore((s) => s.rightClickDelete);
  const present = useStore((s) => s.present);
  const view = useStore((s) => s.view);
  const manageOpen = useStore((s) => s.manageActorsOpen);
  const showActors = !present && view !== ViewMode.Both;
  const toggleLabel = `right-click-delete: ${rightClickDelete ? "on" : "off"}`;

  return (
    <footer className="status-bar chrome-bar" role="contentinfo" aria-label="Status">
      <span className="status-project" title={name}>
        {name}
      </span>
      <div className="status-actions">
        {showActors ? (
          <button
            type="button"
            id="status-actors-btn"
            className="status-btn"
            aria-pressed={manageOpen}
            onClick={() => useStore.getState().openManageActors()}
          >
            Actors
          </button>
        ) : null}
        <button
          type="button"
          className={`status-toggle${rightClickDelete ? " is-on" : ""}`}
          aria-pressed={rightClickDelete}
          aria-label={toggleLabel}
          onClick={() => {
            const s = useStore.getState();
            s.setRightClickDelete(!s.rightClickDelete);
          }}
        >
          {toggleLabel}
        </button>
      </div>
      <span className="status-version" aria-label={`Application version ${APP_VERSION}`}>
        v{APP_VERSION}
      </span>
    </footer>
  );
}

