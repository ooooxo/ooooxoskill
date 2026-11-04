// 干什么：对照版服务——托管项目目录，在 /__lab/lab.js · lab.css 下发台子（与本文件同目录）；对照页或台子一改，开着的页面自动刷新；页面「发送」的标注排队，agent 用 /__lab/wait 取、/__lab/say 回话；没人用了自己关。
// 怎么跑：跑在容器里，用同目录 lab.sh <项目根> 起（端口自动分、幂等）。
// 需要什么：Node 18+，零依赖。参数全走环境变量：LAB_ROOT_HOST（宿主上的根）与 LAB_URL（宿主上的地址）只用来显示 · LAB_WATCH（盯哪个子目录，默认 docs/lab）·
//          LAB_IDLE_MIN（闲多久自己关，默认 15 分钟）· LAB_POLL_MS（有页面开着时多久看一次文件，默认 400）。
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.argv[2] ?? ".");
const APP = path.dirname(new URL(import.meta.url).pathname);   // 台子（lab.js / lab.css）和本文件放在一起
const HARNESS = new Set(["lab.js", "lab.css", "Token.css"]);   // Token.css：项目 token 里没有台子那套角色变量时，台子自己补（lab.js 开头）
const PORT = 4777;   // 容器里固定；宿主端口由 lab.sh 分
const WATCH = path.join(ROOT, process.env.LAB_WATCH ?? "docs/lab");
const SHOWN = process.env.LAB_ROOT_HOST ?? ROOT;
const IDLE_MIN = Number(process.env.LAB_IDLE_MIN ?? 15);
const POLL_MS = Number(process.env.LAB_POLL_MS ?? 400);
const PING_MS = 20_000;   // 心跳：长连空着会被端口转发悄悄掐掉、页面还以为连着（2026-11-01 踩过：回话、刷新都推不到页面）
const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif",
  ".webp": "image/webp", ".ico": "image/x-icon", ".woff2": "font/woff2", ".ttf": "font/ttf", ".txt": "text/plain; charset=utf-8", ".md": "text/plain; charset=utf-8",
};

if (!fs.statSync(WATCH).isDirectory()) throw new Error(`LAB_WATCH 不是目录：${WATCH}`);

/* 状态：页面（SSE → 它是哪一页）· 挂着等的 agent · 还没人取的批 · 最后交出去的批 · agent 最后一句话（页面只要这一句，连上时补发） */
const pages = new Map();
/* 轮询的页面（2026-11-02 起页面不再挂长连：Chrome 同一个地址最多 6 条连接，开到第 6 页时长连把池子占满，
   新页面加载不出、「发送」的 POST 排在后面永远发不出去——用户：点了发送没反应）。id → { pg, at }，8 秒没来问就当关了 */
