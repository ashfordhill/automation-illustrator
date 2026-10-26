import { expect, test } from "vitest";
import { AccessoryKind, AssignmentLane, SplitKind, StepKind, WorkflowNodeKind } from "./catalogs";
import { makeHuman, makeRobot, removeActor } from "./actors";
import { ok } from "./commands";
import { editLane, restartAfter } from "./lane";
import { accessoriesFor, afterLooksFollow, setActorLook } from "./looks";
import { emptyWorkflow, isHuman, liftLegacyAccessories, type WorkflowDoc } from "./types";

function docWith(humanId: string): WorkflowDoc {
  const human = makeHuman("Ada");
  const robot = makeRobot();
  return {
    ...emptyWorkflow(),
    actors: [{ ...human, id: humanId }, robot],
  };
}

test("After wears Before until an After look edit, and that edit does not write Before", () => {
  const doc = docWith("h1");
  const before = setActorLook(doc, AssignmentLane.Before, "h1", {
    accessories: [AccessoryKind.Tablet],
  });
  expect(afterLooksFollow(before)).toBe(true);
  expect(accessoriesFor(before, AssignmentLane.After, before.actors[0])).toEqual([AccessoryKind.Tablet]);

  const after = setActorLook(before, AssignmentLane.After, "h1", {
    accessories: [AccessoryKind.Sunglasses],
  });
  expect(after).not.toBe(before);
  expect(after.nodes).toBe(before.nodes);
  expect(after.after.fork ?? null).toBeNull();
  expect(afterLooksFollow(after)).toBe(false);
  expect(accessoriesFor(after, AssignmentLane.Before, after.actors[0])).toEqual([AccessoryKind.Tablet]);
  expect(accessoriesFor(after, AssignmentLane.After, after.actors[0])).toEqual([AccessoryKind.Sunglasses]);

  const later = setActorLook(after, AssignmentLane.Before, "h1", {
    accessories: [AccessoryKind.Scanner],
  });
  expect(accessoriesFor(later, AssignmentLane.Before, later.actors[0])).toEqual([AccessoryKind.Scanner]);
  expect(accessoriesFor(later, AssignmentLane.After, later.actors[0])).toEqual([AccessoryKind.Sunglasses]);
});

test("a workflow edit does not freeze looks, and a look edit does not freeze the workflow", () => {
  const doc = setActorLook(docWith("h1"), AssignmentLane.Before, "h1", {
    accessories: [AccessoryKind.Tablet],
  });
  const titled = editLane(doc, AssignmentLane.After, (lane) =>
    ok({
      ...lane,
      nodes: [
        {
          id: "s1",
          type: WorkflowNodeKind.Step,
          position: { x: 0, y: 0 },
          stepKind: StepKind.Other,
          title: "only after",
          detail: "",
          split: SplitKind.Exclusive,
        },
      ],
    }),
  );
  if (!titled.ok) throw new Error("edit");
  expect(titled.value.after.fork).toBeTruthy();
  expect(afterLooksFollow(titled.value)).toBe(true);
  const glasses = setActorLook(titled.value, AssignmentLane.Before, "h1", {
    accessories: [AccessoryKind.Sunglasses],
  });
  expect(accessoriesFor(glasses, AssignmentLane.After, glasses.actors[0])).toEqual([
    AccessoryKind.Sunglasses,
  ]);
  expect(glasses.after.fork?.nodes[0]).toMatchObject({ title: "only after" });
});

test("Restart drops the look copy and a no-op does not copy", () => {
  const doc = setActorLook(docWith("h1"), AssignmentLane.Before, "h1", {
    accessories: [AccessoryKind.Tablet],
  });
  const same = setActorLook(doc, AssignmentLane.After, "h1", { accessories: [AccessoryKind.Tablet] });
  expect(same).toBe(doc);
  const copied = setActorLook(doc, AssignmentLane.After, "h1", { accessories: [AccessoryKind.Sunglasses] });
  const robot = copied.actors.find((actor) => !isHuman(actor));
  expect(setActorLook(copied, AssignmentLane.After, robot?.id ?? "", { accessories: [AccessoryKind.Scanner] })).toBe(
    copied,
  );
  const reset = restartAfter(copied);
  expect(afterLooksFollow(reset)).toBe(true);
  expect(accessoriesFor(reset, AssignmentLane.After, reset.actors[0])).toEqual([AccessoryKind.Tablet]);
});

test("legacy accessories on a Human become the Before look and are not left on the actor", () => {
  const lifted = liftLegacyAccessories({
    ...docWith("h1"),
    actors: [
      {
        id: "h1",
        kind: "human",
        name: "Ada",
        color: "#fff",
        role: "worker",
        accessories: ["tablet", "sunglasses"],
      } as WorkflowDoc["actors"][number] & { accessories: string[] },
    ],
  });
  expect(lifted.actors[0]).not.toHaveProperty("accessories");
  expect(lifted.looks?.h1?.accessories).toEqual([AccessoryKind.Sunglasses, AccessoryKind.Tablet]);
  expect(afterLooksFollow(lifted)).toBe(true);
  expect(liftLegacyAccessories(lifted)).toBe(lifted);
});

test("deleting an actor drops both look books", () => {
  const human = makeHuman("Spare");
  let doc = docWith("h1");
  doc = { ...doc, actors: [...doc.actors, human] };
  doc = setActorLook(doc, AssignmentLane.Before, human.id, { accessories: [AccessoryKind.Tablet] });
  doc = setActorLook(doc, AssignmentLane.After, human.id, { accessories: [AccessoryKind.Sunglasses] });
  const gone = removeActor(doc, human.id);
  expect(gone.ok).toBe(true);
  if (!gone.ok) return;
  expect(gone.value.looks?.[human.id]).toBeUndefined();
  expect(gone.value.after.looks?.[human.id]).toBeUndefined();
});
