# Citations — claim refs + SVG source marks (researched/sourced cards only)

Requires the overlay snippet (SNIPPETS.md core). **Next tool call after this Read = the Write.**

**Sources never sit on the card face** — faintest metadata tier. Card face gets at most ONE quiet affordance (the evidence-overlay button, or a faint `来源 ×n` micro-line opening the overlay). Inside the overlay: numbered evidence entries, then ONE compact SVG row of source marks.

**Claim ref** — tiny numbered index beside a point-row phrase/quote; accent-tinted by default (color = clickable), hover deepens + shows a "查看依据" tooltip, click opens the overlay. Index matches the overlay entry number. Refs rendered inside the overlay are inert markers (no tooltip, no pointer).

**Source marks** — one `<svg>`, letter-in-circle per source at `cx=14+34i` (NO external favicon services; offline). No tooltips, no hint text — hover fill + pointer is the affordance; click opens the site.

```html
<b>竞争压力<span class="ref" data-ov>2</span></b>
…overlay panel, after the numbered entries:
<div class="sl"><span class="lb" style="font-size:.64rem">来源</span>
  <svg class="sm" width="166" height="28"><!-- width = N*34 -->
    <a href="https://techcrunch.com/…" target="_blank" rel="noopener"><circle cx="14" cy="14" r="12"/><text x="14" y="18">T</text></a>
    <!-- ×N at cx 48,82,116,150… -->
  </svg></div>
<style>
.ref{display:inline-flex;align-items:center;justify-content:center;min-width:15px;height:15px;
  margin-left:4px;padding:0 3px;border-radius:5px;font-size:.6rem;font-weight:650;cursor:pointer;
  vertical-align:2px;position:relative;
  background:color-mix(in srgb,var(--a) 11%,transparent);color:var(--at);transition:background .15s}
.ref:hover{background:color-mix(in srgb,var(--a) 22%,transparent)}
.ref::after{content:"查看依据";position:absolute;bottom:calc(100% + 6px);left:50%;
  transform:translateX(-50%);padding:4px 8px;border-radius:6px;white-space:nowrap;
  background:var(--ink);color:var(--card);font-size:.62rem;font-weight:550;
  opacity:0;pointer-events:none;transition:opacity .15s}
.ref:hover::after{opacity:1}
.ov .ref{cursor:default}.ov .ref::after{display:none}
.sl{display:flex;align-items:center;gap:12px;margin-top:14px;padding-top:12px;border-top:1px solid var(--hl)}
.sm a{cursor:pointer}
.sm circle{fill:color-mix(in srgb,var(--a) 12%,transparent);transition:fill .15s}
.sm a:nth-of-type(even) circle{fill:color-mix(in srgb,var(--b) 12%,transparent)}
.sm text{font-size:11px;font-weight:700;fill:var(--at);text-anchor:middle}
.sm a:nth-of-type(even) text{fill:var(--bt)}
.sm a:hover circle{fill:var(--a)}
.sm a:nth-of-type(even):hover circle{fill:var(--b)}
.sm a:hover text{fill:var(--card)}
</style>
<script>document.querySelectorAll('[data-ov]').forEach(r=>r.onclick=e=>{e.stopPropagation();ov.classList.add('open')});</script>
```
