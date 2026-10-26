import { expect, test } from "vitest";
import { AccessoryKind } from "./catalogs";
import { normalizeAccessories, toggleAccessory } from "./accessories";

test("normalize keeps one accessory per slot, catalog order, last wins", () => {
  expect(normalizeAccessories(undefined)).toEqual([]);
  expect(normalizeAccessories([AccessoryKind.Scanner, AccessoryKind.Sunglasses, AccessoryKind.Tablet])).toEqual([
    AccessoryKind.Sunglasses,
    AccessoryKind.Tablet,
  ]);
  expect(normalizeAccessories([AccessoryKind.Tablet, AccessoryKind.Scanner])).toEqual([AccessoryKind.Scanner]);
  expect(normalizeAccessories([AccessoryKind.Sunglasses, AccessoryKind.Sunglasses])).toEqual([
    AccessoryKind.Sunglasses,
  ]);
});

test("toggle replaces the hand slot and removes on a second press", () => {
  const withGlasses = toggleAccessory([], AccessoryKind.Sunglasses);
  expect(withGlasses).toEqual([AccessoryKind.Sunglasses]);
  const withTablet = toggleAccessory(withGlasses, AccessoryKind.Tablet);
  expect(withTablet).toEqual([AccessoryKind.Sunglasses, AccessoryKind.Tablet]);
  const withScanner = toggleAccessory(withTablet, AccessoryKind.Scanner);
  expect(withScanner).toEqual([AccessoryKind.Sunglasses, AccessoryKind.Scanner]);
  expect(toggleAccessory(withScanner, AccessoryKind.Sunglasses)).toEqual([AccessoryKind.Scanner]);
});
