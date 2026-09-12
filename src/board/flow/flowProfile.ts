/**
 * Display orientation for the board (Improvement 61).
 * Graph commands stay inbound/outbound. Tile faces do not rotate.
 * This profile drives ELK direction, Path ports, chrome tabs, and the
 * Compare / Present split.
 */
import type { Point } from "../../workflow/types";

export type BoardOrientation = "horizontal" | "vertical";

export type FlowAxis = "x" | "y";

export type ElkPortSide = "WEST" | "EAST" | "NORTH" | "SOUTH";

export type HandleSide = "left" | "right" | "top" | "bottom";

export type FlowProfile = {
  orientation: BoardOrientation;
  elkDirection: "RIGHT" | "DOWN";
  aspectRatio: string;
  inSide: ElkPortSide;
  outSide: ElkPortSide;
  handleIn: HandleSide;
  handleOut: HandleSide;
  stack: "column" | "row";
  along: FlowAxis;
  across: FlowAxis;
  portIn: (w: number, h: number) => Point;
  portOut: (w: number, h: number) => Point;
};

export const HORIZONTAL: FlowProfile = {
  orientation: "horizontal",
  elkDirection: "RIGHT",
  aspectRatio: "1.6",
  inSide: "WEST",
  outSide: "EAST",
  handleIn: "left",
  handleOut: "right",
  stack: "column",
  along: "x",
  across: "y",
  portIn: (_w, h) => ({ x: 0, y: h / 2 }),
  portOut: (w, h) => ({ x: w, y: h / 2 }),
};

export const VERTICAL: FlowProfile = {
  orientation: "vertical",
  elkDirection: "DOWN",
  aspectRatio: "0.625",
  inSide: "NORTH",
  outSide: "SOUTH",
  handleIn: "top",
  handleOut: "bottom",
  stack: "row",
  along: "y",
  across: "x",
  portIn: (w, _h) => ({ x: w / 2, y: 0 }),
  portOut: (w, h) => ({ x: w / 2, y: h }),
};

export function flowProfile(orientation: BoardOrientation = "horizontal"): FlowProfile {
  return orientation === "vertical" ? VERTICAL : HORIZONTAL;
}

export function parseBoardOrientation(raw: unknown): BoardOrientation {
  return raw === "vertical" ? "vertical" : "horizontal";
}

/** First `|` segment of a laneGraphKey (`horizontal|tile|…`). */
export function layoutKeyOrientation(key: string): BoardOrientation {
  return key.startsWith("vertical|") ? "vertical" : "horizontal";
}

export function layoutKeyMode(key: string): "tile" | "web" {
  const parts = key.split("|");
  if (parts[0] === "web" || parts[1] === "web") return "web";
  return "tile";
}

export function alongOf(p: Point, along: FlowAxis): number {
  return along === "x" ? p.x : p.y;
}

export function acrossOf(p: Point, across: FlowAxis): number {
  return across === "x" ? p.x : p.y;
}
