// atlas 图构建：system.json → 分层节点（泳道框 → 组卡 → 叶卡）+ 叶级聚合边 + 循环的有序边序列，内联进 graph.html 出一个自包含 HTML
// 怎么跑：bun viewer/build.ts <system.json> <semantics.json> <server-root> <client-root> <icons.ts> <out.html>
//        语义层文件不存在 = 按抽取结果生成一份骨架写到那个路径再出图（第一次接项目就这样起步）；SHARE=1 不把本机绝对路径写进 HTML
// 需要：bun；icons.ts 是图标注册表（默认 viewer/icons.ts，项目可换成自己的同名键注册表）；同目录 graph.html 模板与 Token.css。
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname } from "node:path";
import { indexSystem, loopModel } from "./core.js";
import { buildFlows } from "./flows.ts";

const ICONS = ["message", "user", "users", "laptop", "cloud", "layers", "bell", "lock", "rows", "grid", "refresh", "search", "plus",
  "chevRight", "chevDown", "close", "link", "fileText", "pulse", "share", "folder", "board", "info", "eye", "expand", "undo", "check"];

const [sysPath, semPath, serverRoot, clientRoot, iconsPath, outPath] = process.argv.slice(2);
if (!outPath) { console.error("usage: bun viewer/build.ts <system.json> <semantics.json> <server-root> <client-root> <icons.ts> <out.html>"); process.exit(2); }
const sys = JSON.parse(readFileSync(sysPath, "utf8"));
const fresh = !existsSync(semPath);
let SEM: any = fresh ? { lanes: [], domains: [] } : JSON.parse(readFileSync(semPath, "utf8"));
const ix = indexSystem(sys);
const { icons } = await import(iconsPath);

// ---- 节点层级：lane（框）→ group（组卡，可展开）→ leaf（叶卡）----
// col 决定左右位置：客户端 0–3 · 服务端 4–6 · 存储 7
const nodes = new Map<string, any>();
const put = (id: string, n: any) => { if (!nodes.has(id)) nodes.set(id, { id, kids: [], ...n }); return nodes.get(id); };
const group = (id: string, label: string, col: number, icon: string, sub?: string) => put(id, { level: 1, label, col, icon, sub });
const leaf = (id: string, parent: string | null, label: string, extra: any = {}) => {
  const n = put(id, { level: parent ? 2 : 1, label, parent, col: parent ? nodes.get(parent).col : extra.col, ...extra });
  if (parent && !nodes.get(parent).kids.includes(id)) nodes.get(parent).kids.push(id);
  return n;
};

const actionOf = new Map<string, any[]>();   // 动作方法 → 它的端点入口（一个方法可挂多条路由）
for (const e of sys.entries) if (e.side === "S|" && e.kind === "http") (actionOf.get(e.method) ?? actionOf.set(e.method, []).get(e.method)).push(e);

// 控制器组：端点动作按它入口所在的模块（Controller 类 / Minimal API 所在文件）；控制器类里的其它方法归同一组的「共用逻辑」
// 不按文件路径猜：Features/Users/UsersEndpoints.cs、一个文件放多个控制器都照样认
const modById = new Map<string, any>(sys.modules.filter((m: any) => m.side === "S|").map((m: any) => [m.id, m]));
const ctlTypes = new Map<string, string>([...modById.values()].filter((m: any) => m.kind === "controller").map((m: any) => [m.id.slice("S|c:".length), m.label]));
const ctlOf = (id: string): string | null => {
  const eps = actionOf.get(id);
  if (eps) return modById.get(eps[0].module)?.label ?? null;
  const m = ix.method.get(id);
  return m && ctlTypes.has(m.type) ? ctlTypes.get(m.type)! : null;
};
const entryFiles = (kind: string) => new Set(sys.entries.filter((e: any) => e.kind === kind && e.method).map((e: any) => ix.method.get(e.method)?.file));
const hubFiles = entryFiles("hub"), bgFiles = entryFiles("hosted");
const hubRoute = sys.entries.find((e: any) => e.kind === "hub")?.route ?? null;
const HUB_LABEL = hubRoute ? `实时 ${hubRoute}` : "实时";
// 项目专属的归属规则写在语义层 homes：{ pipe / hub / bg: [正则] } 匹配服务端相对路径（默认只认 Program.cs、Extensions/ 与入口所在文件）
const rx = (list?: string[]) => list?.length ? new RegExp(list.join("|")) : null;
const homePipe = rx(SEM.homes?.pipe), homeHub = rx(SEM.homes?.hub), homeBg = rx(SEM.homes?.bg);
const uiSplit = new Set<string>(SEM.uiSplit ?? []);   // 客户端这些目录再往下细分一层（src/panel/shell → panel/shell）

