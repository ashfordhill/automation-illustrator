# Improvement 04 — insert-on-Path live preview

Kickoff for a **fresh** agent **after Improvement 03 is COMPLETE**. Implement **only** this file. Do **not** reopen polish, Path stroke, on-canvas typing, actor colors, or `+` wedge work.

Contract: `.docs/GOAL.md` (including Amendments). Relay: `.docs/BUILD_PLAN.md` Section 4, `.docs/handoff.md`, `.cursor/rules/agent-handoff.mdc`. Start from Improvement 03’s COMPLETE commit with a **clean** tree.

Suggested commit: `feat(improve-04): preview tile insert on Path while dragging`.  
Evidence: `.docs/evidence/improve-04-insert-preview/`.

User approved 2026-09-07 (planning chat after Improvement 02). Cite that date on GOAL amendments.

---

## 1. Problem

Dragging a selected Step or Data onto a Path already **works** (`insertNodeOnPath` / `store.insertOnPath`, Improvement 02). Hit-testing is fine (`src/board/layout/pathHit.ts`). The freeze is **after drop**: the document mutates, then one ELK pass re-packs the whole lane, so the tile appears to teleport.

During the drag there is only a pointer ghost and a thicker dashed overlay on the hovered Path. Neighbors do not make a gap. The user cannot see where the tile will land until ELK finishes.

---

## 2. Locked decisions (do not re-open)

- **Do not run ELK on pointer move.** One `insertOnPath` + one layout pass on **drop**, same as today. Empty drop still cancels (`interaction → idle`, no commit).
- **Do not call `insertNodeOnPath` until pointer-up on a hovered Path.** Preview is display-only. Saved JSON, undo, and `position` hints are unchanged until that commit.
- **No new runtime dependency.**
- **NG-02** still forbids free-form canonical layout. Local neighbor easing is a **gesture overlay**, not a write to the document.
- **Graph rules unchanged:** condition stays on S→T; T→U unlabeled; root cannot insert; drop on a Path that already touches the tile is skipped (existing `skipEdge`); After Before-origin insert is rejected at drop (notice, no commit). After still has no insert-on-Path (Before only, same as 02).
- **CX-07:** hovered Path highlight stays width + dash (already in `FlowArrow`); do not switch to color-only. Gap + silhouette are extra shape cues.
- **CX-06:** reduced motion skips neighbor easing and Path morph; still show highlight, split stubs, and landing silhouette (snap). Drop still uses existing modest ELK interpolation (200 ms) unless reduced motion.
- **Present / Both:** no tile drag (already gated).
- **Do not compact the dragged tile’s old neighborhood during the drag.** Old-slot collapse is ELK’s job on drop. Fade the origin tile so it reads as picked up.
- **Do not implement Path `−`, free-form layout, nested unmerge, or After-only insert.**

---

## 3. GOAL amendments to append (do not edit clauses in place)

Newest last, dated 2026-09-07, “approved by user”:

- **NG-02, CX-05** — While a selected Step or Data is dragged over a Path, the board may show a local insert preview (split Path, landing gap, S and T eased along that run). Displayed positions during the gesture are not saved. Drop still commits `insertNodeOnPath` and then the derived ELK layout; empty drop cancels.

---

## 4. Preview model

Let `T_drag` be the dragged Node, `P` the hovered Path with ends `S` and `U` (source / target). `T_drag` is never `S` or `U` (hit-test skips incident Paths).

While `interaction.kind === "tile-drag"` and `hoverEdgeId` is set:

1. **Pointer ghost** — keep the existing portal ghost under the cursor (`TileChrome` `.tile-drag-ghost`).
2. **Origin fade** — the RF node for `T_drag` at its ELK slot goes to ~0.28 opacity (pointer-events already captured on the chrome). Do not hide it completely (CX-07: the hole is visible).
3. **Landing silhouette** — a same-size, low-opacity outline of `T_drag`’s tile type, centered on a **gap** on `P` (see geometry). Not a second live clone of Who/task content; a cream rounded rect with the chunky border is enough. `aria-hidden`.
4. **Path split** — hide or suppress the original `P` stroke (keep hit area). Draw two orthogonal stubs: `S-out → gap-left` and `gap-right → U-in`. Stubs follow the existing ELK polyline, truncated at the gap. Condition chip stays on the **S-side** stub (matches S→T after drop).
5. **Neighbor ease** — apply a CSS/SVG translate to **only** `S` and `U` (and their attached handles, which ride the node). Push them apart along the dominant axis of `P`’s longest mid segment (almost always +x / −x for `elk.direction: RIGHT`). Magnitude: about half a tile width plus `TILE_GAP/2` so the silhouette fits without overlapping `S`/`U`. Clamp so they do not collide with other tiles; if the clamp would overlap, skip the ease and only show the split + silhouette.
6. **Hover change** — when `hoverEdgeId` changes, previous `S`/`U` snap back; new pair eases. When hover is `null`, no split, no ease, ghost only.
7. **Drop** — `insertOnPath` as today; clear overlay; ELK + `useAnimatedLayout` interpolate to the real packed lane (origin neighborhood contracts; `T_drag` appears between `S` and `U`).

