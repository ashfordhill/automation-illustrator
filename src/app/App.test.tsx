import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, test } from "vitest";
import "@mantine/core/styles.css";
import { OAK_PARK_IDS } from "../demos/oakParkInvoice";
import { useStore } from "../state/store";
import { ColorScheme, SelectionKind, ViewMode, WorkflowNodeKind } from "../workflow/catalogs";
import { isStepNode } from "../workflow/types";
import App from "./App";
import { APP_VERSION } from "./version";
import "./styles/tokens.css";
import "./components/StatusBar.css";

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
  s.setSoundEnabled(true);
  s.setRightClickDelete(false);
  s.setSimplify({
    hideVisuals: false,
  });
  s.setInspectorCollapsed(false);
  s.setBoardOrientation("horizontal");
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
  const lanes = host.querySelector('[aria-label="Before, After, or Compare"]');
  expect(lanes?.querySelector('[data-view-icon="before"][aria-label="Before"] svg')).not.toBeNull();
  expect(lanes?.querySelector('[data-view-icon="after"][aria-label="After"] svg')).not.toBeNull();
  expect(lanes?.querySelector('[data-view-icon="both"][aria-label="Compare"] svg')).not.toBeNull();
  expect(lanes?.querySelector('[data-compare-layout="stacked"]')).not.toBeNull();
  expect(host.querySelector('[aria-label="Menu"]')).not.toBeNull();
  expect(host.querySelector('[aria-label="Present"]')).not.toBeNull();
  const orientation = host.querySelector("footer [aria-label='Board orientation']");
  expect(orientation).not.toBeNull();
  expect(orientation?.querySelector('[aria-checked="true"]')?.getAttribute("aria-label")).toBe(
    "Horizontal",
  );
  expect(host.querySelector("[data-unsupported-viewport]")).toBeNull();
  expect(host.textContent).not.toMatch(/will become automated/);
});

test("demo startup loads the Oak Park invoice workflow", () => {
  const { workflow } = useStore.getState();
  expect(workflow.nodes.some((n) => isStepNode(n) && n.title === "invoice.pdf")).toBe(true);
  expect(workflow.nodes.some((n) => !isStepNode(n) && n.label === "Account #")).toBe(true);
});

test("View button is yellow when the word-web is on", () => {
  expect(host.querySelector('[data-status="simplify"]')?.classList.contains("is-on")).toBe(false);
  act(() => {
    useStore.getState().setSimplify({ hideVisuals: true });
  });
  expect(host.querySelector('[data-status="simplify"]')?.classList.contains("is-on")).toBe(true);
});

test("status bar shows orientation trees, text-only, Right-click delete, sound, and package version", () => {
  const bar = host.querySelector("footer.status-bar");
  expect(bar).not.toBeNull();
  expect(host.querySelector(".status-project")).toBeNull();
  const orientation = bar?.querySelector('[aria-label="Board orientation"]');
  expect(orientation).not.toBeNull();
  expect(orientation?.querySelector('[data-orientation-icon="horizontal"]')?.getAttribute("aria-checked")).toBe(
    "true",
  );
  expect(orientation?.querySelector('svg path[fill="currentColor"]')).toBeNull();
  const end = host.querySelector(".status-end");
  expect(end).not.toBeNull();
  expect(end?.lastElementChild?.classList.contains("status-version")).toBe(true);
  const simplify = host.querySelector('[data-status="simplify"]');
  const del = host.querySelector('[data-status="right-click-delete"]');
  const sound = end?.querySelector('[data-status="sound"]');
  expect(simplify?.textContent).toBe("text-only");
  expect(simplify?.getAttribute("aria-pressed")).toBe("false");
  expect(simplify?.classList.contains("is-on")).toBe(false);
  expect(del?.getAttribute("aria-pressed")).toBe("false");
  expect(del?.getAttribute("aria-label")).toBe("Right-click delete");
  expect(del?.classList.contains("status-mouse")).toBe(true);
  expect(del?.textContent).toMatch(/delete/);
  expect(del?.querySelector("[data-mouse-right-click]")).not.toBeNull();
  expect(sound).not.toBeNull();
  expect(sound?.getAttribute("aria-label")).toBe("Sound on");
  expect(sound?.classList.contains("is-on")).toBe(true);
  expect(sound && end && (sound.compareDocumentPosition(end.lastElementChild!) & Node.DOCUMENT_POSITION_FOLLOWING)).toBeTruthy();
  expect(host.querySelector(".status-version")?.textContent).toBe(`v${APP_VERSION}`);
});

