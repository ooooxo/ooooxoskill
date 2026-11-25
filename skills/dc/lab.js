// 干什么：dc 对照版的台子——顶条 · 左栏（界面 · 轮次 · 档）· 右栏滑块 · 右下角发送 · 舞台引擎 · 标注 · 记录 · 自动刷新。
//        对照页只写第 ② 段（自己的模块作用域），台子只有这一份：改这里，所有对照页刷新一下就换上。
// 怎么跑：不单独跑。对照页 <head> 里 <link href="/__lab/lab.css"> + <script src="/__lab/lab.js">，第 ② 段末尾 labStart({ TOPIC, KEY, CSS, PAGES })；serve.mjs 在 /__lab/ 下发这两个文件。
// 需要什么：页面自己 link 项目 token；经对照版服务打开（lab.sh）。全局只放五个名字：ICON · ic · pa · part · labStart。
(() => {
/* 首帧前先按系统明暗定底色（暗色系统不闪白）；存过的手选值由 labStart 随后接管 */
document.documentElement.dataset.theme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
/* 项目的样式表挪进 project 层：层序 lab-fallback（Token.css 补缺）< project < 台子（不分层）。
   项目的 token 照样给样本用（变量穿影子继承），项目里的类样式在冲突时一律输给台子（见 lab.css 头上的隔离）。
   lab.js 在 head 里同步执行，挪的时候还没画第一帧；labStart 时再挪一遍，接住写在 lab.js 后面的 link */
function layerProject() {
  if (!document.getElementById("lab-layers")) document.head.insertAdjacentHTML("afterbegin", `<style id="lab-layers">@layer lab-fallback, project;</style>`);
  for (const l of document.querySelectorAll('link[rel="stylesheet"]')) {
    if (new URL(l.href, location.href).pathname.startsWith("/__lab/")) continue;
    const st = document.createElement("style");
    st.textContent = `@import url("${l.href}") layer(project);`;
    l.replaceWith(st);
  }
}
layerProject();

/* ================= ① 工具（第 ② 段也用） ================= */
/* 图标：台子自用的几枚，抽自项目图标注册表（Hrige / InkCreate：bun -e 'import {icons} from "./src/components/icons.ts"; …'），不手画；对照页要用的在第 ② 段 Object.assign(ICON, { … }) 补进来 */
const ICON = {
  "close": "<path d=\"M5.09 6.51L5.64 7.09L6.28 7.86L9.09 11.81L9.84 12.75L10.52 13.48L11.1 14.03L11.87 14.67L15.82 17.48L16.76 18.23L17.49 18.91L17.7 19.07L17.94 19.17L18.2 19.2L18.46 19.17L18.7 19.07L18.91 18.91L19.07 18.7L19.17 18.46L19.2 18.2L19.17 17.94L19.07 17.7L18.91 17.49L18.23 16.76L17.48 15.82L14.67 11.87L14.03 11.1L13.48 10.52L12.75 9.84L11.81 9.09L7.86 6.28L7.09 5.64L6.51 5.09L6.3 4.93L6.06 4.83L5.8 4.8L5.54 4.83L5.3 4.93L5.09 5.09L4.93 5.3L4.83 5.54L4.8 5.8L4.83 6.06L4.93 6.3ZM17.49 5.09L16.91 5.64L16.14 6.28L12.19 9.09L11.25 9.84L10.52 10.52L9.97 11.1L9.33 11.87L6.52 15.82L5.77 16.76L5.09 17.49L4.93 17.7L4.83 17.94L4.8 18.2L4.83 18.46L4.93 18.7L5.09 18.91L5.3 19.07L5.54 19.17L5.8 19.2L6.06 19.17L6.3 19.07L6.51 18.91L7.09 18.36L7.86 17.72L11.81 14.91L12.75 14.16L13.48 13.48L14.16 12.75L14.91 11.81L17.72 7.86L18.36 7.09L18.91 6.51L19.07 6.3L19.17 6.06L19.2 5.8L19.17 5.54L19.07 5.3L18.91 5.09L18.7 4.93L18.46 4.83L18.2 4.8L17.94 4.83L17.7 4.93Z\"/>",
  "play": "<path d=\"M8 5.6v12.8a1.3 1.3 0 0 0 2 1.1l10-6.4a1.3 1.3 0 0 0 0-2.2l-10-6.4a1.3 1.3 0 0 0-2 1.1Z\"/>",
  "grid-view": "<rect x=\"3.2\" y=\"3.2\" width=\"7.8\" height=\"7.8\" rx=\"2.2\" fill=\"currentColor\"/><rect x=\"13\" y=\"3.2\" width=\"7.8\" height=\"7.8\" rx=\"2.2\" fill=\"currentColor\"/><rect x=\"3.2\" y=\"13\" width=\"7.8\" height=\"7.8\" rx=\"2.2\" fill=\"currentColor\"/><rect x=\"13\" y=\"13\" width=\"7.8\" height=\"7.8\" rx=\"2.2\" fill=\"currentColor\"/>",
  "sliders": "<path d=\"M4 7.9L6 7.97L10.4 8.3L12 8.35L14 8.28L18.4 7.95L20 7.9L20.23 7.87L20.45 7.78L20.64 7.64L20.78 7.45L20.87 7.23L20.9 7L20.87 6.77L20.78 6.55L20.64 6.36L20.45 6.22L20.23 6.13L20 6.1L18.4 6.05L14 5.72L12 5.65L10 5.72L5.6 6.05L4 6.1L3.77 6.13L3.55 6.22L3.36 6.36L3.22 6.55L3.13 6.77L3.1 7L3.13 7.23L3.22 7.45L3.36 7.64L3.55 7.78L3.77 7.87ZM4 17.9L5.6 17.95L10 18.28L12 18.35L14 18.28L18.4 17.95L20 17.9L20.23 17.87L20.45 17.78L20.64 17.64L20.78 17.45L20.87 17.23L20.9 17L20.87 16.77L20.78 16.55L20.64 16.36L20.45 16.22L20.23 16.13L20 16.1L18 16.03L13.6 15.7L12 15.65L10.4 15.7L6 16.03L4 16.1L3.77 16.13L3.55 16.22L3.36 16.36L3.22 16.55L3.13 16.77L3.1 17L3.13 17.23L3.22 17.45L3.36 17.64L3.55 17.78L3.77 17.87Z\"/><circle cx=\"14\" cy=\"7\" r=\"3.1\"/><circle cx=\"10\" cy=\"17\" r=\"3.1\"/>",
  "export": "<path d=\"M3.5 13.5L3.47 15.21L3.36 17.24L3.42 17.99L3.58 18.67L3.83 19.25L4.2 19.85L4.62 20.33L5.11 20.75L5.67 21.1L6.27 21.36L6.84 21.52L7.35 21.59L9.3 21.72L11.9 21.8L14.5 21.73L16.65 21.59L17.09 21.53L17.66 21.39L18.27 21.13L18.83 20.8L19.33 20.38L19.75 19.9L20.14 19.31L20.42 18.67L20.58 17.99L20.64 17.24L20.53 15.1L20.5 13.5L20.47 13.24L20.37 13L20.21 12.79L20 12.63L19.76 12.53L19.5 12.5L19.24 12.53L19 12.63L18.79 12.79L18.63 13L18.53 13.24L18.5 13.5L18.41 16.3L18.36 17.13L18.28 17.49L18.04 17.94L17.68 18.3L17.22 18.54L16.73 18.62L14.5 18.47L12.5 18.4L10.1 18.44L7.3 18.62L6.94 18.58L6.61 18.47L6.27 18.27L5.99 17.98L5.79 17.66L5.66 17.28L5.55 15.58L5.5 13.5L5.47 13.24L5.37 13L5.21 12.79L5 12.63L4.76 12.53L4.5 12.5L4.24 12.53L4 12.63L3.79 12.79L3.63 13L3.53 13.24ZM13.7 16.6L13.63 14.84L13.19 10.15L13.1 8L13.06 7.72L12.95 7.45L12.78 7.22L12.55 7.05L12.28 6.94L12 6.9L11.72 6.94L11.45 7.05L11.22 7.22L11.05 7.45L10.94 7.72L10.9 8L10.81 10.15L10.37 14.84L10.3 16.6L10.36 17.04L10.53 17.45L10.8 17.8L11.15 18.07L11.56 18.24L12 18.3L12.44 18.24L12.85 18.07L13.2 17.8L13.47 17.45L13.64 17.04Z\"/><path stroke=\"currentColor\" stroke-width=\"2.4\" stroke-linejoin=\"round\" d=\"M12 3.6 16.2 8.2H7.8Z\"/>",
  "check": "<path d=\"M3.82 13.18L4.34 13.77L4.81 14.42L6.24 16.87L6.79 17.71L7.29 18.33L7.98 19.02L8.45 19.39L9.01 19.61L9.6 19.69L10.19 19.61L10.75 19.39L11.22 19.02L11.59 18.55L11.81 17.99L11.89 17.4L11.81 16.81L11.59 16.25L11.22 15.78L10.53 15.09L9.91 14.59L9.07 14.04L6.62 12.61L5.97 12.14L5.38 11.62L5.15 11.45L4.88 11.34L4.6 11.3L4.32 11.34L4.05 11.45L3.82 11.62L3.65 11.85L3.54 12.12L3.5 12.4L3.54 12.68L3.65 12.95ZM11.27 18.97L12.3 17.77L13.42 16.36L17.94 10.26L19.07 8.87L20.13 7.69L20.28 7.47L20.37 7.23L20.4 6.97L20.36 6.71L20.25 6.47L20.09 6.27L19.87 6.12L19.63 6.03L19.37 6L19.11 6.04L18.87 6.15L18.67 6.31L17.55 7.44L16.24 8.65L10.41 13.53L9.07 14.72L7.93 15.83L7.58 16.31L7.37 16.87L7.31 17.47L7.4 18.06L7.65 18.6L8.03 19.07L8.51 19.42L9.07 19.63L9.67 19.69L10.26 19.6L10.8 19.35Z\"/>",
  "list-ordered": "<rect x=\"3\" y=\"4.6\" width=\"3.6\" height=\"3.6\" rx=\"1.1\"/><rect x=\"3\" y=\"10.2\" width=\"3.6\" height=\"3.6\" rx=\"1.1\"/><rect x=\"3\" y=\"15.8\" width=\"3.6\" height=\"3.6\" rx=\"1.1\"/><path d=\"M9 8.1L11.6 8.01L18 7.47L19.6 7.38L21 7.35L21.25 7.32L21.48 7.22L21.67 7.07L21.82 6.88L21.92 6.65L21.95 6.4L21.92 6.15L21.82 5.93L21.67 5.73L21.48 5.58L21.25 5.48L21 5.45L18.4 5.36L12 4.82L10.4 4.73L9 4.7L8.56 4.76L8.15 4.93L7.8 5.2L7.53 5.55L7.36 5.96L7.3 6.4L7.36 6.84L7.53 7.25L7.8 7.6L8.15 7.87L8.56 8.04ZM9 13.7L11.6 13.61L18 13.07L19.6 12.98L21 12.95L21.25 12.92L21.48 12.82L21.67 12.67L21.82 12.48L21.92 12.25L21.95 12L21.92 11.75L21.82 11.53L21.67 11.33L21.48 11.18L21.25 11.08L21 11.05L19.6 11.02L18 10.93L11.6 10.39L9 10.3L8.56 10.36L8.15 10.53L7.8 10.8L7.53 11.15L7.36 11.56L7.3 12L7.36 12.44L7.53 12.85L7.8 13.2L8.15 13.47L8.56 13.64ZM9 19.3L10.4 19.27L12 19.18L18.4 18.64L21 18.55L21.25 18.52L21.48 18.42L21.67 18.27L21.82 18.08L21.92 17.85L21.95 17.6L21.92 17.35L21.82 17.13L21.67 16.93L21.48 16.78L21.25 16.68L21 16.65L18.4 16.56L12 16.02L10.4 15.93L9 15.9L8.56 15.96L8.15 16.13L7.8 16.4L7.53 16.75L7.36 17.16L7.3 17.6L7.36 18.04L7.53 18.45L7.8 18.8L8.15 19.07L8.56 19.24Z\"/>",
  "pen": "<path d=\"M16.7 3.9L14.92 5.76L10.42 10.78L7.97 13.37L7.27 14.35L5.95 16.67L5.59 17.15L5.2 17.6L5.06 17.77L4.98 17.98L4.95 18.2L4.98 18.42L5.06 18.62L5.2 18.8L5.37 18.94L5.58 19.02L5.8 19.05L6.02 19.02L6.22 18.94L6.4 18.8L6.85 18.41L7.33 18.05L9.65 16.73L10.63 16.03L13.22 13.58L18.24 9.08L20.1 7.3L20.48 6.8L20.72 6.22L20.8 5.6L20.72 4.98L20.48 4.4L20.1 3.9L19.6 3.52L19.02 3.28L18.4 3.2L17.78 3.28L17.2 3.52Z\"/>",
  "help": "<path d=\"M9.65 8.92L9.67 8.62L9.77 8.27L9.94 7.94L10.16 7.66L10.43 7.44L10.72 7.27L11.04 7.16L11.43 7.11L11.8 7.13L12.15 7.22L12.5 7.39L12.81 7.61L13.11 7.89L13.33 8.18L13.49 8.5L13.59 8.86L13.61 9.18L13.58 9.51L13.47 9.84L13.3 10.15L13.01 10.47L12.39 10.92L11.8 11.46L11.28 12.1L11 12.59L10.8 13.14L10.68 13.71L10.65 14.8L10.7 15.15L10.83 15.48L11.05 15.75L11.33 15.97L11.65 16.1L12 16.15L12.35 16.1L12.68 15.97L12.95 15.75L13.17 15.48L13.3 15.15L13.35 14.8L13.38 14.1L13.53 13.78L13.97 13.41L14.66 13.06L15.15 12.74L15.88 12.08L16.26 11.62L16.58 11.11L16.84 10.56L17.04 9.99L17.18 9.18L17.21 8.57L17.15 7.95L17.03 7.34L16.82 6.75L16.54 6.19L16.2 5.67L15.79 5.2L15.32 4.78L14.62 4.33L14.05 4.08L13.25 3.87L12.65 3.81L11.84 3.84L11.25 3.96L10.51 4.21L9.99 4.48L9.37 4.92L8.83 5.44L8.38 6.03L8.03 6.67L7.78 7.33L7.62 8.02L7.55 8.88L7.58 9.15L7.68 9.41L7.84 9.63L8.06 9.8L8.31 9.91L8.58 9.95L8.85 9.92L9.11 9.82L9.33 9.66L9.5 9.44L9.61 9.19Z\"/><circle cx=\"12\" cy=\"19\" r=\"1.7\"/>",
  "reload": "<path d=\"M17.66 10.93L17.88 11.74L17.98 12.56L17.96 13.38L17.78 14.32L17.51 15.08L17.05 15.9L16.56 16.54L15.89 17.17L15.25 17.62L14.44 18.01L13.59 18.27L12.71 18.4L11.84 18.39L10.99 18.25L10.17 17.99L9.3 17.55L8.51 16.97L7.92 16.36L7.42 15.67L7.04 14.9L6.78 14.08L6.65 13.23L6.66 12.36L6.81 11.5L7.1 10.68L7.52 9.91L8.05 9.21L8.7 8.6L9.44 8.11L10.25 7.75L11.12 7.53L12.02 7.45L12.4 7.39L12.74 7.24L13.04 7.01L13.27 6.71L13.41 6.35L13.45 5.98L13.39 5.6L13.24 5.26L13.01 4.96L12.71 4.73L12.35 4.59L11.98 4.55L11.22 4.59L10.64 4.66L9.88 4.82L9.32 4.98L8.59 5.26L8.06 5.51L7.39 5.9L6.9 6.23L6.3 6.72L5.87 7.12L5.35 7.7L4.99 8.17L4.57 8.83L4.29 9.35L3.84 10.44L3.63 11.2L3.51 11.79L3.42 12.57L3.4 13.17L3.44 13.96L3.52 14.55L3.8 15.71L4.07 16.46L4.33 17L4.94 18.03L5.43 18.66L5.83 19.1L6.73 19.9L7.73 20.56L8.26 20.84L9 21.14L9.57 21.31L10.35 21.49L10.94 21.56L11.73 21.6L12.91 21.52L13.5 21.41L14.25 21.21L14.81 21.01L15.51 20.69L16.02 20.41L16.67 19.98L17.12 19.62L17.68 19.09L18.06 18.67L18.53 18.07L18.84 17.59L19.2 16.93L19.5 16.24L19.74 15.53L20 14.25L20.06 12.96L19.92 11.68L19.76 10.96L19.54 10.27L19.43 10.04L19.25 9.84L19.03 9.7L18.78 9.62L18.52 9.6L18.27 9.66L18.04 9.77L17.84 9.95L17.7 10.17L17.62 10.42L17.6 10.68Z\"/><path stroke=\"currentColor\" stroke-width=\"2.4\" stroke-linejoin=\"round\" d=\"M11.8 2.6 16.4 6l-4.6 3.4Z\"/>"
};
const ic = (n, s = 16) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${ICON[n] ?? ""}</svg>`;
/* 零件命名（可选）：拼装与标注不靠命名——点到哪个小组件就是哪个（按钮 / 图标 / 字 / 标签，台子自动认）。
   命名只为两件事：跨档同名（记录 / 发给 agent 的 JSON 里叫同一个名字、换样本也认得）与 ⌥ 抓整组。
   pa(id, 名) 是属性，直接写在元素上：<button ${pa("send", "发送")}>；part(id, 名, html, cls?) 是给一组外面套一层壳 */
const pa = (id, name) => `data-part="${id}" data-name="${name}"`;
const part = (id, name, html, cls = "") => `<div class="shell ${cls}" ${pa(id, name)}>${html}</div>`;
Object.assign(window, { ICON, ic, pa, part, labStart });

/* 台子的骨架：labStart 时插进 <body> 最前面 */
const SKELETON = `
<main class="board"><div class="stage" id="stage"></div></main>

<!-- 顶条：怎么看——题目 · 看法 · 标注 · 钉住 ｜ 样本 · 看几档 · 比例 · 明暗 · 记录 · 滑块 · 键位 -->
<div class="lane top lab-ui"><div class="isl bar" id="topbar">
  <h1 class="brand" id="topic"></h1>
  <div class="tg"><div class="togs" id="modes"></div></div>
  <div class="tg"><div class="togs"><button id="noteT" title="标注（F）：点哪个组件就在哪儿记一句要改什么"></button></div></div>
  <div class="tg pinw"><div class="seg sub" id="pins"></div></div>
  <span class="sp"><span class="say" id="say"></span></span>
  <div class="tg"><div class="seg sub" id="specs"></div></div>
  <div class="tg"><div class="seg sub" id="views"></div></div>
  <div class="tg"><button class="tbtn mono" id="zoomT"></button><button class="tbtn" id="themeT"></button></div>
  <div class="tg"><button class="ibtn" id="resetI" title="回到初始（X）：样本里点过、填过、切过的交互状态全清掉，回到刚打开的样子" aria-label="回到初始"></button><button class="dbtn" id="histT" data-pop="histPop" title="记录"></button><button class="ibtn" id="dockT" title="滑块（I）" aria-label="滑块"></button><button class="ibtn" id="keysT" data-pop="keysPop" title="键位" aria-label="键位"></button></div>
</div></div>

<!-- 左：界面 · 轮次 · 档 -->
<div class="lane side lab-ui"><div class="isl bar" id="nav"><ol class="vl" id="pl"></ol><div class="rrow" id="rrow"></div><ol class="vl" id="vl"></ol></div></div>
<!-- 右：滑块（不常用，I 收起）；右下角：agent 回话 · 标注清单 · 发送 -->
<div class="lane right lab-ui">
  <div class="isl bar" id="dock"><div class="kgrp" id="knobs"></div></div>
  <div class="out"><div class="isl tray" id="tray" hidden><div class="stl" id="stl"></div><ul class="chg nl" id="nl"></ul></div><button class="fab" id="fab" title="发给 agent（⌘⏎）"></button></div>
</div>

<!-- 记录：交互动作、改动、标注、发送与 agent 回话一条时间线；撤回不占界面（⌘Z / ⇧⌘Z），撤回过的条目变灰 -->
<div class="isl pop lab-ui" id="histPop">
  <div class="fig"><div class="fig-box" id="fig"></div></div>
  <div class="sh" id="histH"></div>
  <ul class="chg hist" id="hist"></ul>
  <div class="pfoot" id="histF"></div>
</div>
<div class="isl pop left lab-ui" id="roundPop"><ol class="rl" id="roundL"></ol></div>
<div class="isl cmp lab-ui" id="cmp"><div class="ch" id="cmpH"></div><textarea id="cmpT" rows="2" placeholder="这里要改什么…（参考图 / 视频 / 链接可粘贴、拖进来）"></textarea><div class="cimg" id="cmpI"></div><div class="cerr" id="cmpE"></div></div>
<div class="isl pop lab-ui" id="keysPop"><div class="keys">
  <kbd class="ink-kbd">0–9</kbd><span>选档（← → 上一档 / 下一档）</span>
  <kbd class="ink-kbd">↑ ↓</kbd><span>换界面</span>
  <kbd class="ink-kbd">S</kbd><span>换样本（⇧S 倒着）</span>
  <kbd class="ink-kbd">R</kbd><span>换轮次（⇧R 倒着）</span>
  <kbd class="ink-kbd">F</kbd><span>标注：点哪儿记哪儿</span>
  <kbd class="ink-kbd">⌘⏎</kbd><span>发给 agent</span>
  <kbd class="ink-kbd">C</kbd><span>现状对选中档</span>
  <kbd class="ink-kbd">A</kbd><span>本界面全部档</span>
  <kbd class="ink-kbd">G</kbd><span>全部界面并排，各切各的档</span>
  <kbd class="ink-kbd">M</kbd><span>交互 / 两开 / 拼装 / 静态</span>
  <kbd class="ink-kbd">⌥</kbd><span>拼装 / 标注时抓整组</span>
  <kbd class="ink-kbd">T</kbd><span>明暗 系统 → 亮 → 暗</span>
  <kbd class="ink-kbd">I</kbd><span>收起 / 打开滑块</span>
  <kbd class="ink-kbd">P</kbd><span>重播入场</span>
  <kbd class="ink-kbd">X</kbd><span>交互回到初始</span>
  <kbd class="ink-kbd">⌘Z</kbd><span>撤回（⇧⌘Z 重做）</span>
  <kbd class="ink-kbd">Esc</kbd><span>关菜单 / 弹层，退出标注</span>
</div></div>
`;

/* ================= ③ 台子 ================= */
function labStart(cfg) {
  layerProject();
  /* 截图模式（?shot）：状态只活在内存里、从地址读，不读也不写本机存储 —— agent 截图不会改到用户正开着的那页（档、样本、明暗、标注）。
     ?shot&g=<界面名或序号>&r=<轮号，1 起>&v=<档序号>&s=<样本名或序号>&t=light|dark&w=one|pair|all|pages&bare（只留舞台） */
  const Q = new URLSearchParams(location.search), SHOT = Q.has("shot");
  if (Q.has("bare")) document.body.classList.add("bare");
  document.body.dataset.mode = "live";
  document.body.insertAdjacentHTML("afterbegin", SKELETON);
  const { TOPIC, KEY } = cfg;
  const PAGES_ = cfg.PAGES ?? [{ name: TOPIC, specs: cfg.SPECS, rounds: cfg.ROUNDS }];   // 只比一个界面也可以只给 SPECS + ROUNDS
  const SHARED_CSS = cfg.CSS ?? "";
  /* 台子给每格影子的底：尺寸、根、壳、名牌、标注点、菜单、看法（样本自己的样式在 ② 的 CSS、界面 css 与各档 css） */
  const CHROME_CSS = `
  :host { position: relative; flex: none; display: flex; width: var(--tile-w); height: var(--tile-h); color: var(--ink); font-family: var(--font); -webkit-user-select: text; user-select: text; cursor: auto; }
  * { box-sizing: border-box; }
  button { font: inherit; color: inherit; }
  .ic { flex: none; display: block; }
  .root { position: relative; flex: 1; min-width: 0; min-height: 0; display: flex; flex-direction: column; }
  .root [data-ext] { display: none !important; }   /* 外部触发：不画在屏里，挂到格子外侧那排键上（extRail） */
  :host([data-mode="static"]:not([data-note])) .root * { pointer-events: none; }   /* 静态：样本不响应，根留着接点击（选档）；标注时照样本自己的命中走 */
  :host(.dragging) { -webkit-user-select: none; user-select: none; cursor: grabbing; }
  :host([data-mode~="build"]) .root { cursor: grab; }
  :host([data-mode~="build"]) img { -webkit-user-drag: none; }
  :host([data-note]) { -webkit-user-select: none; user-select: none; }
  :host([data-note]) .root, :host([data-note]) .root * { cursor: crosshair !important; }
  .shell { position: relative; }
  .shell.sized > * { width: 100%; height: 100%; }   /* 套壳的组拉过大小：内容撑满壳 */
  /* 拼装 / 标注罩：一枚浮在影子顶上的框，跟着指针下那个小组件走（名牌 + 右下角拉手），零件本身不加任何东西 */
  .lab-hud { position: absolute; z-index: 30; pointer-events: none; border-radius: 6px; display: none;
    background: color-mix(in srgb, var(--accent) 7%, transparent); box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent) 45%, transparent); }
  .lab-hud.on { display: block; }
  .lab-hud.drag { box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent) 70%, transparent), var(--shadow-md); }
  .lab-hud > .pn { position: absolute; right: 0; bottom: 100%; margin-bottom: 3px; height: 16px; padding: 0 5px; border-radius: 5px;
    font: 600 9.5px/16px var(--font-mono); white-space: nowrap; background: var(--accent); color: var(--on-accent); }
  .lab-hud > .sz { position: absolute; right: -5px; bottom: -5px; width: 12px; height: 12px; border-radius: 4px; background: var(--accent); box-shadow: 0 0 0 2px var(--bg-content);
    cursor: nwse-resize; touch-action: none; pointer-events: auto; transition: transform var(--t-press) var(--ease-out); }
  .lab-hud > .sz:active { transform: scale(1.2); }
  /* 拼装落点：指针下那个零件的前 / 后一道线 */
  .lab-drop { position: absolute; z-index: 33; display: none; pointer-events: none; border-radius: 2px; background: var(--accent); box-shadow: 0 0 0 2px var(--bg-content); }
  .lab-drop.on { display: block; }
  :host([data-note]) .lab-hud > .sz { display: none; }
  /* 标注点：一枚带号的水滴，尖角落在点下去的位置；发出去的变灰，agent 回话后消失 */
  .lab-pins { position: absolute; inset: 0; z-index: 35; pointer-events: none; overflow: clip; overflow-clip-margin: 28px; }   /* 跟着组件滑出格子的点剪掉 */
  .lab-pin { position: absolute; min-width: 20px; height: 20px; padding: 0 6px; border: 0; border-radius: 10px 10px 10px 2px; translate: 0 -100%; transform-origin: 0 100%;
    display: grid; place-items: center; font: 650 10.5px/1 var(--font-mono); background: var(--accent); color: var(--on-accent); cursor: pointer; pointer-events: auto;
    box-shadow: 0 0 0 2px var(--bg-content), var(--shadow-md); animation: pin-in var(--t-med) var(--ease-out);
    transition: transform var(--t-press) var(--ease-out), background-color var(--t-fast) var(--ease-hover); }
  .lab-pin:hover, .lab-pin.on { transform: scale(1.15); }
  .lab-pin.sent { background: var(--ink-4); opacity: .7; }
  .lab-pin.lost { background: var(--bg-content); color: var(--ink-3); box-shadow: inset 0 0 0 1.5px var(--ink-4), 0 0 0 2px var(--bg-content); border-style: dashed; }
  /* 悬停一枚点 / 一行标注：把它指的那个组件框出来，知道说的是谁 */
  .lab-ring { position: absolute; z-index: 34; pointer-events: none; border-radius: 6px; box-shadow: 0 0 0 1.5px var(--accent), 0 0 0 5px color-mix(in srgb, var(--accent) 18%, transparent);
    background: color-mix(in srgb, var(--accent) 6%, transparent); transition: all var(--t-fast) var(--ease-out); }
  .lab-ring[hidden] { display: none; }
  .lab-pin[hidden] { display: none; }   /* 组件此刻看不见（抽屉收起、页签切走）：点也藏起来 */
  @keyframes pin-in { from { transform: scale(.3); opacity: 0; } }
  .menu { position: absolute; z-index: 40; min-width: 150px; padding: 4px; border-radius: var(--r-sm); background: var(--panel); box-shadow: var(--shadow-md), 0 0 0 1px var(--sep);
    display: flex; flex-direction: column; animation: menu-in var(--t-fast) var(--ease-out); }
  .menu button { display: flex; align-items: center; gap: 8px; height: 32px; padding: 0 10px; border: 0; border-radius: var(--r-xs); background: none; font-size: var(--fs-label); color: var(--ink-2); text-align: left; }
  .menu button:hover { background: var(--hover); color: var(--ink); }
  .menu button.danger { color: var(--crit); }
  @keyframes menu-in { from { opacity: 0; transform: translateY(-4px) scale(.98); } }
  `;

  /* 看法 = 两颗独立开关，默认只开交互（拼装要用时再开）；都关 = 静态（样本不响应指针，可钉住悬停 / 菜单开来对照）。标注是另一颗，开着时盖过看法 */
  const FLAGS = [
    ["live", "交互", "play", "交互：按钮、⋯ 菜单、编辑都能真用，每一下进「记录」"],
    ["build", "拼装", "grid-view", "拼装：把一个小组件拖到另一个前 / 后（同组换顺序、跨组挪进去），亮线是落点；⌥ 抓整组；右下角拉手改大小；双击归位"],
  ];
  /* 拼装 / 标注认的「一个组件」：控件整颗不拆（按钮里的图标随按钮走），svg 整枚；其余点到哪个元素就是哪个 */
  const ATOM = "button, a, input, select, textarea, [role=button]";
  const DRAG_PX = 4;
  const SNAP = 8;
  const FLIP_MS = 260;   // 拼装换位、撤回、归位的滑动时长
  const SEEN_MS = 1500;  // 一轮在台上、标签在前台停这么久，它的「新」就算看过
  const GAP = 28, PAD_X = 32, PAD_Y = 16 + 24, LBL = 34;   // 与 .stage / .tile 的 CSS 一致
  const EXT_W = 176;     // 格子外侧那排外部触发键占的宽（与 .tile .ext 的 CSS 一致）
  const MIN_Z = 0.6;     // 平铺缩到这以下就算「放不下」：保底这个比例，按宽排列、纵向滚动
  const MERGE_MS = 500;  // 同一项改动连着来（双击回默认、连按方向键）并成一条记录 / 一步撤回


  /* 状态：存储键都带全地址（界面 g · 轮 r · 档 i），撤回快照换了界面也认得
     g 当前界面 · r<g> 轮 · v<g>.<r> 选中档 · s<g> 样本 · ps<g>.<r> 共用参数 · pv<g.r.i> 档私有参数 · L<g.r.i> 布局 */
  const mem = new Map();
  const load = (k, d) => { if (SHOT) return mem.has(k) ? mem.get(k) : d; const v = localStorage.getItem(KEY + k); return v === null ? d : JSON.parse(v); };
  const save = (k, v) => (SHOT ? void mem.set(k, v) : localStorage.setItem(KEY + k, JSON.stringify(v)));
  const raw = (k) => (SHOT ? (mem.has(k) ? JSON.stringify(mem.get(k)) : null) : localStorage.getItem(KEY + k));
  if (SHOT) {
    const gq = Q.get("g") ?? "0", g = Math.max(0, PAGES_.findIndex((p) => p.name === gq) >= 0 ? PAGES_.findIndex((p) => p.name === gq) : Math.min(+gq || 0, PAGES_.length - 1));
    const r = Q.has("r") ? Math.min(Math.max(+Q.get("r") - 1, 0), PAGES_[g].rounds.length - 1) : PAGES_[g].rounds.length - 1;
    mem.set("g", g); mem.set("r" + g, r);
    if (Q.has("v")) mem.set(`v${g}.${r}`, +Q.get("v"));
    if (Q.has("s")) { const sq = Q.get("s"), i = PAGES_[g].specs.findIndex((x) => x.from === sq); mem.set("s" + g, i >= 0 ? i : +sq || 0); }
    for (const k of ["t", "w"]) if (Q.has(k)) mem.set(k, Q.get(k));
  }
  /* agent 开了新一轮：上回没见过的轮就直接落到最新那轮（用户不必自己去翻轮次按钮才看到改动） */
  PAGES_.forEach((p, g) => {
    const n = p.rounds.length, seen = load("rc" + g, null);
    if (seen !== null && n > seen) save("r" + g, n - 1);
    if (seen !== n) save("rc" + g, n);
  });
  let pg = Math.min(load("g", 0), PAGES_.length - 1);
  const rnd = (g = pg) => Math.min(load("r" + g, PAGES_[g].rounds.length - 1), PAGES_[g].rounds.length - 1);
  const selI = (g = pg, r = rnd(g)) => Math.min(load(`v${g}.${r}`, r === 0 ? 1 : 0), PAGES_[g].rounds[r].list.length - 1);
  const spc = (g = pg) => Math.min(load("s" + g, 1), PAGES_[g].specs.length - 1);
  let view = load("w", "one");   // 看几档：one 单看（默认）· pair 现状对选中（C）· all 本界面全部档（A）· pages 全部界面并排（G）
  if (view === "pages" && PAGES_.length < 2) view = "one";
  const flags = load("f", { live: true, build: false });
  const modeStr = () => FLAGS.filter(([id]) => flags[id]).map(([id]) => id).join(" ") || "static";
  const isStatic = () => !flags.live && !flags.build;
  let pinned = "rest";
  let fit = load("z", true);
  let zoom = 1, cols = 1, dims = { w: 0, h: 0 };
  /* 记录：交互动作（act）、改动（chg）、标注（note）、发送（send）、agent 回话（say）按时间混排；撤回 / 重做只认 chg。
     存 sessionStorage：agent 改完页面自动刷新，记录与撤回照样接得上 */
  const history = JSON.parse(sessionStorage.getItem(KEY + "h") ?? "[]").map((h) => ({ ...h, t: new Date(h.t), ts: 0 }));
  let noting = load("nt", false);   // 标注开着：点哪个组件就在哪儿打点
  let notes = load("n", []);        // 标注 [{ id, no, k: "g.r.i", s, part, idx, tag, name, css, text, html, fx, fy, x, y, note, state: open|sent, batch }]
  let draft = null, editing = null; // 正在写的那条（draft = 还没存的新标注）
  let said = null, reloadPending = false;
  let st = null;   // 服务报的这一页：q 排着的批号 · w 交给 agent 还没回话的批号 · ag 有没有 agent 挂着等

  const $ = (id) => document.getElementById(id);
  const stage = $("stage"), board = document.querySelector(".board");
  const PG = () => PAGES_[pg];   // 不叫 P：② 里常有 const P = window.PK 之类
  const R = () => PG().rounds[rnd()];
  const S = () => PG().specs[spc()];
  const vk = (g, r, i) => `${g}.${r}.${i}`;
  const at3 = (k) => k.split(".").map(Number);
  const selV = () => R().list[selI()];
  const selK = () => vk(pg, rnd(), selI());
  const roundOfK = (k) => { const [g, r] = at3(k); return PAGES_[g].rounds[r]; };
  const varOf = (k) => { const [g, r, i] = at3(k); return PAGES_[g].rounds[r].list[i]; };
  /* 档名：标注可能落在 agent 后来撤掉的那一轮 / 那一档上，照样要发得出去（2026-11-02 撤了安防 R2，那页的发送就整个卡住） */
  const vname = (g, r, i) => { const v = PAGES_[g]?.rounds[r]?.list[i]; return v ? `${i} ${v.name}` : `${i}（这一轮已撤）`; };
  const multi = () => PAGES_.length > 1;
  const isPages = () => view === "pages" && multi();
  /* 舞台上的格：单看 = 选中档；对照 = 本界面现状 + 选中档；全档 = 本界面本轮全部档；全部界面 = 每个界面各自选中的那档 */
  const tiles = () => {
    if (isPages()) return PAGES_.map((_, g) => ({ g, r: rnd(g), i: selI(g), s: spc(g) }));
    const g = pg, r = rnd(), i = selI(), s = spc();
    if (view === "all") return R().list.map((_, j) => ({ g, r, i: j, s }));
    if (view === "one" || (r === 0 && i === 0)) return [{ g, r, i, s }];
    return [{ g, r: 0, i: 0, s }, { g, r, i, s }];
  };
  const hosts = () => [...stage.querySelectorAll(".host")];
  const hostsOf = (k) => [...stage.querySelectorAll(`.host[data-vk="${k}"]`)];
  const sOf = (root) => Number(root.host.dataset.sp);   // 这格画的是哪条样本
  const specOfRoot = (root) => PAGES_[at3(root.host.dataset.vk)[0]].specs[sOf(root)];
  const sk = (g = pg, r = rnd(g)) => `ps${g}.${r}`;
  const shared = (g = pg, r = rnd(g)) => load(sk(g, r), {});
  const own = (k) => load("pv" + k, {});
  /* 参数来源：s = 轮次共用，o = 档私有（读选中档的那份） */
  const specBy = (src, key) => (src === "s" ? R().params ?? [] : selV().params ?? []).find((x) => x.key === key);
  const specOf = (el) => specBy(el.dataset.src, el.dataset.k);
  const valOf = (p, src) => (src === "o" ? own(selK()) : shared())[p.key] ?? p.def;
  const storeOf = (src) => (src === "o" ? "pv" + selK() : sk());
  /* 选中档的全部参数：当前值与默认值各一份（形状图、拷 JSON 用） */
  function values() {
    const v = {}, d = {};
    for (const p of R().params ?? []) { v[p.key] = valOf(p, "s"); d[p.key] = p.def; }
    for (const p of selV().params ?? []) { v[p.key] = valOf(p, "o"); d[p.key] = p.def; }
    return { v, d };
  }

  /* ---- 小件 ---- */
  const sh = (icon, title, meta = "", act = "") => `${ic(icon, 16)}<h3>${title}</h3>${meta}${act}`;
  const ibtn = (id, icon, label) => `<button class="ibtn" id="${id}" title="${label}" aria-label="${label}">${ic(icon, 15)}</button>`;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const hms = (d) => [d.getHours(), d.getMinutes(), d.getSeconds()].map((n) => String(n).padStart(2, "0")).join(":");
  const signed = (d) => (d > 0 ? "+" : "−") + +Math.abs(d).toFixed(4);
  function flash(btn, ok, html) {
    const was = btn.innerHTML;
    btn.classList.add("flash", ok ? "ok" : "err"); btn.innerHTML = html ?? ic(ok ? "check" : "close", 15);
    setTimeout(() => { btn.classList.remove("flash", "ok", "err"); btn.innerHTML = was; paintOut(); }, 1400);
  }
  /* 段控：渲染一次，之后只改 aria-pressed 再 segSync（色块滑过去） */
  const seg = (el, items) => { el.innerHTML = `<i class="thumb"></i>` + items.map(([attr, val, html, title]) => `<button ${attr}="${val}"${title ? ` title="${esc(title)}"` : ""}>${html}</button>`).join(""); };
  function segSync(el) {
    const t = el.querySelector(".thumb"), b = el.querySelector('button[aria-pressed="true"]');
    if (!t) return;
    el.classList.toggle("moving", t.dataset.ready === "1");
    t.style.opacity = b ? 1 : 0;
    if (!b) return;
    t.style.width = b.offsetWidth + "px"; t.style.height = b.offsetHeight + "px";
    t.style.transform = `translate(${b.offsetLeft}px, ${b.offsetTop}px)`;
    t.dataset.ready = "1";
  }
  const press = (sel_, test) => document.querySelectorAll(sel_).forEach((b) => b.setAttribute("aria-pressed", String(test(b))));

  /* ---- 参数：共用的与档私有的都写在各自的格上（影子继承）；格的尺寸也按各自那一轮 ---- */
  const tileWH = (g, r) => { const rd = PAGES_[g].rounds[r]; return Object.fromEntries(["w", "h"].map((a) => { const x = rd.tile[a]; return [a, typeof x === "number" ? x : shared(g, r)[x] ?? rd.params.find((p) => p.key === x).def]; })); };
  function applyParams() {
    dims = { w: 0, h: 0 };
    for (const h of hosts()) {
      const [g, r] = at3(h.dataset.vk), sv = shared(g, r), ov = own(h.dataset.vk), t = tileWH(g, r);
      dims = { w: Math.max(dims.w, t.w), h: Math.max(dims.h, t.h) };
      h.style.cssText = [`--tile-w: ${t.w}px`, `--tile-h: ${t.h}px`,
        ...(PAGES_[g].rounds[r].params ?? []).map((p) => `--p-${p.key}: ${sv[p.key] ?? p.def}${p.unit}`),
        ...(varOf(h.dataset.vk).params ?? []).map((p) => `--p-${p.key}: ${ov[p.key] ?? p.def}${p.unit}`)].join(";");
    }
    stage.style.cssText = `--tile-w: ${dims.w}px; --tile-h: ${dims.h}px`;
    applyZoom();
    placePins();
    if (openPop === "histPop") renderFig();
  }
  /* 平铺：试每种列数，取比例最大的那种（不放大；同比例取列多的）；最大也低于 MIN_Z 就保底 MIN_Z 并滚动 */
  function applyZoom() {
    const topB = document.querySelector(".lane.top").getBoundingClientRect().bottom + 12;
    board.style.paddingTop = topB + "px";
    document.documentElement.style.setProperty("--side-top", topB + "px");   // 左右两栏从顶条下面开始
    const n = stage.querySelectorAll(".tile").length || 1;
    const ext = stage.querySelector(".ext:not([hidden])") ? EXT_W : 0;   // 外侧有触发键：每格右边多让出一条
    stage.style.setProperty("--ext-w", ext + "px");
    const fw = dims.w + ext, th = dims.h + (view === "one" ? 0 : LBL);
    const cs = getComputedStyle(board);
    const W = board.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight), H = board.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    let best = { z: 0, c: 1 };
    for (let c = 1; c <= n; c++) {
      const rows = Math.ceil(n / c);
      const z = Math.min(1, W / (c * fw + (c - 1) * GAP + 2 * PAD_X), H / (rows * th + (rows - 1) * GAP + PAD_Y));
      if (z >= best.z - 1e-6) best = { z, c };
    }
    const colsAt = (z) => Math.max(1, Math.min(n, Math.floor((W / z - 2 * PAD_X + GAP) / (fw + GAP))));
    let over = false;
    if (!fit) best = { z: 1, c: colsAt(1) };
    else if (best.z < MIN_Z) { best = { z: MIN_Z, c: colsAt(MIN_Z) }; over = true; }
    zoom = best.z; cols = best.c;
    document.documentElement.style.setProperty("--zoom", zoom);
    document.documentElement.style.setProperty("--cols", cols);
    const zt = $("zoomT");
    zt.textContent = Math.round(zoom * 100) + "%";
    zt.classList.toggle("warn", over);
    zt.title = over ? "放不下，保底 60% 滚动看" : fit ? "适配窗口（点一下看原尺寸）" : "原尺寸（点一下适配窗口）";
  }
  function renderFig() {
    const box = $("fig"), { v, d } = values();
    box.parentElement.hidden = !R().figure;
    if (R().figure) box.innerHTML = R().figure(v, d, { w: box.clientWidth, h: box.clientHeight });
  }

  /* ---- 刻度轨（照抄 ScaleTrack）：拖、点、← → Home End，双击回默认；只改变量不重画 ---- */
  const frac = (p, v) => (v - p.min) / (p.max - p.min);
  const at = (f) => `left:calc(var(--pad) + (100% - var(--pad) * 2) * ${f})`;
  function knobHTML(p, src) {
    const scope = src === "o" ? `<span class="badge on" title="只有第 ${selI()} 档有">${selI()}</span>` : "";
    const tick = p.tick ?? p.step, n = Math.round((p.max - p.min) / tick);
    const ticks = Array.from({ length: n + 1 }, (_, i) => `<span class="tick${i === 0 || i === n ? " end" : ""}" data-tk="${p.min + i * tick}" style="${at(i / n)}"></span>`).join("");
    return `<div class="knob" data-k="${p.key}" data-src="${src}">
      <div class="kh">${scope}<span class="nm">${p.label} <span class="unit">${p.unit}</span></span><span class="dl"></span></div>
      <div class="track" tabindex="0" role="slider" aria-label="${p.label}" aria-valuemin="${p.min}" aria-valuemax="${p.max}">${ticks}<span class="notch" style="${at(frac(p, p.def))}"></span><span class="trk"><b class="cur"></b></span></div>
    </div>`;
  }
  function paintKnob(el, val) {
    const p = specOf(el), d = val - p.def;
    el.classList.toggle("dirty", d !== 0);
    el.querySelector(".dl").innerHTML = `<span>${p.def}</span><span class="arr">→</span><b>${val}</b><em>${signed(d)}</em>`;
    el.querySelectorAll(".tick").forEach((t) => t.classList.toggle("on", Number(t.dataset.tk) <= val + 1e-9));
    el.querySelector(".trk").style.translate = `${frac(p, val) * 100}% 0`;
    el.querySelector(".cur").textContent = val;
    el.querySelector(".track").setAttribute("aria-valuenow", val);
  }
  /* 滑块：由 agent 写页面时决定（轮次 params 共用 + 档 params 私有），用户只管拉；跟着当前界面、选中档换 */
  function renderKnobs() {
    $("knobs").innerHTML = (R().params ?? []).map((p) => knobHTML(p, "s")).join("") + (selV().params ?? []).map((p) => knobHTML(p, "o")).join("");
    document.querySelectorAll(".knob").forEach((el) => paintKnob(el, valOf(specOf(el), el.dataset.src)));
  }
  const hasKnobs = () => PAGES_.some((p) => p.rounds.some((r) => r.params?.length || r.list.some((v) => v.params?.length)));
  function setParam(el, val) {
    const p = specOf(el);
    val = +Math.min(p.max, Math.max(p.min, Math.round((val - p.min) / p.step) * p.step + p.min)).toFixed(4);
    const store = storeOf(el.dataset.src), o = load(store, {});
    if (o[p.key] === val || (o[p.key] === undefined && val === p.def)) return;
    if (val === p.def) delete o[p.key]; else o[p.key] = val;
    save(store, o);
    paintKnob(el, val);
    applyParams();
    paintOut();
  }
  function trackAt(tr, p, x) {
    const r = tr.getBoundingClientRect(), pad = parseFloat(getComputedStyle(tr).paddingLeft);
    return p.min + Math.min(1, Math.max(0, (x - r.left - pad) / (r.width - pad * 2))) * (p.max - p.min);
  }

  /* ---- 记录 + 撤回：每次改动前后各拍一张相关存储键的快照，记成一条 chg；撤回不占界面，⌘Z / ⇧⌘Z 走这里 ---- */
  let pending = null;
  function begin(keys, label, d = { type: "misc" }) { pending = { label, d, before: Object.fromEntries(keys.map((k) => [k, raw(k)])) }; }
  function commit() {
    if (!pending) return;
    const { label, d, before } = pending;
    pending = null;
    if (reloadPending) queueMicrotask(reloadSoon);   // 拖到一半来了新版本：这一下记完再刷新
    const after = Object.fromEntries(Object.keys(before).map((k) => [k, raw(k)]));
    if (Object.keys(before).every((k) => before[k] === after[k])) return;
    for (let i = history.length - 1; i >= 0; i--) if (history[i].undone) history.splice(i, 1);   // 撤回过的再也够不着了，拿掉
    const last = history.findLast((h) => h.kind === "chg"), now = performance.now();
    if (last && last.label === label && now - last.ts < MERGE_MS && Object.keys(before).every((k) => k in last.before)) Object.assign(last, { after, ts: now, t: new Date() });
    else history.push({ kind: "chg", label, d, before, after, ts: now, t: new Date(), undone: false });
    renderHist(); paintOut();
  }
  const txn = (keys, label, fn, d) => { begin(keys, label, d); fn(); commit(); };
  function restore(snap) {
    let lay = false;
    for (const [k, v] of Object.entries(snap)) {
      if (k.startsWith("L")) lay = true;
      if (v === null) localStorage.removeItem(KEY + k); else localStorage.setItem(KEY + k, v);
    }
    if (lay) return flip(() => render());   // 拼装撤回 / 重做：重放布局，零件原路滑回去
    applyParams(); renderKnobs(); syncChrome();
  }
  function undo(redo = false) {
    const e = redo ? history.find((h) => h.kind === "chg" && h.undone) : history.findLast((h) => h.kind === "chg" && !h.undone);
    if (!e) return;
    restore(redo ? e.after : e.before);
    e.undone = !redo;
    renderHist();
  }
  const note = (h) => { history.push({ ...h, t: new Date() }); renderHist(); };
  const logAct = (i, act, from, danger = false) => note({ kind: "act", i, from, act, danger });
  /* 一条记录长什么样：字形 + 章 + 名 + 改前 → 改后 / 坐标章 + 等宽时刻；撤回过的变灰 */
  function rowHTML(h) {
    const tm = `<time>${hms(h.t)}</time>`, un = h.undone ? `<span class="tag">已撤回</span>` : "";
    if (h.kind === "act") return `<li class="${h.danger ? "danger" : ""}">${ic("play", 13)}<span class="badge">${h.i}</span><span class="tag">${h.from}</span><span class="nm">${h.act}</span>${tm}</li>`;
    if (h.kind === "note") return `<li class="note">${ic("pen", 13)}<span class="badge on">${h.no}</span><span class="nm">${esc(h.label)}</span>${tm}</li>`;
    if (h.kind === "send") return `<li>${ic("export", 13)}<span class="nm">${h.label}</span>${tm}</li>`;
    if (h.kind === "say") return `<li class="say">${ic("check", 13)}<span class="nm" title="${esc(h.text)}">${esc(h.text)}</span>${tm}</li>`;
    const cls = h.undone ? "undone" : "";
    if (h.d.type === "param") {
      const get = (snap) => JSON.parse(snap[h.d.store] ?? "{}")[h.d.key] ?? h.d.def;
      const a = get(h.before), b = get(h.after);
      return `<li class="${cls}">${ic("sliders", 13)}${h.d.scope}<span class="nm">${h.label}</span><span class="was">${a}</span><span class="arr">→</span><span class="now">${b}</span><em>${signed(b - a)}</em>${un}${tm}</li>`;
    }
    if (h.d.type === "move") return `<li class="${cls}">${ic("grid-view", 13)}<span class="badge">${at3(h.d.k)[2]}</span><span class="nm" title="${esc(h.d.desc ?? h.label)}">${esc(h.d.desc ?? h.label)}</span>${un}${tm}</li>`;
    if (h.d.type === "size") {
      const q = JSON.parse(h.after["L" + h.d.k] ?? "null")?.sz?.[h.d.id];
      return `<li class="${cls}">${ic("grid-view", 13)}<span class="badge">${at3(h.d.k)[2]}</span><span class="nm">${h.label}</span>${q ? `<span class="xy">w ${q.w}</span><span class="xy">h ${q.h}</span>` : `<span class="xy">原样</span>`}${un}${tm}</li>`;
    }
    return `<li class="${cls}">${ic("pen", 13)}<span class="nm">${h.label}</span>${un}${tm}</li>`;
  }
  function renderHist() {
    sessionStorage.setItem(KEY + "h", JSON.stringify(history));
    const n = history.filter((h) => !h.undone).length;
    $("histT").innerHTML = `${ic("list-ordered", 15)}<span class="badge${n ? " on" : ""}">${n}</span>`;
    $("histH").innerHTML = sh("list-ordered", "记录", `<span class="meta">${n} 条</span>`, ibtn("copyJ", "export", "拷选中档的参数与布局 JSON"));
    $("hist").innerHTML = history.length ? [...history].reverse().map(rowHTML).join("") : `<li class="empty">点样本、拉滑块、挪零件、打标注，每一下都记在这里</li>`;
  }
  function copyJSON(btn) {
    const { v } = values();
    const units = Object.fromEntries([...(R().params ?? []), ...(selV().params ?? [])].map((p) => [p.key, p.unit]));
    const json = JSON.stringify({ 界面: PG().name, 档: vname(pg, rnd(), selI()), 参数: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, x + units[k]])), 布局: layoutText(Lof(selK())) }, null, 2);
    navigator.clipboard.writeText(json).then(() => flash(btn, true), (err) => { flash(btn, false); throw err; });
  }

  /* ---- 拼装：拖一个零件落到另一个零件前 / 后——真改 DOM 顺序（同组换位、跨组挪进去都行），不是叠一层位移；拉手改大小。
     按档各存各的 L<g.r.i> = { ops: [{ id, n, ref, rn, side, desc, seq }], sz: { 零件: { w, h, n } } }，重画时按 ops 依次重放。
     零件 id = 这格里唯一的具名 data-part，否则「@样本:原始路径」（路径在画出来那一刻记进 data-lab-id，挪过之后照样认得）。
     交给 agent 的是人话（「发送」挪到「取消」后面，从「顶栏」挪进「底栏」；现在顺序：…），照着改 render 就行。
     ⛔ 别改回自由位移 {x, y}：agent 读不懂「往右 37px」是要换位还是要对齐，拼装形同虚设（2026-11-25 换掉） */
  const Lof = (k) => { const L = load("L" + k, null); return L && Array.isArray(L.ops) ? L : { ops: [], sz: {} }; };   // 旧的自由位移格式作废
  const Lsize = (L) => L.ops.length + Object.keys(L.sz).length;
  const layoutText = (L) => [...L.ops.map((o) => o.desc + (o.seq ? `（现在顺序：${o.seq}）` : "")), ...Object.values(L.sz).map((q) => `「${q.n}」改成 宽 ${q.w} × 高 ${q.h}`)];
  function pick(t, face, group) {
    if (!face.contains(t) || t === face || t.closest(".menu, [contenteditable]")) return null;
    let el = t.closest(ATOM) ?? t.closest("svg") ?? t;
    if (group) el = el.closest("[data-part]") ?? el;
    if (el === face || !face.contains(el) || (el.parentElement === face && !el.dataset.part)) return null;   // 样本外框不算零件
    return el;
  }
  const walk = (face, path) => { let n = face; for (const i of path.split(".")) n = n?.children[i]; return n ?? null; };
  const pathOf = (el, face) => { const p = []; for (let n = el; n !== face; n = n.parentElement) p.unshift([...n.parentElement.children].indexOf(n)); return p.join("."); };
  const tagIds = (face) => { for (const el of face.querySelectorAll("*")) el.dataset.labId = pathOf(el, face); };
  const labIdOf = (el, face) => el.dataset.labId ?? pathOf(el, face);
  const idOf = (el, face) => (el.dataset.part && face.querySelectorAll(`[data-part="${el.dataset.part}"]`).length === 1 ? el.dataset.part : `@${sOf(face.getRootNode())}:${labIdOf(el, face)}`);
  const nameOf = (el) => el.dataset.name || el.getAttribute("aria-label") || el.getAttribute("title") || el.textContent.trim().replace(/\s+/g, " ").slice(0, 12) || el.tagName.toLowerCase();
  /* 容器叫什么：具名组 → 它的名字；否则 aria-label / 类名，不拿一整串字当名字 */
  const groupName = (el, face) => {
    const p = el.parentElement, g = p.closest("[data-part]");
    if (g && face.contains(g)) return `「${nameOf(g)}」`;
    return p === face ? "最外层" : `「${p.dataset.name || p.getAttribute("aria-label") || (p.classList[0] ? "." + p.classList[0] : p.tagName.toLowerCase())}」`;
  };
  function elOf(face, id) {
    if (!id.startsWith("@")) return face.querySelector(`[data-part="${id}"]`);
    const [s, path] = id.slice(1).split(":");
    return Number(s) === sOf(face.getRootNode()) ? face.querySelector(`[data-lab-id="${path}"]`) : null;
  }
  const faces = (k) => hostsOf(k).map((h) => h.shadowRoot.querySelector(".root"));
  const unInline = (el) => { if (getComputedStyle(el).display === "inline") el.style.display = "inline-block"; };   // 行内元素吃不到 translate / 宽高
  /* 拼装罩：跟着当前那个零件走（悬停、拖动、调大小都重量一次） */
  function showHud(root, el) {
    const hud = root.querySelector(".lab-hud");
    root.cur = el;
    hud.classList.toggle("on", !!el);
    if (!el) return;
    const hr = root.host.getBoundingClientRect(), r = el.getBoundingClientRect();
    Object.assign(hud.style, { left: (r.left - hr.left) / zoom + "px", top: (r.top - hr.top) / zoom + "px", width: r.width / zoom + "px", height: r.height / zoom + "px" });
    hud.firstChild.textContent = nameOf(el);
  }
  function hudFollow(k) {
    for (const h of hostsOf(k)) if (h.shadowRoot.cur) showHud(h.shadowRoot, h.shadowRoot.cur);
    placePins();
  }
  function sizeEl(el, w, h) { unInline(el); el.classList.toggle("sized", w != null); el.style.width = w == null ? "" : w + "px"; el.style.height = h == null ? "" : h + "px"; }
  function setSize(k, id, w, h) { for (const f of faces(k)) { const el = elOf(f, id); if (el) sizeEl(el, w, h); } hudFollow(k); }
  function applyOp(face, o) {
    const el = elOf(face, o.id), ref = elOf(face, o.ref);
    if (el && ref && el !== ref && !el.contains(ref)) ref[o.side](el);
  }
  function applyLayout(k) {
    const L = Lof(k);
    for (const f of faces(k)) {
      for (const o of L.ops) applyOp(f, o);
      for (const [id, q] of Object.entries(L.sz)) { const el = elOf(f, id); if (el) sizeEl(el, q.w, q.h); }
    }
  }
  /* 换位 / 撤回 / 归位都走 FLIP：先量、改完再量、从差值滑回 0——怎么过去就怎么回来。子元素扣掉祖先自己的位移，不然跟着父级滑两遍 */
  function flip(fn) {
    const before = new Map(), key = (i, el) => `${i}|${el.dataset.labId}`;
    hosts().forEach((h, i) => { for (const el of h.shadowRoot.querySelectorAll(".root [data-lab-id]")) before.set(key(i, el), el.getBoundingClientRect()); });
    fn();
    hosts().forEach((h, i) => {
      const tot = new Map();
      for (const el of h.shadowRoot.querySelectorAll(".root [data-lab-id]")) {   // 文档序：祖先先于子孙
        const r0 = before.get(key(i, el));
        if (!r0) continue;
        const r = el.getBoundingClientRect(), d = [(r0.left - r.left) / zoom, (r0.top - r.top) / zoom];
        tot.set(el, d);
        let up = [0, 0];
        for (let a = el.parentElement; a && !a.classList.contains("root"); a = a.parentElement) if (tot.has(a)) { up = tot.get(a); break; }
        const rx = d[0] - up[0], ry = d[1] - up[1];
        if (Math.abs(rx) + Math.abs(ry) < 0.5) continue;
        el.animate([{ translate: `${rx}px ${ry}px` }, { translate: "0 0" }], { duration: FLIP_MS, easing: "cubic-bezier(.2, .8, .2, 1)" });
      }
    });
  }
  /* 拖动时把各格的 iframe 设成不接指针：否则光标划过实验页，事件被 iframe 吃掉，拖动就卡住 */
  const shield = (on) => document.querySelectorAll(".host").forEach((h) => h.shadowRoot?.querySelectorAll("iframe").forEach((f) => (f.style.pointerEvents = on ? "none" : "")));
  /* 落点：指针下那个零件（认法同 pick），按它所在那组的排布方向分前 / 后；指针在自己的祖先上（空白处）= 没有落点 */
  function flowX(p) {
    const c = getComputedStyle(p);
    if (c.display.includes("flex")) return c.flexDirection.startsWith("row");
    if (c.display.includes("grid")) return c.gridTemplateColumns.trim().split(/\s+/).length > 1;
    return [...p.children].some((x) => getComputedStyle(x).display.startsWith("inline"));
  }
  function dropAt(root, face, el, x, y, group) {
    const t0 = root.elementsFromPoint(x, y).find((n) => face.contains(n) && n !== face && !el.contains(n) && !n.closest(".menu"));
    if (!t0) return null;
    let t = t0.closest(ATOM) ?? t0.closest("svg") ?? t0;
    if (group) t = t.closest("[data-part]") ?? t;
    if (t === face || !face.contains(t) || t.contains(el)) return null;
    const r = t.getBoundingClientRect(), horiz = flowX(t.parentElement);
    return { t, r, horiz, side: (horiz ? x < r.left + r.width / 2 : y < r.top + r.height / 2) ? "before" : "after" };
  }
  function showDrop(root, d) {
    const m = root.querySelector(".lab-drop");
    m.classList.toggle("on", !!d);
    if (!d) return;
    const hr = root.host.getBoundingClientRect(), r = d.r, at = d.side === "before";
    Object.assign(m.style, d.horiz
      ? { left: ((at ? r.left : r.right) - hr.left) / zoom - 1.5 + "px", top: (r.top - hr.top) / zoom + "px", width: "3px", height: r.height / zoom + "px" }
      : { left: (r.left - hr.left) / zoom + "px", top: ((at ? r.top : r.bottom) - hr.top) / zoom - 1.5 + "px", width: r.width / zoom + "px", height: "3px" });
  }
  /* 按下先「待拖」：过 DRAG_PX 才接管成拖动；零件跟着指针走、落点亮一道线；松手真挪过去，没有落点就原路滑回 */
  let swallow = false;
  function armDrag(e, el, k, root) {
    const face = root.querySelector(".root"), hud = root.querySelector(".lab-hud"), id = idOf(el, face), n = nameOf(el);
    const sx = e.clientX, sy = e.clientY, pid = e.pointerId, keep = { position: el.style.position, zIndex: el.style.zIndex };
    let on = false, done = false, d = null;
    const move = (ev) => {
      if (ev.buttons === 0) return up();   // 在窗外 / iframe 上松开了：补一次松手
      if (!on) {
        if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < DRAG_PX) return;
        on = true;
        el.setPointerCapture(pid); shield(true); hud.classList.add("drag"); root.host.classList.add("dragging");
        getSelection().removeAllRanges(); closeMenu(root);
        unInline(el);
        if (getComputedStyle(el).position === "static") el.style.position = "relative";
        Object.assign(el.style, { zIndex: 31, pointerEvents: "none", opacity: 0.85 });
      }
      ev.preventDefault();
      el.style.translate = `${(ev.clientX - sx) / zoom}px ${(ev.clientY - sy) / zoom}px`;
      showHud(root, el);
      d = dropAt(root, face, el, ev.clientX, ev.clientY, ev.altKey);
      showDrop(root, d);
    };
    const up = () => {
      if (done) return; done = true;
      removeEventListener("pointermove", move, true); removeEventListener("pointerup", up, true); removeEventListener("pointercancel", up, true);
      if (!on) return;
      shield(false);
      swallow = true; setTimeout(() => (swallow = false), 0);
      hud.classList.remove("drag"); root.host.classList.remove("dragging"); showDrop(root, null);
      const settle = () => Object.assign(el.style, { translate: "", pointerEvents: "", opacity: "", ...keep });
      if (!d) { flip(settle); return showHud(root, null); }
      const from = groupName(el, face), same = d.t.parentElement === el.parentElement, was = [el.parentElement, el.nextElementSibling];
      const o = { id, n, ref: idOf(d.t, face), rn: nameOf(d.t), side: d.side };
      flip(() => { settle(); for (const f of faces(k)) applyOp(f, o); });
      if (el.parentElement === was[0] && el.nextElementSibling === was[1]) return showHud(root, null);   // 落回原位：不算一次挪动
      o.desc = `「${n}」挪到「${o.rn}」${d.side === "before" ? "前面" : "后面"}${same ? "" : `，从${from}挪进${groupName(el, face)}`}`;
      o.seq = [...el.parentElement.children].filter((c) => !c.matches(".menu")).map(nameOf).join(" · ");
      txn(["L" + k], n + " 挪位", () => { const L = Lof(k); L.ops.push(o); save("L" + k, L); }, { type: "move", k, id, desc: o.desc });
      if (hosts().some((h) => h.used.has(k))) return flip(() => render());   // 别的格 use() 了这一档：一起换
      showHud(root, el);
    };
    addEventListener("pointermove", move, true); addEventListener("pointerup", up, true); addEventListener("pointercancel", up, true);
  }

  /* 罩右下角拉手改大小：从当前尺寸起，按 8px 吸（Shift 不吸），松手记一条 */
  function armResize(e, el, k, root) {
    e.preventDefault(); e.stopPropagation();
    const grip = e.target, hud = grip.parentElement, id = idOf(el, root.querySelector(".root")), n = nameOf(el), r0 = el.getBoundingClientRect();
    const w0 = r0.width / zoom, h0 = r0.height / zoom, sx = e.clientX, sy = e.clientY;
    let w = w0, h = h0;
    begin(["L" + k], n + " 调大小", { type: "size", k, id });
    grip.setPointerCapture(e.pointerId); shield(true); hud.classList.add("drag"); root.host.classList.add("dragging"); closeMenu(root);
    let done = false;
    const move = (ev) => {
      if (ev.buttons === 0) return up();
      const snap = (v) => Math.max(8, Math.round(ev.shiftKey ? v : Math.round(v / SNAP) * SNAP));
      w = snap(w0 + (ev.clientX - sx) / zoom); h = snap(h0 + (ev.clientY - sy) / zoom);
      setSize(k, id, w, h);
    };
    const up = () => {
      if (done) return; done = true; shield(false);
      grip.removeEventListener("pointermove", move); grip.removeEventListener("pointerup", up); grip.removeEventListener("pointercancel", up); grip.removeEventListener("lostpointercapture", up);
      swallow = true; setTimeout(() => (swallow = false), 0);
      hud.classList.remove("drag"); root.host.classList.remove("dragging");
      const L = Lof(k); L.sz[id] = { w, h, n }; save("L" + k, L); commit();
      if (hosts().some((x) => x.used.has(k))) render();
    };
    grip.addEventListener("pointermove", move); grip.addEventListener("pointerup", up); grip.addEventListener("pointercancel", up); grip.addEventListener("lostpointercapture", up);
  }

  /* ---- 标注：点绑在组件上——记的是哪个组件（具名 / 路径 + 标签）和点在它里面的比例位置，不是格内坐标 ----
     组件动（抽屉滑出、页签切换、拼装挪位）点就跟着动，组件看不见点就藏；认组件同拼装（pick），点到外框 / 空白就认外框 / 整格。
     只有组件找不到了（agent 改了结构）才落回记下的格内坐标 */
  const pickNote = (t, face, group) => pick(t, face, group) ?? (face.contains(t) ? [...face.children].find((c) => c.contains(t)) ?? face : null);
  const cssPath = (el, face) => { const p = []; for (let n = el; n !== face; n = n.parentElement) p.unshift(n.tagName.toLowerCase() + (n.classList[0] ? "." + n.classList[0] : "")); return p.join(" > ") || ".root"; };
  function noteEl(face, n) {
    const byPart = () => (n.part ? face.querySelector(`[data-part="${n.part}"]`) : null);
    if (!n.idx) return n.part ? byPart() : face;
    const el = face.querySelector(`[data-lab-id="${n.idx}"]`) ?? walk(face, n.idx);
    return el && el.tagName === n.tag && (!n.part || el.dataset.part === n.part) ? el : byPart();
  }
  function placePinsIn(h) {
    const all = draft ? [...notes, draft] : notes;
    const root = h.shadowRoot, layer = root.querySelector(".lab-pins"), face = root.querySelector(".root"), hr = h.getBoundingClientRect();
    const have = new Map([...layer.children].map((b) => [b.dataset.note, b]));
    for (const n of all.filter((x) => x.k === h.dataset.vk && x.s === Number(h.dataset.sp))) {
      let b = have.get(n.id);
      have.delete(n.id);
      if (!b) { b = document.createElement("button"); b.dataset.note = n.id; layer.append(b); }
      const el = noteEl(face, n), r = el?.getBoundingClientRect();
      b.className = `lab-pin ${n.state}${editing?.id === n.id ? " on" : ""}${el ? "" : " lost"}`;
      b.textContent = n.no; b.title = el ? n.note : `组件已变（agent 改过结构），点落在原坐标：${n.note}`;
      b.hidden = !!el && el !== face && (!el.checkVisibility({ opacityProperty: true, visibilityProperty: true }) || scrolledOut(el, r, face));
      b.style.left = (el ? (r.left - hr.left + n.fx * r.width) / zoom : n.x) + "px";
      b.style.top = (el ? (r.top - hr.top + n.fy * r.height) / zoom : n.y) + "px";
    }
    for (const b of have.values()) b.remove();
  }
  /* 组件被样本自己的滚动层滚出了可视区（翻到屏外、钻进顶栏底下）：点也藏起来 */
  function scrolledOut(el, r, face) {
    for (let n = el.parentElement; n && n !== face; n = n.parentElement) {
      const o = getComputedStyle(n);
      if (!/(auto|scroll|hidden|clip)/.test(o.overflowY + o.overflowX)) continue;
      const s = n.getBoundingClientRect();
      if (r.bottom < s.top || r.top > s.bottom || r.right < s.left || r.left > s.right) return true;
    }
    return false;
  }
  const placePins = () => { hosts().forEach(placePinsIn); paintPages(); };
  /* 框出一条标注指的组件（悬停点或标注行时）；id 空 = 收起 */
  function ring(id) {
    for (const h of hosts()) {
      const root = h.shadowRoot, layer = root.querySelector(".lab-pins");
      let rg = layer.querySelector(".lab-ring");
      const n = id && notes.find((x) => x.id === id && x.k === h.dataset.vk && x.s === Number(h.dataset.sp));
      const el = n && noteEl(root.querySelector(".root"), n);
      if (!el) { if (rg) rg.hidden = true; continue; }
      if (!rg) { rg = document.createElement("div"); rg.className = "lab-ring"; layer.prepend(rg); }
      const r = el.getBoundingClientRect(), hr = h.getBoundingClientRect();
      Object.assign(rg.style, { left: (r.left - hr.left) / zoom + "px", top: (r.top - hr.top) / zoom + "px", width: r.width / zoom + "px", height: r.height / zoom + "px" });
      rg.hidden = false;
    }
  }
  /* 点跟着组件动：格里起了过渡 / 动画、或 DOM / 类名 / 行内样式变了，就逐帧重量这一格的点，动画停了就停（无限循环的动画不算，不然停不下来） */
  const moving = (root) => root.getAnimations().some((a) => a.playState === "running" && a.effect?.getTiming().iterations !== Infinity);
  function follow(root) {
    let on = false;
    const tick = () => { placePinsIn(root.host); if (moving(root)) requestAnimationFrame(tick); else on = false; };
    const go = () => { if (!on && root.querySelector(".lab-pin")) { on = true; requestAnimationFrame(tick); } };
    root.addEventListener("transitionrun", go); root.addEventListener("animationstart", go);
    /* 样本里自己的滚动层（手机页的清单、抽屉）一滚，组件就动了：滚动不冒泡，在影子根上抓捕获阶段，一帧量一次 */
    let sq = 0;
    root.addEventListener("scroll", () => { if (!sq) sq = requestAnimationFrame(() => { sq = 0; placePinsIn(root.host); }); }, { capture: true, passive: true });
    new MutationObserver(go).observe(root.querySelector(".root"), { subtree: true, childList: true, attributes: true, characterData: true });
  }
  const pinEl = (id) => hosts().map((h) => h.shadowRoot.querySelector(`.lab-pin[data-note="${id}"]`)).find(Boolean);
  function newNote(el, e, root, k) {
    closeComposer(true);
    const face = root.querySelector(".root"), r = el.getBoundingClientRect(), hr = root.host.getBoundingClientRect();
    draft = {
      id: Date.now().toString(36), no: Math.max(0, ...notes.map((n) => n.no)) + 1, k, s: sOf(root),
      part: el.dataset.part ?? "", idx: el === face ? "" : labIdOf(el, face), tag: el.tagName, name: el === face ? "整格" : nameOf(el), css: cssPath(el, face),
      text: el.textContent.trim().replace(/\s+/g, " ").slice(0, 80), html: el.outerHTML.replace(/ data-lab-id="[^"]*"/g, "").replace(/\s+/g, " ").slice(0, 320),
      fx: r.width ? (e.clientX - r.left) / r.width : 0, fy: r.height ? (e.clientY - r.top) / r.height : 0,
      x: (e.clientX - hr.left) / zoom, y: (e.clientY - hr.top) / zoom, note: "", state: "open",
    };
    showHud(root, null);
    openComposer(draft);
  }
  /* 写标注的小框：贴着那枚点，回车存、⇧回车换行、Esc 放弃、点外面也存；输入法选字时的回车不算。
     参考图（2026-11-25 甲方要）：⌘V 粘贴或拖进小框，存进服务的图缓存（本机，不进仓库），发出去的标注带上本机路径，agent 用 Read 看 */
  const cmp = $("cmp"), cmpT = $("cmpT");
  /* 参考 = { kind: img | video, url, path, poster?, src? }；链接（2026-11-25 甲方要）交给服务取：直链图 / 视频直接存，网页取 og:video / og:image，视频再抽一帧封面给 agent 看 */
  let cmpImgs = [];
  const paintImgs = () => {
    $("cmpI").innerHTML = cmpImgs.map((im, i) => im.pending ? `<figure class="ld"><span>取${esc(im.label)}中…</span></figure>`
      : `<figure class="${im.kind === "video" ? "vid" : ""}" title="${esc(im.src ?? "")}">${im.kind === "video" && !im.poster ? `<video src="${im.url}" muted preload="metadata"></video>` : `<img src="${im.kind === "video" ? im.poster.url : im.url}" alt="">`}${im.kind === "video" ? `<i>${ic("play", 12)}</i>` : ""}<button data-ix="${i}" title="去掉" aria-label="去掉">${ic("close", 11)}</button></figure>`).join("");
  };
  const cmpErr = (t) => { $("cmpE").textContent = t; };
  /* 取一份参考：先挂占位，回来替换；小框已经关了就直接记到那条标注上；取不到在小框里说原因（链接文字照样留在标注里） */
  async function addRef(n, label, req) {
    const ph = { pending: true, label };
    if (editing === n) { cmpImgs.push(ph); paintImgs(); }
    const r = await req(), j = await r.json();
    const i = cmpImgs.indexOf(ph);
    if (i >= 0) cmpImgs.splice(i, 1);
    if (!r.ok) { if (editing === n) { paintImgs(); cmpErr(`${label}没取到：${j.error}`); } return; }
    if (editing === n) { cmpImgs.splice(i >= 0 ? i : cmpImgs.length, 0, j); paintImgs(); }
    else { n.imgs = [...(n.imgs ?? []), j]; if (notes.includes(n)) save("n", notes); paintOut(); }
  }
  const addImgs = (files, n) => files.forEach((f) => addRef(n, "图", () => fetch("/__lab/img", { method: "POST", headers: { "content-type": f.type }, body: f })));
  const addLinks = (urls, n) => urls.forEach((u) => addRef(n, "链接", () => fetch("/__lab/fetch", { method: "POST", body: u })));
  const imgFiles = (dt) => [...(dt?.files ?? [])].filter((f) => f.type.startsWith("image/"));
  const linksIn = (t) => [...new Set(t.match(/https?:\/\/[^\s<>"'，。、；）)】]+/g) ?? [])];
  function openComposer(n) {
    if (editing && editing !== n) closeComposer(true);
    closePop();
    editing = n;
    placePins();
    $("cmpH").innerHTML = `<span class="badge on">${n.no}</span><span class="nm">${esc(n.name)}</span>` + (n === draft ? "" : ibtn("cmpDel", "close", "删掉这条标注"));
    cmpT.value = n.note;
    cmpImgs = [...(n.imgs ?? [])]; paintImgs(); cmpErr("");
    cmp.classList.add("open");
    const pin = pinEl(n.id), r = (pin.hidden ? pin.getRootNode().host : pin).getBoundingClientRect(), w = cmp.offsetWidth, h = cmp.offsetHeight;   // 组件此刻看不见：贴着格子开
    cmp.style.left = Math.max(8, r.right + 10 + w > innerWidth - 8 ? r.left - 10 - w : r.right + 10) + "px";
    cmp.style.top = Math.max(8, Math.min(r.top - 6, innerHeight - h - 8)) + "px";
    cmpT.focus();
  }
  function closeComposer(keep) {
    if (!editing) return;
    const n = editing, text = cmpT.value.trim(), imgs = cmpImgs.filter((x) => !x.pending), has = text || imgs.length;
    const same = text === n.note && JSON.stringify(imgs) === JSON.stringify(n.imgs ?? []), pics = imgs.length ? `（${imgs.length} 份参考）` : "";
    editing = null; cmp.classList.remove("open"); cmpT.blur();
    if (keep && has && n === draft) { Object.assign(n, { note: text || "（见图）", imgs }); notes.push(n); save("n", notes); note({ kind: "note", no: n.no, label: `${n.name}：${n.note}${pics}` }); }
    else if (keep && has && !same && n !== draft) { Object.assign(n, { note: text || "（见图）", imgs }); save("n", notes); note({ kind: "note", no: n.no, label: `改 · ${n.note}${pics}` }); }
    draft = null;
    placePins(); paintOut();
    if (reloadPending) reloadSoon();
  }
  function dropNote(n) {
    editing = null; cmp.classList.remove("open"); cmpT.blur();
    notes = notes.filter((x) => x !== n); save("n", notes);
    note({ kind: "note", no: n.no, label: "删掉" });
    placePins(); paintOut();
    if (reloadPending) reloadSoon();
  }
  /* 从清单点一条：它不在台上就换到它那个界面、那一轮、那一档、那条样本再打开 */
  function openNote(id) {
    const n = notes.find((x) => x.id === id);
    if (!pinEl(id)) {
      const [g, r, i] = at3(n.k);
      if (!PAGES_[g]?.rounds[r]?.list[i]) return;   // 那一轮已撤：没地方摆它
      pg = g; save("g", g); save("r" + g, r); save(`v${g}.${r}`, i); save("s" + g, n.s);
      renderChrome(); render();
    }
    openComposer(n);
  }
  function setNoting(on) {
    noting = on; save("nt", on);
    if (!on) closeComposer(true);
    hosts().forEach((h) => { h.toggleAttribute("data-note", on); showHud(h.shadowRoot, null); });
    syncChrome();
  }

  /* ---- 发送：标注 + 每个界面选的档 + 改过的参数与布局，一批 POST 给 /__lab/send（agent 挂在 /__lab/wait 上，立刻醒） ---- */
  function changes() {
    const params = {}, layout = {};
    const fmt = (p, v) => `${p.label}：${v}${p.unit}（默认 ${p.def}${p.unit}）`;
    const take = (ps, vals) => Object.fromEntries((ps ?? []).filter((p) => p.key in vals).map((p) => [p.key, fmt(p, vals[p.key])]));
    PAGES_.forEach((p, g) => {
      const r = rnd(g), rd = p.rounds[r], pre = multi() ? p.name + " · " : "";
      const sp = take(rd.params, shared(g, r));
      if (Object.keys(sp).length) params[pre + "共用"] = sp;
      rd.list.forEach((v, i) => {
        const op = take(v.params, own(vk(g, r, i))), L = Lof(vk(g, r, i));
        if (Object.keys(op).length) params[pre + vname(g, r, i)] = op;
        if (Lsize(L)) layout[pre + vname(g, r, i)] = layoutText(L);
      });
    });
    return { params, layout };
  }
  const picked = () => Object.fromEntries(PAGES_.map((p, g) => [p.name, `R${rnd(g) + 1} · ${vname(g, rnd(g), selI(g))}`]));
  const stateKey = () => JSON.stringify({ picked: picked(), ...changes() });   // 上一次发出去的样子；没标注又没改动就不让发
  function payload() {
    const { params, layout } = changes(), open = notes.some((n) => n.state === "open"), pend = notes.some((n) => n.state === "sent");
    return {
      页: location.pathname, 题目: TOPIC,
      意思: open ? "按标注改：改完回话，接着等"
        : pend ? "补充：没有新标注，只是选档 / 参数 / 布局变了——合进还没回话的那几批一起改"
        : "没写标注 = 定了：按「选档」实装进项目代码（选第 0 档的界面保持现状），参数 / 布局有改动的照着带上",
      在看: { 界面: PG().name, 轮: `R${rnd() + 1} ${R().name}`, 档: vname(pg, rnd(), selI()), 样本: S().from },
      选档: picked(),
      标注: notes.filter((n) => n.state === "open").map((n) => { const [g, r, i] = at3(n.k); return { 号: n.no, 界面: PAGES_[g].name, 档: `R${r + 1} · ${vname(g, r, i)}`, 样本: PAGES_[g].specs[n.s].from, 组件: n.name, 具名: n.part || undefined, 路径: n.css, 原文: n.text, html: n.html, 要改: n.note, ...refsOf(n.imgs ?? []) }; }),
      参数: params, 布局: layout,
    };
  }
  /* 参考交给 agent：图（视频给封面）用 Read 看；视频原件与原链接另列 */
  const refsOf = (xs) => {
    const pic = xs.map((x) => (x.kind === "video" ? x.poster?.path : x.path)).filter(Boolean), vid = xs.filter((x) => x.kind === "video").map((x) => x.path), src = xs.map((x) => x.src).filter(Boolean);
    return { 图: pic.length ? pic : undefined, 视频: vid.length ? vid : undefined, 链接: src.length ? src : undefined };
  };
  const worth = () => notes.some((n) => n.state === "open") || stateKey() !== load("sent2", "");   // sent2 = 真发出去过的样子（旧的 sent 是打开时预存的，作废）
  async function sendAll() {
    if (editing) closeComposer(true);
    if (!worth()) return flash($("fab"), true, `${ic("check", 16)}跟上次发的一样`);
    const b = payload(), fab = $("fab");
    const r = await fetch("/__lab/send", { method: "POST", body: JSON.stringify(b) });
    if (!r.ok) { flash(fab, false, `${ic("close", 16)}没发出去`); throw new Error(`发给 agent 失败：${r.status} ${await r.text()}`); }
    const { batch, boot } = await r.json();
    const sentAt = new Date().toISOString();
    for (const n of notes) if (n.state === "open") Object.assign(n, { state: "sent", batch, boot, sentAt });
    const Ls = { at: sentAt, batch, boot, L: { ...(load("Ls", null)?.L ?? {}) } };   // 交出去还没被回话收起的拼装；连发几批没回话就合在一起
    PAGES_.forEach((p, g) => p.rounds[rnd(g)].list.forEach((_, i) => { const k = vk(g, rnd(g), i), L = Lof(k); if (Lsize(L)) Ls.L[k] = JSON.stringify(L); }));
    save("Ls", Ls);
    save("n", notes); save("sent2", stateKey());
    if (said) save("sv", said.at);   // 发了新的，上一句回话收起
    note({ kind: "send", label: b.标注.length ? `发给 agent · ${b.标注.length} 条标注` : "定了：按选档实装" });
    placePins(); paintOut();
    flash(fab, true, `${ic("check", 16)}已发`);
  }
  /* agent 回话只露一句：顶条中间一行灰字，悬停看全文；下次发送就收起。
     ⛔ 别再做成右下角的回话卡片 / 「这次改了」卡片：没人看，还压舞台（2026-11-25 甲方）；改了哪儿看左栏的「新」 */
  const oneLine = (t) => (t.replace(/\*\*|`/g, "").split("\n").map((x) => x.replace(/^[#>\-*\s]+/, "").trim()).find(Boolean) ?? "").split(/(?<=[。！？!?])/)[0];
  /* 发出去之后到回话之前，托盘顶上一行进度：在改哪几批、补充的排着没有、agent 是不是根本没在听。答完就没了 */
  function stText() {
    if (!st) return "";
    const n = (a) => a.join("、");
    if (st.w.length) return `agent 在改第 ${n(st.w)} 批` + (st.q.length ? `；补充的第 ${n(st.q)} 批排着，改完接上` : "");
    if (st.q.length && !st.ag) return `第 ${n(st.q)} 批排着：agent 没在听，回终端叫它一声`;
    return "";
  }
  /* 内容没变就不动 DOM：托盘列表带入场动画，每次重写都会重播一遍，看着就是一直在闪（2026-11-25 踩过） */
  const setHTML = (el, h) => { if (el.dataset.h !== h) { el.innerHTML = h; el.dataset.h = h; } };
  /* 右下角：agent 还没收起的回话 · 标注清单（没发的在前，发出去的变灰）· 发送键（有没发的标注带个数） */
  function paintOut() {
    const open = notes.filter((n) => n.state === "open").length, reply = said && said.at > load("sv", "");
    const say = reply ? oneLine(said.text) : "";
    if ($("say").textContent !== say) { $("say").textContent = say; $("say").title = reply ? said.text : ""; }
    setHTML($("nl"), [...notes].sort((a, b) => (a.state === b.state ? a.no - b.no : a.state === "open" ? -1 : 1))
      .map((x) => `<li data-note="${x.id}" class="${x.state}"><span class="badge on">${x.no}</span><span class="nm">${esc(x.note)}</span>${x.imgs?.length ? `<span class="tag">${x.imgs.length} 参考</span>` : ""}</li>`).join(""));
    const stl = stText();
    if ($("stl").textContent !== stl) $("stl").textContent = stl;
    $("tray").hidden = !notes.length && !stl;
    const fab = $("fab");
    if (fab.classList.contains("flash")) return;
    /* 没写标注 = 定了，agent 照选档落进代码；但发出去的标注还没回话时不是「定了」——那时再发只是补充 */
    const done = !open && !notes.some((n) => n.state === "sent");
    fab.innerHTML = done ? `${ic("check", 16)}实装` : `${ic("export", 16)}发送${open ? `<span class="n">${open}</span>` : ""}`;
    fab.title = done ? "没有要改的：按选档实装（⌘⏎）" : "发给 agent（⌘⏎）";
    fab.classList.toggle("same", !worth());
  }
  /* 拼装发出去以后归 agent：agent 照着改了 render，页面上的拼装不收就会在新结构上再重放一遍（2026-11-17 踩过：
     被推出框外、整块空了）。回话一到，比它早发出去、之后没再动过的那一档的拼装收起；发出去以后又动过的留着（那是新的意思） */
  /* 这句回话答没答到这一批：同一回启动的服务按批号（回话答的是已交给 agent 的批，排着的补充不算）；服务重启过认不出批号，退回按时间 */
  const answered = (x, m) => (m.batch && x.boot && x.boot === m.boot ? x.batch <= m.batch : (x.sentAt ?? x.at ?? "") <= m.at);
  function takeBack(m) {
    const Ls = load("Ls", null);
    if (!Ls?.at || !answered(Ls, m)) return 0;
    let n = 0;
    for (const [k, sent] of Object.entries(Ls.L)) if (JSON.stringify(Lof(k)) === sent) { n += Lsize(Lof(k)); save("L" + k, null); }
    save("Ls", null);
    if (n) flip(() => render());
    return n;
  }
  /* agent 回话：头一回听到记一笔、清掉它答过的那批标注点与拼装位移；回话留在右下角，收起或下次发送才走 */
  function hear(m) {
    if (!m || (m.page && m.page !== location.pathname)) return;
    said = m;
    if (m.at > load("ss", "")) {
      save("ss", m.at);
      const back = takeBack(m);
      note({ kind: "say", text: m.text + (back ? `（交出去的拼装收起 ${back} 处）` : "") });
      /* 发过的点：这句回话答到的那几批收起；回话前补发、agent 还没接的留着（灰点照旧，等下一句回话） */
      notes = notes.filter((n) => !(n.state === "sent" && answered(n, m))); save("n", notes);
      placePins();
    }
    paintOut();
  }
  $("nl").addEventListener("pointerover", (e) => { const li = e.target.closest("li[data-note]"); if (li) ring(li.dataset.note); });
  $("nl").addEventListener("pointerleave", () => ring(null));
  /* 页面文件改了就刷新：正写标注 / 正拖着就等写完、松手再刷；滚动位置带过去，不重播入场 */
  function reloadSoon() {
    if (editing || pending) return void (reloadPending = true);
    sessionStorage.setItem(KEY + "re", JSON.stringify([board.scrollLeft, board.scrollTop]));
    location.reload();
  }

  /* ---- 锚定层（影子里） ---- */
  function closeMenu(root) {
    const m = root.querySelector(".menu:not(.closing)");
    if (!m) return;
    m.classList.add("closing");
    m.animate([{ opacity: 1 }, { opacity: 0, transform: "translateY(-4px) scale(.98)" }], { duration: 120, easing: "ease-in" }).finished.then(() => m.remove());
  }
  function openMenu(root, btn) {
    const face = root.querySelector(".root");
    const m = document.createElement("div");
    m.className = "menu";
    m.innerHTML = (roundOfK(root.host.dataset.vk).menu?.(specOfRoot(root), btn) ?? []).map((x) => `<button data-act="${x.label}" class="${x.danger ? "danger" : ""}">${x.label}</button>`).join("");
    face.appendChild(m);
    const z = zoom, fr = face.getBoundingClientRect(), br = btn.getBoundingClientRect();
    const f = { width: fr.width / z, height: fr.height / z }, r = { right: (br.right - fr.left) / z, top: (br.top - fr.top) / z, bottom: (br.bottom - fr.top) / z };
    m.style.left = Math.max(8, Math.min(r.right - m.offsetWidth, f.width - m.offsetWidth - 8)) + "px";
    const below = r.bottom + 6;
    m.style.top = (below + m.offsetHeight > f.height - 8 ? r.top - 6 - m.offsetHeight : below) + "px";
  }

  /* ---- 交互：影子里的事件，按看法分流；标注与标注点抢在最前（捕获），开着标注时样本不响应、不拖 ---- */
  let noteSkip = false;   // 这一下按下是为了收起正在写的标注，不再落新点
  function wire(root, k) {
    root.addEventListener("pointerover", (e) => { const p = e.target.closest?.(".lab-pin"); if (p) ring(p.dataset.note); });
    root.addEventListener("pointerout", (e) => { if (e.target.closest?.(".lab-pin")) ring(null); });
    const rd = roundOfK(k), s = specOfRoot(root), i = at3(k)[2], face = root.querySelector(".root");
    root.addEventListener("pointerdown", (e) => {
      if (!noting && !e.target.closest(".lab-pin")) return;
      e.stopPropagation();
      if (noting) e.preventDefault();
    }, true);
    root.addEventListener("click", (e) => {
      const pin = e.target.closest(".lab-pin");
      if (!pin && !noting) return;
      e.preventDefault(); e.stopPropagation();
      if (pin) return openNote(pin.dataset.note);
      if (noteSkip) return (noteSkip = false);
      const el = pickNote(e.target, face, e.altKey);
      if (el) newNote(el, e, root, k);
    }, true);
    root.addEventListener("click", (e) => {
      if (!flags.live) return;
      if (swallow) { swallow = false; e.stopPropagation(); return; }   // 刚拖完松手的那下不算点
      const b = e.target.closest("button, [data-act]");
      const open = root.querySelector(".menu:not(.closing)");
      if (b?.matches("[data-menu]")) return open ? closeMenu(root) : openMenu(root, b);
      if (open) closeMenu(root);
      const act = b?.dataset.act;
      if (act === undefined) return;
      rd.on?.(act, { root, spec: s, btn: b, log: (text) => logAct(i, text, s.from) });
      logAct(i, act, s.from, b.classList.contains("danger"));
    });
    root.addEventListener("pointermove", (e) => {
      if ((!flags.build && !noting) || root.host.classList.contains("dragging") || e.target.closest(".lab-hud, .lab-pins")) return;
      showHud(root, noting ? pickNote(e.target, face, e.altKey) : pick(e.target, face, e.altKey));
    });
    root.host.addEventListener("pointerleave", () => { if (!root.host.classList.contains("dragging")) showHud(root, null); });
    root.addEventListener("pointerdown", (e) => {
      if (!flags.build || e.button !== 0) return;
      if (e.target.matches(".lab-hud > .sz")) return root.cur && armResize(e, root.cur, k, root);
      const el = pick(e.target, face, e.altKey);
      if (el) armDrag(e, el, k, root);
    });
    root.addEventListener("dblclick", (e) => {
      const el = flags.build && !noting && pick(e.target, face, e.altKey);
      if (!el) return;
      const L = Lof(k), id = idOf(el, face);
      if (!L.ops.some((o) => o.id === id) && !L.sz[id]) return;
      txn(["L" + k], nameOf(el) + " 归位", () => { L.ops = L.ops.filter((o) => o.id !== id); delete L.sz[id]; save("L" + k, L); }, { type: "move", k, id, desc: `「${nameOf(el)}」回原位` });   // 位置与大小一起回原样
      flip(() => render());
    });
  }

  /* ---- 渲染 ---- */
  const THEME = { auto: "系统", light: "亮", dark: "暗" };
  function renderChrome() {
    $("topic").textContent = TOPIC;
    document.title = "对照版 · " + TOPIC;
    seg($("specs"), PG().specs.map((x, i) => ["data-s", i, x.from, x.note]));
    $("specs").parentElement.hidden = PG().specs.length < 2;
    seg($("views"), [["data-w", "one", "单看", "单看选中档"], ["data-w", "pair", "对照", "现状对选中档（C）"], ["data-w", "all", "全档", "本界面全部档（A）"], ...(multi() ? [["data-w", "pages", "全部界面", "全部界面并排，各切各的档（G）"]] : [])]);
    $("modes").innerHTML = FLAGS.map(([id, l, icon, tip]) => `<button data-flag="${id}" title="${tip}（M 轮换；两颗都关 = 静态）">${ic(icon, 15)}${l}</button>`).join("");
    $("noteT").innerHTML = `${ic("pen", 15)}标注`;
    seg($("pins"), (R().pins ?? [["rest", "常态"]]).map(([id, l]) => ["data-pin", id, l, "静态时钉住的状态"]));
    $("keysT").innerHTML = ic("help", 15);
    $("dockT").innerHTML = ic("sliders", 15);
    $("resetI").innerHTML = ic("reload", 15);
    document.body.classList.toggle("no-dock", !hasKnobs());
    $("histF").innerHTML = `<button class="mini" id="resetP">${ic("reload", 13)}参数回默认</button><button class="mini" id="resetL">${ic("grid-view", 13)}零件归位</button>`;
  }
  /* 左栏：界面（行尾是它选中的档）· 轮次按钮（点开全部轮次）· 档（选中那档展开论点 · 零件 · 代价） */
  function renderNav() {
    paintPages();
    $("rrow").innerHTML = PG().rounds.length > 1 ? `<button class="rbtn" data-pop="roundPop" title="轮次（R / ⇧R）"><span class="badge on">R${rnd() + 1}</span><b>${R().name}</b>${fresh[pg]?.has(rnd()) ? nw : ""}</button>` : "";
    $("roundL").innerHTML = PG().rounds.map((r, i) => `<li data-r="${i}" class="${i === rnd() ? "on" : ""}"><span class="badge${i === rnd() ? " on" : ""}">R${i + 1}</span><b>${r.name}</b>${fresh[pg]?.has(i) ? nw : ""}</li>`).join("");
    $("vl").innerHTML = R().list.map((v, i) => {
      const on = i === selI();
      const now = rnd() === 0 && i === 0 ? `<span class="tag">现状</span>` : "";
      const detail = on ? `<div class="vd"><p>${v.thesis}</p>` +
        (v.parts.length ? `<dl class="kv">${v.parts.map(([k, t]) => `<dt>${k}</dt><dd>${t}</dd>`).join("")}</dl>` : "") +
        (v.cost ? `<div class="vcost"><span class="stamp">代价</span><span>${v.cost}</span></div>` : "") + `</div>` : "";
      return `<li class="vi${on ? " on" : ""}" data-v="${i}"><span class="badge${on ? " on" : ""}">${i}</span><b>${v.name}</b>${now}${detail}</li>`;
    }).join("");
  }
  /* 格头：全部界面并排时 = 界面名 + 一排档号（各切各的）；全档 / 对照时 = 档号 + 档名 */
  function lblHTML(t) {
    const rd = PAGES_[t.g].rounds[t.r];
    if (isPages()) return `<button class="tn" data-g="${t.g}">${PAGES_[t.g].name}</button><span class="chips">${rd.list.map((x, j) => `<button class="chip${j === t.i ? " on" : ""}" data-g="${t.g}" data-ci="${j}" title="${esc(x.name)}">${j}</button>`).join("")}</span>`;
    return `<span class="badge">${t.i}</span><span>${rd.list[t.i].name}</span>${t.r === 0 && t.i === 0 ? `<span class="tag">现状</span>` : ""}`;
  }
  /* 界面清单：行尾是这个界面此刻选的「R轮 · 档」（不是个数）；有没发的标注再挂一颗数 */
  function paintPages() {
    $("pl").innerHTML = multi() ? PAGES_.map((p, g) => {
      const n = notes.filter((x) => x.state === "open" && at3(x.k)[0] === g).length;
      return `<li class="pi${g === pg ? " on" : ""}${p.parent ? " sub" : ""}" data-g="${g}"><b>${p.name}</b>${fresh[g] ? nw : ""}<span class="pk">${n ? `<span class="nn" title="${n} 条标注没发">${n}</span>` : ""}<span class="tag" title="这个界面选的档">R${rnd(g) + 1} · ${selI(g)}</span></span></li>`;
    }).join("") : "";
  }
  function syncChrome() {
    stage.querySelectorAll(".tile").forEach((t) => t.classList.toggle("sel", t.dataset.vk === selK()));
    press("#specs button", (b) => Number(b.dataset.s) === spc());
    press("#views button", (b) => b.dataset.w === view);
    press("#modes button", (b) => !!flags[b.dataset.flag]);
    press("#noteT", () => noting);
    press("#dockT", () => !document.body.classList.contains("dock-off"));
    press("#pins button", (b) => b.dataset.pin === pinned);
    $("themeT").textContent = THEME[themePref];
    $("themeT").title = `明暗（T）：系统 → 亮 → 暗${themePref === "auto" ? `｜系统 = 浏览器现在报的：${darkMQ.matches ? "暗" : "亮"}` : ""}`;
    document.body.dataset.mode = modeStr();
    document.body.dataset.view = view;
    requestAnimationFrame(() => document.querySelectorAll(".seg").forEach(segSync));   // 钉住组宽度在过渡，下一帧再量
    renderNav();
    paintOut();
    applyZoom();
  }

  /* 弹层：一次只开一个；点外面 / Esc 收起；左栏的从按钮左边往下长，顶条的从按钮右边往下长 */
  let openPop = null;
  function togglePop(id, btn) {
    const was = openPop;
    closePop();
    if (was === id) return;
    const el = $(id), r = btn.getBoundingClientRect();
    if (el.classList.contains("left")) Object.assign(el.style, { left: r.left + "px", right: "auto" });
    else Object.assign(el.style, { right: innerWidth - r.right + "px", left: "auto" });
    el.style.top = r.bottom + 8 + "px";
    el.classList.add("open"); btn.classList.add("open"); openPop = id;
    if (id === "histPop") renderFig();
  }
  function closePop() {
    if (!openPop) return;
    $(openPop).classList.remove("open");
    document.querySelectorAll("[data-pop].open").forEach((b) => b.classList.remove("open"));
    openPop = null;
  }

  function paint() {
    stage.innerHTML = tiles().map((t, n) => `<div class="tile" data-vk="${vk(t.g, t.r, t.i)}" style="--d:${n * 30}ms"><div class="lbl lab-ui">${lblHTML(t)}</div>
      <div class="host" data-vk="${vk(t.g, t.r, t.i)}" data-sp="${t.s}"></div><div class="ext lab-ui" hidden></div></div>`).join("");
    for (const h of hosts()) {
      const k = h.dataset.vk, v = varOf(k);
      const root = h.attachShadow({ mode: "open" }), spec = specOfRoot(root), used = (h.used = new Set());
      const me = { g: at3(k)[0], html: undefined }, pgOf = PAGES_[me.g];
      const ctx = ctxFor(spec, sOf(root), used, [me.g], me), own = (me.html = v.render(spec, ctx));
      const frame = pgOf.frame ?? (pgOf.parent ? (_s, _o, c) => c.use(pgOf.parent) : null);   // 子组件：整格是父界面选中那档，自己这一档嵌在原位
      const html = frame ? frame(spec, own, ctx) : own;
      const css = [...new Set([k, ...used].flatMap((x) => { const [g, r] = at3(x); return [PAGES_[g].css ?? "", PAGES_[g].rounds[r].css ?? "", varOf(x).css ?? ""]; }))].join("");
      root.innerHTML = `<style>${CHROME_CSS}${SHARED_CSS}${css}</style><div class="root">${html}</div><div class="lab-hud"><span class="pn"></span><span class="sz"></span></div><div class="lab-drop"></div><div class="lab-pins"></div>`;
      tagIds(root.querySelector(".root"));
      h.dataset.mode = modeStr();
      h.toggleAttribute("data-note", noting);
      wire(root, k);
      follow(root);
      extRail(root, h);
    }
    for (const k of new Set(hosts().map((h) => h.dataset.vk))) applyLayout(k);
    /* use() 拿来的块：那一档拼装过的也照样摆（只认具名零件——按路径记的换了外框就对不上） */
    for (const h of hosts()) {
      const face = h.shadowRoot.querySelector(".root"), named = (id) => !id.startsWith("@");
      for (const u of h.used) {
        const L = Lof(u);
        for (const o of L.ops) if (named(o.id) && named(o.ref)) applyOp(face, o);
        for (const [id, q] of Object.entries(L.sz)) { const el = named(id) && elOf(face, id); if (el) sizeEl(el, q.w, q.h); }
      }
    }
    applyParams();
    if (isStatic() && pinned !== "rest") requestAnimationFrame(() => hosts().forEach((h) => roundOfK(h.dataset.vk).pin?.(h.shadowRoot, pinned, specOfRoot(h.shadowRoot))));
    renderKnobs(); syncChrome();
    dwell();
  }
  /* 关联界面（2026-11-25 甲方要）：同一屏拆成几个界面分开比（顶栏 / 正文 / 底栏）时，档的 render 只画自己那一块，
     界面的 frame(spec, 本块, { use }) 把整屏拼起来，别的块用 use("顶栏") 取——取的是「顶栏」此刻选中的那一档，换档处处跟着换；
     它的样式自动带进这一格。样本按 from 对上，对不上按序号；取自己或绕回来的给空串 */
  function ctxFor(spec, si, used, stack, me) {
    return { use(name) {
      const g = PAGES_.findIndex((p) => p.name === name);
      if (g < 0) throw new Error(`use("${name}")：没有这个界面（PAGES 里有：${PAGES_.map((p) => p.name).join("、")}）`);
      if (g === me.g && me.html !== undefined) return me.html;   // 绕回这一格自己的界面：放这一格正在比的那一档（父界面里那个位置就是它）
      if (stack.includes(g)) return "";
      const r = rnd(g), i = selI(g), sp = PAGES_[g].specs, s2 = sp.find((x) => x.from === spec.from) ?? sp[Math.min(si, sp.length - 1)];
      used.add(vk(g, r, i));
      return PAGES_[g].rounds[r].list[i].render(s2, ctxFor(s2, sp.indexOf(s2), used, [...stack, g], me));
    } };
  }
  /* 外部触发（2026-11-04 甲方要）：样本里标了 data-ext 的元素（碰一张标签、来网断网这类手机外面发生的事）不画在屏里，
     挂在格子右边外侧当一排触发键，名字 = data-ext 的值（空就用元素的字），图标照搬；点它 = 点那个元素（照常进 on 与记录）。样本重画了跟着换 */
  function extRail(root, h) {
    const rail = h.parentElement.querySelector(".ext");
    let queued = false;
    const sync = () => {
      queued = false;
      const els = [...root.querySelectorAll(".root [data-ext]")].filter((el) => !el.closest("[inert]"));   // 正在退场的旧帧（inert）里的不算
      rail.replaceChildren(...els.map((el) => {
        const b = document.createElement("button");
        b.className = "xb";
        b.innerHTML = el.querySelector("svg")?.outerHTML ?? "";
        b.append(el.dataset.ext || el.textContent.trim());
        b.onclick = () => el.click();
        return b;
      }));
      const had = !rail.hidden;
      rail.hidden = !els.length;
      if (had !== !rail.hidden) applyZoom();
    };
    new MutationObserver(() => { if (!queued) { queued = true; requestAnimationFrame(sync); } }).observe(root.querySelector(".root"), { childList: true, subtree: true });
    sync();
  }
  /* 换界面 / 样本 / 轮次 / 钉住 / 选档：直接换，不淡出不入场（甲方 2026-10-10：切换要干脆，别黑一下）；intro = 首屏与 P 重播才逐格入场 */
  /* 回到初始（X，2026-11-04 甲方要）：样本的交互状态在页面自己手里——页面给了 labStart({ reset }) 就调它清掉再重画；
     没给就整页重载（模块里的状态随之清空；选档、标注、滑块在 localStorage，记录在 sessionStorage，都留着） */
  function resetState() {
    if (typeof cfg.reset !== "function") return location.reload();
    cfg.reset();
    render();
  }
  function render(intro = false) {
    stage.classList.toggle("intro", intro);
    paint();
  }
  /* 选档：全档时只换焦点（格不重画，滑块、形状图跟过去）；其余直接换 */
  function setV(i) {
    save(`v${pg}.${rnd()}`, i);
    if (view !== "all") return render();
    renderKnobs(); syncChrome();
    if (openPop === "histPop") renderFig();
  }
  /* 全部界面并排时点格头的档号：那个界面换成那一档，焦点也挪过去 */
  function setSel(g, i) { pg = g; save("g", g); save(`v${g}.${rnd(g)}`, i); renderChrome(); render(); }
  /* 换界面：全部界面并排时每个界面都在台上，只换焦点 */
  function setPg(g) { pg = g; save("g", g); renderChrome(); if (isPages()) { renderKnobs(); syncChrome(); } else render(); }
  const setSpec = (s) => { save("s" + pg, s); render(); };
  const setView = (w) => { view = w; save("w", w); render(); };
  const setRound = (r) => { save("r" + pg, r); renderChrome(); render(); };
  function setFlags(live, build) {
    const repaint = isStatic() && pinned !== "rest";
    flags.live = live; flags.build = build; save("f", flags);
    if (!isStatic()) pinned = "rest";
    hosts().forEach((h) => { h.dataset.mode = modeStr(); if (!live) closeMenu(h.shadowRoot); if (!build) showHud(h.shadowRoot, null); });
    if (repaint) render(); else syncChrome();
  }
  /* M：只交互（默认）→ 两开 → 只拼装 → 静态 → 只交互 */
  const CYCLE = [[true, false], [true, true], [false, true], [false, false]];
  /* 明暗：默认「系统」跟随系统（系统切换时跟着变），手选亮 / 暗后记住 */
  const darkMQ = matchMedia("(prefers-color-scheme: dark)");
  let themePref = load("t", "auto");
  const applyTheme = () => { document.documentElement.dataset.theme = themePref === "auto" ? (darkMQ.matches ? "dark" : "light") : themePref; };
  darkMQ.addEventListener("change", () => { if (themePref === "auto") { applyTheme(); syncChrome(); } });
  function setTheme(t) { themePref = t; save("t", t); applyTheme(); syncChrome(); }
  const nextTheme = () => setTheme({ auto: "light", light: "dark", dark: "auto" }[themePref]);   // 系统 → 亮 → 暗 → 系统
  function toggleDock() { closePop(); document.body.classList.toggle("dock-off"); save("do", document.body.classList.contains("dock-off")); syncChrome(); }
  board.addEventListener("transitionend", (e) => { if (e.target === board && e.propertyName.startsWith("padding")) { applyZoom(); placePins(); } });

  /* ---- 输入 ---- */
  /* 写着标注时按到别处：先把它存了收起（这一下不再落新点） */
  document.addEventListener("pointerdown", (e) => {
    const path = e.composedPath();
    noteSkip = !!editing && !path.includes(cmp) && !path.some((n) => n.classList?.contains("lab-pin"));
    if (noteSkip) closeComposer(true);
  }, true);
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-ci],[data-g],[data-note],[data-v],[data-w],[data-s],[data-r],[data-flag],[data-pin],[data-pop],#noteT,#dockT,#zoomT,#themeT,#fab,#cmpDel,#resetP,#resetL,#copyJ,#resetI,.tile");
    if (openPop && !e.target.closest(".pop") && !t?.dataset.pop) closePop();
    if (!t) return;
    if (t.dataset.pop) return togglePop(t.dataset.pop, t);
    if (t.dataset.ci) return setSel(Number(t.dataset.g), Number(t.dataset.ci));
    if (t.dataset.g) return Number(t.dataset.g) === pg ? undefined : setPg(Number(t.dataset.g));
    if (t.dataset.note) return openNote(t.dataset.note);
    if (t.classList.contains("tile")) {   // 点到哪格就选哪格，交互照常
      const [g, r, i] = at3(t.dataset.vk);
      if (g !== pg) return setPg(g);
      if (r === rnd() && i !== selI()) setV(i);
      return;
    }
    if (t.dataset.v) return Number(t.dataset.v) === selI() ? undefined : setV(Number(t.dataset.v));   // 点展开那档自己不重画
    if (t.dataset.w) return setView(t.dataset.w);
    if (t.dataset.s) return Number(t.dataset.s) === spc() ? undefined : setSpec(Number(t.dataset.s));
    if (t.dataset.r) { closePop(); return setRound(Number(t.dataset.r)); }
    if (t.dataset.flag) return t.dataset.flag === "live" ? setFlags(!flags.live, flags.build) : setFlags(flags.live, !flags.build);
    if (t.id === "noteT") return setNoting(!noting);
    if (t.id === "dockT") return toggleDock();
    if (t.id === "zoomT") { fit = !fit; save("z", fit); return applyZoom(); }
    if (t.id === "themeT") return nextTheme();
    if (t.id === "resetI") return resetState();
    if (t.id === "fab") return sendAll();
    if (t.id === "cmpDel") return dropNote(editing);
    if (t.dataset.pin) { pinned = t.dataset.pin; return render(); }
    if (t.id === "resetP") {
      txn([sk(), ...R().list.map((_, i) => "pv" + vk(pg, rnd(), i))], "参数全部回默认", () => { save(sk(), {}); R().list.forEach((_, i) => save("pv" + vk(pg, rnd(), i), {})); });
      applyParams(); return renderKnobs();
    }
    if (t.id === "resetL") {
      const ks = [...new Set(hosts().map((h) => h.dataset.vk))].filter((k) => Lsize(Lof(k)));
      if (!ks.length) return;
      txn(ks.map((k) => "L" + k), "零件全部归位", () => ks.forEach((k) => save("L" + k, null)));
      return flip(() => render());
    }
    if (t.id === "copyJ") return copyJSON(t);
  });
  cmpT.addEventListener("paste", (e) => {
    const fs = imgFiles(e.clipboardData);
    if (fs.length) { e.preventDefault(); return addImgs(fs, editing); }
    const urls = linksIn(e.clipboardData.getData("text/plain"));   // 链接照常贴进文字，同时去取图
    if (urls.length) addLinks(urls, editing);
  });
  cmp.addEventListener("dragover", (e) => { if ([...e.dataTransfer.items].some((i) => i.type.startsWith("image/") || i.type === "text/uri-list" || i.type === "text/plain")) { e.preventDefault(); cmp.classList.add("drop"); } });
  cmp.addEventListener("dragleave", (e) => { if (!cmp.contains(e.relatedTarget)) cmp.classList.remove("drop"); });
  cmp.addEventListener("drop", (e) => {
    cmp.classList.remove("drop");
    const fs = imgFiles(e.dataTransfer), urls = fs.length ? [] : linksIn(e.dataTransfer.getData("text/uri-list") || e.dataTransfer.getData("text/plain"));
    if (!fs.length && !urls.length) return;
    e.preventDefault(); cmpErr("");
    if (fs.length) addImgs(fs, editing); else addLinks(urls, editing);
  });
  $("cmpI").addEventListener("click", (e) => { const b = e.target.closest("[data-ix]"); if (!b) return; cmpImgs.splice(Number(b.dataset.ix), 1); paintImgs(); cmpT.focus(); });
  /* 图拖到小框外面松手：浏览器默认会跳去打开那张图、整页没了——拦下 */
  addEventListener("dragover", (e) => e.preventDefault());
  addEventListener("drop", (e) => e.preventDefault());
  cmpT.addEventListener("keydown", (e) => {
    if (e.isComposing || e.keyCode === 229) return;
    if (e.key === "Enter" && !e.shiftKey && !e.metaKey && !e.ctrlKey) { e.preventDefault(); closeComposer(true); }
    if (e.key === "Escape") { e.preventDefault(); closeComposer(false); }
  });
  const dock = $("dock");
  const knobLabel = (el) => specOf(el).label;
  const knobD = (el) => { const p = specOf(el); return { type: "param", store: storeOf(el.dataset.src), key: p.key, def: p.def, scope: el.querySelector(".kh > .badge")?.outerHTML ?? "" }; };
  dock.addEventListener("pointerdown", (e) => {
    const tr = e.target.closest(".track");
    if (!tr || e.button !== 0) return;
    const el = tr.closest(".knob"), p = specOf(el);
    tr.setPointerCapture(e.pointerId); tr.classList.add("live"); shield(true);
    begin([storeOf(el.dataset.src)], knobLabel(el), knobD(el));
    setParam(el, trackAt(tr, p, e.clientX));
    let done = false;
    const move = (ev) => { if (ev.buttons === 0) return up(); setParam(el, trackAt(tr, p, ev.clientX)); };
    const up = () => {
      if (done) return; done = true; shield(false);
      commit(); tr.classList.remove("live");
      for (const [t, f] of [["pointermove", move], ["pointerup", up], ["pointercancel", up], ["lostpointercapture", up]]) tr.removeEventListener(t, f);
    };
    for (const [t, f] of [["pointermove", move], ["pointerup", up], ["pointercancel", up], ["lostpointercapture", up]]) tr.addEventListener(t, f);
  });
  dock.addEventListener("dblclick", (e) => { const el = e.target.closest(".knob"); if (el) txn([storeOf(el.dataset.src)], knobLabel(el), () => setParam(el, specOf(el).def), knobD(el)); });
  dock.addEventListener("keydown", (e) => {
    const tr = e.target.closest?.(".track");
    if (!tr) return;
    const el = tr.closest(".knob"), p = specOf(el), cur = valOf(p, el.dataset.src);
    const next = { ArrowLeft: cur - p.step, ArrowDown: cur - p.step, ArrowRight: cur + p.step, ArrowUp: cur + p.step, Home: p.min, End: p.max }[e.key];
    if (next === undefined) return;
    e.preventDefault(); e.stopPropagation();
    txn([storeOf(el.dataset.src)], knobLabel(el), () => setParam(el, next), knobD(el));
  });
  addEventListener("keydown", (e) => {
    const tgt = e.composedPath()[0], typing = !!tgt.matches?.("input, textarea, [contenteditable]");
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); return sendAll(); }
    /* ⌘Z / Ctrl+Z 撤回，⇧⌘Z / Ctrl+Y 重做；正在打字时让给原生撤回 */
    const zk = e.key.toLowerCase();
    if ((e.metaKey || e.ctrlKey) && !e.altKey && (zk === "z" || zk === "y") && !typing) { e.preventDefault(); return undo(zk === "y" || e.shiftKey); }
    if (e.metaKey || e.ctrlKey || e.altKey || typing) return;
    if (/^[0-9]$/.test(e.key) && Number(e.key) < R().list.length) return setV(Number(e.key));
    const k = e.key.toLowerCase(), n = R().list.length, np = PAGES_.length;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") return setV((selI() + (e.key === "ArrowRight" ? 1 : n - 1)) % n);
    if ((e.key === "ArrowUp" || e.key === "ArrowDown") && np > 1) { e.preventDefault(); return setPg((pg + (e.key === "ArrowDown" ? 1 : np - 1)) % np); }
    if (k === "s") return setSpec((spc() + (e.shiftKey ? PG().specs.length - 1 : 1)) % PG().specs.length);
    if (k === "r" && PG().rounds.length > 1) return setRound((rnd() + (e.shiftKey ? PG().rounds.length - 1 : 1)) % PG().rounds.length);
    if (k === "f") return setNoting(!noting);
    if (k === "c") return setView(view === "pair" ? "one" : "pair");
    if (k === "a") return setView(view === "all" ? "one" : "all");
    if (k === "g" && multi()) return setView(view === "pages" ? "one" : "pages");
    if (k === "m") { const i = CYCLE.findIndex(([a, b]) => a === flags.live && b === flags.build); return setFlags(...CYCLE[(i + 1) % CYCLE.length]); }
    if (k === "t") return nextTheme();
    if (k === "p") return render(true);
    if (k === "x") return resetState();
    if (k === "i") return toggleDock();
    if (e.key === "Escape") { if (openPop) return closePop(); hosts().forEach((h) => closeMenu(h.shadowRoot)); if (noting) setNoting(false); }
  });

  addEventListener("resize", () => { closePop(); applyZoom(); syncChrome(); placePins(); });
  document.body.classList.toggle("dock-off", load("do", false));
  applyTheme();
  /* 题目没填就大声报错，不画空台子 */
  const orphan = PAGES_.find((p) => p.parent && !PAGES_.some((q) => q.name === p.parent));
  if (orphan) throw new Error(`对照版：界面「${orphan.name}」的 parent「${orphan.parent}」不在 PAGES 里`);
  if (!PAGES_.length || PAGES_.some((p) => !p.specs?.length || !p.rounds?.length || p.rounds.some((r) => !r.tile || !r.list?.length))) {
    stage.innerHTML = `<div class="lab-empty lab-ui"><b>对照版还没填</b>：脚本第 ② 段的 PAGES 是空的（每个界面要有 specs ≥3 条样本与 rounds，每轮要有 tile 与 list）。写法见 dc 的 SKILL.md ④。</div>`;
    throw new Error("对照版：PAGES 未填（或某界面缺 specs / rounds，某轮缺 tile / list）");
  }
  /* 改了哪儿（2026-11-02 甲方要：每次更新要标出改了哪个界面）：每个界面每一轮一枚指纹（轮名 + 这轮的样式与 uses + 各档的名 / 论点 / 零件 / 代价 / 样式 / 档里的函数），
     跟用户看过的那一版比，按「界面 · 轮」一格一格记。界面的 css 是所有轮共用的，算进每一轮——只给一轮用的样式放那一轮的 css，不然改一轮会把整个界面的轮全标「新」（2026-11-06）；
     档里的函数只看得到自己的源码，调到的 helper 改了看不见，要算进这一轮就列进这轮的 uses。变了的界面在左栏挂「新」、变了的轮在轮次清单挂「新」（不另弹卡片：2026-11-25 甲方，左栏标出来就够）。
     看过 = 那一轮在台上、标签在前台停了 SEEN_MS（dwell）；点叉 = 全部看过。截图模式不记。
     ⛔ 别改回「离开那个界面才算看过」：agent 每改一次页面就刷新，用户一直停在同一个界面，看过的改动一轮轮叠回「新」里（2026-11-25） */
  const hashS = (t) => { let h = 5381; for (let i = 0; i < t.length; i++) h = ((h << 5) + h + t.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
  const fnSrc = (v) => Object.values(v).filter((f) => typeof f === "function").map(String).join("");
  const fpOf = (p) => p.rounds.map((r) => hashS(JSON.stringify([r.name, ...(r.css || r.uses ? [r.css ?? "", (r.uses ?? []).map(String).join("")] : []), r.list.map((v) => [v.name, v.thesis, v.parts, v.cost, v.css ?? "", fnSrc(v)])]) + (p.css ?? "")));
  const nowFp = PAGES_.map(fpOf), seenFp = load("fp", null), fresh = {};
  if (!seenFp) save("fp", Object.fromEntries(PAGES_.map((p, g) => [p.name, nowFp[g]])));
  else PAGES_.forEach((p, g) => { const old = seenFp[p.name] ?? []; const rs = nowFp[g].map((h, r) => (h !== old[r] ? r : -1)).filter((r) => r >= 0); if (rs.length) fresh[g] = new Set(rs); });
  function markSeen(g, rs) {
    if (!fresh[g]) return;
    const all = load("fp", {}) ?? {}, arr = [...(all[PAGES_[g].name] ?? [])];
    let hit = false;
    for (const r of rs) if (fresh[g].delete(r)) { arr[r] = nowFp[g][r]; hit = true; }
    if (!hit) return;
    if (!fresh[g].size) delete fresh[g];
    save("fp", { ...all, [PAGES_[g].name]: arr });
    renderNav(); paintOut();
  }
  let seenT = 0;
  function dwell() {
    clearTimeout(seenT);
    if (SHOT || document.hidden) return;
    seenT = setTimeout(() => { for (const t of tiles()) markSeen(t.g, [t.r]); }, SEEN_MS);
  }
  document.addEventListener("visibilitychange", dwell);
  const nw = `<span class="nw" title="上回看过之后改过">新</span>`;
  /* 发送键永远能点：没发过就照常发（用户看中的正是打开时那档，也要能交）；跟上次发的一模一样才不发、闪一句（2026-11-02 用户：点了发送没反应）*/
  const re = sessionStorage.getItem(KEY + "re");
  sessionStorage.removeItem(KEY + "re");
  renderChrome(); renderHist(); render(!re);
  if (re) { const [x, y] = JSON.parse(re); board.scrollTo(x, y); }
  document.fonts.ready.then(placePins);
  /* 对照版服务：agent 回话、文件改了就刷新。不挂长连：Chrome 同一个地址最多 6 条连接，开到第 6 页时长连占满池子，
     新页面加载不出、「发送」排在后面发不出去（2026-11-02 用户：点了发送没反应）。改成每 1.5 秒问一次（后台标签 5 秒），问完就走 */
  const pid = Math.random().toString(36).slice(2);
  let ver = null, sayAt = null;
  async function tick() {
    try {
      const m = await (await fetch(`/__lab/state?page=${encodeURIComponent(location.pathname)}&id=${pid}&vis=${document.hidden ? 0 : 1}`, { cache: "no-store" })).json();
      if (ver && m.ver !== ver) return reloadSoon();
      ver = m.ver;
      if (m.say && m.say.at !== sayAt) { sayAt = m.say.at; hear(m.say); }
      const ns = m.st ?? null;   // 旧服务不报 st：当 null，别每轮都当「变了」重画
      if (JSON.stringify(ns) !== JSON.stringify(st)) { st = ns; paintOut(); }
    } catch { /* 服务重启中：下一轮再问，连上了版本对不上就刷新 */ }
    setTimeout(tick, document.hidden ? 5000 : 1500);
  }
  tick();
}
})();
