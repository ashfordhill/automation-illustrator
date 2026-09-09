/**
 * Screen-space placement of the pulled `+` Step / Data fan (WG-07).
 * Short arc from the rest `+`; no extra outward offset (that was the old wedge).
 * `inbound` mirrors the fan to the left of the tab.
 */
export const PREVIEW_RADIUS = 104;
export const PREVIEW_OUT = 0;
export const PREVIEW_SPREAD = 56;

export function previewCenters(
  restX: number,
  restY: number,
  count: number,
  inbound = false,
): { x: number; y: number }[] {
  const dir = inbound ? -1 : 1;
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i += 1) {
    const angle =
      count === 1 ? 0 : -PREVIEW_SPREAD / 2 + (i * PREVIEW_SPREAD) / Math.max(1, count - 1);
    const rad = (angle * Math.PI) / 180;
    out.push({
      x: restX + dir * (PREVIEW_OUT + Math.cos(rad) * PREVIEW_RADIUS),
      y: restY + Math.sin(rad) * PREVIEW_RADIUS,
    });
  }
  return out;
}