function leafOf(id: string): string | null {
  const m = ix.method.get(id), r = ix.resource.get(id);
  if (id.startsWith("S|")) {
    if (r) {
      if (r.kind === "table") return leaf("S:t:" + r.label, group("S:pg", SEM.database ?? "数据库", 7, "layers").id, r.label, { icon: "layers", kind: "table" }).id;
      if (r.kind === "hubEvent") return leaf("S:h:" + r.label, group("S:hub", HUB_LABEL, 6, "bell").id, r.label, { icon: "bell", kind: "event" }).id;
      // 抽取器按「发起调用的类」记外部资源，真正的目标地址多在运行时配置里、静态拿不到：
      // 每个调用方一张卡只是把调用方再画一遍，收成一张「出站 HTTP」，调用方记在卡上
      if (r.kind === "external") { const x = leaf("S:x:http", null, "出站 HTTP", { col: 7, icon: "share", kind: "external", callers: [] }); if (!x.callers.includes(r.label)) x.callers.push(r.label); return x.id; }
      if (r.kind === "disk") return leaf("S:disk", null, "本地磁盘", { col: 7, icon: "folder", kind: "external" }).id;
      if (r.kind === "cache") return leaf("S:cache", null, "内存缓存", { col: 7, icon: "pulse", kind: "external" }).id;
      return null;
    }
    if (!m || m.util) return null;
    const f = m.file;
    const ctl = ctlOf(id);
    if (ctl) {
      const g = group("S:c:" + ctl, ctl, 5, "cloud");
      const eps = actionOf.get(id);
      if (eps) {
        const e0 = eps[0];
        // Minimal API 的内联 lambda 没有方法名：标题用「动词 路由」
        return leaf("S:e:" + id, g.id, id.includes("|m:inline:") ? `${e0.verbs.join(",")} ${e0.route}` : m.label.split(".").pop(), {
          icon: "link", kind: "endpoint", verbs: [...new Set(eps.flatMap((e: any) => e.verbs))], routes: eps.map((e: any) => e.route),
          auth: e0.auth, rateLimit: e0.rateLimit, summary: e0.summary, file: f, line: e0.line, side: "S",
        }).id;
      }
      return leaf("S:ci:" + ctl, g.id, "共用逻辑", { icon: "rows", kind: "internal", file: f, side: "S" }).id;
    }
    const base = basename(f);
    const home = f === "Program.cs" || f.startsWith("Extensions/") || homePipe?.test(f) ? ["S:pipe", "HTTP 管线", 4, "lock"]
      : hubFiles.has(f) || homeHub?.test(f) ? ["S:hub", HUB_LABEL, 6, "bell"]
      : bgFiles.has(f) || homeBg?.test(f) ? ["S:bg", "后台任务", 6, "pulse"]
      : ["S:svc", "服务与访问规则", 6, "grid"];
    const g = group(home[0] as string, home[1] as string, home[2] as number, home[3] as string);
    return leaf("S:f:" + f, g.id, base.replace(/\.cs$/, ""), { icon: "fileText", kind: "file", file: f, side: "S" }).id;
  }
  // 客户端
  if (r) {
    if (r.kind === "localTable") return leaf("C:lt:" + r.label, group("C:sqlite", "本机 SQLite", 3, "layers").id, r.label, { icon: "layers", kind: "table" }).id;
    if (r.kind === "busEvent") return leaf("C:bus:" + r.label, group("C:bus", "窗口总线", 3, "share").id, r.label, { icon: "share", kind: "event" }).id;
    return null;
  }
  if (!m) return null;
  const f = m.file;
  const g = f.endsWith(".rs") ? group("C:rust", "本机 Rust", 2, "laptop")
    : /^(src\/)?(stores?|pinia|state)\//.test(f) ? group("C:stores", "状态 stores", 1, "rows")
    : /^(src\/)?(services|api|apis|http|requests?|realtime|sockets?)\//.test(f) || /^(src\/)?[\w-]*(api|http|hub|realtime|socket|signalr)[\w-]*\.[jt]s$/i.test(f) ? group("C:svc", "请求与推送", 1, "share")
    : (() => { const seg = f.split("/"); const area = uiSplit.has(seg[1]) && seg.length > 3 ? `${seg[1]}/${seg[2]}` : seg.length > 2 ? seg[1] : "src"; return group("C:ui:" + area, area, 0, "user"); })();
  return leaf("C:f:" + f, g.id, basename(f), { icon: f.endsWith(".vue") ? "board" : "fileText", kind: "file", file: f, side: "C" }).id;
}

