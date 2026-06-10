# Chart snippets — geometry locked, composition free

Read WITH SNIPPETS.md at write time whenever the card draws any chart below or uses DASH layout. These patterns lock what breaks — coordinate math, % centering, aspect, alignment — NOT design. Re-mapping data, swapping accent pairs, scaling, combining, layering new ideas on top is expected. Copy the math; keep inventing. **Next tool call after this Read = the Write; no study pass.**

Motion system lives in SNIPPETS.md (every card needs it, not just these charts) — apply its `.gy` to bar rects and `.dr` to line paths here.

## JS SVG builder (all dynamic charts share)

```js
const NS='http://www.w3.org/2000/svg',mk=(p,t,at)=>{const e=document.createElementNS(NS,t);
for(const k in at)e.setAttribute(k,at[k]);p.appendChild(e);return e};
```

Wrap ALL builder calls in ONE try/catch — a silent blank chart is the worst failure:

```js
try{/* every mk()-based builder */}catch(e){document.querySelectorAll('svg.chart').forEach(s=>{
  if(!s.childElementCount)s.outerHTML='<div class="cap" style="padding:18px;text-align:center">图表渲染失败</div>'})}
```

## Highlight bars + avg line + value pill (percentage coords, NO viewBox)

N bars: center_i=(i+.5)/N·100%, width ~9% (N=7), x=center−width/2, bottom edges share one baseline y. Gray `var(--inset)`, exactly ONE accent bar. A rect cannot center on a % anchor — pill uses the **nested-svg trick**:

```html
<svg class="chart" height="172">
  <rect x="2.64%" y="134" width="9%" height="38" rx="7" style="fill:var(--inset)"/><!-- ×N gray -->
  <rect x="74.07%" y="84" width="9%" height="88" rx="7" style="fill:var(--a)"/><!-- the ONE -->
  <line x1="0" y1="94" x2="100%" y2="94" style="stroke:var(--fnt);stroke-width:1.4;stroke-dasharray:4 4;opacity:.55"/>
  <g style="font-size:9px;font-weight:600"><rect x="0" y="86" width="58" height="17" rx="8.5" style="fill:var(--ink)"/>
    <text x="29" y="98" text-anchor="middle" style="fill:var(--card)">Avg 6.8%</text></g>
  <svg x="78.57%" y="56" overflow="visible" style="font-size:9px;font-weight:600"><!-- 78.57% = accent bar center -->
    <rect x="-30" y="0" width="60" height="17" rx="8.5" style="fill:var(--ink)"/>
    <text x="0" y="12" text-anchor="middle" style="fill:var(--card)">$15,750</text></svg>
</svg>
<div class="ax ax7"><span>Jan</span><!-- … --><b>Jun</b><span>Jul</span></div>
```

```css
.ax{display:grid;text-align:center;font-size:.66rem;color:var(--fnt);margin-top:7px}
.ax7{grid-template-columns:repeat(7,1fr)}
.ax b{justify-self:center;font-weight:650;color:var(--at);background:color-mix(in srgb,var(--a) 12%,transparent);border-radius:6px;padding:1px 9px}
```

Axis labels = HTML fractional grid matching bar count; highlighted period = `<b>` chip. Ink pill auto-inverts in dark (`--ink`/`--card`).

## Trend line + area fade + end dot + tag (JS-built from clientWidth)

Path `d` can't take % — build px coords at load from `clientWidth` (cards are width-stable, no resize handler). End dot + tag pill live in the same coordinate space, alignment by construction.

```html
<svg class="chart" height="150" id="tr" role="img" aria-label="近7期趋势">
  <defs><linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" style="stop-color:var(--a);stop-opacity:.16"/>
    <stop offset="1" style="stop-color:var(--a);stop-opacity:0"/></linearGradient></defs>
</svg>
```
```js
const TV=[48,52,49,58,63,61,68],sv=document.getElementById('tr'),
W=sv.clientWidth,L=8,Rt=66,B=128,T=18,                  // Rt right gutter fits the tag pill
lo=Math.min(...TV),hi=Math.max(...TV),
X=i=>L+(W-L-Rt)*i/(TV.length-1),Y=v=>B-(B-T)*(v-lo)/(hi-lo),
d=TV.map((v,i)=>(i?'L':'M')+X(i).toFixed(1)+','+Y(v).toFixed(1)).join('');
mk(sv,'path',{d:d+`L${X(TV.length-1).toFixed(1)},${B} L${L},${B} Z`,style:'fill:url(#fade)'});
mk(sv,'path',{d,class:'dr',style:'fill:none;stroke:var(--a);stroke-width:2;stroke-linejoin:round'});
const ex=X(TV.length-1),ey=Y(TV[TV.length-1]),g=mk(sv,'g',{style:'font-size:9px;font-weight:600'});
mk(sv,'circle',{cx:ex,cy:ey,r:3.5,style:'fill:var(--a)'});
mk(g,'rect',{x:ex+8,y:ey-8,width:Rt-16,height:16,rx:8,style:'fill:var(--ink)'});
mk(g,'text',{x:ex+8+(Rt-16)/2,y:ey+4,'text-anchor':'middle',style:'fill:var(--card)'}).textContent='68';
```

`.dr` draw-in works as-is for card-width paths (<600px length). HTML `.ax` grid below for time labels.

## Donut (fixed-px svg — circles never stretch)

Stroke-dasharray segments on stacked circles; center value; legend = HTML rows beside, never svg text lists.

