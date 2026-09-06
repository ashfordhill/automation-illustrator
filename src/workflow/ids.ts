/**
 * Short unique ids for new actors, tiles, and Paths.
 * Used by state/store.ts and demos/oakParkInvoice.ts.
 */
import type { IdPrefix } from "./catalogs";

/** `s_ab12cd34`-style id; prefix comes from IdPrefix so kinds stay greppable. */
export function nid(prefix: IdPrefix): string {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

/** Snapshot a workflow (or any JSON-safe value) onto the undo stack. */
export function clone<T>(value: T): T {
  return structuredClone(value);
}