// ---- 叶级边：同一对叶 + 同一种类聚合，留一个代表调用点 ----
const EDGE_KIND: Record<string, string> = { calls: "calls", reads: "reads", writes: "writes", updates: "writes", pushes: "pushes", push: "push",
  request: "request", invoke: "invoke", bus: "bus", emits: "emits", http: "http", io: "io", cache: "cache", connect: "connect", api: "request" };
const edges = new Map<string, any>();
const addEdge = (e: any) => {
  const a = leafOf(e.from), b = leafOf(e.to), k = EDGE_KIND[e.kind];
  if (!a || !b || a === b || !k) return;
  const key = `${a}|${b}|${k}`;
  const x = edges.get(key) ?? edges.set(key, { a, b, k, n: 0, labels: [], at: { side: e.from.slice(0, 1), file: e.file, line: e.line } }).get(key);
  x.n++;
  const lbl = e.kind === "push" || e.kind === "pushes" ? (e.label ?? ix.resource.get(e.to)?.label) : e.label;
  if (lbl && !x.labels.includes(lbl) && x.labels.length < 6) x.labels.push(lbl);
};
for (const list of ix.out.values()) for (const e of list) addEdge(e);

// ---- 循环：循环模型按 DFS 顺序映射成叶级步骤（去掉同叶、连续重复）----
const loops = sys.loops.map((l: any) => {
  const m = loopModel(ix, l, { budget: 600 });
  const steps: any[] = [];
  const seen = new Set<string>();
  const push = (a: string | null, b: string | null, k: string, label?: string) => {
    if (!a || !b || a === b) return;
    const key = `${a}|${b}|${k}`;
    if (seen.has(key)) return;
    seen.add(key);
    steps.push({ a, b, k, label });
  };
  const t = m.triggers[0];
  if (t) for (let i = 1; i < t.path.length; i++) {
    const last = i === t.path.length - 1;
    push(leafOf(t.path[i - 1].id), leafOf(t.path[i].id), last ? "request" : "calls", last ? `${l.verbs.join(",")} ${l.route}` : undefined);
  }
  const walk = (n: any) => {
    if (n.pure) return;
    for (const k of n.kids) {
      if (k.pure) continue;
      const lbl = k.edge === "push" ? [k.label, ...k.args].join(" ") : k.edge === "request" || k.edge === "invoke" ? k.label
        : ["reads", "writes", "updates"].includes(k.edge) ? k.label : undefined;
      push(leafOf(n.id), leafOf(k.id), EDGE_KIND[k.edge] ?? "calls", lbl);
      if (!k.ref) walk(k);
    }
  };
  walk(m.root);
  const ep = leafOf(sys.entries.find((e: any) => e.id === l.endpoint).method);
  const key = `${l.verbs.join(",")} ${l.route}`;
  const [name, story] = SEM.loops?.[key] ?? [key, null];
  return {
    id: l.id, verbs: l.verbs, route: l.route, name, story,
    summary: l.summary, endpoint: ep, triggers: m.triggers.map((x: any) => ({ label: x.label, file: x.file, line: x.line })), steps,
  };
});

// loops 里写了、图上没有的键：多半是路由大小写（[controller] 取类名原样）或端点已删，报出来而不是静默不显示
{
  const real = new Set(sys.loops.map((l: any) => `${l.verbs.join(",")} ${l.route}`));
  const bad = Object.keys(SEM.loops ?? {}).filter((k) => !real.has(k));
  if (bad.length) {
    const hint = (k: string) => [...real].find((r) => (r as string).toLowerCase() === k.toLowerCase());
    throw new Error(`语义层 loops 里这些键对不上任何业务循环（只有非 GET 的 HTTP 端点成循环）：\n  ${bad.map((k) => hint(k) ? `${k}  → 是不是 ${hint(k)}` : k).join("\n  ")}`);
  }
}

