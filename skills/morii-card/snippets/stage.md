# Stage switcher — graphic-first dashboard (5+ measures of ONE entity)

Many measures of one entity → DON'T stack numbers (the cardinal sin); use a **stage + graphic-selector**. Full verified pattern: **`examples/stage-dashboard.html`** (copy its skeleton). **Next tool call after the reads = the Write.**

Shape: insight line → a big **stage** (one metric's interactive graphic + ONE headline value + a sub line) → a strip of **mini-graphic tabs**, each drawing its own sparkline/hypnogram + label + value. Tap a tab → the stage rebuilds to that metric and replays the draw-in. The graphic is the control: scrub it to read any point. ONE accent for the whole card. (Comparison/ranking cards reuse the same spirit — see `examples/leaderboard.html`, `examples/compare-cards.html`.)

Core primitives (reused by the stage, the leaderboard spark, and every line chart):

**Line scrub** — drag/tap to read any point; headline value + label update live, dot follows:
```js
const scrub=e=>{e.preventDefault();const r=gfx.getBoundingClientRect(),i=Math.max(0,Math.min(N-1,Math.round((e.clientX-r.left-L)/((W-L-R)/(N-1)))));
  dot.setAttribute('cx',X(i));dot.setAttribute('cy',Y(d[i]));setBig(d[i]);};
gfx.onpointerdown=e=>{e.preventDefault();gfx.setPointerCapture(e.pointerId);scrub(e);gfx.onpointermove=scrub};
gfx.onpointerup=gfx.onpointercancel=()=>gfx.onpointermove=null;
```
`e.preventDefault()` + `.card{user-select:none}` stop desktop drag from selecting text — a real bug otherwise.

**Line draw-in** — the entrance every chart uses (replays on stage switch):
```js
const len=path.getTotalLength();path.style.strokeDasharray=len;path.style.strokeDashoffset=len;
path.style.animation='draw .7s var(--ez) forwards'; // @keyframes draw{to{stroke-dashoffset:0}}
```

**Hypnogram** (sleep / any staged time-series) — a stepped line, deep low / light mid / REM high, one accent + single-hue fade; scrub → 「02:15 · 深睡」. Full code in the stage example.

**The only gradient** (same-hue opacity fade, inside a chart): `<linearGradient id=fg x2=0 y2=1><stop offset=0 stop-color=var(--a) stop-opacity=.24/><stop offset=1 stop-color=var(--a) stop-opacity=0/></linearGradient>` → `fill:url(#fg)`. No two-hue gradients, gradient surfaces, or glows anywhere.
