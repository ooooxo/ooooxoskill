// atlas 流程页的画法：逻辑树 · 泳道 · 环形跑道 · 结局倒推 + 问题页签 + 「为什么停」侧栏。
// 从 docs/lab/loop-mindmap.html（对照版第一 / 二轮定下的四档）原样抽出；改画法先在对照页里改好、再照样同步到这里，两边不分叉。
// 由 build.ts 内联进 graph.html；依赖 graph.html 里的 esc / ic（图标名同 atlas）。
const FLOW = (() => {
const RW = { w: ["写", "w"], r: ["读", "r"], p: ["推", "p"], h: ["调", "h"], q: ["", "q"] };
function prep(s) {
  const byKey = new Map();
  const walk = (n, parent, depth, ph) => {
    n.parent = parent; n.depth = depth; n.ph = n.k === "phase" ? parent.kids.indexOf(n) : ph;
    n.path = parent ? parent.path + " " + n.id : n.id;
    n.lane = n.l ?? (n.k === "phase" ? null : null);
    n.res = (n.r ?? []).map((x) => { const [k, ...v] = x.split(":"); return { f: RW[k][1], label: (RW[k][0] ? RW[k][0] + " " : "") + v.join(":") }; });
    if (n.key) byKey.set(n.key, n);
    n.kids.forEach((k) => walk(k, n, depth + 1, n.ph));
  };
  walk(s.tree, null, 0, null);
  const all = []; const col = (n) => { all.push(n); n.kids.forEach(col); }; col(s.tree);
  for (const n of all) if (n.k === "back") n.target = byKey.get(n.to);
  s.all = all;
}

const phaseOf = (n) => { for (let x = n; x; x = x.parent) if (x.k === "phase") return x; return null; };
const laneOf = (n, root) => { for (let x = n; x; x = x.parent) if (x.l) return x.l; return root.l ?? "svc"; };


/* ---- 量字：节点宽按真字宽算，连线才对得上边 ---- */
const cx = document.createElement("canvas").getContext("2d");
const FONT = () => getComputedStyle(document.body).fontFamily, MONO = getComputedStyle(document.documentElement).getPropertyValue("--font-mono") || "monospace";
const tw = (s, px, wt, mono) => { cx.font = `${wt} ${px}px ${mono ? MONO : FONT()}`; return cx.measureText(s).width; };
const SZ = new Map();
function size(n, full = true) {
  const key = n.id + full; if (SZ.has(key)) return SZ.get(key);
  let w, h;
  if (n.k === "root") { w = tw(n.t, 16, 700) + 30; h = 38; }
  else if (n.k === "exit") { w = 14 + tw(n.t, 12.5, 650) + (n.why && full ? 6 + tw(n.why, 12, 400) : 0) + 22; h = 26; }
  else if (n.k === "case") { w = tw(n.t, 12, 600) + 14; h = 24; }
  else if (n.k === "back" || n.k === "link") { w = 18 + tw(n.t, 12.5, 650) + 22; h = 26; }
  else if (n.k === "tool") { w = tw(n.t, 11.5, 450, true) + (n.why && full ? 6 + tw(n.why, 11.5, 400) : 0) + 22; h = 24; }
  else if (n.k === "phase") { w = 17 + tw(n.t, 13.5, 700) + (n.loop && full ? 6 + tw("↺ " + n.loop, 11, 650) + 12 : 0) + 22; h = 32; }
  else {
    const lw = tw(n.t, 13, 650);
    const cw = full && n.res.length ? n.res.reduce((a, c) => a + tw(c.label, 11, 500) + 12, 0) + (n.res.length - 1) * 4 : 0;
    const nw = full && n.note ? tw(n.note, 11.5, 400) : 0;
    w = Math.max(lw, cw, nw) + 22; h = 28 + (cw ? 20 : 0) + (nw ? 16 : 0);
  }
  const r = { w: Math.ceil(w) + 8, h }; SZ.set(key, r); return r;   // canvas 量字比 DOM 渲染略窄，留 8px 余量防截断
}


/* ---- 节点：同一个原子，各档只换摆放 ---- */
function inner(n, full) {
  const phase = n.k === "phase";
  if (n.k === "exit") return `<div class="l1"><i class="dot"></i><b>${esc(n.t)}</b>${full && n.why ? `<span>${esc(n.why)}</span>` : ""}</div>`;
  if (n.k === "back") return `<div class="l1">${ic("refresh", 12)}<b>${esc(n.t)}</b></div>`;
  if (n.k === "link") return `<div class="l1">${ic("share", 12)}<b>${esc(n.t)}</b></div>`;
  if (n.k === "tool") return `<div class="l1"><b>${esc(n.t)}</b>${full && n.why ? `<span>${esc(n.why)}</span>` : ""}</div>`;
  if (phase) return `<div class="l1"><i class="sw"></i><b>${esc(n.t)}</b>${full && n.loop ? `<em class="lp">↺ ${esc(n.loop)}</em>` : ""}</div>`;
  return `<div class="l1"><b>${esc(n.t)}</b></div>${full && n.res.length ? `<div class="rs">${n.res.map((c) => `<i class="rc f-${c.f}">${esc(c.label)}</i>`).join("")}</div>` : ""}${full && n.note ? `<span class="nt">${esc(n.note)}</span>` : ""}`;
}
const nd = (n, x, y, full = true, extra = "") => {
  const s = size(n, full);
  return `<div class="nd k-${n.k} ${n.tone ? "t-" + n.tone : ""} ${n.ph != null ? "ph" + n.ph : ""} ${extra}" data-id="${n.id}" data-path="${n.path}" title="${esc([n.t, n.why, n.res?.map((c) => c.label).join("  "), n.note, n.a].filter(Boolean).join("\n"))}"
    style="left:${Math.round(x)}px;top:${Math.round(y)}px;width:${s.w}px;--nh:${s.h}px;--d:${Math.min(n.depth, 7)}">${inner(n, full)}</div>`;
};
const lk = (n, d, cls = "", from = n) => `<path class="lk ${cls} ${n.ph != null ? "ph" + n.ph : ""}" data-path="${n.path}" pathLength="1" d="${d}" style="--d:${Math.min(from.depth, 7)}"/>`;
const curveH = (x1, y1, x2, y2) => { const m = (x1 + x2) / 2; return `M${x1},${y1} C${m},${y1} ${m},${y2} ${x2},${y2}`; };
const ARROW = `<defs><marker id="ma" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path class="ah" d="M1,1 L9,5 L1,9"/></marker><marker id="mn" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path class="ahn" d="M1,1 L9,5 L1,9"/></marker></defs>`;
const canvas = (w, h, svg, html, extra = "") => `<div class="cv" style="width:${Math.ceil(w)}px;height:${Math.ceil(h)}px" ${extra}><svg width="${Math.ceil(w)}" height="${Math.ceil(h)}">${ARROW}${svg}</svg>${html}</div>`;


/* ---- 主干 + 支线：把树摊成一条执行顺序（地铁 / 环 / 泳道共用） ----
   station：主路上的一步；spurs：它的出口 / 旁支（分岔的非主路、工具、结局）；backs：回到前面某一步 */
function line(root) {
  const st = [], backs = [];
  const nested = (n, from) => { const w = (x) => { if (x.k === "back") backs.push({ from, n: x }); x.kids.forEach(w); }; w(n); };
  const walk = (kids) => {
    for (const c of kids) {
      if (c.k === "back") { backs.push({ from: st.length - 1, n: c }); continue; }
      if (c.k === "exit" || c.k === "link") { st.at(-1)?.spurs.push(c); continue; }
      const s = { n: c, spurs: [] }; st.push(s);
      if (c.k === "branch") {
        for (const cs of c.kids) if (!cs.main) { s.spurs.push(cs); nested(cs, st.length - 1); }
        const m = c.kids.find((x) => x.main); if (m) walk(m.kids);
        continue;
      }
      for (const k of c.kids) { if (k.k === "back") backs.push({ from: st.length - 1, n: k }); else { s.spurs.push(k); nested(k, st.length - 1); } }
    }
  };
  for (const p of root.kids) walk(p.kids);
  for (const b of backs) b.to = st.findIndex((s) => s.n === b.n.target);
  return { st, backs };
}
// 支线里的子树摊平成一串（带缩进层级）
const flat = (n, lv = 0, out = []) => { out.push({ n, lv }); for (const k of n.kids) flat(k, lv + 1, out); return out; };


// 2 逻辑树（向右）：从上到下就是执行先后；点有子项的节点折叠；回到某一步画成右侧虚线折返
const FOLD = new Map();   // spec 名 → 折叠的节点 id
function tidy(root, all, { gapX = 40, gapY = 9, fold = new Set(), full = true } = {}) {
  const pos = new Map(); let y = 16;
  const place = (n, x) => {
    const s = size(n, full), kids = fold.has(n.id) ? [] : n.kids;
    if (!kids.length) { pos.set(n.id, { x, y: y + s.h / 2, s }); y += s.h + gapY; return; }
    const top = y; kids.forEach((k) => place(k, x + s.w + gapX));
    const a = pos.get(kids[0].id).y, b = pos.get(kids.at(-1).id).y;
    let cy = (a + b) / 2; if (cy - s.h / 2 < top) cy = top + s.h / 2;
    y = Math.max(y, cy + s.h / 2 + gapY);   // 节点比子项高时，把下一个兄弟推下去
    pos.set(n.id, { x, y: cy, s });
  };
  place(root, 16);
  return pos;
}
function logic(spec) {
  const fold = FOLD.get(spec.name) ?? new Set(); FOLD.set(spec.name, fold);
  const pos = tidy(spec.tree, spec.all, { fold });
  let svg = "", html = "", W = 0, H = 0;
  const shown = spec.all.filter((n) => pos.has(n.id));
  for (const n of shown) {
    const p = pos.get(n.id);
    if (n.parent && pos.has(n.parent.id)) { const q = pos.get(n.parent.id); svg += lk(n, curveH(q.x + q.s.w, q.y, p.x, p.y), n.depth > 2 ? "thin" : "", n.parent); }
    const hidden = fold.has(n.id) ? deepCount(n) : 0;
    html += nd(n, p.x, p.y - p.s.h / 2, true, (n.kids.length ? "can " : "") + (hidden ? "fold" : "")).replace('class="nd', `data-fold="${hidden}" data-tog="${n.id}" class="nd`);
    // 折起的数量画在节点外侧：节点宽按文字量出来，里面没有它的位置
    if (hidden) html += `<span class="foldn" data-path="${n.path}" style="left:${Math.round(p.x + p.s.w + 5)}px;top:${Math.round(p.y - 9)}px">+${hidden}</span>`;
    W = Math.max(W, p.x + p.s.w + (hidden ? 26 : 0)); H = Math.max(H, p.y + p.s.h / 2);
  }
  for (const n of shown) if (n.k === "back" && n.target && pos.has(n.target.id)) {
    const p = pos.get(n.id), t = pos.get(n.target.id), x = Math.max(p.x + p.s.w, t.x + t.s.w) + 26;
    svg += `<path class="lk back" data-path="${n.path}" d="M${p.x + p.s.w},${p.y} C${x},${p.y} ${x},${t.y} ${t.x + t.s.w + 4},${t.y}" marker-end="url(#ma)"/>`;
    W = Math.max(W, x + 10);
  }
  return canvas(W + 24, H + 24, svg, html);
}
const deepCount = (n) => n.kids.reduce((a, k) => a + 1 + deepCount(k), 0);


// 3 环形跑道：循环里的步骤排成一圈，出口从圈外甩出；循环前的起跑在左、收尾在右
function ring(spec) {
  const { st, backs } = line(spec.tree);
  const inLoop = (s) => { const p = phaseOf(s.n); return !!(p?.loop || p?.inLoop); };
  const loopIdx = st.map((s, i) => inLoop(s) ? i : -1).filter((i) => i >= 0);
  if (!loopIdx.length) return track(spec, st, backs, "这条没有回环：跑道退化成一条直线");
  const pre = st.slice(0, loopIdx[0]), lp = st.slice(loopIdx[0], loopIdx.at(-1) + 1), post = st.slice(loopIdx.at(-1) + 1);
  // 紧凑：站点只写名字；站下只挂终点（结局 / 跳到另一条 / 回到某步），工具与中间步骤留给逻辑树；细节在悬停提示里
  const ends = (s) => s.spurs.flatMap((sp) => flat(sp).map((x) => x.n)).filter((m) => ["exit", "link", "back"].includes(m.k));
  const n = lp.length, R = Math.max(150, n * 30);
  const colW = Math.max(...pre.map((s) => size(s.n, false).w), 140) + 50;
  const spurW = Math.max(0, ...lp.map((s) => Math.max(size(s.n, false).w, ...ends(s).map((m) => size(m, false).w + 12))));
  const cxr = colW + 60 + spurW + 24 + R, cyr = R + 150;   // 圈左侧的站名与出口向左伸，不能压到起跑列
  let svg = "", html = "";
  // 圆环 + 绕圈的小点
  svg += `<circle id="rg-${spec.uid}" cx="${cxr}" cy="${cyr}" r="${R}" class="lk main ph1" style="--d:1;fill:none;stroke-width:5;opacity:.55" pathLength="1"/>`;
  svg += `<path id="rp-${spec.uid}" d="M${cxr - R},${cyr} a${R},${R} 0 1,1 ${2 * R},0 a${R},${R} 0 1,1 ${-2 * R},0" fill="none"/>`;
  svg += `<circle r="6" class="bead"><animateMotion dur="7s" repeatCount="indefinite" rotate="auto"><mpath href="#rp-${spec.uid}"/></animateMotion></circle>`;
  const phName = phaseOf(lp[0].n);
  svg += `<text class="pht" x="${cxr}" y="${cyr - 8}" text-anchor="middle">${esc(phName.t)}</text><text class="pht" x="${cxr}" y="${cyr + 12}" text-anchor="middle" style="font-weight:450">↺ ${esc(phName.loop ?? "")}</text>`;
  let maxY = cyr + R, maxX = cxr + R;
  lp.forEach((s, i) => {
    const th = Math.PI + (i / n) * Math.PI * 2, px = cxr + Math.cos(th) * R, py = cyr + Math.sin(th) * R, sz = size(s.n, false);
    svg += `<circle cx="${px}" cy="${py}" r="7" class="stn"/>`;
    const right = Math.cos(th) > 0.05, left = Math.cos(th) < -0.05, lx = cxr + Math.cos(th) * (R + 24), ly = cyr + Math.sin(th) * (R + 24);
    const x = right ? lx : left ? lx - sz.w : lx - sz.w / 2, y = ly - sz.h / 2 + (Math.abs(Math.cos(th)) < 0.05 ? (Math.sin(th) < 0 ? -sz.h / 2 : sz.h / 2) : 0);
    html += nd(s.n, x, y, false);
    let sy = y + sz.h + 5;
    for (const m of ends(s)) {
      const ms = size(m, false); const mx = right ? x + 12 : left ? x + sz.w - ms.w - 12 : x + 12;
      html += nd(m, mx, sy, false); svg += lk(m, `M${right ? x + 6 : left ? x + sz.w - 6 : x + 6},${sy - 4} L${right ? x + 6 : left ? x + sz.w - 6 : x + 6},${sy + ms.h / 2} L${right ? mx : mx + ms.w},${sy + ms.h / 2}`, "thin", s.n);
      sy += ms.h + 4; maxY = Math.max(maxY, sy); maxX = Math.max(maxX, mx + ms.w);
    }
    maxX = Math.max(maxX, x + sz.w);
  });
  // 起跑一列 → 圈左点；收尾一列 ← 圈右点
  let y = cyr - (pre.length * 52) / 2;
  pre.forEach((s, i) => {
    const sz = size(s.n, false); html += nd(s.n, 24, y, false);
    let sy = y + sz.h + 4;
    for (const m of ends(s)) { const ms = size(m, false); html += nd(m, 40, sy, false); sy += ms.h + 4; }
    svg += lk(s.n, i < pre.length - 1 ? `M${24 + 16},${y + sz.h} L${24 + 16},${y + 52}` : curveH(24 + sz.w, y + sz.h / 2, cxr - R - 8, cyr), "thin");
    y = Math.max(y + 52, sy + 8);
  });
  let py2 = cyr - (post.length * 56) / 2; const px2 = maxX + 70;
  post.forEach((s, i) => {
    const sz = size(s.n, false); html += nd(s.n, px2, py2, false);
    let sy = py2 + sz.h + 4; for (const m of ends(s)) { const ms = size(m, false); html += nd(m, px2 + 16, sy, false); sy += ms.h + 4; }
    if (i === 0) svg += `<path class="lk rail" d="${curveH(cxr + R + 8, cyr, px2 - 6, py2 + sz.h / 2)}" marker-end="url(#mn)"/><text class="pht" x="${(cxr + R + px2) / 2}" y="${cyr + 34}" text-anchor="middle" style="font-weight:450">出圈 = 某个结局</text>`;
    maxX = Math.max(maxX, px2 + sz.w + 20); py2 = sy + 14; maxY = Math.max(maxY, sy);
  });
  return canvas(maxX + 40, Math.max(maxY, y) + 40, svg, html);
}
// 没有回环时的直线跑道（环形档的退化形态）
function track(spec, st, backs, hint) {
  let x = 30; const Y = 90; let svg = "", html = "", maxY = Y + 40; const xs = [];
  st.forEach((s, i) => {
    const sz = size(s.n), w = Math.max(sz.w, 120);
    xs.push(x + w / 2);
    html += nd(s.n, x + (w - sz.w) / 2, Y - sz.h - 16);
    let sy = Y + 20;
    for (const sp of s.spurs) for (const { n: m, lv } of flat(sp)) { const ms = size(m); html += nd(m, x + (w - ms.w) / 2 + lv * 10, sy); sy += ms.h + 5; }
    maxY = Math.max(maxY, sy);
    x += w + 36;
  });
  svg += `<path class="lk main ph1" style="--d:1;opacity:.55;stroke-width:5" pathLength="1" d="M${xs[0]},${Y} H${xs.at(-1)}"/>`;
  xs.forEach((cx0) => { svg += `<circle cx="${cx0}" cy="${Y}" r="7" class="stn"/>`; });
  for (const b of backs) if (b.to >= 0) svg += `<path class="lk back" d="M${xs[b.from]},${Y - 60} C${xs[b.from]},${Y - 110} ${xs[b.to]},${Y - 110} ${xs[b.to]},${Y - 64}" marker-end="url(#ma)"/>`;
  html += `<div class="hint" style="left:30px;top:${maxY + 6}px">${esc(hint)}</div>`;
  return canvas(x + 20, maxY + 40, svg, html);
}


const LANES = { ui: "前端", svc: "请求处理", bg: "后台轮次", model: "模型", tool: "工具" };

// 4′ 改过的泳道：连续同一执行者、同一阶段的步骤叠成一列（只有交接才横移）；出口挂在自己那一步下面；循环段套带子 + 折返
function lanes2(spec) {
  const { st, backs } = line(spec.tree);
  const runs = [];
  st.forEach((s, i) => { const l = laneOf(s.n, spec.tree), ph = phaseOf(s.n), r = runs.at(-1);
    if (r && r.l === l && r.ph === ph) r.items.push(s); else runs.push({ l, ph, items: [s] }); s.i = i; });
  const used = Object.keys(LANES).filter((l) => runs.some((r) => r.l === l));
  const itemH = (s) => size(s.n).h + s.spurs.reduce((a, sp) => a + flat(sp).reduce((b, { n: m }) => b + size(m).h + 5, 0), 0) + (s.spurs.length ? 6 : 0);
  for (const r of runs) { r.h = r.items.reduce((a, s) => a + itemH(s) + 18, 0) - 18; r.w = Math.max(...r.items.map((s) => Math.max(size(s.n).w, ...s.spurs.flatMap((sp) => flat(sp).map(({ n: m, lv }) => size(m).w + 16 + lv * 12))))); }
  const HEAD = 64, LPAD = 26, labW = 96, GAPX = 64;
  const laneH = Object.fromEntries(used.map((l) => [l, Math.max(70, ...runs.filter((r) => r.l === l).map((r) => r.h)) + LPAD * 2]));
  const laneY = {}; let yy = HEAD; for (const l of used) { laneY[l] = yy; yy += laneH[l]; }
  let x = labW + 24, svg = "", html = "", bg = "";
  const at = new Map();
  runs.forEach((r, ri) => {
    r.x = x; let y = laneY[r.l] + LPAD + (laneH[r.l] - LPAD * 2 - r.h) / 2;
    if (ri === 0 || runs[ri - 1].ph !== r.ph) bg += `<text class="pht" x="${x}" y="${HEAD - 22}">${esc(r.ph.t)}</text>`;
    r.items.forEach((s, k) => {
      const sz = size(s.n); html += nd(s.n, x, y); at.set(s.i, { x, y, w: sz.w, h: sz.h, rx: r.x + r.w });
      if (k) { const p = at.get(r.items[k - 1].i); svg += lk(s.n, `M${x + 14},${p.bottom} V${y - 3}`, "thin").replace("<path", '<path marker-end="url(#mn)"'); }
      let sy = y + sz.h + 6;
      for (const sp of s.spurs) for (const { n: m, lv } of flat(sp)) { const ms = size(m), mx = x + 16 + lv * 12; html += nd(m, mx, sy); svg += lk(m, `M${x + 8},${y + sz.h} V${sy + ms.h / 2} H${mx}`, "thin", s.n); sy += ms.h + 5; }
      at.get(s.i).bottom = sy - (s.spurs.length ? 5 : 6) + 6;
      y = sy + 12;
    });
    x += r.w + GAPX;
  });
  // 交接：上一列最后一步 → 下一列第一步
  for (let ri = 1; ri < runs.length; ri++) {
    const a = at.get(runs[ri - 1].items.at(-1).i), b = at.get(runs[ri].items[0].i), n = runs[ri].items[0].n;
    svg += lk(n, curveH(a.x + a.w, a.y + 14, b.x - 4, b.y + 14), "").replace("<path", '<path marker-end="url(#mn)"');
  }
  // 循环带：从第一列在循环里的列，到最后一列
  const inLoop = (r) => r.ph.loop || r.ph.inLoop, li = runs.map((r, i) => inLoop(r) ? i : -1).filter((i) => i >= 0);
  if (li.length) {
    const a = runs[li[0]], b = runs[li.at(-1)], x0 = a.x - 18, x1 = b.x + b.w + 18, ph = runs.find(inLoop).ph.loop ? runs.find(inLoop).ph : runs[li[0]].ph;
    const loopPh = runs.map((r) => r.ph).find((p) => p.loop);
    bg += `<rect class="band ph${(loopPh ?? ph).ph}" x="${x0}" y="${HEAD - 8}" width="${x1 - x0}" height="${yy - HEAD + 16}" rx="16"/>`;
    bg += `<text class="bandt" x="${x0 + 14}" y="${HEAD + 10}">↺ ${esc((loopPh ?? ph).t)}${loopPh?.loop ? " · " + esc(loopPh.loop) : ""}</text>`;
    svg += `<path class="lk back" d="M${x1 - 30},${HEAD - 8} C${x1 - 30},${HEAD - 50} ${x0 + 30},${HEAD - 50} ${x0 + 30},${HEAD - 12}" marker-end="url(#ma)"/>`;
  }
  for (const b of backs) if (b.to >= 0 && !(li.length && inLoop(runs.find((r) => r.items.some((s) => s.i === b.from))))) {
    // 弧顶抬到泳道上方（三次贝塞尔的顶点在起点与控制点的 3/4 处），不从节点中间穿过
    const f = at.get(b.from), t = at.get(b.to), y0 = Math.max(f.y, t.y), top = (HEAD - 18 - 0.25 * y0) / 0.75;
    svg += `<path class="lk back" d="M${f.x + f.w},${f.y + 14} C${f.rx + 70},${f.y + 14} ${f.rx + 40},${top} ${(f.rx + t.x + t.w / 2) / 2},${top * 0.25 + (HEAD - 18) * 0.75} S${t.rx + 44},${t.y + 14} ${t.x + t.w + 4},${t.y + 14}" marker-end="url(#ma)"/><text class="pht" x="${(f.x + f.w / 2 + t.x + t.w / 2) / 2}" y="${HEAD - 24}" text-anchor="middle" style="fill:var(--accent-ink);font-weight:650">↺ ${esc(b.n.t)}</text>`;
  }
  used.forEach((l, i) => { bg = `<rect class="lanebg ${i % 2 ? "o" : ""}" x="0" y="${laneY[l]}" width="${x}" height="${laneH[l]}"/><text class="lanet" x="16" y="${laneY[l] + 22}">${LANES[l]}</text>` + bg; });
  return canvas(x, yy + 20, bg + svg, html);
}


// 5 结局倒推：根 → 结局 → 因为什么 → 在哪一步
function outcome(spec) {
  const order = ["ok", "wait", "warn", "fail", "stop"];
  const exits = spec.all.filter((n) => n.k === "exit" || n.k === "link");
  const at = (n) => { for (let x = n.parent; x; x = x.parent) if (!["case", "exit"].includes(x.k)) return x; return null; };
  const root = { id: "o0", k: "root", t: `${spec.name} · 为什么会停下`, kids: [], depth: 0, path: "o0", res: [] };
  const groups = new Map();
  for (const e of exits) {
    const gk = e.k === "link" ? "link" : e.t;
    if (!groups.has(gk)) { const g = { id: "og" + gk, k: e.k === "link" ? "link" : "exit", t: e.k === "link" ? "交给另一条循环" : e.t, tone: e.tone, kids: [], depth: 1, res: [], path: "" }; groups.set(gk, g); }
    const g = groups.get(gk), s = at(e);
    const why = { id: "ow" + e.id, k: "step", t: e.k === "link" ? e.t : e.why, note: s ? `在「${s.t}」${s.a ? "　" + s.a : ""}` : "", kids: [], depth: 2, res: [], ph: s ? phaseOf(s)?.ph : null, path: "" };
    g.kids.push(why);
  }
  root.kids = [...groups.values()].sort((a, b) => (a.k === "link") - (b.k === "link") || order.indexOf(a.tone) - order.indexOf(b.tone));
  const all = []; const col = (n, p) => { n.parent = p; n.path = p ? p.path + " " + n.id : n.id; all.push(n); n.kids.forEach((k) => col(k, n)); }; col(root, null);
  const pos = tidy(root, all, { gapX: 56, gapY: 10 });
  let svg = "", html = "", W = 0, H = 0;
  for (const n of all) {
    const p = pos.get(n.id);
    if (n.parent) { const q = pos.get(n.parent.id); svg += lk(n, curveH(q.x + q.s.w, q.y, p.x, p.y), "thin", n.parent); }
    html += nd(n, p.x, p.y - p.s.h / 2);
    W = Math.max(W, p.x + p.s.w); H = Math.max(H, p.y + p.s.h / 2);
  }
  return canvas(W + 30, H + 24, svg, html);
}


function shape(spec) {
  const { st } = line(spec.tree);
  const lanesN = new Set(st.map((s) => laneOf(s.n, spec.tree))).size, loop = spec.tree.kids.some((p) => p.loop), exits = spec.all.filter((n) => n.k === "exit").length;
  const phases = spec.tree.kids.length, steps = st.length, handoffs = st.reduce((a, s, i) => a + (i && laneOf(s.n, spec.tree) !== laneOf(st[i - 1].n, spec.tree)), 0);
  const tones = new Set(spec.all.filter((n) => n.k === "exit").map((n) => n.t)).size;
  const views = [{ k: "tree", q: "怎么走", c: "逻辑树", r: logic, sum: `${phases} 个阶段 · ${steps} 步` }];
  if (lanesN >= 2) views.push({ k: "lane", q: "谁来做", c: "泳道", r: lanes2, sum: `${lanesN} 个执行者 · 交接 ${handoffs} 次` });
  if (loop) views.push({ k: "ring", q: "怎么绕", c: "环形跑道", r: ring, sum: `循环 ${st.filter((s) => { const p = phaseOf(s.n); return p.loop || p.inLoop; }).length} 站` });
  if (exits >= 3) views.push({ k: "out", q: "为什么停", c: "结局倒推", r: outcome, sum: `${tones} 种结局 · ${exits} 个出口` });
  const def = loop ? "ring" : lanesN >= 3 ? "lane" : "tree";
  const why = loop ? "有回环，默认画成跑道" : lanesN >= 3 ? `跨 ${lanesN} 个执行者，默认画成泳道` : "线性流程，默认画成逻辑树";
  return { views, def, why };
}

const safe = (f, spec) => { try { return f(spec); } catch (e) { console.error(e); return `<div class="hint" style="position:static;padding:20px">这一视图画不出来：${esc(e.message)}</div>`; } };
const seg = (tier, spec, sh, cur, exclude) => `<div class="vseg" role="tablist">${sh.views.filter((v) => v.k !== exclude).map((v) => `<button class="${v === cur ? "on" : ""}" data-view="${v.k}" data-tier="${tier}" role="tab" aria-selected="${v === cur}">${v.q}<span>${v.c}</span>${v.k === sh.def ? '<i class="auto">自动</i>' : ""}</button>`).join("")}</div>`;
// 结局侧栏：结局倒推的窄版——按结局分组，每条写原因与位置
function outSide(spec) {
  const order = ["ok", "wait", "warn", "fail", "stop"], exits = spec.all.filter((n) => n.k === "exit");
  const at = (n) => { for (let x = n.parent; x; x = x.parent) if (!["case", "exit"].includes(x.k)) return x; return null; };
  const g = new Map(); for (const e of exits) (g.get(e.t) ?? g.set(e.t, []).get(e.t)).push(e);
  const groups = [...g].sort((a, b) => order.indexOf(a[1][0].tone) - order.indexOf(b[1][0].tone));
  return `<aside class="side"><div class="cap">为什么会停<em>${groups.length} 种结局</em></div>${groups.map(([t, es], i) => `<div class="og t-${es[0].tone}" style="animation-delay:${i * 50}ms"><div class="gh"><i class="dot"></i>${esc(t)}<em>${es.length}</em></div>
    ${es.map((e) => { const s = at(e); return `<div class="gr"><b>${esc(e.why)}</b><i>${esc(s?.t ?? "")}${s?.a ? "　" + esc(s.a) : ""}</i></div>`; }).join("")}</div>`).join("")}</aside>`;
}

return { prep, shape, outSide, FOLD, safe, seg };
})();
