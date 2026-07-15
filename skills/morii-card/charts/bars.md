# Bars — categories ≤8 (named-entity ranks → charts/leaderboard.md)

Self-contained: this + SNIPPETS.md core is all a bar chart needs. Geometry locked; re-mapping data, accents, composition free. **Next tool call after this Read = the Write.**

Shared builder (all dynamic charts; wrap ALL builder calls in ONE try/catch — silent blank = worst failure):

```js
const NS='http://www.w3.org/2000/svg',mk=(p,t,at)=>{const e=document.createElementNS(NS,t);
for(const k in at)e.setAttribute(k,at[k]);p.appendChild(e);return e};
try{/* every mk()-based builder */}catch(e){document.querySelectorAll('svg.chart').forEach(s=>{
  if(!s.childElementCount)s.outerHTML='<div class="cap" style="padding:18px;text-align:center">图表渲染失败</div>'})}
```

## Static geometry — highlight bars + avg line + value pill (percentage coords, NO viewBox)

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

Axis labels = HTML fractional grid matching bar count; highlighted period = `<b>` chip. Ink pill auto-inverts in dark (`--ink`/`--card`). Bars animate in with `.gy` (SNIPPETS motion) per rect. ≤3 bars: this static highlight form is enough. **≥4 bars → add scrub-focus below** (every mode); the statically-highlighted bar becomes the default focus.

## Scrub-focus (THE bar standard, ≥4 bars, all modes)

Tap-first (mobile primary; hover desktop bonus): channels opacity/fill/brightness + SVG-internal text, transitions ≤.18s `var(--ez)`, geometry frozen, hit zone = the full column (never the thin glyph), `touch-action:pan-y` keeps page scroll alive.

Every bar carries its value permanently (8.5px above bar, `--fnt`); focused bar = accent fill + ink/700 value + axis-label chip; press/drag anywhere scrubs focus; a readout row above the chart (value + context line + delta chip) tracks focus — it may BE the card hero. Default focus = the insight bar (peak/latest). Keep ≥24px headroom above the tallest bar for value labels.

```js
// D=[…] numbers · VS=[…] short on-bar strings (4.2k) · V=[…] full readout strings · LB=[…] labels
// sv = chart svg (height H) · ax = [...axis spans] · rv/rl/rc = readout value/label/chip els
const lo=Math.min(...D),hi=Math.max(...D),N=D.length,slot=100/N,base=H-20,
bars=[],vts=[],avg=D.reduce((s,v)=>s+v,0)/N;
D.forEach((v,i)=>{const h=40+(base-66)*(v-lo)/(hi-lo||1),top=base-h,g=mk(sv,'g',{});
  mk(g,'rect',{x:(i*slot)+'%',y:0,width:slot+'%',height:H,style:'fill:transparent;cursor:pointer'});
  bars.push(mk(g,'rect',{class:'bar',x:(i*slot+slot*.22)+'%',y:top,width:(slot*.56)+'%',height:h,rx:7,style:'fill:var(--inset)'}));
  const t=mk(g,'text',{class:'bv',x:((i+.5)*slot)+'%',y:top-7,'text-anchor':'middle',style:'fill:var(--fnt)'});
  t.textContent=VS[i];vts.push(t)});
const set=i=>{bars.forEach((b,j)=>b.style.fill=j===i?'var(--a)':'var(--inset)');
  vts.forEach((t,j)=>{t.style.fill=j===i?'var(--ink)':'var(--fnt)';t.style.fontWeight=j===i?700:550});
  ax.forEach((a,j)=>a.classList.toggle('on',j===i));
  rv.textContent=V[i];rl.textContent=CTX+' · '+LB[i];
  const d=Math.round((D[i]-avg)/avg*100);
  rc.textContent=(d>=0?'+':'')+d+'% vs 均值';rc.className='chip '+(d>=0?'cup':'cdn')};
sv.style.touchAction='pan-y';
const scrub=e=>{const r=sv.getBoundingClientRect();
  set(Math.max(0,Math.min(N-1,Math.floor((e.clientX-r.left)/r.width*N))))};
sv.onpointerdown=e=>{sv.setPointerCapture(e.pointerId);scrub(e);sv.onpointermove=scrub};
sv.onpointerup=sv.onpointercancel=()=>sv.onpointermove=null;
set(PEAK_I);
```
```css
.bar{transition:fill .18s var(--ez)}
.bv{font-size:8.5px;font-weight:550;transition:fill .15s var(--ez)}
.ax span{padding:2px 0;border-radius:6px;transition:color .15s var(--ez),background .15s var(--ez)}
.ax span.on{font-weight:650;color:var(--at);background:color-mix(in srgb,var(--a) 12%,transparent)}
.ro{display:flex;align-items:center;justify-content:space-between}
.ro b{font-size:1.5rem;font-weight:750;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.chip{font-size:.68rem;font-weight:650;padding:3px 9px;border-radius:7px;font-variant-numeric:tabular-nums}
.cup{background:color-mix(in srgb,var(--up) 12%,transparent);color:var(--up)}
.cdn{background:color-mix(in srgb,var(--dn) 12%,transparent);color:var(--dn)}
```

`--up:light-dark(#15803d,#4ade80);--dn:light-dark(#b91c1c,#f87171)` join `:root`. The avg dashed line + ONE-accent-default rules still apply (default focus = the bar you'd have highlighted statically).
