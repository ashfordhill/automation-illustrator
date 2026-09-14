import { useEffect } from "react";

/**
 * While a popover is open, Escape closes only that popover. Mantine's Modal
 * listens for Escape on `window` in the bubble phase, so a capture-phase
 * listener that stops propagation keeps the wheel dismissal from reaching the
 * enclosing Theme window (which would otherwise ask "Discard changes?").
 * Focus does not matter: after clicking a swatch, focus is on <body>.
 */
export function useEscapeClosesPopover(opened: boolean, close: () => void) {
  useEffect(() => {
    if (!opened) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      e.preventDefault();
      close();
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [opened, close]);
}
