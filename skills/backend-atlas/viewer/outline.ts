// atlas 给 agent 读的大纲：.atlas/ 下 index.md（全貌 + 还差什么）· adr.md（每条 ADR 一行 + 引用问题）· by-file.md（文件 → 域 · 循环 · ADR，改文件前先查）
//   · curate.md（整理工作单：没起名的域 / 循环 / 流程 + 图上不好读的地方，每条带上整理要用的事实）。
// 怎么用：build.ts 出图后调 writeOutline(dir, …)；flows/ 大纲由 flows.ts 写在同一目录下。
// 需要：bun。只写相对路径、不写时间戳：代码没变时重跑一字不差，可以提交进 git。
import { mkdirSync, writeFileSync } from "node:fs";

const ST: Record<string, string> = { accepted: "有效", proposed: "待确认", dead: "作废", unknown: "状态读不出" };
const cell = (s: string) => s.replace(/\|/g, "\\|").replace(/\n/g, " ");
const few = (xs: string[], n: number) => xs.length > n ? `${xs.slice(0, n).join("、")} 等 ${xs.length} 条` : xs.join("、");

export function writeOutline(dir: string, x: any) {
  const { title, nodes, edges, edgeLabels, loops, flows, findings, adrs, cites, dups, nearDom, roots, glossary } = x;
  mkdirSync(dir, { recursive: true });
  const label = (id: string) => nodes.get(id)?.label ?? id;
  const domPath = (id: string | null) => { const out: string[] = []; for (let n = id && nodes.get(id); n; n = nodes.get(n.parent)) if (n.kind === "domain") out.unshift(n.label); return out.join("/"); };
  const both = !!roots.C, sideName = (s: string) => (s === "S" ? "服务端" : "客户端");
  const adrBy = new Map<string, any>(adrs.map((a: any) => [a.key, a]));
  // 编号默认指本端的 ADR；指另一端的写明「服务端 0001」，两端编号各自独立
  const adrTag = (a: any, side: string) => `${a.side === side ? "" : sideName(a.side) + " "}${a.n}${a.status === "accepted" ? "" : ` ${ST[a.status]}`}`;
  const loopKey = (l: any) => `${l.verbs.join(",")} ${l.route}`;
  // 卡 → 经过它的业务循环（步骤两端 + 端点）
  const loopsOf = new Map<string, Set<string>>();
  for (const l of loops) for (const id of [l.endpoint, ...l.steps.flatMap((s: any) => [s.a, s.b])]) (loopsOf.get(id) ?? loopsOf.set(id, new Set()).get(id)!).add(l.name);
  // 前端触发点所在的文件也算在这条循环里（步骤只走了第一个触发点）
  const trigOf = new Map<string, Set<string>>();
  for (const l of loops) for (const t of l.triggers) (trigOf.get(`C\t${t.file}`) ?? trigOf.set(`C\t${t.file}`, new Set()).get(`C\t${t.file}`)!).add(l.name);

  // ---- by-file.md：图上有卡的文件 + 注释里引了 ADR 的文件 ----
  const files = new Map<string, { cards: Set<string>; adrs: Set<string> }>();
  const row = (side: string, file: string) => { const k = `${side}\t${file}`; return files.get(k) ?? files.set(k, { cards: new Set(), adrs: new Set() }).get(k)!; };
  for (const n of nodes.values()) if (n.file && !n.kids.length) row(n.side ?? (n.id.startsWith("C:") ? "C" : "S"), n.file).cards.add(n.id);
  for (const c of cites) { const r = row(c.side, c.file); if (c.card) r.cards.add(c.card); r.adrs.add(c.adr ? adrTag(adrBy.get(c.adr), c.side) : `${c.n} 不存在`); }
  const fileRows = [...files].sort(([a], [b]) => a.localeCompare(b)).map(([k, r]) => {
    const [side, file] = k.split("\t");
    const doms = [...new Set([...r.cards].map((c) => domPath(nearDom(c))).filter(Boolean))].sort();
    const ls = [...new Set([...[...r.cards].flatMap((c) => [...(loopsOf.get(c) ?? [])]), ...(trigOf.get(k) ?? [])])].sort();
    return `| ${both ? sideName(side) + " " : ""}${cell(file)} | ${cell(doms.join("、"))} | ${cell(few(ls, 4))} | ${[...r.adrs].sort().join("、")} |`;
  });
  writeFileSync(`${dir}/by-file.md`, `# 按文件反查（自动生成，勿手改）\n\n改一个文件前先 grep 它的文件名：属于哪个域、在哪些业务循环里、注释引了哪些 ADR（只读这几条）。\n`
    + `服务端路径相对 \`${roots.S}\`${both ? `，客户端相对 \`${roots.C}\`` : ""}。ADR 后面没写状态的就是有效。\n\n| 文件 | 域 | 业务循环 | ADR |\n|---|---|---|---|\n${fileRows.join("\n")}\n`);

  // ---- adr.md：有效 / 待确认的一条一行；作废的收在后面；引用问题逐条列 ----
  const cnt = (s: string) => adrs.filter((a: any) => a.status === s).length;
  const domsOf = (a: any) => [...new Set(a.nodes.map((id: string) => domPath(nearDom(id))).filter(Boolean))].sort().join("、");
  const table = (list: any[]) => `| 编号 | 状态 | 标题 | 引用 | 落在哪些域 | 文件 |\n|---|---|---|---|---|---|\n`
    + list.map((a) => `| ${a.n} | ${ST[a.status]}${a.status === "unknown" ? `「${cell(a.raw)}」` : ""} | ${cell(a.title)} | ${a.cites} | ${cell(domsOf(a))} | ${cell(a.path)} |`).join("\n") + "\n";
  const live = adrs.filter((a: any) => a.status !== "dead"), dead = adrs.filter((a: any) => a.status === "dead");
  const sides = both ? ["S", "C"] : ["S"];
  const at = (c: any) => `${both ? sideName(c.side) + " " : ""}${c.file}:${c.line}`;
  const who = (a: any) => `${both ? sideName(a.side) + " " : ""}ADR ${a.n}`;
  const deadCites = dead.filter((a: any) => a.cites).map((a: any) => `- ${who(a)} ${a.title}（${a.raw === "archive" ? "已归档" : a.raw}）：${cites.filter((c: any) => c.adr === a.key).map(at).join("、")}`);
  const missCites = cites.filter((c: any) => !c.adr).map((c: any) => `- ${at(c)} → ADR ${c.n}`);
  // 代码注释以外（CLAUDE.md / CONTEXT.md / 文档 / 配置）还指着作废 ADR 的地方：注释的已在上一节
  const citeAt = new Set(cites.map((c: any) => `${c.file}:${c.line}`));
  const staleDocs = dead.map((a: any) => [a, a.refs.filter((r: string) => !citeAt.has(r))] as const).filter(([, rs]) => rs.length)
    .map(([a, rs]) => `- ${who(a)} ${a.title}：${rs.join("、")}`);
  const dupLines = dups.map((d: any) => `- ${both ? sideName(d.side) + " " : ""}ADR ${d.n}：${d.files.join(" 与 ")}`);
  const sec = (t: string, lines: string[], hint = "") => lines.length ? `\n### ${t}（${lines.length}）\n${hint ? hint + "\n" : ""}\n${lines.join("\n")}\n` : "";
  const removable = adrs.filter((a: any) => a.removable).length;
  writeFileSync(`${dir}/adr.md`, `# ADR 索引（自动生成，勿手改）\n\n源码注释里的「ADR NNNN」就是锚点：build 每次按行号把它挂到所在方法的卡上。`
    + `改文件前先在 by-file.md 查它引了哪些；新决策写进 docs/adr 后，在代码起作用的地方用注释引用它的编号。\n\n`
    + `${adrs.length} 条 · 有效 ${cnt("accepted")} · 待确认 ${cnt("proposed")} · 作废 ${cnt("dead")}（可以删 ${removable}）· 状态读不出 ${cnt("unknown")} · 注释引用 ${cites.length} 处\n`
    + sides.map((s) => { const l = live.filter((a: any) => a.side === s); return l.length ? `\n## ${both ? sideName(s) : "有效与待确认"}\n\n${table(l)}` : ""; }).join("")
    + `\n## 要处理\n`
    + sec("引用的 ADR 不存在", missCites, "编号写错了，或指的是别的仓：写成「client ADR 0018」「server ADR 0161」才会去那一端找。")
    + sec("引用了作废的 ADR", deadCites, "决策换了、代码没跟上，或注释该改指向接替它的那条。")
    + sec("文档还指着作废的 ADR", staleDocs, "CLAUDE.md 的不变量、CONTEXT.md、部署文档等还在引用：改指向现行的那条，或删掉过时的那句。")
    + sec("编号重复", dupLines, "正文和 archive/ 里各有一份同号的 ADR，引用一律算正文那份：给后来那份换一个没用过的号，并改掉指着它的引用。")
    + sec("待确认", adrs.filter((a: any) => a.status === "proposed").map((a: any) => `- ${who(a)} ${a.title} · ${a.path}`), "agent 起草、用户还没拍板的：确认后把状态改成 accepted。")
    + sec("状态读不出", adrs.filter((a: any) => a.status === "unknown").map((a: any) => `- ${who(a)}「${a.raw}」· ${a.path}`))
    + sec("可以删", adrs.filter((a: any) => a.removable).map((a: any) => `- ${who(a)} ${a.title} · ${a.path}`),
      "作废了、仓库里没有任何文件再指着它（代码、CLAUDE.md、CONTEXT.md、文档、配置都查过），也没有有效 ADR 提到它。列给用户确认后用 git rm 删（git 里留着历史）；最大号的那份别删，免得新 ADR 取号时复用它。")
    + sec("没有代码引用的有效 ADR", live.filter((a: any) => !a.cites && a.status === "accepted").map((a: any) => `- ${who(a)} ${a.title}${a.mentionedBy.length ? `（被 ${a.mentionedBy.join("、")} 提到）` : ""}`),
      "不落在代码上的决策（部署、流程、取舍）可以没有引用；落在代码上的，在起作用的地方补一句注释引用；已经不成立的，状态改成 superseded / 挪进 archive/，下一轮就进「可以删」。")
    + (dead.length ? `\n## 作废（${dead.length}）\n\n${dead.map((a: any) => `- ${who(a)} ${a.title} · ${a.path}${a.removable ? " · 可以删" : a.cites ? ` · 代码还引用 ${a.cites} 处` : a.refs.length ? ` · 文件还指着 ${a.refs.length} 处` : ` · 被 ${a.mentionedBy.join("、")} 提到`}`).join("\n")}\n` : ""));

  // ---- index.md：全貌 + 域树 + 还差什么 ----
  const named = (l: any) => l.name !== loopKey(l);
  const doms = [...nodes.values()].filter((n: any) => n.kind === "domain");
  const depth = (n: any) => { let d = 0; for (let p = nodes.get(n.parent); p; p = nodes.get(p.parent)) if (p.kind === "domain") d++; return d; };
  const order: any[] = [];
  const visit = (n: any) => { order.push(n); for (const k of n.kids) { const c = nodes.get(k); if (c?.kind === "domain") visit(c); } };
  for (const d of doms.filter((d: any) => !d.parent)) visit(d);
  const domLine = (d: any) => {
    const eps = [...nodes.values()].filter((n: any) => n.kind === "endpoint" && nearDom(n.id) === d.id).length;
    const ls = loops.filter((l: any) => l.domain === d.id).map((l: any) => l.name);
    const side = [...nodes.values()].some((n: any) => n.id.startsWith("C:") && nearDom(n.id) === d.id) ? "C" : "S";
    const as = adrs.filter((a: any) => a.status !== "dead" && a.nodes.some((id: string) => nearDom(id) === d.id)).map((a: any) => adrTag(a, side));
    return `${"  ".repeat(depth(d))}- **${d.label}**${d.desc ? ` — ${d.desc}` : ""}${eps ? ` · 端点 ${eps}` : ""}${ls.length ? ` · 循环：${few(ls, 6)}` : ""}${as.length ? ` · ADR ${as.join("、")}` : ""}`;
  };
  const drafts = flows.filter((f: any) => f.source === "auto").sort((a: any, b: any) => b.rank - a.rank || a.name.localeCompare(b.name));
  const unnamed = loops.filter((l: any) => !named(l));
  const rawDoms = order.filter((d: any) => /^[\w.\-]+$/.test(d.label) && [...nodes.values()].some((n: any) => n.kind === "endpoint" && nearDom(n.id) === d.id));   // 骨架给的域名就是控制器原名
  const nameless = flows.filter((f: any) => !f.named && !f.loop);   // 有业务循环的流程跟循环同名，这里只算 GET 查询与后台流程
  // 图上不好读的地方：域没写介绍 · 一个域直接挂太多卡没分组 · 域与域之间线多却没写字（默认视图里看到的那一层）
  const noDesc = order.filter((d: any) => !d.desc && d.kids.length);
  const crowded = order.map((d: any) => [d, d.kids.filter((k: string) => !["domain", "group"].includes(nodes.get(k)?.kind)).length] as const).filter(([, n]) => n > 8);
  const shown = (id: string) => { const chain: any[] = []; for (let n = nodes.get(id); n; n = nodes.get(n.parent)) if (n.kind === "domain") chain.unshift(n);
    let i = 0; while (chain[i]?.spread && chain[i + 1]) i++; return chain[i]?.id ?? null; };
  const pairs = new Map<string, { a: string; b: string; n: number; k: Set<string> }>();
  for (const e of edges) { const a = shown(e.a), b = shown(e.b); if (!a || !b || a === b) continue;
    const x = pairs.get(a + "\t" + b) ?? pairs.set(a + "\t" + b, { a, b, n: 0, k: new Set() }).get(a + "\t" + b)!; x.n += e.n; x.k.add(e.k); }
  const bare = [...pairs.values()].filter((x) => !edgeLabels.some((l: any) => l.a === x.a && l.b === x.b)).sort((x, y) => y.n - x.n || x.a.localeCompare(y.a) || x.b.localeCompare(y.b)).slice(0, 12);
  const todo = [
    ...findings.filter((f: any) => f.items.length).map((f: any) => `- 体检「${f.title}」${f.items.length} 项：${few(f.items.map((i: any) => i.label), 3)}`),
    rawDoms.length && `- 域还是控制器原名 ${rawDoms.length} 个：${few(rawDoms.map((d: any) => d.label), 6)}（curate.md，按业务合并、起名）`,
    unnamed.length && `- 业务循环没起人话名 ${unnamed.length} 条：${few(unnamed.map(loopKey), 5)}（curate.md）`,
    nameless.length && `- 流程没起名 ${nameless.length} 条（GET 查询与后台流程，curate.md）`,
    (noDesc.length || crowded.length || bare.length) && `- 图不好读：域没写介绍 ${noDesc.length} · 挂太多卡没分组 ${crowded.length} · 域间连线没写字 ${bare.length}（curate.md）`,
    drafts.length && `- 流程还是草稿 ${drafts.length} 条，最值得整理的：${few(drafts.map((f: any) => f.name), 5)}（见 flows/index.md）`,
    cnt("proposed") && `- 待确认的 ADR ${cnt("proposed")} 条（adr.md）`,
    removable && `- 可以删的 ADR ${removable} 条：作废、没有任何文件再指着、也没有有效 ADR 提到（adr.md「可以删」，先列给用户确认）`,
    staleDocs.length && `- 文档还指着作废的 ADR ${staleDocs.length} 条（CLAUDE.md / CONTEXT.md 等，adr.md）`,
    dups.length && `- ADR 编号重复 ${dups.length} 个（adr.md）`,
    cnt("unknown") && `- 状态读不出的 ADR ${cnt("unknown")} 条（adr.md）`,
  ].filter(Boolean);
  writeFileSync(`${dir}/index.md`, `# ${title ?? "系统图"} · agent 索引（自动生成，勿手改）\n\n`
    + `事实来自代码抽取，域 / 循环名 / 流程来自 atlas.json，决策来自 docs/adr 和代码注释里的 ADR 引用。要改内容就改这三处，再重跑 run.sh。\n\n`
    + `- 改某个文件前：在 by-file.md 里 grep 它的文件名，看它属于哪个域、在哪些业务循环里、哪些 ADR 管着它，只读那几条 ADR。\n`
    + `- 找决策：按关键词 grep adr.md（一条一行，别整个读进来）。看一条业务怎么跑：flows/index.md，再只读那一条的文件。\n`
    + `- 整理（按业务归类、起名、让图好读）：curate.md。第一次接项目先做这一步；以后新增的端点 / 流程也从这里补。\n\n`
    + `## 全貌\n\n域 ${doms.length} · 端点 ${[...nodes.values()].filter((n: any) => n.kind === "endpoint").length} · 业务循环 ${loops.length}（起了名 ${loops.filter(named).length}）`
    + ` · 流程 ${flows.length}（有名字 ${flows.filter((f: any) => f.named || (f.loop && named(loops.find((l: any) => l.id === f.loop)))).length}，整理成树 ${flows.length - drafts.length}）· ADR ${adrs.length}（有效 ${cnt("accepted")}，注释引用 ${cites.length} 处）\n\n`
    + `## 域\n\n${order.map(domLine).join("\n")}\n\n## 还差什么\n\n逐步打磨就从这里挑；做完重跑 run.sh，这里会跟着变。\n\n${todo.length ? todo.join("\n") : "- 没有了"}\n`);

  // ---- curate.md：整理工作单。每条带上整理要用的事实（方法、注释、写表、推送、前端入口、ADR），agent 不用逐个翻源码 ----
  const short = (f: string) => f.split("/").pop()!.replace(/\.\w+$/, "");
  const liveAdrs = adrs.filter((a: any) => a.status !== "dead");
  const adrOn = (ids: Set<string>) => liveAdrs.filter((a: any) => a.nodes.some((id: string) => ids.has(id))).map((a: any) => `${a.n}「${a.title}」`);
  const loopFacts = (l: any) => {
    const ep = nodes.get(l.endpoint), ids = new Set<string>([l.endpoint]);   // 只取落在端点本身的 ADR：链路上的总纲性 ADR 每条都有，等于噪音
    const w = [...new Set(l.steps.filter((s: any) => s.k === "writes").map((s: any) => label(s.b)))] as string[];
    const p = [...new Set(l.steps.filter((s: any) => s.k === "push" || s.k === "pushes").map((s: any) => s.label ?? label(s.b)))] as string[];
    const t = [...new Set(l.triggers.map((x: any) => short(x.file)))] as string[];
    return [ep?.file && `${short(ep.file)}.${ep.label}`, ep?.summary && `「${ep.summary}」`, w.length && `写 ${few(w, 4)}`, p.length && `推 ${few(p, 3)}`,
      t.length && `前端 ${few(t, 3)}`, adrOn(ids).length && `ADR ${few(adrOn(ids), 2)}`].filter(Boolean).join(" · ");
  };
  const domFacts = (d: any) => {
    const eps = [...nodes.values()].filter((n: any) => n.kind === "endpoint" && nearDom(n.id) === d.id).map((n: any) => n.human ?? n.label);
    const w = [...new Set(loops.filter((l: any) => l.domain === d.id).flatMap((l: any) => l.steps.filter((s: any) => s.k === "writes").map((s: any) => label(s.b))))] as string[];
    const as = liveAdrs.filter((a: any) => a.nodes.some((id: string) => nearDom(id) === d.id)).map((a: any) => `${a.n}「${a.title}」`);
    return [eps.length && `端点 ${eps.length}：${few(eps, 8)}`, w.length && `写 ${few(w, 5)}`, as.length && `ADR ${few(as, 3)}`].filter(Boolean).join(" · ");
  };
  const flowFacts = (f: any) => [`\`${f.id.slice(2)}\``, f.name, f.dom && `域 ${domPath(f.dom)}`, f.summary && `「${f.summary}」`,
    f.ibo.out.writes.length && `写 ${few(f.ibo.out.writes, 4)}`, f.ibo.out.pushes.length && `推 ${few(f.ibo.out.pushes, 3)}`, f.ibo.in.reads.length && `读 ${few(f.ibo.in.reads, 4)}`,
    f.ibo.in.trig.length && `前端 ${few(f.ibo.in.trig.map((t: string) => t.split(":")[0]), 3)}`].filter(Boolean).join(" · ");
  const sid = (id: string) => id.slice(2);   // 语义层里写的域 id（节点 id 去掉 D:）
  const kinds = (k: Set<string>) => [...k].sort().join("/");
  const none = (xs: string[]) => (xs.length ? xs.join("\n") : "- 没有了");
  writeFileSync(`${dir}/curate.md`, `# 整理工作单（自动生成，勿手改）\n\n`
    + `给 agent 用：按业务把控制器归成域、给循环和流程起人话名、把图整理得好读。整理只写进 atlas.json；抽取出来的事实每次重跑照常更新，不会覆盖整理过的东西。`
    + `做完重跑 run.sh，这里会变短。\n取名先用 CONTEXT.md 里的词，其次 ADR 标题、代码注释；代码和文档里都没有的业务说法不要发明，拿不准的问用户。\n`
    + `本项目的取名材料：${glossary.length ? `CONTEXT.md（${glossary.join("、")}）` : "没有 CONTEXT.md"} · ADR ${adrs.filter((a: any) => a.status !== "dead").length} 条有效（adr.md）\n\n`
    + `## 域（${order.length} 个，${rawDoms.length} 个还是控制器原名）\n\n按业务归类：同一块业务的 \`S:c:控制器\` 放进同一个域的 match，改 name、写一句 desc；域里卡多就用 groups 按功能分组。\n\n`
    + order.map((d: any) => `${"  ".repeat(depth(d))}- **${d.label}** \`${sid(d.id)}\`${rawDoms.includes(d) ? "（还是控制器原名）" : ""}${domFacts(d) ? ` · ${domFacts(d)}` : ""}`).join("\n") + "\n\n"
    + `## 业务循环没起名（${unnamed.length} 条）\n\n写进 loops：\`"动词 路由": ["人话名", "一句话：谁在什么时候做什么，落到哪"]\`\n\n`
    + none(unnamed.map((l: any) => `- \`${loopKey(l)}\` · ${loopFacts(l)}`)) + "\n\n"
    + `## 流程没起名（${nameless.length} 条：GET 查询与后台流程）\n\n写进 flows：\`"流程 id": { "name": "人话名", "story": "一句话" }\`（只起名、不写 tree，流程图仍用自动草稿；值得细讲的按 docs/flows.md 写 tree）\n\n`
    + none(nameless.map((f: any) => `- ${flowFacts(f)}`)) + "\n\n"
    + `## 图不好读的地方\n\n### 域没写介绍（${noDesc.length}）\n\n域的 desc 写一句它管什么业务，抽屉和 index.md 的域树都用它。\n\n`
    + none(noDesc.map((d: any) => `- ${domPath(d.id)} \`${sid(d.id)}\``)) + "\n\n"
    + `### 一个域直接挂太多卡、没分组（${crowded.length}）\n\n超过 8 张就该分组：\`groups: { "D:域 id": [{ "name": "功能", "icon": "…", "match": ["正则：匹配 名字 动词 路由 文件"] }] }\`，漏一张 build 会报出来。\n\n`
    + none(crowded.map(([d, n]) => `- ${domPath(d.id)} \`${d.id}\` · 直接挂 ${n} 张`)) + "\n\n"
    + `### 域与域之间线多却没写字（前 ${bare.length} 对，按线数排）\n\n线上写一句业务话（「下单时扣积分」），比「调用」好读：\`edgeLabels: [{ "from": "域 id", "to": "域 id", "label": "…" }]\`\n\n`
    + none(bare.map((x) => `- ${domPath(x.a)} → ${domPath(x.b)} \`${sid(x.a)} → ${sid(x.b)}\` · ${x.n} 条 ${kinds(x.k)}`)) + "\n");
}
