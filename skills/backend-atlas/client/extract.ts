// atlas-client：用 TS 编译器 API 抽取 Vue/TS 客户端 —— Hub 事件处理 · 组件动作 · 总线监听 → 调用链 → REST / Tauri / 总线，写 client.graph.json
// 怎么跑：bun client/extract.ts <client-root> <out.json>      （client-root 含 tsconfig.json / jsconfig.json；源码在 src/，没有 src/ 就是根目录）
// 需要：bun。node_modules 装了类型解析更准，不装也能跑。形状与服务端 graph.json 同构，供拼业务循环。
import ts from "typescript";
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { extractRust } from "./rust";

const VERBS = new Set(["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD"]);
const INVOKE = new Set(["invoke"]);                       // Tauri 命令：invoke("cmd")；conn.invoke("M") 是 SignalR Hub 方法
const REQUEST = new Set(["request", "send"]);             // 请求层：request(path, { method: "POST" })，method 缺省 GET；首参须解析成 "/…" 路径才算
const HTTP_METHODS = new Set(["get", "post", "put", "delete", "patch", "head"]);   // axios 与实例：http.get("/x")、axios.post(url, body)
const NOT_HTTP = /^(Map|Set|WeakMap|URLSearchParams|Headers|FormData|Storage|Cache|CacheStorage)\b/;  // 同名 get/delete 的集合类
const LIFECYCLE = new Set(["mounted", "created", "activated", "beforeMount"]);     // Options API 生命周期
const SKIP_DIRS = new Set(["node_modules", "dist", "build", "coverage", ".git", ".nuxt", ".output", "src-tauri"]);
const EMIT = /^emit(Global|To)?$/;                        // 跨窗总线发：emit("evt") / emitGlobal("evt")
const LISTEN = /^(listen|listenGlobal|once)$/;            // 跨窗总线收：listen("evt", cb)
const HOOKS = new Set(["onMounted", "onActivated", "onBeforeMount", "watch", "watchEffect"]);
const MAX_SUMMARY = 200;

const [root, outPath] = process.argv.slice(2).map((p) => resolve(p));
if (!root || !outPath) {
  console.error("usage: bun client/extract.ts <client-root> <out.json>");
  process.exit(2);
}
const t0 = performance.now();
const src = existsSync(join(root, "src")) ? join(root, "src") : root;

// ---- 源文件：tsconfig / jsconfig 的 .ts .js + .vue 的 <script> 块（非脚本行置空，行号不变）----
// create-vue 的根 tsconfig 是 files: [] + references：跟进被引用的配置，取管着 src 的那份的编译选项（paths 别名在它里面）
const cfgPath = [join(root, "tsconfig.json"), join(root, "jsconfig.json")].find(existsSync);
const parse = (f: string) => ts.parseJsonConfigFileContent(ts.readConfigFile(f, ts.sys.readFile).config, ts.sys, dirname(f), undefined, f);
const top = cfgPath ? parse(cfgPath) : null;
const refs = (top?.projectReferences ?? []).map((r) => ts.resolveProjectReferencePath(r)).filter(existsSync).map(parse);
const mine = (c: ts.ParsedCommandLine) => c.fileNames.filter((f) => f.startsWith(src)).length;
const main = [top, ...refs].filter((c): c is ts.ParsedCommandLine => !!c).sort((a, b) => mine(b) - mine(a))[0];
const parsed = {
  options: { ...(main?.options ?? {}), allowJs: true, noEmit: true },
  fileNames: [...new Set([top, ...refs].flatMap((c) => c?.fileNames ?? []))],
};
if (!parsed.fileNames.length) parsed.fileNames = walkDir(src).filter((f) => /\.[cm]?[jt]sx?$/.test(f));
const virtual = new Map<string, string>();
const tplLabels = new Map<string, { kind: string; label: string }>(); // 合成的模板函数名 → 入口标签
for (const f of walkDir(src).filter((f) => f.endsWith(".vue"))) virtual.set(f + ".ts", vueScript(readFileSync(f, "utf8"), f + ".ts"));

const host = ts.createCompilerHost(parsed.options);
const base = { getSourceFile: host.getSourceFile, fileExists: host.fileExists, readFile: host.readFile };
host.fileExists = (f) => virtual.has(f) || base.fileExists(f);
host.readFile = (f) => virtual.get(f) ?? base.readFile(f);
host.getSourceFile = (f, lang, ...rest) =>
  virtual.has(f) ? ts.createSourceFile(f, virtual.get(f)!, lang, true, ts.ScriptKind.TS) : base.getSourceFile(f, lang, ...rest);
const rootNames = [...parsed.fileNames.filter((f) => /\.[cm]?[jt]sx?$/.test(f) && !f.endsWith(".d.ts")), ...virtual.keys()];
const program = ts.createProgram({ rootNames, options: parsed.options, host });
const checker = program.getTypeChecker();
const files = program.getSourceFiles().filter((s) => own(s.fileName));

// ---- 输出容器 ----
type Fn = ts.SignatureDeclaration;
const methods = new Map<string, any>();
const resources = new Map<string, any>();
const edges: any[] = [];
const edgeKeys = new Set<string>();
const entries: any[] = [];
const modules = new Map<string, any>();
const fnById = new Map<string, Fn>();
// 请求封装：URL（和动词）由调用方传进来的函数。在它体内认出 fetch / axios 时登记，调用方传字面量路径时落 api 边
// 动词：字面量；或外层第 param 个参数（key = 取它的哪个属性，init.method；fallback = ?? 后的默认值）
type Verb = { verb: string } | { param: number; key?: string; fallback?: string };
const wrappers = new Map<Fn, { param: number; prefix: string; verb: Verb }>();
// axios.defaults.baseURL = "/api"：直接 axios.get() 的前缀
let axiosBase = "";

