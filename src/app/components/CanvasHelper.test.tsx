import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, test } from "vitest";
import { OAK_PARK_IDS } from "../../demos/oakParkInvoice";
import { useStore } from "../../state/store";
import { SelectionKind, ViewMode } from "../../workflow/catalogs";
import { CanvasHelper } from "./CanvasHelper";

let host: HTMLDivElement;
let root: Root;

function resetSession() {
  localStorage.clear();
  const s = useStore.getState();
  s.resetDemo();
  s.setView(ViewMode.Before);
  s.setPresent(false);
  s.select(null);
  s.closeBoardModes();
  s.setRightClickDelete(false);
}

beforeEach(() => {
  resetSession();
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => {
    root.render(<CanvasHelper />);
  });
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  host.remove();
});

test("selected Tile spawn hints are Q/E Step and A/D Data with direction arrows", () => {
  act(() => {
    useStore.getState().select({ type: SelectionKind.Node, id: OAK_PARK_IDS.read });
  });
  const spawn = host.querySelector("[data-spawn-hints]");
  expect(spawn).not.toBeNull();
  const text = spawn?.textContent ?? "";
  expect(text).toMatch(/Q/);
  expect(text).toMatch(/E/);
  expect(text).toMatch(/\+ Step/);
  expect(text).toMatch(/A/);
  expect(text).toMatch(/D/);
  expect(text).toMatch(/\+ Data/);
  expect(host.querySelector("[data-spawn-compass]")).not.toBeNull();
  const svg = host.querySelector("[data-spawn-compass]");
  const shaft = svg?.querySelector("line");
  const tick = svg?.querySelectorAll("line")[1];
  expect(shaft?.getAttribute("y1")).toBe(shaft?.getAttribute("y2"));
  expect(tick?.getAttribute("x1")).toBe(tick?.getAttribute("x2"));
  expect(text).not.toMatch(/\|/);
  expect(host.textContent ?? "").toMatch(/Remove Step/);
  expect(host.textContent ?? "").not.toMatch(/Right-click/);
});

test("Right-click Delete hint is hidden until the toggle is on", () => {
  act(() => {
    useStore.getState().select({ type: SelectionKind.Edge, id: OAK_PARK_IDS.webAcct });
  });
  expect(host.textContent ?? "").not.toMatch(/Right-click/);
  act(() => {
    useStore.getState().setRightClickDelete(true);
    useStore.getState().select({ type: SelectionKind.Edge, id: OAK_PARK_IDS.webAcct });
  });
  expect(host.textContent ?? "").toMatch(/Right-click/);
  expect(host.textContent ?? "").toMatch(/Delete/);
});

test("After spawn hints omit Data", () => {
  act(() => {
    useStore.getState().setView(ViewMode.After);
    useStore.getState().select({ type: SelectionKind.Node, id: OAK_PARK_IDS.read });
  });
  const text = host.querySelector("[data-spawn-hints]")?.textContent ?? "";
  expect(text).toMatch(/After-only Step/);
  expect(text).not.toMatch(/Data/);
});
