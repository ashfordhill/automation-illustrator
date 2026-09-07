import { afterEach, beforeEach, expect, test } from "vitest";
import { OAK_PARK_IDS } from "../demos/oakParkInvoice";
import { ColorScheme, ViewMode } from "../workflow/catalogs";
import { LS_WORKFLOW } from "./persistence";
import { useStore } from "./store";

function resetSession() {
  localStorage.clear();
  const s = useStore.getState();
  s.resetDemo();
  s.setView(ViewMode.Before);
  s.setPresent(false);
  s.select(null);
  s.setHelp(false);
  s.cancelReplace();
  s.clearImportError();
  s.closeBoardModes();
  s.setColorScheme(ColorScheme.Light);
  s.setSoundEnabled(false);
}

beforeEach(() => {
  resetSession();
});

afterEach(() => {
  resetSession();
});

test("lengthening a Path condition does not mutate saved Node positions (CX-05)", () => {
  const before = useStore.getState().workflow.nodes.map((n) => ({
    id: n.id,
    x: n.position.x,
    y: n.position.y,
  }));
  useStore.getState().updateEdge(OAK_PARK_IDS.gt, {
    label: "invoice amount is greater than fifty thousand dollars",
  });
  const after = useStore.getState().workflow.nodes;
  for (const n of before) {
    const live = after.find((x) => x.id === n.id);
    expect(live?.position).toEqual({ x: n.x, y: n.y });
  }
  const raw = localStorage.getItem(LS_WORKFLOW);
  expect(raw).toBeTruthy();
  const saved = JSON.parse(raw!) as { nodes: Array<{ id: string; position: { x: number; y: number } }> };
  for (const n of before) {
    expect(saved.nodes.find((x) => x.id === n.id)?.position).toEqual({ x: n.x, y: n.y });
  }
});
