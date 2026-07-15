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

# MoriiCard — routing core

One self-contained `.html`, zero dependencies. Model it on professional dashboard widgets: **graphics carry the meaning, text exists as atoms.** This file routes; the craft rules live in **`DESIGN.md`**, loaded (with `SNIPPETS.md`) at write time — never compose color / type / motion / chart rules from memory.

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
| ⑬ | single long-form article | **editorial** card (`DESIGN.md` editorial exemption) |
| ⑭ | interactive session AND the card holds more data than its face shows | add **LIVE** drill channel on top (`LIVE.md`) — an affordance, not a mode |
| ⑮ | 1–2 sentence answer · confirmation · the coding/git/translation work itself | **NO card** — plain text |

| Mode | When | Shell budget | Build |
|------|------|------|------|
| **FAST** | default — interactive chat, user watching | ≤12KB, ≤2 chart types | one pass; animate main chart + hero count-up only |
| **RICH** | background / scheduled / subagent run (nobody watching, **but not `/loop` or a test run → those go SERVE**) **or** user said 精致 / 完整 / 详细 / 报告 | ≤25KB | full anatomy, multi-chart, full motion |
| **LAB** | scenario rows ②⑥ — propose-first (`LAB.md`) | free, stay lean anyway | experiment stage |
| **SERVE** | scenario rows ①④⑤ — shell renders before data, fills via SSE, settles static (`SERVE.md`) | free, stay lean anyway | skeleton-first; relay server + live stream |

Shell budget counts **structure only** (CSS/SVG/JS) — gathered data never counts and is never cut to fit. Never append a post-render text summary — the card IS the answer.

**Mixed signals** (interactive + sounds report-grade/全面/整理 + user named no mode) → ask ONE plain-text line *before* searching — 「快速版（秒出核心）还是 精致版（完整层级，多等一会）?」 — never as a card (nothing rendered yet, attention is still in the terminal). Signals clear → never ask.

## Workflow

The tables here are **lookups** — scan to the first row that fits and move. DESIGN/SNIPPETS/charts/collections patterns are **pre-verified**: copying them IS the correctness guarantee, nothing to re-check. Compose the card as you write it — a long planning pass after reading the pattern files is the known time-sink and buys zero quality.

1. **Data first.** Run every search / fetch / computation and finalize all numbers before you touch any HTML — the card embeds data, so until it's complete there's nothing to write. **Count the data steps BEFORE firing the first one**: hits the parallel-build threshold below → the skeleton subagent goes in the SAME message as the first search, not after. For content digests (news/posts/papers), per-item substance is *part of* "data complete": full headline + 2–4句 summary + key quote/figure + source/time. LAB: this step instead defines the experiment variables + their controls.
2. **Map shape → layout + chart** via the tables below (first match wins).
3. **Announce + read.** One line on what's coming + a soft ETA range, rounded up (FAST 1–2分钟 · DASH 2组件 2–4分钟 · RICH/完整DASH 4–6分钟); finishing early beats overrunning. Then **Read `DESIGN.md` + `SNIPPETS.md`** (both mandatory — rules + patterns) — and in the same message ONLY the pattern files this card uses: the `charts/<type>.md` of each chart it draws (pointers in the chart table below; no pointer → compose under the table's rules), any `snippets/*.md` the layout table names, `COLLECTIONS.md` for a content collection (all parallel, one round-trip). Never read a pattern file the card doesn't use. Never read them before data is final — an early read derails into premature code.
4. **Write.** The next tool call after the Read is the Write. Dense CSS (one rule per line, shorthands, only rules you use); FAST shell lands ~8–10KB. Every data card embeds a `<script id="card-meta" type="application/json">{"t":…,"g":…,"v":…,"s":…,"d":…}</script>` block in `<head>` after `<title>` (schema in MULTI-CARD.md) — the index step below hard-fails without it.
5. **Index + open — never `open` the bare card file.** Run `node "<this skill dir>/assets/morii-index.mjs" add ViewCard/<card>.html --open` (interactive) / without `--open` (background: report the printed URL). One idempotent command = shell copy if absent + CARDS upsert + validated write + cache-busted deep-link. This runs for EVERY data card, including card 1 (a one-card index is correct, not premature) — skipping it is the known failure mode that scatters cards. SERVE cards exempt.

