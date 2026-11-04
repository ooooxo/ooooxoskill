// 干什么：对照版服务——托管项目目录，在 /__lab/lab.js · lab.css 下发台子（与本文件同目录）；对照页或台子一改，开着的页面自动刷新；页面「发送」的标注排队，agent 用 /__lab/wait 取、/__lab/say 回话；没人用了自己关。
// 怎么跑：跑在容器里，用同目录 lab.sh <项目根> 起（端口自动分、幂等）。
// 需要什么：Node 18+，零依赖。参数全走环境变量：LAB_ROOT_HOST（宿主上的根）与 LAB_URL（宿主上的地址）只用来显示 · LAB_WATCH（盯哪个子目录，默认 docs/lab）· LAB_IDLE_MIN（闲多久自己关，默认 15 分钟）。
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.argv[2] ?? ".");
const APP = path.dirname(new URL(import.meta.url).pathname);   // 台子（lab.js / lab.css）和本文件放在一起
const HARNESS = new Set(["lab.js", "lab.css"]);
const PORT = 4777;   // 容器里固定；宿主端口由 lab.sh 分
const WATCH = path.join(ROOT, process.env.LAB_WATCH ?? "docs/lab");
const SHOWN = process.env.LAB_ROOT_HOST ?? ROOT;
const DEBOUNCE_MS = 120;   // agent 一次改动常是连着几次写，并成一次刷新
const IDLE_MIN = Number(process.env.LAB_IDLE_MIN ?? 15);
const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif",
  ".webp": "image/webp", ".ico": "image/x-icon", ".woff2": "font/woff2", ".ttf": "font/ttf", ".txt": "text/plain; charset=utf-8", ".md": "text/plain; charset=utf-8",
};

if (!fs.statSync(WATCH).isDirectory()) throw new Error(`LAB_WATCH 不是目录：${WATCH}`);

/* 状态：页面（SSE）· 挂着等的 agent · 还没人取的批 · 最后交出去的批 · agent 最后一句话（页面只要这一句，连上时补发） */
const pages = new Set();
const waiters = [];
const queue = [];
let seq = 0, last = null, said = null;
const emit = (type, data) => { const s = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`; for (const p of pages) p.write(s); };
/* 有批又有人等：全部交给最早来的那个 agent */
function hand() {
  if (queue.length && waiters.length) {
    const all = queue.splice(0);
    last = all.at(-1);
    waiters.shift().end(JSON.stringify(all, null, 2) + "\n");
  }
  idle();
}
/* 自动关：没页面开着、没 agent 在等、没批排队，闲 IDLE_MIN 分钟就退出（exit 0，容器 on-failure 不再拉起；要用时 lab.sh 再起，端口不变）。
   靠事件重置计时，不轮询：页面连上 / 断开、agent 挂上 / 走掉、发来一批都会重算 */
let idleT = null;
function idle() {
  clearTimeout(idleT);
  if (pages.size || waiters.length || queue.length) return;
  idleT = setTimeout(() => { console.log(`闲了 ${IDLE_MIN} 分钟：没页面、没 agent、没排队，自己关`); process.exit(0); }, IDLE_MIN * 60_000);
}
const body = (req) => new Promise((ok, no) => { let s = ""; req.setEncoding("utf8"); req.on("data", (c) => (s += c)); req.on("end", () => ok(s)); req.on("error", no); });
const json = (res, o, code = 200) => { res.writeHead(code, { "content-type": "application/json; charset=utf-8" }); res.end(JSON.stringify(o) + "\n"); };
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

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

http.createServer(async (req, res) => {
  const p = new URL(req.url, "http://x").pathname;
  if (p === "/__lab/ping") return json(res, { root: SHOWN, watch: path.relative(ROOT, WATCH) });
  if (p.startsWith("/__lab/") && HARNESS.has(p.slice(7))) {
    res.writeHead(200, { "content-type": MIME[path.extname(p)], "cache-control": "no-store" });
    return fs.createReadStream(path.join(APP, p.slice(7))).pipe(res);
  }
  if (p === "/__lab/events") {
    res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-store", connection: "keep-alive" });
    res.write(`event: state\ndata: ${JSON.stringify({ say: said })}\n\n`);
    pages.add(res); idle();
    return res.on("close", () => { pages.delete(res); idle(); });
  }
  if (p === "/__lab/send" && req.method === "POST") {
    const batch = { batch: ++seq, at: new Date().toISOString(), ...JSON.parse(await body(req)) };
    queue.push(batch);
    console.log(`第 ${seq} 批：${batch.标注?.length ?? 0} 条标注`);
    hand();
    return json(res, { batch: seq });
  }
  if (p === "/__lab/wait") {
    waiters.push(res);
    res.on("close", () => { const i = waiters.indexOf(res); if (i >= 0) { waiters.splice(i, 1); idle(); } });
    return hand();
  }
  if (p === "/__lab/last") return last ? json(res, last) : json(res, { error: "还没交出过任何一批" }, 404);
  if (p === "/__lab/say" && req.method === "POST") {
    said = { text: (await body(req)).trim(), batch: last?.batch ?? 0, page: last?.页 ?? null, at: new Date().toISOString() };   // 回话只给发来那一批的页面
    emit("say", said);
    return json(res, { ok: true });
  }
  serveFile(res, p);
}).listen(PORT, "0.0.0.0", () => { console.log(`对照版服务 ${process.env.LAB_URL ?? PORT}/  根 ${SHOWN}  盯 ${path.relative(ROOT, WATCH)}  闲 ${IDLE_MIN} 分钟自己关`); idle(); });

let timer = null;
const changed = new Set();
function bump(file) {
  changed.add(file);
  clearTimeout(timer);
  timer = setTimeout(() => { emit("reload", { files: [...changed] }); console.log("刷新", [...changed].join(" ")); changed.clear(); }, DEBOUNCE_MS);
}
fs.watch(WATCH, { recursive: true }, (_, file) => { if (file && !/(^|\/)\./.test(file)) bump(file); });
fs.watch(APP, (_, file) => { if (HARNESS.has(file)) bump("台子 " + file); });   // 台子改了，所有开着的对照页一起换