```html
<div style="display:flex;align-items:center;gap:18px">
  <svg width="120" height="120" id="dn" role="img" aria-label="份额环图"></svg>
  <div><!-- legend: .pt rows (dot + label + value) --></div></div>
```
```js
const SEG=[['直营',46,'var(--a)'],['渠道',32,'var(--b)'],['其他',22,'var(--inset)']],
R=46,CC=2*Math.PI*R;let off=0;
SEG.forEach(([n,v,c])=>{mk(dn,'circle',{cx:60,cy:60,r:R,fill:'none',
  transform:'rotate(-90 60 60)','stroke-dasharray':`${(v/100*CC).toFixed(1)} ${CC.toFixed(1)}`,
  'stroke-dashoffset':(-off/100*CC).toFixed(1),style:`stroke:${c};stroke-width:13`});off+=v});
mk(dn,'text',{x:60,y:57,'text-anchor':'middle',style:'font-size:20px;font-weight:700;fill:var(--ink)'}).textContent='46%';
mk(dn,'text',{x:60,y:73,'text-anchor':'middle',style:'font-size:8.5px;fill:var(--mut)'}).textContent='直营占比';
```

≤5 slices; lead slice accent, runners tint/gray.

## Spike/vital stream + anchored annotation

Dense micro-bars (30–50) from a value array; one peak gets dot+label anchor.

```js
const HV=[22,30,18,34, /* … */ 96, /* peak */ 58,46]; // px heights, baseline y=132
const slot=96/HV.length;                               // % per slot, 3.4% left gutter
[[40,'40'],[84,'20']].forEach(([y,t])=>{               // ≤2 dashed ticks
  mk(sv,'line',{x1:18,y1:y,x2:'100%',y2:y,style:'stroke:var(--fnt);opacity:.18;stroke-dasharray:3 4'});
  mk(sv,'text',{x:0,y:y+3,style:'font-size:8.5px;fill:var(--fnt)'}).textContent=t});
HV.forEach((v,i)=>mk(sv,'rect',{x:(3.4+(i+.18)*slot)+'%',y:132-v,width:slot*.5+'%',height:v,rx:1.6,style:'fill:var(--a)'}));
const px=3.4+(PEAK_I+.43)*slot;                        // anchor at peak
mk(sv,'circle',{cx:px+'%',cy:27,r:2.6,style:'fill:var(--ink)'});
mk(sv,'text',{x:(px+1.6)+'%',y:30.5,style:'font-size:9px;font-weight:600;fill:var(--ink)'}).textContent='175 BPM';
```

`<svg class="chart" height="150">` + HTML `.ax ax5` time grid below.

## Phase strip (hypnogram band)

Base tint + seeded stripes — seeded LCG so art is identical every open.

```js
let sd=7;const rnd=()=>(sd=sd*48271%2147483647)/2147483647;
for(let i=0;i<30;i++)mk(sl,'rect',{x:(rnd()*97)+'%',y:0,width:(.7+rnd()*2.1)+'%',height:52,
  style:'fill:var(--s'+(rnd()<.6?1:2)+')'});
```

Svg holds full-width base `rect fill:var(--s0)`; wrap in `.band{border-radius:9px;overflow:hidden}`. Shades as widget vars: `--s0` light base, `--s1/--s2` mid/deep of same hue (light-dark pairs). Below: flex meta row, ends = tiny svg icons + times.

## Radar (fixed-px svg — NEVER percentage/stretch; polygons deform)

```js
const CX=160,CY=112,R=78,AX=['Price', /* …8 axes */],A=[.55,.5,.72,…],B=[.7,.38,…],
pt=(i,v)=>{const a=Math.PI*2*i/AX.length-Math.PI/2;
  return (CX+Math.cos(a)*R*v).toFixed(1)+','+(CY+Math.sin(a)*R*v).toFixed(1)};
[.33,.66,1].forEach(r=>mk(rd,'polygon',{points:AX.map((_,i)=>pt(i,r)).join(' '),style:'fill:none;stroke:var(--hl)'}));
AX.forEach((_,i)=>mk(rd,'line',{x1:CX,y1:CY,x2:pt(i,1).split(',')[0],y2:pt(i,1).split(',')[1],style:'stroke:var(--hl)'}));
[[A,'--a'],[B,'--b']].forEach(([d,c])=>mk(rd,'polygon',{points:d.map((v,i)=>pt(i,v)).join(' '),
  style:`fill:color-mix(in srgb,var(${c}) 24%,transparent);stroke:var(${c});stroke-width:1.8;stroke-linejoin:round`}));
AX.forEach((t,i)=>{const a=Math.PI*2*i/AX.length-Math.PI/2,x=CX+Math.cos(a)*(R+14),y=CY+Math.sin(a)*(R+14),
  an=i===0||i===AX.length/2?'middle':(i<AX.length/2?'start':'end');
  mk(rd,'text',{x:x.toFixed(1),y:(y+(i===0?-2:i===AX.length/2?7:3)).toFixed(1),'text-anchor':an,
    style:'font-size:8.5px;fill:var(--mut)'}).textContent=t});
```

`<svg width="320" height="244">` centered in a flex div. ≤2 series, 5–8 axes; HTML legend dots below.

## DASH bento (multi-widget dashboard)

```css
.wrap{width:min(880px,100%);display:grid;gap:16px}
@media(min-width:720px){.wrap{grid-template-columns:1fr 1fr}}
```

Each widget = full `.card` running the complete anatomy formula, with its OWN domain accent pair as widget-class vars:

```css
.w-bal{--a:#6366f1;--at:light-dark(#4346ad,#a7abf7)}
.w-hr{--a:#f43f5e;--at:light-dark(#be123c,#fda4af)}
```

Header per widget: 22px tile + title + ⓘ (CSS tooltip) + ghost `···` → shared overlay. Surfaces stay neutral; one pair per WIDGET replaces one pair per card. A DASH stat row may color ONE delta value in text-grade accent (chip semantics, boxless) — the only bare-colored-value exception.
