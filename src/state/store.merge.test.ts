import { afterEach, beforeEach, expect, test } from "vitest";
import { MAILROOM_IDS } from "../demos/robotMailroom";
import { DemoId } from "../demos/catalog";
import { ColorScheme, SelectionKind, ViewMode, WorkflowNodeKind } from "../workflow/catalogs";
import { MSG } from "../workflow/commands";
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
  s.setSoundEnabled(false);
}

beforeEach(() => {
  resetSession();
});

afterEach(() => {
  resetSession();
});

function loadMailroom() {
  const s = useStore.getState();
  s.requestDemo(DemoId.RobotMailroom);
  s.confirmReplaceDiscard();
  s.setView(ViewMode.After);
}

test("After merge dock actions create and unmerge a group (MG-01, MG-07)", () => {
  loadMailroom();
  const s = useStore.getState();
  s.unmerge(MAILROOM_IDS.group);
  expect(useStore.getState().workflow.after.groups).toEqual([]);
  expect(useStore.getState().workflow.after.assignments[MAILROOM_IDS.scan]).toBe(MAILROOM_IDS.mailbot);

  s.select({ type: SelectionKind.Node, id: MAILROOM_IDS.scan });
  s.beginMerge();
  expect(useStore.getState().interaction.kind).toBe("merge-pick");
  s.toggleMergeMember(MAILROOM_IDS.route);
  s.confirmMerge();
  expect(useStore.getState().interaction.kind).toBe("idle");
  const groups = useStore.getState().workflow.after.groups;
  expect(groups).toHaveLength(1);
  expect(groups[0]?.memberIds).toEqual([MAILROOM_IDS.scan, MAILROOM_IDS.lookup, MAILROOM_IDS.route]);
});

test("Who on a merged tile updates every swallowed Step (MG-06)", () => {
  loadMailroom();
  const s = useStore.getState();
  s.assignActor(MAILROOM_IDS.group, MAILROOM_IDS.omar);
  const after = useStore.getState().workflow.after.assignments;
  expect(after[MAILROOM_IDS.scan]).toBe(MAILROOM_IDS.omar);
  expect(after[MAILROOM_IDS.lookup]).toBe(MAILROOM_IDS.omar);
  expect(after[MAILROOM_IDS.route]).toBe(MAILROOM_IDS.omar);
});

test("After + creates an After-only Step and hides Data (BA-06, BA-07)", () => {
  loadMailroom();
  const s = useStore.getState();
  const beforeNodes = s.workflow.nodes.length;
  const extra = s.workflow.after.extraNodes.length;
  s.spawnBranch(MAILROOM_IDS.open, WorkflowNodeKind.DataField);
  expect(useStore.getState().workflow.after.extraNodes).toHaveLength(extra);
  expect(useStore.getState().notice).toMatch(/After does not add Data/);

  const id = useStore.getState().spawnBranch(MAILROOM_IDS.call, WorkflowNodeKind.Step);
  expect(id).toBeTruthy();
  const next = useStore.getState().workflow;
  expect(next.nodes).toHaveLength(beforeNodes);
  expect(next.after.extraNodes.some((n) => n.id === id)).toBe(true);
  expect(next.after.assignments[id]).toBe(MAILROOM_IDS.mailbot);
});

test("After-only Step can be removed in After (BA-07)", () => {
  loadMailroom();
  const s = useStore.getState();
  s.beginRemovePick(MAILROOM_IDS.receipt);
  expect(useStore.getState().interaction.kind).toBe("remove-pick");
  s.confirmRemove();
  expect(useStore.getState().workflow.after.extraNodes).toEqual([]);
});

test("invalid merge selection explains and does not mutate", () => {
  loadMailroom();
  const s = useStore.getState();
  s.select({ type: SelectionKind.Node, id: MAILROOM_IDS.recipient });
  const groups = s.workflow.after.groups.length;
  s.beginMerge();
  expect(useStore.getState().notice).toBe(MSG.mergeData);
  expect(useStore.getState().workflow.after.groups).toHaveLength(groups);
});

test("merge preview expands the closure when another Step is added (MG-03)", () => {
  loadMailroom();
  const s = useStore.getState();
  s.unmerge(MAILROOM_IDS.group);
  s.select({ type: SelectionKind.Node, id: MAILROOM_IDS.scan });
  s.beginMerge();
  expect(useStore.getState().interaction).toMatchObject({
    kind: "merge-pick",
    memberIds: [MAILROOM_IDS.scan],
  });
  s.toggleMergeMember(MAILROOM_IDS.route);
  s.confirmMerge();
  expect(useStore.getState().workflow.after.groups[0]?.memberIds).toEqual([
    MAILROOM_IDS.scan,
    MAILROOM_IDS.lookup,
    MAILROOM_IDS.route,
  ]);
});
