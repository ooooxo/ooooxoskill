// 干什么：对照版服务——托管项目目录，在 /__lab/lab.js · lab.css 下发台子（与本文件同目录）；对照页或台子一改，开着的页面自动刷新；页面「发送」的标注排队，agent 用 /__lab/wait 取、/__lab/say 回话；没人用了自己关。
// 怎么跑：本机 node 进程（开发工具，不进 Docker），用同目录 lab.sh <项目根> 起（端口自动分、幂等、pid 与日志它管）。
// 需要什么：Node 18+，零依赖。参数全走环境变量：LAB_PORT（lab.sh 分）· LAB_WATCH（盯哪个子目录，默认 docs/lab）·
//          LAB_IDLE_MIN（没人看多久自己关，默认 15 分钟）· LAB_POLL_MS（有页面开着时多久看一次文件，默认 400）·
//          LAB_IMG_DIR（标注参考图存哪，lab.sh 给 ~/.local/state/dc-lab/img/<项目>；不在项目里，不进仓库）。
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";

const ROOT = path.resolve(process.argv[2] ?? ".");
const APP = path.dirname(new URL(import.meta.url).pathname);   // 台子（lab.js / lab.css）和本文件放在一起
// Token.css：项目 token 里没有台子那套角色变量时，台子自己补（lab.js 开头）；motion.js：动态稿的时间轴与播放条（MOTION.md）
const HARNESS = new Set(["lab.js", "lab.css", "Token.css", "motion.js"]);
/* /__lab/lab-ui.css（lab.css 第一行 @import）：Token.css 两份——
   ① 放进最低的 lab-fallback 层：项目 token 缺的角色由它补（项目自己有的照样盖过它）；
   ② 同一套值钉在 .lab-ui（台子自己的界面）上：台子的长相不跟项目 token 走，项目缺几个、同名不同义都不坏（2026-11-25：Hrige / Morii 缺 --chin-glass，岛全透明） */
