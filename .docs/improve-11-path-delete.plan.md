# Improvement 11 — Path Delete menu and hit pad

User picture: `.docs/VISUAL_IMPROVEMENTS.md` entry **2026-09-08 — Path delete hit and menu**. Approved in chat 2026-09-08.

Suggested commit: `feat(improve-11): delete redundant Paths from the context menu`.  
Evidence: `.docs/evidence/improve-11-path-delete/`.

---

## 1. Problem

A reconverging Path (either circled Path into Jack) is not a bridge: deleting it leaves every Tile reachable from the root. There is no way to remove it. Path strokes are also a thin click target.

## 2. Locked decisions

- **No new runtime dependency.** Menu is Mantine 9 + Tabler trash, same as the hamburger.
- **Reachability, not restitch.** `removePath` drops that Path only. It is allowed iff `validateWorkflow` still passes (every Tile reachable from the root on the base graph and on the After graph). No WG-10 restitch, no pairing preview.
- **Surfaces:** right-click a Path → menu with **Delete** (enabled when allowed, disabled with the reachability explanation otherwise). Delete key does the same when a Path is selected. Inspector still has no Path delete control (NA-12).
- **Present / Both:** no menu, no removal.
- **Hit pad:** React Flow `interactionWidth` on the Path stroke is increased (drawn stroke unchanged). Condition chips stay independent (CX-02).
- **Do not** reopen Improvement 10, Path-tab glyph, Who-copy, or merge.

## 3. GOAL amendments (2026-09-08, approved by user)

- **WG-05, NG-03, NA-12, AQ-01** — A Path may be removed when every remaining Tile is still reachable from the root. Right-click a Path for a menu; Delete is included when that Path may be removed. The Delete key removes that Path when allowed; otherwise it explains that the Path is the only route to a Tile. The inspector still has no Path delete control.
- **CX-02** — Path stroke hit pads are wider so Paths are easier to select; condition chips stay independent hit targets.

## 4. Work

- `src/workflow/commands.ts` — `removePath`, `canRemovePath`; update `MSG.pathRemoval`.
- `src/state/store.ts` — `openPathMenu`, `removePath`; `deleteSelection` on a Path calls `removePath`.
- `src/state/interaction.ts` — `{ kind: "path-menu"; edgeId; x; y }`.
- `src/board/controls/PathContextMenu.tsx` — Mantine menu at the pointer.
- `src/board/Board.tsx` / `FlowArrow.tsx` — `onEdgeContextMenu`, chip context menu, wider `interactionWidth`.
- Tests: diamond / Oak Park reconverge / Mailroom extra; e2e right-click Delete and blocked Delete.
