# DESIGN — craft rules · MANDATORY read at write time

Read WITH `SNIPPETS.md` in the same message, as the last step before every Write (Workflow step 3) — never earlier, never skipped. SNIPPETS holds the copyable patterns; this file holds the rules those patterns implement. Tweak sessions touching color / type / motion / layout re-read this file first.

## Invariants — violation = broken card

1. No emoji anywhere — icons are inline SVG, flat filled, `currentColor`.
2. **Geometry is frozen on hover/pointer.** Allowed channels only: `box-shadow`, `opacity`, fill/brightness, `scale(.96–.985)` on a button/tappable card, `stroke-dashoffset`, SVG-internal text/tag swaps. Height may change *only* on an explicit click that swaps content (tabs, stepper, accordion, list↔detail) — never on hover.
3. Nothing fake-clickable; every handler works — wire interactions by copying SNIPPETS.
4. Overlay: max one; exits via backdrop + `Esc` + ×; toggled by a CSS class — never the `hidden` attribute on an element carrying author `display` (it locks the overlay open).
5. Data embedded inline. `fetch()` only when the user asked for live refresh (file:// + CORS kills most APIs) — snapshot the first paint, `--` fallback, refresh button.
6. Contrast ≥4.5:1 body, ≥3:1 hero — verified in both themes.

**Theme**: `color-scheme:light dark` + `light-dark()` vars cover both modes in one declaration; `[data-theme]` override = two one-liners. Never duplicate variable blocks.

## Color

**Surfaces stay neutral, never tinted** — mood lives only in chart colors and chips. Light: card `#fff`, page bg `#e9ebee` cool / `#edebe7` warm / `#0a0a0a` black (pick one). Dark: card `#1c1c1e`, bg `#0d0d0f`. Ink light `#16181c` / label `#6e7480` / faint `#a8adb8`; dark `#f2f3f5` / `#9ba1ac` / `#5d646f`. Inset bg `#f4f5f7` / `#26262a`. Hairlines = faint at 12%, inside lists/tables only — no other dividers, no border-left callouts.

**One accent per card** (≤2 hues + their tints; a dashboard keeps the SAME accent across all its widgets — one-hue-per-widget reads as a rainbow), **vivid-small**: **the accent is yours to choose freely — there is no fixed per-domain palette.** Pick whatever saturated, lively hue fits THIS card's content and mood (S 60–80; a flat low-sat hue reads dead). Lean semantic when it's obvious (心率→红, 钱→绿, 睡眠→靛) but never feel locked — taste and a fresh choice are welcome. Vividness comes from saturation against neutral, never from spread or gradients; keep colored area ≤10%. Color touches text only inside chips (12% tint bg + text-grade hue, L≈32 light / L≈72 dark). Bare colored sentences, values, or labels are banned — emphasize with **weight**. Sole exception: a DASH widget stat row may color ONE delta value text-grade.

Want a starting point? These are *examples to riff on, never a mandate* — pick one, shift its hue, or invent your own: 财务 green/indigo · 科技 indigo/sky · 健康 rose/teal · 体育 orange/sky · 新闻 amber/slate · 天气 sky/yellow · 睡眠 indigo/violet. The same data can wear a different accent each time — variety is fine as long as it stays vivid-on-neutral and one accent per card.
Delta chips: up `#16a34a` / down `#dc2626`. Alert state — ONLY when a value crosses a real threshold (超支 / 心率异常 / 库存告急): warn `#d97706` / crit `#dc2626` text-grade chip + in-chart anchor; no threshold → no alert, never decorative. Versus data: `#22c55e` vs `#f59e0b`, or `#f97316` vs `#38bdf8`. >2 series: tints of A, or gray all + highlight one. **No color-shifting gradients anywhere** — the ONLY allowed gradient is a single-hue opacity fade (e.g. accent `.24→0`) inside a chart graphic (area fill under a line). Two-hue/rainbow gradients, gradient buttons/panels/bars/text, and decorative glows are banned; surfaces / buttons / text / bars stay solid. Life comes from a vivid accent on neutral, not from blends.

## Graphics carry the data — numbers are revealed, not stacked

This is the card's soul and the most-violated rule: **the data lives in the graphic; numbers are minimal and mostly surface on interaction.** A wall of bare numbers — a stat grid, a metric strip, a "label: value" list — is a failed card even when tidy: if the answer is *read* instead of *seen*, redesign it as a graphic. Per face, show ONE headline number + the insight line; every other value hides inside its graphic and appears when the user scrubs/taps it. Encode each metric as a shape first (curve, ring, bar, hypnogram, spark, arc), label second. When you catch yourself laying out rows of numbers, stop — that's the failure mode.

Data cards carry static text only as: title ≤3 words · value · label ≤6 chars · chip ≤7 chars · ≤1 muted caption per section. No paragraphs on metric cards — findings become point rows, quotes become inset blocks, anything longer goes to the overlay. (Collected content text follows the content floor + exemptions below, not these atom limits.)

**Proactive graphics**: from any collected data, derive the 2–3 most obvious chartable metrics (count / top-N / delta / time bucket) — grab what's already there, no exhaustive brainstorm. Every section gets ≥1 graphic; comparable evidence values get a **graphic echo** (micro-bar/dots/ring beside the number, SNIPPETS).

**Content floor — never thinner than the data**: gathered substance (per-item summaries, quotes, key facts, numbers) is DATA — budget-exempt, never reduced to bare title + one-liner. The face carries the essentials; the rest lands in per-item expands / tabs / overlay — somewhere, never dropped. A face that informs *less* than the plain-text answer would is a failed card. 详细 / 完整 / 全文 asks → substance ships expanded on the face.

**Digest exemption** (collections of content items): each item = full prominent headline + 2–4句 summary (3–5句 allowed, fuller beats thinner) + meta; quotes / extra detail in the item's detail layer. Layout, type grades, tap rules live in the **`COLLECTIONS.md` router**. Collection cards still open with ≥1 graphic zone (counts / sources / topic ratio).
**Editorial exemption** (single long-form article): serif headline `Georgia,'Songti SC',serif` 1.6rem/700, body .88rem `line-height:1.75`, paragraphs allowed, pull-quote in inset; surfaces still neutral.

Type: system-ui stack; numbers always `tabular-nums`; zh cards show values ≥1万 as 万/亿 (1.2万, 3.4亿). Hero `clamp(2rem,7vw,2.6rem)`/700 `letter-spacing:-.02em`, pure ink, unit 0.55em muted — never boxed, never colored. Label .7rem/500 caps `.07em`. Caption .78rem muted.

## Anatomy atoms

Default data card, top to bottom:
`[22px accent-tint icon tile + muted title + ⓘ] … [ghost ···]` → **HERO + delta chip** → one muted context line → **chart zone 40–60%** → faint micro axis labels.

- **Insight line** — at most ONE: the verdict sentence (≤18字), under hero / above chart, accent leading dot. States a conclusion, never describes the chart (「环比降12%,餐饮贡献最大」). The card's loudest text atom (SNIPPETS).
- **Stat row** — 2–4 values side by side: ink value + muted label below, no boxes, shared baseline.
- **Number block** — muted label → ink value → context line (chip / "旧 X"); never fuse "0→742" into one token, never color the number.
- **Point row** — dot/icon + ≤7字 phrase (weight 600) + evidence value right-aligned + graphic echo.
- **Inset block** — recessed neutral bg, radius 12, no border; quotes / suggestions / the verdict when it's the focal point.
- **Icon tile row** — 36px tint tile + name + muted meta + chevron/value; entity lists.
- **Spotlight sub-card** — ONE emphasized item gets an accent-tinted sub-card (`color-mix(in srgb,var(--a) 9%,var(--card))` + faint accent ring), NOT a near-black block (near-black voids out on the dark card). Max 1; a strong focal tool (see the leaderboard spotlight).
- **Segmented pills** — tabs in an inset track, active = card-color pill + small shadow.
- **Citations** — sources never on the card face: one quiet affordance (evidence button / faint `来源 ×n`). Claims carry tiny accent-tinted `.ref` indices opening the overlay; inside, numbered entries + one compact SVG row of letter-circle source marks (`snippets/citations.md`).

## Emphasis — one loud thing per card

60-30-10 is an **attention** budget, not just color: that 10% is where the eye lands first. Every card has exactly ONE focal point — the answer the user came for (the verdict number, the winner, the peak, the one delta) — given a real budget (largest type, OR the lone accent graphic + insight line, OR the spotlight sub-card); everything else recedes to muted atoms and quiet graphics. Five things shouting = nothing important. Decide what the eye hits first, make it unmistakable, hush the rest — that hierarchy IS the design; restraint without a focal point just reads flat.

## Charts — build rules

- **Motion** (unified `--ez` curve, `prefers-reduced-motion` guard; channels opacity/transform/dashoffset): every card animates its main graphic in — line **draw-in** (stroke-dashoffset from `getTotalLength()`), bar grow (`.gy`), area fade — plus a hero **count-up**. Switching the stage metric is a click-driven swap: replay the draw-in + a short fade-up on the stage. RICH/DASH add row stagger (`.fu`, ≤.3s). Entrance-only, never looping; ship only the keyframes used.
- **Interaction is mandatory — every card ships ≥1 real interaction** (a static data card is unfinished, regardless of mode). The graphic IS the control: drag/scrub a line, spike or hypnogram to read any point (the headline value + label update live, a dot follows the finger); tap bars/slices/rows/segments to focus; tap a mini-graphic selector to switch which metric the shared stage shows. ≥4-value charts scrub by default; the live readout may BE the hero. Mobile is primary (`touch-action:pan-y`, hit zone = the whole row/column, never the thin glyph), hover is a desktop bonus. **Desktop drag must not select text**: `user-select:none` on `.card` + `e.preventDefault()` in pointerdown. A chart that ignores tap reads dead.
- **Chart integrity — never squeezed**: every chart owns its full row/column width (never shares a flex row with shrinkable text); `<svg>` gets a fixed pixel `height` + container `min-height`. When width drops below readable (chart <240px, bars <8px, labels colliding) STACK via media query or cut items — never shrink-to-fit, never horizontal scroll.
- **One-SVG rule**: any multi-part graphic (spine+dots, bars+axis, line+markers) is ONE `<svg>` — never CSS-absolute fragments over HTML flow. Full-width SVGs with circles/text use percentage coords, NO viewBox (a stretched viewBox deforms circles/glyphs); `viewBox + preserveAspectRatio="none"` only for pure path/line/rect. Wrapping labels stay HTML in a fractional grid matching the percentages. SVG colors via `style=`, never bare presentation attributes.
- **Hygiene**: ≤4 axis ticks, gridlines none or ≤8% opacity, bars start at 0, values labeled on-chart, charts use the card's accent pair. Every chart `<svg>` carries `role="img" aria-label="一句图意"`. ALL chart-builder JS sits in ONE try/catch whose catch swaps still-empty `.chart` svgs for a visible 「图表渲染失败」 caption — never ship a silent blank.

Interaction-state and texture specs live in `SNIPPETS.md` §States & texture.

## Responsive, one file

Viewport meta; body centers the card, padding 16px; card `width:min(430px,100%)`; touch ≥44px controls / ≥32px link chips; <380px single column. `@media (min-width:720px)`: bento/dashboard → `width:min(880px,92vw)` 2–3 columns; single-KPI and article stay ≤480px centered.

## Write-time floor

The distilled checklist lives in **`SKILL.md` §Write-time floor** — always loaded, so it holds even without this file. This file is its full expansion; when the two ever disagree, this file wins and the floor needs updating.
