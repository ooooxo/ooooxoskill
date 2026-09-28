// atlas 流程：服务端控制流骨架（extractor/Flows.cs）→ 可看的流程树。语义层 flows 里 agent 整理过的按锚点核对，没整理的自动出草稿。
// 怎么用：build.ts 调 buildFlows(...)；同时在 system.json 旁写 flows/ 大纲：index.md（一行一条，草稿按复杂度排）+ 每条流程一个文件（节点带锚点键）。
//        agent 先读索引、再只读要整理的那一条，不用把全部流程读进上下文。
// 需要：system.json 里的 flows（join.ts 带进来）+ 语义层 flows（可选）。锚点对不上直接抛错，列出是哪条流程的哪个节点。
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

type Fact = { k: string; t: string; file: string; line: number; key: string; method?: string; note?: string; code?: string; how?: string; args?: string[]; kids?: Fact[] };
type Ctx = { ix: any; label: (nodeId: string) => string; domOf: (methodId: string) => string | null; cardOf: (methodId: string) => string | null; loopOf: (entryId: string) => any; entryOf: (id: string) => any };

// 结局语气：状态词 → 人话 + 语气；throw 一律失败
const STATUS: Record<string, [string, string]> = { done: ["完成", "ok"], blocked: ["等用户", "wait"], limited: ["限额", "warn"], failed: ["失败", "fail"], stopped: ["停止", "stop"], interrupted: ["中断", "stop"] };
const RES: Record<string, string> = { writes: "w", updates: "w", reads: "r", pushes: "p", http: "h" };
const VERB: Record<string, string> = { w: "写", r: "读", p: "推", h: "调" };

// 这一步读写 / 推送 / 外呼了什么：方法自己的，加它直接调到的下一层（Grant → Apply 才写表）；推送的事件名取调用点实参（Publish(…, "turn_started")）
function resOf(ctx: Ctx, f: Fact): string[] {
  if (!f.method) return [];
  const out = new Set<string>();
  const methods = [f.method, ...(f.kids ?? []).filter((k) => k.k === "call" && k.method).map((k) => k.method!)];
  for (const e of methods.flatMap((m) => ctx.ix.out.get(m) ?? [])) {
    const k = RES[e.kind], r = ctx.ix.resource.get(e.to);
    if (!k || !r) continue;
    out.add(`${k}:${k === "p" && f.args?.length ? f.args[0] : r.label}`);
  }
  // 经自家通道推送（Publish(…, "turn_started") 走 Redis 流，Walker 看不到直接的推送边）：按方法名 + 事件名形状的实参认
  if (/Publish|Emit|Broadcast|Notify/.test(f.key.split("›call:")[1] ?? "") && f.args?.[0] && /^[a-z][a-z_.]*$/.test(f.args[0])) out.add(`p:${f.args[0]}`);
  return [...out];
}
const laneOf = (f: Fact) => /Tool\b|Tools\.cs|Tool\./.test(f.key) ? "tool" : /Provider|ModelGateway|Stream/.test(f.key) ? "model" : undefined;
const exitOf = (f: Fact) => {
  if (f.how === "throw") return { k: "exit", t: f.code ?? "异常", why: f.t, tone: "fail" };
  const [head, ...rest] = f.t.split(" · ");
  const st = STATUS[head];
  return st ? { k: "exit", t: st[0], why: rest.join(" · ") || head, tone: st[1] } : { k: "exit", t: "结束", why: f.t, tone: "ok" };
};