test("idle inspector is the Actors roster", () => {
  expect(host.querySelector("#manage-actors-btn")).toBeNull();
  expect(host.querySelector(".inspector-back")).toBeNull();
  expect(host.querySelector('[aria-label="Add human"]')).not.toBeNull();
  expect(host.querySelector('[aria-label="Add robot"]')).not.toBeNull();
  expect(host.querySelector('[aria-label="Delete mode"]')).not.toBeNull();
});

test("New discard shows the on-canvas Add Step and Add Data empty state", () => {
  act(() => {
    useStore.getState().requestNew();
    useStore.getState().confirmReplaceDiscard();
  });
  expect(host.textContent).toContain("This board is empty.");
  expect(host.textContent).toContain("Add Step");
  expect(host.textContent).toContain("Add Data");
  act(() => {
    useStore.getState().addField();
  });
  expect(useStore.getState().workflow.nodes).toHaveLength(1);
  expect(useStore.getState().workflow.nodes[0]?.type).toBe(WorkflowNodeKind.DataField);
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
    "Type Scan",
    "Type Search",
    "Type Write",
  ]);
  expect(host.querySelector('[aria-label="Type Other"]')?.classList.contains("is-other")).toBe(true);
  expect(host.querySelector('[aria-label="Who Alice"]')).not.toBeNull();
  expect(host.querySelector('[aria-label="Who LLM"]')).not.toBeNull();
  expect(host.querySelector('[aria-label="Who Script"]')).not.toBeNull();
  expect(host.textContent).not.toMatch(/1 Path/);
  expect(host.textContent).not.toMatch(/All Paths/);
  act(() => {
    host.querySelector<HTMLButtonElement>('[aria-label="Who Script"]')?.click();
  });
  expect(useStore.getState().workflow.assignments[OAK_PARK_IDS.read]).toBe(OAK_PARK_IDS.robot);
});

