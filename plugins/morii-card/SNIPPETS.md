# Canonical snippets & skeleton

**STOP — is your data collected and final?** If any search/fetch/computation remains, close this file and finish data work first (Workflow step 1); come back as the last step before writing. If data is ready: copy these patterns and write the HTML now, in one pass. Pre-verified — do not re-check, simulate, or improvise them. **Your next tool call after this Read is the Write — do not think the card through first; compose it as you write.**

Card draws charts (trend line/highlight bars/donut/spike/strip/radar) or uses DASH layout → also read `CHARTS.md` now; chart geometry lives there.

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

`.t{font-size:.72rem;font-weight:600;margin-top:6px} .d{font-size:.66rem;color:var(--fnt)}`. Vertical variant: swap axes — SVG column of spine+dots beside rows of labels. In SVG always set color via `style=`, never bare presentation attributes.

## Stepper (ordered procedure — timeline progress head + sequenced panels)

Progress dots reuse timeline math (`cx=(i+0.5)/N`, fractional label grid); step panels swap like tabs (`hidden` safe — sections carry no author `display`). ONE state source `go(i)`; dots clickable, prev/next ≥44px, counter. Step body = step title + ≤1 instruction sentence + insets/point rows — text atoms hold.

```html
<!-- N=4: 12.5% / 37.5% / 62.5% / 87.5%; svg height 18 fits the current-dot halo -->
<svg width="100%" height="18" style="display:block">
  <line x1="12.5%" y1="9" x2="87.5%" y2="9" style="stroke:var(--hl);stroke-width:2"/>
  <circle class="sd" cx="12.5%" cy="9" r="5"/><circle class="sd" cx="37.5%" cy="9" r="5"/>
  <circle class="sd" cx="62.5%" cy="9" r="5"/><circle class="sd" cx="87.5%" cy="9" r="5"/>
</svg>
<div class="tg"><!-- fractional label grid repeat(N,1fr), .t/.d per step --></div>
<section class="sp">…step 1…</section><section class="sp" hidden>…step 2…</section>
<div class="snv"><button id="pv">上一步</button><span class="cap" id="ct"></span><button id="nx">下一步</button></div>
<style>
.sd{cursor:pointer;transition:fill .15s var(--ez)}
.snv{display:flex;align-items:center;justify-content:space-between;margin-top:14px}
.snv button{min-height:44px;padding:0 18px;border:0;border-radius:11px;background:var(--inset);color:var(--ink);font-size:.8rem;font-weight:600;cursor:pointer;transition:box-shadow .15s var(--ez)}
.snv button:hover{box-shadow:inset 0 0 0 1.5px var(--a)}.snv button:active{transform:scale(.96)}
.snv button:disabled{opacity:.4;cursor:default;box-shadow:none}
</style>
<script>
const sp=[...document.querySelectorAll('.sp')],sd=[...document.querySelectorAll('.sd')],
tl=[...document.querySelectorAll('.tg .t')],N=sp.length,
pv=document.getElementById('pv'),nx=document.getElementById('nx'),ct=document.getElementById('ct');
let cur=0;
const go=i=>{cur=Math.max(0,Math.min(N-1,i));
  sp.forEach((p,j)=>p.hidden=j!==cur);
  sd.forEach((d,j)=>{d.style.fill=j<=cur?'var(--a)':'var(--inset)';
    d.style.stroke='var(--a)';d.style.strokeWidth=8;d.style.strokeOpacity=j===cur?.22:0});
  tl.forEach((t,j)=>t.style.color=j===cur?'var(--ink)':'var(--mut)');
  ct.textContent=(cur+1)+' / '+N;pv.disabled=cur===0;nx.disabled=cur===N-1};
sd.forEach((d,j)=>d.onclick=()=>go(j));
pv.onclick=()=>go(cur-1);nx.onclick=()=>go(cur+1);go(0);
</script>
```

Dot states change fill/stroke-opacity only — geometry frozen (invariant 2). Per-step panel heights may differ (tab precedent); don't JS-measure to lock the tallest. LIVE hooks ride existing rules only (a step whose action the agent must perform/verify = genuine decision point); plain reading steps get no channel.

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
Tier by mode — MICRO: no entrance at all (`--ez` interaction transitions only). FAST: main chart `.gy`/`.dr` + count-up, no `.fu`, no stagger. RICH/DASH: full set. Write only the keyframes you use.

