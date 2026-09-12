/**
 * Minimalist Compare mark: Human circle vs Robot square, split to match
 * the Compare panes (stacked when Horizontal, side-by-side when Vertical).
 */
import type { BoardOrientation } from "../../board/flow/flowProfile";
import { svgInner } from "../../board/tiles/svgInner";
import compareSide from "./compare-side.svg?raw";
import compareStacked from "./compare-stacked.svg?raw";

const STACKED = svgInner(compareStacked);
const SIDE = svgInner(compareSide);

export function CompareIcon({ orientation }: { orientation: BoardOrientation }) {
  const stacked = orientation !== "vertical";
  return (
    <svg
      viewBox="0 0 48 32"
      width="40"
      height="27"
      fill="none"
      aria-hidden
      data-compare-layout={stacked ? "stacked" : "side"}
      dangerouslySetInnerHTML={{ __html: stacked ? STACKED : SIDE }}
    />
  );
}
