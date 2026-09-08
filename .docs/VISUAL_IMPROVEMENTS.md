# Visual improvement log

Append-only history of pictures and GIFs the user sent while reviewing the board. Copies live in [`visual-improvements/`](visual-improvements/). Agents: `.cursor/rules/visual-improvements.mdc`.

Newest last. Issue and resolution stay short. No after-screenshots for gestures.

## Template

```markdown
## YYYY-MM-DD — <short title>

- Issue: <one or two sentences>
- Resolution: Planned for Improvement NN | Shipped in `<commit subject>`
- Attachments: [label](visual-improvements/YYYY-MM-DD-slug.ext)
```

---

## 2026-09-07 — selected-only X

- Issue: Deletion should be an X on the selected tile only — no neighbor pick, no red outline (selection is also for `+`).
- Resolution: Shipped in `feat(improve-02): add merge tile type and tile drag`.
- Attachments: [delete X option B](visual-improvements/2026-09-07-delete-x-option-b.png)

## 2026-09-07 — plus pull, Who card, Data tile, Path-pull tab

- Issue: `+` pull is a green taffy blob; Dana’s role chip is a stretched empty box; Data type sits high in the pill; Path-pull tab is dull blue with a “fart” glyph.
- Resolution: Planned for Improvement 03 (scrim + wedge, packed Who/Data, teal Path-pull + new glyph). Insert-on-Path freeze is Improvement 04.
- Attachments: [plus pull](visual-improvements/2026-09-07-plus-pull.gif) · [Dana Who](visual-improvements/2026-09-07-dana-who-card.png) · [Data tile](visual-improvements/2026-09-07-data-tile.png) · [Path-pull tab](visual-improvements/2026-09-07-path-pull-tab.png)

## 2026-09-07 — Step select jump and view switch

- Issue: Clicking a Step nudges it up; Data stays put. Before/After/Both selected fill is a yellow rectangle that misses the rounded frame, with a cyan hairline the user does not want (chunky / Aseprite-easy, original P-01).
- Resolution: Planned for Improvement 05. Step matches Data (no translate on select). View switch gets a chunky ink frame and a fill that meets the outer radius.
- Attachments: [view switch](visual-improvements/2026-09-07-view-switch-fill.png)

## 2026-09-07 — Who dashed ring, Other, merge clutter, zoom

- Issue: Selected Who uses yellow plus a dashed ring. Other prints “Other” on the tile. Merge/Unmerge still clutters After. Wheel zoom jumps; zoom-in often targets empty paper. BEFORE/AFTER corner chips and inspector Remove text are extra chrome.
- Resolution: Planned for Improvement 06 (Who fill-only, trash icon, Other copy, drop lane chips, hamburger dismiss, finer zoom toward the graph). Merge removal is Improvement 07.
- Attachments: [Who Alice](visual-improvements/2026-09-07-who-alice-selected.png) · [wheel zoom](visual-improvements/2026-09-07-wheel-zoom.gif)

## 2026-09-07 — plus taffy, tabs, Path stroke

- Issue: Wedge `+` pull is worse than the old green taffy (keep the dim scrim). Empty-space release lags. Path-pull glyph still wrong. `+`/Path tabs sit on the tile instead of tucked behind. Delete X lifts on hover. Data preview in the `+` fan is smaller than Step. Double-click Path and inspector Dotted/Solid appear to do nothing.
- Resolution: Planned for Improvement 08 (after merge removal). Do not mix into Improvement 07.
- Attachments: [plus submenu](visual-improvements/2026-09-07-plus-submenu.gif)

## 2026-09-07 — plus and Path tabs sit on the tile

- Issue: Selected-tile `+` and Path tabs overlap the right border on top of the tile instead of hanging behind it like `.docs/menu-tab-plus.png`.
- Resolution: Planned for Improvement 08 (tuck both tabs under the tile face).
- Attachments: [tabs overlap](visual-improvements/2026-09-07-plus-tabs-overlap.png)

## 2026-09-08 — tile tabs, select ring, taffy hole

- Issue: `+` and Path tabs sit in the top-right instead of vertically centered on the right edge. Their icons should be slightly larger (X stays the same). The cyan select outline covers the X and the tabs. Pulled `+` taffy has a concave half-circle bite where it leaves the tile.
- Resolution: Planned for Improvement 09 (center the tabs, larger `+`/Path glyphs, shadow selection instead of a ring, solid taffy join).
- Attachments: [tabs and select](visual-improvements/2026-09-08-tile-tabs-select-x.png) · [taffy hole](visual-improvements/2026-09-08-plus-taffy-hole.png)

## 2026-09-08 — tabs on top, pull from under

- Issue: `+` and Path tabs still sit under the tile border. Pulling them out shows a triangular twist and a hard left edge against the tile.
- Resolution: Shipped in `feat(improve-09): sit plus Path tabs on the tile` (tabs on the right edge like X; taffy/string exit from under the face; ghost stays on top).
- Attachments: [tabs under tile](visual-improvements/2026-09-08-tabs-under-tile.png) · [pull twist](visual-improvements/2026-09-08-plus-path-pull-twist.gif)
