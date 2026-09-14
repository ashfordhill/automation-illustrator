# Improvement 66 — Theme presets, Save, theme files, paper texture

Kickoff for a **fresh** agent **after Improvement 65 is COMPLETE**. Implement **only** this file. Do **not** reopen tile chrome, the inspector, or the hamburger.

Starting commit: `13a3c8840354e69c394ad74dc3e88e42bd7c9729` (`docs: plan Improvement 66 theme presets, Save, texture`, on top of `feat(improve-65): add a hamburger chrome Theme editor`, the latest COMPLETE handoff). Clean tree. Protocol: `.docs/BUILD_PLAN.md` Section 4, `.docs/handoff.md`, `.cursor/rules/agent-handoff.mdc`.

Suggested commit: `feat(improve-66): theme presets, Save, theme files, paper texture`.  
Evidence: `.docs/evidence/improve-66-theme-presets/`.

User asked for this on 2026-09-13 after reviewing Improvement 65 (sketch and screenshot in `.docs/visual-improvements/2026-09-13-*`). Cite that date on GOAL amendments.

> **Status: APPROVED 2026-09-13.** §9 records the user's answers; §3 already reflects them.

---

## 1. Problems with Improvement 65

1. Every color pick writes CSS variables on `:root` immediately, so the whole app recolors behind the window. The user wants only the **preview** to change until **Save**.
2. The `ColorField` card clips the eyedropper (bottom of the icon is cut). The cards are also larger than they need to be in this window.
3. There is one theme (a hex map in `automation-pitch.chrome-theme`). No named presets, no Import / Export.
4. The paper texture is a fixed small dot grid (`Background variant=Dots`, `--grid-dot` derived from paper + chrome). The user wants four patterns and a texture color.
5. The dark block behind the Horizontal / Vertical (and Before / After / Compare) switch is not editable: the track is the derived `--chrome-well` (chrome 62% + black) and the 4px switch frame is the tile `--ink`. The user wants it as a color option.
6. A grey hairline sits above the status bar's cyan border (`.docs/visual-improvements/2026-09-13-status-bar-grey-line.png`). It is `box-shadow: 0 -3px 0 rgba(0, 0, 0, 0.2)` on `.status-bar` (`StatusBar.css` and the duplicate in `tokens.css`) and on `.theme-preview-status`. It cannot take a theme color; the user wants it gone.

## 2. Outcome

The Theme window (hamburger → Theme) becomes, top to bottom (matches the sketch):

1. **Row 1** — preset dropdown (left) · **Import** · **Export** (right).
2. **Preview** — live chrome islands as today, painting the **draft** theme only.
3. **Colors** — seven color cards (Frame, **Well**, Button, Outline, Ice, Selected, Paper), smaller and unclipped.
4. **Row 4** — **Texture** picker (left): a pattern card that opens a 2×2 popover of four patterns, joined to a tall color card for the texture color. **Reset** · **Save** (right).

Nothing outside the window changes until Save. Save applies the theme to the app and closes the window.

## 3. Locked decisions

### Draft vs applied

- Store gains `themeDraft` (a full `ThemePreset` body) that exists only while the window is open. Color cards and the texture picker edit the draft. The preview scopes CSS variables to `.theme-preview` from the draft; `:root` is untouched.
- **Derived vars gotcha:** `--paper-deep`, `--chrome-ink-soft`, fold hover are `color-mix()` declared on `:root`, so overriding `--paper` on a descendant does **not** re-resolve them. Redeclare the derived vars inside a `.theme-preview { … }` rule (same `color-mix` formulas) so the preview computes them locally. `--on-yellow` is set inline from `onYellowFor`.
- **Save**: applies the selected preset's saved body to `:root` (existing `applyChromeTheme`, extended with texture), persists the selection, closes the window. Not an undo entry.
- **Close / Escape without Save**: if the draft is edited, a small nested confirm asks **Discard changes?** (Discard · Keep editing). Discard drops the draft and the dropdown returns to the applied preset. Unedited drafts close without a prompt. Escape closes the confirm first, then the window.
- **Reset** (was "Reset to defaults"): returns the draft to the **selected preset's saved body**. Disabled when the draft is not edited.