// ---- 第一次接项目：语义层文件不存在就按顶层节点生成一份骨架（每个控制器组一个域），写下来再照常出图 ----
if (fresh) {
  const tops0 = [...nodes.values()].filter((n) => !n.parent).map((n) => n.id);
  const has = (p: string) => tops0.some((id) => p.endsWith("*") ? id.startsWith(p.slice(0, -1)) : id === p);
  const HUES = ["purple", "pink", "blue", "teal", "orange", "green", "yellow"];
  const client = [
    { id: "client.ui", name: "界面", col: 0, icon: "board", hue: "blue", match: ["C:ui:*"] },
    { id: "client.stores", name: "状态", col: 1, icon: "rows", hue: "blue", match: ["C:stores"] },
    { id: "client.svc", name: "请求与推送", col: 2, icon: "share", hue: "blue", match: ["C:svc"] },
    { id: "client.desktop", name: "桌面端", col: 3, icon: "laptop", hue: "blue", match: ["C:rust", "C:sqlite", "C:bus"] },
  ].map((d) => ({ ...d, match: d.match.filter(has) })).filter((d) => d.match.length);
  const ctls = tops0.filter((id) => id.startsWith("S:c:")).sort();
  SEM = {
    title: `${sys.server.project} 系统图`, subtitle: "语义层骨架：按控制器分域，改名字、合并域、写循环故事后重跑",
    lanes: [{ id: "client", name: "客户端", cols: [0, 1, 2, 3] }, { id: "server", name: "服务端", cols: [4, 5, 6] }, { id: "store", name: "存储与外部", cols: [7] }],
    domains: [
      ...(client.length ? [{ id: "client", name: "前端", col: 1, icon: "laptop", hue: "blue", spread: true, children: client }] : []),
      { id: "pipe", name: "HTTP 管线", col: 4, icon: "lock", hue: "yellow", match: ["S:pipe", "S:cache"].filter(has) },
      { id: "hub", name: "实时", col: 4, icon: "bell", hue: "yellow", match: ["S:hub"].filter(has) },
      ...ctls.map((id, i) => ({ id: id.slice(4).toLowerCase(), name: id.slice(4), col: 5, icon: "cloud", hue: HUES[i % HUES.length], match: [id] })),
      { id: "svc", name: "服务", col: 6, icon: "grid", hue: "gray", match: ["S:svc", "S:bg"].filter(has) },
      { id: "db", name: "数据库", col: 7, icon: "layers", hue: "green", match: ["S:pg"].filter(has) },
      { id: "ext", name: "外部", col: 7, icon: "cloud", hue: "gray", match: ["S:x:*", "S:disk"].filter(has) },
    ].filter((d: any) => d.children || d.match.length),
    groups: {},
    loops: Object.fromEntries(sys.loops.map((l: any) => { const k = `${l.verbs.join(",")} ${l.route}`; return [k, [k, ""]]; })),
    edgeLabels: [],
  };
  writeFileSync(semPath, JSON.stringify(SEM, null, 2) + "\n");
  console.log(`语义层 ${semPath} 不存在，已按抽取结果生成骨架（${SEM.domains.length} 个域）。改域名 / 合并域 / 给循环起人话名后重跑即可`);
}

