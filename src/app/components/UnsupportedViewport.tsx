/**
 * Full-screen message when the window is under 1024 CSS pixels (P-04).
 * Replaces the board so a phone-sized viewport never shows a crushed shell.
 */
import { MIN_VIEWPORT_PX } from "../viewport";

export function UnsupportedViewport() {
  return (
    <main className="unsupported-viewport" data-unsupported-viewport="true">
      <h1>This window is too narrow</h1>
      <p>
        Automation Illustrator is a desktop workflow board. Use a laptop or monitor at least{" "}
        {MIN_VIEWPORT_PX} pixels wide.
      </p>
    </main>
  );
}
