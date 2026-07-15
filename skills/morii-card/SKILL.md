---
name: morii-card
description: >
  Use this skill when the user wants data made VISUAL rather than described in
  words — a dashboard (看板), card (卡片/好看的卡片), comparison (对比), breakdown
  (占比), trend, ranking, schedule, or "something I can grasp at a glance"
  (一眼看懂). It fires the moment someone hands over numbers — spending, prices,
  crypto/stocks, sales, headcount, scores, weather, stats — and asks to 可视化 /
  visualize / 对比 / present / 做成 / 做个 / 弄成 them, OR says the data is on its
  way (数据我发你, 可视化对比一下). Build the card once the numbers arrive or you
  look them up. Also fire when YOU just gathered 3+ related numbers/facts and
  would otherwise reply with a wall of text — render a card instead. For "it
  depends on the parameters/scenario" questions (缓动曲线参数怎么调, 防抖还是节流,
  A* vs Dijkstra 哪个快), offer a hands-on experiment card. THREE triggers fire
  even MID-CODING, defined by principle (named tools are instances, not the
  definition): (1) SERVE — a task whose state evolves observably over time
  (progress %, units passing, metrics moving) is about to run longer than a few
  seconds while someone watches — test/eval suites, benchmark sweeps, batch
  scrapes, long builds/deploys, every /loop iteration → load this skill BEFORE
  kicking the run, build the live progress card first; (2) LAB — the honest
  answer is a FUNCTION OF PARAMETERS the user could manipulate (you catch
  yourself writing 取决于/看情况/trade-off) → offer a hands-on experiment card;
  (3) LIVE selection — your NEXT STEP depends on the user's choice or judgment
  over many items (multi-select, filter, approve/reject, rank) → render an
  interactive selection card instead of a numbered prose list. Keywords: 卡片
  card 看板 dashboard widget 可视化 visualize 进度 progress 实时 live eval 筛选
  多选. Skip it ONLY for writing/editing code itself, git operations,
  translation, formatting, and one-to-two sentence factual answers — the three
  mid-coding triggers above OVERRIDE this skip.
