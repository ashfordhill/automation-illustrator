import { expect, test } from "vitest";
import {
  HORIZONTAL,
  VERTICAL,
  flowProfile,
  layoutKeyMode,
  layoutKeyOrientation,
  parseBoardOrientation,
} from "./flowProfile";

test("horizontal ports sit on the west and east midpoints", () => {
  const p = flowProfile("horizontal");
  expect(p).toBe(HORIZONTAL);
  expect(p.portIn(256, 160)).toEqual({ x: 0, y: 80 });
  expect(p.portOut(256, 160)).toEqual({ x: 256, y: 80 });
  expect(p.stack).toBe("column");
  expect(p.along).toBe("x");
});

test("vertical ports sit on the north and south midpoints", () => {
  const p = flowProfile("vertical");
  expect(p).toBe(VERTICAL);
  expect(p.portIn(256, 160)).toEqual({ x: 128, y: 0 });
  expect(p.portOut(256, 160)).toEqual({ x: 128, y: 160 });
  expect(p.stack).toBe("row");
  expect(p.along).toBe("y");
  expect(p.elkDirection).toBe("DOWN");
});

test("parseBoardOrientation only accepts vertical", () => {
  expect(parseBoardOrientation("vertical")).toBe("vertical");
  expect(parseBoardOrientation("horizontal")).toBe("horizontal");
  expect(parseBoardOrientation("sideways")).toBe("horizontal");
  expect(parseBoardOrientation(null)).toBe("horizontal");
});

test("layout key helpers read orientation then mode", () => {
  expect(layoutKeyOrientation("vertical|tile|a")).toBe("vertical");
  expect(layoutKeyOrientation("horizontal|web|a")).toBe("horizontal");
  expect(layoutKeyMode("horizontal|web|a")).toBe("web");
  expect(layoutKeyMode("vertical|tile|a")).toBe("tile");
});