### Well color

- New editable key `chromeWell` → `--chrome-well`, card caption **Well**, placed right after Frame. It is no longer derived; each preset stores an explicit hex (defaults below equal the current `color-mix(chrome 62%, black)` so Ice is pixel-identical).
- `.view-switch` frame border and background switch from `var(--ink)` to `var(--chrome-well)` so the orientation and view switches read as one configurable dark block. Tile `--ink` stays untouched everywhere else.
- Everything already on `--chrome-well` follows automatically: switch tracks, status toggle off state, inspector Actors / Back buttons, inspector fold, StatusBar well. The `color-mix(chrome-ink 14%, chrome-well)` hover stays derived.

### Presets

- Four **built-in** presets, ids `ice`, `graphite`, `forest`, `plum`. `ice` is the current palette and the shipped default. Built-ins are constants in `chromeTheme.ts`; they cannot be overwritten or deleted.
- **Custom** presets persist in `automation-pitch.themes` as pretty JSON: `{ version: 1, selected: <id>, custom: ThemePreset[] }`. Custom ids are `custom-<nanoid>` via the existing id helper in `src/workflow/ids.ts`.
- **Migration**: on first load, if `automation-pitch.chrome-theme` exists and differs from every built-in, it becomes custom preset **"My theme"** (`chromeWell` = `mixSrgb(chrome, "#000000", 0.62)`, texture `dots`, color = the old derived mix) and is selected; the old key is removed. If it equals `ice`, it is simply removed. No user data is dropped.
- **Dropdown** (Mantine `Select`, groups "Built-in" and "My themes") always shows the **selected** preset's name. Choosing a preset loads its saved body into the draft. When the draft differs from the saved body, an **Edited** pill sits next to the dropdown; the name itself does not change.
- **Save on an edited draft** opens a small nested prompt (Mantine `Modal` inside the Theme window):
  - Selected preset is **custom**: **Save over ‹name›** · **Save as new** (name field) · Cancel.
  - Selected preset is **built-in**: name field only, copy "Built-in themes can't be overwritten. Name your theme." · **Save** · Cancel.
  - Names are trimmed, non-empty, and unique across all presets (Save disabled otherwise). A saved-as-new preset becomes the selected one, is applied, and the window closes.
- **Save on an unedited draft** applies the selected preset and closes (this is how you switch presets).
- Custom presets get a **trash** (delete) next to the dropdown; hidden for built-ins. Deleting selects `ice` and loads it into the draft; if the deleted preset was the applied one, `ice` is applied too.

### Theme files (Import / Export)

- Format: **YAML 1.2** via the `yaml` package, like workflow files. JSON imports too. New module `src/app/theme/themeFile.ts` with Zod 4 schema `themeFileSchema`:

  ```yaml
  version: 1
  name: Ice
  colors:
    chrome: "#0c3349"
    chromeWell: "#07202d"
    chromeBtn: "#f7fcfe"
    chromeLine: "#5ec8e8"
    chromeInk: "#f3fbfe"
    yellow: "#e8c14a"
    paper: "#e8f4fa"
  texture:
    pattern: dots   # dots | rings | cross | mesh
    color: "#aabec8"
  ```

- **Export** downloads the **selected preset's saved body** (never the unsaved draft) as `<slug>.theme.yaml` using the existing `downloadTextFile` and slug rules from `serialize.ts`.
- **Import** (hidden file input, `.yaml,.yml,.json`) parses and validates; on failure `setNotice("Theme file is not valid")` and nothing changes. On success the theme is added to **My themes** (duplicate name gets a ` 2`, ` 3`… suffix), selected, and loaded into the draft. It is **not** applied until Save.
- Theme files are not part of the workflow YAML; `WorkflowDoc` and `WORKFLOW_VERSION` are untouched.

### Paper texture

