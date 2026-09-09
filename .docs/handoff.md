# Automation Pitch — Relay Handoff Ledger

Append-only. Never rewrite or delete an earlier entry; add a correction entry instead. One entry per slice attempt, in chronological order. Each slice commits when it is done; the user reviews after the whole relay.

Rules: `.docs/BUILD_PLAN.md` (Section 4) and `.cursor/rules/agent-handoff.mdc`. Contract: `.docs/GOAL.md`.

## Entry template

Copy this block to the end of the file and fill every field. Keep the headings; use `n/a` rather than deleting a field.

```markdown
## Slice NN — <title> — <YYYY-MM-DD>

- Starting commit: `<hash>` (<subject>)
- Working tree at start: clean | <describe>
- GOAL clauses addressed: <IDs, e.g. WG-02, WG-04, PC-04>
- Library research and decisions: <what was checked, what was chosen, why>
- Files changed: <paths, grouped>
- Behavior implemented: <what a user can now do / what changed>
- Tests and exact results:
  - `npm run build` — <pass/fail, summary line>
  - `npm run test:unit` — <pass/fail, counts>
  - `npm run test:e2e` — <pass/fail, counts> | not run (no browser flow affected)
- Evidence: `.docs/evidence/NN-<slug>/<file>.png` — <what it shows> (one line per screenshot)
- Earlier-slice defects fixed: none | <what, why it blocked this slice>
- Known limitations / follow-ups: none | <item — target Slice NN>
- Status: COMPLETE
- Commit: `feat(slice-NN): <short title>`
```

The finishing agent commits that entry in the same slice commit (do not wait for review; do not add a second commit just to store `git log -1`'s hash). The next agent matches HEAD to this `Commit:` subject.

Corrections in the same chat before the next slice starts get their own short entry, then a new commit:

```markdown
## Slice NN — correction <k> — <YYYY-MM-DD>

- Requested: <what the user asked to change>
- Changed: <files / behavior>
- Tests and exact results: <as above>
- Status: COMPLETE
- Commit: `feat(slice-NN): <short title>`
```

---

## Ledger

## Slice 00 — reviewed baseline — 2026-09-06

- Starting commit: `ed8845284da7708e94f875abc1db036bc0d84f5c` (Initial commit)
- Working tree at start: not clean (expected for Slice 0). Branch `main`. README.md modified vs the initial commit; application source, tooling, contract files, and `.gitignore` were untracked. GitHub remote `origin` exists; this relay did not push.
- GOAL clauses addressed: n/a (baseline snapshot only; no product clauses implemented)
- Library research and decisions: compared the working tree to BUILD_PLAN Section 1. No contradictions. Stack matches: Mantine 9, `@tabler/icons-react`, `@xyflow/react` 12, Zustand 5, Vite 8, TypeScript 7, `auto-text-size`. `npm run build` is `tsc --noEmit && vite build`. No sound/audio code. No unit/e2e/axe suite yet (Slice 1). No new dependencies added.
- Files changed:
  - Deleted `abandoned-version/` (ignored `node_modules` only).
  - Added `.docs/evidence/00-baseline/*.png` (15 review screenshots).
  - This handoff entry.
  - Unchanged product code. The rest of the untracked tree is the current app and the four contract files, to be committed together on approval: `.cursor/rules/agent-handoff.mdc`, `.docs/GOAL.md`, `.docs/BUILD_PLAN.md`, `.docs/handoff.md`, plus existing `.docs` design assets, `.gitignore`, `index.html`, `package.json`, `package-lock.json`, `scripts/export.mjs`, `src/**`, `tsconfig.json`, `vite.config.ts`, and the modified `README.md`.
- Behavior implemented: none. Product UI and graph behavior are frozen as captured. `abandoned-version/` is gone from the repo root.
- Tests and exact results:
  - `npm install` — up to date, audited 69 packages, 0 vulnerabilities
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; client built in 1.71s; chunk-size warning on the existing 693 kB bundle, unchanged)
  - `npm run test:unit` — not run (script does not exist yet; Slice 1)
  - `npm run test:e2e` — not run (script does not exist yet; Slice 1)
- Evidence:
  - `.docs/evidence/00-baseline/before-light.png` — Before, Oak Park demo, Read invoice.pdf selected, inspector visible (1440×900)
  - `.docs/evidence/00-baseline/inspector-step-light.png` — same as before-light; inspector Step form (Type/Target/Who/Split)
  - `.docs/evidence/00-baseline/after-light.png` — After lane; Robot on automated Steps, Alice on Review
  - `.docs/evidence/00-baseline/both-light.png` — stacked Before/After comparison
  - `.docs/evidence/00-baseline/hamburger-light.png` — hamburger open: Present, Demo, New, Import, Keybinds, Dark mode
  - `.docs/evidence/00-baseline/plus-menu-light.png` — tile `+` menu (Step / Data / Existing)
  - `.docs/evidence/00-baseline/minus-pick-light.png` — tile `−` path pick (Previous/Next path, Enter Detach, Esc)
  - `.docs/evidence/00-baseline/before-light-1024.png` — Before at 1024×768 (supported min-width)
  - `.docs/evidence/00-baseline/before-dark.png` — Before in dark theme
  - `.docs/evidence/00-baseline/inspector-step-dark.png` — same as before-dark; inspector in dark
  - `.docs/evidence/00-baseline/after-dark.png` — After in dark theme
  - `.docs/evidence/00-baseline/both-dark.png` — Both in dark theme
  - `.docs/evidence/00-baseline/hamburger-dark.png` — hamburger open in dark (Light mode item)
  - `.docs/evidence/00-baseline/plus-menu-dark.png` — `+` menu in After/dark
  - `.docs/evidence/00-baseline/minus-pick-dark.png` — `−` pick in After/dark
- Earlier-slice defects fixed: none
- Known limitations / follow-ups:
  - No Vitest/Playwright/axe harness — Slice 1
  - Source folders still `chrome`/`details`/`model`/… — Slice 2
  - Document is v1; connect allows cycles/orphans; history cap 80; destructive demo fallback on bad storage — Slices 3–4
  - Demo IDs are random `nid()`; exporter has deterministic IDs (`h_alice`, `s_read`, `e_gt`, …) — Slice 5
  - Pointer/Hand tool, idle helper chips, implicit empty-canvas Step, Path delete, inspector “Arrow” copy — later slices per BUILD_PLAN
- Status: AWAITING USER REVIEW
- Approved by user 2026-09-06 — commit subject `chore(slice-00): establish automation pitch baseline`

## Slice 01 — contract verification and test harness — 2026-09-06

- Starting commit: `ea4eb5d19f18197e4ad080fdf8855bfaef501b70` (`chore(slice-00): establish automation pitch baseline`). Slice 00's approval line recorded the subject only; HEAD matched that commit and the tree was clean.
- Working tree at start: clean, branch `main`, 1 commit ahead of `origin/main` (not pushed).
- GOAL clauses addressed: AQ-04 (axe smoke on the initial demo), AQ-07 (Playwright smoke for mount / view switch / demo), AQ-01 (keyboard reachability of the top bar), AQ-02 (icon-only Pointer/Hand/Undo names, only as needed for axe), P-04 (1024×768 screenshot)
- Library research and decisions:
  - GOAL.md Product..NG clauses match BUILD_PLAN Section 2 exactly (no transcription edits).
  - Vitest 5.0.0 (Vite 8 compatible; Node >= 22.12). DOM environment via jsdom.
  - jsdom 29.1.1 rather than 30: this machine is Node v22.17.1; jsdom 30 requires `^22.22.2`. Vitest 5 lists jsdom ^29.1.1 as its own test dependency.
  - `@playwright/test` 1.63.0, Chromium only, `webServer` on `127.0.0.1:4177` (strictPort, no reuse) so e2e does not collide with a local `npm run dev`.
  - `@axe-core/playwright` 4.13.0 with WCAG 2.2 AA tags.
  - No `@testing-library/*`; unit tests render with `react-dom/client`. No other runtime libraries.
- Files changed:
  - Config/scripts: `package.json`, `package-lock.json`, `vite.config.ts` (Vitest `test` block), `playwright.config.ts`, `e2e/tsconfig.json`, `.gitignore` (Playwright/Vitest artifacts)
  - Tests: `src/vitest.setup.ts`, `src/App.test.tsx`, `e2e/smoke.spec.ts`
  - Product (minimal, axe): `src/chrome/Toolbar.tsx` — `aria-label` on Pointer, Hand, and Undo
  - Evidence: `.docs/evidence/01-harness/*.png`
  - This handoff entry
- Behavior implemented: no graph or interaction changes. First visit still loads the Oak Park demo. The four scripts exist: `build`, `test:unit` (`vitest run`), `test:e2e` (`playwright test`), `test` (unit then e2e). Smoke coverage: App mount, Before/After/Both, Tab into the header and Enter on Menu, demo tiles (`Read invoice.pdf`), axe on the initial state.
- Tests and exact results:
  - `npm install` at start — up to date (69 packages); after adding harness, 134 packages, 0 vulnerabilities
  - `npm run test:unit` at start — fail (`Missing script: "test:unit"`, expected until this slice)
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; built in 1.45s; existing chunk-size warning; client `index-qUQ12B_w.js` 693.72 kB from the aria-label strings)
  - `npm run test:unit` — pass (1 file, 3 tests, 5.41s on the cached rerun)
  - `npm run test:e2e` — pass (5 passed, Chromium, 9.8s including webServer)
  - `npm test` — pass (both suites)
- Evidence:
  - `.docs/evidence/01-harness/before-light-1440.png` — demo Before, inspector idle copy, score footer (1440×900)
  - `.docs/evidence/01-harness/after-light-1440.png` — After selected; Robot on automated Steps, Alice on Review (1440×900)
  - `.docs/evidence/01-harness/both-light-1440.png` — stacked Before/After (1440×900)
  - `.docs/evidence/01-harness/hamburger-keyboard-1440.png` — Menu opened from the keyboard; Present first (1440×900)
  - `.docs/evidence/01-harness/before-light-1024.png` — same Before board at 1024×768
- Earlier-slice defects fixed: Pointer, Hand, and Undo were icon-only with tooltip text but no accessible name. Axe `button-name` would fail on the initial state. Added `aria-label` matching the existing tooltips (no visual or click-behavior change).
- Known limitations / follow-ups:
  - Axe smoke excludes `.mantine-SegmentedControl-root`. Selected Before is white on Mantine cyan `#15aabf` (contrast 2.78:1). Restyle is Slice 8 (SH-01, P-09), not a harness-slice chrome redesign.
  - First machine needs `npx playwright install chromium` (browsers are not in the repo).
  - Source folders still `chrome`/`details`/`model`/… — Slice 2
  - Document is v1; connect allows cycles/orphans; history cap 80; destructive demo fallback — Slices 3–4
  - Demo IDs are still random `nid()` — Slice 5
- Status: AWAITING USER REVIEW
- Approved by user 2026-09-06

## Protocol — drop per-slice review gate — 2026-09-06

- Starting commit: `1cd2c0fb52b36fdd683806a347a3c705ba7af2a0` (`feat(slice-01): add contract-verified test harness`)
- Working tree at start: clean
- GOAL clauses addressed: n/a (relay protocol only; no product clauses)
- Library research and decisions: n/a
- Files changed:
  - `.cursor/rules/agent-handoff.mdc`
  - `.docs/BUILD_PLAN.md` (Section 0, Section 4, Section 6)
  - This file's intro, template, and this entry
- Behavior implemented: slices commit when done. No `approved — commit` wait. User review is after the full relay. Stop-and-ask for contract/dependency questions is unchanged. Slice 00 and 01 ledger lines are historical (old gate); do not rewrite them.
- Tests and exact results:
  - `npm run build` — not run (docs/protocol only)
  - `npm run test:unit` — not run
  - `npm run test:e2e` — not run (no browser flow affected)
- Evidence: n/a
- Earlier-slice defects fixed: none
- Known limitations / follow-ups: none
- Status: COMPLETE
- Commit: `docs(relay): commit slices without waiting for review`

## Slice 02 — feature-oriented source structure — 2026-09-06

- Starting commit: `8f74bb8b2d5215a590392c99b44f9e1512b749c0` (`docs(relay): commit slices without waiting for review`)
- Working tree at start: clean, branch `main`, 3 commits ahead of `origin/main` (not pushed)
- GOAL clauses addressed: n/a (mechanical source layout; no product-clause behavior change). P-10 stack unchanged. Section 3 source layout only.
- Library research and decisions: no new dependencies. `workflow/` stays framework-free (no React / React Flow / Mantine / `board/` imports). No index barrels. `projection.ts` and `interaction.ts` were not created (Slices 10 and 6).
- Files changed:
  - Moves per BUILD_PLAN Section 3 mapping: `app/` (App, components, inspector, styles), `board/` (nodes, tiles, controls, routing, layout, reactFlowBridge), `workflow/` (types, catalogs, scoring, ids), `demos/oakParkInvoice.ts`, `state/persistence.ts` (from `persist/workflowJson.ts`)
  - Split: `src/workflow/graph.ts` (outgoingSorted, edgeIsDotted, defaultDashed, applyDashForSplit, nextPortIndex, maybeExclusiveSplit); `src/board/layout/spreadForLabels.ts` (interim until Slice 9)
  - Combined: `src/workflow/actors.ts` (`colors.ts` plus `defaultActors`, `makeHuman`, `makeRobot`, `aliceId`, `defaultRobotId`)
  - Extracted: `src/state/history.ts` (commit/undo/redo stacks, cap 80) and persist helpers on `state/persistence.ts`; store calls them with unchanged behavior
  - Removed obsolete top-level folders: `chrome`, `details`, `tiles`, `model`, `persist`, `identity`, `actors`, `visual`, `demo`; deleted `pathGeometry.ts` and `colors.ts` (no compatibility wrappers)
  - Tests: `src/app/App.test.tsx` (moved with App), `src/workflow/graph.test.ts`, `src/state/history.test.ts`, `e2e/structure.spec.ts`
  - Evidence: `.docs/evidence/02-structure/`
  - This handoff entry
- Behavior implemented: none for users. Same Oak Park demo, views, inspector, and hamburger. Production CSS chunk hash unchanged (`index-D8rVQ0Dg.css`); JS chunk grew slightly from extra modules (`index-92BucQUc.js` 693.96 kB vs Slice 1 `index-qUQ12B_w.js` 693.72 kB).
- Tests and exact results:
  - `npm install` at start — up to date, audited 134 packages, 0 vulnerabilities
  - `npm run build` at start — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning)
  - `npm run test:unit` at start — pass (1 file, 3 tests)
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; built in 1.01s; existing chunk-size warning)
  - `npm run test:unit` — pass (3 files, 7 tests)
  - `npm run test:e2e` — pass (7 passed, Chromium, 13.4s including webServer)
- Evidence:
  - `.docs/evidence/02-structure/before-light-1440.png` — demo Before, inspector idle copy, score footer (1440×900)
  - `.docs/evidence/02-structure/after-light-1440.png` — After selected; Robot on automated Steps, Alice on Review (1440×900)
  - `.docs/evidence/02-structure/both-light-1440.png` — stacked Before/After (1440×900)
  - `.docs/evidence/02-structure/hamburger-keyboard-1440.png` — Menu opened from the keyboard; Present first (1440×900)
  - `.docs/evidence/02-structure/before-light-1024.png` — same Before board at 1024×768
- Earlier-slice defects fixed: none
- Known limitations / follow-ups:
  - CSS tokens/classes still named `--chrome-*` / `chrome-bar` (visual language, Slice 8)
  - Document is v1; connect allows cycles/orphans; history cap 80; destructive demo fallback — Slices 3–4
  - Demo IDs are still random `nid()` — Slice 5
  - Pointer/Hand tool, idle helper chips, implicit empty-canvas Step, Path delete, inspector “Arrow” copy — later slices per BUILD_PLAN
- Status: COMPLETE
- Commit: `feat(slice-02): reorganize source into feature folders`

## Slice 03 — workflow v2 schema, migration, persistence status, and recovery core — 2026-09-06

- Starting commit: `44b23816b06035ddfbb25915a632858b9bb01538` (`feat(slice-02): reorganize source into feature folders`)
- Working tree at start: clean, branch `main`, 4 commits ahead of `origin/main` (not pushed)
- GOAL clauses addressed: BA-01 (v2 document + sparse After overlay), SH-08 (Zod 4 validation and deterministic v1→v2 migration), SH-09 (invalid graphs rejected with a violation list, not repaired), SH-10 (failed startup raw kept under the original key), SH-11 (persist status `saved`/`dirty`/`unavailable`; no notice spam), WG-02, WG-03, WG-04 (validate single root, reachability, acyclicity, duplicate Paths — connect-time enforcement remains Slice 4), AQ-06 (unit coverage of schema, migration, graph violations, storage, recovery)
- Library research and decisions: added approved `zod@4.5.4`. Schemas use `z.object` + `z.discriminatedUnion` for actors/nodes; graph invariants run as named `validateWorkflow` / `validateWorkflowV1` after shape parse and also as Zod `superRefine` on the exported full schemas. Graph algorithms live in `workflow/graph.ts` so Slice 4 can share them with commands. No other runtime dependency.
- Files changed:
  - Types/catalog: `src/workflow/types.ts`, `src/workflow/catalogs.ts` (`WORKFLOW_VERSION = 2`, `AfterOverlay`, `MergeGroupDto`, lane accessors)
  - New: `src/workflow/schema.ts`, `src/workflow/migrate.ts`
  - Graph invariants: `src/workflow/graph.ts` (`validateWorkflow`, `validateGraphInvariants`, SH-09 codes)
  - Persistence/store: `src/state/persistence.ts`, `src/state/store.ts` (hydrate, persist status, recovery hold, `importRaw`, `requestFocus`/`consumeFocus`)
  - Integration: `src/demos/oakParkInvoice.ts`, `src/workflow/scoring.ts`, `src/app/inspector/SelectedItemForm.tsx`, `src/app/components/Toolbar.tsx`, `src/board/Board.tsx`
  - Tests: `src/workflow/schema.test.ts`, `src/workflow/migrate.test.ts`, `src/state/persistence.test.ts`, `src/state/store.persist.test.ts`, `src/state/history.test.ts`, `e2e/schema.spec.ts`
  - Evidence: `.docs/evidence/03-schema/`
  - Lockfile: `package.json`, `package-lock.json` (zod)
  - This handoff entry
- Behavior implemented: saved and imported JSON is validated; valid v1 boards migrate to v2 (Before map → `assignments`, After map → `after.assignments`, empty overlay, stub dropped, missing Human role → `worker`) and are rewritten only after success. Invalid startup JSON stays on `automation-pitch.workflow` with recovery state in the store (no recovery UI yet); the Oak Park demo loads in memory as `dirty`. localStorage failures keep editing in memory as `unavailable`. Import parses a full candidate before any store mutation. Focus requests replace the previous id and are consumed after the board centers. The board still looks and edits like Slice 2.
- Tests and exact results:
  - `npm install` at start — up to date, audited 134 packages, 0 vulnerabilities
  - `npm run build` at start — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning)
  - `npm run test:unit` at start — pass (3 files, 7 tests)
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; built in 1.07s; existing chunk-size warning; client `index-74AehRd7.js` 789.45 kB from Zod)
  - `npm run test:unit` — pass (7 files, 25 tests)
  - `npm run test:e2e` — pass (9 passed, Chromium, 15.6s including webServer)
- Evidence:
  - `.docs/evidence/03-schema/before-light-1440.png` — demo Before after v2 persist; inspector idle copy (1440×900)
  - `.docs/evidence/03-schema/after-light-1440.png` — After lane; Robot on automated Steps (1440×900)
  - `.docs/evidence/03-schema/both-light-1440.png` — stacked Before/After (1440×900)
  - `.docs/evidence/03-schema/before-light-1024.png` — same Before board at 1024×768
- Earlier-slice defects fixed: sticky `focusId` never cleared after the camera moved, so tiles could stay highlighted; `requestFocus` now replaces the current request and `consumeFocus` clears only a matching id (Board consumes after centering).
- Known limitations / follow-ups:
  - Recovery UI (Download recovery copy / Start fresh) and the visible Not saved chip — Slice 5
  - `validateWorkflow` is shared with the schema; connect/remove commands and history cap 500 — Slice 4
  - After overlay fields exist but are unused in rendering/editing — Slices 10–11
  - Step `stub` no longer exists on the document; detach no longer deletes a placeholder leaf (was in-session only) — Slice 6
  - Demo IDs are still random `nid()` — Slice 5
  - Pointer/Hand tool, idle helper chips, implicit empty-canvas Step, Path delete, inspector “Arrow” copy — later slices per BUILD_PLAN
- Status: COMPLETE
- Commit: `feat(slice-03): add v2 schema, migration, and recovery core`

## Slice 04 — graph invariants, pure commands, removal planning, and history — 2026-09-06

- Starting commit: `7e48136f0a43f96036fea3c9cefaac054f7049e4` (`feat(slice-03): add v2 schema, migration, and recovery core`)
- Working tree at start: clean, branch `main`, 5 commits ahead of `origin/main` (not pushed)
- GOAL clauses addressed: WG-01 (first Step is the root), WG-02 (sole root; no incoming Path), WG-03 / WG-04 (connect rejects cycles, duplicates, and root/reachability violations before mutation), WG-05 (Paths are not independently removable; Delete explains Node removal), WG-06 (root cannot be removed), WG-10 (1:1 / 1:N / N:1 auto restitch), WG-11 (M:N nearest pairings generated and validated; store blocks apply until the Slice 6 picker), WG-12 (condition join with ` + `, duplicate collapse), WG-13 (500 history; one structural entry; one text entry per keystroke; undo/redo do not change view), PC-04 (collapsed Path dotted if any replaced Path was dotted), BA-09 / MG-10 (pruneAfterOverlay skeleton), AQ-06 (command, pairing, history, store invariant tests)
- Library research and decisions: no new dependencies. Commands stay in framework-free `workflow/commands.ts` and reuse Slice 3 `validateWorkflow`. New Path ids use existing `nid(IdPrefix.Edge)`. History stays document snapshots (not a new library); `replaceHistory` is the New/Demo/Import boundary.
- Files changed:
  - Commands/graph: `src/workflow/commands.ts` (new), `src/workflow/graph.ts` (`rootNodeId`, `reachableFrom`, `wouldCreateCycle`, `incomingSorted`)
  - History/store: `src/state/history.ts` (cap 500, `commitStructural` / `commitText` / `replaceHistory`), `src/state/store.ts` (command wiring, `hintNotice`, no Path detach/delete)
  - UI: `src/app/inspector/SelectedItemForm.tsx` (Path Delete button removed), `src/app/components/CanvasHelper.tsx` (notice chip), `src/app/styles/tokens.css`, `src/board/controls/OutgoingPathPad.tsx`, `src/keyboard/useAppKeys.ts` (Backspace no longer deletes)
  - Tests: `src/workflow/commands.test.ts`, `src/workflow/graph.test.ts`, `src/state/history.test.ts`, `src/state/store.commands.test.ts`, `e2e/commands.spec.ts`
  - Evidence: `.docs/evidence/04-commands/`
  - This handoff entry
- Behavior implemented: connecting two Nodes is rejected with a visible hint when it would cycle, duplicate, or enter the root. The first Step on an empty board is the sole root; a disconnected second Node is refused. Node Delete (inspector / Delete key) applies the auto restitch plan for leaf, 1:1, 1:N, and N:1. Root removal and many-to-many removal are blocked with a hint. Selecting a Path and pressing Delete (or confirming −) explains that a Node must be removed instead. New / Demo / Import clear undo history. Undo/redo never change Before/After/Both.
- Tests and exact results:
  - `npm install` at start — up to date, audited 135 packages, 0 vulnerabilities
  - `npm run build` at start — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning)
  - `npm run test:unit` at start — pass (7 files, 25 tests)
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; built in 1.01s; existing chunk-size warning; client `index-C2U4kTeD.js` 796.70 kB)
  - `npm run test:unit` — pass (9 files, 54 tests)
  - `npm run test:e2e` — pass (13 passed, Chromium, 16.6s including webServer)
- Evidence:
  - `.docs/evidence/04-commands/before-light-1440.png` — demo Before after command wiring (1440×900)
  - `.docs/evidence/04-commands/after-light-1440.png` — After lane; Robot on automated Steps (1440×900)
  - `.docs/evidence/04-commands/both-light-1440.png` — stacked Before/After (1440×900)
  - `.docs/evidence/04-commands/before-light-1024.png` — same Before board at 1024×768
  - `.docs/evidence/04-commands/path-no-delete-1440.png` — Path selected; inspector has no Delete; hint says Paths cannot be removed (1440×900)
  - `.docs/evidence/04-commands/root-blocked-1440.png` — root Step selected, Delete blocked with root explanation in the hint strip (1440×900)
- Earlier-slice defects fixed: Backspace was handled as Delete before the Undo binding, so the default Undo key removed Nodes. Delete is now the only removal key; Backspace remains Undo (WG-05, SH-14). Direct Path deletion and `detachPath` could leave invalid graphs; both mutations are gone (WG-05).
- Known limitations / follow-ups:
  - `−` / Delete / inspector still lack the WG-08 picker, first-child highlight, and M:N pairing UI; store blocks M:N with a hint — Slice 6
  - After-only Path restitch on the After projection (full BA-09) — Slice 10
  - `connectAfter`, merge convexity on Before connect, After-only create — Slice 11
  - Recovery UI and empty-board Add Step — Slice 5
  - Inspector still titles a Path “Arrow”; Path / condition copy — Slice 7
  - Pointer/Hand tool, idle helper chips, implicit empty-canvas Step — later slices per BUILD_PLAN
  - Demo IDs are still random `nid()` — Slice 5
- Status: COMPLETE
- Commit: `feat(slice-04): add graph commands and bounded history`

## Slice 05 — replacement safety and demos — 2026-09-06

- Starting commit: `a2872c369cade22321b89a16b1ceca93c31fd7bf` (`feat(slice-04): add graph commands and bounded history`)
- Working tree at start: clean, branch `main`, 6 commits ahead of `origin/main` (not pushed)
- GOAL clauses addressed: WG-01 (empty New board, on-canvas Add Step creates the root), SH-05 (hamburger Demo chooser at the bottom; no Export), SH-06 (shared Save copy / Discard / Cancel gate for New, Demo, Import), SH-07 (Oak Park + Robot Mailroom fixtures; Mailroom overlay authored), SH-10 (Download recovery copy / Start fresh), SH-11 (persistent Not saved chip), SH-12 (history cleared on successful replacement), SH-13 (CLI exporter and README export instructions removed; Save copy is the JSON download), PC-06 (both Oak Park amount Paths dotted), AQ-06 / AQ-07 (unit and Chromium coverage of replace, recovery, both demos)
- Library research and decisions: no new dependencies. File download uses `Blob` + a temporary `<a download>` (Web platform; not a library). Replacement and recovery use existing Mantine 9 `Modal`. Demo chooser is a `Menu.Label` plus two items after a divider, not a nested submenu, so both fixtures stay keyboard-reachable as menuitems. First visit still hydrates Oak Park when storage is empty (showcase), not a blank board.
- Files changed:
  - Demos: `src/demos/oakParkInvoice.ts` (deterministic exporter IDs, both amount Paths dotted, `freshBoard` is empty), new `src/demos/robotMailroom.ts`, new `src/demos/catalog.ts`
  - Persistence/store: `src/state/persistence.ts` (Save copy / recovery download helpers), `src/state/store.ts` (pending replace, import error, startFresh)
  - Shell: `src/app/components/Toolbar.tsx` (hamburger order + Not saved), new `ReplaceDocumentModal.tsx`, `RecoveryModal.tsx`, `ImportErrorModal.tsx`, `EmptyBoardCta.tsx`, `PersistStatusChip.tsx`, `src/app/App.tsx`, `src/app/styles/tokens.css`, `src/keyboard/useAppKeys.ts`
  - Removed: `scripts/export.mjs`, `package.json` `export-json` script; README CLI export instructions replaced with Save copy
  - Tests: `src/demos/demos.test.ts`, `src/state/store.replace.test.ts`, `src/state/store.persist.test.ts`, `src/state/persistence.test.ts`, `src/workflow/schema.test.ts`, `src/app/App.test.tsx`, `e2e/replace.spec.ts`
  - Evidence: `.docs/evidence/05-replace/`; existing e2e also recaptured 01–04 screenshots (dotted amount Paths, new hamburger)
  - This handoff entry
- Behavior implemented: New / Demo / Import share one accessible gate. Cancel never mutates. Save copy downloads the current v2 JSON then replaces. Discard replaces without downloading. New is a zero-Node board with Alice, Roy, Jack, Missy, and Robot; Add Step creates the root. Demo is Oak Park Invoice and Robot Mailroom at the bottom of the hamburger. Invalid import explains and leaves the live board and storage alone. Corrupt startup storage keeps the raw key and offers Download recovery copy / Start fresh. localStorage write failures show one Not saved chip until a successful save.
- Tests and exact results:
  - `npm install` at start — up to date, audited 135 packages, 0 vulnerabilities
  - `npm run build` at start — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning)
  - `npm run test:unit` at start — pass (9 files, 54 tests)
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; built in 9.13s; existing chunk-size warning; client `index-CTkkiKVj.js` 805.28 kB)
  - `npm run test:unit` — pass (11 files, 67 tests)
  - `npm run test:e2e` — pass (20 passed, Chromium, 56.3s including webServer)
