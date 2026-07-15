# List ↔ detail — 6+ items (rows fill + swap to a full detail view)

Composite pattern: **read `collections/deck.md` in the same message** — the detail view (`dk`/`dv` swap, `.bkb` return, point rows + quote) is reused verbatim from the deck; only the face differs (rows instead of a horizontal strip). **Next tool call after the reads = the Write.**

Row = the accordion header minus the expanding body: number tile + full headline + meta, chevron-RIGHT (navigates, doesn't fold), whole row taps.

```html
<article class="li" role="button" tabindex="0"><span class="ano">1</span>
  <span class="aht"><b>完整标题,可换两行</b><span class="cap">来源 · 时间</span></span>
  <svg class="chev" width="12" height="12" viewBox="0 0 12 12"><path d="M4.5 3 7.5 6 4.5 9" style="fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round"/></svg></article><!-- ×N -->
<style>
.li{display:flex;align-items:flex-start;gap:10px;padding:13px 0;cursor:pointer}
.li+.li{border-top:1px solid var(--hl)}
.li:hover .aht b{color:var(--at)}
.li:active{transform:scale(.985)}
.ano{flex:none;width:26px;height:26px;border-radius:8px;background:color-mix(in srgb,var(--a) 11%,transparent);color:var(--at);font-size:.72rem;font-weight:700;display:grid;place-items:center}
.aht{flex:1;display:flex;flex-direction:column;gap:3px}
.aht b{font-size:.88rem;font-weight:650;line-height:1.45;transition:color .15s var(--ez)}
.chev{flex:none;margin-top:5px;color:var(--fnt)}
</style>
<script>
// ND same shape as deck; row click = the deck story's onclick body (fill dv*, hide list wrap, show #dv)
document.querySelectorAll('.li').forEach((r,i)=>r.onclick=()=>showDetail(ND[i]));
</script>
```

`showDetail(n)` = the deck `a.onclick` body verbatim (fill `dvm/dvt/dvs/dve/dvp/dvq`, toggle `hidden` on the list wrapper + `#dv`). Back button returns to the list. 20+ items → group with sticky faint date/theme headers, or route to tabs.