// ---- 阶段 A：设置回调（onX(h) 把参数存进模块变量 _onX，别处 _onX?.() 调用）----
const setterParam = new Map<ts.Symbol, { v: ts.Symbol; index: number }>(); // 设置函数 → (变量, 参数位)
const varTargets = new Map<ts.Symbol, Fn[]>();                              // 变量 → 注册进来的回调
const registered = new Set<ts.Node>();                                      // 不随外层内联扫的回调体
for (const sf of files) visitAll(sf, (n) => {
  // _onX = h，或存进集合 listeners.add(h) / .push(h)（分发处 listeners.forEach((f) => f(e))）
  const pair = ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.EqualsToken && ts.isIdentifier(n.left) && ts.isIdentifier(n.right) ? [n.left, n.right]
    : ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && /^(add|push)$/.test(n.expression.name.text)
      && ts.isIdentifier(n.expression.expression) && n.arguments.length === 1 && ts.isIdentifier(n.arguments[0]) ? [n.expression.expression, n.arguments[0]] : null;
  if (!pair) return;
  const v = sym(pair[0]), p = sym(pair[1]);
  const param = p?.valueDeclaration;
  if (!v || !param || !ts.isParameter(param)) return;
  const fn = param.parent as Fn;
  const fsym = fnSymbol(fn);
  if (fsym) setterParam.set(fsym, { v, index: fn.parameters.indexOf(param) });
});
for (const sf of files) visitAll(sf, (n) => {
  if (!ts.isCallExpression(n)) return;
  const s = sym(n.expression);
  const hit = s && setterParam.get(s);
  const arg = hit && n.arguments[hit.index];
  if (!hit || !arg) return;
  const targets = fnsOf(arg);
  targets.forEach((t) => registered.add(t));
  varTargets.set(hit.v, [...(varTargets.get(hit.v) ?? []), ...targets]);
});

// axios.defaults.baseURL = "/api"
for (const sf of files) visitAll(sf, (n) => {
  if (ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.EqualsToken && /(^|\.)defaults\.baseURL$/.test(n.left.getText()))
    axiosBase = basePath(n.right) ?? axiosBase;
});

// ---- 阶段 B：入口 —— hub.on("E", h) / listen("evt", h) / 组件顶层函数与生命周期回调 ----
for (const sf of files) visitAll(sf, (n) => {
  if (!ts.isCallExpression(n)) return;
  const name = calleeName(n);
  const first = n.arguments[0];
  const lit = first && ts.isStringLiteralLike(first) ? first.text : null;
  // 只有 SignalR 连接上的 .on 才是服务端推送（mitt / socket.io / echarts 的 .on 不算）
  if (name === "on" && lit && n.arguments[1] && ts.isPropertyAccessExpression(n.expression) && isHubConn(n.expression.expression)) {
    for (const h of callbacks(n.arguments[1])) { registered.add(h); entry("hubEvent", lit, h, n); }
  } else if (name && LISTEN.test(name) && lit && n.arguments[1]) {
    for (const h of callbacks(n.arguments[1])) { registered.add(h); entry("busEvent", lit, h, n); }
  } else if (name && HOOKS.has(name) && rel(sf.fileName).endsWith(".vue")) {
    // onMounted(async () => …) 或 onMounted(load)
    // watch(source, cb) 的第一个实参是被监听的值，不是回调：函数引用只给 onXxx 这类钩子认
    const cb = n.arguments.find((a) => ts.isArrowFunction(a) || ts.isFunctionExpression(a))
      ?? (name.startsWith("on") ? n.arguments.find((a) => ts.isIdentifier(a)) : undefined);
    for (const f of cb ? fnsOf(cb) : []) { registered.add(f); entry(name === "watch" || name === "watchEffect" ? "watch" : "mount", name, f, n); }
  }
});
// 动作闭包：{ label: "存进我的便签", run: async () => ... } —— 按钮文字就是用户动作名，单列入口、不随外层内联
for (const sf of files) visitAll(sf, (n) => {
  if (isFnLike(n) && actionLabel(n)) { registered.add(n); entry("ui", `「${actionLabel(n)}」`, n as Fn, n); }
});
// 组件脚本里最外层的函数（声明 / computed(() => …) / 顶层箭头）
for (const sf of files.filter((s) => rel(s.fileName).endsWith(".vue"))) visitAll(sf, (n) => {
  if (!isFnLike(n) || registered.has(n) || ancestorFn(n)) return;
  const tpl = tplLabels.get(`${sf.fileName}|${fnName(n)}`);
  const life = ts.isMethodDeclaration(n) && LIFECYCLE.has(fnName(n)) && optionsObject(sf) === n.parent;
  entry(tpl?.kind ?? (life ? "mount" : "ui"), tpl?.label ?? fnName(n), n as Fn, n);
});

// Hub 事件信封：一个事件名装多种类型（conn.on("event", e => …) 里按 e.type 分发）。
// 从入口往下 3 层找按 .type / .kind 分支的函数，同一函数里 ≥2 个类型才算分发器，每个类型单列一个入口「事件#类型」，join 按它和服务端对接
for (const e of entries.filter((x) => x.kind === "hubEvent")) {
  const seen = new Set<string>([e.method]);
  let layer = [e.method];
  for (let d = 0; d < 3 && layer.length; d++) {
    for (const id of layer) {
      const fn = fnById.get(id);
      const cases = fn ? typeCases(fn) : [];
      if (new Set(cases.map((c) => c.t)).size >= 2) for (const c of cases) entry("hubEvent", `${e.route}#${c.t}`, fn!, c.at);
    }
    layer = edges.filter((x) => x.kind === "calls" && layer.includes(x.from) && !seen.has(x.to)).map((x) => (seen.add(x.to), x.to));
  }
}

