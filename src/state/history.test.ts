import { expect, test } from "vitest";
import { emptyWorkflow } from "../workflow/types";
import {
  HISTORY_LIMIT,
  commitHistory,
  commitStructural,
  commitText,
  redoHistory,
  replaceHistory,
  undoHistory,
} from "./history";

function docWith(tag: string) {
  return {
    ...emptyWorkflow(),
    assignments: { [tag]: "h" },
  };
}

test("commitHistory caps past at 500 and clears redo", () => {
  let current = emptyWorkflow();
  let past = [emptyWorkflow()];
  for (let i = 0; i < HISTORY_LIMIT + 10; i++) {
    const stacks = commitHistory(current, past, docWith(`s_${i}`));
    current = stacks.workflow;
    past = stacks.past;
    expect(stacks.future).toEqual([]);
  }
  expect(past.length).toBe(HISTORY_LIMIT);
});

test("structural and text commits each push one undo entry", () => {
  const a = emptyWorkflow();
  const b = docWith("s_b");
  const c = docWith("s_c");
  const structural = commitStructural(a, [], b);
  expect(structural.past).toHaveLength(1);
  const text = commitText(structural.workflow, structural.past, c);
  expect(text.past).toHaveLength(2);
});

test("replaceHistory is a boundary: undo cannot cross it", () => {
  const a = emptyWorkflow();
  const b = docWith("s_b");
  const committed = commitStructural(a, [], b);
  const replaced = replaceHistory(docWith("fresh"));
  expect(replaced.past).toEqual([]);
  expect(replaced.future).toEqual([]);
  expect(undoHistory(replaced.past, replaced.workflow, replaced.future)).toBeNull();
  expect(committed.past).toHaveLength(1);
});

test("undoHistory then redoHistory restores the committed document", () => {
  const a = emptyWorkflow();
  const b = docWith("s");
  const committed = commitHistory(a, [], b);
  const undone = undoHistory(committed.past, committed.workflow, committed.future);
  expect(undone?.workflow).toEqual(a);
  const redone = redoHistory(undone!.past, undone!.workflow, undone!.future);
  expect(redone?.workflow).toEqual(b);
});
