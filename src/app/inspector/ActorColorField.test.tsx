import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, test } from "vitest";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import { ActorColorField } from "./ActorColorField";

let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  host.remove();
});

test("clicking the Color fill opens a picker without rewriting the current fill", () => {
  const seen: string[] = [];
  act(() => {
    root.render(
      <MantineProvider>
        <ActorColorField value="#c89bf5" onChange={(color) => seen.push(color)} />
      </MantineProvider>,
    );
  });
  const fill = host.querySelector<HTMLButtonElement>('[aria-label="Color"]');
  expect(fill).not.toBeNull();
  expect(fill!.getAttribute("aria-expanded")).toBe("false");
  act(() => {
    fill!.click();
  });
  expect(fill!.getAttribute("aria-expanded")).toBe("true");
  expect(
    document.querySelector(".inspector-color-pop") ?? document.querySelector('[role="dialog"]'),
  ).not.toBeNull();
  expect(seen).toEqual([]);
});