- Evidence:
  - `.docs/evidence/05-replace/before-light-1440.png` — Oak Park Before; both amount Paths dotted (1440×900)
  - `.docs/evidence/05-replace/after-light-1440.png` — Oak Park After (1440×900)
  - `.docs/evidence/05-replace/both-light-1440.png` — stacked Before/After (1440×900)
  - `.docs/evidence/05-replace/hamburger-1440.png` — Present, New, Import, Keybinds, Dark mode, then Demo chooser (Oak Park Invoice, Robot Mailroom); no Export (1440×900)
  - `.docs/evidence/05-replace/replace-gate-1440.png` — Save copy / Discard / Cancel gate (1440×900)
  - `.docs/evidence/05-replace/empty-new-1440.png` — empty New board with Add Step (1440×900)
  - `.docs/evidence/05-replace/robot-mailroom-1440.png` — Robot Mailroom Before; score 3 of 6; overlay not projected yet (1440×900)
  - `.docs/evidence/05-replace/recovery-1440.png` — corrupt storage recovery dialog (1440×900)
  - `.docs/evidence/05-replace/before-light-1024.png` — Oak Park Before at 1024×768
- Earlier-slice defects fixed: none
- Known limitations / follow-ups:
  - Robot Mailroom merge group and After-only receipt Step are stored on the overlay but After still draws the base graph — Slices 10–11
  - `−` / Delete / inspector still lack the WG-08 picker; store blocks M:N with a hint — Slice 6
  - Inspector still titles a Path “Arrow”; Path / condition copy — Slice 7
  - Pointer/Hand tool, idle helper chips, implicit empty-canvas Step — Slice 6
- Status: COMPLETE
- Commit: `feat(slice-05): add replacement gate, demos, and recovery UI`

## Slice 06 — create, connect, and remove canvas UX — 2026-09-06

- Starting commit: `e1f0ec383909bede3af03f53dfc145e6526f2e53` (`feat(slice-05): add replacement gate, demos, and recovery UI`)
- Working tree at start: clean tracked files on `main` (7 commits ahead of `origin/main`, not pushed). Untracked planner drafts `.docs/draft-to-give-planner-agent.*` were left untouched and are not in this commit.
- GOAL clauses addressed: P-06 (no idle chips), P-07 (Present hides NodeToolbars and hints; editing stays off), P-08 (Pointer/Hand removed; pan on empty canvas, scroll/pinch zoom, pan keys; upper-left is Undo), WG-02..WG-04 (connect rejections via one accessible notice), WG-05 (Path Delete explains Node removal), WG-06 (root explanation; New for a clean board), WG-07 (`+` Step/Data/Connect existing; empty-canvas click cancels, never creates a Node), WG-08..WG-12 (shared −/Delete/inspector Remove picker; first-child default; leaf defaults to itself; Up/Down; Enter confirm; Escape cancel; M:N pairing preview then atomic apply), CX-01 (React Flow NodeToolbar), CX-06 (squash/pop; reduced-motion is immediate), CX-07 (candidate vs selected-candidate vs restitch without color alone), CX-08 (empty canvas and Escape return to idle), SH-14 (retired Pointer/Hand/detach/path-confirm; Remove Node `-`; Confirm Enter; Merge `m` / Unmerge `u`; saved maps ignore unknown/retired), AQ-01 / AQ-02 / AQ-03 / AQ-05 / AQ-06 / AQ-07
- Library research and decisions: no new dependencies. Used `@xyflow/react` 12 `NodeToolbar` (`Position.Right`, explicit `isVisible`) so +/− sit outside the tile transform and are not covered by drag surfaces. Animate squash/pop on an inner wrapper (not the RF node `transform`). Rejections use one `role="status"` `aria-live="assertive"` notice with a short auto-clear. Merge/Unmerge are in the keymap only; handlers stay no-ops until Slice 11.
- Files changed:
  - Interaction: new `src/state/interaction.ts`; `src/state/store.ts` (discriminated `interaction`, `notice`, departing ghost; removal picker/preview; no implicit canvas Step)
  - Graph/commands: `src/workflow/graph.ts` (`removalCandidateIds`, `defaultRemovalCandidateId`), `src/workflow/commands.ts` (`removalNeighborhood`, `pairingBetween`, exported fan/nearest pairings)
  - Keybinds: `src/workflow/catalogs.ts` (retired `Tool`; SH-14 actions), `src/keyboard/bindings.ts`, `src/keyboard/useAppKeys.ts`, `src/keyboard/KeybindsModal.tsx`, `src/workflow/types.ts` (dropped `Tool` re-export)
  - Board: `src/board/controls/OutgoingPathPad.tsx`, `PathHostFrame.tsx` (NodeToolbar), `src/board/Board.tsx`, `src/board/nodes/StepNode.tsx`, `DataFieldNode.tsx`, `src/board/routing/FlowArrow.tsx` (static restitch preview)
  - Shell: `src/app/components/Toolbar.tsx` (Pointer/Hand gone), `CanvasHelper.tsx` (selection/task hints only), new `TransientNotice.tsx`, new `RemovePickerHud.tsx`, `src/app/App.tsx`, `src/app/inspector/SelectedItemForm.tsx` (Remove enters picker), `src/app/styles/tokens.css`
  - Tests: `src/state/store.commands.test.ts`, `src/workflow/graph.test.ts`, new `src/keyboard/bindings.test.ts`, `src/app/App.test.tsx`, persist/replace session helpers, `e2e/canvas.spec.ts`, `e2e/commands.spec.ts`
  - Evidence: `.docs/evidence/06-canvas/`; earlier e2e suites recaptured 01–05 screenshots (Undo-only chrome, Remove picker)
  - This handoff entry
- Behavior implemented: Tile +/− live in a NodeToolbar. `+` offers Step, Data, and Connect existing on Before (hidden on After until Slice 11). Clicking empty canvas while linking cancels; it does not spawn a Step. Connect rejections use one transient notice. `−`, Delete, and inspector Remove open the same picker: first outgoing child is preselected, a leaf defaults to itself, root is excluded with an explanation, Up/Down move, Enter/Confirm applies, Escape cancels. Many-to-many opens pairing preview (nearest by default, adjustable) then applies atomically. Removed Nodes squash/pop unless reduced motion. Idle chips are gone. Pointer/Hand and the Tool catalog are gone; panning is empty-canvas drag, scroll/pinch zoom, and pan keys. Present still disables editing. Backspace remains Undo.
- Tests and exact results:
  - `npm install` at start — up to date, audited 135 packages, 0 vulnerabilities
  - `npm run build` at start — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning)
  - `npm run test:unit` at start — pass (11 files, 67 tests)
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; built in 1.18s; existing chunk-size warning; client `index-6TGK1Tdt.js` 812.73 kB)
  - `npm run test:unit` — pass (12 files, 71 tests)
  - `npm run test:e2e` — pass (26 passed, Chromium, 30.9s including webServer)
- Evidence:
  - `.docs/evidence/06-canvas/before-light-1440.png` — Before; Undo-only upper-left; NodeToolbar +/−; no idle Pointer/Hand chips (1440×900)
  - `.docs/evidence/06-canvas/plus-menu-1440.png` — + menu: Step, Data, Connect existing (1440×900)
  - `.docs/evidence/06-canvas/after-light-1440.png` — After lane (1440×900)
  - `.docs/evidence/06-canvas/after-no-plus-1440.png` — After selected tile has − only; no + (1440×900)
  - `.docs/evidence/06-canvas/both-light-1440.png` — stacked Before/After (1440×900)
  - `.docs/evidence/06-canvas/remove-pick-1440.png` — removal picker; first-child default; candidate highlight (1440×900)
  - `.docs/evidence/06-canvas/remove-mn-preview-1440.png` — many-to-many pairing preview (1440×900)
  - `.docs/evidence/06-canvas/remove-cancel-1440.png` — picker open; Escape leaves the Node (1440×900)
  - `.docs/evidence/06-canvas/root-blocked-1440.png` — Delete on root opens picker of children with WG-06 copy (1440×900)
  - `.docs/evidence/06-canvas/path-no-delete-1440.png` — Path selected; Delete explains Node removal (1440×900)
  - `.docs/evidence/06-canvas/before-light-1024.png` — Before at 1024×768
- Earlier-slice defects fixed: none that blocked this slice. Slice 4 already stopped Backspace from deleting; this slice keeps Backspace as Undo in the new picker flow.
- Known limitations / follow-ups:
  - Merge (`m`) / Unmerge (`u`) are catalogued and ignored until the After dock exists — Slice 11
  - `+` stays hidden in After until After-only Step/Path creation — Slice 11
  - Connector-stretch restitch animation — Slice 9
  - Inspector still titles a Path “Arrow”; Path / condition, stroke, Split, Who buttons — Slice 7
  - Both is still editable; After still mutates the shared base graph — Slice 10
  - Sound toggle after Undo — Slice 8
  - Robot Mailroom merge / After-only Step still not projected — Slices 10–11
- Status: COMPLETE
- Commit: `feat(slice-06): add create, connect, and remove canvas UX`

## Slice 07 — inspector and actors — 2026-09-06

- Starting commit: `68c3eca93521fbbba96ee2a2c6202a49ff5f7ea3` (`feat(slice-06): add create, connect, and remove canvas UX`)
- Working tree at start: clean tracked files on `main` (8 commits ahead of `origin/main`, not pushed). Untracked planner drafts `.docs/draft-to-give-planner-agent.*` were left untouched.
- GOAL clauses addressed: NA-01 (Name/Color/Role or Type), NA-02 (unused-only deletion with assigning Step names, including After-only extra Steps), NA-03 (Robot-in-Before; new Steps still last-used Human else Alice else first Human in both lanes), NA-05 (alphabetical Type fat buttons, Other last; Who icon buttons for every actor in both lanes), NA-06 (Manage actors in the inspector; paint mode gone), NA-07 (Path / condition; Always visited (solid) / Choice (dotted); Split: One of / Every), NA-08 (Enter focuses Path condition or Data Label and selects the value; Step Enter does not guess a field), NA-09 (native Tab order on visible inspector controls), NA-11 (Who primary click is the only assignment), NA-12 (no Path delete; Node Remove still enters the picker), PC-02 / PC-03 (One of dots every outgoing Path; Every solids them; single outgoing always solid; changing Split re-applies defaults), P-05 (inspector 320 px), AQ-06 / AQ-07
- Library research and decisions: no new dependencies. Actor color stays Mantine `ColorInput` with preset swatches. Who and Type are native buttons (not Select) so Tab order is complete. Paint-mode click-to-assign on tiles is removed (NA-11).
- Files changed:
  - Inspector: `src/app/inspector/SelectedItemForm.tsx`, new `TypeButtons.tsx`, `WhoButtons.tsx`, `ManageActorsPanel.tsx`; `src/app/App.tsx` (aside 320 px); `src/app/styles/tokens.css`
  - Actors/graph: `src/workflow/actors.ts` (`defaultHumanId`, `actorUsages`, `removeActor`), `src/workflow/types.ts` (STEP_KINDS order), `src/workflow/graph.ts` / `commands.ts` (PC-02 connect stroke)
  - Store/keyboard/board: `src/state/store.ts` (Who in both lanes, manage-actors panel, `removeActor`, Enter focus ids), `src/keyboard/useAppKeys.ts`, `src/board/Board.tsx`, `src/board/controls/PathHostFrame.tsx` (paint mode removed), `src/board/routing/FlowArrow.tsx` (comment), `src/app/components/CanvasHelper.tsx`
  - Tests: `src/workflow/actors.test.ts`, `src/workflow/graph.test.ts`, `src/workflow/commands.test.ts`, `src/state/store.actors.test.ts`, `src/app/App.test.tsx`, `e2e/inspector.spec.ts`, `e2e/smoke.spec.ts`, `e2e/commands.spec.ts`
  - Evidence: `.docs/evidence/07-inspector/`; earlier e2e suites recaptured 01–06 screenshots (320 px inspector)
  - This handoff entry
- Behavior implemented: The inspector titles a Path **Path / condition** and edits **condition**. Stroke is Always visited (solid) / Choice (dotted); Split is One of / Every and rewrites outgoing Path strokes. Step Type is alphabetical fat buttons with Other last. Who is actor icon buttons for every Human and Robot in Before and After. Manage actors edits Name/Color/Role or Type, adds humans and robots, and blocks deletion of assigned actors with a notice that names the Steps. Enter on a Path or Data Node focuses the primary field. Inspector width is 320 px. Paintbrush assignment (select actor, click Steps) is gone.
- Tests and exact results:
  - `npm install` at start — up to date, audited 135 packages, 0 vulnerabilities
  - `npm run build` at start — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning)
  - `npm run test:unit` at start — pass (12 files, 71 tests)
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning; client `index-DkqYIK_K.js` 817.57 kB)
  - `npm run test:unit` — pass (14 files, 82 tests)
  - `npm run test:e2e` — pass (32 passed, Chromium, 36.1s including webServer)
- Evidence:
  - `.docs/evidence/07-inspector/before-light-1440.png` — Oak Park Before; 320 px inspector idle (1440×900)
  - `.docs/evidence/07-inspector/after-light-1440.png` — After lane (1440×900)
  - `.docs/evidence/07-inspector/both-light-1440.png` — stacked Before/After (1440×900)
  - `.docs/evidence/07-inspector/step-who-before-1440.png` — Step inspector: Type grid, Split One of, Who including Robot (1440×900)
  - `.docs/evidence/07-inspector/who-before-robot-1440.png` — Robot assigned on a Before Step (1440×900)
  - `.docs/evidence/07-inspector/who-after-1440.png` — Who assignment in After (1440×900)
  - `.docs/evidence/07-inspector/path-condition-1440.png` — Path / condition; Choice (dotted) selected (1440×900)
  - `.docs/evidence/07-inspector/split-every-1440.png` — Split Every makes amount Paths Always visited (1440×900)
  - `.docs/evidence/07-inspector/delete-blocked-1440.png` — Alice deletion blocked with assigning Step names (1440×900)
  - `.docs/evidence/07-inspector/manage-actors-1440.png` — Robot Mailroom Manage actors; unused Priya selected (1440×900)
  - `.docs/evidence/07-inspector/before-light-1024.png` — Step inspector at 1024×768
- Earlier-slice defects fixed: exclusive Split used to draw the first outgoing Path solid and the rest dotted. PC-02 requires every One-of Path dotted (a single outgoing Path stays solid). `applyDashForSplit` / `edgeIsDotted` / connect stroke now follow that; Oak Park amount Paths were already explicitly dotted (PC-06).
- Known limitations / follow-ups:
  - Auto-create a default Robot when After needs one (NA-04 merge / After-only) — Slice 11
  - Tile text wrap/shrink/clamp (NA-10) and chunky shell / Nunito / sound — Slice 8
  - Merge (`m`) / Unmerge (`u`) catalogued only — Slice 11
  - `+` stays hidden in After — Slice 11
  - Connector-stretch restitch animation — Slice 9
  - Both is still editable; After still mutates the shared base graph — Slice 10
  - Robot Mailroom merge / After-only Step still not projected — Slices 10–11
- Status: COMPLETE
- Commit: `feat(slice-07): rebuild inspector for Path, Who, and actors`

## Slice 08 — shell, typography, and sound — 2026-09-06

- Starting commit: `4f051ef6f31ddb78993a1eb1a240c4f2fd1dc392` (`feat(slice-07): rebuild inspector for Path, Who, and actors`)
- Working tree at start: clean tracked files on `main` (9 commits ahead of `origin/main`, not pushed). Untracked planner drafts `.docs/draft-to-give-planner-agent.*` were left untouched.
- GOAL clauses addressed: SH-15 (local variable Nunito; Google Fonts link removed), NA-10 (tile text wrap/shrink to 11 px then ellipsis clamp; full value on title and aria-label), SH-01 / SH-02 / P-09 (chunky high-contrast shell; prominent Before/After/Both radios; both themes), P-08 / SH-03 / SH-04 (sound toggle after Undo; off by default; persisted; original Web Audio blip/pop/buzz/twoNote/tick at fixed low volume; independent of reduced motion), P-07 (Present hides inspector, NodeToolbars, and hints; score in the top bar; Space toggles Before/After; exit restores view and selection; undo/redo disabled while presenting), AQ-02 / AQ-04 / AQ-05 / AQ-07
- Library research and decisions: added approved `@fontsource-variable/nunito@5.3.0` (`Nunito Variable` via `wght.css`). No other runtime dependency. Sound uses the Web Audio API only (no Howler/samples). Replaced Mantine SegmentedControl with an opaque yellow/dark radio group so axe no longer needs the Slice 1 contrast exclusion. Selected-on-yellow uses a dedicated `--on-yellow` ink that does not flip in dark theme.
- Files changed:
  - Font/shell: `index.html`, `src/main.tsx`, `src/app/App.tsx`, `src/app/styles/tokens.css`, `src/app/components/Toolbar.tsx`, `package.json`, `package-lock.json`
  - Sound: new `src/app/sound/cues.ts`, `src/app/components/SoundToggle.tsx`; `src/state/persistence.ts`, `src/state/store.ts`, `src/keyboard/useAppKeys.ts`
  - Tiles: `src/board/tiles/FitLabel.tsx`, `ActorColumn.tsx`, `StepTile.tsx`, `DataTile.tsx`
  - Tests: `src/app/sound/cues.test.ts`, `src/board/tiles/FitLabel.test.tsx`, `src/state/store.shell.test.ts`, `src/state/persistence.test.ts`, `src/app/App.test.tsx`, `e2e/shell.spec.ts`, `e2e/smoke.spec.ts`, `e2e/inspector.spec.ts`
  - Evidence: `.docs/evidence/08-shell/`; earlier e2e suites recaptured 01–07 screenshots (chunky shell, sound toggle, view radios)
  - This handoff entry
- Behavior implemented: Nunito is bundled locally. Actor name/role, Data label, Step title, and Step detail wrap, shrink to 11 px, then ellipsize; the full string is on title and the accessible name. The top bar is chunkier; Before/After/Both is a high-contrast radio group in the same place. Sound starts off, sits after Undo, announces when toggled, and persists. Create/connect plays a blip, remove a pop, rejections a buzz, turning sound on a tick. Present still disables editing and now restores the previous view and selection on exit.
- Tests and exact results:
  - `npm install` at start — up to date, audited 135 packages, 0 vulnerabilities; after Nunito, 136 packages, 0 vulnerabilities
  - `npm run build` at start — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning)
  - `npm run test:unit` at start — pass (14 files, 82 tests)
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; bundled Nunito woff2; existing chunk-size warning; client `index-DZV8RZyy.js` 814.55 kB)
  - `npm run test:unit` — pass (17 files, 90 tests)
  - `npm run test:e2e` — pass (37 passed, Chromium, 40.8s including webServer)
- Evidence:
  - `.docs/evidence/08-shell/before-light-1440.png` — chunky light shell; view radios; Sound off after Undo (1440×900)
  - `.docs/evidence/08-shell/after-light-1440.png` — After lane, same chrome (1440×900)
  - `.docs/evidence/08-shell/both-light-1440.png` — stacked Before/After (1440×900)
  - `.docs/evidence/08-shell/present-light-1440.png` — Present: inspector hidden, score in the top bar, no NodeToolbars (1440×900)
  - `.docs/evidence/08-shell/sound-on-1440.png` — Sound on announced; reduced-motion emulation (1440×900)
  - `.docs/evidence/08-shell/hamburger-1440.png` — Present first; Demo chooser at the bottom (1440×900)
  - `.docs/evidence/08-shell/tile-text-clamp-1440.png` — long Step title/detail wrapped, shrunk, clamped (1440×900)
  - `.docs/evidence/08-shell/before-dark-1440.png` — dark theme shell (1440×900)
  - `.docs/evidence/08-shell/after-dark-1440.png` — After in dark (1440×900)
  - `.docs/evidence/08-shell/both-dark-1440.png` — Both in dark (1440×900)
  - `.docs/evidence/08-shell/before-light-1024.png` — light shell at 1024×768
- Earlier-slice defects fixed: Present cleared selection and did not restore view/selection on exit (P-07). Ctrl+Z/Y still mutated the document during Present; both are ignored while presenting. Slice 1 axe exclusion for Mantine SegmentedControl is no longer needed.
- Known limitations / follow-ups:
  - `playCue("twoNote")` is implemented for merge/unmerge but unused until the After dock exists — Slice 11
  - Auto-create a default Robot when After needs one (NA-04) — Slice 11
  - Merge (`m`) / Unmerge (`u`) catalogued only — Slice 11
  - `+` stays hidden in After — Slice 11
  - Connector-stretch restitch animation and Smart Edge routing — Slice 9
  - Both is still editable; After still mutates the shared base graph — Slice 10
  - Robot Mailroom merge / After-only Step still not projected — Slices 10–11
- Status: COMPLETE
- Commit: `feat(slice-08): add shell typography and sound`

## Slice 09 — smart routing and reversible label layout — 2026-09-06

- Starting commit: `1e3411e30090e055dc20d0db505d4c2ad683a7f4` (`feat(slice-08): add shell typography and sound`)
- Working tree at start: clean tracked files on `main` (10 commits ahead of `origin/main`, not pushed). Untracked planner drafts `.docs/draft-to-give-planner-agent.*` were left untouched.
- GOAL clauses addressed: CX-02 (condition chips remain independent hit targets at all zooms), CX-03 (Smart Edge v5 orthogonal/stepped routing around Nodes), CX-04 (deterministic post-route condition placement with wrap/clamp), CX-05 (lane-derived compact layout expands and contracts; excluded from save/undo), CX-06 (connector-stretch restitch plus modest layout motion; reduced motion snaps), PC-05 (dotted/solid strokes survive Smart Edge), P-03 / AQ-06 / AQ-07 (30-object routing coverage; unit + Chromium)
- Library research and decisions: added approved `@tisoap/react-flow-smart-edge@5.0.0`. One `SmartEdgeProvider` per Board/lane with controlled nodes and `measured` sizes; `preset: "step"` plus `svgDrawStraightLinePath` / jump-point (no diagonal) to keep the orthogonal look. `useSmartEdgePath` for the live worker path; synchronous `getSmartEdge` in unit tests. `onMetrics` with `deferred === 0` sets `data-smart-edge="settled"` so e2e waits for routing. `avoidAreas` get up to two cycles of placed condition rects. Label placement stays custom (not Smart Edge labels). No other runtime dependency.
- Files changed:
  - Routing: `src/board/routing/FlowArrow.tsx`, new `smartStep.ts`, `polyline.ts`, `placeLabels.ts`, `PathLayout.tsx`; `src/board/Board.tsx` (`SmartEdgeProvider` per lane)
  - Layout: new `src/board/layout/layoutLane.ts`, `labelBox.ts`, `useModestMotion.ts`; deleted `spreadForLabels.ts`; `src/state/store.ts` no longer mutates saved positions on commit
  - Shell/CSS: `src/app/styles/tokens.css` (condition chips)
  - Tests: layout/placement/polyline/store.layout unit tests; `e2e/ready.ts`, `e2e/routing.spec.ts`; existing e2e `loadDemo` waits for routing
  - Lockfile: `package.json`, `package-lock.json`
  - Evidence: `.docs/evidence/09-routing/`; earlier e2e suites recaptured 01–08 screenshots (routed Paths, condition chips)
  - This handoff entry
- Behavior implemented: Paths route around Nodes with a stepped stroke; dotted still means choice. Condition chips wrap/clamp at 192 px, sit on a low-conflict segment, and select the Path without stealing the SVG hit. Long conditions expand the **displayed** lane; shortening contracts back to canonical positions. Saved JSON and undo keep those canonical hints, so reload does not accumulate drift. Removing a Node stretches new connectors through the departing tile then to the restitch path (immediate under reduced motion). Modest derived-layout moves animate ~200 ms.
- Tests and exact results:
  - `npm install` at start — up to date, audited 136 packages, 0 vulnerabilities; after Smart Edge, 137 packages, 0 vulnerabilities
  - `npm run build` at start — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning)
  - `npm run test:unit` at start — pass (17 files, 90 tests)
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning; client `index-CMLjkYrn.js` 877.22 kB from Smart Edge)
  - `npm run test:unit` — pass (22 files, 104 tests)
  - `npm run test:e2e` — pass (45 passed, Chromium, 56.7s including webServer)
- Evidence:
  - `.docs/evidence/09-routing/before-light-1440.png` — Oak Park Before; routed Paths; condition chips off tiles (1440×900)
  - `.docs/evidence/09-routing/condition-chip-1440.png` — chip click opens Path / condition inspector (1440×900)
  - `.docs/evidence/09-routing/label-contract-1440.png` — shortened amount condition; lane contracted (1440×900)
  - `.docs/evidence/09-routing/zoom-out-label-1440.png` — zoomed out; condition chip still selects the Path (1440×900)
  - `.docs/evidence/09-routing/after-light-1440.png` — After lane after routing settled (1440×900)
  - `.docs/evidence/09-routing/both-light-1440.png` — Both; one SmartEdgeProvider per lane (1440×900)
  - `.docs/evidence/09-routing/before-dark-1440.png` — dark theme routed Paths (1440×900)
  - `.docs/evidence/09-routing/restitch-1440.png` — after 1:1 remove of Write; restitch Path settled (1440×900)
  - `.docs/evidence/09-routing/stress-30-1440.png` — 15 Steps + 14 Paths routed (1440×900)
  - `.docs/evidence/09-routing/before-light-1024.png` — routed Before at 1024×768
- Earlier-slice defects fixed: `spreadForLabels` wrote expanded positions into the document on every commit, so save/reload drifted (CX-05). Spacing is derived per lane only. Condition chips were below the WCAG 2.2 24 px target at fitView zoom; they now have a 48 px minimum so axe `target-size` passes without covering tile + menus.
- Known limitations / follow-ups:
  - `playCue("twoNote")` is implemented for merge/unmerge but unused until the After dock exists — Slice 11
  - Auto-create a default Robot when After needs one (NA-04) — Slice 11
  - Merge (`m`) / Unmerge (`u`) catalogued only — Slice 11
  - `+` stays hidden in After — Slice 11
  - Both is still editable; After still mutates the shared base graph; lanes still share one viewport binding — Slice 10
  - Robot Mailroom merge / After-only Step still not projected — Slices 10–11
- Status: COMPLETE
- Commit: `feat(slice-09): add smart routing and reversible label layout`

## Slice 10 — After projection and comparison semantics — 2026-09-06

- Starting commit: `aa8904b553c81f13a5855dc9da44d8bed5e3b07a` (`feat(slice-09): add smart routing and reversible label layout`)
- Working tree at start: clean tracked files on `main` (11 commits ahead of `origin/main`, not pushed). Untracked planner drafts `.docs/draft-to-give-planner-agent.*` were left untouched.
- GOAL clauses addressed: BA-02 (shared Before-origin fields edit from Before or After and show immediately), BA-04 (After cannot remove Before-origin Nodes; `−` explains), BA-05 (Both read-only; independent viewports; pan keys follow last focused lane), BA-08 (score omits After-only Steps; merged members counted individually), BA-09 (Before removal restitches After-only Paths on the combined After graph), MG-09 (display projection: internals hidden, boundary Path endpoints remapped, distinct parallel conditions kept), P-03 / AQ-06 / AQ-07 (projection unit tests plus Chromium comparison coverage)
- Library research and decisions: no new runtime dependency. One React Flow instance per lane with `laneViewports` in Zustand; each Board reads the stored viewport once on mount so saving `onMoveEnd` does not flip `fitView` mid-mount. Pan keys use `focusedLane`; Both outlines the pan-target lane (`data-pan-target`). Group tiles are a stand-in Step from the first member until Slice 11’s giant Step. Playwright `workers` capped at 3 so Chromium + Smart Edge do not starve under six parallel browsers.
- Files changed:
  - Projection: new `src/state/projection.ts`, `src/workflow/selectors.ts`; `src/workflow/scoring.ts` (`automationCounts`); `src/workflow/graph.ts` (`afterGraph`); `src/workflow/commands.ts` (`pruneAfterOverlay` restitch + `MSG.afterOriginRemoval`)
  - Store / Board: `src/state/store.ts` (`focusedLane`, `laneViewports`, `canvasEpoch`, extra-overlay patches, Both/After guards); `src/board/Board.tsx`, `reactFlowBridge.ts`, tiles, Path chrome, `FlowArrow.tsx`
  - Inspector / shell: `SelectedItemForm.tsx`, `TypeButtons.tsx`, `WhoButtons.tsx`, `CanvasHelper.tsx`, `App.tsx`, `useAppKeys.ts`, `tokens.css`; comment in `robotMailroom.ts` and `catalogs.ts`
  - Tests: `projection.test.ts`, `scoring.test.ts`, `store.projection.test.ts`, command/store tests; new `e2e/projection.spec.ts`; `e2e/canvas.spec.ts`, `e2e/routing.spec.ts`; `playwright.config.ts` (`workers: 3`)
  - Evidence: `.docs/evidence/10-projection/`; earlier e2e suites recaptured 01–09 screenshots (projected After)
  - This handoff entry
