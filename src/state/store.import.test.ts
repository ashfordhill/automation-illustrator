import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { DemoId } from "../demos/catalog";
import { OAK_PARK_IDS, oakParkInvoice } from "../demos/oakParkInvoice";
import { MAILROOM_IDS, robotMailroom } from "../demos/robotMailroom";
import mailroomYaml from "../demos/robot-mailroom.yaml?raw";
import { AssignmentLane, ColorScheme, ViewMode } from "../workflow/catalogs";
import { workflowToIllustrator, workflowToYaml } from "../workflow/serialize";
import { laneAssignments, UNFOLD_NOTICE } from "../workflow/types";
import { installFakeSaveDialog } from "./fakeSaveDialog";
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
  resetSession();
});

test("importRaw YAML does not replace until Discard; Cancel leaves the board", () => {
  const before = useStore.getState().workflow;
  const result = useStore.getState().importRaw(mailroomYaml);
  expect(result.ok).toBe(true);
  expect(useStore.getState().workflow).toBe(before);
  expect(useStore.getState().pendingReplace).toMatchObject({ kind: "import" });
  useStore.getState().cancelReplace();
  expect(useStore.getState().pendingReplace).toBeNull();
  expect(useStore.getState().workflow.nodes.some((n) => n.id === OAK_PARK_IDS.read)).toBe(true);
});

test("Discard import loads YAML, clears history, and has no After-only extras", () => {
  useStore.getState().updateNode(OAK_PARK_IDS.read, { title: "typed" });
  expect(useStore.getState().past.length).toBeGreaterThan(0);
  useStore.getState().importRaw(mailroomYaml);
  useStore.getState().confirmReplaceDiscard();
  expect(useStore.getState().workflow.nodes[0]?.id).toBe(MAILROOM_IDS.open);
  expect(useStore.getState().workflow.after.extraNodes).toEqual([]);
  expect(useStore.getState().past).toEqual([]);
  expect(useStore.getState().future).toEqual([]);
});

test("Import JSON of the live board round-trips titles", () => {
  useStore.getState().updateNode(OAK_PARK_IDS.read, { title: "edited.pdf" });
  const yaml = workflowToYaml(useStore.getState().workflow);
  useStore.getState().requestDemo(DemoId.RobotMailroom);
  useStore.getState().confirmReplaceDiscard();
  expect(useStore.getState().workflow.nodes[0]?.id).toBe(MAILROOM_IDS.open);
  useStore.getState().importRaw(yaml);
  useStore.getState().confirmReplaceDiscard();
  expect(useStore.getState().workflow.nodes.find((n) => n.id === OAK_PARK_IDS.read)).toMatchObject({
    title: "edited.pdf",
  });
});

test("Import of an exported .illustrator file restores the live board exactly", () => {
  useStore.getState().updateNode(OAK_PARK_IDS.read, { title: "edited.pdf" });
  const exported = useStore.getState().workflow;
  const text = workflowToIllustrator(exported);
  useStore.getState().requestDemo(DemoId.RobotMailroom);
  useStore.getState().confirmReplaceDiscard();
  expect(useStore.getState().workflow.nodes[0]?.id).toBe(MAILROOM_IDS.open);
  expect(useStore.getState().importRaw(text).ok).toBe(true);
  useStore.getState().confirmReplaceDiscard();
  expect(useStore.getState().workflow).toEqual(exported);
});

test("an .excalidraw file is refused without opening the replace gate", () => {
  const before = useStore.getState().workflow;
  useStore.getState().importRaw('{"type":"excalidraw","version":2,"elements":[]}');
  expect(useStore.getState().importError).toMatch(/not an Automation Illustrator workflow/);
  expect(useStore.getState().pendingReplace).toBeNull();
  expect(useStore.getState().workflow).toBe(before);
});

test("invalid YAML sets importError and never opens the replace gate", () => {
  const before = useStore.getState().workflow;
  useStore.getState().importRaw("{");
  expect(useStore.getState().importError).toMatch(/YAML or JSON/);
  expect(useStore.getState().pendingReplace).toBeNull();
  expect(useStore.getState().workflow).toBe(before);
});

test("empty file is a parse error, not a silent empty board", () => {
  useStore.getState().importRaw("  \n");
  expect(useStore.getState().importError).toMatch(/empty/i);
  expect(useStore.getState().pendingReplace).toBeNull();
  expect(useStore.getState().workflow.nodes.some((n) => n.id === OAK_PARK_IDS.read)).toBe(true);
});

test("cyclic YAML is rejected and the live board stays Oak Park", () => {
  const cyclic = workflowToYaml({
    ...oakParkInvoice(),
    edges: [
      ...oakParkInvoice().edges,
      { id: "e_loop", source: OAK_PARK_IDS.review3, target: OAK_PARK_IDS.read, label: "" },
    ],
  });
  useStore.getState().importRaw(cyclic);
  expect(useStore.getState().importError).toBeTruthy();
  expect(useStore.getState().pendingReplace).toBeNull();
  expect(useStore.getState().workflow.nodes[0]?.id).toBe(OAK_PARK_IDS.read);
});

test("import while recovery is held does not queue a replace", () => {
  useStore.setState({
    recovery: {
      raw: "{",
      violations: [{ code: "invalid-shape", message: "This file is empty." }],
      message: "This file is empty.",
    },
  });
  const result = useStore.getState().importRaw(mailroomYaml);
  expect(result.ok).toBe(true);
  expect(useStore.getState().pendingReplace).toBeNull();
  expect(useStore.getState().workflow.nodes.some((n) => n.id === OAK_PARK_IDS.read)).toBe(true);
});

test("Save as does not add undo history or change the document", async () => {
  const dialog = installFakeSaveDialog();
  useStore.getState().updateNode(OAK_PARK_IDS.read, { title: "typed" });
  const past = useStore.getState().past.length;
  const before = useStore.getState().workflow;
  await useStore.getState().saveWorkflowAs();
  expect(dialog.saved).toHaveLength(1);
  expect(useStore.getState().workflow).toBe(before);
  expect(useStore.getState().past.length).toBe(past);
});

function groupedMailroom() {
  const mail = robotMailroom();
  return {
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
}

test("Import of YAML with leftover merge groups unfolds and notices", () => {
  useStore.getState().importRaw(workflowToYaml(groupedMailroom()));
  expect(useStore.getState().pendingReplace).toMatchObject({ kind: "import", unfolded: true });
  useStore.getState().confirmReplaceDiscard();
  expect(useStore.getState().workflow.after.groups).toEqual([]);
  expect(useStore.getState().notice).toBe(UNFOLD_NOTICE);
  expect(laneAssignments(useStore.getState().workflow, AssignmentLane.After)[MAILROOM_IDS.scan]).toBe(
    MAILROOM_IDS.mailbot,
  );
});

test("Save copy on a grouped import still unfolds and notices", async () => {
  const dialog = installFakeSaveDialog();
  const beforeIds = useStore.getState().workflow.nodes.map((n) => n.id);
  useStore.getState().importRaw(workflowToYaml(groupedMailroom()));
  await useStore.getState().confirmReplaceSaveCopy();
  expect(dialog.saved).toHaveLength(1);
  const saved = JSON.parse(await dialog.saved[0]!.blob.text()) as { nodes: { id: string }[] };
  expect(saved.nodes.map((n) => n.id)).toEqual(beforeIds);
  expect(useStore.getState().notice).toBe(UNFOLD_NOTICE);
  expect(useStore.getState().workflow.after.groups).toEqual([]);
});
