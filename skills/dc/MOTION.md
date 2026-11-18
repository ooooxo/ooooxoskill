# 动态稿 —— 一段交互动效怎么画、怎么验（`/__lab/motion.js`）

用户说「出个动态稿 / 做个动效给我看 / 这个怎么过渡」时交这个：**一页能播、能倒放、能逐帧拖的场景**，不是 GIF，不是文字描述。
只要一种动法 → 单独一页（下面 ①）；要比几种动法 → dc 对照页，每档 `render` 返回一个 `<lab-motion>`（下面 ②），所有格共用一条时间轴、同一瞬间并排判。

范例：KeroProperty `desktop/docs/lab/rail-outside.html`（右栏窗外 ↔ 全屏朝里，2026-11-17 用户认可「这么舒服」）。

## 舒服从哪来（每一条都是台子替你做了，或你必须遵守的）

1. **一条时间轴来回播**。整段动效是 `lin ∈ [0,1]` 的函数：画面只由 `lin` 决定（`frame(f)` 里不存进度）。
   正着放是进，**倒着放就是原路退**——「有来有回」不用另写退场；中途按一下就地掉头，不跳帧。
   `lin` 匀速走，曲线全在拍里（下一条）。
2. **分拍**。每样东西归一拍：`f.beat(a, b, { ease })` 是时间轴 `[a, b]` 段的进度。拍可以重叠（窗在长的同时贴在缩）。
   **每拍要看得见**：别让一拍挤进另一拍曲线的尾巴里（踩过：推开内容跟着放大的 ease-in-out 走，实际只剩 70ms，看不见）——给它自己的一段、自己的曲线。
3. **同一拍里的一组从前往后错开**：`f.beat(a, b, { i, n, stagger: 0.05 })`。错开 0.04–0.08 读成「一枚接一枚」，再大读成拖沓。
4. **曲线只用项目 token**：`io`（`--ease-in-out`，屏内 A→B / 窗变形）· `out`（`--ease-out`，出现 / 消失）· `soft`（`--ease-soft`，要看见过程的进场）。不自己拼分段曲线。
5. **一程 600–1000ms**（三拍的整段）；单拍的东西别超过它。慢放 ×4 用来判中间帧，不是用来定时长。
6. **场景用真尺寸、真零件**：`scene: { w, h }` 写设计像素（整屏就 1440×900），台子等比缩进容器。样本照项目真组件抄（类名、token、图标从注册表抽），数据造但形状真。
7. **与时间轴无关的小状态走 `f.dt`**（悬停伸长、点了换选中）：每帧 `v += (want - v) * min(1, dt / 70)`，别塞进时间轴。
8. **能点的真能点**：拖边改尺寸、点一枚换选中……指针坐标除以 `f.scale` / `host.scale` 换回设计像素。
9. **辅助层不常驻**：窗口真边、命中区、锚点这类解释性的东西写成 guide（`guides: { b: "窗口边" }`），按键开关；页面 css 写 `[data-guides~="b"] .xxx { opacity: 1 }`。

## 播放条与键（台子自带，页底正中）

两头切换（按钮字 = 按下去会去的那一头，`ends` 给名字）· 慢放 ×4 · 循环（两头各停 0.7s 来回放，dc 并排看时开）· 辅助层 · 逐帧滑杆 · 当前毫秒。
键：`空格` 切换 · `L` 慢放 · `O` 循环 · `[` `]` 逐帧 · `Esc` 回起点 · guides 的键。避开了 dc 台子占的键（数字、方向、S R F M C A G T I P X ?）；起 guide 键也别撞这些。

## ① 单独一页

```html
<link rel="stylesheet" href="../../src/styles/tokens.css">
<script src="/__lab/motion.js"></script>
<style>
  html, body { margin: 0; height: 100%; background: var(--gate-ground); overflow: hidden; }
  lab-motion { height: calc(100vh - 64px); }   /* 底下留给播放条 */
  /* 场景样式照常写在这里 */
</style>
<lab-motion name="topic"></lab-motion>
<script>
labMotion.define("topic", {
  scene: { w: 1440, h: 900 },
  dur: 900,
  ends: ["窗口", "全屏"],            // [起点名, 终点名]
  guides: { b: "窗口边" },           // 可不写
  html: (opt) => `<div data-r="box"></div>`,   // 场景 DOM；同一页可能有几份，用 data-r / class 取，不用 id
  setup({ root, host, opt, q, qa }) {   // 只跑一次：建 DOM、挂事件；返回每帧函数
    const box = q('[data-r="box"]');
    return (f) => {                    // f: lin dt now dir beat ease lerp clamp guide(k) scale
      const grow = f.beat(0, 0.6);                       // 第一拍
      const push = f.beat(0.55, 1, { ease: "out" });     // 第二拍，和第一拍叠一点
      box.style.width = f.lerp(400, 1440, grow) + "px";
    };
  },
});
</script>
```

经对照版服务打开（`lab.sh <项目根>` → `<地址>/docs/lab/<topic>.html`），改文件页面自己刷新；交给用户看时 `/usr/bin/open <地址>/…`。

## ② 放进 dc 比几种动法

第 ② 段先 `labMotion.define(…)`（同上），档的 `render` 返回元素、用 `opt` 区分档：

```js
render: () => '<lab-motion name="topic" opt=\'{"stagger":0.08}\'></lab-motion>'
```

- `setup` / `html` 从 `opt` 读这一档的不同处；轮次 `css` 里给尺寸：`lab-motion { width: 100%; height: 100%; }`，场景样式也写进 `css`（在影子里，页头的表进不去）。
- 所有格共用一条时间轴：`A` 全档时按空格一起放、拖滑杆一起定格。
- 时长不同的档：时间轴按最长那档走，短的那档在前面放完停住——要比快慢就把慢的写进 `opt`，别靠 `dur`。

## 验收（照 VERIFY.md 的规矩，另加两条）

- **定格拍**：地址带 `?mt=0.3` 定在那一刻（`&mg=b` 开辅助层；dc 里配 `?shot`）；或页面里 `labMotion.set(v)`。
  至少拍 `0 · 每拍中间 · 两拍交接处 · 1`，**中间帧要成立**：形没有尖刺、该融的融了、东西没探出屏幕、内容没被盖住。
- **倒放验一遍**：`labMotion.set(1)` 后 `labMotion.toggle()`，看退场是不是原路。
- 交付回复里写：几拍、各拍干什么、一程多长、用了哪些键。
