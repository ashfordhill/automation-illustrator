import { Position } from "@xyflow/react";
import type { HandleSide } from "./flowProfile";

const MAP: Record<HandleSide, Position> = {
  left: Position.Left,
  right: Position.Right,
  top: Position.Top,
  bottom: Position.Bottom,
};

export function rfHandle(side: HandleSide): Position {
  return MAP[side];
}
