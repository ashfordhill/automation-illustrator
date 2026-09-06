/**
 * Zustand board state: workflow document, undo stack, tools, linking, theme.
 * Canvas (board/Board.tsx) and chrome (Toolbar, DetailsPanel, CanvasHelper)
 * all read/write through here. persist/workflowJson.ts handles localStorage JSON.
 *
 * commit / undo / redo — history
 * addStep / addField — first step is New board; later tiles spawn from +
 * addHuman / addRobot — details + New person / + New robot
 * openLinkMenu / spawnBranch / beginLinkFrom — tile +
 * beginPathPick / detachPath — tile −
 * toggleSelectedDash — selected path solid/dotted
 * assignActor — details Who select
 * requestNew / confirmNew — hamburger New (undoable via commit)
 */
import { create } from "zustand";
import { applyDashForSplit, defaultDashed, edgeIsDotted, maybeExclusiveSplit, nextPortIndex, outgoingSorted, spreadForLabels } from "../board/pathGeometry";
import { clearDockPosition, snapToGrid, vacantSpot } from "../board/tileMetrics";
import {
  aliceId,
  defaultActors,
  makeHuman,
  makeRobot,
  oakParkInvoice,
  freshBoard,
} from "../demo/oakParkInvoice";
import { clone, nid } from "../identity/ids";
import {
  ARROW_PRESET,
  WASD_PRESET,
  loadKeymap,
  saveKeymap,
  type KeyAction,
  type Keymap,
} from "../keyboard/bindings";
import {
  ActorKind,
  AssignmentLane,
  ColorScheme,
  IdPrefix,
  KeyPreset,
  RobotKind,
  SelectionKind,
  SplitKind,
  StepKind,
  Tool,
  ViewMode,
  WorkflowNodeKind,
} from "../model/catalogs";
import {
  isHuman,
  isRobot,
  isStepNode,
  STEP_KIND_META,
  type ActorDto,
  type Assignments,
  type ColorScheme as ColorSchemeT,
  type NodeDto,
  type RobotKind as RobotKindT,
  type StepKind as StepKindT,
  type Tool as ToolT,
  type ViewMode as ViewModeT,
  type WorkflowDoc,
} from "../model/types";
import {
  fromJson,
  loadTheme,
  LS_WORKFLOW,
  saveTheme,
  toJson,
} from "../persist/workflowJson";

/** Right-hand details panel target, or null when nothing is selected. */
export type Selection =
  | { type: typeof SelectionKind.Node; id: string }
  | { type: typeof SelectionKind.Edge; id: string }
  | { type: typeof SelectionKind.Actor; id: string }
  | null;

/** Which outgoing arrow is highlighted during − detach. */
export type PathPick = { sourceId: string; index: number };

/** Demo or last saved board, with labels already given room. */
function loadStart(): WorkflowDoc {
  let w: WorkflowDoc;
  try {
    const raw = localStorage.getItem(LS_WORKFLOW);
    w = raw ? fromJson(raw) : oakParkInvoice();
  } catch {
    w = oakParkInvoice();
  }
  w = room(w);
  persist(w);
  return w;
}

function persist(w: WorkflowDoc) {
  localStorage.setItem(LS_WORKFLOW, toJson(w));
}

/** Push tiles apart so long edge labels (e.g. invoice > $50,000) fit. */
function room(w: WorkflowDoc): WorkflowDoc {
  const nodes = spreadForLabels(w.nodes, w.edges);
  return nodes === w.nodes ? w : { ...w, nodes };
}

/** Stub steps from + on empty board — detach deletes them if they become orphaned. */
function isStubStep(n: NodeDto | undefined) {
  return !!n && isStepNode(n) && !!n.stub;
}

