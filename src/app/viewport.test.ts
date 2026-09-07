import { afterEach, expect, test, vi } from "vitest";
import { MIN_VIEWPORT_PX, isSupportedViewport } from "./viewport";

afterEach(() => {
  vi.restoreAllMocks();
});

function media(matches: boolean): Pick<Window, "matchMedia"> {
  return {
    matchMedia: () =>
      ({
        matches,
        media: `(min-width: ${MIN_VIEWPORT_PX}px)`,
        onchange: null,
        addListener() {},
        removeListener() {},
        addEventListener() {},
        removeEventListener() {},
        dispatchEvent() {
          return false;
        },
      }) as MediaQueryList,
  };
}

test("missing matchMedia is treated as a supported desktop (P-04)", () => {
  expect(isSupportedViewport(null)).toBe(true);
});

test("min-width 1024 px is supported and anything narrower is not (P-04)", () => {
  expect(isSupportedViewport(media(true))).toBe(true);
  expect(isSupportedViewport(media(false))).toBe(false);
});
