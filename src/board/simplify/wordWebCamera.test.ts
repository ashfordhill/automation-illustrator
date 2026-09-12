import { expect, test } from "vitest";
import {
  clearWordWebCamera,
  isWebFitted,
  markWebFitted,
  rememberTileCamera,
  restoreTileCamera,
} from "./wordWebCamera";

test("rememberTileCamera keeps the first tile camera across remounts", () => {
  clearWordWebCamera();
  rememberTileCamera({ x: 10, y: 20, zoom: 0.4 });
  rememberTileCamera({ x: 99, y: 99, zoom: 1.2 });
  expect(isWebFitted()).toBe(false);
  markWebFitted();
  expect(isWebFitted()).toBe(true);
  expect(restoreTileCamera()).toEqual({ x: 10, y: 20, zoom: 0.4 });
  expect(restoreTileCamera()).toBeNull();
  expect(isWebFitted()).toBe(false);
});
