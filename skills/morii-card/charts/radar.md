# Radar — multi-dim profile, 5–8 axes, ≤2 series (fixed-px svg — NEVER percentage/stretch; polygons deform)

Self-contained: this + SNIPPETS.md core. Exempt from tap interaction. **Next tool call after this Read = the Write.**

Shared builder (wrap ALL builder calls in ONE try/catch — silent blank = worst failure):

```js
const NS='http://www.w3.org/2000/svg',mk=(p,t,at)=>{const e=document.createElementNS(NS,t);
for(const k in at)e.setAttribute(k,at[k]);p.appendChild(e);return e};
try{/* every mk()-based builder */}catch(e){document.querySelectorAll('svg.chart').forEach(s=>{
  if(!s.childElementCount)s.outerHTML='<div class="cap" style="padding:18px;text-align:center">图表渲染失败</div>'})}
```

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

`<svg width="320" height="244">` centered in a flex div. HTML legend dots below.
