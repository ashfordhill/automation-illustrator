/**
 * Zustand board state: workflow document, undo stack, interaction, theme.
 * Canvas (board/Board.tsx) and app shell (Toolbar, DetailsPanel, CanvasHelper)
 * all read/write through here. persistence.ts handles localStorage JSON.
 *
 * commit / undo / redo — history.ts (500; replaceDoc is a document boundary)
 * addStep / addField — first Tile on an empty board (WG-01); later tiles spawn from +
 * spawnBranch / plus-pull / path-pull — stretchy + tab (left or right) and Path pull
 * removeTarget / confirmRemove — selected-tile X / Delete; M:N pairing preview
 * insertOnPath / insertOnBundle — drop a tile onto a Path or a merge/split trunk
 * toggleSelectedDash — selected Path solid / dotted
 * removePath / openPathMenu — redundant Path Delete (reachability)
 * requestNew / requestDemo / importRaw / exportWorkflow — replacement gate and YAML Export
 * startFresh / downloadHeldRecovery — corrupt-storage recovery (SH-10)
 * setSoundEnabled — persisted Web Audio cues (SH-03, SH-04; on by default)
 * setRightClickDelete — persisted Tile right-click remove (off by default)
 * setSimplify — persisted View (word-web) pref (off by default)
 * setBoardOrientation — persisted Horizontal / Vertical board (not undo)
 * setInspectorCollapsed — persisted right-inspector fold (P-05)
 * setPresent — saves and restores view + selection (P-07)
 * presentExpand — Present split vs one fullscreen lane (P-07)
 */
import { create } from "zustand";
import { clearDockPosition, snapToGrid, vacantSpot, withDisplayedPositions } from "../board/layout/tileMetrics";
import { type DemoId, workflowForDemo } from "../demos/catalog";
import { freshBoard, isEmptyBoard, oakParkInvoice } from "../demos/oakParkInvoice";
import {
  DEFAULT_KEYMAP,
  loadKeymap,
  saveKeymap,
  type KeyAction,
  type Keymap,
} from "../keyboard/bindings";
import {
  defaultActors,
  defaultHumanId,
  insertActor,
  makeHuman,
  makeRobot,
  removeActor as removeActorFromDoc,
  whoForChildStep,
  whoForPredecessorStep,
} from "../workflow/actors";
import {
  AssignmentLane,
  ColorScheme,
  IdPrefix,
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
  createRootNode,
  fanPairings,
  insertNodeOnBundle,
  insertNodeOnPath,
  nearestPairings,
  nextTileAfterRemoval,
  pairingBetween,
  planNodeRemoval,
  removalNeighborhood,
  removePath as removePathFromDoc,
  validatePairings,
  type BranchSide,
  type RemovalPairing,
  type RemovalPlan,
} from "../workflow/commands";
import {
  applyDashForSplit,
  edgeIsDotted,
  nextIncomingIndex,
  nextPortIndex,
  validateWorkflow,
} from "../workflow/graph";
import { nid } from "../workflow/ids";
import {
  isHuman,
  isStepNode,
  STEP_KIND_META,
  titleForStepKindChange,
  laneAssignments,
  withLaneAssignments,
  type ActorDto,
  type ColorScheme as ColorSchemeT,
  type NodeDto,
  type PositionMap,
  type RobotKind as RobotKindT,
  type StepKind as StepKindT,
  type StepNodeDto,
  type ViewMode as ViewModeT,
  type WorkflowDoc,
  overlayLoadNotice,
  normalizeAfterOverlay,
} from "../workflow/types";
import {
  commitStructural,
  commitText,
  redoHistory,
  replaceHistory,
  undoHistory,
  type HistoryKind,
} from "./history";
import {
  IDLE,
  insertHoversEqual,
  type DepartingTile,
  type InsertHover,
  type Interaction,
  type TilePieKind,
  type TileTextField,
} from "./interaction";
import {
  downloadRecoveryCopy,
  downloadWorkflowCopy,
  hydratePersistedWorkflow,
  loadBoardOrientation,
  loadInspectorCollapsed,
  loadRightClickDelete,
  loadSimplifyPrefs,
  loadSound,
  loadTheme,
  saveBoardOrientation,
  saveInspectorCollapsed,
  saveRightClickDelete,
  saveSimplifyPrefs,
  saveSound,
  saveTheme,
  writeWorkflow,
  type PersistStatus,
  type RecoveryState,
} from "./persistence";
import { playCue, playCueWhen } from "../app/sound/cues";
import type { BoardOrientation } from "../board/flow/flowProfile";
import {
  applySimplifyPatch,
  DEFAULT_SIMPLIFY_PREFS,
  type SimplifyPrefs,
} from "../board/simplify/prefs";
import { parseDocument, type ParseResult } from "../workflow/migrate";
import { findEdge, findNode } from "../workflow/selectors";

/** Right-hand inspector target, or null when nothing is selected. */
export type Selection =
  | { type: typeof SelectionKind.Node; id: string }
  | { type: typeof SelectionKind.Edge; id: string }
  | { type: typeof SelectionKind.Actor; id: string }
  | null;

/** Idle inspector is the Actors roster. Deselecting a Step parks that Who on the roster. */
function manageFieldsOnSelect(
  selected: Selection,
  prev: Selection,
  workflow: WorkflowDoc,
  lane: AssignmentLane,
  currentActorId: string | null,
) {
  if (selected) {
    return {
      manageActorsOpen: false as const,
      manageActorsSource: null,
      manageActorsDeleteMode: false,
      manageActorId: null,
    };
  }
  let manageActorId = currentActorId;
  if (prev?.type === SelectionKind.Node) {
    const node = findNode(workflow, prev.id);
    if (node && isStepNode(node)) {
      const whoId = laneAssignments(workflow, lane)[prev.id];
      if (whoId && workflow.actors.some((a) => a.id === whoId)) manageActorId = whoId;
    }
  }
  return {
    manageActorsOpen: false as const,
    manageActorsSource: null,
    manageActorsDeleteMode: false,
    manageActorId,
  };
}