test("idle inspector is Actors; Step has trash and no Actors/Back", () => {
  expect(host.querySelector(".inspector-header #manage-actors-btn")).toBeNull();
  expect(host.querySelector('[aria-label="Add human"]')).not.toBeNull();

  act(() => {
    useStore.getState().select({ type: SelectionKind.Node, id: OAK_PARK_IDS.read });
  });
  const rail = host.querySelector(".details-rail-body");
  const type = rail?.querySelector(".inspector-type-grid");
  const who = rail?.querySelector(".inspector-who-groups");
  const trash = rail?.querySelector('[aria-label="Remove Step"]');
  expect(type && who && trash).toBeTruthy();
  expect(rail?.querySelector("#manage-actors-btn")).toBeNull();
  expect(rail?.querySelector(".inspector-back")).toBeNull();
  expect(type!.compareDocumentPosition(who!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

  act(() => {
    useStore.getState().openManageActors();
  });
  expect(useStore.getState().selected).toBeNull();
  expect(useStore.getState().manageActorsSource).toBe("step");
  expect(useStore.getState().manageActorId).toBe(OAK_PARK_IDS.alice);
  expect(rail?.querySelector("#manage-actors-btn")).toBeNull();
  expect(rail?.querySelector(".inspector-back")).toBeNull();
  expect(rail?.querySelector('[aria-label="Remove Step"]')).toBeNull();
  const ops = rail?.querySelector(".inspector-actor-ops");
  const edit = rail?.querySelector(".inspector-actor-edit");
  const cards = rail?.querySelector(".inspector-who-groups");
  expect(ops && edit && cards).toBeTruthy();
  expect(ops!.compareDocumentPosition(edit!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(edit!.compareDocumentPosition(cards!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  const colorBtn = rail?.querySelector<HTMLButtonElement>('[aria-label="Color"]');
  expect(colorBtn).not.toBeNull();
  act(() => {
    colorBtn!.click();
  });
  expect(colorBtn!.getAttribute("aria-expanded")).toBe("true");

  act(() => {
    useStore.getState().closeManageActors({ restoreFocus: false });
    useStore.getState().select(null);
  });
  act(() => {
    useStore.getState().openManageActors();
  });
  expect(useStore.getState().manageActorsSource).toBe("empty");
  expect(host.querySelector("#manage-actors-btn")).toBeNull();
  expect(host.querySelector(".inspector-back")).toBeNull();
  expect(host.querySelector('[aria-label="Add human"]')).not.toBeNull();

  act(() => {
    useStore.getState().closeManageActors({ restoreFocus: false });
    useStore.getState().select({ type: SelectionKind.Node, id: OAK_PARK_IDS.acct });
  });
  expect(host.querySelector("#manage-actors-btn")).toBeNull();
  expect(host.querySelector('[aria-label="Remove Data"]')).not.toBeNull();
});

test("selected Path hints always include Right-click delete and Edit text", () => {
  act(() => {
    useStore.getState().select({ type: SelectionKind.Edge, id: OAK_PARK_IDS.webAcct });
  });
  const helper = host.querySelector(".canvas-helper")?.textContent ?? "";
  expect(helper).toMatch(/Edit text/);
  expect(helper).not.toMatch(/Edit label/);
  expect(helper).toMatch(/Right-click/);
  expect(helper).toMatch(/Remove Path/);
  expect(host.querySelector("[data-stroke-toggle]")).not.toBeNull();
  act(() => {
    useStore.getState().select({ type: SelectionKind.Edge, id: OAK_PARK_IDS.reviewTo3 });
  });
  const bridge = host.querySelector(".canvas-helper")?.textContent ?? "";
  expect(bridge).toMatch(/Right-click/);
  expect(bridge).not.toMatch(/Remove Path/);
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

test("Path inspector Dotted / Solid is shown for a Data-sourced Path", () => {
  act(() => {
    useStore.getState().select({ type: SelectionKind.Edge, id: OAK_PARK_IDS.acctEnter });
  });
  const rail = host.querySelector(".details-rail-body")?.textContent ?? "";
  expect(rail).toMatch(/Dotted/);
  expect(rail).toMatch(/Solid/);
});

test("toolbar Undo is followed by Redo; Redo is disabled until there is future history", () => {
  const undoBtn = () => host.querySelector<HTMLButtonElement>('[aria-label^="Undo"]');
  const redoBtn = () => host.querySelector<HTMLButtonElement>('[aria-label^="Redo"]');
  expect(undoBtn()).not.toBeNull();
  expect(redoBtn()).not.toBeNull();
  const undo = undoBtn();
  const redo = redoBtn();
  expect(undo && redo && (undo.compareDocumentPosition(redo) & Node.DOCUMENT_POSITION_FOLLOWING)).toBeTruthy();
  expect(redoBtn()?.disabled).toBe(true);
  act(() => {
    useStore.getState().updateNode(OAK_PARK_IDS.read, { title: "redo-check" });
  });
  expect(useStore.getState().past.length).toBeGreaterThan(0);
  act(() => {
    useStore.getState().undo();
  });
  expect(redoBtn()?.disabled).toBe(false);
  act(() => {
    redoBtn()?.click();
  });
  expect(useStore.getState().future.length).toBe(0);
  expect(redoBtn()?.disabled).toBe(true);
});

test("sound toggle is on by default and Present restores the inspector", () => {
  expect(host.querySelector("footer.status-bar [aria-label=\"Sound on\"]")).not.toBeNull();
  expect(host.querySelector('[aria-pressed="false"]')).not.toBeNull();
  act(() => {
    useStore.getState().select({ type: SelectionKind.Node, id: OAK_PARK_IDS.read });
  });
  expect(host.querySelector('[aria-label="Type"]')).not.toBeNull();
  act(() => {
    useStore.getState().setPresent(true);
  });
  expect(host.querySelector("aside")).toBeNull();
  expect(host.querySelector("[data-inspector-fold]")).toBeNull();
  expect(host.querySelector('[aria-label="Menu"]')).toBeNull();
  expect(host.querySelector(".view-switch")).toBeNull();
  expect(host.querySelector("footer.status-bar")).toBeNull();
  expect(host.textContent).not.toMatch(/will become automated/);
  act(() => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  });
  expect(useStore.getState().present).toBe(false);
  expect(host.querySelector("aside")).not.toBeNull();
  expect(host.querySelector('[aria-label="Menu"]')).not.toBeNull();
  expect(host.querySelector("footer.status-bar")).not.toBeNull();
  expect(useStore.getState().selected?.id).toBe(OAK_PARK_IDS.read);
});

test("Present stacks Before and After; expand fills one lane (P-07)", () => {
  act(() => {
    useStore.getState().setPresent(true);
  });
  expect(host.querySelectorAll(".board-lane")).toHaveLength(2);
  expect(host.querySelector('[aria-label="Expand Before"]')).not.toBeNull();
  expect(host.querySelector('[aria-label="Expand After"]')).not.toBeNull();
  expect(host.querySelector("[data-present-expand]")?.getAttribute("data-present-expand")).toBe(
    "split",
  );

  act(() => {
    host.querySelector<HTMLButtonElement>('[aria-label="Expand Before"]')?.click();
  });
  expect(useStore.getState().presentExpand).toBe("before");
  expect(host.querySelector('[data-present-pane="after"]')?.getAttribute("data-tucked")).toBe(
    "true",
  );
  expect(host.querySelector('[aria-label="Show Before and After"]')).not.toBeNull();

  act(() => {
    host.querySelector<HTMLButtonElement>('[aria-label="Show Before and After"]')?.click();
  });
  expect(useStore.getState().presentExpand).toBeNull();

  act(() => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
  });
  expect(useStore.getState().presentExpand).toBe("before");

  act(() => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
  });
  expect(useStore.getState().presentExpand).toBe("after");

  act(() => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  });
  expect(useStore.getState().present).toBe(false);
  expect(useStore.getState().presentExpand).toBeNull();
});

test("tucking a Present pane blurs it so Escape still exits", () => {
  act(() => {
    useStore.getState().setPresent(true);
  });
  const afterBtn = host.querySelector<HTMLButtonElement>('[aria-label="Expand After"]');
  expect(afterBtn).not.toBeNull();
  act(() => {
    afterBtn!.focus();
  });
  expect(document.activeElement).toBe(afterBtn);

  act(() => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
  });
  expect(useStore.getState().presentExpand).toBe("before");
  expect(afterBtn!.closest("[inert]")).not.toBeNull();
  expect(document.activeElement === afterBtn).toBe(false);

  act(() => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  });
  expect(useStore.getState().present).toBe(false);
});

test("inspector folds to a Show strip and selecting a tile does not reopen it", () => {
  act(() => {
    useStore.getState().select({ type: SelectionKind.Node, id: OAK_PARK_IDS.read });
  });
  expect(host.querySelector('[data-inspector="open"]')).not.toBeNull();
  expect(host.querySelector('[aria-label="Hide inspector"]')).not.toBeNull();
  act(() => {
    host.querySelector<HTMLButtonElement>('[aria-label="Hide inspector"]')?.click();
  });
  expect(useStore.getState().inspectorCollapsed).toBe(true);
  expect(host.querySelector('[data-inspector="collapsed"]')).not.toBeNull();
  expect(host.querySelector('[aria-label="Show inspector"]')).not.toBeNull();
  expect(host.querySelector("#details-rail-body")?.getAttribute("aria-hidden")).toBe("true");
  act(() => {
    useStore.getState().select({ type: SelectionKind.Node, id: OAK_PARK_IDS.review });
  });
  expect(useStore.getState().inspectorCollapsed).toBe(true);
  expect(host.querySelector('[data-inspector="collapsed"]')).not.toBeNull();
  act(() => {
    host.querySelector<HTMLButtonElement>('[aria-label="Show inspector"]')?.click();
  });
  expect(host.querySelector('[data-inspector="open"]')).not.toBeNull();
  expect(host.querySelector('[aria-label="Type Review"]')).not.toBeNull();
});

test("view switching has no BEFORE/AFTER corner chips", () => {
  expect(host.textContent).not.toMatch(/\bBEFORE\b/);
  expect(host.textContent).not.toMatch(/\bAFTER\b/);
  expect(host.querySelector('[role="radio"][aria-checked="true"]')?.getAttribute("aria-label")).toBe(
    "Before",
  );
  act(() => {
    useStore.getState().setView(ViewMode.After);
  });
  expect(host.querySelector('[role="radio"][aria-checked="true"]')?.getAttribute("aria-label")).toBe(
    "After",
  );
  expect(host.textContent).not.toMatch(/\bAFTER\b/);
  act(() => {
    useStore.getState().setView(ViewMode.Both);
  });
  expect(host.querySelector('[role="radio"][aria-checked="true"]')?.getAttribute("aria-label")).toBe(
    "Compare",
  );
  expect(host.querySelector('[data-compare-layout="stacked"]')).not.toBeNull();
  act(() => {
    useStore.getState().setBoardOrientation("vertical");
  });
  expect(host.querySelector('[data-compare-layout="side"]')).not.toBeNull();
  expect(host.querySelector('[data-compare-layout="stacked"]')).toBeNull();
  expect(host.querySelectorAll(".board-lane")).toHaveLength(2);
  expect(host.querySelectorAll(".board-lane.is-pan-target")).toHaveLength(0);
  expect(host.querySelector("[data-present-expand-btn]")).toBeNull();
  expect(host.textContent).not.toMatch(/\bBEFORE\b/);
});

test("Compare disables Type, Who, and inspector text fields", () => {
  act(() => {
    useStore.getState().select({ type: SelectionKind.Node, id: OAK_PARK_IDS.read });
    useStore.getState().setView(ViewMode.Both);
  });
  const typeOn = host.querySelector<HTMLButtonElement>('[aria-label="Type Read"]');
  const whoOn = host.querySelector<HTMLButtonElement>('[aria-label="Who Alice"]');
  const name = host.querySelector<HTMLInputElement>("#step-name-field");
  const details = host.querySelector<HTMLInputElement>("#step-details-field");
  expect(typeOn?.disabled).toBe(true);
  expect(whoOn?.disabled).toBe(true);
  expect(name?.disabled).toBe(true);
  expect(details?.disabled).toBe(true);
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
    useStore.getState().setTileDragHover({ kind: "path", edgeId: OAK_PARK_IDS.gt });
  });
  expect(host.querySelector('[data-insert-preview="true"]')).not.toBeNull();
  expect(host.querySelector('[data-tile-drag="true"]')).not.toBeNull();
  expect(host.querySelector(".canvas-helper")).toBeNull();
  expect(host.textContent).not.toMatch(/Neighbors make a gap/);
  expect(useStore.getState().workflow.edges.map((e) => e.id).sort()).toEqual(edges);
  act(() => {
    useStore.getState().closeBoardModes();
  });
  expect(host.querySelector('[data-insert-preview="true"]')).toBeNull();
  expect(host.querySelector('[data-tile-drag="true"]')).toBeNull();
  expect(useStore.getState().workflow.edges.map((e) => e.id).sort()).toEqual(edges);
});

