/**
 * Light board colors for image export as concrete values, so the SVG renders
 * outside a browser. Keep in step with :root in app/styles/tokens.css and
 * board/tiles/dataMark.css; e2e/improve-68-export-image.spec.ts compares them
 * with the live page.
 */
export const BOARD_TOKENS = {
  "--ink": "#071c28",
  "--line": "#123a50",
  "--cream": "#f7fcfe",
  "--blue": "#1a8fd4",
  "--blue-deep": "#0e6ca8",
  "--actor-empty": "#cfe8f2",
  "--data-mark": "#ae78f2",
} as const;

/** `box-shadow: 0 5px 0 var(--btn-shadow)` under Step and Data tiles. */
export const TILE_SHADOW = { dy: 5, color: "#071c28", opacity: 0.16 } as const;

/** `--chip-shadow: 0 3px 0 …` under condition chips. */
export const CHIP_SHADOW = { dy: 3, color: "#071c28", opacity: 0.1 } as const;

/** `.actor-card` border: `color-mix(in srgb, var(--line) 22%, transparent)`. */
export const ACTOR_CARD_BORDER = { color: BOARD_TOKENS["--line"], opacity: 0.22 } as const;

/** Replace `var(--name)` with a concrete value. Unknown names are left in place. */
export function resolveCssVars(markup: string, values: Readonly<Record<string, string>>): string {
  return markup.replace(/var\((--[a-z0-9-]+)\)/gi, (whole, name: string) => values[name] ?? whole);
}
