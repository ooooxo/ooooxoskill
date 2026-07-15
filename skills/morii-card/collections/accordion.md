# Accordion — 4–8 items, one theme (single-open, whole row taps)

Read with `COLLECTIONS.md` router (shared classes `.ds/.dq/.tag` + substance rules live there). **Next tool call after the reads = the Write.**

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
