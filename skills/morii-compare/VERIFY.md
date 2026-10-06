# 对照版 · 验收配方（ego-browser）

交之前自己先看一遍：**每档 × 明暗全景 → 病灶放大 → 动效逐帧 → 交互中途**。
下面每段都是一发独立的 `ego-browser nodejs <<'EOF' … EOF`（heredoc 体是 ESM，`import` 不用 `require`）。

## 1. 全景：每档 × 明暗

```js
await useOrCreateTaskSpace('lab-<topic>');
await openOrReuseTab('file:///绝对路径/docs/lab/<topic>.html');
await cdp('Emulation.setDeviceMetricsOverride', { width: 1560, height: 940, deviceScaleFactor: 1, mobile: false });
for (const theme of ['light', 'dark']) {
  await js("localStorage.setItem('lab.<topic>.t','" + theme + "'); location.reload()");
  await new Promise(r => setTimeout(r, 1200));
  for (let v = 0; v <= 6; v++) {
    await js("dispatchEvent(new KeyboardEvent('keydown', { key: '" + v + "' }))");
    await new Promise(r => setTimeout(r, 300));
    console.log(await captureScreenshot('/tmp/lab-v' + v + '-' + theme + '.png'));
  }
}
```

拍完用 Read 真的打开每一张看。逐档找：折行 · 一个控件独占一行 · 字截断 · 竖线 / 列错位 · 按钮读成字 · 空态塌陷。

## 2. 放大裁切（看 1px 的发丝、凹角、影）

```js
import { writeFileSync } from 'node:fs';
const s = await cdp('Page.captureScreenshot', { format: 'png', clip: { x, y, width, height, scale: 3 } });
writeFileSync('/tmp/lab-zoom.png', Buffer.from(s.data, 'base64'));
```

- `scale` 写在 **`clip` 里面**；写成兄弟参数会挂，之后整个截图管线都会超时。
- 不开 `captureBeyondViewport`（会把面的底色渲丢）。
- 元素位置用 `js()` 取 `getBoundingClientRect()`，**返回 `JSON.stringify(...)` 的字符串**再 `JSON.parse`，对象直接回来常是 `{}`。

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

## 4. 交互中途（hover 推开、高亮流动）

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

## 6. 收尾

最后单独一发：`await completeTaskSpace(id, { keep: false })`，不留浏览器挂着。然后 `/usr/bin/open` 给用户。

## 7. ego 证明不了的

ego 是 Chromium。`filter` / `mask` / `clip-path: path()` / `backdrop-filter` / svg 滤镜在 WebKit（Tauri 的 macOS 桌面版）
上可能不画或很慢。交付时写「WebKit 未验」；要验就用 Playwright 的 WebKit（装在仓库外：`bun add playwright` +
`bunx playwright install webkit`），量 rAF 帧距看卡不卡。
