// atlas-client 的 Rust 腿：tree-sitter 解析 src-tauri —— #[tauri::command] / listen 入口 → crate 内调用（按名解析）→ reqwest REST / emit 总线
// 怎么用：import { extractRust } from "./rust"; const part = await extractRust(tauriSrcDir, clientRoot)
// 需要：web-tree-sitter + tree-sitter-rust（包内自带 wasm）。只补「invoke → 命令 → HTTP / 事件」这一段，不做类型解析。
import { Language, Parser, type Node } from "web-tree-sitter";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { join, relative } from "node:path";

const HTTP = new Set(["get", "post", "put", "delete", "head", "patch"]);
const EMIT = new Set(["emit", "emit_to", "emit_all", "emit_str"]);
const LISTEN = new Set(["listen", "listen_any", "once"]);

type Fn = { id: string; name: string; file: string; node: Node; command: boolean };

export async function extractRust(dir: string, root: string) {
  await Parser.init();
  const req = createRequire(import.meta.url);
  const parser = new Parser();
  parser.setLanguage(await Language.load(req.resolve("tree-sitter-rust/tree-sitter-rust.wasm")));

  const trees = walk(dir).filter((f) => f.endsWith(".rs"))
    .map((f) => ({ file: relative(root, f), tree: parser.parse(readFileSync(f, "utf8"))! }));

  // ---- 常量字符串（事件名常写成 const TARGET_EVENT: &str = "..."）与全部函数 ----
  const consts = new Map<string, string>();
  const fns: Fn[] = [];
  for (const { file, tree } of trees) {
    for (const c of tree.rootNode.descendantsOfType(["const_item", "static_item"])) {
      const v = c?.childForFieldName("value");
      if (c && v?.type === "string_literal") consts.set(c.childForFieldName("name")!.text, unquote(v.text));
    }
    for (const f of tree.rootNode.descendantsOfType("function_item")) {
      if (!f) continue;
      const name = f.childForFieldName("name")!.text;
      fns.push({ id: `r:${file}:${f.startPosition.row + 1}:${name}`, name, file, node: f, command: attrs(f).some((a) => a.includes("tauri::command")) });
    }
  }
  const byName = Map.groupBy(fns, (f) => f.name);

  const methods: any[] = [], resources = new Map<string, any>(), edges: any[] = [], entries: any[] = [];
  const res = (id: string, kind: string, label: string) => (resources.has(id) || resources.set(id, { id, kind, label }), id);
  const link = (from: string, to: string, kind: string, at: Node, file: string, args: string[] = []) =>
    edges.push({ from, to, kind, async: false, file, line: at.startPosition.row + 1, args, when: whenOf(at) });

  // ---- 每个函数：调用按名解析；HTTP / emit 落资源；listen 登记入口 ----
  for (const f of fns) {
    const body = f.node.childForFieldName("body");
    methods.push({
      id: f.id, label: f.name, type: f.file.split("/").pop(), file: f.file, line: f.node.startPosition.row + 1,
      endLine: f.node.endPosition.row + 1, summary: docOf(f.node), util: false,
    });
    if (f.command) entries.push({
      id: `tauri:${f.name}`, kind: "tauri", module: "rs:" + f.file, verbs: [], route: f.name, auth: "none", rateLimit: null,
      conditional: false, method: f.id, file: f.file, line: f.node.startPosition.row + 1, summary: docOf(f.node), order: entries.length,
    });
    if (!body) continue;
    for (const call of body.descendantsOfType("call_expression")) {
      if (!call) continue;
      const fnNode = call.childForFieldName("function")!;
      const args = call.childForFieldName("arguments")?.namedChildren.filter((a): a is Node => !!a) ?? [];
      const name = fnNode.type === "field_expression" ? fnNode.childForFieldName("field")!.text
        : fnNode.type === "scoped_identifier" ? fnNode.childForFieldName("name")!.text : fnNode.text;

      if (/^sqlx::query(_as|_scalar)?\b/.test(fnNode.text) && args[0]) {
        // 本地 SQLite：SQL 里的表名 + 读写方向（镜像同步循环的本地一端）
        for (const [op, table] of sqlTables(args[0]))
          link(f.id, res("local:" + table, "localTable", table), op, call, f.file);
      } else if (fnNode.type === "field_expression" && HTTP.has(name) && args[0] && pathOf(args[0])) {
        const route = `${name.toUpperCase()} ${pathOf(args[0])}`;
        link(f.id, res("api:" + route, "api", route), "api", call, f.file);
      } else if (fnNode.type === "field_expression" && EMIT.has(name)) {
        const ev = str(args[name === "emit_to" ? 1 : 0], consts);
        if (ev) link(f.id, res("bus:" + ev, "busEvent", ev), "emits", call, f.file, name === "emit_to" ? [str(args[0], consts) ?? ""] : []);
      } else if (fnNode.type === "field_expression" && LISTEN.has(name) && str(args[0], consts)) {
        const ev = str(args[0], consts)!;
        entries.push({
          id: `busEvent:${ev}@${f.file}:${call.startPosition.row + 1}`, kind: "busEvent", module: "rs:" + f.file, verbs: [], route: ev,
          auth: "none", rateLimit: null, conditional: false, method: f.id, file: f.file, line: call.startPosition.row + 1, summary: null, order: entries.length,
        });
      } else {
        // 按名解析：唯一命中直接连；重名优先同文件，仍歧义就放弃（不猜）
        const cands = byName.get(name) ?? [];
        const pick = cands.length === 1 ? cands : cands.filter((c) => c.file === f.file);
        if (pick.length === 1 && pick[0] !== f) link(f.id, pick[0].id, "calls", call, f.file);
      }
    }
  }

  // 只留命令 / 监听入口能走到的函数
  const out = new Map<string, string[]>();
  for (const e of edges) if (e.kind === "calls") { const l = out.get(e.from); if (l) l.push(e.to); else out.set(e.from, [e.to]); }
  const live = new Set<string>(entries.map((e) => e.method));
  const q = [...live];
  while (q.length) for (const n of out.get(q.pop()!) ?? []) if (!live.has(n)) { live.add(n); q.push(n); }
  return {
    entries, resources: [...resources.values()],
    methods: methods.filter((m) => live.has(m.id)), edges: edges.filter((e) => live.has(e.from)),
    modules: [...new Set(entries.map((e) => e.module))].map((id) => ({ id, label: id.split("/").pop(), kind: "file", file: id.slice(3), line: 1, endLine: 1, summary: null })),
  };
}


