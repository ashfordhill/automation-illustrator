/**
 * Nunito for exported SVGs, embedded as data URLs so a file looks the same on
 * GitHub and offline. Latin always; Latin Extended only when the text uses it.
 * Ranges mirror @fontsource-variable/nunito/wght.css.
 */
import latin from "@fontsource-variable/nunito/files/nunito-latin-wght-normal.woff2?inline";
import latinExt from "@fontsource-variable/nunito/files/nunito-latin-ext-wght-normal.woff2?inline";

const LATIN_RANGE =
  "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";
const LATIN_EXT_RANGE =
  "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF";
const LATIN_EXT_CHARS = /[\u0100-\u02ff\u1d00-\u1dbf\u1e00-\u1eff\u2c60-\u2c7f\ua720-\ua7ff]/;

function fontFace(src: string, range: string): string {
  return `@font-face{font-family:"Nunito Variable";font-style:normal;font-weight:200 1000;src:url(${src}) format("woff2");unicode-range:${range};}`;
}

/** `@font-face` rules for an SVG whose visible text is `text`. */
export function exportFontCss(text: string): string {
  return fontFace(latin, LATIN_RANGE) + (LATIN_EXT_CHARS.test(text) ? fontFace(latinExt, LATIN_EXT_RANGE) : "");
}

/** Wait for the page's Nunito so canvas widths match what the SVG draws. */
export async function loadExportFont(): Promise<void> {
  if (typeof document === "undefined" || !document.fonts?.load) return;
  try {
    await document.fonts.load('800 16px "Nunito Variable"');
  } catch {
    /* widths fall back to whatever font the page has */
  }
}
