# Morii Foundation — concrete visual values

> **When to read:** after workflow stages ①②, before the first line of CSS. Read once.
> This is where the rules turn into actual numbers. The supreme law (the four principles and the nine 克制·层次·呼吸 rules) lives in `SKILL.md` §B and is not repeated here.

---

## 1. Color

- **Neutral surfaces.** Card faces and the page ground are always fixed neutrals. **No mood hue may ever tint a surface.**
- **One accent pair per card.** Each card/component uses one `--accent` plus its tint. If two are genuinely needed, enable `--accent-2` — still ≤2 hues. A DASH dashboard relaxes this to "one pair per component."
- **Color touches four things only:** chart geometry · chips (`--accent-soft` ground + `--accent-ink` text) · active-state icons · focus states.
- **Vivid but tiny, 60-30-10.** The accent may be saturated (S 55–75) but each element stays small and total colored area is ≤10%: ≥60% neutral/whitespace · ~30% gray tones · ≤10% accent.
- **No bare color on text.** Colored sentences, values, and labels are banned — use weight for emphasis. Single exception: a DASH stat row may tint one delta with a text-grade accent (chip semantics, no box).
- **Never color alone.** Every state or distinction carries a second channel (icon / shape / text / position) — add ▲▼ to deltas, a checkmark or bold or a thumb to selection. It has to read for color-blind users and in a dark room.
- **Semantic color on demand.** Deltas use `--up`/`--down`. Warnings `--warn`/`--crit` appear **only when a real threshold is crossed** — no threshold, no warning, and never as decoration.
- **Chart hues derive from the product accent, they are not looked up by domain.** One series → `--accent` alone. A second series only when a second dimension genuinely exists → `--accent-2`, and it must stay distinguishable in both themes and under grayscale. Past two, you are colouring categories that should have been separated by position or shape instead (`CHARTS.md`).
- **Contrast:** body ≥4.5:1 · hero/large text ≥3:1 · UI elements (icons, control outlines, focus rings) ≥3:1. **Verify in both light and dark.**

## 2. Typography

System stack `--font`. A serif is allowed for headings **only where the content is long-form prose meant to be read slowly**, never as flavor on UI labels or figures. All figures use `tabular-nums`. Large numbers collapse to 万/亿 (1.2万, 3.4亿).

| Role | Size | Weight | Tracking |
|------|------|--------|----------|
| Hero figure | `clamp(28px,7vw,30px)` | 700–720 | `-0.02em` (tighten at scale) |
| Section heading | **18px** | 650 | `-0.1px` |
| Body | **16px** | 400–450 | 0 (line-height 1.5–1.6) |
| Secondary text | 13px | 500 | 0 |
| Label | 12px | 500–600 | `+0.07em` when caps |
| Eyebrow | 11px | 700 | `+0.6px`, uppercase |

- **Exactly two weights:** regular 400–450 + bold 650–720 (hero figures may go 700+). No 300/600/800 scattered across the screen.
- **Hierarchy from contrast** (weight + ink step), not from stacking sizes.
- **Keep one alignment axis per block.** Left-aligned means everything left — no left/center/right mixing. Fewer alignment lines read tidier.

## 3. Spacing & separation

- **4px grid, generous whitespace.** Card padding 24–36 · between blocks 24–32 · between items 10–12 (roughly 1.5× the usual). A lone number never gets a box — whitespace separates it.
- **Weaken borders and dividers.** Borders and dividers are deliberately **low contrast** (`--sep` / `--hairline` are already muted). Grouping priority: **whitespace > inset surface step > very faint hairline.** **Never draw `<hr>`, heavily-outlined cards, or a limp 1px gray frame.** A card's boundary comes from its shadow and surface difference, not from a border.
- **Inset block.** A neutral one step deeper/lighter than the card face, no border, carrying quotes or secondary groups — it replaces colored boxes, `border-left` callouts, and dividers generally.
- **Radius.** Containers/buttons **10–16px** (`--r-sm`~`--r-md`; **scale with the box** — small controls and dense rows take the low end, large containers and roomy layouts the high end, one ladder per product). **Full pill `--r-pill` is only for small chips and tags**, never for primary buttons or containers. No sharp hard edges.
- **Nested radius: outer = inner + padding.** A rounded thing inside a rounded container shares one corner center with it, so the gap stays even around the curve. Pick one radius by its box and **derive the other — never pick both off the ladder**: inward `border-radius: calc(var(--outer) - var(--pad))`, outward `calc(var(--inner) + var(--pad))` when the inner is a fixed component. A border between the two counts as padding. Picked independently, the gap pinches at the corners (inner too round) or bulges (inner too square) — invisible alone, cheap-looking in sum. Derived radii are exempt from the 10–16 range. **Padding ≥ outer radius** → the corners sit too far apart to read as a pair, so the inner takes its own ladder value instead of collapsing to a sharp zero. Applies at every depth: segmented thumb in its track, image in a card, card on its plinth (`SHELL.md` §4.5), field inside a search bar.
- **Shadow.** Either none, or **very faint over a large area** (big blur+spread, very low opacity, e.g. `0 20px 60px rgba(0,0,0,.05)`) — producing "floating," not "outlined." Tight hard shadows are banned.

