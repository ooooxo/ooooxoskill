---
name: morii-design
description: >
  Morii Design System — the visual + interaction baseline and workflow entry for ANY interface,
  page, app screen, component, prototype, or front-end visual work.
  Whenever the task is 设计 UI / 做页面 / 做应用界面 / 做组件 / 做原型 / 做设计稿 / 写前端界面 / 改视觉,
  run this skill FIRST, then build. This file is the mandatory always-on floor + router;
  details load on demand — never assemble rules from memory.
  Output is a COMPLETE page / app screen (fills the viewport, may carry nav and multiple views),
  never a single floating widget card.
  Core三词: 克制 · 层次 · 呼吸感 — graphics carry the information, text is reduced to atoms,
  surfaces stay neutral, whitespace is the protagonist.
  Workflow: ① Token single source → ② modules (skeleton / containers / charts / states)
  + baseline feedback → ③ icons (call morii-icon) → ⏸ ship the static build and ASK
  → ④ add motion (read MOTION.md only once authorized).
  Triggers: 设计, UI, 界面, 组件, 原型, 页面, 前端, 视觉, design system, 设计风格, 设计规范, 设计模板.
allowed-tools:
  - Read(~/.claude/skills/morii-design/**)
  - Read(./src/panel/shell/tokens.css)
  - Read(~/.claude/skills/morii-icon/**)
  - Skill(morii-icon)
---

# Morii Design System — Entry & Workflow

**Every design task goes through this file.** It stays resident: it pins the output form, states the supreme law, runs the workflow, and routes to details. Details live in satellite files — **read the one for the step you are on, and only that one**. Writing without reading it = assembling rules from memory = rework.

**Core三词：克制 · 层次 · 呼吸感.** Not "decorating a page" — *compressing information into the fewest visual atoms, saying it with graphics, then giving it room to breathe.*

---

## ⚑ Output form: a page / app, not a card

**What this skill produces is a page or an app screen — real UI that fills the viewport and may carry navigation and multiple views. Not a centered floating widget card.** If the deliverable is one small self-contained widget, this is the wrong skill; everything below assumes a whole page.

- **Fill the viewport.** `body` does not center a `min(430px)` card. Use one of the four skeletons — app shell / content flow / dashboard grid / mobile single column (`LAYOUT.md` §1).
- **Multiple views live in one page.** Switch with tabs inside the same `body` (single-page mindset, no routing) — not one card per view.
- **A card is just one optional grouping container inside the page**, never the page itself. **A page may contain zero cards.**
- **This skill is self-contained.** Every rule, snippet, and piece of geometry it needs lives in the files below, in this system's own token vocabulary. **Do not import structure or CSS from a card-scoped source** — a fixed `min(430px)` shell, a centered `body`, or an "everything is one card" assumption will silently undo the page.

> The "data widget anatomy" in `LAYOUT.md` §3 is the internal structure of **one metric block inside a page** — **not a whole-page template**. Building the whole page from it is this skill's most frequent failure.

---

## §B Supreme law: 克制 · 层次 · 呼吸 (applies throughout)

**Four principles first:**

- **Details compound.** Users almost never notice any single detail on its own — that is exactly the point. Invisible correctness stacks up into "can't say why, but it feels right." So "nobody will notice" is never a reason.
- **Every number must be defensible.** Spacing, radius, duration, easing, elevation — none of them are casual. If you cannot say *why this value*, it belongs in a token.
- **Consistent = predictable.** Things that look alike must behave alike and sit in the same place. The same action looks the same, moves the same, and takes the same time everywhere. Predictability *is* the premium feel. So the recurring choices are made **once per product, not once per screen** — the surface ramp, the radius ladder, the icon tier, the motion personality. **This is a consistency requirement, not a style template:** nothing here prescribes which values you pick, only that a value picked in one place is the value everywhere.
- **Derive from the content, not from a preset.** Every number below has a range, and the range is resolved by what the thing actually is — how large the box is, how dense the information is, how often the user sees it, whether the gesture carries momentum. Reaching for a named style ("make it techy", "make it editorial") skips that reasoning and produces a template wearing the content as a costume.
- **Minimal ≠ least.** You delete noise, not information. Hiding every function in a drawer *looks* minimal and is harder to use; sometimes **adding** context makes things simpler (put the remaining time on the progress bar). Common things up front, advanced one layer down.

**Nine rules:**

1. **Restrained color, 90/10.** ≥90% neutral (white/gray/black) + ≤10% one brand hue — **fully monochrome is allowed**. Color accents, it does not ground.
2. **Never pure black against pure white.** Text uses neutral ink steps (`--ink` / `--ink-3`, not `#000`); surfaces are near-black or system off-white (not `#fff`). The premium feel comes from neutrals, not from hard contrast.
3. **Two weights carry the hierarchy.** Regular (400–450) + bold (650–720). Hierarchy comes from weight + ink depth, not from stacking font sizes.
4. **Generous whitespace (prefer empty over full).** Whitespace is the protagonist. Spacing runs ~1.5× the usual; if it is empty, let it be empty — never fill to fill.
5. **Layers, not density.** Depth comes from z-order + surface steps (bg → content → inset) + diffuse shadow. Not from borders on all four sides, not from a dense grid.
6. **Break the closed card.** Do not box every block with a border and a shadow. Segmentation priority: **full-bleed + generous whitespace > very faint hairline > pure whitespace.** Use a card only to *elevate one genuinely independent idea* — few cards, large, widely spaced.
7. **Radius subtle to soft, never a full circle.** Containers/buttons 10–16px. Full pill/circle is only for small chips and tags. No sharp hard edges anywhere.
8. **Shadow: either none, or diffuse.** Tight hard shadows are banned. If used, go very faint over a large area, producing "floating," not "outlined."
9. **Reject the cheap look.** No high-saturation clashes, no rainbow / multi-hue / bargain gradients. **Gradient whitelist:** ① very faint same-hue ambient background (opacity <6%) ② same-hue fade inside a chart shape. Everything else is flat.

---

## Workflow — four stages, in order; each reads exactly one file

| Stage | Do | Read | Gate |
|---|---|---|---|
| **① Token** | Pull the single source, list what you will reuse | `Token.css` (or the project's `tokens.css`), then `FOUNDATION.md` once | never skip |
| **② Modules + baseline feedback** | skeleton → containers → graphics → states → **give real feedback** | `LAYOUT.md` · `SHELL.md` · `CHARTS.md` · `STATES.md` | first three skip by condition; **baseline feedback never skips** |
| **③ Icons** | Anything newly drawn or redrawn → call the skill | `Skill(morii-icon)` | skip when every icon is reused |
| **⏸ Ship gate** | run the iron checklist → **render and look at it** → ship the static build → **ask about ④** | — | **motion named in the request = pre-authorized, pass straight through**; gesture physics still asked separately |
| **④ Add motion** | entrance choreography / gesture physics / chart polish | `MOTION.md` | only with pre-authorization or explicit yes; both gates must pass |

Concrete values for color / type / spacing / category marking / icon usage / buttons / component states / selection & cursor are in `FOUNDATION.md` — read it once after stage ①, before the first line of CSS.

**Three product-wide decisions get made the first time each one comes up, then never re-opened** (§B "consistent = predictable"): the **icon tier** (solid or line — `morii-icon` §A owns the choice, stage ③) · the **motion personality** (duration baseline, curve, whether anything springs — `MOTION.md` §13, stage ④) · **where in each `FOUNDATION.md` range this product sits** (radius, whitespace, ink contrast). Each is resolved from the content in front of you, and each is written down the moment it is decided, because the second screen has to match the first.

### ① Token: single source, reuse first

**Every color / radius / spacing / motion value references a token. Raw hex is banned everywhere.**

Source of truth: inside the Morii repo → `src/panel/shell/tokens.css` (scoped to `.morii-shell`, ADR 0020/0048). Standalone demo/prototype → copy this skill's **`Token.css`** (`:root` scope, identical names, so migration between the two is painless).

**Reuse first (hard rule):** before adding a value, look for one to reuse.

1. An existing token (including `color-mix()` derivations) can express it → **reuse it, adding is banned.**
2. Only when a semantic genuinely does not exist → add it, and **register the token with its semantic written down** before referencing it.
3. Lower entropy wins: `--accent` deriving `-press/-soft/-ink` beats four hard-coded colors. Recoloring then touches one place.

Quick map: surfaces `--bg-window/--panel/--panel-2/--inset` · ink four steps `--ink→--ink-4` · accent `--accent` (+`-press/-soft/-ink`, optional `--accent-2`) · semantic `--up/--down/--warn/--crit/--online` · lines `--sep/--hairline` · radii `--r-xs…--r-xl/--r-pill` · motion `--ease-out/--spring/--t-fast…` · skeleton `--shimmer`.

### ② Design modules (read by condition — only the ones you use)

| Read | Trigger | Contents |
|---|---|---|
| **`LAYOUT.md`** | output is a page (always) | four skeletons · block segmentation · nine container atoms |
| **`SHELL.md`** | persistent frame, more than one view, any overlay or toast | app shell behavior (what is sticky, what scrolls) · tabs · **the overlay contract + its three forms — popover / inside-window / drawer** · confirmation · toast · stepper · collection routing · density valve |
| **`CHARTS.md`** | drawing any SVG graphic | one-SVG rule · `d` rejects percentages · type lookup · hygiene · scrub-focus |
| **`STATES.md`** | async data / possibly-empty regions / **anything that can fail while the screen stays usable** / any explanatory gray text | three states · lightweight loading criteria · empty state · content density · ⓘ tooltip layer · **failure notices (surface speaks human, diagnostics behind hover)** |

"≥1 graphic per block" is an iron rule, so `CHARTS.md` is read almost every time in practice.

#### Baseline feedback — the half of motion that is NOT gated

Stage ④ is gated, but **these four are not "motion polish," they are baseline usability — without them the interface is simply broken.** Ship them in the static build; **no need to read `MOTION.md`**.

| Required | How | Without it |
|---|---|---|
| Press feedback | every pressable element gets `:active { transform: scale(var(--press)) }` — **fire on press, do not wait for click** | pressing does nothing; feels dead |
| Hover / focus state | hover changes only `background/opacity/box-shadow/fill` (**geometry frozen**); `:focus-visible` gets a 2px accent outline | no focus ring = a11y defect |
| Three-state fade | loading ↔ empty ↔ content **cross-fade**, never a hard cut, never a white flash | content jumps; reads as careless |
| Paired enter/exit for overlays | every overlay form (popover / inside-window / drawer) shares one presentation, mirrored in direction; **unmount only after the exit animation finishes**; never toggle `hidden` on an element that carries `display` | open written without close = half-finished |

This layer needs only four gates: **pick one of four curves** (in/out `--ease-out` · on-screen movement `--ease-in-out` · hover/color `--ease-hover` · constant `linear`), **never `ease-in`** · **under 300ms, exit ≈ enter ×0.7** · **animate only `transform`/`opacity`, never `transition: all`** · **interruptible from any frame, no input lock while it plays**. Values and the state table are in `FOUNDATION.md` §7.

### ③ Icons: call `morii-icon`

**Any SVG glyph that must be newly drawn or redrawn** (a shape inside a button, the glyph in an icon tile, an empty-state illustration) → invoke **`morii-icon`** with the `Skill` tool, and pass along the product's icon tier once it is fixed. It owns form and quality; **this skill never restates how to draw**. On conflict, `morii-icon` wins.

Icons that already exist (in the project registry, or already drawn on this page) are **reused, not redrawn**.

Size / ink step / tile / a11y — the **usage layer** — is in `FOUNDATION.md` §5.

### ⏸ Ship gate: static build first, then ask about motion

After stage ③, **do not casually write the entrance animations in** — motion written before the design is settled is thrown away the first time the design changes.

**First check for pre-authorization:** the user named motion in the request itself (「要有动效 / 要顺滑 / 加点动画 / 会动的」, "make it smooth", "add animation") → **treat it as confirmed, go straight to ④, do not ask.** Asking when you already know the answer trips the skill's own "say it once" rule.

> **Pre-authorization covers the decorative layer only** — entrance choreography, chart transition polish. **Gesture physics (drawer / swipe-to-delete / drag-to-reorder) is expensive and rework-prone: ask about it separately, pre-authorized or not.**

No pre-authorization → run the gate in order:

1. Run the **iron checklist** below.
2. **Render it and look at it** (screenshot / browser) — static frames, both light and dark.
3. Ship the static build.
4. Make the last line of the delivery message **ask whether to enter ④** — not a blank "want animation?", but the specific places you intend to animate, so the answer can be one word:

> 静态版已交付，铺满视口、明暗两版都渲染看过了。要不要进最后一步补入场动效？
> 值得动的有：hero 数字滚动 · 图表条形生长 · 列表错峰淡入（约 +3 处）。
> 手势交互（抽屉 / 滑动删除）另算，需要的话一起说。

**No confirmation → stop at the static build. That is a finished state, not an omission.**

### ④ Add motion: once authorized, read `MOTION.md`

**Entry condition: pre-authorized in the request, or asked at the gate and answered yes.** Neither → do not build it; stop at the static version.

This stage covers the **polish layer** only — entrance choreography (fade-up / stagger / count-up / line-draw / bar-grow) · chart scrub transition polish · gesture physics (drag / drawer / fling) · timeline choreography / delight budget. Criterion: **usable without it, better with it.** Baseline feedback was already delivered in stage ② and does not belong here.

Before animating each spot, pass two gates:

- **Frequency gate.** Seen 100+ times a day (shortcuts, command palette, core navigation) → **never animate**. Dozens of times → dial it down to nearly imperceptible. Overlay layer / drawer / toast → standard. Rare & first-run only → the "delight budget" is allowed.
- **Purpose gate.** If you cannot name one of **feedback / spatial continuity / state legibility / jump prevention / explanation** → do not animate. **Deleting an animation is often the strongest optimization.**

Both gates pass → **read `MOTION.md`** (curves · durations · physicality · paired enter/exit · interruptibility · gestures · timeline choreography · performance · review · motion personality). Writing without reading it reliably produces `ease-in`, `scale(0)`, and `Math.random()` as a delay.

After adding motion, **render again**: slow it 3–5× and step through frames; the mid-frames (driver held at `.25/.5/.75`) must hold up too.

---

## Iron checklist (walk it before shipping — fix on sight)

- [ ] **Output is a page/app, not a floating card**; one of the four skeletons chosen, fills the viewport
- [ ] **Product-wide decisions made once and identical everywhere**: surface ramp · radius ladder · icon tier · motion personality — and each one derived from the content, not from a named style
- [ ] Color/radius/spacing/motion **all reference tokens, zero raw values**; look for reuse before adding
- [ ] Neutral surfaces + restrained 90/10 (monochrome allowed); **no bare colored text**; **never color as the only channel**
- [ ] Exactly two font weights; body 16 / heading 18 / hero 30; figures `tabular-nums`; one alignment axis per block
- [ ] Generous whitespace (~1.5×); radius 10–16 (full round only on chips); **nested radius derived, outer = inner + padding** — never both picked off the ladder; shadow none or diffuse; **whitespace > hairline > border**
- [ ] **Centered = optically centered**: text centered on its ink (`text-box` trim), asymmetric glyphs corrected inside the glyph, lone blocks lifted by an uneven free-space split — judged in the render, not the inspector
- [ ] Closed cards broken up; **delete every container you can**
- [ ] **No emoji**; icons small, desaturated, undecorated; `fill="currentColor"` on the outer shell; call `morii-icon` for anything new
- [ ] Buttons: pure-graphic first · **one primary per screen** · hit area ≥44px
- [ ] **≥1 graphic per block** + echo; charts one-SVG + fixed height + full row width; stack instead of shrinking on narrow screens; **wrapped in try/catch with a visible failure notice**
- [ ] Async runs three states: **light loading** (nothing under 300ms · neutral thin arc · skeleton when the shape is known) · **empty state explains only, no button**, truly centered then optically lifted
- [ ] **Failure notices speak the user's language, not the machine's**: surface = one human sentence + at most one line of what to do; **raw diagnostics** (exception text, host/port/config names, enum codes, HTTP status) live **behind hover/ⓘ**, never on the surface; problem and fix are **two lines**, never glued with `——`/`·`; one notice per cause
- [ ] **The shell paints before the fetch** — never `if (loading)` around a whole view; headings / column headers / labels / containers render on the first frame, only the data slots load, slots reserve their height so filling in shifts nothing, and one ring covers one filling range
- [ ] **One container type per category dimension**: all chips or all tags; **no bare dots** (status lamp excepted, and it must carry text)
- [ ] **A record's fields are ranked, never aligned into a `Label Value` list** (`LAYOUT.md` §3 record face): status chip → identity heading → icon + caption label over bold value → prose out of the grid. Labels get **demoted a tier, not deleted** — and never smuggled back into the value (`电话 138…`)
- [ ] **Side-by-side parameters each get their own chip**; no `·`/`|`/`/` chaining them into a sentence; drop unit words and connectives where possible
- [ ] Important content visible above the fold; content floor not stripped to bare headings; note-like tiles on an **equal-width grid**, never ragged; **explanatory gray text moves into a ⓘ tooltip** (destructive consequences / input format / current status stay resident)
- [ ] Tabs instead of routing; overlays are **popover / inside-window / drawer only**, each **declaring its scope** (scrim · inert · scroll-lock apply to that scope only, and the scrim covers exactly what is inert); exits = outside + Esc, plus × whenever it blocks; one layer per scope, z from one shared counter, keyboard to the top layer only; class toggling; **tab state has a single source**
- [ ] **Baseline feedback present** (never gated): `:active` press · hover geometry frozen + `:focus-visible` ring · three-state fade · overlays paired and unmounted after exit
- [ ] Anything that moves: one of four curves, **never `ease-in`**; <300ms with exit ≈ enter ×0.7; never `scale(0)`; only `transform`/`opacity`, **never `transition: all`**; **every animation interruptible** (reverse mid-flight from the presented value · no input lock · `@keyframes` only for endless loops · pending unmounts cancellable); `prefers-reduced-motion` degrades (gentler ≠ stripped)
- [ ] **Polish motion only after pre-authorization or an explicit yes**, each spot through both gates; gesture physics always asked separately — stopping at the static build is a finished state
- [ ] Contrast: body 4.5 / hero 3 / UI 3, **verified in both light and dark**
- [ ] **No dead buttons** (every handler really works); **silent failure is banned**
- [ ] **Rendered and looked at** — static frames + mid-frames + both themes. A percentage in `d`, a missing `fill` turning an SVG pure black, a morph degenerating mid-frame: all three pass syntax checks and **only eyes catch them**
- [ ] **Minimal ≠ bare**: you delete noise, not information — density and completeness are not what gets cut

---

## File map

| File | Loaded when | Owns it (**single source — never restated elsewhere**) |
|---|---|---|
| **`SKILL.md`** (this file) | always | output form · supreme law · workflow · iron checklist · routing |
| `Token.css` | stage ① | the **values** of the tokens |
| `FOUNDATION.md` | once after stage ① | color · type · spacing & separation · nested radius · visual centering · category marking (chip/tag, no bare dots, no `·` chaining) · icon usage · buttons · component states · text selection & cursor |
| `LAYOUT.md` | stage ② | page skeletons · block segmentation · container atoms (**static structure**) |
| `SHELL.md` | stage ② (frame / views / overlays) | app shell behavior · tabs · overlay contract + popover / inside-window / drawer · confirmation · toast · stepper · collections · density valve (**behavior**) |
| `CHARTS.md` | stage ② (drawing graphics) | chart rules and hygiene |
| `STATES.md` | stage ② (async / empty / failure / explanation) | three states · content density · ⓘ tooltip layer · failure notice wording |
| `MOTION.md` | stage ④ (**once authorized**) | all polish-layer motion detail · motion personality. Baseline feedback is not here — it is in `FOUNDATION.md` §7 |
| → `morii-icon` skill | stage ③ | **how an icon is drawn**, and icon motion |

**Sanctioned local variables.** Every `var(--x)` in these docs resolves against `Token.css`, with exactly three deliberate exceptions that are written per-element or per-product rather than registered globally: `--i` (stagger index, stamped on each element at render time), and `--bar` / `--rail` (top-bar height and sidebar width, chosen once per product). Anything else that does not resolve is a bug.

**Language policy for these docs:** rules and criteria are written in English (tighter, fewer tokens, steadier compliance). Chinese is kept deliberately in three places — **core vocabulary** (克制 · 层次 · 呼吸感), **Chinese UI examples** (`[Bug] [生产 38]`, 「暂无数据」, `● 运行中`), and **character-count thresholds** (≤12 字, ≤7 字 chip, ≤18 字 insight line), because those thresholds are calibrated in Chinese characters and stop being valid once translated. Keep it that way when editing.
