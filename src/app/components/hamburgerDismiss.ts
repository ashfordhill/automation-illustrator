/** Close the hamburger when the pointer returns to the board or leaves the menu. */
export const HAMBURGER_LEAVE_PX = 40;

export type MenuUnion = { left: number; top: number; right: number; bottom: number };

export function distanceToRect(x: number, y: number, r: MenuUnion): number {
  const dx = Math.max(r.left - x, 0, x - r.right);
  const dy = Math.max(r.top - y, 0, y - r.bottom);
  return Math.hypot(dx, dy);
}

/**
 * Board hover always closes. Inspector hover never closes. Leaving the button
 * + dropdown union by more than ~40 px closes. Moving from the icon onto the
 * dropdown does not.
 */
export function hamburgerShouldClose(opts: {
  hit: Element | null;
  clientX: number;
  clientY: number;
  menuUnion: MenuUnion | null;
}): boolean {
  const { hit, clientX, clientY, menuUnion } = opts;
  if (hit?.closest(".board-lane")) return true;
  if (hit?.closest(".details-rail")) return false;
  if (hit?.closest(".app-hamburger-dropdown")) return false;
  if (hit?.closest('[aria-label="Menu"]')) return false;
  if (!menuUnion) return false;
  const w = menuUnion.right - menuUnion.left;
  const h = menuUnion.bottom - menuUnion.top;
  if (w <= 0 && h <= 0) return false;
  return distanceToRect(clientX, clientY, menuUnion) > HAMBURGER_LEAVE_PX;
}
