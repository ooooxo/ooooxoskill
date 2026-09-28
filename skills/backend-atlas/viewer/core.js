// atlas core：system.json 的一个业务循环 → 可渲染的循环模型（泳道 · 步骤树 · 触发者路径）
// 怎么用：import { loopModel, LANES } from "./core.js"; loopModel(system, loop, { budget })
// 需要：纯 ESM，零依赖；bun 构建时与浏览器 viewer 共用这一份，不各写一遍。

// 五条泳道：一次循环＝我方界面 → 我方客户端 → 服务端 → 存储 → 推送接收端（推给自己的其他设备，或推给对方）
export const LANES = [
  { id: "ui", name: "我方界面" },
  { id: "client", name: "我方客户端" },
  { id: "server", name: "服务端" },
  { id: "store", name: "存储" },
  { id: "peer", name: "推送接收端" },
];

const BUDGET = 400;   // 单循环展开节点上限；超出的分支标 more，viewer 里可再点开
const DEPTH = 16;


// ---------- [ 索引：一次建好，多个循环共用 ] ----------
export function indexSystem(sys) {
  const method = new Map(sys.methods.map((m) => [m.id, m]));
  const resource = new Map(sys.resources.map((r) => [r.id, r]));
  const entryOf = new Map(sys.entries.filter((e) => e.method).map((e) => [e.method, e]));
  const bridged = new Set(sys.cross.map((e) => `${e.from}|${e.line}`));
  const out = new Map();
  for (const e of [...sys.edges.filter((e) => e.kind === "calls" || !bridged.has(`${e.from}|${e.line}`)), ...sys.cross])
    (out.get(e.from) ?? out.set(e.from, []).get(e.from)).push(e);
  for (const l of out.values()) l.sort((a, b) => a.line - b.line);
  // 纯计算：整棵下游不碰任何资源 / 跨端的方法，默认折叠
  const effect = new Set([...out.values()].flat().filter((e) => e.kind !== "calls").map((e) => e.from));
  const callers = new Map();
  for (const l of out.values()) for (const e of l) if (e.kind === "calls") (callers.get(e.to) ?? callers.set(e.to, []).get(e.to)).push(e.from);
  const q = [...effect];
  while (q.length) for (const c of callers.get(q.pop()) ?? []) if (!effect.has(c)) { effect.add(c); q.push(c); }
  return { sys, method, resource, entryOf, out, effect };
}


// ---------- [ 一个节点落哪条泳道；推送之后的客户端节点一律归「对方」 ] ----------
export function laneOf(id, ix, afterPush) {
  const side = id.slice(0, 2);
  const m = ix.method.get(id), r = ix.resource.get(id);
  if (side === "S|") return m ? "server" : "store";
  if (afterPush) return "peer";
  if (r) return r.kind === "localTable" ? "client" : "client";
  const f = m?.file ?? "";
  return /\.(vue)$/.test(f) || /\/(components|views|pages|layouts|panel|widgets)\//.test(f) ? "ui" : "client";
}


// ---------- [ 循环模型：触发者（按钮文字 + 路径）+ 从端点展开的步骤树 ] ----------
export function loopModel(ix, loop, { budget = BUDGET } = {}) {
  let left = budget;
  const seen = new Set();
  const node = (id, e, afterPush, args) => {
    const m = ix.method.get(id), r = ix.resource.get(id);
    return {
      id, lane: laneOf(id, ix, afterPush), kind: m ? "method" : r?.kind ?? "?",
      // 跨端边以对端的名字为准：请求＝路由，本机调用＝命令名，推送＝事件名（处理函数名另放 via）
      label: ["request", "invoke", "push", "bus", "connect"].includes(e?.kind) ? e.label : m?.label ?? r?.label ?? id,
      via: ["push", "bus", "connect"].includes(e?.kind) ? m?.label ?? null : null,
      summary: m?.summary ?? ix.entryOf.get(id)?.summary ?? null,
      edge: e?.kind ?? "entry", when: e?.when ?? null, args: e?.args ?? [], async: !!e?.async,
      file: m?.file ?? e?.file ?? null, line: m?.line ?? e?.line ?? null, at: e ? { file: e.file, line: e.line } : null,
      side: id.slice(0, 1), pure: !!m && !ix.effect.has(id), kids: [], ref: false, more: false,
    };
  };
  const walk = (n, depth, afterPush, args) => {
    for (const e of ix.out.get(n.id) ?? []) {
      const target = ix.method.get(e.to);
      if (target?.util) continue;
      if (e.when && args.length && !compatible(e.when, args)) continue;
      if (left <= 0) { n.more = true; break; }
      left--;
      const push = afterPush || e.kind === "push";
      const nextArgs = e.kind === "push" || e.to.startsWith("S|") ? [...args, ...e.args] : args;
      const k = node(e.to, e, push, nextArgs);
      if (e.kind === "push") k.args = [...new Set(nextArgs)];   // 推送节点显示一路累积的 kind / op
      n.kids.push(k);
      if (!target) continue;
      if (seen.has(e.to)) { k.ref = true; continue; }
      seen.add(e.to);
      if (depth < DEPTH) walk(k, depth + 1, push, nextArgs); else k.more = true;
    }
  };
  const ep = ix.sys.entries.find((e) => e.id === loop.endpoint);
  const root = node(ep.method, null, false, []);
  root.label = `${loop.verbs.join(",")} ${loop.route}`;
  seen.add(ep.method);
  walk(root, 0, false, []);

  const triggers = loop.triggers.map((t) => ({
    label: t.label, kind: t.kind, file: t.file, line: t.line,
    path: t.path.map((id) => ({ id, label: ix.method.get(id)?.label ?? id, lane: laneOf(id, ix, false), file: ix.method.get(id)?.file, line: ix.method.get(id)?.line })),
  }));
  return {
    id: loop.id, verbs: loop.verbs, route: loop.route, module: loop.module, summary: loop.summary,
    triggers, root, truncated: left <= 0,
  };
}


// 推送载荷定分支：when 里带字面量（kind === "message"）时，只在累积参数含它才走
export function compatible(when, args) {
  const lits = [...when.matchAll(/["']([\w:-]+)["']/g)].map((m) => m[1]);
  if (!lits.length) return true;
  const neg = when.startsWith("!(") || /!==|!=/.test(when);
  const hit = lits.some((l) => args.includes(l));
  return neg ? !hit : hit;
}
