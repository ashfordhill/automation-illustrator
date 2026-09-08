import { afterEach, beforeEach, expect, test, vi } from "vitest";
import * as cues from "../app/sound/cues";
import { OAK_PARK_IDS } from "../demos/oakParkInvoice";
import { ColorScheme, SelectionKind, ViewMode, WorkflowNodeKind } from "../workflow/catalogs";
import { MSG } from "../workflow/commands";
import { defaultRemovalCandidateId, validateWorkflow } from "../workflow/graph";
import { emptyAfterOverlay, type WorkflowDoc } from "../workflow/types";
import { IDLE } from "./interaction";
import { useStore } from "./store";

function resetSession() {
  localStorage.clear();
  const s = useStore.getState();
  s.resetDemo();
  s.setView(ViewMode.Before);
  s.setPresent(false);
  s.select(null);
  s.setHelp(false);
  s.cancelReplace();
  s.clearImportError();
  s.closeBoardModes();
  s.setNotice(null);
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
  expect(useStore.getState().interaction.kind).toBe("idle");
  expect(useStore.getState().notice).toBe(MSG.rootRemoval);
  expect(validateWorkflow(useStore.getState().workflow)).toEqual([]);
  s.setNotice(null);

  const edge = useStore.getState().workflow.edges[0]!;
  s.select({ type: SelectionKind.Edge, id: edge.id });
  const edgeCount = useStore.getState().workflow.edges.length;
  s.deleteSelection();
  expect(useStore.getState().workflow.edges).toHaveLength(edgeCount);
  expect(useStore.getState().notice).toBe(MSG.pathRemoval);

  s.setNotice(null);
  s.select({ type: SelectionKind.Edge, id: "e_web_acct" });
  s.deleteSelection();
  expect(useStore.getState().workflow.edges.some((e) => e.id === "e_web_acct")).toBe(false);
  expect(useStore.getState().notice).toBe(null);
  expect(validateWorkflow(useStore.getState().workflow)).toEqual([]);

  s.select({ type: SelectionKind.Node, id: leaf });
  s.deleteSelection();
  expect(useStore.getState().workflow.nodes.some((n) => n.id === leaf)).toBe(false);
  expect(useStore.getState().interaction.kind).toBe("idle");
  expect(validateWorkflow(useStore.getState().workflow)).toEqual([]);
});

test("1:N / N:1 auto removal restitches after confirm; M:N opens pairing preview", () => {
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
  expect(useStore.getState().interaction.kind).toBe("remove-preview");
  useStore.getState().confirmRemove();
  expect(useStore.getState().workflow.nodes.some((n) => n.id === "n")).toBe(false);
  expect(validateWorkflow(useStore.getState().workflow)).toEqual([]);
});

test("connect rejects a cycle without mutating; spawnBranch stays valid", () => {
  const s = useStore.getState();
  const root = rootId(s.workflow);
  const leaf = leafId(s.workflow);
  const edgesBefore = s.workflow.edges.length;
  s.connect(leaf, root);
  expect(useStore.getState().workflow.edges).toHaveLength(edgesBefore);
  expect(useStore.getState().notice).toBe(MSG.rootIncoming);

  const id = useStore.getState().spawnBranch(leaf, WorkflowNodeKind.Step);
  expect(id).toBeTruthy();
  expect(validateWorkflow(useStore.getState().workflow)).toEqual([]);
});

test("undo does not change the active view; replaceDoc is a history boundary", () => {
  const s = useStore.getState();
  s.setView(ViewMode.After);
  const leaf = leafId(s.workflow);
  s.updateNode(leaf, { title: "typed-from-after" });
  expect(useStore.getState().past.length).toBeGreaterThan(0);
  s.undo();
  expect(useStore.getState().view).toBe(ViewMode.After);
  const undone = useStore.getState().workflow.nodes.find((n) => n.id === leaf);
  expect(undone && "title" in undone ? undone.title : "").not.toBe("typed-from-after");

  s.updateNode(leaf, { title: "typed" });
  expect(useStore.getState().past.length).toBeGreaterThan(0);
  s.resetDemo();
  expect(useStore.getState().past).toEqual([]);
  expect(useStore.getState().future).toEqual([]);
});

test("empty-canvas connect does not spawn a Node; Escape returns to idle", () => {
  const s = useStore.getState();
  const source = s.workflow.edges[0]!.source;
  const count = s.workflow.nodes.length;
  s.beginLinkFrom(source);
  expect(useStore.getState().interaction.kind).toBe("connect-existing");
  s.closeBoardModes();
  expect(useStore.getState().interaction).toEqual(IDLE);
  expect(useStore.getState().workflow.nodes).toHaveLength(count);
});

