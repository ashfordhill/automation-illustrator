import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { DemoId } from "../demos/catalog";
import { freshBoard, isEmptyBoard, OAK_PARK_IDS } from "../demos/oakParkInvoice";
import { MAILROOM_IDS, robotMailroom } from "../demos/robotMailroom";
import { AssignmentLane, ColorScheme, StepKind, ViewMode, WorkflowNodeKind } from "../workflow/catalogs";
import { parseDocument } from "../workflow/migrate";
import { isStepNode, laneAssignments, UNFOLD_NOTICE } from "../workflow/types";
import { installFakeSaveDialog, type SavedFile } from "./fakeSaveDialog";
import * as persist from "./persistence";
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
  s.setColorScheme(ColorScheme.Light);
  s.setInspectorCollapsed(false);
  if (s.recovery) s.clearRecoveryHold();
  s.setBoardOrientation("horizontal");
}

beforeEach(() => {
  resetSession();
});

afterEach(() => {
  vi.restoreAllMocks();
  delete (window as unknown as { showSaveFilePicker?: unknown }).showSaveFilePicker;
  useStore.getState().answerSaveName(null);
  resetSession();
});

test("cancel never mutates the current board (SH-06)", () => {
  const before = useStore.getState().workflow;
  useStore.getState().requestNew();
  expect(useStore.getState().pendingReplace).toEqual({ kind: "new" });
  useStore.getState().cancelReplace();
  expect(useStore.getState().pendingReplace).toBeNull();
  expect(useStore.getState().workflow).toBe(before);
  expect(useStore.getState().workflow.nodes.some((n) => n.id === OAK_PARK_IDS.read)).toBe(true);
});

test("Discard New loads an empty roster board and clears history (WG-01, SH-12)", () => {
  useStore.getState().updateNode(OAK_PARK_IDS.review, { title: "typed" });
  expect(useStore.getState().past.length).toBeGreaterThan(0);
  useStore.getState().requestNew();
  useStore.getState().confirmReplaceDiscard();
  expect(isEmptyBoard(useStore.getState().workflow)).toBe(true);
  expect(useStore.getState().workflow.actors).toHaveLength(7);
  expect(useStore.getState().past).toEqual([]);
  expect(useStore.getState().future).toEqual([]);
  expect(useStore.getState().pendingReplace).toBeNull();
});

async function savedDoc(file: SavedFile) {
  const parsed = parseDocument(await file.blob.text());
  if (!parsed.ok) throw new Error(parsed.message);
  return parsed.doc;
}

test("Save copy asks where to save, then replaces (SH-06, SH-13)", async () => {
  const dialog = installFakeSaveDialog();
  const before = useStore.getState().workflow;
  useStore.getState().requestDemo(DemoId.RobotMailroom);
  await useStore.getState().confirmReplaceSaveCopy();
  expect(dialog.suggestions).toEqual(["oak-park-invoice.illustrator"]);
  expect((await savedDoc(dialog.saved[0]!)).nodes.map((n) => n.id)).toEqual(before.nodes.map((n) => n.id));
  expect(useStore.getState().workflow.nodes[0]?.id).toBe(MAILROOM_IDS.open);
  expect(useStore.getState().past).toEqual([]);
});

test("canceling Save copy saves nothing and leaves the board and the gate", async () => {
  const dialog = installFakeSaveDialog();
  dialog.answer(null);
  const before = useStore.getState().workflow;
  useStore.getState().requestDemo(DemoId.RobotMailroom);
  await useStore.getState().confirmReplaceSaveCopy();
  expect(dialog.saved).toEqual([]);
  expect(useStore.getState().workflow).toBe(before);
  expect(useStore.getState().pendingReplace).toEqual({ kind: "demo", demoId: DemoId.RobotMailroom });
});