### Visual centering — center the ink, not the box

`place-items:center` centers bounding boxes; the eye centers mass. **Everything "centered" is centered optically.** Geometric centering is the prerequisite (it fails silently more often than not — `STATES.md` §3 lists the causes); the optical correction comes on top of it.

- **Text: center the ink, not the line box.** A line box carries the font's ascent and descent unevenly, so a box-centered label in a button, chip, or tile reads high or low depending on the font. Trim the box to the ink — `text-box: trim-both cap alphabetic` — so padding measures from cap height to baseline. CJK glyphs overhang the cap line: render mixed and CJK-only labels and judge by eye, not by the numbers.
- **Asymmetric glyphs: fix the glyph once, never each usage.** A play triangle, pin, or arrow keeps its mass off its bbox center (a right-pointing triangle's centroid sits 1/6 of its width left of center). Icons carry that correction inside their own viewBox — centroid at (12,12), `morii-icon` — so containers only center the box. A glyph that still looks off is a glyph bug: fix it in the registry. Only an icon you cannot edit gets a per-usage nudge, as `translate` in `em` so it scales with the glyph — never `margin`/`padding`, which move the box and its hit area.
- **A lone block sits slightly above center.** Empty states, first-run heroes, lone placeholders in a tall region read as sagging when exactly centered — the eye rests above the geometric middle. Split the free space unevenly rather than nudging by px: `grid-template-rows: 1fr auto 1.2fr`, bottom share from 1.2 (block-sized region) up to 1.5 (full page) — the taller the region, the larger. It scales with the container and holds no magic number. Overlay placement is not this rule; it follows its own contract in `SHELL.md`.
- **Judge in the render at real size, never in the inspector** — the inspector reports the box, which is exactly what this rule corrects.

## 4. Category marking — one container type, no bare dots

When expressing "which category / what status this row belongs to":

- **One container type per dimension.** Either all **chips** (`--r-pill` pill, `--accent-soft` ground + `--accent-ink` text), or all **rounded rectangular tags** (`--r-xs`/`--r-sm`). The two may split duties across dimensions (tags for category, chips for status), but **never mix within one column or one dimension**.
- **Bare dots `•` or small colored dots as category markers are banned.** A dot cannot carry label text, so it can only convey meaning through color (violating "never color alone"), and en masse it turns the screen into colored measles. Same for list-item prefixes — **all icons, or all chips, never dots.**
- **The one dot that survives:** a live status lamp (`--online`) and similar conventional indicators — and it **must sit immediately before its text** (「● 运行中」), never alone.
- **Legends follow the same rule:** color swatch + text, or annotate directly on the graphic. No orphan dots.

### Banned separator `·` — side-by-side parameters each get a chip

When a meta line carries several parameters, the lazy move is gluing them with `·` (or `|`, `/`, `—`):

```
✗  Bug · 生产 38 · 49 条 · v2.1.0 · 3 小时前
```

Five independent facts typeset as one sentence — the eye has to scan character by character and segment them using the separators, and the `·` itself carries the same ink weight as the numbers. **It is not separation, it is noise.**

```
✓  [Bug] [生产 38] [49] [v2.1.0] [3 小时]
```

- **One parameter = one chip.** Only `gap` between chips, **never a separator character**.
- **Drop unit words where possible:** `49 条`→`49`, `3 个`→`3`. The unit is stated once by the column header, legend, or context. A unit that must stay goes *inside* the chip, never bare outside it.
- **Delete the connectives** — 「共」「已」「其中」「来自」 and similar words that chain chips into a sentence. Nothing is lost.
- **Equally banned:** `·` in breadcrumbs, in multi-part subtitles, between legend entries. To segment, break the line, break the column, or open up the spacing.
- **Only two exceptions:** ① a compound value that natively contains the symbol (`2025-11-04 12:30`, `v2.1.0-rc1`, `8/02`) — that is part of the value; ② punctuation inside a genuine prose sentence. **Side-by-side parameters never qualify.**
- **An error / notice line is not that prose exception.** 「出事了 —— 怎么办」 is two facts: the problem is one line, the fix is the next one, dimmer. When upstream text arrives already glued, split it at the connector in the component — see `STATES.md` §6.

One-line test: **if removing that `·` still leaves two independent facts on either side, they should have been two chips.**

## 5. Icons — how to use them (how to draw them belongs to `morii-icon`)

**Any SVG glyph that needs to be newly drawn or redrawn → call the `morii-icon` skill.** Form quality, tier rules, and icon motion all live there and are not restated here. Existing icons are reused, never redrawn.

- **Emoji as icons is banned.** Always inline SVG.
- **Size:** 16–18px by default, 14–16px for tool and inline glyphs. Prefer too small over too large.
- **Ink step:** monochrome `--ink-3` mid-gray by default, not accent. Accent is reserved for active and focus states.
- **No decoration:** no extra strokes, fills, badges, or backplates. One icon says one thing.
- **Icon tile:** a 22–34px rounded square, **neutral by default** (`--inset` ground + `--ink-3`); only the emphasized state switches to `--accent-soft` + accent.
- **A11y:** semantic glyphs get `role="img"` + `aria-label`; purely decorative ones get `aria-hidden`.
- **Still by default.** Icon motion appears only on state change, result confirmation, empty-state entrance, and loading rings.

**Fallback (only when `morii-icon` is unreachable):** `viewBox="0 0 24 24"`, flat, one tier — unsure → solid (if going line, the whole set uses one uniform 2–2.4 stroke; never hairlines). The body fills the frame (roughly 2–22), centroid at (12,12), high radii and no sharp corners, `fill="currentColor"` on the outer shell (omit it and it renders pure black), one concept per icon. Still render it and look at it when done.

## 6. Buttons

- **Pure graphic first.** Self-evident actions (close / more / search / edit / add / share) are a bare `icon-btn` (SVG + `aria-label`), no label. Only ambiguous ones (archive / export / sync) get a ≤2-character label — do not make everything a guessing game, and do not make icon and text redundant.
- **One primary button.** Exactly **one** solid accent primary action per screen; everything else drops to ghost / inset / pure graphic.
- **Hit target ≥44×44px** (an icon button may look small; its hit area must not be).
- **Destructive actions are the exception:** delete and similar keep a written confirmation, never a bare icon.

## 7. Component state machine

Feedback within 100ms. Touch targets ≥44px.

| State | Behavior |
|---|---|
| hover | shadow-lift or `brightness(1.05)`; **geometry unchanged** (only background/opacity/box-shadow/fill). Must be wrapped in `@media (hover:hover) and (pointer:fine)` |
| active | `transform: scale(var(--press))` — **fire on press, do not wait for click** |
| focus | `:focus-visible` 2px accent outline |
| loading | the lightweight thin arc from `STATES.md` §2 (accent is allowed inside a button, neutral elsewhere) |
| error | `--crit` |
| disabled | `opacity: .4` |

**This layer is "baseline feedback" and is never gated** — a press with no response, a focus with no ring, content that hard-cuts: none of those are "motion not added yet," they are broken. So this section carries enough curve and duration on its own; **you do not need to read `MOTION.md`** for it:

| Where | Curve | Duration |
|---|---|---|
| hover / color change | `--ease-hover` | `--t-fast` |
| `:active` press | `--ease-out` | `--t-press` |
| three-state cross-fade | `--ease-out` | `--t-med` |
| overlay enter / exit | `--ease-out` | enter `--t-fast`~`--t-slow`, **exit ≈ enter ×0.7** |

Four hard gates: **never `ease-in`** (it starts slow, exactly when the user is watching hardest) · **always under 300ms** · **animate only `transform`/`opacity`, never `transition: all`** · **interruptible** — reversible from any frame: `transition` not `@keyframes` for anything with an end state, and no input lock while it plays (`MOTION.md` §6).

The full curve ladder, duration ladder, physicality, interruptibility, gestures, and timeline choreography belong to `MOTION.md` (stage ④, once authorized) — **the table above is a subset of it, not a second system.**

## 8. Text selection & cursor — chrome is not a document

An app screen is not a web page. A browser engine lets the **whole document** be dragged over, so one stray drag paints labels, tabs, and table headers blue — the user "selected" something that was never selectable, and the I-beam cursor promised it would work. Interface chrome must not do that; this belongs to the same never-gated baseline as the state table above.

```css
/* Root, once — chrome is not selectable, and the cursor stops promising it is */
body { -webkit-user-select: none; user-select: none; cursor: default }

/* Explicitly re-opened where text is typed or copied */
input, textarea, [contenteditable="true"] { -webkit-user-select: text; user-select: text; cursor: text }
```

- **One root rule, never per component.** A second `user-select:none` on a top bar, drawer, or drag handle is the same class of error as a second popover implementation — the root already covers it.
- **`user-select` inherits, so the opt-in list is mandatory, not defensive.** Kill it at the root without re-opening inputs and dragging to select inside a text field stops working.
- **Content the user is meant to copy opts back in** — IDs, tokens, log lines, code, an error message worth pasting. Give it `user-select:text` (a `.selectable` utility) **or** a copy button. Do not leave copying to a drag the user is not allowed to make.
- **`::selection` keeps its token color.** After this rule it only ever fires inside regions where selection was granted, which is exactly where it should be visible.
- **Long-form pages keep native selection.** Docs, articles, marketing — the content *is* the document. This rule is for app chrome (shells, panels, tables, toolbars), and most sharply for desktop webviews (Tauri / Electron), where selectable chrome is what makes a native app read as a web page in a frame.
