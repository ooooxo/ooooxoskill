# Phase strip — hypnogram band / segment art

Self-contained: this + SNIPPETS.md core. Exempt from tap interaction (band art). **Next tool call after this Read = the Write.** (An interactive stepped hypnogram with scrub lives in `snippets/stage.md`.)

Shared builder (wrap ALL builder calls in ONE try/catch — silent blank = worst failure):

```js
const NS='http://www.w3.org/2000/svg',mk=(p,t,at)=>{const e=document.createElementNS(NS,t);
for(const k in at)e.setAttribute(k,at[k]);p.appendChild(e);return e};
try{/* every mk()-based builder */}catch(e){document.querySelectorAll('svg.chart').forEach(s=>{
  if(!s.childElementCount)s.outerHTML='<div class="cap" style="padding:18px;text-align:center">图表渲染失败</div>'})}
```

Base tint + seeded stripes — seeded LCG so art is identical every open:

```js
let sd=7;const rnd=()=>(sd=sd*48271%2147483647)/2147483647;
for(let i=0;i<30;i++)mk(sl,'rect',{x:(rnd()*97)+'%',y:0,width:(.7+rnd()*2.1)+'%',height:52,
  style:'fill:var(--s'+(rnd()<.6?1:2)+')'});
```

Svg holds full-width base `rect fill:var(--s0)`; wrap in `.band{border-radius:9px;overflow:hidden}`. Shades as widget vars: `--s0` light base, `--s1/--s2` mid/deep of same hue (light-dark pairs). Below: flex meta row, ends = tiny svg icons + times.
