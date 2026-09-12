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
  expect(spawn?.querySelector(".canvas-helper-spawn-kind-step")?.textContent).toBe("step");
  expect(text).toMatch(/A/);
  expect(text).toMatch(/D/);
  expect(spawn?.querySelector(".canvas-helper-spawn-kind-data")?.textContent).toBe("data");
  expect(text).not.toMatch(/\+ Step/);
  expect(text).not.toMatch(/\+ Data/);
  expect(host.querySelector("[data-spawn-compass]")).not.toBeNull();
  expect(spawn?.querySelector("[data-spawn-tile]")).not.toBeNull();
  expect(spawn?.querySelector("[data-spawn-arrow='left']")).not.toBeNull();
  expect(spawn?.querySelector("[data-spawn-arrow='right']")).not.toBeNull();
  expect(text).not.toMatch(/\|/);
  expect(host.textContent ?? "").not.toMatch(/Remove Step/);
  expect(host.textContent ?? "").not.toMatch(/Remove Data/);
  expect(host.textContent ?? "").not.toMatch(/Right-click/);
});

test("Tile Right-click delete sits beside the spawn cluster without joining its flow", () => {
  act(() => {
    useStore.getState().select({ type: SelectionKind.Node, id: OAK_PARK_IDS.read });
  });
  const cluster = host.querySelector(".canvas-helper-cluster");
  expect(cluster).not.toBeNull();
  expect(cluster?.querySelector("[data-spawn-hints]")).not.toBeNull();
  expect(cluster?.querySelector(".canvas-helper-chip")).toBeNull();
  act(() => {
    useStore.getState().setRightClickDelete(true);
  });
  expect(cluster?.querySelector(".canvas-helper-chip")?.textContent ?? "").toMatch(/Right-click/);
  expect(cluster?.querySelector("[data-mouse-right-click]")).not.toBeNull();
  expect(host.querySelector(".canvas-helper > .canvas-helper-chip")).toBeNull();
});

test("selected Path always shows stroke samples, Edit text, and Right-click delete", () => {
  act(() => {
    useStore.getState().select({ type: SelectionKind.Edge, id: OAK_PARK_IDS.webAcct });
  });
  const helper = host.querySelector(".canvas-helper");
  expect(helper?.textContent ?? "").toMatch(/S/);
  expect(helper?.querySelector("[data-stroke-toggle]")).not.toBeNull();
  expect(helper?.textContent ?? "").not.toMatch(/Dotted \/ Solid/);
  expect(helper?.textContent ?? "").toMatch(/Edit text/);
  expect(helper?.textContent ?? "").not.toMatch(/Edit label/);
  expect(helper?.textContent ?? "").toMatch(/Right-click/);
  expect(helper?.textContent ?? "").toMatch(/delete/);
  expect(helper?.querySelector("[data-mouse-right-click]")).not.toBeNull();
  expect(helper?.textContent ?? "").toMatch(/Remove Path/);
});

test("tile-drag hides the hint strip", () => {
  act(() => {
    useStore.getState().select({ type: SelectionKind.Node, id: OAK_PARK_IDS.review });
  });
  expect(host.querySelector(".canvas-helper")).not.toBeNull();
  act(() => {
    useStore.getState().beginTileDrag(OAK_PARK_IDS.review);
  });
  expect(host.querySelector(".canvas-helper")).toBeNull();
  expect(host.textContent ?? "").not.toMatch(/Drop/);
  expect(host.textContent ?? "").not.toMatch(/Esc/);
  expect(host.textContent ?? "").not.toMatch(/Neighbors make a gap/);
});

test("After spawn hints include Step and Data", () => {
  act(() => {
    useStore.getState().setView(ViewMode.After);
    useStore.getState().select({ type: SelectionKind.Node, id: OAK_PARK_IDS.read });
  });
  const spawn = host.querySelector("[data-spawn-hints]");
  expect(spawn?.querySelector(".canvas-helper-spawn-kind-step")?.textContent).toBe("step");
  expect(spawn?.querySelector(".canvas-helper-spawn-kind-data")?.textContent).toBe("data");
  expect(spawn?.textContent ?? "").not.toMatch(/After-only/);
});
