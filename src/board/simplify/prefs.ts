/**
 * View (word-web) prefs (Improvement 56 / 57 / 60). Not part of the workflow document.
 * Hide data and zoom-out LOD are withdrawn.
 */

export type SimplifyPrefs = {
  hideVisuals: boolean;
};

export const DEFAULT_SIMPLIFY_PREFS: SimplifyPrefs = {
  hideVisuals: false,
};

export function simplifyMenuActive(prefs: SimplifyPrefs): boolean {
  return prefs.hideVisuals;
}

export function applySimplifyPatch(
  current: SimplifyPrefs,
  patch: Partial<SimplifyPrefs>,
): SimplifyPrefs {
  return { hideVisuals: patch.hideVisuals ?? current.hideVisuals };
}

export function parseSimplifyPrefs(raw: unknown): SimplifyPrefs {
  if (raw == null || raw === "") return { ...DEFAULT_SIMPLIFY_PREFS };
  let value: unknown = raw;
  if (typeof raw === "string") {
    try {
      value = JSON.parse(raw);
    } catch {
      return { ...DEFAULT_SIMPLIFY_PREFS };
    }
  }
  if (!value || typeof value !== "object") return { ...DEFAULT_SIMPLIFY_PREFS };
  const rec = value as Record<string, unknown>;
  return applySimplifyPatch(DEFAULT_SIMPLIFY_PREFS, {
    hideVisuals: rec.hideVisuals === true,
  });
}

/** Word-web is on only while View is pressed. */
export function isSimplified(prefs: SimplifyPrefs): boolean {
  return prefs.hideVisuals;
}
