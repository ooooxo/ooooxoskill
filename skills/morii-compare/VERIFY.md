# 对照版 · 验收配方（ego-browser）

交之前自己先看一遍：**每条样本 × 明暗全景 → 病灶放大 → 动效逐帧 → 交互与拼装 → 交互中途**。
模板的 localStorage 值一律 `JSON.stringify` 存（直接塞裸字符串，页面 `JSON.parse` 会抛错）；样本在 Shadow DOM 里，取元素走 `host.shadowRoot`。
下面每段都是一发独立的 `ego-browser nodejs <<'EOF' … EOF`（heredoc 体是 ESM，`import` 不用 `require`）。

## 1. 全景：每条样本 × 明暗（页面默认单看一档；验收全景先存 `w = "all"` 平铺全部，或按 `A`）

```js
await useOrCreateTaskSpace('lab-<topic>');
await openOrReuseTab('<地址>/docs/lab/<topic>.html');   // <地址> = lab.sh 打印的那行（SKILL ⑦）；没起服务就用 file:///绝对路径
await cdp('Emulation.setDeviceMetricsOverride', { width: 1560, height: 940, deviceScaleFactor: 1, mobile: false });
for (const theme of ['light', 'dark']) {
  await js("localStorage.clear(); localStorage.setItem('lab.<topic>.t', JSON.stringify('" + theme + "')); localStorage.setItem('lab.<topic>.w', JSON.stringify('all')); location.reload()");
  await new Promise(r => setTimeout(r, 1500));
  for (let s = 0; s < 3; s++) {
    if (s) await js("dispatchEvent(new KeyboardEvent('keydown', { key: 's' }))");
    await new Promise(r => setTimeout(r, 900));   // 首屏有逐格入场，后台标签更慢
    console.log(await captureScreenshot('/tmp/lab-s' + s + '-' + theme + '.png'));
  }
}
```

拍完用 Read 真的打开每一张看。逐格找：折行 · 一个控件独占一行 · 字截断 · 竖线 / 列错位 · 按钮读成字 · 空态塌陷。
顶条的「86% · 3 列 × 2 行」也看一眼：掉到「放不下，滚动看」就是面宽 / 面高默认值定大了。
换主题后立刻拍会拍到过渡中途的混色，等 700ms 以上再拍。
明暗默认跟随系统（存的是 `"auto"`）；验跟随用 `cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] })`。

## 2. 放大裁切（看 1px 的发丝、凹角、影）

```js
import { writeFileSync } from 'node:fs';
const s = await cdp('Page.captureScreenshot', { format: 'png', clip: { x, y, width, height, scale: 3 } });
writeFileSync('/tmp/lab-zoom.png', Buffer.from(s.data, 'base64'));
```

- `scale` 写在 **`clip` 里面**；写成兄弟参数会挂，之后整个截图管线都会超时。
- 不开 `captureBeyondViewport`（会把面的底色渲丢）。
- 元素位置用 `js()` 取 `getBoundingClientRect()`，**返回 `JSON.stringify(...)` 的字符串**再 `JSON.parse`，对象直接回来常是 `{}`。
- 样本里的元素：`document.querySelector('.host[data-vk="0.2"]').shadowRoot.querySelector('…')`（`vk` = 轮.档）。
- 台子：顶条 `#topbar`、滑条栏 `#dock`，各裁一张 `scale: 2` 看刻度、刻痕、色块。

## 3. 动效逐帧（Morii 的验法：接管 rAF 与时钟，手动步进）

```js
await js(String.raw`(() => {
  window.__q = []; window.__t = 1000;
  window.requestAnimationFrame = (cb) => { window.__q.push(cb); return window.__q.length; };
  performance.now = () => window.__t;
  window.__step = (n) => { for (let i = 0; i < n; i++) { window.__t += 16.7; const q = window.__q; window.__q = []; q.forEach((cb) => cb(window.__t)); } };
  dispatchEvent(new KeyboardEvent('keydown', { key: 'p' }));
})()`);
let done = 0;
for (const f of [3, 6, 9, 13, 40]) {
  await js('window.__step(' + (f - done) + ')'); done = f;
  const s = await cdp('Page.captureScreenshot', { format: 'png', clip: { x, y, width, height, scale: 2 } });
  writeFileSync('/tmp/lab-f' + f + '.png', Buffer.from(s.data, 'base64'));
}
```