// ---- 语义层：业务域挂在最上层；先按叶 id、再按组 id 认领；没被认领的节点直接报错 ----
const glob = (pat: string, id: string) => pat.endsWith("*") ? id.startsWith(pat.slice(0, -1)) : pat === id;
const domains: any[] = [];
const walkDom = (d: any, parent: string | null) => {
  const id = "D:" + d.id;
  domains.push({ ...d, nid: id, parent });
  put(id, { label: d.name, route: d.route ?? null, sub: d.sub ?? [], desc: d.desc ?? null, col: d.col, icon: d.icon ?? "grid", parent, spread: !!d.spread, kind: "domain", hue: d.hue ?? null });
  if (parent) nodes.get(parent).kids.push(id);
  for (const c of d.children ?? []) walkDom(c, id);
};
for (const d of SEM.domains) walkDom(d, null);
const claim = (id: string) => domains.find((d) => (d.match ?? []).some((p: string) => glob(p, id)))?.nid;
const tops = [...nodes.values()].filter((n) => !n.parent && n.kind !== "domain");
const taken = new Map<string, string[]>();   // 域 → 认领到的组 / 叶
const orphans: string[] = [];
for (const g of tops) {
  // 组里被单独点名的叶先走（例：ConversationAccess.cs 从「服务」组里被会话域领走）
  for (const k of [...g.kids]) {
    const d = domains.find((x) => (x.match ?? []).some((p: string) => p === k));
    if (d) { g.kids = g.kids.filter((x: string) => x !== k); (taken.get(d.nid) ?? taken.set(d.nid, []).get(d.nid)).push(k); }
  }
  const d = claim(g.id);
  if (!d) { orphans.push(g.id); continue; }
  (taken.get(d) ?? taken.set(d, []).get(d)).push(g.id);
}
if (orphans.length) throw new Error(`语义层没认领这些节点：${orphans.join(", ")}`);
const svcLeaves = new Set<string>(nodes.get("S:svc")?.kids ?? []);   // 「服务」组里没被点名的文件：下面按谁真在用重新归位
for (const [d, ids] of taken) {
  const dn = nodes.get(d);
  const groups = ids.filter((id) => nodes.get(id).kids.length && !nodes.get(id).parent);
  // 只领到一个组：把组压平进域，少一层无意义的嵌套
  const flat = groups.length === 1 ? [...nodes.get(groups[0]).kids, ...ids.filter((id) => id !== groups[0])] : ids;
  if (groups.length === 1) nodes.delete(groups[0]);
  for (const id of flat) { const n = nodes.get(id); n.parent = d; n.col = dn.col; dn.kids.push(id); }
}
for (const n of nodes.values()) if (n.parent && !nodes.has(n.parent)) throw new Error(`悬空父节点 ${n.parent} ← ${n.id}`);
// 域内按业务功能再分一层：规则匹配「名字 动词 路由 文件」，第一个命中的组收下；漏一个就报错
for (const [pid, rules] of Object.entries(SEM.groups ?? {}) as [string, any[]][]) {
  const parent = nodes.get(pid);
  if (!parent) throw new Error(`groups 里的父节点不存在：${pid}`);
  const key = (n: any) => `${n.label} ${(n.verbs ?? []).join(",")} ${(n.routes ?? []).join(" ")} ${n.file ?? ""}`;
  const gids = rules.map((r) => {
    const id = `${pid}/${r.name}`;
    put(id, { label: r.name, icon: r.icon ?? "grid", col: parent.col, parent: pid, kind: "group", sub: [] });
    return id;
  });
  const left: string[] = [];
  for (const k of parent.kids) {
    const i = rules.findIndex((r) => r.match.some((re: string) => new RegExp(re).test(key(nodes.get(k)))));
    if (i < 0) { left.push(nodes.get(k).label); continue; }
    nodes.get(k).parent = gids[i]; nodes.get(gids[i]).kids.push(k);
  }
  if (left.length) throw new Error(`${pid} 里这些没被分组认领：${left.join(", ")}`);
  parent.kids = gids.filter((g) => nodes.get(g).kids.length);
  for (const g of gids) if (!nodes.get(g).kids.length) nodes.delete(g);
}
// ---- 服务文件按「谁真在用」归位：从每个控制器方法沿 calls 走进服务文件，记下触达它的域 ----
// 只一个域用 = 那个域的内部实现，搬回去；多个域用 = 真共享，留在共享域按目录分组；后台服务单列。
// 顺带记下控制器调到别的域控制器的地方（跨域直调）。
const leafIdOf = (id: string): string | null => {
  const m = ix.method.get(id);
  if (!m || m.util || !id.startsWith("S|")) return null;
  const ctl = ctlOf(id);
  if (ctl) return actionOf.has(id) ? "S:e:" + id : "S:ci:" + ctl;
  return "S:f:" + m.file;
};
const nearDom = (id: string): string | null => { let n = nodes.get(id); while (n && n.kind !== "domain") n = nodes.get(n.parent); return n?.id ?? null; };
const isCtl = (id: string) => id.startsWith("S:e:") || id.startsWith("S:ci:");
// 没有任何端点的「控制器」是基类 / 帮手（V4ControllerBase 之类），调它不算跨域
const epFiles = new Set([...nodes.keys()].filter((k) => k.startsWith("S:e:")).map((k) => nodes.get(k).file));
const baseCtl = new Set([...nodes.keys()].filter((id) => id.startsWith("S:ci:") && !epFiles.has(nodes.get(id).file)));
const reach = new Map<string, Set<string>>();
const tableUse = new Map<string, { w: Set<string>; r: Set<string> }>();   // 表 → 哪些域的请求最终写 / 读到它（穿过共享 store 追到底）
const cross = new Map<string, any>();
// 起点：控制器方法 + 语义层点名给某个域的服务文件里的方法（Agent 轮次这类后台域自己也调积分、写表）
for (const mid of ix.method.keys()) {
  const L = leafIdOf(mid);
  if (!L || !nodes.has(L) || !(isCtl(L) || (L.startsWith("S:f:") && !svcLeaves.has(L) && nearDom(L)))) continue;
  const D0 = nearDom(L)!;
  const seen = new Set([mid]), st = [mid];
  while (st.length) for (const e of ix.out.get(st.pop()!) ?? []) {
    const r = ix.resource.get(e.to);
    if (r?.kind === "table") {
      const u = tableUse.get("S:t:" + r.label) ?? tableUse.set("S:t:" + r.label, { w: new Set(), r: new Set() }).get("S:t:" + r.label)!;
      (e.kind === "reads" ? u.r : u.w).add(D0);
    }
    if (e.kind !== "calls" || seen.has(e.to)) continue;
    seen.add(e.to);
    const T = leafIdOf(e.to);
    if (!T || !nodes.has(T)) continue;
    if (isCtl(T)) {
      if (nearDom(T) !== D0 && !baseCtl.has(T)) { const k = L + "\t" + T; const x = cross.get(k) ?? cross.set(k, { a: L, b: T, n: 0, at: { side: "S", file: e.file, line: e.line } }).get(k); x.n++; }
      continue;
    }
    if (!svcLeaves.has(T)) continue;
    (reach.get(T) ?? reach.set(T, new Set()).get(T)!).add(D0);
    st.push(e.to);
  }
}
const hosted = new Set(sys.entries.filter((e: any) => e.kind === "hosted" && e.method).map((e: any) => "S:f:" + ix.method.get(e.method)?.file));
const svcDom = [...svcLeaves].map(nearDom).find(Boolean) ?? null;
const sub = (pid: string, name: string, icon: string, desc?: string) => {
  const id = `${pid}/${name}`;
  if (!nodes.has(id)) { put(id, { label: name, icon, col: nodes.get(pid).col, parent: pid, kind: "group", sub: [], desc: desc ?? null }); nodes.get(pid).kids.push(id); }
  return id;
};
const move = (id: string, pid: string) => {
  const n = nodes.get(id), old = nodes.get(n.parent);
  if (old) old.kids = old.kids.filter((k: string) => k !== id);
  n.parent = pid; nodes.get(pid).kids.push(id);
};
if (svcDom) {
  const shared: string[] = [];
  for (const id of svcLeaves) {
    const doms = reach.get(id) ?? new Set<string>();
    nodes.get(id).usedBy = [...doms];
    if (hosted.has(id)) move(id, sub(svcDom, "后台任务", "pulse", "随进程常驻的后台服务"));
    else if (doms.size === 1) move(id, sub([...doms][0], "内部实现", "fileText", "只有本域用到的服务文件"));
    else shared.push(id);
  }
  const folder = (id: string) => { const f = nodes.get(id).file; return f.includes("/") ? f.split("/")[0] + "/" : "根目录"; };
  const size = new Map<string, number>();
  for (const id of shared) size.set(folder(id), (size.get(folder(id)) ?? 0) + 1);
  // 共享件多时按目录分组；只有一个文件的目录不单开组，直接挂在域下
  for (const id of shared) move(id, shared.length > 12 && size.size > 1 && size.get(folder(id))! > 1 ? sub(svcDom, folder(id), "folder") : svcDom);
}
// 搬空的组（原「服务」组之类）摘掉
for (const [id, n] of nodes) if ((!n.kind || n.kind === "group") && !n.kids.length) {
  const p = nodes.get(n.parent);
  if (p) p.kids = p.kids.filter((k: string) => k !== id);
  nodes.delete(id);
}

