# Multi-Card Index — collection navigator · load on demand

When the user organizes material across several turns, don't leave them opening
N separate HTMLs. Every card stays its own self-contained `.html` (invariant #1
holds), plus **one navigation shell `index.html`**: a sidebar (search + tag
filter + 今天/本周/更早 grouping) and a main iframe — the selected card flips
inside the frame, `←/→` switches, the user never leaves the page.
**File-authoritative, NOT server-primary**: the shell runs pure `file://`, zero
deps, offline, shareable. A server belongs only to a SERVE live-task card and
has nothing to do with this navigator.

Read this only when folding cards into a collection.

## When (trigger)

- **Every data card runs the flow below** — no "which card number" check. Card
  1's index is just a one-card shell (harmless); consecutive 整理资料 naturally
  accumulate into a collection.
- A SERVE live-task card stays single-file, never joins the collection.

## Flow per card — ONE command, `assets/morii-index.mjs`

All index bookkeeping (shell copy, row insert/update, validation, opening) is
owned by the script. You never `cp` the shell or hand-Edit `index.html` when
node is available — the old manual flow caused ordering bugs (index opened
before it was updated → stale tab showing no new card).

1. **Write the card** `ViewCard/<topic>-card.html` — an ordinary self-contained
   MoriiCard, full `SKILL.md` rules, nothing compromised for the shell (it must
   work opened alone). **Also write a self-describing block** in `<head>` (after
   `<title>`) — the card is the **source of truth** for its metadata:

   ```html
   <script id="card-meta" type="application/json">{"t":"睡眠 7 天","g":"睡眠","v":"6.8h","s":"工作日普遍不足 7 小时","d":"2026-06-29"}</script>
   ```

   `v` = the card's headline value (already computed while building it; the
   overview grid shows it). Filenames: ASCII / pinyin (`spending-card.html`),
   not CJK — keeps the `#<card-file>` hash route encoding-safe. **Recurring
   topics get a date suffix** (`sleep-0715-card.html`): reusing a filename
   OVERWRITES the old card's HTML forever — the index row gets replaced, the
   content is gone. `add` warns when it sees a same-filename different-title
   replacement, but by then the file is already overwritten; unique names are
   the only real guard.

2. **Index + open in one call** (the Bash step right after the Write):

   ```bash
   node "<this skill dir>/assets/morii-index.mjs" add ViewCard/<topic>-card.html --open   # interactive
   node "<this skill dir>/assets/morii-index.mjs" add ViewCard/<topic>-card.html          # background: report the printed URL
   ```

   `<this skill dir>` = the absolute path of the directory this file lives in.
   The script is idempotent — safe to re-run any time. It:

   - copies `assets/index-shell.html` → `ViewCard/index.html` **only if absent**
     (an existing index is never overwritten — user edits and accumulated
     `CARDS` stay safe);
   - reads the card's `card-meta` block and **upserts** one row in the
     `/*CARDS-START*/…/*CARDS-END*/` region, keyed by filename — re-running
     replaces the row, never duplicates it;
   - serializes values with `JSON.stringify` — apostrophes / quotes in titles
     and summaries can never white-screen the index;
   - **refuses to write** if the resulting region doesn't parse as a JS array;
   - auto-assigns a palette color to a tag the shell's `HUE` map doesn't know
     (stable hash, skips already-used colors) — no manual HUE edits ever;
   - holds a `.index.lock` around the read-modify-write, so concurrent `add`
     calls can't eat each other's rows (a stale lock >10s is stolen; if one is
     ever reported, delete it and re-run);
   - prints (and with `--open` opens) a **cache-busted deep-link**
     `file://…/index.html?r=<ts>#<card-file>`.

**Why the cache-buster matters**: reopening the *same* `index.html#…` URL in an
already-open tab fires only `hashchange` — the page does NOT reload, so its
in-memory `CARDS` array is stale and the new card silently fails to appear
(the classic bug this script exists to kill). The `?r=<timestamp>` makes every
open a fresh navigation → full reload → fresh `CARDS`. Belt-and-braces, the
shell also self-heals: a live tab receiving a hash it can't find in `CARDS`
reloads itself once (sessionStorage guard prevents loops).