// 只留能碰到外部世界（REST / Tauri / 总线）的 UI 入口；Hub / 总线 / 生命周期入口全留
const touches = reachSet();
const kept = entries.filter((e) => !["ui", "render"].includes(e.kind) || touches.has(e.method));
// Tauri 的 Rust 腿（有 src-tauri 才跑）：invoke("cmd") 在拼环时接到 tauri:cmd 入口
const tauriDir = join(root, "src-tauri", "src");
const rs = existsSync(tauriDir) ? await extractRust(tauriDir, root) : null;
for (const r of rs?.resources ?? []) if (!resources.has(r.id)) resources.set(r.id, r);
const g = git(root);
const graph = {
  schema: 1, project: "client", revision: g.rev, dirtyFiles: g.dirty, generatedAt: new Date().toISOString(),
  modules: [...[...modules.values()].filter((m) => kept.some((e) => e.module === m.id)), ...(rs?.modules ?? [])],
  entries: [...kept, ...(rs?.entries ?? [])], methods: [...methods.values(), ...(rs?.methods ?? [])],
  resources: [...resources.values()], edges: [...edges, ...(rs?.edges ?? [])],
};
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(graph, null, 2));
console.log(`client @ ${g.rev.slice(0, 8)}${g.dirty ? ` (+${g.dirty} dirty)` : ""}: ${graph.entries.length} entries · ` +
  `${graph.methods.length} methods · ${graph.resources.length} resources · ${graph.edges.length} edges · ${((performance.now() - t0) / 1000).toFixed(1)}s`);


// ────────────────── 入口与下钻 ──────────────────

function entry(kind: string, label: string, fn: Fn, at: ts.Node) {
  const file = rel(at.getSourceFile().fileName);
  const modId = "f:" + file;
  if (!modules.has(modId)) modules.set(modId, { id: modId, label: file.split("/").pop(), kind: "file", file, line: 1, endLine: 1, summary: null });
  entries.push({
    id: `${kind}:${label}@${file}:${line(at)}`, kind, module: modId, verbs: [], route: label,
    auth: "none", rateLimit: null, conditional: false, method: visit(fn), file, line: line(at),
    summary: summary(at), order: entries.length,
  });
}

// ---------- [ 首次见到的函数建节点并下钻；注册型回调不随外层内联 ] ----------
function visit(fn: Fn): string {
  const id = fnId(fn);
  if (methods.has(id)) return id;
  fnById.set(id, fn);
  const file = rel(fn.getSourceFile().fileName);
  methods.set(id, {
    id, label: fnName(fn), type: file.split("/").pop(), file, line: line(fn),
    endLine: fn.getSourceFile().getLineAndCharacterOfPosition(fn.getEnd()).line + 1, summary: summary(fn), util: false,
  });
  const body = (fn as any).body as ts.Node | undefined;
  // 简写箭头 `(x) => request(...)` 的函数体本身就是调用，scan 只看子节点会漏掉它
  if (body && ts.isCallExpression(body)) call(body, id);
  if (body) scan(body, id);
  return id;
}

function scan(node: ts.Node, from: string) {
  ts.forEachChild(node, (c) => {
    if (registered.has(c)) return;
    if (ts.isCallExpression(c)) call(c, from);
    // 不经 fetch 的 URL（<img src> 头像等）：浏览器会 GET 它
    else if (ts.isTemplateExpression(c) && urlPath(c) !== null && !(ts.isCallExpression(c.parent) && calleeName(c.parent) === "fetch")) {
      const route = `GET ${urlPath(c)}`;
      link(from, res("api:" + route, "api", route), "api", c, [], whenOf(c));
    }
    scan(c, from);
  });
}

// ---------- [ 调用归类：REST / Tauri / 总线 → 资源边；设置回调变量 → 回调；仓库内函数 → calls ] ----------
function call(n: ts.CallExpression, from: string) {
  const [a0, a1] = n.arguments;
  const name = calleeName(n);
  const args = literals(n);
  const when = whenOf(n);
  // 先扫被调函数体：它若是请求封装（URL 由调用方传），路径就在这个调用点的实参里，下面的形状猜测让位
  const targets = resolveCallee(n);
  targets.forEach(visit);
  const viaWrapper = targets.some((t) => wrappers.has(t));
  if (!viaWrapper && a0 && a1 && ts.isStringLiteralLike(a0) && VERBS.has(a0.text) && pathTemplate(a1) !== null) {
    const route = `${a0.text} ${pathTemplate(a1)}`;
    return link(from, res("api:" + route, "api", route), "api", n, args.slice(1), when);
  }
  if (!viaWrapper && name && REQUEST.has(name) && a0 && paths(a0).length) {
    const verb = literals(n).find((x) => x.startsWith("method="))?.slice(7) ?? "GET";
    for (const p of paths(a0)) link(from, res(`api:${verb} ${p}`, "api", `${verb} ${p}`), "api", n, args.slice(1), when);
    return;
  }
  if (name === "fetch" && a0) {
    const verb = verbIn(a1, n);
    if (http(n, from, urlOf(a0), verb, "", when)) return;
  }
  // axios / axios 实例：http.get("/todos")、axios.post(url, body)；baseURL 取实例创建处
  if (ts.isPropertyAccessExpression(n.expression) && HTTP_METHODS.has(n.expression.name.text) && a0 && !NOT_HTTP.test(typeName(n.expression.expression))) {
    if (http(n, from, urlOf(a0), { verb: n.expression.name.text.toUpperCase() }, baseOf(n.expression.expression), when)) return;
  }
  // axios({ url, method }) / http.request({ url, method })
  if ((name === "axios" || name === "request") && a0 && ts.isObjectLiteralExpression(a0)) {
    const url = prop(a0, "url");
    if (url && http(n, from, urlOf(url), verbIn(a0, n), ts.isPropertyAccessExpression(n.expression) ? baseOf(n.expression.expression) : axiosBase, when)) return;
  }
  if (name && INVOKE.has(name) && a0 && ts.isStringLiteralLike(a0))
    return ts.isIdentifier(n.expression)
      ? link(from, res("tauri:" + a0.text, "tauri", a0.text), "invoke", n, args.slice(1), when)
      : link(from, res("hubInvoke:" + a0.text, "hubInvoke", a0.text), "invoke", n, args.slice(1), when);
  // Vue 组件事件 `const emit = defineEmits()` 不是跨窗总线
  if (name && EMIT.test(name) && a0 && ts.isStringLiteralLike(a0) && !isDefineEmits(n.expression))
    return link(from, res("bus:" + a0.text, "busEvent", a0.text), "emits", n, args.slice(1), when);

  const s = sym(n.expression);
  const viaVar = s && varTargets.get(s);
  if (viaVar) { for (const t of viaVar) link(from, visit(t), "calls", n, args, when); return; }
  const viaIter = s && iterTargets(s);
  if (viaIter) { for (const t of viaIter) link(from, visit(t), "calls", n, args, when); return; }
  for (const t of targets) {
    link(from, visit(t), "calls", n, args, when);
    // 调到请求封装：路径（动词）在这个调用点的实参里
    const w = wrappers.get(t);
    const arg = w && n.arguments[w.param];
    if (w && arg) http(n, from, urlOf(arg), "param" in w.verb ? verbAt(n, w.verb) : w.verb, w.prefix, when);
  }
  // 函数引用当参数传：act(p.stop) / guard(store.load) —— 接收方会调它
  for (const a of n.arguments) if (ts.isIdentifier(a) || ts.isPropertyAccessExpression(a))
    for (const t of resolveRef(a)) link(from, visit(t), "calls", n, args, when);
}

