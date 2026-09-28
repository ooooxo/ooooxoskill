// test/examples.ts —— 回归：在 examples/ 下每个示例项目上整趟跑管线
//   ① 快照：入口 / 跨端边 / 推送 / 循环 / 文件归位 / 体检 / 流程与 examples/<名>/expected.json 逐项对账（防退化）
//   ② 事实：examples/<名>/must.json 里人工标注的「正确的图必须有 / 必须没有」逐条核对（防「没退化但本来就错」）
//   ③ 意图画布：空白 / 叠真图两种都要起得来
// 怎么跑：bun test/examples.ts [示例名…]      有意改动用 UPDATE=1 重写快照（must.json 不会被改），随改动一起提交
// 需要：.NET 10 SDK、bun
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const HERE = join(import.meta.dir, "..");
// 示例项目：服务端入口（.csproj / .sln）、客户端目录（没有写 "-"）
const EXAMPLES: Record<string, { server: string; client: string }> = {
  demo: { server: "server/Demo.csproj", client: "client" },
  tutorial: { server: "server/Api/Api.csproj", client: "client" },
};
const pick = process.argv.slice(2);
const fails: string[] = [];

for (const [name, ex] of Object.entries(EXAMPLES).filter(([n]) => !pick.length || pick.includes(n))) {
  const dir = join(HERE, "examples", name);
  const work = join(process.env.TMPDIR ?? "/tmp", `atlas-test-${name}`);
  const out = join(work, `${name}-atlas.html`);
  execFileSync(join(HERE, "run.sh"), [join(dir, ex.server), ex.client === "-" ? "-" : join(dir, ex.client), out], {
    env: { ...process.env, SEM: join(dir, "atlas.json"), WORK: work }, stdio: ["ignore", "ignore", "inherit"],
  });
  const json = (f: string) => JSON.parse(readFileSync(join(work, f), "utf8"));
  const server = json("server.graph.json"), client = json("client.graph.json"), sys = json("system.json");
  const html = readFileSync(out, "utf8");
  const at = html.indexOf("const D = ") + 10;
  const D = new Function(`return ${html.slice(at, html.indexOf(";\n", at))}`)();

  // ---- ① 快照 ----
  const count = (xs: any[], key: (x: any) => string) => Object.fromEntries(Object.entries(Object.groupBy(xs, key)).map(([k, v]) => [k, v!.length]).sort());
  const actual = {
    server: { entries: count(server.entries, (e) => e.kind), methods: server.methods.length, resources: server.resources.map((r: any) => r.id).sort(), edges: server.edges.length },
    client: { entries: client.entries.map((e: any) => `${e.kind} ${e.route}`).sort(), resources: client.resources.map((r: any) => r.id).sort() },
    cross: count(sys.cross, (x) => x.kind),
    pushes: sys.cross.filter((x: any) => x.kind === "push" || x.kind === "bus").map((x: any) => `${x.kind} ${x.label}`).sort(),
    loops: sys.loops.map((l: any) => `${l.verbs.join(",")} ${l.route} · 入口 ${l.triggers.length}`).sort(),
    unmatched: sys.unmatched ?? [],
    // 每个服务端文件落在哪个域 / 组（归位规则的回归点）
    placement: Object.fromEntries(D.nodes.filter((n: any) => n.kind === "file").map((n: any) => [n.file, n.parent]).sort()),
    findings: Object.fromEntries(D.findings.map((f: any) => [f.title, f.items.map((i: any) => i.label).sort()])),
    flows: D.flows.map((f: any) => `${f.name} · ${f.source === "sem" ? "已整理" : "草稿"} · ${f.size} 节点`).sort(),
    nodes: D.nodes.length,
  };
  const expPath = join(dir, "expected.json");
  if (process.env.UPDATE === "1" || !existsSync(expPath)) {
    writeFileSync(expPath, JSON.stringify(actual, null, 2) + "\n");
    console.log(`${name}：快照已写 ${expPath}`);
  } else {
    const walk = (a: any, e: any, path: string) => {
      if (JSON.stringify(a) === JSON.stringify(e)) return;
      if (a && e && typeof a === "object" && typeof e === "object" && !Array.isArray(a) && !Array.isArray(e)) {
        for (const k of new Set([...Object.keys(a), ...Object.keys(e)])) walk(a[k], e[k], `${path}.${k}`);
      } else if (Array.isArray(a) && Array.isArray(e)) {
        const sa = new Set(a.map(String)), se = new Set(e.map(String));
        fails.push(`${path}  多了 ${JSON.stringify([...sa].filter((x) => !se.has(x)))}  少了 ${JSON.stringify([...se].filter((x) => !sa.has(x)))}`);
      } else fails.push(`${path}  期望 ${JSON.stringify(e)}  实际 ${JSON.stringify(a)}`);
    };
    walk(actual, JSON.parse(readFileSync(expPath, "utf8")), name);
  }

  // ---- ② 人工标注的事实 ----
  const mustPath = join(dir, "must.json");
  if (existsSync(mustPath)) {
    const facts = factsOf(sys);
    for (const f of JSON.parse(readFileSync(mustPath, "utf8")).facts as string[]) {
      const neg = f.startsWith("!"), fact = neg ? f.slice(1) : f;
      const has = facts.has(fact) || (fact.startsWith("hubEvent ") && [...facts].some((x) => x.toLowerCase() === fact.toLowerCase()));
      if (has === neg) fails.push(`${name} 事实${neg ? "不该有" : "缺"}：${fact}`);
    }
  }
  console.log(`${name}：${actual.nodes} 节点 · ${sys.loops.length} 循环 · ${actual.flows.length} 流程 · 跨端 ${sys.cross.length}`);
}

