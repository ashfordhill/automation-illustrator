import { createContext, useContext } from "react";
import { DEFAULT_SIMPLIFY_PREFS, type SimplifyPrefs } from "./prefs";

export type SimplifyView = {
  simplified: boolean;
  prefs: SimplifyPrefs;
  zoom: number;
};

export const SimplifyContext = createContext<SimplifyView>({
  simplified: false,
  prefs: DEFAULT_SIMPLIFY_PREFS,
  zoom: 1,
});

export function useSimplifyView(): SimplifyView {
  return useContext(SimplifyContext);
}
