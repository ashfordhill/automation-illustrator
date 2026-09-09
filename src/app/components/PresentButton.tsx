/**
 * Top-right Present control. The light-blue rounded rect is the “slide”;
 * the presenter stands in front so his opaque fill covers the box stroke.
 *
 * Figure paths: Streamline “class-lesson” (CC BY 4.0),
 * https://github.com/webalys-hq/streamline-vectors
 */
import { Tooltip } from "@mantine/core";
import { useStore } from "../../state/store";

const BODY =
  "M28.539 16.338c.625.036 1.192.379 1.326.99c.144.656.226 1.675-.035 3.103c-.143.781-.809 1.342-1.596 1.45L20 23l-1.8 19.32c-.12 1.284-1.05 2.343-2.33 2.49a29 29 0 0 1-3.303.19c-1.263 0-2.403-.084-3.318-.185c-1.338-.149-2.3-1.275-2.373-2.62l-.618-11.317a67 67 0 0 1-2.578-.183a1.82 1.82 0 0 1-1.654-1.889c.117-3.77.593-7.216.989-9.515c.298-1.728 1.762-2.977 3.514-3.062c6.958-.338 14.84-.302 22.01.11Z";

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
        <svg viewBox="0 0 56 50" width="52" height="46" overflow="visible" aria-hidden>
          <rect className="present-box" x="4" y="2" width="44" height="22" rx="7" />
          {/* Flip to face the board. Full figure stands in front; feet hang below the slide. */}
          <g className="present-figure" transform="translate(49 9) scale(-0.74 0.74)">
            <circle cx="12.5" cy="9.5" r="6.5" />
            <path d={BODY} />
            <path className="present-leg" d="M12.5 34v11" />
          </g>
        </svg>
      </button>
    </Tooltip>
  );
}