- `ThemePreset.texture = { pattern: "dots" | "rings" | "cross" | "mesh", color: hex }`. Texture color replaces the derived `--grid-dot` (the CSS variable name stays `--grid-dot` for continuity; it is now an explicit hex on the theme).
- Replace React Flow `<Background>` with a small `PaperTexture` component (`src/board/PaperTexture.tsx`): one SVG `<pattern>` that follows the viewport transform (`useViewport`), gap `GRID` (32). Patterns at zoom 1:
  - `dots` — filled circle r 1.1 (current look).
  - `rings` — hollow circle r 3.5, stroke 1.2.
  - `cross` — plus mark, 6px arms, stroke 1.2.
  - `mesh` — full grid lines, 1px.
- The preview paper uses the same pattern markup (static, zoom 1) so the preview and board match.
- **Texture picker**: a compound control in the color-card style. Left: a wide card (about 2× a color card) showing paper + current pattern; clicking opens a Popover with a **2×2** grid of pattern tiles (each tile is a mini paper swatch drawn with that pattern; selected tile has the ink border). Right, joined: a tall color card (`ColorField`) for the texture color. Caption **Texture** under the pair like the other captions.

### Status bar edge

- Delete the `box-shadow: 0 -3px 0 rgba(0, 0, 0, 0.2)` from `.status-bar` (both declarations) and from `.theme-preview-status`. The 3px `--chrome-line` border is the only edge between paper and status bar. The top bar's border stays as is. Do not touch the button and switch drop shadows (`0 3px 0 rgba(0,0,0,…)`); those are the chunky-button look, not a hairline.

### Card sizing

- Theme-window color cards shrink to **48×68** (fill 60% / dropper 40%, icon 16px) with an explicit height so nothing clips. Scoped to `.theme-picker .inspector-color-card`; the Manage-actors card is unchanged.

### Built-in palettes (proposed; tune for contrast during implementation, P-09)

| id | chrome | chromeWell | chromeBtn | chromeLine | chromeInk | yellow | paper | texture |
|---|---|---|---|---|---|---|---|---|
| ice | `#0c3349` | `#07202d` | `#f7fcfe` | `#5ec8e8` | `#f3fbfe` | `#e8c14a` | `#e8f4fa` | dots `#aabec8` |
| graphite | `#2b2b30` | `#1b1b1e` | `#f4f2ee` | `#8a8f98` | `#f1efe9` | `#f0b429` | `#f3f0ea` | mesh `#cfcac0` |
| forest | `#16382b` | `#0e231b` | `#f5f9f2` | `#7fc9a1` | `#eef7f0` | `#ecc94b` | `#edf5ea` | cross `#b8cdb4` |
| plum | `#3a2450` | `#241632` | `#fbf7ff` | `#c39bea` | `#f6f0fc` | `#f2c14e` | `#f1eaf8` | rings `#c9b9dc` |

`ice` well and texture colors are the current `color-mix` results (`chrome 62% + black`, `paper 72% + chrome`) so the default chrome and board are pixel-identical.

### Unchanged

- Hamburger items (SH-05), tile `--cream`, Type / Who `--yellow`, `--on-yellow` rule, undo semantics, workflow YAML. No new runtime dependency (`yaml`, Zod 4, Mantine, Tabler only).

## 4. Files