The `CARDS` region stays the only thing that ever changes inside the shell;
never touch any other line, never rewrite the whole index by hand.

### CARDS row fields (= card-meta fields + filename `f`)

| Key | Meaning | Example |
|-----|---------|---------|
| `f` | card filename (same dir as index; added by the script) | `"sleep-card.html"` |
| `t` | title ≤10 chars | `"睡眠 7 天"` |
| `g` | tag (single; drives filter + group dot color) | `"睡眠"` |
| `v` | headline value, shown on the grid, ≤8 chars | `"6.8h"` / `"¥2,847"` / `"+14%"` |
| `s` | one-line summary ≤16 chars (searchable) | `"工作日普遍不足 7 小时"` |
| `d` | write date `YYYY-MM-DD` | `"2026-06-29"` |

`d` stores the date, not the bucket: the browser computes 今天/本周/更早 against
"now", so cards age automatically; within a group they sort newest→oldest. Use
the environment's current date for `d` (missing `d` → the script falls back to
file mtime). `v` is plain-text headline value — the shell **draws no chart**
from it (never fabricates data). A real sparkline per tile is a future upgrade
(add a real series `p:[…]` to card-meta; the script passes extra keys through);
the default is `v`-only.

### Rebuild (index lost / corrupted / cards moved in by hand)

```bash
node "<this skill dir>/assets/morii-index.mjs" rebuild ViewCard
```

Each card carries its card-meta block, so the index is disposable: rebuild
scans `ViewCard/*.html`, reads every block, and regenerates the whole `CARDS`
region sorted newest→oldest (files without card-meta, e.g. SERVE cards, are
skipped with a note). No server, no backup needed.

### Tag colors

The shell's top `HUE` map binds tag→dot color (财务 green / 睡眠 indigo / 天气
blue …). `add`/`rebuild` auto-extend it: an unknown tag gets a stable-hashed
color from a 12-color pool, skipping colors already in use — you never edit
`HUE` by hand. Neutral shell + per-card dot color → never a rainbow (invariant:
one accent per card, shell itself stays neutral).

## Open behavior

Interactive: `--open` on the `add` call (or `node … open ViewCard/<card>.html`
to re-open later without editing). Background/scheduled/subagent: no `--open` —
report the printed URL. Opened without a hash: `≥25 cards` lands on the
overview grid (easier to find), `<25` lands on the **newest** card.

The printed URL is always an **absolute `file://` URL** — a bare relative path
with `#` makes macOS `open` look for a literal file named `index.html#…`, find
none, and fail silently.

### Fallback — node unavailable

Only then, do it by hand, in this exact order: ①
`mkdir -p ViewCard && [ -f ViewCard/index.html ] || cp "<this skill dir>/assets/index-shell.html" ViewCard/index.html`
② one targeted Edit appending a single line between `/*CARDS-START*/` and
`/*CARDS-END*/` — `{f:"sleep-card.html",t:"睡眠 7 天",g:"睡眠",v:"6.8h",s:"…",d:"2026-06-29"},`
(one object per line, trailing comma legal — JS array, not JSON; double-quote
values, a malformed line white-screens the whole index) ③ **only after** the
Edit: `open "file://$(pwd)/ViewCard/index.html?r=$(date +%s)#<card-file>"`
(Linux: `xdg-open … &`). Update before open, never the reverse.

## Scale — built into the template, nothing extra to build

- Sidebar: search + tag filter chips + 今天/本周/更早 grouping.
- Main: a `概览 / 阅读` (overview/read) toggle top-right; **≥25 cards default to
  the overview grid** (each tile = dot + title + headline `v` + summary + tag +
  relative time), tap a tile to enter the iframe, `Esc` back to the grid.
- Search and tag filter both apply to grid and sidebar. All of this **lives in
  the template** — you write none of it; still just one `add` call per card.
