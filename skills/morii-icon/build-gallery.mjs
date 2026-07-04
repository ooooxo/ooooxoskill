// Morii filled-icon style — live design server + static self-check builder.
// This file holds NO icon data. It READS the project's real icon registry (the single
// source of truth, SKILL §8) and renders it — so the review card is a live view of the
// actual file you ship, never a drifting copy. Output goes to the PROJECT dir, never here.
//
//   node build-gallery.mjs serve [source] [--port 4321] [--idle 60] [--out .] [--no-open]  # live card on a port (default; auto-opens the browser)
//   node build-gallery.mjs build [source]                          [--out .]  # one-shot static emit
//
//   source = path to the icon registry/draft. If omitted, autodetected in cwd; if none
//            exists, a starter draft `morii-icons.draft.js` is created in cwd.
//   --out  = where contactsheet.svg / -dark.svg / design-card.html land (default: cwd).
//   --idle = serve auto-exits this many seconds after the card is closed (0 = never).
//            So when you finish reviewing and close the tab, the server cleans itself up.
//
// Style law: solid, FULL, soft-rounded glyphs — fill the frame, single currentColor, flat,
// theme-robust. Mass = solid paths / fat rounded rects / circles, OR thick (≥3px) round
// strokes for line-glyphs. Detail = small knockout holes (fill-rule evenodd) / a tonal band.
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { watch } from 'node:fs';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { resolve, dirname, basename, join } from 'node:path';

// ───────────────────────── source registry → [{name, inner}] ─────────────────────────
// Reads the REAL file. Supports both delivery shapes (SKILL §8) and the draft shape:
//   • object map:  export const icons = { send: '<path …/>', … }
//   • array:       export const ICONS = [ { name:'send', inner:`<path …/>` }, … ]
//   • plain JSON:  [ { "name": …, "inner": … }, … ]   or   { "send": "<path…/>", … }
// SVG path data contains no { } or [ ], so brace/quote scanning stays safe.

function balanced(text, from, open, close) {
  let depth = 0;
  for (let i = from; i < text.length; i++) {
    const c = text[i];
    if (c === open) depth++;
    else if (c === close && --depth === 0) return text.slice(from, i + 1);
  }
  return null;
}

