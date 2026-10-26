/**
 * Color math for image export. Actor fills may be hex, rgb(), or hsl() (random
 * pastels). The role chip paints `oklch(from <fill> max(0.86, l) c h)`, which
 * only browsers understand, so the SVG gets the same color as hex.
 */
export type Rgb = { r: number; g: number; b: number };

const ROLE_CHIP_MIN_LIGHTNESS = 0.86;

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function channel(token: string, scale: number): number | null {
  const t = token.trim();
  if (!t) return null;
  const n = Number.parseFloat(t);
  if (!Number.isFinite(n)) return null;
  return t.endsWith("%") ? n / 100 : n / scale;
}

function hue(token: string): number | null {
  const t = token.trim().toLowerCase();
  const n = Number.parseFloat(t);
  if (!Number.isFinite(n)) return null;
  if (t.endsWith("turn")) return n * 360;
  if (t.endsWith("rad")) return (n * 180) / Math.PI;
  if (t.endsWith("grad")) return n * 0.9;
  return n;
}

/** Color channels of `rgb(…)` / `hsl(…)` in comma or space syntax; alpha is ignored. */
function functionParts(body: string): string[] {
  return body.split("/")[0]!.split(/[\s,]+/).filter(Boolean);
}

function hslToRgb(h: number, s: number, l: number): Rgb {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return { r: f(0), g: f(8), b: f(4) };
}

/** sRGB channels in 0–1, or null for anything this does not read (names, color()). */
export function parseCssColor(value: string): Rgb | null {
  const v = value.trim().toLowerCase();
  const hex = /^#([0-9a-f]{3,8})$/.exec(v)?.[1];
  if (hex) {
    if (hex.length === 3 || hex.length === 4) {
      const [r, g, b] = [...hex].map((c) => Number.parseInt(c + c, 16) / 255);
      return { r: r!, g: g!, b: b! };
    }
    if (hex.length === 6 || hex.length === 8) {
      return {
        r: Number.parseInt(hex.slice(0, 2), 16) / 255,
        g: Number.parseInt(hex.slice(2, 4), 16) / 255,
        b: Number.parseInt(hex.slice(4, 6), 16) / 255,
      };
    }
    return null;
  }
  const fn = /^(rgba?|hsla?)\((.*)\)$/.exec(v);
  if (!fn) return null;
  const parts = functionParts(fn[2]!);
  if (parts.length < 3) return null;
  if (fn[1]!.startsWith("rgb")) {
    const [r, g, b] = parts.slice(0, 3).map((p) => channel(p, 255));
    if (r == null || g == null || b == null) return null;
    return { r: clamp01(r), g: clamp01(g), b: clamp01(b) };
  }
  const h = hue(parts[0]!);
  const s = channel(parts[1]!, 100);
  const l = channel(parts[2]!, 100);
  if (h == null || s == null || l == null) return null;
  return hslToRgb(((h % 360) + 360) % 360, clamp01(s), clamp01(l));
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const byte = (n: number) =>
    Math.round(clamp01(n) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${byte(r)}${byte(g)}${byte(b)}`;
}

function toLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function fromLinear(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
}

export type Oklch = { l: number; c: number; h: number };

export function rgbToOklch({ r, g, b }: Rgb): Oklch {
  const lr = toLinear(r);
  const lg = toLinear(g);
  const lb = toLinear(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { l: L, c: Math.hypot(A, B), h: Math.atan2(B, A) };
}

/** Back to sRGB, clipping each channel when the color falls outside the gamut. */
export function oklchToRgb({ l, c, h }: Oklch): Rgb {
  const A = c * Math.cos(h);
  const B = c * Math.sin(h);
  const L = (l + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const M = (l - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const S = (l - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return {
    r: clamp01(fromLinear(4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S)),
    g: clamp01(fromLinear(-1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S)),
    b: clamp01(fromLinear(-0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S)),
  };
}

/** `.actor-chip-role` fill: the actor color with OKLCH lightness floored at 0.86. */
export function roleChipFill(actorFill: string): string {
  const rgb = parseCssColor(actorFill);
  if (!rgb) return actorFill;
  const lch = rgbToOklch(rgb);
  if (lch.l >= ROLE_CHIP_MIN_LIGHTNESS) return rgbToHex(rgb);
  return rgbToHex(oklchToRgb({ ...lch, l: ROLE_CHIP_MIN_LIGHTNESS }));
}

/** Any CSS color this module reads, as hex; otherwise unchanged. */
export function toHex(value: string): string {
  const rgb = parseCssColor(value);
  return rgb ? rgbToHex(rgb) : value;
}
