# Improvement 08 — restore + taffy, tuck tabs, fix Path stroke

Kickoff for a **fresh** agent **after Improvement 07 is COMPLETE**. Implement **only** this file. Do **not** implement or reopen Improvement 07. Do **not** reopen Improvements 03–06 except the defects named here.

User pictures: `.docs/VISUAL_IMPROVEMENTS.md` entries **2026-09-07 — plus taffy, tabs, Path stroke** and **2026-09-07 — plus and Path tabs sit on the tile**. Liked reference: [plus-pull.gif](visual-improvements/2026-09-07-plus-pull.gif) (green taffy, no wedge). Tab draft: [`.docs/menu-tab-plus.png`](menu-tab-plus.png), [`.docs/menu-tab-plus.svg`](menu-tab-plus.svg).

Contract: `.docs/GOAL.md` (including Amendments). Relay: `.docs/BUILD_PLAN.md` Section 4, `.docs/handoff.md`, `.cursor/rules/agent-handoff.mdc`.

Suggested commit: `feat(improve-08): restore plus taffy and fix Path stroke`.  
Evidence: `.docs/evidence/improve-08-plus-chrome/`.

User approved 2026-09-07 (this planning chat). Cite that date on GOAL amendments.

---

## 1. Problems

1. Improvement 03 replaced the green stretchy `+` blob with a triangular **wedge**. The user prefers the **old taffy** ([plus-pull.gif](visual-improvements/2026-09-07-plus-pull.gif)). The dim scrim while the fan is open is good — keep it.
2. Releasing `+` on empty space leaves the fan / scrim up for a beat. This is not a mystery React perf stall. `PlusPullTab.finish` keeps `drag` for `SPRING_MS` (520 ms) so the tab can snap back, and `showFan` stays true while `stretched` is still true. Hide the fan and scrim on pointer-up; the ghost may still spring.
3. Path-pull glyph is still a knot/key, not “pull a string out.” User asked for a **spindle and string**.
4. `+` and Path tabs sit **on** the tile’s right border ([tabs overlap](visual-improvements/2026-09-07-plus-tabs-overlap.png)). They should hang **behind** the tile and peek out, like a pull-tab ([menu-tab-plus](menu-tab-plus.png)).
5. Delete X **lifts** on hover (`translateY(-4px)` + chunky shadow). Color / opacity change only.
6. In the `+` fan, the Data preview thumb is a loose oval (`width: auto`) and reads smaller than the Step thumb (72×44). Same outer box.
7. Double-click a Path, and inspector **Dotted / Solid**, look like no-ops. Document mutation may already run (`e2e/inspector.spec.ts` only checks `aria-pressed`). The canvas stroke must change on that Path. Shared-trunk rule from Improvement 01 stays (solid wins on a shared segment); the unique branch after the split must still change.

---

## 2. Locked decisions (do not re-open)

- **No new runtime dependency.** Custom SVG for the Path tab is allowed (same as today’s `PathKnotIcon`). Tabler if a spindle/yarn icon is already in the installed set and reads clearly at 20 px; otherwise original SVG. P-10 still: no other icon kit.
- **Vocabulary:** Node, Step, Data, Path, condition, stroke. Never “Arrow.”
- **Present / Both:** no chrome, no pull, no stroke toggle (unchanged).
- **`+` click still does nothing.** Pull threshold (36 px), drop-on-preview, After Step-only, keys `1` / `2` unchanged. Do not run ELK during pull.
- **Keep the scrim.** Full-viewport dim, hole punched for the source tile, previews above the scrim. Drop the wedge path and `[data-plus-wedge]`.
- **Restore `taffyPath`** from `8315e52` (`feat(improve-02): add merge tile type and tile drag`): green filled organic ribbon from the rest `+` to the pointer, `--plus` fill, `--line` stroke. Draw taffy whenever the pointer is down on `+` (not only past threshold). Path-pull keeps its dashed string.
- **Empty release:** on pointer-up with no preview hit, dismiss fan + scrim **immediately**. Optional short snap of the `+` ghost back to rest (≤200 ms). Do not leave the “window” (previews + scrim) up for `SPRING_MS`.
- **Tabs tucked behind:** `.tile-pickup` (the opaque tile face) paints **above** `.plus-tab` / `.path-tab`. Tabs peek out the right edge (~16–22 px visible). Two tabs, stacked, still 36×36 hit boxes; the under-tile half is covered by the face. X stays on top of the tile. Reference: menu-tab-plus, not a square sitting on the ink border.
- **X hover:** no translate, no extra lift shadow. Hover / `:focus-visible` may go full opacity and `--minus-active`. Keyboard focus outline stays (CX-07).
- **Path glyph:** spindle (bobbin: two discs + a short shaft) with one thread curving off to the right. Black (`#071c28`) on the existing teal Path-tab fill. Accessible name stays “Pull a Path to an existing Node.”
- **Data preview:** both thumbs use the same 72×44 bordered box. Data’s oval is **centered inside** that box (keep `DataChip`). Do not shrink the Step thumb.
- **Path stroke:** per-Path `dashed` still wins when the source has 2+ outgoing Paths (`edgeIsDotted`). Single outgoing stays solid (PC-02). Double-click the Path **or** its chip, inspector Dotted/Solid, and ToggleDash all toggle **that** Path only. Prove the **drawn** stroke changes (not only the inspector button). If RF `onEdgeDoubleClick` misses the transparent dotted hit path, put the handler on the Path’s hit `BaseEdge`.
- **Do not** change ELK, insert-on-Path preview, or merge (07 owns merge).

