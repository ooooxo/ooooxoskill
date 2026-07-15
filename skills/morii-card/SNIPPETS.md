# Canonical snippets & skeleton — the always-read core

**STOP — is your data collected and final?** If any search/fetch/computation remains, close this file and finish data work first (Workflow step 1); come back as the last step before writing. If data is ready: copy these patterns and write the HTML now, in one pass. Pre-verified — do not re-check, simulate, or improvise them. **Your next tool call after this Read is the Write — do not think the card through first; compose it as you write.**

Read WITH this file, in the SAME message (parallel, one round-trip): **`DESIGN.md` always** (the rules these patterns implement — color / invariants / atoms / chart build rules), plus only what THIS card uses:
- each chart the card draws → its `charts/<type>.md` (pattern-file pointers in the SKILL.md chart table; no pointer → compose under the table's rules + §One-SVG below)
- 5+ measures stage layout → `snippets/stage.md` · ordered procedure → `snippets/stepper.md` · sourced/researched card → `snippets/citations.md`
- content collection (3+ news/article/post items) → `COLLECTIONS.md`

Never read a pattern file the card doesn't use.

## Card skeleton (start every card from this)

```html
<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>…</title>
<style>
:root{color-scheme:light dark;
--bg:light-dark(#e9ebee,#0d0d0f);--card:light-dark(#fff,#1c1c1e);
--ink:light-dark(#16181c,#f2f3f5);--mut:light-dark(#6e7480,#9ba1ac);--fnt:light-dark(#a8adb8,#5d646f);
--inset:light-dark(#f4f5f7,#26262a);--hl:color-mix(in srgb,var(--fnt) 12%,transparent);
--a:#6366f1;--b:#38bdf8;--at:light-dark(#4346ad,#a7abf7);--bt:light-dark(#0c6c9c,#7fd2fb);
--ez:cubic-bezier(.16,1,.3,1);
--sh:0 1px 2px light-dark(rgba(16,24,40,.04),rgba(0,0,0,.5)),0 10px 28px light-dark(rgba(16,24,40,.07),rgba(0,0,0,.4))}
[data-theme=light]{color-scheme:light}[data-theme=dark]{color-scheme:dark}
*{margin:0;padding:0;box-sizing:border-box}
body{min-height:100vh;display:flex;justify-content:center;align-items:center;padding:16px;background:var(--bg);color:var(--ink);font-family:-apple-system,system-ui,'Segoe UI',sans-serif}
.card{width:min(430px,100%);background:var(--card);border-radius:18px;padding:24px;box-shadow:var(--sh)}
.lb{font-size:.7rem;font-weight:500;text-transform:uppercase;letter-spacing:.07em;color:var(--mut)}
.cap{font-size:.78rem;color:var(--mut)}
@media (min-width:720px){.card{width:min(860px,92vw);padding:32px 36px}.grid2{display:grid;grid-template-columns:1fr 1fr;column-gap:44px;align-items:start}}
</style></head><body><div class="card">
<!-- zones, top→bottom: [icon tile + .lb title + ⓘ] → HERO+chip → .cap context → chart 40–60% → micro axis → stat/point rows → insets → sources -->
</div><script>/* handlers */</script></body></html>
```

`light-dark(亮值,暗值)` declares both themes in one line; `[data-theme]` override is the two one-liners above — never write duplicated var blocks. Swap `--a/--b/--at/--bt` to the chosen domain pair (text-grades: L≈32–45 light / 68–80 dark). Chip = 12% tint bg + text-grade color.
**Write dense**: one line per CSS rule, shorthand properties, no blank lines inside `<style>`, ship only rules actually used. FAST shell typically lands 8–10KB.

## Tabs (panels keyed by id; `hidden` safe — sections carry no author `display`)

```html
<nav class="tabs"><button class="tab on" data-t="a">概览</button><button class="tab" data-t="b">明细</button></nav>
<section id="p-a">…</section><section id="p-b" hidden>…</section>
<script>
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('on',x===b));
  document.querySelectorAll('section[id^=p-]').forEach(p=>p.hidden=p.id!=='p-'+b.dataset.t);
});
</script>
```

Style: nav = inset track (`background:var(--inset);border-radius:11px;padding:3px`), active tab = `background:var(--card)` + small shadow.

## Overlay (class toggle — NEVER `hidden` on an element with author `display`; it locks open)

```html
<div class="ov" id="ov"><div class="panel">…<button id="ovx" aria-label="关闭"><!--SVG ×--></button></div></div>
<style>.ov{display:none;position:fixed;inset:0;z-index:9;background:rgba(5,6,10,.55);
  backdrop-filter:blur(6px);justify-content:center;align-items:center;padding:20px}
.ov.open{display:flex}
.ov .panel{width:min(430px,100%);max-height:80vh;overflow:auto;background:var(--card);
  border-radius:16px;padding:24px;box-shadow:var(--sh);position:relative}</style>
<script>
const ov=document.getElementById('ov'),hide=()=>ov.classList.remove('open');
document.getElementById('more').onclick=()=>ov.classList.add('open');
document.getElementById('ovx').onclick=hide;
ov.onclick=e=>{if(e.target===ov)hide()};
addEventListener('keydown',e=>{if(e.key==='Escape')hide()});
</script>
```

## One-SVG rule for multi-part graphics

Any graphic with ≥2 coordinated parts (spine+dots, bars+axis, line+markers) is drawn as ONE `<svg>` — one coordinate system, alignment by construction. NEVER glue CSS-absolute fragments onto HTML flow.
- Full-width adaptive SVG containing **circles or text**: use **percentage coordinates, NO viewBox** (a stretched viewBox turns circles into ellipses and warps glyphs).
- `viewBox + preserveAspectRatio="none"` only for pure path/line/rect geometry (sparklines, area fills — stretch is harmless there).
- Wrapping/CJK labels stay HTML, aligned via a fractional grid matching the SVG percentages.
- Single-element fills (ratio bar, echo track) may stay plain HTML divs — nothing to misalign.
- **Anti-squeeze**: chart `<svg>` always carries a fixed pixel `height` attribute (never `height:auto` inside flex/grid); the chart block spans its full column width; inside `.grid2` give chart columns `min-width:0` ONLY on text, never let the chart cell shrink below ~240px — stack instead.

## Timeline (percentage SVG + fractional label grid)

Dots at `cx=(i+0.5)/N`; spine from first to last cx. Label grid `repeat(N,1fr)` → column centers hit dots exactly at any viewport, any wrapping.

```html
<!-- N=3: 16.67% / 50% / 83.33% -->
<svg width="100%" height="14" style="display:block">
  <line x1="16.67%" y1="7" x2="83.33%" y2="7" style="stroke:var(--hl);stroke-width:2"/>
  <circle cx="16.67%" cy="7" r="5" style="fill:var(--a)"/>
  <circle cx="50%" cy="7" r="5" style="fill:var(--a)"/>
  <circle cx="83.33%" cy="7" r="5" style="fill:var(--b)"/>
</svg>
<div style="display:grid;grid-template-columns:repeat(3,1fr);text-align:center">
  <div><div class="t">事件名</div><div class="d">时间 · 备注</div></div>
  <!-- ×N -->
</div>
```

`.t{font-size:.72rem;font-weight:600;margin-top:6px} .d{font-size:.66rem;color:var(--fnt)}`. Vertical variant: swap axes — SVG column of spine+dots beside rows of labels. In SVG always set color via `style=`, never bare presentation attributes. Ordered procedure with rich per-step content → `snippets/stepper.md`.

## Insight line (the verdict atom — max 1 per card)

```html
<div class="ins"><i></i>6月支出环比降12%,餐饮贡献最大</div>
<style>.ins{display:flex;align-items:center;gap:8px;font-size:.86rem;font-weight:650;margin:10px 0 2px}
.ins i{flex:none;width:7px;height:7px;border-radius:99px;background:var(--a)}</style>
```

States a conclusion, never describes the chart. Sits under hero / above chart.

## Point row + graphic echo (evidence value gets a micro-bar)

```html
<div class="pt"><span class="dot"></span><b>限速</b>
  <span class="ev">15% / 18min<i class="mb"><i style="width:15%;background:var(--b)"></i></i></span></div>
<style>
.pt{display:flex;align-items:baseline;gap:9px;padding:8px 0;font-size:.84rem}
.pt+.pt{border-top:1px solid var(--hl)}
.pt .ev{margin-left:auto;color:var(--mut);font-size:.76rem;font-variant-numeric:tabular-nums}
.dot{flex:none;width:6px;height:6px;border-radius:99px;background:var(--fnt)}
.mb{display:inline-block;width:44px;height:4px;border-radius:2px;background:var(--inset);
  margin-left:8px;vertical-align:2px;overflow:hidden}
.mb i{display:block;height:100%;border-radius:2px}
</style>
```

Use the echo whenever evidence values are comparable across rows (same unit/scale); omit for lone qualitative values.

## Count-up

```js
const cnt=(el,t,s='')=>{const a=performance.now(),f=n=>{const p=Math.min((n-a)/700,1);
el.textContent=Math.round(t*(1-(1-p)**3)).toLocaleString()+s;if(p<1)requestAnimationFrame(f)};
requestAnimationFrame(f)};
```

## Motion (entrance, every card)

ONE curve constant for all animation & transitions: `--ez` (already in skeleton `:root`). Entrances = one-shot ≤700ms, never loop, never hover/scroll-triggered; channels opacity/transform/dashoffset only (invariant 2 safe).

```css
.fu{animation:fu .5s var(--ez) both}
@keyframes fu{from{opacity:0;transform:translateY(7px)}}
.gy{transform-box:fill-box;transform-origin:bottom;animation:gy .6s var(--ez) both}
@keyframes gy{from{transform:scaleY(0)}}
.dr{stroke-dasharray:600;stroke-dashoffset:600;animation:dr .9s var(--ez) .15s forwards}
@keyframes dr{to{stroke-dashoffset:0}}
@media (prefers-reduced-motion:reduce){.fu,.gy,.dr{animation:none;stroke-dashoffset:0}}
```

`.fu` rows/stats/legends · `.gy` svg bars (each rect) · `.dr` line paths (dasharray ≥ path length). Sibling stagger `animation-delay:.04s×i`, cap .3s. Heroes → count-up above.
Tier by mode — FAST: main chart `.gy`/`.dr` + count-up, no `.fu`, no stagger. RICH/DASH: full set. Write only the keyframes you use.
Chart micro-interactions (bar scrub-focus, crosshair scrub, donut tap swap) live in each chart's own `charts/<type>.md` — tap-first, mobile primary; bars ≥4 ship scrub-focus in every mode.

## States & texture

States: hover shadow-lift or `brightness(1.05)`; active `scale(.96)`; `:focus-visible` 2px accent outline; loading `…`; error `--`; disabled `opacity:.4`. Feedback ≤100ms. Transitions 150/200/300ms on `var(--ez)`.
Texture: radius 16–20px card / 10–12px tiles. Shadow light `0 1px 2px rgba(16,24,40,.04), 0 10px 28px rgba(16,24,40,.07)`; dark `0 1px 2px rgba(0,0,0,.5), 0 14px 36px rgba(0,0,0,.4)`. 4px grid: pad 22–26, sections 18–20, items 10–12. Depth via bg→card→inset tones, not heavy shadow.
