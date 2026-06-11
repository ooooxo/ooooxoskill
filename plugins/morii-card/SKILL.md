---
name: morii-card
description: >
  Render data/information as one self-contained interactive HTML widget card.
  MUST USE whenever the reply presents collected or structured data — search
  results, stats, comparisons, rankings, dashboards, news/status digests,
  schedules, weather, prices, JSON/tables, any 3+ related numbers/facts — and
  after every data-gathering or web-search step (收集/整理/汇总 → derive
  chartable metrics and render; findings never ship as plain text). Triggers:
  card, widget, 卡片, dashboard, visualize, 可视化. ALSO:
  algorithm/effect/parameter questions whose honest answer is "depends on the
  scenario" → propose one-line LAB experiment card, build only on consent.
  EXCEPTION: stay plain text during coding/debugging/git work. Modes
  FAST/RICH/LAB + LIVE return channel, zero dependencies.
allowed-tools:
  - Read(~/.claude/skills/morii-card/**)
  - Read(~/.claude/plugins/cache/*/morii-card/**)
---

# MoriiCard

One self-contained `.html`, zero dependencies. Model: professional dashboard widgets — graphics carry meaning, text exists as atoms.

**Mode** — FAST (default, interactive chat): shell ≤12KB, ≤2 chart types, one pass. RICH (background/scheduled/subagent task, user asks polish or detail/完整, or clearly report-grade 8+ metric ask): ≤25KB, full anatomy, multi-chart. LAB (hands-on experiment): propose-first, see LAB section. Confirmations / 1–2 sentence answers: plain text, no card. **Ambiguous?** → probe first, workflow step 0. Shell budget counts structure only — never cut data to fit. Never write a post-render summary.
**Decide fast, don't deliberate**: the tables below are lookups — first reasonable match wins (domain pair, layout, chart). No weighing alternatives, no draft-revise loop, no mental re-verification of snippet code: SNIPPETS patterns are pre-verified, copying them IS the correctness guarantee.

## Workflow — strict order

0. Resolve mode (above). The ambiguity test is mechanical: interactive ask + (全面/整理/汇总-style phrasing OR 2+ themes OR likely 8+ metrics) + user named no mode → MUST probe 快速版（秒出核心）/ 精致版（完整层级，多等一会）BEFORE any search/fetch — ONE plain-text question, never a card (no value rendered yet, attention is still in the terminal). Signals clear → never ask; skipping a due probe is a workflow violation, not a judgment call.
1. **Data first.** Run every search/fetch/computation and finalize all numbers. Do NOT touch SNIPPETS.md or any HTML before data is complete — the card embeds data (invariant 5), so there is nothing to write yet. Content digests (news/article/post collections, 精选/汇总/播报 asks): per-item substance is part of "data complete" — full headline + 2–4 sentence summary + key quote/figure + source/time; title-only collection guarantees a thin card (content-floor violation). LAB cards: this step becomes defining the experiment variables + their controls; steps 2–5 apply unchanged — a lab IS a card.
2. Map data shapes → layout & charts via the tables below (lookup, first match).
3. Tell the user in ONE line what's coming + a SOFT ETA — always a range, rounded up, never a hard number (FAST 1–2分钟 · DASH 2组件 2–4分钟 · RICH/完整DASH 4–6分钟); finishing early beats overrunning. Then **Read `SNIPPETS.md`** (the LAST step before writing — invariant 7). Card draws charts from the CHARTS list or uses DASH → Read `CHARTS.md` in the SAME message; content-collection card → Read `COLLECTIONS.md` in the same message (parallel Read calls, one round-trip).
4. **The very next tool call after the Read result MUST be the Write.** No analysis pass, no plan, no re-reads, no text in between — compose the card AS you write it; minutes of post-Read thinking is the known failure mode (doubles latency and token burn, zero quality gain). Dense CSS (one line per rule, shorthands, no speculative rules); FAST shell typically 8–10KB.
5. Open it (interactive) or report the path (background).

**Language**: explicit request > conversation-dominant > 中文. **Theme**: `color-scheme:light dark` + `light-dark()` vars (one declaration covers both modes); `[data-theme]` override = two one-liners. Never duplicate variable blocks.

## Invariants — violation = broken card

1. No emoji anywhere — icons are inline SVG, flat filled, `currentColor`.
2. Card geometry never changes on hover/pointer. Allowed channels: `box-shadow`, `opacity`, fill/brightness, button/tappable-card `scale(.96–.985)`, `stroke-dashoffset`, SVG-internal text/tag updates. Height may change only on explicit click-driven content swaps (tabs, stepper, accordion, list↔detail) — never on hover.
3. Nothing fake-clickable; every handler works — wire interactions by copying SNIPPETS patterns.
4. Overlay: max one, exits via backdrop + `Esc` + ×, toggled by CSS class — never the `hidden` attribute on an element carrying any author `display` (it overrides `[hidden]` and locks the overlay open).
5. Data embedded inline. `fetch()` only when user asked for live refresh (file://+CORS kills most APIs); snapshot first paint, `--` fallback, refresh button.
6. Contrast ≥4.5:1 body, ≥3:1 hero — verified in both themes.
7. **Read `SNIPPETS.md` (this folder) as the last step before EVERY Write call — all modes, LAB included**, never before data collection (LAB: experiment-variable definition) is done — an early read derails into premature code-writing. Start from its skeleton; copy its canonical patterns (tabs, overlay, timeline, stepper, point row + echo, count-up, tag pill), chart geometry from `CHARTS.md` and collection layouts from `COLLECTIONS.md` the same way — never improvise any. **Snippets lock geometry math, not composition** — varying data mapping, combinations, and styling on top is expected.

## Color

**Surfaces fixed neutral, never tinted** — mood lives only in chart colors and chips. Light: card `#fff`, page bg `#e9ebee` cool / `#edebe7` warm / `#0a0a0a` black (pick one). Dark: card `#1c1c1e`, bg `#0d0d0f`. Ink light `#16181c` / label `#6e7480` / faint `#a8adb8`; dark `#f2f3f5` / `#9ba1ac` / `#5d646f`. Inset bg `#f4f5f7` / `#26262a`. Hairlines = faint at 12%, inside lists/tables only; no other dividers, no border-left callouts.

**One accent pair per card** (≤2 hues + their tints; DASH: one pair per WIDGET, surfaces still neutral), **vivid-small**: S 55–75, total colored area ≤10% of the card (60-30-10). Color touches text only inside chips — 12% tint bg + text-grade hue (L≈32 on light / L≈72 on dark). Bare colored sentences, values, labels: banned; emphasize with weight. Sole exception: a DASH widget stat row may color ONE delta value in text-grade accent.
Pairs by domain (rotate): 财务 `#22c55e/#6366f1` · 科技 `#6366f1/#38bdf8` · 健康 `#f43f5e/#2dd4bf` · 体育 `#f97316/#38bdf8` · 新闻 `#f59e0b/#64748b` · 天气 `#38bdf8/#facc15` · 睡眠 `#818cf8/#38bdf8` · 通用 `#6366f1`+gray.
Delta chips: up `#16a34a` / down `#dc2626`. Alert state — ONLY when a value crosses a real threshold (超支/心率异常/库存告急): warn `#d97706` / crit `#dc2626` text-grade chip + in-chart anchor; no threshold → no alert, never decorative. Versus data: `#22c55e` vs `#f59e0b`, or `#f97316` vs `#38bdf8`. >2 series: tints of A, or gray-out all + highlight one. Gradients only inside chart graphics (same-hue fade 18%→0); surfaces/buttons/text solid.

## Content = atoms, graphics first

Data cards carry text only as: title ≤3 words · value · label ≤6 chars · chip ≤7 chars · ≤1 muted caption sentence per section. No paragraphs on metric cards — findings become point rows, quotes become inset blocks, anything longer goes to the overlay. Collected content text (summaries, excerpts) is governed by the content floor + exemptions below, not by atoms.
**Proactive graphics**: from any collected data, derive the 2–3 most obvious chartable metrics (count / top-N / delta / time bucket) — grab what's already in the data, no exhaustive brainstorming. Every card section gets ≥1 graphic; comparable evidence values get a **graphic echo** (micro-bar/dots/ring beside the number — see SNIPPETS).
**Content floor — card never thinner than the data**: gathered substance (per-item summaries, quotes, key facts, numbers) is DATA — shell budget exempt, never reduced to bare title + one-liner. Face carries the essentials; the rest lands in per-item expands / tabs / overlay — somewhere, never dropped. A card face that informs less than the plain-text answer would is a failed card. 详细/完整/全文 asks → substance ships expanded on the face, not behind expands.
**Digest exemption** (collections of content items — news/posts/papers/releases): each item = full PROMINENT headline + 2–4句 summary (substance allows 3–5句, fuller beats thinner) + meta; quotes/extra detail in the item's detail layer. Layout, typography grades and tap rules live in the **`COLLECTIONS.md` router** (deck / accordion / list↔detail / tabs / flat by count+theme) — read it per workflow step 3. Collection cards still open with ≥1 graphic zone (counts/sources/topic ratio).
**Editorial exemption** (single long-form article): serif headline `Georgia,'Songti SC',serif` 1.6rem/700, body .88rem `line-height:1.75`, paragraphs allowed, pull-quote in inset; surfaces still neutral.

Type: system-ui stack; numbers always `tabular-nums`; zh cards show values ≥1万 as 万/亿 units (1.2万, 3.4亿). Hero `clamp(2rem,7vw,2.6rem)`/700 `letter-spacing:-.02em`, pure ink, unit 0.55em muted — never boxed, never colored (boxes only group ≥3 peers). Label .7rem/500 caps `.07em`. Caption .78rem muted.

## Anatomy & container atoms

Default data card, top to bottom:
`[22px accent-tint icon tile + muted title + ⓘ] … [ghost ···]` → **HERO + delta chip** → one muted context line → **chart zone 40–60%** → faint micro axis labels.

- **Insight line** — at most ONE per card: the takeaway sentence (≤18字), weight 650 ink + accent leading dot, under hero / above chart (SNIPPETS). Charts give evidence, the insight line gives the verdict (「环比降12%,餐饮贡献最大」) — it states a conclusion, never describes the chart.
- **Stat row** — 2–4 values side by side: ink value + muted label below, no boxes, shared baseline.
- **Number block** — muted label → ink value → context line (chip / "旧 X"); never fuse "0→742" into one token, never color the number.
- **Point row** — dot/icon + ≤7字 phrase (weight 600) + evidence value right-aligned + graphic echo.
- **Inset block** — recessed neutral bg, radius 12, no border; quotes/suggestions/secondary groups.
- **Icon tile row** — 36px tint tile + name + muted meta + chevron/value; for entity lists.
- **Inverted mini-card** — near-black sub-card for ONE emphasized item, max 1 per card.
- **Segmented pills** — tabs in an inset track, active = card-color pill + small shadow.
- **Citations** — sources never on the card face: one quiet affordance only (evidence button / faint `来源 ×n` micro-line). Claims carry tiny accent-tinted `.ref` indices with a "查看依据" hover tooltip that open the overlay; inside the overlay, numbered entries + ONE compact SVG row of letter-circle source marks (no tooltips there — hover fill is the affordance). See SNIPPETS.

## Layout by data shape

1 KPI → anatomy formula · 2–4 metrics → stat row + shared chart · 5+ → bento, desktop multi-col · multi-domain dashboard (several KPI groups, each owning charts — health, finance, status panels) → **DASH** (CHARTS.md): widget bento, every widget runs the full anatomy formula with its own domain accent pair; FAST → 2 widgets only (pick the two richest domains, ~10KB, fast to ship) with the upgrade offer quoting the held-back widgets, RICH → full 2×2 · A vs B → split/paired columns with versus hues · version/spec compare → rows of label + 旧/新 chips, hairlines between, never run-on "old→new" prose · findings/sentiment → ratio bar + point rows + one quote inset · content collection (3+ news/article/post items) → **COLLECTIONS.md router** (deck / accordion / list↔detail / tabs by count+theme), never bare title rows · ranked → leaderboard bars, leader highlighted · sequence/time → single-SVG timeline (SNIPPETS pattern) · ordered procedure (≥3 dependent steps, each carrying rich content — commands/code/checkpoints) → **STEPPER** (SNIPPETS pattern): timeline progress head (dots jump on click) + one panel per step + prev/next + counter; step body keeps text atoms (step title + ≤1 instruction sentence + insets/point rows), overflow splits the step, >8 steps merge sub-steps; <3 steps or label-only steps → plain timeline, don't upgrade · entities → icon tile rows · article → editorial.

**Density valve — fold early, fold often**: content-heavy cards reach for tabs + folding FIRST, not as a last resort. >2 themes → 2–3 segmented-pill tabs (one coherent theme per tab, max 3) · >8 data rows or any face item running >4 lines → accordion / broadcast deck / list↔detail (COLLECTIONS.md). Cramming and endless vertical scroll are violations; horizontal scroll allowed ONLY as the deck's scroll-snap strip.
Responsive, one file: viewport meta; body centers card, padding 16px; card `width:min(430px,100%)`; touch ≥44px controls / ≥32px link chips; <380px single column. `@media (min-width:720px)`: bento/dashboard expand to `width:min(880px,92vw)` 2–3 columns; single-KPI and article stay ≤480px centered.

## Charts (inline SVG, no libraries)

Trend → line + same-hue area fade + end dot + **value tag pill at the end** (CHARTS) · value vs target → bullet/ring + dashed target line + label pill · categories ≤8 → rounded bars, values on bars; **gray-out all + highlight ONE in accent + tag** when one matters · avg/benchmark → dashed line + ink label pill · share → donut ≤5 slices (CHARTS) / concentric 2-ring · two-period → slope or dumbbell · time×category → heatmap tint cells · distribution → dot strip / waffle · magnitude → proportional circles · range+position → track + colored zone + position dot · sequence/events → **single-SVG spine + dots + fractional label grid (SNIPPETS) — never a CSS absolute line behind flex dots** · change → delta chip (SVG triangle + %) · dense vital/stream → spike micro-bars + **peak anchor annotation** (CHARTS) · phase/segment band → strip chart (CHARTS) · multi-dim profile, 5–8 axes ≤2 series → radar (CHARTS, fixed-px only).
**Motion**: entrance-only on the unified `--ez` curve — fade-up / bar-grow / line-draw (SNIPPETS.md), `prefers-reduced-motion` guard; channels limited to opacity/transform/dashoffset. Tier by mode: FAST animates the main chart (`.gy`/`.dr`) + hero count-up, NO row stagger · RICH/DASH full choreography (`.fu` rows, sibling stagger ≤.3s). Ship only the keyframes used.
**Micro-interaction — tap-first, hover is desktop bonus**: bar charts with ≥4 bars ship **scrub-focus** in every mode (CHARTS §Micro) — persistent per-bar values, full-column hit zones, focused bar accent + axis chip, press/drag scrubs, linked readout row above the chart (it may BE the hero), default focus = the insight bar. RICH/DASH add trend crosshair scrub + donut tap swap. Channels opacity/fill/brightness + SVG-internal text, transitions ≤.18s `--ez`, geometry frozen, `touch-action:pan-y` — a chart that ignores tap reads dead.
Hygiene: ≤4 axis ticks, gridlines none or ≤8% opacity, bars start at 0, values labeled on-chart, charts use the card's accent pair. Every chart `<svg>` carries `role="img" aria-label="一句图意"`. ALL chart-builder JS sits in ONE try/catch whose catch swaps still-empty `.chart` svgs for a visible 「图表渲染失败」 caption (CHARTS) — never ship a silent blank.
**Chart integrity — never squeezed invisible**: every chart owns its full row/column width (never shares a flex row with shrinkable text); chart `<svg>` gets a fixed pixel `height` attribute and its container a matching `min-height`; when width would drop below readable (chart <240px, bars <8px, labels colliding) STACK via media query or cut items — never shrink-to-fit, never horizontal scroll.
**One-SVG rule**: any multi-part graphic (spine+dots, bars+axis, line+markers) is ONE `<svg>` — never CSS-absolute fragments over HTML flow. Full-width SVGs containing circles/text use percentage coords with NO viewBox (stretched viewBox deforms circles/glyphs); `viewBox+preserveAspectRatio="none"` only for pure path/line/rect. Wrapping labels stay HTML in a fractional grid matching the SVG percentages. SVG colors via `style=`, never bare presentation attributes.

Interaction-state and texture specs live in `SNIPPETS.md` (loaded at write time per invariant 7).

## LIVE channel (回传通道) — clicks reach the agent

Cross-mode affordance, NOT a mode. Open ONLY in interactive sessions (background/scheduled/subagent: never — nobody to wake) AND only when a rendered data card holds more than its face shows (drill) or a LAB runs multi-round. Questions and choices are NEVER cards — ask in plain text; LIVE rides cards that already carry content, it never justifies one. Never decorative: a card with nothing to ask ships without a channel.

**Preflight — gate, not optional**: ONE foreground Bash (SNIPPETS, copy exact) checks python3 exists AND the chosen port binds. `LIVE_NO` → ship NO live markup at all: drill affordances simply don't render. Never render a `live()` card whose channel was never verified. ONCE per session: reuse the verdict for later cards, fresh port each time — a rare bind clash surfaces as the listener's own early death, which the dead-listener rule below already covers.

**Mechanism**: after `LIVE_OK`, BEFORE the Write, start the one-shot listener (SNIPPETS, copy exact) via Bash run_in_background — pick a port 20000–40000, embed the same port in the card's `live()` helper; a click wakes the agent (one-shot/timeout semantics live with the SNIPPETS code). Listener dies early (traceback in its completion output) → channel dead, treat clicks as never coming; the card's own `.catch`→clipboard floor still works. Max ONE open listener at a time; a typed chat reply always wins over a stale card.

**Card side** (SNIPPETS pattern): `live(v)` = no-cors GET beacon; on reject → clipboard fallback + echo (the floor); the affordance disables after send.

**Sanctioned uses**: drill row 「深入」 sending `detail:<topic>` ONLY when the agent holds more data than the card face shows · LAB multi-round: Monitor variant (persistent listener loop, every click = one stdout event; TaskStop when done).

## LAB (interactive experiment card) — propose-first

For questions where the honest text answer is "看情况/取决于参数" — offer a hands-on lab instead of more prose.

**When to propose** — ALL three must hold:
1. The answer genuinely depends on scenario/parameters — you caught yourself writing 取决于/trade-off/一般来说 (寻路最优性 depends on map+heuristic, 防抖 vs 节流 depends on event rate).
2. The behavior reproduces faithfully in ONE offline file: algorithms, CSS/interaction effects, geometry/physics, parameter curves. No backend, no network, no real data needed.
3. ≥1 user-manipulable variable yields insight prose can't deliver — draw the obstacles, drag the slider, move the mouse; 30 seconds of hands-on beats three more paragraphs.

**Never propose** for fact lookups, single-right-answer questions, behavior needing real environment (network latency, GPU perf), or mid coding/debug flow. ONE proposal per topic per conversation; a no is final.
**How**: finish the normal answer, append ONE quantified line — "可出一张可操作实验卡:画障碍实测 A*/Dijkstra/Greedy 三种寻路,要吗?". Build only on yes. Explicit demo asks ("做个 demo 让我试") skip the question.
**LAB anatomy**: live readout stat row → full-width stage (`cursor:crosshair`, `touch-action:none`, hint line inside allowed) → comparison bar/readout → reset button + ONE caption of instructions. Controls = segmented pills / sliders adjacent to stage.
**Rule deltas from data cards**: no data-collection step — define experiment variables, map each to a control · runtime loops allowed (rAF is the simulation; entrance still `--ez`) · stage geometry may change (it IS the experiment) · compared algorithms/modes take versus hues. Everything else holds, **workflow steps 3–5 included: Read SNIPPETS.md before the Write and build on its skeleton** — card surface on neutral page bg, design-token vars, one accent pair, `--ez` motion. The generic AI-demo look (gradient page background, white rounded container, loose multiline CSS) is a violation, not a style choice. No emoji, real handlers, light-dark, readouts `tabular-nums`, single file. Budget free — stay lean anyway.

## Output

Write `<topic>-card.html` to cwd. Interactive: `open <file> 2>/dev/null || true`. Background/subagent/scheduled: do NOT open, report the path. Follow-ups about a rendered card: answer in HTML (shell 2–10KB, detail in overlay); plain text only for 1–2 sentence answers. Tweaks to an existing card (swap a chart type, recolor, add/remove rows, reword) → surgical Edit calls on the existing file — seconds, not a regenerate; full rewrite ONLY for layout-level restructuring.
**Upgrade offer** (the only allowed post-render line): if a FAST card held content back (cut metrics/charts, density-valve overflow), end with ONE quantified line — "另有 N 项指标、M 张图未展开，回「精致」出完整版". Nothing held back → say nothing.

## Final scan

Fix on sight while writing — do NOT re-review the finished card item by item: untinted surface · ≤2 hues per card/widget, no bare colored text · no paragraphs (metric cards — digest/editorial exempt) · collections routed (deck/accordion/list↔detail/tabs), items carry full summaries — never title-only · overlay = class toggle · hero ink/unboxed · charts full-row + fixed height, stack at narrow (never shrink) · bars ≥4 ship scrub-focus (persistent values + linked readout) · >2 themes → tabs · snippets copied not improvised · entrance motion one-shot on `--ez`, never looping · valid HTML in both themes.
