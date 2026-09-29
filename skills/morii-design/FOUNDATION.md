# Morii Foundation — the visual logics

> **Read** once per task, before the first line of CSS. It turns the language (`SKILL.md` §5) into decisions you can derive. Values live in `Token.css`.

## 1. Color

- **Chroma is zero or full.** Surfaces, lines and shadows are pure neutrals (shadows are black alpha); color appears at full strength on a few small points. Middle saturation — tinted panels, large 15% washes, blue-tinted shadows — reads as dirty, however subtle each piece is.
- **Three sources, no fourth:**
  - **Semantic** — a real state, from a lexicon defined once (one word → one tone: 已完成 → ok, 逾期 → crit). Only when true; a warning without a crossed threshold is noise.
  - **Identity** — tells entities apart; derived from the name (a hash onto hues that avoid the semantic ones), used on small solid marks. Same name, same color, everywhere.
  - **The accent** — current navigation, the primary action, focus, the focused series, links.

  "Give this parameter a nice color" is a fourth source: refuse it.
- **Where color may land:** small solid marks, chips and tags (`-soft` ground + `-ink` text), active / selected / focus indicators, chart geometry, and **the one lead value of a unit** (§2). All other text is ink.
- **Tone triplets:** solid for fills, `-ink` for text and icons, `-soft` for chip grounds. Colored text never uses the bare solid and is never softened with opacity.
- **Never color alone** — every distinction also has an icon, shape, text, position or weight (▲▼ beside a delta, a check beside a selection).
- **90 / 10** neutral to colored area; monochrome is allowed.
- **Contrast** — body ≥4.5:1, large text and UI graphics ≥3:1, measured on the real ground in both themes. A rank that fails is not a usable rank.
- **Decorative lines faint, functional lines strong** — separators share one faint level; focus, selection and drop outlines stay at full strength.

## 2. Type & hierarchy

- **Rank, don't align.** Things in a unit (card, row, record, view) are unequal: decide the order, then express it. Equal weight everywhere means the eye has nowhere to land.
- **One lead per unit** — the thing that changes, or the reason the user came. It may take one type tier up and its semantic tone; nothing else in the unit does.
- **Spend the cheapest channel first:** position → weight → ink rank → size → color. Pushing every channel on everything flattens it again.
- **Two weights:** 400–450 and 650–720 (hero figures 700+). **Scale:** hero 30 · title 18 · body 16 · sub 13 · label 12 · cap 11. Inside a component, hierarchy is weight and ink; size tiers separate levels of the page.
- **Labels are demoted, not deleted** — a caption above a bold value.
- One alignment axis per block · figures `tabular-nums` · large numbers as 万 / 亿 · serif only for long-form prose.

## 3. Space, separation, elevation, shape

**Proximity groups before any line does:** the gap inside a group is clearly smaller than between groups (≈1.5–2×), all from `--sp-*`. Whitespace is the first separator; prefer empty over full.

**One cue per boundary** — the cheapest that works: ① whitespace ② a tone step ③ a hairline ④ a shadow, only when the upper thing floats. Stacked cues draw a frame inside a frame; fill + an inner top highlight + a tight shadow is the **stamped sticker** — a light source nothing else on screen has, repeated until the page is a sheet of stickers.

**Elevation is a role — give each thing the one it has:**

| Role | What | Separation |
|---|---|---|
| **Sheet** | page, sidebar, content area | none inside; whitespace or a hairline between regions |
| **Resting group** | a quote, a field track, a secondary group inside a face | a tone step (`--inset`) or whitespace — no shadow |
| **Raised object** | an independent thing the user picks, drags or selects | a tone step up, **or** `--shadow-sm` in light — one of the two |
| **Floating layer** | popover, menu, tip, drawer, inside-window | `--panel-strong` + `--shadow-md`/`-lg`, at most one hairline |
| **Modal** | blocks its scope | scrim + `--shadow-pop` |

- Resting things cast no shadow — a shadow says "above the page, and can go away".
- **Selection is lift** (the raised role) plus a second channel, never an accent ring.
- **A container's presence is a signal:** one boxed item among bare ones says "look here"; boxing everything says nothing.
- **Check against the real ground, in both themes.** Dark steps are small (a card one step up can vanish); light has nothing above white, so light lifts with shadow or a hairline — never a "brighter" surface or an edge highlight.
- **Floating material is a dial**, picked once: *solid* (default: `--panel-strong` + diffuse shadow) · *translucent* (neutral fill + blur + one faint rim; for small drops or surfaces whose content shows through; solid under reduced-transparency) · *shaped* (the layer grows out of its host as one continuous shape).

**Shape**

