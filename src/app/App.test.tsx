import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, test } from "vitest";
import "@mantine/core/styles.css";
import { OAK_PARK_IDS } from "../demos/oakParkInvoice";
import { useStore } from "../state/store";
import { ColorScheme, SelectionKind, ViewMode } from "../workflow/catalogs";
import { isStepNode } from "../workflow/types";
import App from "./App";
import "./styles/tokens.css";

let host: HTMLDivElement;
let root: Root;

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
  s.setColorScheme(ColorScheme.Light);
  s.setSoundEnabled(false);
}

beforeEach(() => {
  resetSession();
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => {
    root.render(<App />);
  });
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  host.remove();
});

test("app mounts the shell and view switcher", () => {
  expect(host.textContent).toContain("Before");
  expect(host.textContent).toContain("After");
  expect(host.textContent).toContain("Both");
  expect(host.querySelector('[aria-label="Menu"]')).not.toBeNull();
  expect(host.querySelector("[data-unsupported-viewport]")).toBeNull();
});

test("demo startup loads the Oak Park invoice workflow", () => {
  const { workflow } = useStore.getState();
  expect(workflow.nodes.some((n) => isStepNode(n) && n.title === "invoice.pdf")).toBe(true);
  expect(workflow.nodes.some((n) => !isStepNode(n) && n.label === "Account #")).toBe(true);
});

test("New discard shows the on-canvas Add Step empty state", () => {
  act(() => {
    useStore.getState().requestNew();
    useStore.getState().confirmReplaceDiscard();
  });
  expect(host.textContent).toContain("This board is empty.");
  expect(host.textContent).toContain("Add Step");
  act(() => {
    useStore.getState().addStep();
  });
  expect(useStore.getState().workflow.nodes).toHaveLength(1);
  expect(host.textContent).not.toContain("This board is empty.");
});

test("unavailable persist status shows a Not saved chip", () => {
  act(() => {
    useStore.setState({ persistStatus: "unavailable" });
  });
  expect(host.textContent).toContain("Not saved");
});

test("inspector Type buttons are alphabetical with Other last; Who offers every actor", () => {
  act(() => {
    useStore.getState().select({ type: SelectionKind.Node, id: OAK_PARK_IDS.read });
  });
  const types = [...host.querySelectorAll('[aria-label^="Type "]')].map((el) =>
    el.getAttribute("aria-label"),
  );
  expect(types.at(-1)).toBe("Type Other");
  expect(types.slice(0, -1)).toEqual([
    "Type Call",
    "Type Copy",
    "Type Email",
    "Type Print",
    "Type Read",
    "Type Review",
    "Type Search",
    "Type Write",
  ]);
  expect(host.querySelector('[aria-label="Who Alice"]')).not.toBeNull();
  expect(host.querySelector('[aria-label="Who Robot"]')).not.toBeNull();
  expect(host.textContent).not.toMatch(/1 Path/);
  expect(host.textContent).not.toMatch(/All Paths/);
  act(() => {
    host.querySelector<HTMLButtonElement>('[aria-label="Who Robot"]')?.click();
  });
  expect(useStore.getState().workflow.assignments[OAK_PARK_IDS.read]).toBe(OAK_PARK_IDS.robot);
});

test("Path inspector has label plus Dotted / Solid (NA-07)", () => {
  act(() => {
    useStore.getState().select({ type: SelectionKind.Edge, id: OAK_PARK_IDS.gt });
  });
  const rail = host.querySelector(".details-rail-body")?.textContent ?? "";
  expect(rail).not.toMatch(/Path \/ condition/);
  expect(rail).not.toMatch(/\bArrow\b/);
  expect(rail).not.toMatch(/Always visited/);
  expect(rail).not.toMatch(/Choice \(dotted\)/);
  expect(rail).not.toMatch(/1 Path/);
  expect(rail).not.toMatch(/All Paths/);
  expect(rail).toMatch(/Dotted/);
  expect(rail).toMatch(/Solid/);
  expect(host.querySelector("#path-condition-field")).not.toBeNull();
});

test("sound toggle is off by default and Present restores the inspector", () => {
  expect(host.querySelector('[aria-label="Sound off"]')).not.toBeNull();
  expect(host.querySelector('[aria-pressed="false"]')).not.toBeNull();
  act(() => {
    useStore.getState().select({ type: SelectionKind.Node, id: OAK_PARK_IDS.read });
  });
  expect(host.textContent).toContain("Type");
  act(() => {
    useStore.getState().setPresent(true);
  });
  expect(host.querySelector("aside")).toBeNull();
  expect(host.textContent).toMatch(/will become automated/);
  act(() => {
    useStore.getState().setPresent(false);
  });
  expect(host.querySelector("aside")).not.toBeNull();
  expect(useStore.getState().selected?.id).toBe(OAK_PARK_IDS.read);
});

test("view switching has no BEFORE/AFTER corner chips", () => {
  expect(host.textContent).not.toMatch(/\bBEFORE\b/);
  expect(host.textContent).not.toMatch(/\bAFTER\b/);
  expect(host.querySelector('[role="radio"][aria-checked="true"]')?.textContent).toBe("Before");
  act(() => {
    useStore.getState().setView(ViewMode.After);
  });
  expect(host.querySelector('[role="radio"][aria-checked="true"]')?.textContent).toBe("After");
  expect(host.textContent).not.toMatch(/\bAFTER\b/);
  act(() => {
    useStore.getState().setView(ViewMode.Both);
  });
  expect(host.querySelector('[role="radio"][aria-checked="true"]')?.textContent).toBe("Both");
  expect(host.querySelectorAll(".board-lane")).toHaveLength(2);
  expect(host.textContent).not.toMatch(/\bBEFORE\b/);
});

test("Step inspector uses a trash control, not a Remove text button", () => {
  act(() => {
    useStore.getState().select({ type: SelectionKind.Node, id: OAK_PARK_IDS.read });
  });
  const rail = host.querySelector(".details-rail-body");
  expect(rail?.querySelector('[aria-label="Remove Step"]')).not.toBeNull();
  expect(
    [...(rail?.querySelectorAll("button") ?? [])].some((b) => b.textContent?.trim() === "Remove"),
  ).toBe(false);
  const whoOn = host.querySelector(".inspector-who.is-on") as HTMLElement | null;
  expect(whoOn).not.toBeNull();
  expect(getComputedStyle(whoOn!).outlineStyle === "dashed").toBe(false);
});

test("tile-drag hover sets insert preview on the lane without mutating the document", () => {
  const edges = useStore.getState().workflow.edges.map((e) => e.id).sort();
  act(() => {
    useStore.getState().beginTileDrag(OAK_PARK_IDS.review);
    useStore.getState().setTileDragHover(OAK_PARK_IDS.gt);
  });
  expect(host.querySelector('[data-insert-preview="true"]')).not.toBeNull();
  expect(host.textContent).toMatch(/Neighbors make a gap/);
  expect(useStore.getState().workflow.edges.map((e) => e.id).sort()).toEqual(edges);
  act(() => {
    useStore.getState().closeBoardModes();
  });
  expect(host.querySelector('[data-insert-preview="true"]')).toBeNull();
  expect(useStore.getState().workflow.edges.map((e) => e.id).sort()).toEqual(edges);
});
