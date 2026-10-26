/**
 * Human accessories. Robots never wear them.
 * Which items a Human wears is per lane, on the look book (looks.ts).
 *
 * To add one:
 * 1. Add a value to AccessoryKind in catalogs.ts.
 * 2. Append a row here (label + slot).
 * 3. Draw the figure mark and the editor glyph in board/tiles/accessoryMarks.tsx.
 *
 * Face and hand each keep a single accessory. Picking another in the same slot replaces it.
 */
import { AccessoryKind, type AccessoryKind as AccessoryKindT } from "./catalogs";

export const AccessorySlot = {
  Face: "face",
  Hand: "hand",
} as const;
export type AccessorySlot = (typeof AccessorySlot)[keyof typeof AccessorySlot];

export type AccessoryDef = {
  kind: AccessoryKindT;
  label: string;
  /** Spoken name when it should be longer than the button label. */
  ariaLabel: string;
  slot: AccessorySlot;
};

export const ACCESSORIES: readonly AccessoryDef[] = [
  {
    kind: AccessoryKind.Sunglasses,
    label: "AR Vision",
    ariaLabel: "AR Vision",
    slot: AccessorySlot.Face,
  },
  {
    kind: AccessoryKind.Tablet,
    label: "Tablet",
    ariaLabel: "Tablet",
    slot: AccessorySlot.Hand,
  },
  {
    kind: AccessoryKind.Scanner,
    label: "Scanner",
    ariaLabel: "Barcode scanner",
    slot: AccessorySlot.Hand,
  },
];

const BY_KIND = new Map(ACCESSORIES.map((item) => [item.kind, item]));

export function accessoryDef(kind: string): AccessoryDef | undefined {
  return BY_KIND.get(kind as AccessoryKindT);
}

/**
 * Keep known accessories, one per slot (last in the list wins), in catalog order.
 * Unknown strings are dropped here; the schema rejects them before this runs on import.
 */
export function normalizeAccessories(kinds: readonly string[] | undefined): AccessoryKindT[] {
  const lastBySlot = new Map<AccessorySlot, AccessoryKindT>();
  for (const kind of kinds ?? []) {
    const def = accessoryDef(kind);
    if (!def) continue;
    lastBySlot.set(def.slot, def.kind);
  }
  return ACCESSORIES.filter((item) => lastBySlot.get(item.slot) === item.kind).map((item) => item.kind);
}

/** Toggle one accessory. The same slot replaces; a second click removes it. */
export function toggleAccessory(
  current: readonly string[] | undefined,
  kind: AccessoryKindT,
): AccessoryKindT[] {
  const list = normalizeAccessories(current);
  const def = accessoryDef(kind);
  if (!def) return list;
  if (list.includes(kind)) return list.filter((item) => item !== kind);
  const withoutSlot = list.filter((item) => accessoryDef(item)?.slot !== def.slot);
  return normalizeAccessories([...withoutSlot, kind]);
}