export const useStore = create<{
  workflow: WorkflowDoc;
  past: WorkflowDoc[];
  future: WorkflowDoc[];
  view: ViewModeT;
  tool: ToolT;
  present: boolean;
  selected: Selection;
  keymap: Keymap;
  helpOpen: boolean;
  capturing: KeyAction | null;
  lastHumanId: string | null;
  focusId: string | null;
  linkFrom: string | null;
  linkMenu: string | null;
  pathPick: PathPick | null;
  colorScheme: ColorSchemeT;
  newConfirmOpen: boolean;
  commit: (next: WorkflowDoc) => void;
  undo: () => void;
  redo: () => void;
  setView: (v: ViewModeT) => void;
  setTool: (t: ToolT) => void;
  setPresent: (p: boolean) => void;
  select: (s: Selection) => void;
  setHelp: (v: boolean) => void;
  setCapturing: (a: KeyAction | null) => void;
  setKey: (action: KeyAction, key: string) => void;
  applyPreset: (which: KeyPreset) => void;
  setColorScheme: (c: ColorSchemeT) => void;
  toggleColorScheme: () => void;
  assignmentLane: () => AssignmentLane;
  actorFor: (stepId: string, lane?: AssignmentLane) => ActorDto | undefined;
  addStep: (position?: { x: number; y: number }, kind?: StepKindT) => string;
  addField: (position?: { x: number; y: number }) => string;
  addHuman: (name?: string) => string;
  addRobot: (kind?: RobotKindT) => string;
  updateNode: (id: string, patch: Partial<NodeDto>) => void;
  updateEdge: (id: string, patch: { label?: string; dashed?: boolean }) => void;
  updateActor: (id: string, patch: Partial<ActorDto>) => void;
  assignActor: (stepId: string, actorId: string) => void;
  connect: (source: string, target: string, label?: string) => void;
  deleteSelection: () => void;
  openLinkMenu: (sourceId: string) => void;
  closeBoardModes: () => void;
  spawnBranch: (sourceId: string, type: typeof WorkflowNodeKind.Step | typeof WorkflowNodeKind.DataField) => string;
  beginLinkFrom: (sourceId: string) => void;
  cancelLinkFrom: () => void;
  completeLinkTo: (targetId: string) => void;
  completeLinkNew: () => void;
  toggleSelectedDash: () => void;
  focusPathLabel: () => void;
  beginPathPick: (sourceId: string) => void;
  cancelPathPick: () => void;
  cyclePathPick: (dir: -1 | 1) => void;
  confirmPathPick: () => void;
  pickPathByEdge: (edgeId: string) => void;
  detachPath: (edgeId: string) => void;
  requestNew: () => void;
  setNewConfirmOpen: (v: boolean) => void;
  confirmNew: () => void;
  loadDoc: (doc: WorkflowDoc) => void;
  resetDemo: () => void;
}>((set, get) => ({
  workflow: loadStart(),
  past: [],
  future: [],
  view: ViewMode.Before,
  tool: Tool.Pointer,
  present: false,
  selected: null,
  keymap: loadKeymap(),
  helpOpen: false,
  capturing: null,
  lastHumanId: null,
  focusId: null,
  linkFrom: null,
  linkMenu: null,
  pathPick: null,
  colorScheme: loadTheme(),
  newConfirmOpen: false,

  /** Snapshot current board onto the undo stack, persist, clear redo. */
  commit: (next) => {
    const { workflow, past } = get();
    const placed = room(next);
    persist(placed);
    set({
      workflow: placed,
      past: [...past, clone(workflow)].slice(-80),
      future: [],
    });
  },
  undo: () => {
    const { past, workflow, future } = get();
    const prev = past.at(-1);
    if (!prev) return;
    persist(prev);
    set({
      workflow: prev,
      past: past.slice(0, -1),
      future: [clone(workflow), ...future],
      linkFrom: null,
      linkMenu: null,
      pathPick: null,
    });
  },
  redo: () => {
    const { past, workflow, future } = get();
    const nxt = future[0];
    if (!nxt) return;
    persist(nxt);
    set({
      workflow: nxt,
      past: [...past, clone(workflow)],
      future: future.slice(1),
      linkFrom: null,
      linkMenu: null,
      pathPick: null,
    });
  },
  setView: (view) => set({ view }),
  setTool: (tool) => set({ tool, linkFrom: null, linkMenu: null, pathPick: null }),
  setPresent: (present) =>
    set({
      present,
      tool: present ? Tool.Hand : Tool.Pointer,
      helpOpen: present ? false : get().helpOpen,
      selected: present ? null : get().selected,
      linkFrom: null,
      linkMenu: null,
      pathPick: null,
    }),
  select: (selected) => set({ selected, linkMenu: null }),
  setHelp: (helpOpen) => set({ helpOpen, capturing: helpOpen ? get().capturing : null }),
  setCapturing: (capturing) => set({ capturing }),
  setKey: (action, key) => {
    const keymap = { ...get().keymap, [action]: key };
    saveKeymap(keymap);
    set({ keymap, capturing: null });
  },
  applyPreset: (which) => {
    const keymap = which === KeyPreset.Wasd ? { ...WASD_PRESET } : { ...ARROW_PRESET };
    saveKeymap(keymap);
    set({ keymap });
  },
  setColorScheme: (colorScheme) => {
    saveTheme(colorScheme);
    set({ colorScheme });
  },
  toggleColorScheme: () => {
    const colorScheme =
      get().colorScheme === ColorScheme.Dark ? ColorScheme.Light : ColorScheme.Dark;
    saveTheme(colorScheme);
    set({ colorScheme });
  },
  /** Both view still edits the Before assignment map. */
  assignmentLane: () =>
    get().view === ViewMode.After ? AssignmentLane.After : AssignmentLane.Before,
  actorFor: (stepId, lane) => {
    const { workflow, assignmentLane } = get();
    const L = lane ?? assignmentLane();
    const id = workflow.assignments[L][stepId];
    return workflow.actors.find((a) => a.id === id);
  },

  addStep: (position, kind = StepKind.Other) => {
    const { workflow, commit, lastHumanId } = get();
    if (!position && workflow.nodes.some(isStepNode)) return "";
    const id = nid(IdPrefix.Step);
    const human =
      lastHumanId ??
      aliceId(workflow.actors) ??
      workflow.actors.find((a) => a.kind === ActorKind.Human)?.id;
    const pos = position ?? vacantSpot(workflow.nodes, WorkflowNodeKind.Step);
    const node: NodeDto = {
      id,
      type: WorkflowNodeKind.Step,
      position: { x: snapToGrid(pos.x), y: snapToGrid(pos.y) },
      stepKind: kind,
      title: STEP_KIND_META[kind].defaultTitle,
      detail: "",
      split: SplitKind.Exclusive,
    };
    const actors = workflow.actors.length ? workflow.actors : defaultActors();
    const hid = human ?? aliceId(actors);
    commit({
      ...workflow,
      actors,
      nodes: [...workflow.nodes, node],
      assignments: {
        [AssignmentLane.Before]: {
          ...workflow.assignments[AssignmentLane.Before],
          ...(hid ? { [id]: hid } : {}),
        },
        [AssignmentLane.After]: {
          ...workflow.assignments[AssignmentLane.After],
          ...(hid ? { [id]: hid } : {}),
        },
      },
    });
    set({ selected: { type: SelectionKind.Node, id }, lastHumanId: hid ?? lastHumanId });
    return id;
  },
  addField: (position) => {
    const id = nid(IdPrefix.DataField);
    const { workflow, commit } = get();
    const pos = position ?? vacantSpot(workflow.nodes, WorkflowNodeKind.DataField);
    commit({
      ...workflow,
      nodes: [
        ...workflow.nodes,
        {
          id,
          type: WorkflowNodeKind.DataField,
          position: { x: snapToGrid(pos.x), y: snapToGrid(pos.y) },
          label: "Data",
        },
      ],
    });
    set({ selected: { type: SelectionKind.Node, id } });
    return id;
  },
  addHuman: (name) => {
    const actor = makeHuman(name);
    const { workflow, commit } = get();
    commit({ ...workflow, actors: [...workflow.actors, actor] });
    set({ selected: { type: SelectionKind.Actor, id: actor.id } });
    return actor.id;
  },
  addRobot: (kind = RobotKind.Script) => {
    const actor = makeRobot("Robot", kind);
    const { workflow, commit } = get();
    commit({ ...workflow, actors: [...workflow.actors, actor] });
    set({ selected: { type: SelectionKind.Actor, id: actor.id } });
    return actor.id;
  },
  updateNode: (id, patch) => {
    const { workflow, commit } = get();
    let nodes = workflow.nodes.map((n) => {
      if (n.id !== id) return n;
      const next = { ...n, ...patch } as NodeDto;
      if (
        isStepNode(next) &&
        ["stepKind", "title", "detail"].some((k) => k in patch)
      ) {
        next.stub = false;
      }
      return next;
    });
    let edges = workflow.edges;
    if ("split" in patch) {
      edges = applyDashForSplit(nodes, edges, id);
    }
    commit({ ...workflow, nodes, edges });
  },
  updateEdge: (id, patch) => {
    const { workflow, commit } = get();
    commit({
      ...workflow,
      edges: workflow.edges.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    });
  },
  updateActor: (id, patch) => {
    const { workflow, commit } = get();
    commit({
      ...workflow,
      actors: workflow.actors.map((a) =>
        a.id === id ? ({ ...a, ...patch } as ActorDto) : a,
      ),
    });
  },
  /** Before lane refuses robots; lastHumanId remembers who to stamp on new steps. */
  assignActor: (stepId, actorId) => {
    const { workflow, commit, assignmentLane } = get();
    const lane = assignmentLane();
    const actor = workflow.actors.find((a) => a.id === actorId);
    if (lane === AssignmentLane.Before && isRobot(actor)) return;
    commit({
      ...workflow,
      assignments: {
        ...workflow.assignments,
        [lane]: { ...workflow.assignments[lane], [stepId]: actorId },
      },
    });
    if (isHuman(actor)) set({ lastHumanId: actorId });
  },
  connect: (source, target, label = "") => {
    if (source === target) return;
    const { workflow, commit } = get();
    if (workflow.edges.some((e) => e.source === source && e.target === target)) return;
    let nodes = workflow.nodes;
    const edges = [
      ...workflow.edges,
      {
        id: nid(IdPrefix.Edge),
        source,
        target,
        label,
        dashed: defaultDashed(workflow.edges, source),
      },
    ];
    nodes = maybeExclusiveSplit(nodes, edges, source);
    commit({ ...workflow, nodes, edges });
  },
  deleteSelection: () => {
    const { selected, workflow, commit } = get();
    if (!selected) return;
    if (selected.type === SelectionKind.Node) {
      const id = selected.id;
      const dropAssign = (lane: Assignments) => {
        const next = { ...lane };
        delete next[id];
        return next;
      };
      commit({
        ...workflow,
        nodes: workflow.nodes.filter((n) => n.id !== id),
        edges: workflow.edges.filter((e) => e.source !== id && e.target !== id),
        assignments: {
          [AssignmentLane.Before]: dropAssign(workflow.assignments[AssignmentLane.Before]),
          [AssignmentLane.After]: dropAssign(workflow.assignments[AssignmentLane.After]),
        },
      });
    } else if (selected.type === SelectionKind.Edge) {
      commit({
        ...workflow,
        edges: workflow.edges.filter((e) => e.id !== selected.id),
      });
    } else {
      const used = Object.values(workflow.assignments[AssignmentLane.Before])
        .concat(Object.values(workflow.assignments[AssignmentLane.After]))
        .includes(selected.id);
      if (used) return;
      commit({
        ...workflow,
        actors: workflow.actors.filter((a) => a.id !== selected.id),
      });
    }
    set({ selected: null, linkFrom: null, linkMenu: null, pathPick: null });
  },

  closeBoardModes: () => set({ linkFrom: null, linkMenu: null, pathPick: null }),
  openLinkMenu: (sourceId) => {
    const { linkMenu } = get();
    if (linkMenu === sourceId) {
      set({ linkMenu: null });
      return;
    }
    set({
      linkMenu: sourceId,
      linkFrom: null,
      pathPick: null,
      selected: { type: SelectionKind.Node, id: sourceId },
    });
  },
  spawnBranch: (sourceId, type) => {
    const { workflow, commit, lastHumanId } = get();
    const src = workflow.nodes.find((n) => n.id === sourceId);
    if (!src) {
      set({ linkMenu: null, linkFrom: null });
      return "";
    }
    const port = nextPortIndex(workflow.edges, sourceId);
    const pos = clearDockPosition(src, type, port, workflow.nodes);
    const dashed = defaultDashed(workflow.edges, sourceId);
    if (type === WorkflowNodeKind.DataField) {
      const id = nid(IdPrefix.DataField);
      const node: NodeDto = {
        id,
        type: WorkflowNodeKind.DataField,
        position: pos,
        label: "Data",
      };
      const edges = [
        ...workflow.edges,
        { id: nid(IdPrefix.Edge), source: sourceId, target: id, label: "", dashed },
      ];
      const nodes = maybeExclusiveSplit([...workflow.nodes, node], edges, sourceId);
      commit({ ...workflow, nodes, edges });
      set({
        linkFrom: null,
        linkMenu: null,
        selected: { type: SelectionKind.Node, id },
        focusId: id,
      });
      return id;
    }
    const id = nid(IdPrefix.Step);
    const human =
      lastHumanId ??
      aliceId(workflow.actors) ??
      workflow.actors.find((a) => a.kind === ActorKind.Human)?.id;
    const node: NodeDto = {
      id,
      type: WorkflowNodeKind.Step,
      position: pos,
      stepKind: StepKind.Other,
      title: STEP_KIND_META[StepKind.Other].defaultTitle,
      detail: "",
      split: SplitKind.Exclusive,
      stub: true,
    };
    const edges = [
      ...workflow.edges,
      { id: nid(IdPrefix.Edge), source: sourceId, target: id, label: "", dashed },
    ];
    const nodes = maybeExclusiveSplit([...workflow.nodes, node], edges, sourceId);
    commit({
      ...workflow,
      nodes,
      edges,
      assignments: {
        [AssignmentLane.Before]: {
          ...workflow.assignments[AssignmentLane.Before],
          ...(human ? { [id]: human } : {}),
        },
        [AssignmentLane.After]: {
          ...workflow.assignments[AssignmentLane.After],
          ...(human ? { [id]: human } : {}),
        },
      },
    });
    set({
      linkFrom: null,
      linkMenu: null,
      selected: { type: SelectionKind.Node, id },
      focusId: id,
    });
    return id;
  },
  beginLinkFrom: (sourceId) => {
    const { linkFrom } = get();
    if (linkFrom === sourceId) {
      set({ linkFrom: null, linkMenu: null });
      return;
    }
    set({
      linkFrom: sourceId,
      linkMenu: null,
      pathPick: null,
      selected: { type: SelectionKind.Node, id: sourceId },
    });
  },
  cancelLinkFrom: () => set({ linkFrom: null, linkMenu: null }),
  completeLinkTo: (targetId) => {
    const { linkFrom, connect } = get();
    if (!linkFrom || linkFrom === targetId) return;
    connect(linkFrom, targetId);
    set({
      linkFrom: null,
      linkMenu: null,
      selected: { type: SelectionKind.Node, id: targetId },
      focusId: targetId,
    });
  },
  /** Empty-pane click while linking existing: spawn a stub step. */
  completeLinkNew: () => {
    const { linkFrom, spawnBranch } = get();
    if (!linkFrom) return;
    spawnBranch(linkFrom, WorkflowNodeKind.Step);
  },
  toggleSelectedDash: () => {
    const { selected, workflow, updateEdge } = get();
    if (selected?.type !== SelectionKind.Edge) return;
    const edge = workflow.edges.find((e) => e.id === selected.id);
    if (!edge) return;
    updateEdge(selected.id, { dashed: !edgeIsDotted(workflow.nodes, workflow.edges, edge) });
  },
  focusPathLabel: () => {
    queueMicrotask(() => {
      const el = document.getElementById("path-label-field");
      if (el instanceof HTMLInputElement) {
        el.focus();
        el.select();
      }
    });
  },

  beginPathPick: (sourceId) => {
    const outs = outgoingSorted(get().workflow.nodes, get().workflow.edges, sourceId);
    if (!outs.length) return;
    const { pathPick } = get();
    if (pathPick?.sourceId === sourceId) {
      set({ pathPick: null });
      return;
    }
    set({
      pathPick: { sourceId, index: 0 },
      linkFrom: null,
      linkMenu: null,
      selected: { type: SelectionKind.Node, id: sourceId },
    });
  },
  cancelPathPick: () => set({ pathPick: null }),
  cyclePathPick: (dir) => {
    const { pathPick, workflow } = get();
    if (!pathPick) return;
    const outs = outgoingSorted(workflow.nodes, workflow.edges, pathPick.sourceId);
    if (!outs.length) {
      set({ pathPick: null });
      return;
    }
    const index = (pathPick.index + dir + outs.length) % outs.length;
    set({ pathPick: { ...pathPick, index } });
  },
  confirmPathPick: () => {
    const { pathPick, workflow, detachPath } = get();
    if (!pathPick) return;
    const outs = outgoingSorted(workflow.nodes, workflow.edges, pathPick.sourceId);
    const edge = outs[pathPick.index];
    if (edge) detachPath(edge.id);
  },
  pickPathByEdge: (edgeId) => {
    const { pathPick, workflow, detachPath } = get();
    if (!pathPick) return;
    const outs = outgoingSorted(workflow.nodes, workflow.edges, pathPick.sourceId);
    if (!outs.some((e) => e.id === edgeId)) return;
    detachPath(edgeId);
  },
  detachPath: (edgeId) => {
    const { workflow, commit } = get();
    const edge = workflow.edges.find((e) => e.id === edgeId);
    if (!edge) return;
    let edges = workflow.edges.filter((e) => e.id !== edgeId);
    let nodes = workflow.nodes;
    const tgt = nodes.find((n) => n.id === edge.target);
    const stillIn = edges.some((e) => e.target === edge.target);
    if (isStubStep(tgt) && !stillIn) {
      nodes = nodes.filter((n) => n.id !== tgt!.id);
      edges = edges.filter((e) => e.source !== tgt!.id && e.target !== tgt!.id);
    }
    commit({ ...workflow, nodes, edges });
    set({ pathPick: null });
  },

  requestNew: () => {
    const { workflow } = get();
    if (!workflow.nodes.length && !workflow.edges.length) {
      get().confirmNew();
      return;
    }
    set({ newConfirmOpen: true });
  },
  setNewConfirmOpen: (newConfirmOpen) => set({ newConfirmOpen }),
  confirmNew: () => {
    const doc = freshBoard();
    const first = doc.nodes[0];
    get().commit(doc);
    set({
      newConfirmOpen: false,
      selected: first ? { type: SelectionKind.Node, id: first.id } : null,
      linkFrom: null,
      pathPick: null,
      view: ViewMode.Before,
      linkMenu: null,
    });
  },
  loadDoc: (doc) => {
    get().commit(doc);
    set({ selected: null, linkFrom: null, linkMenu: null, pathPick: null });
  },
  resetDemo: () => get().loadDoc(oakParkInvoice()),
}));