const polls = new Map();
const livePolls = () => { const t = Date.now() - 8000; for (const [k, v] of polls) if (v.at < t) polls.delete(k); return polls.size; };
let gen = 0;   // 共用件（台子、js、css、图）改了就加一：每一页的版本都跟着变、各自刷新
const waiters = [];
const queue = [];
let seq = 0, last = null, said = null;
const saidOf = new Map();   // 每一页 agent 最后一句：几页同时回话不互相盖（轮询的页面只认自己那句）
/* 每一页最后交出去的那批（/__lab/last?page= 取）：同一项目几个会话各开各的对照页，丢了只取回自己那一页的 */
const lastOf = new Map();
/* 推给页面：only 给了就只推给它点头的那几页 */
const emit = (type, data, only = null) => { const s = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`; for (const [r, pg] of pages) if (!only || only(pg)) r.write(s); };
/* 有批又有人等：按先来后到，每个 agent 只拿它点名那一页的批（wait 不带 ?page= 的照旧全拿）。
   同一项目常有几个会话各开各的对照页，不分页就会把别人的标注截走（2026-11-02 撞过） */
function hand() {
  for (let i = 0; i < waiters.length && queue.length; ) {
    const w = waiters[i], mine = queue.filter((b) => !w.page || b.页 === w.page);
    if (!mine.length) { i++; continue; }
    for (const b of mine) { queue.splice(queue.indexOf(b), 1); lastOf.set(b.页, b); }
    last = mine.at(-1);
    waiters.splice(i, 1);
    w.res.end(JSON.stringify(mine, null, 2) + "\n");
  }
  idle();
}
/* 自动关：没页面开着、没 agent 在等、没批排队，闲 IDLE_MIN 分钟就退出（exit 0，容器 on-failure 不再拉起；要用时 lab.sh 再起，端口不变）。
   靠事件重置计时：页面连上 / 断开、agent 挂上 / 走掉、发来一批都会重算 */
let idleT = null;
function idle() {
  clearTimeout(idleT);
  if (pages.size || livePolls() || waiters.length || queue.length) return;
  idleT = setTimeout(() => { console.log(`闲了 ${IDLE_MIN} 分钟：没页面、没 agent、没排队，自己关`); process.exit(0); }, IDLE_MIN * 60_000);
}
const body = (req) => new Promise((ok, no) => { let s = ""; req.setEncoding("utf8"); req.on("data", (c) => (s += c)); req.on("end", () => ok(s)); req.on("error", no); });
const json = (res, o, code = 200) => { res.writeHead(code, { "content-type": "application/json; charset=utf-8" }); res.end(JSON.stringify(o) + "\n"); };
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/* 盯文件：轮询 mtime，不用 fs.watch —— 服务在容器里、项目是宿主挂进来的，Docker Desktop 的挂载上文件事件时有时无
   （2026-11-01：一个会话里改了十几次，只推出去一次刷新）。只在有页面开着时轮询，没人看就停；一趟只是几十个 stat */
const stamp = (f) => { const st = fs.statSync(f, { throwIfNoEntry: false }); return st ? `${st.mtimeMs}:${st.size}` : ""; };
function scan(dir, out = new Map()) {
  for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
    if (d.name.startsWith(".")) continue;
    const f = path.join(dir, d.name);
    if (d.isDirectory()) scan(f, out); else out.set(f, stamp(f));
  }
  return out;
}
const harnessVer = () => [...HARNESS].map((h) => stamp(path.join(APP, h))).join("|");
/* 一页此刻的版本 = 它自己的文件 + 台子；页面重连时拿它对，断线期间漏掉的改动补一次刷新 */
const verOf = (pg) => `${pg ? stamp(path.join(ROOT, pg)) : ""}|${harnessVer()}|${gen}`;
let snap = null, harn = "", pollT = null, pingT = null;
function poll() {
  const now = scan(WATCH), h = harnessVer();
  if (snap) {
    const files = [...new Set([...now.keys(), ...snap.keys()])].filter((f) => now.get(f) !== snap.get(f)).map((f) => "/" + path.relative(ROOT, f));
    if (h !== harn) files.push("台子");
    if (files.length) {
      // 改的全是某几页 .html：只刷那几页；改到共用的件（台子、js、css、图）：开着的页面全刷
      const only = files.every((f) => f.endsWith(".html")) ? (pg) => files.includes(pg) : null;
      if (!only) gen++;
      emit("reload", { files }, only);
      console.log("刷新", files.join(" "));
    }
  }
  snap = now; harn = h;
}
function watchOn() {
  if (pollT) return;
  snap = null; poll();
  pollT = setInterval(poll, POLL_MS);
  pingT = setInterval(() => emit("ping", {}), PING_MS);
}
function watchOff() {
  if (pages.size || livePolls()) return;
  clearInterval(pollT); clearInterval(pingT); pollT = pingT = null;
}

function serveFile(res, p) {
  const f = path.join(ROOT, decodeURIComponent(p));
  if (f !== ROOT && !f.startsWith(ROOT + path.sep)) return json(res, { error: "出了根目录" }, 403);
  fs.stat(f, (err, st) => {
    if (err) { res.writeHead(404, { "content-type": "text/plain; charset=utf-8" }); return res.end(`没有这个文件：${p}\n`); }
    if (st.isDirectory()) {
      if (!p.endsWith("/")) { res.writeHead(301, { location: p + "/" }); return res.end(); }
      const items = fs.readdirSync(f, { withFileTypes: true }).filter((d) => !d.name.startsWith(".")).map((d) => d.name + (d.isDirectory() ? "/" : "")).sort();
      res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
      return res.end(`<meta charset="utf-8"><title>${esc(p)}</title><body style="font:14px/1.9 system-ui;margin:32px">` + items.map((n) => `<a href="${encodeURI(n)}">${esc(n)}</a>`).join("<br>"));
    }
    res.writeHead(200, { "content-type": MIME[path.extname(f).toLowerCase()] ?? "application/octet-stream", "cache-control": "no-store" });
    fs.createReadStream(f).pipe(res);
  });
}

setInterval(() => { watchOff(); idle(); }, 10_000).unref();
http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x"), p = u.pathname;
  if (p === "/__lab/ping") return json(res, { root: SHOWN, watch: path.relative(ROOT, WATCH), pages: [...pages.values(), ...(livePolls(), [...polls.values()].map((x) => x.pg))] });
  if (p === "/__lab/state") {
    // 页面每 1.5 秒来问一次：这一页此刻的版本（变了就刷新）+ agent 最后一句话；问完就走，不占连接
    const pg = decodeURIComponent(u.searchParams.get("page") ?? "");
    polls.set(u.searchParams.get("id") ?? pg, { pg, at: Date.now() }); watchOn(); idle();
    return json(res, { ver: verOf(pg), say: saidOf.get(pg) ?? (said && !said.page ? said : null) });
  }
  if (p.startsWith("/__lab/") && HARNESS.has(p.slice(7))) {
    res.writeHead(200, { "content-type": MIME[path.extname(p)], "cache-control": "no-store" });
    return fs.createReadStream(path.join(APP, p.slice(7))).pipe(res);
  }
  if (p === "/__lab/events") {
    // ?page= 是哪一页连上来：刷新只推给改到的那一页；state 带上这一页此刻的版本（ver）
    const pg = decodeURIComponent(u.searchParams.get("page") ?? "");   // 解成真文件名，和 poll 里的路径同一种写法（中文页名才对得上）
    res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-store", connection: "keep-alive" });
    res.write(`event: state\ndata: ${JSON.stringify({ say: said, ver: verOf(pg) })}\n\n`);
    pages.set(res, pg); idle(); watchOn();
    return res.on("close", () => { pages.delete(res); idle(); watchOff(); });
  }
  if (p === "/__lab/send" && req.method === "POST") {
    const batch = { batch: ++seq, at: new Date().toISOString(), ...JSON.parse(await body(req)) };
    queue.push(batch);
    console.log(`第 ${seq} 批：${batch.标注?.length ?? 0} 条标注`);
    hand();
    return json(res, { batch: seq });
  }
  if (p === "/__lab/wait") {
    // ?page=/docs/lab/<topic>.html：只等这一页发来的批
    waiters.push({ res, page: decodeURIComponent(u.searchParams.get("page") ?? "") });
    res.on("close", () => { const i = waiters.findIndex((w) => w.res === res); if (i >= 0) { waiters.splice(i, 1); idle(); } });
    return hand();
  }
  if (p === "/__lab/last") {
    const pg = decodeURIComponent(u.searchParams.get("page") ?? ""), b = pg ? lastOf.get(pg) : last;
    return b ? json(res, b) : json(res, { error: "还没交出过任何一批" }, 404);
  }
  if (p === "/__lab/say" && req.method === "POST") {
    // 回话只给发来那一批的页面；服务重启过（手里没有那一批）就看 ?page=，再没有就不点名页面（页面按时间清点）
    said = { text: (await body(req)).trim(), batch: last?.batch ?? 0, page: u.searchParams.get("page") ?? last?.页 ?? null, at: new Date().toISOString() };
    if (said.page) saidOf.set(said.page, said);
    emit("say", said);
    return json(res, { ok: true, pages: pages.size });
  }
  serveFile(res, p);
}).listen(PORT, "0.0.0.0", () => { console.log(`对照版服务 ${process.env.LAB_URL ?? PORT}/  根 ${SHOWN}  盯 ${path.relative(ROOT, WATCH)}（轮询 ${POLL_MS}ms）  闲 ${IDLE_MIN} 分钟自己关`); idle(); });
