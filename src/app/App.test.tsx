import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, test } from "vitest";
import "@mantine/core/styles.css";
import { useStore } from "../state/store";
import { ColorScheme, ViewMode } from "../workflow/catalogs";
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
  s.setColorScheme(ColorScheme.Light);
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