// 组内叶的 col 跟组走；域卡的数：直接孩子数
const colDown = (n: any) => { for (const k of n.kids) { const c = nodes.get(k); if (!n.spread) c.col = n.col; colDown(c); } };
for (const n of nodes.values()) if (!n.parent) colDown(n);
for (const n of nodes.values()) if (n.kids.length) n.count = n.kids.length;
// 叶 → 所属域（循环按域分组、边标签按域对取）
const domainOf = (id: string): string => { let n = nodes.get(id); while (n && n.kind !== "domain") n = nodes.get(n.parent); return n?.id ?? ""; };
for (const l of loops) l.domain = domainOf(l.endpoint);
// 端点卡用业务循环的名字当标题（Send → 发消息）；功能组没写说明时，用组里循环的名字拼一句
// 只有语义层给过人话名才用；没给时 name 就是「动词 路由」，当标题会被截成「POST…」，不如方法名
for (const l of loops) { const ep = nodes.get(l.endpoint); if (ep && !ep.human && SEM.loops?.[`${l.verbs.join(",")} ${l.route}`]) ep.human = l.name; }
for (const n of nodes.values()) if (n.kind === "group" && !n.desc) {
  const names = n.kids.map((k: string) => nodes.get(k)).map((c: any) => c.human ?? null).filter(Boolean);
  if (names.length) n.desc = [...new Set(names)].join("、");
}