// ---------- [ 请求：URL 已知就落 api 边；URL 是外层函数的参数就把外层登记成请求封装（可层层往外传） ] ----------
type Url = { paths: string[] } | { param: number; prefix: string; fn: Fn };
function http(n: ts.CallExpression, from: string, url: Url | null, verb: Verb, prefix: string, when: string | null): boolean {
  if (!url) return false;
  if ("paths" in url) {
    if (!("verb" in verb)) return false;
    for (const p of url.paths) {
      const route = `${verb.verb} ${joinPath(prefix, p)}`;
      link(from, res("api:" + route, "api", route), "api", n, [], when);
    }
    return true;
  }
  // 动词也可能是外层参数：call(method, path) 里的 fetch(path, { method })
  const fn = url.fn;
  const v: Verb = "verb" in verb ? verb : verb;
  if (!wrappers.has(fn)) wrappers.set(fn, { param: url.param, prefix: joinPath(prefix, url.prefix), verb: v });
  return true;
}

// 表达式 → 路径：字面量 / 常量 / 模板 / 常量拼接；是外层函数参数（或 "常量" + 参数、`${常量}${参数}`）就返回参数位
function urlOf(e: ts.Expression): Url | null {
  const ps = paths(e);
  if (ps.length) return { paths: ps };
  const u = urlPath(e);
  if (u !== null) return { paths: [u] };
  let x = unwrap(e), prefix = "";
  if (ts.isBinaryExpression(x) && x.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    const l = staticStr(x.left);
    if (l === null) return null;
    prefix = l; x = unwrap(x.right);
  } else if (ts.isTemplateExpression(x) && x.templateSpans.length === 1 && x.templateSpans[0].literal.text === "") {
    prefix = x.head.text; x = unwrap(x.templateSpans[0].expression);
  }
  if (!ts.isIdentifier(x)) return null;
  const d = valueDecl(x);
  const fn = d && ts.isParameter(d) ? (d.parent as Fn) : undefined;
  if (!fn || !d) return null;
  const base = prefix.replace(/^https?:\/\/[^/]+/, "");
  if (base && !base.startsWith("/")) return null;
  return { param: fn.parameters.indexOf(d as ts.ParameterDeclaration), prefix: base, fn };
}

// 标识符指向的声明；{ method } 简写属性要取它引用的那个变量 / 参数，不是属性自己
function valueDecl(e: ts.Expression): ts.Declaration | undefined {
  if (!ts.isIdentifier(e)) return undefined;
  if (ts.isShorthandPropertyAssignment(e.parent)) return checker.getShorthandAssignmentValueSymbol(e.parent)?.valueDeclaration;
  return sym(e)?.valueDeclaration;
}

function staticStr(e: ts.Expression): string | null {
  const x = unwrap(e);
  if (ts.isStringLiteralLike(x)) return x.text;
  if (ts.isIdentifier(x)) return constString(x);
  return null;
}

// 请求选项里的动词：{ method: "POST" } → POST；{ method } / { method: init.method ?? "GET" } / 整个 options 透传 → 外层参数位
function verbIn(init: ts.Expression | undefined, at: ts.Node): Verb {
  if (!init) return { verb: "GET" };
  const whole = paramOf(init);   // fetch(url, options)：options 原样是外层参数
  if (whole !== undefined) return { param: whole, key: "method", fallback: "GET" };
  let m = ts.isObjectLiteralExpression(init) ? prop(init, "method") : undefined;
  if (!m) return { verb: "GET" };
  let fallback = "GET";
  const u = unwrap(m);
  if (ts.isBinaryExpression(u) && [ts.SyntaxKind.QuestionQuestionToken, ts.SyntaxKind.BarBarToken].includes(u.operatorToken.kind)) {
    fallback = staticStr(u.right)?.toUpperCase() ?? fallback; m = u.left;
  }
  const lit = staticStr(m);
  if (lit !== null) return { verb: lit.toUpperCase() };
  const direct = paramOf(m);
  if (direct !== undefined) return { param: direct, fallback };
  const x = unwrap(m);
  if (ts.isPropertyAccessExpression(x) && paramOf(x.expression) !== undefined) return { param: paramOf(x.expression)!, key: x.name.text, fallback };
  return { verb: fallback };
}

// 表达式是外层函数的第几个参数（不是就 undefined）
function paramOf(e: ts.Expression): number | undefined {
  const d = valueDecl(unwrap(e));
  return d && ts.isParameter(d) ? (d.parent as Fn).parameters.indexOf(d) : undefined;
}

