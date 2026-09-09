import { afterEach, expect, test, vi } from "vitest";
import { KeyAction } from "../workflow/catalogs";
import { LS_KEYMAP } from "../state/persistence";
import { DEFAULT_KEYMAP, loadKeymap, pickKnown, prettyKey, saveKeymap } from "./bindings";

afterEach(() => {
  localStorage.removeItem(LS_KEYMAP);
});

test("pickKnown ignores retired Pointer/Hand/detach/path-confirm and 1/2 ids (SH-14)", () => {
  const next = pickKnown({
    undo: "z",
    toolPointer: "q",
    toolHand: "p",
    detachPath: "x",
    pathConfirm: "enter",
    addBranchStep: "1",
    addBranchData: "2",
    mystery: "k",
    merge: "m",
    unmerge: "u",
  });
  expect(next[KeyAction.Undo]).toBe("z");
  expect(next[KeyAction.RemoveNode]).toBeUndefined();
  expect(next[KeyAction.Confirm]).toBeUndefined();
  expect("toolPointer" in next).toBe(false);
  expect("detachPath" in next).toBe(false);
  expect("addBranchStep" in next).toBe(false);
  expect("merge" in next).toBe(false);
  expect("unmerge" in next).toBe(false);
});

test("loadKeymap fills new Q/E/A/D actions and keeps an unbound pan", () => {
  localStorage.setItem(
    LS_KEYMAP,
    JSON.stringify({ undo: "z", toolPointer: "v", detachPath: "x", panLeft: "" }),
  );
  const map = loadKeymap();
  expect(map[KeyAction.Undo]).toBe("z");
  expect(map[KeyAction.PanLeft]).toBe("");
  expect(map[KeyAction.AddStepOut]).toBe(DEFAULT_KEYMAP[KeyAction.AddStepOut]);
  expect(map[KeyAction.AddStepIn]).toBe("q");
  expect(map[KeyAction.Confirm]).toBe("enter");
  expect("merge" in map).toBe(false);
});

test("saveKeymap writes known actions and ignores a denied store (SH-14, SH-11)", () => {
  saveKeymap({ ...DEFAULT_KEYMAP, [KeyAction.Undo]: "z" });
  expect(JSON.parse(localStorage.getItem(LS_KEYMAP)!).undo).toBe("z");
  const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("quota");
  });
  expect(() => saveKeymap(DEFAULT_KEYMAP)).not.toThrow();
  setItem.mockRestore();
});

test("prettyKey shows None for an unbound action", () => {
  expect(prettyKey("")).toBe("None");
  expect(prettyKey("q")).toBe("Q");
});

test("default Remove Node is Z, not minus", () => {
  expect(DEFAULT_KEYMAP[KeyAction.RemoveNode]).toBe("z");
  expect(prettyKey(DEFAULT_KEYMAP[KeyAction.RemoveNode])).toBe("Z");
});
