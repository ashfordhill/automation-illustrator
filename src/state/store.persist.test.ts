import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { ColorScheme, Tool, ViewMode } from "../workflow/catalogs";
import { emptyAfterOverlay } from "../workflow/types";
import { useStore } from "./store";

function resetSession() {
  localStorage.clear();
  const s = useStore.getState();
  s.resetDemo();
  s.setView(ViewMode.Before);
  s.setTool(Tool.Pointer);
  s.setPresent(false);
  s.select(null);
  s.setHelp(false);
  s.cancelReplace();
  s.clearImportError();
  s.closeBoardModes();
  s.setColorScheme(ColorScheme.Light);
  if (s.recovery) s.clearRecoveryHold();
}

beforeEach(() => {
  resetSession();
});

afterEach(() => {
  vi.restoreAllMocks();
  resetSession();
});

const tiny = JSON.stringify({
  version: 2,
  actors: [],
  nodes: [
    {
      id: "s_only",
      type: "step",
      position: { x: 0, y: 0 },
      stepKind: "other",
      title: "only",
      detail: "",
      split: "exclusive",
    },
  ],
  edges: [],
  assignments: {},
  after: emptyAfterOverlay(),
});

test("importRaw parses a candidate and only then offers the replacement gate", () => {
  const before = useStore.getState().workflow;
  const failed = useStore.getState().importRaw("{");
  expect(failed.ok).toBe(false);
  expect(useStore.getState().workflow).toBe(before);
  expect(useStore.getState().importError).toBeTruthy();
  expect(useStore.getState().pendingReplace).toBeNull();
  useStore.getState().clearImportError();

  const cyclic = JSON.stringify({
    version: 2,
    actors: [],
    nodes: [
      {
        id: "a",
        type: "step",
        position: { x: 0, y: 0 },
        stepKind: "other",
        title: "",
        detail: "",
        split: "exclusive",
      },
      {
        id: "b",
        type: "step",
        position: { x: 0, y: 40 },
        stepKind: "other",
        title: "",
        detail: "",
        split: "exclusive",
      },
    ],
    edges: [
      { id: "e1", source: "a", target: "b", label: "" },
      { id: "e2", source: "b", target: "a", label: "" },
    ],
    assignments: {},
    after: emptyAfterOverlay(),
  });
  const blocked = useStore.getState().importRaw(cyclic);
  expect(blocked.ok).toBe(false);
  expect(useStore.getState().workflow).toBe(before);
  expect(useStore.getState().pendingReplace).toBeNull();

  const ok = useStore.getState().importRaw(tiny);
  expect(ok.ok).toBe(true);
  expect(useStore.getState().workflow).toBe(before);
  expect(useStore.getState().pendingReplace?.kind).toBe("import");
  useStore.getState().confirmReplaceDiscard();
  expect(useStore.getState().workflow.nodes.map((n) => n.id)).toEqual(["s_only"]);
  expect(useStore.getState().pendingReplace).toBeNull();
});

test("requestFocus replaces a sticky id; consumeFocus only clears the matching request", () => {
  useStore.getState().requestFocus("a");
  expect(useStore.getState().focusId).toBe("a");
  useStore.getState().requestFocus("b");
  expect(useStore.getState().focusId).toBe("b");
  useStore.getState().consumeFocus("a");
  expect(useStore.getState().focusId).toBe("b");
  useStore.getState().consumeFocus("b");
  expect(useStore.getState().focusId).toBeNull();
});

test("storage write failures mark persistStatus unavailable without dropping in-memory edits", () => {
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("quota");
  });
  const beforeActors = useStore.getState().workflow.actors.length;
  useStore.getState().addHuman("Pat");
  expect(useStore.getState().persistStatus).toBe("unavailable");
  expect(useStore.getState().workflow.actors.length).toBe(beforeActors + 1);
  useStore.getState().addHuman("Quinn");
  expect(useStore.getState().persistStatus).toBe("unavailable");
});