// 调用点上按封装登记的位置取动词：字面量 / 对象字面量的属性 / 仍是外层参数就继续往外传
function verbAt(n: ts.CallExpression, v: { param: number; key?: string; fallback?: string }): Verb {
  const a = n.arguments[v.param];
  const fb = { verb: v.fallback ?? "GET" };
  if (!a) return fb;
  if (v.key) {
    if (ts.isObjectLiteralExpression(a)) {
      const p = prop(a, v.key);
      if (!p) return fb;
      const lit = staticStr(p);
      if (lit !== null) return { verb: lit.toUpperCase() };
      const up = paramOf(p);
      return up !== undefined ? { param: up, fallback: v.fallback } : fb;
    }
    const up = paramOf(a);
    return up !== undefined ? { param: up, key: v.key, fallback: v.fallback } : fb;
  }
  const lit = staticStr(a);
  if (lit !== null && VERBS.has(lit.toUpperCase())) return { verb: lit.toUpperCase() };
  const up = paramOf(a);
  return up !== undefined ? { param: up, fallback: v.fallback } : fb;
}

function prop(o: ts.ObjectLiteralExpression, name: string): ts.Expression | undefined {
  for (const p of o.properties) {
    if (ts.isPropertyAssignment(p) && p.name.getText() === name) return p.initializer;
    if (ts.isShorthandPropertyAssignment(p) && p.name.text === name) return p.name;
  }
  return undefined;
}

// axios 实例的 baseURL：const http = axios.create({ baseURL: "/api" })；直接用 axios 取 axios.defaults.baseURL
function baseOf(recv: ts.Expression): string {
  if (ts.isIdentifier(recv) && recv.text === "axios") return axiosBase;
  const d = ts.isIdentifier(recv) ? sym(recv)?.valueDeclaration : undefined;
  const init = d && ts.isVariableDeclaration(d) ? d.initializer : undefined;
  if (!init || !ts.isCallExpression(init) || calleeName(init) !== "create") return "";
  const cfg = init.arguments[0];
  const b = cfg && ts.isObjectLiteralExpression(cfg) ? prop(cfg, "baseURL") : undefined;
  return (b && basePath(b)) ?? "";
}

function basePath(e: ts.Expression): string | null {
  const s = staticStr(e);
  if (s === null) return null;
  const p = s.replace(/^https?:\/\/[^/]+/, "");
  return p.startsWith("/") || p === "" ? p.replace(/\/$/, "") : null;
}

function joinPath(prefix: string, p: string) {
  if (!prefix) return p;
  return (prefix.replace(/\/$/, "") + (p === "/" ? "" : p)) || "/";
}

function typeName(e: ts.Expression) {
  try { return checker.typeToString(checker.getTypeAtLocation(e)); } catch { return ""; }
}

// SignalR 连接：类型是 HubConnection，或变量由 HubConnectionBuilder 建出来（没装 node_modules 时类型解析不到）
function isHubConn(e: ts.Expression): boolean {
  if (/\bHubConnection\b/.test(typeName(e))) return true;
  const d = ts.isIdentifier(e) ? sym(e)?.valueDeclaration : ts.isPropertyAccessExpression(e) ? sym(e)?.valueDeclaration : undefined;
  const init = d && (ts.isVariableDeclaration(d) || ts.isPropertyDeclaration(d)) ? d.initializer : undefined;
  return !!init && /HubConnectionBuilder/.test(init.getText());
}

// 回调：内联函数 / 函数引用；是外层函数的参数（onTodoChanged(handler) 里的 conn.on("x", handler)）就去它的调用方找传进来的函数
function callbacks(arg: ts.Expression): Fn[] {
  const direct = fnsOf(arg);
  if (direct.length) return direct;
  const d = ts.isIdentifier(arg) ? sym(arg)?.valueDeclaration : undefined;
  if (!d || !ts.isParameter(d)) return [];
  const fn = d.parent as Fn, i = fn.parameters.indexOf(d);
  const fsym = fnSymbol(fn);
  if (!fsym) return [];
  const out: Fn[] = [];
  for (const sf of files) visitAll(sf, (n) => {
    if (ts.isCallExpression(n) && sym(n.expression) === fsym && n.arguments[i]) out.push(...fnsOf(n.arguments[i]));
  });
  return out;
}

// Options API：export default { methods: { add() {} } } / defineComponent({ … })
function optionsObject(sf: ts.SourceFile): ts.ObjectLiteralExpression | undefined {
  for (const st of sf.statements) {
    if (!ts.isExportAssignment(st)) continue;
    const e = unwrap(st.expression);
    if (ts.isObjectLiteralExpression(e)) return e;
    if (ts.isCallExpression(e) && e.arguments[0] && ts.isObjectLiteralExpression(e.arguments[0])) return e.arguments[0];
  }
  return undefined;
}

function optionsMethod(sf: ts.SourceFile, name: string): Fn[] {
  const methods = optionsObject(sf) && prop(optionsObject(sf)!, "methods");
  if (!methods || !ts.isObjectLiteralExpression(methods)) return [];
  for (const m of methods.properties)
    if (m.name?.getText() === name) return [declFn(m as ts.Declaration)].filter((f): f is Fn => !!f);
  return [];
}

// 被调函数：先走类型系统；Pinia store.x() 解析不到时按名字去 defineStore 的 return 对象里找
function resolveCallee(n: ts.CallExpression): Fn[] { return resolveRef(n.expression); }