const labUi = () => {
  const t = fs.readFileSync(path.join(APP, "Token.css"), "utf8");
  const scoped = t.replace(/:root\b/g, ".lab-ui").replace(/\[data-theme="light"\]\s*\{/g, '[data-theme="light"] .lab-ui {').replace(/\*, \*::before, \*::after \{/g, ".lab-ui *, .lab-ui *::before, .lab-ui *::after {");
  return `@layer lab-fallback {\n${t.replace(/\*, \*::before, \*::after \{[^}]*\}/g, "")}\n}\n${scoped}`;
};
const PORT = Number(process.env.LAB_PORT ?? 4777);
const WATCH = path.join(ROOT, process.env.LAB_WATCH ?? "docs/lab");
const IDLE_MIN = Number(process.env.LAB_IDLE_MIN ?? 15);
const POLL_MS = Number(process.env.LAB_POLL_MS ?? 400);
const IMG = process.env.LAB_IMG_DIR;
const IMG_EXT = { "image/png": ".png", "image/jpeg": ".jpg", "image/gif": ".gif", "image/webp": ".webp" };
const VID_EXT = { "video/mp4": ".mp4", "video/webm": ".webm", "video/quicktime": ".mov" };
const IMG_MAX = 20 * 1024 * 1024;    // 一张参考图的上限：截图、设计稿导出都够
const VID_MAX = 200 * 1024 * 1024;   // 一段参考视频的上限
const GRAB_MS = 60_000;              // 取一个链接最多等多久（视频大，给宽一点）
const PING_MS = 20_000;   // 心跳：长连空着会被端口转发悄悄掐掉、页面还以为连着（2026-11-01 踩过：回话、刷新都推不到页面）
const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif",
  ".webp": "image/webp", ".mp4": "video/mp4", ".webm": "video/webm", ".mov": "video/quicktime", ".ico": "image/x-icon", ".woff2": "font/woff2", ".ttf": "font/ttf", ".txt": "text/plain; charset=utf-8", ".md": "text/plain; charset=utf-8",
};

if (!fs.statSync(WATCH).isDirectory()) throw new Error(`LAB_WATCH 不是目录：${WATCH}`);

/* 状态：页面（SSE → 它是哪一页）· 挂着等的 agent · 还没人取的批 · 最后交出去的批 · agent 最后一句话（页面只要这一句，连上时补发） */
const pages = new Map();
/* 轮询的页面（页面不挂长连：Chrome 同一个地址最多 6 条连接，开到第 6 页时长连把池子占满，「发送」的 POST 永远发不出去）。
   id → { pg, at, vis }，8 秒没来问就当关了；vis = 标签此刻看得见（后台标签照样轮询、照样刷新，但不算有人在看） */
const polls = new Map();
const livePolls = () => { const t = Date.now() - 8000; for (const [k, v] of polls) if (v.at < t) polls.delete(k); return polls.size; };
const seenPolls = () => (livePolls(), [...polls.values()].filter((v) => v.vis).length);
let gen = 0;   // 共用件（台子、js、css、图）改了就加一：每一页的版本都跟着变、各自刷新
const waiters = [];
const queue = [];
let seq = 0, last = null, said = null;
const saidOf = new Map();   // 每一页 agent 最后一句：几页同时回话不互相盖（轮询的页面只认自己那句）
/* 每一页最后交出去的那批（/__lab/last?page= 取）：同一项目几个会话各开各的对照页，丢了只取回自己那一页的 */
const lastOf = new Map();
/* 每一页交给 agent、还没回话的批号：页面据此标「agent 在改第几批」，回话只算答了这些——
   回话前补发、还排着没交出去的那批不算答过（2026-11-25 之前按时间清点，补充的标注被回话一并清掉，agent 根本没看到） */
const working = new Map();
/* 服务这一次启动的记号：批号重启后从 1 数起，页面靠它分清「这一回的第 3 批」和「上一回的第 3 批」 */
const BOOT = Date.now().toString(36);
/* 推给页面：only 给了就只推给它点头的那几页 */
const emit = (type, data, only = null) => { const s = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`; for (const [r, pg] of pages) if (!only || only(pg)) r.write(s); };
/* 有批又有人等：按先来后到，每个 agent 只拿它点名那一页的批（wait 不带 ?page= 的照旧全拿）。
   同一项目常有几个会话各开各的对照页，不分页就会把别人的标注截走（2026-11-02 撞过） */
function hand() {
  for (let i = 0; i < waiters.length && queue.length; ) {
    const w = waiters[i], mine = queue.filter((b) => !w.page || b.页 === w.page);
    if (!mine.length) { i++; continue; }
    for (const b of mine) { queue.splice(queue.indexOf(b), 1); lastOf.set(b.页, b); working.set(b.页, [...(working.get(b.页) ?? []), b.batch]); }
    last = mine.at(-1);
    waiters.splice(i, 1);
    w.res.end(JSON.stringify(mine, null, 2) + "\n");
  }
}
/* 自动关：没有看得见的页面、没批排队，连续 IDLE_MIN 分钟就退出；要用时 lab.sh 再起，端口不变。
   ⛔ 挂着的 agent 不算有人在用：会话常挂着几天不关，算进去服务就永远不关（2026-11-25 之前 42 次全靠 reaper 闲 2 小时强停）。
   退出前给挂着的 wait 回 {"关了"}，agent 据此不再挂、不重起——否则每 15 分钟起一次关一次、白唤醒一次 */
let busyAt = Date.now();
function idleCheck() {
  if (pages.size || seenPolls() || queue.length) return void (busyAt = Date.now());
  if (Date.now() - busyAt < IDLE_MIN * 60_000) return;
  const why = `闲了 ${IDLE_MIN} 分钟没人看，服务自己关了；要用时 lab.sh 再起（端口不变，页面刷新就接上）`;
  console.log(why);
  for (const w of waiters) w.res.end(JSON.stringify({ 关了: why }) + "\n");
  process.exit(0);
}
const body = (req) => new Promise((ok, no) => { let s = ""; req.setEncoding("utf8"); req.on("data", (c) => (s += c)); req.on("end", () => ok(s)); req.on("error", no); });
const raw = (req, max) => new Promise((ok, no) => { const cs = []; let n = 0; req.on("data", (c) => { n += c.length; if (n > max) { req.destroy(); no(new Error("too big")); } else cs.push(c); }); req.on("end", () => ok(Buffer.concat(cs))); req.on("error", no); });
/* 存进图缓存：按内容哈希起名，同一份只存一份；返回 { url 给页面, path 给 agent } */
function keep(buf, ext) {
  const name = crypto.createHash("sha1").update(buf).digest("hex").slice(0, 16) + ext, f = path.join(IMG, name);
  fs.mkdirSync(IMG, { recursive: true });
  if (!fs.existsSync(f)) fs.writeFileSync(f, buf);
  return { url: "/__lab/img/" + name, path: f };
}
/* 视频抽一帧当封面（agent 读不了视频，读得了图）：先取第 1 秒，太短就取第 0 帧；没装 ffmpeg 就不给封面 */
function poster(v) {
  const out = v.path.replace(/\.[^.]+$/, ".jpg");
  for (const ss of ["1", "0"]) {
    if (fs.existsSync(out)) break;
    const r = spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-ss", ss, "-i", v.path, "-frames:v", "1", "-vf", "scale=720:-2", out], { timeout: 20_000 });
    if (r.error) { console.log("没有 ffmpeg，视频不出封面：", r.error.message); return null; }
  }
  return fs.existsSync(out) ? { url: "/__lab/img/" + path.basename(out), path: out } : null;
}
/* 链接 → 图 / 视频：直链按 content-type 存；网页读 og:video / og:image（视频那条又是网页、或取不到，就退回封面图） */
async function grab(link, depth = 0) {
  const r = await fetch(link, { redirect: "follow", signal: AbortSignal.timeout(GRAB_MS), headers: { "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36" } });
  if (!r.ok) throw new Error(`${r.status} ${link}`);
  const type = (r.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  if (IMG_EXT[type] || VID_EXT[type]) {
    const max = IMG_EXT[type] ? IMG_MAX : VID_MAX;
    if (Number(r.headers.get("content-length") ?? 0) > max) throw new Error(`太大，上限 ${max / 1048576}MB`);
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > max) throw new Error(`太大，上限 ${max / 1048576}MB`);
    if (IMG_EXT[type]) return { kind: "img", ...keep(buf, IMG_EXT[type]) };
    const v = keep(buf, VID_EXT[type]);
    return { kind: "video", ...v, poster: poster(v) };
  }
  if (type !== "text/html" || depth) throw new Error(`不是图也不是视频（${type || "没报类型"}）`);
  const html = (await r.text()).slice(0, 3_000_000);
  const meta = (k) => (html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${k}["'][^>]*content=["']([^"']+)`, "i")) ?? html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${k}["']`, "i")))?.[1];
  const abs = (u) => u && new URL(u.replace(/&amp;/g, "&"), r.url).href;
  const vid = abs(meta("og:video:secure_url") ?? meta("og:video:url") ?? meta("og:video")), img = abs(meta("og:image:secure_url") ?? meta("og:image") ?? meta("twitter:image"));
  if (vid) { const got = await grab(vid, 1).catch(() => null); if (got) return got; }
  if (img) return grab(img, 1);
  throw new Error("这页没有 og:image / og:video，转不成图");
}
const json = (res, o, code = 200) => { res.writeHead(code, { "content-type": "application/json; charset=utf-8" }); res.end(JSON.stringify(o) + "\n"); };
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/* 盯文件：轮询 mtime，不用 fs.watch —— 各平台、各种挂载下行为一致（2026-11-01 服务还在容器里时，挂载上的文件事件改十几次只响一次）。
   只在有页面开着时轮询，没人看就停；一趟只是几十个 stat */
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

