# Multi-Card Index — collection navigator · load on demand

Every card stays its own self-contained `.html`; **one navigation shell `ViewCard/index.html`** (sidebar: search + tag filter + 今天/本周/更早 grouping; main: iframe + ≥25-card overview grid) collects them. Pure `file://`, zero deps, offline. A server belongs only to SERVE, never to this navigator. Every data card joins — card 1 included (a one-card index is correct); SERVE live-task cards never join.

## Flow per card — write meta, run ONE command

1. **Write the card** with a self-describing block in `<head>` after `<title>` (the card is the source of truth; the index is disposable):

   ```html
   <script id="card-meta" type="application/json">{"t":"睡眠 7 天","g":"睡眠","v":"6.8h","s":"工作日普遍不足 7 小时","d":"2026-06-29"}</script>
   ```

2. ```bash
   node "<this skill dir>/assets/morii-index.mjs" add ViewCard/<topic>-card.html --open   # interactive
   node "<this skill dir>/assets/morii-index.mjs" add ViewCard/<topic>-card.html          # background: report printed URL
   ```

The script owns everything — shell copy (never overwrites an existing index), row upsert keyed by filename (idempotent), quote-safe serialization, parse validation (a bad row can't white-screen), concurrent-run lock, HUE auto-color for new tags, and a cache-busted `file://…?r=<ts>#<card>` deep-link so an already-open index tab never shows a stale list. **Never hand-edit `index.html` when node is available.** Subagents never run it — the main thread does, after any merge.

### Meta fields (+ filename `f`, added by the script)

| Key | Meaning | Example |
|-----|---------|---------|
| `t` | title ≤10 chars | `"睡眠 7 天"` |
| `g` | tag (single; drives filter + dot color) | `"睡眠"` |
| `v` | headline value on the grid, ≤8 chars (optional) | `"6.8h"` |
| `s` | one-line summary ≤16 chars (searchable) | `"工作日普遍不足 7 小时"` |
| `d` | write date `YYYY-MM-DD` (omitted → file mtime) | `"2026-06-29"` |

Extra keys pass through (future sparkline `p:[…]`). `v` is plain text — the shell draws no chart from it (never fabricate). Filenames: ASCII/pinyin only; **recurring topics get a date suffix** (`sleep-0715-card.html`) — reusing a filename overwrites the old card's HTML forever (`add` warns, but by then it's gone).

### Rebuild (index lost / corrupted / cards moved in by hand)

```bash
node "<this skill dir>/assets/morii-index.mjs" rebuild ViewCard
```

Rescans every card's meta, regenerates the whole region newest→oldest; meta-less files (SERVE cards) skipped with a note.

### Fallback — node unavailable

In this exact order: ① `mkdir -p ViewCard && [ -f ViewCard/index.html ] || cp "<this skill dir>/assets/index-shell.html" ViewCard/index.html` ② one targeted Edit appending a single line between `/*CARDS-START*/` and `/*CARDS-END*/` — `{f:"sleep-card.html",t:"…",g:"…",v:"…",s:"…",d:"YYYY-MM-DD"},` (one object per line, trailing comma legal, double-quote values — a malformed line white-screens the index) ③ only after the Edit: `open "file://$(pwd)/ViewCard/index.html?r=$(date +%s)#<card-file>"` (absolute `file://` URL — bare relative + `#` makes macOS `open` fail silently; Linux `xdg-open … &`). Update before open, never the reverse.