function resolveRef(e: ts.Expression): Fn[] {
  const u = unwrap(e);   // (cond ? login : register)(…)：两支都算
  if (ts.isConditionalExpression(u)) return [...resolveRef(u.whenTrue), ...resolveRef(u.whenFalse)];
  const direct = fnsOf(e);
  if (direct.length) return direct;
  // Options API：模板里的 add() / 方法里的 this.add()
  const sf = e.getSourceFile();
  if (sf.fileName.endsWith(".vue.ts")) {
    if (ts.isIdentifier(e)) return optionsMethod(sf, e.text);
    if (ts.isPropertyAccessExpression(e) && e.expression.kind === ts.SyntaxKind.ThisKeyword) return optionsMethod(sf, e.name.text);
  }
  if (!ts.isPropertyAccessExpression(e)) return direct;
  const recv = e.expression;
  const init = ts.isIdentifier(recv) ? sym(recv)?.valueDeclaration : undefined;
  const useCall = init && ts.isVariableDeclaration(init) && init.initializer && ts.isCallExpression(init.initializer) ? init.initializer
    : ts.isCallExpression(recv) ? recv : undefined;
  if (!useCall) return [];
  const useFn = fnsOf(useCall.expression)[0] ?? storeSetup(useCall.expression);
  return useFn ? returnedMember(useFn, e.name.text) : [];
}


// f(e) 里的 f 是 listeners.forEach((f) => …) 的参数：调的就是存进 listeners 的那些回调
function iterTargets(s: ts.Symbol): Fn[] | undefined {
  const d = s.valueDeclaration;
  const fn = d && ts.isParameter(d) ? d.parent : undefined;
  const c = fn?.parent;
  if (!c || !ts.isCallExpression(c) || !ts.isPropertyAccessExpression(c.expression) || c.expression.name.text !== "forEach") return undefined;
  const v = sym(c.expression.expression);
  return v && varTargets.get(v);
}

// 函数体里按类型字段分支的字面量：x.type === "reply" / switch (x.type) { case "reply": }
function typeCases(fn: Fn): { t: string; at: ts.Node }[] {
  const TYPE_FIELD = new Set(["type", "kind"]);
  const out: { t: string; at: ts.Node }[] = [];
  const isField = (n: ts.Expression) => ts.isPropertyAccessExpression(n) && TYPE_FIELD.has(n.name.text);
  visitAll((fn as any).body ?? fn, (n) => {
    if (ts.isBinaryExpression(n) && [ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.EqualsEqualsToken].includes(n.operatorToken.kind)) {
      const lit = ts.isStringLiteralLike(n.right) && isField(n.left) ? n.right : ts.isStringLiteralLike(n.left) && isField(n.right) ? n.left : null;
      if (lit) out.push({ t: lit.text, at: n });
    } else if (ts.isSwitchStatement(n) && isField(n.expression)) {
      for (const c of n.caseBlock.clauses) if (ts.isCaseClause(c) && ts.isStringLiteralLike(c.expression)) out.push({ t: c.expression.text, at: c });
    }
  });
  return out;
}


// ────────────────── 符号解析 ──────────────────

function sym(n: ts.Node): ts.Symbol | undefined {
  let s = checker.getSymbolAtLocation(ts.isPropertyAccessExpression(n) ? n.name : n);
  if (s && s.flags & ts.SymbolFlags.Alias) s = checker.getAliasedSymbol(s);
  return s;
}

// 一个表达式指向的仓库内函数体（内联箭头、函数引用、对象属性、shorthand）
function fnsOf(e: ts.Node): Fn[] {
  const u = ts.isExpression(e) ? unwrap(e) : e;
  if (isFn(u)) return [u as Fn];
  const s = sym(u);
  return (s?.declarations ?? []).map(declFn).filter((f): f is Fn => !!f && own(f.getSourceFile().fileName));
}

function declFn(d: ts.Declaration): Fn | undefined {
  if (ts.isFunctionDeclaration(d) || ts.isMethodDeclaration(d) || isFn(d)) return d as Fn;
  if ((ts.isVariableDeclaration(d) || ts.isPropertyAssignment(d)) && d.initializer) {
    const init = unwrap(d.initializer);
    if (isFn(init)) return init as Fn;
    if (ts.isIdentifier(init)) return fnsOf(init)[0];
  }
  if (ts.isShorthandPropertyAssignment(d)) {
    const v = checker.getShorthandAssignmentValueSymbol(d);
    return v?.declarations?.map(declFn).find(Boolean);
  }
  return undefined;
}

// useXStore → defineStore("x", () => {...}) 的 setup 函数
function storeSetup(e: ts.Expression): Fn | undefined {
  const d = sym(e)?.valueDeclaration;
  if (!d || !ts.isVariableDeclaration(d) || !d.initializer || !ts.isCallExpression(d.initializer)) return undefined;
  return d.initializer.arguments.map(unwrap).find(isFn) as Fn | undefined;
}

function returnedMember(fn: Fn, name: string): Fn[] {
  let hit: Fn[] = [];
  visitAll((fn as any).body ?? fn, (n) => {
    if (!ts.isReturnStatement(n) || !n.expression || !ts.isObjectLiteralExpression(unwrap(n.expression))) return;
    for (const p of (unwrap(n.expression) as ts.ObjectLiteralExpression).properties)
      if (p.name && ts.isIdentifier(p.name) && p.name.text === name) hit = [declFn(p as ts.Declaration)].filter(Boolean) as Fn[];
  });
  return hit;
}

function fnSymbol(fn: Fn): ts.Symbol | undefined {
  if (fn.name) return sym(fn.name);
  const p = fn.parent;
  return p && (ts.isVariableDeclaration(p) || ts.isPropertyAssignment(p)) ? sym(p.name) : undefined;
}


// ────────────────── 私有辅助 ──────────────────

function res(id: string, kind: string, label: string) {
  if (!resources.has(id)) resources.set(id, { id, kind, label });
  return id;
}

function link(from: string, to: string, kind: string, at: ts.Node, args: string[], when: string | null) {
  const key = `${from}|${to}|${kind}|${line(at)}`;
  if (edgeKeys.has(key)) return;
  edgeKeys.add(key);
  edges.push({ from, to, kind, async: false, file: rel(at.getSourceFile().fileName), line: line(at), args, when });
}

