import { expect, test } from "vitest";
import { AssignmentLane } from "../workflow/catalogs";
import { emptyWorkflow } from "../workflow/types";
import { commitHistory, redoHistory, undoHistory } from "./history";

test("commitHistory caps past at 80 and clears redo", () => {
  let current = emptyWorkflow();
  let past = [emptyWorkflow()];
  for (let i = 0; i < 90; i++) {
    const next = {
      ...emptyWorkflow(),
      assignments: {
        [AssignmentLane.Before]: { [`s_${i}`]: "h" },
        [AssignmentLane.After]: {},
      },
    };
    const stacks = commitHistory(current, past, next);
    current = stacks.workflow;
    past = stacks.past;
    expect(stacks.future).toEqual([]);
  }
  expect(past.length).toBe(80);
});

test("undoHistory then redoHistory restores the committed document", () => {
  const a = emptyWorkflow();
  const b = {
    ...emptyWorkflow(),
    assignments: {
      [AssignmentLane.Before]: { s: "h" },
      [AssignmentLane.After]: {},
    },
  };
  const committed = commitHistory(a, [], b);
  const undone = undoHistory(committed.past, committed.workflow, committed.future);
  expect(undone?.workflow).toEqual(a);
  const redone = redoHistory(undone!.past, undone!.workflow, undone!.future);
  expect(redone?.workflow).toEqual(b);
});