test("Add Step leaves Other Name empty and the tile does not print Other", () => {
  act(() => {
    useStore.getState().requestNew();
    useStore.getState().confirmReplaceDiscard();
    useStore.getState().addStep();
  });
  const name = host.querySelector<HTMLInputElement>("#step-name-field");
  expect(name?.value).toBe("");
  expect(host.querySelector(".inspector-field-prefix-label")?.textContent).toBe("");
  expect(host.textContent).not.toContain("Other Task");
  const otherBtn = host.querySelector('[aria-label="Type Other"]');
  expect(otherBtn).not.toBeNull();
  expect(otherBtn?.querySelector("svg")).not.toBeNull();
  expect(otherBtn?.querySelector("path")).toBeNull();
  expect(otherBtn?.querySelector(".inspector-type-name")).toBeNull();
  expect(host.querySelector('[aria-label="Type Call"] .inspector-type-name')?.textContent).toBe(
    "Call",
  );
});

test("Read type uses an open book, not a clipboard", () => {
  act(() => {
    useStore.getState().select({ type: SelectionKind.Node, id: OAK_PARK_IDS.read });
  });
  const readSvg = host.querySelector('[aria-label="Type Read"] svg');
  expect(readSvg).not.toBeNull();
  expect(readSvg?.querySelectorAll("path").length).toBeGreaterThanOrEqual(4);
  expect(readSvg?.querySelector("rect")).toBeNull();
});