// ────────────────── 私有辅助 ──────────────────

// format!("{}/Blob/{}", base, hash) / "/Feedback" → /Blob/{}；没有 "/" 路径的不算（store.get("jwt_token")）
function pathOf(n: Node): string | null {
  const lit = n.type === "string_literal" ? n : n.type === "macro_invocation" ? n.descendantsOfType("string_literal")[0] : null;
  if (!lit) return null;
  const s = unquote(lit.text);
  const at = s.startsWith("/") ? 0 : /^\{[\w.]*\}\//.test(s) ? s.indexOf("/") : -1;
  if (at < 0) return null;
  return s.slice(at).split("?")[0].replace(/\{[\w.:]*\}/g, "{}").replace(/\/$/, "") || "/";
}

// "INSERT INTO moments …" → [["writes","moments"]]；format! / 原始字符串里取第一段字面量
function sqlTables(n: Node): [string, string][] {
  const lit = ["string_literal", "raw_string_literal"].includes(n.type) ? n
    : n.descendantsOfType(["string_literal", "raw_string_literal"])[0];
  if (!lit) return [];
  const sql = lit.text.replace(/^r#*"|"#*$|^"|"$/g, "");
  const write = /^\s*(insert|update|delete|replace)\b/i.test(sql);
  const out = new Map<string, string>();
  const ctes = new Set([...sql.matchAll(/(?:\bwith|,)\s*([a-z_][a-z0-9_]*)\s+as\s*\(/gi)].map((m) => m[1].toLowerCase()));
  for (const m of sql.matchAll(/\b(from|join|into|update)\s+([a-z_][a-z0-9_]*)/gi)) {
    const kw = m[1].toLowerCase(), t = m[2].toLowerCase();
    if (["select", "set", "values", "where"].includes(t) || ctes.has(t)) continue;
    const op = write && (kw === "into" || kw === "update" || (kw === "from" && /^\s*delete/i.test(sql))) ? "writes" : "reads";
    if (out.get(t) !== "writes") out.set(t, op);
  }
  return [...out].map(([t, op]) => [op, t]);
}

function str(n: Node | undefined, consts: Map<string, string>): string | null {
  if (!n) return null;
  if (n.type === "string_literal") return unquote(n.text);
  return consts.get(n.text.split("::").pop()!) ?? null;
}

function attrs(f: Node): string[] {
  const out: string[] = [];
  for (let p = f.previousNamedSibling; p && (p.type === "attribute_item" || p.type.endsWith("comment")); p = p.previousNamedSibling)
    if (p.type === "attribute_item") out.push(p.text);
  return out;
}

function docOf(f: Node): string | null {
  const lines: string[] = [];
  for (let p = f.previousNamedSibling; p && (p.type === "attribute_item" || p.type.endsWith("comment")); p = p.previousNamedSibling)
    if (p.type.endsWith("comment")) lines.unshift(p.text.replace(/^\/\/[\/!]?\s?/, "").trim());
  const s = lines.filter(Boolean).join(" ");
  return !s ? null : s.length > 200 ? s.slice(0, 200) + "…" : s;
}

function whenOf(n: Node): string | null {
  for (let c: Node = n, p = n.parent; p; c = p, p = p.parent) {
    if (p.type === "function_item" || p.type === "closure_expression") return null;
    if (p.type === "if_expression" && p.childForFieldName("condition")?.id !== c.id) {
      const cond = p.childForFieldName("condition")!.text.replace(/\s+/g, " ");
      return cond.length > 80 ? cond.slice(0, 80) + "…" : cond;
    }
    if (p.type === "match_arm") return "case " + (p.childForFieldName("pattern")?.text ?? "").replace(/\s+/g, " ").slice(0, 80);
  }
  return null;
}

function unquote(s: string) { return s.replace(/^"|"$/g, ""); }

function walk(d: string): string[] {
  return readdirSync(d).flatMap((x) => {
    const p = join(d, x);
    return statSync(p).isDirectory() ? (x === "target" ? [] : walk(p)) : [p];
  });
}