**Parallel build — fires by COUNT, not judgment.** Mechanical rule, decided at step 1 before the first search: **≥3 web searches OR ≥2 fetches OR any multi-source research (整理资料 / 今日新闻 / 调研) → parallel build is MANDATORY**, not optional — spawn ONE subagent to build the **data-independent skeleton** in the SAME message as the first search (measured: ~22% faster, ~+9% tokens). Below the threshold — data in hand, single lookup — serial ONLY (parallelizing there is pure token loss, up to +46% for zero speedup). Count, decide, move — never re-weigh it mid-task.
- **Subagent task**: read DESIGN.md + SNIPPETS.md + the routed `charts/*.md` / `snippets/*.md` / COLLECTIONS.md itself (keeps main context lean — the main thread then skips those reads entirely) + build the full morii structure/CSS/layout/chart *shells* with **placeholder tokens** (`{{H1}}`,`{{S1}}`,`{{DATE}}`…) for every text/value. **Chart geometry must compute at RUNTIME in JS from `data-*` attributes** (e.g. donut arcs/counts/% derived from each item's `data-topic`) — never hard-code geometry, so the merge needs zero geometry rework. Add a self-prune: any slot still holding `{{` is removed on load (guards against count mismatch).
- **Merge** (main, after both done): substitute the tokens with a tiny script (`.replace` per key; HTML-escape values; handle item-count ≠ slot-count). Result is one self-contained card, identical quality to a serial build. The subagent NEVER runs `morii-index.mjs` or touches `index.html` — after the merge, the MAIN thread runs the step-5 `add` (the script's lock survives races, but ownership stays with main).
- Diversity is unaffected — it comes from the methodology, NOT from a template; never freeze a rigid card template to "save" the skeleton.

**Language**: explicit request > conversation-dominant > 中文.

## Pick layout & chart

**Layout by data shape** (first match):

| Data shape | Layout | Read also |
|------------|--------|-----------|
| 1 KPI | anatomy formula (hero + one chart, `DESIGN.md` §Anatomy) | — |
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
| single long article | editorial exemption (`DESIGN.md`) | — |

**Chart by relationship** (inline SVG, accent pair, fixed pixel height). **Pattern file column = what to Read at write time — only the rows this card uses; `—` = no locked pattern, compose under `DESIGN.md` §Charts build rules + SNIPPETS one-SVG:**

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

## LAB, LIVE & SERVE — load on demand

Triggers live in the scenario table (rows ①–⑥, ③⑭ for LIVE) — don't re-derive them here. Build specs, loaded only when building: LAB anatomy + rule deltas → **`LAB.md`** · LIVE preflight / listener / drill / §Selection code → **`LIVE.md`** · SERVE lifecycle / snapshot schema / relay / card boot → **`SERVE.md`**.

## Output

Write to a `ViewCard/` folder in cwd — path `ViewCard/<topic>-card.html`; keeps generated cards collected, not scattered in cwd. **Recurring topics get a date suffix** (`sleep-0715-card.html`) — reusing a filename silently overwrites the old card forever; check `ls ViewCard/` when the topic sounds familiar. Interactive: open via the step-5 index command (never `open` the bare card file — it bypasses the collection). Background/subagent/scheduled: do NOT open, report the path.

**Multi-card index**: step 5's `morii-index.mjs add` is the whole flow — every data card joins the `ViewCard/index.html` navigator (search + tag + time-group + overview grid, `file://`-offline). Field schema + rebuild + no-node fallback → **`MULTI-CARD.md`** (load before building a collection). SERVE live-task cards stay single-file.

Follow-ups about a rendered card → answer in HTML (shell 2–10KB, detail in overlay); plain text only for 1–2 sentence answers. Tweaks to an existing card (swap a chart, recolor, add/remove rows, reword) → surgical Edit calls — seconds, not a regenerate (color/type/motion tweaks: consult `DESIGN.md` first); full rewrite only for layout-level restructuring.
**Upgrade offer** (the only allowed post-render line): if a FAST card held content back (cut metrics/charts, density-valve overflow), end with ONE quantified line — 「另有 N 项指标、M 张图未展开，回『精致』出完整版」. Nothing held back → say nothing.