test("Save as writes the live board without replacing it or adding history", async () => {
  const dialog = installFakeSaveDialog();
  const before = useStore.getState().workflow;
  const past = useStore.getState().past.length;
  expect(await useStore.getState().saveWorkflowAs()).toBe(true);
  expect(dialog.saved.map((f) => f.name)).toEqual(["oak-park-invoice.illustrator"]);
  expect(await savedDoc(dialog.saved[0]!)).toEqual(before);
  expect(useStore.getState().workflow).toBe(before);
  expect(useStore.getState().past.length).toBe(past);
  expect(useStore.getState().pendingReplace).toBeNull();
});

test("a name typed in Save as names the project; keeping the suggestion does not", async () => {
  const dialog = installFakeSaveDialog();
  dialog.answer("Invoice Flow v2.illustrator");
  await useStore.getState().saveWorkflowAs();
  expect(useStore.getState().workflow.name).toBe("Invoice Flow v2");
  expect((await savedDoc(dialog.saved[0]!)).name).toBe("Invoice Flow v2");

  await useStore.getState().saveWorkflowAs();
  expect(dialog.suggestions[1]).toBe("invoice-flow-v2.illustrator");
  expect(useStore.getState().workflow.name).toBe("Invoice Flow v2");

  useStore.getState().undo();
  expect(useStore.getState().workflow.name).toBe("Oak Park Invoice");
});

test("an untitled board saved under a new name is named; Save copy names only the file", async () => {
  const dialog = installFakeSaveDialog();
  useStore.getState().requestNew();
  useStore.getState().confirmReplaceDiscard();
  dialog.answer("untitled.illustrator");
  await useStore.getState().saveWorkflowAs();
  expect(useStore.getState().workflow.name).toBeUndefined();

  dialog.answer("Field visit");
  await useStore.getState().saveWorkflowAs();
  expect(useStore.getState().workflow.name).toBe("Field visit");

  dialog.answer("Snapshot.illustrator");
  useStore.getState().requestDemo(DemoId.RobotMailroom);
  await useStore.getState().confirmReplaceSaveCopy();
  expect((await savedDoc(dialog.saved[2]!)).name).toBe("Snapshot");
  expect(useStore.getState().workflow.nodes[0]?.id).toBe(MAILROOM_IDS.open);
});

test("without a save dialog, Save as asks for a name in the app and downloads it", async () => {
  const download = vi.spyOn(persist, "downloadBlob").mockImplementation(() => undefined);
  const saving = useStore.getState().saveWorkflowAs();
  await vi.waitFor(() => expect(useStore.getState().saveNamePrompt).not.toBeNull());
  expect(useStore.getState().saveNamePrompt).toEqual({
    suggestedName: "oak-park-invoice.illustrator",
    extension: ".illustrator",
  });
  useStore.getState().answerSaveName("Oak Park Copy");
  expect(await saving).toBe(true);
  expect(useStore.getState().saveNamePrompt).toBeNull();
  expect(download).toHaveBeenCalledWith("Oak Park Copy.illustrator", expect.any(Blob));
  expect(useStore.getState().workflow.name).toBe("Oak Park Copy");

  const canceled = useStore.getState().saveWorkflowAs();
  await vi.waitFor(() => expect(useStore.getState().saveNamePrompt).not.toBeNull());
  useStore.getState().answerSaveName(null);
  expect(await canceled).toBe(false);
  expect(download).toHaveBeenCalledTimes(1);
});

test("Save as and Save copy record the current orientation and applied theme", async () => {
  const dialog = installFakeSaveDialog();
  const themes = useStore.getState().themes;
  try {
    useStore.setState({ themes: { selected: "forest", custom: [] } });
    useStore.getState().setBoardOrientation("vertical");
    await useStore.getState().saveWorkflowAs();
    useStore.getState().requestDemo(DemoId.RobotMailroom);
    await useStore.getState().confirmReplaceSaveCopy();
    expect(dialog.saved).toHaveLength(2);
    for (const file of dialog.saved) {
      expect(JSON.parse(await file.blob.text()).appearance).toMatchObject({
        orientation: "vertical",
        theme: { name: "Forest", texture: { pattern: "cross" } },
      });
    }
  } finally {
    useStore.setState({ themes });
  }
});