## LIVE channel (click wakes the agent) + option tiles

Preflight gate — ONE foreground Bash, once per session (reuse the verdict afterwards); `LIVE_NO` → no live markup anywhere (plain-text probe, clipboard-only actions):

```bash
command -v python3 >/dev/null && python3 -c "import socket;s=socket.socket();s.bind(('127.0.0.1',PORT));s.close();print('LIVE_OK')" 2>/dev/null || echo LIVE_NO
```

Agent side — after `LIVE_OK`, start BEFORE the Write (Bash `run_in_background`; copy exact, same PORT as preflight, embed it in the card):

```bash
python3 -c "
from http.server import BaseHTTPRequestHandler,HTTPServer
from urllib.parse import urlparse,parse_qs
class H(BaseHTTPRequestHandler):
    def do_GET(s):
        v=parse_qs(urlparse(s.path).query).get('c',[''])[0]
        s.send_response(204);s.send_header('Access-Control-Allow-Origin','*');s.end_headers()
        print('LIVE:'+v,flush=True)
    def log_message(*a):pass
srv=HTTPServer(('127.0.0.1',PORT),H);srv.timeout=600
srv.handle_request()"
```

One-shot: exits on first click → completion notification carries `LIVE:<value>`; empty output = timeout, user never clicked — say nothing. LAB multi-round: replace the last line with `while True: srv.handle_request()` and run under Monitor (persistent) — each click = one event; TaskStop when done.

Card side — option tiles + beacon + clipboard fallback + self-replace waiting state:

```html
<div class="ask">
  <div class="acts">
    <button class="opt" data-v="快速版"><span class="tl"><!--SVG--></span><span><b>快速版</b><i>秒出核心</i></span></button>
    <button class="opt" data-v="精致版"><span class="tl"><!--SVG--></span><span><b>精致版</b><i>完整层级 · 多等一会</i></span></button>
  </div><div class="cap" id="echo"></div></div>
<div class="wait"><b>已收到</b> <span class="cap">生成中,本页会自动刷新</span></div>
<style>
.acts{display:grid;gap:8px;margin-top:14px}
.opt{display:flex;align-items:center;gap:11px;border:0;border-radius:12px;padding:10px 12px;min-height:44px;cursor:pointer;text-align:left;background:var(--inset);color:var(--ink);transition:box-shadow .15s var(--ez)}
.opt:hover{box-shadow:inset 0 0 0 1.5px var(--a)}
.opt:active{transform:scale(.96)}.opt:disabled{opacity:.4;cursor:default}
.opt .tl{flex:none;width:36px;height:36px;border-radius:10px;display:grid;place-items:center;background:color-mix(in srgb,var(--a) 12%,transparent);color:var(--at)}
.opt b{display:block;font-size:.84rem}.opt i{font-style:normal;font-size:.7rem;color:var(--mut)}
.wait{display:none}.w .ask{display:none}.w .wait{display:block}
</style>
<script>
const PORT=24680;
const live=v=>{document.querySelectorAll('.opt').forEach(b=>b.disabled=true);
  fetch('http://127.0.0.1:'+PORT+'/?c='+encodeURIComponent(v),{mode:'no-cors'})
  .then(()=>{location.hash='w';location.reload()})
  .catch(()=>{navigator.clipboard?.writeText(v).catch(()=>{});
    document.getElementById('echo').textContent='通道已关 · 已复制「'+v+'」,回贴对话即可';
    document.querySelectorAll('.opt').forEach(b=>b.disabled=false)});};
document.querySelectorAll('.opt').forEach(b=>b.onclick=()=>live(b.dataset.v));
if(location.hash==='#w'){document.documentElement.classList.add('w');setTimeout(()=>location.reload(),2500)}
</script>
```

Swap `PORT` to the live listener's port. Waiting state = static text, no looping spinner (motion rules hold); both `.ask`/`.wait` toggle via the `.w` class, never the `hidden` attribute. Self-replace overwrite: Write `<file>.tmp.html` then `mv -f` over the original — rename is atomic, a mid-write reload never paints half a card. Multi-select: class-toggle rows + ONE confirm button calling `live([...sel].join('、'))`. No channel open (background card / pure offline) → drop `live()`, keep the clipboard handler alone; non-replacing choices (MICRO decision rows) → in `.then` show "已发送 · agent 处理中" instead of the `#w` reload flip.

