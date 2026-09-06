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
