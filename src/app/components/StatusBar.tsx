/**
 * Full-width bottom status bar. Overlaps the inspector (P-05 amendment).
 * Right Click Delete and package.json version sit on the right.
 */
import { useStore } from "../../state/store";
import { APP_VERSION } from "../version";
import "./StatusBar.css";

/** Visible toggle copy. On/off is aria-pressed + `.is-on`, not this string. */
export const RIGHT_CLICK_DELETE_LABEL = "Right Click Delete";

export function StatusBar() {
  const rightClickDelete = useStore((s) => s.rightClickDelete);

  return (
    <footer className="status-bar chrome-bar" role="contentinfo" aria-label="Status">
      <div className="status-end">
        <button
          type="button"
          className={`status-toggle${rightClickDelete ? " is-on" : ""}`}
          aria-pressed={rightClickDelete}
          aria-label={RIGHT_CLICK_DELETE_LABEL}
          onClick={() => {
            const s = useStore.getState();
            s.setRightClickDelete(!s.rightClickDelete);
          }}
        >
          {RIGHT_CLICK_DELETE_LABEL}
        </button>
        <span className="status-version" aria-label={`Application version ${APP_VERSION}`}>
          v{APP_VERSION}
        </span>
      </div>
    </footer>
  );
}