// ---- 体检：图的重点。规则全是确定性的，命中项带上要点亮的节点；跨域直调 / 直连外部的边标 f，画布上单独着色 ----
const lbl = (id: string) => { const n = nodes.get(id); return n.kind === "endpoint" ? `${basename(n.file, ".cs")}.${n.label}` : n.kind === "internal" ? basename(n.file, ".cs") : n.human ?? n.label; };
const dlbl = (id: string | null) => (id && nodes.get(id)?.label) ?? "?";
const flagEdge = (a: string, b: string, k: string) => { const x = edges.get(`${a}|${b}|${k}`); if (x) x.f = true; };
for (const x of cross.values()) flagEdge(x.a, x.b, "calls");
const httpBy = new Map<string, any>();   // 控制器文件 → 它直接发出的外呼
for (const list of ix.out.values()) for (const e of list) {
  if (e.kind !== "http") continue;
  const a = leafIdOf(e.from), b = leafOf(e.to);
  if (!a || !isCtl(a) || !b || !nodes.has(a)) continue;
  flagEdge(a, b, "http");
  const f = nodes.get(a).file;
  const x = httpBy.get(f) ?? httpBy.set(f, { f, n: 0, nodes: new Set(), at: { side: "S", file: e.file, line: e.line } }).get(f);
  x.n++; x.nodes.add(a); x.nodes.add(b);
}
const ctlHome = new Map<string, string>();   // 控制器名 → 它所在的域：认出「共享件住在某个业务域的目录里」
for (const id of nodes.keys()) if (isCtl(id)) ctlHome.set(basename(nodes.get(id).file, ".cs").replace(/Controller$/, ""), nearDom(id)!);
const hot = [...svcLeaves].filter((id) => nodes.has(id) && (reach.get(id)?.size ?? 0) >= 3).sort((a, b) => reach.get(b)!.size - reach.get(a)!.size);
const writers = new Map<string, Set<string>>();
for (const e of edges.values()) if (e.k === "writes") (writers.get(e.b) ?? writers.set(e.b, new Set()).get(e.b)!).add(e.a);
const findings = [
  { id: "cross", title: "跨域直调", why: "一个域的控制器直接调另一个域的控制器：两个域绑在一起，改一边要看另一边。",
    items: [...cross.values()].map((x) => ({ label: `${lbl(x.a)} → ${lbl(x.b)}`, sub: `${dlbl(nearDom(x.a))} → ${dlbl(nearDom(x.b))}`, n: x.n, nodes: [x.a, x.b], at: x.at })) },
  { id: "http", title: "控制器直连外部", why: "控制器里直接发 HTTP 出去，没经过一层通道：换供应商、加重试 / 计费都得改控制器。",
    items: [...httpBy.values()].sort((a, b) => b.n - a.n).map((x) => ({ label: basename(x.f, ".cs"), sub: `${dlbl(nearDom([...x.nodes][0]))} · ${x.n} 处外呼`, n: x.n, nodes: [...x.nodes], at: x.at })) },
  { id: "hot", title: "共享热点", why: "被 3 个及以上域用到的服务文件：集中是好事，但改它要回归所有用到的域；住在某个业务域目录里的，多半是放错了地方。",
    items: hot.map((id) => {
      const n = nodes.get(id), doms = [...reach.get(id)!], dir = n.file.split("/")[0], home = n.file.includes("/") ? ctlHome.get(dir) : undefined;
      return { label: basename(n.file, ".cs"), sub: `${doms.length} 个域用${home && home !== svcDom ? ` · 却住在「${dlbl(home)}」的 ${dir}/ 目录里` : ""}`, n: doms.length, misplaced: !!(home && home !== svcDom), nodes: [id, ...doms], at: { side: "S", file: n.file, line: 1 } };
    }).sort((a, b) => +b.misplaced - +a.misplaced) },
  { id: "unmatched", title: "前端调用没对上", why: "前端请求的路径在服务端找不到对应端点：可能是外部服务、路由写错，或端点没被抽到（这条循环在图上就断了）。",
    items: (sys.unmatched ?? []).map((u: string) => {
      const from = [...new Set(sys.edges.filter((e: any) => e.to === "C|api:" + u).map((e: any) => leafOf(e.from)).filter(Boolean))] as string[];
      const e0 = sys.edges.find((e: any) => e.to === "C|api:" + u);
      return { label: u, sub: from.map((id) => nodes.get(id)?.label).filter(Boolean).join(" · ") || "前端", n: from.length, nodes: from, at: e0 ? { side: "C", file: e0.file, line: e0.line } : undefined };
    }) },
  { id: "write", title: "多域共写", why: "同一张表被不同域的代码直接写：写入规则散在各处，没有唯一入口。经同一个 store 写的不算。",
    items: [...writers].map(([t, ws]) => [t, [...ws], new Set([...ws].map(nearDom))] as const).filter(([, , ds]) => ds.size >= 2)
      .map(([t, ws, ds]) => ({ label: nodes.get(t).label, sub: [...ds].map(dlbl).join(" / "), n: ds.size, nodes: [t, ...ws] })) },
];
for (const n of nodes.values()) if (n.usedBy) n.usedBy = n.usedBy.map(dlbl);
for (const [t, u] of tableUse) if (nodes.has(t)) Object.assign(nodes.get(t), { writers: [...u.w], readers: [...u.r] });