// ---- 自动草稿：事实节点 → 流程树节点（与 docs/lab/loop-mindmap.html 同一套 k） ----
// 草稿只留控制流上有意义的：护栏、结局、分岔、循环、交给后台、会写 / 推 / 外呼的步骤；纯往下调的中间层拆掉，把它里面有意义的提上来
const meaningful = (n: any) => n.k !== "step" || n.r?.some((r: string) => /^[wph]:/.test(r)) || n.t.startsWith("循环") || n.t === "交给后台";
const hoist = (kids: any[]): any[] => kids.flatMap((c) => meaningful(c) ? [c] : c.kids);
function conv(ctx: Ctx, f: Fact): any {
  const base = { at: f.key, a: `${f.file}:${f.line}`, file: f.file, line: f.line };
  const kids = hoist((f.kids ?? []).map((k) => conv(ctx, k)).filter(Boolean));
  switch (f.k) {
    case "call": return { ...base, k: "step", t: f.args?.length ? `${f.t} · ${f.args[0]}` : f.t, r: resOf(ctx, f), l: laneOf(f), kids };
    // 护栏里提前 return 的普通原话（return BadRequest("…") 这类）是拒绝，不是完成
    case "guard": return { ...base, k: "guard", t: f.t + "？", kids: kids.map((k: any) => k.k === "exit" && k.t === "结束" ? { ...k, t: "拒绝", tone: "fail" } : k) };
    case "exit": return { ...base, ...exitOf(f), kids: [] };
    case "if": {
      // 一支以结局收尾、另一支没有：没结局的那支是主路
      const ends = kids.map((c: any) => c.kids.at(-1)?.k === "exit");
      kids.forEach((c: any, i: number) => { if (ends.length === 2 && ends[i] === false && ends[1 - i]) c.main = true; });
      return kids.length ? { ...base, k: "branch", t: f.t + "？", kids } : null;
    }
    case "then": case "else": case "case": return kids.length ? { ...base, k: "case", t: f.t, kids } : null;   // 里面什么都没剩的一支不画
    case "switch": return kids.length ? { ...base, k: "branch", t: f.t, kids } : null;
    case "loop": return kids.length ? { ...base, k: "step", t: "循环：" + f.t, kids } : null;
    case "catch": return { ...base, k: "guard", t: "出错：" + f.t, kids };
    case "try": return kids.length === 1 ? kids[0] : { ...base, k: "step", t: "try", kids };
    case "bg": return { ...base, k: "step", t: "交给后台", l: "bg", kids };
    case "link": return { ...base, k: "link", t: f.t, flow: f.method ? "S|bgrun:" + f.method.slice(2) : undefined, kids: [] };
    default: return null;
  }
}

const size = (n: Fact): number => 1 + (n.kids ?? []).reduce((a, k) => a + size(k), 0);

// 顶层：try 摊平、包着循环的那层调用（Run → 主循环）提上来，按循环切阶段：循环前 / 每个循环 / 循环后 / 出错时
function draft(ctx: Ctx, flow: any) {
  const unwrap = (list: Fact[]): Fact[] => list.flatMap((n) =>
    n.k === "try" ? [...unwrap((n.kids ?? []).filter((k) => k.k !== "catch")), ...(n.kids ?? []).filter((k) => k.k === "catch")]
    : n.k === "call" && n.kids?.some((k) => k.k === "loop" && size(k) >= 20) ? unwrap(n.kids).map((k) => k.k === "loop" && size(k) >= 20 ? { ...k, note: n.t } : k)
    : [n]);
  const seq = unwrap(flow.root.kids ?? []);
  const phases: any[] = [];
  let cur: any = { k: "phase", t: "开始", kids: [] };
  const errs: any = { k: "phase", t: "出错时", kids: [] };
  for (const n of seq) {
    if (n.k === "loop" && size(n) >= 20) {   // 小循环（拼一段说明的 foreach）不单成阶段
      if (cur.kids.length) phases.push(cur);
      const cond = n.t === "true" ? "一直跑到出结局" : n.t.length > 24 ? n.t.slice(0, 24) + "…" : n.t;
      phases.push({ k: "phase", t: n.note ?? "循环", loop: cond, at: n.key, kids: hoist((n.kids ?? []).map((k) => conv(ctx, k)).filter(Boolean)) });
      cur = { k: "phase", t: "收尾", kids: [] };
    } else if (n.k === "catch") errs.kids.push(conv(ctx, n));
    else { const c = conv(ctx, n); if (c) cur.kids.push(...hoist([c])); }
  }
  if (cur.kids.length) phases.push(cur);
  // 没有循环：打头的一串护栏单列成「校验」
  if (phases.length === 1 && !phases[0].loop) {
    const lead = phases[0].kids.findIndex((k: any) => k.k !== "guard");
    if (lead > 0) phases.splice(0, 1, { k: "phase", t: "校验", kids: phases[0].kids.slice(0, lead) }, { k: "phase", t: "处理", kids: phases[0].kids.slice(lead) });
  }
  if (errs.kids.length) phases.push(errs);
  return phases;
}

// 前端触发：有客户端入口的 HTTP 流程，第一阶段写「从哪触发」（前端泳道）
function trigger(loop: any) {
  const seen = new Set<string>();
  const kids = (loop?.triggers ?? []).filter((t: any) => !seen.has(t.file) && seen.add(t.file)).slice(0, 3)
    .map((t: any) => ({ k: "step", t: t.label.length > 24 ? t.label.slice(0, 24) + "…" : t.label, a: `${t.file}:${t.line}`, side: "C", l: "ui", kids: [] }));
  return kids.length ? [{ k: "phase", t: "触发", l: "ui", kids }] : [];
}

