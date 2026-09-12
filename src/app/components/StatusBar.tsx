/**
 * Full-width bottom status bar. Overlaps the inspector (P-05 amendment).
 * text-only, Right-click delete, sound, and package.json version sit on the right.
 */
import { useStore } from "../../state/store";
import { simplifyMenuActive } from "../../board/simplify/prefs";
import { APP_VERSION } from "../version";
import { RightClickDeleteToggle } from "./RightClickDeleteToggle";
import { SoundToggle } from "./SoundToggle";
import "./StatusBar.css";

export const VIEW_LABEL = "text-only";

export function StatusBar() {
  const simplify = useStore((s) => s.simplify);
  const viewOn = simplifyMenuActive(simplify);

  return (
    <footer className="status-bar chrome-bar" role="contentinfo" aria-label="Status">
      <div className="status-end">
        <button
          type="button"
          className={`status-toggle${viewOn ? " is-on" : ""}`}
          aria-pressed={viewOn}
          aria-label={VIEW_LABEL}
          data-status="simplify"
          onClick={() => {
            const s = useStore.getState();
            s.setSimplify({ hideVisuals: !s.simplify.hideVisuals });
          }}
        >
          {VIEW_LABEL}
        </button>
        <RightClickDeleteToggle />
        <SoundToggle />
        <span className="status-version" aria-label={`Application version ${APP_VERSION}`}>
          v{APP_VERSION}
        </span>
      </div>
    </footer>
  );
}
