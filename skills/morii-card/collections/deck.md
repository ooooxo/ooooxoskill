# Broadcast deck — 3–5 精选; 一条一张子卡, 横扫吸附 (the ONLY sanctioned horizontal scroll)

Read with `COLLECTIONS.md` router (shared classes `.ds/.dq/.tag` + substance rules live there). **Next tool call after the reads = the Write.**

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
