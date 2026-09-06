import { expect, test } from "vitest";
import {
  hydratePersistedWorkflow,
  LS_WORKFLOW,
  writeWorkflow,
  type StorageLike,
} from "./persistence";
import { emptyAfterOverlay, emptyWorkflow, type WorkflowDoc } from "../workflow/types";
import { SplitKind, StepKind, WorkflowNodeKind } from "../workflow/catalogs";

class MemoryStorage implements StorageLike {
  private data = new Map<string, string>();
  getItem(key: string) {
    return this.data.has(key) ? this.data.get(key)! : null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
}

class UnreadableStorage implements StorageLike {
  getItem(): string | null {
    throw new Error("denied");
  }
  setItem() {}
}

class UnwritableStorage extends MemoryStorage {
  setItem(): void {
    throw new Error("quota");
  }
}

const fallback = (): WorkflowDoc => ({
  version: 2,
  actors: [],
  nodes: [
    {
      id: "s_fb",
      type: WorkflowNodeKind.Step,
      position: { x: 0, y: 0 },
      stepKind: StepKind.Other,
      title: "fallback",
      detail: "",
      split: SplitKind.Exclusive,
    },
  ],
  edges: [],
  assignments: {},
  after: emptyAfterOverlay(),
});

const validV1 = JSON.stringify({
  version: 1,
  actors: [],
  nodes: [
    {
      id: "s_read",
      type: "step",
      position: { x: 0, y: 0 },
      stepKind: "other",
      title: "ok",
      detail: "",
      split: "exclusive",
    },
  ],
  edges: [],
  assignments: { before: {}, after: {} },
});

test("empty storage writes the fallback and reports saved", () => {
  const storage = new MemoryStorage();
  const result = hydratePersistedWorkflow(fallback, storage);
  expect(result.recovery).toBeNull();
  expect(result.persistStatus).toBe("saved");
  expect(result.workflow.nodes[0]?.id).toBe("s_fb");
  expect(JSON.parse(storage.getItem(LS_WORKFLOW)!).version).toBe(2);
});

test("valid v1 storage migrates and overwrites with v2", () => {
  const storage = new MemoryStorage();
  storage.setItem(LS_WORKFLOW, validV1);
  const result = hydratePersistedWorkflow(fallback, storage);
  expect(result.recovery).toBeNull();
  expect(result.persistStatus).toBe("saved");
  expect(result.workflow.version).toBe(2);
  const saved = JSON.parse(storage.getItem(LS_WORKFLOW)!);
  expect(saved.version).toBe(2);
  expect(saved.after.groups).toEqual([]);
  expect(saved.assignments).toEqual({});
});

test("invalid graph keeps the raw key and returns recovery (SH-09, SH-10)", () => {
  const storage = new MemoryStorage();
  const raw = JSON.stringify({
    version: 1,
    actors: [],
    nodes: [
      {
        id: "a",
        type: "step",
        position: { x: 0, y: 0 },
        stepKind: "other",
        title: "",
        detail: "",
        split: "exclusive",
      },
      {
        id: "b",
        type: "step",
        position: { x: 0, y: 40 },
        stepKind: "other",
        title: "",
        detail: "",
        split: "exclusive",
      },
    ],
    edges: [
      { id: "e1", source: "a", target: "b", label: "" },
      { id: "e2", source: "b", target: "a", label: "" },
    ],
    assignments: { before: {}, after: {} },
  });
  storage.setItem(LS_WORKFLOW, raw);
  const result = hydratePersistedWorkflow(fallback, storage);
  expect(storage.getItem(LS_WORKFLOW)).toBe(raw);
  expect(result.persistStatus).toBe("dirty");
  expect(result.recovery?.raw).toBe(raw);
  expect(result.recovery?.violations.map((v) => v.code)).toEqual(
    expect.arrayContaining(["cycle", "no-root"]),
  );
  expect(result.workflow.nodes[0]?.id).toBe("s_fb");
});

test("getItem failure is unavailable and does not write", () => {
  const result = hydratePersistedWorkflow(fallback, new UnreadableStorage());
  expect(result.persistStatus).toBe("unavailable");
  expect(result.recovery).toBeNull();
  expect(result.workflow.nodes[0]?.id).toBe("s_fb");
});

test("setItem failure is unavailable; repeated writes stay a single status", () => {
  const storage = new UnwritableStorage();
  const first = hydratePersistedWorkflow(fallback, storage);
  expect(first.persistStatus).toBe("unavailable");
  const second = writeWorkflow(emptyWorkflow(), storage);
  expect(second).toBe("unavailable");
});
