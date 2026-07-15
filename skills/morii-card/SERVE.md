# SERVE mode — Live Task Card · load on demand

Read this only when you're about to produce a **Live Task Card**: a card whose
shell renders before its data exists and fills from a running task in real time,
then settles into an ordinary self-contained static MoriiCard. The fourth mode,
beside FAST / RICH / LAB.

The contract that makes it work: **the card is a normal self-contained `.html`
with its snapshot embedded inline** (so `file://` always paints). A background
**Live Relay Server** serves it over a port, pushes updates via SSE, and writes
each update *back into that same file*. Live is an overlay, never a dependency —
kill the server and you keep a finished static card.

## When (trigger)

The decision already happened upstream — SKILL.md scenario rows ①③④⑤ (principle: state evolves observably + viewer present + outlasts a few seconds; tests/evals & `/loop` auto-fire, explicit asks build directly, other long tasks offer first). Two build-time rules remain here:

- **`/loop` reuses ONE card** across iterations (re-seed + patch, never a new card per tick), and counts as **watched**, never headless.
- **Fall back to a normal static card** (render the final settled snapshot once) ONLY when ANY: preflight fails (no python3 / port taken) · task is seconds-short · truly headless run with no viewer (scheduled / cron / subagent — a `/loop` does NOT count). Same card shape, the live overlay is simply absent.

## Lifecycle

`pending` (shell up, structure declared, no values) → `streaming` (task running, patches arriving) → `settled` (done; outcome locked; server exits; card stays static).

## State snapshot — the one shape (embedded = SSE payload = source of truth)

```jsonc
{
  "phase":   "pending | streaming | settled",
  "title":   "运行测试套件",
  "sections":["progress","units","metrics"],   // declared in the FIRST push — fixes layout, no reflow
  "outcome": "running | success | failure | partial",   // drives settled accent (success 绿 / failure 红 = real threshold)
  "progress":{ "done": 47, "total": 120 },      // total:null → indeterminate (shimmer ring)
  "headline":{ "value": 47, "unit": "/120", "label": "通过" },   // the ONE focal atom
  "units":   [ {"id":"t47","label":"login_test","state":"pending|running|pass|fail|skip","detail":"…"} ],
  "metrics": [ {"label":"耗时","value":"12.4s","delta":"-1.2s"} ],
  "note":    "登录模块 2 例失败"                  // optional insight line
}
```

The agent sends **patches** (small); the server holds the authoritative **full**
snapshot and emits **full** on every SSE message + write-through. Patch keys:
- `phase` `title` `sections` `outcome` `note` `headline` `progress` → shallow replace.
- `unit` (single `{id,…}`) → upsert into `units[]` by `id`. `units` (array) → replace whole.
- `metric` (single `{label,…}`) → upsert into `metrics[]` by `label`. `metrics` (array) → replace.

## Visual is free — SERVE fixes the mechanism, not the look

The schema is a *data contract*, not a layout. Pick layout + chart + accent by
the task's data shape via the normal `SKILL.md` tables, exactly like any card.
A progress-ring + unit list is ONE pick (test runs); it is not a template:
build → phase strip + log tail; scrape → live throughput spark + count waffle;
train → loss line draw-in. `units` may render as rows / dots / waffle / strip;
`progress` as ring / bullet / bar; a task may skip `units` and stream only
`metrics` + `note`. Encode `state` with the sanctioned semantic colors
(pass 绿 / fail 红 / running accent / skip muted), everything else is your call
under the usual morii floor. The only SERVE-specific visual rules are the motion
deltas below.

## Agent protocol (per run)

1. **Preflight** — one foreground Bash; pick a fresh port 20000–40000:
   ```bash
   command -v python3 >/dev/null && python3 -c "import socket;s=socket.socket();s.bind(('127.0.0.1',PORT));s.close();print('SERVE_OK')" 2>/dev/null || echo SERVE_NO
   ```
   `SERVE_NO` → fall back to a normal static card, ship no live markup.
2. **Write the card** `<topic>-card.html` to cwd — skeleton + the embedded
   snapshot block + the boot snippet (below). The embedded snapshot IS the
   initial `pending` state (declares `sections`, known values, placeholders).
