import { afterEach, beforeEach, expect, test } from "vitest";
import { ColorScheme, SplitKind, ViewMode } from "../workflow/catalogs";
import { OAK_PARK_IDS } from "../demos/oakParkInvoice";
import { MAILROOM_IDS } from "../demos/robotMailroom";
import { DemoId } from "../demos/catalog";
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
  s.closeManageActors({ restoreFocus: false });
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

test("Who assigns in both lanes, including a Robot in Before (NA-03, NA-11)", () => {
  const { read, review, roy, robot } = OAK_PARK_IDS;
  const s = useStore.getState();
  s.assignActor(read, roy);
  expect(useStore.getState().workflow.assignments[read]).toBe(roy);
  expect(useStore.getState().lastHumanId).toBe(roy);

  s.assignActor(read, robot);
  expect(useStore.getState().workflow.assignments[read]).toBe(robot);
  expect(useStore.getState().lastHumanId).toBe(roy);

  s.setView(ViewMode.After);
  useStore.getState().assignActor(review, robot);
  expect(useStore.getState().workflow.after.assignments[review]).toBe(robot);
  expect(useStore.getState().workflow.assignments[review]).toBe(OAK_PARK_IDS.alice);
});

test("changing Split re-applies default strokes (PC-02, PC-03)", () => {
  const { read, gt, lt } = OAK_PARK_IDS;
  const s = useStore.getState();
  s.updateNode(read, { split: SplitKind.Parallel });
  const every = useStore.getState().workflow;
  expect(every.edges.find((e) => e.id === gt)?.dashed).toBe(false);
  expect(every.edges.find((e) => e.id === lt)?.dashed).toBe(false);

  s.updateNode(read, { split: SplitKind.Exclusive });
  const oneOf = useStore.getState().workflow;
  expect(oneOf.edges.find((e) => e.id === gt)?.dashed).toBe(true);
  expect(oneOf.edges.find((e) => e.id === lt)?.dashed).toBe(true);

  s.updateEdge(gt, { dashed: false });
  expect(useStore.getState().workflow.edges.find((e) => e.id === gt)?.dashed).toBe(false);
  s.updateNode(read, { split: SplitKind.Exclusive });
  expect(useStore.getState().workflow.edges.find((e) => e.id === gt)?.dashed).toBe(true);
});

test("removeActor blocks used humans and deletes unused Priya (NA-02)", () => {
  const s = useStore.getState();
  expect(s.removeActor(OAK_PARK_IDS.alice)).toBe(false);
  expect(useStore.getState().notice).toMatch(/Alice is assigned to/);
  expect(useStore.getState().notice).toMatch(/Read invoice\.pdf \(Before\)/);
  expect(useStore.getState().workflow.actors.some((a) => a.id === OAK_PARK_IDS.alice)).toBe(true);

  s.requestDemo(DemoId.RobotMailroom);
  s.confirmReplaceDiscard();
  expect(useStore.getState().removeActor(MAILROOM_IDS.priya)).toBe(true);
  expect(useStore.getState().workflow.actors.some((a) => a.id === MAILROOM_IDS.priya)).toBe(false);
});
