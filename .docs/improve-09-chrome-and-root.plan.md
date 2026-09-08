# Improvement 09 — tile chrome, Data root, After removal

Kickoff for a **fresh** agent **after Improvement 08 is COMPLETE**. Implement **only** this file.

User pictures: `.docs/VISUAL_IMPROVEMENTS.md` entry **2026-09-08 — tile tabs, select ring, taffy hole**. Approved in chat 2026-09-08.

Suggested commit: `feat(improve-09): center tabs Data root and After remove`.  
Evidence: `.docs/evidence/improve-09-chrome-root/`.

---

## 1. Locked decisions

- **No new runtime dependency.**
- **Roy** fill is `#f4c07a` (honey-apricot). Same hex in `HUMAN_PRESETS` and Oak Park. Mailroom Omar stays `#7eb6f5` (do not reuse the Roy preset, so Omar does not collide with Dana `#f4a06a`).
- **Select:** drop the cyan `outline` / `--select-ring` on Step and Data. Selected tile uses a drop-shadow on `.tile-pickup` (the face wrapper, not `overflow: hidden` on the tile). X, `+`, and Path tabs stay unobscured. Keyboard `:focus-visible` on chrome buttons unchanged. Drag-lift unchanged.
- **Tabs:** `+` and Path sit in a right-edge column **vertically centered** on the tile, 24px apart (same spacing as Improvement 08 so the peek still meets WCAG 2.2 target-size). Peek/tuck (Improvement 08) unchanged. Hit boxes stay 36×36.
- **Icons:** `+` glyph and Path spindle slightly larger; X stays `IconX` size 20.
- **Taffy:** while `+` is pulled, the ribbon joins the tile’s **right edge** with a **flat solid** attach (no origin semicircle). Rounded cap only at the `+` ghost. Scrim hole unchanged.
- **Empty board:** CTA offers **Add Step** and **Add Data**. Either may be the sole root. Data root has no Who. Children still come from `+`. Hide the CTA in Present and Both.
- **Sole Tile:** if the base graph has exactly one Node, X / Delete / inspector trash removes it (including when it is the root). Result is an empty board (actors kept; After extras pruned). One undo restores it. A root with any other **base** Node still cannot be removed.
- **After mirrors Before** for the **shared** graph: After may remove Before-origin Nodes (base updates; Before reflects it). After may insert a Before-origin Tile onto a base Path. After `+` Step is still After-only; `+ Data` stays hidden in After (BA-06). Merge stays withdrawn. Both stays read-only.
- **Demos:** loading a demo copies the fixture into the live board. Edits are allowed in Before/After. Reloading Demo from the hamburger loads a fresh fixture (Save copy / Discard / Cancel). Fixtures in `src/demos/` are never written.

---

## 2. GOAL amendments (2026-09-08, approved by user)

- **WG-01** — Empty-state actions are **Add Step** and **Add Data**.
- **WG-02** — The first Node (Step or Data) is the sole root.
- **WG-06** — The root cannot be removed while other base Tiles remain. The sole remaining Tile may be deleted and returns the empty CTA.
- **BA-03, BA-04** — After may remove Before-origin Nodes; the shared base updates. After-only Steps remain After-only.

---

## 3. Out of scope

- Merge / Unmerge redesign.
- After-only Data.
- Changing After `+` Step into a shared (Before-visible) Step.
