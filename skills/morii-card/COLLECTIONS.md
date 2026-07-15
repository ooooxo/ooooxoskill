# Content collection — router (3+ news/article/post/release items)

Layout code lives in `collections/<layout>.md` — **read ONLY the routed file(s)**, parallel with `SNIPPETS.md`. **Next tool call after the reads = the Write.**

## Route by shape

| Shape | Layout | Read |
|-------|--------|------|
| 3–5 items 精选/播报 | broadcast deck | `collections/deck.md` |
| 4–8 items, one theme | accordion, single-open | `collections/accordion.md` |
| 6+ items | list ↔ detail | `collections/list-detail.md` (+ `deck.md`, it reuses the detail view) |
| >2 themes | segmented tabs (label = `主题 · 条数`), 2–3 full-summary `.di` items per tab | `.di` below + SNIPPETS §Tabs |
| 详细/完整/全文 ask | flat `.di` list, summaries fully expanded, nothing folded | `.di` below |

## Substance & tap rules (all layouts)

Per-item substance is DATA (budget exempt): full headline + 2–4句 summary (substance allows 3–5句 — fuller beats thinner) + meta (来源 · 时间); quote / extra paragraphs / key figures live in the item's detail layer. Headlines never timid: ≥.88rem/650 in lists, 1.05rem/750 on deck cards & detail views; body drops to `--mut` `line-height:1.7` — hierarchy by contrast.

Tap target = the WHOLE story card / row (`role="button"`, `tabindex="0"`, `cursor:pointer`, hover inset accent ring, active `scale(.985)`) — never a small link. Back/return affordance sits at the END of detail content (post-read flow), full-width inset button — never top-corner only. Collection cards still open with a graphic zone (item count · 来源数 · topic ratio bar); sources follow `snippets/citations.md`.

## Shared classes (copy into any collection card)

```css
.ds{font-size:.85rem;line-height:1.7}.ds+.ds{margin-top:8px}
.dq{background:var(--inset);border-radius:10px;padding:11px 13px;margin-top:10px;font-size:.79rem;line-height:1.6;color:var(--mut)}
.tag{display:inline-block;font-size:.62rem;font-weight:650;padding:2px 8px;border-radius:6px;background:color-mix(in srgb,var(--a) 11%,transparent);color:var(--at)}
```

## Flat digest item `.di` (tab panels / 全铺 lists)

```html
<article class="di"><b>完整标题</b><p class="ds">完整摘要,2–4句(料足 3–5句)。</p><div class="dm">来源 · 时间</div></article>
<style>.di{padding:13px 0}.di+.di{border-top:1px solid var(--hl)}
.di>b{display:block;font-size:.88rem;font-weight:650;line-height:1.45;margin-bottom:4px}
.dm{font-size:.68rem;color:var(--fnt);margin-top:6px}</style>
```
