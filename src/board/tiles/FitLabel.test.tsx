import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, expect, test } from "vitest";
import { FitLabel } from "./FitLabel";

let host: HTMLDivElement;
let root: Root;

afterEach(() => {
  act(() => {
    root.unmount();
  });
  host.remove();
});

test("FitLabel exposes the full string on title and aria-label (NA-10)", () => {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  const text = "incoming mail that is extremely long and must clamp";
  act(() => {
    root.render(
      <div style={{ width: 80, height: 40 }}>
        <FitLabel text={text} maxFontSizePx={14} />
      </div>,
    );
  });
  const group = host.querySelector('[role="group"]');
  expect(group?.getAttribute("aria-label")).toBe(text);
  expect(group?.getAttribute("title")).toBe(text);
});
