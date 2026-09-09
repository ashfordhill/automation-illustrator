/**
 * Top-right Present control. The light-blue rounded rect is the “slide”;
 * the presenter stands in front so his opaque fill covers the box stroke.
 *
 * Figure paths: Streamline “class-lesson” (CC BY 4.0),
 * https://github.com/webalys-hq/streamline-vectors
 * Torso is clipped above the plump hem (that fill read as a white half-circle
 * at the feet). A hanging arm is added so the trailing side is not a flat cut.
 */
import { Tooltip } from "@mantine/core";
import { useStore } from "../../state/store";

const BODY =
  "M28.539 16.338c.625.036 1.192.379 1.326.99c.144.656.226 1.675-.035 3.103c-.143.781-.809 1.342-1.596 1.45L20 23l-1.8 19.32c-.12 1.284-1.05 2.343-2.33 2.49a29 29 0 0 1-3.303.19c-1.263 0-2.403-.084-3.318-.185c-1.338-.149-2.3-1.275-2.373-2.62l-.618-11.317a67 67 0 0 1-2.578-.183a1.82 1.82 0 0 1-1.654-1.889c.117-3.77.593-7.216.989-9.515c.298-1.728 1.762-2.977 3.514-3.062c6.958-.338 14.84-.302 22.01.11Z";

/** Trailing arm (original left). After the flip it hangs on the viewer’s right. */
const ARM =
  "M7 17C1.5 19 0 27 2.8 32C3.6 33.4 5.6 32.4 5.8 30.6C6.4 25.5 8.2 19.5 10.2 17.2C9.4 16.3 8 16.4 7 17Z";

export function PresentButton() {
  const present = useStore((s) => s.present);

  return (
    <Tooltip label="Present (Escape to leave)">
      <button
        type="button"
        className="present-btn"
        aria-label="Present"
        data-present-btn="true"
        onClick={() => useStore.getState().setPresent(!present)}
      >
        <svg viewBox="0 0 56 48" width="52" height="44" overflow="visible" aria-hidden>
          <defs>
            <clipPath id="present-torso-clip">
              <rect x="-2" y="0" width="40" height="31.5" rx="7" />
            </clipPath>
          </defs>
          <rect className="present-box" x="3" y="5" width="44" height="26" rx="7" />
          {/* Flip to face the board; keep padding on the right so the hanging arm is in view. */}
          <g className="present-figure" transform="translate(40 7) scale(-0.72 0.72)">
            <circle cx="12.5" cy="9.5" r="6.5" />
            <path d={BODY} clipPath="url(#present-torso-clip)" />
            <path d={ARM} />
            <path className="present-leg" d="M12.5 32 v13" />
          </g>
        </svg>
      </button>
    </Tooltip>
  );
}