// ---- 流程：控制流骨架 → 流程树（语义层整理过的按锚点核对，其余自动草稿），挂到所属域与业务循环上 ----
const flowsOut = `${dirname(sysPath)}/flows`;
const flows = buildFlows(sys, SEM, {
  ix,
  label: (id: string) => nodes.get(id)?.label ?? id,
  domOf: (m: string) => { const L = leafIdOf(m); return L && nodes.has(L) ? nearDom(L) : null; },
  cardOf: (m: string) => { const L = leafIdOf(m); return L && nodes.has(L) ? L : null; },
  loopOf: (entryId: string) => { const sl = sys.loops.find((x: any) => x.endpoint === entryId); return sl ? loops.find((l: any) => l.id === sl.id) : null; },
  entryOf: (id: string) => sys.entries.find((e: any) => e.id === id),
}, flowsOut);

const data = {
  // 管线域 / 实时域 = 认领了 S:pipe / S:hub 的那个域（循环步骤里请求经管线、推送经 Hub 靠它们），域名随意起
  title: SEM.title, subtitle: SEM.subtitle, lanes: SEM.lanes, findings, shared: svcDom, pipeDom: claim("S:pipe") ?? null, hubDom: claim("S:hub") ?? null,
  edgeLabels: (SEM.edgeLabels ?? []).map((x: any) => ({ a: "D:" + x.from, b: "D:" + x.to, label: x.label })),
  roots: process.env.SHARE === "1" ? { S: "", C: "" } : { S: sys.server.root ?? serverRoot, C: clientRoot },   // 只给 ⌘ 点开源码用；SHARE=1 不带本机路径
  revisions: { S: sys.server, C: sys.client },
  nodes: [...nodes.values()], edges: [...edges.values()], loops, flows,
  icons: Object.fromEntries(ICONS.map((n) => { if (!icons[n]) throw new Error(`icon missing: ${n}`); return [n, icons[n]]; })),
  generatedAt: sys.generatedAt,
};
const here = import.meta.dir;   // 不用 URL.pathname：路径里的空格 / 中文会被百分号编码
const html = readFileSync(`${here}/graph.html`, "utf8")
  .replace("/*__TOKENS__*/", () => readFileSync(`${here}/Token.css`, "utf8"))
  .replace("/*__FLOWCSS__*/", () => readFileSync(`${here}/flow.css`, "utf8"))
  .replace("/*__FLOW__*/", () => readFileSync(`${here}/flow.js`, "utf8"))
  .replace("/*__DATA__*/null", () => JSON.stringify(data).replace(/</g, "\\u003c"));   // 代码里的 "</script>" 字面量不能截断页面
writeFileSync(outPath, html);
console.log(`流程 ${flows.length} 条 · 已整理 ${flows.filter((f: any) => f.source === "sem").length} · 草稿 ${flows.filter((f: any) => f.source === "auto").length} · 大纲 ${flowsOut}/index.md`);
console.log(`${outPath}: ${data.nodes.length} nodes (${data.nodes.filter((n) => !n.parent).length} top) · ${data.edges.length} edges · ${loops.length} loops · ${(html.length / 1024).toFixed(0)} KB`);