setInterval(() => { watchOff(); idleCheck(); }, 10_000);
http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x"), p = u.pathname;
  if (p === "/__lab/ping") return json(res, { root: ROOT, watch: path.relative(ROOT, WATCH), pages: [...pages.values(), ...(livePolls(), [...polls.values()].map((x) => x.pg))], waiters: waiters.length });
  if (p === "/__lab/state") {
    // 页面每 1.5 秒来问一次：这一页此刻的版本（变了就刷新）+ agent 最后一句话；问完就走，不占连接
    const pg = decodeURIComponent(u.searchParams.get("page") ?? "");
    polls.set(u.searchParams.get("id") ?? pg, { pg, at: Date.now(), vis: u.searchParams.get("vis") !== "0" }); watchOn();   // 老页面不带 vis：当看得见
    // st：这一页排着的批号 · 交给 agent 还没回话的批号 · 有没有 agent 正挂着等这一页
    const st = { q: queue.filter((b) => b.页 === pg).map((b) => b.batch), w: working.get(pg) ?? [], ag: waiters.some((w) => !w.page || w.page === pg) };
    return json(res, { ver: verOf(pg), say: saidOf.get(pg) ?? (said && !said.page ? said : null), st });
  }
  if (p === "/__lab/lab-ui.css") {
    res.writeHead(200, { "content-type": MIME[".css"], "cache-control": "no-store" });
    return res.end(labUi());
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
    pages.set(res, pg); watchOn();
    return res.on("close", () => { pages.delete(res); watchOff(); });
  }
  /* 标注的参考图：页面粘贴 / 拖进来的图存到 IMG（按内容哈希起名，同一张只存一份），回 { url 给页面画缩略图, path 给 agent 用 Read 看 } */
  if (p === "/__lab/img" && req.method === "POST") {
    if (!IMG) return json(res, { error: "这个服务没配 LAB_IMG_DIR（旧版 lab.sh 起的）：lab.sh <项目根> stop 再起" }, 500);
    const ext = IMG_EXT[req.headers["content-type"]];
    if (!ext) return json(res, { error: `只收 ${Object.keys(IMG_EXT).join(" / ")}，来的是 ${req.headers["content-type"]}` }, 415);
    const buf = await raw(req, IMG_MAX).catch(() => null);
    if (!buf) return json(res, { error: `图太大，上限 ${IMG_MAX / 1048576}MB` }, 413);
    return json(res, { kind: "img", ...keep(buf, ext) });
  }
  if (p === "/__lab/fetch" && req.method === "POST") {
    if (!IMG) return json(res, { error: "这个服务没配 LAB_IMG_DIR（旧版 lab.sh 起的）：lab.sh <项目根> stop 再起" }, 500);
    const link = (await body(req)).trim();
    if (!/^https?:\/\//.test(link)) return json(res, { error: "不是 http(s) 链接" }, 400);
    try { return json(res, { ...(await grab(link)), src: link }); }
    catch (e) { console.log("链接转不成图：", link, e.message); return json(res, { error: e.message }, 422); }
  }
  if (p.startsWith("/__lab/img/")) {
    const name = p.slice(11);
    if (!IMG || !/^[0-9a-f]{16}\.(png|jpg|gif|webp|mp4|webm|mov)$/.test(name)) return json(res, { error: "没有这张图" }, 404);
    res.writeHead(200, { "content-type": MIME[path.extname(name)], "cache-control": "max-age=31536000, immutable" });
    return fs.createReadStream(path.join(IMG, name)).on("error", () => res.end()).pipe(res);
  }
  if (p === "/__lab/send" && req.method === "POST") {
    const batch = { batch: ++seq, at: new Date().toISOString(), ...JSON.parse(await body(req)) };
    queue.push(batch);
    console.log(`第 ${seq} 批：${batch.标注?.length ?? 0} 条标注`);
    hand();
    return json(res, { batch: seq, boot: BOOT });
  }
  if (p === "/__lab/wait") {
    // ?page=/docs/lab/<topic>.html：只等这一页发来的批
    waiters.push({ res, page: decodeURIComponent(u.searchParams.get("page") ?? "") });
    res.on("close", () => { const i = waiters.findIndex((w) => w.res === res); if (i >= 0) waiters.splice(i, 1); });
    return hand();
  }
  if (p === "/__lab/last") {
    const pg = decodeURIComponent(u.searchParams.get("page") ?? ""), b = pg ? lastOf.get(pg) : last;
    return b ? json(res, b) : json(res, { error: "还没交出过任何一批" }, 404);
  }
  if (p === "/__lab/say" && req.method === "POST") {
    // 回话给哪一页：?page=，没带就给最后交出去那批的页；答的是这一页交出去的批（batch = 其中最大的批号），还排着的不算。
    // 服务重启过（手里没有那一批）batch 为 0，页面退回按时间清点
    const page = u.searchParams.get("page") ?? last?.页 ?? null;
    said = { text: (await body(req)).trim(), batch: (page ? lastOf.get(page) : last)?.batch ?? 0, boot: BOOT, page, at: new Date().toISOString() };
    if (page) { saidOf.set(page, said); working.delete(page); }
    emit("say", said);
    return json(res, { ok: true, pages: pages.size });
  }
  serveFile(res, p);
}).listen(PORT, "127.0.0.1", () => console.log(`对照版服务 http://127.0.0.1:${PORT}/  根 ${ROOT}  盯 ${path.relative(ROOT, WATCH)}（轮询 ${POLL_MS}ms）  没人看 ${IDLE_MIN} 分钟自己关`));