// ---- 语义层整理过的：逐个节点按锚点键核对，取回行号与读写 ----
function organized(ctx: Ctx, flow: any, sem: any, facts: Map<string, Fact>, errs: string[]) {
  const needs = new Set(["step", "guard", "branch", "side"]);
  const byAt = new Map<string, any>();
  const walk = (n: any, path: string): any => {
    const f = n.at ? facts.get(n.at) : undefined;
    if (n.at && !f) errs.push(`${path}「${n.t}」的锚点对不上：${n.at}`);
    if (!n.at && needs.has(n.k ?? "step") && n.l !== "ui") errs.push(`${path}「${n.t}」没有锚点（step / guard / branch / side 必须引用 flows.md 里的键；前端的步骤 l:"ui" 除外）`);
    const out: any = { ...n, k: n.k ?? "step", kids: (n.kids ?? []).map((k: any, i: number) => walk(k, `${path}/${i}`)) };
    if (f) Object.assign(out, { a: `${f.file}:${f.line}`, file: f.file, line: f.line, r: [...new Set([...resOf(ctx, f), ...(n.r ?? [])])] });
    if (n.at) byAt.set(n.at, out);
    return out;
  };
  const tree = (sem.tree ?? []).map((p: any, i: number) => walk({ ...p, k: "phase" }, `#${i}`));
  const fixBack = (n: any) => { if (n.k === "back" && n.to && !byAt.has(n.to)) errs.push(`回到「${n.t}」的目标不在这条流程里：${n.to}`); n.kids.forEach(fixBack); };
  tree.forEach(fixBack);
  return tree;
}

// ---- IBO：输入了什么（入口 / 参数 / 读哪些表）· 经过什么（阶段主干 / 外部 / 工具）· 输出了什么（写表 / 推送 / 成功结局 / 转交） ----
function ibo(flow: any, e: any, loop: any, tree: any[]) {
  const all: any[] = []; const col = (n: any) => { all.push(n); (n.kids ?? []).forEach(col); }; tree.forEach(col);
  const res = (k: string) => [...new Set(all.flatMap((n) => (n.r ?? []).filter((r: string) => r.startsWith(k + ":")).map((r: string) => r.slice(2))))];
  const writes = res("w");
  return {
    in: { route: e?.kind === "http" ? `${e.verbs.join(",")} ${e.route}` : null, params: flow.inputs ?? [],
      trig: [...new Set((loop?.triggers ?? []).map((t: any) => t.file.split("/").pop() + ":" + t.line))].slice(0, 3),
      reads: res("r").filter((t) => !writes.includes(t)) },
    via: { phases: tree.map((p: any) => ({ t: p.t, loop: !!(p.loop || p.inLoop) })), ext: res("h"), tools: [...new Set(all.filter((n) => n.k === "tool").map((n) => n.t))] },
    // 结果＝正常收尾（完成 / 等用户接着答）；其余结局（限额 / 失败 / 停止）算停下，细节在「为什么停」
    out: { writes, pushes: res("p"), ok: [...new Set(all.filter((n) => n.k === "exit" && (n.tone === "ok" || n.tone === "wait")).map((n) => n.why && n.why !== n.t ? `${n.t} · ${n.why}` : n.t))],
      stops: all.filter((n) => n.k === "exit" && !["ok", "wait"].includes(n.tone)).length, links: all.filter((n) => n.k === "link").map((n) => ({ t: n.t, flow: n.flow })) },
  };
}

