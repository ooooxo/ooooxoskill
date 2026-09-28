// atlas-join：服务端图 + 客户端图 → 一张系统图 + 业务循环索引，写 system.json
// 怎么跑：bun join.ts <server.graph.json> <client.graph.json> <out/system.json>
// 需要：bun。跨端连接全靠确定性对接（路由模板 / 事件名 / 命令名 / 总线事件名），不猜。
import { readFileSync, writeFileSync } from "node:fs";


// 展开执行树（含推送后按载荷剪分支）在 viewer 端按需做，这里只出图与循环索引
const [serverPath, clientPath, outPath] = process.argv.slice(2);
if (!outPath) { console.error("usage: bun join.ts <server.graph.json> <client.graph.json> <system.json>"); process.exit(2); }
const S = JSON.parse(readFileSync(serverPath, "utf8"));
const C = JSON.parse(readFileSync(clientPath, "utf8"));

// ---- 合并：id 加端前缀，避免两端撞名 ----
const side = (g: any, p: string) => ({
  modules: g.modules.map((m: any) => ({ ...m, id: p + m.id, side: p })),
  entries: g.entries.map((e: any) => ({ ...e, id: p + e.id, module: p + e.module, method: e.method && p + e.method, side: p })),
  methods: g.methods.map((m: any) => ({ ...m, id: p + m.id, side: p })),
  resources: g.resources.map((r: any) => ({ ...r, id: p + r.id, side: p })),
  edges: g.edges.map((e: any) => ({ ...e, from: p + e.from, to: p + e.to })),
});
const s = side(S, "S|"), c = side(C, "C|");
// 流程（服务端控制流骨架，见 extractor/Flows.cs）：方法 id 同样加端前缀
const prefFlow = (n: any): any => ({ ...n, method: n.method && "S|" + n.method, kids: n.kids?.map(prefFlow) });
const flows = (S.flows ?? []).map((f: any) => ({ ...f, id: "S|" + f.id, root: prefFlow(f.root) }));
const all = {
  modules: [...s.modules, ...c.modules], entries: [...s.entries, ...c.entries],
  methods: [...s.methods, ...c.methods], resources: [...s.resources, ...c.resources], edges: [...s.edges, ...c.edges],
};
const method = new Map(all.methods.map((m: any) => [m.id, m]));
const resource = new Map(all.resources.map((r: any) => [r.id, r]));

// ---- 跨端连接 ----
const norm = (r: string) => r.replace(/\{[^}]*\}/g, "{}").toLowerCase().replace(/\/$/, "");
const routeOf = new Map<string, any>();
for (const e of s.entries) if (e.kind === "http") for (const v of e.verbs) routeOf.set(`${v} ${norm(e.route)}`, e);
const hubPath = s.entries.find((e: any) => e.kind === "hub")?.route?.toLowerCase();
// SignalR 事件名运行时不分大小写（ReceiveMessage ↔ receiveMessage），其余按原样比
const byRoute = (kind: string, route: string) => all.entries.filter((e: any) => e.kind === kind
  && (kind === "hubEvent" ? e.route?.toLowerCase() === route.toLowerCase() : e.route === route));

const cross: any[] = [];
const peers = new Set<string>();                 // 前端调了、服务端没有对应端点的请求（外部服务，或路由写错 / 没抽到）
for (const e of c.edges) {
  const r = resource.get(e.to);
  if (!r) continue;
  const at = { file: e.file, line: e.line, args: e.args, when: e.when, async: false };
  if (r.kind === "api") {
    const [verb, path] = [r.label.split(" ")[0], r.label.slice(r.label.indexOf(" ") + 1)];
    const hit = routeOf.get(`${verb} ${norm(path)}`);
    if (hit) cross.push({ ...at, from: e.from, to: hit.method, kind: "request", label: `${verb} ${hit.route}`, entry: hit.id });
    else if (hubPath && norm(path) === hubPath) for (const h of s.entries.filter((x: any) => x.kind === "hub" && /Connected/.test(x.id)))
      cross.push({ ...at, from: e.from, to: h.method, kind: "connect", label: `WS ${hubPath}`, entry: h.id });
    else peers.add(r.label);
  } else if (r.kind === "tauri") {
    for (const t of byRoute("tauri", r.label)) cross.push({ ...at, from: e.from, to: t.method, kind: "invoke", label: r.label, entry: t.id });
  } else if (r.kind === "hubInvoke") {
    for (const h of s.entries.filter((x: any) => x.kind === "hub" && x.id.endsWith("." + r.label)))
      cross.push({ ...at, from: e.from, to: h.method, kind: "invoke", label: `WS ${h.route} ${r.label}`, entry: h.id });
  } else if (r.kind === "busEvent") {
    for (const t of byRoute("busEvent", r.label)) cross.push({ ...at, from: e.from, to: t.method, kind: "bus", label: r.label, entry: t.id });
  }
}
for (const e of s.edges) {
  const r = resource.get(e.to);
  if (r?.kind !== "hubEvent") continue;
  for (const t of byRoute("hubEvent", r.label))
    cross.push({ from: e.from, to: t.method, kind: "push", label: r.label, entry: t.id, file: e.file, line: e.line, args: e.args, when: e.when, async: true });
}

