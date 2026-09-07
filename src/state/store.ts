/**
 * Zustand board state: workflow document, undo stack, interaction, theme.
 * Canvas (board/Board.tsx) and app shell (Toolbar, DetailsPanel, CanvasHelper)
 * all read/write through here. persistence.ts handles localStorage JSON.
 *
 * commit / undo / redo — history.ts (500; replaceDoc is a document boundary)
 * addStep — first Step is the root (WG-01); later tiles spawn from +
 * openLinkMenu / spawnBranch / beginLinkFrom — tile + (hidden in After until Slice 11)
 * beginRemovePick / confirmRemove — − / Delete / inspector Remove picker (WG-08..11)
 * toggleSelectedDash — selected Path solid/dotted
 * requestNew / requestDemo / importRaw — replacement gate (SH-06, SH-12)
 * startFresh / downloadHeldRecovery — corrupt-storage recovery (SH-10)
 */
import { create } from "zustand";
import { spreadForLabels } from "../board/layout/spreadForLabels";
import { clearDockPosition, snapToGrid, vacantSpot } from "../board/layout/tileMetrics";
import { type DemoId, workflowForDemo } from "../demos/catalog";
import { freshBoard, isEmptyBoard, oakParkInvoice } from "../demos/oakParkInvoice";
import {
  ARROW_PRESET,
  WASD_PRESET,
  loadKeymap,
  saveKeymap,
  type KeyAction,
  type Keymap,
} from "../keyboard/bindings";
import {
  defaultActors,
  defaultHumanId,
  makeHuman,
  makeRobot,
  removeActor as removeActorFromDoc,
} from "../workflow/actors";
import {
  AssignmentLane,
  ColorScheme,
  IdPrefix,
  KeyPreset,
  RobotKind,
  SelectionKind,
  SplitKind,
  StepKind,
  ViewMode,
  WorkflowNodeKind,
} from "../workflow/catalogs";
import {
  MSG,
  addConnectedNode,
  applyNodeRemoval,
  connectNodes,
  createRootStep,
  fanPairings,
  nearestPairings,
  pairingBetween,
  planNodeRemoval,
  removalNeighborhood,
  validatePairings,
  type RemovalPairing,
  type RemovalPlan,
} from "../workflow/commands";
import {
  applyDashForSplit,
  defaultRemovalCandidateId,
  edgeIsDotted,
  nextPortIndex,
  removalCandidateIds,
  validateWorkflow,
} from "../workflow/graph";
import { nid } from "../workflow/ids";
import {
  isHuman,
  isStepNode,
  STEP_KIND_META,
  laneAssignments,
  withLaneAssignments,
  type ActorDto,
  type ColorScheme as ColorSchemeT,
  type NodeDto,
  type RobotKind as RobotKindT,
  type StepKind as StepKindT,
  type StepNodeDto,
  type ViewMode as ViewModeT,
  type WorkflowDoc,
} from "../workflow/types";
import {
  commitStructural,
  commitText,
  redoHistory,
  replaceHistory,
  undoHistory,
  type HistoryKind,
} from "./history";
import { IDLE, type DepartingTile, type Interaction } from "./interaction";
import {
  downloadRecoveryCopy,
  downloadWorkflowCopy,
  hydratePersistedWorkflow,
  loadTheme,
  saveTheme,
  writeWorkflow,
  type PersistStatus,
  type RecoveryState,
} from "./persistence";
import { parseDocument, type ParseResult } from "../workflow/migrate";

/** Right-hand inspector target, or null when nothing is selected. */
export type Selection =
  | { type: typeof SelectionKind.Node; id: string }
  | { type: typeof SelectionKind.Edge; id: string }
  | { type: typeof SelectionKind.Actor; id: string }
  | null;

/** Pending New / Demo / Import replacement (SH-06). */
export type PendingReplace =
  | { kind: "new" }
  | { kind: "demo"; demoId: DemoId }
  | { kind: "import"; doc: WorkflowDoc };

function documentForPending(pending: PendingReplace): WorkflowDoc {
  if (pending.kind === "new") return freshBoard();
  if (pending.kind === "demo") return workflowForDemo(pending.demoId);
  return pending.doc;
}