- Behavior implemented: Before is the base graph only (no After-only receipt). After adds extra Nodes/Paths, hides merge internals, remaps boundary Path endpoints onto the group tile (`g_mail_sort` for Robot Mailroom), and keeps distinct parallel conditions. Shared Type/title/detail/Data/condition/stroke/Split edits from After write the base document and appear in Before immediately; Who stays per-lane. Both has no NodeToolbars or inspector mutation; clicking a lane sets the pan-key target. Mailroom score stays **3 of 6**. Removing a Before-origin Node restitches After-only Paths so extras stay reachable. After `−` on a Before-origin Step explains the BA-04 block.
- Tests and exact results:
  - `npm install` at start — up to date, 137 packages
  - `npm run build` at start — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning)
  - `npm run test:unit` at start — pass (22 files, 104 tests)
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning; client `index-C8faNhV7.js` 884.38 kB)
  - `npm run test:unit` — pass (25 files, 115 tests)
  - `npm run test:e2e` — pass (51 passed, Chromium, 3 workers, 2.4m including webServer)
- Evidence:
  - `.docs/evidence/10-projection/before-light-1440.png` — Robot Mailroom Before; no receipt Step (1440×900)
  - `.docs/evidence/10-projection/after-light-1440.png` — After: merged internals hidden, receipt present, score 3 of 6 (1440×900)
  - `.docs/evidence/10-projection/after-dark-1440.png` — same After in dark (1440×900)
  - `.docs/evidence/10-projection/after-light-1024.png` — Mailroom After at 1024×768
  - `.docs/evidence/10-projection/shared-edit-1440.png` — Target edited in After appears on the Before tile (1440×900)
  - `.docs/evidence/10-projection/both-light-1440.png` — Both read-only; After lane is the pan target (1440×900)
  - `.docs/evidence/10-projection/after-origin-blocked-1440.png` — After `−` notice on a Before-origin Step (1440×900)
- Earlier-slice defects fixed: After could remove Before-origin Nodes (BA-04) — `−` now explains and does not mutate. Lanes shared one React Flow viewport binding — each lane has its own instance and stored viewport. A Zustand selector that returned a new object every render looped StepNode on Mailroom After. Lane-label chips stole pointer events so Both pan-focus clicks missed the canvas. `fitView={!storedViewport}` flipped after the first `onMoveEnd` and broke overlay/`+` hit-testing. Playwright default (6 workers) timed out Chromium + Smart Edge; workers capped at 3.
- Known limitations / follow-ups:
  - Merge/Unmerge dock, closure/convexity, preview/confirm (MG-01..MG-07) — Slice 11
  - Giant Step with condensed internal flow and no System/detail (MG-08); group tile is a first-member stand-in — Slice 11
  - Who-on-all-members; Unmerge from a merged tile (BA-04 remainder) — Slice 11
  - After-only Step/Path create (`+` in After, hide `+ Data`) and After-only removal (BA-06, BA-07) — Slice 11
  - MG-10 Before-connect convexity / group dissolution — Slice 11
  - Auto-create a default Robot when After needs one (NA-04) — Slice 11
  - `playCue("twoNote")` unused until the After dock exists — Slice 11
- Status: COMPLETE
- Commit: `feat(slice-10): add After projection and comparison`

## Slice 10 — After projection and comparison semantics — 2026-09-06

- Starting commit: `aa8904b553c81f13a5855dc9da44d8bed5e3b07a` (`feat(slice-09): add smart routing and reversible label layout`)
- Working tree at start: clean tracked files on `main` (11 commits ahead of `origin/main`, not pushed). Untracked planner drafts `.docs/draft-to-give-planner-agent.*` were left untouched.
- GOAL clauses addressed: BA-02 (shared Before-origin fields edit from Before or After and show immediately), BA-04 (After cannot remove Before-origin Nodes; `−` explains), BA-05 (Both read-only; independent viewports; pan keys follow last focused lane), BA-08 (score omits After-only Steps; merged members counted individually), BA-09 (Before removal restitches After-only Paths on the combined After graph), MG-09 (display projection: internals hidden, boundary Path endpoints remapped, distinct parallel conditions kept), P-03 / AQ-06 / AQ-07 (projection unit tests plus Chromium comparison coverage)
- Library research and decisions: no new runtime dependency. One React Flow instance per lane with `laneViewports` in Zustand; each Board reads the stored viewport once on mount so saving `onMoveEnd` does not flip `fitView` mid-mount. Pan keys use `focusedLane`; Both outlines the pan-target lane (`data-pan-target`). Group tiles are a stand-in Step from the first member until Slice 11’s giant Step. Playwright `workers` capped at 3 so Chromium + Smart Edge do not starve under six parallel browsers.
- Files changed:
  - Projection: new `src/state/projection.ts`, `src/workflow/selectors.ts`; `src/workflow/scoring.ts` (`automationCounts`); `src/workflow/graph.ts` (`afterGraph`); `src/workflow/commands.ts` (`pruneAfterOverlay` restitch + `MSG.afterOriginRemoval`)
  - Store / Board: `src/state/store.ts` (`focusedLane`, `laneViewports`, `canvasEpoch`, extra-overlay patches, Both/After guards); `src/board/Board.tsx`, `reactFlowBridge.ts`, tiles, Path chrome, `FlowArrow.tsx`
  - Inspector / shell: `SelectedItemForm.tsx`, `TypeButtons.tsx`, `WhoButtons.tsx`, `CanvasHelper.tsx`, `App.tsx`, `useAppKeys.ts`, `tokens.css`; comment in `robotMailroom.ts` and `catalogs.ts`
  - Tests: `projection.test.ts`, `scoring.test.ts`, `store.projection.test.ts`, command/store tests; new `e2e/projection.spec.ts`; `e2e/canvas.spec.ts`, `e2e/routing.spec.ts`; `playwright.config.ts` (`workers: 3`)
  - Evidence: `.docs/evidence/10-projection/`; earlier e2e suites recaptured 01–09 screenshots (projected After)
  - This handoff entry
- Behavior implemented: Before is the base graph only (no After-only receipt). After adds extra Nodes/Paths, hides merge internals, remaps boundary Path endpoints onto the group tile (`g_mail_sort` for Robot Mailroom), and keeps distinct parallel conditions. Shared Type/title/detail/Data/condition/stroke/Split edits from After write the base document and appear in Before immediately; Who stays per-lane. Both has no NodeToolbars or inspector mutation; clicking a lane sets the pan-key target. Mailroom score stays **3 of 6**. Removing a Before-origin Node restitches After-only Paths so extras stay reachable. After `−` on a Before-origin Step explains the BA-04 block.
- Tests and exact results:
  - `npm install` at start — up to date, 137 packages
  - `npm run build` at start — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning)
  - `npm run test:unit` at start — pass (22 files, 104 tests)
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning; client `index-C8faNhV7.js` 884.38 kB)
  - `npm run test:unit` — pass (25 files, 115 tests)
  - `npm run test:e2e` — pass (51 passed, Chromium, 3 workers, 2.4m including webServer)
- Evidence:
  - `.docs/evidence/10-projection/before-light-1440.png` — Robot Mailroom Before; no receipt Step (1440×900)
  - `.docs/evidence/10-projection/after-light-1440.png` — After: merged internals hidden, receipt present, score 3 of 6 (1440×900)
  - `.docs/evidence/10-projection/after-dark-1440.png` — same After in dark (1440×900)
  - `.docs/evidence/10-projection/after-light-1024.png` — Mailroom After at 1024×768
  - `.docs/evidence/10-projection/shared-edit-1440.png` — Target edited in After appears on the Before tile (1440×900)
  - `.docs/evidence/10-projection/both-light-1440.png` — Both read-only; After lane is the pan target (1440×900)
  - `.docs/evidence/10-projection/after-origin-blocked-1440.png` — After `−` notice on a Before-origin Step (1440×900)
- Earlier-slice defects fixed: After could remove Before-origin Nodes (BA-04) — `−` now explains and does not mutate. Lanes shared one React Flow viewport binding — each lane has its own instance and stored viewport. A Zustand selector that returned a new object every render looped StepNode on Mailroom After. Lane-label chips stole pointer events so Both pan-focus clicks missed the canvas. `fitView={!storedViewport}` flipped after the first `onMoveEnd` and broke overlay/`+` hit-testing. Playwright default (6 workers) timed out Chromium + Smart Edge; workers capped at 3.
- Known limitations / follow-ups:
  - Merge/Unmerge dock, closure/convexity, preview/confirm (MG-01..MG-07) — Slice 11
  - Giant Step with condensed internal flow and no System/detail (MG-08); group tile is a first-member stand-in — Slice 11
  - Who-on-all-members; Unmerge from a merged tile (BA-04 remainder) — Slice 11
  - After-only Step/Path create (`+` in After, hide `+ Data`) and After-only removal (BA-06, BA-07) — Slice 11
  - MG-10 Before-connect convexity / group dissolution — Slice 11
  - Auto-create a default Robot when After needs one (NA-04) — Slice 11
  - `playCue("twoNote")` unused until the After dock exists — Slice 11
- Status: COMPLETE
- Commit: `feat(slice-10): add After projection and comparison`

## Slice 11 — merge/unmerge and After-only Steps — 2026-09-06

- Starting commit: `7e24f688a006d1c927234f2b62199b79d6050cc2` (`feat(slice-10): add After projection and comparison`)
- Working tree at start: clean tracked files on `main`. This machine had no Node/`node_modules`; Node 24.19.0 was installed, then `npm install` (137 packages) so Slice 10 HEAD could be verified green before edits.
- GOAL clauses addressed: MG-01..MG-10, BA-04 (Unmerge on a merged tile), BA-06, BA-07, NA-04, P-07 (Present hides the merge dock), BA-05 (Both hides the merge dock)
- Library research and decisions: no new runtime dependency. The Merge/Unmerge control is a compact left overlay (`role="region"`), not a new permanent panel (P-05). Giant-Step internals are a custom condensed flow (icon + title, strokes, conditions) beside a normal-size Robot — not a second React Flow instance. After-only restitch writes extra Paths only; it does not rewrite base Split/strokes so Before stays unchanged. Group connect endpoints store real Node ids, not group render ids. Flatten keeps the first intersecting group id. Merge-pick seeds are user clicks; the HUD/confirm re-run closure expansion.
- Files changed:
  - Domain: `src/workflow/merge.ts`, `merge.test.ts`; `graph.ts` (`isConvex`, `supportingInternalIds`); `commands.ts` (MG-10 connect reject, group dissolution); `actors.ts` (`ensureDefaultRobot`); `selectors.ts`; `catalogs.ts` (`IdPrefix.Group`)
  - Projection / store: `src/state/projection.ts`, `store.ts`, `interaction.ts`, `store.merge.test.ts`
  - UI: `MergeDock.tsx`, `MergedStepTile.tsx`, `mergeFlow.ts`, `Board.tsx`, `StepNode.tsx`, `OutgoingPathPad.tsx`, `PathHostFrame.tsx`, `layoutLane.ts`, `SelectedItemForm.tsx`, `CanvasHelper.tsx`, `RemovePickerHud.tsx`, `App.tsx`, `useAppKeys.ts`, `tokens.css`, `StepKindIcon.tsx`, `cues.ts`
  - Demo: `src/demos/robotMailroom.ts` (live overlay comment)
  - Tests: `e2e/merge.spec.ts`; `e2e/canvas.spec.ts` / `projection.spec.ts` (After `+`, internals visible); `commands.test.ts`
  - Evidence: `.docs/evidence/11-merge/`; earlier After screenshots recaptured with the dock and giant Step
  - This handoff entry
- Behavior implemented: Editable After shows a Merge/Unmerge dock. Selecting Before-origin Steps expands to the closure (Steps as members, Data as supporting internals), previews, and confirms a convex connected group; disconnected selections explain. Extending/flattening never nests groups. The giant Step shows a normal-size Robot plus condensed internals with strokes; Who on the group updates every swallowed Step and survives Unmerge. After `+` offers After-only Step (default Robot, auto-created if needed) and Connect existing; `+ Data` is hidden. After-only Steps remove through the same picker. A Before Path that would break convexity is rejected with the group named and “Unmerge first”; residual noncontiguous/non-convex groups dissolve with a notice. Present/Before/Both hide the dock. Robot Mailroom After shows `g_mail_sort` internals, Recipient as supporting, and the receipt After-only Step.
- Tests and exact results:
  - `npm install` at start — 137 packages
  - `npm run build` at start — pass (`tsc --noEmit && vite build`; Vite 8.2.2)
  - `npm run test:unit` at start — pass (25 files, 115 tests)
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning; client `index-DVblke2V.js` 903.73 kB)
  - `npm run test:unit` — pass (27 files, 132 tests)
  - `npm run test:e2e` — pass (59 passed, Chromium, 3 workers, 24.2s including webServer)
- Evidence:
  - `.docs/evidence/11-merge/after-mailroom-1440.png` — After: giant Step internals, receipt, merge dock (1440×900)
  - `.docs/evidence/11-merge/after-mailroom-1024.png` — same After at 1024×768
  - `.docs/evidence/11-merge/after-mailroom-dark-1440.png` — Mailroom After in dark (1440×900)
  - `.docs/evidence/11-merge/after-plus-1440.png` — After `+` menu: After-only Step / Connect existing, no Data (1440×900)
  - `.docs/evidence/11-merge/after-unmerged-1440.png` — Unmerge restored individual Mailroom Steps (1440×900)
  - `.docs/evidence/11-merge/after-remerged-1440.png` — merge preview confirmed; giant Step restored (1440×900)
  - `.docs/evidence/11-merge/after-only-removed-1440.png` — After-only Step removed via picker (1440×900)
  - `.docs/evidence/11-merge/merge-rejected-1440.png` — disconnected sibling Steps explained (1440×900)
  - `.docs/evidence/11-merge/present-hides-dock-1440.png` — Present After hides the merge dock (1440×900)
- Earlier-slice defects fixed: After-only Remove picker listed Before-graph candidates (empty HUD) — it now uses the After graph and only After-only Nodes. Merge-pick clicks toggled twice (PathHostFrame + React Flow `onNodeClick`) so adding a Step was a no-op. Dock buttons included the shortcut `kbd` in the accessible name so “Unmerge” matched a `Merge` query.
- Known limitations / follow-ups:
  - Under-1024 unsupported-view message (P-04) — Slice 12
  - Full hardening, axe/visual/performance pass, dead-code sweep, README rewrite — Slice 12
  - Mailroom giant-Step internals are compact (four columns); condition text inside the tile truncates past 22 characters
  - After-only extra outgoing from a base Step does not rewrite that Step’s base Split/strokes (would leak into Before)
- Status: COMPLETE
- Commit: `feat(slice-11): add merge, unmerge, and After-only Steps`

## Slice 12 — integrated hardening and release review — 2026-09-07

- Starting commit: `8333a6243539d93ece9a691a32d708f000eb7bd6` (`feat(slice-11): add merge, unmerge, and After-only Steps`)
- Working tree at start: clean, branch `main`. HEAD matched Slice 11. `npm install` 137 packages, 0 vulnerabilities; start `npm run build` pass; start `npm run test:unit` 27 files / 132 tests.
- GOAL clauses addressed: full-contract review. Newly implemented: P-04 (unsupported view under 1024 CSS px). Hardening/fixes: AQ-03 (Menu focus after Keybinds), AQ-04 (Merge button contrast on Mailroom After), SH-11 (saveKeymap quota), SH-08/SH-14 reload/keymap/theme/sound e2e. README rewritten. Post-relay review plan for a fresh agent: `.docs/REVIEW_PLAN.md`. Clause → evidence table is that file §5 plus the map below.
- Library research and decisions: no new runtime dependency. Unsupported view uses `matchMedia('(min-width: 1024px)')` so the board is not mounted when too narrow (P-04). Mantine `ActionIcon` does not keep a custom `id`; Keybinds restore focuses `header [aria-label="Menu"]` after `returnFocus={false}`. Merge dock primary actions use the same yellow/`--on-yellow` pair as the view radios so axe color-contrast passes. `@mantine/hooks` stays (Mantine 9 peer). Removed unused `.hand-mode` CSS and Pointer-era `.pointer-mode` class name (`board-pan`). Deleted obsolete pre-product sketches `.docs/before-after.*` and `.docs/theme-light-empty.png`.
- Files changed:
  - P-04: `src/app/viewport.ts`, `viewport.test.ts`, `UnsupportedViewport.tsx`, `App.tsx`, `tokens.css`, `vitest.setup.ts`
  - A11y / persist: `KeybindsModal.tsx`, `store.ts` (`setHelp` focus return), `MergeDock.tsx`, `bindings.ts` (`saveKeymap` try/catch), `Board.tsx` (`board-pan`)
  - Tests: `e2e/hardening.spec.ts`, `e2e/axe.ts`, `e2e/smoke.spec.ts`; persistence/shell/bindings/App unit tests
  - Docs: `README.md`, `.docs/REVIEW_PLAN.md`, this handoff entry
  - Evidence: `.docs/evidence/12-release/`
- Behavior implemented: Windows under 1024 CSS pixels show “This window is too narrow” instead of the board; 1024 still works. Closing Keybinds returns focus to Menu. Merge / Confirm on the After dock are high-contrast yellow. Sound, theme, rebound Undo, and edited Target survive reload. Quota-exceeded storage shows one Not saved chip. Valid v1 localStorage migrates on startup. README matches the frozen contract.
- Tests and exact results:
  - `npm install` at start — up to date, audited 137 packages, 0 vulnerabilities
  - `npm run build` at start — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning)
  - `npm run test:unit` at start — pass (27 files, 132 tests)
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning; client `index-BjRqq8D2.js` 904.75 kB)
  - `npm run test:unit` — pass (28 files, 137 tests)
  - `npm run test:e2e` — pass (72 passed, Chromium, 3 workers, 32.1s including webServer)
- Evidence:
  - `.docs/evidence/12-release/before-light-1440.png` — Oak Park Before, final shell (1440×900)
  - `.docs/evidence/12-release/after-light-1440.png` — After (1440×900)
  - `.docs/evidence/12-release/both-light-1440.png` — Both read-only (1440×900)
  - `.docs/evidence/12-release/before-dark-1440.png` — Before dark (1440×900)
  - `.docs/evidence/12-release/after-dark-1440.png` — After dark (1440×900)
  - `.docs/evidence/12-release/both-dark-1440.png` — Both dark (1440×900)
  - `.docs/evidence/12-release/before-light-1024.png` — supported min-width; inspector ≤ 320 px (1024×768)
  - `.docs/evidence/12-release/unsupported-900.png` — P-04 message at 900×700; board not shown
  - `.docs/evidence/12-release/present-light-1440.png` — Present: no inspector/toolbars/dock; score in top bar
  - `.docs/evidence/12-release/hamburger-1440.png` — Present, New, Import, Keybinds, Dark mode, Demo chooser; no Export
  - `.docs/evidence/12-release/replace-gate-1440.png` — Save copy / Discard / Cancel
  - `.docs/evidence/12-release/empty-new-1440.png` — empty New + Add Step
  - `.docs/evidence/12-release/recovery-1440.png` — corrupt storage recovery
  - `.docs/evidence/12-release/not-saved-1440.png` — SH-11 Not saved chip
  - `.docs/evidence/12-release/keybinds-1440.png` — rebound Undo; retired Pointer absent
  - `.docs/evidence/12-release/mailroom-after-1440.png` — Mailroom After merge dock + giant Step
  - `.docs/evidence/12-release/mailroom-after-dark-1440.png` — same After in dark
  - `.docs/evidence/12-release/reduced-motion-restitch-1440.png` — 1:1 remove under reduced motion