test("addStep on a nonempty board does not create a second root", () => {
  const s = useStore.getState();
  const count = s.workflow.nodes.length;
  expect(s.addStep({ x: 10, y: 10 })).toBe("");
  expect(useStore.getState().workflow.nodes).toHaveLength(count);
  expect(useStore.getState().notice).toBe(MSG.notEmpty);
  expect(validateWorkflow(useStore.getState().workflow)).toEqual([]);
});

test("removeTarget on the root explains WG-06 and stays idle", () => {
  const s = useStore.getState();
  const root = rootId(s.workflow);
  const before = s.workflow;
  s.removeTarget(root);
  expect(useStore.getState().notice).toBe(MSG.rootRemoval);
  expect(useStore.getState().interaction).toEqual(IDLE);
  expect(useStore.getState().workflow).toBe(before);
});

test("sole remaining Tile can be deleted back to the empty board (WG-06)", () => {
  const s = useStore.getState();
  s.requestNew();
  s.confirmReplaceDiscard();
  const id = useStore.getState().addStep();
  expect(id).toBeTruthy();
  useStore.getState().removeTarget(id);
  expect(useStore.getState().workflow.nodes).toHaveLength(0);
  expect(useStore.getState().selected).toBeNull();
  expect(useStore.getState().interaction).toEqual(IDLE);
});

test("root-only board explains WG-06; leaf picker defaults to itself (WG-09)", () => {
  const s = useStore.getState();
  s.requestNew();
  s.confirmReplaceDiscard();
  const stepId = useStore.getState().addStep();
  expect(stepId).toBeTruthy();
  useStore.getState().spawnBranch(stepId, WorkflowNodeKind.Step);
  expect(useStore.getState().workflow.nodes.length).toBeGreaterThan(1);
  useStore.getState().removeTarget(stepId);
  expect(useStore.getState().notice).toBe(MSG.rootRemoval);
  expect(useStore.getState().workflow.nodes.some((n) => n.id === stepId)).toBe(true);

  s.resetDemo();
  const leaf = leafId(useStore.getState().workflow);
  const def = defaultRemovalCandidateId(
    useStore.getState().workflow.nodes,
    useStore.getState().workflow.edges,
    leaf,
  );
  expect(def).toBe(leaf);
});

test("insertOnPath relocates a leaf onto an existing Path", () => {
  const board: WorkflowDoc = {
    version: 2,
    actors: [{ id: "h1", kind: "human", name: "Ada", color: "#f4c6d4", role: "worker" }],
    nodes: [
      { id: "r", type: "step", position: { x: 0, y: 40 }, stepKind: "other", title: "root", detail: "", split: "exclusive" },
      { id: "a", type: "step", position: { x: 80, y: 0 }, stepKind: "other", title: "mid", detail: "", split: "exclusive" },
      { id: "b", type: "step", position: { x: 160, y: 0 }, stepKind: "other", title: "tail", detail: "", split: "exclusive" },
      { id: "c", type: "step", position: { x: 80, y: 80 }, stepKind: "other", title: "leaf", detail: "", split: "exclusive" },
    ],
    edges: [
      { id: "e1", source: "r", target: "a", label: "" },
      { id: "e2", source: "a", target: "b", label: "keep" },
      { id: "e3", source: "r", target: "c", label: "" },
    ],
    assignments: { r: "h1", a: "h1", b: "h1", c: "h1" },
    after: emptyAfterOverlay(),
  };
  useStore.getState().replaceDoc(board);
  useStore.getState().insertOnPath("c", "e2");
  const next = useStore.getState().workflow;
  expect(next.edges.some((e) => e.source === "a" && e.target === "c" && e.label === "keep")).toBe(true);
  expect(next.edges.some((e) => e.source === "c" && e.target === "b" && e.label === "")).toBe(true);
  expect(next.edges.some((e) => e.source === "r" && e.target === "c")).toBe(false);
  expect(validateWorkflow(next)).toEqual([]);
});

test("Path connect plays zip; Tile spawn keeps the blip (SH-04)", () => {
  const spy = vi.spyOn(cues, "playCueWhen");
  useStore.getState().setSoundEnabled(true);

  spy.mockClear();
  useStore.getState().connect(OAK_PARK_IDS.web, OAK_PARK_IDS.fs);
  expect(
    useStore.getState().workflow.edges.some(
      (e) => e.source === OAK_PARK_IDS.web && e.target === OAK_PARK_IDS.fs,
    ),
  ).toBe(true);
  expect(spy).toHaveBeenCalledWith(true, "zip");
  expect(spy).not.toHaveBeenCalledWith(true, "blip");

  spy.mockClear();
  const id = useStore.getState().spawnBranch(OAK_PARK_IDS.review, WorkflowNodeKind.Step);
  expect(id).toBeTruthy();
  expect(spy).toHaveBeenCalledWith(true, "blip");
  expect(spy).not.toHaveBeenCalledWith(true, "zip");
  spy.mockRestore();
});
