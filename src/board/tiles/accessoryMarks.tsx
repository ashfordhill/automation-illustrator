/**
 * Drawings for Human accessories. Same ink language as human-figure.svg
 * (round caps, chunky stroke, flat fills).
 *
 * AR Vision sits on the face using the placement from the 2026-10-23 sketch
 * (viewBox 0 0 40 64). Tablet and scanner cover the right hand (31.5, 28.5).
 * Each AccessoryKind needs a figure mark and an editor glyph.
 */
import type { ReactNode } from "react";
import { AccessoryKind, type AccessoryKind as AccessoryKindT } from "../../workflow/catalogs";

const LENS = "#868e96";
const SLAB = "#f7fcfe";
const SCREEN = "#b9d7ea";

function SunglassesOnFigure() {
  return (
    <g>
      <rect x="13.5" y="9.05" width="5.8" height="4.15" fill={LENS} stroke="currentColor" strokeWidth="1.2" />
      <rect x="20.7" y="9.05" width="5.8" height="4.15" fill={LENS} stroke="currentColor" strokeWidth="1.2" />
      <line
        x1="13.2"
        y1="8.55"
        x2="26.8"
        y2="8.55"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </g>
  );
}

function TabletOnFigure() {
  return (
    <g>
      <rect x="28" y="22" width="10.6" height="13.8" rx="1.2" fill={SLAB} stroke="currentColor" strokeWidth="2.2" />
      <rect x="29.3" y="23.4" width="8" height="9.6" rx="0.45" fill={SCREEN} />
    </g>
  );
}

function ScannerOnFigure() {
  return (
    <g>
      <rect x="25.4" y="23.2" width="13.2" height="6.4" rx="1.3" fill={SLAB} stroke="currentColor" strokeWidth="2.2" />
      <rect x="26.6" y="24.5" width="3.2" height="3.8" rx="0.35" fill={LENS} />
      <rect x="30.2" y="28.4" width="3.8" height="6.8" rx="1.05" fill={SLAB} stroke="currentColor" strokeWidth="2.2" />
    </g>
  );
}

const FIGURE_MARKS: Record<AccessoryKindT, () => ReactNode> = {
  [AccessoryKind.Sunglasses]: SunglassesOnFigure,
  [AccessoryKind.Tablet]: TabletOnFigure,
  [AccessoryKind.Scanner]: ScannerOnFigure,
};

/** Marks in the human figure’s 0 0 40 64 viewBox. */
export function AccessoryMarks({ kinds }: { kinds: readonly AccessoryKindT[] }) {
  return (
    <>
      {kinds.map((kind) => {
        const Mark = FIGURE_MARKS[kind];
        return <Mark key={kind} />;
      })}
    </>
  );
}

function SunglassesGlyph() {
  return (
    <g>
      <rect x="3" y="14" width="11" height="7" fill={LENS} stroke="currentColor" strokeWidth="1.8" />
      <rect x="18" y="14" width="11" height="7" fill={LENS} stroke="currentColor" strokeWidth="1.8" />
      <line x1="4" y1="12.2" x2="28" y2="12.2" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
    </g>
  );
}

function TabletGlyph() {
  return (
    <g>
      <rect x="8" y="3" width="16" height="26" rx="2" fill={SLAB} stroke="currentColor" strokeWidth="2.2" />
      <rect x="10.2" y="5.4" width="11.6" height="18.4" rx="0.8" fill={SCREEN} />
    </g>
  );
}

function ScannerGlyph() {
  return (
    <g>
      <rect x="2" y="7" width="24" height="10" rx="2" fill={SLAB} stroke="currentColor" strokeWidth="2.2" />
      <rect x="4.2" y="9.1" width="5.2" height="5.8" rx="0.5" fill={LENS} />
      <path
        d="M5.2 10.2 v3.6 M6.6 10.2 v3.6 M8 10 v4"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinecap="round"
      />
      <rect x="13" y="15.2" width="6.4" height="13" rx="1.6" fill={SLAB} stroke="currentColor" strokeWidth="2.2" />
    </g>
  );
}

const GLYPHS: Record<AccessoryKindT, () => ReactNode> = {
  [AccessoryKind.Sunglasses]: SunglassesGlyph,
  [AccessoryKind.Tablet]: TabletGlyph,
  [AccessoryKind.Scanner]: ScannerGlyph,
};

/** Editor button icon. Same fills and stroke weight as the figure marks. */
export function AccessoryGlyph({ kind, size = 28 }: { kind: AccessoryKindT; size?: number }) {
  const Mark = GLYPHS[kind];
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden color="currentColor">
      <Mark />
    </svg>
  );
}
