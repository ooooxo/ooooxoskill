# Spike / vital stream — dense micro-bars + anchored peak annotation

Self-contained: this + SNIPPETS.md core. Exempt from tap interaction (too dense) — the anchor annotation is the emphasis. **Next tool call after this Read = the Write.**

Shared builder (wrap ALL builder calls in ONE try/catch — silent blank = worst failure):

```js
const NS='http://www.w3.org/2000/svg',mk=(p,t,at)=>{const e=document.createElementNS(NS,t);
for(const k in at)e.setAttribute(k,at[k]);p.appendChild(e);return e};
try{/* every mk()-based builder */}catch(e){document.querySelectorAll('svg.chart').forEach(s=>{
  if(!s.childElementCount)s.outerHTML='<div class="cap" style="padding:18px;text-align:center">图表渲染失败</div>'})}
```

Dense micro-bars (30–50) from a value array; one peak gets dot+label anchor:

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

`<svg class="chart" height="150">` + HTML `.ax ax5` time grid below (fractional grid css in charts/bars.md).
