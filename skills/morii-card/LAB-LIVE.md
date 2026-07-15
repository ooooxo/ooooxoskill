# LAB mode & LIVE channel — load on demand

Read this only when (a) you're about to answer an "取决于参数/场景" question and want to offer a hands-on experiment, or (b) a rendered card needs clicks to reach the agent. Otherwise skip — it's not part of the common path.

## LAB (interactive experiment card) — propose-first

For questions where the honest text answer is "看情况 / 取决于参数" — offer a hands-on lab instead of more prose.

**Propose only when all three hold:**
1. The answer genuinely depends on scenario/parameters (you caught yourself writing 取决于 / trade-off / 一般来说).
2. The behavior reproduces faithfully in ONE offline file — algorithms, CSS/interaction effects, geometry/physics, parameter curves. No backend, network, or real data.
3. ≥1 user-manipulable variable yields insight prose can't: draw the obstacles, drag the slider, move the mouse. 30 seconds hands-on beats three paragraphs.

**Never** for fact lookups, single-answer questions, behavior needing a real environment (network latency, GPU perf), or mid coding/debug. ONE proposal per topic; a no is final.
**How**: finish the normal answer, append ONE quantified line — 「可出一张可操作实验卡：画障碍实测 A*/Dijkstra/Greedy 三种寻路，要吗?」. Build only on yes. Explicit demo asks ("做个 demo 让我试") skip the question.
**Anatomy**: live readout stat row → full-width stage (`cursor:crosshair`, `touch-action:none`, hint line allowed) → comparison bar/readout → reset button + ONE caption of instructions. Controls = segmented pills / sliders beside the stage.
**Rule deltas from data cards**: no data-collection step (define variables, map each to a control) · runtime loops allowed (rAF is the simulation; entrance still `--ez`) · stage geometry may change (it IS the experiment) · compared modes take versus hues. Everything else holds — **read SNIPPETS.md before the Write, build on its skeleton**, neutral page bg, design-token vars, one accent, graphic-first, ≥1 real interaction. The generic AI-demo look (gradient page bg, white rounded container, loose multiline CSS) is a violation, not a style. No emoji, real handlers, light-dark, `tabular-nums`, single file.

## LIVE channel (回传通道) — clicks reach the agent

A cross-mode affordance, NOT a mode. Open ONLY in interactive sessions (background/scheduled/subagent: never — nobody to wake) AND only when the card carries real substance: a data card holding more than its face shows (drill), a LAB running multi-round, or a **selection card** whose option rows each carry judgment-worthy content (§Selection below). Simple questions stay plain text — a yes/no, ≤3 options, or any choice needing no per-item evidence NEVER justifies a card.

- **Preflight (gate)**: ONE foreground Bash (below, copy exact) checks python3 exists AND the port binds. `LIVE_NO` → ship no live markup at all. Once per session: reuse the verdict, fresh port each card.
- **Mechanism**: after `LIVE_OK`, before the Write, start the one-shot listener (below, copy exact) via Bash `run_in_background` — port 20000–40000, same port in the card's `live()` helper. Listener dies early → treat clicks as never coming; the card's clipboard fallback still works. Max ONE open listener.
- **Card side** (below): `live(v)` = no-cors GET beacon; on reject → clipboard fallback + echo; affordance disables after send.
- **Sanctioned uses**: drill row 「深入」 sending `detail:<topic>` only when you hold more data than the face shows · LAB multi-round (Monitor variant, persistent loop, TaskStop when done) · **Selection card** (below) when your next step depends on the user's choice/judgment over many items.

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
