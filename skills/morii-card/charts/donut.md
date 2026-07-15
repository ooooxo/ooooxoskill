# Donut — share ≤5 slices (fixed-px svg — circles NEVER percentage/stretch)

Self-contained: this + SNIPPETS.md core. **Next tool call after this Read = the Write.**

Shared builder (wrap ALL builder calls in ONE try/catch — silent blank = worst failure):

```js
const NS='http://www.w3.org/2000/svg',mk=(p,t,at)=>{const e=document.createElementNS(NS,t);
for(const k in at)e.setAttribute(k,at[k]);p.appendChild(e);return e};
try{/* every mk()-based builder */}catch(e){document.querySelectorAll('svg.chart').forEach(s=>{
  if(!s.childElementCount)s.outerHTML='<div class="cap" style="padding:18px;text-align:center">图表渲染失败</div>'})}
```

Stroke-dasharray segments on stacked circles; center value; legend = HTML rows beside, never svg text lists. Lead slice accent, runners tint/gray. Concentric 2-ring share: second ring = smaller R, same math.

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

## Tap swap (RICH/DASH — the donut's interaction)

Tap-first: channels opacity + SVG-internal text, ≤.18s, geometry frozen. Keep slice els `cs[]` + center text els `cv/cl` while building; tap/hover a slice swaps the center readout, siblings dim; stash default center strings for the reset:

```js
cs.forEach((c,i)=>{c.style.cursor='pointer';c.style.transition='opacity .15s';
  c.onpointerenter=()=>{cv.textContent=SEG[i][1]+'%';cl.textContent=SEG[i][0];
    cs.forEach((o,j)=>o.style.opacity=j===i?1:.35)}});
dn.onpointerleave=()=>{cv.textContent='46%';cl.textContent='直营占比';cs.forEach(o=>o.style.opacity=1)};
```