/** Demo or last saved board, with labels already given room. */
function loadStart(): {
  workflow: WorkflowDoc;
  persistStatus: PersistStatus;
  recovery: RecoveryState | null;
} {
  const boot = hydratePersistedWorkflow(oakParkInvoice);
  const workflow = room(boot.workflow);
  if (boot.recovery || boot.persistStatus === "unavailable") {
    return { workflow, persistStatus: boot.persistStatus, recovery: boot.recovery };
  }
  return { workflow, persistStatus: writeWorkflow(workflow), recovery: null };
}

function persistIfAllowed(doc: WorkflowDoc, recovery: RecoveryState | null): PersistStatus {
  if (recovery) return "dirty";
  return writeWorkflow(doc);
}

/** Push tiles apart so long Path conditions (e.g. invoice > $50,000) fit. */
function room(w: WorkflowDoc): WorkflowDoc {
  const nodes = spreadForLabels(w.nodes, w.edges);
  return nodes === w.nodes ? w : { ...w, nodes };
}

function prefersReducedMotion() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const started = loadStart();

function focusNamedField(id: string) {
  queueMicrotask(() => {
    const el = document.getElementById(id);
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      el.focus();
      el.select();
    }
  });
}

export const useStore = create<{
  workflow: WorkflowDoc;
  past: WorkflowDoc[];
  future: WorkflowDoc[];
  view: ViewModeT;
  present: boolean;
  selected: Selection;
  keymap: Keymap;
  helpOpen: boolean;
  capturing: KeyAction | null;
  lastHumanId: string | null;
  manageActorsOpen: boolean;
  manageActorId: string | null;
  focusId: string | null;
  interaction: Interaction;
  departing: DepartingTile | null;
  colorScheme: ColorSchemeT;
  persistStatus: PersistStatus;
  recovery: RecoveryState | null;
  pendingReplace: PendingReplace | null;
  importError: string | null;
  notice: string | null;
  noticeId: number;
  commit: (next: WorkflowDoc, kind?: HistoryKind) => void;
  replaceDoc: (next: WorkflowDoc) => void;
  undo: () => void;
  redo: () => void;
  setView: (v: ViewModeT) => void;
  setPresent: (p: boolean) => void;
  select: (s: Selection) => void;
  setHelp: (v: boolean) => void;
  setCapturing: (a: KeyAction | null) => void;
  setKey: (action: KeyAction, key: string) => void;
  applyPreset: (which: KeyPreset) => void;
  setColorScheme: (c: ColorSchemeT) => void;
  toggleColorScheme: () => void;
  setNotice: (message: string | null) => void;
  clearDeparting: () => void;
  assignmentLane: () => AssignmentLane;
  actorFor: (stepId: string, lane?: AssignmentLane) => ActorDto | undefined;
  addStep: (position?: { x: number; y: number }, kind?: StepKindT) => string;
  addField: (position?: { x: number; y: number }) => string;
  addHuman: (name?: string) => string;
  addRobot: (kind?: RobotKindT) => string;
  removeActor: (actorId: string) => boolean;
  openManageActors: () => void;
  closeManageActors: (opts?: { restoreFocus?: boolean }) => void;
  setManageActorId: (id: string | null) => void;
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
  completeLinkTo: (targetId: string) => void;
  toggleSelectedDash: () => void;
  focusPathLabel: () => void;
  focusDataLabel: () => void;
  beginRemovePick: (hostId: string) => void;
  cycleRemoveCandidate: (dir: -1 | 1) => void;
  setRemoveCandidate: (candidateId: string) => void;
  confirmRemove: () => void;
  setPreviewSuccessorPred: (successorId: string, predecessorId: string) => void;
  useNearestPreviewPairings: () => void;
  useFanPreviewPairings: () => void;
  requestNew: () => void;
  requestDemo: (demoId: DemoId) => void;
  cancelReplace: () => void;
  confirmReplaceDiscard: () => void;
  confirmReplaceSaveCopy: () => void;
  loadDoc: (doc: WorkflowDoc) => void;
  importRaw: (raw: string) => ParseResult;
  clearImportError: () => void;
  resetDemo: () => void;
  requestFocus: (id: string) => void;
  consumeFocus: (id: string) => void;
  clearRecoveryHold: () => void;
  downloadHeldRecovery: () => void;
  startFresh: () => void;
}>((set, get) => ({
  workflow: started.workflow,
  past: [],
  future: [],
  view: ViewMode.Before,
  present: false,
  selected: null,
  keymap: loadKeymap(),
  helpOpen: false,
  capturing: null,
  lastHumanId: null,
  manageActorsOpen: false,
  manageActorId: null,
  focusId: null,
  interaction: IDLE,
  departing: null,
  colorScheme: loadTheme(),
  persistStatus: started.persistStatus,
  recovery: started.recovery,
  pendingReplace: null,
  importError: null,
  notice: null,
  noticeId: 0,

  /** Snapshot current board onto the undo stack, persist unless recovery holds the raw key. */
  commit: (next, kind = "structural") => {
    const violations = validateWorkflow(next);
    if (violations.length) {
      get().setNotice(violations[0]!.message);
      return;
    }
    const { workflow, past, recovery } = get();
    const placed = room(next);
    const persistStatus = persistIfAllowed(placed, recovery);
    const stacks =
      kind === "text"
        ? commitText(workflow, past, placed)
        : commitStructural(workflow, past, placed);
    set({ ...stacks, persistStatus });
  },
  replaceDoc: (next) => {
    const violations = validateWorkflow(next);
    if (violations.length) {
      get().setNotice(violations[0]!.message);
      return;
    }
    const placed = room(next);
    const persistStatus = persistIfAllowed(placed, get().recovery);
    set({
      ...replaceHistory(placed),
      persistStatus,
      selected: null,
      interaction: IDLE,
      departing: null,
      notice: null,
      pendingReplace: null,
      importError: null,
      lastHumanId: null,
      manageActorsOpen: false,
      manageActorId: null,
      view: ViewMode.Before,
    });
  },
  undo: () => {
    const { past, workflow, future, recovery } = get();
    const stacks = undoHistory(past, workflow, future);
    if (!stacks) return;
    const persistStatus = persistIfAllowed(stacks.workflow, recovery);
    set({
      ...stacks,
      persistStatus,
      interaction: IDLE,
      departing: null,
      notice: null,
    });
  },
  redo: () => {
    const { past, workflow, future, recovery } = get();
    const stacks = redoHistory(past, workflow, future);
    if (!stacks) return;
    const persistStatus = persistIfAllowed(stacks.workflow, recovery);
    set({
      ...stacks,
      persistStatus,
      interaction: IDLE,
      departing: null,
      notice: null,
    });
  },
  setView: (view) => set({ view, interaction: IDLE }),
  setPresent: (present) =>
    set({
      present,
      helpOpen: present ? false : get().helpOpen,
      selected: present ? null : get().selected,
      interaction: IDLE,
      departing: null,
      manageActorsOpen: false,
      manageActorId: null,
    }),
  select: (selected) => set({ selected, manageActorsOpen: false, manageActorId: null }),
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
  setNotice: (notice) => {
    if (!notice) {
      set({ notice: null });
      return;
    }
    set({ notice, noticeId: get().noticeId + 1 });
  },
  clearDeparting: () => set({ departing: null }),
  /** Both view still edits the Before assignment map. */
  assignmentLane: () =>
    get().view === ViewMode.After ? AssignmentLane.After : AssignmentLane.Before,
  actorFor: (stepId, lane) => {
    const { workflow, assignmentLane } = get();
    const L = lane ?? assignmentLane();
    const id = laneAssignments(workflow, L)[stepId];
    return workflow.actors.find((a) => a.id === id);
  },

  addStep: (position, kind = StepKind.Other) => {
    const { workflow, lastHumanId } = get();
    if (workflow.nodes.length) {
      if (!position && workflow.nodes.some(isStepNode)) return "";
      get().setNotice(MSG.notEmpty);
      return "";
    }
    const id = nid(IdPrefix.Step);
    const actors = workflow.actors.length ? workflow.actors : defaultActors();
    const hid = defaultHumanId(actors, lastHumanId);
    const pos = position ?? vacantSpot(workflow.nodes, WorkflowNodeKind.Step);
    const node: StepNodeDto = {
      id,
      type: WorkflowNodeKind.Step,
      position: { x: snapToGrid(pos.x), y: snapToGrid(pos.y) },
      stepKind: kind,
      title: STEP_KIND_META[kind].defaultTitle,
      detail: "",
      split: SplitKind.Exclusive,
    };
    const result = createRootStep(
      { ...workflow, actors },
      node,
      hid ? { beforeId: hid, afterId: hid } : undefined,
    );
    if (!result.ok) {
      get().setNotice(result.message);
      return "";
    }
    get().commit(result.value);
    set({
      selected: { type: SelectionKind.Node, id },
      lastHumanId: hid ?? lastHumanId,
      interaction: IDLE,
    });
    return id;
  },
  addField: () => {
    const { workflow } = get();
    get().setNotice(workflow.nodes.length ? MSG.notEmpty : MSG.notStep);
    return "";
  },
  addHuman: (name) => {
    const actor = makeHuman(name);
    const { workflow, commit, manageActorsOpen } = get();
    commit({ ...workflow, actors: [...workflow.actors, actor] });
    if (manageActorsOpen) set({ manageActorId: actor.id });
    return actor.id;
  },
  addRobot: (kind = RobotKind.Script) => {
    const actor = makeRobot("Robot", kind);
    const { workflow, commit, manageActorsOpen } = get();
    commit({ ...workflow, actors: [...workflow.actors, actor] });
    if (manageActorsOpen) set({ manageActorId: actor.id });
    return actor.id;
  },
  removeActor: (actorId) => {
    const result = removeActorFromDoc(get().workflow, actorId);
    if (!result.ok) {
      get().setNotice(result.message);
      return false;
    }
    get().commit(result.value);
    const patch: { manageActorId?: string | null; lastHumanId?: string | null; selected?: Selection } =
      {};
    if (get().manageActorId === actorId) patch.manageActorId = null;
    if (get().lastHumanId === actorId) patch.lastHumanId = null;
    const selected = get().selected;
    if (selected?.type === SelectionKind.Actor && selected.id === actorId) {
      patch.selected = null;
    }
    if (Object.keys(patch).length) set(patch);
    return true;
  },
  openManageActors: () => {
    const { workflow, manageActorId } = get();
    const nextId =
      manageActorId && workflow.actors.some((a) => a.id === manageActorId)
        ? manageActorId
        : (workflow.actors[0]?.id ?? null);
    set({ manageActorsOpen: true, manageActorId: nextId });
  },
  closeManageActors: (opts) => {
    set({ manageActorsOpen: false, manageActorId: null });
    if (opts?.restoreFocus === false) return;
    queueMicrotask(() => {
      document.getElementById("manage-actors-btn")?.focus();
    });
  },
  setManageActorId: (manageActorId) => set({ manageActorId }),
  updateNode: (id, patch) => {
    const { workflow, commit } = get();
    let nodes = workflow.nodes.map((n) => {
      if (n.id !== id) return n;
      return { ...n, ...patch } as NodeDto;
    });
    let edges = workflow.edges;
    if ("split" in patch) {
      edges = applyDashForSplit(nodes, edges, id);
    }
    const textOnly =
      !("split" in patch) && !("stepKind" in patch) && !("position" in patch);
    commit({ ...workflow, nodes, edges }, textOnly ? "text" : "structural");
  },
  updateEdge: (id, patch) => {
    const { workflow, commit } = get();
    const kind: HistoryKind = patch.dashed !== undefined ? "structural" : "text";
    commit({
      ...workflow,
      edges: workflow.edges.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }, kind);
  },
  updateActor: (id, patch) => {
    const { workflow, commit } = get();
    const textOnly = !("color" in patch) && !("robotKind" in patch) && !("kind" in patch);
    commit({
      ...workflow,
      actors: workflow.actors.map((a) =>
        a.id === id ? ({ ...a, ...patch } as ActorDto) : a,
      ),
    }, textOnly ? "text" : "structural");
  },
  /** Who is offered in both lanes (NA-03, NA-11). lastHumanId stamps new Before-origin Steps. */
  assignActor: (stepId, actorId) => {
    const { workflow, commit, assignmentLane } = get();
    const lane = assignmentLane();
    const actor = workflow.actors.find((a) => a.id === actorId);
    if (!actor) return;
    commit(withLaneAssignments(workflow, lane, { ...laneAssignments(workflow, lane), [stepId]: actorId }));
    if (isHuman(actor)) set({ lastHumanId: actorId });
  },
  connect: (source, target, label = "") => {
    const { workflow } = get();
    const result = connectNodes(workflow, source, target, { label });
    if (!result.ok) {
      get().setNotice(result.message);
      return;
    }
    get().commit(result.value);
  },
  deleteSelection: () => {
    const { selected, interaction } = get();
    if (interaction.kind === "remove-pick" || interaction.kind === "remove-preview") {
      get().confirmRemove();
      return;
    }
    if (!selected) return;
    if (selected.type === SelectionKind.Node) {
      get().beginRemovePick(selected.id);
      return;
    }
    if (selected.type === SelectionKind.Edge) {
      get().setNotice(MSG.pathRemoval);
      return;
    }
    get().removeActor(selected.id);
  },

  closeBoardModes: () => set({ interaction: IDLE }),
  openLinkMenu: (sourceId) => {
    if (get().present || get().view === ViewMode.After) return;
    const { interaction } = get();
    if (interaction.kind === "add-menu" && interaction.sourceId === sourceId) {
      set({ interaction: IDLE });
      return;
    }
    set({
      interaction: { kind: "add-menu", sourceId },
      selected: { type: SelectionKind.Node, id: sourceId },
    });
  },
  spawnBranch: (sourceId, type) => {
    if (get().present || get().view === ViewMode.After) return "";
    const { workflow, lastHumanId } = get();
    const src = workflow.nodes.find((n) => n.id === sourceId);
    if (!src) {
      set({ interaction: IDLE });
      return "";
    }
    const port = nextPortIndex(workflow.edges, sourceId);
    const pos = clearDockPosition(src, type, port, workflow.nodes);
    if (type === WorkflowNodeKind.DataField) {
      const id = nid(IdPrefix.DataField);
      const result = addConnectedNode(workflow, sourceId, {
        id,
        type: WorkflowNodeKind.DataField,
        position: pos,
        label: "Data",
      });
      if (!result.ok) {
        get().setNotice(result.message);
        return "";
      }
      get().commit(result.value);
      set({
        interaction: IDLE,
        selected: { type: SelectionKind.Node, id },
      });
      get().requestFocus(id);
      return id;
    }
    const id = nid(IdPrefix.Step);
    const human = defaultHumanId(workflow.actors, lastHumanId);
    const result = addConnectedNode(
      workflow,
      sourceId,
      {
        id,
        type: WorkflowNodeKind.Step,
        position: pos,
        stepKind: StepKind.Other,
        title: STEP_KIND_META[StepKind.Other].defaultTitle,
        detail: "",
        split: SplitKind.Exclusive,
      },
      human ? { beforeId: human, afterId: human } : undefined,
    );
    if (!result.ok) {
      get().setNotice(result.message);
      return "";
    }
    get().commit(result.value);
    set({
      interaction: IDLE,
      selected: { type: SelectionKind.Node, id },
    });
    get().requestFocus(id);
    return id;
  },
  beginLinkFrom: (sourceId) => {
    if (get().present || get().view === ViewMode.After) return;
    const { interaction } = get();
    if (interaction.kind === "connect-existing" && interaction.sourceId === sourceId) {
      set({ interaction: IDLE });
      return;
    }
    set({
      interaction: { kind: "connect-existing", sourceId },
      selected: { type: SelectionKind.Node, id: sourceId },
    });
  },
  completeLinkTo: (targetId) => {
    const { interaction, workflow } = get();
    if (interaction.kind !== "connect-existing") return;
    if (interaction.sourceId === targetId) return;
    const before = workflow;
    get().connect(interaction.sourceId, targetId);
    if (get().workflow === before) return;
    set({
      interaction: IDLE,
      selected: { type: SelectionKind.Node, id: targetId },
    });
    get().requestFocus(targetId);
  },
  toggleSelectedDash: () => {
    const { selected, workflow, updateEdge } = get();
    if (selected?.type !== SelectionKind.Edge) return;
    const edge = workflow.edges.find((e) => e.id === selected.id);
    if (!edge) return;
    const outs = workflow.edges.filter((e) => e.source === edge.source).length;
    if (outs < 2) return;
    updateEdge(selected.id, { dashed: !edgeIsDotted(workflow.nodes, workflow.edges, edge) });
  },
  focusPathLabel: () => {
    focusNamedField("path-condition-field");
  },
  focusDataLabel: () => {
    focusNamedField("data-label-field");
  },

  beginRemovePick: (hostId) => {
    if (get().present) return;
    const { workflow } = get();
    if (!workflow.nodes.some((n) => n.id === hostId)) return;
    const candidates = removalCandidateIds(workflow.nodes, workflow.edges, hostId);
    const candidateId = defaultRemovalCandidateId(workflow.nodes, workflow.edges, hostId);
    if (!candidates.length || !candidateId) {
      get().setNotice(MSG.rootRemoval);
      set({ interaction: IDLE, selected: { type: SelectionKind.Node, id: hostId } });
      return;
    }
    set({
      interaction: { kind: "remove-pick", hostId, candidateId },
      selected: { type: SelectionKind.Node, id: hostId },
      manageActorsOpen: false,
      manageActorId: null,
    });
  },
  cycleRemoveCandidate: (dir) => {
    const { interaction, workflow } = get();
    if (interaction.kind !== "remove-pick") return;
    const candidates = removalCandidateIds(workflow.nodes, workflow.edges, interaction.hostId);
    if (!candidates.length) {
      set({ interaction: IDLE });
      return;
    }
    const current = Math.max(0, candidates.indexOf(interaction.candidateId));
    const index = (current + dir + candidates.length) % candidates.length;
    set({
      interaction: { ...interaction, candidateId: candidates[index]! },
    });
  },
  setRemoveCandidate: (candidateId) => {
    const { interaction, workflow } = get();
    if (interaction.kind !== "remove-pick") return;
    const candidates = removalCandidateIds(workflow.nodes, workflow.edges, interaction.hostId);
    if (!candidates.includes(candidateId)) return;
    set({ interaction: { ...interaction, candidateId } });
  },
  confirmRemove: () => {
    const { interaction, workflow } = get();
    if (interaction.kind === "remove-preview") {
      applyPlannedRemoval(get, set, interaction.plan, interaction.plan.pairings);
      return;
    }
    if (interaction.kind !== "remove-pick") return;
    const planned = planNodeRemoval(workflow, interaction.candidateId);
    if (!planned.ok) {
      get().setNotice(planned.message);
      return;
    }
    if (planned.value.mode === "preview") {
      set({ interaction: { kind: "remove-preview", plan: planned.value } });
      return;
    }
    applyPlannedRemoval(get, set, planned.value, planned.value.pairings);
  },
  setPreviewSuccessorPred: (successorId, predecessorId) => {
    const { interaction, workflow } = get();
    if (interaction.kind !== "remove-preview") return;
    const pairing = pairingBetween(
      workflow,
      interaction.plan.nodeId,
      predecessorId,
      successorId,
    );
    if (!pairing) return;
    const pairings = [
      ...interaction.plan.pairings.filter((p) => p.successorId !== successorId),
      pairing,
    ];
    set({
      interaction: {
        kind: "remove-preview",
        plan: { ...interaction.plan, pairings },
      },
    });
  },
  useNearestPreviewPairings: () => {
    const { interaction, workflow } = get();
    if (interaction.kind !== "remove-preview") return;
    const { incoming, outgoing } = removalNeighborhood(workflow, interaction.plan.nodeId);
    set({
      interaction: {
        kind: "remove-preview",
        plan: {
          ...interaction.plan,
          pairings: nearestPairings(workflow.nodes, workflow.edges, incoming, outgoing),
        },
      },
    });
  },
  useFanPreviewPairings: () => {
    const { interaction, workflow } = get();
    if (interaction.kind !== "remove-preview") return;
    const { incoming, outgoing } = removalNeighborhood(workflow, interaction.plan.nodeId);
    set({
      interaction: {
        kind: "remove-preview",
        plan: {
          ...interaction.plan,
          pairings: fanPairings(workflow.nodes, workflow.edges, incoming, outgoing),
        },
      },
    });
  },

  requestNew: () => {
    if (get().recovery) return;
    if (isEmptyBoard(get().workflow)) return;
    set({ pendingReplace: { kind: "new" }, importError: null });
  },
  requestDemo: (demoId) => {
    if (get().recovery) return;
    set({ pendingReplace: { kind: "demo", demoId }, importError: null });
  },
  cancelReplace: () => set({ pendingReplace: null }),
  confirmReplaceDiscard: () => {
    const pending = get().pendingReplace;
    if (!pending) return;
    get().loadDoc(documentForPending(pending));
  },
  confirmReplaceSaveCopy: () => {
    const pending = get().pendingReplace;
    if (!pending) return;
    downloadWorkflowCopy(get().workflow);
    get().loadDoc(documentForPending(pending));
  },
  loadDoc: (doc) => {
    get().replaceDoc(doc);
  },
  importRaw: (raw) => {
    const parsed = parseDocument(raw);
    if (!parsed.ok) {
      set({ importError: parsed.message, pendingReplace: null });
      return parsed;
    }
    if (get().recovery) return parsed;
    set({ pendingReplace: { kind: "import", doc: parsed.doc }, importError: null });
    return parsed;
  },
  clearImportError: () => set({ importError: null }),
  resetDemo: () => get().loadDoc(oakParkInvoice()),
  requestFocus: (id) => set({ focusId: id }),
  consumeFocus: (id) => {
    if (get().focusId === id) set({ focusId: null });
  },
  clearRecoveryHold: () => {
    const persistStatus = writeWorkflow(get().workflow);
    set({ recovery: null, persistStatus });
  },
  downloadHeldRecovery: () => {
    const recovery = get().recovery;
    if (!recovery) return;
    downloadRecoveryCopy(recovery.raw);
  },
  startFresh: () => {
    if (!get().recovery) return;
    const placed = room(freshBoard());
    const persistStatus = writeWorkflow(placed);
    set({
      ...replaceHistory(placed),
      recovery: null,
      persistStatus,
      selected: null,
      interaction: IDLE,
      departing: null,
      notice: null,
      pendingReplace: null,
      importError: null,
      lastHumanId: null,
      manageActorsOpen: false,
      manageActorId: null,
      view: ViewMode.Before,
    });
  },
}));

