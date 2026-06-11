# Content collection layouts — router + patterns

Read WITH SNIPPETS.md at write time ONLY when the card is a content collection (3+ news/article/post/release items). Patterns pre-verified — copy, don't re-derive. **Next tool call after this Read = the Write.**

Per-item substance is DATA (budget exempt): full headline + 2–4句 summary (substance allows 3–5句 — fuller beats thinner) + meta (来源 · 时间); quote / extra paragraphs / key figures live in the item's detail layer. Headlines never timid: ≥.88rem/650 in lists, 1.05rem/750 on deck cards & detail views; body drops to `--mut` `line-height:1.7` — hierarchy by contrast. Route by shape:

- 3–5 items 精选/播报 → **broadcast deck** (below)
- 4–8 items, one theme → **accordion**, single-open (below)
- 6+ items → **list ↔ detail**: rows = accordion header minus chevron-down (use chevron-right, no `.ab`); tap fills + swaps to the same detail view as the deck (`dk`/`dv` mechanics unchanged)
- >2 themes → segmented tabs (label = `主题 · 条数`), 2–3 full-summary `.di` items per tab
- 详细/完整/全文 ask → flat `.di` list, summaries fully expanded, nothing folded

Tap target = the WHOLE story card / row (`role="button"`, `tabindex="0"`, `cursor:pointer`, hover inset accent ring, active `scale(.985)`) — never a small link. Back/return affordance sits at the END of detail content (post-read flow), full-width inset button — never top-corner only. Collection cards still open with a graphic zone (item count · 来源数 · topic ratio bar); sources follow the citations pattern. Shared classes:

```css
.ds{font-size:.85rem;line-height:1.7}.ds+.ds{margin-top:8px}
.dq{background:var(--inset);border-radius:10px;padding:11px 13px;margin-top:10px;font-size:.79rem;line-height:1.6;color:var(--mut)}
.tag{display:inline-block;font-size:.62rem;font-weight:650;padding:2px 8px;border-radius:6px;background:color-mix(in srgb,var(--a) 11%,transparent);color:var(--at)}
```

## Broadcast deck (3–5 精选;一条一张子卡,横扫吸附 — the ONLY sanctioned horizontal scroll)

```html
<div id="dk"><div class="hd2"><span class="lb">今日播报 · 4条</span><span class="cap tn" id="hc">1 / 4</span></div>
<div class="strip" id="st"></div><div class="dots" id="dts"></div></div>
<div id="dv" hidden>
  <div class="cap" id="dvm"></div><h3 class="dt" id="dvt"></h3>
  <p class="ds" id="dvs" style="margin-top:10px"></p><p class="ds" id="dve"></p>
  <div id="dvp" style="margin-top:10px"><!-- point rows --></div>
  <blockquote class="dq" id="dvq"></blockquote>
  <button class="bkb" id="bk"><svg width="10" height="10" viewBox="0 0 10 10"><path d="M6.5 2 3.5 5 6.5 8" style="fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round"/></svg>返回播报</button>
</div>
<style>
.hd2{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
.tn{font-variant-numeric:tabular-nums}
.strip{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;overscroll-behavior-x:contain;scrollbar-width:none;margin:0 -24px;padding:4px 24px}
.strip::-webkit-scrollbar{display:none}
.story{flex:0 0 88%;scroll-snap-align:center;background:var(--inset);border-radius:14px;padding:16px 16px 13px;display:flex;flex-direction:column;cursor:pointer;transition:box-shadow .15s var(--ez)}
.story:hover{box-shadow:inset 0 0 0 1.5px color-mix(in srgb,var(--a) 38%,transparent)}
.story:active{transform:scale(.985)}
.shl{font-size:1.05rem;font-weight:750;line-height:1.4;letter-spacing:-.015em;color:var(--ink);margin:11px 0 9px}
.sds{font-size:.82rem;line-height:1.7;color:var(--mut)}
.smeta{display:flex;align-items:center;justify-content:space-between;margin-top:auto;padding-top:12px}
.go{display:inline-flex;align-items:center;gap:4px;font-size:.72rem;font-weight:650;color:var(--at)}
.dots{display:flex;gap:6px;justify-content:center;margin-top:12px}
.dots i{width:6px;height:6px;border-radius:99px;background:var(--hl);transition:background .2s,transform .2s}
.dots i.on{background:var(--a);transform:scale(1.25)}
.dt{font-size:1.08rem;font-weight:750;line-height:1.42;letter-spacing:-.015em;margin-top:8px}
.bkb{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;border:0;background:var(--inset);border-radius:11px;padding:13px;font-size:.8rem;font-weight:650;color:var(--ink);cursor:pointer;margin-top:16px;min-height:46px;font-family:inherit;transition:box-shadow .15s var(--ez)}
.bkb:hover{box-shadow:inset 0 0 0 1.5px var(--a)}.bkb:active{transform:scale(.97)}
</style>
<script>
// ND=[{t,s,m,sum,ext,pts:[[k,v]…],q}…]; $=id=>document.getElementById(id)
ND.forEach((n,i)=>{const a=document.createElement('article');a.className='story';
  a.tabIndex=0;a.setAttribute('role','button');
  a.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center"><span class="tag">'+n.s+'</span><span class="cap" style="font-size:.68rem">'+n.m+'</span></div>'
  +'<b class="shl">'+n.t+'</b><p class="sds">'+n.sum+'</p>'
  +'<div class="smeta"><span class="cap tn" style="font-size:.68rem">'+(i+1)+' / '+ND.length+'</span><span class="go">深读要点<svg width="10" height="10" viewBox="0 0 10 10"><path d="M3.5 2 6.5 5 3.5 8" style="fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round"/></svg></span></div>';
  a.onclick=()=>{$('dvm').textContent=n.s+' · '+n.m;$('dvt').textContent=n.t;
    $('dvs').textContent=n.sum;$('dve').textContent=n.ext;$('dvq').textContent=n.q;
    $('dvp').innerHTML=n.pts.map(p=>'<div class="pt"><span class="dot"></span><b>'+p[0]+'</b><span class="ev" style="color:var(--ink);font-weight:650">'+p[1]+'</span></div>').join('');
    $('dk').hidden=true;$('dv').hidden=false};
  st.appendChild(a);
  const d=document.createElement('i');if(!i)d.className='on';dts.appendChild(d)});
st.addEventListener('scroll',()=>{const c=st.children,step=c[1].offsetLeft-c[0].offsetLeft,
  i=Math.max(0,Math.min(ND.length-1,Math.round(st.scrollLeft/step)));
  [...dts.children].forEach((d,j)=>d.classList.toggle('on',j===i));
  $('hc').textContent=(i+1)+' / '+ND.length},{passive:true});
$('bk').onclick=()=>{$('dv').hidden=true;$('dk').hidden=false};
</script>
```