- Radius scales with the box: dense rows and small controls `--r-xs`/`--r-sm` · containers `--r-md`/`--r-lg` · large faces `--r-xl`. `--r-pill` only for chips and tags.
- **Nested radius: outer = inner + padding**, derived, never both picked: `calc(var(--outer) - var(--pad))`. A border between them counts as padding; when padding ≥ outer radius, the inner takes its own ladder value.
- One shape language per strip — a toolbar doesn't mix pills and squares.

**Visual centering** — center the ink, not the box: trim labels with `text-box: trim-both cap alphabetic`; asymmetric glyphs carry their correction inside their viewBox (`morii-icon`); a lone block sits above center via `grid-template-rows: 1fr auto 1.2fr` (up to 1.5 for a full page). Judge in the render, never the inspector.

## 4. Data text — one parameter, one chip

```
✗  Bug · 生产 38 · 49 条 · v2.1.0 · 3 小时前
✓  [Bug] [生产 38] [49] [v2.1.0] [3 小时]
```

- Independent facts glued with `·` `|` `/` `—` make the eye segment them character by character; the separator weighs as much as the data. One parameter per chip, only `gap` between.
- Drop unit words the context already states (`49 条` → `49`); a unit that must stay goes inside the chip. Delete connectives (「共」「已」「其中」「来自」). Same for breadcrumbs, subtitles and legends.
- Exceptions: a value that natively contains the symbol (`2025-11-04 12:30`, `v2.1.0-rc1`) and genuine prose. An error line is not prose — problem and fix are two lines (`STATES.md` §6).
- **One container type per category dimension** (all chips or all tags). No bare dots as markers — the only dot is a live lamp followed by its text (「● 运行中」).

## 5. Icons — usage (drawing belongs to `morii-icon`)

- Anything newly drawn → `morii-icon`; existing glyphs are reused; no emoji.
- 16–18px default, 14–16px inline; `--ink-3` by default, accent only when active or focused; no decoration.
- **Icon tile** (a small neutral rounded square) only when the icon *is* the thing's identity — an app, a file type, a person. A tile before every row is the stamped sticker again.
- Meaningful glyphs `role="img"` + `aria-label`; decorative ones `aria-hidden`.

## 6. Actions & interaction

**Sort actions by nature; each nature has one home and one form, product-wide:**

| Nature | e.g. | Home | Form |
|---|---|---|---|
| **Flow** | submit, send, approve | the screen's one primary spot | the only solid button |
| **Regular** | export, duplicate, share | a toolbar or action row | quiet, icon first (+ ≤2-word label when ambiguous) |
| **State change** | enable ↔ disable, pin | the indicator that shows the state | the chip or switch itself |
| **Destructive** | delete, void, reset | separated, last | danger-toned; confirmation sized by consequence (`SHELL.md` §7) |

- **Escalate by how much you must ask** — run → confirm inline → prompt one value → full form. **Prefer undo** to confirm for anything reversible.
- **Feedback lands where the action happened;** toasts are for system events with no place of their own.
- **Objects come from somewhere and go home** — a menu grows from its trigger and shrinks back; a dragged item is the item itself, never a proxy box.
- **Temporary surfaces never own data;** anything that needs a response never auto-dismisses.
- **Repeating attention lives on the object** — an arrival may light the screen edge once; anything that keeps signaling moves on the object.
- Every action is keyboard-reachable; a shortcut is shown once, where the action lives.

## 7. States & baseline feedback

One transform per state, identical on every component:

| State | Transform |
|---|---|
| hover | a `--hover` wash or one surface step; **geometry frozen**; only inside `@media (hover:hover) and (pointer:fine)`; list rows switch instantly, no sliding highlight |
| pressed | `scale(var(--press))` on pointerdown, not on click |
| focus-visible | 2px accent outline, 2px offset |
| selected | lift + a second channel |
| disabled | `opacity: .4`, no hover |
| loading | a thin arc replaces the leading glyph; label and width stay |
| invalid | a `--crit` ring + one line of `--crit-ink` beneath |

**Never gated** — without these the interface is broken, not "unpolished":

| Where | Curve | Duration |
|---|---|---|
| hover / color | `--ease-hover` | `--t-fast` |
| press | `--ease-out` | `--t-press` |
| loading ↔ empty ↔ content cross-fade | `--ease-out` | `--t-med` |
| overlay enter / exit (unmount after exit) | `--ease-out` | `--t-fast`–`--t-slow`; exit ≈ enter × 0.7 |

Never `ease-in` · under 300ms · only `transform` / `opacity`, never `transition: all` · interruptible (`transition`, not `@keyframes`, for anything with an end state; no input lock).

## 8. Text selection & cursor

App chrome is not a document — one stray drag shouldn't paint labels blue:

```css
body { -webkit-user-select: none; user-select: none; cursor: default }
input, textarea, [contenteditable="true"] { -webkit-user-select: text; user-select: text; cursor: text }
```

One root rule, never per component. Content meant to be copied (IDs, codes, errors worth pasting) opts back in or gets a copy button. Long-form reading pages keep native selection.
