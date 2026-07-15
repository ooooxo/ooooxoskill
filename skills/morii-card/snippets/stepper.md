# Stepper — ordered procedure (≥3 dependent steps with rich content)

Timeline progress head + sequenced panels. <3 steps or label-only → plain timeline (SNIPPETS.md), don't upgrade. **Next tool call after this Read = the Write.**

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

Dot states change fill/stroke-opacity only — geometry frozen (invariant 2). Per-step panel heights may differ (tab precedent); don't JS-measure to lock the tallest. LIVE hooks ride existing rules only (drill into held-back data); plain reading steps get no channel.