test("Step Name uses a Type prefix and drops Name/Details captions", () => {
  act(() => {
    useStore.getState().select({ type: SelectionKind.Node, id: OAK_PARK_IDS.read });
  });
  const rail = host.querySelector(".details-rail-body");
  const nameField = rail?.querySelector(".inspector-fields .inspector-field");
  const nameBox = nameField?.querySelector(".inspector-field-box");
  const prefix = nameField?.querySelector(".inspector-field-prefix");
  expect(prefix?.querySelector(".inspector-field-prefix-label")?.textContent).toBe("Read");
  expect(prefix?.classList.contains("has-chip")).toBe(true);
  expect(prefix?.nextElementSibling).toBe(nameBox);
  const name = rail?.querySelector<HTMLInputElement>("#step-name-field");
  const details = rail?.querySelector<HTMLInputElement>("#step-details-field");
  expect(name?.getAttribute("aria-label")).toBe("Name");
  expect(details?.getAttribute("aria-label")).toBe("Details");
  expect(name?.value).toBe("invoice.pdf");
  expect(getComputedStyle(name!).borderBottomStyle === "none" || getComputedStyle(name!).borderBottomWidth === "0px").toBe(
    true,
  );
  const captions = [...(rail?.querySelectorAll(".mantine-InputWrapper-label") ?? [])].map(
    (el) => el.textContent?.trim(),
  );
  expect(captions).not.toContain("Name");
  expect(captions).not.toContain("Details");
  expect(rail?.querySelector(".inspector-header .mantine-Text-root")).toBeNull();
  expect([... (rail?.querySelectorAll(".mantine-Text-root") ?? [])].map((el) => el.textContent?.trim())).not.toContain(
    "Type",
  );
  expect([... (rail?.querySelectorAll(".mantine-Text-root") ?? [])].map((el) => el.textContent?.trim())).not.toContain(
    "Who",
  );
});