// 路径模板：`/Conversations/${id}/messages${qs(c)}` → /Conversations/{}/messages（贴着文字的插值是查询串，丢）
// 路径常量：`const P = '/api/v1/projects'` → request(P) / `${P}/${id}` 都按字面展开
function pathTemplate(e: ts.Expression): string | null {
  const strip = (s: string) => s.split("?")[0];
  if (ts.isStringLiteralLike(e)) return e.text.startsWith("/") ? strip(e.text) : null;
  if (ts.isIdentifier(e)) { const c = constString(e); return c?.startsWith("/") ? strip(c) : null; }
  if (!ts.isTemplateExpression(e)) return null;
  let spans = e.templateSpans, head = e.head.text;
  if (head === "" && spans.length && ts.isIdentifier(spans[0].expression)) {
    const c = constString(spans[0].expression);
    if (c === null) return null;
    head = c + spans[0].literal.text;
    spans = spans.slice(1) as any;
  }
  if (!head.startsWith("/")) return null;
  let out = strip(head), prev = head;
  for (const span of spans) {
    if (prev.endsWith("/") && !prev.includes("?")) out += "{}";
    if (prev.includes("?")) break;
    out += strip(span.literal.text);
    prev = span.literal.text;
  }
  return out.replace(/\/$/, "") || "/";
}

// 路径可能分叉：request(cond ? a : b) / const path = cond ? a : b
function paths(e: ts.Expression): string[] {
  if (ts.isParenthesizedExpression(e)) return paths(e.expression);
  if (ts.isConditionalExpression(e)) return [...paths(e.whenTrue), ...paths(e.whenFalse)];
  const d = ts.isIdentifier(e) ? sym(e)?.valueDeclaration : undefined;
  if (d && ts.isVariableDeclaration(d) && d.initializer && ts.isConditionalExpression(d.initializer)
      && ts.getCombinedNodeFlags(d) & ts.NodeFlags.Const) return paths(d.initializer);
  const p = pathTemplate(e);
  return p === null ? [] : [p];
}

// const 字符串，允许常量拼接：const REFRESH = PREFIX + 'refresh'
function constString(id: ts.Identifier): string | null {
  const d = sym(id)?.valueDeclaration;
  if (!d || !ts.isVariableDeclaration(d) || !d.initializer || !(ts.getCombinedNodeFlags(d) & ts.NodeFlags.Const)) return null;
  const val = (e: ts.Expression): string | null => ts.isStringLiteralLike(e) ? e.text
    : ts.isIdentifier(e) ? constString(e)
    : ts.isBinaryExpression(e) && e.operatorToken.kind === ts.SyntaxKind.PlusToken
      ? ((l, r) => l === null || r === null ? null : l + r)(val(e.left), val(e.right)) : null;
  return val(d.initializer);
}

function isDefineEmits(callee: ts.Expression): boolean {
  const d = ts.isIdentifier(callee) ? sym(callee)?.valueDeclaration : undefined;
  return !!d && ts.isVariableDeclaration(d) && !!d.initializer && ts.isCallExpression(d.initializer)
    && calleeName(d.initializer) === "defineEmits";
}

function literals(n: ts.CallExpression): string[] {
  const out: string[] = [];
  const add = (e: ts.Expression, key?: string) => {
    if (ts.isStringLiteralLike(e)) out.push(key ? `${key}=${e.text}` : e.text);
    else if (ts.isObjectLiteralExpression(e))
      for (const p of e.properties) if (ts.isPropertyAssignment(p) && ts.isIdentifier(p.name)) add(p.initializer, p.name.text);
  };
  n.arguments.forEach((a) => add(a));
  return out;
}

// 最近外层 if / switch 条件；到函数边界为止
function whenOf(n: ts.Node): string | null {
  for (let c: ts.Node = n, p = n.parent; p; c = p, p = p.parent) {
    if (isFn(p) || ts.isFunctionDeclaration(p) || ts.isMethodDeclaration(p)) return null;
    if (ts.isIfStatement(p) && c !== p.expression) {
      const cond = squash(p.expression.getText());
      return p.elseStatement === c ? `!(${cond})` : cond;
    }
    if (ts.isCaseClause(p)) return "case " + squash(p.expression.getText());
  }
  return null;
}

function summary(n: ts.Node): string | null {
  const stmt = ts.isVariableDeclaration(n.parent) ? n.parent.parent.parent
    : ts.isPropertyAssignment(n.parent) ? n.parent : n;
  const text = stmt.getSourceFile().getFullText();
  const ranges = ts.getLeadingCommentRanges(text, stmt.getFullStart()) ?? [];
  // 每段注释单独剥前缀再拼：拼完再剥只会剥掉第一段的 //
  const s = ranges.map((r) => text.slice(r.pos, r.end)
    .replace(/^\s*\/\*\*?|\*\/\s*$/gm, "").replace(/^\s*(\/\/+|\*)\s?/gm, "")).join(" ").replace(/\s+/g, " ").trim();
  return !s ? null : s.length > MAX_SUMMARY ? s.slice(0, MAX_SUMMARY) + "…" : s;
}

function reachSet(): Set<string> {
  const callers = new Map<string, string[]>();
  for (const e of edges) if (e.kind === "calls") { const l = callers.get(e.to); if (l) l.push(e.from); else callers.set(e.to, [e.from]); }
  const hit = new Set(edges.filter((e) => e.kind !== "calls").map((e) => e.from));
  const q = [...hit];
  while (q.length) for (const c of callers.get(q.pop()!) ?? []) if (!hit.has(c)) { hit.add(c); q.push(c); }
  return hit;
}