// ---- 汇总：每条流程给出 名字 / 所属域 / 业务循环 / 来源（整理过 or 草稿）/ 树；写大纲 ----
export function buildFlows(sys: any, SEM: any, ctx: Ctx, outlineDir: string) {
  const semFlows = SEM.flows ?? {};
  const idOf = (k: string) => {
    const f = sys.flows.find((x: any) => x.id === k || x.id === "S|" + k)
      ?? sys.flows.find((x: any) => { const e = ctx.entryOf(x.id); return e?.kind === "http" && `${e.verbs.join(",")} ${e.route}` === k; })
      ?? sys.flows.find((x: any) => x.root.key.split("›call:")[1] === k);
    if (!f) throw new Error(`语义层 flows 的键对不上任何流程：${k}（写 flows/index.md 里的流程 id、「动词 路由」或「类.方法」）`);
    return f.id;
  };
  const semBy = new Map(Object.entries(semFlows).map(([k, v]) => [idOf(k), v as any]));
  const errs: string[] = [], out: any[] = [];
  // 每次重建：已删掉的流程不留旧文件。只删这里自己写的 .md，不递归删目录（WORK 指错到项目里也伤不到别的文件）
  mkdirSync(outlineDir, { recursive: true });
  for (const f of readdirSync(outlineDir)) if (f.endsWith(".md")) rmSync(join(outlineDir, f));
  const rows: any[] = [];
  for (const flow of sys.flows) {
    const facts = new Map<string, Fact>(); const col = (n: Fact) => { facts.set(n.key, n); n.kids?.forEach(col); }; col(flow.root);
    const e = ctx.entryOf(flow.id), loop = e ? ctx.loopOf(e.id) : null, sem = semBy.get(flow.id);
    const fe: string[] = [];
    const tree = sem ? organized(ctx, flow, sem, facts, fe) : [...(e?.kind === "http" ? trigger(loop) : []), ...draft(ctx, flow)];
    for (const x of fe) errs.push(`${sem?.name ?? flow.id}：${x}`);
    const name = sem?.name ?? loop?.name ?? (e?.kind === "http" ? `${e.verbs.join(",")} ${e.route}` : flow.root.t);
    const root = flow.root.method;
    out.push({ id: flow.id, name, story: sem?.story ?? loop?.story ?? null, kind: flow.kind, source: sem ? "sem" : "auto",
      dom: root ? ctx.domOf(root) : null, card: root ? ctx.cardOf(root) : null, loop: loop?.id ?? null, lane: flow.kind === "http" ? "svc" : "bg", size: facts.size, tree, ibo: ibo(flow, e, loop, tree) });
    // 一条流程一个文件：名字里的斜杠空格换掉，再带 id 的短哈希防重名
    const file = `${name.replace(/[\\/:*?"<>|\s{}]+/g, "-").replace(/-+/g, "-").slice(0, 40)}-${createHash("sha1").update(flow.id).digest("hex").slice(0, 6)}.md`;
    let md = `# ${name}  ·  ${sem ? "已整理" : "草稿"}\nid: ${flow.id.slice(2)}\n\n每行：[种类] 文本  ‹锚点键›  文件:行。语义层 flows 的节点用 "at": "锚点键" 引用。\n\n`;
    const dump = (n: Fact, d: number) => { md += `${"  ".repeat(d)}- [${n.k}] ${n.t}${n.args?.length ? ` (${n.args.join(", ")})` : ""}  ‹${n.key}›  ${n.file}:${n.line}\n`; n.kids?.forEach((k) => dump(k, d + 1)); };
    dump(flow.root, 0);
    writeFileSync(`${outlineDir}/${file}`, md);
    const cnt = (k: string) => [...facts.values()].filter((x) => x.k === k).length;
    rows.push({ name, sem: !!sem, size: facts.size, loops: cnt("loop"), exits: cnt("exit"), bg: cnt("bg"), dom: root ? ctx.domOf(root) : null, file });
  }
  // 索引：已整理的在前；草稿按复杂度（循环 · 交给后台 · 出口 · 节点数）排，最值得整理的在最上面
  const score = (r: any) => r.loops * 10 + r.bg * 8 + r.exits * 2 + r.size / 10;
  rows.sort((a, b) => +b.sem - +a.sem || score(b) - score(a));
  writeFileSync(`${outlineDir}/index.md`, `# 流程索引（自动生成，勿手改）\n\n${rows.length} 条 · 已整理 ${rows.filter((r) => r.sem).length}。草稿按复杂度排，越靠前越值得整理；整理时只读那一条的文件。\n\n`
    + `| 流程 | 状态 | 节点 | 循环 | 后台 | 出口 | 域 | 文件 |\n|---|---|---|---|---|---|---|---|\n`
    + rows.map((r) => `| ${r.name} | ${r.sem ? "已整理" : "草稿"} | ${r.size} | ${r.loops} | ${r.bg} | ${r.exits} | ${r.dom ? ctx.label(r.dom) : ""} | ${r.file} |`).join("\n") + "\n");
  if (errs.length) throw new Error(`语义层 flows 有 ${errs.length} 处对不上代码（代码改了就要重整这几条）：\n  ${errs.join("\n  ")}\n  大纲：${outlineDir}/index.md`);
  return out;
}
