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
