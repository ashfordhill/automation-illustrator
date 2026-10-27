import { afterEach, expect, test, vi } from "vitest";
import { installFakeSaveDialog } from "./fakeSaveDialog";
import { chooseSaveTarget, PNG_FILE, WORKFLOW_FILE, withExtension, withoutExtension } from "./fileSave";
import * as persist from "./persistence";

afterEach(() => {
  vi.restoreAllMocks();
  delete (window as unknown as { showSaveFilePicker?: unknown }).showSaveFilePicker;
});

const neverAsked = () => Promise.reject(new Error("the in-app prompt should not open"));

test("Chromium's dialog names the file and the target writes there", async () => {
  const dialog = installFakeSaveDialog();
  dialog.answer("Invoice Flow.illustrator");
  const target = await chooseSaveTarget(WORKFLOW_FILE, "untitled.illustrator", neverAsked);
  expect(target?.name).toBe("Invoice Flow.illustrator");
  await target!.write(new Blob(["{}"]));
  expect(dialog.suggestions).toEqual(["untitled.illustrator"]);
  expect(dialog.saved.map((f) => f.name)).toEqual(["Invoice Flow.illustrator"]);
  expect(await dialog.saved[0]!.blob.text()).toBe("{}");
});

test("Cancel in the dialog is null and nothing is written", async () => {
  const dialog = installFakeSaveDialog();
  dialog.answer(null);
  expect(await chooseSaveTarget(WORKFLOW_FILE, "a.illustrator", neverAsked)).toBeNull();
  expect(dialog.saved).toEqual([]);
});

test("a dialog that refuses to open (no click to answer) falls back to the in-app name", async () => {
  (window as unknown as { showSaveFilePicker: unknown }).showSaveFilePicker = () =>
    Promise.reject(new DOMException("Must be handling a user gesture.", "SecurityError"));
  const download = vi.spyOn(persist, "downloadBlob").mockImplementation(() => undefined);
  const ask = vi.fn(async () => "board");
  const target = await chooseSaveTarget(PNG_FILE, "board.png", ask);
  expect(ask).toHaveBeenCalledWith({ suggestedName: "board.png", extension: ".png" });
  expect(target?.name).toBe("board.png");
  const blob = new Blob(["x"]);
  await target!.write(blob);
  expect(download).toHaveBeenCalledWith("board.png", blob);
});

test("without the dialog the app asks for a name, adds the extension, and downloads", async () => {
  const download = vi.spyOn(persist, "downloadBlob").mockImplementation(() => undefined);
  const target = await chooseSaveTarget(WORKFLOW_FILE, "oak.illustrator", async () => "  my flow  ");
  expect(target?.name).toBe("my flow.illustrator");
  await target!.write(new Blob(["{}"]));
  expect(download).toHaveBeenCalledWith("my flow.illustrator", expect.any(Blob));
  expect(await chooseSaveTarget(WORKFLOW_FILE, "oak.illustrator", async () => null)).toBeNull();
  expect(await chooseSaveTarget(WORKFLOW_FILE, "oak.illustrator", async () => "   ")).toBeNull();
});

test("extensions are added once and stripped case-insensitively", () => {
  expect(withExtension("flow", ".illustrator")).toBe("flow.illustrator");
  expect(withExtension("flow.ILLUSTRATOR", ".illustrator")).toBe("flow.ILLUSTRATOR");
  expect(withoutExtension("Flow.Illustrator", ".illustrator")).toBe("Flow");
  expect(withoutExtension("flow.svg", ".illustrator")).toBe("flow.svg");
});