// `${CLOUD_BASE_URL}/Blob/${hash}` → /Blob/{}：首段插值名含 BASE/URL 且紧跟 "/" 才算
function urlPath(e: ts.Expression): string | null {
  if (!ts.isTemplateExpression(e) || e.head.text !== "" || !e.templateSpans.length) return null;
  const [first, ...rest] = e.templateSpans;
  if (!/(base|url)/i.test(first.expression.getText()) || !first.literal.text.startsWith("/")) return null;
  let out = first.literal.text.split("?")[0], prev = first.literal.text;
  for (const span of rest) {
    if (prev.includes("?") || !prev.endsWith("/")) break;
    out += "{}" + span.literal.text.split("?")[0];
    prev = span.literal.text;
  }
  return out.replace(/\/$/, "") || "/";
}

function actionLabel(n: ts.Node): string | null {
  const p = n.parent;
  if (!p || !ts.isPropertyAssignment(p) || !ts.isObjectLiteralExpression(p.parent)) return null;
  for (const q of p.parent.properties)
    if (q !== p && ts.isPropertyAssignment(q) && ts.isIdentifier(q.name) && /^(label|text|title)$/.test(q.name.text)
        && ts.isStringLiteralLike(q.initializer)) return q.initializer.text;
  return null;
}

function isFnLike(n: ts.Node) { return isFn(n) || ts.isFunctionDeclaration(n) || ts.isMethodDeclaration(n); }
function ancestorFn(n: ts.Node) { for (let p = n.parent; p; p = p.parent) if (isFnLike(p)) return p; return undefined; }

function calleeName(n: ts.CallExpression) {
  const e = n.expression;
  return ts.isIdentifier(e) ? e.text : ts.isPropertyAccessExpression(e) ? e.name.text : null;
}

function fnName(fn: ts.Node): string {
  const f = fn as Fn;
  if (f.name && ts.isIdentifier(f.name)) return f.name.text;
  const p = fn.parent;
  if (p && (ts.isVariableDeclaration(p) || ts.isPropertyAssignment(p)) && ts.isIdentifier(p.name)) return p.name.text;
  if (p && ts.isCallExpression(p) && ts.isVariableDeclaration(p.parent) && ts.isIdentifier(p.parent.name))
    return `${p.parent.name.text} = ${calleeName(p) ?? "call"}(…)`;
  if (p && ts.isCallExpression(p)) return `${calleeName(p) ?? "call"}(…)`;
  return "anonymous";
}

function fnId(fn: Fn) { return `f:${rel(fn.getSourceFile().fileName)}:${line(fn)}:${fnName(fn)}`; }
function isFn(n: ts.Node | undefined): boolean { return !!n && (ts.isArrowFunction(n) || ts.isFunctionExpression(n)); }
function unwrap(e: ts.Expression): ts.Expression {
  while (ts.isParenthesizedExpression(e) || ts.isAsExpression(e) || ts.isSatisfiesExpression(e)) e = e.expression;
  return e;
}
function own(f: string) {
  return f.startsWith(src) && !f.endsWith(".d.ts") && !/\.(test|spec)\.[jt]sx?$/.test(f)
    && !relative(src, f).split(/[\\/]/).some((seg) => SKIP_DIRS.has(seg));
}
function rel(f: string) { return relative(root, f).replace(/\.vue\.ts$/, ".vue"); }
function line(n: ts.Node) { return n.getSourceFile().getLineAndCharacterOfPosition(n.getStart()).line + 1; }
function squash(s: string) { const o = s.replace(/\s+/g, " "); return o.length > 80 ? o.slice(0, 80) + "…" : o; }
function visitAll(n: ts.Node, f: (n: ts.Node) => void) { f(n); ts.forEachChild(n, (c) => visitAll(c, f)); }

function walkDir(d: string): string[] {
  return readdirSync(d).flatMap((x) => {
    const p = join(d, x);
    return statSync(p).isDirectory() ? (SKIP_DIRS.has(x) ? [] : walkDir(p)) : [p];
  });
}

// .vue → 虚拟 .ts：<script> 原样；模板行把 @事件 / :绑定 / {{ }} 里的调用合成函数放在原行（非脚本行本就空着，行号不变）
function vueScript(text: string, file: string): string {
  let mode: "tpl" | "script" | "style" = "tpl";
  return text.split("\n").map((l, i) => {
    if (/<script\b/.test(l)) { mode = /<\/script>/.test(l) ? "tpl" : "script"; return ""; }
    if (/<\/script>/.test(l)) { mode = "tpl"; return ""; }
    if (/<style\b/.test(l)) { mode = /<\/style>/.test(l) ? "tpl" : "style"; return ""; }
    if (/<\/style>/.test(l)) { mode = "tpl"; return ""; }
    if (mode === "script") return l;
    if (mode === "style") return "";
    const out: string[] = [];
    const add = (kind: string, label: string, expr: string) => {
      const name = `__tpl_L${i + 1}_${out.length}`;
      tplLabels.set(`${file}|${name}`, { kind, label: label.length > 48 ? label.slice(0, 48) + "…" : label });
      out.push(`function ${name}() { ${/^[\w$.]+$/.test(expr) ? expr + "()" : expr}; }`);
    };
    for (const m of l.matchAll(/(?:@|v-on:)([\w.:-]+)="([^"]*)"/g)) add("ui", `@${m[1]}="${m[2]}"`, m[2]);
    for (const m of l.matchAll(/(?:\s:|v-bind:)([\w.-]+)="([^"]*\([^"]*)"/g)) add("render", `:${m[1]}="${m[2]}"`, m[2]);
    for (const m of l.matchAll(/\{\{([^}]*\([^}]*)\}\}/g)) add("render", `{{${m[1].trim()}}}`, m[1]);
    return out.join(" ");
  }).join("\n");
}

// 不在 git 里（zip 下载、新项目还没提交）：版本记 nogit 并警告，不中断
function git(dir: string) {
  const run = (a: string) => execSync(`git -C "${dir}" ${a}`, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  try { return { rev: run("rev-parse HEAD"), dirty: run("status --porcelain -- .").split("\n").filter(Boolean).length }; }
  catch { console.error(`注意：${dir} 不在 git 仓库里或还没有提交，版本记为 nogit`); return { rev: "nogit", dirty: 0 }; }
}
