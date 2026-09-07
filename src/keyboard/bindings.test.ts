import { afterEach, expect, test } from "vitest";
import { KeyAction } from "../workflow/catalogs";
import { LS_KEYMAP } from "../state/persistence";
import { ARROW_PRESET, loadKeymap, pickKnown } from "./bindings";

afterEach(() => {
  localStorage.removeItem(LS_KEYMAP);
});

test("pickKnown ignores retired Pointer/Hand/detach/path-confirm ids (SH-14)", () => {
  const next = pickKnown({
    undo: "z",
    toolPointer: "q",
    toolHand: "p",
    detachPath: "x",
    pathConfirm: "enter",
    mystery: "k",
  });
  expect(next[KeyAction.Undo]).toBe("z");
  expect(next[KeyAction.RemoveNode]).toBeUndefined();
  expect(next[KeyAction.Confirm]).toBeUndefined();
  expect("toolPointer" in next).toBe(false);
  expect("detachPath" in next).toBe(false);
});

test("loadKeymap fills new actions from the preset when the saved map is old", () => {
  localStorage.setItem(
    LS_KEYMAP,
    JSON.stringify({ undo: "z", toolPointer: "v", detachPath: "x" }),
  );
  const map = loadKeymap();
  expect(map[KeyAction.Undo]).toBe("z");
  expect(map[KeyAction.RemoveNode]).toBe(ARROW_PRESET[KeyAction.RemoveNode]);
  expect(map[KeyAction.Confirm]).toBe("enter");
  expect(map[KeyAction.Merge]).toBe("m");
  expect(map[KeyAction.Unmerge]).toBe("u");
});
