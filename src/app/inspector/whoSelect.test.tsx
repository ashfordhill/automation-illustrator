/**
 * Selected Who is yellow fill like Type, not a chunky ink frame.
 * Color values are asserted in e2e (jsdom does not resolve CSS variables).
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, test } from "vitest";
import { ActorKind, RobotKind } from "../../workflow/catalogs";
import type { ActorDto } from "../../workflow/types";
import { WhoButtons } from "./WhoButtons";
import "../styles/tokens.css";

const ACTORS: ActorDto[] = [
  {
    id: "h_alice",
    kind: ActorKind.Human,
    name: "Alice",
    color: "#ff9fbf",
    role: "worker",
  },
  {
    id: "h_roy",
    kind: ActorKind.Human,
    name: "Roy",
    color: "#f4c07a",
    role: "worker",
  },
];

let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => {
    root.render(<WhoButtons actors={ACTORS} value="h_alice" onChange={() => {}} />);
  });
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  host.remove();
});

test("selected Who is marked is-on without a dashed ring", () => {
  const on = host.querySelector(".inspector-who.is-on") as HTMLButtonElement | null;
  const off = host.querySelector(".inspector-who:not(.is-on)") as HTMLButtonElement | null;
  expect(on?.getAttribute("aria-pressed")).toBe("true");
  expect(off?.getAttribute("aria-pressed")).toBe("false");
  expect(on?.textContent).toContain("Alice");
  expect(off?.textContent).toContain("Roy");
  expect(getComputedStyle(on!).outlineStyle === "dashed").toBe(false);
});


test("Who lists Humans then Robots even when document order is mixed", () => {
  const mixed: ActorDto[] = [
    ACTORS[0],
    {
      id: "r_llm",
      kind: ActorKind.Robot,
      name: "LLM",
      color: "#5ec4d8",
      robotKind: RobotKind.Llm,
      role: "LLM",
    },
    ACTORS[1],
  ];
  act(() => {
    root.render(<WhoButtons actors={mixed} value="h_alice" onChange={() => {}} />);
  });
  const names = [...host.querySelectorAll(".inspector-who-name")].map((el) => el.textContent);
  expect(names).toEqual(["Alice", "Roy", "LLM"]);
  expect(host.querySelector('[aria-label="Humans"]')).toBeTruthy();
  expect(host.querySelector('[aria-label="Robots"]')).toBeTruthy();
});

test("disabled Who keys cannot be clicked", () => {
  act(() => {
    root.render(<WhoButtons actors={ACTORS} value="h_alice" onChange={() => {}} disabled />);
  });
  const on = host.querySelector(".inspector-who.is-on") as HTMLButtonElement;
  const off = host.querySelector(".inspector-who:not(.is-on)") as HTMLButtonElement;
  expect(on.disabled).toBe(true);
  expect(off.disabled).toBe(true);
});
