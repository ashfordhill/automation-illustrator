import { afterEach, beforeEach, expect, test } from "vitest";
import { ColorScheme, SelectionKind, Tool, ViewMode, WorkflowNodeKind } from "../workflow/catalogs";
import { MSG } from "../workflow/commands";
import { validateWorkflow } from "../workflow/graph";
import { emptyAfterOverlay, type WorkflowDoc } from "../workflow/types";
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
  resetSession();
});

function rootId(doc: WorkflowDoc) {
  const incoming = new Set(doc.edges.map((e) => e.target));
  return doc.nodes.find((n) => !incoming.has(n.id))!.id;
}

function leafId(doc: WorkflowDoc) {
  const outgoing = new Set(doc.edges.map((e) => e.source));
  return doc.nodes.find((n) => !outgoing.has(n.id))!.id;
}

function dataId(doc: WorkflowDoc) {
  return doc.nodes.find((n) => n.type === WorkflowNodeKind.DataField)!.id;
}

test("store actions keep a valid workflow (WG-02..WG-04)", () => {
  const s = useStore.getState();
  expect(validateWorkflow(s.workflow)).toEqual([]);
  const root = rootId(s.workflow);
  const leaf = leafId(s.workflow);

  s.select({ type: SelectionKind.Node, id: root });
  s.deleteSelection();
  expect(useStore.getState().workflow.nodes.some((n) => n.id === root)).toBe(true);
  expect(useStore.getState().hintNotice).toBe(MSG.rootRemoval);
  expect(validateWorkflow(useStore.getState().workflow)).toEqual([]);

  const edge = useStore.getState().workflow.edges[0]!;
  s.select({ type: SelectionKind.Edge, id: edge.id });
  const edgeCount = useStore.getState().workflow.edges.length;
  s.deleteSelection();
  expect(useStore.getState().workflow.edges).toHaveLength(edgeCount);
  expect(useStore.getState().hintNotice).toBe(MSG.pathRemoval);

  s.select({ type: SelectionKind.Node, id: leaf });
  s.deleteSelection();
  expect(useStore.getState().workflow.nodes.some((n) => n.id === leaf)).toBe(false);
  expect(validateWorkflow(useStore.getState().workflow)).toEqual([]);
});

test("1:N / N:1 auto removal restitches; M:N stays blocked in the store", () => {
  const s = useStore.getState();
  const account = dataId(s.workflow);
  s.select({ type: SelectionKind.Node, id: account });
  s.deleteSelection();
  expect(useStore.getState().workflow.nodes.some((n) => n.id === account)).toBe(false);
  expect(validateWorkflow(useStore.getState().workflow)).toEqual([]);

  const mn: WorkflowDoc = {
    version: 2,
    actors: [
      { id: "h1", kind: "human", name: "Ada", color: "#f4c6d4", role: "worker" },
    ],
    nodes: [
      {
        id: "r",
        type: "step",
        position: { x: 0, y: 40 },
        stepKind: "other",
        title: "",
        detail: "",
        split: "exclusive",
      },
      {
        id: "a",
        type: "step",
        position: { x: 40, y: 0 },
        stepKind: "other",
        title: "",
        detail: "",
        split: "exclusive",
      },
      {
        id: "b",
        type: "step",
        position: { x: 40, y: 80 },
        stepKind: "other",
        title: "",
        detail: "",
        split: "exclusive",
      },
      {
        id: "n",
        type: "step",
        position: { x: 80, y: 40 },
        stepKind: "other",
        title: "",
        detail: "",
        split: "exclusive",
      },
      {
        id: "c",
        type: "step",
        position: { x: 120, y: 0 },
        stepKind: "other",
        title: "",
        detail: "",
        split: "exclusive",
      },
      {
        id: "d",
        type: "step",
        position: { x: 120, y: 80 },
        stepKind: "other",
        title: "",
        detail: "",
        split: "exclusive",
      },
    ],
    edges: [
      { id: "e1", source: "r", target: "a", label: "" },
      { id: "e2", source: "r", target: "b", label: "" },
      { id: "e3", source: "a", target: "n", label: "" },
      { id: "e4", source: "b", target: "n", label: "" },
      { id: "e5", source: "n", target: "c", label: "" },
      { id: "e6", source: "n", target: "d", label: "" },
    ],
    assignments: { r: "h1", a: "h1", b: "h1", n: "h1", c: "h1", d: "h1" },
    after: emptyAfterOverlay(),
  };
  useStore.getState().replaceDoc(mn);
  useStore.getState().select({ type: SelectionKind.Node, id: "n" });
  useStore.getState().deleteSelection();
  expect(useStore.getState().workflow.nodes.some((n) => n.id === "n")).toBe(true);
  expect(useStore.getState().hintNotice).toBe(MSG.manyToMany);
  expect(validateWorkflow(useStore.getState().workflow)).toEqual([]);
});

test("connect rejects a cycle without mutating; spawnBranch stays valid", () => {
  const s = useStore.getState();
  const root = rootId(s.workflow);
  const leaf = leafId(s.workflow);
  const edgesBefore = s.workflow.edges.length;
  s.connect(leaf, root);
  expect(useStore.getState().workflow.edges).toHaveLength(edgesBefore);
  expect(useStore.getState().hintNotice).toBe(MSG.rootIncoming);

  const id = useStore.getState().spawnBranch(leaf, WorkflowNodeKind.Step);
  expect(id).toBeTruthy();
  expect(validateWorkflow(useStore.getState().workflow)).toEqual([]);
});

test("undo does not change the active view; replaceDoc is a history boundary", () => {
  const s = useStore.getState();
  s.setView(ViewMode.After);
  const leaf = leafId(s.workflow);
  s.select({ type: SelectionKind.Node, id: leaf });
  s.deleteSelection();
  expect(useStore.getState().past.length).toBeGreaterThan(0);
  s.undo();
  expect(useStore.getState().view).toBe(ViewMode.After);
  expect(useStore.getState().workflow.nodes.some((n) => n.id === leaf)).toBe(true);

  s.updateNode(leaf, { title: "typed" });
  expect(useStore.getState().past.length).toBeGreaterThan(0);
  s.resetDemo();
  expect(useStore.getState().past).toEqual([]);
  expect(useStore.getState().future).toEqual([]);
});

test("confirmPathPick no longer removes a Path", () => {
  const s = useStore.getState();
  const source = s.workflow.edges[0]!.source;
  const count = s.workflow.edges.length;
  s.beginPathPick(source);
  s.confirmPathPick();
  expect(useStore.getState().workflow.edges).toHaveLength(count);
  expect(useStore.getState().hintNotice).toBe(MSG.pathRemoval);
  expect(useStore.getState().pathPick).toBeNull();
});

test("addStep on a nonempty board does not create a second root", () => {
  const s = useStore.getState();
  const count = s.workflow.nodes.length;
  expect(s.addStep({ x: 10, y: 10 })).toBe("");
  expect(useStore.getState().workflow.nodes).toHaveLength(count);
  expect(useStore.getState().hintNotice).toBe(MSG.notEmpty);
  expect(validateWorkflow(useStore.getState().workflow)).toEqual([]);
});
