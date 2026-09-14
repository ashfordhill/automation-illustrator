/**
 * Paper texture (Improvement 66): one SVG pattern on a GRID cell that follows
 * the React Flow viewport. Replaces the fixed React Flow Dots background so
 * the theme can pick dots / rings / cross / mesh and their color.
 * `PaperTextureSvg` is the static form used by the Theme preview and picker.
 */
import { useId, type CSSProperties } from "react";
import { useViewport } from "@xyflow/react";
import type { TexturePattern, ThemeTexture } from "../app/theme/chromeTheme";
import { GRID } from "./layout/tileMetrics";

const CENTER = GRID / 2;
const DOT_RADIUS = 1.1;
const RING_RADIUS = 3.5;
const RING_STROKE = 1.2;
const CROSS_ARM = 3;
const CROSS_STROKE = 1.2;
const MESH_STROKE = 1;

/** Shapes for one GRID×GRID cell at zoom 1. Pattern color is passed as `color`. */
export function TextureCell({ pattern, color }: { pattern: TexturePattern; color: string }) {
  switch (pattern) {
    case "dots":
      return <circle cx={CENTER} cy={CENTER} r={DOT_RADIUS} fill={color} />;
    case "rings":
      return (
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RING_RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={RING_STROKE}
        />
      );
    case "cross":
      return (
        <path
          d={`M${CENTER - CROSS_ARM} ${CENTER}H${CENTER + CROSS_ARM}M${CENTER} ${CENTER - CROSS_ARM}V${CENTER + CROSS_ARM}`}
          fill="none"
          stroke={color}
          strokeWidth={CROSS_STROKE}
          strokeLinecap="round"
        />
      );
    case "mesh":
      return (
        <path
          d={`M0 ${MESH_STROKE / 2}H${GRID}M${MESH_STROKE / 2} 0V${GRID}`}
          fill="none"
          stroke={color}
          strokeWidth={MESH_STROKE}
        />
      );
  }
}

export function PaperTextureSvg({
  pattern,
  color,
  x = 0,
  y = 0,
  zoom = 1,
  className,
  style,
}: ThemeTexture & {
  x?: number;
  y?: number;
  zoom?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const id = useId();
  const patternId = `paper-texture-${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  // patternTransform scales the whole tile, so width/height and the offset stay in zoom-1 units.
  const gap = GRID * zoom;
  return (
    <svg
      className={className}
      style={style}
      data-paper-texture={pattern}
      aria-hidden
      focusable="false"
    >
      <pattern
        id={patternId}
        x={(x % gap) / zoom}
        y={(y % gap) / zoom}
        width={GRID}
        height={GRID}
        patternUnits="userSpaceOnUse"
        patternTransform={`scale(${zoom})`}
      >
        <TextureCell pattern={pattern} color={color} />
      </pattern>
      <rect x="0" y="0" width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
}

/** Board texture: follows the lane camera. Must render inside <ReactFlow>. */
export function PaperTexture({ pattern, color }: ThemeTexture) {
  const { x, y, zoom } = useViewport();
  return (
    <PaperTextureSvg
      pattern={pattern}
      color={color}
      x={x}
      y={y}
      zoom={zoom}
      className="react-flow__container paper-texture"
    />
  );
}