---

## 3. GOAL amendments to append (do not edit clauses in place)

Newest last, dated 2026-09-07, “approved by user”:

- **WG-07** — While the `+` tab is pulled, the board still dims behind a scrim (source tile and previews stay undimmed). The connector from the tab to the pointer is the green stretchy taffy (Improvement 02), not a triangular wedge. Releasing on empty space dismisses the fan and scrim immediately (the tab may snap back). Drop rules unchanged.
- **CX-01** — Selected-tile `+` and Path tabs sit behind the tile face and peek from the right edge (pull-tabs). They are not stacked on top of the border.
- **WG-07, AQ-01** — The Path-pull tab glyph is a spindle with a string, not a knot or key. Pull behavior unchanged.

Stroke double-click is already in GOAL (P-08, NA-07/PC-02/PC-03). This slice **fixes** that behavior; do not rewrite those amendments unless the implementer finds a real contract clash — then stop and ask.

---

## 4. Work items

### 4.1 Restore taffy, drop wedge (`TileChrome.tsx`, `tokens.css`)

- Reintroduce `taffyPath` (copy from improve-02; do not invent a new blob).
- Overlay: taffy SVG always while `drag` is live; scrim + previews only while `drag.live && stretched` (or reduced-motion equivalent).
- Delete `wedgePath`, `.plus-wedge`, `data-plus-wedge`.
- `e2e/canvas.spec.ts`: assert `[data-plus-taffy]` (or the taffy path) while pulling; assert **no** `[data-plus-wedge]`. Recapture `plus-wedge-1440.png` is **not** required; new evidence `plus-taffy-1440.png`.

### 4.2 Instant dismiss on empty release

- `showFan` / scrim require `drag.live`.
- On miss: `closeBoardModes()`, clear fan state, optional ≤200 ms ghost snap. No 520 ms overlay linger.
- E2E: pull `+`, release on empty pane, fan and scrim gone within ~250 ms (no `New Step` / `New Data` / `[data-plus-scrim]`).

### 4.3 Tuck `+` and Path tabs

- Tile face `z-index` > tab `z-index` > board. X above the face.
- Peek from the right; both tabs still grab-cursors. After view: `+` still Step-only; Path tab unchanged.
- Evidence: `tabs-tucked-1440.png` (selected Data or Step; tabs behind the ink, peeking).

### 4.4 Path spindle icon

- Replace `PathKnotIcon` drawing (keep the component name or rename to `PathSpindleIcon` and update imports). Ghost during pull uses the same glyph.
- Evidence: `path-tab-1440.png` (overwrite the improve-03 shot is fine if e2e already writes it; also copy under improve-08).

### 4.5 X hover stays put

- `.node-remove-x-btn:hover` / tile X: drop `transform` and the lifted `box-shadow`. Color/opacity only.

### 4.6 Uniform fan thumbs

- `.plus-preview-thumb.is-data` keeps the 72×44 bordered box; center `DataChip`. Step thumb unchanged.
- Evidence: `plus-fan-thumbs-1440.png` (Step and Data cards the same size).

### 4.7 Path stroke actually draws

- Oak Park `e_gt` (dotted, sibling of `e_lt`): inspector Solid and double-click must make **that** Path’s unique segment solid in the DOM (solid `BaseEdge` visible, or no dotted overlay segments on that id). Sibling may stay dotted. Shared trunk may look solid (Improvement 01 rule).
- If the document already flips `dashed` and the inspector button updates but the line does not, fix **FlowArrow** render (remount/key on `dotted`, or hit-target vs overlay). Do not “fix” it by rewriting Split.
- Unit: `toggleSelectedDash` / `updateEdge({ dashed })` still no-op for a lone outgoing Path; two-outgoing toggles only that edge.
- E2E: after Solid on `invoice > $50,000`, assert the canvas Path for `e_gt` is drawn solid (not only `aria-pressed`). Double-click the Path stroke (not just the chip) and assert the toggle.

---

## 5. Tests and evidence

- `npm run build`, `npm run test:unit`, `npm run test:e2e`
- Evidence 1440×900 under `.docs/evidence/improve-08-plus-chrome/`: `plus-taffy-1440.png`, `tabs-tucked-1440.png`, `plus-fan-thumbs-1440.png`, `path-tab-1440.png`, `path-stroke-solid-1440.png` (`e_gt` unique branch solid, `e_lt` still dotted).
- Axe: selected-tile chrome still clean. If tucked tabs fail target-size, widen the peek, do not put the tabs back on top of the border.

---

## 6. Out of scope

- Improvement 07 merge removal (must already be COMPLETE).
- Insert-on-Path preview, ELK, view switch, Who/trash/zoom.
- New Path `−`. Free-form layout.

---

## 7. Kickoff reminder

If HEAD is not Improvement 07’s COMPLETE commit, **stop**. If taffy vs scrim stacking fights the hole-mask, keep both: taffy and previews above the scrim, wedge gone. If stroke looks unchanged only on the shared trunk, still fail the slice unless the unique branch updates — that is the user-visible toggle.