function applyPlannedRemoval(
  get: () => {
    workflow: WorkflowDoc;
    actorFor: (stepId: string) => ActorDto | undefined;
    commit: (next: WorkflowDoc) => void;
    setNotice: (message: string | null) => void;
  },
  set: (partial: {
    interaction: Interaction;
    selected: Selection;
    departing: DepartingTile | null;
    notice: string | null;
    noticeId?: number;
  }) => void,
  plan: RemovalPlan,
  pairings: RemovalPairing[],
) {
  const { workflow } = get();
  const node = workflow.nodes.find((n) => n.id === plan.nodeId);
  const actor = node && isStepNode(node) ? get().actorFor(node.id) : undefined;
  const { predecessorIds, successorIds } = removalNeighborhood(workflow, plan.nodeId);
  if (successorIds.length) {
    const checked = validatePairings(pairings, predecessorIds, successorIds);
    if (!checked.ok) {
      get().setNotice(checked.message);
      return;
    }
  }
  const applied = applyNodeRemoval(workflow, plan, pairings);
  if (!applied.ok) {
    get().setNotice(applied.message);
    return;
  }
  const before = get().workflow;
  get().commit(applied.value);
  if (get().workflow === before) return;
  const overlay = plan.overlayEffects.notices[0] ?? null;
  const reduced = prefersReducedMotion();
  set({
    interaction: IDLE,
    selected: null,
    departing: reduced || !node ? null : { node, actor },
    notice: overlay,
  });
}