test("renameProject sets and clears the name, one undo step per edit", () => {
  const past = useStore.getState().past.length;
  useStore.getState().renameProject("Oak Park Invoice 2");
  expect(useStore.getState().workflow.name).toBe("Oak Park Invoice 2");
  useStore.getState().renameProject("   ");
  expect(useStore.getState().workflow).not.toHaveProperty("name");
  expect(useStore.getState().past.length).toBe(past + 2);
  useStore.getState().renameProject("   ");
  expect(useStore.getState().past.length).toBe(past + 2);
  useStore.getState().undo();
  expect(useStore.getState().workflow.name).toBe("Oak Park Invoice 2");
});

test("requestNew on an empty board is a no-op", () => {
  useStore.getState().loadDoc(freshBoard());
  useStore.getState().requestNew();
  expect(useStore.getState().pendingReplace).toBeNull();
  expect(isEmptyBoard(useStore.getState().workflow)).toBe(true);
});

test("loadDoc unfolds leftover groups and notices", () => {
  const mail = robotMailroom();
  const grouped = {
    ...mail,
    after: {
      ...mail.after,
      groups: [
        {
          id: MAILROOM_IDS.group,
          memberIds: [MAILROOM_IDS.scan, MAILROOM_IDS.lookup, MAILROOM_IDS.route],
        },
      ],
    },
  };
  useStore.getState().loadDoc(grouped);
  expect(useStore.getState().workflow.after.groups).toEqual([]);
  expect(useStore.getState().notice).toBe(UNFOLD_NOTICE);
  expect(laneAssignments(useStore.getState().workflow, AssignmentLane.After)[MAILROOM_IDS.scan]).toBe(
    MAILROOM_IDS.mailbot,
  );
});

test("addStep on an empty board creates the root (WG-01)", () => {
  useStore.getState().loadDoc(freshBoard());
  const id = useStore.getState().addStep();
  expect(id).toBeTruthy();
  expect(useStore.getState().workflow.nodes).toHaveLength(1);
  const root = useStore.getState().workflow.nodes[0];
  expect(root?.id).toBe(id);
  expect(root && isStepNode(root) && root.stepKind).toBe(StepKind.Other);
  expect(root && isStepNode(root) && root.title).toBe("");
});

test("addField on an empty board creates a Data root (WG-01)", () => {
  useStore.getState().loadDoc(freshBoard());
  const id = useStore.getState().addField();
  expect(id).toBeTruthy();
  expect(useStore.getState().workflow.nodes).toHaveLength(1);
  expect(useStore.getState().workflow.nodes[0]?.id).toBe(id);
  expect(useStore.getState().workflow.nodes[0]?.type).toBe(WorkflowNodeKind.DataField);
});

test("reloading a demo restores the fixture and does not keep live edits", () => {
  useStore.getState().updateNode(OAK_PARK_IDS.read, { title: "messed-up" });
  expect(useStore.getState().workflow.nodes.find((n) => n.id === OAK_PARK_IDS.read)).toMatchObject({
    title: "messed-up",
  });
  useStore.getState().requestDemo(DemoId.OakPark);
  useStore.getState().confirmReplaceDiscard();
  expect(useStore.getState().workflow.nodes.find((n) => n.id === OAK_PARK_IDS.read)).toMatchObject({
    title: "invoice.pdf",
  });
});

test("Start fresh discards recovery and writes an empty board (SH-10)", () => {
  const raw = '{"version":1';
  useStore.setState({
    recovery: {
      raw,
      violations: [{ code: "invalid-shape", message: "This file is not valid YAML or JSON." }],
      message: "This file is not valid YAML or JSON.",
    },
    persistStatus: "dirty",
  });
  const download = vi.spyOn(persist, "downloadRecoveryCopy").mockImplementation(() => undefined);
  useStore.getState().downloadHeldRecovery();
  expect(download).toHaveBeenCalledWith(raw);
  useStore.getState().startFresh();
  expect(useStore.getState().recovery).toBeNull();
  expect(isEmptyBoard(useStore.getState().workflow)).toBe(true);
  expect(useStore.getState().past).toEqual([]);
});
