import { expect, test } from "vitest";
import { HAMBURGER_LEAVE_PX, hamburgerShouldClose } from "./hamburgerDismiss";

function el(className: string, extra?: string): HTMLElement {
  const n = document.createElement("div");
  n.className = className;
  if (extra) n.setAttribute("aria-label", extra);
  document.body.appendChild(n);
  return n;
}

test("pointer on the board closes the hamburger", () => {
  const lane = el("board-lane");
  expect(
    hamburgerShouldClose({
      hit: lane,
      clientX: 400,
      clientY: 400,
      menuUnion: { left: 1200, top: 8, right: 1240, bottom: 200 },
    }),
  ).toBe(true);
  lane.remove();
});

test("inspector hover does not close", () => {
  const rail = el("details-rail");
  expect(
    hamburgerShouldClose({
      hit: rail,
      clientX: 10,
      clientY: 800,
      menuUnion: { left: 1200, top: 8, right: 1240, bottom: 200 },
    }),
  ).toBe(false);
  rail.remove();
});

test("moving from the icon onto the dropdown does not close", () => {
  const drop = el("app-hamburger-dropdown");
  const union = { left: 1100, top: 8, right: 1340, bottom: 280 };
  expect(
    hamburgerShouldClose({ hit: drop, clientX: 1200, clientY: 80, menuUnion: union }),
  ).toBe(false);
  drop.remove();
});

test("leaving the menu union by more than 40 px closes", () => {
  const union = { left: 1100, top: 8, right: 1340, bottom: 80 };
  expect(
    hamburgerShouldClose({
      hit: document.body,
      clientX: union.left - HAMBURGER_LEAVE_PX - 1,
      clientY: 40,
      menuUnion: union,
    }),
  ).toBe(true);
  expect(
    hamburgerShouldClose({
      hit: document.body,
      clientX: union.left - HAMBURGER_LEAVE_PX + 1,
      clientY: 40,
      menuUnion: union,
    }),
  ).toBe(false);
});