- `src/app/theme/chromeTheme.ts` — `ThemePreset`, `TexturePattern`, `BUILTIN_THEMES`, `applyChromeTheme(body)` incl. texture, `themePresetsEqual`.
- `src/app/theme/themeFile.ts` (new) — Zod schema, `themeToYaml`, `parseThemeText`, `themeExportFilename`.
- `src/app/theme/ThemeModal.tsx`, `ThemeModal.css` — new layout, draft wiring, prompt, Import/Export, Reset/Save.
- `src/app/theme/TexturePicker.tsx` (new), `src/board/PaperTexture.tsx` (new), `src/board/Board.tsx` (swap `<Background>`).
- `src/app/theme/ColorField.tsx` + `tokens.css` — unclipped card; theme-scoped smaller size; `--chrome-well` becomes a plain hex on `:root` (light and dark blocks); `.view-switch` frame uses `--chrome-well`.
- `src/state/store.ts`, `persistence.ts` — `themes` (selected + custom), `themeDraft`, actions `openTheme`, `setThemeDraft`, `selectThemePreset`, `resetThemeDraft`, `saveTheme(overwrite | { name })`, `deleteThemePreset`, `importTheme`, `exportTheme`; `LS_THEMES`; migration from `LS_CHROME_THEME`.
- `src/keyboard/useAppKeys.ts` — Escape closes the window and discards the draft (nested prompt closes first).
- `src/app/components/StatusBar.css`, `tokens.css` `.status-bar`, `ThemeModal.css` `.theme-preview-status` — drop the `-3px` black shadow.

## 5. Tests

- Unit: `themeFile.test.ts` round-trip (`themeToYaml` → `parseThemeText` → schema) for all four built-ins; invalid pattern / hex rejected. `persistence.test.ts`: migration of the old hex map, unique-name suffixing, selected fallback to `ice` when a custom id is missing. `store.shell.test.ts`: draft edits do not touch `:root`; Save applies; close discards; Reset restores the saved body; Save-as-new on a built-in creates a custom preset and selects it.
- e2e `improve-66-theme-presets.spec.ts`: pick Frame → status bar unchanged, preview changed → Save → status bar changed and window closed; edited draft → X → Discard changes? → Keep editing keeps the draft, Discard restores the applied theme; edited built-in → Save prompts for a name → new preset in dropdown; trash on a custom preset selects Ice; Export downloads `ice.theme.yaml`; Import of that file adds "Ice 2"; texture Mesh shows grid lines on the board after Save; Well pick → orientation switch track and frame change after Save; `.status-bar` computed `box-shadow` is `none`; axe on the open window.
- Keep `improve-65-theme.spec.ts` passing (update Save-step expectations).

## 6. Evidence

`.docs/evidence/improve-66-theme-presets/`: window open with an edited draft (preview differs from the app behind), the Save-as-new prompt, dropdown open with four built-ins and one custom, the texture popover, board with `mesh`, all 1440×900; window at 1024×768.

## 7. GOAL amendments (append under `## Amendments`, dated 2026-09-13)

- **P-09** — The Theme window edits a draft shown only in its preview; Save applies to the app and closes. Themes are named presets: four built-ins (Ice, Graphite, Forest, Plum) plus user presets persisted in localStorage. Built-ins cannot be overwritten. The chrome well (switch tracks and frames, inspector well) is an editable color, not derived. Paper texture (dots, rings, cross, mesh) and its color are part of a theme.
- **SH-08** — Theme files are YAML 1.2 (JSON accepted), validated with Zod 4 (`version: 1`). The Improvement 65 hex map migrates to a user preset on load.
- **NG-07, SH-13** — Theme Import / Export live inside the Theme window, not the hamburger. Still no command-line exporter.

## 8. Handoff

Append `## Improvement 66 — Theme presets, Save, theme files, paper texture — <date>` to `.docs/handoff.md` and the matching `# Improvement 66` entry to `.docs/IMPROVEMENTS.md` (Requested 2026-09-13; copy §3 as Locked decisions).

## 9. User answers (2026-09-13)

1. Close with unsaved edits → ask **Discard changes?** first.
2. Custom presets → **trash** next to the dropdown, custom only.
3. Import → add to My themes, select, preview; **Save applies**.
4. Smaller color cards → **Theme window only**.
5. Patterns → **dots · rings · cross · mesh**.
6. Built-ins → **Ice, Graphite, Forest, Plum** as proposed.
7. (Added after approval) The dark behind the Horizontal / Vertical switch must be editable → seventh color **Well** (`--chrome-well`); the switch frame follows it instead of `--ink`.
8. (Added after approval) Remove the grey hairline above the status bar (the `rgba(0,0,0,0.2)` `-3px` shadow) from the app and the preview.