// ---- ③ 意图画布：这里坏过（serve.ts 语法错整个画布起不来，快照照样全绿） ----
if (!pick.length || pick.includes("canvas")) {
  const atlas = join(process.env.TMPDIR ?? "/tmp", "atlas-test-demo", "demo-atlas.html");
  for (const a of [null, ...(existsSync(atlas) ? [atlas] : [])]) {
    const intent = join(process.env.TMPDIR ?? "/tmp", `atlas-test-intent-${a ? "atlas" : "blank"}.json`);
    rmSync(intent, { force: true });
    const port = 4900 + Math.floor(Math.random() * 90);
    const srv = Bun.spawn(["bun", join(HERE, "viewer/serve.ts"), intent, ...(a ? [a] : [])], { env: { ...process.env, PORT: String(port) }, stdout: "ignore", stderr: "pipe" });
    let body = "";
    for (let i = 0; i < 50 && !body; i++) { await Bun.sleep(100); body = await fetch(`http://127.0.0.1:${port}/`).then((r) => (r.ok ? r.text() : ""), () => ""); }
    srv.kill();
    if (!body.includes("const D = {")) fails.push(`意图画布（${a ? "叠真图" : "空白"}）起不来：${await new Response(srv.stderr).text()}`);
  }
}

if (fails.length) {
  console.error(`\n不一致 ${fails.length} 处（快照有意改动就 UPDATE=1 重写；事实不符是真 bug）：\n  ${fails.join("\n  ")}`);
  process.exit(1);
}
console.log("全部一致");


// 从 system.json 算事实集：入口 / 鉴权 / 端点下游写了哪些表、推了哪些事件 / 跨端边 / 循环有没有前端入口 / 没对上的前端调用数
function factsOf(sys: any): Set<string> {
  const f = new Set<string>();
  const out = new Map<string, any[]>();
  for (const e of sys.edges) (out.get(e.from) ?? out.set(e.from, []).get(e.from)!).push(e);
  const res = new Map<string, any>(sys.resources.map((r: any) => [r.id, r]));
  const downstream = (m: string) => {
    const seen = new Set([m]), q = [m], hit: any[] = [];
    for (let i = 0; i < q.length; i++) for (const e of out.get(q[i]) ?? []) {
      if (e.kind === "calls") { if (!seen.has(e.to)) { seen.add(e.to); q.push(e.to); } }
      else if (res.has(e.to)) hit.push({ kind: e.kind, r: res.get(e.to) });
    }
    return hit;
  };
  for (const e of sys.entries.filter((x: any) => x.side === "S|")) {
    const labels = e.kind === "http" ? e.verbs.map((v: string) => `${v} ${e.route}`)
      : e.kind === "hub" ? [`hub ${e.id.split(".").pop()}`] : e.kind === "hosted" ? [`hosted ${e.id.split(":").pop()}`] : [];
    for (const l of labels) {
      if (e.kind === "http") { f.add(`entry http ${l}`); f.add(`auth ${l} ${e.auth}`); }
      if (e.kind === "hub") f.add(`entry hub ${e.route} ${e.id.split(".").pop()}`);
      if (e.kind === "hosted") f.add(`entry hosted ${e.id.split(":").pop()}`);
      for (const h of e.method ? downstream(e.method) : []) {
        if ((h.kind === "writes" || h.kind === "updates") && h.r.kind === "table") f.add(`writes ${l} ${h.r.label}`);
        if (h.kind === "pushes") f.add(`pushes ${l} ${h.r.label}`);
      }
    }
  }
  for (const x of sys.cross) {
    if (x.kind === "request") f.add(`request ${x.label}`);
    if (x.kind === "invoke") f.add(`invoke ${x.label.split(" ").pop()}`);
    if (x.kind === "push") f.add(`push ${x.label}`);
  }
  for (const e of sys.entries.filter((x: any) => x.side === "C|" && x.kind === "hubEvent")) f.add(`hubEvent ${e.route}`);
  for (const l of sys.loops) if (l.triggers.length) f.add(`trigger ${l.verbs.join(",")} ${l.route}`);
  f.add(`unmatched ${(sys.unmatched ?? []).length}`);
  return f;
}
