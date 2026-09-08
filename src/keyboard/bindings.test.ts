import { afterEach, expect, test, vi } from "vitest";
import { KeyAction } from "../workflow/catalogs";
import { LS_KEYMAP } from "../state/persistence";
import { ARROW_PRESET, loadKeymap, pickKnown, saveKeymap } from "./bindings";

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
    merge: "m",
    unmerge: "u",
  });
  expect(next[KeyAction.Undo]).toBe("z");
  expect(next[KeyAction.RemoveNode]).toBeUndefined();
  expect(next[KeyAction.Confirm]).toBeUndefined();
  expect("toolPointer" in next).toBe(false);
  expect("detachPath" in next).toBe(false);
  expect("merge" in next).toBe(false);
  expect("unmerge" in next).toBe(false);
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
  expect("merge" in map).toBe(false);
  expect("unmerge" in map).toBe(false);
});

test("saveKeymap writes known actions and ignores a denied store (SH-14, SH-11)", () => {
  saveKeymap({ ...ARROW_PRESET, [KeyAction.Undo]: "z" });
  expect(JSON.parse(localStorage.getItem(LS_KEYMAP)!).undo).toBe("z");
  const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("quota");
  });
  expect(() => saveKeymap(ARROW_PRESET)).not.toThrow();
  setItem.mockRestore();
});
