# Improvement 05 — Step select stay-put, chunky view switch

Kickoff for a **fresh** agent **after Improvement 04 is COMPLETE** (wait for 03 as well if 04 has not started: this slice edits `tokens.css` and Step tiles, which 03 also touches). Implement **only** this file.

Contract: `.docs/GOAL.md` (including Amendments). Relay: `.docs/BUILD_PLAN.md` Section 4, `.docs/handoff.md`, `.cursor/rules/agent-handoff.mdc`. Visual refs: `.docs/VISUAL_IMPROVEMENTS.md` entry **2026-09-07 — Step select jump and view switch**. Start from the latest COMPLETE handoff commit with a **clean** tree.

Suggested commit: `feat(improve-05): keep Steps still and chunk the view switch`.  
Evidence: `.docs/evidence/improve-05-chrome/`.

User approved 2026-09-07. Cite that date on GOAL amendments.

---

## 1. Problems

1. Selecting a Step (or merge tile) **nudges it up** ~1 px. Selecting Data does not. User wants Step to behave like Data.
2. Before / After / Both: the selected yellow fill is a smaller sharp rectangle inside the pill. Dark gaps at the outer rounded corners. See [view switch](visual-improvements/2026-09-07-view-switch-fill.png).
3. The control’s hairline is cyan (`--chrome-line: #5ec8e8`). User wants a **chunky** frame (P-01 playful original, not Nintendo assets). Ease-of-use bar: Aseprite — selected vs idle is obvious at a glance, no delicate rings.

---

## 2. Locked decisions

- **No new runtime dependency.** Keep the existing `ViewSwitch` in `Toolbar.tsx` (radiogroup of three buttons). Do not swap in Mantine `SegmentedControl`.
- **Step / merge:** remove `selected ? "translateY(-1px)"`. Lifted-during-drag (`translateY(-3px)` + chunky shadow) stays. Data already omits the select translate — do not add one.
- **Selection ring on tiles** (`--select-ring`, `outlineOffset: 4`) is **out of scope**. Data and Step keep the same ring. This slice is the 1 px jump and the view switch only.
- **View switch only** — do not restyle the whole chrome (toolbar bottom border, inspector, hamburger). `--chrome-line` may remain cyan on those surfaces.
- **Frame:** 3–4 px solid **ink or cream** on the steel bar (`var(--ink)` light / a cream or ice line in dark), **not** `--chrome-line` cyan. Drop `.view-switch-btn.is-on { box-shadow: inset 0 0 0 2px var(--on-yellow) }` — that inset is why the yellow floats inside the cell.
- **Fill:** selected segment paint goes **edge to edge** of that cell, including the outer rounded corner of Before and Both. First button shares the left inner radius; last button shares the right. Unselected cells stay `--chrome-well`. Divider between cells: same ink/cream, 3 px, not cyan.
- **Type:** selected = `--yellow` fill + `--on-yellow` text (keep). Unselected = `--chrome-ink` on well. No extra glow.
- **SH-02 / AQ-04:** size stays at least as large as today (`min-width: 5.4rem`, padding 7×18). Do not shrink hit targets.
- **P-01:** original chunky language. Do not copy Aseprite or Nintendo pixels, chrome, or palettes. Aseprite is the **ease-of-use** reference only (obvious selection, chunky hit edges).
- **Present:** view switch stays visible (P-07). Same fill rules.

---

## 3. GOAL amendments to append (do not edit clauses in place)

Newest last, dated 2026-09-07, “approved by user”:

- **CX-07** — Selecting a Step or Data does not translate the tile. Drag-lift may still raise a tile. Selection remains the existing outline (and selected-tile chrome), not a position change.
- **P-01, SH-01, SH-02** — Before / After / Both uses a chunky ink-or-cream frame (not the cyan hairline). The selected segment’s yellow fill meets the outer radius of that segment.

---

## 4. Root causes (do not “fix” with a paint overlay)

- `src/board/tiles/StepTile.tsx` line ~68: `transform: lifted ? "translateY(-3px)" : selected ? "translateY(-1px)" : undefined`
- Same pattern in `src/board/tiles/MergedStepTile.tsx`
- `src/app/styles/tokens.css` `.view-switch`: `border: 3px solid var(--chrome-line)` + `border-radius: 14px`. Inner buttons have **square** corners, so the well shows through the inner curve of the 3 px rounded border. `.is-on` inset yellow ring shrinks the fill further.

Preferred CSS: put the 3–4 px frame on an outer wrapper; inner track `overflow: hidden` with the same radius minus border width; first/last buttons `border-radius` matching that inner radius (0 on the shared edges). Selected background is the button’s `background`, full padding box.

---

## 5. Tests and evidence

- `npm run build`, `npm run test:unit`, `npm run test:e2e` (toolbar / shell flows).
- Unit: none required unless you extract a class helper. Existing `App.test.tsx` still sees Before / After / Both.
- E2E: view switch still changes lanes; selected radio `aria-checked`. Recapture a toolbar crop if shell specs already screenshot it.
- Evidence (1440×900): `view-switch-before-1440.png` (Before selected, yellow meets left radius, no cyan frame); `step-select-1440.png` (selected Step aligned with its unselected neighbors — no 1 px hop). No GIF required.

---

## 6. Out of scope

- Improvements 03 and 04.
- Global `--chrome-line` restyle, tile `--select-ring`, Path-pull teal, actor packing, insert preview.

---

## 7. Kickoff reminder

If HEAD is not Improvement 04’s COMPLETE commit, or the tree is dirty, **stop**. If 04 is not shipped yet, stop and say so; do not implement on top of 03 alone while 04 is in flight.
