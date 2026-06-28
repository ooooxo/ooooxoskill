# SERVE mode — Live Task Card · load on demand

Read this only when you're about to produce a **Live Task Card**: a card whose
shell renders before its data exists and fills from a running task in real time,
then settles into an ordinary self-contained static MoriiCard. The fourth mode,
beside FAST / RICH / LAB. Transport rationale: `docs/adr/0001-*`. Vocabulary:
`CONTEXT.md`.

The contract that makes it work: **the card is a normal self-contained `.html`
with its snapshot embedded inline** (so `file://` always paints). A background
**Live Relay Server** serves it over a port, pushes updates via SSE, and writes
each update *back into that same file*. Live is an overlay, never a dependency —
kill the server and you keep a finished static card.

## When (trigger)

Offer-first, mirroring LAB:
- **Explicit** progress ask (「实时给我看进度」「边跑边看」「做个进度卡」) → build directly, no question.
- **Ambient** long task (tests / build / deploy / scrape / batch) in an **interactive** session → ONE plain line 「要开张实时进度卡边跑边看吗?」 → build on yes.
- **Fall back to a normal static card** (just render the final settled snapshot once) when ANY: background / scheduled / subagent (nobody watching) · task is seconds-short · preflight fails (no python3 / port taken). Same card shape, the live overlay is simply absent.

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
3. **Save the relay** — write the `relay.py` below to the scratchpad (it is
   plumbing, not the artifact). Copy it EXACT.
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

## Relay server — copy EXACT (stdlib only, `ThreadingHTTPServer`)

```python
import sys, json, threading, queue, re
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

PORT = int(sys.argv[1]); CARD = sys.argv[2]
state = {"phase": "pending"}
lock = threading.Lock()
clients = []                      # list[queue.Queue]
clients_lock = threading.Lock()
MARK = re.compile(r'(<script id="state"[^>]*>)(.*?)(</script>)', re.S)

def write_through(snap):
    try:
        with open(CARD, "r", encoding="utf-8") as f: html = f.read()
        html = MARK.sub(lambda m: m.group(1) + snap + m.group(3), html, count=1)
        with open(CARD, "w", encoding="utf-8") as f: f.write(html)
    except Exception: pass

def merge(patch):
    with lock:
        for k in ("phase","title","sections","outcome","note","headline","progress"):
            if k in patch: state[k] = patch[k]
        if "units" in patch: state["units"] = patch["units"]
        if "unit" in patch:
            u = patch["unit"]; arr = state.setdefault("units", [])
            for i, x in enumerate(arr):
                if x.get("id") == u.get("id"): arr[i] = {**x, **u}; break
            else: arr.append(u)
        if "metrics" in patch: state["metrics"] = patch["metrics"]
        if "metric" in patch:
            mt = patch["metric"]; arr = state.setdefault("metrics", [])
            for i, x in enumerate(arr):
                if x.get("label") == mt.get("label"): arr[i] = {**x, **mt}; break
            else: arr.append(mt)
        snap = json.dumps(state, ensure_ascii=False)
    write_through(snap)
    with clients_lock:
        for q in list(clients): q.put(snap)
    return snap

class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def _cors(self): self.send_header("Access-Control-Allow-Origin", "*")
    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/events":
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream")
            self.send_header("Cache-Control", "no-cache"); self._cors(); self.end_headers()
            q = queue.Queue()
            with clients_lock: clients.append(q)
            with lock: snap = json.dumps(state, ensure_ascii=False)
            try:
                self.wfile.write(f"data: {snap}\n\n".encode()); self.wfile.flush()
                while True:
                    try: msg = q.get(timeout=15)
                    except queue.Empty:
                        self.wfile.write(b": ping\n\n"); self.wfile.flush(); continue
                    self.wfile.write(f"data: {msg}\n\n".encode()); self.wfile.flush()
            except Exception: pass
            finally:
                with clients_lock:
                    if q in clients: clients.remove(q)
            return
        if path in ("/", "/" + CARD.replace("\\", "/").split("/")[-1]):
            try:
                with open(CARD, "rb") as f: body = f.read()
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8"); self._cors(); self.end_headers()
                self.wfile.write(body)
            except Exception:
                self.send_response(404); self.end_headers()
            return
        self.send_response(404); self.end_headers()
    def do_POST(self):
        if urlparse(self.path).path == "/push":
            n = int(self.headers.get("Content-Length", 0) or 0)
            try: patch = json.loads(self.rfile.read(n) or b"{}")
            except Exception: patch = {}
            merge(patch)
            self.send_response(204); self._cors(); self.end_headers()
            return
        self.send_response(404); self.end_headers()

ThreadingHTTPServer.daemon_threads = True
srv = ThreadingHTTPServer(("127.0.0.1", PORT), H)
print(f"SERVE_OK :{PORT}", flush=True)
srv.serve_forever()
```

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