Geometry helper (put next to `pathHit.ts`, e.g. `insertPreview.ts`, framework-free):

```ts
export type InsertPreviewGeom = {
  gap: Rect;                 // landing box, integer px, flow coords
  leftStub: Point[];         // route from S port to gap-left
  rightStub: Point[];        // route from gap-right to U port
  shiftS: Point;             // visual translate for S (often {x: -dx, y: 0})
  shiftU: Point;             // visual translate for U
};
export function insertPreviewGeom(
  layout: LaneLayout,
  edgeId: string,
  tile: { w: number; h: number },
  tileGap?: number,          // default TILE_GAP
): InsertPreviewGeom | null;
```

Place the gap on `longestMidSegment(route)`, centered on that segment. Horizontal run: gap width = `tile.w`, height = `tile.h`, vertically centered on the segment. Vertical run (rare): swap. Stubs are the original route points up to the cut, plus a point on the gap face.

Unit-test: Oak Park / a 3-node chain — gap does not intersect `S` or `U` rects; stubs are orthogonal; `shiftS.x <= 0`, `shiftU.x >= 0` on a rightward Path; `null` when the route is missing.

---

## 5. Wiring

- `src/board/layout/insertPreview.ts` + `insertPreview.test.ts` (pure).
- `src/board/routing/FlowArrow.tsx` — if this edge is the insert hover, render stubs instead of the full route; keep the existing wide dashed hover band **behind** the stubs (CX-07). Chip follows the left stub / `labels[id]` if it still sits on the leftover S-side.
- `src/board/Board.tsx` — when `tile-drag` + hover, apply `transform: translate(shift)` on RF nodes `S` and `U` only (style on the node, not by writing `position`). Do not mark those nodes `dragging` in RF. `T_drag` gets the fade class.
- `src/board/controls/TileChrome.tsx` — keep pointer-capture drag / `hitPathId` / drop. Add the landing silhouette portal in **flow coordinates** (React Flow `ViewportPortal` or a node-layer overlay), not screen-fixed, so zoom/pan stay correct.
- `src/app/styles/tokens.css` — `.tile-insert-silhouette`, `.tile-drag-origin-fade`, `.path-insert-stub`.
- `src/app/components/CanvasHelper.tsx` — one line: “Drop on a Path to insert. Neighbors make a gap.” Do not mention Arrow.

Do **not** change `insertNodeOnPath` unless a preview-only helper needs to share skip rules (keep skip in `TileChrome.skipEdge`).

---

## 6. Tests

- `npm run build`, `npm run test:unit`, `npm run test:e2e`.
- Unit: `insertPreviewGeom` as in §4; existing `insertNodeOnPath` tests still pass (document unchanged by preview).
- E2E: dedicated drag is still hard in Playwright; add what you can:
  - `data-insert-preview="true"` on the lane host while hover is set (set from store in tests via a small helper, or skip if you cannot synthesize hover without a flaky drag). Prefer a unit/component assertion over a flaky Playwright drag.
  - Existing insert unit coverage stays the contract for drop.
- If you add an e2e drag, wait for `data-layout="ready"` after drop (same as `+ Step`).

Evidence (1440×900):

- `insert-hover-gap-1440.png` — Oak Park Before; a non-incident tile in-drag over a mid Path; split stubs, silhouette in the gap, `S`/`U` eased, origin faded, pointer ghost visible.
- `insert-drop-after-1440.png` — after drop; tile between the two ends; condition on S→T; layout `ready`.
- `insert-cancel-1440.png` — empty drop; graph identical to pre-drag.

---

## 7. Out of scope

- ELK-on-move, live `insertNodeOnPath`, After insert-on-Path, Path `−`, polish from Improvement 03.

---

## 8. Kickoff reminder

If HEAD is not Improvement 03’s COMPLETE commit, or the tree is dirty, **stop**. If S/U transforms desync handles from stubs, fix by translating the same `shift` in stub coordinates (add shift to stub endpoints) rather than calling ELK.
