/**
 * Supported desktop width (P-04). Narrower viewports get UnsupportedViewport
 * instead of a crushed board.
 */
import { useEffect, useState } from "react";

export const MIN_VIEWPORT_PX = 1024;

/** True when the viewport is at least 1024 CSS pixels wide. */
export function isSupportedViewport(
  media: Pick<Window, "matchMedia"> | null = typeof window === "undefined" ? null : window,
): boolean {
  if (!media || typeof media.matchMedia !== "function") return true;
  return media.matchMedia(`(min-width: ${MIN_VIEWPORT_PX}px)`).matches;
}

/** Live min-width: 1024px match. Defaults to supported when matchMedia is missing. */
export function useSupportedViewport(): boolean {
  const [ok, setOk] = useState(() => isSupportedViewport());
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia(`(min-width: ${MIN_VIEWPORT_PX}px)`);
    const apply = () => setOk(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return ok;
}