/** Board-local pan/zoom, keyed by lane and excluded from the document (BA-05). */
export type LaneViewport = { x: number; y: number; zoom: number };

/** After follows Before: copy the preferred camera onto both lanes (BA-05). */
function withSharedCamera(
  laneViewports: Partial<Record<AssignmentLane, LaneViewport>>,
  prefer?: AssignmentLane,
): Partial<Record<AssignmentLane, LaneViewport>> {
  const seed =
    (prefer ? laneViewports[prefer] : undefined) ??
    laneViewports[AssignmentLane.Before] ??
    laneViewports[AssignmentLane.After];
  if (!seed) return laneViewports;
  return {
    ...laneViewports,
    [AssignmentLane.Before]: seed,
    [AssignmentLane.After]: seed,
  };
}

/** Pending New / Demo / Import replacement (SH-06). */
export type PendingReplace =
  | { kind: "new" }
  | { kind: "demo"; demoId: DemoId }
  | { kind: "import"; doc: WorkflowDoc; unfolded?: boolean; droppedAfterOnly?: boolean };

function documentForPending(pending: PendingReplace): WorkflowDoc {
  if (pending.kind === "new") return freshBoard();
  if (pending.kind === "demo") return workflowForDemo(pending.demoId);
  return pending.doc;
}

function importUnfoldOpts(pending: PendingReplace): { unfoldedNotice?: boolean; droppedAfterOnly?: boolean } | undefined {
  if (pending.kind !== "import") return undefined;
  if (!pending.unfolded && !pending.droppedAfterOnly) return undefined;
  return { unfoldedNotice: pending.unfolded, droppedAfterOnly: pending.droppedAfterOnly };
}

/** Demo or last saved board. Label spacing is derived per lane (CX-05), not saved. */
function loadStart(): {
  workflow: WorkflowDoc;
  persistStatus: PersistStatus;
  recovery: RecoveryState | null;
  overlayNotice: string | null;
} {
  const boot = hydratePersistedWorkflow(oakParkInvoice);
  const overlayNotice = overlayLoadNotice(Boolean(boot.unfolded), Boolean(boot.droppedAfterOnly));
  if (boot.recovery || boot.persistStatus === "unavailable") {
    return {
      workflow: boot.workflow,
      persistStatus: boot.persistStatus,
      recovery: boot.recovery,
      overlayNotice,
    };
  }
  return {
    workflow: boot.workflow,
    persistStatus: writeWorkflow(boot.workflow),
    recovery: null,
    overlayNotice,
  };
}