后台标签的 rAF 被节流到约 1fps，**实时录的动画不作数**，只认步进出来的帧。
`String.raw` 里照样会做 `${}` 插值、也不能再嵌反引号 —— 页面侧拼串一律用 `+`。
中间帧要成立：形没有尖刺、内容不露出液体外、过冲不穿墙。

## 3½. 交互与拼装（默认只开交互）

CDP 拖动时 `mouseMoved` 必须带 `button: 'left', buttons: 1`，否则页面收不到拖动。

```js
const R = (q) => js(String.raw`(() => { const r = document.querySelector('.host[data-vk="0.2"]').shadowRoot.querySelector('${q}').getBoundingClientRect(); return JSON.stringify({ x: r.x + r.width / 2, y: r.y + r.height / 2 }); })()`).then(JSON.parse);
const b = await R('[data-act]');
// 轻点：应该点到按钮（滑条栏「记录」+1），格子被选中
await cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: b.x, y: b.y, button: 'left', clickCount: 1 });
await cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: b.x, y: b.y, button: 'left', clickCount: 1 });
// 按住拖：零件跟走、不再记一次点击；松手吸格，刷新后位置还在
await cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: b.x, y: b.y, button: 'left', clickCount: 1 });
for (let i = 1; i <= 8; i++) await cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: b.x + i * 15, y: b.y + i * 12, button: 'left', buttons: 1 });
await cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: b.x + 120, y: b.y + 96, button: 'left', clickCount: 1 });
console.log(await js("localStorage.getItem('lab.<topic>.L0.2')"));
```

撤回：发真键 `cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'z', code: 'KeyZ', modifiers: 4, windowsVirtualKeyCode: 90 })`（4 = ⌘，8 = ⇧），
每撤一步核一次存储（`ps<轮>` / `L<轮>.<档>`）和刻度轨游标上的数；两次改动之间隔开 500ms 以上，不然会并成一步。
记录：点一下样本 + 拉一条刻度轨 + 挪一个零件 → 顶条「记录」弹层里三条按时间混排（字形 · 章 · 改前 → 改后 / 坐标 · 等宽时刻）；
⌘Z 一下最后那条变灰，再做一次新改动灰条消失。滑条栏：选中有私有参数的档（数字键），它那几条出现在共用的后面；换到没有的档就消失。
拼装（默认关，先按 `M` 开到两开）：拖一颗按钮、一枚标签、一段字，各自单独挪（`L<轮>.<档>` 里各一条，没命名的 id 是 `@样本:路径`）；按住 ⌥ 拖，抓的是最近的具名组；
改大小：悬停零件让罩右下角拉手露出来（`.lab-hud > .sz`），按住拉手拖，那条多出 `w / h`；再挪它，`w / h` 还在；⌘Z 回到原尺寸。
再验两条：打开 ⋯ 菜单后拉滑条栏刻度轨，菜单还开着（参数只改变量不重画）；按三下 `M` 到静态，顶条长出「钉住」，钉「菜单开」每档都摆出来。

## 3¾. 标注 → 发给 agent → 回话 → 自动刷新（服务模式）

整条链路一次验完，验的就是用户每天走的那条路：

```bash
curl -s <地址>/__lab/wait   # run_in_background：页面发了才退出
```

