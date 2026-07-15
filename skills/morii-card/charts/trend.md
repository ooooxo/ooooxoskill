# Trend line — area fade + end dot + tag; scrub to read any point

Self-contained: this + SNIPPETS.md core is all a trend chart needs. Geometry locked; composition free. **Next tool call after this Read = the Write.**

Shared builder (wrap ALL builder calls in ONE try/catch — silent blank = worst failure):

```js
const NS='http://www.w3.org/2000/svg',mk=(p,t,at)=>{const e=document.createElementNS(NS,t);
for(const k in at)e.setAttribute(k,at[k]);p.appendChild(e);return e};
try{/* every mk()-based builder */}catch(e){document.querySelectorAll('svg.chart').forEach(s=>{
  if(!s.childElementCount)s.outerHTML='<div class="cap" style="padding:18px;text-align:center">图表渲染失败</div>'})}
```

## Line + area fade + end dot + tag (JS-built from clientWidth)

Path `d` can't take % — build px coords at load from `clientWidth` (cards are width-stable, no resize handler). End dot + tag pill live in the same coordinate space, alignment by construction. The fade is **the only sanctioned gradient**: same-hue opacity fade inside the chart, never on surfaces.

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

`.dr` draw-in (SNIPPETS motion) works as-is for card-width paths (<600px length); for exact length use `path.getTotalLength()` → set `strokeDasharray/strokeDashoffset` then animate to 0. HTML `.ax` fractional grid below for time labels (see charts/bars.md css).

Static value-tag variant (hand-placed px coords):

```html
<g style="font-size:7px"><rect x="246" y="48" rx="4" width="34" height="13" style="fill:var(--ink)"/>
<text x="263" y="57" text-anchor="middle" style="fill:var(--card)">$61.6k</text></g>
```

## Interaction — ≥4 points ships a scrub in every mode

Tap-first: channels opacity/fill + SVG-internal text, transitions ≤.18s `var(--ez)`, geometry frozen, `touch-action:pan-y`. **Desktop drag must not select text**: `user-select:none` on `.card` + `e.preventDefault()` in pointerdown.

**Line scrub** (simplest — headline value + label update live, dot follows the finger; the readout may BE the hero):

```js
const scrub=e=>{e.preventDefault();const r=sv.getBoundingClientRect(),i=Math.max(0,Math.min(TV.length-1,Math.round((e.clientX-r.left-L)/((W-L-Rt)/(TV.length-1)))));
  dot.setAttribute('cx',X(i));dot.setAttribute('cy',Y(TV[i]));setBig(TV[i]);};
sv.onpointerdown=e=>{e.preventDefault();sv.setPointerCapture(e.pointerId);scrub(e);sv.onpointermove=scrub};
sv.onpointerup=sv.onpointercancel=()=>sv.onpointermove=null;
```

**Crosshair scrub** (RICH/DASH upgrade — dashed hairline + dot + time-label pill; hover moves it, touch press-drags it, last reading persists; needs `LB` time-label array):

```js
const hl=mk(sv,'line',{y1:16,y2:B,style:'stroke:var(--fnt);stroke-dasharray:3 3;opacity:0;transition:opacity .15s'}),
hd=mk(sv,'circle',{r:3.5,style:'fill:var(--ink);opacity:0;transition:opacity .15s'}),
ht=mk(sv,'g',{style:'font-size:9px;font-weight:600;opacity:0;transition:opacity .15s'}),
hr=mk(ht,'rect',{y:0,height:16,rx:8,style:'fill:var(--ink)'}),
hx=mk(ht,'text',{y:11.5,'text-anchor':'middle',style:'fill:var(--card)'});
sv.style.touchAction='pan-y';
const move=e=>{const i=Math.max(0,Math.min(TV.length-1,
  Math.round((e.clientX-sv.getBoundingClientRect().left-L)/((W-L-Rt)/(TV.length-1))))),x=X(i);
  hl.setAttribute('x1',x);hl.setAttribute('x2',x);hd.setAttribute('cx',x);hd.setAttribute('cy',Y(TV[i]));
  hx.textContent=LB[i]+' · '+TV[i];const w=hx.getComputedTextLength()+16,tx=Math.max(w/2,Math.min(W-w/2,x));
  hr.setAttribute('x',tx-w/2);hr.setAttribute('width',w);hx.setAttribute('x',tx);
  [hl,hd,ht].forEach(n=>n.style.opacity=1)};
sv.onpointermove=move;
sv.onpointerdown=e=>{sv.setPointerCapture(e.pointerId);move(e)};
```
