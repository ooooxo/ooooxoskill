// atlas ADR 层：源码注释里的「ADR NNNN」引用 = 锚点。扫两端源码的注释，把每处引用对到它所在仓的 docs/adr 文件，读出标题与状态。
// 怎么用：build.ts 调 scanAdrs([{ side, root }])；引用落到哪张卡由 build.ts 按行号找所在方法决定。零 LLM，不改任何文件。
// 需要：bun；git 可选（有就以仓库根为向上找 docs/adr 的边界，没有就只找到这一端的根目录）。
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { execFileSync } from "node:child_process";

export type Status = "accepted" | "proposed" | "dead" | "unknown";
// mentions = 正文里提到的本仓其他 ADR 编号（supersedes / 修订 / 配套……），用来判断一条作废的 ADR 还有没有人指着
export type Adr = { key: string; n: string; side: string; title: string; status: Status; raw: string; path: string; mentions: string[] };
export type Cite = { side: string; file: string; line: number; n: string; adr: string | null };
// 编号重复：同一个 docs/adr 里正文和 archive/ 各有一份同号的（引用一律当成正文那份）
export type Dup = { side: string; n: string; files: string[] };
type Side = { side: string; root: string };

const SKIP = new Set(["node_modules", "bin", "obj", "dist", "target", "build", ".git", ".atlas", "docs", "wwwroot"]);
const SRC = /\.(cs|ts|tsx|vue|js|jsx|rs)$/;
// 状态词（实测各项目 ADR 头部的写法）：缺省 = 有效（domain-modeling 的格式里状态是可选的）
const LIVE = /^(accepted|已定|已接受|接受|implemented|已实施|本版实现|进行中)$/;
const PROPOSED = /^(proposed|提议)$/;
const DEAD = /^(superseded|deprecated|已废弃|已作废|作废|废弃)/;
// 引用前面紧挨着的限定词 = 指别的仓：client / 客户端仓 / 前端 → C；server / 服务端 / 后端 → S；或直接写仓名（MoriiServer ADR 0166，仓名取目录名与 git 仓库名）
// 先认仓名、再认通用词；都要整词（KeroClient 不算 client）
const QUAL: [RegExp, string][] = [[/(\bclient|客户端仓?|前端仓?)\s*$/i, "C"], [/(\bserver|服务端仓?|后端仓?)\s*$/i, "S"]];
const endsWithWord = (pre: string, word: string) => { const t = pre.trimEnd().toLowerCase(), w = word.toLowerCase(); return t.endsWith(w) && !/[a-z0-9_]$/.test(t.slice(0, -w.length)); };

