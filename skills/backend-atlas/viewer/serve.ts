// atlas 编辑服务：把系统图（或空白画布）挂到本机端口；页面上建的节点、主 agent 改的文件都落进同一份 intent.json，每次页面保存的结构 diff 追加进 <intent>.log.jsonl
// 怎么跑：bun viewer/serve.ts <intent.json> [atlas.html]      不给 atlas.html = 空白画布；端口 PORT，默认 4870
// 需要：bun。intent.json 不存在就建空的；写入带内容版本号，文件被别人（agent）改过就 409，页面重读再写。
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { icons } from "./icons.ts";

const PORT = Number(process.env.PORT ?? 4870);
const LANES = [{ id: "client", name: "客户端", cols: [0, 1, 2, 3] }, { id: "server", name: "服务端", cols: [4, 5, 6] }, { id: "store", name: "存储与外部", cols: [7] }];

const [intentArg, atlasArg] = process.argv.slice(2);
if (!intentArg) { console.error("usage: bun viewer/serve.ts <intent.json> [atlas.html]"); process.exit(2); }
const intent = resolve(intentArg), log = intent.replace(/\.json$/, "") + ".log.jsonl";
const atlas = atlasArg && resolve(atlasArg);
const here = import.meta.dir;   // 不用 URL.pathname：路径里的空格 / 中文会被百分号编码
mkdirSync(dirname(intent), { recursive: true });
if (!existsSync(intent)) writeFileSync(intent, JSON.stringify({ title: "新画布", nodes: [], edges: [] }, null, 2) + "\n");
if (atlas && !existsSync(atlas)) throw new Error(`没有这个图：${atlas}（先跑 run.sh）`);

const ver = (t: string) => Bun.hash(t).toString(36);
const read = () => readFileSync(intent, "utf8");

// 空白画布：没有抽取数据，只有泳道；标题取 intent.json 的 title，图标用自带的 icons.ts
function blank() {
  const data = { title: JSON.parse(read()).title ?? "新画布", subtitle: "空白画布", lanes: LANES, edgeLabels: [], roots: { S: "", C: "" }, revisions: null,
    nodes: [], edges: [], loops: [], icons, generatedAt: new Date().toISOString() };
  return readFileSync(`${here}/graph.html`, "utf8")
    .replace("/*__TOKENS__*/", () => readFileSync(`${here}/Token.css`, "utf8"))
    .replace("/*__FLOWCSS__*/", () => readFileSync(`${here}/flow.css`, "utf8"))
    .replace("/*__FLOW__*/", () => readFileSync(`${here}/flow.js`, "utf8"))
    .replace("/*__DATA__*/null", () => JSON.stringify({ ...data, flows: [] }));
}

// 结构 diff：节点按 id、边按 from→to:k 比；只记变了什么，agent 读日志就知道用户刚才动了哪里
function diff(a: any, b: any) {
  const ek = (e: any) => `${e.from}→${e.to}:${e.k}`;
  const na = new Map(a.nodes.map((n: any) => [n.id, n])), nb = new Map(b.nodes.map((n: any) => [n.id, n]));
  const ea = new Map(a.edges.map((e: any) => [ek(e), e])), eb = new Map(b.edges.map((e: any) => [ek(e), e]));
  const changed = [...nb].filter(([id, n]) => na.has(id) && JSON.stringify(na.get(id)) !== JSON.stringify(n))
    .map(([id, n]: any) => ({ id, from: na.get(id), to: n }));
  const d: any = {
    added: [...nb.values()].filter((n: any) => !na.has(n.id)), removed: [...na.values()].filter((n: any) => !nb.has(n.id)), changed,
    linked: [...eb.values()].filter((e) => !ea.has(ek(e))), unlinked: [...ea.values()].filter((e) => !eb.has(ek(e))),
  };
  for (const k of Object.keys(d)) if (!d[k].length) delete d[k];
  return Object.keys(d).length ? d : null;
}

Bun.serve({
  port: PORT,
  hostname: "127.0.0.1",   // 只给本机：写接口没有鉴权，暴露到局域网谁都能改 intent.json（agent 之后会照着它实现）
  async fetch(req) {
    const u = new URL(req.url);
    if (u.pathname === "/") return new Response(atlas ? readFileSync(atlas, "utf8") : blank(), { headers: { "content-type": "text/html; charset=utf-8" } });
    if (u.pathname !== "/intent") return new Response("not found", { status: 404 });
    if (req.method === "GET") { const t = read(); return new Response(t, { headers: { "x-ver": ver(t), "cache-control": "no-store" } }); }
    if (req.method !== "PUT") return new Response("method", { status: 405 });
    const body = await req.text();
    let next;
    try { next = JSON.parse(body); } catch (e) { return new Response(`intent 不是合法 JSON：${e}`, { status: 400 }); }
    const cur = read();
    if (req.headers.get("x-ver") !== ver(cur)) return new Response("intent.json 已被改过，重读再写", { status: 409 });
    const d = diff(JSON.parse(cur), next);
    writeFileSync(intent, body);
    if (d) appendFileSync(log, JSON.stringify({ at: new Date().toISOString(), by: "canvas", ...d }) + "\n");
    return new Response("ok", { headers: { "x-ver": ver(body) } });
  },
});
console.log(`atlas 画布：http://localhost:${PORT}   意图：${intent}   改动日志：${log}`);