allowed-tools:
  - Read(~/.claude/skills/morii-card/**)
  - Read(~/.claude/plugins/cache/*/morii-card/**)
---

# MoriiCard

One self-contained `.html`, zero dependencies. Model it on professional dashboard widgets: **graphics carry the meaning, text exists as atoms.**

## Scenario → route (run this table BEFORE anything else; first match wins)

**The principle behind every route — a card makes STATE visible; the state's shape picks the card:**
- **Static state** (facts as they stand now) → data card: FAST / RICH / DASH / collection / editorial.
- **Evolving state** (a process emits observable progress over time, someone is watching) → **SERVE**: shell first, data streams in, settles static.
- **Parameter-dependent state** (the answer is a function of knobs the user could turn) → **LAB**: give them the knobs.
- **State that must flow back** (your next step depends on the user's choice/judgment/exploration) → **LIVE** channel: selection · verdict · drill.

Match by principle first; the rows below are canonical instances (anchors, not an exhaustive enumeration). Rows ①②③ fire even mid-coding; the skill-description skip clause never cancels them.

| # | You're facing | Route |
|---|---------------|-------|
| ① | a process with observable evolving state about to run >几秒 while a viewer is present — test/**eval** suite, benchmark sweep, batch scrape, long build/deploy, or any **`/loop`** tick | **SERVE** — auto, NO question; card FIRST, then kick the run (`SERVE.md`); /loop reuses one card across ticks |
| ② | the answer is a function of user-turnable parameters (you catch yourself writing 「取决于 / 看情况 / trade-off」) | **LAB** — offer ONE plain line, build on yes (`LAB.md`) |
| ③ | your next step depends on the user's choice/judgment over MANY items — multi-select, filter, approve/reject, rank (筛选 / 评判 / 挑几个深入) | **LIVE selection card** (`LIVE.md` §Selection) — option rows + one submit, selection beacons back; ≤3 options or yes/no → plain text question, never a card |
| ④ | user asks 实时进度 / 边跑边看 / 做个进度卡 | **SERVE** — build directly, no question |
| ⑤ | other long task starting (build / deploy / scrape / batch), interactive session | **SERVE** — offer ONE line 「要开张实时进度卡边跑边看吗?」 |
| ⑥ | user says 做个 demo 让我试 / 让我玩玩 | **LAB** — build directly, skip the offer |
| ⑦ | user hands numbers or asks 可视化 / 对比 / 占比 / 排行 / 看板 / 一眼看懂 | **FAST** data card (the default) |
| ⑧ | YOU just gathered 3+ related numbers/facts and were about to answer in prose | **FAST** data card, unprompted — a text wall is the failure |
| ⑨ | 3+ content items to digest (今日新闻 / 论文 / 帖子 / 调研 / 整理资料) | **FAST/RICH collection** — `COLLECTIONS.md` router; consecutive 整理资料 accumulate in the ViewCard index |
| ⑩ | user says 精致 / 完整 / 详细 / 报告, or accepts the upgrade offer | **RICH** |
| ⑪ | background / scheduled / subagent run, nobody watching (and NOT ①) | **RICH** — don't open, report the path |
| ⑫ | several genuinely independent KPI domains | **DASH** bento (`charts/dash.md`), FAST or RICH budget |
| ⑬ | single long-form article | **editorial** card |
| ⑭ | interactive session AND the card holds more data than its face shows | add **LIVE** drill channel on top (`LIVE.md`) — an affordance, not a mode |
| ⑮ | 1–2 sentence answer · confirmation · the coding/git/translation work itself | **NO card** — plain text |

| Mode | When | Shell budget | Build |
|------|------|------|------|
| **FAST** | default — interactive chat, user watching | ≤12KB, ≤2 chart types | one pass; animate main chart + hero count-up only |
| **RICH** | background / scheduled / subagent run (nobody watching, **but not `/loop` or a test run → those go SERVE**) **or** user said 精致 / 完整 / 详细 / 报告 | ≤25KB | full anatomy, multi-chart, full motion |
| **LAB** | scenario rows ②⑥ — propose-first (`LAB.md`) | free, stay lean anyway | experiment stage |
| **SERVE** | scenario rows ①④⑤ — shell renders before data, fills via SSE, settles static (`SERVE.md`) | free, stay lean anyway | skeleton-first; relay server + live stream |

Shell budget counts **structure only** (CSS/SVG/JS) — gathered data never counts and is never cut to fit. Plain text, no card: confirmations, 1–2 sentence answers, coding/debug/git. Never append a post-render text summary — the card IS the answer.

**Mixed signals** (interactive + sounds report-grade/全面/整理 + user named no mode) → ask ONE plain-text line *before* searching — 「快速版（秒出核心）还是 精致版（完整层级，多等一会）?」 — never as a card (nothing rendered yet, attention is still in the terminal). Signals clear → never ask.

## Workflow

The tables here are **lookups** — scan to the first row that fits and move; they're written so you don't weigh alternatives. SNIPPETS/CHARTS/COLLECTIONS patterns are **pre-verified**: copying them IS the correctness guarantee, nothing to re-check. Compose the card as you write it — a long planning pass after reading the snippets is the known time-sink and buys zero quality.

1. **Data first.** Run every search / fetch / computation and finalize all numbers before you touch any HTML — the card embeds data, so until it's complete there's nothing to write. **Count the data steps BEFORE firing the first one**: hits the parallel-build threshold below → the skeleton subagent goes in the SAME message as the first search, not after. For content digests (news/posts/papers), per-item substance is *part of* "data complete": full headline + 2–4句 summary + key quote/figure + source/time. LAB: this step instead defines the experiment variables + their controls.
2. **Map shape → layout + chart** via the tables below (first match wins).
3. **Announce + read.** One line on what's coming + a soft ETA range, rounded up (FAST 1–2分钟 · DASH 2组件 2–4分钟 · RICH/完整DASH 4–6分钟); finishing early beats overrunning. Then **Read `SNIPPETS.md`** — and in the same message ONLY the pattern files this card uses: the `charts/<type>.md` of each chart it draws (pointers in the chart table below; no pointer → compose under the table's rules), any `snippets/*.md` the layout table names, `COLLECTIONS.md` for a content collection (all parallel, one round-trip). Never read a pattern file the card doesn't use — that's the token/latency sink the split exists to kill.
4. **Write.** The next tool call after the Read is the Write. Dense CSS (one rule per line, shorthands, only rules you use); FAST shell lands ~8–10KB. Every data card embeds a `<script id="card-meta" type="application/json">{"t":…,"g":…,"v":…,"s":…,"d":…}</script>` block in `<head>` after `<title>` (schema in MULTI-CARD.md) — the index step below hard-fails without it.
5. **Index + open — never `open` the bare card file.** Run `node "<this skill dir>/assets/morii-index.mjs" add ViewCard/<card>.html --open` (interactive) / without `--open` (background: report the printed URL). One idempotent command = shell copy if absent + CARDS upsert + validated write + cache-busted deep-link. This runs for EVERY data card, including card 1 (a one-card index is correct, not premature) — skipping it is the known failure mode that scatters cards. SERVE cards exempt.

**Parallel build — fires by COUNT, not judgment.** Mechanical rule, decided at step 1 before the first search: **≥3 web searches OR ≥2 fetches OR any multi-source research (整理资料 / 今日新闻 / 调研) → parallel build is MANDATORY**, not optional — spawn ONE subagent to build the **data-independent skeleton** in the SAME message as the first search (measured: ~22% faster, ~+9% tokens; the subagent also absorbs the SNIPPETS/CHARTS/COLLECTIONS reading, so the main thread skips those reads entirely). Below the threshold — data in hand, single lookup — serial ONLY (parallelizing there is pure token loss, up to +46% for zero speedup). Count, decide, move — never re-weigh it mid-task.
- **Subagent task**: read SNIPPETS.md + the routed `charts/*.md` / `snippets/*.md` / COLLECTIONS.md itself (keeps main context lean — the main thread then skips those reads entirely) + build the full morii structure/CSS/layout/chart *shells* with **placeholder tokens** (`{{H1}}`,`{{S1}}`,`{{DATE}}`…) for every text/value. **Chart geometry must compute at RUNTIME in JS from `data-*` attributes** (e.g. donut arcs/counts/% derived from each item's `data-topic`) — never hard-code geometry, so the merge needs zero geometry rework. Add a self-prune: any slot still holding `{{` is removed on load (guards against count mismatch).
- **Merge** (main, after both done): substitute the tokens with a tiny script (`.replace` per key; HTML-escape values; handle item-count ≠ slot-count). Result is one self-contained card, identical quality to a serial build. The subagent NEVER runs `morii-index.mjs` or touches `index.html` — after the merge, the MAIN thread runs the step-5 `add` (the script's lock survives races, but ownership stays with main).
- Diversity is unaffected — it comes from the methodology, NOT from a template; never freeze a rigid card template to "save" the skeleton.

**Language**: explicit request > conversation-dominant > 中文. **Theme**: `color-scheme:light dark` + `light-dark()` vars cover both modes in one declaration; `[data-theme]` override = two one-liners. Never duplicate variable blocks.

## Invariants — violation = broken card

1. No emoji anywhere — icons are inline SVG, flat filled, `currentColor`.
2. **Geometry is frozen on hover/pointer.** Allowed channels only: `box-shadow`, `opacity`, fill/brightness, `scale(.96–.985)` on a button/tappable card, `stroke-dashoffset`, SVG-internal text/tag swaps. Height may change *only* on an explicit click that swaps content (tabs, stepper, accordion, list↔detail) — never on hover.
3. Nothing fake-clickable; every handler works — wire interactions by copying SNIPPETS.
4. Overlay: max one; exits via backdrop + `Esc` + ×; toggled by a CSS class — never the `hidden` attribute on an element carrying author `display` (it locks the overlay open).
5. Data embedded inline. `fetch()` only when the user asked for live refresh (file:// + CORS kills most APIs) — snapshot the first paint, `--` fallback, refresh button.
6. Contrast ≥4.5:1 body, ≥3:1 hero — verified in both themes.
7. **Read `SNIPPETS.md` as the last step before every Write**, never before data is final (an early read derails into premature code). Start from its skeleton; copy its patterns, chart geometry from the chart's own `charts/<type>.md`, collection layouts from `COLLECTIONS.md` — never improvise them. Snippets lock geometry math, not composition: re-mapping data, combining patterns, styling on top is expected.

## Pick layout & chart

**Layout by data shape** (first match):

| Data shape | Layout | Read also |
|------------|--------|-----------|
| 1 KPI | anatomy formula (hero + one chart) | — |
| 2–4 metrics | stat row + one shared chart | — |
| 5+ measures of ONE entity (a dashboard) | **STAGE + graphic-selector** — one big interactive graphic + a strip of mini-graphic tabs to switch metric. Dense yet uncluttered; a number-grid here is the banned failure mode. ONE accent for the whole card. | `snippets/stage.md` |
| several genuinely independent KPI groups | **DASH** widget bento — ONE accent across ALL widgets (one-hue-per-widget reads as a rainbow), each widget graphic-first + interactive. FAST → 2 richest widgets (~10KB) + upgrade offer; RICH → full 2×2 | `charts/dash.md` |
| A vs B | split / paired columns, versus hues | — |
| version/spec compare | rows of label + 旧/新 chips, hairlines between — never run-on "old→new" prose | — |
| findings / sentiment | ratio bar + point rows + one quote inset | — |
| ranked / leaderboard | **featured spotlight + ranked bars** — a selected-entity spotlight (its trend spark + share + delta) over leader-relative bars; tap any row to feature it. Champion = the one loud accent bar, runners muted. | `charts/leaderboard.md` |
| content collection (3+ news/posts/papers) | **COLLECTIONS router** (deck / accordion / list↔detail / tabs by count+theme) — never bare title rows | COLLECTIONS |
| sequence / time | single-SVG timeline (SNIPPETS) | — |
| ordered procedure (≥3 dependent steps, each carrying rich content) | **STEPPER**; <3 steps or label-only → plain timeline, don't upgrade | `snippets/stepper.md` |
| entities | icon tile rows | — |
| single long article | editorial exemption | — |

**Chart by relationship** (inline SVG, accent pair, fixed pixel height). **Pattern file column = what to Read at write time — only the rows this card uses; `—` = no locked pattern, compose under these rules + SNIPPETS one-SVG:**

| Relationship | Chart | Pattern file |
|--------------|-------|--------------|
| trend over time | line + same-hue area fade + end dot + value tag pill | `charts/trend.md` |
| value vs target | bullet / ring + dashed target line + label pill | — |
| categories ≤8 | rounded bars, values on bars; gray all + highlight ONE in accent + tag | `charts/bars.md` |
| avg / benchmark | dashed line + ink label pill | `charts/bars.md` |
| share (≤5 slices) | donut / concentric 2-ring | `charts/donut.md` |
| two-period (per item old→new) | shared-scale **overlap bars** (ghost=old behind, accent=new in front) or **per-item cards** — NEVER isolated slope/dumbbell segments per category (they float at unrelated heights and read broken) | — |
| time × category | heatmap tint cells | — |
| distribution | dot strip / waffle | — |
| magnitude | proportional circles | — |
| range + position | track + colored zone + position dot | — |
| sequence / events | single-SVG spine + dots + fractional label grid (never a CSS-absolute line behind flex dots) | SNIPPETS §Timeline |
| change | delta chip (SVG triangle + %) | — |
| dense vital / stream | spike micro-bars + peak anchor annotation | `charts/spike.md` |
| phase / segment | strip chart | `charts/strip.md` |
| multi-dim profile (5–8 axes, ≤2 series) | radar (fixed-px only) | `charts/radar.md` |

**Density valve — fold early, fold often.** Content-heavy cards reach for tabs + folding *first*, not as a last resort. >2 themes → 2–3 segmented-pill tabs (one theme per tab, max 3). >8 data rows, or any face item running >4 lines → accordion / broadcast deck / list↔detail (COLLECTIONS). Cramming and endless vertical scroll are violations; horizontal scroll is allowed only as the deck's scroll-snap strip.

**Responsive, one file**: viewport meta; body centers the card, padding 16px; card `width:min(430px,100%)`; touch ≥44px controls / ≥32px link chips; <380px single column. `@media (min-width:720px)`: bento/dashboard → `width:min(880px,92vw)` 2–3 columns; single-KPI and article stay ≤480px centered.

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

Interaction-state and texture specs live in `SNIPPETS.md` (loaded at write time per invariant 7).

## LAB, LIVE & SERVE — load on demand

Triggers live in the scenario table (rows ①–⑥, ③⑭ for LIVE) — don't re-derive them here. Build specs, loaded only when building: LAB anatomy + rule deltas → **`LAB.md`** · LIVE preflight / listener / drill / §Selection code → **`LIVE.md`** · SERVE lifecycle / snapshot schema / relay / card boot → **`SERVE.md`**.

## Output

Write to a `ViewCard/` folder in cwd — path `ViewCard/<topic>-card.html` (create the folder if absent: `mkdir -p ViewCard`); keeps generated cards collected, not scattered in cwd. **Recurring topics get a date suffix** (`sleep-0715-card.html`) — reusing a filename silently overwrites the old card forever; check `ls ViewCard/` when the topic sounds familiar. Interactive: open via the index command below (never `open` the bare card file — it bypasses the collection). Background/subagent/scheduled: do NOT open, report the path. Follow-ups about a rendered card → answer in HTML (shell 2–10KB, detail in overlay); plain text only for 1–2 sentence answers. Tweaks to an existing card (swap a chart, recolor, add/remove rows, reword) → surgical Edit calls — seconds, not a regenerate; full rewrite only for layout-level restructuring.
**Multi-card index** — so consecutive 整理资料 don't scatter into N HTMLs: every data card joins a file-authoritative iframe navigator `ViewCard/index.html` (search + tag + time-group + overview grid, `file://`-offline, no server). Each card embeds a `<script id="card-meta">` block in `<head>`; then ONE command indexes AND opens it — `node "<this skill dir>/assets/morii-index.mjs" add ViewCard/<card>.html --open` (interactive; background: drop `--open`, report the printed URL). The script copies the frozen shell if absent (never overwrites), upserts the card's `CARDS` row (idempotent, quote-safe, parse-validated — a bad row can't white-screen the index), and opens a cache-busted `file://…?r=<ts>#<card>` deep-link so an already-open index tab never shows a stale card list. Never hand-edit `index.html` when node is available. Field schema + rebuild + no-node fallback → read **`MULTI-CARD.md`** (load before building a collection). SERVE live-task cards stay single-file.
**Upgrade offer** (the only allowed post-render line): if a FAST card held content back (cut metrics/charts, density-valve overflow), end with ONE quantified line — 「另有 N 项指标、M 张图未展开，回『精致』出完整版」. Nothing held back → say nothing.

## Write-time floor

You hold these *as you compose* — invariants + design floor, listed once so nothing slips. Fix on sight; don't re-open the finished card to re-grade it.

Untinted surfaces · single vivid accent, ≤2 hues, zero bare colored text (weight emphasizes) · **no color gradients / glow** (only same-hue chart fade) · **graphics carry the data — no number-walls** · one focal point, rest recedes · **every card ships ≥1 real interaction** + desktop `user-select:none` · no paragraphs on metric cards (digest/editorial exempt) · collections routed, full summaries · overlay = class toggle · hero ink + unboxed · charts full-row + fixed height, stack at narrow · snippets copied not improvised · entrance motion one-shot on `--ez` · valid HTML both themes · card-meta in `<head>` + indexed via `morii-index.mjs add` (every data card, card 1 included — never `open` the bare file).