test("hamburger omits Present, Actors, and Dark mode; Present is a toolbar button", () => {
  expect(host.querySelector('[aria-label="Present"]')).not.toBeNull();
  expect(host.querySelector('[aria-label="Menu"]')).not.toBeNull();
  expect(host.querySelector('[data-present-btn="true"] svg .present-box')).not.toBeNull();
  expect(host.querySelector('[data-present-btn="true"] svg .present-figure')).not.toBeNull();
  expect(host.textContent).not.toMatch(/Dark mode/);
  expect(host.textContent).not.toMatch(/Light mode/);
});

test("Compare is a column stack until Vertical, then a Before|After row", () => {
  act(() => {
    useStore.getState().setView(ViewMode.Both);
  });
  const stack = host.querySelector(".lane-stack");
  expect(stack?.getAttribute("data-orientation")).toBe("horizontal");
  expect(stack?.getAttribute("data-stack")).toBe("column");
  act(() => {
    useStore.getState().setBoardOrientation("vertical");
  });
  expect(stack?.getAttribute("data-orientation")).toBe("vertical");
  expect(stack?.getAttribute("data-stack")).toBe("row");
});

test("Present panes sit side-by-side when the board is Vertical", () => {
  act(() => {
    useStore.getState().setBoardOrientation("vertical");
    useStore.getState().setPresent(true);
  });
  expect(host.querySelector('[aria-label="Board orientation"]')).toBeNull();
  const stack = host.querySelector(".lane-stack");
  expect(stack?.getAttribute("data-orientation")).toBe("vertical");
  expect(stack?.getAttribute("data-stack")).toBe("row");
  expect(host.querySelectorAll(".board-lane")).toHaveLength(2);
  expect(host.querySelector('[aria-label="Expand Before"]')).not.toBeNull();
});
