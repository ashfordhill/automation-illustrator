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
    "Type Approve",
    "Type Call",
    "Type Copy",
    "Type Drag",
    "Type Email",
    "Type File",
    "Type Print",
    "Type Read",
    "Type Review",
    "Type Scan",
    "Type Search",
    "Type Write",
  ]);
  expect(host.querySelector('[aria-label="Who Alice"]')).not.toBeNull();
  expect(host.querySelector('[aria-label="Who Robot"]')).not.toBeNull();
  act(() => {
    host.querySelector<HTMLButtonElement>('[aria-label="Who Robot"]')?.click();
  });
  expect(useStore.getState().workflow.assignments[OAK_PARK_IDS.read]).toBe(OAK_PARK_IDS.robot);
});

test("Path inspector uses Path / condition and Choice stroke (NA-07, PC-01)", () => {
  act(() => {
    useStore.getState().select({ type: SelectionKind.Edge, id: OAK_PARK_IDS.gt });
  });
  expect(host.textContent).toContain("Path / condition");
  const rail = host.querySelector(".details-rail-body")?.textContent ?? "";
  expect(rail).not.toMatch(/\bArrow\b/);
  const choice = host.querySelector('[aria-label="Always visited (solid) / Choice (dotted)"]');
  expect(choice).not.toBeNull();
  expect(choice?.querySelector('[aria-pressed="true"]')?.textContent).toMatch(/Choice/);
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

test("view switching updates the on-canvas lane name", () => {
  expect(host.textContent).toContain("BEFORE");
  act(() => {
    useStore.getState().setView(ViewMode.After);
  });
  expect(host.textContent).toContain("AFTER");
  act(() => {
    useStore.getState().setView(ViewMode.Both);
  });
  expect(host.textContent).toContain("BEFORE");
  expect(host.textContent).toContain("AFTER");
});