```js
// 页面里：F 进标注 → 点一个组件 → 写一句 → ⏎ → 右下角发送
const at = JSON.parse(await js(String.raw`(() => { const root = document.querySelector('.host').shadowRoot;
  const el = root.querySelector('[data-act]'); const r = el.getBoundingClientRect();
  return JSON.stringify({ x: r.x + r.width / 2, y: r.y + r.height / 2 }); })()`));
await js("dispatchEvent(new KeyboardEvent('keydown', { key: 'f' }))");
await cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: at.x, y: at.y });
await cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: at.x, y: at.y, button: 'left', clickCount: 1 });
await cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: at.x, y: at.y, button: 'left', clickCount: 1 });
await cdp('Input.insertText', { text: '这里要改：测试' });
await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
console.log(await js("localStorage.getItem('lab.<topic>.n')"));   // 一条 state: open
await js("document.getElementById('fab').click()");
```

- wait 那条后台任务应当立刻带着 JSON 退出：`标注[0].要改` 是刚写的那句，`组件 / 路径 / 原文` 指得到那个元素，`选档` 列着每个界面当前的档。
- 页面上那枚点变灰（`state: sent`）。
- 改一下页面文件 → 页面自己刷新（`performance.getEntriesByType('navigation')[0].type === 'reload'`），选中档、页面、标注都还在。
- `curl --data-binary '测试回话' …/__lab/say` → 右下角冒出这句（带 × 收起）；灰点消失；「记录」多一条回话。
  **先改文件、紧接着 say** 也要能看到回话（刷新落在 say 之后，新页面照样显示）。
- 正写着标注时改文件：不刷新，存了 / Esc 后才刷。
- 多个界面：`G` 并排，点第二格头上的档号，只有那一格换档，左栏界面清单行尾的数跟着变。
- 标注时点到透明遮罩（单据层的 scrim 之类）不算：认的是样本自己的命中，不是台子强开的。
- 点跟着组件动：在抽屉 / 单据里打一个点，关掉它——过渡跑到一半时点的位移等于组件的位移（ego 窗口在后台时 rAF 掉到约 1 帧 / 秒，别逐帧采样，
  用 `shadowRoot.getAnimations()` 把过渡 `pause()` 在一半、`currentTime` 定住再比），收起后点藏起来或滑出格子被剪掉，再打开点回原位。



```js
await cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
await new Promise(r => setTimeout(r, 60));   // 中途
// 拍一张
await new Promise(r => setTimeout(r, 600));  // 停稳
// 再拍一张
```

## 5. 拼成一张对照条

```bash
python3 - <<'PY'
from PIL import Image
ps = ["/tmp/a.png", "/tmp/b.png", "/tmp/c.png"]
ims = [Image.open(p) for p in ps]
W = max(i.size[0] for i in ims); H = sum(i.size[1] + 12 for i in ims)
out = Image.new("RGB", (W, H), (230, 230, 230)); y = 0
for im in ims: out.paste(im, (0, y)); y += im.size[1] + 12
out.save("/tmp/strip.png")
PY
```

## 6. 收尾（一轮一关，见 SKILL ⑨）

**ego 的浏览器档案可能就是用户自己的浏览器**：验完把这一题的 localStorage 清掉（只删 `lab.<topic>.` 开头的键：`Object.keys(localStorage).filter((k) => k.startsWith('lab.<topic>.')).forEach((k) => localStorage.removeItem(k))`），否则用户打开看到的是你的测试状态（明暗、选档、标注）。
换明暗后要拍图，等过渡跑完再拍（`waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running' || a.effect.getTiming().iterations === Infinity))`），别拍到半截混色。

最后单独一发：`await completeTaskSpace(id, { keep: false })`，不留浏览器挂着。然后 `/usr/bin/open` 给用户。

## 7. ego 证明不了的

ego 是 Chromium。`filter` / `mask` / `clip-path: path()` / `backdrop-filter` / svg 滤镜在 WebKit（Tauri 的 macOS 桌面版）
上可能不画或很慢。交付时写「WebKit 未验」；要验就用 Playwright 的 WebKit（装在仓库外：`bun add playwright` +
`bunx playwright install webkit`），量 rAF 帧距看卡不卡。
