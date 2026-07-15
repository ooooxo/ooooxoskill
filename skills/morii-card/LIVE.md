# LIVE channel (回传通道) — clicks reach the agent · load on demand

A cross-mode affordance, NOT a mode (card→agent; the inverse of SERVE). Open ONLY in interactive sessions (background/scheduled/subagent: never — nobody to wake) AND only when the card carries real substance: a data card holding more than its face shows (drill), a LAB running multi-round, or a **selection card** whose option rows each carry judgment-worthy content (§Selection below). Simple questions stay plain text — a yes/no, ≤3 options, or any choice needing no per-item evidence NEVER justifies a card.

- **Preflight (gate)**: ONE foreground Bash (below, copy exact) checks python3 exists AND the port binds. `LIVE_NO` → ship no live markup at all. Once per session: reuse the verdict, fresh port each card.
- **Mechanism**: after `LIVE_OK`, before the Write, start the one-shot listener (below, copy exact) via Bash `run_in_background` — port 20000–40000, same port in the card's `live()` helper. Listener dies early → treat clicks as never coming; the card's clipboard fallback still works. Max ONE open listener.
- **Card side** (below): `live(v)` = no-cors GET beacon; on reject → clipboard fallback + echo; affordance disables after send.
- **Sanctioned uses**: drill row 「深入」 sending `detail:<topic>` only when you hold more data than the face shows · LAB multi-round (Monitor variant, persistent loop, TaskStop when done) · **Selection card** (below) when your next step depends on the user's choice/judgment over many items.

## LIVE code — copy exact

Preflight (one foreground Bash, once per session; reuse the verdict):

```bash
command -v python3 >/dev/null && python3 -c "import socket;s=socket.socket();s.bind(('127.0.0.1',PORT));s.close();print('LIVE_OK')" 2>/dev/null || echo LIVE_NO
```

Agent side — after `LIVE_OK`, start BEFORE the Write (Bash `run_in_background`; same PORT as preflight, embed it in the card):

```bash
python3 -c "
from http.server import BaseHTTPRequestHandler,HTTPServer
from urllib.parse import urlparse,parse_qs
class H(BaseHTTPRequestHandler):
    def do_GET(s):
        v=parse_qs(urlparse(s.path).query).get('c',[''])[0]
        s.send_response(204);s.send_header('Access-Control-Allow-Origin','*');s.end_headers()
        print('LIVE:'+v,flush=True)
    def log_message(*a):pass
srv=HTTPServer(('127.0.0.1',PORT),H);srv.timeout=600
srv.handle_request()"
```

One-shot: exits on first click → completion notification carries `LIVE:<value>`; empty output = timeout, user never clicked — say nothing. LAB multi-round: replace the last line with `while True: srv.handle_request()` and run under Monitor (persistent) — each click = one event; TaskStop when done.

Card side — drill affordance + beacon + clipboard fallback:

```html
<button class="drill" data-v="detail:渠道明细"><!--SVG-->深入 · 渠道明细</button>
<div class="cap" id="echo"></div>
<style>
.drill{display:inline-flex;align-items:center;gap:7px;border:0;border-radius:10px;padding:8px 14px;min-height:44px;cursor:pointer;font-size:.76rem;font-weight:600;background:var(--inset);color:var(--mut);transition:box-shadow .15s var(--ez)}
.drill:hover{box-shadow:inset 0 0 0 1.5px var(--a)}
.drill:active{transform:scale(.96)}.drill:disabled{opacity:.4;cursor:default}
</style>
<script>
const PORT=24680;
const live=v=>{document.querySelectorAll('.drill').forEach(b=>b.disabled=true);
  fetch('http://127.0.0.1:'+PORT+'/?c='+encodeURIComponent(v),{mode:'no-cors'})
  .then(()=>{document.getElementById('echo').textContent='已发送 · agent 处理中'})
  .catch(()=>{navigator.clipboard?.writeText(v).catch(()=>{});
    document.getElementById('echo').textContent='通道已关 · 已复制「'+v+'」,回贴对话即可';
    document.querySelectorAll('.drill').forEach(b=>b.disabled=false)});};
document.querySelectorAll('.drill').forEach(b=>b.onclick=()=>live(b.dataset.v));
</script>
```

Swap `PORT` to the live listener's port. No channel open (`LIVE_NO` / background card) → don't render the drill affordance at all.

## Selection card (§Selection) — the user's judgment IS the data you need

Principle: when the agent's NEXT step depends on the user choosing / filtering / approving / ranking among **many** items (挑几篇深入 · 筛掉不要的候选 · approve/reject findings), a numbered prose list is the failure mode — render option rows the user taps, ONE submit beacons the picks back. **≤3 options or a yes/no → plain text question, never a card.** Needs an open LIVE channel (preflight above); `LIVE_NO` → clipboard fallback still works via `live()`.

Face rules: each option row = enough substance to judge (title + one evidence line + optional value), ≥44px tap target, whole row is the hit zone. Toggle feedback = tint + ring only (geometry frozen, invariant 2). Selected count lives on the submit button. Multi-select default; single-pick = radio behavior (new tap replaces).

```html
<div class="opt" data-id="p1"><b>标题</b><span class="cap">一句判断依据</span></div>
<!-- ×N -->
<button class="drill" id="sub" disabled>确认选择 · 0</button>
<style>
.opt{display:flex;flex-direction:column;gap:2px;min-height:44px;padding:10px 12px;border-radius:11px;cursor:pointer;transition:background .15s var(--ez),box-shadow .15s var(--ez)}
.opt:hover{background:var(--inset)}
.opt.on{background:color-mix(in srgb,var(--a) 9%,var(--card));box-shadow:inset 0 0 0 1.5px color-mix(in srgb,var(--a) 45%,transparent)}
</style>
<script>
const sel=new Set(),sub=document.getElementById('sub');
document.querySelectorAll('.opt').forEach(o=>o.onclick=()=>{const id=o.dataset.id;
  sel.has(id)?sel.delete(id):sel.add(id);o.classList.toggle('on',sel.has(id));
  sub.disabled=!sel.size;sub.textContent='确认选择 · '+sel.size;});
sub.onclick=()=>live('select:'+[...sel].join(','));
</script>
```

`live()` = the beacon helper above (same PORT). Completion notification carries `LIVE:select:p1,p3` → act on the picks. Timeout with no click → follow up in plain text, don't re-render.