3. **Copy the relay** — never transcribe it by hand:
   ```bash
   cp "<this skill dir>/assets/relay.py" <scratch>/relay.py
   ```
4. **Start the relay** in background:
   `python3 <scratch>/relay.py PORT <abs path to card.html>` — wait for the
   `SERVE_OK :PORT` line.
5. **Seed** — POST the same initial `pending` snapshot so server state matches
   the embedded one (so an early browser connect doesn't see a barer state):
   ```bash
   curl -s -X POST 127.0.0.1:PORT/push -H 'Content-Type: application/json' --data-binary @<scratch>/seed.json >/dev/null
   ```
6. **Open** `open "http://127.0.0.1:PORT/<topic>-card.html"` (served over http →
   same-origin SSE, no CORS). NEVER open the `file://` path while live — that one
   is the degraded fallback.
7. **Run the task** `Bash(run_in_background)`. On each output wake: parse
   progress, POST a patch per change. Construct JSON carefully; for labels with
   quotes write the patch to a temp file and `--data-binary @file`:
   ```bash
   curl -s -X POST 127.0.0.1:PORT/push -H 'Content-Type: application/json' \
     -d '{"phase":"streaming","unit":{"id":"t47","label":"login_test","state":"pass"},"progress":{"done":47,"total":120},"headline":{"value":47,"unit":"/120","label":"通过"}}' >/dev/null
   ```
8. **Settle** — final patch `{"phase":"settled","outcome":"success|failure|partial", …}`. Server writes the final HTML.
9. **Teardown** — `TaskStop` the relay. The card's EventSource sees `settled` (or the stream end) and stays a finished static card.

## Relay server

Lives at `assets/relay.py` (stdlib only, `ThreadingHTTPServer`). Endpoints:
`GET /<card>.html` serves the card · `GET /events` SSE full-snapshot stream
(15s keepalive pings) · `POST /push` merges a patch, write-throughs the
embedded `<script id="state">` block in the card file, and broadcasts. Copy it
(step 3), never re-author or transcribe it.

## Card boot — copy EXACT, then write your own `render(s)`

The snapshot lives inline; the card paints from it first, then upgrades to live
if the server answers. Same-origin `/events` (no port hardcoded). `render(s)` is
card-specific — it maps the snapshot onto YOUR graphics (ring, unit rows, stat
row), following all normal morii rules (graphics carry data, one focal point,
one-shot motion + the single sanctioned liveness cue).

```html
<script id="state" type="application/json">{"phase":"pending","title":"…","sections":["progress","units"],"progress":{"done":0,"total":null}}</script>
<script>
let S = {}; try { S = JSON.parse(document.getElementById('state').textContent || '{}'); } catch (e) {}
function render(s){ /* patch DOM from s — YOUR card's graphics. Never reload. */ }
render(S);
try {
  const es = new EventSource('/events');           // same-origin when served live
  es.onmessage = e => { try { S = JSON.parse(e.data); render(S); } catch (_) {} if (S.phase === 'settled') es.close(); };
  es.onerror   = () => es.close();                 // offline / static open → keep the embedded paint
} catch (e) {}
</script>
```

## Motion under live updates (the deltas from a static card)

- New unit rows **stagger in** (one-shot). State change (running→pass) = a ≤200ms dot crossfade. Headline **count-up** to each new value. Progress ring **grows** to each new value. All one-shot on `--ez`, never looping.
- Streaming append **may grow card height** — the sanctioned exception to frozen geometry (growth-on-data is the point). No reflow of already-placed atoms (that's why `sections` is declared up front).
- **Exactly ONE looping liveness cue**, semantic not decorative: a very restrained pulse on the *currently-running* unit dot, OR a shimmer on an indeterminate (`total:null`) ring. Stops the instant `settled`.
- `settled` = a one-shot resolve flourish: outcome color washes in, final count-up lands. Then the card is indistinguishable from any static MoriiCard.
- Interaction holds: tapping a failed unit opens its detail (overlay / accordion); a live patch must not yank an open overlay — patch its content if it's the same unit, otherwise leave it.

Everything else (untinted surfaces, one accent, no emoji, tabular-nums, valid in both themes, no number-walls) is exactly as `SKILL.md`.
