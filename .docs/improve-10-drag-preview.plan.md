# Improvement 10 — insert preview Paths and move cursor

Kickoff for a **fresh** agent **after Improvement 09 is COMPLETE**. Implement **only** this file.

User GIF: `.docs/VISUAL_IMPROVEMENTS.md` entry **2026-09-08 — tile-drag Path preview and move cursor**. Approved in chat 2026-09-08.

Suggested commit: `feat(improve-10): clean insert preview and move cursor`.  
Evidence: `.docs/evidence/improve-10-drag-preview/`.

---

## 1. Problem

Dragging a selected Step or Data is insert-on-Path (NG-02). The **blue dashed band** on the hovered Path follows the real ELK route and is the correct preview.

A second overlay fights it: split stubs plus `ensureOrthogonal` / `orthogonalPolyline` draw a boxy trunk-and-spine rectangle, often onto a sibling Path that shares the same ELK bundle. Incident dotted Paths stay fully inked on the faded origin, so they read as a preview attached to the hole. The default tile cursor is Mantine’s pointer hand, so pickup is not obvious.

## 2. Locked decisions (do not re-open)

- **No new runtime dependency.** No free-form layout. ELK still runs only on drop. Empty drop still cancels.
- **Preview = blue ELK band + landing silhouette + neighbor gap.** Do not draw split stubs, and do not use the right-angle fallback as the insert preview. The blue band is the existing ELK polyline (`layout.routes[id]`), width + dash (CX-07). Hide the hovered Path’s normal stroke while the band is up.
- **Drop targets:** skip Paths that touch the dragged tile (already). Also skip Paths whose ELK route shares that tile’s trunk or inbound merge (same start + first-bend x, or same end + last-bend x). Those bundled siblings are not insert targets.
- **Incident Paths fade** with the origin (~0.28), including bundled siblings. They are not rubber-banded to the ghost.
- **Neighbor ease and silhouette stay** (Improvement 04). Reduced motion still snaps. Pointer ghost stays under the cursor.
- **Cursor:** editable Step/Data tiles use a four-way **move** cursor (chunky SVG, Excalidraw-style), not the pointer hand. Empty paper stays grab-to-pan. `+` / Path tabs stay grab. During `tile-drag` the move cursor follows the pointer (including over the pane). Present and Both do not show the move cursor.
- **Pickup:** pointer-down on an editable tile selects it; dragging still starts after the existing 10 px slop. Root still cannot insert. After may insert on a base Path (Improvement 09). Both stays read-only.
- **Do not** reopen Path-tab glyph, Who-copy, merge, or After `+ Data`.

## 3. GOAL amendments (2026-09-08, approved by user)

- **NG-02, CX-05** — While a selected Step or Data is dragged over a Path, the insert preview is the blue band on that Path’s ELK route plus a landing silhouette and local neighbor gap. Split orthogonal stubs and the right-angle fallback are not the preview. Paths that touch the dragged tile, and Paths that share that tile’s ELK trunk or inbound merge, are not drop targets and fade with the origin. Displayed positions during the gesture are not saved.
- **P-08, CX-07** — Editable Step and Data tiles use a four-way move cursor. Empty paper stays grab-to-pan. During tile-drag the move cursor follows the pointer.

## 4. Work

- `src/board/layout/pathHit.ts` — `incidentPathIds`, `routesShareBundle`, `skipInsertHover`. Unit tests: Oak Park / synthetic fan-out (dragging one child skips both bundled Paths; a disjoint Path remains hittable).
- `src/board/controls/TileChrome.tsx` — use `skipInsertHover`; hit-test Before **and** After; pickup allowed when unselected (select on pointer-down); `disabled` only when not editable or a tab is pulling.
- `src/board/routing/FlowArrow.tsx` — insert hover draws only the blue ELK band; delete stub rendering from this component.
- `src/board/Board.tsx` — `data-tile-drag`, `data-editable`; fade class on incident/bundled Paths; body class `is-tile-dragging` while dragging.
- `src/app/styles/tokens.css` — `--tile-move-cursor` (24×24 SVG, hotspot 12,12, ink with white halo); apply on editable tiles and while `is-tile-dragging`.
- Tests: unit as above; e2e hover shows `.path-insert-band` and **no** `.path-insert-stub`; tile-pickup cursor includes `move`; recapture hover evidence.

## 5. Out of scope

- Rubber-banding incident Paths to the ghost.
- ELK-on-move.
- Changing insert/drop graph rules.
- Path-tab glyph, Who follow, merge redesign.