## States & texture

States: hover shadow-lift or `brightness(1.05)`; active `scale(.96)`; `:focus-visible` 2px accent outline; loading `…`; error `--`; disabled `opacity:.4`. Feedback ≤100ms. Transitions 150/200/300ms on `var(--ez)`.
Texture: radius 16–20px card / 10–12px tiles. Shadow light `0 1px 2px rgba(16,24,40,.04), 0 10px 28px rgba(16,24,40,.07)`; dark `0 1px 2px rgba(0,0,0,.5), 0 14px 36px rgba(0,0,0,.4)`. 4px grid: pad 22–26, sections 18–20, items 10–12. Depth via bg→card→inset tones, not heavy shadow.

## Citations: claim refs + SVG source marks

**Sources never sit on the card face** — faintest metadata tier. Card face gets at most ONE quiet affordance (the evidence-overlay button, or a faint `来源 ×n` micro-line opening the overlay). Inside the overlay: numbered evidence entries, then ONE compact SVG row of source marks.

**Claim ref** — tiny numbered index beside a point-row phrase/quote; accent-tinted by default (color = clickable), hover deepens + shows a "查看依据" tooltip, click opens the overlay. Index matches the overlay entry number. Refs rendered inside the overlay are inert markers (no tooltip, no pointer).

**Source marks** — one `<svg>`, letter-in-circle per source at `cx=14+34i` (NO external favicon services; offline). No tooltips, no hint text — hover fill + pointer is the affordance; click opens the site.

```html
<b>竞争压力<span class="ref" data-ov>2</span></b>
…overlay panel, after the numbered entries:
<div class="sl"><span class="lb" style="font-size:.64rem">来源</span>
  <svg class="sm" width="166" height="28"><!-- width = N*34 -->
    <a href="https://techcrunch.com/…" target="_blank" rel="noopener"><circle cx="14" cy="14" r="12"/><text x="14" y="18">T</text></a>
    <!-- ×N at cx 48,82,116,150… -->
  </svg></div>
<style>
.ref{display:inline-flex;align-items:center;justify-content:center;min-width:15px;height:15px;
  margin-left:4px;padding:0 3px;border-radius:5px;font-size:.6rem;font-weight:650;cursor:pointer;
  vertical-align:2px;position:relative;
  background:color-mix(in srgb,var(--a) 11%,transparent);color:var(--at);transition:background .15s}
.ref:hover{background:color-mix(in srgb,var(--a) 22%,transparent)}
.ref::after{content:"查看依据";position:absolute;bottom:calc(100% + 6px);left:50%;
  transform:translateX(-50%);padding:4px 8px;border-radius:6px;white-space:nowrap;
  background:var(--ink);color:var(--card);font-size:.62rem;font-weight:550;
  opacity:0;pointer-events:none;transition:opacity .15s}
.ref:hover::after{opacity:1}
.ov .ref{cursor:default}.ov .ref::after{display:none}
.sl{display:flex;align-items:center;gap:12px;margin-top:14px;padding-top:12px;border-top:1px solid var(--hl)}
.sm a{cursor:pointer}
.sm circle{fill:color-mix(in srgb,var(--a) 12%,transparent);transition:fill .15s}
.sm a:nth-of-type(even) circle{fill:color-mix(in srgb,var(--b) 12%,transparent)}
.sm text{font-size:11px;font-weight:700;fill:var(--at);text-anchor:middle}
.sm a:nth-of-type(even) text{fill:var(--bt)}
.sm a:hover circle{fill:var(--a)}
.sm a:nth-of-type(even):hover circle{fill:var(--b)}
.sm a:hover text{fill:var(--card)}
</style>
<script>document.querySelectorAll('[data-ov]').forEach(r=>r.onclick=e=>{e.stopPropagation();ov.classList.add('open')});</script>
```

## Value tag pill at a line end (trend charts)

```html
<g style="font-size:7px"><rect x="246" y="48" rx="4" width="34" height="13" style="fill:var(--ink)"/>
<text x="263" y="57" text-anchor="middle" style="fill:var(--card)">$61.6k</text></g>
```