function parseSource(file) {
  const raw = readFileSync(file, 'utf8');

  if (file.endsWith('.json')) return normalize(JSON.parse(raw));

  // 1) array-of-objects form: each {…} carries name + inner (no braces inside SVG values).
  const objs = [...raw.matchAll(/\{[^{}]*?\b(?:name|inner)\b[^{}]*?\}/g)].map(m => m[0]);
  const arr = objs.map(o => {
    const name = o.match(/\bname\s*:\s*(['"`])([\s\S]*?)\1/);
    const inner = o.match(/\binner\s*:\s*(['"`])([\s\S]*?)\1/);
    return name && inner ? { name: name[2].trim(), inner: inner[2].trim() } : null;
  }).filter(Boolean);
  if (arr.length) return arr;

  // 2) object-map form: isolate the icon registry block, then pull key: 'value' pairs.
  const decl = raw.match(/\b(?:export\s+)?(?:const|let|var)\s+\w*[Ii]cons?\w*\s*(?::[^=]+)?=\s*/);
  let block = null;
  if (decl) {
    const start = raw.indexOf('{', decl.index + decl[0].length);
    if (start >= 0) block = balanced(raw, start, '{', '}');
  }
  if (!block) { // fallback: export default { … }
    const def = raw.match(/export\s+default\s*/);
    if (def) { const start = raw.indexOf('{', def.index); if (start >= 0) block = balanced(raw, start, '{', '}'); }
  }
  if (block) {
    const out = [];
    const re = /(['"]?)([A-Za-z_$][\w$-]*)\1\s*:\s*(['"`])([\s\S]*?)\3\s*(?=,|\})/g;
    let m;
    while ((m = re.exec(block))) out.push({ name: m[2].trim(), inner: m[4].trim() });
    if (out.length) return out;
  }
  throw new Error(`No icons found in ${file}. Expected an object map (export const icons = { name: '<svg…/>' }) or array of { name, inner }.`);
}

function normalize(data) {
  if (Array.isArray(data)) return data.map(x => ({ name: x.name, inner: x.inner }));
  return Object.entries(data).map(([name, inner]) => ({ name, inner }));
}

const STARTER = `// Morii icon registry — the SINGLE source of truth (SKILL §8).
// Edit this file; the live design card (build-gallery.mjs serve) re-renders on save.
// Each value is the markup INSIDE <svg viewBox="0 0 24 24" fill="currentColor">.
// Design fresh from the Roots — solid, full, tall, soft, one family. No catalog to copy.
export const icons = {
  // example — delete and design your own set:
  send: '<path d="M12 3.6 19.6 11.2H15.4V20.4H8.6V11.2H4.4Z" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>',
};
`;

function resolveSource(arg, cwd) {
  if (arg) return resolve(cwd, arg);
  const cands = [
    'morii-icons.draft.js', 'morii-icons.js', 'morii-icons.ts',
    'icons.ts', 'icons.js', 'icons.mjs', 'icons.json',
    'src/icons.ts', 'src/icons.js', 'src/icons/index.ts',
  ];
  for (const c of cands) { const p = resolve(cwd, c); if (existsSync(p)) return p; }
  const draft = resolve(cwd, 'morii-icons.draft.js');
  writeFileSync(draft, STARTER);
  console.log('· no registry found — wrote starter', draft);
  return draft;
}

// ───────────────────────── render: shared frame + helpers ─────────────────────────
const PAD = 0.98; // live-area: a THIN safe margin only — artwork fills the frame (留白 = filled area).
const wrap = (inner) => `<g transform="translate(12 12) scale(${PAD}) translate(-12 -12)">${inner}</g>`;

// ---- contact sheet (one big SVG, for qlmanage self-inspection; both themes) ----
function contactSheet(icons, theme = 'light') {
  const t = theme === 'dark'
    ? { bg: '#1a1a1e', ink: '#f2f3f5', label: '#6b7280' }
    : { bg: '#ffffff', ink: '#1a1a1e', label: '#8a8f99' };
  const cols = Math.max(4, Math.ceil(Math.sqrt(icons.length))); // rows ≤ cols → landscape sheet (qlmanage-safe)
  const cell = 150, icon = 92, pad = 18;
  const rows = Math.ceil(icons.length / cols);
  const W = cols * cell, H = rows * cell;
  const cells = icons.map((ic, i) => {
    const cx = (i % cols) * cell, cy = Math.floor(i / cols) * cell;
    const ix = cx + (cell - icon) / 2, iy = cy + pad;
    return `<svg x="${ix}" y="${iy}" width="${icon}" height="${icon}" viewBox="0 0 24 24" fill="currentColor">${wrap(ic.inner)}</svg>` +
      `<text x="${cx + cell / 2}" y="${cy + cell - 18}" text-anchor="middle" font-family="-apple-system,system-ui,sans-serif" font-size="15" fill="${t.label}">${ic.name}</text>`;
  }).join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="color:${t.ink}">` +
    `<rect width="${W}" height="${H}" fill="${t.bg}"/>${cells}</svg>`;
}

// ---- design card (morii-card-styled review card for the user; see design-card.md) ----
// `live` injects an EventSource client so the open card re-renders the moment the registry
// is saved — and shows a red banner (not a crash) when the file fails to parse.
function card(icons, { live = false, source = '' } = {}) {
  const data = JSON.stringify(icons);
  const src = basename(source);
  return `<!DOCTYPE html><html lang="zh-CN" data-theme="light"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>Morii Icon · 图标集</title>
<style>
:root{color-scheme:light dark;
--bg:light-dark(#e9ebee,#0d0d0f);--card:light-dark(#fff,#1c1c1e);
--ink:light-dark(#16181c,#f2f3f5);--mut:light-dark(#6e7480,#9ba1ac);--fnt:light-dark(#a8adb8,#5d646f);
--inset:light-dark(#f4f5f7,#26262a);--hl:color-mix(in srgb,var(--fnt) 12%,transparent);
--a:#6366f1;--ez:cubic-bezier(.16,1,.3,1);
--sh:0 1px 2px light-dark(rgba(16,24,40,.04),rgba(0,0,0,.5)),0 10px 28px light-dark(rgba(16,24,40,.07),rgba(0,0,0,.4))}
[data-theme=light]{color-scheme:light}[data-theme=dark]{color-scheme:dark}
*{margin:0;padding:0;box-sizing:border-box}
body{min-height:100vh;display:flex;justify-content:center;align-items:center;padding:16px;background:var(--bg);color:var(--ink);font-family:-apple-system,system-ui,'Segoe UI',sans-serif}
.card{width:min(880px,94vw);background:var(--card);border-radius:20px;padding:26px 28px 22px;box-shadow:var(--sh)}
.hd{display:flex;align-items:center;gap:12px;margin-bottom:20px}
.tile0{flex:none;width:38px;height:38px;border-radius:11px;background:color-mix(in srgb,var(--a) 12%,var(--card));color:var(--a);display:flex;align-items:center;justify-content:center}
.ttl{font-size:1.02rem;font-weight:680;letter-spacing:-.2px}
.sub{font-size:.74rem;color:var(--mut);margin-top:1px}
.live{display:inline-flex;align-items:center;gap:5px;margin-left:8px;font-size:.62rem;color:#22c55e;vertical-align:middle}
.live i{width:6px;height:6px;border-radius:99px;background:#22c55e;box-shadow:0 0 0 0 #22c55e80;animation:pulse 1.8s var(--ez) infinite}
@keyframes pulse{70%{box-shadow:0 0 0 5px #22c55e00}100%{box-shadow:0 0 0 0 #22c55e00}}
.err{display:none;margin-bottom:16px;padding:10px 14px;border-radius:11px;background:color-mix(in srgb,#ef4444 14%,var(--card));color:#ef4444;font-size:.74rem;white-space:pre-wrap;line-height:1.5}
.bar{display:flex;flex-wrap:wrap;gap:14px;align-items:center;margin-bottom:20px}
.grp{display:flex;align-items:center;gap:7px}.grp>.lb{font-size:.64rem;color:var(--mut)}
.seg{display:flex;background:var(--inset);border-radius:11px;padding:3px;gap:2px}
.seg button{border:0;background:transparent;color:var(--mut);font:inherit;font-size:.76rem;padding:6px 11px;border-radius:8px;cursor:pointer;transition:color .15s var(--ez)}
.seg button.on{background:var(--card);color:var(--ink);box-shadow:var(--sh)}
.seg button:active{transform:scale(.96)}
.swts{display:flex;gap:6px}
.sw{width:22px;height:22px;border-radius:7px;border:2px solid var(--card);box-shadow:0 0 0 1px var(--hl);cursor:pointer;padding:0;transition:box-shadow .15s}
.sw.on{box-shadow:0 0 0 2px var(--a)}.sw:active{transform:scale(.92)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px}
.tile{position:relative;display:flex;flex-direction:column;align-items:center;gap:13px;padding:22px 10px 14px;background:var(--inset);border-radius:14px;transition:box-shadow .18s var(--ez)}
.tile:hover{box-shadow:inset 0 0 0 1.5px color-mix(in srgb,var(--a) 40%,transparent)}
/* change-highlight: full-perimeter ring + soft halo + corner dot — NEVER a border-left accent callout */
.tile.chg{box-shadow:0 0 0 2px var(--a),0 0 0 6px color-mix(in srgb,var(--a) 15%,transparent)}
.tile.chg::after{content:'';position:absolute;top:9px;right:9px;width:7px;height:7px;border-radius:99px;background:var(--a);box-shadow:0 0 0 2px var(--inset)}
.chip{display:none;margin-left:6px;padding:1px 7px;border-radius:99px;font-size:.6rem;color:var(--a);background:color-mix(in srgb,var(--a) 14%,transparent)}
.chip.on{display:inline-block}
.tile .ic{color:var(--ink);display:flex;align-items:center;justify-content:center;min-height:48px;transition:color .18s var(--ez)}
.acc .tile .ic{color:var(--a)}
.tile .nm{font-size:.7rem;color:var(--mut);font-variant-numeric:tabular-nums}
.ft{display:flex;align-items:center;gap:7px;margin-top:18px;font-size:.7rem;color:var(--fnt)}
.ft i{width:6px;height:6px;border-radius:99px;background:var(--a);flex:none}
.fu{animation:fu .5s var(--ez) both}@keyframes fu{from{opacity:0;transform:translateY(7px)}}
@media (prefers-reduced-motion:reduce){.fu{animation:none}.live i{animation:none}}
@media (max-width:520px){.grid{grid-template-columns:repeat(auto-fill,minmax(96px,1fr))}.card{padding:22px 18px 18px}}
</style></head><body>
<div class="card acc" id="card">
  <div class="hd">
    <div class="tile0"><svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><rect x="3.5" y="3.5" width="7" height="7" rx="2.2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2.2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2.2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2.2"/></svg></div>
    <div><div class="ttl">Morii Icon${live ? `<span class="live"><i></i>LIVE</span>` : ''}<span class="chip" id="chg"></span></div><div class="sub"><span id="cnt">${icons.length}</span> 实心图标 · solid · 单色 currentColor · 双态稳${src ? ` · ${src}` : ''}</div></div>
  </div>
  <div class="err" id="err"></div>
  <div class="bar">
    <div class="grp"><span class="lb">尺寸</span><div class="seg" id="size"><button data-v="16">16</button><button data-v="24">24</button><button data-v="32" class="on">32</button><button data-v="48">48</button></div></div>
    <div class="grp"><span class="lb">主题</span><div class="seg" id="theme"><button data-v="light" class="on">浅</button><button data-v="dark">深</button></div></div>
    <div class="grp"><span class="lb">着色</span><div class="seg" id="tint"><button data-v="acc" class="on">强调</button><button data-v="ink">墨</button></div></div>
    <div class="grp swts" id="sws"></div>
  </div>
  <div class="grid" id="grid"></div>
  <div class="ft"><i></i>viewBox 24 · live-area ${PAD} · 物件实心填充 · 挖空/色阶细节</div>
</div>
<script>
let ICONS=${data},CHG=new Set();const PAD=${PAD};
const S={size:32,tint:'acc'};
const SW=['#6366f1','#ff6b6b','#22c55e','#f59e0b','#ec4899','#0f172a'];
const card=document.getElementById('card'),grid=document.getElementById('grid'),cnt=document.getElementById('cnt'),err=document.getElementById('err'),chg=document.getElementById('chg');
const ic=(inner,sz)=>'<svg viewBox="0 0 24 24" width="'+sz+'" height="'+sz+'" fill="currentColor"><g transform="translate(12 12) scale('+PAD+') translate(-12 -12)">'+inner+'</g></svg>';
function render(){cnt.textContent=ICONS.length;chg.textContent=CHG.size?'本次改动 '+CHG.size:'';chg.classList.toggle('on',CHG.size>0);grid.innerHTML=ICONS.map((x,i)=>'<div class="tile fu'+(CHG.has(x.name)?' chg':'')+'" style="animation-delay:'+Math.min(i*.02,.34)+'s"><div class="ic">'+ic(x.inner,S.size)+'</div><div class="nm">'+x.name+'</div></div>').join('')}
function seg(id,cb){document.getElementById(id).onclick=e=>{const b=e.target.closest('button');if(!b)return;[...e.currentTarget.children].forEach(x=>x.classList.toggle('on',x===b));cb(b.dataset.v)}}
seg('size',v=>{S.size=+v;render()});
seg('theme',v=>{document.documentElement.dataset.theme=v});
seg('tint',v=>{S.tint=v;card.classList.toggle('acc',v==='acc')});
const sws=document.getElementById('sws');
sws.innerHTML=SW.map((c,i)=>'<button class="sw'+(i===0?' on':'')+'" style="background:'+c+'" data-c="'+c+'" aria-label="accent"></button>').join('');
sws.onclick=e=>{const b=e.target.closest('.sw');if(!b)return;[...sws.children].forEach(x=>x.classList.remove('on'));b.classList.add('on');document.documentElement.style.setProperty('--a',b.dataset.c);if(S.tint!=='acc'){[...document.querySelectorAll('#tint button')].forEach(x=>x.classList.toggle('on',x.dataset.v==='acc'));S.tint='acc';card.classList.add('acc')}};
render();
${live ? `
const es=new EventSource('/events');
es.onmessage=e=>{const m=JSON.parse(e.data);if(m.error){err.textContent='⚠ '+m.error;err.style.display='block';}else{ICONS=m.icons;CHG=new Set(m.changed||[]);err.style.display='none';render();}};
es.onerror=()=>{};` : ''}
</script></body></html>`;
}

// ───────────────────────── CLI ─────────────────────────
const argv = process.argv.slice(2);
const cmd = ['serve', 'build'].includes(argv[0]) ? argv.shift() : 'serve';
const flag = (n, d) => { const i = argv.indexOf('--' + n); return i >= 0 ? argv[i + 1] : d; };
const port = +flag('port', 4321);
const idleSec = +flag('idle', 60); // serve auto-exits after this many seconds with no card open (0 = never)
const cwd = process.cwd();
const outDir = resolve(cwd, flag('out', '.'));
const VAL_FLAGS = ['--port', '--out', '--idle'];
let positional;
for (let i = 0; i < argv.length; i++) {
  if (argv[i].startsWith('--')) { if (VAL_FLAGS.includes(argv[i])) i++; continue; }
  positional = argv[i]; break;
}
const source = resolveSource(positional, cwd);

function emitStatic(icons) {
  writeFileSync(join(outDir, 'contactsheet.svg'), contactSheet(icons, 'light'));
  writeFileSync(join(outDir, 'contactsheet-dark.svg'), contactSheet(icons, 'dark'));
  writeFileSync(join(outDir, 'design-card.html'), card(icons, { source }));
}

if (cmd === 'build') {
  const icons = parseSource(source);
  emitStatic(icons);
  console.log(`wrote contactsheet.svg + -dark.svg + design-card.html (${icons.length} icons) → ${outDir}`);
} else {
  // serve: live card + live contact sheets; re-parse + push on every save; static files stay fresh for qlmanage.
  const clients = new Set();
  let last = [];
  // "This session" change-highlight: baseline = the registry snapshot when serve started.
  // Any icon added, or whose `inner` differs from baseline, is flagged `changed` (cumulative,
  // until the server is restarted). The card rings those tiles so a 1-icon edit is one glance.
  let baseline = null, changed = [];
  const diff = () => baseline ? last.filter(i => !baseline.has(i.name) || baseline.get(i.name) !== i.inner).map(i => i.name) : [];
  const reload = () => {
    try {
      last = parseSource(source);
      changed = diff();
      emitStatic(last); // keep the qlmanage self-check files current in the project dir
      broadcast({ icons: last, changed });
      console.log(`· ${last.length} icons${changed.length ? ` · ${changed.length} changed this session` : ''}`);
    } catch (e) {
      broadcast({ error: e.message });
      console.log('· parse error:', e.message);
    }
  };
  const broadcast = (msg) => { const d = `data: ${JSON.stringify(msg)}\n\n`; for (const c of clients) c.write(d); };

  // Auto-shutdown: once a card has connected, exit when it's been closed (no clients) for `idleSec`.
  // So when you finish and close the card, the server cleans itself up — no leaked process.
  let everConnected = false, idleTimer = null;
  const armIdle = () => {
    if (!idleSec || clients.size || !everConnected) return;
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (!clients.size) { console.log(`· card closed ${idleSec}s — auto-shutting down.`); server.close(); process.exit(0); }
    }, idleSec * 1000);
  };

  const server = createServer((req, res) => {
    if (req.url === '/quit') { res.writeHead(200).end('bye'); console.log('· /quit — shutting down.'); server.close(); process.exit(0); }
    if (req.url === '/events') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
      everConnected = true; clearTimeout(idleTimer); clients.add(res);
      res.write(`data: ${JSON.stringify({ icons: last, changed })}\n\n`);
      req.on('close', () => { clients.delete(res); armIdle(); });
      return;
    }
    if (req.url === '/contactsheet.svg' || req.url === '/contactsheet-dark.svg') {
      res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
      return res.end(contactSheet(last, req.url.includes('dark') ? 'dark' : 'light'));
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(card(last, { live: true, source }));
  });

  try { last = parseSource(source); baseline = new Map(last.map(i => [i.name, i.inner])); emitStatic(last); } catch (e) { console.log('· parse error:', e.message); }

  // watch the directory + filter basename — survives editors' atomic (rename) saves.
  let timer = null;
  watch(dirname(source), (_evt, fn) => {
    if (fn && basename(fn) !== basename(source)) return;
    clearTimeout(timer);
    timer = setTimeout(() => { if (existsSync(source) && statSync(source).isFile()) reload(); }, 90);
  });

  server.listen(port, () => {
    console.log(`\n  Morii Icon · live design card`);
    console.log(`  source : ${source}`);
    console.log(`  out    : ${outDir}  (contactsheet.svg + -dark.svg + design-card.html)`);
    console.log(`  open   : http://localhost:${port}`);
    console.log(`  edit the registry — the card updates on save.`);
    console.log(`  ${idleSec ? `auto-stops ${idleSec}s after the card is closed` : 'auto-stop disabled (--idle 0)'} · Ctrl-C / GET /quit to stop now.\n`);
    // Auto-open the card in the default browser so the user sees it without a manual step (--no-open to skip).
    if (!argv.includes('--no-open')) {
      const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
      try { spawn(opener, [`http://localhost:${port}`], { stdio: 'ignore', detached: true, shell: process.platform === 'win32' }).unref(); } catch { /* headless / no browser — URL already printed */ }
    }
  });
}
