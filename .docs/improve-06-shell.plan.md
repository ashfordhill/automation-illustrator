# Improvement 06 — inspector Who, trash, Other copy, zoom, hamburger

Kickoff for a **fresh** agent **after Improvement 05 is COMPLETE**. Implement **only** this file. Do **not** implement Improvement 07 (merge removal) and do **not** reopen 03–05.

Contract: `.docs/GOAL.md` (including Amendments). Relay: `.docs/BUILD_PLAN.md` Section 4, `.docs/handoff.md`, `.cursor/rules/agent-handoff.mdc`. Pictures: `.docs/VISUAL_IMPROVEMENTS.md` entry **2026-09-07 — Who dashed ring, Other, merge clutter, zoom**.

Suggested commit: `feat(improve-06): quiet Who select trash Other and finer zoom`.  
Evidence: `.docs/evidence/improve-06-shell/`.

User approved 2026-09-07. Cite that date on GOAL amendments.

---

## 1. Problems

1. Selected Who (Alice) is yellow **and** a dashed cyan ring. One cue is enough. Dark theme may want a different fill than yellow. See [Who](visual-improvements/2026-09-07-who-alice-selected.png).
2. Inspector **Remove** is a text button at the bottom. User wants a **trash can** at the **top right** of the Step inspector.
3. Type **Other** still prints “Other” on the tile when Name is empty (and prefixes “Other ” when Name is set). Other exists so the tile text is whatever the user types.
4. Corner chips **BEFORE** / **AFTER** (and the single-lane chip) are redundant with the view switch.
5. Hamburger stays open until a click. It should close when the pointer goes back to the canvas or far from the menu.
6. Mouse-wheel zoom jumps a whole step per notch ([GIF](visual-improvements/2026-09-07-wheel-zoom.gif)). When zoomed way out, zooming in often targets empty paper; user wants zoom-in to head toward the laid-out graph. That is realistic (below).

Merge / Unmerge clutter in the GIF is **Improvement 07**, not this slice.

---

## 2. Locked decisions

- **No new runtime dependency.** Tabler already has `IconTrash`.
- **Who / Type / fat selected:** drop `outline: 2px dashed` on `.inspector-who.is-on`, `.inspector-type.is-on`, and `.inspector-fat.is-on` (they share one rule today). Selected = fill only. `:focus-visible` outline stays for keyboard (CX-07).
- **Who fill:** light theme `--yellow` + `--on-yellow` text (keep). Dark theme: `--cream` fill + `--ink` text (not a second yellow, not a dashed ring). Unselected Who stays the steel well.
- **Trash:** Step inspector header row is `Step` on the left, trash `ActionIcon` on the right (`aria-label` “Remove Step”). Same `removeTarget` as today’s Remove. Same rules: hidden in Both; hidden in After for Before-origin Steps; shown in Before; shown in After for After-only. Data inspector: same top-right trash (“Remove Data”). Do not add trash to Path. Tile X on the board stays.
- **Other on-tile copy:** `stepDisplayLabel(Other, title)` returns `title.trim()` only — never the word “Other”, never `"Other " + title`. Empty Name → empty headline (icon remains). Inspector Type button still says Other. Accessible `nodeCaption` for an unnamed Other Step: `"Step"` (not `"Other"`).
- **Lane chips:** delete `LaneLabel` / the BEFORE·AFTER overlays in `App.tsx` (Both and single-lane). View switch is the only view name. Update `App.test.tsx` (it currently expects `BEFORE` in the host).
- **Hamburger:** controlled Mantine `Menu`. If open, close when the pointer enters a `.board-lane` or when it leaves the union of the hamburger button + dropdown by more than ~40 px. Do not close when moving from the icon onto the dropdown. Esc and item click still close. Inspector hover does not close it.
- **Wheel zoom:** intercept scroll-zoom (RF `zoomOnScroll={false}` + custom wheel, or equivalent). Each mouse-wheel notch multiplies zoom by **~1.08** (finer than the current ~1.2-class jump). Clamp 0.2–2.5 (P-08). Pinch can stay RF default. Double-click still does not zoom.
- **Zoom toward the graph (realistic, not magical):** while **zooming in**, if the pointer is **outside** `LaneLayout.bounds` (flow coords, with ~32 px pad) **or** the laid-out graph occupies less than ~40% of the viewport on both axes, use the **bounds center** as the zoom focal point so empty paper does not become the target. If the pointer is over a Node or Path, keep cursor-centered zoom. Zooming **out** stays cursor-centered. Both view: operate on the focused lane’s layout. Reduced motion: same targeting, no extra tween.
- **P-08** still: selection does not pan/zoom. This wheel behavior is user-driven zoom.

---

## 3. GOAL amendments to append (do not edit clauses in place)

Newest last, dated 2026-09-07, “approved by user”:

- **NA-05, NA-10** — Type Other does not print “Other” on the tile. The tile headline is the Name field (empty Name → no headline). The inspector Type button remains labeled Other.
- **NA-12** — Inspector Node removal is a trash control at the top right of the Step / Data form. It still calls the same remove path as the tile X / Delete (selected Node only).
- **SH-02** — Before / After / Both is named only by the top-bar switch. The board does not show BEFORE / AFTER corner chips.
- **P-08** — Mouse-wheel zoom uses small steps. When zooming in on empty paper while the graph is a small island in the viewport, the focal point is the laid-out graph, not the empty point under the cursor.

---

## 4. Files (likely)

- `src/app/styles/tokens.css` — `.inspector-*.is-on`
- `src/app/inspector/SelectedItemForm.tsx` — header + trash; drop Unmerge is **07**
- `src/workflow/types.ts` — `stepDisplayLabel` / `nodeCaption`; unit `types.test.ts`
- `src/app/App.tsx` — remove `LaneLabel`
- `src/app/App.test.tsx`
- `src/app/components/Toolbar.tsx` — menu dismiss
- `src/board/Board.tsx` — wheel zoom + focal
- e2e inspector / shell / canvas that click Remove or assert BEFORE

---

## 5. Tests and evidence

- `npm run build`, `npm run test:unit`, `npm run test:e2e`
- Unit: Other + empty title → `""`; Other + `"File boxes"` → `"File boxes"` (not `"Other File boxes"`); Email + empty still `"Email"`.
- E2E: inspector has no “Remove” text button; trash is labeled; Who selected has no dashed outline (axe still ok); no `BEFORE` chip; hamburger closes when pointer moves onto the board (best-effort; if Playwright cannot hover-dismiss reliably, unit/component is enough and note it).
- Evidence: `who-selected-1440.png`, `inspector-trash-1440.png`, `other-tile-1440.png` (Other + custom Name, no “Other” word), `no-lane-chip-1440.png`. No after-GIF for zoom.

---

## 6. Out of scope

- Merge / Unmerge / merge dock / Mailroom group (Improvement 07).
- View-switch fill (05), Path stroke (03), insert preview (04).
- Changing tile `--select-ring`.

---

## 7. Kickoff reminder

If HEAD is not Improvement 05’s COMPLETE commit, **stop**. If zoom-toward-bounds fights RF internals, keep finer wheel steps and a simpler rule: “zoom in toward bounds center whenever current zoom &lt; 0.55”; record that fallback in the handoff.