function persistIfAllowed(doc: WorkflowDoc, recovery: RecoveryState | null): PersistStatus {
  if (recovery) return "dirty";
  return writeWorkflow(doc);
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
  focusedLane: AssignmentLane;
  laneViewports: Partial<Record<AssignmentLane, LaneViewport>>;
  canvasEpoch: number;
  present: boolean;
  /** null = Compare-style split; otherwise that lane fills Present. */
  presentExpand: AssignmentLane | null;
  presentResume: { view: ViewModeT; selected: Selection } | null;
  selected: Selection;
  soundEnabled: boolean;
  rightClickDelete: boolean;
  simplify: SimplifyPrefs;
  boardOrientation: BoardOrientation;
  inspectorCollapsed: boolean;
  keymap: Keymap;
  helpOpen: boolean;
  capturing: KeyAction | null;
  lastHumanId: string | null;
  manageActorsOpen: boolean;
  manageActorsSource: "empty" | "step" | null;
  manageActorId: string | null;
  manageActorsDeleteMode: boolean;
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
  replaceDoc: (next: WorkflowDoc, opts?: { unfoldedNotice?: boolean; droppedAfterOnly?: boolean }) => void;
  undo: () => void;
  redo: () => void;
  setView: (v: ViewModeT) => void;
  setFocusedLane: (lane: AssignmentLane) => void;
  setLaneViewport: (lane: AssignmentLane, viewport: LaneViewport) => void;
  /** Displayed Node positions per lane, published by the Board after each ELK pass (derived, never saved). */
  laneLayoutPositions: Partial<Record<AssignmentLane, PositionMap>>;
  setLaneLayoutPositions: (lane: AssignmentLane, positions: PositionMap) => void;
  /** Displayed positions for the lane being edited, or undefined before the first layout. */
  activePositions: () => PositionMap | undefined;
  canvasEditable: () => boolean;
  setPresent: (p: boolean) => void;
  setPresentExpand: (lane: AssignmentLane | null) => void;
  togglePresentLane: () => void;
  setSoundEnabled: (on: boolean) => void;
  setRightClickDelete: (on: boolean) => void;
  setSimplify: (patch: Partial<SimplifyPrefs>) => void;
  setBoardOrientation: (orientation: BoardOrientation) => void;
  setInspectorCollapsed: (collapsed: boolean) => void;
  select: (s: Selection) => void;
  setHelp: (v: boolean) => void;
  setCapturing: (a: KeyAction | null) => void;
  setKey: (action: KeyAction, key: string) => void;
  resetKeymap: () => void;
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
  setManageActorsDeleteMode: (on: boolean) => void;
  updateNode: (id: string, patch: Partial<NodeDto>) => void;
  updateEdge: (id: string, patch: { label?: string; dashed?: boolean }) => void;
  updateActor: (id: string, patch: Partial<ActorDto>) => void;
  assignActor: (stepId: string, actorId: string) => void;
  connect: (source: string, target: string, label?: string) => void;
  deleteSelection: () => void;
  openPathMenu: (edgeId: string, x: number, y: number) => void;
  removePath: (edgeId: string) => void;
  closeBoardModes: () => void;
  spawnBranch: (
    sourceId: string,
    type: typeof WorkflowNodeKind.Step | typeof WorkflowNodeKind.DataField,
    side?: BranchSide,
  ) => string;
  beginPlusPull: (sourceId: string) => void;
  beginPathPull: (sourceId: string, inbound?: boolean) => void;
  setPathPullHover: (targetId: string | null) => void;
  completePathPull: (targetId: string) => void;
  beginTileDrag: (nodeId: string) => void;
  setTileDragHover: (hover: InsertHover | null) => void;
  insertOnPath: (nodeId: string, edgeId: string) => void;
  insertOnBundle: (nodeId: string, spec: { role: "merge" | "split"; hostId: string }) => void;
  beginLinkFrom: (sourceId: string) => void;
  completeLinkTo: (targetId: string) => void;
  toggleSelectedDash: () => void;
  focusPathLabel: () => void;
  focusDataLabel: () => void;
  beginTileTextEdit: (nodeId: string, field: TileTextField) => void;
  beginTilePie: (nodeId: string, pie: TilePieKind, x: number, y: number) => void;
  removeTarget: (nodeId: string) => void;
  beginRemovePick: (hostId: string) => void;
  confirmRemove: () => void;
  setPreviewSuccessorPred: (successorId: string, predecessorId: string) => void;
  useNearestPreviewPairings: () => void;
  useFanPreviewPairings: () => void;
  requestNew: () => void;
  requestDemo: (demoId: DemoId) => void;
  cancelReplace: () => void;
  confirmReplaceDiscard: () => void;
  confirmReplaceSaveCopy: () => void;
  loadDoc: (doc: WorkflowDoc, opts?: { unfoldedNotice?: boolean; droppedAfterOnly?: boolean }) => void;
  exportWorkflow: () => void;
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
  focusedLane: AssignmentLane.Before,
  laneViewports: {},
  canvasEpoch: 0,
  present: false,
  presentExpand: null,
  presentResume: null,
  selected: null,
  soundEnabled: loadSound(),
  rightClickDelete: loadRightClickDelete(),
  simplify: loadSimplifyPrefs(),
  boardOrientation: loadBoardOrientation(),
  inspectorCollapsed: loadInspectorCollapsed(),
  keymap: loadKeymap(),
  helpOpen: false,
  capturing: null,
  lastHumanId: null,
  manageActorsOpen: false, manageActorsSource: null,
  manageActorId: null,
  manageActorsDeleteMode: false,
  focusId: null,
  interaction: IDLE,
  departing: null,
  colorScheme: loadTheme(),
  persistStatus: started.persistStatus,
  recovery: started.recovery,
  pendingReplace: null,
  importError: null,
  notice: started.overlayNotice,
  noticeId: 0,

  /** Snapshot current board onto the undo stack, persist unless recovery holds the raw key. */
  commit: (next, kind = "structural") => {
    const violations = validateWorkflow(next);
    if (violations.length) {
      get().setNotice(violations[0]!.message);
      return;
    }
    const { workflow, past, recovery } = get();
    const persistStatus = persistIfAllowed(next, recovery);
    const stacks =
      kind === "text"
        ? commitText(workflow, past, next)
        : commitStructural(workflow, past, next);
    set({ ...stacks, persistStatus });
  },
  replaceDoc: (next, opts) => {
    const normalized = normalizeAfterOverlay(next);
    const doc = normalized.doc;
    const violations = validateWorkflow(doc);
    if (violations.length) {
      get().setNotice(violations[0]!.message);
      return;
    }
    const persistStatus = persistIfAllowed(doc, get().recovery);
    const notice = overlayLoadNotice(
      normalized.unfolded || Boolean(opts?.unfoldedNotice),
      normalized.droppedAfterOnly || Boolean(opts?.droppedAfterOnly),
    );
    const showNotice = Boolean(notice);
    set({
      ...replaceHistory(doc),
      persistStatus,
      selected: null,
      interaction: IDLE,
      departing: null,
      notice,
      pendingReplace: null,
      importError: null,
      lastHumanId: null,
      manageActorsOpen: false, manageActorsSource: null,
      manageActorsDeleteMode: false,
      manageActorId: null,
      view: ViewMode.Before,
      focusedLane: AssignmentLane.Before,
      laneViewports: {},
      laneLayoutPositions: {},
      canvasEpoch: get().canvasEpoch + 1,
    });
    if (showNotice) {
      set({ noticeId: get().noticeId + 1 });
    }
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
  setView: (view) => {
    const focusedLane =
      view === ViewMode.After
        ? AssignmentLane.After
        : view === ViewMode.Before
          ? AssignmentLane.Before
          : get().focusedLane;
    const prefer = view === ViewMode.Both ? focusedLane : AssignmentLane.Before;
    const laneViewports = withSharedCamera(get().laneViewports, prefer);
    set({ view, interaction: IDLE, focusedLane, laneViewports });
  },
  setFocusedLane: (focusedLane) => {
    if (get().focusedLane === focusedLane) return;
    set({ focusedLane });
  },
  setLaneViewport: (lane, viewport) => {
    const prev = get().laneViewports[lane];
    if (prev && prev.x === viewport.x && prev.y === viewport.y && prev.zoom === viewport.zoom) {
      return;
    }
    set({ laneViewports: { ...get().laneViewports, [lane]: viewport } });
  },
  laneLayoutPositions: {},
  setLaneLayoutPositions: (lane, positions) => {
    if (get().laneLayoutPositions[lane] === positions) return;
    set({ laneLayoutPositions: { ...get().laneLayoutPositions, [lane]: positions } });
  },
  activePositions: () => get().laneLayoutPositions[get().assignmentLane()],
  canvasEditable: () => !get().present && get().view !== ViewMode.Both,
  setPresent: (present) => {
    const s = get();
    if (present) {
      if (s.present) return;
      const laneViewports = withSharedCamera(s.laneViewports, AssignmentLane.Before);
      set({
        present: true,
        presentExpand: null,
        presentResume: { view: s.view, selected: s.selected },
        selected: null,
        helpOpen: false,
        interaction: IDLE,
        departing: null,
        manageActorsOpen: false, manageActorsSource: null,
      manageActorsDeleteMode: false,
        manageActorId: null,
        laneViewports,
      });
      return;
    }
    const resume = s.presentResume;
    set({
      present: false,
      presentExpand: null,
      view: resume?.view ?? s.view,
      selected: resume?.selected ?? s.selected,
      presentResume: null,
      interaction: IDLE,
      departing: null,
    });
  },
  setPresentExpand: (lane) => {
    if (!get().present) return;
    if (get().presentExpand === lane) return;
    set({
      presentExpand: lane,
      focusedLane: lane ?? get().focusedLane,
    });
  },
  togglePresentLane: () => {
    if (!get().present) return;
    const next =
      get().presentExpand === AssignmentLane.Before
        ? AssignmentLane.After
        : AssignmentLane.Before;
    set({ presentExpand: next, focusedLane: next });
  },
  setSoundEnabled: (soundEnabled) => {
    saveSound(soundEnabled);
    set({ soundEnabled });
    if (soundEnabled) playCue("tick");
  },
  setRightClickDelete: (rightClickDelete) => {
    saveRightClickDelete(rightClickDelete);
    set({ rightClickDelete });
  },
  setSimplify: (patch) => {
    const simplify = applySimplifyPatch(get().simplify ?? DEFAULT_SIMPLIFY_PREFS, patch);
    saveSimplifyPrefs(simplify);
    set({ simplify });
  },
  setBoardOrientation: (boardOrientation) => {
    if (get().boardOrientation === boardOrientation) return;
    saveBoardOrientation(boardOrientation);
    set({
      boardOrientation,
      laneLayoutPositions: {},
      laneViewports: {},
    });
  },
  setInspectorCollapsed: (inspectorCollapsed) => {
    saveInspectorCollapsed(inspectorCollapsed);
    if (inspectorCollapsed) {
      const ae = document.activeElement;
      if (ae instanceof HTMLElement && ae.closest(".details-rail-body")) ae.blur();
    }
    set({ inspectorCollapsed });
  },
  select: (selected) => {
    const cur = get();
    const manage = manageFieldsOnSelect(
      selected,
      cur.selected,
      cur.workflow,
      cur.assignmentLane(),
      cur.manageActorId,
    );
    const { interaction } = cur;
    if (
      interaction.kind === "path-label-edit" &&
      (selected?.type !== SelectionKind.Edge || selected.id !== interaction.edgeId)
    ) {
      set({
        selected,
        ...manage,
        interaction: IDLE,
      });
      return;
    }
    if (
      (interaction.kind === "tile-text-edit" || interaction.kind === "tile-pie") &&
      (selected?.type !== SelectionKind.Node || selected.id !== interaction.nodeId)
    ) {
      set({
        selected,
        ...manage,
        interaction: IDLE,
      });
      return;
    }
    set({
      selected,
      ...manage,
    });
  },
  setHelp: (helpOpen) => {
    set({ helpOpen, capturing: helpOpen ? get().capturing : null });
    if (!helpOpen) {
      window.setTimeout(() => {
        document.querySelector<HTMLElement>('header [aria-label="Menu"]')?.focus();
      }, 0);
    }
  },
  setCapturing: (capturing) => set({ capturing }),
  setKey: (action, key) => {
    const keymap = { ...get().keymap };
    if (key) {
      for (const other of Object.keys(keymap) as KeyAction[]) {
        if (other !== action && keymap[other] === key) keymap[other] = "";
      }
    }
    keymap[action] = key;
    saveKeymap(keymap);
    set({ keymap, capturing: null });
  },
  resetKeymap: () => {
    const keymap = { ...DEFAULT_KEYMAP };
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
    playCueWhen(get().soundEnabled, "buzz");
    set({ notice, noticeId: get().noticeId + 1 });
  },
  clearDeparting: () => set({ departing: null }),
  /** Who map for inspector and assignment: After view uses After; Both uses the focused lane. */
  assignmentLane: () => {
    const { view, focusedLane } = get();
    if (view === ViewMode.After) return AssignmentLane.After;
    if (view === ViewMode.Both) return focusedLane;
    return AssignmentLane.Before;
  },
  actorFor: (stepId, lane) => {
    const { workflow, assignmentLane } = get();
    const L = lane ?? assignmentLane();
    const id = laneAssignments(workflow, L)[stepId];
    return workflow.actors.find((a) => a.id === id);
  },

  addStep: (position, kind = StepKind.Other) => {
    if (!get().canvasEditable()) return "";
    const { workflow, lastHumanId } = get();
    if (workflow.nodes.length) {
      if (!position && workflow.nodes.some(isStepNode)) return "";
      get().setNotice(MSG.notEmpty);
      return "";
    }
    const id = nid(IdPrefix.Step);
    const actors = workflow.actors.length ? workflow.actors : defaultActors();
    const hid = defaultHumanId(actors, lastHumanId);
    const pos = position ?? vacantSpot(workflow.nodes, WorkflowNodeKind.Step, get().boardOrientation);
    const node: StepNodeDto = {
      id,
      type: WorkflowNodeKind.Step,
      position: { x: snapToGrid(pos.x), y: snapToGrid(pos.y) },
      stepKind: kind,
      title: STEP_KIND_META[kind].defaultTitle,
      detail: "",
      split: SplitKind.Exclusive,
    };
    const result = createRootNode(
      { ...workflow, actors },
      node,
      hid ? { beforeId: hid, afterId: hid } : undefined,
    );
    if (!result.ok) {
      get().setNotice(result.message);
      return "";
    }
    get().commit(result.value);
    playCueWhen(get().soundEnabled, "blip");
    set({
      selected: { type: SelectionKind.Node, id },
      lastHumanId: hid ?? lastHumanId,
      interaction: IDLE,
    });
    return id;
  },
  addField: (position) => {
    if (!get().canvasEditable()) return "";
    const { workflow } = get();
    if (workflow.nodes.length) {
      get().setNotice(MSG.notEmpty);
      return "";
    }
    const id = nid(IdPrefix.DataField);
    const actors = workflow.actors.length ? workflow.actors : defaultActors();
    const pos = position ?? vacantSpot(workflow.nodes, WorkflowNodeKind.DataField, get().boardOrientation);
    const result = createRootNode(
      { ...workflow, actors },
      {
        id,
        type: WorkflowNodeKind.DataField,
        position: { x: snapToGrid(pos.x), y: snapToGrid(pos.y) },
        label: "Data",
      },
    );
    if (!result.ok) {
      get().setNotice(result.message);
      return "";
    }
    get().commit(result.value);
    playCueWhen(get().soundEnabled, "blip");
    set({
      selected: { type: SelectionKind.Node, id },
      interaction: IDLE,
    });
    return id;
  },
  addHuman: (name) => {
    if (get().present || get().view === ViewMode.Both) return "";
    const actor = makeHuman(name);
    const { workflow, commit } = get();
    commit({ ...workflow, actors: insertActor(workflow.actors, actor) });
    set({ manageActorId: actor.id });
    return actor.id;
  },
  addRobot: (kind = RobotKind.Script) => {
    if (get().present || get().view === ViewMode.Both) return "";
    const actor = makeRobot("Robot", kind);
    const { workflow, commit } = get();
    commit({ ...workflow, actors: insertActor(workflow.actors, actor) });
    set({ manageActorId: actor.id });
    return actor.id;
  },
  removeActor: (actorId) => {
    if (get().present || get().view === ViewMode.Both) return false;
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
    if (get().inspectorCollapsed) get().setInspectorCollapsed(false);
    const { workflow, selected, manageActorId } = get();
    const stepSelected = (() => {
      if (selected?.type !== SelectionKind.Node) return false;
      const node = findNode(workflow, selected.id);
      return Boolean(node && isStepNode(node));
    })();
    const fromTile = (() => {
      if (!stepSelected || selected?.type !== SelectionKind.Node) return null;
      const whoId = laneAssignments(workflow, get().assignmentLane())[selected.id];
      return whoId && workflow.actors.some((a) => a.id === whoId) ? whoId : null;
    })();
    const nextId =
      fromTile ??
      (manageActorId && workflow.actors.some((a) => a.id === manageActorId)
        ? manageActorId
        : null) ??
      workflow.actors[0]?.id ??
      null;
    set({
      selected: null,
      manageActorsOpen: true,
      manageActorId: nextId,
      manageActorsDeleteMode: false,
      manageActorsSource: stepSelected ? "step" : "empty",
    });
  },
  closeManageActors: (opts) => {
    set({ manageActorsOpen: false, manageActorsSource: null, manageActorId: null, manageActorsDeleteMode: false });
    if (opts?.restoreFocus === false) return;
    queueMicrotask(() => {
      (
        document.getElementById("manage-actors-btn") ??
        document.querySelector<HTMLElement>('header [aria-label="Menu"]')
      )?.focus();
    });
  },
  setManageActorId: (manageActorId) => set({ manageActorId }),
  setManageActorsDeleteMode: (manageActorsDeleteMode) => set({ manageActorsDeleteMode }),
  updateNode: (id, patch) => {
    if (get().present || get().view === ViewMode.Both) return;
    const { workflow, commit } = get();
    const inBase = workflow.nodes.some((n) => n.id === id);
    const inExtra = workflow.after.extraNodes.some((n) => n.id === id);
    if (!inBase && !inExtra) return;
    const current = inBase
      ? workflow.nodes.find((n) => n.id === id)
      : workflow.after.extraNodes.find((n) => n.id === id);
    let nextPatch = patch;
    if (current && isStepNode(current) && !("title" in nextPatch)) {
      const nextKind = (nextPatch as Partial<StepNodeDto>).stepKind;
      if (nextKind) {
        const title = titleForStepKindChange(nextKind, current.stepKind, current.title);
        if (title !== current.title) nextPatch = { ...nextPatch, title };
      }
    }
    let nodes = workflow.nodes;
    let extraNodes = workflow.after.extraNodes;
    if (inBase) {
      nodes = nodes.map((n) => (n.id === id ? ({ ...n, ...nextPatch } as NodeDto) : n));
    } else {
      extraNodes = extraNodes.map((n) =>
        n.id === id ? ({ ...n, ...nextPatch } as typeof n) : n,
      );
    }
    let edges = workflow.edges;
    let extraEdges = workflow.after.extraEdges;
    if ("split" in patch) {
      const extraIds = new Set(extraEdges.map((e) => e.id));
      const combined = applyDashForSplit([...nodes, ...extraNodes], [...edges, ...extraEdges], id);
      edges = combined.filter((e) => !extraIds.has(e.id));
      extraEdges = combined.filter((e) => extraIds.has(e.id));
    }
    const textOnly =
      !("split" in patch) && !("stepKind" in patch) && !("position" in patch);
    commit(
      {
        ...workflow,
        nodes,
        edges,
        after: { ...workflow.after, extraNodes, extraEdges },
      },
      textOnly ? "text" : "structural",
    );
  },
  updateEdge: (id, patch) => {
    if (get().present || get().view === ViewMode.Both) return;
    const { workflow, commit } = get();
    const kind: HistoryKind = patch.dashed !== undefined ? "structural" : "text";
    if (workflow.edges.some((e) => e.id === id)) {
      commit(
        {
          ...workflow,
          edges: workflow.edges.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        },
        kind,
      );
      return;
    }
    if (!workflow.after.extraEdges.some((e) => e.id === id)) return;
    commit(
      {
        ...workflow,
        after: {
          ...workflow.after,
          extraEdges: workflow.after.extraEdges.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        },
      },
      kind,
    );
  },
  updateActor: (id, patch) => {
    if (get().present || get().view === ViewMode.Both) return;
    const { workflow, commit } = get();
    const textOnly = !("color" in patch) && !("robotKind" in patch) && !("kind" in patch);
    commit({
      ...workflow,
      actors: workflow.actors.map((a) =>
        a.id === id ? ({ ...a, ...patch } as ActorDto) : a,
      ),
    }, textOnly ? "text" : "structural");
  },
  /** Who is offered in both lanes (NA-03, NA-11). lastHumanId stamps Data-spawned and root Steps. */
  assignActor: (stepId, actorId) => {
    if (get().present || get().view === ViewMode.Both) return;
    const { workflow, commit, assignmentLane } = get();
    const lane = assignmentLane();
    const actor = workflow.actors.find((a) => a.id === actorId);
    if (!actor) return;
    commit(withLaneAssignments(workflow, lane, { ...laneAssignments(workflow, lane), [stepId]: actorId }));
    if (isHuman(actor)) set({ lastHumanId: actorId });
  },
  connect: (source, target, label = "") => {
    if (get().present || get().view === ViewMode.Both) return;
    const { workflow } = get();
    const result = connectNodes(workflow, source, target, { label });
    if (!result.ok) {
      get().setNotice(result.message);
      return;
    }
    get().commit(result.value);
    playCueWhen(get().soundEnabled, "zip");
  },
  deleteSelection: () => {
    if (get().present || get().view === ViewMode.Both) return;
    const { selected, interaction } = get();
    if (interaction.kind === "remove-preview") {
      get().confirmRemove();
      return;
    }
    if (!selected) return;
    if (selected.type === SelectionKind.Node) {
      get().removeTarget(selected.id);
      return;
    }
    if (selected.type === SelectionKind.Edge) {
      get().removePath(selected.id);
      return;
    }
    get().removeActor(selected.id);
  },
  openPathMenu: (edgeId, x, y) => {
    if (!get().canvasEditable()) return;
    const kind = get().interaction.kind;
    if (
      kind === "tile-drag" ||
      kind === "plus-pull" ||
      kind === "path-pull" ||
      kind === "remove-preview" ||
      kind === "path-label-edit" ||
      kind === "tile-text-edit" ||
      kind === "tile-pie"
    ) {
      return;
    }
    if (!findEdge(get().workflow, edgeId)) return;
    set({
      selected: { type: SelectionKind.Edge, id: edgeId },
      interaction: { kind: "path-menu", edgeId, x, y },
    });
  },
  removePath: (edgeId) => {
    if (!get().canvasEditable()) return;
    const result = removePathFromDoc(get().workflow, edgeId);
    if (!result.ok) {
      get().setNotice(result.message);
      return;
    }
    get().commit(result.value);
    playCueWhen(get().soundEnabled, "pop");
    set({ selected: null, interaction: IDLE });
  },

  closeBoardModes: () => set({ interaction: IDLE }),
  beginPlusPull: (sourceId) => {
    if (get().present || get().view === ViewMode.Both) return;
    set({
      interaction: { kind: "plus-pull", sourceId },
      selected: { type: SelectionKind.Node, id: sourceId },
    });
  },
  beginPathPull: (sourceId, inbound = false) => {
    if (get().present || get().view === ViewMode.Both) return;
    set({
      interaction: { kind: "path-pull", sourceId, hoverTargetId: null, inbound },
      selected: { type: SelectionKind.Node, id: sourceId },
    });
  },
  setPathPullHover: (targetId) => {
    const { interaction } = get();
    if (interaction.kind !== "path-pull") return;
    if (interaction.hoverTargetId === targetId) return;
    set({ interaction: { ...interaction, hoverTargetId: targetId } });
  },
  completePathPull: (targetId) => {
    const { interaction } = get();
    if (interaction.kind !== "path-pull") return;
    if (interaction.sourceId === targetId) {
      set({ interaction: IDLE });
      return;
    }
    const before = get().workflow;
    if (interaction.inbound) get().connect(targetId, interaction.sourceId);
    else get().connect(interaction.sourceId, targetId);
    if (get().workflow === before) {
      set({ interaction: IDLE });
      return;
    }
    set({
      interaction: IDLE,
      selected: { type: SelectionKind.Node, id: targetId },
    });
    get().requestFocus(targetId);
  },
  beginTileDrag: (nodeId) => {
    if (get().present || get().view === ViewMode.Both) return;
    set({
      interaction: { kind: "tile-drag", nodeId, hover: null },
      selected: { type: SelectionKind.Node, id: nodeId },
    });
  },
  setTileDragHover: (hover) => {
    const { interaction } = get();
    if (interaction.kind !== "tile-drag") return;
    if (insertHoversEqual(interaction.hover, hover)) return;
    set({ interaction: { ...interaction, hover } });
  },
  insertOnPath: (nodeId, edgeId) => {
    if (get().present || get().view === ViewMode.Both) return;
    const { workflow } = get();
    const result = insertNodeOnPath(workflow, nodeId, edgeId, get().activePositions());
    if (!result.ok) {
      get().setNotice(result.message);
      set({ interaction: IDLE });
      return;
    }
    get().commit(result.value);
    playCueWhen(get().soundEnabled, "blip");
    set({
      interaction: IDLE,
      selected: { type: SelectionKind.Node, id: nodeId },
    });
    get().requestFocus(nodeId);
  },
  insertOnBundle: (nodeId, spec) => {
    if (get().present || get().view === ViewMode.Both) return;
    const { workflow } = get();
    const result = insertNodeOnBundle(workflow, nodeId, spec, get().activePositions());
    if (!result.ok) {
      get().setNotice(result.message);
      set({ interaction: IDLE });
      return;
    }
    get().commit(result.value);
    playCueWhen(get().soundEnabled, "blip");
    set({
      interaction: IDLE,
      selected: { type: SelectionKind.Node, id: nodeId },
    });
    get().requestFocus(nodeId);
  },
  spawnBranch: (sourceId, type, side = "out") => {
    if (get().present || get().view === ViewMode.Both) return "";
    const inbound = side === "in";
    const dock: "out" | "in" = inbound ? "in" : "out";
    const { workflow, lastHumanId } = get();
    const src = workflow.nodes.find((n) => n.id === sourceId);
    if (!src) {
      set({ interaction: IDLE });
      return "";
    }
    const port = inbound
      ? nextIncomingIndex(workflow.edges, sourceId)
      : nextPortIndex(workflow.edges, sourceId);
    const displayed = get().activePositions();
    const srcPlaced = withDisplayedPositions([src], displayed)[0]!;
    const others = withDisplayedPositions(workflow.nodes, displayed);
    const pos = clearDockPosition(srcPlaced, type, port, others, dock, get().boardOrientation);
    if (type === WorkflowNodeKind.DataField) {
      const id = nid(IdPrefix.DataField);
      const result = addConnectedNode(
        workflow,
        sourceId,
        {
          id,
          type: WorkflowNodeKind.DataField,
          position: pos,
          label: "Data",
        },
        { inbound },
      );
      if (!result.ok) {
        get().setNotice(result.message);
        return "";
      }
      get().commit(result.value);
      playCueWhen(get().soundEnabled, "blip");
      set({
        interaction: IDLE,
        selected: { type: SelectionKind.Node, id },
      });
      get().requestFocus(id);
      return id;
    }
    const id = nid(IdPrefix.Step);
    const who = inbound
      ? whoForPredecessorStep(workflow, sourceId, lastHumanId)
      : whoForChildStep(workflow, sourceId, lastHumanId);
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
      { ...who, inbound },
    );
    if (!result.ok) {
      get().setNotice(result.message);
      return "";
    }
    get().commit(result.value);
    playCueWhen(get().soundEnabled, "blip");
    const inherited = workflow.actors.find((a) => a.id === who.beforeId);
    set({
      interaction: IDLE,
      selected: { type: SelectionKind.Node, id },
      ...(inherited && isHuman(inherited) ? { lastHumanId: inherited.id } : {}),
    });
    get().requestFocus(id);
    return id;
  },
  beginLinkFrom: (sourceId) => {
    if (get().present || get().view === ViewMode.Both) return;
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
    if (!get().canvasEditable()) return;
    if (selected?.type !== SelectionKind.Edge) return;
    const edge = findEdge(workflow, selected.id);
    if (!edge) return;
    const graph = { nodes: workflow.nodes, edges: workflow.edges };
    updateEdge(selected.id, { dashed: !edgeIsDotted(graph.nodes, graph.edges, edge) });
  },
  focusPathLabel: () => {
    if (!get().canvasEditable()) return;
    const { selected } = get();
    if (selected?.type !== SelectionKind.Edge) return;
    set({ interaction: { kind: "path-label-edit", edgeId: selected.id } });
  },
  focusDataLabel: () => {
    if (get().inspectorCollapsed) {
      get().setInspectorCollapsed(false);
      window.setTimeout(() => focusNamedField("data-label-field"), 0);
      return;
    }
    focusNamedField("data-label-field");
  },
  beginTileTextEdit: (nodeId, field) => {
    if (!get().canvasEditable()) return;
    const found = findNode(get().workflow, nodeId);
    if (!found || !isStepNode(found)) return;
    set({
      selected: { type: SelectionKind.Node, id: nodeId },
      manageActorsOpen: false, manageActorsSource: null,
      manageActorsDeleteMode: false,
      manageActorId: null,
      interaction: { kind: "tile-text-edit", nodeId, field },
    });
  },
  beginTilePie: (nodeId, pie, x, y) => {
    if (!get().canvasEditable()) return;
    const found = findNode(get().workflow, nodeId);
    if (!found || !isStepNode(found)) return;
    set({
      selected: { type: SelectionKind.Node, id: nodeId },
      manageActorsOpen: false, manageActorsSource: null,
      manageActorsDeleteMode: false,
      manageActorId: null,
      interaction: { kind: "tile-pie", nodeId, pie, x, y },
    });
  },

  removeTarget: (nodeId) => {
    if (get().present || get().view === ViewMode.Both) return;
    const { workflow } = get();
    set({
      selected: { type: SelectionKind.Node, id: nodeId },
      manageActorsOpen: false, manageActorsSource: null,
      manageActorsDeleteMode: false,
      manageActorId: null,
    });
    const positions = get().activePositions();
    if (!workflow.nodes.some((n) => n.id === nodeId)) return;
    const planned = planNodeRemoval(workflow, nodeId, positions);
    if (!planned.ok) {
      get().setNotice(planned.message);
      set({ interaction: IDLE, selected: { type: SelectionKind.Node, id: nodeId } });
      return;
    }
    if (planned.value.mode === "preview") {
      set({ interaction: { kind: "remove-preview", plan: planned.value } });
      return;
    }
    applyPlannedRemoval(get, set, planned.value, planned.value.pairings);
  },
  beginRemovePick: (hostId) => {
    get().removeTarget(hostId);
  },
  confirmRemove: () => {
    const { interaction } = get();
    if (interaction.kind !== "remove-preview") return;
    applyPlannedRemoval(get, set, interaction.plan, interaction.plan.pairings);
  },
  setPreviewSuccessorPred: (successorId, predecessorId) => {
    const { interaction, workflow } = get();
    if (interaction.kind !== "remove-preview") return;
    const pairing = pairingBetween(
      workflow,
      interaction.plan.nodeId,
      predecessorId,
      successorId,
      get().activePositions(),
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
    const positions = get().activePositions();
    const { incoming, outgoing } = removalNeighborhood(workflow, interaction.plan.nodeId, positions);
    set({
      interaction: {
        kind: "remove-preview",
        plan: {
          ...interaction.plan,
          pairings: nearestPairings(workflow.nodes, workflow.edges, incoming, outgoing, positions),
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
    get().loadDoc(documentForPending(pending), importUnfoldOpts(pending));
  },
  confirmReplaceSaveCopy: () => {
    const pending = get().pendingReplace;
    if (!pending) return;
    downloadWorkflowCopy(get().workflow);
    get().loadDoc(documentForPending(pending), importUnfoldOpts(pending));
  },
  loadDoc: (doc, opts) => {
    get().replaceDoc(doc, opts);
  },
  exportWorkflow: () => {
    downloadWorkflowCopy(get().workflow);
  },
  importRaw: (raw) => {
    const parsed = parseDocument(raw);
    if (!parsed.ok) {
      set({ importError: parsed.message, pendingReplace: null });
      return parsed;
    }
    if (get().recovery) return parsed;
    set({
      pendingReplace: {
        kind: "import",
        doc: parsed.doc,
        unfolded: parsed.unfolded,
        droppedAfterOnly: parsed.droppedAfterOnly,
      },
      importError: null,
    });
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
    const next = freshBoard();
    const persistStatus = writeWorkflow(next);
    set({
      ...replaceHistory(next),
      recovery: null,
      persistStatus,
      selected: null,
      interaction: IDLE,
      departing: null,
      notice: null,
      pendingReplace: null,
      importError: null,
      lastHumanId: null,
      manageActorsOpen: false, manageActorsSource: null,
      manageActorsDeleteMode: false,
      manageActorId: null,
      view: ViewMode.Before,
      focusedLane: AssignmentLane.Before,
      laneViewports: {},
      laneLayoutPositions: {},
      canvasEpoch: get().canvasEpoch + 1,
    });
  },
}));

function applyPlannedRemoval(
  get: () => {
    workflow: WorkflowDoc;
    past: WorkflowDoc[];
    recovery: RecoveryState | null;
    actorFor: (stepId: string) => ActorDto | undefined;
    setNotice: (message: string | null) => void;
    soundEnabled: boolean;
    activePositions: () => PositionMap | undefined;
  },
  set: (partial: Record<string, unknown>) => void,
  plan: RemovalPlan,
  pairings: RemovalPairing[],
) {
  const { workflow } = get();
  const node = workflow.nodes.find((n) => n.id === plan.nodeId);
  const actor = node && isStepNode(node) ? get().actorFor(node.id) : undefined;
  const positions = get().activePositions();
  const { predecessorIds, successorIds } = removalNeighborhood(workflow, plan.nodeId, positions);
  if (successorIds.length && predecessorIds.length) {
    const checked = validatePairings(pairings, predecessorIds, successorIds);
    if (!checked.ok) {
      get().setNotice(checked.message);
      return;
    }
  }
  const applied = applyNodeRemoval(workflow, plan, pairings, positions);
  if (!applied.ok) {
    get().setNotice(applied.message);
    return;
  }
  commitRemovalKeepingNeighbor(get, set, applied.value, predecessorIds, successorIds, {
    node,
    actor,
    notice: plan.overlayEffects.notices[0] ?? null,
  });
}

/** History + parent selection in one set() so RF cannot clear the board between commit and select. */
function commitRemovalKeepingNeighbor(
  get: () => {
    workflow: WorkflowDoc;
    past: WorkflowDoc[];
    recovery: RecoveryState | null;
    soundEnabled: boolean;
  },
  set: (partial: Record<string, unknown>) => void,
  next: WorkflowDoc,
  predecessorIds: string[],
  successorIds: string[],
  departing: { node?: NodeDto; actor: ActorDto | undefined; notice: string | null },
) {
  const { workflow, past, recovery } = get();
  const persistStatus = persistIfAllowed(next, recovery);
  const stacks = commitStructural(workflow, past, next);
  const nextId = nextTileAfterRemoval(next, predecessorIds, successorIds);
  playCueWhen(get().soundEnabled, "pop");
  const reduced = prefersReducedMotion();
  set({
    ...stacks,
    persistStatus,
    interaction: IDLE,
    selected: nextId ? { type: SelectionKind.Node, id: nextId } : null,
    departing: reduced || !departing.node ? null : { node: departing.node, actor: departing.actor },
    notice: departing.notice,
    focusId: nextId,
  });
}
