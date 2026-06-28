# Multi-Card Index — collection navigator · load on demand

When the user organizes material across several turns, don't leave them opening
N separate HTMLs. Every card stays its own self-contained `.html` (invariant #1
holds), plus **one navigation shell `index.html`**: a sidebar (search + tag
filter + 今天/本周/更早 grouping) and a main iframe — the selected card flips
inside the frame, `←/→` switches, the user never leaves the page.
**File-authoritative, NOT server-primary**: the shell runs pure `file://`, zero
deps, offline, shareable. A server belongs only to a SERVE live-task card and
has nothing to do with this navigator.

Read this only when folding cards into a collection. Design settled in a
grilling session.

## When (trigger)

- **Creating `ViewCard/` also drops the shell**: `mkdir -p ViewCard` copies
  `index.html` in (skipped if present, see below). From card 1 there's an index;
  every later card auto-appears in the sidebar.
- So **every data card runs the flow below** — no "which card number" check.
  Card 1's index is just a one-card shell (harmless); consecutive 整理资料
  naturally accumulate into a collection.
- A SERVE live-task card stays single-file, never joins the collection.

## Shell template — copy-exact, never re-author (like relay.py)

Template: `assets/index-shell.html`. **Copy the whole file** to
`ViewCard/index.html`; you **never hand-write or edit the shell code**. The only
thing that ever changes is the `CARDS` marker block inside it.

**Standard `ViewCard/` setup** (run this once per data card, idempotent):

```bash
mkdir -p ViewCard && [ -f ViewCard/index.html ] || cp "<this skill dir>/assets/index-shell.html" ViewCard/index.html
```

`[ -f … ] ||` guarantees an **existing index is skipped, never overwritten**
(user edits and accumulated `CARDS` stay safe). `<this skill dir>` = the
absolute path of the directory this file lives in.

## Two steps per card

1. **Write the card** `ViewCard/<topic>-card.html` — an ordinary self-contained
   MoriiCard, full `SKILL.md` rules, nothing compromised for the shell (it must
   work opened alone). **Also write a self-describing block** in `<head>` (after
   `<title>`) — the card is the **source of truth** for its metadata:

   ```html
   <script id="card-meta" type="application/json">{"t":"睡眠 7 天","g":"睡眠","v":"6.8h","s":"工作日普遍不足 7 小时","d":"2026-06-29"}</script>
   ```

   `v` = the card's headline value (already computed while building it; the
   overview grid shows it).
2. **Append one line** — a single targeted Edit between `/*CARDS-START*/` and
   `/*CARDS-END*/`, values **copied straight from the card-meta block** (don't
   re-invent them → no drift):

```js
{f:'sleep-card.html',t:'睡眠 7 天',g:'睡眠',v:'6.8h',s:'工作日普遍不足 7 小时',d:'2026-06-29'},
```

`CARDS` is a **JS array (not JSON)**: trailing commas are legal, so inserting a
line never breaks syntax — no "last line can't have a comma" bookkeeping.
**Never rewrite the whole index** (it clobbers user edits and wastes tokens).
`file://` blocks `fetch`/ES-module import, so the data must be inlined in the
shell — it can't live in an external json or `.mjs`; the card-meta block is the
**copy source at write time**, not a runtime read of the card.

**Append discipline — a malformed line white-screens the whole index** (a JS
syntax error throws at parse, before any try/catch). So:
- If a value contains `'`, switch that one value to a `"…"` string (or drop the
  apostrophe). Never leave an unescaped `'` inside a `'…'` string.
- Filenames `f`: use ASCII / pinyin (`spending-card.html`), not CJK — keeps the
  `#<card-file>` hash route encoding-safe.
- One object per line, trailing comma, only inside the marker region. Don't touch
  any other line of the shell.

### CARDS row fields (= card-meta fields + filename `f`)

| Key | Meaning | Example |
|-----|---------|---------|
| `f` | card filename (same dir as index) | `'sleep-card.html'` |
| `t` | title ≤10 chars | `'睡眠 7 天'` |
| `g` | tag (single; drives filter + group dot color) | `'睡眠'` |
| `v` | headline value, shown on the grid, ≤8 chars | `'6.8h'` / `'¥2,847'` / `'+14%'` |
| `s` | one-line summary ≤16 chars (searchable) | `'工作日普遍不足 7 小时'` |
| `d` | write date `YYYY-MM-DD` | `'2026-06-29'` |

`d` stores the date, not the bucket: the browser computes 今天/本周/更早 against
"now", so cards age automatically; within a group they sort newest→oldest. Use
the environment's current date for `d`. `v` is plain-text headline value — the
shell **draws no chart** from it (never fabricates data). A real sparkline per
tile is a future upgrade (add a real series `p:[…]`); the default is `v`-only.

### Rebuild (index lost / corrupted)

Each card carries its card-meta block → scan `ViewCard/*.html`, read each block,
and regenerate the whole `CARDS` marker region. No server, no backup needed.

### Tag colors

The shell's top `HUE` map binds tag→dot color (财务 green / 睡眠 indigo / 天气
blue …). Used a new tag? Add a line to `HUE` (a small Edit); if you don't, it
falls back to neutral gray, no error. Neutral shell + per-card dot color → never
a rainbow (invariant: one accent per card, shell itself stays neutral).

## Open — deep-link to the card just made

Interactive: **`open "file://$(pwd)/ViewCard/index.html#<card-file>"`** — a `file://`
**absolute** URL, never a bare relative path. The shell hash-routes straight to that
card's reading view (replaces the old `open <card>.html`: both direct AND inside the
collection). **Why the URL form is mandatory**: `open "ViewCard/index.html#foo"` makes
macOS look for a literal file named `index.html#foo` (the `#` is part of the path),
find none, and `|| true` swallows the error → nothing opens. The `file://` URL routes
it to the browser, which honors the `#` anchor. Example:

```bash
open "file://$(pwd)/ViewCard/index.html#sleep-card.html" 2>/dev/null || true   # macOS
xdg-open "file://$(pwd)/ViewCard/index.html#sleep-card.html" 2>/dev/null &     # Linux
```

Opened without a hash: `≥25 cards` lands on the overview grid (easier to find),
`<25` lands on the **newest** card. The shell listens for `hashchange`, so
reopening an already-open tab still jumps. Background/scheduled/subagent: don't
open, report the `ViewCard/index.html` path (may carry `#<card-file>`).

## Scale — built into the template, nothing extra to build

- Sidebar: search + tag filter chips + 今天/本周/更早 grouping.
- Main: a `概览 / 阅读` (overview/read) toggle top-right; **≥25 cards default to
  the overview grid** (each tile = dot + title + headline `v` + summary + tag +
  relative time), tap a tile to enter the iframe, `Esc` back to the grid.
- Search and tag filter both apply to grid and sidebar. All of this **lives in
  the template** — you write none of it; still just cp + append a line.
