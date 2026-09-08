# Improvement 07 — surgical merge removal

Kickoff for a **fresh** agent **after Improvement 06 is COMPLETE**. Implement **only** this file. Merge will come back later as a redesign; this slice **takes it out** so it stops cluttering the board and the codebase.

Contract: `.docs/GOAL.md` (including Amendments). Relay: `.docs/BUILD_PLAN.md` Section 4, `.docs/handoff.md`, `.cursor/rules/agent-handoff.mdc`. The GIF in `.docs/VISUAL_IMPROVEMENTS.md` **2026-09-07 — Who dashed ring, Other, merge clutter, zoom** shows the Unmerge HUD and giant merge tile — that UI goes away here.

Suggested commit: `feat(improve-07): remove merge groups from the product`.  
Evidence: `.docs/evidence/improve-07-no-merge/`.

User approved 2026-09-07. Cite that date on GOAL amendments.

---

## 1. Problem

Merge is clunky (dock, pick, giant tile, Unmerge on the tile and in the inspector). The user will redesign it later. Until then it must not ship in the UI or keep a parallel graph engine warm. **Surgical:** delete merge runtime and chrome; keep the document field so old JSON still parses.

---

## 2. Locked decisions

- **No new dependency.**
- **Schema:** `after.groups` stays in Zod / `WorkflowDoc` as an array. New / Demo / Save write `groups: []`. Do **not** bump the document version.
- **Load / import:** if `groups.length > 0`, **flatten** in the same load path: drop every group, keep member After Who assignments and After-only Steps/Paths. Optional one-line notice: “Merged tiles were unfolded.” Do not run Unmerge animation.
- **Robot Mailroom:** rewrite the fixture with **no** group. After is individual Before-origin Steps (Robot Who where it was merged) plus the existing After-only Step. SH-07 demo IDs stay. Oak Park unchanged.
- **UI gone:** `MergeDock`, merge-pick interaction, Merge / Unmerge keybinds, inspector Unmerge, tile X-as-Unmerge, `MergeGroupNode` / `MergedStepTile` / `MergeWhoColumn` / `mergeFlow.ts`, RF type `mergeGroup`, CanvasHelper Merge/Unmerge chips, two-note merge cue **call sites** (the synthesizer function may remain unused).
- **Projection:** never emit `projectedKind: "group"`. After shows every Step as a normal tile.
- **Graph commands:** delete `merge` / `unmerge` / convexity-for-groups. `insertNodeOnPath` merge-convexity branch goes away (groups are empty). After still cannot remove Before-origin Steps (BA-04 without Unmerge — explain, no Unmerge offer).
- **Scoring:** withdrawn 2026-09-07 (P-07, BA-08). Do not restore the inspector footer or Present “N Steps out of M will become automated…” copy.
- **Tests:** delete or rewrite `src/workflow/merge.test.ts`, `src/state/store.merge.test.ts`, `e2e/merge.spec.ts`. Other specs that click Merge, Unmerge, or `[data-merge-group]` must drop those assertions. Keep Mailroom After as a layout/score story without a giant tile.
- **Past evidence** under `.docs/evidence/11-merge/` and improve-02 merge screenshots stays; do not delete history.
- **Do not** remove After-only Steps, After-only Paths, Who-per-lane, or the After overlay. Only merge groups.

---

## 3. GOAL amendments to append (do not edit clauses in place)

Newest last, dated 2026-09-07, “approved by user”:

- **P-02, P-05, P-07, MG-01..MG-10, BA-04, BA-05, SH-07, SH-14** — Merge / Unmerge is withdrawn from the product until a later redesign. There is no merge dock, no merge tile, no Merge/Unmerge keys. After shows Before-origin Steps individually. Saved documents may still contain `after.groups`; load unfolds them and writes empty groups. Robot Mailroom has no preconfigured merge group.

Also note BA-08 score copy is gone; After still shows Before-origin Steps individually.

---

## 4. Delete / gut (grep `merge`, `Unmerge`, `merge-pick`, `MergeGroup`)

Typical removals (confirm with grep; do not leave dead exports):

- `src/workflow/merge.ts` (+ test)
- `src/app/components/MergeDock.tsx`
- `src/board/nodes/MergeGroupNode.tsx`
- `src/board/tiles/MergedStepTile.tsx`, `MergeWhoColumn.tsx`
- `src/board/layout/mergeFlow.ts`
- `src/state/store.merge.test.ts`
- `e2e/merge.spec.ts`
- Catalog `KeyAction.Merge` / `Unmerge`, `ReactFlowNodeKind.MergeGroup`
- Store `beginMerge`, `confirmMerge`, `unmerge`, `toggleMergeMember`
- Interaction `merge-pick`

Keep: `mergeGroupSchema` + empty `groups: []` in `emptyAfterOverlay`.

---

## 5. Tests and evidence

- `npm run build`, `npm run test:unit`, `npm run test:e2e`
- Unit: load a cloned Mailroom (or a tiny doc with one group) → `groups` empty, members still assigned Robot in After.
- E2E: Mailroom After has no merge dock, no Unmerge, no `[data-merge-group]`; After-only Step still exists; Before-origin X in After still explains (no Unmerge).
- Evidence: `mailroom-after-no-merge-1440.png`, `after-inspector-no-unmerge-1440.png`, `keybinds-no-merge-1440.png`.

---

## 6. Out of scope

- Redesigning merge. After-only create/remove. Improvements 03–06 polish.

---

## 7. Kickoff reminder

If HEAD is not Improvement 06’s COMPLETE commit, **stop**. If flattening old JSON seems to need a schema v3, **stop and ask** — the locked path is unfold-on-load, not a version bump.
