import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, test } from "vitest";
import { Scrollbar } from "./Scrollbar";

let host: HTMLDivElement;
let root: Root;

function mockViewport(
  el: HTMLElement,
  box: { scrollHeight: number; clientHeight: number; scrollTop?: number },
) {
  let top = box.scrollTop ?? 0;
  const max = Math.max(0, box.scrollHeight - box.clientHeight);
  Object.defineProperty(el, "scrollHeight", { configurable: true, get: () => box.scrollHeight });
  Object.defineProperty(el, "clientHeight", { configurable: true, get: () => box.clientHeight });
  Object.defineProperty(el, "scrollTop", {
    configurable: true,
    get: () => top,
    set: (value: number) => {
      top = Math.max(0, Math.min(max, value));
      el.dispatchEvent(new Event("scroll"));
    },
  });
  Object.defineProperty(el, "scrollBy", {
    configurable: true,
    value: ({ top: delta }: { top: number }) => {
      el.scrollTop += delta;
    },
  });
}

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

test("rail stays hidden when the viewport does not overflow", () => {
  act(() => {
    root.render(
      <Scrollbar viewportId="scroll-box">
        <div>short</div>
      </Scrollbar>,
    );
  });
  const viewport = host.querySelector("#scroll-box") as HTMLElement;
  mockViewport(viewport, { scrollHeight: 200, clientHeight: 200 });
  act(() => {
    window.dispatchEvent(new Event("resize"));
  });
  expect(host.querySelector("[data-scrollbar]")?.getAttribute("data-overflow")).toBe("false");
  expect(host.querySelector("[data-scrollbar-rail]")?.getAttribute("data-visible")).toBe("false");
  expect(host.querySelector('[aria-label="Scroll down"]')).not.toBeNull();
});

test("overflow shows cupped caps and a rounded thumb, and paging moves the viewport", () => {
  act(() => {
    root.render(
      <Scrollbar viewportId="scroll-box">
        <div>tall</div>
      </Scrollbar>,
    );
  });
  const viewport = host.querySelector("#scroll-box") as HTMLElement;
  const track = host.querySelector(".scrollbar-track") as HTMLElement;
  mockViewport(viewport, { scrollHeight: 1000, clientHeight: 200 });
  Object.defineProperty(track, "clientHeight", { configurable: true, get: () => 400 });
  act(() => {
    window.dispatchEvent(new Event("resize"));
  });
  expect(host.querySelector("[data-scrollbar]")?.getAttribute("data-overflow")).toBe("true");
  expect(host.querySelector("[data-scrollbar-rail]")?.getAttribute("data-visible")).toBe("true");
  expect(host.querySelector('[aria-label="Scroll up"]')).not.toBeNull();
  expect(host.querySelector('[aria-label="Scroll down"]')).not.toBeNull();
  const thumb = host.querySelector('[role="scrollbar"]');
  expect(thumb).not.toBeNull();
  expect(thumb?.getAttribute("aria-orientation")).toBe("vertical");
  expect(thumb?.getAttribute("aria-controls")).toBe("scroll-box");
  expect(host.querySelector(".scrollbar-cap svg path")).not.toBeNull();

  act(() => {
    host.querySelector<HTMLButtonElement>('[aria-label="Scroll down"]')?.click();
  });
  expect(viewport.scrollTop).toBeGreaterThan(0);
  expect(thumb?.getAttribute("aria-valuenow")).not.toBe("0");
});