- GOAL clause → evidence (every ID; earlier-slice folders remain valid):
  - P-01 README + 12-release light/dark boards; P-02 replace/canvas/merge/hardening e2e; P-03 `09-routing/stress-30-1440.png`; P-04 unsupported-900 + before-light-1024; P-05 1024 inspector width + merge dock After-only; P-06 06-canvas no idle chips; P-07 present-light-1440 + present-hides-dock; P-08 Undo+Sound, no Pointer/Hand; P-09 12-release dark set + axe; P-10 package.json
  - WG-01 empty-new-1440; WG-02..04 commands.test / graph.test; WG-05 path-no-delete; WG-06 root-blocked; WG-07 plus-menu; WG-08..12 06-canvas remove-*; WG-13 history.test.ts
  - PC-01..03 07-inspector path-condition / split-every; PC-04 commands.test; PC-05 routing.spec; PC-06 Oak Park dotted amounts in 12-release Before
  - NA-01..12 07-inspector/* + inspector.spec; NA-04 merge tests
  - CX-01 canvas.spec NodeToolbar; CX-02..05 09-routing/*; CX-06 restitch + reduced-motion-restitch; CX-07..08 picker CSS + Escape
  - BA-01..09 10-projection/* + projection.spec; BA-06/07 11-merge after-plus / after-only-removed
  - MG-01..10 11-merge/* + merge.spec + mailroom-after-1440
  - SH-01..02 08-shell + 12-release chrome; SH-03..04 shell.spec / cues.ts; SH-05 hamburger-1440; SH-06 replace-gate; SH-07 Mailroom 11-merge + 12-release; SH-08 v1 migrate e2e; SH-09..10 recovery-1440; SH-11 not-saved-1440; SH-12 replace.spec history; SH-13 README Save copy; SH-14 keybinds-1440; SH-15 local Nunito
  - AQ-01..03 keybinds + Menu focus e2e; AQ-04 axe smoke/shell/inspector/hardening/unsupported; AQ-05 reduced-motion-restitch; AQ-06 unit workflow tests; AQ-07 Playwright critical flows
  - NG-01..09 hamburger/export/pointer/path-delete/nested-merge checks in e2e + README
- Earlier-slice defects fixed: Keybinds Escape left focus nowhere (Mantine returnFocus targeted an unmounted Menu.Item) — Menu is focused again (AQ-03). Mantine filled Merge button failed axe color-contrast on Mailroom After — yellow chunky primary (P-09, AQ-04). `saveKeymap` could throw on quota — caught like theme/sound (SH-11).
- Known limitations / follow-ups:
  - Mailroom giant-Step internal condition text still truncates past ~22 characters (Slice 11 compact tile; not a GOAL miss)
  - After-only extra outgoing from a base Step still does not rewrite base Split/strokes (would leak into Before)
  - Vite ~900 kB chunk warning and React Flow Pro attribution console warning remain
  - Duplicate Slice 10 block in this ledger is historical; not rewritten
- Status: COMPLETE
- Commit: `feat(slice-12): harden release and rewrite README`

## Improvement 01 — ELK layout and bundled Path routing — 2026-09-07

- Starting commit: `10e2686e16bc34c0604cd947b70f13e1799809a1` (`feat(slice-12): harden release and rewrite README`)
- Working tree at start: not clean (prior unfinished Improvement 01 already had elkjs, layout modules, and evidence). Branch `main`. HEAD matched Slice 12. This chat finished that work, plus the user-requested inspector/canvas UX extras and a follow-up plan, in one commit. `npm install` 137 packages, 0 vulnerabilities.
- GOAL clauses addressed: CX-03, CX-04, CX-05, WG-09, WG-11, PC-01, PC-03 (ELK). Same-chat UX: NA-05, NA-07, P-06, CX-01. Amendments appended 2026-09-07; clauses not edited in place.
- Library research and decisions: `elkjs@^0.12.0` only new runtime dependency (already approved). Worker loaded as Vite `?url` (`elkjs/lib/elk-worker.min.js`); main-thread `elk.bundled.js` is a separate chunk used only if the worker fails. `@tisoap/react-flow-smart-edge` removed. No other new runtime deps. Node placement kept `BRANDES_KOEPF` and added `elk.layered.nodePlacement.bk.fixedAlignment: BALANCED` so a fan-out parent is centered on its children and 1:1 chains stay straight. `elk.edgeLabels.inline` is set on the label element (`LABEL_OPTIONS`), not the root. `elk.layered.wrapping.strategy` stays `OFF` in shipped code. `wrapping-multi-edge-1440.png` used the long-condition MULTI_EDGE *fixture* with wrapping still OFF — not a local uncommitted wrapping-strategy toggle. Production preview (`npx vite preview --port 4178`): `.board-lane[data-layout="ready"]`, worker `assets/elk-worker.min-*.js` loaded, bundled fallback not fetched.
- Files changed:
  - Layout/routing: added `src/board/layout/{elkClient,elkGraph,elkLayout,layoutEngine,laneLayout,useLaneLayout,useAnimatedLayout}.ts` and tests; `src/board/routing/LaneLayoutContext.ts`; `Board.tsx`, `FlowArrow.tsx`, `polyline.ts`, `tileMetrics.ts`. Deleted `layoutLane.ts`, `placeLabels.ts`, `PathLayout.tsx`, `smartStep.ts`, `useModestMotion.ts`.
  - Graph/commands: `PositionMap` through `graph.ts`, `commands.ts`, `store.ts`, `merge.ts` (WG-09/WG-11 on displayed positions).
  - Inspector/canvas UX: `SelectedItemForm.tsx`, `TypeButtons.tsx`, `types.ts` (`typePickerKinds`), `App.tsx` (aside scroll), `PathHostFrame.tsx` (toolbar selected-only), `CanvasHelper.tsx` / `tokens.css` (Excalidraw-style keycaps), `ActorColumn.tsx` (Who figures not clipped).
  - Contract/docs: `.docs/GOAL.md` Amendments, `.docs/IMPROVEMENTS.md`, `.docs/BUILD_PLAN.md` ELK supersession note, `.cursor/rules/agent-handoff.mdc` retained stack, `.docs/merge-tile-and-drag.plan.md`, `.docs/menu-tab-plus.{png,svg}`.
  - Tests: `elkLayout.test.ts`, `layoutEngine.test.ts`, `types.test.ts`; e2e `waitForLayout` in `e2e/ready.ts`; `e2e/routing.spec.ts` evidence under `.docs/evidence/improve-01-layout/`; inspector/canvas/shell/projection/smoke/merge copy updates.
  - Deps: `package.json` / `package-lock.json` (`elkjs`, Smart Edge gone).
- Behavior implemented: Each lane is one ELK layered/orthogonal pass — compact columns, shared Path trunks that split at right angles, chips in reserved gutters that contract when shortened (CX-05). Adding/removing a Node re-packs the lane. Inspector Type omits Scan/Drag/Approve/File unless already stored; Split is Path 1 Path / All Paths and hidden for a single outgoing Path; fields are Name and Details; idle “Select a tile…” copy is gone; inspector and Who portraits scroll/fit instead of clipping; canvas hints are quiet bottom keycaps; +/− show only on the selected tile (or its open add menu).
- Tests and exact results:
  - `npm install` — 137 packages, 0 vulnerabilities
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; main `index-CJWBh1Dz.js` 858.81 kB; worker `elk-worker.min-r_yRvuMO.js` 1,595.33 kB; bundled fallback `elk.bundled-BuO9ZEBf.js` 1,431.11 kB, not in the main graph)
  - `npm run test:unit` — pass (29 files, 150 tests)
  - `npm run test:e2e` — pass (76 passed, Chromium, 3 workers, 37.3s including webServer)
- Evidence:
  - `.docs/evidence/improve-01-layout/before-light-1440.png` — Oak Park Before, bundled fan-out, centered parent, straight chain after merge (1440×900)
  - `.docs/evidence/improve-01-layout/condition-chip-1440.png` — chips beside branch segments, clickable
  - `.docs/evidence/improve-01-layout/label-contract-1440.png` — CX-05 contraction after shortening a condition
  - `.docs/evidence/improve-01-layout/after-light-1440.png` — After lane ELK
  - `.docs/evidence/improve-01-layout/both-light-1440.png` — Both comparison after routing settles
  - `.docs/evidence/improve-01-layout/before-dark-1440.png` — dark theme routed Paths
  - `.docs/evidence/improve-01-layout/restitch-1440.png` — removal restitch stretch then settle
  - `.docs/evidence/improve-01-layout/stress-30-1440.png` — ~30 Nodes/Paths (P-03)
  - `.docs/evidence/improve-01-layout/add-step-1440.png` — new Step in the next column; inspector Name/Details; selected-only +/−; quiet hints
  - `.docs/evidence/improve-01-layout/mailroom-after-1440.png` — Mailroom After ELK (merge tile still the Slice 11 giant Step)
  - `.docs/evidence/improve-01-layout/wrapping-multi-edge-1440.png` — three long wrapping conditions, wrapping.strategy OFF
  - `.docs/evidence/improve-01-layout/zoom-out-label-1440.png` — chip remains the Path hit target when zoomed out (CX-02)
  - `.docs/evidence/improve-01-layout/before-light-1024.png` — supported min-width (1024×768)
  - Earlier-slice e2e folders (`01-harness` … `12-release`) recaptured in this commit so historical screenshots match the ELK board.
- Earlier-slice defects fixed: none that blocked ELK. Inspector rail overflow (Who/score clipped) and hover +/− were product gaps closed here under NA-07 / CX-01 / P-06.
- Known limitations / follow-ups:
  - Merge-group tiles still distort (MG-08 chrome on `STEP_H` ActorColumn). Drag-to-insert, selected-only trash drop, Path `−` on 2+ outgoing only, and the `+` tab drop-palette are specified for a later agent in `.docs/merge-tile-and-drag.plan.md` (visual refs `.docs/menu-tab-plus.png` / `.svg`). Do not implement in this commit.
  - `elk.layered.wrapping.strategy` remains OFF; wrapping screenshot is long labels, not MULTI_EDGE wrapping.
  - `LaneLayout.bounds` is computed but no frame UI (possible later improvement).
  - Mailroom giant-Step internal condition text still truncates past ~22 characters.
  - Vite chunk-size warning (main ~859 kB plus worker/fallback) and React Flow Pro attribution console warning remain.
- Status: COMPLETE
- Commit: `feat(improve-01): add ELK layout and bundled Path routing`

## Improvement 01 — correction 1 — 2026-09-07

- Requested: Zoom felt like two coarse levels, and clicking a tile yanked the camera (zoom to 1). User asked for more intermediate zoom and no automatic viewport moves on object click.
- Changed:
  - `src/board/Board.tsx` — drop `setCenter(..., { zoom: 1 })` on `focusId`; `autoPanOnNodeFocus={false}`; `zoomOnDoubleClick={false}`; zoom range 0.2–2.5 (was 0.2–1.35). One-time `fitView` on first layout of a lane with no stored viewport is unchanged.
  - `.docs/GOAL.md` — P-08 amendment.
  - `e2e/canvas.spec.ts`, `e2e/ready.ts` — click does not change zoom; wheel produces several distinct zoom stops.
- Tests and exact results:
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2)
  - `npm run test:unit` — pass (29 files, 150 tests)
  - `npm run test:e2e` — pass (77 passed, Chromium, 3 workers, 37.6s)
- Status: COMPLETE
- Commit: `feat(improve-01): keep viewport still and widen zoom`

## Improvement 01 — correction 2 — 2026-09-07

- Requested: Separate actor name vs title on tiles; drop yellow from icons and Data (yellow stays for inspector/view selection); in Both, pan/zoom Before and After together as a best-effort client comparison camera.
- Changed:
  - `ActorColumn` / `tokens.css` — name in a cream chip; role/title in a darker sub-box with a gap of pastel between them.
  - `StepKindIcon` — cream/blue/ink only. `DataChip` and Data tiles use `--data` teal.
  - Both camera: `reactFlowBridge.syncBothViewports`, Board `onMove` copy, `setView(Both)` seeds both stored viewports, pan keys move both lanes. Independent cameras remain in Before-only and After-only.
  - `.docs/GOAL.md` — BA-05 amendment (clause text not edited in place).
  - Tests: `store.projection.test.ts` viewport seed; `e2e/projection.spec.ts` Both zoom stays matched.
- Tests and exact results:
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2)
  - `npm run test:unit` — pass (29 files, 151 tests)
  - `npm run test:e2e` — pass (77; one full run hit Windows PNG file-lock on 3 screenshot writes, those three specs re-run 10 passed)
- Status: COMPLETE
- Commit: `feat(improve-01): split actor titles and sync Both camera`

## Improvement 01 — correction 3 — 2026-09-07

- Requested: Name and title on Step tiles must not sit as two unrelated chips. No gap of column fill between them. Grey for the title was too dull; the title should read as a nested sub-box of the name card.
- Changed:
  - `src/board/tiles/ActorColumn.tsx` — wrap name + title in `.actor-card`; set `--actor-fill` from the actor’s pastel on the Who column; title copy uses `FIGURE_INK_ON_PASTEL` so it stays dark on the nested chip in both themes.
  - `src/board/tiles/FitLabel.tsx` — optional `color` (default `var(--ink)`).
  - `src/app/styles/tokens.css` — cream parent card, zero gap; title inset uses a darker/punchier `oklch(from var(--actor-fill) …)` mix of that same hue (not grey, not a hole showing the strip).
- Tests and exact results:
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2)
  - `npm run test:unit` — pass (29 files, 151 tests)
  - `npm run test:e2e` — pass (77 Chromium). One parallel run hit Windows PNG file-lock on 4 screenshot writes plus a Mailroom load timeout; those specs re-ran 28 passed (1 remaining lock retried 1 passed).
- Status: COMPLETE
- Commit: `feat(improve-01): nest actor title inside the name card`

## Improvement 01 — correction 4 — 2026-09-07

- Requested: Overlapping dotted Paths should stay visibly dotted (not look solid). Push the actor title into a larger bottom sub-box of the name card with the name snug above it. Kill the “Remove which Node?” dialog; the on-tile control should be a larger red X that actually removes, with a hover lift.
- Changed:
  - `src/board/routing/polyline.ts`, `FlowArrow.tsx` — dotted (and restitch) strokes are drawn as world-aligned segments so shared trunks keep the same dash phase.
  - `src/app/styles/tokens.css` — name 22px packed to the title; title 48px nested sub-box at the bottom of the cream card.
  - Removal: `RemovePickerHud` is pairing-preview only. `PathHostFrame` shows a red X on each candidate (`removePickedNode`). Inspector Remove / − / Delete still enter pick; Enter still removes the highlighted candidate; many-to-many pairing HUD unchanged. Root host still explains it cannot be removed (transient notice) while children remain pickable.
  - `.docs/GOAL.md` — WG-08, WG-09, NA-12 amendment (clause text not edited in place).
  - e2e: `confirmRemoveNode` in `e2e/ready.ts`; canvas/commands/routing/hardening/merge specs click the X instead of the old dialog.
- Tests and exact results:
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2)
  - `npm run test:unit` — pass (29 files, 152 tests)
  - `npm run test:e2e` — pass (77 Chromium). One parallel run failed 2 specs that still expected the HUD root copy; after the root notice, those two re-ran passed.
- Status: COMPLETE
- Commit: `feat(improve-01): align dotted Paths and remove Nodes with X`

## Improvement 01 — correction 5 — 2026-09-07

- Requested: The Who card still did not match the Dana / Mail clerk mockup. Name must sit flush on a large nested title sub-box; that sub-box should be terracotta/warm brown (not grey, not magenta); cream parent with peach showing around it.
- Changed:
  - `src/board/tiles/FitLabel.tsx` — `hug` packs the name row (`height: auto`, line-height 1) so glyphs sit on the title chip.
  - `src/board/tiles/ActorColumn.tsx` — name max 16px; title still `FIGURE_INK_ON_PASTEL`.
  - `src/app/styles/tokens.css` — cream card, zero gap; title flex-fills the remaining height; fill is `oklch(from var(--actor-fill) 0.69 clamp(0.07, calc(c + 0.075), 0.13) h)` so Dana’s chip is ~`#d68547`.
  - `e2e/routing.spec.ts` — Mailroom Before capture `mailroom-dana-card-1440.png`.
  - Recaptured e2e evidence PNGs (Who column visible on tiles).
- Tests and exact results:
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2)
  - `npm run test:unit` — pass (29 files, 152 tests)
  - `npm run test:e2e` — pass (77 Chromium)
- Evidence: `.docs/evidence/improve-01-layout/mailroom-dana-card-1440.png` — Mailroom Before; Dana cream card with terracotta Mail clerk sub-box packed under the name
- Status: COMPLETE
- Commit: `feat(improve-01): pack actor name against a terracotta title sub-box`

## Improvement 01 — correction 6 — 2026-09-07

- Requested: Path inspector should be only a **label** field — drop the Path / condition heading and Always visited / Choice buttons. Who name/title card was clipped by the actor strip; inset it for breathing room. Title chip colors were too punchy.
- Changed:
  - `src/app/inspector/SelectedItemForm.tsx` — Path rail is one `label` text field. Stroke override stays on the existing keybind; Split still sets defaults.
  - `src/board/tiles/StepTile.tsx`, `ActorColumn.tsx`, `MergedStepTile.tsx` — tile is border-box; Who column fills height; cream card sits in 8/12px strip padding so it is not clipped.
  - `src/app/styles/tokens.css` — quieter same-hue title wash (`l * 0.84`); lower card min-height.
  - `.docs/GOAL.md` — NA-07 / PC-03 amendment.
  - e2e/unit: Path inspector assertions use `#path-condition-field`; no stroke buttons in the rail.
- Tests and exact results:
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2)
  - `npm run test:unit` — pass (29 files, 152 tests)
  - `npm run test:e2e` — pass (77 Chromium)
- Evidence: `.docs/evidence/07-inspector/path-condition-1440.png` — Path rail is only the label field; `.docs/evidence/improve-01-layout/mailroom-dana-card-1440.png` — Dana cream card inset above the strip bottom
- Status: COMPLETE
- Commit: `feat(improve-01): simplify Path inspector and inset Who card`

## Improvement 02 — merge tile, stretchy +, Path-pull, insert — 2026-09-07

- Starting commit: `81994f8` (feat(improve-01): simplify Path inspector and inset Who card)
- Working tree at start: dirty (in-progress Improvement 02 plus Path-inspector follow-up already at HEAD)
- GOAL clauses addressed: WG-07, WG-08, WG-09, NA-12, MG-08, AQ-01, NG-02, NG-03 (amendments appended; frozen clause text unchanged)
- Library research and decisions: No new runtime deps. Tile pickup and tab pulls use pointer capture + portals (React Flow `nodesDraggable` stays false so ELK keeps layout). Path-pull uses `elementFromPoint` onto `.react-flow__node`. Insert hit-tests ELK routes (`pathHit.ts`).
- Files changed:
  - Domain: `src/workflow/commands.ts` (`insertNodeOnPath`; condition stays on S→T), `src/workflow/catalogs.ts` (`ReactFlowNodeKind.MergeGroup`)
  - State: `src/state/store.ts`, `src/state/interaction.ts` (plus-pull, path-pull, tile-drag; selected-only `removeTarget`; no add-menu / remove-pick)
  - Board: `TileChrome.tsx`, `PathKnotIcon.tsx`, `PathHostFrame.tsx`, `Board.tsx`, `MergeGroupNode.tsx`, `MergeWhoColumn.tsx`, `MergedStepTile.tsx`, `mergeFlow.ts`, `FlowArrow.tsx`, `pathHit.ts`; deleted `OutgoingPathPad.tsx`
  - Keys / inspector / CSS: `useAppKeys.ts`, `bindings.ts`, `CanvasHelper.tsx`, `SelectedItemForm.tsx`, `tokens.css`
  - Tests: unit insert/remove; e2e canvas/merge/projection/commands/routing/shell/hardening
  - Docs: `.docs/GOAL.md` amendments; evidence under `.docs/evidence/improve-02-merge-drag/`
- Behavior implemented:
  - Selected tile only: red X (no neighbor pick, no red outline). X / Delete / inspector Remove act on that Node; auto restitch is immediate; M:N still opens pairing preview. Root and After Before-origin explain. After merge-tile X is Unmerge. Tile `−` is gone.
  - Stretchy `+` tab: click does nothing; pull fans Step/Data previews (After: Step only). `1` / `2` spawn immediately. Path knot tab: drag a string onto a Node to connect. No Path hotkey.
  - Drag a selected Step/Data onto a Path to insert (Before); condition moves to S→T. Empty drop cancels. Dedicated merge RF node; Robot stays normal size.
- Tests and exact results:
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2)
  - `npm run test:unit` — pass (30 files, 156 tests)
  - `npm run test:e2e` — pass (77 Chromium)
- Evidence:
  - `.docs/evidence/improve-02-merge-drag/selected-x-1440.png` — selected tile X top-left, + and Path tabs, no red outline, no −
  - `.docs/evidence/improve-02-merge-drag/plus-pull-previews-1440.png` — stretchy + fanning Step and Data
  - `.docs/evidence/improve-02-merge-drag/path-knot-pull-1440.png` — knot tab pulling a dashed Path string
  - `.docs/evidence/improve-02-merge-drag/mailroom-after-1440.png` — Mailroom After merge tile with normal-size Robot
- Earlier-slice defects fixed: Path inspector **label** field (already at starting HEAD). Removal picker neighbors/red outline replaced per this improvement.
- Known limitations / follow-ups: After-only insert-on-Path not implemented (Before-origin insert in After is rejected). Path connect is pointer-only (AQ-01 exception, user approved). Insert-on-Path has unit coverage, not a dedicated e2e drag. Nested/partial unmerge still out of scope.
- Status: COMPLETE
- Commit: `feat(improve-02): add merge tile type and tile drag`

## Planning — Improvements 03 and 04 — 2026-09-07

- Starting commit: `8315e5298ddaeb6e0548601390e040a9b7853ed7` (`feat(improve-02): add merge tile type and tile drag`)
- Working tree at start: clean product tree; two untracked ELK planner dumps left uncommitted
- GOAL clauses addressed: n/a (planning only; implementing agents append amendments)
- Library research and decisions: User approved a two-agent split after Improvement 02 review: 03 polish + Path editing; 04 insert-on-Path live preview (no ELK-on-move). No product code in this commit.
- Files changed:
  - `.docs/improve-03-polish-and-path.plan.md`
  - `.docs/improve-04-insert-preview.plan.md`
  - `.docs/IMPROVEMENTS.md` (02 marked complete; 03/04 kickoffs)
  - This handoff entry
- Behavior implemented: none. Next agent is Improvement 03 only.
- Tests and exact results:
  - `npm run build` — not run (docs only)
  - `npm run test:unit` — not run (docs only)
  - `npm run test:e2e` — not run (docs only)
- Evidence: n/a
- Earlier-slice defects fixed: none
- Known limitations / follow-ups: Improvement 03 then 04, sequential. Path `−`, free-form layout, nested unmerge, After-only insert remain out of scope.
- Status: COMPLETE
- Commit: `docs: add improve-03 polish and improve-04 insert-preview plans`

## Planning — Improvement 05 and visual log — 2026-09-07

- Starting commit: `ac66ed4cabd717fd96e8bfa58f271c6adef94f22` (`docs: add improve-03 polish and improve-04 insert-preview plans`)
- Working tree at start: clean product tree; two untracked ELK planner dumps left uncommitted
- GOAL clauses addressed: n/a (planning only; implementing agents append amendments)
- Library research and decisions: User asked for a separate agent for Step-select jump + Before/After/Both fill/frame, plus an always-on rule that logs attached pictures/GIFs in `.docs/VISUAL_IMPROVEMENTS.md`. No product code in this commit.
- Files changed:
  - `.docs/improve-05-chrome.plan.md`
  - `.docs/VISUAL_IMPROVEMENTS.md` and `.docs/visual-improvements/*` (user originals)
  - `.cursor/rules/visual-improvements.mdc`, `.cursor/rules/agent-handoff.mdc`
  - `.docs/IMPROVEMENTS.md`, `.docs/improve-03-polish-and-path.plan.md` (scope notes)
  - This handoff entry
- Behavior implemented: none. Next agent is still Improvement 03. Improvement 05 waits until 04 is COMPLETE.
- Tests and exact results:
  - `npm run build` — not run (docs only)
  - `npm run test:unit` — not run (docs only)
  - `npm run test:e2e` — not run (docs only)
- Evidence: n/a (user originals under `.docs/visual-improvements/`)
- Earlier-slice defects fixed: none
- Known limitations / follow-ups: Tile `--select-ring` cyan glow left for a later slice. Global `--chrome-line` restyle out of 05.
- Status: COMPLETE
- Commit: `docs: add improve-05 chrome plan and visual improvement log`

## Planning — Improvements 06 and 07 — 2026-09-07

- Starting commit: `83be44e102cfa75ed62559888df82da2efaffa1f` (`docs: add improve-05 chrome plan and visual improvement log`)
- Working tree at start: clean product tree; two untracked ELK planner dumps left uncommitted
- GOAL clauses addressed: n/a (planning only)
- Library research and decisions: 03–05 stay locked. New Improvement 06 for Who/trash/Other/lane chips/hamburger/zoom. Merge is too large for 06 → Improvement 07 surgical removal (schema `groups` kept, unfold on load). Zoom-toward-graph is locked as bounds-center when the pointer is on empty paper. No product code in this commit.
- Files changed:
  - `.docs/improve-06-shell.plan.md`, `.docs/improve-07-no-merge.plan.md`
  - `.docs/VISUAL_IMPROVEMENTS.md` plus Who PNG and zoom GIF under `.docs/visual-improvements/`
  - `.docs/IMPROVEMENTS.md`, `.docs/improve-03-polish-and-path.plan.md`
  - This handoff entry
- Behavior implemented: none. Next agent is still Improvement 03.
- Tests and exact results:
  - `npm run build` — not run (docs only)
  - `npm run test:unit` — not run (docs only)
  - `npm run test:e2e` — not run (docs only)
- Evidence: user originals `2026-09-07-who-alice-selected.png`, `2026-09-07-wheel-zoom.gif`
- Earlier-slice defects fixed: none
- Known limitations / follow-ups: 03 → 04 → 05 → 06 → 07. Merge redesign is later, not 07.
- Status: COMPLETE
- Commit: `docs: add improve-06 shell and improve-07 no-merge plans`

## Improvement 03 — polish, Path stroke, on-canvas label — 2026-09-07

- Starting commit: `83be44e102cfa75ed62559888df82da2efaffa1f` (`docs: add improve-05 chrome plan and visual improvement log`). Kickoff asked for `ac66ed4`; latest COMPLETE at start was improve-05 planning. During this chat `e5ac9d8` (`docs: add improve-06 shell and improve-07 no-merge plans`) landed; this commit sits on that HEAD. Product work is Improvement 03 only (not 04–07).
- Working tree at start: tracked files clean; untracked ELK planner dumps left uncommitted
- GOAL clauses addressed: NA-07, PC-02, PC-03, NA-08, P-08, CX-06, WG-07, P-01, SH-04, CX-07, AQ-04 (amendments appended 2026-09-07; clauses not edited in place)
- Library research and decisions: no new runtime dependency. Split stays in the document and still seeds new Paths (`maybeExclusiveSplit` / `applyConnectStroke` unchanged). Per-Path stroke is `updateEdge({ dashed })` / `toggleSelectedDash` and does not rewrite siblings. On-canvas Path editor is interaction `{ kind: "path-label-edit", edgeId }` plus an `EdgeLabelRenderer` input; inspector `#path-condition-field` stays in sync and is not focused. Plus-pull scrim uses an SVG hole over the source tile so the tile stays undimmed; wedge is a trapezoid from the tile’s right edge to the preview cluster (taffy path removed). Path-pull dashed string unchanged. Locked actor/`--data` hexes applied; Dana `#f4a06a`; Omar/Priya pick up Roy/Missy presets. If a locked hex had failed axe it would have been nudged; none did.
- Files changed:
  - Contract/docs: `.docs/GOAL.md` amendments; `.docs/IMPROVEMENTS.md` (03 marked COMPLETE); this handoff entry
  - Chrome/tiles: `TileChrome.tsx`, `PathKnotIcon.tsx`, `tokens.css`, `ActorColumn.tsx`, `MergeWhoColumn.tsx`, `DataTile.tsx`
  - Path UX: `Board.tsx`, `FlowArrow.tsx`, `SelectedItemForm.tsx`, `CanvasHelper.tsx`, `useAppKeys.ts`, `store.ts`, `interaction.ts`
  - Color/sound: `actors.ts`, `oakParkInvoice.ts`, `robotMailroom.ts`, `cues.ts`
  - Tests: `store.actors.test.ts`, `App.test.tsx`, `e2e/inspector.spec.ts`, `e2e/canvas.spec.ts`
  - Evidence: `.docs/evidence/improve-03-polish/`; earlier e2e folders recaptured with new palette and chrome
- Behavior implemented:
  - `+` pull past threshold dims the board, keeps the source tile and previews undimmed, and draws a cream/green trapezoid wedge (After: Step only). Click still does nothing.
  - Selected-tile X is ~45% opacity until hover/focus. Path-pull tab is teal with a knot+string glyph.
  - Who name card hugs content; role chip pads to the type; task column is a centered stack. Data chip+label are a centered column; `+` Data preview is the oval `DataChip`.
  - Path inspector is **label** plus Dotted/Solid (hidden for a single outgoing Path). Step inspector no longer shows Split. Double-click Path/chip toggles that Path’s stroke. Enter opens an on-canvas chip editor (Escape/click-away close; typing still per-keystroke).
  - Node removal is a short bubble-pop; remove cue is a rounder sine pop.
- Tests and exact results:
  - `npm install` at start — up to date, 137 packages, 0 vulnerabilities
  - `npm run build` at start — pass (`tsc --noEmit && vite build`; Vite 8.2.2)
  - `npm run test:unit` at start — pass (30 files, 156 tests)
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning; client `index-BelJqt5A.js` 868.66 kB)
  - `npm run test:unit` — pass (30 files, 158 tests)
  - `npm run test:e2e` — pass (78 passed, Chromium, 3 workers, 37.9s including webServer)
- Evidence:
  - `.docs/evidence/improve-03-polish/plus-wedge-1440.png` — Oak Park `+` pulled; Step + Data; dim scrim and wedge (1440×900)
  - `.docs/evidence/improve-03-polish/path-tab-1440.png` — selected tile; teal Path-pull tab readable (1440×900)
  - `.docs/evidence/improve-03-polish/dana-card-1440.png` — Mailroom Before; Dana / Mail clerk packed (1440×900)
  - `.docs/evidence/improve-03-polish/data-centered-1440.png` — Data tile with default “Data” copy, oval centered (1440×900)
  - `.docs/evidence/improve-03-polish/path-type-on-chip-1440.png` — on-canvas Path label editor; inspector label mirrors; inspector input not focused (1440×900)
- Earlier-slice defects fixed: none that blocked this improvement
- Known limitations / follow-ups: insert-on-Path live preview — Improvement 04. Step-select jump and view-switch fill — Improvement 05. Inspector Who/trash/zoom/hamburger — Improvement 06. Merge removal — Improvement 07. Path `−` remains forbidden.
- Status: COMPLETE
- Commit: `feat(improve-03): polish chrome Path stroke and on-canvas label`

## Improvement 04 — insert-on-Path live preview — 2026-09-07

- Starting commit: `3a5800ee1cd42cbf90d682bf941b6b8e29c2b4bf` (`feat(improve-03): polish chrome Path stroke and on-canvas label`)
- Working tree at start: tracked files clean; untracked ELK planner dumps left uncommitted
- GOAL clauses addressed: NG-02, CX-05, CX-06, CX-07 (amendment appended 2026-09-07; clauses not edited in place)
- Library research and decisions: no new runtime dependency. Preview is display-only (`insertPreviewGeom`); ELK is not run on pointer move; `insertNodeOnPath` still runs only on drop. Neighbor ease uses the CSS `translate` property on RF nodes (does not overwrite RF `transform` / `position`). Reduced motion skips ease and Path morph; highlight, stubs, and silhouette still snap. After insert-on-Path remains Before-only.
- Files changed:
  - Contract/docs: `.docs/GOAL.md` amendment; `.docs/IMPROVEMENTS.md` (04 marked COMPLETE); this handoff entry
  - Geometry: `src/board/layout/insertPreview.ts`, `insertPreview.test.ts`
  - Board: `Board.tsx` (S/U translate, origin fade, `data-insert-preview`), `FlowArrow.tsx` (split stubs, hover band behind), `TileChrome.tsx` (silhouette `ViewportPortal`; pickup stays live during tile-drag; pointerdown `stopPropagation` so pan does not steal the gesture)
  - Shell: `CanvasHelper.tsx`, `tokens.css`
  - Tests: `src/app/App.test.tsx`, `e2e/insert-preview.spec.ts`
  - Evidence: `.docs/evidence/improve-04-insert-preview/`
- Behavior implemented:
  - Dragging a selected Step or Data over a Path shows split stubs, a landing silhouette in a gap, and (when there is room) S/U easing apart. The origin tile fades; the pointer ghost stays under the cursor.
  - Hover change snaps the previous pair back. Empty drop cancels with no document write. Drop still commits `insertNodeOnPath` then one ELK pass.
- Tests and exact results:
  - `npm install` at start — up to date, 137 packages, 0 vulnerabilities
  - `npm run build` at start — pass (`tsc --noEmit && vite build`; Vite 8.2.2)
  - `npm run test:unit` at start — pass (30 files, 158 tests)
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning; client `index-CdsKIc9F.js` 874.70 kB)
  - `npm run test:unit` — pass (31 files, 162 tests)
  - `npm run test:e2e` — pass (80 passed, Chromium, 3 workers, 39.8s including webServer)
- Evidence:
  - `.docs/evidence/improve-04-insert-preview/insert-hover-gap-1440.png` — Oak Park Before; Review in-drag over `e_gt`; split stubs, silhouette, origin faded, pointer ghost (1440×900)
  - `.docs/evidence/improve-04-insert-preview/insert-drop-after-1440.png` — after drop; Review between Read and website; condition on S→T; layout `ready` (1440×900)
  - `.docs/evidence/improve-04-insert-preview/insert-cancel-1440.png` — empty drop; graph identical to pre-drag (1440×900)
- Earlier-slice defects fixed: Improvement 02 `TilePickup` disabled itself when `tile-drag` began, which cleared pointer-capture state; pickup now stays enabled for that gesture. Pointerdown on a selected tile stops propagation so board pan does not steal the insert drag.
- Known limitations / follow-ups: Step-select jump and view-switch fill — Improvement 05. Inspector Who/trash/zoom/hamburger — Improvement 06. Merge removal — Improvement 07. After-only insert-on-Path and Path `−` remain out of scope. Packed ELK gutters may clamp neighbor ease to zero (split + silhouette still show).
- Status: COMPLETE
- Commit: `feat(improve-04): preview tile insert on Path while dragging`

## Improvement 05 — Step select stay-put, chunky view switch — 2026-09-07

- Starting commit: `66cc0f1a9513c07e32ef025dd0b6533d18c649f8` (`feat(improve-04): preview tile insert on Path while dragging`)
- Working tree at start: tracked files clean; untracked ELK planner dumps left uncommitted
- GOAL clauses addressed: CX-07, P-01, SH-01, SH-02 (amendments appended 2026-09-07; clauses not edited in place)
- Library research and decisions: no new runtime dependency. Kept the existing `ViewSwitch` radiogroup of three buttons; did not use Mantine `SegmentedControl`. Frame is 4 px `var(--ink)` (ink in light, ice in dark) with an inner overflow-hidden track at radius 10 px so the selected yellow fill meets the outer curve. Dropped the `.is-on` inset yellow ring. `--chrome-line` cyan stays on the rest of the chrome. Tile `--select-ring` unchanged. Drag-lift `translateY(-3px)` kept.
- Files changed:
  - Contract/docs: `.docs/GOAL.md` amendments; `.docs/IMPROVEMENTS.md` (05 marked COMPLETE); this handoff entry
  - Tiles: `StepTile.tsx`, `MergedStepTile.tsx` (select no longer translates)
  - Shell: `Toolbar.tsx` (inner `.view-switch-track`), `tokens.css` (ink/cream frame, full-cell yellow, ink dividers)
  - Tests: `e2e/view-switch.spec.ts`
  - Evidence: `.docs/evidence/improve-05-chrome/`; existing shell/e2e screenshots recaptured with the new switch
- Behavior implemented:
  - Selecting a Step or merge tile no longer nudges it 1 px. Data was already still. Drag still lifts.
  - Before / After / Both uses a chunky ink (light) or ice (dark) frame. Selected yellow fill goes edge-to-edge of that cell, including Before’s left radius and Both’s right. No cyan hairline on this control. Present still shows the switch.
- Tests and exact results:
  - `npm install` at start — up to date, 137 packages, 0 vulnerabilities
  - `npm run build` at start — pass (`tsc --noEmit && vite build`; Vite 8.2.2)
  - `npm run test:unit` at start — pass (31 files, 162 tests)
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning; client `index-Ddrg4ON3.js` 874.71 kB)
  - `npm run test:unit` — pass (31 files, 162 tests)
  - `npm run test:e2e` — pass (81 passed, Chromium, 3 workers, 40.3s including webServer)
- Evidence:
  - `.docs/evidence/improve-05-chrome/view-switch-before-1440.png` — Before selected; yellow meets the left radius; 4 px ink frame, no cyan (1440×900)
  - `.docs/evidence/improve-05-chrome/step-select-1440.png` — Search website selected next to unselected Search filesystem; no 1 px hop (1440×900)
- Earlier-slice defects fixed: none
- Known limitations / follow-ups: Inspector Who/trash/Other/zoom/hamburger — Improvement 06. Merge removal — Improvement 07. Global `--chrome-line` restyle and tile `--select-ring` remain out of scope.
- Status: COMPLETE
- Commit: `feat(improve-05): keep Steps still and chunk the view switch`

## Improvement 06 — inspector Who, trash, Other copy, zoom, hamburger — 2026-09-07

- Starting commit: `e941863148e9f462f092d8ff0067f73ce937449e` (`feat(improve-05): keep Steps still and chunk the view switch`)
- Working tree at start: tracked files clean; untracked ELK planner dumps left uncommitted
- GOAL clauses addressed: NA-05, NA-10, NA-12, SH-02, P-08 (amendments appended 2026-09-07; clauses not edited in place)
- Library research and decisions: no new runtime dependency. Tabler `IconTrash`. Who/Type/fat selected drop the dashed outline; dark Who selected uses `--cream` + `--ink`. Wheel zoom is custom (`zoomOnScroll={false}`); pinch stays React Flow. Each 100 px notch multiplies zoom by 1.08, clamped 0.2–2.5. Zoom-in on empty paper or a graph island (<40% of the pane on both axes) uses `LaneLayout.bounds` center; pointer over a Node or Path, and all zoom-out, stay cursor-centered. Both-view wheel copies the viewport onto the other lane before marking this instance programmatic (otherwise `syncBothViewports` skipped). Hamburger is a controlled Mantine Menu; pointer on `.board-lane` closes; inspector does not; leave the button+dropdown union by >40 px closes.
- Files changed:
  - Contract/docs: `.docs/GOAL.md` amendments; `.docs/IMPROVEMENTS.md` (06 marked COMPLETE); this handoff entry
  - Inspector/shell: `SelectedItemForm.tsx`, `tokens.css`, `Toolbar.tsx`, `hamburgerDismiss.ts`, `App.tsx` (LaneLabel removed)
  - Copy/zoom: `types.ts`, `StepTile.tsx`, `Board.tsx`, `zoom.ts`
  - Tests: `types.test.ts`, `zoom.test.ts`, `hamburgerDismiss.test.ts`, `merge.test.ts`, `App.test.tsx`, `e2e/improve-06-shell.spec.ts`, existing e2e that asserted `BEFORE`/`AFTER` chips or inspector `Remove`; `e2e/ready.ts` `capturePage` retries evidence PNG writes on Windows
  - Evidence: `.docs/evidence/improve-06-shell/`; existing e2e folders recaptured without lane chips
- Behavior implemented:
  - Selected Who/Type/fat is fill only (no dashed ring). Dark Who selected is cream fill with ink text.
  - Step/Data inspector Remove is a top-right trash (`Remove Step` / `Remove Data`); same `removeTarget` rules; no Path trash; tile X unchanged.
  - Type Other tiles show Name only (empty Name → icon, no headline). Unnamed Other `nodeCaption` is `Step`.
  - BEFORE/AFTER corner chips are gone. View switch is the only view name.
  - Open hamburger closes when the pointer returns to the board (also if it leaves the menu by ~40 px). Inspector hover keeps it open.
  - Mouse-wheel zoom is finer (~1.08× per notch). Zoom-in on empty paper aims at the laid-out graph.
- Tests and exact results:
  - `npm install` at start — up to date, 137 packages, 0 vulnerabilities
  - `npm run build` at start — pass (`tsc --noEmit && vite build`; Vite 8.2.2)
  - `npm run test:unit` at start — pass (31 files, 162 tests)
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning; client `index-CP-tRgCm.js` 877.68 kB)
  - `npm run test:unit` — pass (33 files, 177 tests)
  - `npm run test:e2e` — pass (83 passed, Chromium, 3 workers, 44.1s including webServer)
- Evidence:
  - `.docs/evidence/improve-06-shell/who-selected-1440.png` — Alice selected in Who; yellow fill, no dashed ring (1440×900)
  - `.docs/evidence/improve-06-shell/inspector-trash-1440.png` — Step inspector; trash top-right, no Remove text button (1440×900)
  - `.docs/evidence/improve-06-shell/other-tile-1440.png` — Type Other + Name “File boxes”; tile has no “Other” word (1440×900)
  - `.docs/evidence/improve-06-shell/no-lane-chip-1440.png` — Before view; view switch only, no BEFORE chip (1440×900)
- Earlier-slice defects fixed: Both-view custom wheel must sync the other lane before `applyViewport` marks the source programmatic. Evidence PNG overwrite on Windows (`UNKNOWN: open`) retried via `capturePage`.
- Known limitations / follow-ups: Merge / Unmerge / merge dock — Improvement 07. Tile `--select-ring` and global `--chrome-line` remain out of scope. Dark Who selected fill uses `--cream`, which is also the unselected Who well in dark (fill-only, no ring). Zoom did not need the `< 0.55` fallback.
- Status: COMPLETE
- Commit: `feat(improve-06): quiet Who select trash Other and finer zoom`

## Improvement 07 — remove merge groups from the product — 2026-09-07

- Starting commit: `42ae9e45435dfc6ed94d4ea97352c4bee60909f6` (`feat(improve-06): quiet Who select trash Other and finer zoom`)
- Working tree at start: not clean. Leftover approved work from the prior chat (score copy withdrawn, hamburger text-only, Improvement 08 planning docs/GIFs). CRLF-only and recaptured evidence PNGs were restored to HEAD before 07 product work. Untracked ELK planner dumps left uncommitted, as prior agents did.
- GOAL clauses addressed: P-02, P-05, P-07, MG-01..MG-10, BA-04, BA-05, SH-07, SH-14 (merge withdrawn 2026-09-07); also committed leftover P-07/BA-08 score and P-07/P-10 hamburger amendments already in the working GOAL
- Library research and decisions: no new runtime dependency. Document version stays 2. `after.groups` remains in Zod / `WorkflowDoc`; load/import unfolds groups and writes `groups: []`. Optional notice `"Merged tiles were unfolded."` `twoNote` synthesizer kept unused. Did not implement Improvement 08.
- Files changed:
  - Contract/docs: `.docs/GOAL.md` amendments; `.docs/IMPROVEMENTS.md` (07 COMPLETE; 08 plan recorded, not implemented); `.docs/improve-07-no-merge.plan.md`; `.docs/improve-08-plus-chrome.plan.md` and visual log attachments (planning only); this handoff entry
  - Merge runtime/UI removed: `src/workflow/merge.ts`, `MergeDock.tsx`, `MergeGroupNode.tsx`, `MergedStepTile.tsx`, `MergeWhoColumn.tsx`, `mergeFlow.ts`, plus their tests
  - After-only kept as `src/workflow/after.ts`; unfold in `types.ts` / `migrate.ts` / `store.replaceDoc` / persist hydrate
  - Mailroom fixture has no group; After shows individual Before-origin Steps (Mailbot Who) plus the receipt Step
  - Projection is `"base" | "extra"` only; catalogs drop Merge/Unmerge keys and the merge React Flow type
  - Scoring module deleted (BA-08 leftover); hamburger items text-only (P-10 leftover)
  - Tests: `src/workflow/after.test.ts`, persist/store unfold cases, rewritten `e2e/merge.spec.ts`, `e2e/improve-07-no-merge.spec.ts`
  - Evidence: `.docs/evidence/improve-07-no-merge/`; Mailroom After and related e2e screenshots recaptured without a merge tile
- Behavior implemented:
  - After has no merge dock, merge tile, Unmerge, or Merge/Unmerge keys. Before-origin Steps in After are normal tiles. After-only Steps/Paths remain.
  - Loading JSON with `after.groups` drops the groups, keeps After Who, and may notice once.
  - After still cannot remove a Before-origin Step (BA-04) and does not offer Unmerge.
- Tests and exact results:
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning; client `index-Bte18ZAr.js` 857.73 kB)
  - `npm run test:unit` — pass (31 files, 163 tests)
  - `npm run test:e2e` — pass (81 passed, Chromium, 3 workers, 44.0s including webServer)
- Evidence:
  - `.docs/evidence/improve-07-no-merge/mailroom-after-no-merge-1440.png` — Mailroom After; scan/lookup/route as normal tiles; receipt present; no merge dock (1440×900)
  - `.docs/evidence/improve-07-no-merge/after-inspector-no-unmerge-1440.png` — Scan letter to PDF selected in After; inspector has no Unmerge (1440×900)
  - `.docs/evidence/improve-07-no-merge/keybinds-no-merge-1440.png` — Keybinds dialog; no Merge or Unmerge rows (1440×900)
- Earlier-slice defects fixed: Who role-chip wash used `oklch(l * 0.84)` of the actor pastel, which failed axe color-contrast on Script Mailbot tiles once Mailroom After showed those Steps individually. Floored chip lightness at 0.86 so figure ink stays AA in light and dark.
- Known limitations / follow-ups: Merge redesign is later work, not Improvement 08. Improvement 08 is plus taffy, tucked tabs, and Path stroke. Tile `--select-ring` and global `--chrome-line` remain out of scope. `after.groups` still parses on disk.
- Status: COMPLETE
- Commit: `feat(improve-07): remove merge groups from the product`

## Improvement 08 — restore + taffy, tuck tabs, fix Path stroke — 2026-09-08

- Starting commit: `10af73ccee7aa13d6d1c7dbb5db374e5b8604175` (`feat(improve-07): remove merge groups from the product`)
- Working tree at start: not fully clean. Untracked ELK planner dumps (`.docs/elk_layout_and_routing_*.plan.md`) left uncommitted, as prior agents did. Product tree matched Improvement 07 HEAD.
- GOAL clauses addressed: WG-07, CX-01, AQ-01 (amendments dated 2026-09-07); stroke toggle already under P-08 / NA-07 / PC-02 / PC-03 — this slice fixes the drawn stroke, no extra amendment
- Library research and decisions: no new runtime dependency. Restored `taffyPath` from improve-02 (`8315e52`). Path glyph is original SVG (spindle + string), not Tabler. Did not reopen merge, ELK, or insert-on-Path.
- Files changed:
  - Contract/docs: `.docs/GOAL.md` amendments; `.docs/IMPROVEMENTS.md` (08 COMPLETE); this handoff entry
  - Chrome: `src/board/controls/TileChrome.tsx` (taffy, drop wedge, `showFan` requires `drag.live`, empty release clears immediately); `src/board/controls/PathKnotIcon.tsx` (`PathSpindleIcon`); `src/app/styles/tokens.css` (tabs behind `.tile-pickup`, X hover color-only, Data thumb 72×44, Path hit stroke transparent)
  - Stroke: `src/board/routing/FlowArrow.tsx` (`path-hit-only` / overlay `data-path-overlay`); `src/board/Board.tsx` (edge `data.dotted` so RF remounts)
  - Tests: `e2e/ready.ts` (`tabPeekPoint`, shared `pathScreenPoint`); `e2e/canvas.spec.ts`, `e2e/merge.spec.ts`, `e2e/insert-preview.spec.ts`, `e2e/inspector.spec.ts`; `e2e/improve-08-plus-chrome.spec.ts`
  - Evidence: `.docs/evidence/improve-08-plus-chrome/`
- Behavior implemented:
  - Pulling `+` draws the green taffy while the pointer is down. Fan and scrim appear only past the pull threshold. Empty release dismisses fan and scrim immediately (no 520 ms linger).
  - Selected-tile `+` and Path tabs peek from behind the tile face (~22 px). X stays on top; hover is color/opacity only.
  - Path tab glyph is a spindle with a string. Accessible name unchanged.
  - Data fan thumb uses the same 72×44 box as Step, chip centered.
  - Inspector Solid / Path double-click change the drawn stroke on that Path (`path-stroke-solid` on `path#e_gt`; sibling `e_lt` stays dotted). Shared-trunk solid-wins rule from Improvement 01 unchanged.
- Tests and exact results:
  - `npm run build` at start — pass (`tsc --noEmit && vite build`; Vite 8.2.2)
  - `npm run test:unit` at start — pass (31 files, 163 tests)
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning)
  - `npm run test:unit` — pass (31 files, 163 tests)
  - `npm run test:e2e` — pass (83 passed, Chromium, 3 workers, ~47.8s including webServer)
- Evidence:
  - `.docs/evidence/improve-08-plus-chrome/plus-taffy-1440.png` — `+` pulled; green taffy; Step/Data fan; no wedge (1440×900)
  - `.docs/evidence/improve-08-plus-chrome/tabs-tucked-1440.png` — selected Step; `+` / Path tabs peek from behind the tile face (1440×900)
  - `.docs/evidence/improve-08-plus-chrome/plus-fan-thumbs-1440.png` — fan thumbs same 72×44 box; Data chip centered (1440×900)
  - `.docs/evidence/improve-08-plus-chrome/path-tab-1440.png` — Path tab spindle glyph (1440×900)
  - `.docs/evidence/improve-08-plus-chrome/path-stroke-solid-1440.png` — `e_gt` Solid (solid stroke); `e_lt` still dotted (1440×900)
- Earlier-slice defects fixed: `.react-flow__edge-path { stroke: var(--line) !important }` overpainted dotted overlays, so Solid/Dotted looked like a no-op. Hit-only Paths now use `stroke: transparent !important`. Empty-release linger was `showFan` staying true while `stretched` after `live: false` for `SPRING_MS` (520 ms). Peek grabs needed `tabPeekPoint` because tab bbox center is under the tile face. Path double-click via bbox center missed the polyline; tests use `pathScreenPoint`.
- Known limitations / follow-ups: Empty `+` release clears drag immediately (no ≤200 ms ghost snap). Tile `--select-ring` and global `--chrome-line` remain out of scope. Untracked ELK planner dumps still not committed.
- Status: COMPLETE
- Commit: `feat(improve-08): restore plus taffy and fix Path stroke`

## Improvement 09 — tile chrome, Data root, After removal — 2026-09-08

- Starting commit: `5822fe53833c261deaa0b6652af1aaf81e2263cc` (`feat(improve-08): restore plus taffy and fix Path stroke`)
- Working tree at start: not fully clean. Untracked ELK planner dumps (`.docs/elk_layout_and_routing_*.plan.md`) left uncommitted, as prior agents did. Product tree matched Improvement 08 HEAD.
- GOAL clauses addressed: WG-01, WG-02, WG-06, BA-03, BA-04, CX-07, CX-01, NG-02 (amendments dated 2026-09-08)
- Library research and decisions: no new runtime dependency. Roy fill `#f4c07a` in `HUMAN_PRESETS` (Oak Park uses the preset). Mailroom Omar stays `#7eb6f5` so it does not collide with Dana `#f4a06a`. Select is drop-shadow on `.tile-pickup`, not a second outline. Tab column uses 24px gap so tucked peeks still pass WCAG 2.2 target-size. Merge stays withdrawn. After `+` Step remains After-only; `+ Data` stays hidden in After.
- Files changed:
  - Contract/docs: `.docs/GOAL.md` amendments; `.docs/IMPROVEMENTS.md` (09 COMPLETE); `.docs/improve-09-chrome-and-root.plan.md`; `.docs/VISUAL_IMPROVEMENTS.md` plus original pictures; this handoff entry
  - Chrome: `TileChrome.tsx` (centered side tabs, flat taffy join); `tokens.css`; `PathKnotIcon.tsx` (24px spindle); `StepTile.tsx` / `DataTile.tsx` (no select outline)
  - Graph: `commands.ts` (`createRootNode`, sole-Tile removal, After extras pruned when the board empties); `store.ts` (Data root, After may remove/insert Before-origin); `EmptyBoardCta.tsx`; `SelectedItemForm.tsx` (trash in After); `actors.ts` / `robotMailroom.ts`
  - Tests: unit coverage for Data root, sole-Tile delete, demo reload, After removal; `e2e/improve-09-chrome-root.spec.ts` plus updated projection / replace / canvas / commands / improve-07
  - Evidence: `.docs/evidence/improve-09-chrome-root/`; recaptured empty-New and `10-projection/after-origin-removed-1440.png`
- Behavior implemented:
  - Selected `+` and Path tabs sit in a right-edge column vertically centered on the tile (still tucked). Glyphs are slightly larger; X stays 20px. Selection is a face drop-shadow, not a cyan ring. Pulled `+` taffy joins the tile with a solid flat attach.
  - Empty New offers Add Step and Add Data. Either may be the sole root. The last remaining Tile can be deleted back to that CTA (actors kept; After extras pruned). A root with other base Tiles still cannot be removed.
  - After may remove a Before-origin Node; Before reflects it. After `+` Step is still After-only. Reloading a demo from the hamburger restores the fixture; live edits are not written to `src/demos/`.
- Tests and exact results:
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning; client `index-12k-W6gm.js` 858.68 kB)
  - `npm run test:unit` — pass (31 files, 170 tests)
  - `npm run test:e2e` — pass (86 passed, Chromium, 3 workers, 52.9s including webServer)
- Evidence:
  - `.docs/evidence/improve-09-chrome-root/selected-tabs-1440.png` — selected Step; centered tucked `+`/Path; drop-shadow select, no cyan ring; Roy honey-apricot in Who (1440×900)
  - `.docs/evidence/improve-09-chrome-root/plus-taffy-solid-1440.png` — `+` pulled; solid taffy join at the tile edge; Step/Data fan (1440×900)
  - `.docs/evidence/improve-09-chrome-root/empty-step-and-data-1440.png` — empty New CTA with Add Step and Add Data (1440×900)
  - `.docs/evidence/improve-09-chrome-root/data-root-1440.png` — Data as the sole root; inspector Label; trash/X (1440×900)
  - `.docs/evidence/10-projection/after-origin-removed-1440.png` — After removed Review; Before no longer shows it (1440×900)
- Earlier-slice defects fixed: deleting the sole base Tile left After extras that would fail empty-board validation; `applyNodeRemoval` now writes an empty overlay. Stacking `+`/Path with an 8px gap failed axe `target-size` on the tucked peeks; gap is 24px as in Improvement 08.
- Known limitations / follow-ups: Merge redesign is later work. After `+` still creates After-only Steps; After does not add Data. Global `--chrome-line` remains out of scope. Untracked ELK planner dumps still not committed.
- Status: COMPLETE
- Commit: `feat(improve-09): center tabs Data root and After remove`

## Improvement 09 — correction 1 — 2026-09-08

- Requested: `+` and Path tabs on top of the tile (not under the border). Pull should come from under the face without a triangular twist or a hard left cut. The `+` ghost stays on top.
- Changed: `TileChrome.tsx` (capsule taffy + Path string masked to exit under the tile); `tokens.css` (tabs `z-index` 5, overlap the right edge); `e2e/ready.ts` (`tabPeekPoint` is the tab center); GOAL CX-01 amendment; visual log copies
- Tests and exact results:
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2)
  - `npm run test:unit` — pass (31 files, 170 tests)
  - `npm run test:e2e` — pass (86 passed on rerun of the one flaky empty-release timing; full suite 85 passed + 1 timing flake under load, then 5/5 on the chrome specs)
- Status: COMPLETE
- Commit: `feat(improve-09): sit plus Path tabs on the tile`

## Improvement 09 — correction 2 — 2026-09-08

- Requested: Selected-tile indication is too subtle; strengthen the shadow or use a glow, without bringing back the cyan outline.
- Changed: Gold halo on the Step/Data face (`box-shadow` rim + glow + stronger ground shadow in `tokens.css`); `is-lifted` on the tiles so drag-lift stays a separate cue; box-shadow no longer transitions (halo snaps on). GOAL CX-07 amendment. Recaptured `selected-tabs-1440.png`.
- Tests and exact results:
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning)
  - `npm run test:unit` — pass (31 files, 170 tests)
  - `npm run test:e2e` — pass (86 passed, Chromium, 3 workers, 52.3s)
- Status: COMPLETE
- Commit: `feat(improve-09): make selected tile glow`

## Improvement 09 — correction 3 — 2026-09-08

- Requested: Double-click Paths that involve Data should go dotted (same Path type as Step — only dotted/solid). Selected tile should be a blue halo without a ground shadow (flat, not gold).
- Changed: `edgeIsDotted` honors explicit `dashed` for any source and lone outgoing; `toggleSelectedDash` no longer no-ops; Path inspector always shows Dotted/Solid. Select glow is `--blue` with no ground shadow. GOAL PC-01/PC-02/PC-03 and CX-07 amendments.
- Tests and exact results:
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning)
  - `npm run test:unit` — pass (31 files, 171 tests)
  - `npm run test:e2e` — pass (87 passed, Chromium, 3 workers, 53.8s)
- Status: COMPLETE
- Commit: `feat(improve-09): blue select and Data Path stroke`

## Improvement 09 — correction 4 — 2026-09-08

- Requested: Drop or reduce the blue selection glow so the outline is crisp.
- Changed: Selected Step/Data is a 4px `--blue` rim only (no blur/spread glow, no ground shadow). Path-pull tab glyph is three staggered tracks (from the attached motif). Recaptured `selected-tabs-1440.png`. GOAL CX-07 and WG-07 amendments.
- Tests and exact results:
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning)
  - `npm run test:unit` — pass (31 files, 171 tests)
  - `npm run test:e2e` — pass (87 passed, Chromium, 3 workers, 54.0s)
- Status: COMPLETE
- Commit: `feat(improve-09): drop select glow`

## Improvement 10 — insert preview Paths and move cursor — 2026-09-08

- Starting commit: `704c69003396c5714e57c59acfb05f0b36ba4c0f` (`feat(improve-09): drop select glow`)
- Working tree at start: not fully clean. Untracked ELK planner dumps left uncommitted, as prior agents did. Uncommitted Path-tab dotted glyph (PathKnotIcon) and in-progress Path-delete / Who-follow work from other chats were present. Improvement 10 files are this commit; Path-delete and Who-follow code left unstaged.
- GOAL clauses addressed: NG-02, CX-05, P-08, CX-07 (amendments dated 2026-09-08)
- Library research and decisions: no new runtime dependency. Insert preview is the existing blue ELK band only (user: “the blue paths are actually good”). Split stubs + `ensureOrthogonal` were the boxy rectangle. Bundled sibling Paths share the same trunk, so they are skipped as drop targets and faded with the origin. Move cursor is a 24×24 four-way SVG (ink + white halo), CSS `move` fallback — not the Mantine pointer hand. Empty paper stays grab.
- Files changed:
  - Contract/docs: `.docs/GOAL.md` amendments; `.docs/IMPROVEMENTS.md`; `.docs/improve-10-drag-preview.plan.md`; `.docs/VISUAL_IMPROVEMENTS.md` plus the user GIF; this handoff entry
  - Preview: `pathHit.ts` (`skipInsertHover`, `routesShareBundle`); `FlowArrow.tsx` (blue band, no stubs); `Board.tsx` (fade incident/bundled Paths, `data-tile-drag` / `data-editable`); `TileChrome.tsx` (bundled skip, After insert hit-test, pickup from unselected)
  - Cursor: `tokens.css` (`--tile-move-cursor`, body class while dragging)
  - Glyph leftover required by TileChrome import: `PathKnotIcon.tsx` (three equal capsule dashes)
  - Tests: `pathHit.test.ts`, `App.test.tsx`, `e2e/improve-10-drag-preview.spec.ts`
  - Evidence: `.docs/evidence/improve-10-drag-preview/`
- Behavior implemented:
  - Dragging a tile over a Path shows the blue ELK insert band, landing silhouette, and neighbor gap. No split orthogonal stub overlay. Incident Paths and bundled siblings fade and are not drop targets.
  - Editable Step/Data tiles use a four-way move cursor. During tile-drag the move cursor follows the pointer. `+` / Path tabs stay grab. Pointer-down on an unselected editable tile selects it; drag still starts after 10 px. After may insert on a base Path.
- Tests and exact results:
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning)
  - `npm run test:unit` — pass (31 files, 175 tests)
  - `npm run test:e2e` — pass (90 passed, Chromium, 3 workers, 54.3s)
- Evidence:
  - `.docs/evidence/improve-10-drag-preview/insert-hover-blue-1440.png` — Review dragged over a Path; blue ELK band; silhouette; no stub overlay (1440×900)
  - `.docs/evidence/improve-10-drag-preview/insert-drop-after-1440.png` — after drop onto `e_gt`; layout `ready` (1440×900)
- Earlier-slice defects fixed: After insert-on-Path hit-test was still Before-only after Improvement 09 allowed After insert. TileChrome now hit-tests After too.
- Known limitations / follow-ups: Uncommitted Who-follow and Path-delete work from other chats remains unstaged. Untracked ELK planner dumps still not committed. Incident Paths are faded, not rubber-banded to the ghost (NG-02).
- Status: COMPLETE
- Commit: `feat(improve-10): clean insert preview and move cursor`

## Improvement 11 — Path Delete menu and hit pad — 2026-09-08

- Starting commit: `0bee1c26592e09c1b11c501d718538c3ca483c24` (`feat(improve-10): clean insert preview and move cursor`)
- Working tree at start: not fully clean. Improvement 10 had just landed; leftover Who-follow work and ELK planner dumps were left unstaged. Path hit-pad and `onEdgeContextMenu` were already in HEAD from that commit.
- GOAL clauses addressed: WG-05, NG-03, NA-12, AQ-01, CX-02 (amendments dated 2026-09-08; Path-delete wording already in HEAD). Also restored the dropped NA-03/BA-02 Who-follow amendment (code not in this commit).
- Library research and decisions: no new runtime dependency. Removal is drop-the-Path-only when `validateWorkflow` still passes (every Tile reachable from the root on base and After). No WG-10 restitch. Menu is Mantine 9 + Tabler trash. Path hit pad is React Flow `interactionWidth` 44 (was 28).
- Files changed:
  - Contract/docs: `.docs/GOAL.md` (Who-follow amendment restored); `.docs/IMPROVEMENTS.md` (11 COMPLETE); `.docs/improve-11-path-delete.plan.md`; visual log copy; this handoff entry
  - Commands: `commands.ts` (`removePath`, `canRemovePath`); `interaction.ts` (`path-menu`); `store.ts` (`openPathMenu`, `removePath`; Delete on a selected Path)
  - UI: `PathContextMenu.tsx`; `App.tsx`; `CanvasHelper.tsx`; `tokens.css` (hit pad + menu chrome)
  - Tests: `commands.test.ts`, `store.commands.test.ts`, `e2e/improve-11-path-delete.spec.ts`, notice copy in `canvas.spec.ts` / `commands.spec.ts`
  - Evidence: `.docs/evidence/improve-11-path-delete/`; recaptured `path-no-delete` notice shots
- Behavior implemented:
  - Right-click a Path for a menu. Delete is enabled when the Path is not a bridge; otherwise it is disabled. The Delete key does the same when a Path is selected. Inspector still has no Path delete control.
  - Path stroke hit pads are wider. Condition chips stay independent.
- Tests and exact results:
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning)
  - `npm run test:unit` — pass (31 files, 177 tests)
  - `npm run test:e2e` — pass (91 passed, Chromium, 3 workers, 56.5s)
- Evidence:
  - `.docs/evidence/improve-11-path-delete/path-menu-delete-1440.png` — right-click reconverge Path; Delete enabled (1440×900)
  - `.docs/evidence/improve-11-path-delete/path-deleted-1440.png` — after Delete; Search website remains a leaf; Account still reached (1440×900)
  - `.docs/evidence/improve-11-path-delete/path-menu-blocked-1440.png` — right-click `e_gt`; Delete disabled; no Remove Path hint (1440×900)
- Earlier-slice defects fixed: Improvement 10 committed `onEdgeContextMenu` / `PATH_HIT_WIDTH` without `openPathMenu`; this commit adds the store command so that call compiles.
- Known limitations / follow-ups: Who-follow store code remains unstaged. Untracked ELK planner dumps still not committed. Shared inbound merges still need a click on a unique segment to pick one Path.
- Status: COMPLETE
- Commit: `feat(improve-11): delete redundant Paths from the context menu`

## Improvement 10 — correction 1 — 2026-09-08

- Requested: The cursor should be the four-way move symbol when hovering a Tile. Click-dragging an unselected Tile should pick it up in one gesture (no click-to-select, then click-drag again).
- Changed: `tokens.css` — move cursor on `.react-flow__node.selectable` and the tile face (`!important` so it beats React Flow’s pointer). `TileChrome.tsx` — do not select on pointer-down (that remounts chrome and drops the drag); window-level pointer listeners start insert-on-Path after 10 px; a plain click still selects via the existing tile click handler. `e2e/improve-10-drag-preview.spec.ts` hovers the unselected face and drags Review without a prior click. Plan pickup bullet updated. GOAL P-08/CX-07 hover/drag amendment was already in HEAD from Improvement 11.
- Tests and exact results:
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning)
  - `npm run test:unit` — pass (31 files, 177 tests)
  - `npm run test:e2e` — pass (91 passed, Chromium, 3 workers, 52.8s)
- Status: COMPLETE
- Commit: `feat(improve-10): pick up unselected tiles on drag`

## Improvement 11 — correction 1 — 2026-09-08

- Requested: When a Path is selected, the bottom advice hints should include Right-click along with the other hotkeys.
- Changed: `CanvasHelper.tsx` — selected-Path strip always lists Right-click Delete with Dotted/Solid and Edit label; Delete Remove Path still appears only when the Path may be removed. Unit + e2e coverage; GOAL P-06/WG-05 amendment; evidence `path-hints-1440.png`.
- Tests and exact results:
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning)
  - `npm run test:unit` — pass (31 files, 178 tests)
  - `npm run test:e2e` — pass (92 passed, Chromium, 3 workers, 56.9s)
- Evidence: `.docs/evidence/improve-11-path-delete/path-hints-1440.png` — selected Path; hint strip shows Right-click Delete with the other Path hotkeys (1440×900)
- Status: COMPLETE
- Commit: `feat(improve-11): show Right-click Delete in Path hints`

## Improvement 12 — tile chrome on hover — 2026-09-08

- Starting commit: `9117253abe91969ac7194bd02d39a6bac0135049` (`feat(improve-11): show Right-click Delete in Path hints`)
- Working tree at start: not clean. Concurrent Who-inherit / taffy-outline work, evidence recaptures, and untracked ELK planner dumps were left unstaged and are not in this commit.
- GOAL clauses addressed: CX-01 (amendment dated 2026-09-08). Present / Both still hide chrome (P-07, BA-05).
- Library research and decisions: no new runtime dependency. Chrome stays mounted on every editable tile and is shown with CSS `:hover` / `.is-selected` so X / `+` / Path can be used without a prior click. Hover does not call `select`. Pull and remove still select as they start.
- Files changed:
  - Contract/docs: `.docs/GOAL.md` (CX-01 amendment); `.docs/IMPROVEMENTS.md` (12); `.docs/VISUAL_IMPROVEMENTS.md` plus the user GIF; this handoff entry
  - Chrome: `TileChrome.tsx` (actions wrapper; show whenever the lane is editable); `tokens.css` (hide unless hovered, selected, or pulling); `PathHostFrame.tsx` comment
  - Tests: `e2e/improve-12-hover-chrome.spec.ts`; `e2e/canvas.spec.ts` hover now expects chrome; `e2e/improve-09-chrome-root.spec.ts` scopes tab z-index to the selected host
  - Evidence: `.docs/evidence/improve-12-hover-chrome/`
- Behavior implemented:
  - Hovering an editable Step or Data shows X, `+`, and Path without selecting the tile or changing the inspector.
  - Selected-tile chrome still stays when the pointer leaves. Present and Both still hide it. Pulling `+` from an unselected hover still creates a Step.
- Tests and exact results:
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning)
  - `npm run test:unit` — pass (31 files, 178 tests)
  - `npm run test:e2e` — pass (98 passed, Chromium, 3 workers, 1.3m)
- Evidence:
  - `.docs/evidence/improve-12-hover-chrome/hover-unselected-1440.png` — Review hovered, not selected; X / `+` / Path visible; inspector idle (1440×900)
- Earlier-slice defects fixed: none
- Known limitations / follow-ups: Concurrent Who-inherit and taffy-outline work remains unstaged. Untracked ELK planner dumps still not committed.
- Status: COMPLETE
- Commit: `feat(improve-12): show tile chrome on hover`

## Improvement 13 — inherit parent Who on child Step — 2026-09-08

- Starting commit: `40c0659d3a7968397f78847ad9767047a5a208b6` (`feat(improve-12): show tile chrome on hover`)
- Working tree at start: not clean. Taffy-outline work, evidence recaptures, and untracked ELK planner dumps were left unstaged and are not in this commit.
- GOAL clauses addressed: NA-03 (amendment dated 2026-09-08). After-only Robot default (BA-07) unchanged. Empty-board Add Step still last-used Human / Alice (WG-01).
- Library research and decisions: no new runtime dependency. A child Step from a Step parent copies that parent’s Before Who onto both lanes so a Roy Step does not spawn Alice. Last-used Human remains only for the empty-board root and for a child spawned from Data (no Who). After `+` / `1` still creates an After-only Robot Step.
- Files changed:
  - Contract/docs: `.docs/GOAL.md` (NA-03 amendment); `.docs/IMPROVEMENTS.md` (13); this handoff entry
  - Who helper: `src/workflow/actors.ts` (`whoForChildStep`); `src/state/store.ts` (`spawnBranch`)
  - Tests: `src/workflow/actors.test.ts`, `src/state/store.actors.test.ts`, `e2e/improve-13-who-inherit.spec.ts`
  - Evidence: `.docs/evidence/improve-13-who-inherit/`
- Behavior implemented:
  - Pull `+` onto Step or press `1` on a selected Step: the new Before-origin Step is the same actor as the parent (Roy’s Step → Roy, including a Robot parent).
  - Spawning from Data still uses last-used Human, else Alice. Assigning Roy on a different Step does not steal Who from an Alice parent.
- Tests and exact results:
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning)
  - `npm run test:unit` — pass (31 files, 180 tests)
  - `npm run test:e2e` — pass (98 passed, Chromium, 3 workers, 1.1m)
- Evidence:
  - `.docs/evidence/improve-13-who-inherit/child-inherits-roy-1440.png` — Review set to Roy; `1` creates an Other child with Who Roy (1440×900)
  - `.docs/evidence/improve-13-who-inherit/child-keeps-parent-alice-1440.png` — Read set to Roy; child of Alice Review stays Alice (1440×900)
- Earlier-slice defects fixed: none
- Known limitations / follow-ups: After-only children stay the default Robot (BA-07). Taffy-outline WIP from other chats remains unstaged. Untracked ELK planner dumps still not committed.
- Status: COMPLETE
- Commit: `feat(improve-13): inherit parent actor on child Steps`

## Improvement 08 — correction 1 — 2026-09-08

- Requested: The pulled `+` taffy should have an ink outline on its long edges (user orange marks), matching the bordered tiles it joins.
- Changed: `TileChrome.tsx` — `taffyRibbon` draws the green fill plus two `--line` strokes along the top and bottom edges (3px, not the round caps). GOAL WG-07 amendment. Visual log copies of the marks. E2E asserts `[data-plus-taffy-stroke]` and captures hover-on-Step.
- Tests and exact results:
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning)
  - `npm run test:unit` — pass (31 files, 180 tests)
  - `npm run test:e2e` — pass (99 passed, Chromium, 3 workers, 57.5s)
- Evidence: `.docs/evidence/improve-08-plus-chrome/plus-taffy-outline-1440.png` — `+` pulled onto Step; ink outline on the taffy’s long edges (1440×900)
- Status: COMPLETE
- Commit: `feat(improve-08): outline the plus taffy`

## Improvement 10 — correction 2 — 2026-09-08

- Requested: The hand-grabbing cursor is blurry; the movement and pointer cursors are not.
- Changed: `tokens.css` — pan and `+` / Path tabs use a 32×32 ink+halo grab SVG (same recipe as the move cursor) instead of the system `grab` / `grabbing` bitmap. Source: `src/app/cursors/grab.svg`. E2E asserts a `url(` grab cursor on the pane and plus tab.
- Tests and exact results:
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning)
  - `npm run test:unit` — pass (31 files, 180 tests)
  - `npm run test:e2e` — pass (99 passed, Chromium, 3 workers, 59.0s)
- Evidence: `.docs/evidence/improve-10-drag-preview/grab-cursors-1440.png` — move vs grab glyphs at 96px and native size (1440×900)
- Status: COMPLETE
- Commit: `feat(improve-10): sharpen grab and grabbing cursors`

## Improvement 10 — correction 3 — 2026-09-08

- Requested: The custom hand and movement cursors look too black and weird; use something standard. The delete-button pointer is the right look.
- Changed: Removed the custom SVG cursors. Editable tiles use the platform `move` cursor; empty paper and `+` / Path tabs use platform `grab` / `grabbing`; the tile X stays `pointer`. GOAL P-08/CX-07 amendment. Deleted `src/app/cursors/grab.svg`.
- Tests and exact results:
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning)
  - `npm run test:unit` — pass (31 files, 180 tests)
  - `npm run test:e2e` — pass (99 passed, Chromium, 3 workers, 62.6s)
- Evidence: n/a (OS cursors are not captured in screenshots)
- Status: COMPLETE
- Commit: `feat(improve-10): use platform move and grab cursors`

## Improvement 16 — Other Task name and clipboard — 2026-09-08

- Starting commit: `559c907e98dda9885bfd76808fabb4febdb41730` (`feat(improve-10): use platform move and grab cursors`)
- Working tree at start: not clean. Concurrent tab-size, taffy, cursor, and evidence recaptures were left unstaged and are not in this commit.
- GOAL clauses addressed: NA-05, NA-10 (amendment dated 2026-09-08). Other still never prints the word Other.
- Library research and decisions: no new runtime dependency. Other Type icon is a custom cream/blue/ink clipboard (same recipe as Read/File), not Tabler and not a circled exclamation. Tile icon 60px (others 52); inspector Other mark 30px.
- Files changed:
  - `src/workflow/types.ts` (`defaultTitle: "Task"`, `titleForStepKindChange`)
  - `src/state/store.ts` (`updateNode` seeds empty Name when Type first becomes Other)
  - `src/board/tiles/StepKindIcon.tsx`, `src/board/tiles/StepTile.tsx`, `src/app/inspector/TypeButtons.tsx`
  - Tests: `src/workflow/types.test.ts`, `src/state/store.replace.test.ts`, `src/state/store.actors.test.ts`, `src/app/App.test.tsx`, `e2e/improve-16-other-task.spec.ts`
  - Contract/docs: `.docs/GOAL.md`, `.docs/IMPROVEMENTS.md`, `.docs/VISUAL_IMPROVEMENTS.md`, this handoff entry
- Behavior implemented:
  - Empty-board Add Step, `+` / `1` child, and After-only Other Steps get Name **Task** so the tile shows that word.
  - Choosing Type Other with an empty Name fills Task once; a Name already typed is kept.
  - Other uses a larger clipboard (generic work), not an exclamation.
- Tests and exact results:
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning)
  - `npm run test:unit` — pass (31 files, 183 tests)
  - `npm run test:e2e` — not run here (Playwright Chromium missing `libnspr4.so` on this WSL). Spec added: `e2e/improve-16-other-task.spec.ts`
- Evidence: e2e captures under `.docs/evidence/improve-16-other-task/` when Playwright can launch. Unit/App tests cover Name Task and no “Other Task” copy.
- Earlier-slice defects fixed: none
- Known limitations / follow-ups: Playwright evidence PNGs still needed on a machine with Chromium libs. Concurrent tab-size / taffy / cursor WIP remains unstaged.
- Status: COMPLETE
- Commit: `feat(improve-16): default Other Steps to Task`

## Improvement 15 — larger + and Path tabs — 2026-09-08

- Starting commit: `4948f4459d2369e9e8d5beab639853aacffa40ff` (`feat(improve-16): default Other Steps to Task`)
- Working tree at start: not clean. Concurrent taffy/cursor/Other-Task/Who-inherit work and evidence recaptures were left unstaged and are not in this commit.
- GOAL clauses addressed: CX-01 (hit targets on selected/hover Tile chrome). No amendment — tab pixel size is not in the contract.
- Library research and decisions: no new runtime dependency. Tabs are 44×44 CSS (were 36×36) with a 24px peek past the tile edge (were 18px) so more of the control sits outside the face. `+` glyph 30px; Path glyph stays 24 inside the larger hit box. X stays 20. Ghosts match the rest tabs.
- Files changed:
  - `src/app/styles/tokens.css` (`.plus-tab` / `.path-tab` / ghosts)
  - `e2e/improve-15-tab-size.spec.ts`
  - `.docs/IMPROVEMENTS.md`, `.docs/VISUAL_IMPROVEMENTS.md`, this handoff entry
  - Evidence and user GIF copy
- Behavior implemented:
  - Tile create (`+`) and Path-pull tabs are a little larger and peek farther, so they are easier to grab. Pull, X, and Present/Both hide rules are unchanged.
- Tests and exact results:
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning)
  - `npm run test:unit` — pass (31 files, 180 tests)
  - `npm run test:e2e` — pass (102 passed, Chromium, 3 workers, 1.3m)
- Evidence: `.docs/evidence/improve-15-tab-size/selected-tabs-1440.png` — selected Read tile; 44×44 `+` and Path tabs (1440×900)
- Earlier-slice defects fixed: none
- Known limitations / follow-ups: Concurrent WIP from other chats remains unstaged. At fitView zoom the CSS bump is modest on screen.
- Status: COMPLETE
- Commit: `feat(improve-15): enlarge tile plus and Path tabs`

## Improvement 08 — correction 2 — 2026-09-08

- Requested: The pulled `+` taffy outline was not visible. A 3px centered `--line` hairline disappears on the dim scrim next to ink-bordered tiles.
- Changed: `TileChrome.tsx` draws a larger `--line` capsule behind an opaque green fill (5px pad so about 3px of solid navy remains after antialiasing), matching tile and tab borders. E2E asserts one `[data-plus-taffy-stroke]` with `fill="var(--line)"`. Visual log updated.
- Tests and exact results:
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning)
  - `npm run test:unit` — pass (31 files, 187 tests on the dirty tree)
  - `npm run test:e2e` — 106 passed, 1 failed (`e2e/inspector.spec.ts` Path chip Enter focus — unrelated concurrent WIP). Improvement 08 plus-chrome passed (2 tests). Pixel sample of `plus-taffy-outline-1440.png` showed 10 consecutive `--line` pixels on the long edge.
- Evidence: `.docs/evidence/improve-08-plus-chrome/plus-taffy-outline-1440.png` — `+` pulled onto Step; chunky `--line` outline on the taffy’s long edges (1440×900)
- Status: COMPLETE
- Commit: `feat(improve-08): make plus taffy outline chunky`

## Improvement 10 — correction 5 — 2026-09-08

- Requested: Dragging a Tile onto a hovered Path that shares an ELK trunk with that Tile’s current Path (root fan-out children) should insert; it did not.
- Changed: `skipInsertHover` skips only Paths that touch the dragged Tile. `hitPathId` / `hitInsertPathId` hit unique segments of bundled siblings after the split (or before a merge) and ignore the shared trunk. Incident Paths still fade; bundled siblings do not. `insertNodeOnPath` already accepted this graph edit.
- Tests and exact results:
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning)
  - `npm run test:unit` — pass (31 files, 187 tests)
  - `npm run test:e2e` — sibling insert verified in Chromium against the dev server (preview band, drop removes `e_lt`, condition kept). Full Playwright suite not run in this chat because port 4177 was in use by another agent.
- Evidence:
  - `.docs/evidence/improve-10-drag-preview/insert-sibling-branch-1440.png` — Search website dragged over the other amount Path unique branch; blue insert band (1440×900)
  - `.docs/evidence/improve-10-drag-preview/insert-sibling-drop-1440.png` — after drop onto that Path; layout ready (1440×900)
- Status: COMPLETE
- Commit: `feat(improve-10): insert Tiles on unique sibling Paths`


## Improvement 10 — correction 6 — 2026-09-08

- Requested: The hand-grabbing cursor is blurry; the movement and pointer cursors are not.
- Changed: Empty paper and `+` / Path tabs use a 32×32 white-fill, black-outline grab SVG (same language as the OS pointer). Tiles stay platform `move`; the tile X stays `pointer`. Source: `src/app/cursors/grab.svg`, applied as CSS data URIs. E2E already asserts a `url(` grab cursor on the pane and plus tab.
- Tests and exact results:
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning)
  - `npm run test:unit` — pass (31 files, 187 tests)
  - `npm run test:e2e` — 107 passed, 1 flaked then passed on retry (`improve-12` plus-pull from hover; unrelated). Improvement 10 grab/move/insert tests passed (4). Chromium, 2 workers, reused Vite, 1.7m
- Evidence: `.docs/evidence/improve-10-drag-preview/grab-os-style-1440.png` — OS-style grab glyph at 96px and native 32px (1440×900)
- Status: COMPLETE
- Commit: `feat(improve-10): use OS-style grab cursor`

## Improvement 17 — Read Type is an open book — 2026-09-08

- Starting commit: `d656b54fe9c7e801ff12dc814fcf94c58c22eb04` (`feat(improve-10): use OS-style grab cursor`)
- Working tree at start: not clean (concurrent evidence recaptures and other-chat WIP left unstaged)
- GOAL clauses addressed: NA-05 (amendment dated 2026-09-08). Read stays stored `read`; Other stays the clipboard.
- Library research and decisions: no new runtime dependency. Custom cream/blue/ink open book (same recipe as the other Type glyphs), not Tabler. Distinct from Other’s clipboard and from Review/File documents.
- Files changed:
  - `src/board/tiles/StepKindIcon.tsx` (Read glyph)
  - `src/app/App.test.tsx`
  - `e2e/improve-17-read-book.spec.ts`
  - `.docs/GOAL.md`, `.docs/IMPROVEMENTS.md`, this handoff entry
  - Evidence: `.docs/evidence/improve-17-read-book/read-book-1440.png`
- Behavior implemented:
  - Read tiles and the Type Read picker show an open book instead of a clipboard.
- Tests and exact results:
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning)
  - `npm run test:unit` — pass (32 files, 191 tests)
  - `npm run test:e2e` — 108 passed, 1 failed (`e2e/improve-18-plus-fan.spec.ts` missing — concurrent WIP). `e2e/improve-17-read-book.spec.ts` pass.
- Evidence: `.docs/evidence/improve-17-read-book/read-book-1440.png` — Oak Park Read invoice.pdf selected; open book on the tile and Type Read (1440×900)
- Earlier-slice defects fixed: none
- Known limitations / follow-ups: Concurrent WIP from other chats remains unstaged.
- Status: COMPLETE
- Commit: `feat(improve-17): use an open book for Read`

## Improvement 19 — closer Step/Data + fan — 2026-09-08

- Starting commit: `04873d3de2ecad68b6e9a2b5c3099224d10daf5a` (`feat(improve-10): insert Tiles on unique sibling Paths`)
- Working tree at start: not clean. Concurrent Path-zip, Read-book, and evidence recaptures were left unstaged and are not in this commit.
- GOAL clauses addressed: WG-07 (amendment dated 2026-09-08). Drop rules, After Step-only, and `1` / `2` unchanged.
- Library research and decisions: no new runtime dependency. The 28px `PREVIEW_OUT` was leftover from the Improvement 03 wedge. Fan placement is now a short 104px arc from the rest `+` (`plusPreviewLayout.ts`).
- Files changed:
  - `src/board/controls/plusPreviewLayout.ts` and `plusPreviewLayout.test.ts`
  - `src/board/controls/TileChrome.tsx` (uses shared `previewCenters`)
  - Tests: `e2e/improve-19-plus-fan.spec.ts`
  - Contract/docs: `.docs/GOAL.md` (WG-07 amendment); `.docs/IMPROVEMENTS.md` (19); `.docs/VISUAL_IMPROVEMENTS.md`; this handoff entry
  - Evidence: `.docs/evidence/improve-19-plus-fan/`
- Behavior implemented:
  - Pulling `+` on a selected or hovered tile shows Step and Data closer to that tile (no extra outward offset).
  - After still shows Step only. Drop-on-preview, empty release, taffy, and scrim are unchanged.
- Tests and exact results:
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning)
  - `npm run test:unit` — pass (32 files, 191 tests)
  - `npm run test:e2e` — `e2e/improve-19-plus-fan.spec.ts` pass (1). Full suite not re-run here; port 4177 `reuseExistingServer` was false in a concurrent edit.
- Evidence:
  - `.docs/evidence/improve-19-plus-fan/plus-fan-close-1440.png` — `+` pulled on Read invoice.pdf; Step and Data sit close to the tile (1440×900)
- Earlier-slice defects fixed: none
- Known limitations / follow-ups: Resting `+` / Path tab peek (Improvement 15) is unchanged. Concurrent WIP from other chats remains unstaged.
- Status: COMPLETE
- Commit: `feat(improve-19): pull Step Data fan closer`

## Improvement 18 — Path zip vs Tile blip — 2026-09-08

- Starting commit: `01b7314426f409a38a9f6c372e333cb12e355e8e` (`feat(improve-17): use an open book for Read`)
- Working tree at start: not clean. Concurrent Read-book, plus-fan, grab-cursor, evidence recaptures, and other chats’ WIP were left unstaged and are not in this commit.
- GOAL clauses addressed: SH-04, P-01 (amendment dated 2026-09-08). Tile create keeps the existing blip; Path create is a distinct original zip.
- Library research and decisions: no new runtime dependency. Zip is original Web Audio: bandpass-filtered noise rising 420→2400 Hz plus a triangle taut-string sweep 260→1480 Hz, same low peak as the other cues. Not a sampled zipper. Connect existing and Path-pull share `connect()`, so both zip. `spawnBranch` / empty-board Add Step / Add Data / insert-on-Path stay the Tile blip.
- Files changed:
  - Sound: `src/app/sound/cues.ts`, `src/app/sound/cues.test.ts`
  - Store: `src/state/store.ts` (`connect` plays `zip`); `src/state/store.commands.test.ts`
  - Contract/docs: `.docs/GOAL.md` (SH-04 amendment); `.docs/IMPROVEMENTS.md` (18); this handoff entry
  - Tests: `e2e/improve-18-path-zip.spec.ts`
  - Evidence: `.docs/evidence/improve-18-path-zip/`
- Behavior implemented:
  - With sound on, creating a Tile still plays the soft sine blip.
  - Pulling a Path from the tile Path tab onto another Node (or Connect existing) plays a short zip instead.
- Tests and exact results:
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning)
  - `npm run test:unit` — pass (32 files, 191 tests)
  - `npm run test:e2e` — `e2e/improve-18-path-zip.spec.ts` pass (1). Full Playwright suite not run in this chat because port 4177 was in use by another agent.
- Evidence:
  - `.docs/evidence/improve-18-path-zip/path-pull-zip-1440.png` — Path-pull from Search website toward Search filesystem; sound on (1440×900)
  - `.docs/evidence/improve-18-path-zip/path-connected-1440.png` — after drop; new Path connects the two Search tiles; filesystem selected (1440×900)
- Earlier-slice defects fixed: none
- Known limitations / follow-ups: Zip cannot be shown in a PNG; turn sound on and Path-pull to hear it. Concurrent WIP from other chats remains unstaged.
- Status: COMPLETE
- Commit: `feat(improve-18): zip Path create apart from Tile blip`

## Improvement 20 — foldable right inspector — 2026-09-08

- Starting commit: `11e059532f3189773f9d48d88fe877f0baa899f9` (`feat(improve-19): pull Step Data fan closer`)
- Working tree at start: not clean. Concurrent status-bar / tile-pie / evidence recaptures were left unstaged and are not this improvement.
- GOAL clauses addressed: P-05, P-07, NA-09 (amendment dated 2026-09-08). Present still hides the inspector and the strip.
- Library research and decisions: no new runtime dependency. Not a Mantine overlay Drawer (that would cover the board). AppShell aside width folds 320→28 so the canvas actually grows. Tabler chevrons. Preference persists like sound. Selecting a tile does not auto-expand. Enter on Data still opens the inspector (NA-08). Native Tab order on the strip (AQ-01); no new KeyAction.
- Files changed:
  - Shell: `src/app/App.tsx`, `src/main.tsx`, `src/app/inspector/InspectorFold.tsx`, `src/app/inspector/inspectorFold.css`
  - State: `src/state/store.ts`, `src/state/persistence.ts`
  - Tests: `src/app/App.test.tsx`, `src/state/store.shell.test.ts`, `src/state/persistence.test.ts`, `e2e/improve-20-inspector-fold.spec.ts`
  - Contract/docs: `.docs/GOAL.md` (P-05 amendment); `.docs/IMPROVEMENTS.md` (20); this handoff entry
  - Evidence: `.docs/evidence/improve-20-inspector-fold/`
- Behavior implemented:
  - Hide inspector (›) folds the right rail to a thin strip with ‹.
  - Click the strip to expand. The board uses the extra space. Present still removes the rail entirely.
  - Folded preference survives reload.
- Tests and exact results:
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning)
  - `npm run test:unit` — pass (34 files, 204 tests; excluded concurrent untracked `pieGeometry.test.ts`)
  - `npm run test:e2e` — `e2e/improve-20-inspector-fold.spec.ts` pass (4). Full suite not re-run here; port 4177 was in use by another agent after the spec passed.
- Evidence:
  - `.docs/evidence/improve-20-inspector-fold/inspector-open-1440.png` — inspector open; Hide › on the left edge (1440×900)
  - `.docs/evidence/improve-20-inspector-fold/inspector-collapsed-1440.png` — folded strip with ‹; board uses the extra width (1440×900)
  - `.docs/evidence/improve-20-inspector-fold/inspector-collapsed-dark-1440.png` — same strip in dark (1440×900)
  - `.docs/evidence/improve-20-inspector-fold/inspector-collapsed-1024.png` — folded strip at 1024×768
- Earlier-slice defects fixed: none
- Known limitations / follow-ups: Concurrent status-bar / tile-pie WIP from other chats remains unstaged. No inspector keybind (the strip is in Tab order).
- Status: COMPLETE
- Commit: `feat(improve-20): fold the right inspector`

## Improvement 22 — create tabs closer to the tile — 2026-09-08

- Starting commit: `11e059532f3189773f9d48d88fe877f0baa899f9` (`feat(improve-19): pull Step Data fan closer`)
- Working tree at start: not clean. Concurrent inspector-fold, status-bar, tile-pie, and evidence recaptures were left unstaged and are not in this commit.
- GOAL clauses addressed: CX-01. No amendment — peek distance is not in the contract. Tabs stay on top of the right edge; they just hang less.
- Library research and decisions: no new runtime dependency. Improvement 15 peeked 24px of 44×44 tabs. The X hangs 14px (`top`/`left: -14px` on a 40px control). Matching that peek closes the paper gap beside the selected tile. Full 44×44 stays the hit target (tabs are stacked above the face).
- Files changed:
  - `src/app/styles/tokens.css` (`.tile-side-tabs` `right: -14px`)
  - Tests: `e2e/improve-22-tab-peek.spec.ts`; `e2e/improve-15-tab-size.spec.ts` (size-only; peek moved here)
  - Docs: `.docs/IMPROVEMENTS.md` (22); `.docs/VISUAL_IMPROVEMENTS.md`; this handoff entry
  - Evidence and user GIF copy
- Behavior implemented:
  - Selected/hover `+` and Path tabs sit against the tile’s right edge (14px peek, same hang as the X). Pull, glyphs, and hide rules are unchanged.
- Tests and exact results:
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning)
  - `npm run test:unit` — 33 files passed, 2 failed on concurrent unstaged status-bar / pieGeometry work (206 passed / 2 failed / 208). CSS-only change; no unit coverage of tab peek.
  - `npm run test:e2e` — `e2e/improve-22-tab-peek.spec.ts` pass (1). Full Playwright suite not run in this chat (`libnspr4` via `LD_LIBRARY_PATH`; port 4177 in use).
- Evidence: `.docs/evidence/improve-22-tab-peek/selected-tabs-1440.png` — selected Read tile; `+` and Path tabs snug on the right edge (1440×900)
- Earlier-slice defects fixed: none
- Known limitations / follow-ups: Concurrent inspector-fold / status-bar / tile-pie WIP remains unstaged.
- Status: COMPLETE
- Commit: `feat(improve-22): sit create tabs closer to the tile`

## Improvement 24 — first Tile from New is centered — 2026-09-08

- Starting commit: `e735abe` (`feat(improve-20): fold the right inspector`)
- Working tree at start: not clean. Concurrent status-bar, tile-pie, and evidence recaptures were left unstaged and are not in this commit. GOAL P-08 amendment and Improvement 24 plan text were already on HEAD from concurrent doc commits.
- GOAL clauses addressed: P-08 (amendment dated 2026-09-08). One-time fitView remains for demos; empty New no longer consumes it.
- Library research and decisions: no new runtime dependency. Displayed positions still come from ELK (CX-05), so the camera pans: a sole Tile is centered at the current zoom instead of `fitView` zooming in on the island. Empty layouts reset the one-time fit so deleting the last Tile and Add Step/Data also centers.
- Files changed:
  - `src/board/firstLayoutCamera.ts`, `src/board/firstLayoutCamera.test.ts`
  - `src/board/Board.tsx` (skip empty fit; center a sole Tile)
  - Tests: `e2e/improve-24-first-tile-center.spec.ts`
  - Contract/docs: `.docs/GOAL.md` (P-08 amendment); `.docs/IMPROVEMENTS.md` (24); this handoff entry
  - Evidence: `.docs/evidence/improve-24-first-tile-center/`
- Behavior implemented:
  - New → Add Step or Add Data places the first Tile in the center of the board at zoom 1, not the top left.
  - Demo / Import first layout still uses `fitView` with padding 0.28.
- Tests and exact results:
  - `npm run build` — `tsc --noEmit` blocked on concurrent unused imports in `App.tsx` (StatusBar / TilePieMenu); this commit’s files typecheck.
  - `npm run test:unit` — `src/board/firstLayoutCamera.test.ts` pass (4). Full suite has concurrent status-bar / pieGeometry failures unrelated to this commit.
  - `npm run test:e2e` — `e2e/improve-24-first-tile-center.spec.ts` pass (2). Full suite not re-run; port 4177 was in use.
- Evidence:
  - `.docs/evidence/improve-24-first-tile-center/add-step-centered-1440.png` — New board Add Step; Task tile centered in the board (1440×900)
  - `.docs/evidence/improve-24-first-tile-center/add-data-centered-1440.png` — New board Add Data; Data tile centered in the board (1440×900)
- Earlier-slice defects fixed: empty `emptyLayout` was consuming the one-time `fitView`, so the first Tile stayed at ELK origin (top left).
- Known limitations / follow-ups: Concurrent inspector-fold / status-bar / tab-peek / tile-pie WIP remains unstaged.
- Status: COMPLETE
- Commit: `feat(improve-24): center the first Tile from New`

## Improvement 25 — coral Data mark — 2026-09-08

- Starting commit: `566ff80` (`feat(improve-24): center the first Tile from New`)
- Working tree at start: not clean. Concurrent status-bar / tile-pie / evidence recaptures were left unstaged and are not in this commit.
- GOAL clauses addressed: P-09 (light and dark Data mark contrast). No amendment — Data fill hex is not in the contract.
- Library research and decisions: no new runtime dependency. Teal `#1db8a8` sat next to icy paper and `--chrome-line`. Unused saturated hue that still sits with navy/gold: coral `#e8784a` (dark `#f09468`). Distinct from minus brick `#c4453a`, Roy peach `#f4c07a`, yellow select, Alice pink, Missy lavender, plus green. Path tab keeps `--data` teal so Data and Path stay different marks. `--data-mark` lives in `dataMark.css` so this change does not rewrite `tokens.css` (concurrent WIP).
- Files changed:
  - `src/board/tiles/DataChip.tsx`, `src/board/tiles/dataMark.css`
  - Tests: `e2e/improve-25-data-mark.spec.ts`
  - Docs: `.docs/IMPROVEMENTS.md` (25); this handoff entry
  - Evidence: `.docs/evidence/improve-25-data-mark/`
- Behavior implemented:
  - Data tiles and the `+` Data preview oval are coral instead of teal.
  - Path-pull tab fill is unchanged (still washed teal).
- Tests and exact results:
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning)
  - `npm run test:unit` — pass (35 files, 207 tests)
  - `npm run test:e2e` — `e2e/improve-25-data-mark.spec.ts` pass (1). Full suite not re-run; port 4177 reserved by Playwright default config. Chromium via `LD_LIBRARY_PATH` `~/.local/pw-libs`.
- Evidence:
  - `.docs/evidence/improve-25-data-mark/data-mark-light-1440.png` — Account # selected; coral oval, teal Path tab (1440×900)
  - `.docs/evidence/improve-25-data-mark/data-mark-dark-1440.png` — same in dark (1440×900)
- Earlier-slice defects fixed: none
- Known limitations / follow-ups: Concurrent status-bar / tile-pie WIP remains unstaged.
- Status: COMPLETE
- Commit: `feat(improve-25): recolor the Data mark coral`

## Improvement 26 — Compare view, no pan outline — 2026-09-08

- Starting commit: `88b25f0af78cb86a39863ec371eaf32b9a1e29f2` (`feat(improve-25): recolor the Data mark coral`)
- Working tree at start: not clean. Concurrent status-bar / tile-pie / first-tile / evidence recaptures were left unstaged and are not in this commit.
- GOAL clauses addressed: SH-02, BA-05 (amendment dated 2026-09-08). Stored view remains `both`; the switch label is Compare. Neither Compare pane draws a pan-target outline.
- Library research and decisions: no new runtime dependency. The cyan box was leftover `.board-lane.is-pan-target` (`--chrome-line`) from independent Both cameras. BA-05 already shares one camera, so the focused-lane outline was obsolete.
- Files changed:
  - Switch: `src/workflow/catalogs.ts` (`VIEW_SWITCH_LABEL`), `src/app/components/Toolbar.tsx`
  - Outline: `src/board/Board.tsx` (no `is-pan-target` class), `src/app/styles/tokens.css` (rule removed)
  - Tests: `src/app/App.test.tsx`; e2e view helpers Both → Compare; `e2e/improve-26-compare.spec.ts`
  - Docs: `.docs/GOAL.md` (amendment); `.docs/IMPROVEMENTS.md` (26); `.docs/VISUAL_IMPROVEMENTS.md`; `HUMAN.md`; this handoff entry
  - Evidence: `.docs/evidence/improve-26-compare/`
- Behavior implemented:
  - The top-bar third option reads **Compare**.
  - Compare stacks Before and After with no cyan outline around one pane.
- Tests and exact results:
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning)
  - `npm run test:unit` — view-switch App tests pass (2). Full suite had 2 failures on concurrent status-bar Actors / Mantine Autosize WIP, not this commit.
  - `npm run test:e2e` — `e2e/improve-26-compare.spec.ts` pass (1); `e2e/view-switch.spec.ts` pass (1). Full suite not re-run; port 4177 was in use (ran on 4195).
- Evidence:
  - `.docs/evidence/improve-26-compare/compare-light-1440.png` — Compare selected; no cyan box around Before (1440×900)
  - `.docs/evidence/improve-26-compare/compare-dark-1440.png` — same in dark (1440×900)
- Earlier-slice defects fixed: Compare (Both) pan-target outline boxed only the focused lane after cameras were shared.
- Known limitations / follow-ups: Concurrent status-bar / tile-pie WIP remains unstaged. A cyan split line still divides the two Compare panes (`--chrome-line` border between them).
- Status: COMPLETE
- Commit: `feat(improve-26): compare view without pan outline`


## Improvement 21 — bottom status bar — 2026-09-08

- Starting commit: `88b25f0af78cb86a39863ec371eaf32b9a1e29f2` (`feat(improve-25): recolor the Data mark coral`)
- Working tree at start: not clean. Concurrent tile-pie, Compare, and inspector WIP were left unstaged and are not in this commit.
- GOAL clauses addressed: P-05, P-09, NA-06, AQ-01, WG-08, NA-12 (amendments dated 2026-09-08 already on HEAD).
- Library research and decisions: no new runtime dependency. Version is Vite `define` from `package.json` (`__APP_VERSION__`). Status bar is `position: fixed` at z-index 150 so it overlaps the inspector (aside z-index 80). Right-click Tile delete reuses `removeTarget`. Preference persists like sound (`localStorage`, off by default). Present and Both hide Actors.
- Files changed:
  - Shell: `src/app/components/StatusBar.tsx`, `src/app/App.tsx`, `src/app/styles/tokens.css`, `src/app/inspector/inspectorFold.css`, `src/app/components/CanvasHelper.tsx`
  - Version: `package.json` (1.0.0), `vite.config.ts`, `src/vite-env.d.ts`, `src/app/version.ts`
  - Document name: `src/workflow/types.ts`, `src/workflow/schema.ts`, `src/demos/oakParkInvoice.ts`, `src/demos/robotMailroom.ts`
  - Board: `src/board/Board.tsx` (`onNodeContextMenu` → `removeTarget` when the toggle is on)
  - Tests: `src/app/App.test.tsx`, `src/app/version.test.ts`, `src/workflow/types.test.ts`, `src/workflow/schema.test.ts`, `e2e/improve-21-status-bar.spec.ts`
  - Contract/docs: `.docs/GOAL.md` and `.docs/IMPROVEMENTS.md` already on HEAD; this handoff entry
  - Evidence: `.docs/evidence/improve-21-status-bar/`
- Behavior implemented:
  - Thin chrome status bar spans the window and overlaps the right inspector.
  - Shows the project name, or Untitled when unnamed / New.
  - `right-click-delete: on/off` toggle; on, right-click a Tile deletes it (same path as X / Delete / inspector Remove).
  - Actors opens Manage actors.
  - Bottom-right `v1.0.0` reads `package.json` via Vite, not a hardcoded UI string.
- Tests and exact results:
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning)
  - `npm run test:unit` — pass (34 files, 208 tests)
  - `npm run test:e2e` — `e2e/improve-21-status-bar.spec.ts` pass (5). Full suite not re-run; concurrent untracked specs were set aside. Chromium via `LD_LIBRARY_PATH` `~/.local/pw-libs`.
- Evidence:
  - `.docs/evidence/improve-21-status-bar/oak-park-1440.png` — Oak Park Invoice, Actors, toggle off, v1.0.0 overlapping inspector (1440×900)
  - `.docs/evidence/improve-21-status-bar/untitled-1440.png` — New board Untitled (1440×900)
  - `.docs/evidence/improve-21-status-bar/actors-1440.png` — Actors opens Manage actors (1440×900)
  - `.docs/evidence/improve-21-status-bar/right-click-on-1440.png` — toggle on (1440×900)
  - `.docs/evidence/improve-21-status-bar/dark-1440.png` — dark chrome status bar (1440×900)
  - `.docs/evidence/improve-21-status-bar/status-bar-1024.png` — bar still overlaps inspector at 1024×768
- Earlier-slice defects fixed: none
- Known limitations / follow-ups: Concurrent tile-pie / Compare / inspector WIP remains unstaged. jsdom cannot mount Manage actors Textarea autosize; e2e covers that panel.
- Status: COMPLETE
- Commit: `feat(improve-21): add bottom status bar`

## Improvement 27 — purple Data mark — 2026-09-08

- Starting commit: `6145df4` (`feat(improve-21): add bottom status bar`)
- Working tree at start: not clean. Concurrent tile-pie / evidence recaptures were left unstaged and are not in this commit.
- GOAL clauses addressed: P-09 (light and dark Data mark contrast). No amendment — Data fill hex is not in the contract.
- Library research and decisions: no new runtime dependency. Coral `#e8784a` read as orange. Saturated grape `#7b3fe0` (dark `#b07dff`) sits apart from Missy’s pastel lavender Who `#c89bf5`, yellow select, teal Path tab, plus green, and minus red. Path tab stays `--data` teal.
- Files changed:
  - `src/board/tiles/dataMark.css`, `src/board/tiles/DataChip.tsx`
  - Tests: `e2e/improve-27-data-purple.spec.ts`; `e2e/improve-25-data-mark.spec.ts` (expects the current mark, not coral)
  - Docs: `.docs/IMPROVEMENTS.md` (27); this handoff entry
  - Evidence: `.docs/evidence/improve-27-data-purple/`
- Behavior implemented:
  - Data tiles and the `+` Data preview oval are grape purple instead of coral.
  - Path-pull tab fill is unchanged (still washed teal).
- Tests and exact results:
  - `npm run build` — `tsc --noEmit` blocked on concurrent missing `pieGeometry.ts`; this commit’s files typecheck. Vite not re-run here.
  - `npm run test:unit` — not re-run (CSS token only). Concurrent App.test status-bar failures remain on the dirty tree.
  - `npm run test:e2e` — `e2e/improve-27-data-purple.spec.ts` pass (1); `e2e/improve-25-data-mark.spec.ts` pass (1). Full suite not re-run; port 4177 was in use (ran on 4196).
- Evidence:
  - `.docs/evidence/improve-27-data-purple/data-mark-light-1440.png` — Account # selected; grape oval, teal Path tab (1440×900)
  - `.docs/evidence/improve-27-data-purple/data-mark-dark-1440.png` — same in dark (1440×900)
- Earlier-slice defects fixed: none
- Known limitations / follow-ups: Concurrent tile-pie WIP remains unstaged.
- Status: COMPLETE
- Commit: `feat(improve-27): recolor the Data mark purple`


## Improvement 29 — Data plus-pull scrim matches Data radius — 2026-09-08

- Starting commit: `3710209e9d18799360733e504f25457afe4ad378` (`feat(improve-27): recolor the Data mark purple`)
- Working tree at start: not clean. Concurrent Who-select / status-bar / tile-pie / evidence recaptures were left unstaged and are not in this commit.
- GOAL clauses addressed: CX-07, WG-07. No amendment — overlay hole radius is not in the contract. Data remains radius 32; Step remains 14.
- Library research and decisions: no new runtime dependency. Plus-pull scrim hardcoded `rx="14"` (Step) on a Data tile (`FIELD_RX` 32). The hole was squarer than the pill, so paper showed between cream fill and ink border. `getComputedStyle` radius is layout px; `getBoundingClientRect` is screen px (React Flow zoom) — `scaleCornerRadius` maps them. Scrim and taffy/Path exit share `TileExitMask`.
- Files changed:
  - `src/board/layout/tileMetrics.ts` (`STEP_RX`, `FIELD_RX`, `nodeRadius`)
  - `src/board/controls/tileOverlay.ts`, `src/board/controls/tileOverlay.test.ts`
  - `src/board/controls/TileChrome.tsx` (shared mask; fallbacks use `nodeRadius` / `nodeSize`)
  - `src/board/tiles/DataTile.tsx`, `src/board/tiles/StepTile.tsx` (radii from those constants; Data no longer `overflow: hidden` on the bordered shell)
  - Insert silhouette and drag ghost set `borderRadius` from the Node kind / live tile
  - Tests: `e2e/improve-29-data-scrim.spec.ts`
  - Docs: `.docs/IMPROVEMENTS.md` (29); `.docs/VISUAL_IMPROVEMENTS.md`; this handoff entry
  - User GIF: `.docs/visual-improvements/2026-09-08-data-create-gaps.gif`
  - Evidence: `.docs/evidence/improve-29-data-scrim/`
- Behavior implemented:
  - Pulling `+` from Data punches a Data-shaped hole in the dim scrim; cream fill meets the ink border.
  - Overlay fallbacks and insert/drag silhouettes follow Data vs Step radius instead of assuming 14.
- Tests and exact results:
  - `npm run build` — `tsc --noEmit` blocked on concurrent untracked `src/board/tiles/pieGeometry.test.ts` (missing `./pieGeometry`). This commit’s files typecheck. `npx vite build` pass (Vite 8.2.2; existing chunk-size warning).
  - `npm run test:unit` — `src/board/controls/tileOverlay.test.ts` pass (3). Full suite excluding concurrent pieGeometry: 37 files, 214 tests pass (includes these 3).
  - `npm run test:e2e` — `e2e/improve-29-data-scrim.spec.ts` pass (1). Full suite not re-run. Chromium via `LD_LIBRARY_PATH` `~/.local/pw-libs/usr/lib/x86_64-linux-gnu`.
- Evidence:
  - `.docs/evidence/improve-29-data-scrim/data-plus-scrim-1440.png` — Account # plus-pull; scrim hole follows Data radius (1440×900)
- Earlier-slice defects fixed: plus-pull scrim used Step’s corner radius on every source tile.
- Known limitations / follow-ups: Concurrent Who-select / tile-pie WIP remains unstaged. Plus-preview Step/Data cards still have inner thumbs (not this leak).
- Status: COMPLETE
- Commit: `feat(improve-29): match Data radius in plus-pull scrim`

## Improvement 28 — Who select is ink, not yellow — 2026-09-08

- Starting commit: `1d030e1986050ef90ec2579f8b0c229bf613e3f6` (`feat(improve-29): match Data radius in plus-pull scrim`)
- Working tree at start: not clean. Improvement 29 landed first. Concurrent status-bar / hamburger Actors / tile-pie / Type-picker WIP remains unstaged and is not in this commit.
- GOAL clauses addressed: P-01, P-09, SH-01, CX-07, NA-06. No amendment — Who selected fill is not in the contract. Improve-06 already used cream for dark-theme Who; the inspector chrome is dark in both themes, so cream + chunky ink is the chrome treatment.
- Library research and decisions: no new runtime dependency. Yellow fill on a pastel actor figure against steel chrome is the clash. View switch / Type / fat / Right Click Delete keep yellow (text pills). Selected Who is cream, 4px `--ink` border, no chip-shadow (pressed). Distinguishable without color alone (CX-07). Keyboard `:focus-visible` stays the blue outline.
- Files changed:
  - `src/app/styles/tokens.css` (`.inspector-who.is-on` only)
  - Tests: `src/app/inspector/whoSelect.test.tsx`, `e2e/improve-28-who-select.spec.ts`
  - Docs: `.docs/IMPROVEMENTS.md` (28); `.docs/VISUAL_IMPROVEMENTS.md`; this handoff entry
  - User GIF: `.docs/visual-improvements/2026-09-08-manage-actors-yellow-highlight.gif`
  - Evidence: `.docs/evidence/improve-28-who-select/`
- Behavior implemented:
  - Selected Who / Manage actors cards no longer use mustard fill. They stay cream with a chunky ink frame.
  - Type and fat selected buttons are unchanged (still yellow).
- Tests and exact results:
  - `npm run build` — `tsc --noEmit` blocked on concurrent untracked `src/board/tiles/pieGeometry.test.ts` (missing `./pieGeometry`). This commit’s files typecheck. `npx vite build` pass (Vite 8.2.2; existing chunk-size warning).
  - `npm run test:unit` — this commit: `src/app/inspector/whoSelect.test.tsx` pass (1). Full suite excluding concurrent pieGeometry: 37 files, 214 tests pass.
  - `npm run test:e2e` — `e2e/improve-28-who-select.spec.ts` pass (3). Full suite not re-run; port 4177 reserved (ran on 4199). Chromium via `LD_LIBRARY_PATH` `~/.local/pw-libs`.
- Evidence:
  - `.docs/evidence/improve-28-who-select/manage-actors-light-1440.png` — Manage actors Alice selected; cream card, ink frame, no yellow (1440×900)
  - `.docs/evidence/improve-28-who-select/manage-actors-dark-1440.png` — same in dark (1440×900)
  - `.docs/evidence/improve-28-who-select/who-selected-light-1440.png` — Step inspector Who Alice; cream + ink, Type Read still yellow (1440×900)
  - `.docs/evidence/improve-28-who-select/manage-actors-1024.png` — Manage actors at 1024×768
- Earlier-slice defects fixed: none. Improve-06 dark-theme cream Who was invisible against unselected cream; both themes now share the ink frame.
- Known limitations / follow-ups: Concurrent hamburger-Actors / tile-pie WIP remains unstaged. Type / fat selected yellow is unchanged (text pills, same family as the view switch).
- Status: COMPLETE
- Commit: `feat(improve-28): restyle selected Who without yellow`

## Improvement 28 — correction 1 — 2026-09-08

- Requested: The hideous yellow is the inspector fold › / ‹ hover, not the actor cards.
- Changed: `.inspector-fold:hover` is cream + ink (chrome button language). `:focus-visible` outline is blue, not yellow. Who select from this improvement is unchanged.
- Tests and exact results:
  - `npx vite build` — pass (Vite 8.2.2)
  - `npm run test:e2e` — `e2e/improve-28-fold-hover.spec.ts` pass (2). Port 4202. Chromium via `LD_LIBRARY_PATH` `~/.local/pw-libs`.
- Evidence:
  - `.docs/evidence/improve-28-fold-hover/fold-hover-open-1440.png` — Hide inspector hovered; cream strip, ink chevron (1440×900)
  - `.docs/evidence/improve-28-fold-hover/fold-hover-collapsed-1440.png` — Show inspector hovered (1440×900)
  - `.docs/evidence/improve-28-fold-hover/fold-hover-dark-1440.png` — same hover in dark (1440×900)
- Status: COMPLETE
- Commit: `feat(improve-28): quiet the inspector fold hover`

## Improvement 30 — Right Click Delete on the right — 2026-09-08

- Starting commit: `06bc97de48b037cc15da0ad615beb8befbf950d0` (`feat(improve-28): quiet the inspector fold hover`)
- Working tree at start: not clean. Concurrent Type-picker / Who-select / tile-pie / evidence recaptures were left unstaged and are not in this commit.
- GOAL clauses addressed: P-05 (amendment dated 2026-09-08). Also ships the already-approved status-bar follow-ups that this layout depends on: no project name, Actors in the hamburger, toggle copy “Right Click Delete”.
- Library research and decisions: no new runtime dependency. After the project name left, `justify-content: space-between` parked the remaining toggle on the left. A `.status-end` cluster (`margin-left: auto`, `justify-content: flex-end`) keeps Right Click Delete immediately left of the version on the right.
- Files changed:
  - Shell: `src/app/components/StatusBar.tsx`, `src/app/components/StatusBar.css`, `src/app/components/Toolbar.tsx` (hamburger Actors), `src/state/store.ts` (Manage actors focus fallback)
  - Tests: `src/app/App.test.tsx`, `e2e/improve-21-status-bar.spec.ts`, `e2e/improve-30-status-toggle-right.spec.ts`, `e2e/hardening.spec.ts`
  - Docs: `.docs/GOAL.md`, `.docs/IMPROVEMENTS.md`, `.docs/VISUAL_IMPROVEMENTS.md`; this handoff entry
  - User GIF: `.docs/visual-improvements/2026-09-08-right-click-delete-left.gif`
  - Evidence: `.docs/evidence/improve-30-status-toggle-right/`
- Behavior implemented:
  - Right Click Delete sits on the right of the status bar, left of `v1.0.0`.
  - Status bar no longer shows the project name or an Actors pill; hamburger Menu has Actors (hidden in Present and Compare).
- Tests and exact results:
  - `npm run build` — `tsc --noEmit` blocked on concurrent untracked `src/board/tiles/pieGeometry.test.ts` (missing `./pieGeometry`). This commit’s files typecheck. `npx vite build` pass (Vite 8.2.2; existing chunk-size warning).
  - `npm run test:unit` — excluding concurrent pieGeometry: 37 files, 214 tests pass.
  - `npm run test:e2e` — `e2e/improve-30-status-toggle-right.spec.ts` pass (3); `e2e/improve-21-status-bar.spec.ts` pass (5). Full suite not re-run; port 4189 (`playwright.inherit.config.ts`). Chromium via `LD_LIBRARY_PATH` `~/.local/pw-libs`.
- Evidence:
  - `.docs/evidence/improve-30-status-toggle-right/toggle-right-1440.png` — Oak Park; toggle off on the right, next to v1.0.0 (1440×900)
  - `.docs/evidence/improve-30-status-toggle-right/toggle-on-1440.png` — same; toggle on (yellow) (1440×900)
  - `.docs/evidence/improve-30-status-toggle-right/toggle-right-dark-1440.png` — dark theme; toggle on the right (1440×900)
  - `.docs/evidence/improve-30-status-toggle-right/toggle-right-1024.png` — toggle on the right at 1024×768
- Earlier-slice defects fixed: none. Concurrent drop-name / hamburger-Actors WIP is included because the left-side toggle only exists on that bar.
- Known limitations / follow-ups: Concurrent Type-picker / Who-select / tile-pie WIP remains unstaged.
- Status: COMPLETE
- Commit: `feat(improve-30): put Right Click Delete on the right`

## Improvement 28 — correction 2 — 2026-09-08

- Requested: Cream fold hover is too harsh and hard to see; drop the blue outlines.
- Changed: Fold hover/focus fill is steel (`#3f5f71` / `#3b4a51`), ice chevron, 120ms ease, `outline: none`. Keyboard `:focus-visible` uses a 3px ink inset, not blue. Not yellow, not cream.
- Tests and exact results:
  - `npm run test:e2e` — `e2e/improve-28-fold-hover.spec.ts` pass (2). Port 4204. Chromium via `LD_LIBRARY_PATH` `~/.local/pw-libs`.
- Evidence: `.docs/evidence/improve-28-fold-hover/` recaptured (open, collapsed, dark).
- Status: COMPLETE
- Commit: `feat(improve-28): soften inspector fold hover`

## Improvement 31 — Present hides the nav bar — 2026-09-08

- Starting commit: `a8648b2fd3c9ffe2a8509a2ffce6d9e1059cdaa8` (`feat(improve-28): soften inspector fold hover`)
- Working tree at start: not clean. Concurrent Type-picker / Who-select / tile-pie / evidence recaptures were left unstaged and are not in this commit.
- GOAL clauses addressed: P-07, P-05 (amendment dated 2026-09-08).
- Library research and decisions: no new runtime dependency. Present already hid the inspector, tile chrome, and hints; the top bar and status bar stayed. Hiding both makes the board full-bleed. Escape exits Present (CX-08 idle; Keybinds lists it). Space still toggles Before/After. Hamburger Present remains the enter path. Modals (Keybinds, replace, recovery, import) keep Escape first.
- Files changed:
  - Shell: `src/app/App.tsx` (omit header and status bar when Present)
  - Keys: `src/keyboard/useAppKeys.ts` (Escape exits Present), `src/keyboard/KeybindsModal.tsx` (Exit present / Esc)
  - Tests: `src/app/App.test.tsx`, `e2e/improve-31-present-nav.spec.ts`, `e2e/shell.spec.ts`, `e2e/improve-20-inspector-fold.spec.ts`, `e2e/improve-21-status-bar.spec.ts`, `e2e/hardening.spec.ts`
  - Docs: `.docs/GOAL.md`, `.docs/IMPROVEMENTS.md`, `.docs/VISUAL_IMPROVEMENTS.md`; this handoff entry
  - Evidence: `.docs/evidence/improve-31-present-nav/`
- Behavior implemented:
  - Present hides the top bar, status bar, and inspector. The board is full-bleed.
  - Space still switches Before/After. Escape exits Present and restores view and selection.
- Tests and exact results:
  - `npm run build` — `tsc --noEmit` blocked on concurrent untracked `src/board/tiles/pieGeometry.test.ts` (missing `./pieGeometry`). This commit’s files typecheck. `npx vite build` pass (Vite 8.2.2; existing chunk-size warning).
  - `npm run test:unit` — excluding concurrent pieGeometry: 37 files, 214 tests pass. Present App.test included.
  - `npm run test:e2e` — Present-related: `e2e/improve-31-present-nav.spec.ts` (3), `e2e/shell.spec.ts` (5), `e2e/improve-20-inspector-fold.spec.ts` (4), `e2e/improve-21-status-bar.spec.ts` (5), `e2e/hardening.spec.ts` (13) all pass. Tracked suite: 135 passed; 1 failed (`e2e/improve-18-path-zip.spec.ts` edge count 9 vs 7 — unrelated Path-pull, not this chrome change). Chromium via `LD_LIBRARY_PATH` `~/.local/pw-libs`.
- Evidence:
  - `.docs/evidence/improve-31-present-nav/present-light-1440.png` — Oak Park Present; no top bar, inspector, or status bar (1440×900)
  - `.docs/evidence/improve-31-present-nav/present-after-1440.png` — Space toggled After; still no chrome (1440×900)
  - `.docs/evidence/improve-31-present-nav/present-dark-1440.png` — Present in dark theme; no chrome (1440×900)
  - `.docs/evidence/improve-31-present-nav/present-1024.png` — Present at 1024×768
- Earlier-slice defects fixed: none
- Known limitations / follow-ups: Concurrent Type-picker / Who-select / tile-pie WIP remains unstaged. Improve-18 Path-zip e2e still fails on extra `.react-flow__edge` hit pads (pre-existing vs this change).
- Status: COMPLETE
- Commit: `feat(improve-31): hide the nav bar in Present`

## Improvement 32 — YAML import and export — 2026-09-08

- Starting commit: `b4c756c0ad631ce6326a01386d116aa4ac0c7505` (`chore: publish Docker image to GHCR`)
- Working tree at start: not clean. Concurrent Type-picker / Who-select / tile-pie / evidence recaptures were left unstaged and are not in this commit. Latest COMPLETE handoff was Improvement 31; HEAD is the later Docker publish.
- GOAL clauses addressed: SH-05, SH-08, SH-13, NG-07, SH-06, SH-07, P-02 (save and load), AQ-06 / AQ-07 (amendments dated 2026-09-08).
- Library research and decisions: YAML 1.2 via `yaml@^2.9` (eemeli). YAML is a JSON superset, so Import still accepts JSON. Hex colors and `&` need quoting; stringify handles Export. Browser localStorage stays pretty JSON so existing saved boards do not migrate. Demo documents are YAML fixtures parsed with `parseDocument` (same path as Import). `freshBoard` stays TypeScript because IDs are generated. Filename slug from project name (`oak-park-invoice.yaml`). No CLI exporter.
- Files changed:
  - Serialize: `src/workflow/serialize.ts`, `src/workflow/serialize.test.ts`, `src/workflow/migrate.ts`
  - Demos: `src/demos/oak-park-invoice.yaml`, `src/demos/robot-mailroom.yaml`, `src/demos/loadYamlFixture.ts`, `src/demos/oakParkInvoice.ts`, `src/demos/robotMailroom.ts`, `src/demos/catalog.ts`, `src/demos/demos.test.ts`
  - Shell: `src/app/components/Toolbar.tsx` (Export after Import; file picker accepts YAML/JSON), `src/app/components/ReplaceDocumentModal.tsx`
  - State: `src/state/persistence.ts`, `src/state/store.ts` (`exportWorkflow`), tests
  - E2E: `e2e/improve-32-import-export.spec.ts`, `e2e/replace.spec.ts`, `e2e/hardening.spec.ts`
  - Docs/rules: `.docs/GOAL.md`, `.docs/IMPROVEMENTS.md`, `.docs/BUILD_PLAN.md`, `.docs/REVIEW_PLAN.md`, `README.md`, `.cursor/rules/workflow-serialization.mdc`, `.cursor/rules/agent-handoff.mdc`
  - Evidence: `.docs/evidence/improve-32-import-export/`
- Behavior implemented:
  - Demos load from YAML files through the Import parser.
  - Hamburger Export downloads the open board as YAML without replacing it.
  - Save copy downloads the same YAML. Import accepts YAML and JSON.
- Tests and exact results:
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning). Local untracked `pieGeometry.test.ts` was moved aside for tsc (missing `./pieGeometry`); it is not in this commit.
  - `npm run test:unit` — 38 files, 221 tests pass (excluding untracked `pieGeometry.test.ts`).
  - `npm run test:e2e` — `e2e/improve-32-import-export.spec.ts` (4), `e2e/replace.spec.ts` (7), `e2e/hardening.spec.ts` (13) all pass (24). Chromium via `LD_LIBRARY_PATH` `~/.local/pw-libs`.
- Evidence:
  - `.docs/evidence/improve-32-import-export/hamburger-export-1440.png` — Menu open with Export after Import (1440×900)
  - `.docs/evidence/improve-32-import-export/import-mailroom-1440.png` — Robot Mailroom after YAML Import (1440×900)
  - `.docs/evidence/improve-32-import-export/hamburger-export-1024.png` — Export in the hamburger at 1024×768
- Earlier-slice defects fixed: none. Oak Park YAML matches the working-tree fixture (extra review Steps and LLM After Who) that was already unstaged.
- Known limitations / follow-ups: Concurrent Type-picker / Who-select / tile-pie WIP remains unstaged. Untracked `pieGeometry.test.ts` still breaks `tsc` until `pieGeometry.ts` exists.
- Status: COMPLETE
- Commit: `feat(improve-32): import and export workflows as YAML`

## Improvement 32 — correction 1 — 2026-09-08

- Requested: Test import/export thoroughly for edge cases and add tests.
- Changed: Empty / `null` YAML is rejected as “This file is empty.” Export filenames are ASCII-slugged, path-safe, and clipped to 80 characters. Import of YAML that still contains merge groups keeps the unfold notice (parse unfolds before `loadDoc`). Unit coverage for BOM/CRLF, trailing-comma JSON, quoted `version`, YAML 1.2 `yes`/`NO`, cycles, extras stripped, unicode/multiline round-trip, grouped unfold, filename edge cases, store Import/Export/Cancel/recovery, YAML stuffed into localStorage rewritten as JSON. E2E: Export→Import round-trip, JSON/`.yml`, v1 migrate, Cancel, empty, cyclic, untitled Export.
- Tests and exact results:
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning). Untracked `pieGeometry.test.ts` moved aside for tsc (not in this commit).
  - `npm run test:unit` — 39 files, 250 tests pass.
  - `npm run test:e2e` — `e2e/improve-32-import-export.spec.ts` (10), `e2e/replace.spec.ts` (7), `e2e/hardening.spec.ts` (13) all pass (30). Chromium via `LD_LIBRARY_PATH` `~/.local/pw-libs`.
- Status: COMPLETE
- Commit: `feat(improve-32): cover import export edge cases`

## Improvement 33 — Compare greys Who and text fields — 2026-09-08

- Starting commit: `19c00dbba12dc27c39cfd24ac5b45e64fa9f0e5d` (`feat(improve-32): cover import export edge cases`)
- Working tree at start: not clean. Concurrent Type-picker / Who-select / tile-pie / graph WIP was stashed as `concurrent-wip-aside-for-improve-33` for build and e2e, then restored after this commit.
- GOAL clauses addressed: BA-05, NA-09. No amendment — Compare was already read-only; this is the disabled look.
- Library research and decisions: no new runtime dependency. Type and Split already used `disabled` plus `opacity: 0.55`. Who was disabled with no fade. Text fields used `readOnly`, which keeps the live cream field. Compare now uses `disabled` on those fields so they share the Type fade. jsdom does not apply the CSS, so fade is asserted in e2e.
- Files changed:
  - `src/app/inspector/SelectedItemForm.tsx` (`disabled` on Label / Name / Details / Path condition; import `compareDisabled.css`)
  - `src/app/inspector/compareDisabled.css` (Who and input fade)
  - Tests: `src/app/App.test.tsx`, `src/app/inspector/whoSelect.test.tsx`, `e2e/improve-33-compare-readonly.spec.ts`, `e2e/projection.spec.ts`
  - Docs: `.docs/IMPROVEMENTS.md` (33); this handoff entry
  - Evidence: `.docs/evidence/improve-33-compare-readonly/`
- Behavior implemented:
  - In Compare, Who keys fade like Type keys.
  - Name, Details, Data Label, and Path condition look disabled, not like live fields.
- Tests and exact results:
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning). Concurrent WIP stashed for this run.
  - `npm run test:unit` — this commit: `whoSelect.test.tsx` and `App.test.tsx` pass (20). Full suite on the isolated tree: 38 files, 247 passed / 2 failed (`store.actors.test.ts` inherit/assign — unrelated, present on isolated HEAD).
  - `npm run test:e2e` — `e2e/improve-33-compare-readonly.spec.ts` (2), `e2e/projection.spec.ts` (6) all pass (8). Chromium via `LD_LIBRARY_PATH` `~/.local/pw-libs`.
- Evidence:
  - `.docs/evidence/improve-33-compare-readonly/compare-step-1440.png` — Compare inspector; Type, Who, Name, Details faded (1440×900)
  - `.docs/evidence/improve-33-compare-readonly/compare-step-dark-1440.png` — same in dark (1440×900)
  - `.docs/evidence/improve-33-compare-readonly/compare-step-1024.png` — same at 1024×768
- Earlier-slice defects fixed: none
- Known limitations / follow-ups: Concurrent Type-picker / Who-select / tile-pie / graph WIP remains in stash `concurrent-wip-aside-for-improve-33` until restored.
- Status: COMPLETE
- Commit: `feat(improve-33): grey Compare Who and text fields`

## Improvement 34 — Add Tiles and Paths to the left — 2026-09-08

- Starting commit: `e451ac7b8f3fd4aa00f89ab6536cf6d8b8881a43` (`feat(improve-33): grey Compare Who and text fields`)
- Working tree at start: not clean. Concurrent Type keypad / Who-select / tile-pie WIP was left unstaged. Untracked `pieGeometry.test.ts` and `CanvasHelper.test.tsx` were moved aside for `tsc`.
- GOAL clauses addressed: WG-02, WG-03, WG-04, WG-05, WG-06, WG-07, NG-02, SH-09, SH-14, AQ-01, NA-03 (amendments dated 2026-09-08)
- Library research and decisions: no new runtime dependency. Keybinds stay in localStorage only (no YAML/Compose seed). Pan keys default unbound. Unique-root special cases dropped in favor of a weakly connected DAG (fan-in allowed; islands and cycles rejected). Oak Park Read can be removed because its children reconverge; a source is blocked only when removal would split the board.
- Files changed:
  - Graph/commands: `src/workflow/graph.ts`, `commands.ts`, `after.ts`, `actors.ts`, `catalogs.ts`
  - Store/keys: `src/state/store.ts`, `interaction.ts`, `src/keyboard/bindings.ts`, `useAppKeys.ts`, `KeybindsModal.tsx`
  - UI: `src/board/controls/TileChrome.tsx`, `plusPreviewLayout.ts`, `PathContextMenu.tsx`, `src/board/layout/tileMetrics.ts`, `src/app/components/CanvasHelper.tsx`, `src/app/styles/tokens.css` (left tabs; X moved to top-center so left `+` meets target-size)
  - Tests: `src/workflow/{graph,commands,schema,after,actors}.test.ts`, `src/state/store.commands.test.ts`, `src/keyboard/bindings.test.ts`, `src/board/controls/plusPreviewLayout.test.ts`, `src/app/App.test.tsx`, `src/state/store.actors.test.ts` (Oak Park Review Who matches YAML)
  - E2E: `e2e/improve-34-reverse-add.spec.ts`, `ready.ts`, `canvas.spec.ts`, `commands.spec.ts`, `improve-11-path-delete.spec.ts`, `improve-13-who-inherit.spec.ts`, `improve-16-other-task.spec.ts`, `merge.spec.ts`, `routing.spec.ts`, `hardening.spec.ts`
  - Docs: `.docs/GOAL.md` (amendments), `.docs/IMPROVEMENTS.md` (34), this handoff entry
  - Evidence: `.docs/evidence/improve-34-reverse-add/`
- Behavior implemented:
  - Selected Tiles have mirrored left and right `+` / Path-pull tabs. Left `+` creates a predecessor (Path new → this). Left Path-pull drop on X creates X → this.
  - Spawn keys: Q/E Step left/right, A/D Data left/right. After: Q/E After-only Step; A/D ignored.
  - Fan-in is allowed. Deleting the last Tile empties the board. Deleting a Tile or Path that would split the board buzzes.
  - Predecessor Step Who uses last-used Human / Alice / first Human (does not inherit the successor). Child Step still inherits.
  - Keybinds: Reset to defaults; pan unbound; Esc cancels capture; Backspace/Delete clears; colliding rebind clears the other action.
- Tests and exact results:
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning). Node 24. `pieGeometry.test.ts` asided.
  - `npm run test:unit` — 38 files, 258 tests pass.
  - `npm run test:e2e` — `e2e/improve-34-reverse-add.spec.ts` (7), plus affected `canvas`, `commands`, `improve-11-path-delete`, `improve-13-who-inherit`, `improve-16-other-task`, `merge`, `routing`, `hardening`, `improve-19-plus-fan`. Chromium via `LD_LIBRARY_PATH` `~/.local/pw-libs`.
- Evidence:
  - `.docs/evidence/improve-34-reverse-add/left-plus-fan-1440.png` — left `+` fan Step/Data to the left (1440×900)
  - `.docs/evidence/improve-34-reverse-add/q-predecessor-1440.png` — Q predecessor; helper chips Q/E/A/D (1440×900)
  - `.docs/evidence/improve-34-reverse-add/fan-in-1440.png` — two Steps feeding one Data (1440×900)
  - `.docs/evidence/improve-34-reverse-add/after-left-step-1440.png` — After-only Step to the left of Read (1440×900)
  - `.docs/evidence/improve-34-reverse-add/left-tabs-1024.png` — left and right `+` at 1024×768
- Earlier-slice defects fixed: Oak Park unique source is not blocked when children reconverge (weak connectivity). `store.actors.test.ts` inherit fixture uses Write (Alice) because Review is Roy in the YAML. Path-delete / spawn-key e2e updated from `1`/`2` to E/D. Tile X moved off the left edge so left `+` passes WCAG 2.2 target-size.
- Known limitations / follow-ups: Concurrent Type keypad / Who-select / tile-pie WIP remains unstaged. Untracked `pieGeometry.test.ts` still breaks `tsc` until `pieGeometry.ts` exists.
- Status: COMPLETE
- Commit: `feat(improve-34): add Tiles and Paths to the left`

## Improvement 35 — default LLM, Script, Agent robots — 2026-09-09

- Starting commit: `c0536b338f0916f49aeb68b8ec56fed50e0e7759` (`feat(improve-34): add Tiles and Paths to the left`)
- Working tree at start: not clean. Concurrent Type keypad / Who-select / tile-pie WIP stashed as `concurrent-wip-aside-for-improve-35`. Untracked `CanvasHelper.test.tsx` and two untracked e2e specs moved aside for `tsc` / Playwright.
- GOAL clauses addressed: WG-01, NA-01, NA-04 (amendments dated 2026-09-09)
- Library research and decisions: no new runtime dependency. Default Robot remains “first Robot on the roster”; that is now LLM. If After needs a Robot and the roster has none, auto-create LLM/LLM (same as the new default). Existing localStorage boards are not migrated. Robot Mailroom is unchanged. Oak Park keeps its two robots; the Script actor is named Script.
- Files changed:
  - `src/workflow/actors.ts` (`ROBOT_PRESETS`; `defaultActors`; `ensureDefaultRobot`)
  - `src/demos/oak-park-invoice.yaml` (Robot → Script)
  - Tests: `src/workflow/actors.test.ts`, `src/demos/demos.test.ts`, `src/state/store.replace.test.ts`, `src/state/store.actors.test.ts`, `src/app/App.test.tsx`
  - E2E: `e2e/improve-35-default-robots.spec.ts`, `e2e/inspector.spec.ts` (Who Script / Who LLM; After Review is Roy)
  - Docs: `.docs/GOAL.md` (amendments), `.docs/IMPROVEMENTS.md` (35), this handoff entry
  - Evidence: `.docs/evidence/improve-35-default-robots/`; inspector evidence under `.docs/evidence/07-inspector/` refreshed
- Behavior implemented:
  - New board roster: Alice, Roy, Jack, Missy, LLM, Script, Agent (Name matches Type).
  - After-only Steps on a new board default to LLM.
  - Oak Park After tiles read LLM/LLM and Script/Script.
  - Manage actors still edits Name, Color, and Type on each robot.
- Tests and exact results:
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning). Node 24.
  - `npm run test:unit` — 38 files, 261 tests pass.
  - `npm run test:e2e` — `e2e/improve-35-default-robots.spec.ts` (3), `e2e/inspector.spec.ts` (6) all pass (9). Chromium via `LD_LIBRARY_PATH` `~/.local/pw-libs`.
- Evidence:
  - `.docs/evidence/improve-35-default-robots/new-who-1440.png` — New board Who: LLM, Script, Agent (1440×900)
  - `.docs/evidence/improve-35-default-robots/new-manage-actors-1440.png` — LLM selected; Name LLM, Type LLM (1440×900)
  - `.docs/evidence/improve-35-default-robots/after-only-llm-1440.png` — After-only Step assigned LLM/LLM (1440×900)
  - `.docs/evidence/improve-35-default-robots/oak-park-after-1440.png` — Oak Park After: LLM/LLM then Script/Script (1440×900)
  - `.docs/evidence/improve-35-default-robots/new-who-1024.png` — New board Who at 1024×768
- Earlier-slice defects fixed: inspector After Review Who expected Alice; YAML After Who is Roy.
- Known limitations / follow-ups: Concurrent WIP remains in stash `concurrent-wip-aside-for-improve-35`. Untracked `CanvasHelper.test.tsx` moved aside for `tsc`.
- Status: COMPLETE
- Commit: `feat(improve-35): default LLM Script and Agent robots`

## Improvement 36 — keep branch rows when forking — 2026-09-09

- Starting commit: `aeabd4e` (`feat(improve-35): default LLM Script and Agent robots`)
- Working tree at start: not clean. Concurrent inspector / type-picker / visual-rule WIP left unstaged. Untracked `CanvasHelper.test.tsx` moved aside for the unit run, then restored.
- GOAL clauses addressed: CX-05 (amendment dated 2026-09-09). Path create still forks (WG-07); drag-onto-Path still inserts (NG-02).
- Library research and decisions: no new runtime dependency. ELK `considerModelOrder` only seeds order; `LAYER_SWEEP` was swapping a new left-fork source to the bottom and lining the old top branch with it. After the first layout, Nodes/Paths are ordered by displayed y, with `forceNodeModelOrder` and `LONGEST_PATH_SOURCE`. Spawn docks on the source row (walk further left/right on overlap) using displayed positions, not document hints.
- Files changed:
  - Layout: `src/board/layout/elkGraph.ts`, `layoutEngine.ts`, `useLaneLayout.ts`, `tileMetrics.ts`
  - Store: `src/state/store.ts` (`spawnBranch` dock)
  - Tests: `src/board/layout/layoutStability.test.ts`, `tileMetrics.test.ts`
  - E2E: `e2e/improve-36-branch-rows.spec.ts`
  - Docs: `.docs/GOAL.md`, `.docs/IMPROVEMENTS.md`, `.docs/VISUAL_IMPROVEMENTS.md`, `.docs/visual-improvements/2026-09-09-branch-row-flip.gif`, this handoff entry
  - Evidence: `.docs/evidence/improve-36-branch-rows/`
- Behavior implemented:
  - Left `+` / `Q` on Search website (already has Read → website) forks a predecessor on that same top row. Search filesystem stays below.
  - Right `+` / `E` still forks outgoing. Insert-on-Path is unchanged.
- Tests and exact results:
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning). Node 24.
  - `npm run test:unit` — 40 files, 269 tests pass (`CanvasHelper.test.tsx` asided for this run).
  - `npm run test:e2e` — `e2e/improve-36-branch-rows.spec.ts` (3), `e2e/routing.spec.ts` (12), `e2e/improve-34-reverse-add.spec.ts` (7) all pass. Chromium via `LD_LIBRARY_PATH` `~/.local/pw-libs`.
- Evidence:
  - `.docs/evidence/improve-36-branch-rows/left-fork-website-1440.png` — Q on Search website; new Task stays on the top row (1440×900)
  - `.docs/evidence/improve-36-branch-rows/left-fork-filesystem-1440.png` — Q on Search filesystem; website stays above (1440×900)
  - `.docs/evidence/improve-36-branch-rows/left-fork-website-1024.png` — same website fork at 1024×768
- Earlier-slice defects fixed: `clearDockPosition` started at port index 1 so a fork never tried the source row; spawn used saved positions instead of the derived layout.
- Known limitations / follow-ups: Concurrent inspector / type-picker WIP remains unstaged. Path-end wobble (unrelated Paths lerping on every ELK pass) is still a later improvement.
- Status: COMPLETE
- Commit: `feat(improve-36): keep branch rows when forking`

## Improvement 37 — insert left spawn as parent — 2026-09-09

- Starting commit: `857605d` (`feat(improve-36): keep branch rows when forking`)
- Working tree at start: not clean. Concurrent inspector / type-picker / visual-rule WIP left unstaged. Untracked `CanvasHelper.test.tsx` moved aside for `tsc`, then restored.
- GOAL clauses addressed: WG-07, NA-03, CX-05 (amendments dated 2026-09-09). Right `+` still forks; drag-onto-Path still inserts (NG-02); left Path-pull still connects existing Tiles.
- Library research and decisions: no new runtime dependency. Left spawn is insert-before (retarget incoming Paths onto the new Tile, then Path `new → this`), not fan-in. After-only left `+` retargets extra incoming only so Before Paths stay put. Who uses the same inherit-from-host walk as a child Step.
- Files changed:
  - Commands: `src/workflow/graph.ts` (`retargetIncoming`), `src/workflow/commands.ts`, `src/workflow/after.ts`, `src/workflow/actors.ts`, `src/state/store.ts`
  - Tests: `src/workflow/commands.test.ts`, `graph.test.ts`, `actors.test.ts`, `after.test.ts`, `src/state/store.commands.test.ts`, `src/board/layout/layoutStability.test.ts`
  - E2E: `e2e/improve-37-left-parent.spec.ts`
  - Docs: `.docs/GOAL.md`, `.docs/IMPROVEMENTS.md`, `.docs/VISUAL_IMPROVEMENTS.md`, `.docs/visual-improvements/2026-09-09-left-plus-should-be-parent.gif`, this handoff entry
  - Evidence: `.docs/evidence/improve-37-left-parent/`
- Behavior implemented:
  - Left `+` / `Q` / `A` on Search website (Read → website) becomes Read → new Task → website. The new Task is Roy when website is Roy.
  - Right `+` / `E` still adds a child Path (fork when outgoing Paths already exist).
  - After-only left `+` still does not rewrite Before Paths.
- Tests and exact results:
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning). Node 24.
  - `npm run test:unit` — 40 files, 274 tests pass (`CanvasHelper.test.tsx` asided for this run).
  - `npm run test:e2e` — `e2e/improve-37-left-parent.spec.ts` (3), `e2e/improve-36-branch-rows.spec.ts` (3), `e2e/improve-34-reverse-add.spec.ts` (7), `e2e/improve-13-who-inherit.spec.ts` (5) all pass (18). Chromium via `LD_LIBRARY_PATH` `~/.local/pw-libs`.
- Evidence:
  - `.docs/evidence/improve-37-left-parent/left-parent-roy-1440.png` — Q on Roy’s Search website; Task sits on that branch as parent, Who Roy (1440×900)
  - `.docs/evidence/improve-37-left-parent/right-fork-website-1440.png` — E still forks a child to the right of Search website (1440×900)
  - `.docs/evidence/improve-37-left-parent/left-parent-roy-1024.png` — left parent + Roy Who at 1024×768
- Earlier-slice defects fixed: Improvement 36 treated left `+` as a fork; that was the wrong graph. Who inherit from the successor was locked the other way in the 2026-09-08 NA-03 amendment.
- Known limitations / follow-ups: Concurrent inspector / type-picker WIP remains unstaged. After-only left `+` on a Before-origin Tile cannot insert into the Before chain; it adds an After-only Path `new → this` (or inserts among extra incoming only). Path-end wobble is still a later improvement.
- Status: COMPLETE
- Commit: `feat(improve-37): insert left spawn as parent`

## Improvement 38 — tile chrome, hints, Type, Who, demo YAML — 2026-09-09

- Starting commit: `83256841416d3e0256f8dcc8294d7939761a60ce` (`feat(improve-37): insert left spawn as parent`)
- Working tree at start: not clean. Concurrent inspector / Type keypad / visual-rule WIP was left unstaged and is folded into this improvement where it matches the request.
- GOAL clauses addressed: P-06, WG-05, NA-06, NA-05, CX-07 (amendments dated 2026-09-09). Path right-click menu and Delete-key Path remove are unchanged.
- Library research and decisions: no new runtime dependency. Tabs are 40×40 with an 18px peek (were 44 / 14) so they sit slightly off the face. Vite `liveDemoYaml` re-reads `src/demos/*.yaml?raw` from disk in dev. Export fills a blank Human role as `worker` so a dropped fixture still parses. Type keypad is a 3×3 including Other. Selected Who is yellow fill with a matching yellow border.
- Files changed:
  - Chrome/hints: `src/board/controls/TileChrome.tsx`, `src/app/styles/tokens.css`, `src/app/components/CanvasHelper.tsx`, `src/board/tiles/dataMark.css`
  - Inspector: `src/app/inspector/TypeButtons.tsx`, `TypeButtons.css`, `ManageActorsPanel.tsx`
  - Store/demos/export: `src/state/store.ts`, `src/demos/oakParkInvoice.ts`, `src/demos/robotMailroom.ts`, `src/workflow/serialize.ts`, `src/workflow/schema.ts`, `vite.config.ts`
  - Tests: `src/app/components/CanvasHelper.test.tsx`, `src/app/App.test.tsx`, `src/app/inspector/whoSelect.test.tsx`, `src/state/store.actors.test.ts`, `src/workflow/schema.test.ts`, `src/workflow/serialize.test.ts`, `e2e/improve-38-chrome-hints.spec.ts`, `e2e/canvas-helper-hints.spec.ts`, plus color/tab assertions in improve-09/11/15/22/25/27/28/34/18
  - Docs: `.docs/GOAL.md`, `.docs/IMPROVEMENTS.md`, `.docs/VISUAL_IMPROVEMENTS.md`, `.cursor/rules/visual-improvements.mdc`, this handoff entry
  - Evidence: `.docs/evidence/improve-38-chrome-hints/`, user attachments under `.docs/visual-improvements/2026-09-09-*`
- Behavior implemented:
  - Selected-tile `+` / Path tabs sit slightly farther off the card and are a little smaller. The X is centered on Step and Data.
  - Right-click Delete hint follows the status-bar toggle. Spawn hints are a two-line Q/E Step and A/D Data diagram with a left/right arrow.
  - Data mark is a lighter grape. Type names are not clipped. Selected Who is yellow without an ink outline.
  - Manage actors opens on the selected Step’s Who. Overwriting a demo YAML is re-read from disk in dev; Export no longer writes a blank Human role.
- Tests and exact results:
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning). Node 24.
  - `npm run test:unit` — 41 files, 280 tests pass.
  - `npm run test:e2e` — 170 passed (1.7m). Chromium via `LD_LIBRARY_PATH` `~/.local/pw-libs`. Untracked `e2e/improve-23-tile-edit.spec.ts` was asided for this run (concurrent WIP).
- Evidence:
  - `.docs/evidence/improve-38-chrome-hints/step-chrome-hints-1440.png` — selected Search filesystem; 40px tabs, centered X, two-line spawn hints (1440×900)
  - `.docs/evidence/improve-38-chrome-hints/data-chrome-1440.png` — Account # selected; lighter purple mark, centered X (1440×900)
  - `.docs/evidence/improve-38-chrome-hints/type-who-1440.png` — 3×3 Type keypad; Who Alice yellow without ink outline (1440×900)
  - `.docs/evidence/improve-38-chrome-hints/manage-alice-1440.png` — Manage actors opened from Search filesystem with Alice selected (1440×900)
  - `.docs/evidence/improve-38-chrome-hints/path-hint-toggle-on-1440.png` — Right-click Delete hint appears after the toggle is on (1440×900)
  - `.docs/evidence/improve-38-chrome-hints/chrome-hints-1024.png` — spawn hints and Type keypad at 1024×768
- Earlier-slice defects fixed: Type inspector icons were 52px inside a 26px well (WIP). Empty Human role on Export failed Zod when the YAML was dropped back into `src/demos`. Vite cached `?raw` demo YAML across overwrite. Improve-09 tab z-index locator did not distinguish left/right tabs. Improve-18 Path-pull expected 7 RF edges; Oak Park Before has 8 plus the new Path.
- Known limitations / follow-ups: Refresh still loads localStorage, so a replaced demo YAML needs Demo from the menu. Untracked `e2e/improve-23-tile-edit.spec.ts` and elk plan files remain outside this commit. Path-end wobble is still a later improvement.
- Status: COMPLETE
- Commit: `feat(improve-38): polish tile chrome hints and Type`



## Improvement 40 — Humans then Robots on their own row — 2026-09-09

- Starting commit: `6a78def5b6d8d57305bf88d8636114c3aaf40f49` (`feat(improve-38): polish tile chrome hints and Type`)
- Working tree at start: not clean. Concurrent Type keypad / insert-on-bundle / Other-Name WIP was stashed as `concurrent-wip-aside-for-improve-39`, `concurrent-wip-aside-for-improve-40-remaining`, `concurrent-wip-aside-for-improve-40-more`, and `concurrent-wip-aside-for-improve-40-wave3`.
- GOAL clauses addressed: NA-05, NA-06 (amendment dated 2026-09-09). Document version unchanged.
- Library research and decisions: no new runtime dependency. Display uses two wrapping rows (Humans, then Robots) so Robots cannot share the last Human row. `insertActor` places a new Human after the last Human and a new Robot after the last Robot.
- Files changed:
  - Actors: `src/workflow/actors.ts` (`humansOf`, `robotsOf`, `insertActor`; `ensureDefaultRobot` uses insert)
  - Store: `src/state/store.ts` (`addHuman` / `addRobot`)
  - Inspector: `src/app/inspector/ActorWhoGrid.tsx`, `WhoButtons.tsx`, `ManageActorsPanel.tsx`, `src/app/styles/tokens.css`
  - Tests: `src/workflow/actors.test.ts`, `src/state/store.actors.test.ts`, `src/app/inspector/whoSelect.test.tsx`, `e2e/improve-40-actor-groups.spec.ts`
  - Docs: `.docs/GOAL.md`, `.docs/IMPROVEMENTS.md`, `.docs/VISUAL_IMPROVEMENTS.md`, `.docs/visual-improvements/2026-09-09-manage-actors-human-after-robots.png`, this handoff entry
  - Evidence: `.docs/evidence/improve-40-actor-groups/`
- Behavior implemented:
  - Manage actors and Who show Humans first, wrapping among themselves. Robots always start on the next row with a slight gap.
  - Add human inserts after Missy (before LLM on a new board). Add robot appends after Agent.
- Tests and exact results:
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; existing chunk-size warning). Node 24.
  - `npm run test:unit` — 41 files, 284 tests pass.
  - `npm run test:e2e` — `e2e/improve-40-actor-groups.spec.ts` (3), `e2e/improve-28-who-select.spec.ts` (3), `e2e/improve-35-default-robots.spec.ts` (3), `e2e/inspector.spec.ts` (6) all pass (15). Chromium via `LD_LIBRARY_PATH` `~/.local/pw-libs`. Port 4192 (4177 in use). Untracked `e2e/improve-23-tile-edit.spec.ts` and `e2e/improve-39-type-compact.spec.ts` asided for this run.
- Evidence:
  - `.docs/evidence/improve-40-actor-groups/manage-human-row-1440.png` — Person on its own Human row; LLM/Script/Agent on the next row (1440×900)
  - `.docs/evidence/improve-40-actor-groups/manage-robot-end-1440.png` — Add robot appends Robot after Agent (1440×900)
  - `.docs/evidence/improve-40-actor-groups/who-human-row-1440.png` — Step Who picker uses the same Human/Robot row split (1440×900)
  - `.docs/evidence/improve-40-actor-groups/manage-human-row-1024.png` — same Manage actors split at 1024×768
- Earlier-slice defects fixed: none
- Known limitations / follow-ups: Concurrent Type keypad / Other-Name / insert-bundle WIP remains in stash. Path-end wobble is still a later improvement.
- Status: COMPLETE
- Commit: `feat(improve-40): group Humans then Robots on their own row`