// Hub 事件信封：SendAsync("event", { type, … }) 一个事件名装多种类型。客户端按类型分支收的地方抽成「event#reply」入口；
// 服务端调发布方法（方法里直接 SendAsync）时首个字面量实参就是类型——两端对上才连，从真正发起推送的调用方连过去
const publisher = new Map<string, string>();   // 发布方法 → 事件名
for (const e of s.edges) { const r = resource.get(e.to); if (r?.kind === "hubEvent") publisher.set(e.from, r.label); }
for (const e of s.edges) {
  const ev = e.kind === "calls" && publisher.get(e.to), t = e.args?.[0];
  if (!ev || !t) continue;
  for (const x of byRoute("hubEvent", `${ev}#${t}`))
    cross.push({ from: e.from, to: x.method, kind: "push", label: `${ev} · ${t}`, entry: x.id, file: e.file, line: e.line, args: e.args, when: e.when, async: true });
}

// ---- 邻接：同端 calls/资源边 + 跨端边，按行号排（≈ 时序）；已接上对端的资源边只留跨端那条 ----
const bridged = new Set(cross.map((e: any) => `${e.from}|${e.line}`));
const out = new Map<string, any[]>();
for (const e of [...all.edges.filter((e: any) => !bridged.has(`${e.from}|${e.line}`) || e.kind === "calls"), ...cross]) {
  const list = out.get(e.from);
  if (list) list.push(e); else out.set(e.from, [e]);
}
for (const list of out.values()) list.sort((a, b) => a.line - b.line);

// ---- 业务循环：每个改状态的端点一个；触发者＝能走到它的客户端入口 ----
// 每个触发者一趟 BFS（不跨推送）：记下它能走到的全部方法的父指针，端点在里面就回溯出最短路径
const reachFrom = (from: string) => {
  const parent = new Map<string, string>([[from, ""]]);
  const q = [from];
  for (let i = 0; i < q.length; i++)
    for (const e of out.get(q[i]) ?? []) {
      if (e.kind === "push" || !method.has(e.to) || parent.has(e.to)) continue;
      parent.set(e.to, q[i]);
      q.push(e.to);
    }
  return parent;
};
const pathIn = (parent: Map<string, string>, target: string): string[] | null => {
  if (!parent.has(target)) return null;
  const path = [target];
  for (let p = parent.get(target)!; p; p = parent.get(p)!) path.unshift(p);
  return path;
};
const triggers = c.entries.filter((e: any) => ["ui", "render", "mount", "watch", "hubEvent", "busEvent"].includes(e.kind) && e.method);
const reach = triggers.map((t: any) => ({ t, parent: reachFrom(t.method) }));
const loops = s.entries.filter((e: any) => e.kind === "http" && e.verbs.some((v: string) => v !== "GET" && v !== "HEAD"))
  .map((ep: any) => {
    const by = reach.map(({ t, parent }: any) => ({ t, path: ep.method && pathIn(parent, ep.method) })).filter((x: any) => x.path);
    return {
      id: "loop:" + ep.id.slice(2), endpoint: ep.id, verbs: ep.verbs, route: ep.route, module: ep.module, summary: ep.summary,
      triggers: by.map(({ t, path }: any) => ({ entry: t.id, kind: t.kind, label: t.route, file: t.file, line: t.line, path })),
    };
  });

writeFileSync(outPath, JSON.stringify({
  schema: 1, generatedAt: new Date().toISOString(),
  server: { project: S.project, root: S.root, revision: S.revision, dirtyFiles: S.dirtyFiles },
  client: { project: C.project, revision: C.revision, dirtyFiles: C.dirtyFiles },
  ...all, cross, loops, flows, unmatched: [...peers].sort(),
}, null, 1));

const kinds = cross.reduce((a: any, e: any) => ((a[e.kind] = (a[e.kind] ?? 0) + 1), a), {});
console.log(`system: ${all.entries.length} entries · ${cross.length} cross links ${JSON.stringify(kinds)} · ` +
  `${loops.length} loops (${loops.filter((l: any) => l.triggers.length).length} with UI triggers) · ${flows.length} flows` +
  (peers.size ? `\n  前端调了、服务端没有对应端点的请求 ${peers.size} 条（外部服务，或路由写错）：${[...peers].sort().join(" · ")}` : ""));