const walk = (d: string, out: string[] = []) => {
  for (const f of readdirSync(d)) {
    if (SKIP.has(f) || f.startsWith(".")) continue;
    const p = join(d, f), s = statSync(p);
    if (s.isDirectory()) walk(p, out); else if (SRC.test(f)) out.push(p);
  }
  return out;
};
const gitTop = (dir: string) => { try { return execFileSync("git", ["-C", dir, "rev-parse", "--show-toplevel"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); } catch { return dir; } };

function statusOf(txt: string, archived: boolean): [Status, string] {
  if (archived) return ["dead", "archive"];
  const m = txt.slice(0, 1500).match(/^(?:>|-)?\s*\*{0,2}(?:status|状态)\*{0,2}\s*[:：]\s*\*{0,2}([^\s（(，,。*]+)/im);
  if (!m) return ["accepted", ""];
  const v = m[1].toLowerCase();
  return [DEAD.test(v) ? "dead" : PROPOSED.test(v) ? "proposed" : LIVE.test(v) ? "accepted" : "unknown", m[1]];
}

// 「ADR NNNN」后面跟着的列表也算：ADR 0109/0147 · ADR 0001、0002、0006 · ADR 0018 / 0019 · ADR 0020 §2 与 0023 · 区间 ADR 0144–0161
// 返回每个编号和它前面那个「ADR」的位置（判断限定词用）
const NEXT = /^(?:\s*(?:§[\d.]+|D\d+|决定\s*\d+))?\s*([\/、,，&+]|和|与|及|[-–—~]|至|到)\s*(\d{3,4})(?!\d)/;
function adrNums(txt: string): { n: string; at: number }[] {
  const out: { n: string; at: number }[] = [];
  for (const m of txt.matchAll(/ADR[ _-]?(\d{3,4})(?!\d)/g)) {
    let prev = +m[1], rest = txt.slice(m.index! + m[0].length, m.index! + m[0].length + 80);
    out.push({ n: m[1].padStart(4, "0"), at: m.index! });
    for (let x = rest.match(NEXT); x; rest = rest.slice(x[0].length), x = rest.match(NEXT)) {
      const cur = +x[2];
      if (/^[-–—~至到]$/.test(x[1]) && cur > prev && cur - prev <= 60) for (let k = prev + 1; k < cur; k++) out.push({ n: String(k).padStart(4, "0"), at: m.index! });
      out.push({ n: String(cur).padStart(4, "0"), at: m.index! });
      prev = cur;
    }
  }
  return out;
}
// 判断「还有没有人指着」要偏保守：「ADR」后面直到这一句结束（。；换行，最多 120 字）出现的四位数都算（「ADR 0011 引入、0128/0138」）
function looseNums(txt: string): { n: string; at: number }[] {
  const out: { n: string; at: number }[] = [];
  for (const m of txt.matchAll(/ADR[ _-]?(?=\d)/g)) {
    const tail = txt.slice(m.index!, m.index! + 120).split(/[。；;\n]/)[0];
    for (const t of tail.matchAll(/(?<![\w.#-])(\d{3,4})(?![\w%])/g)) out.push({ n: t[1].padStart(4, "0"), at: m.index! });
  }
  return [...adrNums(txt), ...out];
}
// 正文里提到别的 ADR：上面这些写法，或者文件链接「./0012-xxx.md」「archive/0012-xxx.md」「archive/0012」
const LINK = /(?<![\w\d])(\d{4})-[^\s)\]'"`]*?\.md|archive\/(\d{4})(?!\d)/g;
// 一个 docs/adr 目录（含 archive/）：编号 → ADR
const dirCache = new Map<string, Map<string, Adr>>(), dups: Dup[] = [];
function loadDir(dir: string, side: string, root: string): Map<string, Adr> {
  if (dirCache.has(dir)) return dirCache.get(dir)!;
  const m = new Map<string, Adr>();
  for (const [d, archived] of [[join(dir, "archive"), true], [dir, false]] as const) {
    if (!existsSync(d)) continue;
    for (const f of readdirSync(d).sort()) {
      const x = f.match(/^(\d{4})-.*\.md$/);
      if (!x) continue;
      const txt = readFileSync(join(d, f), "utf8");
      const [status, raw] = statusOf(txt, archived);
      const title = (txt.match(/^#\s+(.+)$/m)?.[1] ?? f).replace(/^(?:ADR[ -]?)?\d{3,4}\s*[—–:：·-]\s*/i, "").trim();
      // 同号在 archive/ 和正文目录都有：正文目录的为准（后读覆盖），记进编号重复
      if (!archived && m.has(x[1])) dups.push({ side, n: x[1], files: [m.get(x[1])!.path, relative(root, join(d, f))] });
      const own = (at: number) => !QUAL.some(([re]) => re.test(txt.slice(Math.max(0, at - 12), at)));   // 「客户端仓 ADR 0018」是别的仓的，不算
      const mentions = [...new Set([...looseNums(txt).filter((v) => own(v.at)).map((v) => v.n),
        ...[...txt.matchAll(LINK)].map((mm) => (mm[1] ?? mm[2]).padStart(4, "0"))])].filter((n) => n !== x[1]).sort();
      m.set(x[1], { key: `${side}:${relative(root, dir)}#${x[1]}`, n: x[1], side, title, status, raw, path: relative(root, join(d, f)), mentions });
    }
  }
  dirCache.set(dir, m);
  return m;
}

// 扫各端源码注释里的 ADR 引用。每处引用按「离文件最近的 docs/adr → 再往上」找编号；限定词指向另一端的，到那一端的目录里找
export function scanAdrs(sides: Side[]) {
  const adrs = new Map<string, Adr>(), cites: Cite[] = [];
  let foreign = 0;
  const top = new Map(sides.map((s) => [s.side, gitTop(s.root)]));
  // 每一端的名字：根目录名 + 仓库名；两端同名（单仓）的不算，免得把本端的引用认成另一端
  const named = sides.map((s) => ({ side: s.side, names: [...new Set([basename(s.root), basename(top.get(s.side)!)])] }));
  for (const x of named) x.names = x.names.filter((nm) => !named.some((y) => y !== x && y.names.includes(nm)));
  // 从某目录往上（到仓库根为止）所有的 docs/adr，近的在前
  const chain = (from: string, side: string) => {
    const out: string[] = [], stop = top.get(side)!;
    for (let d = from; ; d = dirname(d)) {
      if (existsSync(join(d, "docs/adr"))) out.push(join(d, "docs/adr"));
      if (d === stop || !d.startsWith(stop) || d === dirname(d)) return out;
    }
  };
  const resolve = (side: string, from: string, n: string) => {
    const s = sides.find((x) => x.side === side)!;
    for (const dir of chain(from, side)) { const a = loadDir(dir, side, s.root).get(n); if (a) { adrs.set(a.key, a); return a.key; } }
    return null;
  };
  // 全仓引用只认本图已经登记的 ADR：一个仓里放了好几个项目（各有 docs/adr）时，别的项目的引用不能把它们的 ADR 带进来
  const known = (side: string, from: string, n: string) => {
    const s = sides.find((x) => x.side === side)!;
    for (const dir of chain(from, side)) { const a = loadDir(dir, side, s.root).get(n); if (a) return adrs.has(a.key) ? a.key : null; }
    return null;
  };
  // 每一端自己根目录往上的 ADR 全部登记（没被任何代码引用的有效 ADR 也要列出来）
  for (const s of sides) for (const dir of chain(s.root, s.side)) for (const a of loadDir(dir, s.side, s.root).values()) adrs.set(a.key, a);
  for (const s of sides) for (const f of walk(s.root)) {
    const lines = readFileSync(f, "utf8").split("\n");
    lines.forEach((ln, i) => {
      for (const { n, at } of adrNums(ln)) {
        const pre = ln.slice(0, at);
        if (!/\/\/|\/\*|<!--/.test(pre) && !/^\s*\*/.test(ln)) continue;   // 只认注释，字符串字面量里的不算
        const q = named.find((x) => x.names.some((nm) => endsWithWord(pre, nm)))?.side ?? QUAL.find(([re]) => re.test(pre))?.[1] ?? s.side;
        if (!sides.some((x) => x.side === q)) { foreign++; continue; }   // 指向本图没有的那一端（只有服务端时写的 client ADR）
        const from = q === s.side ? dirname(f) : sides.find((x) => x.side === q)!.root;
        cites.push({ side: s.side, file: relative(s.root, f), line: i + 1, n, adr: resolve(q, from, n) });
      }
    });
  }
  // 仓库里所有被 git 跟踪的文本文件（CLAUDE.md、CONTEXT.md、docs、css、csproj、字符串……）对 ADR 的引用：判断一条作废的 ADR 还有没有人指着。
  // docs/adr 自己的文件不算（ADR 之间的提及走 mentions）；.atlas/ 是这里生成的索引，本来就列着全部 ADR，不算；没进 git 的（生成物、审查 diff）不算
  // 两端在同一个仓库时同一个文件只扫一次，归给根目录包含它的那一端（仓库根上的 CLAUDE.md 之类归给先列的那端）
  const owner = new Map<string, Side>();
  for (const s of sides) {
    const repo = top.get(s.side)!;
    let list: string[];
    try { list = execFileSync("git", ["-C", repo, "ls-files", "-z"], { encoding: "utf8", maxBuffer: 1 << 28 }).split("\0").filter(Boolean).map((f) => join(repo, f)); }
    catch { list = walk(s.root); }
    for (const f of list) if (!owner.has(f) || (f.startsWith(s.root + "/") && !f.startsWith(owner.get(f)!.root + "/"))) owner.set(f, s);
  }
  const refs: Cite[] = [];
  for (const [f, s] of owner) {
    const repo = top.get(s.side)!;
    {
      if (/(^|\/)(docs\/adr|\.atlas(-[^/]+)?)\//.test(relative(repo, f)) || !existsSync(f) || statSync(f).size > 3_000_000) continue;
      const txt = readFileSync(f, "utf8");
      if (txt.slice(0, 8000).includes("\u0000")) continue;   // 二进制
      const hits = [...looseNums(txt), ...[...txt.matchAll(/(?:adr|archive)\/(?:archive\/)?(\d{4})(?!\d)/g)].map((m) => ({ n: m[1], at: m.index! }))];
      for (const { n, at } of hits) {
        const pre = txt.slice(Math.max(0, at - 24), at).split("\n").pop()!;
        const q = named.find((x) => x.names.some((nm) => endsWithWord(pre, nm)))?.side ?? QUAL.find(([re]) => re.test(pre))?.[1] ?? s.side;
        if (!sides.some((x) => x.side === q)) continue;
        refs.push({ side: s.side, file: relative(s.root, f), line: txt.slice(0, at).split("\n").length, n, adr: known(q, q === s.side ? dirname(f) : sides.find((x) => x.side === q)!.root, n) });
      }
    }
  }
  return { adrs, cites, refs, foreign, dups };
}