Story height is free — taller beats thinner, content decides; the strip aligns to the tallest. Detail = face summary + extension para + point-fact rows (reuse the Point row atom, value ink/650) + quote + `.bkb` return. Counter + dots both track scroll. `margin:0 -24px;padding:4px 24px` matches card padding — adjust if padding differs.

## Accordion (4–8 items, one theme — single-open, whole row taps)

```html
<article class="ai"><button class="ah" aria-expanded="false"><span class="ano">1</span>
  <span class="aht"><b>完整标题,可换两行</b><span class="cap">来源 · 时间</span></span>
  <svg class="chev" width="12" height="12" viewBox="0 0 12 12"><path d="M3 4.5 6 7.5 9 4.5" style="fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round"/></svg></button>
<div class="ab" hidden><p class="ds">2–4句摘要…</p><blockquote class="dq">「摘抄」</blockquote></div></article><!-- ×N -->
<style>
.ai+.ai{border-top:1px solid var(--hl)}
.ah{display:flex;align-items:flex-start;gap:10px;width:100%;text-align:left;border:0;background:none;padding:13px 0;cursor:pointer;color:var(--ink);font-family:inherit}
.ano{flex:none;width:26px;height:26px;border-radius:8px;background:color-mix(in srgb,var(--a) 11%,transparent);color:var(--at);font-size:.72rem;font-weight:700;display:grid;place-items:center}
.aht{flex:1;display:flex;flex-direction:column;gap:3px}
.aht b{font-size:.88rem;font-weight:650;line-height:1.45}
.chev{flex:none;margin-top:5px;color:var(--fnt);transition:transform .2s var(--ez)}
.ab{padding:0 0 14px 36px}
</style>
<script>
const ais=[...document.querySelectorAll('.ai')];
ais.forEach(a=>{const h=a.querySelector('.ah'),b=a.querySelector('.ab'),c=a.querySelector('.chev');
  h.onclick=()=>{const opening=b.hidden;
    ais.forEach(x=>{x.querySelector('.ab').hidden=true;x.querySelector('.chev').style.transform='';
      x.querySelector('.ah').setAttribute('aria-expanded','false')});
    if(opening){b.hidden=false;c.style.transform='rotate(180deg)';h.setAttribute('aria-expanded','true')}}});
ais[0].querySelector('.ah').click();
</script>
```

## Flat digest item `.di` (tab panels / 全铺 lists)

```html
<article class="di"><b>完整标题</b><p class="ds">完整摘要,2–4句(料足 3–5句)。</p><div class="dm">来源 · 时间</div></article>
<style>.di{padding:13px 0}.di+.di{border-top:1px solid var(--hl)}
.di>b{display:block;font-size:.88rem;font-weight:650;line-height:1.45;margin-bottom:4px}
.dm{font-size:.68rem;color:var(--fnt);margin-top:6px}</style>
```
